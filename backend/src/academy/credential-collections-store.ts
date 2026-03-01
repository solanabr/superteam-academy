import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { getPrisma } from "@/lib/prisma.js";

const FILENAME = "credential-collections.json";

function dataPath(): string {
  const dir = process.env.BACKEND_DATA_DIR || join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, FILENAME);
}

export type CredentialCollectionItem = {
  trackId: number;
  collectionAddress: string;
  name: string | null;
  imageUrl: string | null;
  metadataUri: string | null;
};

export type CredentialCollectionsStore = Record<string, string>;

export async function getNextTrackIdAsync(): Promise<number> {
  if (useDb()) {
    const prisma = getPrisma();
    const row = await prisma.credentialCollection.findFirst({
      orderBy: { trackId: "desc" },
      select: { trackId: true },
    });
    return row ? row.trackId + 1 : 1;
  }
  const current = readFromFile();
  const ids = Object.keys(current).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n));
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

export async function getCredentialCollectionsListAsync(): Promise<CredentialCollectionItem[]> {
  if (useDb()) {
    await ensureCredentialCollectionsLoaded();
    const prisma = getPrisma();
    const rows = await prisma.credentialCollection.findMany({
      orderBy: { trackId: "asc" },
      select: { trackId: true, collectionAddress: true, name: true, imageUrl: true, metadataUri: true },
    });
    return rows.map((r) => ({
      trackId: r.trackId,
      collectionAddress: r.collectionAddress,
      name: r.name,
      imageUrl: r.imageUrl,
      metadataUri: r.metadataUri,
    }));
  }
  const map = await getCredentialCollectionsAsync();
  return Object.entries(map).map(([trackId, collectionAddress]) => ({
    trackId: parseInt(trackId, 10) || 0,
    collectionAddress,
    name: null,
    imageUrl: null,
    metadataUri: null,
  }));
}

function useDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function readFromFile(): CredentialCollectionsStore {
  const path = dataPath();
  if (!existsSync(path)) return {};
  try {
    const data = readFileSync(path, "utf-8");
    const parsed = JSON.parse(data) as Record<string, unknown>;
    const out: CredentialCollectionsStore = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.length > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

let fileCache: CredentialCollectionsStore | null = null;
let dbCache: CredentialCollectionsStore = {};
let dbCacheLoaded = false;

/**
 * When using DB, call this to load collections into memory (e.g. at startup or before read).
 * Sync getCredentialCollections() then returns the cached map.
 */
export async function ensureCredentialCollectionsLoaded(): Promise<void> {
  if (!useDb()) return;
  const prisma = getPrisma();
  const rows = await prisma.credentialCollection.findMany({
    select: { trackId: true, collectionAddress: true },
  });
  dbCache = {};
  for (const row of rows) {
    dbCache[String(row.trackId)] = row.collectionAddress;
  }
  dbCacheLoaded = true;
}

/**
 * Returns track ID → collection address. Uses DB when DATABASE_URL is set (returns in-memory cache; call ensureCredentialCollectionsLoaded first), else file store.
 */
export async function getCredentialCollectionsAsync(): Promise<CredentialCollectionsStore> {
  if (useDb()) {
    await ensureCredentialCollectionsLoaded();
    return { ...dbCache };
  }
  if (fileCache !== null) return { ...fileCache };
  fileCache = readFromFile();
  return { ...fileCache };
}

/**
 * Sync version for track-config. When using DB, returns the in-memory cache (ensure ensureCredentialCollectionsLoaded was called at startup or via GET).
 */
export function getCredentialCollections(): CredentialCollectionsStore {
  if (useDb()) return dbCacheLoaded ? { ...dbCache } : {};
  if (fileCache !== null) return fileCache;
  fileCache = readFromFile();
  return fileCache;
}

export async function setCredentialCollectionAsync(
  trackId: number,
  collection: string,
  name?: string,
  imageUrl?: string | null,
  metadataUri?: string | null
): Promise<void> {
  if (useDb()) {
    const prisma = getPrisma();
    await prisma.credentialCollection.upsert({
      where: { trackId },
      create: {
        trackId,
        collectionAddress: collection,
        name: name ?? null,
        imageUrl: imageUrl ?? null,
        metadataUri: metadataUri ?? null,
      },
      update: {
        collectionAddress: collection,
        name: name ?? null,
        imageUrl: imageUrl ?? null,
        metadataUri: metadataUri ?? null,
      },
    });
    dbCache[String(trackId)] = collection;
    dbCacheLoaded = true;
    return;
  }
  const current = readFromFile();
  current[String(trackId)] = collection;
  fileCache = current;
  writeFileSync(dataPath(), JSON.stringify(current, null, 2), "utf-8");
}

export function setCredentialCollection(trackId: number, collection: string, name?: string): void {
  if (useDb()) {
    setCredentialCollectionAsync(trackId, collection, name).catch((err) =>
      console.error("setCredentialCollection (db):", err)
    );
    return;
  }
  const current = readFromFile();
  current[String(trackId)] = collection;
  fileCache = current;
  writeFileSync(dataPath(), JSON.stringify(current, null, 2), "utf-8");
}

export function invalidateCredentialCollectionsCache(): void {
  fileCache = null;
  dbCacheLoaded = false;
  dbCache = {};
}
