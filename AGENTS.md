# Contributing to Mortar

Mortar is a public MIT kit. You can develop, preview and check it without any governance-service account.

Read DESIGN.md before composing UI and TESTING.md before changing components or test contracts. Implement reusable components in src, previews in previews, and typed component contracts in manifests. Shells and chrome are shared components, not copies in consumer apps. Product data and actions belong in props and slots.

Run npm ci, npm run catalog, npm run check, npm run test:browser and npm run test:visual. npm run check:json returns baseline rule IDs, files, lines and corrective messages. npm run dev opens the local playground. Update manifests when changing exports. Include a regression test for a bug fix. Never mark yourself approved, publish a release, or change protected CI rules to make a contribution pass.

Open a PR with rationale, screenshots and actual check results. Maintainer review and protected final-commit CI precede releases. Baseline checks are not proof of visual quality; inspect desktop/mobile, light/dark, keyboard and focus states. Shared design changes require central fixes, not local overrides.
