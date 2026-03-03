import { describe, it, expect } from 'vitest'
import { calculateLevel, xpForNextLevel } from '../index'

describe('calculateLevel', () => {
  it.each([
    [0, 0],
    [50, 0],
    [99, 0],
    [100, 1],
    [200, 1],
    [399, 1],
    [400, 2],
    [900, 3],
    [1600, 4],
    [2500, 5],
    [10000, 10],
  ])('calculateLevel(%i) = %i', (xp, expectedLevel) => {
    expect(calculateLevel(xp)).toBe(expectedLevel)
  })
})

describe('xpForNextLevel', () => {
  it.each([
    [0, 100],   // level 0 → level 1 requires 1^2 * 100 = 100
    [1, 400],   // level 1 → level 2 requires 2^2 * 100 = 400
    [2, 900],   // level 2 → level 3 requires 3^2 * 100 = 900
    [3, 1600],  // level 3 → level 4 requires 4^2 * 100 = 1600
    [5, 3600],
    [10, 12100],
  ])('xpForNextLevel(%i) = %i', (level, expectedXp) => {
    expect(xpForNextLevel(level)).toBe(expectedXp)
  })
})
