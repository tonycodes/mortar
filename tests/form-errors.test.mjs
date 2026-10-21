import test from "node:test";
import assert from "node:assert/strict";
import {
  html,
  Checkbox,
  Switch,
  RadioGroup,
  ErrorSummary,
} from "./support/render.mjs";

test("Checkbox, Switch and RadioGroup keep their markup when the new props are unused", () => {
  assert.equal(
    html(Checkbox, { label: "Remember me" }),
    '<label data-m-component="Checkbox" class="m-choice"><input type="checkbox"/>Remember me</label>',
  );
  assert.equal(
    html(Checkbox, { label: "Comments", description: "Notify me", id: "c" }),
    '<div data-m-component="Checkbox" class="m-choice m-choice-described"><input id="c" aria-describedby="c-description" type="checkbox"/><div class="m-choice-text"><label for="c">Comments</label><p id="c-description">Notify me</p></div></div>',
  );
  assert.equal(
    html(Switch, { label: "Billing", description: "Yearly", id: "s" }),
    '<div data-m-component="Switch" class="m-choice m-choice-described"><input id="s" aria-describedby="s-description" type="checkbox" role="switch" class="m-switch"/><div class="m-choice-text"><label for="s">Billing</label><p id="s-description">Yearly</p></div></div>',
  );
  assert.equal(
    html(RadioGroup, {
      label: "Plan",
      name: "plan",
      value: "a",
      onChange() {},
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B", description: "More" },
      ],
    }),
    '<fieldset data-m-component="RadioGroup" class="m-radio-group"><legend>Plan</legend><label class="m-radio-card"><input type="radio" name="plan" checked="" value="a"/><span><strong>A</strong></span></label><label class="m-radio-card"><input type="radio" name="plan" value="b"/><span><strong>B</strong><span>More</span></span></label></fieldset>',
  );
});

test("Checkbox error is announced, linked with the description and marks the box invalid", () => {
  const markup = html(Checkbox, {
    id: "terms",
    label: "I agree",
    description: "Read them first",
    error: "Agree to continue",
    required: true,
    "aria-describedby": "external",
  });
  assert.match(
    markup,
    /<input id="terms" required="" aria-describedby="external terms-description terms-message" aria-invalid="true" type="checkbox"\/>/,
  );
  assert.match(
    markup,
    /<label for="terms">I agree<span class="m-required" aria-hidden="true">\*<\/span><\/label>/,
  );
  assert.match(
    markup,
    /<p id="terms-description">Read them first<\/p><p id="terms-message" class="m-error" role="alert">Agree to continue<\/p>/,
  );
  // Without a description the error alone describes the box.
  const plain = html(Checkbox, { id: "t", label: "Agree", error: "Required" });
  assert.match(plain, /aria-describedby="t-message"/);
  assert.match(plain, /^<div data-m-component="Checkbox"/);
  // Required alone keeps the wrapping label and adds the decorative marker.
  assert.equal(
    html(Checkbox, { label: "Agree", required: true }),
    '<label data-m-component="Checkbox" class="m-choice"><input required="" type="checkbox"/>Agree<span class="m-required" aria-hidden="true">*</span></label>',
  );
});

test("RadioGroup error and hint follow the fieldset and legend pattern", () => {
  const props = {
    id: "plan",
    label: "Plan",
    name: "plan",
    value: "",
    onChange() {},
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  };
  const invalid = html(RadioGroup, {
    ...props,
    required: true,
    hint: "Pick one",
    error: "Choose a plan",
  });
  const messageId = invalid.match(/<p id="([^"]+)" class="m-error"/)?.[1];
  assert.ok(messageId, invalid);
  assert.match(
    invalid,
    new RegExp(
      `^<fieldset data-m-component="RadioGroup" class="m-radio-group" id="plan" aria-describedby="${messageId}" data-invalid="true"><legend>Plan<span class="m-required" aria-hidden="true">\\*</span></legend><p id="${messageId}" class="m-error" role="alert">Choose a plan</p>`,
    ),
  );
  assert.equal(
    invalid.match(/<input [^>]*required="" aria-invalid="true"/g)?.length,
    2,
  );
  const hinted = html(RadioGroup, { ...props, hint: "Pick one" });
  const hintId = hinted.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.match(hinted, new RegExp(`<p id="${hintId}">Pick one</p>`));
  assert.doesNotMatch(hinted, /aria-invalid|role="alert"|data-invalid/);
});

test("ErrorSummary renders nothing without errors", () => {
  assert.equal(html(ErrorSummary, { errors: [] }), "");
});

test("ErrorSummary is a focusable alert, named by its heading, linking to each field", () => {
  const markup = html(ErrorSummary, {
    errors: [
      { message: "Enter your email address", target: "email" },
      { message: "Choose a plan", href: "#plan" },
      { message: "Update your card", href: "/billing" },
      { message: "The service is unavailable" },
    ],
  });
  const titleId = markup.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(titleId, markup);
  assert.match(
    markup,
    new RegExp(
      `^<div data-m-component="ErrorSummary" class="m-error-summary" role="alert" aria-labelledby="${titleId}" tabindex="-1"><h2 id="${titleId}" class="m-error-summary-title">There is a problem</h2><ul>`,
    ),
  );
  assert.match(
    markup,
    /<li><a href="#email">Enter your email address<\/a><\/li><li><a href="#plan">Choose a plan<\/a><\/li><li><a href="\/billing">Update your card<\/a><\/li><li>The service is unavailable<\/li><\/ul><\/div>$/,
  );
});

test("ErrorSummary takes a title, heading level, id and className", () => {
  const markup = html(ErrorSummary, {
    title: "Fix 1 problem",
    headingLevel: 3,
    id: "problems",
    className: "mb-4",
    errors: [{ message: "Enter a name", target: "name" }],
  });
  assert.match(
    markup,
    /^<div id="problems" data-m-component="ErrorSummary" class="m-error-summary mb-4"/,
  );
  assert.match(
    markup,
    /<h3 id="[^"]+" class="m-error-summary-title">Fix 1 problem<\/h3>/,
  );
});
