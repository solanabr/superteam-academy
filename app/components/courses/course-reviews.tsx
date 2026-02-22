import { Star, ThumbsUp, Flag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

	const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
		const count = reviews.filter((review) => review.rating === rating).length;
		const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
		return { rating, count, percentage };
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("reviewsSection.title")}</h2>
				<Button variant="outline">{t("reviewsSection.writeReview")}</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="text-center space-y-4">
					<div className="text-6xl font-bold">{averageRating.toFixed(1)}</div>
					<div className="flex items-center justify-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								className={`h-6 w-6 ${
									i < Math.floor(averageRating)
										? "fill-yellow-400 text-yellow-400"
										: "text-muted-foreground"
								}`}
							/>
						))}
					</div>
					<div className="text-muted-foreground">
						{t("reviewsSection.basedOn", { count: totalReviews })}
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
				{reviews.map((review) => (
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
									<Button variant="ghost" size="sm">
										<Flag className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>

						<CardContent>
							<p className="text-muted-foreground mb-4">{review.comment}</p>

							<div className="flex items-center justify-between">
								<Button variant="ghost" size="sm" className="gap-2">
									<ThumbsUp className="h-4 w-4" />
									{t("reviewsSection.helpful", { count: review.helpful })}
								</Button>

								<div className="text-sm text-muted-foreground">
									{t("reviewsSection.wasHelpful")}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{reviews.length > 10 && (
				<div className="text-center">
					<Button variant="outline">{t("reviewsSection.loadMore")}</Button>
				</div>
			)}
		</div>
	);
}
