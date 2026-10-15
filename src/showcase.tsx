import type { ReactNode } from "react";

/** Framed product screenshot or illustration for heroes and feature sections. */
export function MockWindow({
  label,
  address,
  variant = "browser",
  children,
}: {
  /** Accessible description of what the mock shows. */
  label: string;
  /** Optional URL or file name shown in the title bar. */
  address?: string;
  variant?: "browser" | "app" | "plain";
  children: ReactNode;
}) {
  return (
    <figure
      className="m-mock-window"
      data-variant={variant}
      aria-label={label}
      data-m-component="MockWindow"
    >
      {variant !== "plain" && (
        <div className="m-mock-bar" aria-hidden="true">
          <span className="m-mock-dots">
            <i />
            <i />
            <i />
          </span>
          {address && <span className="m-mock-address">{address}</span>}
        </div>
      )}
      <div className="m-mock-body">{children}</div>
    </figure>
  );
}

export interface ChatMessage {
  from: "user" | "assistant";
  content: ReactNode;
}

/** Static, illustrative chat conversation for marketing a conversational product. */
export function ChatPreview({
  title,
  status,
  messages,
  typing = false,
  suggestions = [],
  placeholder = "Type a message…",
  assistantName = "Assistant",
}: {
  title: string;
  status?: string;
  messages: ChatMessage[];
  typing?: boolean;
  suggestions?: string[];
  placeholder?: string;
  assistantName?: string;
}) {
  return (
    <figure
      className="m-chat-preview"
      aria-label={`${title} conversation`}
      data-m-component="ChatPreview"
    >
      <header>
        <span className="m-chat-avatar" aria-hidden="true" />
        <span>
          <strong>{title}</strong>
          {status && <small>{status}</small>}
        </span>
      </header>
      <ol className="m-chat-log">
        {messages.map((message, i) => (
          <li key={i} data-from={message.from}>
            <span className="m-sr-only">
              {message.from === "user" ? "Visitor" : assistantName}:
            </span>
            <div className="m-chat-bubble">{message.content}</div>
          </li>
        ))}
        {typing && (
          <li data-from="assistant">
            <span className="m-chat-typing">
              <span className="m-sr-only">{assistantName} is typing</span>
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
            </span>
          </li>
        )}
      </ol>
      {suggestions.length > 0 && (
        <ul className="m-chat-suggestions" aria-label="Suggested replies">
          {suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <div className="m-chat-composer" aria-hidden="true">
        <span>{placeholder}</span>
        <span className="m-chat-send" />
      </div>
    </figure>
  );
}
