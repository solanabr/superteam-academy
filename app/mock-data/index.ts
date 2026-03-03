/**
 * Mock data barrel export.
 *
 * Re-exports all mock data and provides the MOCK_ENABLED flag.
 * Only loaded dynamically via `await import('@/mock-data')` in API routes.
 */

export { MOCK_SANITY_COURSES } from './courses';
export { MOCK_ON_CHAIN_COURSES } from './on-chain-courses';

/** Whether mock data mode is active */
export const MOCK_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
