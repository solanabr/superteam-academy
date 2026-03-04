const CHALLENGE_RESULT_EVENT = "academy:challenge-result";

type ChallengeResultDetail = {
  lessonId: string;
  passed: boolean;
};

export function emitChallengeResult(detail: ChallengeResultDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ChallengeResultDetail>(CHALLENGE_RESULT_EVENT, { detail }));
}

export function onChallengeResult(listener: (detail: ChallengeResultDetail) => void) {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = (event: Event) => {
    const custom = event as CustomEvent<ChallengeResultDetail>;
    if (custom.detail) listener(custom.detail);
  };
  window.addEventListener(CHALLENGE_RESULT_EVENT, wrapped);
  return () => window.removeEventListener(CHALLENGE_RESULT_EVENT, wrapped);
}
