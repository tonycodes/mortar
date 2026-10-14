import copy
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import playground_receiver as receiver

SHA = "a" * 40


def artifact_bytes(members):
    tar = io.BytesIO()
    with tarfile.open(fileobj=tar, mode="w:gz") as archive:
        for name, content, kind in members:
            info = tarfile.TarInfo(name)
            info.type = kind
            if kind == tarfile.SYMTYPE:
                info.linkname = "/tmp/escape"
            if kind == tarfile.REGTYPE:
                info.size = len(content)
            archive.addfile(info, io.BytesIO(content))
    zip_data = io.BytesIO()
    with zipfile.ZipFile(zip_data, "w") as archive:
        archive.writestr("release.tar.gz", tar.getvalue())
    data = zip_data.getvalue()
    return data, "sha256:" + hashlib.sha256(data).hexdigest()


class ReceiverTests(unittest.TestCase):
    def setUp(self):
        self.run = dict(id=12, event="push", head_branch="main", head_sha=SHA,
                        status="completed", conclusion="success", path=".github/workflows/check.yml",
                        head_repository={"full_name": receiver.REPO})
        self.artifact = dict(id=34, expired=False, name="mortar-playground-production-" + SHA,
                             workflow_run={"id": 12, "head_sha": SHA}, digest="sha256:" + "b" * 64)

    def test_only_successful_main_runs_and_bound_artifacts(self):
        receiver.verify_run(self.run, self.artifact, SHA, 34)
        for key, value in [("event", "pull_request"), ("head_branch", "feature"),
                           ("head_sha", "c" * 40), ("conclusion", "failure"),
                           ("status", "in_progress"), ("path", ".github/workflows/other.yml"),
                           ("head_repository", {"full_name": "attacker/mortar"})]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                receiver.verify_run({**self.run, key: value}, self.artifact, SHA, 34)
        for key, value in [("expired", True), ("id", 35), ("digest", ""),
                           ("name", "review-playground"), ("workflow_run", {"id": 99, "head_sha": SHA})]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                receiver.verify_run(self.run, {**self.artifact, key: value}, SHA, 34)

    def test_unpack_checks_hash_paths_links_and_base(self):
        valid = [("index.html", b'<script src="/playground/assets/app.js"></script>', tarfile.REGTYPE),
                 ("assets/app.js", b"console.log('preview')", tarfile.REGTYPE)]
        data, digest = artifact_bytes(valid)
        with tempfile.TemporaryDirectory() as name:
            target = Path(name)
            receiver.unpack(data, digest, target)
            self.assertTrue((target / "assets/app.js").is_file())
        for name, content, kind in [("../escape", b"bad", tarfile.REGTYPE),
                                    ("/tmp/escape", b"bad", tarfile.REGTYPE),
                                    ("assets/link", b"", tarfile.SYMTYPE),
                                    ("deploy.py", b"bad", tarfile.REGTYPE),
                                    ("assets/app.js", b"duplicate", tarfile.REGTYPE)]:
            bad, bad_digest = artifact_bytes(valid + [(name, content, kind)])
            with tempfile.TemporaryDirectory() as directory, self.assertRaises(ValueError):
                receiver.unpack(bad, bad_digest, Path(directory))
        with tempfile.TemporaryDirectory() as name, self.assertRaises(ValueError):
            receiver.unpack(data + b"tampered", digest, Path(name))
        bad, digest = artifact_bytes([("index.html", b'<script src="/assets/app.js"></script>', tarfile.REGTYPE), valid[1]])
        with tempfile.TemporaryDirectory() as name, self.assertRaises(ValueError):
            receiver.unpack(bad, digest, Path(name))

    def test_activation_is_atomic_and_rolls_back_failed_health_check(self):
        with tempfile.TemporaryDirectory() as name:
            base = Path(name)
            (base / "releases/previous").mkdir(parents=True)
            (base / "current").symlink_to("releases/previous")
            stage = base / "stage"
            (stage / "assets").mkdir(parents=True)
            (stage / "index.html").write_text("preview")
            (stage / "assets/app.js").write_text("code")
            with patch.object(receiver, "urlopen", side_effect=OSError("unhealthy")), self.assertRaises(OSError):
                receiver.activate(base, stage, SHA, 12, 34, "hash")
            self.assertEqual((base / "current").readlink(), Path("releases/previous"))
            with patch.object(receiver, "urlopen", side_effect=[io.BytesIO(SHA.encode()), io.BytesIO(b"preview")]):
                receiver.activate(base, stage, SHA, 12, 34, "hash")
            self.assertEqual((base / "current").readlink(), Path("releases/" + SHA))
            with self.assertRaises(ValueError):
                receiver.activate(base, stage, SHA, 12, 34, "different hash")
            (stage / "assets/app.js").write_text("changed")
            with self.assertRaises(ValueError):
                receiver.activate(base, stage, "d" * 40, 13, 35, "different hash")

    def test_forced_command_rejects_shell_and_stale_commit(self):
        for command in ["sh", "deploy main 12 34", "deploy " + SHA + " 12 34; id"]:
            with patch.dict(receiver.os.environ, {"SSH_ORIGINAL_COMMAND": command}), self.assertRaises(ValueError):
                receiver.main()
        with tempfile.TemporaryDirectory() as directory:
            fake_stdin = type("Input", (), {"buffer": io.BytesIO(b"")})()
            with patch.object(receiver, "BASE", Path(directory)), patch.object(receiver.sys, "stdin", fake_stdin), \
                    patch.dict(receiver.os.environ, {"SSH_ORIGINAL_COMMAND": "deploy " + SHA + " 12 34"}), \
                    patch.object(receiver, "api", side_effect=[self.run, self.artifact, {"object": {"sha": "e" * 40}}]), \
                    self.assertRaisesRegex(ValueError, "Superseded"):
                receiver.main()


if __name__ == "__main__":
    unittest.main()
