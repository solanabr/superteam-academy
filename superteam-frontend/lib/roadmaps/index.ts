import type { RoadmapDef } from "./types";
import { solanaDeveloper } from "./solana-developer";
import { solanaDapp } from "./solana-dapp";
import { solanaDefi } from "./solana-defi";

export const roadmaps: RoadmapDef[] = [solanaDeveloper, solanaDapp, solanaDefi];

export function getRoadmap(slug: string): RoadmapDef | undefined {
  return roadmaps.find((r) => r.slug === slug);
}
