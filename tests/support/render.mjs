// Shared server-rendering helpers for the node suite. Tests render the built
// package in dist/, so refuse to run against a build older than the source.
import { readdirSync, statSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as UI from "../../dist/index.js";

const root = new URL("../../", import.meta.url);
const built = statSync(new URL("dist/index.js", root)).mtimeMs;
const stale = readdirSync(new URL("src/", root)).filter(
  (file) =>
    /\.tsx?$/.test(file) &&
    statSync(new URL(`src/${file}`, root)).mtimeMs > built,
);
if (stale.length)
  throw Error(
    `dist is older than src (${stale.join(", ")}); run npm run build first (npm test does).`,
  );

export * from "../../dist/index.js";
export { UI };
export const h = React.createElement;
export const Fragment = React.Fragment;
/** Static markup for `<type {...props}>{children}</type>`. */
export const html = (type, props, ...children) =>
  renderToStaticMarkup(h(type, props, ...children));
