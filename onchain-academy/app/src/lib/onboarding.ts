export const ONBOARDING_EVENT_RETAKE = "superteam:onboarding-retake";

export function getOnboardingStorageKey(walletAddress: string): string {
  return `superteam-onboarding-assessment-v2:${walletAddress}`;
}

export function clearOnboardingForWallet(walletAddress: string): void {
  window.localStorage.removeItem(getOnboardingStorageKey(walletAddress));
}

export function requestOnboardingRetake(walletAddress: string): void {
  clearOnboardingForWallet(walletAddress);
  window.dispatchEvent(
    new CustomEvent(ONBOARDING_EVENT_RETAKE, {
      detail: { walletAddress },
    }),
  );
}
