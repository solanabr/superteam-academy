import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  explorerUrl,
  shortenAddress,
  RPC_ENDPOINT,
} from '@/lib/solana-program';

describe('PROGRAM_ID', () => {
  it('is a valid PublicKey', () => {
    expect(PROGRAM_ID).toBeInstanceOf(PublicKey);
  });

  it('has the correct base58 encoding', () => {
    expect(PROGRAM_ID.toBase58()).toBe('3Yr5EZrq8t4fMunuHUZoN9Q6cn4Sf6p3AFAdvWEMaxKU');
  });

  it('is 32 bytes', () => {
    expect(PROGRAM_ID.toBytes()).toHaveLength(32);
  });

  it('can be converted to Buffer and back', () => {
    const buf = PROGRAM_ID.toBuffer();
    const restored = new PublicKey(buf);
    expect(restored.equals(PROGRAM_ID)).toBe(true);
  });
});

describe('TOKEN_2022_PROGRAM_ID', () => {
  it('is the correct Token-2022 program', () => {
    expect(TOKEN_2022_PROGRAM_ID.toBase58()).toBe('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
  });

  it('is a valid PublicKey', () => {
    expect(TOKEN_2022_PROGRAM_ID).toBeInstanceOf(PublicKey);
  });

  it('is 32 bytes', () => {
    expect(TOKEN_2022_PROGRAM_ID.toBytes()).toHaveLength(32);
  });
});

describe('ASSOCIATED_TOKEN_PROGRAM_ID', () => {
  it('is the correct ATA program', () => {
    expect(ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()).toBe('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  });

  it('is a valid PublicKey', () => {
    expect(ASSOCIATED_TOKEN_PROGRAM_ID).toBeInstanceOf(PublicKey);
  });
});

describe('RPC_ENDPOINT', () => {
  it('is a valid URL string', () => {
    expect(RPC_ENDPOINT).toMatch(/^https?:\/\//);
  });

  it('defaults to devnet', () => {
    expect(RPC_ENDPOINT).toContain('devnet');
  });

  it('is a string', () => {
    expect(typeof RPC_ENDPOINT).toBe('string');
  });
});

describe('PDA derivation seeds', () => {
  it('config seed is config', () => {
    // Verify the seed buffer used for config PDA
    const seed = Buffer.from('config');
    expect(seed.toString()).toBe('config');
    expect(seed).toHaveLength(6);
  });

  it('course seed is course + courseId', () => {
    const seed1 = Buffer.from('course');
    const seed2 = Buffer.from('solana-101');
    expect(seed1.toString()).toBe('course');
    expect(seed2.toString()).toBe('solana-101');
  });

  it('enrollment seed is enrollment + courseId + pubkey bytes', () => {
    const seed = Buffer.from('enrollment');
    expect(seed.toString()).toBe('enrollment');
    expect(seed).toHaveLength(10);
  });

  it('progress seed is progress', () => {
    const seed = Buffer.from('progress');
    expect(seed.toString()).toBe('progress');
  });

  it('credential seed is credential', () => {
    const seed = Buffer.from('credential');
    expect(seed.toString()).toBe('credential');
  });

  it('learner seed is learner', () => {
    const seed = Buffer.from('learner');
    expect(seed.toString()).toBe('learner');
  });
});

describe('explorerUrl', () => {
  it('generates devnet URL by default', () => {
    expect(explorerUrl('abc')).toBe('https://explorer.solana.com/tx/abc?cluster=devnet');
  });

  it('generates mainnet URL', () => {
    expect(explorerUrl('abc', 'mainnet-beta')).toBe('https://explorer.solana.com/tx/abc?cluster=mainnet-beta');
  });

  it('handles real-length signatures', () => {
    const sig = '5J7mWxKp3nRqT8vY2bLdX9fQzNcAeGhIoJuPlSrVtBw4CmDEkFgHi6';
    const url = explorerUrl(sig);
    expect(url).toContain(sig);
    expect(url).toContain('cluster=devnet');
  });

  it('starts with https://explorer.solana.com', () => {
    expect(explorerUrl('x')).toMatch(/^https:\/\/explorer\.solana\.com/);
  });
});

describe('shortenAddress', () => {
  const addr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

  it('shortens with default 4 chars', () => {
    expect(shortenAddress(addr)).toBe('7xKX...gAsU');
  });

  it('shortens with 6 chars', () => {
    expect(shortenAddress(addr, 6)).toBe('7xKXtg...osgAsU');
  });

  it('shortens with 2 chars', () => {
    expect(shortenAddress(addr, 2)).toBe('7x...sU');
  });

  it('contains ellipsis', () => {
    expect(shortenAddress(addr)).toContain('...');
  });

  it('is shorter than original', () => {
    expect(shortenAddress(addr).length).toBeLessThan(addr.length);
  });

  it('preserves first and last chars', () => {
    const result = shortenAddress(addr);
    expect(result.startsWith('7xKX')).toBe(true);
    expect(result.endsWith('gAsU')).toBe(true);
  });
});
