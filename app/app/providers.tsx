"use client";

import type React from "react";
import { useEffect } from "react";
import { ProgressProvider } from "@bprogress/next/app";
import { ThemeProvider } from "next-themes";
import { AuthWalletProvider } from "@/contexts/auth-wallet-provider";

type WalletProviderProps = {
	children: React.ReactNode;
	initialSession: Record<string, Record<string, unknown>> | null;
};

export default function Providers({ children, initialSession }: WalletProviderProps) {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => undefined);
		}
	}, []);

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ProgressProvider
				height="3px"
				color="#008c4c"
				options={{ showSpinner: false }}
				shallowRouting
			>
				<AuthWalletProvider initialSession={initialSession}>{children}</AuthWalletProvider>
			</ProgressProvider>
		</ThemeProvider>
	);
}
