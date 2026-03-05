"use client";

import { Star } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/data/course-detail";

interface ReviewsListProps {
	reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
	const t = useTranslations("CourseDetail");

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				size={10}
				weight={i < rating ? "fill" : "regular"}
				className="text-ink-primary"
			/>
		));
	};

	return (
		<div>
			<span className="bg-ink-primary text-bg-base px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-4">
				{t("reviews.title")}
			</span>

			<div className="space-y-4">
				{reviews.map((review) => (
					<div
						key={review.id}
						className="border border-border bg-bg-surface p-4 text-[11px]"
					>
						<div className="flex gap-1 mb-1">{renderStars(review.rating)}</div>
						<div className="font-bold mb-1">&ldquo;{review.title}&rdquo;</div>
						<div className="text-ink-secondary leading-relaxed mb-2">
							{review.comment}
						</div>
						<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
							— {review.userAddress}
						</div>
					</div>
				))}
			</div>

			<Button
				variant="outline"
				className="w-full mt-4 rounded-none uppercase text-[10px] font-bold px-3 py-2 h-auto tracking-widest border-dashed"
			>
				{t("reviews.viewAll")}
			</Button>
		</div>
	);
}
