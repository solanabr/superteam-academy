"use client";

import { AuthGuard } from "@/components/auth/auth-guard";

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
	return <AuthGuard>{children}</AuthGuard>;
}
