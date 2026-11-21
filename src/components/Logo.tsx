import { MONOGRAM_BOX as M, MONOGRAM_PATH, WORDMARK_BOX as W, WORDMARK_PATHS } from "./logo-paths";

/** Monogram height relative to the "THE VAK" letters (the source file has it at 2×). */
const MONOGRAM_SCALE_TO_TEXT = 1.15;
const GAP = 44;

/**
 * The Vak lockup as inline SVG: the V-A-K monogram (coloured with --logo-mark) next to the
 * THE VAK letters (currentColor). Inline rather than <img> so CSS can colour each part.
 * `wordmark={false}` renders the monogram alone (brand sites put their own name next to it).
 */
export function Logo({ wordmark = true, title = "The Vak" }: { wordmark?: boolean; title?: string }) {
  const s = (W.h * MONOGRAM_SCALE_TO_TEXT) / M.h;
  const mh = M.h * s;
  const mw = M.w * s;
  const cy = W.y + W.h / 2;
  const top = cy - mh / 2;
  const width = wordmark ? mw + GAP + W.w : mw;
  return (
    <svg
      className={wordmark ? "logo-lockup" : "logo-monogram-svg"}
      viewBox={`0 ${top} ${width} ${mh}`}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={MONOGRAM_PATH} fill="var(--logo-mark)" transform={`translate(0 ${top}) scale(${s}) translate(${-M.x} ${-M.y})`} />
      {wordmark ? (
        <g fill="currentColor" transform={`translate(${mw + GAP - W.x} 0)`}>
          {WORDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
