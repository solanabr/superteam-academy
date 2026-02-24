import { getSupabaseAdmin } from "./server";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  track: string;
  difficulty: string;
  lessonCount: number;
  duration: string;
  xpReward: number;
  estimatedHours: number;
  creator: string;
  prerequisiteId: string | null;
  isActive: boolean;
  published: boolean;
  learningOutcomes: string[];
  totalCompletions: number;
  enrolledCount: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: string;
  duration: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  content: string;
  challengeInstructions: string | null;
  challengeStarterCode: string | null;
  challengeSolution: string | null;
  challengeLanguage: string | null;
  challengeTestCases: unknown | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface CourseWithModules extends Course {
  modules: ModuleWithLessons[];
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface CreateCourseInput {
  title: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  track: string;
  difficulty: string;
  lessonCount?: number;
  duration?: string;
  xpReward?: number;
  estimatedHours?: number;
  creator?: string;
  prerequisiteId?: string | null;
  isActive?: boolean;
  published?: boolean;
  learningOutcomes?: string[];
  imageUrl?: string | null;
}

export interface UpdateCourseInput {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  track: string;
  difficulty: string;
  lessonCount: number;
  duration: string;
  xpReward: number;
  estimatedHours: number;
  creator: string;
  prerequisiteId: string | null;
  isActive: boolean;
  published: boolean;
  learningOutcomes: string[];
  imageUrl: string | null;
}

export interface CreateModuleInput {
  courseId: string;
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateModuleInput {
  title: string;
  description: string;
  order: number;
}

export interface CreateLessonInput {
  moduleId: string;
  title: string;
  slug?: string;
  type: string;
  duration?: string;
  xpReward?: number;
  estimatedMinutes?: number;
  order?: number;
  content?: string;
  challengeInstructions?: string | null;
  challengeStarterCode?: string | null;
  challengeSolution?: string | null;
  challengeLanguage?: string | null;
  challengeTestCases?: unknown | null;
}

export interface UpdateLessonInput {
  title: string;
  slug: string;
  type: string;
  duration: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  content: string;
  challengeInstructions: string | null;
  challengeStarterCode: string | null;
  challengeSolution: string | null;
  challengeLanguage: string | null;
  challengeTestCases: unknown | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rowToCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    longDescription: row.long_description as string,
    track: row.track as string,
    difficulty: row.difficulty as string,
    lessonCount: row.lesson_count as number,
    duration: row.duration as string,
    xpReward: row.xp_reward as number,
    estimatedHours: Number(row.estimated_hours ?? 0),
    creator: row.creator as string,
    prerequisiteId: (row.prerequisite_id as string) ?? null,
    isActive: row.is_active as boolean,
    published: row.published as boolean,
    learningOutcomes: (row.learning_outcomes as string[]) ?? [],
    totalCompletions: row.total_completions as number,
    enrolledCount: row.enrolled_count as number,
    imageUrl: (row.image_url as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToModule(row: Record<string, unknown>): Module {
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    description: row.description as string,
    order: row.order as number,
    createdAt: row.created_at as string,
  };
}

function rowToLesson(row: Record<string, unknown>): Lesson {
  return {
    id: row.id as string,
    moduleId: row.module_id as string,
    title: row.title as string,
    slug: row.slug as string,
    type: row.type as string,
    duration: row.duration as string,
    xpReward: row.xp_reward as number,
    estimatedMinutes: row.estimated_minutes as number,
    order: row.order as number,
    content: (row.content as string) ?? "",
    challengeInstructions: (row.challenge_instructions as string) ?? null,
    challengeStarterCode: (row.challenge_starter_code as string) ?? null,
    challengeSolution: (row.challenge_solution as string) ?? null,
    challengeLanguage: (row.challenge_language as string) ?? null,
    challengeTestCases: row.challenge_test_cases ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Course CRUD ──────────────────────────────────────────────────────────────

export async function getAllCourses(): Promise<Course[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return (data ?? []).map(rowToCourse);
}

export async function getCourseById(
  id: string,
): Promise<CourseWithModules | null> {
  const db = getSupabaseAdmin();

  const { data: courseRow, error: courseErr } = await db
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (courseErr) throw new Error(`Failed to fetch course: ${courseErr.message}`);
  if (!courseRow) return null;

  const { data: moduleRows, error: modErr } = await db
    .from("modules")
    .select("*")
    .eq("course_id", id)
    .order("order", { ascending: true });

  if (modErr) throw new Error(`Failed to fetch modules: ${modErr.message}`);

  const moduleIds = (moduleRows ?? []).map((m) => m.id as string);

  let lessonRows: Record<string, unknown>[] = [];
  if (moduleIds.length > 0) {
    const { data, error: lessonErr } = await db
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("order", { ascending: true });

    if (lessonErr)
      throw new Error(`Failed to fetch lessons: ${lessonErr.message}`);
    lessonRows = data ?? [];
  }

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const row of lessonRows) {
    const modId = row.module_id as string;
    const arr = lessonsByModule.get(modId) ?? [];
    arr.push(rowToLesson(row));
    lessonsByModule.set(modId, arr);
  }

  const modules: ModuleWithLessons[] = (moduleRows ?? []).map((row) => ({
    ...rowToModule(row),
    lessons: lessonsByModule.get(row.id as string) ?? [],
  }));

  return { ...rowToCourse(courseRow), modules };
}

export async function createCourse(data: CreateCourseInput): Promise<Course> {
  const db = getSupabaseAdmin();
  const slug = data.slug || slugify(data.title);
  const id = slug;

  const { data: row, error } = await db
    .from("courses")
    .insert({
      id,
      slug,
      title: data.title,
      description: data.description ?? "",
      long_description: data.longDescription ?? "",
      track: data.track,
      difficulty: data.difficulty,
      lesson_count: data.lessonCount ?? 0,
      duration: data.duration ?? "",
      xp_reward: data.xpReward ?? 0,
      estimated_hours: data.estimatedHours ?? 0,
      creator: data.creator ?? "",
      prerequisite_id: data.prerequisiteId ?? null,
      is_active: data.isActive ?? true,
      published: data.published ?? false,
      learning_outcomes: data.learningOutcomes ?? [],
      image_url: data.imageUrl ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create course: ${error.message}`);
  return rowToCourse(row);
}

export async function updateCourse(
  id: string,
  data: Partial<UpdateCourseInput>,
): Promise<Course> {
  const db = getSupabaseAdmin();

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.description !== undefined) update.description = data.description;
  if (data.longDescription !== undefined)
    update.long_description = data.longDescription;
  if (data.track !== undefined) update.track = data.track;
  if (data.difficulty !== undefined) update.difficulty = data.difficulty;
  if (data.lessonCount !== undefined) update.lesson_count = data.lessonCount;
  if (data.duration !== undefined) update.duration = data.duration;
  if (data.xpReward !== undefined) update.xp_reward = data.xpReward;
  if (data.estimatedHours !== undefined)
    update.estimated_hours = data.estimatedHours;
  if (data.creator !== undefined) update.creator = data.creator;
  if (data.prerequisiteId !== undefined)
    update.prerequisite_id = data.prerequisiteId;
  if (data.isActive !== undefined) update.is_active = data.isActive;
  if (data.published !== undefined) update.published = data.published;
  if (data.learningOutcomes !== undefined)
    update.learning_outcomes = data.learningOutcomes;
  if (data.imageUrl !== undefined) update.image_url = data.imageUrl;

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: row, error } = await db
    .from("courses")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update course: ${error.message}`);
  return rowToCourse(row);
}

export async function deleteCourse(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("courses").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete course: ${error.message}`);
}

// ── Module CRUD ──────────────────────────────────────────────────────────────

export async function getModulesByCourse(courseId: string): Promise<Module[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (error) throw new Error(`Failed to fetch modules: ${error.message}`);
  return (data ?? []).map(rowToModule);
}

export async function createModule(data: CreateModuleInput): Promise<Module> {
  const db = getSupabaseAdmin();

  const { data: row, error } = await db
    .from("modules")
    .insert({
      course_id: data.courseId,
      title: data.title,
      description: data.description ?? "",
      order: data.order ?? 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create module: ${error.message}`);
  return rowToModule(row);
}

export async function updateModule(
  id: string,
  data: Partial<UpdateModuleInput>,
): Promise<Module> {
  const db = getSupabaseAdmin();

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.order !== undefined) update.order = data.order;

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: row, error } = await db
    .from("modules")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update module: ${error.message}`);
  return rowToModule(row);
}

export async function deleteModule(id: string): Promise<void> {
  const db = getSupabaseAdmin();

  // Lessons are cascade-deleted by the FK constraint, but explicitly delete
  // them first so any future non-FK storage (e.g. file uploads) can be cleaned.
  const { error: lessonErr } = await db
    .from("lessons")
    .delete()
    .eq("module_id", id);
  if (lessonErr)
    throw new Error(
      `Failed to delete lessons for module: ${lessonErr.message}`,
    );

  const { error } = await db.from("modules").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete module: ${error.message}`);
}

// ── Lesson CRUD ──────────────────────────────────────────────────────────────

export async function getLessonsByModule(moduleId: string): Promise<Lesson[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("order", { ascending: true });

  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  return (data ?? []).map(rowToLesson);
}

export async function createLesson(data: CreateLessonInput): Promise<Lesson> {
  const db = getSupabaseAdmin();

  const { data: row, error } = await db
    .from("lessons")
    .insert({
      module_id: data.moduleId,
      title: data.title,
      slug: data.slug || slugify(data.title),
      type: data.type,
      duration: data.duration ?? "",
      xp_reward: data.xpReward ?? 0,
      estimated_minutes: data.estimatedMinutes ?? 10,
      order: data.order ?? 0,
      content: data.content ?? "",
      challenge_instructions: data.challengeInstructions ?? null,
      challenge_starter_code: data.challengeStarterCode ?? null,
      challenge_solution: data.challengeSolution ?? null,
      challenge_language: data.challengeLanguage ?? null,
      challenge_test_cases: data.challengeTestCases ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create lesson: ${error.message}`);
  return rowToLesson(row);
}

export async function updateLesson(
  id: string,
  data: Partial<UpdateLessonInput>,
): Promise<Lesson> {
  const db = getSupabaseAdmin();

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.type !== undefined) update.type = data.type;
  if (data.duration !== undefined) update.duration = data.duration;
  if (data.xpReward !== undefined) update.xp_reward = data.xpReward;
  if (data.estimatedMinutes !== undefined)
    update.estimated_minutes = data.estimatedMinutes;
  if (data.order !== undefined) update.order = data.order;
  if (data.content !== undefined) update.content = data.content;
  if (data.challengeInstructions !== undefined)
    update.challenge_instructions = data.challengeInstructions;
  if (data.challengeStarterCode !== undefined)
    update.challenge_starter_code = data.challengeStarterCode;
  if (data.challengeSolution !== undefined)
    update.challenge_solution = data.challengeSolution;
  if (data.challengeLanguage !== undefined)
    update.challenge_language = data.challengeLanguage;
  if (data.challengeTestCases !== undefined)
    update.challenge_test_cases = data.challengeTestCases;

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: row, error } = await db
    .from("lessons")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update lesson: ${error.message}`);
  return rowToLesson(row);
}

export async function deleteLesson(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("lessons").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete lesson: ${error.message}`);
}
