"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getData, postData } from "@/lib/api/config";
import type { AdminLeaderboardStatusResponse } from "@/lib/types/admin";
import { AdminLeaderboardSkeleton } from "./leaderboard-skeleton";

export function AdminLeaderboardView(): ReactNode {
  const t = useTranslations("admin.leaderboard");
  const query_client = useQueryClient();
  const [refresh_error, set_refresh_error] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<AdminLeaderboardStatusResponse>({
    queryKey: ["admin-leaderboard-status"],
    queryFn: () => getData<AdminLeaderboardStatusResponse>("/api/admin/leaderboard/status"),
  });

  const refresh_mutation = useMutation({
    mutationFn: () => postData<{ ok: boolean }>("/api/admin/leaderboard/refresh", {}),
    onSuccess: async () => {
      set_refresh_error(null);
      await query_client.invalidateQueries({ queryKey: ["admin-leaderboard-status"] });
    },
    onError: (err) => {
      set_refresh_error(err instanceof Error ? err.message : "Refresh failed");
    },
  });

  if (isLoading) return <AdminLeaderboardSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
      {(error || refresh_error) && (
        <Alert variant="destructive">
          <span>{(refresh_error ?? (error as Error)?.message) ?? ""}</span>
        </Alert>
      )}
      <div className="grid gap-4 border border-border p-4 md:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{t("lastRefresh")}</p>
          <p className="mt-1 font-mono text-sm">
            {data?.last_refresh_at ? new Date(data.last_refresh_at).toLocaleString() : "—"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{t("totalUsers")}</p>
          <p className="mt-1 font-mono text-sm">{data?.total_indexed ?? 0}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-wide"
          onClick={() => void refresh_mutation.mutate()}
          disabled={refresh_mutation.isPending}
        >
          {refresh_mutation.isPending ? "…" : t("refresh")}
        </Button>
        {refresh_mutation.isSuccess && (
          <Badge variant="outline" className="rounded-none text-[10px]">
            {t("queued")}
          </Badge>
        )}
      </div>
    </div>
  );
}
