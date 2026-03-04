"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getData } from "@/lib/api/config";
import type { AdminCertificateRow, AdminCertificatesResponse } from "@/lib/types/admin";
import { AdminCertificatesSkeleton } from "./certificates-skeleton";

export function AdminCertificatesView(): ReactNode {
  const t = useTranslations("admin.certificates");
  const { data, isLoading, error } = useQuery<AdminCertificatesResponse>({
    queryKey: ["admin-certificates"],
    queryFn: () => getData<AdminCertificatesResponse>("/api/admin/certificates"),
  });

  const [selected, set_selected] = useState<AdminCertificateRow | null>(null);
  const [is_sheet_open, set_is_sheet_open] = useState(false);

  const columns: ColumnDef<AdminCertificateRow>[] = useMemo(
    () => [
      { id: "user_email", accessorKey: "user_email", header: () => t("user"), cell: ({ row }) => <span className="font-mono text-xs">{row.original.user_email ?? "—"}</span> },
      { id: "course_slug", accessorKey: "course_slug", header: () => t("course"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.course_slug}</span> },
      { id: "completed_at", accessorKey: "completed_at", header: () => t("completionDate"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.completed_at ? new Date(row.original.completed_at).toISOString().slice(0, 10) : "—"}</span> },
      { id: "mint_address", accessorKey: "mint_address", header: () => t("mintAddress"), cell: ({ row }) => <span className="font-mono text-[10px]">{row.original.mint_address ?? "—"}</span> },
    ],
    [t],
  );

  const table = useReactTable({ data: data?.certificates ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("title")}</h1>
      {error && (
        <Alert variant="destructive">
          <span>{(error as Error).message}</span>
        </Alert>
      )}
      {isLoading ? (
        <AdminCertificatesSkeleton />
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
                      set_selected(row.original);
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
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-archivo text-base font-bold">
                  {selected.user_email ?? selected.user_id}
                </SheetTitle>
              </SheetHeader>
              <Separator className="my-3" />
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>{t("course")}</span>
                  <span>{selected.course_slug}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("completionDate")}</span>
                  <span>
                    {selected.completed_at
                      ? new Date(selected.completed_at).toISOString().slice(0, 10)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("mintAddress")}</span>
                  <span className="max-w-[220px] truncate font-mono text-[10px]">
                    {selected.mint_address ?? "—"}
                  </span>
                </div>
              </div>
              {selected.mint_address && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1 text-xs font-mono">
                    <span>{t("explorer")}</span>
                    <a
                      href={`https://explorer.solana.com/address/${selected.mint_address}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[10px] text-blue-500 underline"
                    >
                      {`https://explorer.solana.com/address/${selected.mint_address}?cluster=devnet`}
                    </a>
                  </div>
                </>
              )}
              <SheetFooter className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-none border-border px-2 py-1 text-[10px] font-mono uppercase"
                  onClick={() => set_is_sheet_open(false)}
                >
                  {t("download")}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
