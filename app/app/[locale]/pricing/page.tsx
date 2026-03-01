import type { Metadata } from "next";
import { Link } from "@superteam-academy/i18n/navigation";
import { Check, Zap, BookOpen, Trophy, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalizedPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	return getLocalizedPageMetadata(locale, "pricing");
}

const PLANS = [
	{
		name: "Free",
		price: "$0",
		period: "forever",
		description: "Start learning Solana development with foundational courses.",
		cta: "Get started",
		ctaVariant: "outline" as const,
		href: "/courses",
		features: [
			"Access to all foundational courses",
			"Earn XP and track progress",
			"Streak tracking and achievements",
			"Community forum access",
			"Basic learner profile",
		],
	},
	{
		name: "Pro",
		price: "$19",
		period: "per month",
		description: "Unlock advanced content, credentials, and premium features.",
		cta: "Start free trial",
		ctaVariant: "default" as const,
		href: "/courses",
		popular: true,
		features: [
			"Everything in Free",
			"All advanced and expert courses",
			"On-chain verifiable credentials (ZK)",
			"Streak freeze tokens",
			"Priority support",
			"Early access to new content",
		],
	},
	{
		name: "Team",
		price: "$49",
		period: "per seat / month",
		description: "For organizations training their developers on Solana.",
		cta: "Contact us",
		ctaVariant: "outline" as const,
		href: "#",
		features: [
			"Everything in Pro",
			"Team analytics dashboard",
			"Custom learning paths",
			"Dedicated account manager",
			"Invoice billing",
			"SSO integration",
		],
	},
];

const FAQ = [
	{
		q: "Can I learn for free?",
		a: "Yes. All foundational courses are free forever. You can earn XP, track streaks, and build your profile without paying anything.",
	},
	{
		q: "What are on-chain credentials?",
		a: "Verifiable credentials issued as compressed tokens on Solana using ZK Compression. They prove your skills on-chain and can be verified by anyone.",
	},
	{
		q: "Can I cancel anytime?",
		a: "Yes. Pro subscriptions can be canceled at any time. You keep access until the end of your billing period.",
	},
	{
		q: "Do you offer student discounts?",
		a: "Yes. Reach out to support with proof of enrollment and we'll apply a 50% discount to Pro.",
	},
];

export default function PricingPage() {
	return (
		<div className="mx-auto px-4 sm:px-6 py-12 space-y-16">
			<div className="text-center max-w-2xl mx-auto">
				<h1 className="text-4xl font-bold font-display mb-3">
					Simple, transparent pricing
				</h1>
				<p className="text-lg text-muted-foreground">
					Start learning for free. Upgrade when you need advanced content and verifiable
					credentials.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{PLANS.map((plan) => (
					<div
						key={plan.name}
						className={`rounded-2xl border bg-card p-6 flex flex-col ${
							plan.popular
								? "border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
								: "border-border/60"
						}`}
					>
						{plan.popular && (
							<span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full self-start mb-4">
								Most popular
							</span>
						)}

						<h2 className="text-xl font-bold font-display">{plan.name}</h2>
						<div className="mt-2 flex items-baseline gap-1">
							<span className="text-4xl font-bold font-display">{plan.price}</span>
							<span className="text-sm text-muted-foreground">/{plan.period}</span>
						</div>
						<p className="text-sm text-muted-foreground mt-2">{plan.description}</p>

						<Button variant={plan.ctaVariant} className="w-full mt-6" size="sm" asChild>
							<Link href={plan.href}>{plan.cta}</Link>
						</Button>

						<div className="mt-6 pt-6 border-t border-border/40 space-y-3 flex-1">
							{plan.features.map((feature) => (
								<div key={feature} className="flex items-start gap-2">
									<Check className="h-4 w-4 text-[#008c4c] shrink-0 mt-0.5" />
									<span className="text-sm">{feature}</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="space-y-6">
				<h2 className="text-2xl font-bold font-display text-center">
					What you get with each plan
				</h2>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
					{[
						{ icon: BookOpen, label: "Free courses", sub: "All plans" },
						{ icon: Zap, label: "XP tracking", sub: "All plans" },
						{ icon: Trophy, label: "Achievements", sub: "All plans" },
						{ icon: Shield, label: "On-chain creds", sub: "Pro & Team" },
						{ icon: Users, label: "Team analytics", sub: "Team only" },
						{ icon: Zap, label: "Streak freezes", sub: "Pro & Team" },
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="rounded-xl border border-border/60 bg-card p-4 text-center"
							>
								<Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
								<p className="text-sm font-medium">{item.label}</p>
								<p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
							</div>
						);
					})}
				</div>
			</div>

			<div className="max-w-2xl mx-auto">
				<h2 className="text-2xl font-bold font-display text-center mb-8">
					Frequently asked questions
				</h2>
				<div className="space-y-4">
					{FAQ.map((item) => (
						<div
							key={item.q}
							className="rounded-2xl border border-border/60 bg-card p-5"
						>
							<p className="text-sm font-semibold">{item.q}</p>
							<p className="text-sm text-muted-foreground mt-2">{item.a}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
