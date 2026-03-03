"use client";

import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";

const SolanaProvider = dynamic(
    () => import("./SolanaProvider").then((mod) => mod.SolanaProvider),
    { ssr: false }
);

function getLocaleFromCookie(): string {
    if (typeof document === "undefined") return "pt-BR";
    const match = document.cookie.split("; ").find((c) => c.startsWith("locale="));
    return match?.split("=")[1] ?? "pt-BR";
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState("pt-BR");
    const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        const loc = getLocaleFromCookie();
        setLocale(loc);
        import(`../messages/${loc}.json`)
            .then((mod) => setMessages(mod.default as Record<string, unknown>))
            .catch(() =>
                import("../messages/pt-BR.json").then((mod) => setMessages(mod.default as Record<string, unknown>))
            );
    }, []);

    // Render without i18n briefly while messages load
    if (!messages) {
        return (
            <ThemeProvider>
                <SolanaProvider>
                    {children}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                color: "hsl(var(--foreground))",
                            },
                        }}
                    />
                </SolanaProvider>
            </ThemeProvider>
        );
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider>
                <SolanaProvider>
                    {children}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                color: "hsl(var(--foreground))",
                            },
                        }}
                    />
                </SolanaProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}

