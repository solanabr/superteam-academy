/**
 * Arweave content fetching for Superteam Academy courses.
 *
 * Course content (title, description, lessons) is stored on Arweave
 * and referenced by the on-chain content_tx_id field.
 */

/** Content structure stored on Arweave */
export interface ArweaveCourseContent {
    title: string;
    description: string;
    thumbnail: string;
    lessons: {
        index: number;
        title: string;
        contentTxId: string;
        duration: number;
        quiz?: {
            questions: {
                id: string;
                question: string;
                options: string[];
                correctIndex: number;
            }[];
            passThreshold: number;
        };
    }[];
}

/** Convert a [u8; 32] content_tx_id to a base64url string for Arweave lookup */
export function contentTxIdToString(contentTxId: number[]): string {
    // Use standard base64 and manually convert to base64url
    // (browser Buffer polyfills don't support the 'base64url' encoding)
    return Buffer.from(contentTxId)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Fetch course content from Arweave.
 *
 * @param contentTxId - The Arweave transaction ID (base64url-encoded from on-chain bytes)
 * @returns Parsed course content or null on failure
 */
export async function fetchCourseContent(
    contentTxId: string
): Promise<ArweaveCourseContent | null> {
    try {
        const gateway = process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY || 'https://arweave.net';
        const response = await fetch(`${gateway}/${contentTxId}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(
                `Failed to fetch Arweave content: ${response.status} ${response.statusText}`
            );
            return null;
        }

        const content: ArweaveCourseContent = await response.json();
        return content;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Arweave content fetch error: ${message}`);
        return null;
    }
}
