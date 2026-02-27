'use client';

/** High-quality Brazilian flag from Flagcdn (free, public domain). */
const BRAZIL_FLAG_SRC = 'https://flagcdn.com/w160/br.png';

/**
 * Three distinct course card icons by index:
 * 0 = Solana Fundamentals (stacked layers)
 * 1 = Building on Solana (code brackets)
 * 2 = Superteam Brazil Onboarding (Brazilian flag image)
 */
export function CourseCardIcon({ index, className = 'h-12 w-12 sm:h-14 sm:w-14 opacity-80' }: { index: number; className?: string }) {
  const i = index % 3;
  if (i === 0) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="8" y="26" width="20" height="14" rx="2" fill="rgb(34 211 238)" fillOpacity="0.9" transform="rotate(-4 18 33)" />
        <rect x="10" y="18" width="20" height="14" rx="2" fill="rgb(34 197 94)" fillOpacity="0.9" transform="rotate(2 20 25)" />
        <rect x="12" y="10" width="20" height="14" rx="2" fill="rgb(236 72 153)" fillOpacity="0.9" transform="rotate(-2 22 17)" />
      </svg>
    );
  }
  if (i === 1) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 14l-6 10 6 10" />
        <path d="M32 14l6 10-6 10" />
        <path d="M28 8l-8 32" />
      </svg>
    );
  }
  // Superteam Brazil Onboarding — real Brazilian flag image (Flagcdn, free use)
  return (
    <span className={`inline-block overflow-hidden rounded-md ring-1 ring-white/20 ${className}`} aria-hidden>
      <img
        src={BRAZIL_FLAG_SRC}
        alt=""
        width={56}
        height={40}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
