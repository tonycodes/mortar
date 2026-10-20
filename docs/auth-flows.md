# Sign-in and registration flows

Every auth screen is a page of its own, built from the same parts:

- **AuthLayout** is the page. It renders the `main` landmark and the page's `h1`, with an optional logo, description and footer link. `layout="center"` sets the form on the page, `layout="cards"` on a raised card, and `layout="split"` beside an `aside` (a quote or image) on wide screens.
- **ProviderButtons** lists sign-in providers (GitHub, Google, SSO). Separate them from the email form with `<Divider label="or continue with" soft spacing="none" />`.
- **PasswordInput** is every password field: a show/hide toggle, the right `autocomplete`, an optional requirement checklist and a strength meter.
- **CodeInput** is every one-time code: one input drawn as a cell per character.
- **Input**, **Checkbox**, **Button** and **Notice** do the rest. Submit buttons use `loading` while the request runs.

AuthLayout is a standalone page: do not put it inside AppShell or MarketingHeader. For a passwordless sign-in section inside another page (an emailed link plus providers), use **SignInPanel** with `headingLevel={2}`.

A `<form>` placed directly in AuthLayout stacks its fields, and its direct Button children fill the width. Give each form an accessible name (`aria-label="Sign in"`), and set `noValidate` when you show your own errors.

## Steps

The playground has a page template for each step (`?recipe=<id>`).

| Step             | Template                   | Components                                                                                                                                       | Fields and `autocomplete`                                                                                                                                                      |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sign in          | `sign-in`, `sign-in-split` | AuthLayout, Input, PasswordInput, Checkbox ("Remember me"), a "Forgot password?" link, Divider, ProviderButtons; footer links to sign-up         | Email: `type="email" autoComplete="username"`. Password: `PasswordInput` (default `purpose="current"`, `current-password`)                                                     |
| Sign up          | `sign-up`                  | AuthLayout, Input, PasswordInput with `requirements` and `strength`, Checkbox for the terms with links, ProviderButtons; footer links to sign-in | Name: `autoComplete="name"`. Email: `type="email" autoComplete="email"`. Password: `purpose="new"` (`new-password`)                                                            |
| Forgot password  | `forgot-password`          | AuthLayout, Input, Button, a success Notice                                                                                                      | Email: `type="email" autoComplete="email"`                                                                                                                                     |
| Check your email | `check-email`              | AuthLayout, Text, a resend Button with a cooldown                                                                                                | none                                                                                                                                                                           |
| Reset password   | `reset-password`           | AuthLayout, two PasswordInputs, Button                                                                                                           | Both `purpose="new"`. Add a hidden `<input type="email" autoComplete="username" value={email} readOnly hidden>` so password managers save the new password against the account |
| Verify email     | `verify-email`             | AuthLayout, CodeInput, Button, a resend Button with a countdown, a "Change your email" link                                                      | `CodeInput` (`one-time-code`, `inputmode="numeric"`)                                                                                                                           |
| Two-factor       | `two-factor`               | AuthLayout, CodeInput, Button, a ghost Button that switches to a recovery code                                                                   | Authenticator: `CodeInput`. Recovery: `CodeInput alphanumeric length={8}`                                                                                                      |

## Validation and errors

- Validate on submit, not while the person is still typing. Clear a field's error as soon as they change it.
- Show each error under its field (`error` on Input, PasswordInput and CodeInput: the field is marked `aria-invalid` and the message is announced).
- When a submit fails, also show an error summary above the form: a `Notice tone="danger" announce` titled "There is a problem", with a link to each field. Move focus to it, so keyboard and screen reader users start from the list. The templates show the pattern.
- Messages say what to do: "Enter your email address", "Enter an email address in the correct format, like name@example.com", "The passwords don't match".
- Errors from the server (wrong password, expired code) go in the same places: a form-level Notice for credentials, the field's `error` for a code.
- Confirm success with a Notice whose title changes from empty (`announce`, kept mounted), or by moving to the next step.

## Passwords

- **Show every rule up front.** Pass every rule the server enforces as `requirements`, before the person types. Never reveal a rule only after a failed submit.
- Requirements update on each keystroke visually, but are announced only when the whole set becomes met (or stops being met), not on every key.
- Use a real strength estimator (for example zxcvbn) for `strength`; the playground's scoring is a stand-in.
- **Never block paste**, and never disable autocomplete on password fields. Password managers and pasting from them are the safest way to use long, unique passwords.
- Do not cap password length below 64 characters, or forbid characters such as spaces.
- For a confirm field, use a second `PasswordInput purpose="new"` and check that the values match on submit.

## One-time codes

- Use one `CodeInput`, never one input per digit: separate inputs break screen readers, paste and SMS or password-manager autofill.
- Pasting a formatted code (`123 456`, `123-456`) works: `onChange` receives only the allowed characters.
- **Do not submit automatically unless you mean to.** `onComplete` is opt-in: pass it only when a full code should submit at once (the two-factor template does, and says so in the hint). Otherwise the person presses the button.
- Say where the code went ("We sent a 6-digit code to ana@example.com") and how long it lasts. Offer resend, a way to change the address, and a fallback such as a recovery code.
- **Never log codes, or store them in analytics, URLs or local storage.** Treat a code like a password.

## Security notes

- **Do not reveal whether an account exists.** "If an account exists for that address, you'll get a link" — on forgot-password, sign-up conflicts and resend.
- **Rate limits come from the server.** Show its message in the page ("You've asked for a lot of emails. Try again in 10 minutes.") with a Notice, a field `error` or the resend status, and keep the action `aria-disabled` while it applies, so focus stays on it. Mortar has no built-in limit: pass whatever your auth service returns.
- Resend buttons count down before they can be used again (the templates use 30 seconds). Use `aria-disabled` rather than `disabled`, so a focused button keeps focus.
- After a password reset, sign out other sessions and say so.
- Provider buttons call your auth SDK through `onSelect`; Mortar renders no redirects and holds no credentials.

## Accessibility checklist

- One `h1` per page (AuthLayout's `title`) and one `main`.
- Every field has a visible label; hints and errors are linked with `aria-describedby`.
- The password toggle is a button named "Show password" with `aria-pressed`; it never steals focus from the field.
- Links in AuthLayout's text are underlined, so they do not rely on colour.
- Focus moves only in response to the person: to the error summary after a failed submit, to the new field when switching to a recovery code. Do not autofocus on page load.
- On narrow screens, `layout="split"` puts a text aside after the form and hides an aside that is only an image or video.
