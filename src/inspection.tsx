import { useId } from "react";
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="m-segmented" role="group" aria-label={label}>
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
export function CodeBlock({
  code,
  label = "Code",
}: {
  code: string;
  label?: string;
}) {
  const id = useId();
  return (
    <figure className="m-code-block">
      <figcaption id={id}>{label}</figcaption>
      <pre tabIndex={0} aria-labelledby={id}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
export function PreviewFrame({ title, src }: { title: string; src: string }) {
  return (
    <section className="m-preview-frame" aria-label={title}>
      <a href={src} target="_blank" rel="noopener noreferrer">
        Open full preview
      </a>
      <iframe
        title={title}
        src={src}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
