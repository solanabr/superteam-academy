/**
 * Certificate metadata builder for credential NFTs.
 *
 * Generates Metaplex-standard JSON metadata for credential NFTs.
 * Uses a single template image for all certificates, with unique
 * attributes (track, level, XP, courses) stored as on-chain metadata.
 */

import { TRACK_NAMES } from '@/context/solana/credential-service';

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * Certificate template image URL.
 *
 * Uses a self-hosted SVG certificate template from the public/ directory.
 * Can be overridden to an Arweave URL via CERTIFICATE_TEMPLATE_IMAGE_URL env var.
 */
const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const CERTIFICATE_TEMPLATE_IMAGE =
    process.env.CERTIFICATE_TEMPLATE_IMAGE_URL ||
    `${APP_URL}/certificate-template.svg`;

/**
 * Base URL for self-hosted metadata endpoint.
 * Falls back to NEXTAUTH_URL for local development.
 */
const METADATA_BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CredentialMetadataParams {
    /** Human-readable credential name, e.g. "Anchor Developer — Level 3" */
    credentialName: string;
    /** Course ID the credential is for */
    courseId: string;
    /** Course title for display */
    courseTitle?: string;
    /** Track ID (1-5) */
    trackId?: number;
    /** Learner's level at time of issuance */
    level?: number;
    /** Number of courses completed in this track */
    coursesCompleted: number;
    /** Total XP earned */
    totalXp: number;
    /** ISO date string of issuance */
    issuedAt?: string;
}

export interface MetaplexMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    external_url: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
    properties: {
        files: Array<{ uri: string; type: string }>;
        category: string;
    };
}

// ─── Metadata Builder ───────────────────────────────────────────────────────

/**
 * Build Metaplex-standard JSON metadata for a credential NFT.
 *
 * This JSON is either:
 * - Uploaded to Arweave (production) and set as the NFT's metadataUri
 * - Served from /api/credentials/metadata/[id] (development)
 */
export function buildCredentialMetadata(
    params: CredentialMetadataParams
): MetaplexMetadata {
    const trackName = params.trackId ? TRACK_NAMES[params.trackId] : 'Solana Developer';
    const issuedDate = params.issuedAt || new Date().toISOString().split('T')[0];

    const description =
        params.courseTitle
            ? `Awarded for completing "${params.courseTitle}" on Superteam Academy. ` +
            `Track: ${trackName}. ${params.coursesCompleted} course(s) completed with ${params.totalXp} XP earned.`
            : `On-chain credential from Superteam Academy. ` +
            `Track: ${trackName}. ${params.coursesCompleted} course(s) completed with ${params.totalXp} XP earned.`;

    return {
        name: params.credentialName,
        symbol: 'SACRED',
        description,
        image: CERTIFICATE_TEMPLATE_IMAGE,
        external_url: `${METADATA_BASE_URL}/certificates`,
        attributes: [
            { trait_type: 'track', value: trackName },
            { trait_type: 'track_id', value: params.trackId ?? 0 },
            { trait_type: 'level', value: params.level ?? 1 },
            { trait_type: 'courses_completed', value: params.coursesCompleted },
            { trait_type: 'total_xp', value: params.totalXp },
            { trait_type: 'course_id', value: params.courseId },
            { trait_type: 'issued_at', value: issuedDate },
        ],
        properties: {
            files: [
                { uri: CERTIFICATE_TEMPLATE_IMAGE, type: 'image/png' },
            ],
            category: 'image',
        },
    };
}

/**
 * Generate a self-hosted metadata URI for a credential.
 * Points to /api/credentials/metadata/[courseId]?wallet=[wallet]
 */
export function getMetadataUri(courseId: string, walletAddress: string): string {
    return `${METADATA_BASE_URL}/api/credentials/metadata/${encodeURIComponent(courseId)}?wallet=${encodeURIComponent(walletAddress)}`;
}
