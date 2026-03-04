"use client";

import { useRouter } from "next/navigation";

export function LanguageSwitcher({
  locale,
  label,
  options,
}: {
  locale: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-xs text-zinc-600">
      <span>{label}</span>
      <select
        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        value={locale}
        onChange={async (e) => {
          await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: e.target.value }),
          });
          router.refresh();
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
