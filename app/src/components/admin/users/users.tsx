"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getData, patchData, deleteData } from "@/lib/api/config";
import type { AdminUserRow, AdminUsersResponse } from "@/lib/types/admin";
import type { AdminRoleBody } from "@/lib/validators/admin";
import { AdminUsersSkeleton } from "./users-skeleton";

type SortState = {
  id: string;
  desc: boolean;
}[];

type PendingAction =
  | {
      type: "role_admin" | "role_user";
      user: AdminUserRow;
    }
  | {
      type: "disable";
      user: AdminUserRow;
    };

export function AdminUsersView(): ReactNode {
  const t = useTranslations("admin.users");
  const t_admin = useTranslations("admin");
  const query_client = useQueryClient();

  const [search_query, set_search_query] = useState("");
  const [role_filter, set_role_filter] = useState<string | "all">("all");
  const [table_sort, set_table_sort] = useState<SortState>([]);
  const [selected_user, set_selected_user] = useState<AdminUserRow | null>(null);
  const [is_sheet_open, set_is_sheet_open] = useState(false);
  const [pending_action, set_pending_action] = useState<PendingAction | null>(null);
  const [detail_tab, set_detail_tab] = useState<"actions" | "metadata">("actions");

  const { data, isLoading, error } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users", search_query, role_filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search_query) params.set("q", search_query);
      if (role_filter !== "all") params.set("role", role_filter);
      const response = await getData<AdminUsersResponse>(`/api/admin/users?${params.toString()}`);
      return response;
    },
  });

  const role_mutation = useMutation({
    mutationFn: async (payload: AdminRoleBody) => {
      await patchData<{ ok: boolean }>("/api/admin/role", payload);
    },
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const delete_mutation = useMutation({
    mutationFn: async (user_id: string) => {
      const params = new URLSearchParams({ user_id });
      await deleteData<{ ok: boolean }>(`/api/admin/user?${params.toString()}`);
    },
    onSuccess: async () => {
      await query_client.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const handle_row_click = (user: AdminUserRow): void => {
    set_selected_user(user);
    set_detail_tab("actions");
    set_is_sheet_open(true);
  };

  const handle_confirm_action = (): void => {
    if (!pending_action) {
      return;
    }
    const { type, user } = pending_action;
    if (type === "disable") {
      delete_mutation.mutate(user.id);
    } else {
      const next_role: AdminRoleBody["role"] = type === "role_admin" ? "admin" : "user";
      role_mutation.mutate({ user_id: user.id, role: next_role });
    }
    set_pending_action(null);
  };

  const columns: ColumnDef<AdminUserRow>[] = useMemo(
    () => [
      {
        id: "email",
        accessorKey: "email",
        header: () => t("email"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span>,
      },
      {
        id: "role",
        accessorKey: "role",
        header: () => t("role"),
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-none px-2 py-1 text-[10px]">
            {t_admin(`role.${row.original.role === "super_admin" ? "superAdmin" : row.original.role}`)}
          </Badge>
        ),
      },
      {
        id: "wallet",
        accessorKey: "wallet_public_key",
        header: () => t("wallet"),
        cell: ({ row }) => (
          <span className="font-mono text-[10px]">
            {row.original.wallet_public_key ? row.original.wallet_public_key.slice(0, 8) : "—"}
          </span>
        ),
      },
      {
        id: "xp",
        accessorKey: "total_xp",
        header: () => t("xp"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.total_xp}</span>,
      },
      {
        id: "streak",
        accessorKey: "current_streak_days",
        header: () => t("currentStreak"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.current_streak_days}</span>,
      },
      {
        id: "joined",
        accessorKey: "joined_at",
        header: () => t("joinedAt"),
        cell: ({ row }) => {
          const date = new Date(row.original.joined_at);
          return <span className="font-mono text-[10px]">{date.toISOString().slice(0, 10)}</span>;
        },
      },
      {
        id: "actions",
        header: () => t("actions"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-none border-border px-0 py-0"
                aria-label={t("actions")}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-none border-border"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem
                className="text-xs font-mono uppercase tracking-wide"
                onClick={() =>
                  set_pending_action({
                    type: row.original.role === "admin" ? "role_user" : "role_admin",
                    user: row.original,
                  })
                }
              >
                {t("editRole")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="text-xs font-mono uppercase tracking-wide"
                onClick={() =>
                  set_pending_action({
                    type: "disable",
                    user: row.original,
                  })
                }
              >
                {t("softDelete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, t_admin, role_mutation, delete_mutation],
  );

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: {
      sorting: table_sort,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(table_sort) : updater;
      set_table_sort(next as SortState);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search_query}
          onChange={(event) => set_search_query(event.target.value)}
          className="h-9 w-64 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        />
        <select
          value={role_filter}
          onChange={(e) => set_role_filter(e.target.value as typeof role_filter)}
          className="h-9 w-40 rounded-none border-2 border-border bg-background px-3 py-2 text-xs font-mono"
        >
          <option value="all">{t_admin("role.user")} / {t_admin("role.admin")}</option>
          <option value="user">{t_admin("role.user")}</option>
          <option value="admin">{t_admin("role.admin")}</option>
          <option value="super_admin">{t_admin("role.superAdmin")}</option>
        </select>
      </div>
      {error && (
        <Alert variant="destructive">
          <span>{(error as Error).message}</span>
        </Alert>
      )}
      {isLoading ? (
        <AdminUsersSkeleton />
      ) : (
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((header_group) => (
                <TableRow key={header_group.id}>
                  {header_group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                    onClick={() => handle_row_click(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-xs font-mono">
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <Dialog
        open={pending_action !== null}
        onOpenChange={(open) => {
          if (!open) set_pending_action(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-none border-2 border-border bg-background px-4 py-4">
          <DialogHeader>
            <DialogTitle className="font-mono text-xs uppercase tracking-wide">
              {pending_action?.type === "disable" ? t("confirmDisableTitle") : t("confirmRoleChangeTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-xs font-mono">
            {pending_action?.type === "disable"
              ? pending_action && t("confirmDisable", { email: pending_action.user.email })
              : pending_action &&
                t("confirmRoleChange", {
                  email: pending_action.user.email,
                  role:
                    pending_action.type === "role_admin"
                      ? t_admin("role.admin")
                      : t_admin("role.user"),
                })}
          </p>
          <DialogFooter className="mt-4 flex flex-row justify-end gap-2" showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-none border-border px-2 py-1 text-[10px] font-mono uppercase"
              onClick={() => set_pending_action(null)}
            >
              {t_admin("cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-none border-destructive px-2 py-1 text-[10px] font-mono uppercase text-destructive"
              onClick={handle_confirm_action}
              disabled={role_mutation.isPending || delete_mutation.isPending}
            >
              {t_admin("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={is_sheet_open} onOpenChange={set_is_sheet_open}>
        <SheetContent
          side="right"
          className="w-[420px] border-l-2 border-border px-4 py-4 shadow-[-6px_0_0_var(--color-border)]"
        >
          {selected_user && (
            <div className="flex h-full flex-col gap-3">
              <SheetHeader>
                <SheetTitle className="font-archivo text-base font-bold">
                  {selected_user.email}
                </SheetTitle>
                <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                  {t_admin(
                    `role.${selected_user.role === "super_admin" ? "superAdmin" : selected_user.role}`,
                  )}
                </p>
              </SheetHeader>
              <Separator />
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>{t("wallet")}</span>
                  <span>
                    {selected_user.wallet_public_key
                      ? `${selected_user.wallet_public_key.slice(0, 8)}…${selected_user.wallet_public_key.slice(-4)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("xp")}</span>
                  <span>{selected_user.total_xp}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("currentStreak")}</span>
                  <span>{selected_user.current_streak_days}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("joinedAt")}</span>
                  <span>{new Date(selected_user.joined_at).toISOString().slice(0, 10)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex-1 space-y-3 overflow-y-auto text-xs font-mono">
                {detail_tab === "actions" ? (
                  <div className="flex gap-2 rounded-none border border-dashed border-border bg-muted/40 px-3 py-2">
                    <span className="font-semibold uppercase tracking-wide">{t("actionsTab")}</span>
                    <span className="text-muted-foreground">{t("historyPlaceholder")}</span>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-2">
                    <pre className="max-h-full flex-1 overflow-auto rounded-none border border-dashed border-border bg-background px-3 py-2 text-[10px] leading-relaxed">
                      {JSON.stringify(selected_user, null, 2)}
                    </pre>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-none border-border px-3 py-1 text-[10px] font-mono uppercase data-[state=copied]:bg-primary data-[state=copied]:text-primary-foreground"
                        onClick={(event) => {
                          const payload = JSON.stringify(selected_user, null, 2);
                          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                            // Fire and forget; we only need best-effort copy.
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            navigator.clipboard.writeText(payload);
                          }
                          const target = event.currentTarget;
                          target.dataset.state = "copied";
                          const original_label = target.textContent ?? "";
                          target.textContent = t("copiedMetadata");
                          window.setTimeout(() => {
                            target.dataset.state = "";
                            target.textContent = original_label;
                          }, 1500);
                        }}
                      >
                        {t("copyMetadata")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <SheetFooter className="pt-2">
                <div className="ml-auto flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-none border-border px-3 py-1 text-[10px] font-mono uppercase"
                      >
                        {t("actionsTab")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-none border-border">
                      <DropdownMenuItem
                        className="text-[10px] font-mono uppercase tracking-wide"
                        onClick={() =>
                          set_pending_action({
                            type: selected_user.role === "admin" ? "role_user" : "role_admin",
                            user: selected_user,
                          })
                        }
                      >
                        {t("editRole")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="text-[10px] font-mono uppercase tracking-wide"
                        onClick={() =>
                          set_pending_action({
                            type: "disable",
                            user: selected_user,
                          })
                        }
                      >
                        {t("softDelete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    variant={detail_tab === "metadata" ? "default" : "outline"}
                    className="h-8 rounded-none border-border px-3 py-1 text-[10px] font-mono uppercase"
                    onClick={() => set_detail_tab(detail_tab === "metadata" ? "actions" : "metadata")}
                  >
                    {t("metadataTab")}
                  </Button>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

