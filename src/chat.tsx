import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Avatar } from "./display.js";
import { ArrowDown, ArrowUp, Paperclip } from "./icons.js";
import { Button } from "./primitives.js";
import { FieldFeedback, componentRoot, cx, useField } from "./internal.js";

/** Who wrote a chat message. */
export interface ChatAuthor {
  name: string;
  /** Shown after the name, for example "AI assistant" renders "· AI assistant". */
  role?: string;
  /** Photo URL; initials show when it is missing or fails to load. */
  image?: string;
}

/** One message in a ChatThread. */
export interface ChatThreadMessage {
  id: string;
  author: ChatAuthor;
  /** The body, usually rendered Markdown. Empty while a streamed reply has no text yet. */
  content?: ReactNode;
  /** Sent by the person viewing the thread: aligned to the end. */
  own?: boolean;
  /** Visible time, for example "14:02" or "2 min ago". */
  time?: string;
  /** Machine-readable time for the `<time>` element (ISO 8601). */
  dateTime?: string;
  /**
   * `streaming` marks a reply still arriving: it shows a responding indicator and
   * the thread holds its announcement until the reply is complete. `error` shows
   * the `error` text and, with `onRetry`, a retry action.
   */
  status?: "complete" | "streaming" | "error";
  /** Why the message failed; shown when `status` is `error`. */
  error?: string;
  /** Retries a failed message; adds the retry button. */
  onRetry?: () => void;
}

export interface ChatThreadProps {
  /** Accessible name of the conversation log. */
  label: string;
  messages: ChatThreadMessage[];
  /** Quick answers shown under the latest message when someone else wrote it. */
  choices?: string[];
  /** Called with the quick answer the user chose. */
  onSelect?: (choice: string) => void;
  /** Accessible name of the quick answers group. */
  choicesLabel?: string;
  /** Shown while there are no messages. */
  empty?: { title: string; description?: string; action?: ReactNode };
  /** Text of the retry button on failed messages. */
  retryLabel?: string;
  /** Read out while a streamed reply has no text yet. */
  respondingLabel?: string;
  /** Text of the button that scrolls back to the newest message. */
  latestLabel?: string;
  id?: string;
  className?: string;
}

/** Distance from the bottom, in pixels, that still counts as reading the latest message. */
const PIN_THRESHOLD = 48;

/**
 * Scrollable log of a live conversation. It stays pinned to the newest message
 * while it grows (new messages, streamed text), unless the reader has scrolled
 * up; then a button brings them back.
 */
export function ChatThread({
  label,
  messages,
  choices = [],
  onSelect,
  choicesLabel = "Suggested replies",
  empty,
  retryLabel = "Retry",
  respondingLabel = "Responding…",
  latestLabel = "Jump to latest",
  id,
  className,
}: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);
  const [away, setAway] = useState(false);
  const last = messages[messages.length - 1];
  const streaming = messages.some((m) => m.status === "streaming");

  const toBottom = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // A message the viewer just sent always brings the view back down, even when
  // a reply placeholder is appended with it.
  const lastOwnId = [...messages].reverse().find((m) => m.own)?.id;
  useLayoutEffect(() => {
    if (lastOwnId === undefined) return;
    pinned.current = true;
    setAway(false);
  }, [lastOwnId]);

  // After every render (new messages, streamed text), follow the bottom if pinned.
  useLayoutEffect(() => {
    if (pinned.current) toBottom();
  });

  // Content can also grow without a render (images loading, fonts): follow it.
  useLayoutEffect(() => {
    const target = list.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (pinned.current) toBottom();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [toBottom, messages.length === 0]);

  const showChoices =
    choices.length > 0 && last && !last.own && last.status !== "streaming";

  return (
    <div
      {...componentRoot("ChatThread")}
      id={id}
      className={cx("m-chat-thread", className)}
    >
      <div
        ref={scroller}
        className="m-chat-thread-scroll"
        role="log"
        aria-label={label}
        aria-busy={streaming || undefined}
        // Keyboard users can scroll the history.
        tabIndex={0}
        onScroll={(event) => {
          const el = event.currentTarget;
          const atBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight <= PIN_THRESHOLD;
          pinned.current = atBottom;
          setAway(!atBottom);
        }}
      >
        {messages.length === 0 && empty ? (
          <div className="m-chat-thread-empty">
            <p>
              <strong>{empty.title}</strong>
            </p>
            {empty.description && <p>{empty.description}</p>}
            {empty.action}
          </div>
        ) : (
          <ol ref={list} className="m-chat-thread-list">
            {messages.map((message) => (
              <ChatThreadItem
                key={message.id}
                message={message}
                retryLabel={retryLabel}
                respondingLabel={respondingLabel}
              />
            ))}
          </ol>
        )}
        {showChoices && (
          <div
            className="m-chat-thread-choices"
            role="group"
            aria-label={choicesLabel}
          >
            {choices.map((choice) => (
              <Button
                key={choice}
                variant="secondary"
                size="sm"
                onClick={() => onSelect?.(choice)}
              >
                {choice}
              </Button>
            ))}
          </div>
        )}
      </div>
      {away && messages.length > 0 && (
        <Button
          className="m-chat-thread-latest"
          variant="secondary"
          size="sm"
          icon={<ArrowDown />}
          onClick={() => {
            pinned.current = true;
            setAway(false);
            toBottom();
          }}
        >
          {latestLabel}
        </Button>
      )}
    </div>
  );
}

function ChatThreadItem({
  message,
  retryLabel,
  respondingLabel,
}: {
  message: ChatThreadMessage;
  retryLabel: string;
  respondingLabel: string;
}) {
  const { author, content, own, time, dateTime, status, error, onRetry } =
    message;
  const hasContent =
    content !== undefined && content !== null && content !== "";
  return (
    <li
      className="m-chat-message"
      data-own={own || undefined}
      data-status={status && status !== "complete" ? status : undefined}
      aria-busy={status === "streaming" || undefined}
    >
      <Avatar
        name={author.name}
        src={author.image}
        size="sm"
        decorative
        className="m-chat-message-avatar"
      />
      <div className="m-chat-message-main">
        <p className="m-chat-message-meta">
          <strong>{author.name}</strong>
          {author.role && (
            <span className="m-chat-message-role"> · {author.role}</span>
          )}
          {time && (
            <>
              <span className="m-sr-only">, </span>
              <time dateTime={dateTime}>{time}</time>
            </>
          )}
        </p>
        {hasContent && <div className="m-chat-message-body">{content}</div>}
        {status === "streaming" && !hasContent && (
          <span className="m-chat-message-typing">
            <span className="m-sr-only">{respondingLabel}</span>
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
        )}
        {status === "error" && (
          <div className="m-chat-message-error">
            <p>{error ?? "This message could not be delivered."}</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export interface ChatComposerProps {
  /** Called with the trimmed text when the user sends. */
  onSubmit: (value: string) => void;
  /** Controlled text; omit to let the composer manage and clear it. */
  value?: string;
  /** Called with the text on every edit. */
  onChange?: (value: string) => void;
  label?: string;
  labelVisible?: boolean;
  placeholder?: string;
  sendLabel?: string;
  /** Adds the attach button; called with the files the user picked. */
  onAttach?: (files: File[]) => void;
  attachLabel?: string;
  /** File types the attach picker offers, as in the `accept` attribute. */
  accept?: string;
  /** Attached files to show above the text, for example an AttachmentList. */
  attachments?: ReactNode;
  /** Starter prompts shown as chips; choosing one sends it unless `onSelect` is given. */
  suggestions?: string[];
  /** Called with the starter prompt the user chose instead of sending it. */
  onSelect?: (suggestion: string) => void;
  suggestionsLabel?: string;
  /** Nothing can be typed, attached or sent. */
  disabled?: boolean;
  /** A reply is in progress: the text stays editable but cannot be sent. */
  loading?: boolean;
  hint?: string;
  /** Marks the text invalid; the message is announced when it appears. */
  error?: string;
  id?: string;
  className?: string;
}

/**
 * Message box for a live conversation: Enter sends, Shift+Enter adds a line,
 * and Enter while an input method is composing is left to the input method.
 */
export function ChatComposer({
  onSubmit,
  value: controlled,
  onChange,
  label = "Message",
  labelVisible = false,
  placeholder = "Write a message…",
  sendLabel = "Send",
  onAttach,
  attachLabel = "Attach files",
  accept,
  attachments,
  suggestions = [],
  onSelect,
  suggestionsLabel = "Suggested prompts",
  disabled = false,
  loading = false,
  hint,
  error,
  id,
  className,
}: ChatComposerProps) {
  const { fieldId, messageId, describedBy } = useField({ hint, error });
  const files = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState("");
  const value = controlled ?? own;
  const setValue = (next: string) => {
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
  };
  const text = value.trim();
  const blocked = disabled || loading;
  const send = () => {
    if (!text || blocked) return;
    onSubmit(text);
    if (controlled === undefined) setOwn("");
  };
  return (
    <form
      {...componentRoot("ChatComposer")}
      id={id}
      className={cx("m-chat-composer-form", className)}
      aria-busy={loading || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label
        className={labelVisible ? "m-chat-composer-label" : "m-sr-only"}
        htmlFor={fieldId}
      >
        {label}
      </label>
      <div
        className="m-chat-composer-box"
        data-invalid={error ? true : undefined}
        data-disabled={disabled || undefined}
      >
        {attachments && (
          <div className="m-chat-composer-attachments">{attachments}</div>
        )}
        <textarea
          id={fieldId}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-keyshortcuts="Enter"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key !== "Enter" ||
              event.shiftKey ||
              event.nativeEvent.isComposing ||
              // Safari reports the Enter that ends a composition as keyCode 229.
              event.keyCode === 229
            )
              return;
            event.preventDefault();
            send();
          }}
        />
        <div className="m-chat-composer-bar">
          {onAttach && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Paperclip />}
                iconOnly
                disabled={disabled}
                onClick={() => files.current?.click()}
              >
                {attachLabel}
              </Button>
              <input
                ref={files}
                type="file"
                multiple
                accept={accept}
                hidden
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  const picked = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (picked.length) onAttach(picked);
                }}
              />
            </>
          )}
          <Button
            type="submit"
            className="m-chat-composer-send"
            size="sm"
            icon={<ArrowUp />}
            iconOnly
            disabled={disabled || !text}
            loading={loading}
          >
            {sendLabel}
          </Button>
        </div>
      </div>
      <FieldFeedback id={messageId} hint={hint} error={error} />
      {suggestions.length > 0 && (
        <div
          className="m-chat-composer-suggestions"
          role="group"
          aria-label={suggestionsLabel}
        >
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="secondary"
              size="sm"
              disabled={blocked}
              onClick={() =>
                onSelect ? onSelect(suggestion) : onSubmit(suggestion)
              }
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </form>
  );
}
