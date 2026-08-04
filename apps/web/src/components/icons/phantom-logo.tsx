interface PhantomLogoProps {
  className?: string;
}

/**
 * Phantom's ghost mark, for the Connect entry point in the auth modal (#985).
 *
 * Decorative: the adjacent button label carries the meaning, so it is hidden
 * from assistive tech rather than duplicating "Continue with Phantom".
 */
export function PhantomLogo({ className }: PhantomLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="128" height="128" rx="28" fill="#AB9FF2" />
      <path
        d="M104.5 64.2c0-19.2-15.6-34.7-34.8-34.7-19 0-34.4 15.1-34.8 34-.4 19.5 15.4 36.5 35 36.5h1.9c9 0 21-7 26-16.4.4-.7-.4-1.5-1.1-1.1-4.5 2.7-9.8 4.3-15.3 4.3-13.6 0-24.6-11-24.6-24.6 0-3.3 2.7-6 6-6s6 2.7 6 6c0 7 5.6 12.6 12.6 12.6S94 68.9 94 61.9v-.3c0-.9.7-1.6 1.6-1.6h7.3c.9 0 1.6.7 1.6 1.6v2.6z"
        fill="#fff"
      />
      <circle cx="55" cy="59" r="5" fill="#AB9FF2" />
      <circle cx="76" cy="59" r="5" fill="#AB9FF2" />
    </svg>
  );
}
