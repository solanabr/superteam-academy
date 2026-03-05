/**
 * @fileoverview Privacy Policy page.
 * Displays the privacy policy for the Superteam Academy terminal.
 */
import { useTranslations } from "next-intl";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { DotGrid } from "@/components/shared/DotGrid";

export default function PrivacyPage() {
	const t = useTranslations("Legal.privacy");

	return (
		<main className="min-h-screen bg-bg-base text-ink-primary font-mono selection:bg-ink-primary selection:text-bg-base flex flex-col">
			{/* Navigation Bar */}
			<Navbar />

			{/* Main Content */}
			<div className="flex-1 relative overflow-hidden py-12 md:py-24">
				<DotGrid />

				<div className="container mx-auto px-6 relative z-10 max-w-4xl">
					{/* Header */}
					<div className="mb-12 border-b border-ink-secondary/20 pb-8">
						<span className="bg-[#0e3f2d] text-[#14F195] border border-[#14F195]/20 px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-4">
							ENCRYPTED_DATA_NOTICE
						</span>
						<h1 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[48px] md:text-[64px] uppercase text-[#062016] dark:text-[#14F195]">
							{t("title")}
						</h1>
						<p className="text-ink-secondary text-[11px] mt-4 tracking-widest uppercase">
							{t("lastUpdated")}
						</p>
					</div>

					{/* Content Sections */}
					<div className="space-y-16">
						{Object.entries(t.raw("sections")).map(([id, section]) => {
							const s = section as { title: string; content: string };
							return (
								<section key={id} className="relative group">
									<div className="absolute -left-4 top-0 w-1 h-full bg-[#0e3f2d]/40 group-hover:bg-[#0e3f2d] transition-colors" />
									<h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-[#062016] dark:text-[#14F195]">
										{s.title}
									</h2>
									<div className="bg-[#0e3f2d]/5 backdrop-blur-sm border border-[#062016]/10 dark:border-[#14F195]/10 p-6 relative">
										<p className="text-ink-secondary text-sm leading-relaxed">
											{s.content}
										</p>
										{/* Decorative scanner lines effect (subtle) */}
										<div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(14,63,45,0)_50%,rgba(14,63,45,0.25)_50%),linear-gradient(90deg,rgba(14,63,45,0.06),rgba(20,241,149,0.02),rgba(14,63,45,0.06))] bg-size-[100%_4px,3px_100%]" />
									</div>
								</section>
							);
						})}
					</div>

					{/* Terminal Signature */}
					<div className="mt-24 pt-12 border-t border-dashed border-ink-secondary/20">
						<div className="flex items-center justify-between text-[10px] text-ink-secondary uppercase tracking-[0.2em]">
							<div className="flex gap-4 items-center">
								<span className="animate-pulse">●</span>
								<span>Privacy Protocol Initialized</span>
							</div>
							<span>v2.0.26</span>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<Footer />
		</main>
	);
}
