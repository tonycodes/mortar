import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  Toast,
  ActivityFeed,
  StackedList,
} from "./support/render.mjs";
const avatar = h("span", { "data-avatar": "" });

test("Toast shows a leading avatar in place of the tone icon", () => {
  const plain = html(Toast, { title: "Saved" });
  assert.match(plain, /<span class="m-toast-icon" aria-hidden="true">/);
  const withAvatar = html(Toast, { title: "Ana replied", leading: avatar });
  assert.match(
    withAvatar,
    /<span class="m-toast-leading"><span data-avatar=""><\/span><\/span>/,
  );
  assert.doesNotMatch(withAvatar, /m-toast-icon/);
});

test("ActivityFeed shows actors and comment bodies only when given", () => {
  const items = [{ id: "1", title: "Deployed", time: "2m" }];
  assert.match(
    html(ActivityFeed, { label: "Activity", items }),
    /m-activity-dot/,
  );
  const rich = html(ActivityFeed, {
    label: "Activity",
    items: [
      {
        id: "1",
        title: "Ana commented",
        time: "2m",
        actor: avatar,
        body: "Looks good to me.",
      },
    ],
  });
  assert.match(
    rich,
    /<span class="m-activity-actor"><span data-avatar=""><\/span><\/span>/,
  );
  assert.doesNotMatch(rich, /m-activity-dot/);
  assert.match(
    rich,
    /<blockquote class="m-activity-body">Looks good to me.<\/blockquote>/,
  );
});

test("StackedList groups items under labelled sticky headings", () => {
  const plain = html(StackedList, {
    label: "People",
    items: [{ id: "a", title: "Ana" }],
  });
  assert.doesNotMatch(plain, /m-stacked-group/);
  const grouped = html(StackedList, {
    label: "Directory",
    groups: [
      { label: "A", items: [{ id: "ana", title: "Ana Kovač" }] },
      { label: "T", items: [{ id: "tom", title: "Tom Cook" }] },
    ],
  });
  const headings = [
    ...grouped.matchAll(
      /<h3 id="([^"]+)" class="m-stacked-group-heading">([A-Z])<\/h3><ul aria-labelledby="\1">/g,
    ),
  ];
  assert.deepEqual(
    headings.map((m) => m[2]),
    ["A", "T"],
  );
  assert.match(grouped, /Ana Kovač/);
});
