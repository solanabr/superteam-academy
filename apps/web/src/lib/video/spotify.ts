/**
 * The Spotify audio alternative a lesson may carry.
 *
 * Courses author it as a markdown link inside a prose block ("Ouça também em
 * áudio" / "Listen to the audio version"), not as a structured field, so the
 * only way to offer it alongside the video is to read it back out of the
 * lesson's prose. When the video cannot be embedded, the fallback card shows
 * it as the secondary action so the learner sees both ways in one place.
 */
const SPOTIFY_LINK =
  /https:\/\/open\.spotify\.com\/(?:episode|track|show)\/[A-Za-z0-9]+/;

export function findSpotifyUrl(
  blocks: readonly { _type: string; src?: string }[]
): string | null {
  for (const block of blocks) {
    if (block._type !== "prose" || typeof block.src !== "string") continue;
    const m = SPOTIFY_LINK.exec(block.src);
    if (m) return m[0];
  }
  return null;
}
