# Proposed repository labels

Slice 1 of [#62](https://github.com/tonycodes/mortar/issues/62) documents these labels. Creating them in the GitHub UI (or a later labels sync) is a maintainer step. Issue forms and Dependabot already reference the ones that are standard or listed here.

## Existing / standard

| Label           | Use                                                   |
| --------------- | ----------------------------------------------------- |
| `bug`           | Defect in behaviour or docs that claim behaviour.     |
| `enhancement`   | New component, prop or capability.                    |
| `documentation` | Docs-only changes.                                    |
| `dependencies`  | Dependabot PRs (applied by `.github/dependabot.yml`). |

## Proposed for the autonomous cycle

| Label              | Use                                                   |
| ------------------ | ----------------------------------------------------- |
| `agent:ready`      | Issue has enough context for an agent to open a PR.   |
| `agent:working`    | An agent has claimed the issue.                       |
| `needs-maintainer` | Policy, secrets, budget or product call; humans only. |
| `release`          | Release PR or release-process work.                   |
| `security`         | Security scanning findings or supply-chain work.      |
| `maintenance`      | Scheduled health, stale cleanup, repo hygiene.        |

Do not grant agents merge rights through labels. CODEOWNERS and protected checks stay the review gate.
