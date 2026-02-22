import { getCourseCards, getTracks } from "@/lib/courses";
import LandingView from "./landing-view";

export const revalidate = 3600;

export default async function LandingPage() {
  const [courseCards, allTracks] = await Promise.all([getCourseCards(), getTracks()]);

  const activeTrackNames = new Set(courseCards.map((c) => c.trackName).filter(Boolean));
  const activeTracks = allTracks.filter((t) => activeTrackNames.has(t.name));

  return <LandingView courseCards={courseCards} activeTracks={activeTracks} />;
}
