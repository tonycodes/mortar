import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CodeTabs, SearchTrigger } from "../../../../src/index.js";
import "../../../../playground/styles.css";

// Keyboard and clipboard behaviour of the docs kit: two search triggers on one
// page, a text field and a dialog that own their key presses, and code tabs.
function Fixture() {
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(0);
  return (
    <div data-mortar="">
      <SearchTrigger
        label="Search docs"
        onOpen={() => setFirst((n) => n + 1)}
      />
      <SearchTrigger
        label="Search API"
        onOpen={() => setSecond((n) => n + 1)}
      />
      <output aria-label="Opened">{first + second}</output>
      <label>
        Notes <input />
      </label>
      <div role="dialog" aria-label="Open dialog">
        <button type="button">Inside dialog</button>
      </div>
      <CodeTabs
        tabs={[
          { id: "npm", label: "npm", code: "npm i example" },
          { id: "pnpm", label: "pnpm", code: "pnpm add example" },
          { id: "yarn", label: "yarn", code: "yarn add example" },
        ]}
      />
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");
createRoot(root).render(<Fixture />);
