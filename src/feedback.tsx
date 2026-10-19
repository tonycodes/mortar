import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { Button, Input, type LinkAction, type Tone } from "./primitives.js";
import { KitLink } from "./navigation.js";
import { Check, Close } from "./icons.js";
import { DialogFrame, cx, focusAway } from "./internal.js";

export interface ToastAction {
  label: string;
  onSelect: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: Tone;
  action?: ToastAction;
  /** A second action shown after the first, e.g. Decline next to Accept. */
  secondaryAction?: ToastAction;
  /** Avatar or icon shown instead of the tone icon, e.g. who replied. */
  leading?: ReactNode;
}

const glyph: Record<Tone, ReactNode> = {
  neutral: "i",
  info: "i",
  success: <Check />,
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
  className,
}: Omit<ToastItem, "id"> & {
  /** Shows a dismiss button. Focus then moves to the next control, never to the page body. */
  onDismiss?: () => void;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={root}
      className={cx("m-toast", className)}
      data-tone={tone === "neutral" ? undefined : tone}
    >
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
          <Button variant="ghost" onClick={action.onSelect}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onSelect}>
            {secondaryAction.label}
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            icon={<Close />}
            iconOnly
            onClick={() => {
              onDismiss();
              focusAway(root.current);
            }}
          >
            {`Dismiss ${title}`}
          </Button>
        )}
      </div>
    </div>
  );
}

const spoken = (items: ToastItem[]) =>
  items
    .map((item) => [item.title, item.description].filter(Boolean).join(". "))
    .join(". ");

/**
 * Controlled toast region. The consumer owns the queue and timeouts. New
 * toasts are announced once, through two persistent live regions: danger
 * assertively, every other tone politely.
 */
export function Toaster({
  items,
  onDismiss,
  label = "Notifications",
  id,
  className,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  const region = useRef<HTMLElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const [announcement, setAnnouncement] = useState({
    polite: "",
    assertive: "",
    count: 0,
  });
  useEffect(() => {
    const known = seen.current;
    seen.current = new Set(items.map((item) => item.id));
    // Toasts present on mount are content, not news.
    if (!known) return;
    const fresh = items.filter((item) => !known.has(item.id));
    if (!fresh.length) return;
    const urgent = fresh.filter((item) => item.tone === "danger");
    const calm = fresh.filter((item) => item.tone !== "danger");
    setAnnouncement((previous) => ({
      polite: calm.length ? spoken(calm) : "",
      assertive: urgent.length ? spoken(urgent) : "",
      count: previous.count + 1,
    }));
  }, [items]);
  return (
    <section
      ref={region}
      id={id}
      className={cx("m-toaster", className)}
      aria-label={label}
      tabIndex={-1}
    >
      <ol>
        {items.map(({ id, ...item }) => (
          <li key={id}>
            <Toast
              {...item}
              onDismiss={() => {
                const section = region.current;
                const toast = section?.ownerDocument.activeElement?.closest(
                  "li",
                ) as HTMLElement | null | undefined;
                if (section && toast && section.contains(toast))
                  focusAway(toast, { scope: section, fallback: section });
                onDismiss(id);
              }}
            />
          </li>
        ))}
      </ol>
      {/* A new span per announcement, so a repeated message is read again. */}
      <div className="m-sr-only" role="status">
        {announcement.polite && (
          <span key={announcement.count}>{announcement.polite}</span>
        )}
      </div>
      <div className="m-sr-only" role="alert">
        {announcement.assertive && (
          <span key={announcement.count}>{announcement.assertive}</span>
        )}
      </div>
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
  tone = "danger",
  className,
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
  /** Busy confirming: the confirm button keeps focus but ignores activation. */
  loading?: boolean;
  /** "danger" (default) for a destructive action; "default" for a primary one. */
  tone?: "default" | "danger";
  /** On the dialog panel. */
  className?: string;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const ready = !confirmationText || typed === confirmationText;
  const danger = tone === "danger";
  return (
    <DialogFrame open={open} onClose={onClose}>
      <div className="m-dialog-position">
        <DialogPanel className={cx("m-dialog-panel", "m-confirm", className)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ready && !loading) onConfirm();
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
                variant={danger ? "danger" : "primary"}
                data-solid={danger || undefined}
                disabled={!ready}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </DialogFrame>
  );
}

export function SaveBar({
  open,
  message = "You have unsaved changes.",
  saveLabel = "Save changes",
  discardLabel = "Discard",
  onSave,
  onDiscard,
  loading = false,
  id,
  className,
}: {
  /** Shows the bar. Its message is announced each time it opens. */
  open: boolean;
  message?: string;
  saveLabel?: string;
  discardLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
  /** Busy saving: Save keeps focus but ignores activation; Discard is disabled. */
  loading?: boolean;
  id?: string;
  className?: string;
}) {
  const messageId = useId();
  return (
    <>
      {/* Always rendered, so the message is announced when the bar opens. */}
      <span id={messageId} role="status" className="m-sr-only">
        {open ? message : ""}
      </span>
      {open && (
        <div
          id={id}
          className={cx("m-save-bar", className)}
          role="region"
          aria-labelledby={messageId}
        >
          <span aria-hidden="true">{message}</span>
          <div className="m-actions">
            <Button variant="secondary" onClick={onDiscard} disabled={loading}>
              {discardLabel}
            </Button>
            <Button onClick={onSave} loading={loading}>
              {saveLabel}
            </Button>
          </div>
        </div>
      )}
    </>
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
  variant = "bar",
  placement = "inline",
  id,
  className,
}: {
  children: ReactNode;
  action?: LinkAction;
  onDismiss?: () => void;
  label?: string;
  dismissLabel?: string;
  /** "inverse" (default) flips the colours; "default" uses the page surface. */
  tone?: "default" | "inverse";
  /** bar: an edge-to-edge strip. floating: an inset, rounded panel with a shadow. */
  variant?: "bar" | "floating";
  /** inline: in the page flow. bottom: fixed to the bottom of the viewport, always with a dismiss button so it never covers content for good. */
  placement?: "inline" | "bottom";
  id?: string;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const fixed = placement === "bottom";
  // A fixed banner hides itself when dismissed, even if the page keeps it mounted.
  if (dismissed) return null;
  const dismiss =
    onDismiss || fixed
      ? () => {
          onDismiss?.();
          focusAway(root.current);
          if (fixed) setDismissed(true);
        }
      : undefined;
  return (
    <section
      ref={root}
      id={id}
      className={cx("m-banner", className)}
      aria-label={label}
      data-tone={tone === "default" ? undefined : tone}
      data-variant={variant === "bar" ? undefined : variant}
      data-placement={fixed ? "bottom" : undefined}
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
      {dismiss && (
        <button type="button" aria-label={dismissLabel} onClick={dismiss}>
          <Close />
        </button>
      )}
    </section>
  );
}
