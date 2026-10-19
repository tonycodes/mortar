# Agent instructions

[CONTRIBUTING.md](CONTRIBUTING.md) is the contribution workflow. This page lists only what a coding agent must not miss.

- Read [DESIGN.md](DESIGN.md) before composing UI. It holds the design principles and the API conventions that every new prop must follow. Read [TESTING.md](TESTING.md) before changing a component or its test contract.
- Fix shared problems centrally in `src`, with the fixture in `previews` and the contract in `manifests`. Do not copy components or override their styles in a consumer.
- Run `npm run check` first. If it reports M007 or M008, review what changed in your diff, then run `npm run catalog`. It prints which components' fingerprints and contracts changed. Never run `npm run catalog` just to make a failing check pass.
- Run `npm run test:browser` and `npm run test:visual` before opening a PR, and report the actual results.
- Never approve, merge, publish or bump the version on your own initiative, and never weaken a protected check, policy or workflow to make a change pass.
