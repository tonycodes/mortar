# Component test contract

Mortar tests observable behaviour, not a line-coverage percentage. Everything here runs locally without a service account. CI requires the same checks against a production playground build.

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser
npm run test:visual
```

`npm run check` never rewrites the catalogue: drift fails M007 (a source or preview fingerprint changed) or M008 (the catalogue no longer matches the manifests). Review the change that caused it, then run `npm run catalog`. It regenerates catalog.json and prints which components' fingerprints and contracts changed, so you can confirm the list matches what you meant to change. Formatting source after regeneration requires regenerating again. Never regenerate first: that accepts drift without looking at it.

Each browser command builds the playground before serving it. CI sets `MORTAR_PLAYGROUND_PREBUILT=1` so both suites serve the `playground-dist` that `npm run check` already built; set it locally to skip the rebuild when that build is current.

`npm test` builds `dist` and runs the node tests. They import the built package, so a single file run with `node --test` refuses a `dist` older than `src` (tests/support/render.mjs).

## Manifests and the catalogue

Manifests hold only the hand-written contract. `npm run catalog` generates the rest into catalog.json, so a shared change never rewrites every manifest:

- `version`: the package version, on the catalogue and on every entry.
- `integrity`: separate source and preview hashes of the local import closures; source identity also includes shared styles. They identify changes, not approval or a security signature.
- `contract.propTypes`: for every prop the component itself declares (inherited DOM attributes are omitted), `{ type, required, default? }` from the TypeScript checker. Literal unions and aliases such as `Tone` are expanded and sorted. `contract.props` stays the human-readable description; `tests/manifest-props.test.mjs` fails when a declared prop is undocumented, a documented prop does not exist, or a documented union or prop kind differs from TypeScript.
- `capabilities`: `theme` and the kit for every component, `keyboard` when it has a registered interaction probe and `responsive` for the composite profile, plus what the manifest declares from the closed vocabulary in `scripts/test-contract.mjs` (`action`, `input`, `validation`, `form`, `navigation`, `status`, `summary`, `table`, and `keyboard` or `responsive` where they are not already derived). Declaring a derived or unknown capability fails M006.
- `provenance`: `{ kitId, exampleId }`, derived from `kitId`.

`contract.dependencies` stays hand-written but must list exactly the catalogue components the source renders, following local helpers and contexts that require a provider (M010).

Catalogue shape changes for consumers such as the hosted ARC indexer, which reads only catalog.json: `contract.propTypes` is new; `contract.states` is removed (it was the same five labels on every component; tested scenarios are `testing.states`); `provenance.sourceDigest` is removed (it was never read); `capabilities` is now complete and ordered (`theme`, kit, then vocabulary order). Every other field keeps its meaning.

## Every component

Each manifest has a `testing` contract. `target` identifies actual rendered component content inside the preview root, not the catalogue controls. Overlay targets initially identify their opener; the mandatory overlay probe then requires an open dialog. The playground resolves the manifest's exact preview path. A missing component, empty fixture, fallback notice, console error or JavaScript exception fails the harness.

Modal's contract, for example:

```json
{
  "testing": {
    "profile": "overlay",
    "target": ".m-button",
    "probe": "dialog",
    "states": []
  }
}
```

| Profile   | Required execution                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| display   | Actual component rendering and scoped plus whole-page axe checks, light and dark                               |
| control   | Display checks plus a registered behaviour probe                                                               |
| overlay   | Display checks plus keyboard/pointer opening, open-dialog axe, focus containment and return, dismissal         |
| composite | Display checks plus mobile/desktop page-overflow checks; registered navigation/behaviour probe when applicable |

Profiles are reviewed classifications, not an automatic proof that an API has no other states. All public component exports have profiles. The registered probe mapping in `scripts/test-contract.mjs` prevents existing interactive components being downgraded to display-only coverage. A new interactive export needs a probe in that mapping and a corresponding implementation in `tests/support/probes.mjs`. Probe implementations contain real assertions of visible state, input values, callbacks or focus; a prose promise or a test name is insufficient.

State fixtures exercise the scenarios a manifest declares in `testing.states`, chosen from the closed list in `scripts/test-contract.mjs`: `disabled`, `loading`, `error`, `empty`, `long`, `success`, `surface`, `inverse`, `coming-soon`, `duplicate-links`, `heading-3`, `scope-container` and `controlled`. ConfirmDialog, for example, declares `loading` and `long`. Every state has a registered browser assertion (`tests/support/states.mjs`, checked by `tests/test-contract.test.mjs`); a declared state without one fails. SignInPanel maps its submitting status to the loading fixture; the suite checks disabled submission, validation errors and an accessible success announcement. Inverse sections additionally check pressed-button and selected-icon contrast for both brands and appearances. New or changed public states must be added to the manifest, fixture and test assertions in the same PR. Existing state coverage is deliberately incremental: it is not a claim of exhaustive coverage of every optional prop. Bug fixes require a reproducing regression test. Reviewers should check state omissions and classifications as carefully as implementation code.

The full browser command validates successful evidence for every expected component/theme/state. Missing, skipped, duplicated, failed or incomplete records fail the run, and `test-results/component-contract.json` records the result. Negative tests exercise the validator and preview failures. A contributor able to rewrite the harness could falsify evidence; the report is not a security boundary. Harness, policy, profile and workflow changes need explicit maintainer review.

For focused development use `npx playwright test tests/browser/components.spec.mjs --grep Button`. This intentionally does not claim complete-contract coverage; the full command remains mandatory before merge. CI uses the Playwright-pinned browser. `UI_TEST_CHROME` is a local diagnostic override, not the canonical visual environment.

ThemeProvider tests check brand, density, light/dark/system changes centrally. The default component sweep covers light/dark, and representative controls/shells exercise green. We do not cross every prop, theme, density and screen size. Global styles and tokens still run the full suite; no dependency graph currently skips required tests. ARC may later select additional impacted checks, but cannot prove interaction or visual correctness.

## Visual baselines

Sixteen comparisons cover AppShell, DocsShell, PlanComparison and the open ConfirmDialog at 390/1280px in light/dark. Baselines are platform-specific, with CI pinned to Ubuntu 24.04 and the lockfile's Playwright browser. Screenshots wait for fonts and disable animation. They allow a small pixel tolerance, not arbitrary layout changes.

Missing baselines fail. Required CI never updates or approves them. A separate read-only workflow renders Linux candidates into an artifact directory, outside the accepted baseline tree. Its success is not a quality gate or approval. To propose new baselines on the matching platform:

```sh
npm run test:visual -- --update-snapshots=all
```

Review expected/actual/diff artifacts and commit only intentional changes. Initial and changed baseline images are proposals until the maintainer reviews them in the PR. Changes to this command's baseline files do not replace behavioural or accessibility evidence. AI may assist visual review but cannot waive a failed check or authorize merging.

GitHub uploads runnable playground, browser evidence, contract report and visual diff artifacts. Inspect mobile/desktop, keyboard/focus and meaningful states; axe and screenshots do not establish complete accessibility or design quality.

## Solo-maintainer review

Required CI is the automatic merge gate. The repository does not require a second GitHub reviewer: the owner reviews and authorizes merging. Agents may prepare PRs and evidence, but cannot approve themselves or merge without explicit owner instruction. Baseline changes, waivers, policy changes, API removals and release publication remain maintainer decisions. No waiver mechanism is implemented in this test contract; missing obligations fail.
