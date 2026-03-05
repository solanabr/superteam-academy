"use client";

import { usePathname } from "next/navigation";
import { Link } from "@superteam-academy/i18n/navigation";
import { BarChart3, BookOpen, Users, Settings, Shield, Lock, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";

const ADMIN_NAV = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/courses", label: "Courses", icon: BookOpen },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/admins", label: "Admin Team", icon: Shield },
	{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { isAdmin } = useAuth();
	const pathname = usePathname();

	const accessDenied = (
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

	if (!isAdmin) {
		return <AuthGuard fallback={accessDenied}>{accessDenied}</AuthGuard>;
	}

	return (
		<AuthGuard>
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
		</AuthGuard>
	);
}
