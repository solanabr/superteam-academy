export const DEFAULT_ONBOARDING_COURSE_SLUG = "intro-to-solana";
const ONBOARDING_KEY_PREFIX = "stbr:onboarding:v1:";

export interface OnboardingState {
  completedAt: string;
  recommendedCourseSlug: string;
}

function getOnboardingStorageKey(walletAddress: string): string {
  return `${ONBOARDING_KEY_PREFIX}${walletAddress.trim()}`;
}

export function getOnboardingState(walletAddress: string): OnboardingState | null {
  if (typeof window === "undefined") return null;
  const wallet = walletAddress.trim();
  if (!wallet) return null;

  try {
    const raw = window.localStorage.getItem(getOnboardingStorageKey(wallet));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    if (typeof parsed?.completedAt !== "string") return null;
    return {
      completedAt: parsed.completedAt,
      recommendedCourseSlug:
        typeof parsed.recommendedCourseSlug === "string" && parsed.recommendedCourseSlug.trim().length > 0
          ? parsed.recommendedCourseSlug
          : DEFAULT_ONBOARDING_COURSE_SLUG,
    };
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding(walletAddress: string): boolean {
  return getOnboardingState(walletAddress) !== null;
}

export function completeOnboarding(walletAddress: string, recommendedCourseSlug: string): void {
  if (typeof window === "undefined") return;
  const wallet = walletAddress.trim();
  if (!wallet) return;

  const state: OnboardingState = {
    completedAt: new Date().toISOString(),
    recommendedCourseSlug:
      recommendedCourseSlug.trim().length > 0 ? recommendedCourseSlug : DEFAULT_ONBOARDING_COURSE_SLUG,
  };

  try {
    window.localStorage.setItem(getOnboardingStorageKey(wallet), JSON.stringify(state));
  } catch {
    // Best-effort local persistence only.
  }
}
