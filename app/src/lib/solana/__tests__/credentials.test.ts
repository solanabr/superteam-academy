// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCredentialsByOwner,
  getCredentialById,
  verifyCredential,
  mapDasAssetToCredential,
} from '../credentials';

// Mock global.fetch for all DAS API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

const ownerAddress = '11111111111111111111111111111112';
const assetId = 'AssetXyz123456789abcdef123456789abcdef1234567';

/** Helper: build a realistic DAS asset response object */
function makeDasAsset(overrides: Record<string, any> = {}) {
  return {
    id: assetId,
    interface: 'MplCoreAsset',
    content: {
      metadata: {
        name: 'Solana Track - Level 1',
        attributes: [
          { trait_type: 'track_id', value: '1' },
          { trait_type: 'level', value: '1' },
          { trait_type: 'courses_completed', value: '3' },
          { trait_type: 'total_xp', value: '1500' },
        ],
      },
      json_uri: 'https://arweave.net/abc123',
      links: { image: 'https://arweave.net/img123' },
      files: [{ uri: 'https://arweave.net/file123' }],
    },
    ownership: {
      owner: ownerAddress,
      frozen: false,
    },
    grouping: [{ group_key: 'collection', group_value: 'CollectionPubkey123' }],
    created_at: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

/** Helper: wrap a result in a JSON-RPC response */
function rpcResponse(result: any) {
  return { ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: '1', result }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── getCredentialsByOwner ──────────────────────────────────────────────────

describe('getCredentialsByOwner', () => {
  it('returns empty array when no assets exist', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse({ items: [] }));
    const result = await getCredentialsByOwner(ownerAddress);
    expect(result).toEqual([]);
  });

  it('returns empty array when result is null', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse(null));
    const result = await getCredentialsByOwner(ownerAddress);
    expect(result).toEqual([]);
  });

  it('returns empty array when result.items is undefined', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse({}));
    const result = await getCredentialsByOwner(ownerAddress);
    expect(result).toEqual([]);
  });

  it('correctly maps DAS response to Credential[]', async () => {
    const asset = makeDasAsset();
    mockFetch.mockResolvedValueOnce(rpcResponse({ items: [asset] }));

    const result = await getCredentialsByOwner(ownerAddress);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      assetId,
      name: 'Solana Track - Level 1',
      uri: 'https://arweave.net/abc123',
      imageUrl: 'https://arweave.net/img123',
      owner: ownerAddress,
      collection: 'CollectionPubkey123',
      frozen: false,
      attributes: {
        trackId: 1,
        level: 1,
        coursesCompleted: 3,
        totalXp: 1500,
      },
      createdAt: '2026-01-15T00:00:00Z',
    });
  });

  it('filters out non-MplCoreAsset items', async () => {
    const coreAsset = makeDasAsset();
    const fungibleAsset = makeDasAsset({ id: 'FungibleXyz', interface: 'FungibleToken' });
    const nftAsset = makeDasAsset({ id: 'LegacyNft', interface: 'V1_NFT' });

    mockFetch.mockResolvedValueOnce(
      rpcResponse({ items: [coreAsset, fungibleAsset, nftAsset] }),
    );

    const result = await getCredentialsByOwner(ownerAddress);
    expect(result).toHaveLength(1);
    expect(result[0]!.assetId).toBe(assetId);
  });

  it('sends correct RPC payload', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse({ items: [] }));
    await getCredentialsByOwner(ownerAddress);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, opts] = mockFetch.mock.calls[0]!;
    const body = JSON.parse(opts.body);

    expect(body.method).toBe('getAssetsByOwner');
    expect(body.params.ownerAddress).toBe(ownerAddress);
    expect(body.params.page).toBe(1);
    expect(body.params.limit).toBe(100);
    expect(body.params.displayOptions).toEqual({
      showFungible: false,
      showNativeBalance: false,
    });
  });
});

// ─── getCredentialById ──────────────────────────────────────────────────────

describe('getCredentialById', () => {
  it('returns null for missing asset', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse(null));
    const result = await getCredentialById(assetId);
    expect(result).toBeNull();
  });

  it('correctly maps a single asset', async () => {
    const asset = makeDasAsset();
    mockFetch.mockResolvedValueOnce(rpcResponse(asset));

    const result = await getCredentialById(assetId);
    expect(result).not.toBeNull();
    expect(result!.assetId).toBe(assetId);
    expect(result!.name).toBe('Solana Track - Level 1');
    expect(result!.owner).toBe(ownerAddress);
    expect(result!.attributes.trackId).toBe(1);
    expect(result!.attributes.totalXp).toBe(1500);
  });

  it('sends correct RPC payload', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse(null));
    await getCredentialById(assetId);

    const [, opts] = mockFetch.mock.calls[0]!;
    const body = JSON.parse(opts.body);
    expect(body.method).toBe('getAsset');
    expect(body.params.id).toBe(assetId);
  });
});

// ─── verifyCredential ───────────────────────────────────────────────────────

describe('verifyCredential', () => {
  it('returns valid=false for missing asset', async () => {
    mockFetch.mockResolvedValueOnce(rpcResponse(null));
    const result = await verifyCredential(assetId);

    expect(result.valid).toBe(false);
    expect(result.assetId).toBe(assetId);
    expect(result.owner).toBe('');
    expect(result.isAcademyCredential).toBe(false);
    expect(result.attributes).toEqual({});
  });

  it('returns valid=true with correct attributes for existing asset', async () => {
    const asset = makeDasAsset({ ownership: { owner: ownerAddress, frozen: true } });
    mockFetch.mockResolvedValueOnce(rpcResponse(asset));

    const result = await verifyCredential(assetId);

    expect(result.valid).toBe(true);
    expect(result.assetId).toBe(assetId);
    expect(result.owner).toBe(ownerAddress);
    expect(result.frozen).toBe(true);
    expect(result.collection).toBe('CollectionPubkey123');
    expect(result.isAcademyCredential).toBe(true);
    expect(result.attributes).toEqual({
      trackId: 1,
      level: 1,
      coursesCompleted: 3,
      totalXp: 1500,
    });
  });
});

// ─── mapDasAssetToCredential ────────────────────────────────────────────────

describe('mapDasAssetToCredential', () => {
  it('handles missing attributes gracefully', async () => {
    const asset = {
      id: assetId,
      content: {
        metadata: { name: 'Basic Cert', attributes: [] },
        json_uri: 'https://arweave.net/uri',
      },
      ownership: { owner: ownerAddress, frozen: false },
      grouping: [],
    };

    const result = mapDasAssetToCredential(asset);
    expect(result.attributes).toEqual({
      trackId: undefined,
      level: undefined,
      coursesCompleted: undefined,
      totalXp: undefined,
    });
  });

  it('handles completely missing content fields', async () => {
    const asset = { id: assetId };

    const result = mapDasAssetToCredential(asset);
    expect(result.assetId).toBe(assetId);
    expect(result.name).toBe('');
    expect(result.uri).toBe('');
    expect(result.imageUrl).toBe('');
    expect(result.owner).toBe('');
    expect(result.collection).toBe('');
    expect(result.frozen).toBe(false);
    expect(result.createdAt).toBeUndefined();
  });

  it('falls back to files[0].uri when links.image is missing', async () => {
    const asset = {
      id: assetId,
      content: {
        metadata: { name: 'Test' },
        files: [{ uri: 'https://arweave.net/fallback-img' }],
      },
      ownership: { owner: ownerAddress },
      grouping: [],
    };

    const result = mapDasAssetToCredential(asset);
    expect(result.imageUrl).toBe('https://arweave.net/fallback-img');
  });

  it('handles attributes with missing trait_type or value', async () => {
    const asset = {
      id: assetId,
      content: {
        metadata: {
          name: 'Test',
          attributes: [
            { trait_type: 'track_id', value: '5' },
            { trait_type: null, value: '999' },
            { value: '123' },
            { trait_type: 'level' },
          ],
        },
      },
      ownership: { owner: ownerAddress },
      grouping: [],
    };

    const result = mapDasAssetToCredential(asset);
    expect(result.attributes.trackId).toBe(5);
    // level attr has no value so it shouldn't be mapped
    expect(result.attributes.level).toBeUndefined();
  });

  it('maps collection from grouping array', async () => {
    const asset = makeDasAsset({
      grouping: [
        { group_key: 'creator', group_value: 'SomeCreator' },
        { group_key: 'collection', group_value: 'MyCollection123' },
      ],
    });

    const result = mapDasAssetToCredential(asset);
    expect(result.collection).toBe('MyCollection123');
  });
});
