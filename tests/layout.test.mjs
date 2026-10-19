import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  Divider,
  Card,
  DescriptionList,
  ButtonGroup,
} from "./support/render.mjs";

test("Divider is a thematic break, and a labelled divider names its separator", () => {
  assert.match(html(Divider), /^<hr class="m-divider"/);
  const markup = html(Divider, { label: "Or continue with" });
  assert.match(markup, /role="separator"/);
  assert.match(markup, /aria-label="Or continue with"/);
  assert.match(markup, /aria-hidden="true">Or continue with</);
});

test("Card names its region from the heading at the chosen level", () => {
  const markup = html(
    Card,
    {
      as: "section",
      title: "Billing",
      headingLevel: 3,
      actions: h("button", {}, "Edit"),
      footer: "Updated today",
    },
    "Body",
  );
  const id = markup.match(/<h3 id="([^"]+)"/)?.[1];
  assert.ok(id, markup);
  assert.ok(markup.includes(`aria-labelledby="${id}"`));
  assert.match(markup, /<footer[^>]*>Updated today<\/footer>/);
  assert.doesNotMatch(html(Card, {}, "Plain"), /aria-labelledby|<header/);
});

test("DescriptionList pairs terms and details inside a definition list", () => {
  const markup = html(DescriptionList, {
    title: "Applicant",
    items: [
      { term: "Full name", details: "Ada Lovelace" },
      {
        term: "Email",
        details: "ada@example.com",
        action: h("a", { href: "#email" }, "Update"),
      },
    ],
  });
  assert.match(markup, /<dl>/);
  assert.equal(markup.match(/<dt>/g)?.length, 2);
  assert.match(markup, /<dt>Full name<\/dt><dd>Ada Lovelace<\/dd>/);
  assert.match(markup, /<dd class="m-description-action"><a href="#email">/);
});

test("ButtonGroup labels the group and names icon-only actions", () => {
  const icon = h("svg", { viewBox: "0 0 24 24" });
  const markup = html(ButtonGroup, {
    label: "Text alignment",
    items: [
      { label: "Align left", icon, iconOnly: true },
      { label: "Docs", href: "#docs" },
      { label: "Archive", disabled: true },
    ],
  });
  assert.match(markup, /role="group" aria-label="Text alignment"/);
  assert.match(markup, /aria-label="Align left"/);
  assert.match(markup, /<span aria-hidden="true" class="m-button-group-icon">/);
  assert.match(markup, /<a[^>]*href="#docs"[^>]*>Docs<\/a>/);
  assert.match(markup, /<button type="button" disabled="">Archive<\/button>/);
});
