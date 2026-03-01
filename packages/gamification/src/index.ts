import { levelFromXP as _levelFromXP } from "./xp-calculation";

/** @deprecated Use `levelFromXP` instead */
export function calculateLevelFromXP(totalXP: number): number {
	return _levelFromXP(totalXP);
}
