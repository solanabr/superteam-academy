"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onClear?: () => void;
  shortcut?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, shortcut, ...props }, ref) => {
    return (
      <div
        className={cn("relative flex items-center w-full max-w-md", className)}
      >
        <span className="absolute left-3 text-[#00FFA3] font-mono text-sm font-bold select-none">
          &gt;
        </span>
        <input
          ref={ref}
          type="search"
          value={value}
          aria-label={props["aria-label"] ?? props.placeholder ?? "Search"}
          className="w-full h-10 pl-8 pr-4 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] text-sm font-mono text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-all focus:outline-none focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] focus:shadow-[0_0_12px_-4px_rgba(0,255,163,0.2)]"
          {...props}
        />
        {value && String(value).length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : shortcut ? (
          <kbd className="absolute right-3 hidden sm:inline-flex h-5 items-center gap-1 rounded-[1px] border border-[var(--c-border-prominent)] bg-[var(--c-border-subtle)] px-1.5 font-mono text-[10px] font-medium text-[var(--c-text-2)]">
            {shortcut}
          </kbd>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
