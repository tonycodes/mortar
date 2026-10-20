import test from "node:test";
import assert from "node:assert/strict";
import { h, html, CommentComposer } from "./support/render.mjs";

test("CommentComposer labels its textarea and disables submit while empty", () => {
  const markup = html(CommentComposer, { onSubmit() {} });
  assert.match(
    markup,
    /^<form data-m-component="CommentComposer" class="m-composer"/,
  );
  const id = markup.match(
    /<label class="m-sr-only" for="([^"]+)">Add your comment<\/label>/,
  )?.[1];
  assert.ok(id, markup);
  assert.match(markup, new RegExp(`<textarea[^>]*id="${id}"`));
  assert.match(markup, /aria-keyshortcuts="Control\+Enter Meta\+Enter"/);
  assert.match(
    markup,
    /<button data-m-component="Button" type="submit"[^>]*disabled=""[^>]*>Comment<\/button>/,
  );
});

test("CommentComposer shows an avatar, toolbar, counter, hint and error", () => {
  const markup = html(CommentComposer, {
    onSubmit() {},
    value: "Looks good",
    onChange() {},
    avatar: h("span", { "data-avatar": "" }),
    actions: h("button", { type: "button" }, "Attach"),
    maxLength: 280,
    error: "Too spicy",
  });
  assert.match(
    markup,
    /<span class="m-composer-avatar" aria-hidden="true"><span data-avatar=""><\/span><\/span>/,
  );
  assert.match(
    markup,
    /<div class="m-composer-actions"><button type="button">Attach<\/button><\/div>/,
  );
  assert.match(markup, /maxLength="280"/i);
  // The visible count is not live; only the remaining count near the limit is.
  assert.match(markup, /<span class="m-composer-count">10 \/ 280<\/span>/);
  assert.match(markup, /<span class="m-sr-only" role="status"><\/span>/);
  assert.match(markup, /aria-invalid="true"/);
  const describedBy = markup.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(
    markup.includes(
      `<p id="${describedBy}" class="m-error" role="alert">Too spicy</p>`,
    ),
  );
  assert.match(
    markup,
    /<button data-m-component="Button" type="submit"(?![^>]*disabled)[^>]*>Comment<\/button>/,
  );
});

test("CommentComposer adds Write and Preview tabs when it can preview", () => {
  const markup = html(CommentComposer, {
    onSubmit() {},
    preview: (v) => v.toUpperCase(),
  });
  assert.match(markup, /role="tablist" aria-label="Comment mode"/);
  assert.match(
    markup,
    /role="tab"[^>]*aria-selected="true"[^>]*>Write<\/button>/,
  );
  assert.match(markup, /role="tab"[^>]*>Preview<\/button>/);
});
