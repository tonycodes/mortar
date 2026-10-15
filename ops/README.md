# Playground deployment

Merging to `main` starts the required quality workflow. Only after its baseline,
browser and visual checks pass does it upload a production artifact built with
`/playground/` as its base path. The separate `Deploy playground` workflow deploys
that artifact automatically to https://mortar.tony.codes/playground/.

PR runs never produce deployable artifacts. The deployment job has no checkout,
dependency installation or artifact code execution. Its SSH credential lives in
the `playground-production` GitHub environment, restricted to `main`. It is not
available to the contribution-check job.

The operator installs `playground_receiver.py` outside the deployment account's
writable directories. The SSH key uses a forced command and disables forwarding,
PTY and user startup scripts. The dedicated account can write only the static
playground release directory; it has no sudo, registry or npm publication access.
CI cannot update the receiver or nginx configuration.

The receiver independently verifies the GitHub run's repository, workflow, event,
branch, commit and successful completion. It verifies the uploaded ZIP against
GitHub's artifact digest and checks artifact/run identity. Archives are limited
in size and must contain only the playground index and regular asset files.
Traversal, links, duplicate paths and immutable asset collisions are rejected.

Deployments are serialized. A superseded main commit cannot replace a newer
release. Releases are immutable, hashed assets are retained for existing browser
tabs, and the current release changes through an atomic symlink. Live index and
commit checks trigger rollback if activation fails.

## Operator configuration

- Environment secret: `PLAYGROUND_DEPLOY_KEY` (dedicated Ed25519 private key).
- Environment variables: `PLAYGROUND_DEPLOY_HOST` and `PLAYGROUND_KNOWN_HOSTS`.
  Obtain the host key through a trusted operator connection, not a CI key scan.
- Forced command: `/usr/bin/python3 /usr/local/libexec/mortar-playground-receiver.py`.
- Account: `mortar-playground`.
- Static root: `/var/lib/dokku/data/storage/mortar-playground`.
- nginx serves `/playground/` from `current/`, and `/playground/assets/` from
  the retained `assets/` directory. Normal deployments need no nginx reload.

Test receiver changes with `python3 -m unittest discover -s ops/tests` before an
operator installs them. Receiver code in this repository is a reviewable source
copy, not code CI may install on the server.

A failed deployment leaves the previous release active and reports a failed
GitHub deployment job. Rerun the failed deployment workflow for a transient
failure while that checked commit is still `main`. For manual rollback, an
operator atomically points `current` to a previous directory under `releases`.
`latest-deployment.json` records the last successful activation and previous target.

This workflow deploys the public playground only. Immutable npm publication and
the private governance application's deployment remain separate release processes.
