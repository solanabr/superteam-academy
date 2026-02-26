import type { Course } from "@/types";

const DB_NAME = "academy-offline";
const DB_VERSION = 1;

interface OfflineCourse {
  slug: string;
  courseId: string;
  title: string;
  savedAt: number;
  course: Course;
}

interface PendingCompletion {
  id: string;
  courseId: string;
  lessonIndex: number;
  completedAt: number;
  synced: number; // 0 = false, 1 = true (IDB index-friendly)
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("courses")) {
        db.createObjectStore("courses", { keyPath: "slug" });
      }
      if (!db.objectStoreNames.contains("completions")) {
        const store = db.createObjectStore("completions", { keyPath: "id" });
        store.createIndex("synced", "synced", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ─── Courses ────────────────────────────────────────────

export async function saveCourseOffline(course: Course): Promise<void> {
  const entry: OfflineCourse = {
    slug: course.slug,
    courseId: course.courseId,
    title: course.title,
    savedAt: Date.now(),
    course,
  };
  await tx("courses", "readwrite", (s) => s.put(entry));
}

export async function removeCourseOffline(slug: string): Promise<void> {
  await tx("courses", "readwrite", (s) => s.delete(slug));
}

export async function getOfflineCourse(
  slug: string,
): Promise<OfflineCourse | undefined> {
  return tx("courses", "readonly", (s) => s.get(slug));
}

export async function getAllOfflineCourses(): Promise<OfflineCourse[]> {
  return tx("courses", "readonly", (s) => s.getAll());
}

export async function isCourseSavedOffline(slug: string): Promise<boolean> {
  const entry = await getOfflineCourse(slug);
  return !!entry;
}

// ─── Pending Completions ────────────────────────────────

export async function queueCompletion(
  courseId: string,
  lessonIndex: number,
): Promise<void> {
  const entry: PendingCompletion = {
    id: `${courseId}-${lessonIndex}-${Date.now()}`,
    courseId,
    lessonIndex,
    completedAt: Date.now(),
    synced: 0,
  };
  await tx("completions", "readwrite", (s) => s.put(entry));
}

export async function getPendingCompletions(): Promise<PendingCompletion[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("completions", "readonly");
        const store = t.objectStore("completions");
        const index = store.index("synced");
        const req = index.getAll(0);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function markCompletionSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("completions", "readwrite");
    const store = t.objectStore("completions");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const entry = getReq.result;
      if (entry) {
        entry.synced = 1;
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearSyncedCompletions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction("completions", "readwrite");
    const store = t.objectStore("completions");
    const index = store.index("synced");
    const req = index.openCursor(1);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Storage estimate ───────────────────────────────────

export async function getOfflineStorageUsage(): Promise<{
  used: number;
  quota: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const est = await navigator.storage.estimate();
    return { used: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return { used: 0, quota: 0 };
}
