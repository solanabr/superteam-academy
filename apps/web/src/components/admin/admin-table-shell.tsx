import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AdminTableColumn {
  /** Stable React key + column identity. */
  key: string;
  /** Header content (already localized by the caller). */
  label: ReactNode;
  align?: "left" | "center" | "right";
  /** Extra `<th>` classes — column width, right-padding, etc. */
  headClassName?: string;
  /** Visually hide the header label (still read by assistive tech). */
  srOnly?: boolean;
}

interface AdminTableShellProps {
  columns: AdminTableColumn[];
  /** `<tr>` rows. Give every `<td>` `align-top` so a tall row never drags its
   *  siblings' cells to vertical-center. */
  children: ReactNode;
  className?: string;
}

const ALIGN: Record<NonNullable<AdminTableColumn["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Shared admin table chrome: a horizontally-scrollable wrapper (wide rows scroll
 * inside their own box instead of pushing the page), the uppercase header row,
 * and a `divide-y` body. Rows are the caller's responsibility — the shell only
 * owns the frame so WS-A's courses table and WS-C's read-only tables render as
 * one system.
 */
export function AdminTableShell({
  columns,
  children,
  className,
}: AdminTableShellProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm", className)}>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-3">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "pb-2 align-bottom font-medium",
                  ALIGN[col.align ?? "left"],
                  col.headClassName
                )}
              >
                {col.srOnly ? (
                  <span className="sr-only">{col.label}</span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
