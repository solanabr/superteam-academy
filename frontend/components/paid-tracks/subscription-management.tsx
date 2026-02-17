/**
 * Subscription Management Component
 * Handles user subscriptions, billing, and premium access
 */

"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Calendar, CheckCircle, AlertTriangle, Crown, Zap, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface Subscription {
	id: string;
	planId: string;
	status: "active" | "canceled" | "past_due" | "incomplete";
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
}

interface Plan {
	id: string;
	name: string;
	price: number;
	currency: string;
	features: string[];
}

// Invoice interface removed - unused

interface SubscriptionManagementProps {
	userId: string;
	className?: string;
}

interface SubscriptionOverviewProps {
	subscription: Subscription | null;
	plans: Plan[];
}

interface SubscriptionPlansProps {
	currentPlan: string | undefined;
	plans: Plan[];
	onUpgrade: (planId: string) => Promise<void>;
}

interface BillingHistoryProps {
	subscription: Subscription | null;
}

interface SubscriptionSettingsProps {
	subscription: Subscription | null;
	onCancel: () => Promise<void>;
	onReactivate: () => Promise<void>;
	onUpdatePayment: () => Promise<void>;
}

export function SubscriptionManagement({ userId, className = "" }: SubscriptionManagementProps) {
	const t = useTranslations("subscription");
	const {
		subscription,
		plans,
		loading,
		error,
		upgradeSubscription,
		cancelSubscription,
		reactivateSubscription,
		updatePaymentMethod,
	} = useSubscription(userId);

	const [activeTab, setActiveTab] = useState("overview");

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{t("title")}</h2>
					<p className="text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
				</div>
				{subscription?.status === "active" && (
					<Badge variant="secondary" className="bg-green-100 text-green-800">
						<CheckCircle className="h-4 w-4 mr-1" />
						{t("status.active")}
					</Badge>
				)}
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="plans">{t("tabs.plans")}</TabsTrigger>
					<TabsTrigger value="billing">{t("tabs.billing")}</TabsTrigger>
					<TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<SubscriptionOverview subscription={subscription} plans={plans} />
				</TabsContent>

				<TabsContent value="plans" className="space-y-4">
					<SubscriptionPlans
						currentPlan={subscription?.planId}
						plans={plans}
						onUpgrade={upgradeSubscription}
					/>
				</TabsContent>

				<TabsContent value="billing" className="space-y-4">
					<BillingHistory subscription={subscription} />
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<SubscriptionSettings
						subscription={subscription}
						onCancel={cancelSubscription}
						onReactivate={reactivateSubscription}
						onUpdatePayment={updatePaymentMethod}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function SubscriptionOverview({ subscription, plans }: SubscriptionOverviewProps) {
	const t = useTranslations("subscription");

	if (!subscription) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Crown className="h-5 w-5" />
						<span>{t("overview.free.title")}</span>
					</CardTitle>
					<CardDescription>{t("overview.free.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-4 border rounded-lg">
							<div className="text-2xl font-bold text-gray-600">5</div>
							<div className="text-sm text-gray-500">
								{t("overview.free.courses")}
							</div>
						</div>
						<div className="text-center p-4 border rounded-lg">
							<div className="text-2xl font-bold text-gray-600">2</div>
							<div className="text-sm text-gray-500">
								{t("overview.free.challenges")}
							</div>
						</div>
						<div className="text-center p-4 border rounded-lg">
							<div className="text-2xl font-bold text-gray-600">1</div>
							<div className="text-sm text-gray-500">
								{t("overview.free.certificates")}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	const currentPlan = plans.find((p) => p.id === subscription.planId);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Crown className="h-5 w-5 text-yellow-500" />
							<span>{currentPlan?.name}</span>
						</div>
						<Badge variant={subscription.status === "active" ? "default" : "secondary"}>
							{subscription.status}
						</Badge>
					</CardTitle>
					<CardDescription>
						{subscription.status === "active"
							? t("overview.active.description", {
									date: format(new Date(subscription.currentPeriodEnd), "PPP"),
								})
							: t("overview.inactive.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
							<div className="text-2xl font-bold text-blue-600">∞</div>
							<div className="text-sm text-blue-600">
								{t("overview.premium.courses")}
							</div>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
							<div className="text-2xl font-bold text-green-600">∞</div>
							<div className="text-sm text-green-600">
								{t("overview.premium.challenges")}
							</div>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
							<div className="text-2xl font-bold text-purple-600">∞</div>
							<div className="text-sm text-purple-600">
								{t("overview.premium.certificates")}
							</div>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
							<div className="text-2xl font-bold text-yellow-600">24/7</div>
							<div className="text-sm text-yellow-600">
								{t("overview.premium.support")}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{subscription.status === "active" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Calendar className="h-5 w-5" />
							<span>{t("overview.billing.title")}</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>{t("overview.billing.nextPayment")}</span>
								<span>
									{format(new Date(subscription.currentPeriodEnd), "PPP")}
								</span>
							</div>
							<div className="flex justify-between">
								<span>{t("overview.billing.amount")}</span>
								<span>${currentPlan?.price}/month</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function SubscriptionPlans({ currentPlan, plans, onUpgrade }: SubscriptionPlansProps) {
	const t = useTranslations("subscription");

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{plans.map((plan) => (
				<Card
					key={plan.id}
					className={`relative ${currentPlan === plan.id ? "ring-2 ring-blue-500" : ""}`}
				>
					{currentPlan === plan.id && (
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<Badge className="bg-blue-500">{t("plans.current")}</Badge>
						</div>
					)}

					<CardHeader className="text-center">
						<CardTitle className="flex items-center justify-center space-x-2">
							{plan.id === "premium" && <Crown className="h-5 w-5 text-yellow-500" />}
							{plan.id === "pro" && <Zap className="h-5 w-5 text-blue-500" />}
							{plan.id === "enterprise" && (
								<Shield className="h-5 w-5 text-purple-500" />
							)}
							<span>{plan.name}</span>
						</CardTitle>
						<div className="text-3xl font-bold">
							${plan.price}
							<span className="text-sm font-normal text-gray-500">/month</span>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						<ul className="space-y-2">
							{plan.features.map((feature: string, index: number) => (
								<li key={index} className="flex items-center space-x-2">
									<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
									<span className="text-sm">{feature}</span>
								</li>
							))}
						</ul>

						{currentPlan !== plan.id && (
							<Button className="w-full" onClick={() => onUpgrade(plan.id)}>
								{t("plans.upgrade")}
							</Button>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function BillingHistory({ subscription: _subscription }: BillingHistoryProps) {
	const t = useTranslations("subscription");

	// Mock billing history - in real app, this would come from API
	const billingHistory = [
		{
			id: "1",
			date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			amount: 29.99,
			status: "paid",
			description: "Premium Plan - Monthly",
		},
		{
			id: "2",
			date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
			amount: 29.99,
			status: "paid",
			description: "Premium Plan - Monthly",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<CreditCard className="h-5 w-5" />
					<span>{t("billing.title")}</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{billingHistory.map((invoice) => (
						<div
							key={invoice.id}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div>
								<div className="font-medium">{invoice.description}</div>
								<div className="text-sm text-gray-500">
									{format(invoice.date, "PPP")}
								</div>
							</div>
							<div className="text-right">
								<div className="font-medium">${invoice.amount}</div>
								<Badge
									variant={invoice.status === "paid" ? "default" : "secondary"}
								>
									{invoice.status}
								</Badge>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function SubscriptionSettings({
	subscription,
	onCancel: _onCancel,
	onReactivate,
	onUpdatePayment,
}: SubscriptionSettingsProps) {
	const t = useTranslations("subscription");
	const [, setShowCancelDialog] = useState(false);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("settings.payment.title")}</CardTitle>
					<CardDescription>{t("settings.payment.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div className="flex items-center space-x-3">
							<CreditCard className="h-8 w-8" />
							<div>
								<div className="font-medium">•••• •••• •••• 4242</div>
								<div className="text-sm text-gray-500">Expires 12/25</div>
							</div>
						</div>
						<Button variant="outline" onClick={onUpdatePayment}>
							{t("settings.payment.update")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{subscription?.status === "active" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-red-600">{t("settings.cancel.title")}</CardTitle>
						<CardDescription>{t("settings.cancel.description")}</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>{t("settings.cancel.warning")}</AlertDescription>
						</Alert>
						<Button
							variant="destructive"
							className="mt-4"
							onClick={() => setShowCancelDialog(true)}
						>
							{t("settings.cancel.button")}
						</Button>
					</CardContent>
				</Card>
			)}

			{subscription?.status === "canceled" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-green-600">
							{t("settings.reactivate.title")}
						</CardTitle>
						<CardDescription>{t("settings.reactivate.description")}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={onReactivate}>{t("settings.reactivate.button")}</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
