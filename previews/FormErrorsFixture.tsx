import { useState, type FormEvent, type ReactNode } from "react";
import * as UI from "../src/index.js";
import { StateFixture } from "./StateFixture.js";

/**
 * A form that fails its first check: the summary is shown as after a failed
 * submit, but takes focus only once the person submits (never on page load).
 */
function ErrorSummaryExample() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [terms, setTerms] = useState(false);
  const check = () => ({
    email: email.trim() ? undefined : "Enter your email address",
    plan: plan ? undefined : "Choose a plan",
    terms: terms ? undefined : "Agree to the terms to continue",
  });
  const [errors, setErrors] =
    useState<Record<string, string | undefined>>(check);
  const [submitCount, setSubmitCount] = useState(0);
  const [sent, setSent] = useState(false);
  const ids: Record<string, string> = {
    email: "demo-email",
    plan: "demo-plan",
    terms: "demo-terms",
  };
  const summary = Object.entries(errors)
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([key, message]) => ({ message, target: ids[key] }));
  const clear = (key: string) => {
    setSent(false);
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = check();
    setErrors(next);
    if (Object.values(next).some(Boolean)) setSubmitCount((n) => n + 1);
    else setSent(true);
  };
  return (
    <UI.Stack gap="lg">
      <UI.ErrorSummary
        errors={summary}
        submitCount={submitCount}
        autoFocus={submitCount > 0}
      />
      <form aria-label="Book a demo" noValidate onSubmit={submit}>
        <UI.Stack gap="lg">
          <UI.Input
            id="demo-email"
            label="Work email"
            type="email"
            autoComplete="email"
            required
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              clear("email");
            }}
          />
          <UI.RadioGroup
            id="demo-plan"
            label="Plan"
            name="demo-plan"
            required
            value={plan}
            hint="You can change plan at any time."
            error={errors.plan}
            onChange={(value) => {
              setPlan(value);
              clear("plan");
            }}
            options={[
              { value: "team", label: "Team", description: "Up to 10 people" },
              {
                value: "business",
                label: "Business",
                description: "Unlimited people",
              },
            ]}
          />
          <UI.Checkbox
            id="demo-terms"
            label="I agree to the terms of service"
            required
            checked={terms}
            error={errors.terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              clear("terms");
            }}
          />
          <div>
            <UI.Button type="submit">Book demo</UI.Button>
          </div>
          <output aria-label="Form result">{sent ? "Booked" : ""}</output>
        </UI.Stack>
      </form>
    </UI.Stack>
  );
}

export function FormErrorsCase({ name }: { name: string }) {
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "ErrorSummary":
      example = <ErrorSummaryExample />;
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
