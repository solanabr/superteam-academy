import { PublicKey } from "@solana/web3.js";
import {
	BaseService,
	type Credential,
	type CredentialMetadata,
	type IssueResult,
	type VerifyResult,
	type TrackRequirements,
} from "./types";
import type { AcademyClient } from "@superteam-academy/anchor";
import { getAcademyClient } from "@/lib/academy";
import { getRpcCache } from "@/lib/rpc-cache";

const TRACK_REQUIREMENTS: Record<string, TrackRequirements> = {
	Beginner: { courses: 1, xp: 100 },
	Intermediate: { courses: 3, xp: 1000 },
	Advanced: { courses: 5, xp: 2500 },
	Expert: { courses: 8, xp: 5000 },
};

/** DAS API asset shape (subset of fields we use) */
interface DasAsset {
	id: string;
	interface: string;
	content: {
		json_uri: string;
		metadata: { name: string; description: string; symbol: string };
		links?: { image?: string };
	};
	authorities: Array<{ address: string; scopes: string[] }>;
	grouping: Array<{ group_key: string; group_value: string }>;
	frozen: boolean;
	ownership: { owner: string; frozen: boolean };
}

/** DAS asset with optional attributes from NFT metadata */
interface DasAssetWithAttributes extends DasAsset {
	content: DasAsset["content"] & {
		metadata: DasAsset["content"]["metadata"] & {
			attributes?: Array<{ trait_type: string; value: string }>;
		};
	};
}

export class CredentialService extends BaseService {
	private client: AcademyClient;
	private rpc = getRpcCache();

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = getAcademyClient();
	}

	async getCredentialsByOwner(owner: PublicKey): Promise<Credential[]> {
		const key = `dasAssets:${owner.toBase58()}`;
		const assets = await this.rpc.get(key, () => this.fetchDasAssets(owner), 30_000);
		return assets.map((asset) => this.dasAssetToCredential(asset));
	}

	async getEnrollmentCredential(
		courseId: string,
		learner: PublicKey
	): Promise<Credential | null> {
		const enrollment = await this.client.fetchEnrollment(courseId, learner);
		if (!enrollment?.credentialAsset) return null;

		const course = await this.client.fetchCourse(courseId);
		if (!course) return null;

		return {
			id: enrollment.credentialAsset.toBase58(),
			track: `Track ${course.trackId} - Level ${course.trackLevel}`,
			issuedAt: new Date((enrollment.completedAt ?? enrollment.enrolledAt) * 1000),
			coursesCompleted: 1,
			totalXp: course.xpPerLesson * course.lessonCount,
			metadataUri: "",
			isActive: true,
		};
	}

	async issueCredential(
		_learner: PublicKey,
		track: string,
		coursesCompleted: number,
		totalXp: number,
		options?: {
			courseId: string;
			trackCollection: string;
			credentialName: string;
			metadataUri: string;
			existingCredentialAsset?: string;
		}
	): Promise<IssueResult> {
		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			return { success: false, error: `Invalid track: ${track}` };
		}
		if (coursesCompleted < requirements.courses || totalXp < requirements.xp) {
			return { success: false, error: "Track requirements not met" };
		}
		if (!options) {
			return {
				success: false,
				error: "Missing credential options (courseId, trackCollection, etc.)",
			};
		}

		const res = await fetch("/api/credentials/issue", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				courseId: options.courseId,
				trackCollection: options.trackCollection,
				credentialName: options.credentialName,
				metadataUri: options.metadataUri,
				coursesCompleted,
				totalXp: totalXp.toString(),
				existingCredentialAsset: options.existingCredentialAsset,
			}),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({ error: "Request failed" }));
			return {
				success: false,
				error: (body as { error?: string }).error ?? "Credential issuance failed",
			};
		}

		const result = (await res.json()) as { signature: string; credentialAsset: string };
		return { success: true, credentialId: result.credentialAsset };
	}

	async verifyCredential(credentialId: string): Promise<VerifyResult> {
		const asset = await this.fetchDasAssetById(credentialId);
		if (!asset) {
			return { isValid: false, error: "Credential not found on-chain" };
		}

		// MplCoreAsset enforces soulbound via PermanentFreezeDelegate plugin;
		// the top-level frozen flag may not be set in the DAS response.
		const isMplCore = asset.interface === "MplCoreAsset";
		if (!isMplCore && !asset.frozen && !asset.ownership.frozen) {
			return { isValid: false, error: "Credential is not frozen (invalid soulbound state)" };
		}

		return {
			isValid: true,
			credential: this.dasAssetToCredential(asset),
		};
	}

	async getCredentialMetadata(credentialId: string): Promise<CredentialMetadata> {
		return this.rpc.get(
			`credMeta:${credentialId}`,
			async () => {
				const asset = await this.fetchDasAssetById(credentialId);
				if (!asset) {
					return { name: "Unknown", description: "", image: "", attributes: [] };
				}

				if (asset.content.json_uri) {
					const offChain = await this.fetchJsonUri(asset.content.json_uri);
					if (offChain) return offChain;
				}

				return {
					name: asset.content.metadata.name,
					description: asset.content.metadata.description,
					image: asset.content.links?.image ?? "",
					attributes: [],
				};
			},
			60_000
		);
	}

	getTrackRequirements(track: string): TrackRequirements {
		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			throw new Error(`Invalid track: ${track}`);
		}
		return requirements;
	}

	private getRpcEndpoint(): string {
		return this.connection.rpcEndpoint;
	}

	private async fetchDasAssets(owner: PublicKey): Promise<DasAsset[]> {
		const body = {
			jsonrpc: "2.0",
			id: "getAssetsByOwner",
			method: "getAssetsByOwner",
			params: {
				ownerAddress: owner.toBase58(),
				page: 1,
				limit: 100,
				displayOptions: { showFungible: false, showCollectionMetadata: true },
			},
		};

		const response = await fetch(this.getRpcEndpoint(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) return [];
		const json = (await response.json()) as {
			result?: { items?: DasAsset[] };
		};
		const items = json.result?.items ?? [];

		return items.filter(
			(a) => a.interface === "MplCoreAsset" || (a.interface === "V1_NFT" && a.frozen)
		);
	}

	private async fetchDasAssetById(assetId: string): Promise<DasAsset | null> {
		let pubkey: PublicKey;
		try {
			pubkey = new PublicKey(assetId);
		} catch {
			return null;
		}

		const body = {
			jsonrpc: "2.0",
			id: "getAsset",
			method: "getAsset",
			params: { id: pubkey.toBase58() },
		};

		const response = await fetch(this.getRpcEndpoint(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) return null;
		const json = (await response.json()) as { result?: DasAsset };
		return json.result ?? null;
	}

	private async fetchJsonUri(uri: string): Promise<CredentialMetadata | null> {
		if (!uri.startsWith("https://")) return null;

		const response = await fetch(uri, {
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok) return null;

		const data = (await response.json()) as {
			name?: string;
			description?: string;
			image?: string;
			attributes?: Array<{ trait_type: string; value: string }>;
		};
		return {
			name: data.name ?? "Credential",
			description: data.description ?? "",
			image: data.image ?? "",
			attributes: data.attributes ?? [],
		};
	}

	private dasAssetToCredential(asset: DasAsset): Credential {
		const collection = asset.grouping.find((g) => g.group_key === "collection");

		const attributes = (asset as DasAssetWithAttributes).content?.metadata?.attributes;
		let coursesCompleted = 1;
		let totalXp = 0;
		let issuedAt = new Date();

		if (Array.isArray(attributes)) {
			for (const attr of attributes) {
				if (attr.trait_type === "courses_completed" && attr.value) {
					coursesCompleted = parseInt(attr.value, 10) || 1;
				} else if (attr.trait_type === "total_xp" && attr.value) {
					totalXp = parseInt(attr.value, 10) || 0;
				} else if (attr.trait_type === "issued_at" && attr.value) {
					const ts = parseInt(attr.value, 10);
					if (!Number.isNaN(ts)) issuedAt = new Date(ts * 1000);
				}
			}
		}

		return {
			id: asset.id,
			track: collection?.group_value ?? "Unknown",
			issuedAt,
			coursesCompleted,
			totalXp,
			metadataUri: asset.content.json_uri,
			isActive: asset.frozen || asset.ownership.frozen,
		};
	}

	async getCredentialOwner(credentialId: string): Promise<string | null> {
		const asset = await this.fetchDasAssetById(credentialId);
		return asset?.ownership.owner ?? null;
	}
}
