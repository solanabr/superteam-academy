"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

/** Returns the URL only if it is a safe relative path (starts with / but not //). */
function getSafeCallbackUrl(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/courses";
}

function SignInContent() {
  const t = useTranslations("auth");
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("signInTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("signInSubtitle")}
            </p>
            <p className="mt-3 text-xs font-medium text-primary/80">
              {t("socialProof")}
            </p>
          </div>

          <OAuthButtons callbackUrl={callbackUrl} />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("termsText")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div
            role="status"
            aria-label="Loading"
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
