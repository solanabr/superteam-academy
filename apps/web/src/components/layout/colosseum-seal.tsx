/**
 * The Colosseum wax seal — a silver globe emboss (owner 2026-09-21).
 *
 * An inline SVG RECREATION of colosseum.com's seal, not the raster itself: the
 * source asset lives behind a host this environment can't reach, and inlining
 * it here means no external fetch, no hashed-CDN-asset that 404s on their next
 * deploy, crisp at any size, and one fixed silver look in both themes. If the
 * exact raster is wanted, drop it in `public/promo/` and swap this for an
 * `<Image>` — the call site takes a className either way.
 *
 * Decorative: `aria-hidden`, so it never doubles the banner's own label.
 */
export function ColosseumSeal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="cseal-wax" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eceef0" />
          <stop offset="0.5" stopColor="#c4c9cc" />
          <stop offset="1" stopColor="#969ca0" />
        </linearGradient>
      </defs>
      {/* Irregular wax disc */}
      <path
        d="M24 2c7 0 10 3 15 5 5 2 7 7 6 14-1 6 2 10-1 16-3 6-10 8-17 8-7 0-14 2-19-3-5-5-5-12-4-18 1-6-2-12 3-16 5-4 10-6 17-6Z"
        fill="url(#cseal-wax)"
        stroke="#7f868a"
        strokeWidth="1.2"
      />
      {/* Raised inner rim */}
      <circle cx="24" cy="24" r="16" stroke="#8b9296" strokeWidth="1.6" />
      {/* Globe: outline, meridians, parallels */}
      <g stroke="#6f767a" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="24" cy="24" r="10.5" />
        <ellipse cx="24" cy="24" rx="4" ry="10.5" />
        <line x1="13.5" y1="24" x2="34.5" y2="24" />
        <line x1="15.2" y1="18.4" x2="32.8" y2="18.4" />
        <line x1="15.2" y1="29.6" x2="32.8" y2="29.6" />
      </g>
      {/* Faint top-left highlight, so the emboss reads as raised metal */}
      <g
        stroke="#f4f6f7"
        strokeWidth="0.6"
        strokeLinecap="round"
        transform="translate(-0.7 -0.7)"
        opacity="0.8"
      >
        <circle cx="24" cy="24" r="10.5" />
        <ellipse cx="24" cy="24" rx="4" ry="10.5" />
      </g>
    </svg>
  );
}
