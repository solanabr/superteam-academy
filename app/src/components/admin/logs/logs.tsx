"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getData } from "@/lib/api/config";
import type { AdminLogRow, AdminLogsResponse } from "@/lib/types/admin";
import { AdminLogsSkeleton } from "./logs-skeleton";

function format_log_message(log: AdminLogRow, translate: (key: string, values?: Record<string, unknown>) => string): string {
  const created_date = new Date(log.created_at);
  const created_at_local = created_date.toLocaleString();
  const actor = log.actor_email ?? translate("unknownActor");

  const base_values: Record<string, unknown> = {
    actor,
    target: log.target_type ?? "",
    targetId: log.target_id ?? "",
    at: created_at_local,
  };

  if (log.action === "update_role") {
    const metadata = log.metadata as { previous_role?: string; new_role?: string } | null;
    return translate("summary.updateRole", {
      ...base_values,
      previousRole: metadata?.previous_role ?? "",
      newRole: metadata?.new_role ?? "",
    });
  }

  if (log.action === "soft_delete_user") {
    const metadata = log.metadata as { email?: string } | null;
    return translate("summary.softDeleteUser", {
      ...base_values,
      email: metadata?.email ?? "",
    });
  }

  if (log.action === "award_achievement") {
    const metadata = log.metadata as {
      achievement_id?: string;
      achievement_name?: string;
      xp_reward?: number;
    } | null;
    return translate("summary.awardAchievement", {
      ...base_values,
      achievementId: metadata?.achievement_id ?? "",
      achievementName: metadata?.achievement_name ?? "",
      xpReward: metadata?.xp_reward ?? 0,
    });
  }

  if (log.action === "challenge_create" || log.action === "challenge_update" || log.action === "challenge_soft_delete") {
    const metadata = log.metadata as {
      title?: string;
      difficulty?: string;
      xp_reward?: number;
    } | null;
    const translation_key =
      log.action === "challenge_create"
        ? "summary.challengeCreate"
        : log.action === "challenge_update"
          ? "summary.challengeUpdate"
          : "summary.challengeSoftDelete";
    return translate(translation_key, {
      ...base_values,
      title: metadata?.title ?? "",
      difficulty: metadata?.difficulty ?? "",
      xpReward: metadata?.xp_reward ?? 0,
    });
  }

  if (log.action === "achievement_create" || log.action === "achievement_update" || log.action === "achievement_deprecate") {
    const metadata = log.metadata as {
      achievement_id?: string;
      name?: string;
      xp_reward?: number;
      is_active?: boolean;
    } | null;
    const translation_key =
      log.action === "achievement_create"
        ? "summary.achievementCreate"
        : log.action === "achievement_update"
          ? "summary.achievementUpdate"
          : "summary.achievementDeprecate";
    return translate(translation_key, {
      ...base_values,
      achievementId: metadata?.achievement_id ?? "",
      name: metadata?.name ?? "",
      xpReward: metadata?.xp_reward ?? 0,
    });
  }

  return translate("summary.generic", {
    ...base_values,
    action: log.action,
  });
}

export function AdminLogsView(): ReactNode {
  const t = useTranslations("admin.logs");
  const [actor_filter, set_actor_filter] = useState("");
  const [action_filter, set_action_filter] = useState("");
  const [selected_log, set_selected_log] = useState<AdminLogRow | null>(null);
  const [is_sheet_open, set_is_sheet_open] = useState(false);

  const { data, isLoading, error } = useQuery<AdminLogsResponse>({
    queryKey: ["admin-logs", actor_filter, action_filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actor_filter) params.set("actor", actor_filter);
      if (action_filter) params.set("action", action_filter);
      return getData<AdminLogsResponse>(`/api/admin/logs?${params.toString()}`);
    },
  });

  const columns: ColumnDef<AdminLogRow>[] = useMemo(
    () => [
      {
        id: "summary",
        header: () => t("actionType"),
        cell: ({ row }) => (
          <span className="font-mono text-[10px]">
            {format_log_message(row.original, t)}
          </span>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: () => t("date"),
        cell: ({ row }) => (
          <span className="font-mono text-[10px]">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
    ],
    [t],
  );

  const table = useReactTable({ data: data?.logs ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("filterActor")}
          value={actor_filter}
          onChange={(e) => set_actor_filter(e.target.value)}
          className="h-9 w-48 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        />
        <Input
          placeholder={t("filterAction")}
          value={action_filter}
          onChange={(e) => set_action_filter(e.target.value)}
          className="h-9 w-40 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <span>{(error as Error).message}</span>
        </Alert>
      )}
      {isLoading ? (
        <AdminLogsSkeleton />
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
                    onClick={() => {
                      set_selected_log(row.original);
                      set_is_sheet_open(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-xs font-mono text-muted-foreground">
                    {t("noRows")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <Sheet open={is_sheet_open} onOpenChange={set_is_sheet_open}>
        <SheetContent side="right" className="w-[420px] border-border px-4 py-4">
          {selected_log && (
            <>
              <SheetHeader>
                <SheetTitle className="font-archivo text-base font-bold">
                  {t("detailsTitle")}
                </SheetTitle>
              </SheetHeader>
              <Separator className="my-3" />
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("actor")}</p>
                  <p>{selected_log.actor_email ?? t("unknownActor")}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("date")}</p>
                  <p>{new Date(selected_log.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("actionType")}</p>
                  <p>
                    {format_log_message(selected_log, t)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("target")}</p>
                  <p>
                    {(selected_log.target_type ?? "—")}{selected_log.target_id ? ` (${selected_log.target_id})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("metadata")}</p>
                  <pre className="mt-1 max-h-48 overflow-auto rounded-none border border-border bg-muted px-2 py-2 text-[10px]">
                    {selected_log.metadata ? JSON.stringify(selected_log.metadata, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
