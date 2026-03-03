"use client";

import { SolanaProvider } from "./SolanaProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SolanaProvider>
            {children}
            <Toaster
                theme="dark"
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
    );
}
