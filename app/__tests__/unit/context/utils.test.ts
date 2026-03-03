import { describe, it, expect } from 'vitest';
import { cn } from '@/context/utils';

describe('cn (classname utility)', () => {
    it('is exported as a function', () => {
        expect(typeof cn).toBe('function');
    });

    it('merges class names', () => {
        const result = cn('foo', 'bar');
        expect(result).toContain('foo');
        expect(result).toContain('bar');
    });

    it('handles empty inputs', () => {
        const result = cn();
        expect(typeof result).toBe('string');
    });

    it('handles undefined / false / null', () => {
        const result = cn('foo', undefined, false, null, 'bar');
        expect(result).toContain('foo');
        expect(result).toContain('bar');
    });
});
