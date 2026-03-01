import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should have correct NODE_ENV', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
