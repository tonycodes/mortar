import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CallToAction,
  NotFound,
  SignInPanel,
  MetricGroup,
  Toast,
} from "../dist/index.js";
const h = React.createElement;
const html = (type, props) => renderToStaticMarkup(h(type, props));
const media = h("img", {
  src: "/shot.png",
  alt: "Dashboard screenshot",
  loading: "lazy",
});

test("CallToAction keeps its markup and adds a split layout with media", () => {
  const props = {
    title: "Start today",
    actions: [{ label: "Start", href: "#s" }],
  };
  assert.match(
    html(CallToAction, props),
    /^<section class="m-cta" data-m-component="CallToAction"><h2>/,
  );
  const split = html(CallToAction, { ...props, media });
  assert.match(split, /data-layout="split"/);
  assert.match(split, /<div class="m-cta-copy"><h2>Start today<\/h2>/);
  assert.match(
    split,
    /<div class="m-cta-media"><img src="\/shot.png" alt="Dashboard screenshot"/,
  );
});

test("NotFound shows an illustration only when given one", () => {
  const props = { title: "Lost", description: "Not here.", actions: [] };
  assert.doesNotMatch(html(NotFound, props), /m-not-found-art/);
  assert.match(
    html(NotFound, {
      ...props,
      illustration: h("svg", { viewBox: "0 0 10 10" }),
    }),
    /<div class="m-not-found-art" aria-hidden="true"><svg/,
  );
});

test("SignInPanel keeps its markup and adds a split screen with an aside", () => {
  const props = { title: "Sign in", headingLevel: 2 };
  assert.match(html(SignInPanel, props), /^<section class="m-sign-in"/);
  const split = html(SignInPanel, { ...props, aside: media });
  assert.match(
    split,
    /^<div class="m-sign-in-split"><section class="m-sign-in"/,
  );
  assert.match(split, /<div class="m-sign-in-aside"><img src="\/shot.png"/);
});

test("MetricGroup items can show a decorative icon", () => {
  const markup = html(MetricGroup, {
    label: "Summary",
    items: [
      {
        label: "Requests",
        value: "1.4M",
        icon: h("svg", { viewBox: "0 0 1 1" }),
      },
    ],
  });
  assert.match(
    markup,
    /<dt><span class="m-metric-icon" aria-hidden="true"><svg[^>]*><\/svg><\/span>Requests<\/dt>/,
  );
  assert.match(
    html(MetricGroup, { label: "S", items: [{ label: "R", value: "1" }] }),
    /<dt>R<\/dt>/,
  );
});

test("Toast can offer a secondary action", () => {
  const markup = html(Toast, {
    title: "Ana wants to join",
    action: { label: "Accept", onClick() {} },
    secondaryAction: { label: "Decline", onClick() {} },
  });
  assert.ok(markup.indexOf(">Accept<") < markup.indexOf(">Decline<"));
});
