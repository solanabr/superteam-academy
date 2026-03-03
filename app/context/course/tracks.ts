/**
 * Track definitions for Superteam Academy.
 *
 * Tracks represent learning paths that group related courses.
 * The track_id in the on-chain Course struct maps to one of these.
 */
import type { Track } from '@/context/types/course';

/** All available learning tracks */
export const TRACKS: Track[] = [
    {
        id: 1,
        name: 'Solana Developer',
        description: 'Build Solana programs with Anchor',
        color: '#9945FF',
        icon: '◎',
    },
    {
        id: 2,
        name: 'DeFi Specialist',
        description: 'Learn DeFi protocols and token mechanics',
        color: '#14F195',
        icon: '💰',
    },
    {
        id: 3,
        name: 'Mobile Developer',
        description: 'Build mobile dApps with Solana Mobile',
        color: '#00C2FF',
        icon: '📱',
    },
    {
        id: 4,
        name: 'NFT Creator',
        description: 'Create and manage NFTs with Metaplex',
        color: '#FF6B9D',
        icon: '🎨',
    },
    {
        id: 5,
        name: 'Gaming',
        description: 'Build blockchain games on Solana',
        color: '#FF9900',
        icon: '🎮',
    },
    {
        id: 6,
        name: 'Security',
        description: 'Audit and secure Solana programs',
        color: '#FF4444',
        icon: '🔒',
    },
    {
        id: 7,
        name: 'Full Stack',
        description: 'End-to-end dApp development',
        color: '#7B61FF',
        icon: '🏗️',
    },
    {
        id: 8,
        name: 'Token Extensions',
        description: 'Master Token-2022 and SPL extensions',
        color: '#00D4AA',
        icon: '🪙',
    },
    {
        id: 9,
        name: 'Blinks & Actions',
        description: 'Build Solana Actions and Blinks',
        color: '#FF61D8',
        icon: '⚡',
    },
    {
        id: 10,
        name: 'Infrastructure',
        description: 'RPC nodes, validators, and DevOps',
        color: '#6B8AFF',
        icon: '🛠️',
    },
];

/** Look up a track by its on-chain ID */
export function getTrackById(trackId: number): Track | undefined {
    return TRACKS.find((t) => t.id === trackId);
}

/** Get track name with fallback */
export function getTrackName(trackId: number): string {
    return getTrackById(trackId)?.name ?? `Track ${trackId}`;
}

/** Get track color with fallback */
export function getTrackColor(trackId: number): string {
    return getTrackById(trackId)?.color ?? '#888888';
}
