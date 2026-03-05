"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Input } from "@/components/ui/input";
import type { LocaleString } from "@/types/admin";

interface LocaleFieldProps {
  value: LocaleString;
  onChange: (value: LocaleString) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const LOCALES = ["pt", "en", "es"] as const;

export function LocaleField({
  value,
  onChange,
  label,
  placeholder,
  required,
}: LocaleFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
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
            <Input
              value={value[loc] ?? ""}
              onChange={(e) => onChange({ ...value, [loc]: e.target.value })}
              placeholder={placeholder}
              required={required && loc === "pt"}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
