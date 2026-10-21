// Sign-in and registration page templates: each step of the flow composed
// from AuthLayout and the auth fields. docs/auth-flows.md maps them out.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import * as UI from "../src/index.js";
import {
  authIcons,
  authLogo,
  passwordRules,
  passwordStrength,
} from "../previews/AuthFixture.js";

/** The demo account every template refers to. */
const EMAIL = "ana@example.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Record<string, string | undefined>;

/**
 * Validation for one form: `validate` shows the field errors, and the form's
 * ErrorSummary lists them with links to their fields. It takes focus after
 * every failed submit (`submitCount`), but not while a fixed field's error
 * clears.
 */
function useValidation(fields: Record<string, string>) {
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const list: UI.ErrorSummaryItem[] = Object.entries(errors)
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([key, message]) => ({ message, target: fields[key] }));
  return {
    errors,
    summary: <UI.ErrorSummary errors={list} submitCount={attempt} />,
    /** Shows the errors; returns true when there are none. */
    validate(next: Errors) {
      setErrors(next);
      const failed = Object.values(next).some(Boolean);
      if (failed) setAttempt((n) => n + 1);
      return !failed;
    },
    /** Clears one field's error once it is fixed. */
    clear(key: string) {
      if (errors[key]) setErrors({ ...errors, [key]: undefined });
    },
  };
}

/** A stand-in for the auth service: resolves after a short delay. */
function useRequest() {
  const [loading, setLoading] = useState(false);
  return {
    loading,
    run(done: () => void) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        done();
      }, 700);
    },
  };
}

/** Seconds left before an action can repeat, counting down once started. */
function useCooldown(seconds: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!left) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, start: () => setLeft(seconds) };
}

function emailError(value: string) {
  if (!value.trim()) return "Enter your email address";
  if (!EMAIL_PATTERN.test(value.trim()))
    return "Enter an email address in the correct format, like name@example.com";
}

const providers = (verb: string): UI.SignInProvider[] => [
  {
    id: "github",
    label: `${verb} with GitHub`,
    icon: authIcons.code,
    onSelect: () => undefined,
  },
  {
    id: "google",
    label: `${verb} with Google`,
    icon: authIcons.globe,
    onSelect: () => undefined,
  },
];

/** Short labels for the side-by-side grid. */
const shortProviders = providers("Sign in").map((provider) => ({
  ...provider,
  label: provider.id === "github" ? "GitHub" : "Google",
}));

/** Email and password sign-in, shared by the card and split templates. */
function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const form = useValidation({
    email: "sign-in-email",
    password: "sign-in-password",
  });
  const request = useRequest();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (request.loading) return;
    setFailed(false);
    if (
      !form.validate({
        email: emailError(email),
        password: password ? undefined : "Enter your password",
      })
    )
      return;
    request.run(() => (password === "wrong" ? setFailed(true) : setDone(true)));
  };
  return (
    <>
      {form.summary}
      <form aria-label="Sign in" noValidate onSubmit={submit}>
        <UI.Notice
          title={
            failed
              ? "That email and password don’t match"
              : done
                ? `Signed in as ${email}`
                : ""
          }
          tone={failed ? "danger" : "success"}
          announce
          className={failed || done ? undefined : "m-sr-only"}
        >
          {failed && (
            <>
              Check them and try again, or{" "}
              <a href="?recipe=forgot-password">reset your password</a>.
            </>
          )}
        </UI.Notice>
        <UI.Input
          id="sign-in-email"
          label="Email address"
          type="email"
          autoComplete="username"
          required
          value={email}
          error={form.errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clear("email");
          }}
        />
        <UI.PasswordInput
          id="sign-in-password"
          label="Password"
          required
          value={password}
          error={form.errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clear("password");
          }}
        />
        <UI.Stack direction="row" justify="between" align="center" wrap>
          <UI.Checkbox label="Remember me" name="remember" />
          <a href="?recipe=forgot-password">Forgot password?</a>
        </UI.Stack>
        <UI.Button type="submit" loading={request.loading}>
          Sign in
        </UI.Button>
      </form>
      <UI.Divider label="or continue with" soft spacing="none" />
      <UI.ProviderButtons layout="grid" providers={shortProviders} />
    </>
  );
}

const signUpLink = (
  <>
    Not a member? <a href="?recipe=sign-up">Create an account</a>
  </>
);

/** Sign in with email and password, on a card. */
export function SignInTemplate() {
  return (
    <UI.AuthLayout
      layout="cards"
      logo={authLogo}
      title="Sign in to your account"
      description="Welcome back to Northwind."
      footer={signUpLink}
    >
      <SignInForm />
    </UI.AuthLayout>
  );
}

/** The same sign-in, split beside a customer quote. */
export function SignInSplitTemplate() {
  return (
    <UI.AuthLayout
      layout="split"
      logo={authLogo}
      title="Sign in to your account"
      description="Welcome back to Northwind."
      footer={signUpLink}
      aside={
        <UI.Testimonial
          quote="We answered twice as many customers in the first month, without hiring anyone new."
          name="Lindsay Walton"
          role="Owner, Wheelhouse Bikes"
        />
      }
    >
      <SignInForm />
    </UI.AuthLayout>
  );
}

/** Create an account: name, email, a new password with its rules, and the terms. */
export function SignUpTemplate() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState(false);
  const form = useValidation({
    name: "sign-up-name",
    email: "sign-up-email",
    password: "sign-up-password",
    terms: "sign-up-terms",
  });
  const request = useRequest();
  const rules = passwordRules(password);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (request.loading) return;
    if (
      !form.validate({
        name: name.trim() ? undefined : "Enter your name",
        email: emailError(email),
        password: !password
          ? "Choose a password"
          : rules.every((rule) => rule.met)
            ? undefined
            : "Choose a password that meets every requirement",
        terms: terms ? undefined : "Agree to the terms to create an account",
      })
    )
      return;
    request.run(() => setDone(true));
  };
  return (
    <UI.AuthLayout
      layout="cards"
      logo={authLogo}
      title="Create your account"
      description="Start your 14-day free trial. No card required."
      footer={
        <>
          Already have an account? <a href="?recipe=sign-in">Sign in</a>
        </>
      }
    >
      {form.summary}
      <form aria-label="Create account" noValidate onSubmit={submit}>
        <UI.Notice
          title={done ? "Account created" : ""}
          tone="success"
          announce
          className={done ? undefined : "m-sr-only"}
        >
          {done && (
            <>
              We sent a code to {email}.{" "}
              <a href="?recipe=verify-email">Verify your email</a>
            </>
          )}
        </UI.Notice>
        <UI.Input
          id="sign-up-name"
          label="Full name"
          autoComplete="name"
          required
          value={name}
          error={form.errors.name}
          onChange={(e) => {
            setName(e.target.value);
            form.clear("name");
          }}
        />
        <UI.Input
          id="sign-up-email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={form.errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clear("email");
          }}
        />
        <UI.PasswordInput
          id="sign-up-password"
          label="Password"
          purpose="new"
          required
          value={password}
          error={form.errors.password}
          requirements={rules}
          strength={passwordStrength(password)}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clear("password");
          }}
        />
        <UI.Checkbox
          id="sign-up-terms"
          required
          checked={terms}
          error={form.errors.terms}
          onChange={(e) => {
            setTerms(e.target.checked);
            form.clear("terms");
          }}
          label={
            <span>
              I agree to the <a href="#terms">terms of service</a> and{" "}
              <a href="#privacy">privacy policy</a>
            </span>
          }
        />
        <UI.Button type="submit" loading={request.loading}>
          Create account
        </UI.Button>
      </form>
      <UI.Divider label="or sign up with" soft spacing="none" />
      <UI.ProviderButtons providers={providers("Sign up")} />
    </UI.AuthLayout>
  );
}

/** Ask for a reset link. The answer never reveals whether the account exists. */
export function ForgotPasswordTemplate() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const form = useValidation({ email: "forgot-email" });
  const request = useRequest();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (request.loading) return;
    if (form.validate({ email: emailError(email) }))
      request.run(() => setSent(true));
  };
  return (
    <UI.AuthLayout
      logo={authLogo}
      title="Reset your password"
      description="Enter the email address you signed up with and we’ll send you a link to choose a new password."
      footer={<a href="?recipe=sign-in">Back to sign in</a>}
    >
      {form.summary}
      <form aria-label="Reset password" noValidate onSubmit={submit}>
        <UI.Notice
          title={sent ? "Check your email" : ""}
          tone="success"
          announce
          className={sent ? undefined : "m-sr-only"}
        >
          {sent && (
            <>
              If an account exists for {email}, you’ll get a link in a few
              minutes. <a href="?recipe=check-email">What happens next</a>
            </>
          )}
        </UI.Notice>
        <UI.Input
          id="forgot-email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={form.errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clear("email");
          }}
        />
        <UI.Button type="submit" loading={request.loading}>
          Send reset link
        </UI.Button>
      </form>
    </UI.AuthLayout>
  );
}

/** Resend, guarded by a cooldown and a limit the server reports. */
function ResendButton({
  label,
  sentMessage,
}: {
  label: string;
  sentMessage: string;
}) {
  const cooldown = useCooldown(30);
  const request = useRequest();
  const [sends, setSends] = useState(0);
  // The server's limit; Mortar shows whatever message the auth service returns.
  const limited = sends >= 3;
  const waiting = cooldown.left > 0 || limited;
  return (
    <UI.Stack gap="sm" align="center">
      <UI.Button
        variant="secondary"
        loading={request.loading}
        aria-disabled={waiting || undefined}
        onClick={() => {
          if (waiting) return;
          request.run(() => {
            setSends((n) => n + 1);
            cooldown.start();
          });
        }}
      >
        {cooldown.left && !limited ? `${label} in ${cooldown.left}s` : label}
      </UI.Button>
      <UI.Text size="sm" color="muted">
        <span role="status">
          {limited
            ? "You’ve asked for a lot of emails. Try again in 10 minutes."
            : sends
              ? sentMessage
              : ""}
        </span>
      </UI.Text>
    </UI.Stack>
  );
}

/** After a link or reset email is sent: what to do next, and resend. */
export function CheckEmailTemplate() {
  return (
    <UI.AuthLayout
      logo={authLogo}
      title="Check your email"
      description={
        <>
          We sent a password reset link to <strong>{EMAIL}</strong>. It expires
          in 30 minutes.
        </>
      }
      footer={
        <>
          Wrong address? <a href="?recipe=forgot-password">Use another email</a>{" "}
          · <a href="?recipe=sign-in">Back to sign in</a>
        </>
      }
    >
      <UI.Text color="muted" size="sm" className="text-center">
        Didn’t get it? Check your spam folder, or send it again.
      </UI.Text>
      <ResendButton label="Resend email" sentMessage="We sent another email." />
    </UI.AuthLayout>
  );
}

/** Choose a new password from a reset link, confirmed by typing it twice. */
export function ResetPasswordTemplate() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const form = useValidation({
    password: "reset-password",
    confirm: "reset-confirm",
  });
  const request = useRequest();
  const rules = passwordRules(password);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (request.loading) return;
    if (
      !form.validate({
        password: !password
          ? "Enter a new password"
          : rules.every((rule) => rule.met)
            ? undefined
            : "Choose a password that meets every requirement",
        confirm: !confirm
          ? "Confirm your new password"
          : confirm === password
            ? undefined
            : "The passwords don’t match",
      })
    )
      return;
    request.run(() => setDone(true));
  };
  return (
    <UI.AuthLayout
      layout="cards"
      logo={authLogo}
      title="Choose a new password"
      description={
        <>
          For <strong>{EMAIL}</strong>.
        </>
      }
      footer={<a href="?recipe=sign-in">Back to sign in</a>}
    >
      {form.summary}
      <form aria-label="Choose a new password" noValidate onSubmit={submit}>
        {/* Lets password managers save the new password against the account. */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={EMAIL}
          readOnly
          hidden
        />
        <UI.Notice
          title={done ? "Password updated" : ""}
          tone="success"
          announce
          className={done ? undefined : "m-sr-only"}
        >
          {done && (
            <>
              Other devices have been signed out.{" "}
              <a href="?recipe=sign-in">Sign in</a>
            </>
          )}
        </UI.Notice>
        <UI.PasswordInput
          id="reset-password"
          label="New password"
          purpose="new"
          required
          value={password}
          error={form.errors.password}
          requirements={rules}
          strength={passwordStrength(password)}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clear("password");
          }}
        />
        <UI.PasswordInput
          id="reset-confirm"
          label="Confirm new password"
          purpose="new"
          required
          value={confirm}
          error={form.errors.confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            form.clear("confirm");
          }}
        />
        <UI.Button type="submit" loading={request.loading}>
          Update password
        </UI.Button>
      </form>
    </UI.AuthLayout>
  );
}

/** A one-time code form with a server check; "000000" stands in for a wrong code. */
function useCodeForm(id: string, length: number) {
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const form = useValidation({ code: id });
  const request = useRequest();
  const submit = (value = code) => {
    if (request.loading) return;
    if (
      !form.validate({
        code:
          value.length === length
            ? undefined
            : `Enter all ${length} characters of the code`,
      })
    )
      return;
    request.run(() => {
      if (/^0+$/.test(value))
        form.validate({
          code: "That code is incorrect or has expired. Check it, or ask for a new one.",
        });
      else setDone(true);
    });
  };
  return { code, setCode, done, form, request, submit };
}

/** Confirm an email address with the code sent to it. */
export function VerifyEmailTemplate() {
  const { code, setCode, done, form, request, submit } = useCodeForm(
    "verify-code",
    6,
  );
  return (
    <UI.AuthLayout
      logo={authLogo}
      title="Verify your email"
      description={
        <>
          We sent a 6-digit code to <strong>{EMAIL}</strong>. It expires in 10
          minutes.
        </>
      }
      footer={
        <>
          Wrong address? <a href="?recipe=sign-up">Change your email</a>
        </>
      }
    >
      {form.summary}
      <form
        aria-label="Verify your email"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <UI.Notice
          title={done ? "Email verified" : ""}
          tone="success"
          announce
          className={done ? undefined : "m-sr-only"}
        >
          {done && <a href="?recipe=sign-in">Continue to sign in</a>}
        </UI.Notice>
        <UI.CodeInput
          id="verify-code"
          label="Verification code"
          required
          value={code}
          error={form.errors.code}
          onChange={(value) => {
            setCode(value);
            form.clear("code");
          }}
        />
        <UI.Button type="submit" loading={request.loading}>
          Verify email
        </UI.Button>
      </form>
      <ResendButton label="Resend code" sentMessage="We sent a new code." />
    </UI.AuthLayout>
  );
}

/** Second step of sign-in: an authenticator code, or a recovery code instead. */
export function TwoFactorTemplate() {
  const [recovery, setRecovery] = useState(false);
  const app = useCodeForm("two-factor-code", 6);
  const backup = useCodeForm("two-factor-recovery", 8);
  const current = recovery ? backup : app;
  const switchMode = () => {
    setRecovery(!recovery);
    // Move to the field that replaced the one the person was using.
    requestAnimationFrame(() =>
      document
        .getElementById(recovery ? "two-factor-code" : "two-factor-recovery")
        ?.focus(),
    );
  };
  let field: ReactNode;
  if (recovery)
    field = (
      <UI.CodeInput
        id="two-factor-recovery"
        label="Recovery code"
        hint="One of the 8-character codes you saved when you turned on two-factor authentication. Each code works once."
        alphanumeric
        length={8}
        required
        value={backup.code}
        error={backup.form.errors.code}
        onChange={(value) => {
          backup.setCode(value);
          backup.form.clear("code");
        }}
      />
    );
  else
    field = (
      <UI.CodeInput
        id="two-factor-code"
        label="Authentication code"
        hint="Open your authenticator app for the 6-digit code. We check it as soon as it is complete."
        required
        value={app.code}
        error={app.form.errors.code}
        onChange={(value) => {
          app.setCode(value);
          app.form.clear("code");
        }}
        // Explicit opt-in: a full code submits without pressing the button.
        onComplete={(value) => app.submit(value)}
      />
    );
  return (
    <UI.AuthLayout
      logo={authLogo}
      title="Two-factor authentication"
      description={
        recovery
          ? "Enter a recovery code to sign in."
          : "Enter the code from your authenticator app."
      }
      footer={
        <>
          Lost access to your codes? <a href="#support">Contact support</a>
        </>
      }
    >
      {current.form.summary}
      <form
        aria-label="Two-factor authentication"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          current.submit();
        }}
      >
        <UI.Notice
          title={current.done ? "Signed in" : ""}
          tone="success"
          announce
          className={current.done ? undefined : "m-sr-only"}
        />
        {field}
        <UI.Button type="submit" loading={current.request.loading}>
          Verify
        </UI.Button>
      </form>
      <UI.Button variant="ghost" onClick={switchMode}>
        {recovery ? "Use your authenticator app" : "Use a recovery code"}
      </UI.Button>
    </UI.AuthLayout>
  );
}
