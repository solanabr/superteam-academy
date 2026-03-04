export const MOCK_USER_KEY = "academy_mock_user";
export const MOCK_ONBOARDING_KEY = "academy_onboarding";

export type MockUser = {
  name?: string;
  email?: string;
};

export type LearnerSession = {
  learnerId: string;
  displayName: string;
  email: string | null;
  walletAddress: string | null;
  authMethods: string[];
  isGuest: boolean;
};

export function readMockUser(): MockUser | null {
  return null;
}

export function writeMockUser(user: MockUser) {
  void user;
  return;
}

export function clearMockUser() {
  return;
}

export type AuthUserLike = {
  id: string;
  email?: string | null;
  walletAddress?: string | null;
};

export function resolveLearnerSession(params: {
  walletAddress?: string | null;
  authUser?: AuthUserLike | null;
}): LearnerSession {
  const { walletAddress = null, authUser = null } = params;
  const authEmail = authUser?.email ?? null;
  const authWallet = authUser?.walletAddress ?? null;
  const normalizedWallet = walletAddress ?? authWallet ?? null;

  const learnerId = authUser?.id ?? normalizedWallet ?? "guest";
  const displayName =
    authEmail?.split("@")[0] ??
    (normalizedWallet ? `${normalizedWallet.slice(0, 4)}...${normalizedWallet.slice(-4)}` : "Guest");

  const methods: string[] = [];
  if (normalizedWallet) methods.push("wallet");
  if (authEmail) methods.push("email");
  if (methods.length === 0) methods.push("guest");

  return {
    learnerId,
    displayName,
    email: authEmail,
    walletAddress: normalizedWallet,
    authMethods: methods,
    isGuest: learnerId === "guest",
  };
}
