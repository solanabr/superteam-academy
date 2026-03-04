"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { AuthMethodsCard } from "@/components/auth/AuthMethodsCard";
import { AuthOnboardingForm } from "@/components/auth/AuthOnboardingForm";
import {
  getProfileBySubject,
  isProfileComplete,
  linkSubjects,
  resolveCurrentSubject,
  upsertProfile,
  type IdentitySubject,
} from "@/services/IdentityProfileService";
import { sanitizeReturnTo } from "@/lib/authRouting";

type AuthProviders = {
  google: boolean;
  github: boolean;
};

export default function AuthPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const { connected, publicKey } = useWallet();

  const walletAddress = publicKey?.toBase58() ?? null;
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo"), locale),
    [searchParams, locale],
  );

  const [providers, setProviders] = useState<AuthProviders>({
    google: false,
    github: false,
  });

  const subject = useMemo<IdentitySubject | null>(
    () => resolveCurrentSubject(session, walletAddress),
    [session, walletAddress],
  );
  const profile = useMemo(
    () => (subject ? getProfileBySubject(subject) : null),
    [subject],
  );

  const isLoggedIn = Boolean(session) || connected;
  const needsOnboarding = isLoggedIn && subject !== null && !isProfileComplete(profile);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((response) => (response.ok ? response.json() : {}))
      .then((value: Record<string, unknown>) => {
        if (!active) return;
        setProviders({
          google: Boolean(value.google),
          github: Boolean(value.github),
        });
      })
      .catch(() => {
        if (!active) return;
        setProviders({ google: false, github: false });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.providerAccountId || !walletAddress) return;
    if (session.provider !== "google" && session.provider !== "github") return;

    linkSubjects(
      { kind: "social", provider: session.provider, id: session.providerAccountId },
      { kind: "wallet", id: walletAddress },
    );
  }, [session?.provider, session?.providerAccountId, walletAddress]);

  useEffect(() => {
    if (!isLoggedIn || !subject) return;
    if (!isProfileComplete(profile)) return;
    router.replace(returnTo);
  }, [isLoggedIn, subject, profile, returnTo, router]);

  async function handleProviderSignIn(provider: "google" | "github") {
    await signIn(provider, {
      callbackUrl: `/${locale}/auth?returnTo=${encodeURIComponent(returnTo)}&mode=${mode}`,
    });
  }

  async function handleOnboardingSubmit(payload: {
    displayName: string;
    username: string;
  }) {
    if (!subject) return;
    upsertProfile(subject, payload);
    router.replace(returnTo);
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-6 text-center">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {needsOnboarding ? t("onboarding.title") : t(`header.${mode}.title`)}
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {needsOnboarding
            ? t("onboarding.subtitle")
            : t(`header.${mode}.subtitle`)}
        </p>
      </div>

      {needsOnboarding ? (
        <AuthOnboardingForm
          title={t("onboarding.formTitle")}
          subtitle={t("onboarding.formSubtitle")}
          displayNameLabel={t("onboarding.displayName.label")}
          displayNamePlaceholder={t("onboarding.displayName.placeholder")}
          usernameLabel={t("onboarding.username.label")}
          usernamePlaceholder={t("onboarding.username.placeholder")}
          submitLabel={t("onboarding.submit")}
          submittingLabel={t("onboarding.submitting")}
          validationMessage={t("onboarding.validation")}
          initialDisplayName={profile?.displayName ?? session?.user?.name ?? ""}
          initialUsername={profile?.username}
          onSubmit={handleOnboardingSubmit}
        />
      ) : (
        <AuthMethodsCard
          title={t("methods.title")}
          subtitle={
            sessionStatus === "loading" ? t("methods.checking") : t("methods.subtitle")
          }
          providers={providers}
          onGoogle={() => handleProviderSignIn("google")}
          onGithub={() => handleProviderSignIn("github")}
          walletLabel={t("methods.walletLabel")}
          googleLabel={t("methods.google")}
          githubLabel={t("methods.github")}
          googleUnavailable={t("methods.googleUnavailable")}
          githubUnavailable={t("methods.githubUnavailable")}
        />
      )}

      <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
        {t("footer.returnTo", { path: returnTo })}
      </p>
    </div>
  );
}

