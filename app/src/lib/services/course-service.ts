/**
 * Course service — CMS (Sanity) canonical for courses, modules, lessons, challenge metadata.
 * PRD: get_courses(), get_course_by_slug(), get_lessons(), get_challenges()
 * Draft mode support; static generation where appropriate.
 */
import { sanity_client, is_sanity_configured } from "@/lib/sanity/client";

export type Course = {
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  published: boolean;
  modules: Module[];
};

export type Module = {
  slug: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Lesson = {
  slug: string;
  title: string;
  order: number;
  content: string | null;
  challenge_id: string | null;
};

export type ChallengeMeta = {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | "hell";
  xp_reward: number;
  time_estimate_minutes: number | null;
  language: string;
  track_association: string | null;
};

type Sanity_lesson = {
  slug?: { current?: string } | null;
  title?: string | null;
  order?: number | null;
  content?: string | null;
  challenge_id?: string | null;
};

type Sanity_module = {
  slug?: { current?: string } | null;
  title?: string | null;
  order?: number | null;
  lessons?: Sanity_lesson[] | null;
};

type Sanity_course = {
  slug?: { current?: string } | null;
  title?: string | null;
  description?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
  image_url?: string | null;
  published?: boolean | null;
  modules?: Sanity_module[] | null;
};

type Sanity_challenge_meta = {
  _id: string;
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  xp_reward?: number | null;
  time_estimate_minutes?: number | null;
  language?: string | null;
  track_association?: string | null;
};

function map_sanity_lesson(doc: Sanity_lesson): Lesson {
  const slug = doc.slug?.current ?? "";
  return {
    slug,
    title: doc.title ?? slug,
    order: doc.order ?? 0,
    content: doc.content ?? null,
    challenge_id: doc.challenge_id ?? null,
  };
}

function map_sanity_module(doc: Sanity_module): Module {
  const slug = doc.slug?.current ?? "";
  const lessons_source = doc.lessons ?? [];
  const lessons_mapped = lessons_source.map((lesson_doc) => map_sanity_lesson(lesson_doc));
  const lessons_sorted = [...lessons_mapped].sort((lesson_a, lesson_b) => lesson_a.order - lesson_b.order);

  return {
    slug,
    title: doc.title ?? slug,
    order: doc.order ?? 0,
    lessons: lessons_sorted,
  };
}

function map_sanity_course(doc: Sanity_course): Course {
  const slug = doc.slug?.current ?? "";
  const modules_source = doc.modules ?? [];
  const modules_mapped = modules_source.map((module_doc) => map_sanity_module(module_doc));
  const modules_sorted = [...modules_mapped].sort((module_a, module_b) => module_a.order - module_b.order);

  const image_url = doc.image_url ?? doc.image?.asset?.url ?? null;

  return {
    slug,
    title: doc.title ?? slug,
    description: doc.description ?? null,
    image_url,
    published: doc.published ?? false,
    modules: modules_sorted,
  };
}

function build_course_query(draft: boolean): string {
  const visibility_filter = draft ? "" : ' && !(_id in path("drafts.**")) && published == true';
  const query =
    '*[_type == "course"' +
    visibility_filter +
    `]{
      slug,
      "slug": coalesce(slug.current, slug),
      title,
      description,
      "image_url": coalesce(image.asset->url, null),
      published,
      modules[]{
        slug,
        "slug": coalesce(slug.current, slug),
        title,
        order,
        lessons[]{
          slug,
          "slug": coalesce(slug.current, slug),
          title,
          order,
          content,
          challenge_id
        }
      }
    }`;
  return query;
}

export async function get_courses(draft = false): Promise<Course[]> {
  if (!is_sanity_configured()) return [];

  const query = build_course_query(draft);
  const sanity_courses = await sanity_client.fetch<Sanity_course[]>(query);
  const safe_courses = Array.isArray(sanity_courses) ? sanity_courses : [];

  return safe_courses.map((course_doc) => map_sanity_course(course_doc));
}

export async function get_course_by_slug(slug: string, draft = false): Promise<Course | null> {
  const courses = await get_courses(draft);
  return courses.find((c) => c.slug === slug) ?? null;
}

export async function get_lessons(course_slug: string, draft = false): Promise<Lesson[]> {
  const course = await get_course_by_slug(course_slug, draft);
  if (!course) return [];
  return course.modules.flatMap((m) => m.lessons);
}

export async function get_challenges(draft = false): Promise<ChallengeMeta[]> {
  if (!is_sanity_configured()) return [];

  const visibility_filter = draft ? "" : ' && !(_id in path("drafts.**")) && defined(published) && published == true';
  const query =
    '*[_type == "challenge" || _type == "challenge_meta"' +
    visibility_filter +
    `]{
      _id,
      title,
      description,
      difficulty,
      xp_reward,
      time_estimate_minutes,
      language,
      track_association
    }`;

  const sanity_challenges = await sanity_client.fetch<Sanity_challenge_meta[]>(query);
  const safe_challenges = Array.isArray(sanity_challenges) ? sanity_challenges : [];

  const mapped: ChallengeMeta[] = safe_challenges.map((doc) => {
    const difficulty_raw = doc.difficulty ?? "easy";
    const allowed_difficulty: ChallengeMeta["difficulty"][] = ["easy", "medium", "hard", "hell"];
    const difficulty =
      allowed_difficulty.includes(difficulty_raw as ChallengeMeta["difficulty"])
        ? (difficulty_raw as ChallengeMeta["difficulty"])
        : "easy";

    return {
      id: doc._id,
      title: doc.title ?? doc._id,
      description: doc.description ?? null,
      difficulty,
      xp_reward: doc.xp_reward ?? 0,
      time_estimate_minutes: doc.time_estimate_minutes ?? null,
      language: doc.language ?? "typescript",
      track_association: doc.track_association ?? null,
    };
  });

  return mapped;
}
