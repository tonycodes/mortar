// Images the kit renders from data (covers, product photos, avatars, logos),
// with a one-shot fallback when the image fails. Internal: not exported.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ImageMissing } from "./icons.js";

/** Optional fallbacks on an image a component renders from data. */
export interface ImageFallback {
  /** Shown once if `src` fails or is empty. Not retried if it fails too. */
  fallbackSrc?: string;
  /**
   * Shown when every image fails, in the image's reserved box, instead of the
   * default placeholder icon. It is visual only: the image's `alt` names it.
   */
  fallback?: ReactNode;
}

/**
 * Which source to show: `src`, then `fallbackSrc` once, then none. Each step
 * happens at most once per `src`, so a failing fallback can't loop, and a new
 * `src` starts over. An error that fired before hydration attached `onError`
 * is caught on mount from the image's own state.
 */
export function useImageFallback(src: string, fallbackSrc?: string) {
  const [failed, setFailed] = useState<{ src: string; stage: 1 | 2 } | null>(
    null,
  );
  const second = fallbackSrc && fallbackSrc !== src ? fallbackSrc : undefined;
  let stage = failed?.src === src ? failed.stage : 0;
  if (stage === 0 && !src) stage = second ? 1 : 2;
  if (stage === 1 && !second) stage = 2;
  const current = stage === 0 ? src : stage === 1 ? second : undefined;
  const fail = () => setFailed({ src, stage: stage === 0 && second ? 1 : 2 });
  const ref = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0 && img.getAttribute("src"))
      fail();
    // `fail` reads this render's stage; re-run only when the source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  return { current, ref, onError: fail };
}

/**
 * An image with the kit's fallback: `fallbackSrc` once, then `fallback` or a
 * placeholder icon in the same reserved box (the container sets the size), so
 * nothing shifts. The placeholder carries the image's accessible name.
 */
export function KitImage({
  src,
  alt,
  fallbackSrc,
  fallback,
  loading,
}: ImageFallback & {
  src: string;
  alt: string;
  loading?: "lazy";
}) {
  const image = useImageFallback(src, fallbackSrc);
  if (image.current)
    return (
      <img
        ref={image.ref}
        src={image.current}
        alt={alt}
        loading={loading}
        onError={image.onError}
      />
    );
  return (
    <span
      className="m-image-fallback"
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
    >
      {fallback ? <span aria-hidden="true">{fallback}</span> : <ImageMissing />}
    </span>
  );
}
