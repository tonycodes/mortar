import test from "node:test";
import assert from "node:assert/strict";
import { h, html, Avatar, EmptyState } from "./support/render.mjs";

test("EmptyState default markup is unchanged", () => {
  assert.equal(
    html(EmptyState, {
      title: "No projects",
      description: "Create one.",
      action: h("button", null, "New"),
    }),
    '<div class="m-empty"><h3>No projects</h3><p>Create one.</p><button>New</button></div>',
  );
});

test("EmptyState dashed, start alignment, heading level and children", () => {
  const markup = html(
    EmptyState,
    {
      title: "Projects",
      description: "Pick a template.",
      dashed: true,
      align: "start",
      headingLevel: 2,
    },
    h("ul", null, h("li", null, "List")),
  );
  assert.equal(
    markup,
    '<div class="m-empty" data-dashed="true" data-align="start"><h2>Projects</h2><p>Pick a template.</p><div class="m-empty-extra"><ul><li>List</li></ul></div></div>',
  );
  assert.match(
    html(EmptyState, { title: "T", description: "D", headingLevel: 4 }),
    /<h4>T<\/h4>/,
  );
  assert.doesNotMatch(
    html(EmptyState, { title: "T", description: "D", align: "center" }),
    /data-align/,
  );
});

test("Avatar default markup is unchanged", () => {
  assert.equal(
    html(Avatar, { name: "Ana Kovač", status: "online" }),
    '<span class="m-avatar m-avatar-md" role="img" aria-label="Ana Kovač, online"><span aria-hidden="true">AK</span><span class="m-avatar-status" data-status="online" aria-hidden="true"></span></span>',
  );
});

test("Avatar icon placeholder and top status dot", () => {
  const icon = html(Avatar, { name: "Unknown", placeholder: "icon" });
  assert.match(
    icon,
    /role="img" aria-label="Unknown"><svg class="m-avatar-placeholder" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">/,
  );
  assert.doesNotMatch(icon, />U</);
  assert.doesNotMatch(
    html(Avatar, { name: "A", src: "/a.png", placeholder: "icon" }),
    /m-avatar-placeholder/,
  );
  assert.match(
    html(Avatar, { name: "A", status: "offline", statusPosition: "top" }),
    /<span class="m-avatar-status" data-status="offline" data-position="top" aria-hidden="true">/,
  );
});
