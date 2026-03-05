import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Github, Twitter } from "lucide-react";

function DiscordIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
    );
}

export function Footer() {
    const t = useTranslations("Footer");
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border/50 bg-card/50">
            <div className="content-container section-padding">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-display">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple to-solana-green">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                Superteam<span className="gradient-text"> Academy</span>
                            </span>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                            {t("brand")}
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/80"
                            >
                                <Github className="h-4 w-4" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/80"
                            >
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a
                                href="https://discord.gg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/80"
                            >
                                <DiscordIcon className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            {t("platform")}
                        </h4>
                        <ul className="space-y-2.5">
                            {(["courses", "paths", "credentials", "leaderboard"] as const).map(
                                (key) => (
                                    <li key={key}>
                                        <a
                                            href="#"
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {t(key)}
                                        </a>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Community Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            {t("community")}
                        </h4>
                        <ul className="space-y-2.5">
                            {(["superteam", "discord", "forum", "contribute"] as const).map(
                                (key) => (
                                    <li key={key}>
                                        <a
                                            href="#"
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {t(key)}
                                        </a>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4 md:col-span-2 lg:col-span-1">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            {t("newsletter")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {t("newsletterDesc")}
                        </p>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="email"
                                placeholder={t("emailPlaceholder")}
                                className="h-9 rounded-full text-sm"
                            />
                            <Button
                                size="sm"
                                className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-4 text-white hover:brightness-110"
                            >
                                {t("subscribe")}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                        {t("copyright", { year: currentYear })}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Github className="h-3.5 w-3.5" />
                        <span>{t("openSource")}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
