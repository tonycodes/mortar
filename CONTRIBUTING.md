# Contribute

Clone, run npm ci, npm run catalog, npm run check, npm run dev. Use npm run test:browser for both-theme accessibility/rendering checks. The local playground defaults to port 4340. No service registration or npm token is required.

Use src for central implementations, previews for fixtures and manifests for contracts. Read DESIGN.md and AGENTS.md. Include a reproducible issue and a regression test for fixes. Open a PR with actual check results and visual evidence. Shared shells are versioned alongside controls; applications supply content through props.

Baseline rules are versioned in baseline-policy.json. CI must use the same rules but contributors cannot authorize weakening protected checks; policy, workflow and dependency changes require maintainer review. Branch protection must require successful checks and dismiss approvals when reviewed content changes. Public PR runners must be isolated from release credentials and production networks.

Releases are operator-owned. Verify the final merged commit, run all checks, create an immutable version tag, and prepare the exact package using npm run release:prepare. Upload archives and integrity/provenance records before atomically advancing registry metadata. Never overwrite an existing version. The publisher must verify maintainer approval and successful final-commit CI independently. Publication does not call the paid service; ARC indexes published release manifests afterward.

The cloud service may impose additional organisation adoption policies. Those policies cannot prevent development or installation of the public MIT kit.
