/**
 * XP and Level Calculation Utilities
 *
 * This module provides utility functions for calculating user levels
 * from experience points (XP) in the Onchain Academy system.
 */

/**
 * Calculates user level from total XP
 * Formula: Level = floor(sqrt(totalXP / 100))
 *
 * @param totalXP - Total experience points (non-negative number)
 * @returns User level (non-negative integer)
 *
 * @example
 * calculateLevel(0)     // returns 0
 * calculateLevel(100)   // returns 1
 * calculateLevel(400)   // returns 2
 * calculateLevel(10000) // returns 10
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 0
  return Math.floor(Math.sqrt(totalXP / 100))
}
