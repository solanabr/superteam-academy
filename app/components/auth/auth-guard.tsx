"use client";

import { useEffect } from "react";
import { useRouter } from "@bprogress/next/app";
import { useAuth } from "@/contexts/auth-context";

interface AuthGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
	const { isAuthenticated } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated) {
			router.replace("/");
		}
	}, [isAuthenticated, router]);

	if (!isAuthenticated) {
		return fallback ?? null;
	}

	return <>{children}</>;
}
