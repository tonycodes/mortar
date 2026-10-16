import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Divider, Card, DescriptionList, ButtonGroup } from "../dist/index.js";
const h = React.createElement;

test("Divider is a thematic break, and a labelled divider names its separator", () => {
  assert.match(renderToStaticMarkup(h(Divider)), /^<hr class="m-divider"/);
  const html = renderToStaticMarkup(h(Divider, { label: "Or continue with" }));
  assert.match(html, /role="separator"/);
  assert.match(html, /aria-label="Or continue with"/);
  assert.match(html, /aria-hidden="true">Or continue with</);
});

test("Card names its region from the heading at the chosen level", () => {
  const html = renderToStaticMarkup(
    h(
      Card,
      {
        as: "section",
        title: "Billing",
        headingLevel: 3,
        actions: h("button", {}, "Edit"),
        footer: "Updated today",
      },
      "Body",
    ),
  );
  const id = html.match(/<h3 id="([^"]+)"/)?.[1];
  assert.ok(id, html);
  assert.ok(html.includes(`aria-labelledby="${id}"`));
  assert.match(html, /<footer[^>]*>Updated today<\/footer>/);
  assert.doesNotMatch(
    renderToStaticMarkup(h(Card, {}, "Plain")),
    /aria-labelledby|<header/,
  );
});

test("DescriptionList pairs terms and details inside a definition list", () => {
  const html = renderToStaticMarkup(
    h(DescriptionList, {
      title: "Applicant",
      items: [
        { term: "Full name", details: "Ada Lovelace" },
        {
          term: "Email",
          details: "ada@example.com",
          action: h("a", { href: "#email" }, "Update"),
        },
      ],
    }),
  );
  assert.match(html, /<dl>/);
  assert.equal(html.match(/<dt>/g)?.length, 2);
  assert.match(html, /<dt>Full name<\/dt><dd>Ada Lovelace<\/dd>/);
  assert.match(html, /<dd class="m-description-action"><a href="#email">/);
});

test("ButtonGroup labels the group and names icon-only actions", () => {
  const icon = h("svg", { viewBox: "0 0 24 24" });
  const html = renderToStaticMarkup(
    h(ButtonGroup, {
      label: "Text alignment",
      items: [
        { label: "Align left", icon, iconOnly: true },
        { label: "Docs", href: "#docs" },
        { label: "Archive", disabled: true },
      ],
    }),
  );
  assert.match(html, /role="group" aria-label="Text alignment"/);
  assert.match(html, /aria-label="Align left"/);
  assert.match(html, /<span aria-hidden="true" class="m-button-group-icon">/);
  assert.match(html, /<a[^>]*href="#docs"[^>]*>Docs<\/a>/);
  assert.match(html, /<button type="button" disabled="">Archive<\/button>/);
});
