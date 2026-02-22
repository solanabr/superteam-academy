"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function NewsletterForm() {
	const t = useTranslations("home.newsletter");
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || isPending) return;

		startTransition(async () => {
			try {
				const response = await fetch("/api/newsletter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email }),
				});

				if (response.ok) {
					setStatus("success");
					setEmail("");
				} else {
					setStatus("error");
				}
			} catch {
				setStatus("error");
			}

			// Reset status after 3 seconds
			setTimeout(() => setStatus("idle"), 3000);
		});
	};

	return (
		<div className="max-w-2xl mx-auto text-center">
			<h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
				{t("title")}
			</h2>
			<p className="mt-4 text-lg text-white/80">{t("description")}</p>

			<form
				onSubmit={handleSubmit}
				className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
			>
				<input
					type="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={t("placeholder")}
					required
					disabled={isPending}
					className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent backdrop-blur-sm disabled:opacity-50"
				/>
				<Button
					type="submit"
					size="lg"
					disabled={isPending}
					className="bg-gold text-dark hover:bg-gold/90 text-base px-8 h-12 font-semibold shadow-lg whitespace-nowrap disabled:opacity-50"
				>
					{isPending ? t("subscribing") : t("subscribe")}
					<ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</form>

			{status === "success" && (
				<p className="mt-4 text-sm text-gold font-medium">{t("success")}</p>
			)}
			{status === "error" && (
				<p className="mt-4 text-sm text-destructive font-medium">{t("error")}</p>
			)}
			{status === "idle" && <p className="mt-4 text-sm text-white/60">{t("privacy")}</p>}
		</div>
	);
}
