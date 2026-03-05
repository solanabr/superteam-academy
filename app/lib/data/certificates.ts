/**
 * @fileoverview Data models and utilities for course certificates.
 * Handles both mock data and real-time on-chain asset resolution.
 */

/** Represents a course completion certificate, either mock or on-chain. */
export interface Certificate {
	id: string;
	certificateNo: string;
	courseName: string;
	courseDescription: string;
	recipient: string;
	walletAddress: string;
	issueDate: string;
	validator: string;
	onChain: {
		assetType: string;
		mintAddress: string;
		owner: string;
		metadataUri: string;
		status: "verified" | "pending";
		signature: string;
	};
	mastery: {
		finalScore: number;
		maxScore: number;
		xpEarned: number;
		rankAchieved: number;
	};
}

// Mock certificate data
export const mockCertificates: Record<string, Certificate> = {
	"rust-fundamentals": {
		id: "rust-fundamentals",
		certificateNo: "STA-RF-2024-0892",
		courseName: "RUST FUNDAMENTALS",
		courseDescription:
			"Demonstrated proficiency in Ownership, Structs, PDAs, and Memory Management.",
		recipient: "OPERATOR_0xKD...92A",
		walletAddress: "0xKD...92A",
		issueDate: "OCTOBER 24, 2024",
		validator: "SUPERTEAM PROTOCOL",
		onChain: {
			assetType: "Compressed NFT",
			mintAddress: "7xK9...p4Lm",
			owner: "0xKD...92A",
			metadataUri: "arweave.net/k2...j9",
			status: "verified",
			signature: "4z9fR...kP2m...Lq88...vXy1...92bN...wQzP...7mRt...zZ5p",
		},
		mastery: {
			finalScore: 98,
			maxScore: 100,
			xpEarned: 2500,
			rankAchieved: 10,
		},
	},
	"solana-basics": {
		id: "solana-basics",
		certificateNo: "STA-SB-2024-0893",
		courseName: "SOLANA BASICS",
		courseDescription:
			"Demonstrated proficiency in Accounts, Transactions, Programs, and Network Architecture.",
		recipient: "OPERATOR_0xKD...92A",
		walletAddress: "0xKD...92A",
		issueDate: "NOVEMBER 15, 2024",
		validator: "SUPERTEAM PROTOCOL",
		onChain: {
			assetType: "Compressed NFT",
			mintAddress: "8yL2...q5Nn",
			owner: "0xKD...92A",
			metadataUri: "arweave.net/m3...k8",
			status: "verified",
			signature: "5a8gS...nQ3n...Mr99...wYz2...83cO...xRaQ...8nSu...aA6q",
		},
		mastery: {
			finalScore: 95,
			maxScore: 100,
			xpEarned: 2200,
			rankAchieved: 9,
		},
	},
	"anchor-framework": {
		id: "anchor-framework",
		certificateNo: "STA-AF-2024-0894",
		courseName: "ANCHOR FRAMEWORK",
		courseDescription:
			"Demonstrated proficiency in Program Development, Account Constraints, and Cross-Program Invocations.",
		recipient: "OPERATOR_0xKD...92A",
		walletAddress: "0xKD...92A",
		issueDate: "DECEMBER 03, 2024",
		validator: "SUPERTEAM PROTOCOL",
		onChain: {
			assetType: "Compressed NFT",
			mintAddress: "9zM3...r6Oo",
			owner: "0xKD...92A",
			metadataUri: "arweave.net/n4...l9",
			status: "verified",
			signature: "6b9hT...oR4o...Ns00...xZa3...94dP...yScR...9oTv...bB7r",
		},
		mastery: {
			finalScore: 92,
			maxScore: 100,
			xpEarned: 3000,
			rankAchieved: 11,
		},
	},
};

// Helper function to resolve certificate (supports mock and real on-chain IDs)
export async function getCertificateById(
	id: string,
): Promise<Certificate | null> {
	// 1. Check Mocks
	if (mockCertificates[id]) return mockCertificates[id];

	// 2. Check if ID looks like a Solana Address
	if (id.length >= 32 && id.length <= 44) {
		try {
			const { onchainQueryService } = await import(
				"@/lib/services/onchain-queries"
			);
			const asset = await onchainQueryService.getCoreAsset(id);

			if (asset) {
				// 1. Resolve Recipient Name from DB
				let recipient = `OPERATOR_${asset.owner.slice(0, 6)}...`;
				try {
					const { db } = await import("@/lib/db");
					const { user } = await import("@/lib/db/schema");
					const { eq } = await import("drizzle-orm");

					const dbUser = await db.query.user.findFirst({
						where: eq(user.walletAddress, asset.owner),
					});

					if (dbUser?.name) {
						recipient = dbUser.name.toUpperCase();
					}
				} catch (e) {
					console.warn("Failed to resolve recipient name from DB:", e);
				}

				// 2. Resolve Issue Date from On-Chain
				const issueDate = await onchainQueryService.getAssetIssueDate(id);

				// 3. Resolve XP and Description
				let xpEarned = 1000;
				let courseDescription = `Verified achievement for ${asset.name} completed by the operator on-chain.`;

				try {
					const { client } = await import("@/sanity/client");
					const sanityCourses = await client.fetch(`
						*[_type == "course"] {
							title,
							xp,
							xp_per_lesson,
							"totalLessons": count(modules[].lessons[])
						}
					`);

					const normalize = (str: string) =>
						str.toLowerCase().replace(/[^a-z0-9]/g, "");
					const assetNameNorm = normalize(asset.name);

					const match = sanityCourses.find(
						(c: {
							title: string;
							xp?: number;
							xp_per_lesson?: number;
							totalLessons?: number;
						}) => {
							const titleNorm = normalize(c.title);
							return (
								assetNameNorm.includes(titleNorm) ||
								titleNorm.includes(assetNameNorm)
							);
						},
					);

					if (match) {
						xpEarned =
							match.xp ||
							(match.xp_per_lesson || 0) * (match.totalLessons || 0) ||
							1000;
					}
				} catch (e) {
					console.warn("Failed to fetch XP from Sanity:", e);
				}

				// Professional Fallback Descriptions if Sanity match not found or for specific known courses
				if (asset.name.toLowerCase().includes("rust")) {
					courseDescription =
						"Awarded for demonstrating mastery of Rust Syntax, Memory Management, and PDAs on Solana.";
				} else if (asset.name.toLowerCase().includes("anchor")) {
					courseDescription =
						"Awarded for demonstrating mastery of the Anchor Framework and secure program development.";
				} else if (
					asset.name.toLowerCase().includes("solana") ||
					asset.name.toLowerCase().includes("basics")
				) {
					courseDescription =
						"Awarded for demonstrating proficiency in Solana Accounts, Transactions, and Architecture.";
				} else if (
					asset.name.toLowerCase().includes("token-22") ||
					asset.name.toLowerCase().includes("extension")
				) {
					courseDescription =
						"Awarded for demonstrating mastery of Token-22 Extensions and advanced mint capabilities.";
				}

				// Calculate rank/level (mimicking the mock data's level range)
				const rankAchieved = Math.floor(Math.sqrt(xpEarned / 20)) + 2;

				// Synthesize a certificate from on-chain asset
				return {
					id: asset.pubkey,
					certificateNo: `STA-ONCHAIN-${asset.pubkey.slice(0, 8).toUpperCase()}`,
					courseName: asset.name.toUpperCase(),
					courseDescription,
					recipient,
					walletAddress: asset.owner,
					issueDate,
					validator: "SUPERTEAM ACADEMY",
					onChain: {
						assetType: "Metaplex Core",
						mintAddress: asset.pubkey,
						owner: asset.owner,
						metadataUri: asset.uri,
						status: "verified",
						signature: "ON-CHAIN_VERIFIED",
					},
					mastery: {
						finalScore: 100,
						maxScore: 100,
						xpEarned,
						rankAchieved: rankAchieved,
					},
				};
			}
		} catch (e) {
			console.error("Failed to resolve on-chain certificate:", e);
		}
	}

	return null;
}
