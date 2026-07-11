import type { BundleDoc } from "@/lib/content/compile/types";

export interface SanityGateway {
  readManaged(): Promise<BundleDoc[]>;
  writeDocs(docs: BundleDoc[]): Promise<void>;
  deleteDocs(ids: string[]): Promise<void>;
  assetExists(assetId: string): Promise<boolean>;
  uploadAsset(bytes: Uint8Array, filename: string): Promise<string>;
  writeSingleton(sha: string, counts: Record<string, number>): Promise<void>;
}

/** Live gateway over the shared admin write client (server-only). */
export function createLiveGateway(): SanityGateway {
  // Imported lazily so unit tests never pull `server-only`/env at module load.
  return {
    async readManaged() {
      const { readManagedDocuments } =
        await import("@/lib/sanity/admin-mutations");
      return readManagedDocuments();
    },
    async writeDocs(docs) {
      const { writeDocuments } = await import("@/lib/sanity/admin-mutations");
      return writeDocuments(docs);
    },
    async deleteDocs(ids) {
      const { deleteDocuments } = await import("@/lib/sanity/admin-mutations");
      return deleteDocuments(ids);
    },
    async assetExists(assetId) {
      const { assetExists } = await import("@/lib/sanity/admin-mutations");
      return assetExists(assetId);
    },
    async uploadAsset(bytes, filename) {
      const { uploadImageAsset } = await import("@/lib/sanity/admin-mutations");
      return uploadImageAsset(bytes, filename);
    },
    async writeSingleton(sha, counts) {
      const { writeContentSyncSingleton } =
        await import("@/lib/sanity/admin-mutations");
      return writeContentSyncSingleton(sha, counts);
    },
  };
}

/** In-memory double for the orchestrator test — records every mutation. */
export class InMemoryGateway implements SanityGateway {
  written: BundleDoc[] = [];
  deleted: string[] = [];
  assets = new Set<string>();
  singleton: { sha: string; counts: Record<string, number> } | null = null;

  constructor(private existing: BundleDoc[] = []) {}

  async readManaged(): Promise<BundleDoc[]> {
    return this.existing;
  }
  async writeDocs(docs: BundleDoc[]): Promise<void> {
    this.written.push(...docs);
    // Reflect writes so a same-sha re-run sees them as existing.
    const byId = new Map(this.existing.map((d) => [d._id, d]));
    for (const d of docs) byId.set(d._id, d);
    this.existing = [...byId.values()];
  }
  async deleteDocs(ids: string[]): Promise<void> {
    this.deleted.push(...ids);
    this.existing = this.existing.filter((d) => !ids.includes(d._id));
  }
  async assetExists(assetId: string): Promise<boolean> {
    return this.assets.has(assetId);
  }
  async uploadAsset(_bytes: Uint8Array, filename: string): Promise<string> {
    const id = `image-${filename}`;
    this.assets.add(id);
    return id;
  }
  async writeSingleton(
    sha: string,
    counts: Record<string, number>
  ): Promise<void> {
    this.singleton = { sha, counts };
  }
}
