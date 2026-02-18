"use client";

import type React from "react";
import { ProgressProvider } from "@bprogress/next/app";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
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
				<AuthProvider>{children}</AuthProvider>
			</ProgressProvider>
		</ThemeProvider>
	);
}
