/**
 * Paid Courses Component
 * Displays premium courses with access controls and upgrade prompts
 */

"use client";

import { useState, useMemo } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { PremiumCourseAccess } from "./premium-access";
import { PricingPlans } from "./pricing-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Crown, Clock, Users, Star, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface PremiumCourse {
	id: string;
	title: string;
	description: string;
	category: string;
	difficulty: "beginner" | "intermediate" | "advanced" | "expert";
	duration: string;
	students: number;
	rating: number;
	instructor: string;
	price: number;
	thumbnail: string;
	tags: string[];
	featured: boolean;
	new: boolean;
}

interface PaidCoursesProps {
	userId: string;
	className?: string;
}

export function PaidCourses({ userId, className = "" }: PaidCoursesProps) {
	const t = useTranslations("courses");
	const { subscription, hasAccessToCourse: _hasAccessToCourse } = useSubscription(userId);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedDifficulty, setSelectedDifficulty] = useState("all");
	const [sortBy, setSortBy] = useState("popular");
	const [activeTab, setActiveTab] = useState("courses");

	// Mock premium courses data
	const premiumCourses: PremiumCourse[] = [
		{
			id: "advanced-defi",
			title: "Advanced DeFi Development",
			description:
				"Master decentralized finance protocols and smart contract development with real-world projects.",
			category: "blockchain",
			difficulty: "advanced",
			duration: "8 weeks",
			students: 1250,
			rating: 4.8,
			instructor: "Dr. Sarah Chen",
			price: 299,
			thumbnail: "/images/courses/defi-advanced.jpg",
			tags: ["DeFi", "Smart Contracts", "Solidity", "Uniswap"],
			featured: true,
			new: false,
		},
		{
			id: "ai-ml-blockchain",
			title: "AI & Machine Learning on Blockchain",
			description:
				"Explore the intersection of artificial intelligence and blockchain technology.",
			category: "ai",
			difficulty: "expert",
			duration: "10 weeks",
			students: 890,
			rating: 4.9,
			instructor: "Prof. Michael Rodriguez",
			price: 399,
			thumbnail: "/images/courses/ai-blockchain.jpg",
			tags: ["AI", "Machine Learning", "Blockchain", "Python"],
			featured: true,
			new: true,
		},
		{
			id: "rust-systems",
			title: "Systems Programming with Rust",
			description: "Build high-performance systems and blockchain infrastructure with Rust.",
			category: "programming",
			difficulty: "intermediate",
			duration: "6 weeks",
			students: 2100,
			rating: 4.7,
			instructor: "Alex Johnson",
			price: 199,
			thumbnail: "/images/courses/rust-systems.jpg",
			tags: ["Rust", "Systems Programming", "Performance", "Blockchain"],
			featured: false,
			new: false,
		},
		{
			id: "web3-fullstack",
			title: "Full-Stack Web3 Development",
			description:
				"Complete guide to building decentralized applications from frontend to backend.",
			category: "web3",
			difficulty: "intermediate",
			duration: "12 weeks",
			students: 3400,
			rating: 4.6,
			instructor: "Emma Thompson",
			price: 349,
			thumbnail: "/images/courses/web3-fullstack.jpg",
			tags: ["Web3", "React", "Solidity", "IPFS", "The Graph"],
			featured: false,
			new: false,
		},
		{
			id: "security-audit",
			title: "Smart Contract Security Auditing",
			description:
				"Learn professional security auditing techniques for blockchain applications.",
			category: "security",
			difficulty: "expert",
			duration: "8 weeks",
			students: 675,
			rating: 4.9,
			instructor: "Security Expert Team",
			price: 499,
			thumbnail: "/images/courses/security-audit.jpg",
			tags: ["Security", "Auditing", "Smart Contracts", "Vulnerabilities"],
			featured: true,
			new: false,
		},
		{
			id: "nft-marketplace",
			title: "Building NFT Marketplaces",
			description: "Create your own NFT marketplace with advanced features and integrations.",
			category: "nft",
			difficulty: "advanced",
			duration: "7 weeks",
			students: 1800,
			rating: 4.5,
			instructor: "Lisa Park",
			price: 279,
			thumbnail: "/images/courses/nft-marketplace.jpg",
			tags: ["NFT", "Marketplace", "ERC-721", "Trading"],
			featured: false,
			new: true,
		},
	];

	const categories = [
		{ value: "all", label: t("categories.all") },
		{ value: "blockchain", label: t("categories.blockchain") },
		{ value: "ai", label: t("categories.ai") },
		{ value: "programming", label: t("categories.programming") },
		{ value: "web3", label: t("categories.web3") },
		{ value: "security", label: t("categories.security") },
		{ value: "nft", label: t("categories.nft") },
	];

	const difficulties = [
		{ value: "all", label: t("difficulties.all") },
		{ value: "beginner", label: t("difficulties.beginner") },
		{ value: "intermediate", label: t("difficulties.intermediate") },
		{ value: "advanced", label: t("difficulties.advanced") },
		{ value: "expert", label: t("difficulties.expert") },
	];

	const sortOptions = [
		{ value: "popular", label: t("sort.popular") },
		{ value: "rating", label: t("sort.rating") },
		{ value: "newest", label: t("sort.newest") },
		{ value: "price-low", label: t("sort.priceLow") },
		{ value: "price-high", label: t("sort.priceHigh") },
	];

	const filteredAndSortedCourses = useMemo(() => {
		const filtered = premiumCourses.filter((course) => {
			const matchesSearch =
				course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesCategory =
				selectedCategory === "all" || course.category === selectedCategory;
			const matchesDifficulty =
				selectedDifficulty === "all" || course.difficulty === selectedDifficulty;

			return matchesSearch && matchesCategory && matchesDifficulty;
		});

		// Sort courses
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "rating":
					return b.rating - a.rating;
				case "newest":
					return b.new ? 1 : a.new ? -1 : 0;
				case "price-low":
					return a.price - b.price;
				case "price-high":
					return b.price - a.price;
				default:
					return b.students - a.students;
			}
		});

		return filtered;
	}, [searchQuery, selectedCategory, selectedDifficulty, sortBy, premiumCourses.filter]);

	const handlePlanSelect = (_planId: string, _isYearly: boolean) => {
		// ignored
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{t("premium.title")}</h2>
					<p className="text-gray-600 dark:text-gray-400">{t("premium.subtitle")}</p>
				</div>
				{subscription?.planId === "free" && (
					<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
						<Crown className="h-4 w-4 mr-1" />
						{t("upgradeAvailable")}
					</Badge>
				)}
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="courses">{t("tabs.courses")}</TabsTrigger>
					<TabsTrigger value="pricing">{t("tabs.pricing")}</TabsTrigger>
				</TabsList>

				<TabsContent value="courses" className="space-y-6">
					<Card>
						<CardContent className="p-6">
							<div className="flex flex-col lg:flex-row gap-4">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
										<Input
											placeholder={t("search.placeholder")}
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>

								<div className="flex gap-4">
									<Select
										value={selectedCategory}
										onValueChange={setSelectedCategory}
									>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem
													key={category.value}
													value={category.value}
												>
													{category.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select
										value={selectedDifficulty}
										onValueChange={setSelectedDifficulty}
									>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{difficulties.map((difficulty) => (
												<SelectItem
													key={difficulty.value}
													value={difficulty.value}
												>
													{difficulty.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select value={sortBy} onValueChange={setSortBy}>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{sortOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredAndSortedCourses.map((course) => (
							<PremiumCourseAccess
								key={course.id}
								courseId={course.id}
								userId={userId}
							>
								<CourseCard course={course} />
							</PremiumCourseAccess>
						))}
					</div>

					{filteredAndSortedCourses.length === 0 && (
						<Card>
							<CardContent className="p-12 text-center">
								<BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">{t("noCourses.title")}</h3>
								<p className="text-gray-600 dark:text-gray-400">
									{t("noCourses.description")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="pricing" className="space-y-6">
					<PricingPlans
						onSelectPlan={handlePlanSelect}
						currentPlan={subscription?.planId ?? ""}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function CourseCard({ course }: { course: PremiumCourse }) {
	const t = useTranslations("courses");

	const difficultyColors = {
		beginner: "bg-green-100 text-green-800",
		intermediate: "bg-yellow-100 text-yellow-800",
		advanced: "bg-orange-100 text-orange-800",
		expert: "bg-red-100 text-red-800",
	};

	return (
		<Card className="h-full hover:shadow-lg transition-shadow duration-200">
			<div className="relative">
				<div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg flex items-center justify-center">
					<BookOpen className="h-12 w-12 text-gray-400" />
				</div>

				{course.featured && (
					<Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
						<Star className="h-3 w-3 mr-1" />
						{t("featured")}
					</Badge>
				)}

				{course.new && (
					<Badge className="absolute top-3 right-3 bg-green-500 text-white">
						{t("new")}
					</Badge>
				)}

				<div className="absolute bottom-3 right-3">
					<Badge
						className={`text-xs ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
					>
						{t(`difficulties.${course.difficulty}`)}
					</Badge>
				</div>
			</div>

			<CardHeader className="pb-3">
				<CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
				<CardDescription className="line-clamp-2">{course.description}</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
					<div className="flex items-center space-x-1">
						<Clock className="h-4 w-4" />
						<span>{course.duration}</span>
					</div>
					<div className="flex items-center space-x-1">
						<Users className="h-4 w-4" />
						<span>{course.students.toLocaleString()}</span>
					</div>
					<div className="flex items-center space-x-1">
						<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
						<span>{course.rating}</span>
					</div>
				</div>

				<div className="flex flex-wrap gap-1">
					{course.tags.slice(0, 3).map((tag) => (
						<Badge key={tag} variant="secondary" className="text-xs">
							{tag}
						</Badge>
					))}
					{course.tags.length > 3 && (
						<Badge variant="secondary" className="text-xs">
							+{course.tags.length - 3}
						</Badge>
					)}
				</div>

				<div className="flex items-center justify-between pt-2 border-t">
					<div className="text-sm text-gray-600 dark:text-gray-400">
						{t("by")} {course.instructor}
					</div>
					<div className="text-right">
						<div className="text-lg font-bold text-green-600">${course.price}</div>
						<div className="text-xs text-gray-500">{t("oneTime")}</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
