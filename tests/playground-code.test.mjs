import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildExamples, exampleCode } from "../playground/examples.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const { components } = JSON.parse(
  readFileSync(new URL("../catalog.json", import.meta.url), "utf8"),
);
const { examples } = buildExamples(root, components);

test("every catalogue component's Code view renders the component itself", () => {
  const missing = components
    .filter((c) => !examples[c.export]?.includes(`<${c.export}`))
    .map((c) => c.export);
  assert.deepEqual(missing, []);
});

test("Code view imports only public exports and never shows the fixtures' UI namespace or private wrappers", () => {
  const problems = [];
  for (const c of components) {
    const code = examples[c.export];
    if (/\bUI\./.test(code)) problems.push(`${c.export}: UI. prefix`);
    if (/<Control\b/.test(code)) problems.push(`${c.export}: private Control`);
    const imported = code.match(
      /^import \{ ([^}]+) \} from "@tonycodes-ui\/mortar";/,
    );
    if (!imported) problems.push(`${c.export}: no import line`);
    else if (!imported[1].split(", ").includes(c.export))
      problems.push(`${c.export}: does not import itself`);
  }
  assert.deepEqual(problems, []);
});

test("extraction handles nested parentheses, fall-through cases and local variables", () => {
  const fixture = `
    export function Case({ name }) {
      const chat = (
        <UI.ChatPreview title="Hi" />
      );
      const extra = <UI.Input label="Name" />;
      let example;
      switch (name) {
        case "A":
        case "B":
          example = (
            <UI.Stack>
              {format("x);")}
              {extra}
            </UI.Stack>
          );
          break;
        case "C":
          example = chat;
          break;
      }
      return example;
    }`;
  const exports = new Set(["Stack", "Input", "ChatPreview", "A"]);
  assert.equal(
    exampleCode("A", fixture, exports),
    [
      'import { Input, Stack } from "@tonycodes-ui/mortar";',
      "",
      "<Stack>",
      '  {format("x);")}',
      '  <Input label="Name" />',
      "</Stack>",
    ].join("\n"),
  );
  assert.equal(
    exampleCode("C", fixture, exports),
    'import { ChatPreview } from "@tonycodes-ui/mortar";\n\n<ChatPreview title="Hi" />',
  );
});
