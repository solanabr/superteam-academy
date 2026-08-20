import { getTranslations } from "next-intl/server";
import { getAuthClaims } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { buildReviewSession } from "@/lib/review/session";
import { ReviewSession } from "@/components/review/review-session";

/**
 * /review — the top-level spaced-retrieval surface (LX-B5). Server-resolved so
 * the due queue is read through the capped `getDueReviewItems` primitive and
 * lessons are resolved from the server-only content bundle before anything
 * reaches the client. Auth is enforced by middleware (`/review` is a protected
 * route); the `!user` branch is defense-in-depth.
 */
export default async function ReviewPage() {
  const supabase = await createClient();
  const claims = await getAuthClaims();
  const t = await getTranslations("review");

  if (!claims) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-2 font-display text-xl font-black">
          {t("signInTitle")}
        </h1>
        <p className="text-text-3">{t("signInHint")}</p>
      </div>
    );
  }

  const items = await buildReviewSession(supabase, claims.sub);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-text-3">{t("subtitle")}</p>
      </header>
      <ReviewSession items={items} />
    </div>
  );
}
