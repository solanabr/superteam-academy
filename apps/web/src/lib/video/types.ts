/**
 * Shapes shared by the server-side embeddability probe and the client blocks
 * that consume its verdicts. They live here, not in `embeddability.ts`, so a
 * client component can name the type without importing a `server-only` module.
 */

export interface VideoEmbedInfo {
  /** False ONLY on a definitive refusal from YouTube (401/403/404 on oembed). */
  embeddable: boolean;
  /** oembed `title` when YouTube gave us one. */
  title: string | null;
}

/** Verdicts keyed by lesson video block key. */
export type VideoEmbedMap = Readonly<Record<string, VideoEmbedInfo>>;
