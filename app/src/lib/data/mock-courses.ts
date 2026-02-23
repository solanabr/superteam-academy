import type {
  Achievement,
  Course,
  Credential,
  LeaderboardEntry,
  UserProfile,
} from "@/types";
import { courses as referenceCourses } from "../../../REFERENCE_COURSE_CATALOG";

type ReferenceCourse = (typeof referenceCourses)[number];
type ReferenceModule = ReferenceCourse["modules"][number];
type ReferenceLesson = ReferenceModule["lessons"][number];

const GRADIENTS = [
  "from-[#2f6b3f] via-[#3a7d4a] to-[#ffd23f]",
  "from-[#ffd23f] via-[#008c4c] to-[#2f6b3f]",
  "from-[#1b231d] via-[#2f6b3f] to-[#ffd23f]",
  "from-[#008c4c] via-[#2f6b3f] to-[#ffd23f]",
  "from-[#2f6b3f] via-[#008c4c] to-[#ffd23f]",
  "from-[#1b231d] via-[#2f6b3f] to-[#ffd23f]",
];

function parseDurationMinutes(duration: string): number {
  const hours = Number(duration.match(/(\d+)\s*h/i)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)\s*m/i)?.[1] ?? 0);
  if (hours === 0 && minutes === 0) {
    return Number(duration.match(/\d+/)?.[0] ?? 15);
  }
  return hours * 60 + minutes;
}

function parseDurationHours(duration: string): number {
  const hours = Number(duration.match(/(\d+)\s*h/i)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)\s*m/i)?.[1] ?? 0);
  return Number((hours + minutes / 60).toFixed(1));
}

function extractObjective(markdown: string, lessonTitle: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const paragraph: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (!trimmed) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    if (trimmed.startsWith("#") || trimmed.startsWith("|")) {
      continue;
    }
    if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    paragraph.push(trimmed);
  }

  if (paragraph.length === 0) {
    return `Complete: ${lessonTitle}`;
  }
  return paragraph.join(" ");
}

function mapLessonKind(type: ReferenceLesson["type"]): "content" | "challenge" {
  return type === "challenge" ? "challenge" : "content";
}

function expectedOutputFromTests(testCases?: Array<{ name: string; expected: string }>): string | undefined {
  if (!testCases || testCases.length === 0) {
    return undefined;
  }
  return testCases.map((test) => `${test.name}: ${test.expected}`).join("\n");
}

function derivePrerequisites(course: ReferenceCourse): string[] {
  const requirements = new Set<string>();
  if (course.difficulty === "Beginner") {
    requirements.add("Basic JavaScript or TypeScript familiarity");
  }
  if (course.difficulty === "Intermediate") {
    requirements.add("Solana fundamentals");
  }
  if (course.difficulty === "Advanced") {
    requirements.add("Intermediate Solana development experience");
  }
  if (course.tags.some((tag) => ["Anchor", "Rust", "Security", "Validator"].includes(tag))) {
    requirements.add("Rust basics");
  }
  if (course.tags.some((tag) => ["React", "React Native", "Frontend", "Mobile"].includes(tag))) {
    requirements.add("Frontend development basics");
  }
  if (course.tags.some((tag) => ["DeFi", "AMM", "DEX", "Trading", "Oracles"].includes(tag))) {
    requirements.add("Token and DeFi concepts");
  }
  return Array.from(requirements);
}

function deriveOutcomes(course: ReferenceCourse): string[] {
  const lessonTitles = course.modules.flatMap((module) => module.lessons).slice(0, 3).map((lesson) =>
    lesson.title.replace(/^Challenge:\s*/i, ""),
  );
  const first = lessonTitles[0] ?? "core concepts";
  const second = lessonTitles[1] ?? "hands-on implementation";
  const third = lessonTitles[2] ?? "production-oriented workflows";
  return [
    `Master ${first.toLowerCase()} in ${course.title}`,
    `Apply ${second.toLowerCase()} with practical code exercises`,
    `Ship ${third.toLowerCase()} using Solana tooling and best practices`,
  ];
}

function deriveSubtitle(description: string): string {
  const firstSentence = description.split(".")[0]?.trim();
  return firstSentence && firstSentence.length > 0 ? firstSentence : "Comprehensive Solana course";
}

const selectedReferenceCourses = referenceCourses.slice(0, 16);

export const mockCourses: Course[] = selectedReferenceCourses.map((course, courseIndex) => ({
  id: `course-${course.slug}`,
  slug: course.slug,
  title: course.title,
  subtitle: deriveSubtitle(course.description),
  description: course.description,
  instructor: course.instructor,
  difficulty: course.difficulty.toLowerCase() as Course["difficulty"],
  durationHours: parseDurationHours(course.duration),
  enrolledCount: course.enrolled,
  tags: course.tags,
  prerequisites: derivePrerequisites(course),
  outcomes: deriveOutcomes(course),
  gradient: GRADIENTS[courseIndex % GRADIENTS.length],
  modules: course.modules.map((module, moduleIndex) => {
    const lessons = module.lessons.map((sourceLesson, lessonIndex) => {
      const kind = mapLessonKind(sourceLesson.type);
      const markdown = sourceLesson.content ?? "";
      return {
        id: sourceLesson.id || `${course.slug}-m${moduleIndex + 1}-l${lessonIndex + 1}`,
        title: sourceLesson.title,
        kind,
        durationMinutes: parseDurationMinutes(sourceLesson.duration),
        objective: extractObjective(markdown, sourceLesson.title),
        markdown,
        starterCode: sourceLesson.starterCode,
        expectedOutput: expectedOutputFromTests(sourceLesson.testCases),
      };
    });
    return {
      id: `${course.slug}-m${moduleIndex + 1}`,
      title: module.title,
      description: lessons[0]?.objective ?? `Complete ${module.title}`,
      lessons,
    };
  }),
}));

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    userId: "u-camila",
    username: "camila.sol",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    country: "BR",
    xp: 28400,
    level: 16,
    weeklyGain: 1450,
    badges: ["Audit Ace", "Anchor Veteran"],
  },
  {
    userId: "u-diego",
    username: "diego.dev",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=diego",
    country: "AR",
    xp: 27100,
    level: 16,
    weeklyGain: 1280,
    badges: ["cNFT Builder", "Streak 30"],
  },
  {
    userId: "u-luana",
    username: "luana.anchor",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=luana",
    country: "BR",
    xp: 25220,
    level: 15,
    weeklyGain: 1120,
    badges: ["Mentor", "Bug Hunter"],
  },
  {
    userId: "u-max",
    username: "maxxvalidator",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=max",
    country: "US",
    xp: 24110,
    level: 15,
    weeklyGain: 970,
    badges: ["Runtime Expert"],
  },
  {
    userId: "u-sofia",
    username: "sofia.nft",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=sofia",
    country: "MX",
    xp: 22980,
    level: 15,
    weeklyGain: 900,
    badges: ["Creator", "Collection Lead"],
  },
];

export const mockProfiles: UserProfile[] = [
  {
    id: "u-camila",
    username: "camila.sol",
    displayName: "Camila Silva",
    bio: "Solana educator focused on secure protocol design and developer enablement.",
    location: "Sao Paulo, BR",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    walletAddress: "5XnVjQYw2vV5xB7BnzH4JDuwxb9fADUan6P6Jg6A8Wdp",
    xp: 28400,
    level: 16,
    enrolledCourseIds: ["course-security-auditing", "course-defi-developer"],
    interests: ["Auditing", "Anchor", "Protocol Design"],
    skills: {
      "Smart Contract Security": 94,
      Anchor: 89,
      DeFi: 83,
      "Token Engineering": 71,
      "Frontend dApps": 64,
    },
  },
  {
    id: "u-local",
    username: "you",
    displayName: "You",
    bio: "Builder on Superteam Academy, tracking progress daily.",
    location: "Remote",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=you",
    xp: 1320,
    level: 3,
    enrolledCourseIds: ["course-solana-fundamentals", "course-anchor-101"],
    interests: ["Solana", "Learning", "DevRel"],
    skills: {
      "Smart Contract Security": 28,
      Anchor: 44,
      DeFi: 32,
      "Token Engineering": 41,
      "Frontend dApps": 53,
    },
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "ach-first-lesson",
    title: "Genesis Step",
    description: "Complete your first lesson",
    icon: "Rocket",
    xpReward: 40,
    rarity: "common",
    unlocked: true,
  },
  {
    id: "ach-7-day",
    title: "Relentless",
    description: "Keep a 7-day learning streak",
    icon: "Flame",
    xpReward: 120,
    rarity: "rare",
    unlocked: false,
  },
  {
    id: "ach-audit",
    title: "Exploit Hunter",
    description: "Finish Security Auditing track",
    icon: "Shield",
    xpReward: 320,
    rarity: "epic",
    unlocked: false,
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-solana-foundations",
    courseId: "course-solana-fundamentals",
    title: "Solana Fundamentals Credential",
    issuedAt: "2026-01-17T11:20:00.000Z",
    issuer: "Superteam Academy",
    imageUri: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=600&q=80",
    txSignature: "4hM3mkY7fH9U1UGMDCbLEoyTj2r6n8yNEQ5rxpVwq2pTfY4q3d4qFVeV8wHzqAdDk8xqWm3w2BPfQ5",
  },
  {
    id: "cred-anchor-practitioner",
    courseId: "course-anchor-101",
    title: "Anchor 101 Practitioner",
    issuedAt: "2026-02-03T09:55:00.000Z",
    issuer: "Superteam Academy",
    imageUri: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=600&q=80",
  },
];

export const landingTestimonials = [
  {
    name: "Fernanda Costa",
    role: "Protocol Engineer at Solana Startup",
    quote:
      "Superteam Academy helped me move from Solidity to shipping Anchor programs with confidence.",
  },
  {
    name: "Tiago Mendes",
    role: "Security Researcher",
    quote:
      "The auditing track mirrors real engagements. I used the checklist in two paid reviews already.",
  },
  {
    name: "Daniel Ortiz",
    role: "DevRel Lead",
    quote:
      "The curriculum is practical, not generic. Every module ends with something you can demo.",
  },
];
