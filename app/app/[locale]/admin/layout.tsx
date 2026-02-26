"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	BarChart3,
	BookOpen,
	Users,
	Settings,
	Shield,
	Lock,
	LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const ADMIN_NAV = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/courses", label: "Courses", icon: BookOpen },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/admins", label: "Admin Team", icon: Shield },
	{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isAdmin, isOAuthLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isOAuthLoading && !isAuthenticated) {
			router.replace("/");
		}
	}, [isOAuthLoading, isAuthenticated, router]);

	if (isOAuthLoading) {
		return (
			<div className="flex min-h-[calc(100vh-4rem)]">
				<aside className="hidden lg:flex w-64 flex-col border-r border-border bg-muted/30 p-4 gap-1">
					<div className="h-8 w-32 bg-muted animate-pulse rounded-lg mx-3 my-2 mb-4" />
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
					))}
				</aside>
				<main className="flex-1 p-6 space-y-6">
					<div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
					<div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
						))}
					</div>
				</main>
			</div>
		);
	}

	if (!isAuthenticated || !isAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Lock className="h-12 w-12 mx-auto text-muted-foreground" />
					<h1 className="text-xl font-bold">Access Denied</h1>
					<p className="text-muted-foreground text-sm">
						You need admin privileges to access this area.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh-4rem)]">
			<aside className="hidden lg:flex w-64 flex-col border-r border-border bg-muted/30 p-4 gap-1">
				<div className="flex items-center gap-2 px-3 py-2 mb-4">
					<Shield className="h-5 w-5 text-primary" />
					<span className="font-semibold text-sm">Admin Panel</span>
				</div>
				{ADMIN_NAV.map((item) => {
					const Icon = item.icon;
					const active =
						pathname === item.href ||
						(item.href !== "/admin" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
								active
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							)}
						>
							<Icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</aside>
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
