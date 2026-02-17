import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	baseUrl: string;
	searchParams?: Record<string, string>;
	maxVisiblePages?: number;
}

export function Pagination({
	currentPage,
	totalPages,
	baseUrl,
	searchParams = {},
	maxVisiblePages = 5,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	const buildUrl = (page: number) => {
		const params = new URLSearchParams();
		Object.entries(searchParams).forEach(([key, value]) => {
			if (value && value !== "1") {
				// Don't include page=1
				params.set(key, value);
			}
		});
		if (page > 1) {
			params.set("page", page.toString());
		}
		const queryString = params.toString();
		return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
	};

	const getVisiblePages = () => {
		const delta = Math.floor(maxVisiblePages / 2);
		let start = Math.max(1, currentPage - delta);
		const end = Math.min(totalPages, start + maxVisiblePages - 1);

		if (end - start + 1 < maxVisiblePages) {
			start = Math.max(1, end - maxVisiblePages + 1);
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	const visiblePages = getVisiblePages();
	const showStartEllipsis = visiblePages[0] > 2;
	const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

	return (
		<nav
			className="flex items-center justify-center space-x-1"
			aria-label="Pagination Navigation"
		>
			<Button
				variant="outline"
				size="sm"
				asChild={currentPage > 1}
				disabled={currentPage <= 1}
				className="gap-1"
			>
				{currentPage > 1 ? (
					<Link href={buildUrl(currentPage - 1)} aria-label="Go to previous page">
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Link>
				) : (
					<span>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</span>
				)}
			</Button>

			{visiblePages[0] > 1 && (
				<Button variant="outline" size="sm" asChild={true}>
					<Link href={buildUrl(1)} aria-label="Go to page 1">
						1
					</Link>
				</Button>
			)}

			{showStartEllipsis && (
				<div className="flex items-center px-2">
					<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{visiblePages.map((page) => (
				<Button
					key={page}
					variant={page === currentPage ? "default" : "outline"}
					size="sm"
					asChild={page !== currentPage}
					className={cn(page === currentPage && "pointer-events-none")}
				>
					{page === currentPage ? (
						<span aria-current="page" aria-label={`Current page, page ${page}`}>
							{page}
						</span>
					) : (
						<Link href={buildUrl(page)} aria-label={`Go to page ${page}`}>
							{page}
						</Link>
					)}
				</Button>
			))}

			{showEndEllipsis && (
				<div className="flex items-center px-2">
					<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{visiblePages[visiblePages.length - 1] < totalPages && (
				<Button variant="outline" size="sm" asChild={true}>
					<Link href={buildUrl(totalPages)} aria-label={`Go to page ${totalPages}`}>
						{totalPages}
					</Link>
				</Button>
			)}

			<Button
				variant="outline"
				size="sm"
				asChild={currentPage < totalPages}
				disabled={currentPage >= totalPages}
				className="gap-1"
			>
				{currentPage < totalPages ? (
					<Link href={buildUrl(currentPage + 1)} aria-label="Go to next page">
						Next
						<ChevronRight className="h-4 w-4" />
					</Link>
				) : (
					<span>
						Next
						<ChevronRight className="h-4 w-4" />
					</span>
				)}
			</Button>
		</nav>
	);
}
