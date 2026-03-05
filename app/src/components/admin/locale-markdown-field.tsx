"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { LocaleText } from "@/types/admin";

interface LocaleMarkdownFieldProps {
  value: LocaleText;
  onChange: (value: LocaleText) => void;
  label: string;
  placeholder?: string;
}

const LOCALES = ["pt", "en", "es"] as const;

export function LocaleMarkdownField({
  value,
  onChange,
  label,
  placeholder,
}: LocaleMarkdownFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">Supports Markdown</p>
      <Tabs.Root defaultValue="pt">
        <Tabs.List className="flex gap-1 border-b border-border/50 pb-1">
          {LOCALES.map((loc) => (
            <Tabs.Trigger
              key={loc}
              value={loc}
              className="rounded-md px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground transition-colors data-[state=active]:bg-[hsl(var(--brand-logo-green))] data-[state=active]:text-white"
            >
              {loc}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {LOCALES.map((loc) => (
          <Tabs.Content key={loc} value={loc} className="pt-1.5">
            <textarea
              value={value[loc] ?? ""}
              onChange={(e) => onChange({ ...value, [loc]: e.target.value })}
              placeholder={placeholder}
              rows={10}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
