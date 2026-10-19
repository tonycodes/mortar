import { useState, type ReactNode } from "react";
import { Button, Tabs } from "./primitives.js";
import { FieldFeedback, componentRoot, cx, useField } from "./internal.js";

/** Characters left at which the count starts being announced. */
const nearLimit = (maxLength: number) =>
  Math.max(10, Math.ceil(maxLength * 0.1));

/** Comment box with optional avatar, toolbar, Write/Preview tabs and a character count. */
export function CommentComposer({
  onSubmit,
  value: controlled,
  onChange,
  label = "Add your comment",
  labelVisible = false,
  placeholder = "Add your comment…",
  submitLabel = "Comment",
  loading = false,
  avatar,
  actions,
  preview,
  maxLength,
  hint,
  error,
  rows = 3,
  className,
}: {
  onSubmit: (value: string) => void;
  /** Controlled text; omit to let the composer manage and clear it. */
  value?: string;
  /** Called with the text on every edit. */
  onChange?: (value: string) => void;
  label?: string;
  labelVisible?: boolean;
  placeholder?: string;
  submitLabel?: string;
  /** Busy submitting: the submit button keeps focus but ignores activation. */
  loading?: boolean;
  /** Author avatar shown beside the box (decorative). */
  avatar?: ReactNode;
  /** Toolbar controls such as attach or emoji buttons. */
  actions?: ReactNode;
  /** Renders a preview of the text and enables Write/Preview tabs. */
  preview?: (value: string) => ReactNode;
  /** Shows a visible count; the remaining characters are announced only near the limit. */
  maxLength?: number;
  hint?: string;
  /** Marks the text invalid; the message is announced when it appears. */
  error?: string;
  rows?: number;
  className?: string;
}) {
  const { fieldId: id, messageId, describedBy } = useField({ hint, error });
  const [own, setOwn] = useState("");
  const [mode, setMode] = useState("write");
  const value = controlled ?? own;
  const setValue = (next: string) => {
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
  };
  const empty = !value.trim();
  const submit = () => {
    if (empty || loading) return;
    onSubmit(value);
    if (controlled === undefined) setOwn("");
  };
  const remaining = maxLength === undefined ? 0 : maxLength - value.length;
  const field = (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      aria-keyshortcuts="Control+Enter Meta+Enter"
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          submit();
        }
      }}
    />
  );
  return (
    <form
      {...componentRoot("CommentComposer")}
      className={cx("m-composer", className)}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {avatar && (
        <span className="m-composer-avatar" aria-hidden="true">
          {avatar}
        </span>
      )}
      <div className="m-composer-main">
        <label
          className={labelVisible ? "m-composer-label" : "m-sr-only"}
          htmlFor={id}
        >
          {label}
        </label>
        <div className="m-composer-box" data-invalid={error ? true : undefined}>
          {preview ? (
            <Tabs
              label="Comment mode"
              value={mode}
              onChange={setMode}
              items={[
                { id: "write", label: "Write", content: field },
                {
                  id: "preview",
                  label: "Preview",
                  content: (
                    <div className="m-composer-preview">
                      {empty ? (
                        <p className="m-composer-empty">Nothing to preview</p>
                      ) : (
                        preview(value)
                      )}
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            field
          )}
          <div className="m-composer-bar">
            {actions && <div className="m-composer-actions">{actions}</div>}
            {maxLength !== undefined && (
              <span className="m-composer-count">
                {value.length} / {maxLength}
              </span>
            )}
            <Button type="submit" disabled={empty} loading={loading}>
              {submitLabel}
            </Button>
            {maxLength !== undefined && (
              <span className="m-sr-only" role="status">
                {remaining <= nearLimit(maxLength) &&
                  (remaining > 0
                    ? `${remaining} ${remaining === 1 ? "character" : "characters"} left`
                    : "Character limit reached")}
              </span>
            )}
          </div>
        </div>
        <FieldFeedback id={messageId} hint={hint} error={error} />
      </div>
    </form>
  );
}
