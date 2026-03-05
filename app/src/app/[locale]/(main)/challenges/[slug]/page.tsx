import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  getAllChallenges,
  getChallengeDifficultyLabel as getDifficultyLabel,
} from "@/services/cms";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChallengePlayground } from "@/components/challenge-playground";
import ReactMarkdown from "react-markdown";

type Props = { params: Promise<{ slug: string }> };

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("challenges");
  const challenges = await getAllChallenges();
  const challenge = challenges.find((c) => c.slug === slug);
  if (!challenge) notFound();

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
        <Link href="/challenges">
          <ArrowLeft className="h-4 w-4" />
          {t("backToChallenges")}
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="card-badge rounded-md bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
            {challenge.track}
          </span>
          <span className="card-badge rounded-md bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
            {getDifficultyLabel(challenge.difficulty)}
          </span>
          <span className="card-badge rounded-md bg-[hsl(var(--brand-logo-green))] px-2 py-0.5 text-xs font-medium text-white">
            {challenge.reward}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md sm:text-3xl">
          {challenge.title}
        </h1>
        {challenge.description && (
          <p className="mt-2 text-muted-foreground">{challenge.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1 text-sm text-muted-foreground">
          {challenge.tags.map((tag) => (
            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Split layout: instructions + editor */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instructions panel */}
        <div className="rounded-lg border bg-card p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{challenge.challengeBlock.prompt}</ReactMarkdown>
          </div>
          {challenge.challengeBlock.testCases.length > 0 && (
            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-semibold">
                {t("testCases")} ({challenge.challengeBlock.testCases.length})
              </h4>
              <ul className="space-y-1">
                {challenge.challengeBlock.testCases.map((tc, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">
                      {tc.input}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="min-h-[500px]">
          <ChallengePlayground challengeBlock={challenge.challengeBlock} />
        </div>
      </div>
    </div>
  );
}
