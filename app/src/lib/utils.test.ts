import { describe, it, expect } from '@jest/globals';
import { formatDuration, truncateAddress, calculateCourseProgress } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    it('should format minutes less than 60', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('should format hours', () => {
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(150)).toBe('2h 30m');
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'CertMintProgram111111111111111111111111111';
      expect(truncateAddress(address)).toBe('Cert...111');
    });

    it('should return short addresses unchanged', () => {
      expect(truncateAddress('short')).toBe('short');
    });
  });

  describe('calculateCourseProgress', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateCourseProgress(5, 10)).toBe(50);
    });

    it('should handle 0 total lessons', () => {
      expect(calculateCourseProgress(5, 0)).toBe(0);
    });

    it('should handle 100% completion', () => {
      expect(calculateCourseProgress(10, 10)).toBe(100);
    });
  });
});