import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  ChatThread,
  ChatComposer,
  TextArea,
} from "./support/render.mjs";

const noop = () => {};
const assistant = { name: "Brief assistant", role: "AI assistant" };
const customer = { name: "Priya Shah" };

test("ChatThread is a named, focusable log of messages with author, role and time", () => {
  const markup = html(ChatThread, {
    label: "Conversation",
    messages: [
      {
        id: "1",
        author: assistant,
        time: "14:02",
        dateTime: "2026-11-26T14:02",
        content: h("p", null, "Hello"),
      },
      { id: "2", author: customer, own: true, content: "Hi" },
    ],
  });
  assert.match(
    markup,
    /^<div data-m-component="ChatThread" class="m-chat-thread">/,
  );
  assert.match(
    markup,
    /<div class="m-chat-thread-scroll" role="log" aria-label="Conversation" tabindex="0">/,
  );
  // Avatars are decorative; the name and role are text.
  assert.match(markup, /data-m-component="Avatar"[^>]*aria-hidden="true"/);
  assert.match(
    markup,
    /<strong>Brief assistant<\/strong><span class="m-chat-message-role"> · AI assistant<\/span>/,
  );
  assert.match(markup, /<time dateTime="2026-11-26T14:02">14:02<\/time>/);
  assert.match(markup, /<div class="m-chat-message-body"><p>Hello<\/p><\/div>/);
  // Own messages carry data-own only when true.
  assert.equal(markup.match(/data-own="true"/g)?.length, 1);
  assert.doesNotMatch(markup, /aria-busy/);
});

test("ChatThread marks a streaming reply busy and announces it as responding", () => {
  const markup = html(ChatThread, {
    label: "Conversation",
    messages: [{ id: "1", author: assistant, status: "streaming" }],
  });
  assert.match(markup, /role="log" aria-label="Conversation" aria-busy="true"/);
  assert.match(
    markup,
    /<li class="m-chat-message" data-status="streaming" aria-busy="true">/,
  );
  assert.match(markup, /<span class="m-sr-only">Responding…<\/span>/);
  assert.doesNotMatch(markup, /m-chat-message-body/);
});

test("ChatThread shows an inline error with Retry only when it can retry", () => {
  const failed = {
    id: "1",
    author: customer,
    own: true,
    content: "Hi",
    status: "error",
    error: "Not sent",
  };
  const withRetry = html(ChatThread, {
    label: "C",
    messages: [{ ...failed, onRetry: noop }],
    retryLabel: "Try again",
  });
  assert.match(withRetry, /data-status="error"/);
  assert.match(
    withRetry,
    /<div class="m-chat-message-error"><p>Not sent<\/p><button[^>]*>Try again<\/button><\/div>/,
  );
  assert.doesNotMatch(
    html(ChatThread, { label: "C", messages: [failed] }),
    /<button/,
  );
});

test("ChatThread offers quick answers only under someone else's finished message", () => {
  const props = { label: "C", choices: ["Yes", "No"], onSelect: noop };
  const other = { id: "1", author: assistant, content: "Ready?" };
  const markup = html(ChatThread, { ...props, messages: [other] });
  assert.match(
    markup,
    /<div class="m-chat-thread-choices" role="group" aria-label="Suggested replies">/,
  );
  assert.equal(markup.match(/<button/g)?.length, 2);
  for (const messages of [
    [{ ...other, own: true }],
    [{ ...other, status: "streaming" }],
    [],
  ])
    assert.doesNotMatch(
      html(ChatThread, { ...props, messages }),
      /m-chat-thread-choices/,
    );
});

test("ChatThread renders its empty state without a list", () => {
  const markup = html(ChatThread, {
    label: "C",
    messages: [],
    empty: { title: "No messages yet", description: "Say hello." },
  });
  assert.match(markup, /<strong>No messages yet<\/strong>/);
  assert.match(markup, /Say hello\./);
  assert.doesNotMatch(markup, /<ol/);
});

test("ChatComposer labels its textarea, sends on Enter and disables send while empty", () => {
  const markup = html(ChatComposer, { onSubmit: noop });
  assert.match(
    markup,
    /^<form data-m-component="ChatComposer" class="m-chat-composer-form">/,
  );
  const id = markup.match(
    /<label class="m-sr-only" for="([^"]+)">Message<\/label>/,
  )?.[1];
  assert.ok(id, markup);
  assert.match(
    markup,
    new RegExp(`<textarea id="${id}" rows="1"[^>]*aria-keyshortcuts="Enter"`),
  );
  assert.match(
    markup,
    /<button data-m-component="Button" type="submit" disabled="" class="[^"]*m-chat-composer-send"/,
  );
  assert.match(markup, /<span class="m-sr-only">Send<\/span>/);
  // No attach button or starter prompts unless asked for.
  assert.doesNotMatch(
    markup,
    /type="file"|Attach files|m-chat-composer-suggestions/,
  );
});

test("ChatComposer adds an attach button, starter prompts, hint and error", () => {
  const markup = html(ChatComposer, {
    onSubmit: noop,
    onAttach: noop,
    accept: "image/*",
    suggestions: ["Summarise"],
    value: "Hello",
    onChange: noop,
    error: "Too long",
  });
  assert.match(markup, /<span class="m-sr-only">Attach files<\/span>/);
  assert.match(
    markup,
    /<input type="file" multiple="" accept="image\/\*" hidden="" tabindex="-1" aria-hidden="true"\/>/,
  );
  assert.match(markup, /role="group" aria-label="Suggested prompts"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /class="m-error" role="alert">Too long<\/p>/);
  assert.match(markup, /data-invalid="true"/);
  // Text present: send is enabled.
  assert.doesNotMatch(markup, /disabled=""[^>]*m-chat-composer-send/);
});

test("ChatComposer disabled blocks everything; loading keeps the text editable", () => {
  const disabled = html(ChatComposer, {
    onSubmit: noop,
    onAttach: noop,
    suggestions: ["Hi"],
    disabled: true,
  });
  assert.match(disabled, /<textarea[^>]*disabled=""/);
  assert.equal(disabled.match(/<button[^>]*disabled=""/g)?.length, 3);
  const loading = html(ChatComposer, {
    onSubmit: noop,
    value: "Hi",
    onChange: noop,
    loading: true,
  });
  assert.match(loading, /<form[^>]*aria-busy="true"/);
  assert.doesNotMatch(loading, /<textarea[^>]*disabled/);
  assert.match(loading, /aria-busy="true" class="[^"]*m-chat-composer-send"/);
});

test("TextArea mono marks the textarea only when asked", () => {
  assert.match(
    html(TextArea, { label: "Brief", mono: true }),
    /<textarea[^>]*data-mono="true"/,
  );
  assert.doesNotMatch(html(TextArea, { label: "Brief" }), /data-mono/);
});
