"use client";

import type React from "react";
import { useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { AuthWalletProvider } from "@/contexts/auth-wallet-provider";

const ProgressProvider = lazy(() =>
	import("@bprogress/next/app").then((m) => ({ default: m.ProgressProvider }))
);

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
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
			<Suspense>
				<ProgressProvider
					height="3px"
					color="#008c4c"
					options={{ showSpinner: false }}
					shallowRouting
				>
					<AuthWalletProvider initialSession={initialSession}>
						{children}
					</AuthWalletProvider>
				</ProgressProvider>
			</Suspense>
		</ThemeProvider>
	);
}
