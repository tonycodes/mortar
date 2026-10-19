import test from "node:test";
import assert from "node:assert/strict";
import { h, html, PageHeading, AttachmentList } from "./support/render.mjs";
const icon = h("svg", { viewBox: "0 0 20 20" });

test("PageHeading keeps its markup and adds meta and an avatar", () => {
  assert.equal(
    html(PageHeading, { title: "Workspace overview" }),
    '<header class="m-page-heading"><div class="m-heading-row"><div><h1 class="m-page-title">Workspace overview</h1></div></div></header>',
  );
  const rich = html(PageHeading, {
    title: "Back End Developer",
    meta: [{ label: "Full-time", icon }, { label: "Remote" }],
    avatar: h("span", { "data-avatar": "" }),
  });
  assert.match(
    rich,
    /<span class="m-heading-avatar" aria-hidden="true"><span data-avatar=""><\/span><\/span>/,
  );
  assert.match(
    rich,
    /<ul class="m-heading-meta"><li><span aria-hidden="true"><svg[^>]*><\/svg><\/span>Full-time<\/li><li>Remote<\/li><\/ul>/,
  );
});

test("AttachmentList names each download by its file", () => {
  const markup = html(AttachmentList, {
    files: [
      {
        id: "cv",
        name: "resume_back_end_developer.pdf",
        size: "2.4 MB",
        href: "#cv",
      },
      { id: "cl", name: "coverletter.pdf", href: "#cl", actionLabel: "View" },
    ],
  });
  assert.match(markup, /^<ul class="m-attachments" aria-label="Attachments">/);
  assert.match(
    markup,
    /<span class="m-attachment-name">resume_back_end_developer.pdf<\/span><span class="m-attachment-size">2.4 MB<\/span>/,
  );
  assert.match(
    markup,
    /<a href="#cv">Download<span class="m-sr-only"> resume_back_end_developer.pdf<\/span><\/a>/,
  );
  assert.match(
    markup,
    /<a href="#cl">View<span class="m-sr-only"> coverletter.pdf<\/span><\/a>/,
  );
});
