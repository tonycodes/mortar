import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for the sign-in and registration building blocks; the page templates reuse the helpers. */

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const authIcons = {
  code: icon("M8 8l-4 4 4 4M16 8l4 4-4 4"),
  globe: icon(
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  ),
  key: icon("M15 9a3 3 0 1 0 0-.01M13 11l-9 9M7 17l2 2M10 14l2 2"),
};

/** A neutral demo mark in the brand colour. */
export const authLogo = (
  <svg viewBox="0 0 32 32" className="text-primary">
    <rect width="32" height="32" rx="8" fill="currentColor" />
    <path
      d="M10 21V11l6 6 6-6v10"
      fill="none"
      stroke="var(--m-on-primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Password rules shown up front and checked as the person types. */
export function passwordRules(value: string): UI.PasswordRequirement[] {
  return [
    { label: "At least 12 characters", met: value.length >= 12 },
    {
      label: "Upper and lower case letters",
      met: /[a-z]/.test(value) && /[A-Z]/.test(value),
    },
    { label: "A number or symbol", met: /[^A-Za-z]/.test(value) },
  ];
}
/** A rough demo score; use a real estimator such as zxcvbn in a product. */
export function passwordStrength(value: string): UI.PasswordStrength {
  const score = Math.min(
    4,
    passwordRules(value).filter((rule) => rule.met).length +
      (value.length >= 16 ? 1 : 0),
  ) as UI.PasswordStrength["value"];
  return {
    value: value ? score : 0,
    label: value
      ? ["Very weak", "Weak", "Fair", "Strong", "Very strong"][score]
      : "Not entered",
  };
}

export function AuthCase({ name }: { name: string }) {
  const [password, setPassword] = useState(""),
    [created, setCreated] = useState(""),
    [code, setCode] = useState(""),
    [completed, setCompleted] = useState("none"),
    [recovery, setRecovery] = useState(""),
    [selected, setSelected] = useState("none");
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "PasswordInput":
      example = (
        <UI.Stack gap="xl" className="max-w-sm">
          <UI.PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <UI.PasswordInput
            label="New password"
            purpose="new"
            required
            value={created}
            onChange={(e) => setCreated(e.target.value)}
            requirements={passwordRules(created)}
            strength={passwordStrength(created)}
          />
        </UI.Stack>
      );
      break;
    case "CodeInput":
      example = (
        <UI.Stack gap="xl">
          <UI.CodeInput
            label="Verification code"
            hint="Enter the 6-digit code we sent to ana@example.com."
            value={code}
            onChange={setCode}
            onComplete={setCompleted}
          />
          <output aria-label="Completed code">{completed}</output>
          <UI.CodeInput
            label="Recovery code"
            hint="One of the 8-character codes you saved when you set up two-factor authentication."
            alphanumeric
            length={8}
            value={recovery}
            onChange={setRecovery}
          />
        </UI.Stack>
      );
      break;
    case "ProviderButtons":
      example = (
        <UI.Stack gap="xl" className="max-w-sm">
          <UI.ProviderButtons
            label="Sign in with"
            providers={[
              {
                id: "github",
                label: "Continue with GitHub",
                icon: authIcons.code,
                onSelect: () => setSelected("github"),
              },
              {
                id: "google",
                label: "Continue with Google",
                icon: authIcons.globe,
                onSelect: () => setSelected("google"),
              },
            ]}
          />
          <UI.Divider label="or continue with" soft spacing="none" />
          <UI.ProviderButtons
            layout="grid"
            providers={[
              {
                id: "github",
                label: "GitHub",
                icon: authIcons.code,
                onSelect: () => setSelected("github"),
              },
              {
                id: "sso",
                label: "SSO",
                icon: authIcons.key,
                onSelect: () => setSelected("sso"),
              },
            ]}
          />
          <output aria-label="Chosen provider">{selected}</output>
        </UI.Stack>
      );
      break;
    case "AuthLayout":
      example = (
        <UI.AuthLayout
          layout="cards"
          logo={authLogo}
          title="Sign in to your account"
          description="Welcome back to Northwind."
          footer={
            <>
              Not a member? <a href="#sign-up">Start a 14-day free trial</a>
            </>
          }
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <UI.Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
            />
            <UI.PasswordInput label="Password" required />
            <UI.Stack direction="row" justify="between" wrap>
              <UI.Checkbox label="Remember me" name="remember" />
              <a href="#forgot">Forgot password?</a>
            </UI.Stack>
            <UI.Button type="submit">Sign in</UI.Button>
          </form>
          <UI.Divider label="or continue with" soft spacing="none" />
          <UI.ProviderButtons
            layout="grid"
            providers={[
              {
                id: "github",
                label: "GitHub",
                icon: authIcons.code,
                onSelect: () => setSelected("github"),
              },
              {
                id: "google",
                label: "Google",
                icon: authIcons.globe,
                onSelect: () => setSelected("google"),
              },
            ]}
          />
        </UI.AuthLayout>
      );
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return <div className="m-stack">{example}</div>;
}
