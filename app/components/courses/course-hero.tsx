"use client";

import Image from "next/image";
import { Link } from "@superteam-academy/i18n/navigation";
import { Play, Heart, Star, Users, Clock, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { ShareMenu } from "@/components/courses/share-menu";

interface CourseHeroProps {
	course: {
		id: string;
		title: string;
		shortDescription: string;
		category: string;
		level: string;
		duration: string;
		rating: number;
		reviewCount: number;
		students: number;
		instructor: {
			name: string;
			title: string;
		};
		image: string;
		videoPreview?: string;
		tags: string[];
		xpReward: number;
		price: number;
		enrolled?: boolean;
	};
}

export function CourseHero({ course }: CourseHeroProps) {
	const t = useTranslations("courses");
	const { isAuthenticated } = useAuth();
	const [isSaved, setIsSaved] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) return;
		fetch("/api/courses/save")
			.then((res) => res.json())
			.then((data: { savedCourses?: string[] }) => {
				setIsSaved(data.savedCourses?.includes(course.id) ?? false);
			})
			.catch(() => {
				/* noop */
			});
	}, [course.id, isAuthenticated]);

	const handleSaveCourse = async () => {
		if (!isAuthenticated) {
			setLoginOpen(true);
			return;
		}
		const prev = isSaved;
		setIsSaved(!prev);
		try {
			const res = await fetch("/api/courses/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseId: course.id }),
			});
			if (!res.ok) {
				setIsSaved(prev);
			}
		} catch {
			setIsSaved(prev);
		}
	};

	const handlePreviewVideo = () => {
		if (course.videoPreview) {
			window.open(course.videoPreview, "_blank");
		}
	};

	return (
		<div className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10">
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					<div className="space-y-6">
						<div className="space-y-4">
							<div className="flex items-center gap-2 flex-wrap">
								<Badge variant="secondary">{course.category}</Badge>
								<Badge variant="outline">{course.level}</Badge>
								{course.price === 0 && (
									<Badge className="bg-green-500/10 text-green-600 border-green-500/20">
										{t("hero.free")}
									</Badge>
								)}
							</div>

							<h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
								{course.title}
							</h1>

							<p className="text-xl text-muted-foreground leading-relaxed">
								{course.shortDescription}
							</p>
						</div>

						<div className="flex items-center gap-6 flex-wrap">
							<div className="flex items-center gap-2">
								<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
								<span className="font-semibold">{course.rating}</span>
								<span className="text-muted-foreground">
									({t("hero.reviews", { count: course.reviewCount })})
								</span>
							</div>

							<div className="flex items-center gap-2">
								<Users className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium">
									{t("hero.students", {
										count: course.students.toLocaleString(),
									})}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<Clock className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium">{course.duration}</span>
							</div>

							<div className="flex items-center gap-2">
								<Award className="h-5 w-5 text-yellow-500" />
								<span className="font-medium">{course.xpReward} XP</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="text-sm text-muted-foreground">
								{t("hero.createdBy")}
							</div>
							<div className="font-medium">{course.instructor.name}</div>
							<div className="text-sm text-muted-foreground">•</div>
							<div className="text-sm text-muted-foreground">
								{course.instructor.title}
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							{course.tags.map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>

						<div className="flex items-center gap-3 pt-4">
							{course.enrolled ? (
								<Button size="lg" asChild={true}>
									<Link href={`/courses/${course.id}/lessons/1-1`}>
										{t("hero.continueLearning")}
									</Link>
								</Button>
							) : (
								<Button
									size="lg"
									onClick={() => {
										if (isAuthenticated) {
											const enrollSection = document.getElementById("enroll");
											if (enrollSection) {
												enrollSection.scrollIntoView({
													behavior: "smooth",
												});
											}
										} else {
											setLoginOpen(true);
										}
									}}
								>
									{course.price === 0
										? t("hero.enrollFree")
										: t("hero.enrollFor", { price: course.price })}
								</Button>
							)}

							<Button
								variant="outline"
								size="lg"
								className="gap-2"
								onClick={handleSaveCourse}
							>
								<Heart
									className={`h-4 w-4 ${isSaved ? "fill-current text-red-500" : ""}`}
								/>
								{t("hero.save")}
							</Button>

							<ShareMenu title={course.title} description={course.shortDescription} />

							{course.videoPreview && (
								<Button
									variant="outline"
									size="lg"
									className="gap-2"
									onClick={handlePreviewVideo}
								>
									<Play className="h-4 w-4" />
									{t("hero.preview")}
								</Button>
							)}
						</div>
					</div>

					<div className="relative">
						<div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl">
							<Image
								src={course.image}
								alt={course.title}
								fill={true}
								className="object-cover"
								priority={true}
								sizes="(max-width: 768px) 100vw, 50vw"
							/>
							{course.videoPreview && (
								<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
									<Button
										size="lg"
										variant="secondary"
										className="gap-2"
										onClick={handlePreviewVideo}
									>
										<Play className="h-5 w-5" />
										{t("hero.watchPreview")}
									</Button>
								</div>
							)}
						</div>

						<Card className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-lg">
							<CardContent className="p-4">
								<div className="text-center space-y-2">
									<div className="text-2xl font-bold text-primary">
										{course.rating}
									</div>
									<div className="flex items-center justify-center gap-1">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={`h-4 w-4 ${
													i < Math.floor(course.rating)
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground"
												}`}
											/>
										))}
									</div>
									<div className="text-sm text-muted-foreground">
										{t("hero.reviews", { count: course.reviewCount })}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
		</div>
	);
}
