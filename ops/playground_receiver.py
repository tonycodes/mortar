#!/usr/bin/env python3
"""Operator-installed receiver. CI may upload verified static assets, never commands."""
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
from urllib.request import Request, urlopen
import zipfile

REPO = "tonycodes/mortar"
BASE = Path("/var/lib/dokku/data/storage/mortar-playground")
LIMIT = 50 * 1024 * 1024


def api(path):
    request = Request("https://api.github.com/repos/" + REPO + path,
                      headers={"Accept": "application/vnd.github+json", "User-Agent": "mortar-playground-deploy"})
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def verify_run(run, artifact, sha, artifact_id):
    expected = {
        "event": "push", "head_branch": "main", "head_sha": sha,
        "status": "completed", "conclusion": "success", "path": ".github/workflows/check.yml",
    }
    if any(run.get(k) != v for k, v in expected.items()):
        raise ValueError("Only successful main push checks may deploy")
    if run.get("head_repository", {}).get("full_name") != REPO:
        raise ValueError("Wrong source repository")
    if (artifact.get("id") != artifact_id or artifact.get("expired") is not False
            or artifact.get("name") != "mortar-playground-production-" + sha
            or artifact.get("workflow_run", {}).get("id") != run["id"]
            or artifact.get("workflow_run", {}).get("head_sha") != sha):
        raise ValueError("Artifact is not from this checked commit/run")
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", artifact.get("digest", "")):
        raise ValueError("Artifact digest is required")


def unpack(data, digest, target):
    if len(data) > LIMIT or "sha256:" + hashlib.sha256(data).hexdigest() != digest:
        raise ValueError("Artifact integrity mismatch")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != 1 or entries[0].filename != "release.tar.gz" or entries[0].file_size > LIMIT:
            raise ValueError("Unexpected artifact contents")
        bundle = archive.read(entries[0])
    with tarfile.open(fileobj=io.BytesIO(bundle), mode="r:gz") as archive:
        members = archive.getmembers()
        if len(members) > 2000 or sum(m.size for m in members) > 250 * 1024 * 1024:
            raise ValueError("Release exceeds size limits")
        seen = set()
        for member in members:
            path = PurePosixPath(member.name)
            if (path.is_absolute() or ".." in path.parts or not (member.isfile() or member.isdir())
                    or (str(path) not in (".", "index.html", "assets") and not str(path).startswith("assets/"))
                    or str(path) in seen):
                raise ValueError("Unsafe release member: " + member.name)
            seen.add(str(path))
        for member in members:
            destination = target / member.name
            if member.isdir():
                destination.mkdir(parents=True, exist_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as source, destination.open("wb") as output:
                    shutil.copyfileobj(source, output)
                destination.chmod(0o644)
        if not (target / "index.html").is_file() or not (target / "assets").is_dir():
            raise ValueError("Missing playground entry point or assets")
        if '/playground/assets/' not in (target / "index.html").read_text():
            raise ValueError("Incorrect deployment base path")
        for directory in [target, *target.rglob("*")]:
            if directory.is_dir():
                directory.chmod(0o755)
    return hashlib.sha256(bundle).hexdigest()


def link_current(base, target):
    pending = base / "current.pending"
    pending.unlink(missing_ok=True)
    pending.symlink_to(target)
    pending.replace(base / "current")


def activate(base, stage, sha, run_id, artifact_id, bundle_hash):
    releases = base / "releases"
    assets = base / "assets"
    releases.mkdir(exist_ok=True)
    assets.mkdir(exist_ok=True)
    current = base / "current"
    previous = os.readlink(current) if current.is_symlink() else None
    if current.exists() and not current.is_symlink():
        raise ValueError("Unexpected current path")
    record = {"commit": sha, "runId": run_id, "artifactId": artifact_id,
              "archiveSha256": bundle_hash, "previous": previous, "path": "/playground/"}
    release = releases / sha
    if release.exists():
        if json.loads((release / "deployment.json").read_text())["archiveSha256"] != bundle_hash:
            raise ValueError("Refusing to overwrite immutable release")
    else:
        (stage / "commit.txt").write_text(sha + "\n")
        (stage / "deployment.json").write_text(json.dumps(record, indent=2) + "\n")
        shutil.copytree(stage, release)
    for source in (stage / "assets").rglob("*"):
        if not source.is_file():
            continue
        destination = assets / source.relative_to(stage / "assets")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            if source.read_bytes() != destination.read_bytes():
                raise ValueError("Immutable asset collision")
        else:
            pending = destination.with_name(destination.name + ".pending")
            shutil.copyfile(source, pending)
            pending.chmod(0o644)
            pending.replace(destination)
    link_current(base, "releases/" + sha)
    try:
        with urlopen("https://mortar.tony.codes/playground/commit.txt", timeout=30) as response:
            if response.read().decode().strip() != sha:
                raise ValueError("Live commit verification failed")
        with urlopen("https://mortar.tony.codes/playground/", timeout=30) as response:
            if response.read() != (stage / "index.html").read_bytes():
                raise ValueError("Live index verification failed")
    except Exception:
        if previous:
            link_current(base, previous)
        else:
            current.unlink()
        raise
    (base / "latest-deployment.json").write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps(record))


def main():
    command = os.environ.get("SSH_ORIGINAL_COMMAND", "")
    match = re.fullmatch(r"deploy ([0-9a-f]{40}) ([0-9]+) ([0-9]+)", command)
    if not match:
        raise ValueError("Only deploy SHA RUN_ID ARTIFACT_ID is supported")
    sha, run_id, artifact_id = match.groups()
    run = api("/actions/runs/" + run_id)
    artifact = api("/actions/artifacts/" + artifact_id)
    verify_run(run, artifact, sha, int(artifact_id))
    data = sys.stdin.buffer.read(LIMIT + 1)
    with (BASE / ".deploy.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if api("/git/ref/heads/main")["object"]["sha"] != sha:
            raise ValueError("Superseded main commit; refusing stale deployment")
        with tempfile.TemporaryDirectory(prefix="stage-", dir=BASE) as directory:
            stage = Path(directory)
            bundle_hash = unpack(data, artifact["digest"], stage)
            if api("/git/ref/heads/main")["object"]["sha"] != sha:
                raise ValueError("Main changed during deployment")
            activate(BASE, stage, sha, int(run_id), int(artifact_id), bundle_hash)


if __name__ == "__main__":
    main()
