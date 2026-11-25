import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { renderAudit } from "../../cli/render.mjs";

// mortar audit --render on small pages that reproduce each rule, written with
// Mortar's own markers so the checks see what an app would render.
const field = (component, label, height, extra = "") =>
  `<div class="m-field" data-m-component="${component}" ${extra}>
     <label>${label}</label>
     <div style="height:${height}px;border:1px solid;box-sizing:border-box"><input style="box-sizing:border-box"></div>
   </div>`;
const page = (body, tokens = true) =>
  `<!doctype html><html><head><style>
     ${tokens ? ":root{--m-control:36px}" : ""}
     body{margin:0;font:14px sans-serif} .row{display:flex;gap:12px;align-items:flex-end}
   </style></head><body>${body}</body></html>`;

let dir;
const url = (name, html) => {
  const file = join(dir, `${name}.html`);
  writeFileSync(file, html);
  return pathToFileURL(file).href;
};
const audit = (href) =>
  renderAudit([href], { executablePath: process.env.UI_TEST_CHROME });
const rules = (findings) => findings.map((f) => f.rule).sort();

test.beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "mortar-render-"));
});
test.afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("a clean row of Mortar controls has no findings", async () => {
  const href = url(
    "clean",
    page(
      `<div class="row">${field("Input", "Search", 36)}${field("Select", "Status", 36)}</div>`,
    ),
  );
  expect(await audit(href)).toEqual([]);
});

test("controls of different heights in one row are reported once", async () => {
  const href = url(
    "heights",
    page(
      `<div class="row">${field("Input", "Search", 38)}${field("Select", "Status", 36)}</div>`,
    ),
  );
  const findings = await audit(href);
  expect(rules(findings)).toEqual(["render-row-height"]);
  expect(findings[0].message).toContain('Input "Search" 38px');
  expect(findings[0].message).toContain('Select "Status" 36px');
});

test("controls that wrap onto separate lines are not compared", async () => {
  const href = url(
    "wrapped",
    page(
      `<div class="row" style="flex-wrap:wrap;width:200px">${field("Input", "Search", 38, 'style="width:200px"')}${field("Select", "Status", 36, 'style="width:200px"')}</div>`,
    ),
  );
  expect(await audit(href)).toEqual([]);
});

test("a TextArea beside an Input is not a height mismatch", async () => {
  const href = url(
    "textarea",
    page(
      `<div class="row">${field("Input", "Name", 36)}<div class="m-field" data-m-component="TextArea"><label>Notes</label><textarea style="height:110px;box-sizing:border-box"></textarea></div></div>`,
    ),
  );
  expect(await audit(href)).toEqual([]);
});

test("a label that inherits right alignment is reported", async () => {
  const href = url(
    "align",
    page(`<div style="text-align:right">${field("Input", "Search", 36)}</div>`),
  );
  const findings = await audit(href);
  expect(rules(findings)).toEqual(["render-label-align"]);
  expect(findings[0].message).toContain("text-align: right");
});

test("content-box controls, missing tokens, overflow and errors are reported", async () => {
  const href = url(
    "setup",
    page(
      `<div class="m-field" data-m-component="Input"><label>Name</label><input style="box-sizing:content-box"></div>
       <div style="width:600px">wide</div>
       <script>console.error("boom")</script>`,
      false,
    ),
  );
  expect(rules(await audit(href))).toEqual([
    "render-box-sizing",
    "render-error",
    "render-missing-styles",
    "render-overflow",
  ]);
});
