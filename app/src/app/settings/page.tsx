import { Shell } from "@/components/Shell";

export default function SettingsPage() {
  return (
    <Shell
      title="Settings"
      subtitle="Account linking, language, theme, and privacy preferences."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold">Preferences</div>
          <div className="mt-3 text-sm text-zinc-600">
            Next: language switcher (PT-BR/ES/EN) + light/dark.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold">Account</div>
          <div className="mt-3 text-sm text-zinc-600">
            Next: wallet adapter + Google sign-in + linking.
          </div>
        </div>
      </div>
    </Shell>
  );
}
