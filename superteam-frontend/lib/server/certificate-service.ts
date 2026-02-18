import "server-only";

import { PublicKey } from "@solana/web3.js";
import { getAllCourses, getCourse } from "@/lib/server/admin-store";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_CLUSTER,
} from "@/lib/generated/academy-program";
import {
  deriveCoursePda,
  deriveEnrollmentPda,
  fetchEnrollment,
} from "@/lib/server/academy-program";
import { getCatalogCourseMeta } from "@/lib/server/academy-course-catalog";

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

function getTrackTotalXp(trackName: string): number {
  const slugs = getTrackCourseSlugs(trackName);
  return slugs.reduce((total, slug) => {
    const course = getCourse(slug);
    return total + (course?.xp ?? 0);
  }, 0);
}

function buildCertificateData(
  wallet: string,
  courseSlug: string,
  completionDate?: string,
): CertificateData | null {
  const course = getCourse(courseSlug);
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
    totalTrackXp: getTrackTotalXp(trackInfo.name),
    programId: ACADEMY_PROGRAM_ID,
    cluster: ACADEMY_CLUSTER,
  };
}

/**
 * Look up a certificate by its encoded ID.
 * For now, derives mock data from the ID. When on-chain credentials land,
 * this will query the compressed PDA via the Photon indexer.
 */
export function getCertificateById(id: string): CertificateData | null {
  const parsed = decodeCertificateId(id);
  if (!parsed) return null;

  const course = getCourse(parsed.courseSlug);
  if (!course) return null;

  // Build certificate with the wallet prefix as a stand-in
  // In production this would fetch the real wallet from the credential PDA
  const mockWallet = parsed.walletPrefix.padEnd(32, "1");
  return buildCertificateData(mockWallet, parsed.courseSlug);
}

/**
 * Get all certificates for a wallet. Checks on-chain enrollment data;
 * courses with all lessons completed are considered certified.
 */
export async function getCertificatesForWallet(
  wallet: string,
): Promise<CertificateData[]> {
  const results: CertificateData[] = [];
  const user = new PublicKey(wallet);

  for (const course of getAllCourses()) {
    const meta = getCatalogCourseMeta(course.slug);
    if (!meta) continue;

    try {
      const enrollment = await fetchEnrollment(user, course.slug);
      if (!enrollment) continue;

      const totalLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.length,
        0,
      );
      if (Number(enrollment.lessonsCompleted) >= totalLessons) {
        const cert = buildCertificateData(wallet, course.slug);
        if (cert) results.push(cert);
      }
    } catch {
      // Network errors - skip this course
      continue;
    }
  }

  return results;
}

/**
 * Build certificate data for a specific wallet + course combination.
 * Returns null if the course doesn't exist in the catalog.
 */
export function buildCertificateForWallet(
  wallet: string,
  courseSlug: string,
  completionDate?: string,
): CertificateData | null {
  return buildCertificateData(wallet, courseSlug, completionDate);
}
