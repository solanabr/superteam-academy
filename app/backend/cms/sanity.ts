/**
 * Sanity CMS client and GROQ queries.
 *
 * Provides two clients:
 *   - Production (CDN-cached, published content only)
 *   - Preview (no cache, includes drafts — for Next.js draftMode)
 *
 * All queries are gated on env vars. If NEXT_PUBLIC_SANITY_PROJECT_ID
 * is not set, functions return empty/null gracefully.
 */

import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type {
    SanityCourse,
    SanityLesson,
    SanityTrack,
    SanityImage,
} from '@/context/types/course';

// ─── Configuration ──────────────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const API_VERSION = '2025-01-01';

/** Production client — CDN-cached, published content only */
export const sanityClient: SanityClient | null = PROJECT_ID
    ? createClient({
        projectId: PROJECT_ID,
        dataset: DATASET,
        apiVersion: API_VERSION,
        useCdn: true,
        perspective: 'published',
    })
    : null;

/** Preview client — no cache, includes draft documents */
export const previewClient: SanityClient | null =
    PROJECT_ID && process.env.SANITY_API_TOKEN
        ? createClient({
            projectId: PROJECT_ID,
            dataset: DATASET,
            apiVersion: API_VERSION,
            useCdn: false,
            token: process.env.SANITY_API_TOKEN,
            perspective: 'previewDrafts',
        })
        : null;

// Preview client is optional — no warning needed in dev

/** Select client based on preview mode */
function getClient(preview = false): SanityClient | null {
    return preview ? previewClient ?? sanityClient : sanityClient;
}

// ─── Image URL Builder ──────────────────────────────────────────────────────

/** Generate optimized image URL from Sanity image reference */
export function urlFor(source: SanityImage | null): string | null {
    if (!sanityClient || !source) return null;
    return imageUrlBuilder(sanityClient).image(source).auto('format').url();
}

// ─── GROQ Queries ───────────────────────────────────────────────────────────

const COURSE_FIELDS = `
    _id,
    _type,
    title,
    slug,
    onChainCourseId,
    description,
    thumbnail,
    difficulty,
    xpPerLesson,
    estimatedDuration,
    isPublished,
    publishedAt,
    tags,
    instructor->{
        _id, _type, name, bio, avatar, walletAddress, socialLinks
    },
    track->{
        _id, _type, name, slug, onChainTrackId, description, icon, color
    },
    "modules": modules[]->{
        _id, _type, title, description, order,
        "lessons": lessons[]->{
            _id, _type, title, slug, type, order, duration, xpReward,
            content, videoUrl, hints,
            challenge {
                language, instructions,
                starterCode { _type, language, code },
                solutionCode { _type, language, code },
                testCases[] { name, input, expectedOutput, isHidden }
            },
            quiz {
                passThreshold,
                questions[] { question, options, correctIndex }
            }
        } | order(order asc)
    } | order(order asc)
`;

// ─── CMS Service ────────────────────────────────────────────────────────────

export const cms = {
    /**
     * Fetch all published courses.
     */
    async getCourses(preview = false): Promise<SanityCourse[]> {
        const client = getClient(preview);
        if (!client) return [];
        const query = `*[_type == "course" && isPublished == true] | order(publishedAt desc) {
            ${COURSE_FIELDS}
        }`;
        return client.fetch<SanityCourse[]>(query);
    },

    /**
     * Fetch a single course by slug.
     */
    async getCourse(slug: string, preview = false): Promise<SanityCourse | null> {
        const client = getClient(preview);
        if (!client) return null;
        const query = `*[_type == "course" && slug.current == $slug][0] {
            ${COURSE_FIELDS}
        }`;
        return client.fetch<SanityCourse | null>(query, { slug });
    },

    /**
     * Fetch a single course by on-chain course ID.
     */
    async getCourseByOnChainId(onChainCourseId: string, preview = false): Promise<SanityCourse | null> {
        const client = getClient(preview);
        if (!client) return null;
        const query = `*[_type == "course" && onChainCourseId == $onChainCourseId][0] {
            ${COURSE_FIELDS}
        }`;
        return client.fetch<SanityCourse | null>(query, { onChainCourseId });
    },

    /**
     * Fetch a lesson by slug.
     */
    async getLesson(slug: string, preview = false): Promise<SanityLesson | null> {
        const client = getClient(preview);
        if (!client) return null;
        const query = `*[_type == "lesson" && slug.current == $slug][0] {
            _id, _type, title, slug, type, order, duration, xpReward,
            content, videoUrl, hints,
            challenge {
                language, instructions,
                starterCode { _type, language, code },
                solutionCode { _type, language, code },
                testCases[] { name, input, expectedOutput, isHidden }
            },
            quiz {
                passThreshold,
                questions[] { question, options, correctIndex }
            }
        }`;
        return client.fetch<SanityLesson | null>(query, { slug });
    },

    /**
     * Fetch all tracks.
     */
    async getTracks(preview = false): Promise<SanityTrack[]> {
        const client = getClient(preview);
        if (!client) return [];
        const query = `*[_type == "track"] | order(onChainTrackId asc) {
            _id, _type, name, slug, onChainTrackId, description, icon, color
        }`;
        return client.fetch<SanityTrack[]>(query);
    },

    /**
     * Fetch ALL courses (published + unpublished) for admin management.
     */
    async getAllCourses(preview = false): Promise<SanityCourse[]> {
        const client = getClient(preview);
        if (!client) return [];
        const query = `*[_type == "course"] | order(publishedAt desc) {
            ${COURSE_FIELDS}
        }`;
        return client.fetch<SanityCourse[]>(query);
    },
};

