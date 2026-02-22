import { sanityClient } from "@/lib/sanity/client";
import { COURSE_TAGS_QUERY } from "@/lib/sanity/queries";
import { learningProgressService } from "./learning-progress";
import type { SkillsService, SkillScore } from "./interfaces";

// Maps Sanity course tags → skill axis names shown on the profile radar.
// Tags not in this map are ignored for skill computation.
const TAG_TO_SKILL: Record<string, string> = {
  solana: "Solana Core",
  blockchain: "Solana Core",
  rust: "Rust",
  anchor: "Anchor",
  defi: "DeFi",
  nft: "NFTs",
  nfts: "NFTs",
  metaplex: "NFTs",
  web3: "Web3 Frontend",
  nextjs: "Web3 Frontend",
  react: "Web3 Frontend",
};

export const SKILL_NAMES = [
  "Solana Core",
  "Rust",
  "Anchor",
  "DeFi",
  "NFTs",
  "Web3 Frontend",
];

// Total XP earned in a skill axis that maps to 100% mastery.
const MAX_SKILL_XP = 300;

interface CourseTagRow {
  courseId: string;
  tags: string[] | null;
  xpPerLesson: number | null;
  lessonCount: number | null;
}

class SkillsServiceImpl implements SkillsService {
  async getSkills(userId: string): Promise<SkillScore[]> {
    const enrollments = await learningProgressService.getEnrollments(userId);
    if (!enrollments.length) {
      return SKILL_NAMES.map((name) => ({ name, value: 0 }));
    }

    const courseIds = enrollments.map((e) => e.courseId);
    const courses: CourseTagRow[] = await sanityClient
      .fetch(COURSE_TAGS_QUERY, { courseIds })
      .catch(() => []);

    const courseMap = new Map(courses.map((c) => [c.courseId, c]));
    const accumulated: Record<string, number> = {};

    for (const enrollment of enrollments) {
      const course = courseMap.get(enrollment.courseId);
      if (!course?.tags?.length) continue;

      const earnedXp =
        (enrollment.progressPct / 100) *
        (course.xpPerLesson ?? 0) *
        (course.lessonCount ?? 0);

      for (const tag of course.tags) {
        const skill = TAG_TO_SKILL[tag.toLowerCase()];
        if (!skill) continue;
        accumulated[skill] = (accumulated[skill] ?? 0) + earnedXp;
      }
    }

    return SKILL_NAMES.map((name) => ({
      name,
      value: Math.min(
        100,
        Math.round(((accumulated[name] ?? 0) / MAX_SKILL_XP) * 100),
      ),
    }));
  }
}

export const skillsService: SkillsService = new SkillsServiceImpl();
