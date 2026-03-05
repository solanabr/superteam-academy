import { createClient } from "@sanity/client";
import { env } from "../config/env.js";
import { courses as fallbackCourses, getCourseBySlug as getFallbackCourseBySlug, } from "../data/mock-courses.js";
function getSanityClient() {
    if (!env.SANITY_PROJECT_ID || !env.SANITY_DATASET) {
        return null;
    }
    const token = env.SANITY_TOKEN;
    return createClient({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        apiVersion: env.SANITY_API_VERSION,
        ...(token ? { token } : {}),
        useCdn: env.SANITY_USE_CDN ?? false,
    });
}
function toSlug(slug) {
    if (!slug) {
        return "";
    }
    if (typeof slug === "string") {
        return slug;
    }
    return slug.current ?? "";
}
function normalizeDifficulty(input) {
    if (input === "beginner" ||
        input === "intermediate" ||
        input === "advanced") {
        return input;
    }
    return "beginner";
}
function normalizeBadgeTier(input) {
    if (input === "bronze" ||
        input === "silver" ||
        input === "gold" ||
        input === "platinum") {
        return input;
    }
    return "bronze";
}
function mapTrack(track, trackId) {
    if (typeof track === "string") {
        return track;
    }
    if (track?.title) {
        return track.title;
    }
    return trackId ?? "General";
}
function portableTextToMarkdown(blocks) {
    if (!blocks || blocks.length === 0) {
        return "";
    }
    const parts = [];
    for (const block of blocks) {
        if (block._type === "block") {
            const text = (block.children ?? [])
                .filter((child) => child._type === "span")
                .map((child) => child.text ?? "")
                .join("");
            if (!text.trim()) {
                continue;
            }
            if (block.style === "h2") {
                parts.push(`## ${text}`);
            }
            else if (block.style === "h3") {
                parts.push(`### ${text}`);
            }
            else if (block.style === "blockquote") {
                parts.push(`> ${text}`);
            }
            else {
                parts.push(text);
            }
            continue;
        }
        if (block._type === "code") {
            const language = block.language ?? "";
            const code = block.code ?? "";
            parts.push(`\`\`\`${language}\n${code}\n\`\`\``);
            continue;
        }
        if (block._type === "image") {
            const alt = block.alt ?? "Lesson image";
            parts.push(`![${alt}](media://sanity-image)`);
            continue;
        }
        if (block._type === "file") {
            parts.push("[Resource file](media://sanity-file)");
        }
    }
    return parts.join("\n\n");
}
function normalizeLessonKind(lesson) {
    if (lesson.lessonType === "challenge") {
        return "challenge";
    }
    if (lesson.lessonType === "content" && lesson.contentFormat === "video") {
        return "video";
    }
    if (lesson.kind === "video" || lesson.type === "video") {
        return "video";
    }
    if (lesson.kind === "challenge" || lesson.type === "challenge") {
        return "challenge";
    }
    return "reading";
}
function mapLessons(rawModules) {
    if (!rawModules || rawModules.length === 0) {
        return [];
    }
    const lessons = [];
    const sortedModules = [...rawModules].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    for (const module of sortedModules) {
        const moduleTitle = module.title ?? "Module";
        const moduleLessons = [...(module.lessons ?? [])].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        for (const lesson of moduleLessons) {
            const blockMarkdown = portableTextToMarkdown(lesson.body);
            const lessonMarkdown = lesson.markdown && lesson.markdown.trim().length > 0
                ? lesson.markdown
                : blockMarkdown;
            const mapped = {
                id: lesson.lessonId ??
                    lesson._id ??
                    `${moduleTitle}-${lessons.length + 1}`,
                title: lesson.title ?? "Untitled lesson",
                module: lesson.module ?? moduleTitle,
                type: normalizeLessonKind(lesson),
                markdown: lessonMarkdown,
            };
            if (lesson.starterCode !== undefined) {
                mapped.starterCode = lesson.starterCode;
            }
            if (lesson.language !== undefined) {
                mapped.language = lesson.language;
            }
            lessons.push(mapped);
        }
    }
    return lessons;
}
function mapCourseSummary(raw) {
    const lessons = mapLessons(raw.modules);
    return {
        id: raw.courseId ?? raw._id ?? "",
        slug: toSlug(raw.slug),
        title: raw.title ?? "Untitled course",
        description: raw.summary ?? raw.description ?? "",
        difficulty: normalizeDifficulty(raw.difficulty),
        durationMinutes: raw.durationMinutes ?? 0,
        xpTotal: raw.xpTotal ?? 0,
        track: mapTrack(raw.track, raw.trackId),
        moduleCount: raw.moduleCount ?? raw.modules?.length ?? 0,
        lessonCount: raw.lessonCount ?? lessons.length,
        badge: {
            title: raw.badgeTitle ?? "Course Completion",
            tier: normalizeBadgeTier(raw.badgeTier),
            ...(raw.badgeDescription ? { description: raw.badgeDescription } : {}),
            ...(raw.badgeCriteria ? { criteria: raw.badgeCriteria } : {}),
            ...(raw.badgeIcon?.asset?.url
                ? { iconUrl: raw.badgeIcon.asset.url }
                : {}),
        },
    };
}
function mapCourseDetail(raw) {
    const summary = mapCourseSummary(raw);
    return {
        ...summary,
        lessons: mapLessons(raw.modules),
    };
}
async function fetchCoursesFromSanity() {
    const client = getSanityClient();
    if (!client) {
        return null;
    }
    const query = `*[_type == "course" && defined(slug.current) && (!defined(editorialStatus) || editorialStatus == "published")] | order(coalesce(publishedAt, _updatedAt) desc) {
    _id,
    courseId,
    slug,
    title,
    summary,
    description,
    difficulty,
    durationMinutes,
    xpTotal,
    badgeTitle,
    badgeTier,
    badgeDescription,
    badgeCriteria,
    badgeIcon{
      asset->{
        url
      }
    },
    "track": track->{
      title,
      slug
    },
    trackId,
    editorialStatus,
    modules[]->{
      _id,
      title,
      order,
      lessons[]->{
        _id,
        lessonId,
        title,
        order,
        module,
        type,
        kind,
        lessonType,
        contentFormat,
        videoUrl,
        body,
        markdown,
        starterCode,
        language
      }
    }
  }`;
    try {
        const rows = await client.fetch(query);
        return rows
            .map(mapCourseSummary)
            .filter((course) => course.id && course.slug);
    }
    catch {
        return null;
    }
}
async function fetchCourseBySlugFromSanity(slug) {
    const client = getSanityClient();
    if (!client) {
        return null;
    }
    const query = `*[_type == "course" && slug.current == $slug && (!defined(editorialStatus) || editorialStatus == "published")][0] {
    _id,
    courseId,
    slug,
    title,
    summary,
    description,
    difficulty,
    durationMinutes,
    xpTotal,
    badgeTitle,
    badgeTier,
    badgeDescription,
    badgeCriteria,
    badgeIcon{
      asset->{
        url
      }
    },
    "track": track->{
      title,
      slug
    },
    trackId,
    editorialStatus,
    modules[]->{
      _id,
      title,
      order,
      lessons[]->{
        _id,
        lessonId,
        title,
        order,
        module,
        type,
        kind,
        lessonType,
        contentFormat,
        videoUrl,
        body,
        markdown,
        starterCode,
        language
      }
    }
  }`;
    try {
        const row = await client.fetch(query, { slug });
        if (!row) {
            return null;
        }
        return mapCourseDetail(row);
    }
    catch {
        return null;
    }
}
export async function listCourses() {
    const cmsCourses = await fetchCoursesFromSanity();
    if (cmsCourses && cmsCourses.length > 0) {
        return cmsCourses;
    }
    return fallbackCourses.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        durationMinutes: course.durationMinutes,
        xpTotal: course.xpTotal,
        track: course.track,
        moduleCount: course.moduleCount,
        lessonCount: course.lessonCount,
        badge: course.badge,
    }));
}
export async function getCourseBySlug(slug) {
    const cmsCourse = await fetchCourseBySlugFromSanity(slug);
    if (cmsCourse) {
        return cmsCourse;
    }
    return getFallbackCourseBySlug(slug) ?? null;
}
