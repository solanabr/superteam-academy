import { Hono } from "hono";
import { getTrackImageUrl } from "../lib/tracks.js";

const app = new Hono();

/**
 * GET /credential-metadata?trackId=1&trackName=Solana+Core&level=1&coursesCompleted=3&totalXp=5000
 *
 * Returns Metaplex-standard JSON metadata for a credential NFT.
 */
app.get("/", async (c) => {
  const trackId = parseInt(c.req.query("trackId") ?? "0", 10);
  const trackName = c.req.query("trackName") ?? `Track ${trackId}`;
  const level = parseInt(c.req.query("level") ?? "1", 10);
  const coursesCompleted = parseInt(c.req.query("coursesCompleted") ?? "1", 10);
  const totalXp = parseInt(c.req.query("totalXp") ?? "0", 10);
  const completedCourseIds = c.req.query("completedCourseIds") ?? "";



  let imageUrl: string;
  try {
    imageUrl = await getTrackImageUrl(trackId);
  } catch {
    imageUrl = "/images/credentials/sample.png";
  }

  // Make the image URL absolute if it's relative
  const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";
  if (imageUrl.startsWith("/")) {
    imageUrl = `${appOrigin}${imageUrl}`;
  }

  const metadata = {
    name: `${trackName} Credential`,
    symbol: "SACAD",
    description: `Superteam Academy credential for completing ${coursesCompleted} course(s) in the ${trackName} track. Total XP: ${totalXp}.`,
    image: imageUrl,
    external_url: `${appOrigin}/courses?track=${encodeURIComponent(trackName.toLowerCase().replace(/\s+/g, "-"))}`,
    attributes: [
      { trait_type: "track_id", value: String(trackId) },
      { trait_type: "track_name", value: trackName },
      { trait_type: "level", value: String(level) },
      { trait_type: "courses_completed", value: String(coursesCompleted) },
      { trait_type: "total_xp", value: String(totalXp) },
      ...(completedCourseIds
        ? [{ trait_type: "completed_course_ids", value: completedCourseIds }]
        : []),
    ],
    properties: {
      category: "image",
    },
  };

  return c.json(metadata);
});

export default app;
