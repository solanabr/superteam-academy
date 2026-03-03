export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  xp: number;
  instructor: { name: string; avatar?: string; verified: boolean };
  topic: string;
  enrolled: boolean;
  progress: number;
  thumbnail?: string;
  modules: Module[];
  reviews: Review[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "Video" | "Reading" | "Code Challenge";
  duration: string;
  completed: boolean;
  active?: boolean;
  locked?: boolean;
}

export interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  handle: string;
  xp: number;
  level: number;
  streak: number;
  pathsDone: number;
  isCurrentUser?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  icon: string;
}

export interface ActivityItem {
  id: string;
  type: "lesson_complete" | "xp_earned" | "badge_earned" | "challenge_won" | "path_complete";
  title: string;
  description: string;
  time: string;
  xp?: number;
}

export const courses: Course[] = [
  {
    id: "1", slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Master the basics of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime.",
    difficulty: "Beginner", duration: "8 hours", lessons: 22, xp: 850,
    instructor: { name: "Ana García", verified: true },
    topic: "Core", enrolled: true, progress: 65,
    modules: [
      { id: "m1", title: "Introduction to Solana", lessons: [
        { id: "l1", title: "What is Solana?", type: "Video", duration: "12 min", completed: true },
        { id: "l2", title: "Solana Architecture", type: "Reading", duration: "8 min", completed: true },
        { id: "l3", title: "Setting Up Your Environment", type: "Code Challenge", duration: "20 min", completed: true },
      ]},
      { id: "m2", title: "Accounts & Transactions", lessons: [
        { id: "l4", title: "Understanding Accounts", type: "Video", duration: "15 min", completed: true },
        { id: "l5", title: "Transaction Anatomy", type: "Reading", duration: "10 min", completed: false, active: true },
        { id: "l6", title: "Build Your First Transaction", type: "Code Challenge", duration: "25 min", completed: false },
      ]},
      { id: "m3", title: "Programs & PDAs", lessons: [
        { id: "l7", title: "Program Derived Addresses", type: "Video", duration: "18 min", completed: false, locked: true },
        { id: "l8", title: "Cross-Program Invocations", type: "Reading", duration: "12 min", completed: false, locked: true },
      ]},
    ],
    reviews: [
      { name: "Carlos M.", rating: 5, text: "Best Solana course I've taken. The hands-on challenges really cement the concepts.", date: "2 weeks ago" },
      { name: "Sofia R.", rating: 4, text: "Great content, well structured. Would love more advanced topics.", date: "1 month ago" },
    ],
  },
  {
    id: "2", slug: "anchor-development",
    title: "Anchor Framework Mastery",
    description: "Build production-ready Solana programs using the Anchor framework. From setup to deployment.",
    difficulty: "Intermediate", duration: "12 hours", lessons: 34, xp: 1200,
    instructor: { name: "Diego Torres", verified: true },
    topic: "Smart Contracts", enrolled: false, progress: 0,
    modules: [
      { id: "m1", title: "Anchor Basics", lessons: [
        { id: "l1", title: "Why Anchor?", type: "Video", duration: "10 min", completed: false },
        { id: "l2", title: "Project Setup", type: "Code Challenge", duration: "15 min", completed: false },
      ]},
    ],
    reviews: [],
  },
  {
    id: "3", slug: "defi-protocols",
    title: "Building DeFi on Solana",
    description: "Design and implement DeFi protocols including AMMs, lending platforms, and yield aggregators.",
    difficulty: "Advanced", duration: "16 hours", lessons: 28, xp: 1800,
    instructor: { name: "Maria Fernandez", verified: true },
    topic: "DeFi", enrolled: false, progress: 0,
    modules: [],
    reviews: [],
  },
  {
    id: "4", slug: "solana-frontend",
    title: "Solana Frontend Development",
    description: "Connect your dApps to Solana using React, wallet adapters, and the Solana web3.js library.",
    difficulty: "Beginner", duration: "6 hours", lessons: 18, xp: 650,
    instructor: { name: "Luis Herrera", verified: false },
    topic: "Frontend", enrolled: true, progress: 30,
    modules: [],
    reviews: [],
  },
  {
    id: "5", slug: "solana-security",
    title: "Smart Contract Security",
    description: "Learn to audit and secure Solana programs. Identify vulnerabilities and implement best practices.",
    difficulty: "Advanced", duration: "10 hours", lessons: 20, xp: 1500,
    instructor: { name: "Pedro Alvarez", verified: true },
    topic: "Security", enrolled: false, progress: 0,
    modules: [],
    reviews: [],
  },
  {
    id: "6", slug: "nft-development",
    title: "NFTs & Digital Assets",
    description: "Create, mint, and manage NFTs on Solana using Metaplex and compressed NFTs.",
    difficulty: "Intermediate", duration: "8 hours", lessons: 24, xp: 950,
    instructor: { name: "Valentina Cruz", verified: true },
    topic: "NFTs", enrolled: false, progress: 0,
    modules: [],
    reviews: [],
  },
];

export const leaderboardUsers: LeaderboardUser[] = [
  { rank: 1, name: "Elena Rodríguez", handle: "elena_sol", xp: 12450, level: 15, streak: 42, pathsDone: 6 },
  { rank: 2, name: "Marco Silva", handle: "marco.dev", xp: 11200, level: 14, streak: 38, pathsDone: 5 },
  { rank: 3, name: "Camila Ortiz", handle: "cami_builds", xp: 10800, level: 13, streak: 21, pathsDone: 5 },
  { rank: 4, name: "Andrés Morales", handle: "andres.sol", xp: 9600, level: 12, streak: 15, pathsDone: 4 },
  { rank: 5, name: "Isabella Reyes", handle: "isa_web3", xp: 8900, level: 11, streak: 28, pathsDone: 4 },
  { rank: 6, name: "Santiago Vargas", handle: "santi_dev", xp: 7500, level: 10, streak: 12, pathsDone: 3 },
  { rank: 7, name: "Luciana Paz", handle: "lu_codes", xp: 6800, level: 9, streak: 19, pathsDone: 3, isCurrentUser: true },
  { rank: 8, name: "Mateo García", handle: "mateo.anchor", xp: 6200, level: 8, streak: 7, pathsDone: 2 },
  { rank: 9, name: "Valeria López", handle: "val_solana", xp: 5800, level: 8, streak: 14, pathsDone: 2 },
  { rank: 10, name: "Tomás Hernandez", handle: "tomas_h", xp: 5100, level: 7, streak: 5, pathsDone: 2 },
];

export const achievements: Achievement[] = [
  { id: "1", title: "First Lesson Complete", date: "2 days ago", icon: "BookOpen" },
  { id: "2", title: "7-Day Streak", date: "5 days ago", icon: "Flame" },
  { id: "3", title: "100 XP Milestone", date: "1 week ago", icon: "Star" },
];

export const activityFeed: ActivityItem[] = [
  { id: "1", type: "lesson_complete", title: "Completed: Understanding Accounts", description: "Solana Fundamentals · Module 2", time: "2 hours ago", xp: 35 },
  { id: "2", type: "xp_earned", title: "+75 XP Earned", description: "Code Challenge: Build Your First Transaction", time: "Yesterday", xp: 75 },
  { id: "3", type: "badge_earned", title: "Achievement Unlocked: 7-Day Streak", description: "Keep your learning streak alive!", time: "3 days ago" },
  { id: "4", type: "challenge_won", title: "Challenge Complete: Token Swap", description: "DeFi Challenges · Intermediate", time: "5 days ago", xp: 150 },
  { id: "5", type: "path_complete", title: "Path Complete: Solana Basics", description: "Earned Certificate + 350 XP", time: "1 week ago", xp: 350 },
];

export const learningPaths = [
  {
    id: "1", title: "Solana Fundamentals", description: "Go from zero to building on Solana",
    level: "Beginner", courses: 4, duration: "30 hours", xp: 2500, modules: ["Intro to Blockchain", "Solana Architecture", "Your First Program", "Testing & Deployment"],
    featured: false,
  },
  {
    id: "2", title: "DeFi Developer", description: "Master DeFi protocol development on Solana",
    level: "Intermediate", courses: 5, duration: "45 hours", xp: 4200, modules: ["Token Programs", "AMM Design", "Lending Protocols", "Yield Strategies", "Security Auditing"],
    featured: true,
  },
  {
    id: "3", title: "Full-Stack Solana", description: "Build complete dApps from frontend to on-chain",
    level: "Advanced", courses: 6, duration: "60 hours", xp: 5800, modules: ["React + Solana", "Anchor Advanced", "Real-time Data", "Production Deploy", "Performance", "Monitoring"],
    featured: false,
  },
];
