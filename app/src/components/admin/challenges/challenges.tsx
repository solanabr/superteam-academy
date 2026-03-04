"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getData, deleteData, postData, patchData } from "@/lib/api/config";
import type { AdminChallengeRow, AdminChallengesResponse } from "@/lib/types/admin";
import { AdminChallengesSkeleton } from "./challenges-skeleton";

const DIFFICULTY_KEYS = ["easy", "medium", "hard", "hell"] as const;

export function AdminChallengesView(): ReactNode {
  const t = useTranslations("admin.challenges");
  const t_challenges = useTranslations("challenges");
  const t_admin = useTranslations("admin");
  const query_client = useQueryClient();
  const [search_query, set_search_query] = useState("");
  const [difficulty_filter, set_difficulty_filter] = useState<string>("all");
  const [track_filter, set_track_filter] = useState("");
  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [selected_challenge, set_selected_challenge] = useState<AdminChallengeRow | null>(null);
  const [mode, set_mode] = useState<"create" | "edit">("create");
  const [metadata_feedback, set_metadata_feedback] = useState<"idle" | "applied" | "copied">("idle");
  const metadata_feedback_timeout = useRef<number | null>(null);

  type Form_state = {
    title: string;
    description: string;
    difficulty: (typeof DIFFICULTY_KEYS)[number];
    language: string;
    xp_reward: number;
    track_association: string;
  };

  type Form_errors = {
    title?: string;
    description?: string;
    difficulty?: string;
    language?: string;
    xp_reward?: string;
  };

  const [form_state, set_form_state] = useState<Form_state>({
    title: "",
    description: "",
    difficulty: "easy",
    language: "javascript",
    xp_reward: 0,
    track_association: "",
  });

  const [form_errors, set_form_errors] = useState<Form_errors>({});

  const { data, isLoading, error } = useQuery<AdminChallengesResponse>({
    queryKey: ["admin-challenges", search_query, difficulty_filter, track_filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search_query) params.set("q", search_query);
      if (difficulty_filter !== "all") params.set("difficulty", difficulty_filter);
      if (track_filter) params.set("track", track_filter);
      return getData<AdminChallengesResponse>(`/api/admin/challenges?${params.toString()}`);
    },
  });

  const reset_form_for_create = (): void => {
    set_selected_challenge(null);
    set_mode("create");
    set_form_state({
      title: "",
      description: "",
      difficulty: "easy",
      language: "javascript",
      xp_reward: 0,
      track_association: "",
    });
    set_form_errors({});
    set_is_sheet_open(true);
  };

  const open_sheet_for_row = (row: AdminChallengeRow): void => {
    set_selected_challenge(row);
    set_mode("edit");
    set_form_state({
      title: row.title,
      description: "",
      difficulty: row.difficulty as (typeof DIFFICULTY_KEYS)[number],
      language: row.language,
      xp_reward: row.xp_reward,
      track_association: row.track_association ?? "",
    });
    set_form_errors({});
    set_is_sheet_open(true);
  };

  const create_mutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      difficulty: (typeof DIFFICULTY_KEYS)[number];
      language: string;
      xp_reward: number;
      track_association: string;
    }) =>
      postData<{ id: string }>("/api/challenges/create", {
        title: payload.title,
        description: payload.description,
        difficulty: payload.difficulty,
        language: payload.language,
        xp_reward: payload.xp_reward,
        track_association: payload.track_association || undefined,
      }),
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-challenges"] });
      set_is_sheet_open(false);
    },
  });

  const update_mutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      description: string;
      difficulty: (typeof DIFFICULTY_KEYS)[number];
      language: string;
      xp_reward: number;
      track_association: string;
    }) =>
      patchData<{ ok: boolean }>(`/api/challenges/${payload.id}`, {
        title: payload.title,
        description: payload.description,
        difficulty: payload.difficulty,
        language: payload.language,
        xp_reward: payload.xp_reward,
        track_association: payload.track_association || undefined,
      }),
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-challenges"] });
      set_is_sheet_open(false);
    },
  });

  const delete_mutation = useMutation({
    mutationFn: async (id: string) => deleteData<{ ok: boolean }>(`/api/challenges/${id}`),
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-challenges"] });
    },
  });

  const metadata_template = useMemo(
    () =>
      JSON.stringify(
        {
          description:
            form_state.description ||
            "Write a function `sum(a, b)` that returns the sum of two numbers. Inputs will always be numbers. Return a number.",
          function_signature:
            form_state.language === "javascript" || form_state.language === "typescript"
              ? "function sum(a, b)"
              : "solve(...)",
          input_format:
            "Two numbers `a` and `b` separated by a space, for example:\n2 3",
          output_format: "A single integer representing the sum of `a` and `b`.",
          constraints: [
            "0.1 ≤ a, b ≤ 10^6",
            "a and b have at most 8 decimal places",
          ],
          examples: [
            {
              input: "2 3",
              output: "5",
              explanation: "2 + 3 = 5",
            },
          ],
          test_cases: [
            { input: "[1, 2]", expected: "3" },
            { input: "[-5, 5]", expected: "0" },
            { input: "[10, 15]", expected: "25" },
          ],
        },
        null,
        2,
      ),
    [form_state.description, form_state.language],
  );

  const apply_metadata_template = (): void => {
    if (metadata_feedback_timeout.current !== null) {
      window.clearTimeout(metadata_feedback_timeout.current);
      metadata_feedback_timeout.current = null;
    }
    set_form_state((previous) => ({
      ...previous,
      description: metadata_template,
    }));
    set_metadata_feedback("applied");
    metadata_feedback_timeout.current = window.setTimeout(() => {
      set_metadata_feedback("idle");
      metadata_feedback_timeout.current = null;
    }, 500);
  };

  const copy_metadata_template = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(metadata_template);
      if (metadata_feedback_timeout.current !== null) {
        window.clearTimeout(metadata_feedback_timeout.current);
        metadata_feedback_timeout.current = null;
      }
      set_metadata_feedback("copied");
      metadata_feedback_timeout.current = window.setTimeout(() => {
        set_metadata_feedback("idle");
        metadata_feedback_timeout.current = null;
      }, 500);
    } catch {
      // ignore clipboard errors
    }
  };

  const columns: ColumnDef<AdminChallengeRow>[] = useMemo(
    () => [
      { id: "title", accessorKey: "title", header: () => t_challenges("titleColumn"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.title}</span> },
      {
        id: "difficulty",
        accessorKey: "difficulty",
        header: () => t("difficulty"),
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-none text-[10px]">
            {t_challenges(row.original.difficulty)}
          </Badge>
        ),
      },
      { id: "xp_reward", accessorKey: "xp_reward", header: () => t("xpReward"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.xp_reward}</span> },
      { id: "language", accessorKey: "language", header: () => t("language"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.language}</span> },
      { id: "track", accessorKey: "track_association", header: () => t("track"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.track_association ?? "—"}</span> },
      {
        id: "status",
        header: () => t("status"),
        cell: ({ row }) => (
          <Badge variant={row.original.deleted_at ? "outline" : "default"} className="rounded-none text-[10px]">
            {row.original.deleted_at ? t("deleted") : t("active")}
          </Badge>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: () => t("createdAt"),
        cell: ({ row }) => <span className="font-mono text-[10px]">{new Date(row.original.created_at).toISOString().slice(0, 10)}</span>,
      },
      {
        id: "actions",
        header: () => "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="rounded-none text-[10px] font-mono uppercase"
            onClick={() => void delete_mutation.mutate(row.original.id)}
            disabled={delete_mutation.isPending}
          >
            {t("delete")}
          </Button>
        ),
      },
    ],
    [t, t_challenges, delete_mutation],
  );

  const table = useReactTable({
    data: data?.challenges ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-none border-border px-3 py-1 text-[10px] font-mono uppercase"
          onClick={reset_form_for_create}
        >
          {t("create")}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search_query}
          onChange={(e) => set_search_query(e.target.value)}
          className="h-9 w-64 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        />
        <select
          value={difficulty_filter}
          onChange={(e) => set_difficulty_filter(e.target.value)}
          className="h-9 w-40 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        >
          <option value="all">{t("filterDifficulty")}</option>
          {DIFFICULTY_KEYS.map((d) => (
            <option key={d} value={d}>{t_challenges(d)}</option>
          ))}
        </select>
        <Input
          placeholder={t("filterTrack")}
          value={track_filter}
          onChange={(e) => set_track_filter(e.target.value)}
          className="h-9 w-40 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <span>{(error as Error).message}</span>
        </Alert>
      )}
      {isLoading ? (
        <AdminChallengesSkeleton />
      ) : (
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => open_sheet_for_row(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-xs font-mono text-muted-foreground">
                    {t_challenges("noChallenges")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <Sheet open={is_sheet_open} onOpenChange={set_is_sheet_open}>
        <SheetContent side="right" className="w-[420px] border-border px-4 py-4">
          <SheetHeader>
            <SheetTitle className="font-archivo text-base font-bold">
              {mode === "create" ? t("create") : t("edit")}
            </SheetTitle>
          </SheetHeader>
          <Separator className="my-3" />
          <div className="space-y-3 text-xs font-mono">
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wide">{t_challenges("titleColumn")}</label>
              <Input
                value={form_state.title}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    title: event.target.value,
                  })
                }
                className="h-8 rounded-none border-border px-2 py-1 text-xs"
              />
              {form_errors.title && (
                <p className="text-[11px] text-destructive">{form_errors.title}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[11px] uppercase tracking-wide">
                  {t_admin("logs.metadata")}
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-6 rounded-none border-border px-2 py-0 text-[9px] font-mono uppercase"
                    onClick={apply_metadata_template}
                  >
                    {metadata_feedback === "applied"
                      ? t_challenges("metadataTemplateApplied")
                      : t_challenges("metadataTemplateUse")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-6 rounded-none border-border px-2 py-0 text-[9px] font-mono uppercase"
                    onClick={() => void copy_metadata_template()}
                  >
                    {metadata_feedback === "copied"
                      ? t_challenges("metadataTemplateCopied")
                      : t_challenges("metadataTemplateCopyJson")}
                  </Button>
                </div>
              </div>
              <textarea
                value={form_state.description}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    description: event.target.value,
                  })
                }
                className="h-60 w-full rounded-none border border-border bg-background px-2 py-1 text-xs"
              />
              <div className="max-h-80 w-full rounded-none border border-dashed border-border bg-background/60 px-2 py-2 text-[11px] leading-snug">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t_challenges("metadataPreview")}
                </p>
                <pre className="max-h-68 overflow-y-auto whitespace-pre-wrap">
                  {metadata_template}
                </pre>
              </div>
              {form_errors.description && (
                <p className="text-[11px] text-destructive">{form_errors.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] uppercase tracking-wide">{t("difficulty")}</label>
                <select
                  value={form_state.difficulty}
                  onChange={(event) =>
                    set_form_state({
                      ...form_state,
                      difficulty: event.target.value as (typeof DIFFICULTY_KEYS)[number],
                    })
                  }
                  className="h-8 w-full rounded-none border border-border bg-background px-2 py-1 text-xs"
                >
                  {DIFFICULTY_KEYS.map((difficulty_key) => (
                    <option key={difficulty_key} value={difficulty_key}>
                      {t_challenges(difficulty_key)}
                    </option>
                  ))}
                </select>
                {form_errors.difficulty && (
                  <p className="text-[11px] text-destructive">{form_errors.difficulty}</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] uppercase tracking-wide">{t("xpReward")}</label>
                <Input
                  type="number"
                  value={form_state.xp_reward}
                  onChange={(event) =>
                    set_form_state({
                      ...form_state,
                      xp_reward: Number.parseInt(event.target.value || "0", 10),
                    })
                  }
                  className="h-8 rounded-none border-border px-2 py-1 text-xs"
                />
                {form_errors.xp_reward && (
                  <p className="text-[11px] text-destructive">{form_errors.xp_reward}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] uppercase tracking-wide">{t("language")}</label>
                <select
                  value={form_state.language}
                  onChange={(event) =>
                    set_form_state({
                      ...form_state,
                      language: event.target.value,
                    })
                  }
                  className="h-8 w-full rounded-none border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="golang">Golang</option>
                  <option value="rust">Rust</option>
                  <option value="solidity">Solidity</option>
                  <option value="solana">Solana</option>
                </select>
                {form_errors.language && (
                  <p className="text-[11px] text-destructive">{form_errors.language}</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] uppercase tracking-wide">{t("track")}</label>
                <Input
                  value={form_state.track_association}
                  onChange={(event) =>
                    set_form_state({
                      ...form_state,
                      track_association: event.target.value,
                    })
                  }
                  className="h-8 rounded-none border-border px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-none border-border px-2 py-1 text-[10px] font-mono uppercase"
              onClick={() => set_is_sheet_open(false)}
            >
              {t_admin("cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-8 rounded-none border-border px-2 py-1 text-[10px] font-mono uppercase"
              disabled={create_mutation.isPending || update_mutation.isPending}
              onClick={() => {
                const next_errors: Form_errors = {};

                if (!form_state.title.trim()) {
                  next_errors.title = t_challenges("validationTitleRequired");
                }

                if (!form_state.description.trim()) {
                  next_errors.description = t_challenges("validationMetadataRequired");
                } else {
                  try {
                    JSON.parse(form_state.description);
                  } catch {
                    next_errors.description = t_challenges("validationMetadataInvalid");
                  }
                }

                if (!form_state.difficulty) {
                  next_errors.difficulty = t_challenges("validationDifficultyRequired");
                }

                if (!form_state.language.trim()) {
                  next_errors.language = t_challenges("validationLanguageRequired");
                }

                if (!Number.isFinite(form_state.xp_reward) || form_state.xp_reward < 0) {
                  next_errors.xp_reward = t_challenges("validationXpRewardNonNegative");
                }

                if (Object.keys(next_errors).length > 0) {
                  set_form_errors(next_errors);
                  return;
                }

                set_form_errors({});

                if (mode === "create") {
                  create_mutation.mutate({
                    title: form_state.title,
                    description: form_state.description,
                    difficulty: form_state.difficulty,
                    language: form_state.language,
                    xp_reward: form_state.xp_reward,
                    track_association: form_state.track_association,
                  });
                } else if (selected_challenge) {
                  update_mutation.mutate({
                    id: selected_challenge.id,
                    title: form_state.title,
                    description: form_state.description,
                    difficulty: form_state.difficulty,
                    language: form_state.language,
                    xp_reward: form_state.xp_reward,
                    track_association: form_state.track_association,
                  });
                }
              }}
            >
              {t_admin("confirm")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
