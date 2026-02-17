/**
 * Pricing Plans Component
 * Displays available subscription plans with features and pricing
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Check,
    Crown,
    Zap,
    Shield,
    BookOpen,
    Code,
    Trophy,
    Users,
    Award,
    Infinity as InfinityIcon,
    Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface PricingPlansProps {
	onSelectPlan: (planId: string, isYearly: boolean) => void;
	currentPlan?: string;
	className?: string;
}

export function PricingPlans({ onSelectPlan, currentPlan, className = "" }: PricingPlansProps) {
	const t = useTranslations("pricing");
	const [isYearly, setIsYearly] = useState(false);

	const plans = [
		{
			id: "free",
			name: t("plans.free.name"),
			description: t("plans.free.description"),
			icon: BookOpen,
			color: "gray",
			features: [
				t("plans.free.features.courses", { count: 5 }),
				t("plans.free.features.challenges", { count: 2 }),
				t("plans.free.features.certificates", { count: 1 }),
				t("plans.free.features.support"),
				t("plans.free.features.basic"),
			],
			limitations: [t("plans.free.limitations.ads"), t("plans.free.limitations.analytics")],
			cta: t("plans.free.cta"),
			popular: false,
			prices: {
				monthly: 0,
				yearly: 0,
			},
		},
		{
			id: "premium",
			name: t("plans.premium.name"),
			description: t("plans.premium.description"),
			icon: Crown,
			color: "yellow",
			features: [
				t("plans.premium.features.unlimited"),
				t("plans.premium.features.certificates"),
				t("plans.premium.features.priority"),
				t("plans.premium.features.analytics"),
				t("plans.premium.features.downloads"),
				t("plans.premium.features.noAds"),
			],
			limitations: [],
			cta: t("plans.premium.cta"),
			popular: true,
			prices: {
				monthly: 29,
				yearly: 290, // ~$24/month
			},
		},
		{
			id: "pro",
			name: t("plans.pro.name"),
			description: t("plans.pro.description"),
			icon: Zap,
			color: "blue",
			features: [
				t("plans.pro.features.everything"),
				t("plans.pro.features.teams"),
				t("plans.pro.features.api"),
				t("plans.pro.features.whiteLabel"),
				t("plans.pro.features.priority"),
				t("plans.pro.features.dedicated"),
			],
			limitations: [],
			cta: t("plans.pro.cta"),
			popular: false,
			prices: {
				monthly: 99,
				yearly: 990, // ~$82.50/month
			},
		},
		{
			id: "enterprise",
			name: t("plans.enterprise.name"),
			description: t("plans.enterprise.description"),
			icon: Shield,
			color: "purple",
			features: [
				t("plans.enterprise.features.everything"),
				t("plans.enterprise.features.sso"),
				t("plans.enterprise.features.audit"),
				t("plans.enterprise.features.compliance"),
				t("plans.enterprise.features.onPremise"),
				t("plans.enterprise.features.custom"),
			],
			limitations: [],
			cta: t("plans.enterprise.cta"),
			popular: false,
			prices: {
				monthly: 0, // Contact for pricing
				yearly: 0,
			},
		},
	];

	return (
		<div className={`space-y-8 ${className}`}>
			<div className="flex items-center justify-center space-x-4">
				<Label htmlFor="billing-toggle" className={isYearly ? "" : "font-semibold"}>
					{t("billing.monthly")}
				</Label>
				<Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
				<Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : ""}>
					{t("billing.yearly")}
					<Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
						{t("billing.save")} 20%
					</Badge>
				</Label>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{plans.map((plan) => {
					const Icon = plan.icon;
					const price = isYearly ? plan.prices.yearly : plan.prices.monthly;
					const isCurrentPlan = currentPlan === plan.id;
					const isFree = plan.id === "free";

					return (
						<Card
							key={plan.id}
							className={`relative transition-all duration-200 hover:shadow-lg ${
								plan.popular ? "ring-2 ring-yellow-400 shadow-lg scale-105" : ""
							} ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}
						>
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1">
										<Sparkles className="h-3 w-3 mr-1" />
										{t("popular")}
									</Badge>
								</div>
							)}

							{isCurrentPlan && (
								<div className="absolute -top-3 right-4">
									<Badge
										variant="outline"
										className="bg-blue-50 text-blue-700 border-blue-200"
									>
										{t("current")}
									</Badge>
								</div>
							)}

							<CardHeader className="text-center pb-4">
								<div
									className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${plan.color}-100 dark:bg-${plan.color}-900/20 mb-4`}
								>
									<Icon
										className={`h-6 w-6 text-${plan.color}-600 dark:text-${plan.color}-400`}
									/>
								</div>
								<CardTitle className="text-xl">{plan.name}</CardTitle>
								<CardDescription className="text-sm">
									{plan.description}
								</CardDescription>

								<div className="mt-4">
									{isFree ? (
										<div className="text-3xl font-bold text-gray-900 dark:text-white">
											{t("free")}
										</div>
									) : plan.id === "enterprise" ? (
										<div className="text-center">
											<div className="text-3xl font-bold text-gray-900 dark:text-white">
												{t("contact")}
											</div>
											<div className="text-sm text-gray-500 mt-1">
												{t("customPricing")}
											</div>
										</div>
									) : (
										<div className="text-center">
											<div className="text-3xl font-bold text-gray-900 dark:text-white">
												${price}
												<span className="text-sm font-normal text-gray-500">
													/{isYearly ? t("year") : t("month")}
												</span>
											</div>
											{isYearly && (
												<div className="text-sm text-green-600 font-medium">
													{t("save")} $
													{plan.prices.monthly * 12 - plan.prices.yearly}
												</div>
											)}
										</div>
									)}
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								<ul className="space-y-3">
									{plan.features.map((feature, index) => (
										<li key={index} className="flex items-start space-x-3">
											<Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
											<span className="text-sm text-gray-600 dark:text-gray-400">
												{feature}
											</span>
										</li>
									))}
								</ul>

								{plan.limitations.length > 0 && (
									<div className="pt-4 border-t">
										<div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											{t("limitations")}
										</div>
										<ul className="space-y-2">
											{plan.limitations.map((limitation, index) => (
												<li
													key={index}
													className="flex items-start space-x-3"
												>
													<div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
														<div className="h-2 w-2 rounded-full bg-gray-400" />
													</div>
													<span className="text-sm text-gray-500">
														{limitation}
													</span>
												</li>
											))}
										</ul>
									</div>
								)}

								<Button
									className={`w-full mt-6 ${
										plan.popular
											? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
											: ""
									}`}
									variant={
										plan.popular
											? "default"
											: isCurrentPlan
												? "outline"
												: "default"
									}
									disabled={isCurrentPlan}
									onClick={() => onSelectPlan(plan.id, isYearly)}
								>
									{isCurrentPlan ? t("currentPlan") : plan.cta}
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-center">{t("comparison.title")}</CardTitle>
					<CardDescription className="text-center">
						{t("comparison.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="text-left py-3 px-4 font-medium">
										{t("comparison.feature")}
									</th>
									<th className="text-center py-3 px-4 font-medium">
										{t("plans.free.name")}
									</th>
									<th className="text-center py-3 px-4 font-medium">
										{t("plans.premium.name")}
									</th>
									<th className="text-center py-3 px-4 font-medium">
										{t("plans.pro.name")}
									</th>
									<th className="text-center py-3 px-4 font-medium">
										{t("plans.enterprise.name")}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b">
									<td className="py-3 px-4 flex items-center space-x-2">
										<BookOpen className="h-4 w-4" />
										<span>{t("comparison.courses")}</span>
									</td>
									<td className="text-center py-3 px-4">5</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4 flex items-center space-x-2">
										<Code className="h-4 w-4" />
										<span>{t("comparison.challenges")}</span>
									</td>
									<td className="text-center py-3 px-4">2</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<InfinityIcon className="h-4 w-4 mx-auto text-green-500" />
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4 flex items-center space-x-2">
										<Trophy className="h-4 w-4" />
										<span>{t("comparison.certificates")}</span>
									</td>
									<td className="text-center py-3 px-4">1</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4 flex items-center space-x-2">
										<Users className="h-4 w-4" />
										<span>{t("comparison.support")}</span>
									</td>
									<td className="text-center py-3 px-4">
										{t("comparison.community")}
									</td>
									<td className="text-center py-3 px-4">
										{t("comparison.email")}
									</td>
									<td className="text-center py-3 px-4">
										{t("comparison.priority")}
									</td>
									<td className="text-center py-3 px-4">
										{t("comparison.dedicated")}
									</td>
								</tr>
								<tr>
									<td className="py-3 px-4 flex items-center space-x-2">
										<Award className="h-4 w-4" />
										<span>{t("comparison.analytics")}</span>
									</td>
									<td className="text-center py-3 px-4">—</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
									<td className="text-center py-3 px-4">
										<Check className="h-4 w-4 mx-auto text-green-500" />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
