/**
 * @fileoverview Partners section for the landing page.
 * Displays a seamless, infinitely scrolling carousel of ecosystem partner logos.
 * Uses pure CSS animation instead of framer-motion for optimal performance.
 */
import Image from "next/image";

/**
 * Partner Logo Component
 * Renders a branded logo with theme-aware filter and hover effects.
 */
const PartnerLogo = ({ name, src }: { name: string; src: string }) => (
	<Image
		src={src}
		alt={name}
		width={120}
		height={40}
		loading="lazy"
		className="h-8 w-auto brightness-0 dark:invert transition-all opacity-70 hover:opacity-100"
	/>
);

/**
 * Partners Section
 * Displays a seamless, infinitely scrolling carousel of ecosystem partners.
 * Uses CSS keyframe animation for zero JS overhead.
 */
export function Partners() {
	const partners = [
		{ name: "Superteam", src: "/logo.svg", showLabel: true },
		{ name: "Solana", src: "/images/partners/solana.svg", showLabel: true },
		{ name: "Jupiter", src: "/images/partners/jupyter.svg", showLabel: true },
		{ name: "Helium", src: "/images/partners/helium.svg", showLabel: true },
		{
			name: "Hivemapper",
			src: "/images/partners/hivemapper.svg",
			showLabel: false,
		},
		{ name: "Drift", src: "/images/partners/drift.svg", showLabel: true },
	];

	// Duplicate for seamless loop
	const infinitePartners = [...partners, ...partners];

	return (
		<div
			className="border-b border-ink-secondary/20 dark:border-border overflow-hidden py-10 flex relative z-0 bg-bg-base"
			style={{
				maskImage:
					"linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
			}}
		>
			<div
				className="flex gap-12 md:gap-24 items-center whitespace-nowrap animate-scroll"
				style={{
					animationDuration: "30s",
				}}
			>
				{infinitePartners.map((partner, i) => (
					<div
						key={`${partner.name}-${i}`}
						className="flex items-center gap-2 grayscale opacity-60 hover:opacity-100 transition-all cursor-pointer group"
					>
						<PartnerLogo name={partner.name} src={partner.src} />
						{partner.showLabel && (
							<span className="uppercase tracking-widest font-bold text-xl text-ink-primary group-hover:text-ink-primary">
								{partner.name}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
