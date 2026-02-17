import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = {
	Learn: [
		{ label: "Catalog", href: "/courses" },
		{ label: "Topics", href: "/topics" },
		{ label: "Learning Paths", href: "/courses?view=paths" },
		{ label: "Challenges", href: "/challenges" },
		{ label: "Certifications", href: "/certifications" },
	],
	Community: [
		{ label: "Leaderboard", href: "/leaderboard" },
		{ label: "Discord", href: "#" },
		{ label: "Forum", href: "/community" },
		{ label: "Events", href: "/events" },
		{ label: "Blog", href: "/blog" },
	],
	Resources: [
		{ label: "Documentation", href: "/docs" },
		{ label: "API Reference", href: "/docs/api" },
		{ label: "FAQs", href: "/faq" },
		{ label: "Help Center", href: "/help" },
	],
	Company: [
		{ label: "About", href: "/about" },
		{ label: "Careers", href: "/careers" },
		{ label: "Pricing", href: "/pricing" },
		{ label: "Contact", href: "/contact" },
	],
} as const;

export function SiteFooter() {
	return (
		<footer className="border-t border-border bg-muted/30">
			<div className="mx-auto px-4 sm:px-6">
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
						<div className="col-span-2 md:col-span-1 space-y-4">
							<Link href="/" className="inline-block">
								<Image
									src="/logo.svg"
									alt="Superteam Academy"
									width={140}
									height={30}
									className="h-7 w-auto"
								/>
							</Link>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
								Master Solana development through interactive courses and earn
								verifiable on-chain credentials.
							</p>
						</div>

						{Object.entries(FOOTER_LINKS).map(([category, links]) => (
							<div key={category}>
								<h3 className="text-sm font-semibold text-foreground mb-3">
									{category}
								</h3>
								<ul className="space-y-2">
									{links.map((link) => (
										<li key={link.label}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
					<p>2026 Superteam Academy. Built on Solana.</p>
					<div className="flex items-center gap-6">
						<Link href="/privacy" className="hover:text-foreground transition-colors">
							Privacy
						</Link>
						<Link href="/terms" className="hover:text-foreground transition-colors">
							Terms
						</Link>
						<Link href="/cookies" className="hover:text-foreground transition-colors">
							Cookies
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
