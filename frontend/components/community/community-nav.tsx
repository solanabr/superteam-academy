"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommunityNavProps {
	items: { href: string; label: string }[];
}

export function CommunityNav({ items }: CommunityNavProps) {
	const pathname = usePathname();

	return (
		<div className="sticky top-14 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
			<div className="mx-auto px-4 sm:px-6">
				<nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
					{items.map((item) => {
						const isActive = pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
									isActive
										? "border-primary text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}
