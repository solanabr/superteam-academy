import Link from "next/link";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { AuthControls } from "@/components/AuthControls";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { dictionary, getLocale } from "@/lib/i18n";

export async function Shell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const d = await dictionary();

  const nav = [
    { href: "/courses", label: d["nav.courses"] },
    { href: "/dashboard", label: d["nav.dashboard"] },
    { href: "/leaderboard", label: d["nav.leaderboard"] },
    { href: "/certificates/demo", label: d["nav.certificates"] },
    { href: "/settings", label: d["nav.settings"] },
    { href: "/profile", label: d["nav.profile"] },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            {d.brand}
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-zinc-700">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <LanguageSwitcher
              locale={locale}
              label={d["lang.label"]}
              options={[
                { value: "en", label: d["lang.en"] },
                { value: "pt-br", label: d["lang.pt-br"] },
                { value: "es", label: d["lang.es"] },
              ]}
            />
            <WalletConnectButton />
            <AuthControls />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {title ? (
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 text-xs text-zinc-500">
          {d.footer}
        </div>
      </footer>
    </div>
  );
}
