"use client";

import { useState, useEffect } from "react";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface PaginationSystemProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
	showItemsPerPage?: boolean;
	maxVisiblePages?: number;
	className?: string;
}

export function PaginationSystem({
	pagination,
	onPageChange,
	onItemsPerPageChange,
	showItemsPerPage = true,
	maxVisiblePages = 5,
	className,
}: PaginationSystemProps) {
	const t = useTranslations("pagination");
	const { toast: _toast } = useToast();

	const [itemsPerPage, setItemsPerPage] = useState(pagination.itemsPerPage);

	const itemsPerPageOptions = [10, 20, 50, 100];

	const handlePageChange = (page: number) => {
		if (page < 1 || page > pagination.totalPages) return;

		onPageChange(page);
	};

	const handleItemsPerPageChange = (value: string) => {
		const newItemsPerPage = parseInt(value, 10);
		setItemsPerPage(newItemsPerPage);
		onItemsPerPageChange?.(newItemsPerPage);
	};

	const getVisiblePages = () => {
		const { currentPage, totalPages } = pagination;
		const halfVisible = Math.floor(maxVisiblePages / 2);
		let startPage = Math.max(1, currentPage - halfVisible);
		const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		// Adjust start page if we're near the end
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		const pages: number[] = [];
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		return pages;
	};

	const visiblePages = getVisiblePages();
	const showStartEllipsis = visiblePages[0] > 2;
	const showEndEllipsis = visiblePages[visiblePages.length - 1] < pagination.totalPages - 1;

	const startItem = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
	const endItem = Math.min(
		pagination.currentPage * pagination.itemsPerPage,
		pagination.totalItems
	);

	if (pagination.totalPages <= 1) {
		return null;
	}

	return (
		<div className={cn("flex items-center justify-between", className)}>
			<div className="flex items-center gap-4">
				<p className="text-sm text-muted-foreground">
					{t("showing", {
						start: startItem,
						end: endItem,
						total: pagination.totalItems,
					})}
				</p>

				{showItemsPerPage && onItemsPerPageChange && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">{t("perPage")}:</span>
						<Select
							value={itemsPerPage.toString()}
							onValueChange={handleItemsPerPageChange}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{itemsPerPageOptions.map((option) => (
									<SelectItem key={option} value={option.toString()}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(1)}
					disabled={!pagination.hasPreviousPage}
					className="hidden sm:flex"
				>
					<ChevronsLeft className="h-4 w-4" />
					<span className="sr-only">{t("first")}</span>
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.currentPage - 1)}
					disabled={!pagination.hasPreviousPage}
				>
					<ChevronLeft className="h-4 w-4" />
					<span className="sr-only">{t("previous")}</span>
				</Button>

				<div className="flex items-center gap-1">
					{showStartEllipsis && (
						<>
							<Button
								variant={pagination.currentPage === 1 ? "default" : "outline"}
								size="sm"
								onClick={() => handlePageChange(1)}
								className="w-10"
							>
								1
							</Button>
							{visiblePages[0] > 2 && (
								<div className="flex items-center px-2">
									<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
								</div>
							)}
						</>
					)}

					{visiblePages.map((page) => (
						<Button
							key={page}
							variant={page === pagination.currentPage ? "default" : "outline"}
							size="sm"
							onClick={() => handlePageChange(page)}
							className="w-10"
						>
							{page}
						</Button>
					))}

					{showEndEllipsis && (
						<>
							{visiblePages[visiblePages.length - 1] < pagination.totalPages - 1 && (
								<div className="flex items-center px-2">
									<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
								</div>
							)}
							<Button
								variant={
									pagination.totalPages === pagination.currentPage
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => handlePageChange(pagination.totalPages)}
								className="w-10"
							>
								{pagination.totalPages}
							</Button>
						</>
					)}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.currentPage + 1)}
					disabled={!pagination.hasNextPage}
				>
					<ChevronRight className="h-4 w-4" />
					<span className="sr-only">{t("next")}</span>
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.totalPages)}
					disabled={!pagination.hasNextPage}
					className="hidden sm:flex"
				>
					<ChevronsRight className="h-4 w-4" />
					<span className="sr-only">{t("last")}</span>
				</Button>
			</div>
		</div>
	);
}

// Compact Pagination for limited space
interface CompactPaginationProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	className?: string;
}

export function CompactPagination({ pagination, onPageChange, className }: CompactPaginationProps) {
	const t = useTranslations("pagination");

	const handlePageChange = (page: number) => {
		if (page < 1 || page > pagination.totalPages) return;
		onPageChange(page);
	};

	if (pagination.totalPages <= 1) {
		return null;
	}

	return (
		<div className={cn("flex items-center justify-center gap-2", className)}>
			<Button
				variant="outline"
				size="sm"
				onClick={() => handlePageChange(pagination.currentPage - 1)}
				disabled={!pagination.hasPreviousPage}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			<div className="flex items-center gap-1">
				<span className="text-sm">
					{pagination.currentPage} {t("of")} {pagination.totalPages}
				</span>
			</div>

			<Button
				variant="outline"
				size="sm"
				onClick={() => handlePageChange(pagination.currentPage + 1)}
				disabled={!pagination.hasNextPage}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

// Infinite Scroll Pagination
interface InfiniteScrollPaginationProps {
	onLoadMore: () => void;
	isLoading: boolean;
	hasMore: boolean;
	className?: string;
}

export function InfiniteScrollPagination({
	onLoadMore,
	isLoading,
	hasMore,
	className,
}: InfiniteScrollPaginationProps) {
	const t = useTranslations("pagination");

	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + document.documentElement.scrollTop >=
					document.documentElement.offsetHeight - 1000 &&
				hasMore &&
				!isLoading
			) {
				onLoadMore();
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [onLoadMore, isLoading, hasMore]);

	if (!hasMore) {
		return (
			<div className={cn("text-center py-4", className)}>
				<p className="text-sm text-muted-foreground">{t("noMoreResults")}</p>
			</div>
		);
	}

	return (
		<div className={cn("text-center py-4", className)}>
			{isLoading ? (
				<div className="flex items-center justify-center gap-2">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
					<span className="text-sm text-muted-foreground">{t("loading")}</span>
				</div>
			) : (
				<Button variant="outline" onClick={onLoadMore}>
					{t("loadMore")}
				</Button>
			)}
		</div>
	);
}

// Cursor-based Pagination for large datasets
interface CursorPaginationProps {
	onNextPage: () => void;
	onPreviousPage: () => void;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	isLoading?: boolean;
	className?: string;
}

export function CursorPagination({
	onNextPage,
	onPreviousPage,
	hasNextPage,
	hasPreviousPage,
	isLoading = false,
	className,
}: CursorPaginationProps) {
	const t = useTranslations("pagination");

	return (
		<div className={cn("flex items-center justify-center gap-2", className)}>
			<Button
				variant="outline"
				size="sm"
				onClick={onPreviousPage}
				disabled={!hasPreviousPage || isLoading}
			>
				<ChevronLeft className="h-4 w-4 mr-1" />
				{t("previous")}
			</Button>

			<Button
				variant="outline"
				size="sm"
				onClick={onNextPage}
				disabled={!hasNextPage || isLoading}
			>
				{t("next")}
				<ChevronRight className="h-4 w-4 ml-1" />
			</Button>
		</div>
	);
}
