import { ChevronRight } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbNavigationProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
	const t = useTranslations("navigation");

	return (
		<nav
			className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}
			aria-label={t("breadcrumb")}
		>
			{items.map((item, index) => (
				<div key={index} className="flex items-center">
					{index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
					{item.href ? (
						<Link href={item.href} className="hover:text-foreground transition-colors">
							{item.label}
						</Link>
					) : (
						<span className="text-foreground font-medium">{item.label}</span>
					)}
				</div>
			))}
		</nav>
	);
}
