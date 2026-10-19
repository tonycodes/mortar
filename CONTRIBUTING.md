# Contribute

Clone https://github.com/tonycodes/mortar, run `npm ci`, `npm run check` and `npm run dev`. Use `npm run test:browser` for both-theme accessibility/rendering checks. The local playground defaults to port 4340. No service registration or npm token is required.

Run `npm run check` before regenerating anything. When you change a component, its preview or shared styles, the check fails with M007 (a source or preview fingerprint changed) or M008 (the catalogue no longer matches the manifests). Review what you changed, then run `npm run catalog`. It rewrites catalog.json and prints which components' fingerprints and contracts changed; check that list matches your intent before committing. Running `npm run catalog` first would accept any drift unseen.

Use src for central implementations, previews for fixtures and manifests for contracts. Read DESIGN.md (principles and API conventions) and TESTING.md; AGENTS.md summarises the rules for coding agents. A manifest documents every prop the component declares; `tests/manifest-props.test.mjs` compares it with the TypeScript types, and rule M010 requires `contract.dependencies` to list exactly the catalogue components the source renders. `npm run catalog` generates the prop types, capabilities derived from the test contract, provenance, version and fingerprints into catalog.json. Include a reproducible issue and a regression test for fixes. Open a PR with actual check results and visual evidence. Shared shells are versioned alongside controls; applications supply content through props.

Baseline rules are versioned in baseline-policy.json. CI must use the same rules but contributors cannot authorize weakening protected checks; policy, workflow and dependency changes require maintainer review. Branch protection requires successful checks. The solo maintainer reviews and authorizes merges; a second GitHub approval is not required. Public PR runners must be isolated from release credentials and production networks.

Releases are automatic and version-driven. To release, merge a PR that bumps the version with `npm version <x.y.z> --no-git-tag-version`. `npm run check` then fails with M008 until `npm run catalog` stamps the new version onto every catalogue entry (tests/versioning.test.mjs enforces they match). After the required checks pass on that merge commit, the Release package workflow (.github/workflows/release.yml) acts only if the version is not already on the registry. Its credential-free prepare job builds the exact commit with npm run release:prepare and checks the provenance record. Its publish job runs in the protected npm-release environment, the only place the MORTAR_REGISTRY_TOKEN secret exists, and never checks out or runs repository code. It re-verifies the archive and creates the immutable v<version> tag on that commit. It then creates the GitHub release with the archive and provenance.json, publishes that exact archive, and confirms the registry integrity matches the provenance. Merges that do not change the version publish nothing. A version is never overwritten: an existing tag on another commit stops the release, and a rerun publishes the archive already attached to the GitHub release. Prerelease versions such as 1.0.0-rc.1 are published under the next dist-tag. The maintainer's merge of the version bump is the release authorization; agents must not open or merge version bumps on their own initiative. Publication does not call the paid service; ARC indexes published release manifests afterward.

The cloud service may impose additional organisation adoption policies. Those policies cannot prevent development or installation of the public MIT kit.

## Pull request review

GitHub is the component review authority. Include the evidence in the PR template. CI uploads a runnable `mortar-playground-<commit>` artifact and a browser report with screenshots for both themes. Download and extract the playground, run `python3 -m http.server 4340 --bind 127.0.0.1` in that directory, and open http://127.0.0.1:4340. No package install or cloud identity is needed for this preview. Use an isolated browser profile for untrusted PR code. Never deploy PR artifacts to the production/authentication origin.

Preview artifacts are review evidence, not approved releases. GitHub maintainer review and successful required checks apply to the current PR commit. Source changes invalidate prior approval. A merged change needs a new immutable package version before consumers adopt it. There is no second cloud component approval queue.

## Contributor identity

Use a contributor identity or dedicated GitHub App where available. Do not give contributors package-publishing or repository-administration credentials. For this solo-maintainer repository, passing required CI and the owner's explicit merge authorization are the review gate; no second GitHub reviewer is required. Agents must not self-authorize a merge or release. The hosted service's release-adoption policy is separate and must be verified before publication/adoption.

## Executable test contract

See [TESTING.md](TESTING.md) for profiles, state fixtures, integrity checks, execution reports and visual baselines. Run both `npm run test:browser` and `npm run test:visual`; catalogue presence or an axe pass on playground chrome is not sufficient. Baseline images and changes to the test policy require maintainer review in the PR.

## Browsing the playground

The playground opens on an overview of the five kits: Foundation, Application, Marketing, Docs and Ecommerce (`playground/taxonomy.json`). Each kit is split into categories (for example Foundation › Form controls), shown as cards with a live, inert thumbnail and a component count. A category page lists every component in it as a framed example; a component page adds breadcrumbs, preview settings and previous/next links. Every example has a Preview/Code switch, and the Code view shows the JSX the preview renders, extracted from the fixture source with the TypeScript parser (`playground/examples.mjs`; `tests/playground-code.test.mjs` checks every component). Categories live in `playground/taxonomy.json`; `tests/playground.test.mjs` fails if a component is missing from it or listed twice, so add new components there.

Search by component, kit or category name. On narrow screens, Menu opens the same catalogue. Kit, category, component, brand, density, appearance, declared example states and the Code view are reflected in the URL, so a page can be shared or revisited. Open “Usage and component contract” for imports and prop metadata. The explorer composes the shared DocsShell with its `wide` layout; shell fixes belong in the kit, not playground CSS.

## Automatic playground deployment

Merges to `main` automatically deploy the playground at https://mortar.tony.codes/playground/ after the required checks pass on the merged commit. A separate deployment workflow receives a restricted static-upload credential; PR and build jobs do not. Failed checks leave the current production release unchanged. See [deployment operations](ops/README.md). This does not publish a package; only a merged version bump does (see above).
