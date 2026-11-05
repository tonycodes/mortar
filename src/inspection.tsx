import { useLayoutEffect, useRef } from "react";
import { KitLink } from "./navigation.js";
import { componentRoot, cx, useComponentName } from "./internal.js";
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const name = useComponentName("SegmentedControl");
  const group = useRef<HTMLDivElement>(null);
  // When the options scroll (narrow screens), keep the selected one in view,
  // on mount and on change. Only the control scrolls, never the page.
  useLayoutEffect(() => {
    const root = group.current;
    const selected = root?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!root || !selected || root.scrollWidth <= root.clientWidth) return;
    const outer = root.getBoundingClientRect();
    const inner = selected.getBoundingClientRect();
    if (inner.left < outer.left) root.scrollLeft -= outer.left - inner.left;
    else if (inner.right > outer.right)
      root.scrollLeft += inner.right - outer.right;
  }, [value]);
  return (
    <div
      ref={group}
      {...componentRoot(name)}
      className={cx("m-segmented", className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
/** A scrollable code sample in a figure; the caption names the figure. */
export function CodeBlock({
  code,
  label = "Code",
  className,
}: {
  code: string;
  /** Visible caption, and the figure's accessible name. */
  label?: string;
  className?: string;
}) {
  return (
    <figure
      {...componentRoot("CodeBlock")}
      className={cx("m-code-block", className)}
    >
      <figcaption>{label}</figcaption>
      {/* Focusable so keyboard users can scroll long samples. */}
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
export function PreviewFrame({
  label,
  src,
  id,
  className,
}: {
  /** Accessible name of the section and the frame. */
  label: string;
  src: string;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      {...componentRoot("PreviewFrame")}
      className={cx("m-preview-frame", className)}
      aria-label={label}
    >
      <KitLink href={src} target="_blank" rel="noopener noreferrer">
        Open full preview
      </KitLink>
      <iframe
        title={label}
        src={src}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
