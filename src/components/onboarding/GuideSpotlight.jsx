import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

// Rings the element marked data-guide={target}. While `showing`, it also dims
// the rest of the page and explains the click next to the element. Only the
// explanation takes pointer events, so the page stays usable either way.
//
// The element can move (scrolling, a growing form) or appear later (a dialog
// opening), so its position is read every frame while there is a target.

const schedule = (fn) =>
  window.requestAnimationFrame
    ? window.requestAnimationFrame(fn)
    : window.setTimeout(fn, 100);
const unschedule = (id) =>
  window.cancelAnimationFrame
    ? window.cancelAnimationFrame(id)
    : window.clearTimeout(id);

const findTarget = (target) =>
  document.querySelector(`[data-guide="${target}"]`);

const CALLOUT_WIDTH = 320;
const GAP = 14;

const GuideSpotlight = ({
  target,
  showing,
  title,
  text,
  link,
  onClose,
  onFound,
}) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      onFound?.(false);
      return undefined;
    }
    let frame;
    let last = null;
    const tick = () => {
      const box = findTarget(target)?.getBoundingClientRect();
      const visible = Boolean(box && box.width > 0 && box.height > 0);
      const key = visible
        ? `${box.left},${box.top},${box.width},${box.height}`
        : "";
      if (key !== last) {
        last = key;
        setRect(
          visible
            ? {
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }
            : null,
        );
        onFound?.(visible);
      }
      frame = schedule(tick);
    };
    tick();
    return () => unschedule(frame);
  }, [target, onFound]);

  useEffect(() => {
    if (showing && target) {
      findTarget(target)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [showing, target]);

  useEffect(() => {
    if (!showing) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showing, onClose]);

  if (!rect) return null;

  const pad = 6;
  const below = rect.top + rect.height + GAP + 180 < window.innerHeight;
  const left = Math.min(
    Math.max(16, rect.left),
    window.innerWidth - CALLOUT_WIDTH - 16,
  );
  const calloutStyle = below
    ? { left, top: rect.top + rect.height + pad + GAP }
    : { left, bottom: window.innerHeight - rect.top + pad + GAP };

  return (
    <>
      <div
        aria-hidden="true"
        className="guide-pulse pointer-events-none fixed z-[65] rounded-xl border-2 border-primary transition-shadow duration-200"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: showing ? "0 0 0 9999px rgba(2, 6, 15, 0.6)" : "none",
        }}
      />
      {showing && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="guide-callout-title"
          className="fixed z-[66] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary bg-surface p-5 text-sm shadow-2xl"
          style={{ ...calloutStyle, width: CALLOUT_WIDTH }}
        >
          <p
            id="guide-callout-title"
            className="text-xs font-bold uppercase tracking-wider accent-teal"
          >
            {title}
          </p>
          <p className="mt-2 text-base text-primary">{text}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {link ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
              >
                {link.label}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span />
            )}
            <button type="button" onClick={onClose} className="btn-op-primary">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GuideSpotlight;
