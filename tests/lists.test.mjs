import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  GridList,
  MediaObject,
  SectionHeading,
  Input,
} from "./support/render.mjs";

test("GridList is a labelled list whose linked titles name each card", () => {
  const own = html(GridList, {
    label: "Team members",
    columns: 3,
    items: [
      {
        id: "ana",
        title: "Ana Kovač",
        description: "Engineering",
        href: "#ana",
        media: h("span", { "data-avatar": "" }),
        actions: h("button", {}, "Email"),
      },
      {
        id: "plan",
        title: "Q4 plan.pdf",
        cover: { src: "/plan.png", alt: "" },
      },
    ],
  });
  assert.match(
    own,
    /^<ul class="m-grid-list" aria-label="Team members" data-columns="3">/,
  );
  assert.equal(own.match(/<li>/g)?.length, 2);
  assert.match(own, /<h3><a href="#ana">Ana Kovač<\/a><\/h3>/);
  assert.match(own, /<div class="m-grid-list-actions"><button>Email<\/button>/);
  assert.match(own, /<img src="\/plan.png" alt="" loading="lazy"\/>/);
  assert.match(own, /<h3>Q4 plan.pdf<\/h3>/);
});

test("MediaObject places media beside its content", () => {
  const own = html(
    MediaObject,
    {
      media: h("img", { src: "/a.png", alt: "Ana" }),
      title: "Ana",
      align: "center",
      reverse: true,
    },
    "Comment body",
  );
  assert.match(
    own,
    /<div class="m-media-object" data-align="center" data-reverse="true">/,
  );
  assert.match(
    own,
    /<div class="m-media-object-media"><img src="\/a.png" alt="Ana"\/><\/div>/,
  );
  assert.match(own, /<p class="m-media-object-title">Ana<\/p>/);
  assert.match(own, /Comment body/);
});

test("SectionHeading renders a heading with description and actions", () => {
  const own = html(SectionHeading, {
    title: "Job postings",
    description: "Open roles across teams.",
    headingLevel: 3,
    actions: h("button", {}, "Create"),
  });
  assert.match(own, /^<div class="m-section-heading" data-divider="true">/);
  assert.match(own, /<h3>Job postings<\/h3><p>Open roles across teams.<\/p>/);
  assert.match(own, /<div class="m-actions"><button>Create<\/button><\/div>/);
});

test("Input adds decorative icons and an attached action without changing plain inputs", () => {
  const plain = html(Input, { label: "Name" });
  assert.match(plain, /<div class="m-input-group"><input [^>]*\/><\/div>/);
  const icon = h("svg", { viewBox: "0 0 24 24" });
  const own = html(Input, {
    label: "Search",
    leadingIcon: icon,
    trailingIcon: icon,
    action: h("button", { type: "button" }, "Sort"),
  });
  assert.match(
    own,
    /<div class="m-input-group" data-leading="true" data-trailing="true">/,
  );
  assert.match(own, /<span class="m-input-icon" aria-hidden="true"><svg/);
  assert.match(
    own,
    /<div class="m-input-action"><button type="button">Sort<\/button><\/div>/,
  );
  assert.ok(
    own.indexOf("<input") <
      own.indexOf(
        'm-input-icon" aria-hidden="true"><svg',
        own.indexOf("<input"),
      ),
  );
});
