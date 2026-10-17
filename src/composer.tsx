import { useId, useState, type ReactNode } from "react";
import { Button, Tabs } from "./primitives.js";

/** Comment box with optional avatar, toolbar, Write/Preview tabs and a character count. */
export function CommentComposer({
  onSubmit,
  value: controlled,
  onValueChange,
  label = "Add your comment",
  labelVisible = false,
  placeholder = "Add your comment…",
  submitLabel = "Comment",
  submitting = false,
  avatar,
  actions,
  preview,
  maxLength,
  hint,
  error,
  rows = 3,
}: {
  onSubmit: (value: string) => void;
  /** Controlled text; omit to let the composer manage and clear it. */
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  labelVisible?: boolean;
  placeholder?: string;
  submitLabel?: string;
  submitting?: boolean;
  /** Author avatar shown beside the box (decorative). */
  avatar?: ReactNode;
  /** Toolbar controls such as attach or emoji buttons. */
  actions?: ReactNode;
  /** Renders a preview of the text and enables Write/Preview tabs. */
  preview?: (value: string) => ReactNode;
  maxLength?: number;
  hint?: string;
  error?: string;
  rows?: number;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const [own, setOwn] = useState("");
  const [mode, setMode] = useState("write");
  const value = controlled ?? own;
  const setValue = (next: string) => {
    if (controlled === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const empty = !value.trim();
  const submit = () => {
    if (empty || submitting) return;
    onSubmit(value);
    if (controlled === undefined) setOwn("");
  };
  const field = (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={error ? true : undefined}
      aria-describedby={error || hint ? messageId : undefined}
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
      className="m-composer"
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
              <span className="m-composer-count" aria-live="polite">
                {value.length} / {maxLength}
              </span>
            )}
            <Button type="submit" disabled={empty} loading={submitting}>
              {submitLabel}
            </Button>
          </div>
        </div>
        {(error || hint) && (
          <p id={messageId} className={error ? "m-error" : ""}>
            {error || hint}
          </p>
        )}
      </div>
    </form>
  );
}
