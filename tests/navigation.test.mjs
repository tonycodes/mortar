import { test } from "node:test";
import assert from "node:assert/strict";
import { followLink } from "../dist/navigation.js";
function event(overrides = {}, attrs = {}) {
  const attributes = { href: "/account", ...attrs };
  return {
    defaultPrevented: false,
    button: 0,
    preventDefault() {
      this.defaultPrevented = true;
    },
    currentTarget: {
      href: new URL(attributes.href, "https://example.com/current").href,
      target: "",
      rel: "",
      ownerDocument: { URL: "https://example.com/current" },
      getAttribute: (key) => attributes[key] ?? null,
      hasAttribute: (key) => key in attributes,
      ...overrides.anchor,
    },
    ...overrides,
  };
}
test("shared links route ordinary internal navigation through the app adapter", () => {
  const e = event();
  let destination;
  followLink(e, (href) => {
    destination = href;
  });
  assert.equal(destination, "/account");
  assert.equal(e.defaultPrevented, true);
});
test("native navigation remains available without an adapter or when it declines", () => {
  for (const adapter of [undefined, () => false]) {
    const e = event();
    followLink(e, adapter);
    assert.equal(e.defaultPrevented, false);
  }
});
test("shared links preserve modifiers, downloads, external links, fragments and cancelled clicks", () => {
  const events = [
    ...["ctrlKey", "metaKey", "shiftKey", "altKey"].map((key) =>
      event({ [key]: true }),
    ),
    event({ button: 1 }),
    event({ defaultPrevented: true }),
    event({}, { download: "" }),
    event({}, { href: "#section" }),
    event({}, { href: "/current#section" }),
    event({}, { href: "https://other.example/account" }),
    event({}, { href: "mailto:hello@example.com" }),
    event({}, { href: "" }),
  ];
  for (const target of ["_blank", "report"]) {
    const e = event();
    e.currentTarget.target = target;
    events.push(e);
  }
  const external = event();
  external.currentTarget.rel = "external";
  events.push(external);
  for (const e of events) {
    let called = false;
    followLink(e, () => {
      called = true;
    });
    assert.equal(called, false);
  }
});
