import "server-only";

import { MongoClient, type Db } from "mongodb";
import { seedIfEmpty, seedNewCourses } from "./mongodb-seed";
import { ensureIndexes } from "./mongodb-indexes";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "superteam_academy";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const g = globalThis as unknown as {
  __mongoClientPromise?: Promise<MongoClient>;
  __mongoInitDone?: boolean;
};

if (!g.__mongoClientPromise) {
  const client = new MongoClient(MONGODB_URI);
  g.__mongoClientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await g.__mongoClientPromise!;
  const db = client.db(DB_NAME);

  if (!g.__mongoInitDone) {
    g.__mongoInitDone = true;
    await seedIfEmpty(db);
    await seedNewCourses(db);
    await ensureIndexes(db);
  }

  return db;
}
