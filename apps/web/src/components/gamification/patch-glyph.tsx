"use client";

/**
 * A patch's glyph — text where the shipped font can draw it, vector where it
 * cannot.
 *
 * The spec asks for JetBrains Mono glyphs and warns that a mark falling back to
 * another font "will look thin, off-centre or tilted". The vendored font is a
 * LATIN SUBSET: it covers everything the catalog's text glyphs need ("01",
 * "30", "7×", "Rs", "!") but none of the symbol marks (∞ ★ ✩ ⬡ ◎), which
 * therefore render from whatever symbol font the reader's OS happens to supply.
 * Those fallbacks disagree on advance width and on vertical position, so no
 * fixed optical nudge can centre them everywhere — measured against this repo's
 * own stack the correction each one needs ranges from +0.01em to −0.10em, and a
 * different OS would want different numbers again.
 *
 * So the symbol marks ship as paths instead: same shapes, drawn on a square
 * viewBox with their ink box centred on the origin, identical on every
 * platform. The text glyphs stay text — measured, they sit within 0.01em of
 * centre with no nudge at all.
 *
 * These are the spec's own marks redrawn, not interface iconography; Phosphor
 * stays in the interface, as the spec requires.
 */

/** Five-pointed star, outer r 40 / inner r 15.9, ink box centred on (50,50). */
const STAR =
  "M50.00 13.82 L59.35 40.96 L88.04 41.46 L65.12 58.73 L73.51 86.18 " +
  "L50.00 69.72 L26.49 86.18 L34.88 58.73 L11.96 41.46 L40.65 40.96Z";

const MARKS: Record<string, React.ReactNode> = {
  "★": <path d={STAR} fill="currentColor" />,
  "✩": (
    <path
      d={STAR}
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinejoin="round"
    />
  ),
  // Two tangent circles meeting exactly on the centre line.
  "∞": (
    <g fill="none" stroke="currentColor" strokeWidth="9">
      <circle cx="33" cy="50" r="17" />
      <circle cx="67" cy="50" r="17" />
    </g>
  ),
  // Regular hexagon, point up.
  "⬡": (
    <path
      d="M50 12 L82.91 29 L82.91 71 L50 88 L17.09 71 L17.09 29Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinejoin="round"
    />
  ),
  // Bullseye: ring plus a solid centre.
  "◎": (
    <g>
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
      />
      <circle cx="50" cy="50" r="16" fill="currentColor" />
    </g>
  ),
};

export function PatchGlyph({ glyph }: { glyph: string }) {
  const mark = MARKS[glyph];

  if (mark) {
    return (
      <svg className="patch-mark" viewBox="0 0 100 100" aria-hidden="true">
        {mark}
      </svg>
    );
  }

  return <span className="patch-text">{glyph}</span>;
}
