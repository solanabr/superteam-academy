"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TableProps = React.ComponentProps<"table">;

function Table({ className, ...props }: TableProps): React.ReactElement {
  return (
    <div className="relative w-full overflow-auto border border-border">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

type TableHeaderProps = React.ComponentProps<"thead">;

function TableHeader({ className, ...props }: TableHeaderProps): React.ReactElement {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted border-b border-border", className)}
      {...props}
    />
  );
}

type TableBodyProps = React.ComponentProps<"tbody">;

function TableBody({ className, ...props }: TableBodyProps): React.ReactElement {
  return (
      <tbody
        data-slot="table-body"
        className={cn("[&_tr:last-child]:border-b-0", className)}
        {...props}
      />
  );
}

type TableRowProps = React.ComponentProps<"tr">;

function TableRow({ className, ...props }: TableRowProps): React.ReactElement {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/60",
        className,
      )}
      {...props}
    />
  );
}

type TableHeadProps = React.ComponentProps<"th">;

function TableHead({ className, ...props }: TableHeadProps): React.ReactElement {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-3 py-2 text-left align-middle text-xs font-mono uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

type TableCellProps = React.ComponentProps<"td">;

function TableCell({ className, ...props }: TableCellProps): React.ReactElement {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-2 align-middle text-sm", className)}
      {...props}
    />
  );
}

type TableCaptionProps = React.ComponentProps<"caption">;

function TableCaption({ className, ...props }: TableCaptionProps): React.ReactElement {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};

