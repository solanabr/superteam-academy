/**
 * Platform-aware keyboard helpers for the Monaco editor a11y affordance
 * (LX-C5 / #568, WCAG 2.1.2 "No Keyboard Trap").
 *
 * Monaco traps the Tab key by design (Tab indents). The built-in escape is
 * "Toggle Tab Key Moves Focus", bound to Ctrl+M on Windows/Linux and
 * Ctrl+Shift+M on macOS. A hardcoded "Ctrl+M" hint would leave macOS keyboard
 * users trapped, so the advertised chord must be chosen per platform.
 */

const APPLE_PLATFORM_RE = /mac|iphone|ipad|ipod/i;

/** The subset of `Navigator` the detection reads (injectable for tests). */
export interface PlatformSource {
  platform: string;
  userAgent: string;
}

/**
 * True on macOS / iOS. `navigator.platform` is deprecated but still the most
 * reliable signal in every shipping engine; the user agent is the fallback for
 * engines that return an empty platform. Returns false when no navigator
 * exists (SSR), where the caller should defer until the client mounts.
 */
export function isApplePlatform(
  source: PlatformSource | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator
): boolean {
  if (!source) return false;
  return APPLE_PLATFORM_RE.test(source.platform || source.userAgent);
}

/**
 * The chord that toggles Monaco's "Tab moves focus" mode on this platform.
 * Human-readable (fed into the translated affordance copy), matching the
 * keybinding Monaco actually registers for `editor.action.toggleTabFocusMode`.
 */
export function tabFocusModeChord(source?: PlatformSource): string {
  return isApplePlatform(source) ? "Ctrl+Shift+M" : "Ctrl+M";
}
