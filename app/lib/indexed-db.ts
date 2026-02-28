/**
 * IndexedDB Wrapper for Offline Course Storage
 *
 * Provides typed helpers for storing enrolled course content offline,
 * queuing lesson completions while offline, and auto-syncing when back online.
 */

const DB_NAME = 'superteam-academy';
const DB_VERSION = 1;

export interface OfflineCourse {
  slug: string;
  data: string; // JSON-serialized course content
  savedAt: number;
}

export interface OfflineLessonCompletion {
  id: string;
  courseId: string;
  lessonIndex: number;
  walletAddress: string;
  completedAt: number;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('courses')) {
        db.createObjectStore('courses', { keyPath: 'slug' });
      }
      if (!db.objectStoreNames.contains('completionQueue')) {
        const store = db.createObjectStore('completionQueue', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save course content for offline reading */
export async function saveCourseOffline(slug: string, courseData: object): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readwrite');
    tx.objectStore('courses').put({
      slug,
      data: JSON.stringify(courseData),
      savedAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get offline course data */
export async function getOfflineCourse(slug: string): Promise<OfflineCourse | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readonly');
    const req = tx.objectStore('courses').get(slug);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** List all offline courses */
export async function listOfflineCourses(): Promise<OfflineCourse[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readonly');
    const req = tx.objectStore('courses').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Remove offline course data */
export async function removeOfflineCourse(slug: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readwrite');
    tx.objectStore('courses').delete(slug);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Queue a lesson completion for syncing when online */
export async function queueLessonCompletion(
  courseId: string,
  lessonIndex: number,
  walletAddress: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('completionQueue', 'readwrite');
    tx.objectStore('completionQueue').put({
      id: `${courseId}-${lessonIndex}-${walletAddress}-${Date.now()}`,
      courseId,
      lessonIndex,
      walletAddress,
      completedAt: Date.now(),
      synced: false,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all unsynced completions */
export async function getUnsyncedCompletions(): Promise<OfflineLessonCompletion[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('completionQueue', 'readonly');
    const index = tx.objectStore('completionQueue').index('synced');
    const req = index.getAll(IDBKeyRange.only(0));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Mark a completion as synced */
export async function markCompletionSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('completionQueue', 'readwrite');
    const store = tx.objectStore('completionQueue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, synced: true });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Sync all pending completions with the server */
export async function syncCompletions(): Promise<{ synced: number; failed: number }> {
  const pending = await getUnsyncedCompletions();
  let synced = 0;
  let failed = 0;

  for (const completion of pending) {
    try {
      const res = await fetch('/api/complete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: completion.courseId,
          lessonIndex: completion.lessonIndex,
          learner: completion.walletAddress,
        }),
      });

      if (res.ok) {
        await markCompletionSynced(completion.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/** Check if the user is online and sync if so */
export function setupAutoSync(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    syncCompletions().catch(console.error);
  });
}

/** Check if content is available offline for a course */
export async function isAvailableOffline(slug: string): Promise<boolean> {
  const course = await getOfflineCourse(slug);
  return course !== null;
}
