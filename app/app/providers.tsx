"use client";

import type React from "react";
import { ProgressProvider } from "@bprogress/next/app";
import { ThemeProvider } from "next-themes";
import { AuthProvider, type AuthSession } from "@/contexts/auth-context";

export default function Providers({
	children,
	initialSession,
}: {
	children: React.ReactNode;
	initialSession: AuthSession | null;
}) {
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
				<AuthProvider initialSession={initialSession}>{children}</AuthProvider>
			</ProgressProvider>
		</ThemeProvider>
	);
}
