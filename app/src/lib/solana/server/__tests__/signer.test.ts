// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

// A valid ed25519 keypair generated via Keypair.generate() — safe for testing only
const VALID_SECRET_KEY = '[202,53,65,137,38,68,3,96,91,138,85,39,153,153,251,87,200,161,186,135,132,151,21,242,27,232,55,237,79,57,33,162,25,205,16,148,61,42,177,232,74,178,183,80,81,202,46,94,88,103,32,222,178,130,232,12,65,59,66,47,207,147,12,177]';

describe('getBackendSigner', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.BACKEND_SIGNER_KEYPAIR;
  });

  it('throws when BACKEND_SIGNER_KEYPAIR env var is missing', async () => {
    const { getBackendSigner } = await import('../signer');

    expect(() => getBackendSigner()).toThrow(
      'BACKEND_SIGNER_KEYPAIR environment variable is not set',
    );
  });

  it('throws on invalid JSON', async () => {
    process.env.BACKEND_SIGNER_KEYPAIR = 'not-json';
    const { getBackendSigner } = await import('../signer');

    expect(() => getBackendSigner()).toThrow(
      'BACKEND_SIGNER_KEYPAIR is not valid JSON',
    );
  });

  it('throws on wrong byte length', async () => {
    process.env.BACKEND_SIGNER_KEYPAIR = '[1,2,3]';
    const { getBackendSigner } = await import('../signer');

    expect(() => getBackendSigner()).toThrow(
      'BACKEND_SIGNER_KEYPAIR must be a JSON array of 64 bytes',
    );
  });

  it('returns a Keypair for valid 64-byte array', async () => {
    process.env.BACKEND_SIGNER_KEYPAIR = VALID_SECRET_KEY;
    const { getBackendSigner } = await import('../signer');
    const { Keypair } = await import('@solana/web3.js');

    const signer = getBackendSigner();

    expect(signer).toBeInstanceOf(Keypair);
    expect(signer.secretKey).toHaveLength(64);
  });
});
