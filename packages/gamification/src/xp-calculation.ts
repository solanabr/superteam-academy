/** Spec formula: Level = floor(sqrt(totalXP / 100)) */
export function levelFromXP(totalXP: number): number {
	return Math.max(0, Math.floor(Math.sqrt(totalXP / 100)));
}
