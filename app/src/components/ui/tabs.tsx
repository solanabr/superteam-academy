"use client";

import {
  createContext,
  useContext,
  useState,
  useId,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext<{
  value: string;
  onChange: (v: string) => void;
  id: string;
}>({ value: "", onChange: () => {}, id: "" });

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  children,
  className,
  onValueChange,
}: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();
  const handleChange = (v: string) => {
    setValue(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, onChange: handleChange, id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`${ctx.id}-panel-${value}`}
      id={`${ctx.id}-tab-${value}`}
      onClick={() => ctx.onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[1px] px-3 py-1.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "text-[#00FFA3] border-b border-[#00FFA3]"
          : "text-[var(--c-text-2)] hover:text-[var(--c-text)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.id}-panel-${value}`}
      aria-labelledby={`${ctx.id}-tab-${value}`}
      className={cn("mt-4", className)}
    >
      {children}
    </div>
  );
}
