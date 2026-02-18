import "server-only";

import fs from "fs";
import path from "path";
import { courses as seedCourses, type Course } from "@/lib/course-catalog";
import { roadmaps as seedRoadmaps } from "@/lib/roadmaps";
import type { RoadmapDef } from "@/lib/roadmaps/types";

// ---------------------------------------------------------------------------
// Persistence helpers — JSON file backing survives HMR + server restarts
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), ".admin-data");
const COURSES_FILE = path.join(DATA_DIR, "courses.json");
const ROADMAPS_FILE = path.join(DATA_DIR, "roadmaps.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// globalThis cache — survives HMR in dev mode (standard Next.js pattern)
// ---------------------------------------------------------------------------

const globalStore = globalThis as unknown as {
  __adminCourses?: Map<string, Course>;
  __adminRoadmaps?: Map<string, RoadmapDef>;
  __adminConfig?: PlatformConfig;
};

// ---------------------------------------------------------------------------
// Courses Store
// ---------------------------------------------------------------------------

function getCoursesStore(): Map<string, Course> {
  if (globalStore.__adminCourses) return globalStore.__adminCourses;

  const store = new Map<string, Course>();

  // Try loading from disk first
  const persisted = readJson<Course[]>(COURSES_FILE);
  if (persisted && persisted.length > 0) {
    for (const c of persisted) store.set(c.slug, c);
  } else {
    // Seed from static catalog
    for (const c of seedCourses) store.set(c.slug, { ...c });
  }

  globalStore.__adminCourses = store;
  return store;
}

function persistCourses() {
  const store = getCoursesStore();
  writeJson(COURSES_FILE, Array.from(store.values()));
}

export function getAllCourses(): Course[] {
  return Array.from(getCoursesStore().values());
}

export function getCourse(slug: string): Course | null {
  return getCoursesStore().get(slug) ?? null;
}

export function upsertCourse(course: Course): void {
  getCoursesStore().set(course.slug, course);
  persistCourses();
}

export function deleteCourse(slug: string): boolean {
  const result = getCoursesStore().delete(slug);
  if (result) persistCourses();
  return result;
}

// ---------------------------------------------------------------------------
// Roadmaps Store
// ---------------------------------------------------------------------------

function getRoadmapsStore(): Map<string, RoadmapDef> {
  if (globalStore.__adminRoadmaps) return globalStore.__adminRoadmaps;

  const store = new Map<string, RoadmapDef>();

  const persisted = readJson<RoadmapDef[]>(ROADMAPS_FILE);
  if (persisted && persisted.length > 0) {
    for (const r of persisted) store.set(r.slug, r);
  } else {
    for (const r of seedRoadmaps) store.set(r.slug, { ...r });
  }

  globalStore.__adminRoadmaps = store;
  return store;
}

function persistRoadmaps() {
  const store = getRoadmapsStore();
  writeJson(ROADMAPS_FILE, Array.from(store.values()));
}

export function getAllRoadmaps(): RoadmapDef[] {
  return Array.from(getRoadmapsStore().values());
}

export function getRoadmapBySlug(slug: string): RoadmapDef | null {
  return getRoadmapsStore().get(slug) ?? null;
}

export function upsertRoadmap(roadmap: RoadmapDef): void {
  getRoadmapsStore().set(roadmap.slug, roadmap);
  persistRoadmaps();
}

export function deleteRoadmap(slug: string): boolean {
  const result = getRoadmapsStore().delete(slug);
  if (result) persistRoadmaps();
  return result;
}

// ---------------------------------------------------------------------------
// Platform Config Store
// ---------------------------------------------------------------------------

export type PlatformConfig = {
  dailyXpCap: number;
  maxStreakFreeze: number;
  maintenanceMode: boolean;
  registrationOpen: boolean;
};

const DEFAULT_CONFIG: PlatformConfig = {
  dailyXpCap: 500,
  maxStreakFreeze: 3,
  maintenanceMode: false,
  registrationOpen: true,
};

function getConfigStore(): PlatformConfig {
  if (globalStore.__adminConfig) return globalStore.__adminConfig;

  const persisted = readJson<PlatformConfig>(CONFIG_FILE);
  const config = persisted ?? { ...DEFAULT_CONFIG };
  globalStore.__adminConfig = config;
  return config;
}

export function getPlatformConfig(): PlatformConfig {
  return { ...getConfigStore() };
}

export function updatePlatformConfig(
  updates: Partial<PlatformConfig>,
): PlatformConfig {
  const config = { ...getConfigStore(), ...updates };
  globalStore.__adminConfig = config;
  writeJson(CONFIG_FILE, config);
  return { ...config };
}
