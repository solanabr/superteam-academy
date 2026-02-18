import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Star, BookOpen, CheckCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { CourseHero } from "@/components/courses/course-hero";
import { CourseModules } from "@/components/courses/course-modules";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseInstructor } from "@/components/courses/course-instructor";
import { CoursePrerequisites } from "@/components/courses/course-prerequisites";
import { CourseCertificate } from "@/components/courses/course-certificate";
import { CourseEnrollment } from "@/components/courses/course-enrollment";
import { CourseProgress } from "@/components/courses/course-progress";

interface CourseDetailPageProps {
	params: {
		id: string;
	};
	searchParams: {
		tab?: string;
	};
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
	// This would fetch course data from CMS/API
	const course = await getCourse(params.id);

	return {
		title: `${course.title} | Superteam Academy`,
		description: course.description,
		openGraph: {
			title: course.title,
			description: course.description,
			images: [course.image],
		},
	};
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<CourseDetailSkeleton />}>
				<CourseDetailContent
					courseId={params.id}
					activeTab={searchParams.tab || "overview"}
				/>
			</Suspense>
		</div>
	);
}

async function CourseDetailContent({
	courseId,
	activeTab,
}: {
	courseId: string;
	activeTab: string;
}) {
	const t = await getTranslations("courses");
	const course = await getCourse(courseId);

	return (
		<div className="space-y-8">
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
				<div className="container mx-auto px-4 py-4">
					<Button variant="ghost" asChild={true} className="gap-2">
						<a href="/courses">
							<ArrowLeft className="h-4 w-4" />
							{t("backToCourses")}
						</a>
					</Button>
				</div>
			</div>

			<CourseHero course={course} />

			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<Tabs value={activeTab} className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
								<TabsTrigger value="curriculum">{t("tabs.curriculum")}</TabsTrigger>
								<TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
								<TabsTrigger value="instructor">{t("tabs.instructor")}</TabsTrigger>
							</TabsList>

							<TabsContent value="overview" className="space-y-6">
								<div className="prose prose-gray dark:prose-invert max-w-none">
									<h2>{t("overview.title")}</h2>
									<p className="text-lg leading-relaxed">{course.description}</p>

									<h3>{t("overview.whatYouWillLearn")}</h3>
									<ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
										{course.learningObjectives.map((objective, index) => (
											<li key={index} className="flex items-start gap-2">
												<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
												<span>{objective}</span>
											</li>
										))}
									</ul>

									<h3>{t("overview.requirements")}</h3>
									<ul>
										{course.requirements.map((requirement, index) => (
											<li key={index}>{requirement}</li>
										))}
									</ul>

									<h3>{t("overview.skills")}</h3>
									<div className="flex flex-wrap gap-2">
										{course.skills.map((skill) => (
											<Badge key={skill} variant="secondary">
												{skill}
											</Badge>
										))}
									</div>
								</div>
							</TabsContent>

							<TabsContent value="curriculum" className="space-y-6">
								<CourseModules modules={course.modules} />
							</TabsContent>

							<TabsContent value="reviews" className="space-y-6">
								<CourseReviews
									reviews={course.reviews}
									averageRating={course.rating}
									totalReviews={course.reviewCount}
								/>
							</TabsContent>

							<TabsContent value="instructor" className="space-y-6">
								<CourseInstructor instructor={course.instructor} />
							</TabsContent>
						</Tabs>
					</div>

					<div className="space-y-6">
						<Card className="sticky top-24">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									{t("enrollment.title")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<CourseEnrollment course={course} />

								<div className="space-y-3 pt-4 border-t">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.students")}
										</span>
										<span className="font-medium">
											{course.students.toLocaleString()}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.rating")}
										</span>
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span className="font-medium">{course.rating}</span>
											<span className="text-muted-foreground">
												({course.reviewCount})
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.duration")}
										</span>
										<span className="font-medium">{course.duration}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.level")}
										</span>
										<Badge variant="outline">{course.level}</Badge>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.xp")}
										</span>
										<div className="flex items-center gap-1">
											<Zap className="h-4 w-4 text-yellow-500" />
											<span className="font-medium">
												{course.xpReward.toLocaleString()} XP
											</span>
										</div>
									</div>
								</div>

								{course.certificate && (
									<div className="pt-4 border-t">
										<CourseCertificate certificate={course.certificate} />
									</div>
								)}
							</CardContent>
						</Card>

						{course.prerequisites && course.prerequisites.length > 0 && (
							<CoursePrerequisites prerequisites={course.prerequisites} />
						)}

						{course.enrolled && <CourseProgress progress={course.progress} />}
					</div>
				</div>
			</div>
		</div>
	);
}

function CourseDetailSkeleton() {
	return (
		<div className="space-y-8">
			<div className="relative h-96 bg-muted animate-pulse">
				<div className="absolute inset-0 bg-linear-to-r from-primary/20 to-secondary/20" />
			</div>

			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<div className="space-y-4">
							<Skeleton className="h-8 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full mb-4" />
								<div className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

// Mock data - replace with actual API call
type CourseLessonItem = {
	id: string;
	title: string;
	duration: string;
	type: "video" | "interactive" | "quiz" | "reading";
	completed: boolean;
};

async function getCourse(id: string) {
	// This would be replaced with actual CMS/API call
	const mockCourse = {
		id,
		title: "Introduction to Blockchain Technology",
		description:
			"Master the fundamentals of blockchain technology, from basic concepts to advanced implementations. This comprehensive course covers everything you need to know to start building on blockchain platforms.",
		shortDescription:
			"Learn blockchain fundamentals and start building decentralized applications.",
		category: "blockchain",
		level: "beginner",
		duration: "8 weeks",
		rating: 4.8,
		reviewCount: 1247,
		students: 15_420,
		instructor: {
			name: "Dr. Sarah Chen",
			title: "Blockchain Researcher & Educator",
			avatar: "/instructors/sarah-chen.jpg",
			bio: "PhD in Computer Science with 10+ years of experience in blockchain research and education.",
			courses: 12,
			students: 45_000,
			rating: 4.9,
			socialLinks: {
				twitter: "@sarahchen",
				linkedin: "sarahchen",
				website: "sarahchen.dev",
			},
		},
		image: "/courses/blockchain-intro.jpg",
		videoPreview: "/courses/blockchain-intro-preview.mp4",
		tags: ["blockchain", "cryptography", "decentralization", "smart-contracts"],
		xpReward: 2500,
		price: 0,
		enrolled: false,
		progress: {
			percentage: 0,
			completedLessons: 0,
			totalLessons: 11,
			timeSpent: "0 min",
			streak: 0,
			xpEarned: 0,
			xpTotal: 2500,
			estimatedCompletion: "8 weeks",
			lastActivity: "",
		},
		certificate: {
			title: "Blockchain Fundamentals Certificate",
			issuer: "Superteam Academy",
			type: "completion",
			verifiable: true,
		},
		learningObjectives: [
			"Understand blockchain fundamentals and consensus mechanisms",
			"Learn cryptographic principles used in blockchain",
			"Explore different blockchain platforms and their use cases",
			"Build your first decentralized application",
			"Understand smart contract development basics",
		],
		requirements: [
			"Basic programming knowledge",
			"Understanding of computer science fundamentals",
			"No prior blockchain experience required",
		],
		skills: [
			"Blockchain Architecture",
			"Cryptography",
			"Smart Contracts",
			"DApp Development",
			"Web3 Integration",
		],
		modules: [
			{
				id: "1",
				title: "Blockchain Basics",
				description: "Introduction to blockchain technology and its core concepts",
				duration: "2 hours",
				lessons: 5,
				completed: false,
				lessonsList: [
					{
						id: "1-1",
						title: "What is Blockchain?",
						duration: "15 min",
						type: "video",
						completed: false,
					},
					{
						id: "1-2",
						title: "How Blockchain Works",
						duration: "20 min",
						type: "video",
						completed: false,
					},
					{
						id: "1-3",
						title: "Consensus Mechanisms",
						duration: "25 min",
						type: "video",
						completed: false,
					},
					{
						id: "1-4",
						title: "Cryptographic Foundations",
						duration: "30 min",
						type: "interactive",
						completed: false,
					},
					{
						id: "1-5",
						title: "Module Quiz",
						duration: "15 min",
						type: "quiz",
						completed: false,
					},
				] satisfies CourseLessonItem[],
			},
			{
				id: "2",
				title: "Smart Contracts",
				description: "Learn about smart contracts and their applications",
				duration: "3 hours",
				lessons: 6,
				completed: false,
				lessonsList: [
					{
						id: "2-1",
						title: "Introduction to Smart Contracts",
						duration: "20 min",
						type: "video",
						completed: false,
					},
					{
						id: "2-2",
						title: "Solidity Basics",
						duration: "35 min",
						type: "video",
						completed: false,
					},
					{
						id: "2-3",
						title: "Writing Your First Contract",
						duration: "45 min",
						type: "interactive",
						completed: false,
					},
					{
						id: "2-4",
						title: "Testing Smart Contracts",
						duration: "30 min",
						type: "video",
						completed: false,
					},
					{
						id: "2-5",
						title: "Security Best Practices",
						duration: "25 min",
						type: "video",
						completed: false,
					},
					{
						id: "2-6",
						title: "Smart Contract Quiz",
						duration: "15 min",
						type: "quiz",
						completed: false,
					},
				] satisfies CourseLessonItem[],
			},
		],
		reviews: [
			{
				id: "1",
				user: { name: "Alex Johnson", avatar: "/users/alex.jpg" },
				rating: 5,
				date: "2024-01-15",
				comment: "Excellent course! The instructor explains complex concepts very clearly.",
				helpful: 24,
			},
			{
				id: "2",
				user: { name: "Maria Garcia", avatar: "/users/maria.jpg" },
				rating: 4,
				date: "2024-01-10",
				comment: "Great content, but some sections could be more detailed.",
				helpful: 18,
			},
		],
		prerequisites: [
			{ id: "1", title: "Basic Programming", completed: true },
			{ id: "2", title: "Computer Science Fundamentals", completed: false },
		],
	};

	return mockCourse;
}
