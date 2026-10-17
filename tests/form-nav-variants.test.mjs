import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Checkbox,
  Switch,
  RadioGroup,
  Sidebar,
  AppShell,
  Avatar,
} from "../dist/index.js";
const h = React.createElement;
const html = (type, props) => renderToStaticMarkup(h(type, props));

test("Checkbox and Switch keep their markup and add a described option", () => {
  assert.equal(
    html(Checkbox, { label: "Remember me" }),
    '<label class="m-choice"><input type="checkbox"/>Remember me</label>',
  );
  for (const Control of [Checkbox, Switch]) {
    const markup = html(Control, {
      label: "Comments",
      description: "Get notified when someone comments.",
    });
    const id = markup.match(/<input[^>]*id="([^"]+)"/)?.[1];
    const described = markup.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(id && described, markup);
    assert.match(markup, new RegExp(`<label for="${id}">Comments</label>`));
    assert.match(
      markup,
      new RegExp(
        `<p id="${described}">Get notified when someone comments.</p>`,
      ),
    );
  }
});

test("RadioGroup keeps its list markup and adds grid and swatch layouts", () => {
  const props = {
    label: "Plan",
    name: "plan",
    value: "pro",
    onChange() {},
    options: [
      { value: "starter", label: "Starter" },
      { value: "pro", label: "Pro", description: "For teams" },
    ],
  };
  assert.match(
    html(RadioGroup, props),
    /^<fieldset class="m-radio-group"><legend>Plan<\/legend>/,
  );
  assert.match(
    html(RadioGroup, { ...props, layout: "grid" }),
    /data-layout="grid"/,
  );
  const swatches = html(RadioGroup, {
    ...props,
    layout: "swatches",
    options: [
      { value: "pink", label: "Pink", swatch: "#f4a6c1" },
      { value: "slate", label: "Slate", swatch: "#475569" },
    ],
  });
  assert.match(swatches, /data-layout="swatches"/);
  assert.match(
    swatches,
    /<span class="m-swatch" aria-hidden="true" style="background:#f4a6c1"><\/span><span class="m-sr-only">Pink<\/span>/,
  );
});

test("navigation items with children render as disclosures, open when a child is current", () => {
  const markup = html(Sidebar, {
    navigation: [
      { label: "Dashboard", href: "#d" },
      {
        label: "Projects",
        href: "#projects",
        children: [
          { label: "Design", href: "#design", current: true },
          { label: "Engineering", href: "#eng" },
        ],
      },
      {
        label: "Reports",
        href: "#reports",
        children: [{ label: "Revenue", href: "#revenue" }],
      },
    ],
  });
  assert.match(
    markup,
    /<details class="m-nav-group" open=""><summary>[^]*?Projects<\/summary><div class="m-nav-children"><a href="#design" aria-current="page">/,
  );
  assert.match(
    markup,
    /<details class="m-nav-group"><summary>[^]*?Reports<\/summary>/,
  );
  // Plain items and the AppShell default are unchanged.
  assert.match(
    markup,
    /<a href="#d"><span class="m-nav-marker" aria-hidden="true"><\/span>Dashboard<\/a>/,
  );
  assert.doesNotMatch(
    html(AppShell, {
      brand: "B",
      navigation: [{ label: "O", href: "#o" }],
      children: "x",
    }),
    /m-nav-group/,
  );
});

test("Avatar adds extra-small and extra-large sizes", () => {
  assert.match(
    html(Avatar, { name: "Ana Kovač", size: "xs" }),
    /class="m-avatar m-avatar-xs"/,
  );
  assert.match(
    html(Avatar, { name: "Ana Kovač", size: "xl" }),
    /class="m-avatar m-avatar-xl"/,
  );
});
