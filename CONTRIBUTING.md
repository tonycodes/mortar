# Contribute

Clone https://github.com/tonycodes/mortar, run npm ci, npm run catalog, npm run check, npm run dev. Use npm run test:browser for both-theme accessibility/rendering checks. The local playground defaults to port 4340. No service registration or npm token is required.

Use src for central implementations, previews for fixtures and manifests for contracts. Read DESIGN.md, AGENTS.md and TESTING.md. Include a reproducible issue and a regression test for fixes. Open a PR with actual check results and visual evidence. Shared shells are versioned alongside controls; applications supply content through props.

Baseline rules are versioned in baseline-policy.json. CI must use the same rules but contributors cannot authorize weakening protected checks; policy, workflow and dependency changes require maintainer review. Branch protection requires successful checks. The solo maintainer reviews and authorizes merges; a second GitHub approval is not required. Public PR runners must be isolated from release credentials and production networks.

Releases are operator-owned. Verify the final merged commit, run all checks, create an immutable version tag, and prepare the exact package using npm run release:prepare. Upload archives and integrity/provenance records before atomically advancing registry metadata. Never overwrite an existing version. The publisher must verify maintainer approval and successful final-commit CI independently. Publication does not call the paid service; ARC indexes published release manifests afterward.

The cloud service may impose additional organisation adoption policies. Those policies cannot prevent development or installation of the public MIT kit.

## Pull request review

GitHub is the component review authority. Include the evidence in the PR template. CI uploads a runnable `mortar-playground-<commit>` artifact and a browser report with screenshots for both themes. Download and extract the playground, run `python3 -m http.server 4340 --bind 127.0.0.1` in that directory, and open http://127.0.0.1:4340. No package install or cloud identity is needed for this preview. Use an isolated browser profile for untrusted PR code. Never deploy PR artifacts to the production/authentication origin.

Preview artifacts are review evidence, not approved releases. GitHub maintainer review and successful required checks apply to the current PR commit. Source changes invalidate prior approval. A merged change needs a new immutable package version before consumers adopt it. There is no second cloud component approval queue.

## Contributor identity

Use a contributor identity or dedicated GitHub App where available. Do not give contributors package-publishing or repository-administration credentials. For this solo-maintainer repository, passing required CI and the owner's explicit merge authorization are the review gate; no second GitHub reviewer is required. Agents must not self-authorize a merge or release. The hosted service's release-adoption policy is separate and must be verified before publication/adoption.

## Executable test contract

See [TESTING.md](TESTING.md) for profiles, state fixtures, integrity checks, execution reports and visual baselines. Run both `npm run test:browser` and `npm run test:visual`; catalogue presence or an axe pass on playground chrome is not sufficient. Baseline images and changes to the test policy require maintainer review in the PR.

## Browsing the playground

The playground opens on an overview of the four kits. Each kit is split into categories (for example Foundation › Form controls), shown as cards with a live, inert thumbnail and a component count. A category page lists every component in it as a framed example; a component page adds breadcrumbs, preview settings and previous/next links. Every example has a Preview/Code switch, and the Code view shows the JSX the preview renders. Categories live in `playground/taxonomy.json`; `tests/playground.test.mjs` fails if a component is missing from it or listed twice, so add new components there.

Search by component, kit or category name. On narrow screens, Menu opens the same catalogue. Kit, category, component, brand, density, appearance, declared example states and the Code view are reflected in the URL, so a page can be shared or revisited. Open “Usage and component contract” for imports and prop metadata. The explorer composes the shared DocsShell with its `wide` layout; shell fixes belong in the kit, not playground CSS.

## Automatic playground deployment

Merges to `main` automatically deploy the playground at https://mortar.tony.codes/playground/ after the required checks pass on the merged commit. A separate deployment workflow receives a restricted static-upload credential; PR and build jobs do not. Failed checks leave the current production release unchanged. See [deployment operations](ops/README.md). This does not publish a new npm package version.
