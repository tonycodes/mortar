import { useEffect, useId, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { Button, Input, type LinkAction, type Tone } from "./primitives.js";
import { KitLink } from "./navigation.js";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  /** A second action shown after the first, e.g. Decline next to Accept. */
  secondaryAction?: { label: string; onClick: () => void };
  /** Avatar or icon shown instead of the tone icon, e.g. who replied. */
  leading?: ReactNode;
}

const glyph: Record<Tone, string> = {
  neutral: "i",
  info: "i",
  success: "✓",
  warning: "!",
  danger: "!",
};

export function Toast({
  title,
  description,
  tone = "neutral",
  action,
  onDismiss,
  leading,
  secondaryAction,
}: Omit<ToastItem, "id"> & { onDismiss?: () => void }) {
  return (
    <div className="m-toast" data-tone={tone}>
      {leading ? (
        <span className="m-toast-leading">{leading}</span>
      ) : (
        <span className="m-toast-icon" aria-hidden="true">
          {glyph[tone]}
        </span>
      )}
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      <div className="m-actions">
        {action && (
          <Button variant="ghost" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            onClick={onDismiss}
            aria-label={`Dismiss ${title}`}
          >
            <span aria-hidden="true">✕</span>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Controlled toast region. The consumer owns the queue and timeouts. */
export function Toaster({
  items,
  onDismiss,
  label = "Notifications",
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  label?: string;
}) {
  return (
    <section className="m-toaster" aria-label={label}>
      <ol aria-live="polite" aria-relevant="additions">
        {items.map(({ id, ...item }) => (
          <li key={id} role={item.tone === "danger" ? "alert" : undefined}>
            <Toast {...item} onDismiss={() => onDismiss(id)} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmationText,
  loading = false,
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** When set, the user must type this value before confirming. */
  confirmationText?: string;
  loading?: boolean;
  destructive?: boolean;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const ready = !confirmationText || typed === confirmationText;
  return (
    <Dialog open={open} onClose={onClose} className="m-dialog">
      <div className="m-backdrop" aria-hidden="true" />
      <div className="m-dialog-position">
        <DialogPanel className="m-dialog-panel m-confirm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) onConfirm();
            }}
          >
            <div className="m-confirm-body">
              <DialogTitle>{title}</DialogTitle>
              <Description as="div">{description}</Description>
              {confirmationText && (
                <Input
                  label={`Type ${confirmationText} to confirm`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>
            <div className="m-confirm-actions">
              <Button variant="secondary" onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                variant={destructive ? "danger" : "primary"}
                data-solid={destructive || undefined}
                disabled={!ready}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function SaveBar({
  open,
  message = "You have unsaved changes.",
  saveLabel = "Save changes",
  discardLabel = "Discard",
  onSave,
  onDiscard,
  saving = false,
}: {
  open: boolean;
  message?: string;
  saveLabel?: string;
  discardLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}) {
  const id = useId();
  if (!open) return null;
  return (
    <div className="m-save-bar" role="region" aria-labelledby={id}>
      <span id={id} role="status">
        {message}
      </span>
      <div className="m-actions">
        <Button variant="secondary" onClick={onDiscard} disabled={saving}>
          {discardLabel}
        </Button>
        <Button onClick={onSave} loading={saving}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

/** Site-wide announcement bar with an optional link and dismiss button. */
export function Banner({
  children,
  action,
  onDismiss,
  label = "Announcement",
  dismissLabel = "Dismiss announcement",
  tone = "inverse",
}: {
  children: ReactNode;
  action?: LinkAction;
  onDismiss?: () => void;
  label?: string;
  dismissLabel?: string;
  tone?: "inverse" | "neutral";
}) {
  return (
    <section
      className="m-banner"
      aria-label={label}
      data-tone={tone}
      data-m-component="Banner"
    >
      <p>
        {children}
        {action && (
          <>
            {" "}
            <KitLink href={action.href}>
              {action.label}
              <span aria-hidden="true"> →</span>
            </KitLink>
          </>
        )}
      </p>
      {onDismiss && (
        <button type="button" aria-label={dismissLabel} onClick={onDismiss}>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
