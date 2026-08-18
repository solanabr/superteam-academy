/**
 * Cold-start floor for the "N builders completed this" header chip (#942,
 * owner default). Below this the count reads as "nobody's here" — worse social
 * proof than saying nothing — so the chip only renders at or above it.
 *
 * Client-safe on purpose (no `server-only`): the chip row is a client
 * component, while the count itself is fetched server-side in
 * `lib/lessons/completion-count.ts`.
 */
export const BUILDERS_COMPLETED_FLOOR = 3;
