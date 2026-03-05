/**
 * @fileoverview Terms of Service page.
 * Displays the legal terms for using the Superteam Academy terminal.
 */
import { useTranslations } from "next-intl";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { DotGrid } from "@/components/shared/DotGrid";

export default function TermsPage() {
	const t = useTranslations("Legal.terms");

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
						<span className="bg-ink-primary text-bg-base px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-4">
							LEGAL_PROTOCOL_01
						</span>
						<h1 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[48px] md:text-[64px] uppercase">
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
									<div className="absolute -left-4 top-0 w-1 h-full bg-ink-primary/10 group-hover:bg-ink-primary/30 transition-colors" />
									<h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-ink-primary">
										{s.title}
									</h2>
									<div className="bg-bg-struct/40 backdrop-blur-sm border border-ink-secondary/10 p-6 relative">
										<p className="text-ink-secondary text-sm leading-relaxed">
											{s.content}
										</p>
										{/* Decorative corner */}
										<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink-primary/30" />
									</div>
								</section>
							);
						})}
					</div>

					{/* Terminal Signature */}
					<div className="mt-24 pt-12 border-t border-dashed border-ink-secondary/20">
						<div className="flex items-center gap-4 text-[10px] text-ink-secondary uppercase tracking-[0.2em]">
							<span className="animate-pulse">●</span>
							<span>End of Protocol</span>
							<span>{"//"}</span>
							<span>Superteam Academy Legal Index</span>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<Footer />
		</main>
	);
}
