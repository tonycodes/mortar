// Sign-in and registration building blocks: markup, ARIA and autocomplete.
import test from "node:test";
import assert from "node:assert/strict";
import { h, html, UI } from "./support/render.mjs";

const noop = () => {};
const github = { id: "github", label: "Continue with GitHub", onSelect: noop };

test("PasswordInput: purpose sets autocomplete; the toggle is a pressed-state button", () => {
  const current = html(UI.PasswordInput, { label: "Password", required: true });
  assert.match(
    current,
    /^<div data-m-component="PasswordInput" class="m-field m-password"><label for="([^"]+)">Password<span class="m-required" aria-hidden="true">\*<\/span><\/label>/,
  );
  assert.match(current, /type="password" autoComplete="current-password"/);
  assert.match(current, / required=""/);
  const id = current.match(/<label for="([^"]+)"/)[1];
  assert.match(
    current,
    new RegExp(
      `<button type="button" class="m-password-toggle" aria-pressed="false" aria-controls="${id}"><svg[^>]*aria-hidden="true"`,
    ),
  );
  assert.match(
    current,
    /<span class="m-sr-only">Show password<\/span><\/button>/,
  );
  // No checklist or live region without requirements.
  assert.doesNotMatch(current, /role="status"|m-password-requirements/);
  const created = html(UI.PasswordInput, { label: "Password", purpose: "new" });
  assert.match(created, /autoComplete="new-password"/);
  // An explicit autocomplete wins, e.g. a one-time password field.
  assert.match(
    html(UI.PasswordInput, { label: "P", autoComplete: "off" }),
    /autoComplete="off"/,
  );
  assert.match(
    html(UI.PasswordInput, { label: "P", toggleLabel: "Afficher" }),
    /<span class="m-sr-only">Afficher<\/span>/,
  );
  assert.match(
    html(UI.PasswordInput, { label: "P", disabled: true }),
    /aria-controls="[^"]+" disabled=""/,
  );
});

test("PasswordInput: requirements describe the field and say met or not met", () => {
  const markup = html(UI.PasswordInput, {
    label: "New password",
    purpose: "new",
    hint: "Use a passphrase.",
    requirements: [
      { label: "At least 12 characters", met: true },
      { label: "A number", met: false },
    ],
  });
  const list = markup.match(
    /<ul id="([^"]+)" class="m-password-requirements" aria-label="Password requirements">/,
  );
  assert.ok(list, "named requirements list");
  const message = markup.match(/<p id="([^"]+)">Use a passphrase.<\/p>/)[1];
  assert.match(markup, new RegExp(`aria-describedby="${message} ${list[1]}"`));
  assert.match(
    markup,
    /<li data-met="true"><svg[^>]*>.*?<\/svg><span>At least 12 characters<\/span><span class="m-sr-only">, met<\/span><\/li>/,
  );
  assert.match(
    markup,
    /<li><svg[^>]*>.*?<\/svg><span>A number<\/span><span class="m-sr-only">, not met<\/span><\/li>/,
  );
  // The status region is mounted (empty) before every rule is met.
  assert.match(markup, /<p role="status" class="m-sr-only"><\/p>/);
});

test("PasswordInput: error is announced and marks the field invalid", () => {
  const markup = html(UI.PasswordInput, {
    label: "Password",
    error: "Enter your password",
  });
  assert.match(markup, /<div class="m-input-group" data-invalid="true">/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(
    markup,
    /<p id="[^"]+" class="m-error" role="alert">Enter your password<\/p>/,
  );
});

test("PasswordInput: the strength meter is a named meter with the label as its value", () => {
  const markup = html(UI.PasswordInput, {
    label: "Password",
    strength: { value: 3, label: "Strong" },
  });
  assert.match(
    markup,
    /<div class="m-password-strength" data-value="3"><span id="([^"]+)" class="m-sr-only">Password strength<\/span><div class="m-password-meter" role="meter" aria-labelledby="\1" aria-valuemin="0" aria-valuemax="4" aria-valuenow="3" aria-valuetext="Strong">/,
  );
  assert.equal((markup.match(/data-on="true"/g) || []).length, 3);
  assert.match(markup, /<span aria-hidden="true">Strong<\/span>/);
});

test("CodeInput: one labelled one-time-code input drawn as aria-hidden cells", () => {
  const markup = html(UI.CodeInput, {
    label: "Verification code",
    hint: "Sent to ana@example.com",
    defaultValue: "12-3",
    id: "code",
    name: "code",
    required: true,
  });
  assert.match(
    markup,
    /^<div data-m-component="CodeInput" class="m-field m-code-input"><label for="code">Verification code<span class="m-required" aria-hidden="true">\*<\/span><\/label><div class="m-code-control" style="--m-code-length:6">/,
  );
  assert.equal((markup.match(/<input/g) || []).length, 1);
  assert.match(
    markup,
    /<input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" autoCapitalize="off" autoCorrect="off" spellCheck="false" pattern="\[0-9\]\{6\}" required="" aria-describedby="code-message" name="code" value="123"\/>/,
  );
  assert.match(markup, /<div class="m-code-cells" aria-hidden="true">/);
  assert.equal((markup.match(/class="m-code-cell"/g) || []).length, 6);
  assert.equal((markup.match(/data-filled="true"/g) || []).length, 3);
  assert.doesNotMatch(markup, /maxLength/i);
});

test("CodeInput: alphanumeric codes, custom length, controlled value and errors", () => {
  const markup = html(UI.CodeInput, {
    label: "Recovery code",
    alphanumeric: true,
    length: 8,
    value: "ab12 cd34 ef",
    error: "That code has expired",
  });
  assert.match(markup, /inputMode="text"/);
  assert.match(markup, /autoCapitalize="characters"/);
  assert.match(markup, /pattern="\[A-Za-z0-9\]\{8\}"/);
  assert.match(markup, /value="AB12CD34"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /<div class="m-code-control" data-invalid="true"/);
  assert.match(markup, /class="m-error" role="alert">That code has expired</);
  assert.match(
    html(UI.CodeInput, { label: "C", disabled: true }),
    /data-disabled="true"[\s\S]*disabled=""/,
  );
});

test("ProviderButtons: a secondary button per provider, optionally a named group", () => {
  const markup = html(UI.ProviderButtons, {
    providers: [
      github,
      { ...github, id: "g2", label: "Google", icon: h("svg") },
    ],
  });
  assert.match(
    markup,
    /^<div data-m-component="ProviderButtons" class="m-provider-buttons"><button data-m-component="Button" type="button" class="m-button m-button-secondary">Continue with GitHub<\/button>/,
  );
  assert.match(
    markup,
    /<span class="m-button-icon" aria-hidden="true"><svg><\/svg><\/span>Google/,
  );
  assert.match(
    html(UI.ProviderButtons, {
      providers: [github],
      label: "Sign in with",
      layout: "grid",
    }),
    /^<div data-m-component="ProviderButtons" class="m-provider-buttons" role="group" aria-label="Sign in with" data-layout="grid">/,
  );
});

test("AuthLayout: main named by an h1, layouts and the split aside", () => {
  const markup = html(
    UI.AuthLayout,
    {
      title: "Sign in to your account",
      description: "Welcome back.",
      logo: h("svg"),
      footer: "No account?",
    },
    h("form", null, "Fields"),
  );
  assert.match(
    markup,
    /^<div data-m-component="AuthLayout" class="m-auth"><main class="m-auth-main" aria-labelledby="([^"]+)"><div class="m-auth-panel"><header class="m-auth-header"><span class="m-logo" aria-hidden="true"><svg><\/svg><\/span><h1 id="\1" class="m-auth-title">Sign in to your account<\/h1><p>Welcome back.<\/p><\/header><div class="m-auth-body"><form>Fields<\/form><\/div><footer class="m-auth-footer">No account\?<\/footer><\/div><\/main><\/div>$/,
  );
  assert.match(
    html(UI.AuthLayout, { title: "T", headingLevel: 2 }),
    /<h2 id="[^"]+" class="m-auth-title">T<\/h2>/,
  );
  assert.match(
    html(UI.AuthLayout, { title: "T", layout: "cards" }),
    /^<div data-m-component="AuthLayout" class="m-auth" data-layout="cards">/,
  );
  const split = html(UI.AuthLayout, {
    title: "T",
    layout: "split",
    aside: h("img", { src: "/a.png", alt: "" }),
  });
  assert.match(split, /data-layout="split"/);
  assert.match(
    split,
    /<\/main><aside class="m-auth-aside"><img src="\/a.png" alt=""\/><\/aside><\/div>$/,
  );
  // The aside belongs to the split layout only.
  assert.doesNotMatch(
    html(UI.AuthLayout, { title: "T", aside: "Quote" }),
    /m-auth-aside/,
  );
});

test("SignInPanel composes ProviderButtons and a labelled Divider", () => {
  const markup = html(UI.SignInPanel, {
    title: "Sign in",
    providers: [{ ...github, icon: h("svg") }],
    email: { onSubmit: noop },
    dividerLabel: "or continue with",
  });
  assert.match(
    markup,
    /<\/header><div data-m-component="ProviderButtons" class="m-provider-buttons"><button data-m-component="Button" type="button" class="m-button m-button-secondary"><span class="m-button-icon" aria-hidden="true"><svg><\/svg><\/span>Continue with GitHub<\/button><\/div><div data-m-component="Divider" class="m-divider" data-soft="true" data-spacing="none" role="separator" aria-label="or continue with"><span aria-hidden="true">or continue with<\/span><\/div><form/,
  );
  // No divider without both providers and the email form.
  assert.doesNotMatch(
    html(UI.SignInPanel, { title: "S", providers: [github] }),
    /m-divider/,
  );
});
