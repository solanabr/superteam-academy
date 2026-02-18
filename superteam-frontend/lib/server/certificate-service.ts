import "server-only";

import { PublicKey } from "@solana/web3.js";
import { getAllCourses, getCourse } from "@/lib/server/admin-store";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_CLUSTER,
} from "@/lib/generated/academy-program";
import { fetchEnrollmentsBatch } from "@/lib/server/academy-program";

export type CertificateData = {
  id: string;
  recipientName: string;
  recipientWallet: string;
  courseTitle: string;
  courseSlug: string;
  completionDate: string;
  mintAddress: string;
  trackName: string;
  trackLevel: string;
  coursesInTrack: number;
  totalTrackXp: number;
  programId: string;
  cluster: string;
};

const TRACK_MAP: Record<string, { name: string; level: string }> = {
  "solana-fundamentals": { name: "Solana Core", level: "Foundation" },
  "anchor-framework": { name: "Solana Core", level: "Intermediate" },
  "defi-development": { name: "DeFi", level: "Advanced" },
  "nft-marketplace": { name: "NFT & Metaplex", level: "Intermediate" },
  "web3-security": { name: "Security", level: "Advanced" },
  "rust-for-blockchain": { name: "Rust & Systems", level: "Foundation" },
};

function encodeCertificateId(wallet: string, courseSlug: string): string {
  const prefix = wallet.slice(0, 8);
  return `${prefix}-${courseSlug}`;
}

function decodeCertificateId(
  id: string,
): { walletPrefix: string; courseSlug: string } | null {
  const dashIndex = id.indexOf("-");
  if (dashIndex < 1) return null;
  return {
    walletPrefix: id.slice(0, dashIndex),
    courseSlug: id.slice(dashIndex + 1),
  };
}

function deriveMockMintAddress(wallet: string, courseSlug: string): string {
  const combined = `${wallet}-${courseSlug}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    bytes[i] = hash & 0xff;
  }
  try {
    return new PublicKey(bytes).toBase58();
  } catch {
    return "11111111111111111111111111111111";
  }
}

function getTrackCourseSlugs(trackName: string): string[] {
  return Object.entries(TRACK_MAP)
    .filter(([, info]) => info.name === trackName)
    .map(([slug]) => slug);
}

async function getTrackTotalXp(trackName: string): Promise<number> {
  const slugs = getTrackCourseSlugs(trackName);
  let total = 0;
  for (const slug of slugs) {
    const course = await getCourse(slug);
    total += course?.xp ?? 0;
  }
  return total;
}

async function buildCertificateData(
  wallet: string,
  courseSlug: string,
  completionDate?: string,
): Promise<CertificateData | null> {
  const course = await getCourse(courseSlug);
  if (!course) return null;

  const trackInfo = TRACK_MAP[courseSlug] ?? {
    name: "General",
    level: "Foundation",
  };
  const trackSlugs = getTrackCourseSlugs(trackInfo.name);

  return {
    id: encodeCertificateId(wallet, courseSlug),
    recipientName: `user_${wallet.slice(0, 6).toLowerCase()}`,
    recipientWallet: wallet,
    courseTitle: course.title,
    courseSlug,
    completionDate: completionDate ?? new Date().toISOString().split("T")[0]!,
    mintAddress: deriveMockMintAddress(wallet, courseSlug),
    trackName: trackInfo.name,
    trackLevel: trackInfo.level,
    coursesInTrack: trackSlugs.length,
    totalTrackXp: await getTrackTotalXp(trackInfo.name),
    programId: ACADEMY_PROGRAM_ID,
    cluster: ACADEMY_CLUSTER,
  };
}

export async function getCertificateById(
  id: string,
): Promise<CertificateData | null> {
  const parsed = decodeCertificateId(id);
  if (!parsed) return null;

  const course = await getCourse(parsed.courseSlug);
  if (!course) return null;

  const mockWallet = parsed.walletPrefix.padEnd(32, "1");
  return buildCertificateData(mockWallet, parsed.courseSlug);
}

export async function getCertificatesForWallet(
  wallet: string,
  completedSlugs?: string[],
): Promise<CertificateData[]> {
  let slugs: string[];

  if (completedSlugs) {
    slugs = completedSlugs;
  } else {
    const user = new PublicKey(wallet);
    const allCourses = await getAllCourses();
    const courseIds = allCourses.map((c) => c.slug);
    const enrollments = await fetchEnrollmentsBatch(user, courseIds);

    slugs = [];
    for (const course of allCourses) {
      const enrollment = enrollments.get(course.slug);
      if (!enrollment) continue;
      const totalLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.length,
        0,
      );
      if (enrollment.lessonsCompleted >= totalLessons) {
        slugs.push(course.slug);
      }
    }
  }

  const results: CertificateData[] = [];
  for (const slug of slugs) {
    const cert = await buildCertificateData(wallet, slug);
    if (cert) results.push(cert);
  }
  return results;
}

export async function buildCertificateForWallet(
  wallet: string,
  courseSlug: string,
  completionDate?: string,
): Promise<CertificateData | null> {
  return buildCertificateData(wallet, courseSlug, completionDate);
}
