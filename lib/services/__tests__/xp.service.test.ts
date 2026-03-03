import { describe, it, expect } from 'vitest'
import { XpService } from '../xp.service'

describe('XpService', () => {
  describe('calculateLevel', () => {
    it('returns 0 for 0 XP', () => {
      expect(XpService.calculateLevel(0)).toBe(0)
    })

    it('returns 0 for 99 XP (below level 1 threshold)', () => {
      expect(XpService.calculateLevel(99)).toBe(0)
    })

    it('returns 1 for exactly 100 XP', () => {
      expect(XpService.calculateLevel(100)).toBe(1)
    })

    it('returns 1 for 399 XP', () => {
      expect(XpService.calculateLevel(399)).toBe(1)
    })

    it('returns 2 for 400 XP', () => {
      expect(XpService.calculateLevel(400)).toBe(2)
    })

    it('returns 3 for 900 XP', () => {
      expect(XpService.calculateLevel(900)).toBe(3)
    })

    it('returns 10 for 10000 XP', () => {
      expect(XpService.calculateLevel(10000)).toBe(10)
    })

    it('handles large XP values', () => {
      expect(XpService.calculateLevel(1000000)).toBe(100)
    })

    it('handles negative XP gracefully (returns NaN)', () => {
      // sqrt of negative number → NaN → floor(NaN) = NaN
      expect(XpService.calculateLevel(-100)).toBeNaN()
    })
  })

  describe('calculateXpForNextLevel', () => {
    it('returns 100 XP needed from 0', () => {
      // At level 0, next level (1) requires (1)^2 * 100 = 100
      expect(XpService.calculateXpForNextLevel(0)).toBe(100)
    })

    it('returns 1 XP needed when at 99', () => {
      // Level 0, next level threshold = 100, so 100 - 99 = 1
      expect(XpService.calculateXpForNextLevel(99)).toBe(1)
    })

    it('returns 300 XP needed from exactly 100', () => {
      // At level 1, next level (2) requires (2)^2 * 100 = 400, so 400 - 100 = 300
      expect(XpService.calculateXpForNextLevel(100)).toBe(300)
    })

    it('returns 100 XP needed from 300', () => {
      // At level 1 (floor(sqrt(300/100)) = 1), next = 400, so 400 - 300 = 100
      expect(XpService.calculateXpForNextLevel(300)).toBe(100)
    })

    it('returns correct value for higher levels', () => {
      // At 900 XP: level 3, next = (4)^2 * 100 = 1600, so 1600 - 900 = 700
      expect(XpService.calculateXpForNextLevel(900)).toBe(700)
    })
  })

  describe('formatXp', () => {
    it('formats small XP as plain number', () => {
      expect(XpService.formatXp(0)).toBe('0')
      expect(XpService.formatXp(500)).toBe('500')
      expect(XpService.formatXp(999)).toBe('999')
    })

    it('formats thousands with K suffix', () => {
      expect(XpService.formatXp(1000)).toBe('1.0K')
      expect(XpService.formatXp(2500)).toBe('2.5K')
      expect(XpService.formatXp(10000)).toBe('10.0K')
      expect(XpService.formatXp(999999)).toBe('1000.0K')
    })

    it('formats millions with M suffix', () => {
      expect(XpService.formatXp(1000000)).toBe('1.0M')
      expect(XpService.formatXp(2500000)).toBe('2.5M')
    })
  })
})
