
export const LESSON_FLAGS_LEN = 32;

/** Convert Buffer/Uint8Array to Uint8Array safely */
export function toUint8Array(b: Buffer | Uint8Array): Uint8Array {
    return b instanceof Uint8Array ? b : new Uint8Array(b);
}

/** Set a bit in a bitmap */
export function setBitFlag(flags: Buffer | Uint8Array, index: number): Buffer {
    const out = Buffer.from(flags);
    const byte = Math.floor(index / 8);
    const bit = index % 8;
    if (byte < out.length) out[byte] |= 1 << bit;
    return out;
}

/** Count total set bits in a bitmap */
export function countSetBits(flags: Buffer | Uint8Array): number {
    let n = 0;
    for (let i = 0; i < flags.length; i++) {
        for (let b = 0; b < 8; b++) {
            if (flags[i]! & (1 << b)) n++;
        }
    }
    return n;
}

/** Check if a bit is set in a bitmap */
export function isBitSet(flags: Buffer | Uint8Array, index: number): boolean {
    const byte = Math.floor(index / 8);
    const bit = index % 8;
    return byte < flags.length && (flags[byte]! & (1 << bit)) !== 0;
}
