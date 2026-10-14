# Component test contract

Mortar tests observable behaviour, not a line-coverage percentage. Everything here runs locally without a service account. CI requires the same checks against a production playground build.

```sh
npm ci
npm run catalog
npm run check
npx playwright install chromium
npm run test:browser
npm run test:visual
```

`npm run catalog` refreshes the catalogue and separate source/preview integrity hashes. The hashes cover local import closures; source identity also includes shared styles. They identify changes, not approval or a security signature. Formatting source after regeneration requires regenerating again. `npm run check` never rewrites the catalogue: drift fails M007/M008.

## Every component

Each manifest has a `testing` contract. `target` identifies actual rendered component content inside the preview root, not the catalogue controls. Overlay targets initially identify their opener; the mandatory overlay probe then requires an open dialog. The playground resolves the manifest's exact preview path. A missing component, empty fixture, fallback notice, console error or JavaScript exception fails the harness.

```json
{
  "testing": {
    "profile": "overlay",
    "target": ".m-button",
    "probe": "dialog",
    "states": ["loading", "long"]
  }
}
```

| Profile   | Required execution                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| display   | Actual component rendering and scoped plus whole-page axe checks, light and dark                               |
| control   | Display checks plus a registered behaviour probe                                                               |
| overlay   | Display checks plus keyboard/pointer opening, open-dialog axe, focus containment and return, dismissal         |
| composite | Display checks plus mobile/desktop page-overflow checks; registered navigation/behaviour probe when applicable |

Profiles are reviewed classifications, not an automatic proof that an API has no other states. All 70 existing exports have profiles. The registered probe mapping in `scripts/test-contract.mjs` prevents existing interactive components being downgraded to display-only coverage. A new interactive export needs a probe in that mapping and a corresponding implementation in `tests/support/probes.mjs`. Probe implementations contain real assertions of visible state, input values, callbacks or focus; a prose promise or a test name is insufficient.

State fixtures exercise disabled/loading/error/empty/long-content scenarios where currently declared. New or changed public states must be added to the manifest, fixture and test assertions in the same PR. Existing state coverage is deliberately incremental: it is not a claim of exhaustive coverage of every optional prop. Bug fixes require a reproducing regression test. Reviewers should check state omissions and classifications as carefully as implementation code.

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
