import { createRequire } from 'node:module';
import { join } from 'node:path';

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface FirebaseAppLike {
  name?: string;
}

interface FirebaseCredentialLike {
  projectId?: string;
}

interface FirebaseAdminAppModule {
  cert(input: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }): FirebaseCredentialLike;
  getApp(): FirebaseAppLike;
  getApps(): FirebaseAppLike[];
  initializeApp(input: {
    credential: FirebaseCredentialLike;
    projectId: string;
  }): FirebaseAppLike;
}

export interface FirebaseFirestoreDocSnapshotLike {
  exists: boolean;
  data(): unknown;
}

export interface FirebaseFirestoreQuerySnapshotLike {
  empty: boolean;
  docs: FirebaseFirestoreDocSnapshotLike[];
}

export interface FirebaseFirestoreDocRefLike {
  get(): Promise<FirebaseFirestoreDocSnapshotLike>;
  set(data: unknown, options?: { merge?: boolean }): Promise<void>;
}

export interface FirebaseFirestoreQueryLike {
  where(field: string, operator: '==', value: unknown): FirebaseFirestoreQueryLike;
  limit(amount: number): FirebaseFirestoreQueryLike;
  get(): Promise<FirebaseFirestoreQuerySnapshotLike>;
}

export interface FirebaseFirestoreCollectionLike extends FirebaseFirestoreQueryLike {
  doc(id: string): FirebaseFirestoreDocRefLike;
}

export interface FirebaseFirestoreTransactionLike {
  get(ref: FirebaseFirestoreDocRefLike): Promise<FirebaseFirestoreDocSnapshotLike>;
  set(ref: FirebaseFirestoreDocRefLike, data: unknown, options?: { merge?: boolean }): void;
}

export interface FirebaseFirestoreLike {
  collection(name: string): FirebaseFirestoreCollectionLike;
  runTransaction<T>(
    updateFn: (transaction: FirebaseFirestoreTransactionLike) => Promise<T>
  ): Promise<T>;
}

interface FirebaseAdminFirestoreModule {
  getFirestore(app: FirebaseAppLike): FirebaseFirestoreLike;
}

const requireFromProjectRoot = createRequire(join(process.cwd(), 'package.json'));

let cachedDb: FirebaseFirestoreLike | null | undefined;

function readConfig(): FirebaseAdminConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n')
  };
}

export function isFirebaseAdminConfigured(): boolean {
  return readConfig() !== null;
}

export function getFirebaseAdminDb(): FirebaseFirestoreLike | null {
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  const config = readConfig();
  if (!config) {
    cachedDb = null;
    return cachedDb;
  }

  let appModule: FirebaseAdminAppModule;
  let firestoreModule: FirebaseAdminFirestoreModule;
  try {
    appModule = requireFromProjectRoot('firebase-admin/app') as FirebaseAdminAppModule;
    firestoreModule = requireFromProjectRoot(
      'firebase-admin/firestore'
    ) as FirebaseAdminFirestoreModule;
  } catch {
    cachedDb = null;
    return cachedDb;
  }

  const app =
    appModule.getApps().length > 0
      ? appModule.getApp()
      : appModule.initializeApp({
          credential: appModule.cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey
          }),
          projectId: config.projectId
        });

  cachedDb = firestoreModule.getFirestore(app);
  return cachedDb;
}
