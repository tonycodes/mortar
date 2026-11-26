// Package entry points that export catalogue components, by import specifier.
// A manifest's `package` names its entry; every runtime export of each entry
// needs a manifest. The email entry is not listed: its components are covered
// by tests/email.test.mjs, not the catalogue.
export const COMPONENT_ENTRIES = {
  "@tonycodes-ui/mortar": "src/index.ts",
  "@tonycodes-ui/mortar/data-grid": "src/data-grid.ts",
  "@tonycodes-ui/mortar/charts": "src/charts.ts",
};

/** The entry file for a manifest, or undefined when its package is unknown. */
export const entryFor = (manifest) => COMPONENT_ENTRIES[manifest.package];
