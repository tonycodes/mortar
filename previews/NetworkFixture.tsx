import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** NetworkIllustration: informative and decorative drawings, shared pause and the static equivalent. */

const nodes: UI.NetworkNode[] = [
  { id: "web", x: 60, y: 70, label: "Web" },
  { id: "mobile", x: 60, y: 210, label: "Mobile" },
  { id: "hub", x: 240, y: 140, label: "Hub", tone: "accent" },
  { id: "store", x: 420, y: 70, label: "Store" },
  { id: "mail", x: 420, y: 210, label: "Mail" },
];
const connections: UI.NetworkConnection[] = [
  { from: "web", to: "hub" },
  { from: "mobile", to: "hub" },
  { from: "hub", to: "store" },
  { from: "hub", to: "mail", duration: 4 },
  { from: "web", to: "store", signal: false },
];
const ring: UI.NetworkNode[] = [
  { id: "n", x: 120, y: 30 },
  { id: "e", x: 210, y: 100 },
  { id: "s", x: 120, y: 170 },
  { id: "w", x: 30, y: 100, tone: "accent" },
];
const loop: UI.NetworkConnection[] = [
  { from: "n", to: "e" },
  { from: "e", to: "s" },
  { from: "s", to: "w" },
  { from: "w", to: "n" },
];

export function NetworkCase({ name }: { name: string }) {
  const [shown, setShown] = useState(true);
  const [paused, setPaused] = useState(false);
  let example: ReactNode;
  switch (name) {
    case "NetworkIllustration":
      example = (
        <>
          <UI.NetworkIllustration
            label="Five connected points"
            description="Web and Mobile connect to a hub, which connects to Store and Mail. The motion is illustrative."
            width={480}
            height={260}
            nodes={nodes}
            connections={connections}
          />
          <UI.Text color="secondary" size="sm">
            These two decorative drawings share one pause state.
          </UI.Text>
          <div
            data-network-pair=""
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <UI.NetworkIllustration
              width={240}
              height={200}
              nodes={ring}
              connections={loop}
              duration={2}
              paused={paused}
              onPausedChange={setPaused}
            />
            <UI.NetworkIllustration
              width={240}
              height={200}
              nodes={ring}
              connections={loop}
              duration={3}
              paused={paused}
              onPausedChange={setPaused}
            />
          </div>
          <div style={{ maxWidth: 240 }}>
            <UI.NetworkIllustration
              motion="static"
              width={240}
              height={200}
              nodes={ring}
              connections={loop}
            />
          </div>
        </>
      );
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  // Hide and Show unmount the whole example, so the probe can check cleanup.
  return (
    <div className="m-stack">
      {shown && example}
      <UI.Button variant="secondary" onClick={() => setShown(!shown)}>
        {shown ? "Hide illustration" : "Show illustration"}
      </UI.Button>
      <output aria-label="Shared pause">{paused ? "paused" : "playing"}</output>
    </div>
  );
}
