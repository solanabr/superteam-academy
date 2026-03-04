import type { CourseService } from "../interfaces";
import type { Course, CourseFilters, PaginatedResponse, Difficulty, Track } from "@/types";

const MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Learn the basics of Solana blockchain development. Understand accounts, transactions, and the Solana programming model.",
    thumbnail: "/courses/solana-fundamentals.png",
    difficulty: "beginner",
    track: "fundamentals",
    durationMinutes: 180,
    lessonCount: 12,
    xpReward: 1000,
    instructor: {
      id: "instructor-1",
      name: "Maria Santos",
      avatar: "/avatars/maria.png",
      bio: "Senior Solana Developer at Superteam",
    },
    modules: [
      {
        id: "mod-1",
        title: "Introduction to Solana",
        durationMinutes: 35,
        order: 0,
        lessons: [
          { id: "lesson-1-1", title: "What is Solana?", type: "content", order: 0, durationMinutes: 10, xpReward: 20 },
          { id: "lesson-1-2", title: "Account Model", type: "content", order: 1, durationMinutes: 15, xpReward: 25 },
          { id: "lesson-1-3", title: "Quiz: Solana Basics", type: "challenge", order: 2, durationMinutes: 10, xpReward: 50 },
        ],
      },
      {
        id: "mod-2",
        title: "Development Environment",
        durationMinutes: 45,
        order: 1,
        lessons: [
          { id: "lesson-2-1", title: "Setting Up Your Environment", type: "content", order: 0, durationMinutes: 20, xpReward: 30 },
          { id: "lesson-2-2", title: "Your First Transaction", type: "challenge", order: 1, durationMinutes: 25, xpReward: 75 },
        ],
      },
    ],
    tags: ["solana", "blockchain", "web3", "beginner"],
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "course-2",
    slug: "anchor-framework",
    title: "Anchor Framework Mastery",
    description: "Master the Anchor framework for building Solana programs. Learn PDAs, CPIs, and best practices.",
    thumbnail: "/courses/anchor-framework.png",
    difficulty: "intermediate",
    track: "fundamentals",
    durationMinutes: 300,
    lessonCount: 18,
    xpReward: 2000,
    instructor: {
      id: "instructor-2",
      name: "Carlos Silva",
      avatar: "/avatars/carlos.png",
      bio: "Anchor contributor and Solana educator",
    },
    modules: [
      {
        id: "mod-3",
        title: "Anchor Basics",
        durationMinutes: 65,
        order: 0,
        lessons: [
          { id: "lesson-3-1", title: "What is Anchor?", type: "content", order: 0, durationMinutes: 15, xpReward: 25 },
          { id: "lesson-3-2", title: "Project Structure", type: "content", order: 1, durationMinutes: 20, xpReward: 30 },
          { id: "lesson-3-3", title: "Hello World Program", type: "challenge", order: 2, durationMinutes: 30, xpReward: 100 },
        ],
      },
    ],
    prerequisiteId: "course-1",
    tags: ["anchor", "rust", "programs", "intermediate"],
    isActive: true,
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2026-01-20"),
  },
  {
    id: "course-3",
    slug: "defi-protocols",
    title: "Building DeFi Protocols",
    description: "Build decentralized finance applications on Solana. Learn AMMs, lending protocols, and yield farming.",
    thumbnail: "/courses/defi-protocols.png",
    difficulty: "advanced",
    track: "defi",
    durationMinutes: 420,
    lessonCount: 24,
    xpReward: 3000,
    instructor: {
      id: "instructor-3",
      name: "Ana Rodrigues",
      avatar: "/avatars/ana.png",
      bio: "DeFi protocol architect",
    },
    modules: [
      {
        id: "mod-4",
        title: "DeFi Fundamentals",
        durationMinutes: 45,
        order: 0,
        lessons: [
          { id: "lesson-4-1", title: "Introduction to DeFi", type: "content", order: 0, durationMinutes: 20, xpReward: 30 },
          { id: "lesson-4-2", title: "Token Standards", type: "content", order: 1, durationMinutes: 25, xpReward: 35 },
        ],
      },
    ],
    prerequisiteId: "course-2",
    tags: ["defi", "amm", "lending", "advanced"],
    isActive: true,
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "course-4",
    slug: "nft-metaplex",
    title: "NFTs with Metaplex",
    description: "Create and manage NFTs on Solana using Metaplex. Learn candy machines, collections, and royalties.",
    thumbnail: "/courses/nft-metaplex.png",
    difficulty: "intermediate",
    track: "nft",
    durationMinutes: 240,
    lessonCount: 15,
    xpReward: 1500,
    instructor: {
      id: "instructor-1",
      name: "Maria Santos",
      avatar: "/avatars/maria.png",
      bio: "Senior Solana Developer at Superteam",
    },
    modules: [],
    tags: ["nft", "metaplex", "candy-machine", "intermediate"],
    isActive: true,
    createdAt: new Date("2025-04-01"),
    updatedAt: new Date("2026-01-25"),
  },
  {
    id: "course-5",
    slug: "solana-security",
    title: "Solana Security & Auditing",
    description: "Learn to identify and prevent common vulnerabilities in Solana programs. Master security best practices.",
    thumbnail: "/courses/solana-security.png",
    difficulty: "advanced",
    track: "security",
    durationMinutes: 360,
    lessonCount: 20,
    xpReward: 2500,
    instructor: {
      id: "instructor-4",
      name: "Pedro Oliveira",
      avatar: "/avatars/pedro.png",
      bio: "Security researcher and auditor",
    },
    modules: [],
    tags: ["security", "auditing", "vulnerabilities", "advanced"],
    isActive: true,
    createdAt: new Date("2025-05-01"),
    updatedAt: new Date("2026-02-05"),
  },
  {
    id: "course-6",
    slug: "gaming-solana",
    title: "Game Development on Solana",
    description: "Build blockchain games on Solana. Learn game economies, NFT integration, and real-time performance.",
    thumbnail: "/courses/gaming-solana.png",
    difficulty: "intermediate",
    track: "gaming",
    durationMinutes: 280,
    lessonCount: 16,
    xpReward: 1800,
    instructor: {
      id: "instructor-5",
      name: "Lucas Ferreira",
      avatar: "/avatars/lucas.png",
      bio: "Game developer and blockchain enthusiast",
    },
    modules: [],
    tags: ["gaming", "nft", "economy", "intermediate"],
    isActive: true,
    createdAt: new Date("2025-06-01"),
    updatedAt: new Date("2026-01-30"),
  },
];

/**
 * Stub implementation of CourseService
 * In production: fetches from headless CMS (Sanity/Strapi/Contentful)
 */
export class StubCourseService implements CourseService {
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    let filtered = [...MOCK_COURSES];

    if (filters?.difficulty?.length) {
      filtered = filtered.filter((c) => filters.difficulty!.includes(c.difficulty));
    }

    if (filters?.track?.length) {
      filtered = filtered.filter((c) => filters.track!.includes(c.track));
    }

    if (filters?.duration) {
      const ranges: Record<string, [number, number]> = {
        short: [0, 120],
        medium: [121, 300],
        long: [301, Infinity],
      };
      const [min, max] = ranges[filters.duration];
      filtered = filtered.filter((c) => c.durationMinutes >= min && c.durationMinutes <= max);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 20,
      hasMore: false,
    };
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return MOCK_COURSES.find((c) => c.slug === slug) || null;
  }

  async getCourseById(id: string): Promise<Course | null> {
    return MOCK_COURSES.find((c) => c.id === id) || null;
  }

  async getRecommendedCourses(userId: string, limit = 3): Promise<Course[]> {
    // Simple recommendation: return courses not yet completed
    return MOCK_COURSES.slice(0, limit);
  }

  async searchCourses(query: string): Promise<Course[]> {
    const search = query.toLowerCase();
    return MOCK_COURSES.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  async getLearningPaths(): Promise<{ id: string; name: string; courses: Course[] }[]> {
    return [
      {
        id: "path-1",
        name: "Solana Developer Fundamentals",
        courses: MOCK_COURSES.filter((c) => c.track === "fundamentals"),
      },
      {
        id: "path-2",
        name: "DeFi Developer",
        courses: MOCK_COURSES.filter((c) => c.track === "defi" || c.id === "course-2"),
      },
      {
        id: "path-3",
        name: "NFT & Gaming",
        courses: MOCK_COURSES.filter((c) => c.track === "nft" || c.track === "gaming"),
      },
    ];
  }
}

export const courseService = new StubCourseService();
