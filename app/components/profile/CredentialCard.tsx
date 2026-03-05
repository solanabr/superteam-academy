/**
 * @fileoverview Component for displaying a single credential or certificate as a card.
 */
"use client";

import { Link } from "@/i18n/routing";
import { Credential } from "@/lib/data/credentials";

interface CredentialCardProps {
	credential: Credential;
}

// Map credential tracks to certificate IDs
const trackToCertificateId: Record<string, string> = {
	SOLANA_CORE_TRACK: "solana-basics",
	ANCHOR_FRAMEWORK: "anchor-framework",
	SECURITY_AUDITING: "rust-fundamentals", // Map to available certificate
	RUST_FUNDAMENTALS: "rust-fundamentals",
};

/**
 * CredentialCard Component
 * Renders an evolving cNFT or certificate as a premium card with track info and Solscan link.
 */
export function CredentialCard({ credential }: CredentialCardProps) {
	// Get the certificate ID from the mapping, or use mintAddress for on-chain assets
	const certificateId =
		credential.verified && credential.mintAddress
			? credential.mintAddress
			: trackToCertificateId[credential.track] ||
				credential.track.toLowerCase().replace(/[_\s]+/g, "-");

	return (
		<div className="border border-border p-3 bg-bg-surface group hover:border-ink-primary transition-colors">
			<Link href={`/certificates/${certificateId}`} className="block">
				<div
					className="w-full aspect-square mb-3 relative overflow-hidden cursor-pointer"
					style={{ background: credential.gradient }}
				>
					<i
						className={`${credential.icon} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[64px]`}
						style={{
							color: credential.gradient.includes("#D1DEDC")
								? "var(--ink-primary)"
								: "white",
						}}
					></i>

					{credential.verified && (
						<div className="absolute top-1 right-1 bg-[#00FF00] text-black text-[8px] font-bold px-1 py-0.5">
							VERIFIED
						</div>
					)}

					{/* View Certificate Overlay */}
					<div className="absolute inset-0 bg-ink-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
						<span className="text-white text-[10px] font-bold uppercase tracking-widest">
							VIEW CERTIFICATE
						</span>
					</div>
				</div>

				<div className="text-[10px] font-bold uppercase tracking-widest">
					{credential.track}
				</div>
				<div className="text-[10px] text-ink-secondary uppercase tracking-widest">
					LEVEL {credential.level} {"//"} {credential.tier}
				</div>
			</Link>

			<div className="mt-3">
				<a
					href={`https://solscan.io/token/${credential.mintAddress}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-[10px] uppercase tracking-widest text-ink-secondary hover:text-ink-primary"
					onClick={(e) => e.stopPropagation()}
				>
					VIEW_ON_SOLSCAN ↗
				</a>
			</div>
		</div>
	);
}
