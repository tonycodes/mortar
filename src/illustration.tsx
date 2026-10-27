import { useRef, type CSSProperties } from "react";
import { componentRoot, cx, useDomId, usePlayback } from "./internal.js";

/** A point in the drawing, in the illustration's viewBox units. */
export interface NetworkNode {
  id: string;
  x: number;
  y: number;
  /** Short text drawn under the node. */
  label?: string;
  /** accent: the brand's accent fill, to pick out a node. */
  tone?: "default" | "accent";
}
/** A straight connection between two node ids. */
export interface NetworkConnection {
  from: string;
  to: string;
  /** Whether a signal travels from `from` to `to`. Default true. */
  signal?: boolean;
  /** Seconds for this signal to cross; defaults to the illustration's duration. */
  duration?: number;
  /** Seconds before this signal starts; defaults to an even stagger. */
  delay?: number;
}

const NODE_RADIUS = 8;
const SIGNAL_RADIUS = 4;

/**
 * A lightweight network drawing: nodes and connections supplied as data, with
 * optional signals travelling along the connections. Decorative unless it has
 * a label. The animation is illustrative: it never represents live activity.
 */
export function NetworkIllustration({
  nodes,
  connections,
  width = 480,
  height = 320,
  label,
  description,
  motion = "auto",
  duration = 3,
  paused,
  onPausedChange,
  id,
  className,
}: {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  /** Width of the viewBox; the drawing scales to its container. */
  width?: number;
  /** Height of the viewBox. */
  height?: number;
  /** Makes the drawing informative: an image with this accessible name. Omitted, it is decorative and hidden from assistive technology. */
  label?: string;
  /** With a label, a longer description of what the drawing shows. */
  description?: string;
  /** auto: signals travel where connections carry one, with a pause control. static: the same drawing without motion. */
  motion?: "auto" | "static";
  /** Seconds for a signal to cross a connection. */
  duration?: number;
  /** Whether the user has paused the animation; pass with onPausedChange to control it or share it between illustrations. */
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useDomId("m-network-title");
  const descId = useDomId("m-network-desc");
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = connections.flatMap((connection) => {
    const from = byId.get(connection.from);
    const to = byId.get(connection.to);
    return from && to ? [{ ...connection, a: from, b: to }] : [];
  });
  const carriers = links.filter((link) => link.signal !== false);
  const animated = motion === "auto" && carriers.length > 0;
  const { reason, reduced, userPaused, toggle } = usePlayback(ref, {
    paused,
    onPausedChange,
    enabled: animated,
  });
  const informative = Boolean(label);
  return (
    <div
      ref={ref}
      id={id}
      className={cx("m-network", className)}
      {...componentRoot("NetworkIllustration")}
      data-motion={motion === "static" ? "static" : undefined}
      data-paused={animated ? (reason ?? undefined) : undefined}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        {...(informative
          ? {
              role: "img",
              "aria-labelledby": titleId,
              "aria-describedby": description ? descId : undefined,
            }
          : { "aria-hidden": true, focusable: false })}
      >
        {informative && <title id={titleId}>{label}</title>}
        {informative && description && <desc id={descId}>{description}</desc>}
        {links.map((link, index) => (
          <line
            key={`${link.from}:${link.to}:${index}`}
            className="m-network-link"
            x1={link.a.x}
            y1={link.a.y}
            x2={link.b.x}
            y2={link.b.y}
          />
        ))}
        {animated &&
          !reduced &&
          carriers.map((link, index) => {
            const time = link.duration ?? duration;
            const delay = link.delay ?? -((index * time) / carriers.length);
            return (
              <circle
                key={`${link.from}:${link.to}:${index}`}
                className="m-network-signal"
                r={SIGNAL_RADIUS}
                style={
                  {
                    "--m-signal-from": `${link.a.x}px ${link.a.y}px`,
                    "--m-signal-to": `${link.b.x}px ${link.b.y}px`,
                    animationDuration: `${time}s`,
                    animationDelay: delay ? `${delay}s` : undefined,
                  } as CSSProperties
                }
              />
            );
          })}
        {nodes.map((node) => (
          <circle
            key={node.id}
            className="m-network-node"
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            data-tone={node.tone === "accent" ? "accent" : undefined}
          />
        ))}
        {nodes.map(
          (node) =>
            node.label && (
              <text
                key={node.id}
                className="m-network-label"
                x={node.x}
                y={node.y + NODE_RADIUS + 16}
                textAnchor="middle"
              >
                {node.label}
              </text>
            ),
        )}
      </svg>
      {animated && !reduced && (
        <button type="button" className="m-network-toggle" onClick={toggle}>
          {userPaused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </div>
  );
}
