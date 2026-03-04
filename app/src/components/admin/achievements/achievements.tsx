"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getData, patchData, postData } from "@/lib/api/config";
import type { AdminAchievementRow, AdminAchievementsResponse } from "@/lib/types/admin";
import { AdminAchievementsSkeleton } from "./achievements-skeleton";

export function AdminAchievementsView(): ReactNode {
  const t = useTranslations("admin.achievements");
  const t_admin = useTranslations("admin");
  const query_client = useQueryClient();

  const { data, isLoading, error } = useQuery<AdminAchievementsResponse>({
    queryKey: ["admin-achievements"],
    queryFn: () => getData<AdminAchievementsResponse>("/api/admin/achievements"),
  });

  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [mode, set_mode] = useState<"create" | "edit">("create");
  const [selected, set_selected] = useState<AdminAchievementRow | null>(null);

  type Form_state = {
    achievement_id: string;
    name: string;
    metadata_uri: string;
    xp_reward: number;
    supply_cap: number | "";
    is_active: boolean;
  };

  const [form_state, set_form_state] = useState<Form_state>({
    achievement_id: "",
    name: "",
    metadata_uri: "",
    xp_reward: 0,
    supply_cap: "",
    is_active: true,
  });

  const open_create_sheet = (): void => {
    set_selected(null);
    set_mode("create");
    set_form_state({
      achievement_id: "",
      name: "",
      metadata_uri: "",
      xp_reward: 0,
      supply_cap: "",
      is_active: true,
    });
    set_is_sheet_open(true);
  };

  const open_edit_sheet = (row: AdminAchievementRow): void => {
    set_selected(row);
    set_mode("edit");
    set_form_state({
      achievement_id: row.achievement_id,
      name: row.name,
      metadata_uri: "",
      xp_reward: row.xp_reward,
      supply_cap: row.supply_cap ?? "",
      is_active: row.is_active,
    });
    set_is_sheet_open(true);
  };

  const create_mutation = useMutation({
    mutationFn: async (payload: Form_state) =>
      postData<{ id: string }>("/api/admin/achievements", {
        achievement_id: payload.achievement_id,
        name: payload.name,
        metadata_uri: payload.metadata_uri,
        xp_reward: payload.xp_reward,
        supply_cap: payload.supply_cap === "" ? undefined : payload.supply_cap,
        is_active: payload.is_active,
      }),
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-achievements"] });
      set_is_sheet_open(false);
    },
  });

  const update_mutation = useMutation({
    mutationFn: async (payload: { id: string; form: Form_state }) =>
      patchData<{ ok: boolean }>("/api/admin/achievements", {
        id: payload.id,
        name: payload.form.name,
        metadata_uri: payload.form.metadata_uri || undefined,
        xp_reward: payload.form.xp_reward,
        supply_cap: payload.form.supply_cap === "" ? undefined : payload.form.supply_cap,
        is_active: payload.form.is_active,
      }),
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-achievements"] });
      set_is_sheet_open(false);
    },
  });

  const columns: ColumnDef<AdminAchievementRow>[] = useMemo(
    () => [
      { id: "achievement_id", accessorKey: "achievement_id", header: () => t("id"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.achievement_id}</span> },
      { id: "name", accessorKey: "name", header: () => t("name"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.name}</span> },
      { id: "xp_reward", accessorKey: "xp_reward", header: () => t("xpReward"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.xp_reward}</span> },
      {
        id: "status",
        header: () => t("status"),
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "outline"} className="rounded-none text-[10px]">
            {row.original.is_active ? t("active") : t("deprecated")}
          </Badge>
        ),
      },
      { id: "supply_cap", accessorKey: "supply_cap", header: () => t("supplyCap"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.supply_cap ?? "—"}</span> },
      { id: "current_supply", accessorKey: "current_supply", header: () => t("currentSupply"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.current_supply}</span> },
    ],
    [t],
  );

  const table = useReactTable({ data: data?.achievements ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-none border-border px-3 py-1 text-[10px] font-mono uppercase"
          onClick={open_create_sheet}
        >
          {t("create")}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <span>{(error as Error).message}</span>
        </Alert>
      )}
      {isLoading ? (
        <AdminAchievementsSkeleton />
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
                    onClick={() => open_edit_sheet(row.original)}
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
          <SheetHeader>
            <SheetTitle className="font-archivo text-base font-bold">
              {mode === "create" ? t("create") : t("update")}
            </SheetTitle>
          </SheetHeader>
          <Separator className="my-3" />
          <div className="space-y-3 text-xs font-mono">
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wide">{t("id")}</label>
              <Input
                value={form_state.achievement_id}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    achievement_id: event.target.value,
                  })
                }
                className="h-8 rounded-none border-border px-2 py-1 text-xs"
                disabled={mode === "edit"}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wide">{t("name")}</label>
              <Input
                value={form_state.name}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    name: event.target.value,
                  })
                }
                className="h-8 rounded-none border-border px-2 py-1 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wide">Metadata URI</label>
              <Input
                value={form_state.metadata_uri}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    metadata_uri: event.target.value,
                  })
                }
                className="h-8 rounded-none border-border px-2 py-1 text-xs"
              />
            </div>
            <div className="flex gap-2">
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
              </div>
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] uppercase tracking-wide">{t("supplyCap")}</label>
                <Input
                  type="number"
                  value={form_state.supply_cap}
                  onChange={(event) =>
                    set_form_state({
                      ...form_state,
                      supply_cap: event.target.value === "" ? "" : Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="h-8 rounded-none border-border px-2 py-1 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wide">{t("status")}</label>
              <select
                value={form_state.is_active ? "active" : "deprecated"}
                onChange={(event) =>
                  set_form_state({
                    ...form_state,
                    is_active: event.target.value === "active",
                  })
                }
                className="h-8 w-full rounded-none border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="active">{t("active")}</option>
                <option value="deprecated">{t("deprecated")}</option>
              </select>
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
              variant="outline"
              className="h-8 rounded-none border-border px-2 py-1 text-[10px] font-mono uppercase"
              disabled={create_mutation.isPending || update_mutation.isPending}
              onClick={() => {
                if (!form_state.name || !form_state.achievement_id) {
                  return;
                }
                if (mode === "create") {
                  create_mutation.mutate(form_state);
                } else if (selected) {
                  update_mutation.mutate({
                    id: selected.id,
                    form: form_state,
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
