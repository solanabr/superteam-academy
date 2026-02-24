"use client";

import { useState } from "react";
import { Star, ThumbsUp, Flag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface CourseReviewsProps {
	reviews: Array<{
		id: string;
		user: {
			name: string;
			avatar: string;
		};
		rating: number;
		date: string;
		comment: string;
		helpful: number;
	}>;
	averageRating: number;
	totalReviews: number;
}

export function CourseReviews({ reviews, averageRating, totalReviews }: CourseReviewsProps) {
	const t = useTranslations("courses");
	const [localReviews, setLocalReviews] = useState(reviews);
	const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());
	const [flaggedReviews, setFlaggedReviews] = useState<Set<string>>(new Set());
	const [showWriteReview, setShowWriteReview] = useState(false);
	const [draftRating, setDraftRating] = useState(5);
	const [draftComment, setDraftComment] = useState("");

	const totalCount = localReviews.length || totalReviews;
	const averageScore =
		totalCount > 0
			? localReviews.reduce((sum, review) => sum + review.rating, 0) / totalCount
			: averageRating;

	const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
		const count = localReviews.filter((review) => review.rating === rating).length;
		const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
		return { rating, count, percentage };
	});

	const handleHelpful = async (reviewId: string) => {
		const newHelpful = new Set(helpfulReviews);
		if (newHelpful.has(reviewId)) {
			newHelpful.delete(reviewId);
		} else {
			newHelpful.add(reviewId);
		}
		setHelpfulReviews(newHelpful);
	};

	const handleFlag = async (reviewId: string) => {
		const newFlagged = new Set(flaggedReviews);
		if (newFlagged.has(reviewId)) {
			newFlagged.delete(reviewId);
		} else {
			newFlagged.add(reviewId);
		}
		setFlaggedReviews(newFlagged);
	};

	const handleWriteReview = () => {
		setShowWriteReview((prev) => !prev);
	};

	const handleSubmitReview = () => {
		if (!draftComment.trim()) {
			return;
		}

		const newReview = {
			id: `local-${Date.now()}`,
			user: {
				name: t("reviewsSection.you"),
				avatar: "",
			},
			rating: draftRating,
			date: new Date().toISOString(),
			comment: draftComment.trim(),
			helpful: 0,
		};

		setLocalReviews((prev) => [newReview, ...prev]);
		setDraftComment("");
		setDraftRating(5);
		setShowWriteReview(false);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("reviewsSection.title")}</h2>
				<Button variant="outline" onClick={handleWriteReview}>
					{t("reviewsSection.writeReview")}
				</Button>
			</div>

			{showWriteReview && (
				<Card>
					<CardContent className="space-y-4 pt-6">
						<div className="space-y-2">
							<div className="text-sm font-medium">{t("reviewsSection.rating")}</div>
							<div className="flex items-center gap-1">
								{Array.from({ length: 5 }).map((_, i) => (
									<Button
										key={i}
										variant="ghost"
										size="sm"
										onClick={() => setDraftRating(i + 1)}
									>
										<Star
											className={`h-4 w-4 ${
												i < draftRating
													? "fill-yellow-400 text-yellow-400"
													: "text-muted-foreground"
											}`}
										/>
									</Button>
								))}
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">
								{t("reviewsSection.yourReview")}
							</div>
							<Textarea
								value={draftComment}
								onChange={(event) => setDraftComment(event.target.value)}
								placeholder={t("reviewsSection.commentPlaceholder")}
								rows={4}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button onClick={handleSubmitReview}>
								{t("reviewsSection.submitReview")}
							</Button>
							<Button variant="ghost" onClick={() => setShowWriteReview(false)}>
								{t("reviewsSection.cancel")}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="text-center space-y-4">
					<div className="text-6xl font-bold">{averageScore.toFixed(1)}</div>
					<div className="flex items-center justify-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								className={`h-6 w-6 ${
									i < Math.floor(averageScore)
										? "fill-yellow-400 text-yellow-400"
										: "text-muted-foreground"
								}`}
							/>
						))}
					</div>
					<div className="text-muted-foreground">
						{t("reviewsSection.basedOn", { count: totalCount })}
					</div>
				</div>

				<div className="space-y-2">
					{ratingDistribution.map(({ rating, count, percentage }) => (
						<div key={rating} className="flex items-center gap-3">
							<div className="flex items-center gap-1 w-12">
								<span className="text-sm font-medium">{rating}</span>
								<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							</div>
							<div className="flex-1 bg-secondary rounded-full h-2">
								<div
									className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
									style={{ width: `${percentage}%` }}
								/>
							</div>
							<div className="text-sm text-muted-foreground w-8 text-right">
								{count}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-4">
				{localReviews.map((review) => (
					<Card key={review.id}>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={review.user.avatar}
											alt={review.user.name}
										/>
										<AvatarFallback>
											{review.user.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="font-medium">{review.user.name}</div>
										<div className="text-sm text-muted-foreground">
											{new Date(review.date).toLocaleDateString()}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<div className="flex items-center gap-1">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={`h-4 w-4 ${
													i < review.rating
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground"
												}`}
											/>
										))}
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleFlag(review.id)}
										className={
											flaggedReviews.has(review.id) ? "text-red-500" : ""
										}
									>
										<Flag className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>

						<CardContent>
							<p className="text-muted-foreground mb-4">{review.comment}</p>

							<div className="flex items-center justify-between">
								<Button
									variant="ghost"
									size="sm"
									className="gap-2"
									onClick={() => handleHelpful(review.id)}
								>
									<ThumbsUp
										className={`h-4 w-4 ${helpfulReviews.has(review.id) ? "fill-current text-blue-500" : ""}`}
									/>
									{t("reviewsSection.helpful", {
										count:
											review.helpful +
											(helpfulReviews.has(review.id) ? 1 : 0),
									})}
								</Button>

								<div className="text-sm text-muted-foreground">
									{t("reviewsSection.wasHelpful")}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{localReviews.length > 10 && (
				<div className="text-center">
					<Button variant="outline">{t("reviewsSection.loadMore")}</Button>
				</div>
			)}
		</div>
	);
}
