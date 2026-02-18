import type { Db } from "mongodb";

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    // courses
    db.collection("courses").createIndex({ slug: 1 }, { unique: true }),
    db.collection("courses").createIndex({ difficulty: 1 }),
    db.collection("courses").createIndex({ tags: 1 }),

    // roadmaps
    db.collection("roadmaps").createIndex({ slug: 1 }, { unique: true }),

    // platform_config
    db.collection("platform_config").createIndex({ key: 1 }, { unique: true }),

    // user_settings
    db.collection("user_settings").createIndex({ wallet: 1 }, { unique: true }),

    // activity
    db.collection("activity").createIndex({ wallet: 1, ts: -1 }),
    db.collection("activity").createIndex({ wallet: 1, dateKey: 1 }),

    // activity_totals
    db
      .collection("activity_totals")
      .createIndex({ wallet: 1 }, { unique: true }),

    // linked_accounts
    db.collection("linked_accounts").createIndex({ id: 1 }, { unique: true }),
    db
      .collection("linked_accounts")
      .createIndex({ walletAddress: 1 }, { sparse: true }),
    db
      .collection("linked_accounts")
      .createIndex({ googleId: 1 }, { sparse: true }),
    db
      .collection("linked_accounts")
      .createIndex({ githubId: 1 }, { sparse: true }),
  ]);
}
