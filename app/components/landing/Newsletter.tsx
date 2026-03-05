/**
 * @fileoverview Newsletter signup section for the landing page.
 * Collects operator emails for technical updates and ecosystem opportunities.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Newsletter Section
 * Collects operator emails for technical updates and ecosystem opportunities.
 */
export function Newsletter() {
	const t = useTranslations("Newsletter");
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;

		setIsSubmitting(true);
		posthog.capture("newsletter_signup_attempt", {
			email_domain: email.split("@")[1],
		});

		try {
			// Simulation of API call or future integration
			// For now, we just track the intent and show a success message
			await new Promise((resolve) => setTimeout(resolve, 800));

			posthog.capture("newsletter_signup_success");
			sendGAEvent("event", "newsletter_signup", { method: "landing_footer" });

			toast.success("Welcome aboard, Operator.");
			setEmail("");
		} catch (error) {
			Sentry.captureException(error, {
				extra: { email_domain: email.split("@")[1] },
			});
			toast.error("Signal lost. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section
			className="py-16 md:py-20 px-6 md:px-12 border-t border-ink-secondary/20 dark:border-border bg-bg-base relative overflow-hidden"
			aria-label="Newsletter signup"
		>
			{/* Dot Grid Background */}
			<DotGrid />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
				{/* Newsletter Pitch */}
				<div>
					<h4 className="uppercase tracking-widest font-bold text-2xl mb-4">
						{t("title")}
					</h4>
					<p className="text-ink-secondary text-sm max-w-md">
						{t("description")}
					</p>
				</div>

				{/* Signup Form */}
				<form
					className="flex flex-col gap-4"
					onSubmit={handleSubmit}
					aria-label="Newsletter subscription form"
				>
					<label htmlFor="newsletter-email" className="sr-only">
						Email address
					</label>
					<Input
						id="newsletter-email"
						variant="landing"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t("placeholder")}
						className="w-full"
						autoComplete="email"
						disabled={isSubmitting}
						aria-label="Email address for newsletter"
					/>
					<Button
						type="submit"
						variant="landingPrimary"
						disabled={isSubmitting}
						className="rounded-none uppercase text-xs font-bold w-full py-4 h-auto"
					>
						{isSubmitting ? "TRANSMITTING..." : t("button")}
					</Button>
				</form>
			</div>
		</section>
	);
}
