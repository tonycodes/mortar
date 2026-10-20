// Sign-in and registration building blocks: the auth page shell, provider
// buttons and the password and one-time-code fields. See docs/auth-flows.md.
import {
  forwardRef,
  useId,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Button, FieldLabel, type FieldDescription } from "./primitives.js";
import { BrandMark } from "./layout.js";
import { Check, Circle, Eye, EyeOff } from "./icons.js";
import { headingTag, type HeadingLevel } from "./heading.js";
import { FieldFeedback, componentRoot, cx, useField } from "./internal.js";

/** A sign-in provider such as GitHub or Google; the auth SDK handles `onSelect`. */
export interface SignInProvider {
  id: string;
  label: string;
  /** Decorative logo; the label stays the accessible name. */
  icon?: ReactNode;
  onSelect: () => void;
}
export interface ProviderButtonsProps {
  providers: SignInProvider[];
  /** `grid` sets the buttons side by side where they fit, e.g. two short labels. */
  layout?: "list" | "grid";
  /** Names the group of buttons, e.g. "Sign in with". */
  label?: string;
  className?: string;
}
/**
 * One full-width secondary button per sign-in provider. Pair it with a
 * labelled Divider ("or continue with") above or below the email form.
 */
export function ProviderButtons({
  providers,
  layout = "list",
  label,
  className,
}: ProviderButtonsProps) {
  return (
    <div
      {...componentRoot("ProviderButtons")}
      className={cx("m-provider-buttons", className)}
      role={label ? "group" : undefined}
      aria-label={label}
      data-layout={layout === "list" ? undefined : layout}
    >
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          icon={provider.icon}
          onClick={provider.onSelect}
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

/** The logo, heading and description that open an auth panel (internal). */
export function AuthHeader({
  logo,
  title,
  description,
  headingLevel,
  headingId,
  className,
  titleClassName,
}: {
  logo?: ReactNode;
  title: string;
  description?: ReactNode;
  headingLevel: HeadingLevel;
  headingId: string;
  className?: string;
  titleClassName: string;
}) {
  const Heading = headingTag(headingLevel);
  return (
    <header className={className}>
      {logo && <BrandMark logo={logo} />}
      <Heading id={headingId} className={titleClassName}>
        {title}
      </Heading>
      {description && <p>{description}</p>}
    </header>
  );
}

export interface AuthLayoutProps {
  /** The screen's heading, e.g. "Sign in to your account". */
  title: string;
  description?: ReactNode;
  /** Logo node above the heading. */
  logo?: ReactNode;
  /**
   * `center` sets the form on the page, `cards` on a raised card, and `split`
   * beside the `aside` on wide screens.
   */
  layout?: "center" | "cards" | "split";
  /** The page's h1 by default; lower it only when another h1 precedes the layout. */
  headingLevel?: HeadingLevel;
  /** The form. A `<form>` placed directly here stacks its fields, and its direct Button children fill the width. */
  children: ReactNode;
  /** Text under the form, e.g. "Don't have an account? Sign up". */
  footer?: ReactNode;
  /**
   * Image, quote or product art beside the form; shown only with `layout="split"`.
   * On narrow screens text moves below the form and a lone image or video is hidden.
   */
  aside?: ReactNode;
  id?: string;
  className?: string;
}
/**
 * The page shell for sign-in, sign-up, password reset and verification
 * screens. It renders the page's `main` landmark, named by the heading.
 */
export function AuthLayout({
  title,
  description,
  logo,
  layout = "center",
  headingLevel = 1,
  children,
  footer,
  aside,
  id,
  className,
}: AuthLayoutProps) {
  const headingId = useId();
  return (
    <div
      id={id}
      {...componentRoot("AuthLayout")}
      className={cx("m-auth", className)}
      data-layout={layout === "center" ? undefined : layout}
    >
      <main className="m-auth-main" aria-labelledby={headingId}>
        <div className="m-auth-panel">
          <AuthHeader
            className="m-auth-header"
            titleClassName="m-auth-title"
            logo={logo}
            title={title}
            description={description}
            headingLevel={headingLevel}
            headingId={headingId}
          />
          <div className="m-auth-body">{children}</div>
          {footer && <footer className="m-auth-footer">{footer}</footer>}
        </div>
      </main>
      {layout === "split" && aside && (
        <aside className="m-auth-aside">{aside}</aside>
      )}
    </div>
  );
}

export interface PasswordRequirement {
  /** Shown before the password is typed, e.g. "At least 12 characters". */
  label: string;
  met: boolean;
}
export interface PasswordStrength {
  /** 0 (very weak) to 4 (very strong), e.g. from zxcvbn's score. */
  value: 0 | 1 | 2 | 3 | 4;
  /** Visible and announced value, e.g. "Strong". */
  label: string;
}
export interface PasswordInputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, "type">,
    FieldDescription {
  /**
   * `current` (sign-in) sets autocomplete="current-password"; `new` (sign-up,
   * reset) sets "new-password" so password managers offer to generate one.
   */
  purpose?: "current" | "new";
  /** Rules shown under the field from the start, each marked met or not met as the person types. */
  requirements?: PasswordRequirement[];
  /** Strength meter under the field. */
  strength?: PasswordStrength;
  /** Accessible name of the show/hide toggle; its pressed state says whether the password is visible. */
  toggleLabel?: string;
}
/**
 * Password field with a show/hide toggle, optional requirement checklist and
 * strength meter. Paste is never blocked.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      hint,
      error,
      id,
      className,
      purpose = "current",
      requirements,
      strength,
      toggleLabel = "Show password",
      autoComplete,
      ...props
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const requirementsId = useId();
    const { fieldId, messageId, describedBy } = useField({
      id,
      hint,
      error,
      describedBy: props["aria-describedby"],
    });
    const allMet = !!requirements?.length && requirements.every((r) => r.met);
    // The status region speaks only when the overall state flips, not on
    // every keystroke: silent until every rule has been met once.
    const [everMet, setEverMet] = useState(false);
    if (allMet && !everMet) setEverMet(true);
    const status = allMet
      ? "All password requirements met."
      : everMet
        ? "Password no longer meets every requirement."
        : "";
    return (
      <div
        {...componentRoot("PasswordInput")}
        className={cx("m-field", "m-password", className)}
      >
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
        <div className="m-input-group" data-invalid={!!error || undefined}>
          <input
            {...props}
            ref={ref}
            id={fieldId}
            type={visible ? "text" : "password"}
            autoComplete={
              autoComplete ??
              (purpose === "new" ? "new-password" : "current-password")
            }
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={!!error || props["aria-invalid"]}
            aria-describedby={
              [describedBy, requirements?.length && requirementsId]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          <button
            type="button"
            className="m-password-toggle"
            aria-pressed={visible}
            aria-controls={fieldId}
            disabled={props.disabled}
            // A pointer press keeps focus where it was (usually the field).
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff /> : <Eye />}
            <span className="m-sr-only">{toggleLabel}</span>
          </button>
        </div>
        <FieldFeedback id={messageId} hint={hint} error={error} />
        {strength && <StrengthMeter strength={strength} />}
        {requirements && requirements.length > 0 && (
          <>
            <ul
              id={requirementsId}
              className="m-password-requirements"
              aria-label="Password requirements"
            >
              {requirements.map((rule) => (
                <li key={rule.label} data-met={rule.met || undefined}>
                  {rule.met ? <Check /> : <Circle />}
                  <span>{rule.label}</span>
                  <span className="m-sr-only">
                    {rule.met ? ", met" : ", not met"}
                  </span>
                </li>
              ))}
            </ul>
            <p role="status" className="m-sr-only">
              {status}
            </p>
          </>
        )}
      </div>
    );
  },
);

function StrengthMeter({ strength }: { strength: PasswordStrength }) {
  const labelId = useId();
  const value = Math.max(0, Math.min(4, Math.round(strength.value)));
  return (
    <div className="m-password-strength" data-value={value}>
      <span id={labelId} className="m-sr-only">
        Password strength
      </span>
      <div
        className="m-password-meter"
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={value}
        aria-valuetext={strength.label}
      >
        {[1, 2, 3, 4].map((step) => (
          <span key={step} data-on={value >= step || undefined} />
        ))}
      </div>
      <span aria-hidden="true">{strength.label}</span>
    </div>
  );
}

export interface CodeInputProps extends FieldDescription {
  /** Number of characters; one visual cell each. */
  length?: number;
  /** Controlled value; pair with `onChange`. */
  value?: string;
  defaultValue?: string;
  /** The cleaned code after each edit: allowed characters only, at most `length`. */
  onChange?: (value: string) => void;
  /**
   * Called once when the code reaches `length` characters, by typing, paste or
   * autofill. Submitting here is opt-in; without it the person submits the form.
   */
  onComplete?: (code: string) => void;
  /** Accept letters as well as digits (upper-cased); digits only by default. */
  alphanumeric?: boolean;
  /** Id of the input, e.g. the target of an error summary link. */
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}
/**
 * One-time code field: a single input shown as one cell per character, so
 * screen readers, paste and SMS or password-manager autofill all see one
 * field (autocomplete="one-time-code").
 */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(
  function CodeInput(
    {
      label,
      hint,
      error,
      className,
      length = 6,
      value: controlled,
      defaultValue = "",
      onChange,
      onComplete,
      alphanumeric = false,
      id,
      name,
      required,
      disabled,
      autoFocus,
    },
    ref,
  ) {
    const clean = (text: string) =>
      (alphanumeric
        ? text.replace(/[^a-z0-9]/gi, "").toUpperCase()
        : text.replace(/\D/g, "")
      ).slice(0, length);
    const [local, setLocal] = useState(() => clean(defaultValue));
    const value = controlled === undefined ? local : clean(controlled);
    const [focused, setFocused] = useState(false);
    const { fieldId, messageId, describedBy } = useField({ id, hint, error });
    const active = focused ? Math.min(value.length, length - 1) : -1;
    return (
      <div
        {...componentRoot("CodeInput")}
        className={cx("m-field", "m-code-input", className)}
        data-disabled={disabled || undefined}
      >
        <FieldLabel htmlFor={fieldId} label={label} required={required} />
        <div
          className="m-code-control"
          data-invalid={!!error || undefined}
          style={{ "--m-code-length": length } as CSSProperties}
        >
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type="text"
            inputMode={alphanumeric ? "text" : "numeric"}
            autoComplete="one-time-code"
            autoCapitalize={alphanumeric ? "characters" : "off"}
            autoCorrect="off"
            spellCheck={false}
            pattern={
              alphanumeric ? `[A-Za-z0-9]{${length}}` : `[0-9]{${length}}`
            }
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            value={value}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            // Keep the caret after the last character, so typing fills the
            // next cell and Backspace clears the previous one.
            onSelect={(event) => {
              const input = event.currentTarget;
              const end = input.value.length;
              if (
                input.selectionStart === input.selectionEnd &&
                input.selectionStart !== end
              )
                input.setSelectionRange(end, end);
            }}
            onChange={(event) => {
              const next = clean(event.target.value);
              if (controlled === undefined) setLocal(next);
              onChange?.(next);
              if (next !== value && next.length === length) onComplete?.(next);
            }}
          />
          <div className="m-code-cells" aria-hidden="true">
            {Array.from({ length }, (_, index) => (
              <span
                key={index}
                className="m-code-cell"
                data-filled={index < value.length || undefined}
                data-active={index === active || undefined}
              >
                {value[index]}
              </span>
            ))}
          </div>
        </div>
        <FieldFeedback id={messageId} hint={hint} error={error} />
      </div>
    );
  },
);
