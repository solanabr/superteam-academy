"use client";

import type React from "react";
import { useEffect, useState, type ComponentType } from "react";
import { ProgressProvider } from "@bprogress/next/app";
import { ThemeProvider } from "next-themes";
import type { AuthSession } from "@/contexts/auth-context";

type WalletProviderProps = {
	children: React.ReactNode;
	initialSession: AuthSession | null;
};

function DeferredAuthProvider({ children, initialSession }: WalletProviderProps) {
	const [Provider, setProvider] = useState<ComponentType<WalletProviderProps> | null>(null);

	useEffect(() => {
		import("@/contexts/auth-wallet-provider").then((mod) => {
			setProvider(() => mod.AuthWalletProvider);
		});
	}, []);

	if (!Provider) return <>{children}</>;

	return <Provider initialSession={initialSession}>{children}</Provider>;
}

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
				<DeferredAuthProvider initialSession={initialSession}>
					{children}
				</DeferredAuthProvider>
			</ProgressProvider>
		</ThemeProvider>
	);
}
