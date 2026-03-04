"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { useAPIQuery, useAPIMutation } from "@/lib/api/useAPI";
import { Button } from "@/components/ui/button";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { parse_challenge_spec } from "@/lib/challenge-spec-parser";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, MinusIcon, PlusIcon } from "lucide-react";

const ChallengeCodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  starter_code?: string | null;
  xp_reward?: number;
  language?: string | null;
  time_estimate_minutes?: number | null;
  track_association?: string | null;
  test_cases?: Array<{ input: string; expected: string }>;
};

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["value"];

export function ChallengeDetailView({ challenge_id }: { challenge_id: string }) {
  const t = useTranslations("challenges");
  const t_common = useTranslations("common");
  const locale = useLocale();
  const query_client = useQueryClient();

  const [solution, set_solution] = useState("");
  const [submit_error, set_submit_error] = useState<string | null>(null);
  const [submit_success, set_submit_success] = useState(false);
  const [language, set_language] = useState<SupportedLanguage>("javascript");
  const [details_open, set_details_open] = useState(true);

  const { data: challenge, isPending, error } = useAPIQuery<Challenge>({
    queryKey: ["challenge", challenge_id],
    path: `/api/challenges/${challenge_id}`,
  });

  const spec = useMemo(
    () => parse_challenge_spec(challenge?.description ?? null, locale),
    [challenge?.description, locale],
  );

  useEffect(() => {
    if (!challenge) return;
    const normalized = (challenge.language ?? "javascript").toLowerCase();
    const initial_language: SupportedLanguage =
      normalized === "typescript" ? "typescript" : "javascript";

    const starter_from_spec =
      spec?.starter_code && spec.starter_code.length > 0 ? spec.starter_code : null;

    const starter_from_challenge =
      challenge.starter_code && challenge.starter_code.length > 0
        ? challenge.starter_code
        : null;

    const starter = starter_from_spec ?? starter_from_challenge ?? "";

    const id = window.setTimeout(() => {
      set_language((current) => (current === "javascript" ? initial_language : current));
      set_solution((current) => (current === "" ? starter : current));
    }, 0);

    return () => window.clearTimeout(id);
  }, [challenge, spec]);

  const submit_mutation = useAPIMutation<{ passed: boolean; xp_awarded: number }>(
    "patch",
    `/api/challenges/${challenge_id}/submit`,
  );

  const handle_submit = async () => {
    set_submit_error(null);
    try {
      const result = await submit_mutation.mutateAsync({ solution_code: solution });
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ["profile"] }),
        query_client.invalidateQueries({ queryKey: ["leaderboard"] }),
        query_client.invalidateQueries({ queryKey: ["achievements"] }),
      ]);
      set_submit_success(result.passed);
    } catch (err) {
      set_submit_success(false);
      set_submit_error(err instanceof Error ? err.message : "Submit failed");
    }
  };

  if (isPending) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8 md:px-6">
        <p className="text-sm text-muted-foreground">{t_common("loading")}</p>
        <EditorSkeleton />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <p className="text-sm text-destructive">{error?.message ?? "Not found"}</p>
      </div>
    );
  }

  const difficulty_source = spec?.difficulty ?? challenge.difficulty;
  const difficulty_key = difficulty_source as "easy" | "medium" | "hard" | "hell";
  const xp_display = spec?.xp_reward ?? challenge.xp_reward ?? 0;
  const language_display = (spec?.language ?? challenge.language ?? "javascript").toLowerCase();
  const track_display = spec?.track_association ?? challenge.track_association ?? null;
  const time_estimate_display =
    typeof spec?.time_estimate_minutes === "number"
      ? spec.time_estimate_minutes
      : challenge.time_estimate_minutes ?? null;
  const api_test_cases = challenge.test_cases ?? [];

  return (
    <div className="w-full mx-auto flex flex-col h-full lg:h-[80vh] lg:flex-row lg:items-start">
      <section aria-label={t("title")} className="w-full px-2 lg:max-w-md lg:pr-4 lg:pl-0">
        <div className="mb-3">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            {t("backToChallenges")}
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            {spec?.title ?? challenge.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("difficulty")}: {t(difficulty_key)} · {t("xpReward")}: {xp_display}
          </p>
        </div>

        <div className="mt-3 rounded-none border-2 border-border bg-card shadow-[3px_3px_0_0_hsl(var(--foreground)/0.25)]">
          <button
            type="button"
            onClick={() => set_details_open((previous) => !previous)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            aria-expanded={details_open}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("title")}
              </p>
              <p className="text-sm text-foreground">
                {spec?.title ?? challenge.title}
              </p>
            </div>
            <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              {details_open ?
                <MinusIcon size={16} /> :
                <PlusIcon size={16} />
              }
            </span>
          </button>

          {details_open && (
            <div className="border-t border-border p-4 text-sm leading-relaxed max-h-[60vh] overflow-y-auto space-y-4">
              <div className="space-y-3">
                {spec?.description && (
                  <p className="whitespace-pre-wrap text-foreground">{spec.description}</p>
                )}
                {!spec?.description && challenge.description && (
                  <p className="whitespace-pre-wrap text-foreground">{challenge.description}</p>
                )}

                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Language:</span>{" "}
                    {language_display}
                  </p>
                  {(typeof time_estimate_display === "number" && time_estimate_display > 0) && (
                    <p>
                      <span className="font-semibold text-foreground">Estimated Time:</span>{" "}
                      {time_estimate_display} min
                    </p>
                  )}
                  {track_display && typeof track_display === "string" && track_display.length > 0 && (
                    <p>
                      <span className="font-semibold text-foreground">Track:</span>{" "}
                      {track_display}
                    </p>
                  )}
                  {api_test_cases.length > 0 && (
                    <p>
                      <span className="font-semibold text-foreground">Test cases:</span>{" "}
                      {api_test_cases.length}
                    </p>
                  )}
                </div>

                {spec?.function_signature && (
                  <div className="mt-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Function
                    </h2>
                    <p className="mt-1 font-mono text-xs text-foreground">
                      {spec.function_signature}
                    </p>
                  </div>
                )}

                {spec?.starter_code && (
                  <div className="mt-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Starter Code
                    </h2>
                    <pre className="mt-1 rounded-none border border-border bg-background p-2 font-mono text-[11px] leading-snug text-foreground whitespace-pre-wrap">
                      {spec.starter_code}
                    </pre>
                  </div>
                )}

                {spec?.input_format && (
                  <div className="mt-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Input Format
                    </h2>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                      {spec.input_format}
                    </p>
                  </div>
                )}

                {spec?.output_format && (
                  <div className="mt-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Output Format
                    </h2>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                      {spec.output_format}
                    </p>
                  </div>
                )}

                {spec?.constraints && (
                  <div className="mt-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Constraints
                    </h2>
                    {Array.isArray(spec.constraints) ? (
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-foreground">
                        {spec.constraints.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                        {spec.constraints}
                      </p>
                    )}
                  </div>
                )}

                {spec?.examples && spec.examples.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Examples
                    </h2>
                    {spec.examples.map((example, index) => (
                      <div
                        key={index}
                        className="rounded-none border border-border bg-background px-3 py-2 text-xs"
                      >
                        {example.input && (
                          <p>
                            <span className="font-semibold">Input:</span> {example.input}
                          </p>
                        )}
                        {example.output && (
                          <p>
                            <span className="font-semibold">Output:</span> {example.output}
                          </p>
                        )}
                        {example.explanation && (
                          <p className="mt-1 text-muted-foreground">
                            {example.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(spec?.test_cases && spec.test_cases.length > 0) && (
                <div className="mt-2 space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Test Cases
                  </h2>
                  <div className="space-y-2">
                    {spec.test_cases.map((test_case, index) => (
                      <div
                        key={index}
                        className="rounded-none border border-border bg-background px-3 py-2 text-xs"
                      >
                        <p className="mb-1 font-semibold text-muted-foreground">
                          Case {index + 1}
                        </p>
                        {test_case.input && (
                          <p className="font-mono">
                            <span className="font-semibold">Input:</span> {test_case.input}
                          </p>
                        )}
                        {test_case.expected && (
                          <p className="font-mono">
                            <span className="font-semibold">Expected:</span> {test_case.expected}
                          </p>
                        )}
                        {test_case.explanation && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {test_case.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!spec?.test_cases || spec.test_cases.length === 0) && api_test_cases.length > 0 && (
                <div className="mt-2 space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Test Cases
                  </h2>
                  <div className="space-y-2">
                    {api_test_cases.map((tc, index) => (
                      <div
                        key={index}
                        className="rounded-none border border-border bg-background px-3 py-2 text-xs"
                      >
                        <p className="mb-1 font-semibold text-muted-foreground">
                          Case {index + 1}
                        </p>
                        {tc.input && (
                          <p className="font-mono">
                            <span className="font-semibold">Input:</span> {tc.input}
                          </p>
                        )}
                        {tc.expected && (
                          <p className="font-mono">
                            <span className="font-semibold">Expected:</span> {tc.expected}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="hidden h-full py-4 lg:block">
        <Separator orientation="vertical" />
      </div>

      <section aria-label="Editor" className="w-full space-y-3 px-4 pt-4 pb-24 lg:p-4 h-[70vh] lg:h-full">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("difficulty")}: {t(difficulty_key)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="language-select"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("language")}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => set_language(event.target.value as SupportedLanguage)}
              className="h-8 rounded-none border-2 border-border bg-background px-2 text-xs font-mono"
            >
              {SUPPORTED_LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full h-full max-h-[90%] rounded-none bg-muted/30 p-3">
          <ChallengeCodeEditor
            storageKey={`challenge:${challenge_id}:${language}`}
            language={language}
            initialCode={solution}
            onChange={set_solution}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-2 border-border text-xs font-mono uppercase tracking-wide"
            disabled={submit_mutation.isPending}
            onClick={handle_submit}
          >
            {t("submit")}
          </Button>
          {submit_mutation.isPending && (
            <p className="text-xs text-muted-foreground">{t_common("loading")}</p>
          )}
        </div>

        {submit_success && (
          <p className="text-xs text-primary">{t("submitSuccess")}</p>
        )}
        {submit_error && (
          <p className="text-xs text-destructive">{submit_error}</p>
        )}
      </section>
    </div>
  );
}
