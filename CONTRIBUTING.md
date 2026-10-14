# Contribute

Clone https://github.com/tonycodes/mortar, run npm ci, npm run catalog, npm run check, npm run dev. Use npm run test:browser for both-theme accessibility/rendering checks. The local playground defaults to port 4340. No service registration or npm token is required.

Use src for central implementations, previews for fixtures and manifests for contracts. Read DESIGN.md and AGENTS.md. Include a reproducible issue and a regression test for fixes. Open a PR with actual check results and visual evidence. Shared shells are versioned alongside controls; applications supply content through props.

Baseline rules are versioned in baseline-policy.json. CI must use the same rules but contributors cannot authorize weakening protected checks; policy, workflow and dependency changes require maintainer review. Branch protection must require successful checks and dismiss approvals when reviewed content changes. Public PR runners must be isolated from release credentials and production networks.

Releases are operator-owned. Verify the final merged commit, run all checks, create an immutable version tag, and prepare the exact package using npm run release:prepare. Upload archives and integrity/provenance records before atomically advancing registry metadata. Never overwrite an existing version. The publisher must verify maintainer approval and successful final-commit CI independently. Publication does not call the paid service; ARC indexes published release manifests afterward.

The cloud service may impose additional organisation adoption policies. Those policies cannot prevent development or installation of the public MIT kit.

## Pull request review

GitHub is the component review authority. Include the evidence in the PR template. CI uploads a runnable `mortar-playground-<commit>` artifact and a browser report with screenshots for both themes. Download and extract the playground, run `python3 -m http.server 4340 --bind 127.0.0.1` in that directory, and open http://127.0.0.1:4340. No package install or cloud identity is needed for this preview. Use an isolated browser profile for untrusted PR code. Never deploy PR artifacts to the production/authentication origin.

Preview artifacts are review evidence, not approved releases. GitHub maintainer review and successful required checks apply to the current PR commit. Source changes invalidate prior approval. A merged change needs a new immutable package version before consumers adopt it. There is no second cloud component approval queue.

## Contributor identity

Coding agents should open PRs through their own contributor identity or a dedicated GitHub App, using a fork when necessary. Do not give contributors package-publishing or repository-administration credentials. If an agent opens a PR with the maintainer's personal token, GitHub treats the maintainer as its author and will not permit that maintainer to approve it. Use a separate authorized maintainer for such a PR; do not bypass the review gate. The initial cloud release verifier expects a current approval from tonycodes on a PR authored by a different identity.
