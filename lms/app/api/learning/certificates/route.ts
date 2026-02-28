import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { Certificate } from "@/lib/db/models/certificate";
import { Enrollment } from "@/lib/db/models/enrollment";
import { getAllCourses, getCourseById } from "@/lib/db/course-helpers";
import {
  fetchEnrollment,
  fetchCredentialForEnrollment,
} from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json([]);

  // Try on-chain enrollments first
  try {
    const walletPk = new PublicKey(wallet);
    const onChainCerts: any[] = [];

    const allCourses = await getAllCourses();
    for (const course of allCourses) {
      const enrollment = await fetchEnrollment(course.id, walletPk);
      if (!enrollment?.completedAt) continue;

      const completedAtRaw = enrollment.completedAt;
      const completedAt = new Date(
        (typeof completedAtRaw === "object" &&
        "toNumber" in (completedAtRaw as any)
          ? (completedAtRaw as any).toNumber()
          : Number(completedAtRaw)) * 1000,
      ).toISOString();

      let credentialTxHash: string | null = null;
      let nftMetadata: any = null;

      // Fetch credential NFT data if available
      const asset = await fetchCredentialForEnrollment(course.id, walletPk);
      if (asset) {
        credentialTxHash = asset.id ?? null;
        nftMetadata = {
          name: asset.content?.metadata?.name ?? null,
          uri: asset.content?.json_uri ?? null,
          attributes: asset.content?.metadata?.attributes ?? [],
        };
      }

      onChainCerts.push({
        wallet,
        courseId: course.id,
        courseTitle: course.title,
        trackId: course.trackId,
        xpEarned: course.xpTotal,
        txHash: credentialTxHash,
        issuedAt: completedAt,
        nftMetadata,
      });
    }

    if (onChainCerts.length > 0) {
      // Fill missing txHash from MongoDB certificates
      await connectDB();
      for (const cert of onChainCerts) {
        if (!cert.txHash) {
          const dbCert = await Certificate.findOne({
            wallet,
            courseId: cert.courseId,
          }).lean();
          if (dbCert?.txHash) {
            cert.txHash = dbCert.txHash;
          }
        }
      }
      return NextResponse.json(
        onChainCerts.sort(
          (a, b) =>
            new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
        ),
      );
    }
  } catch {
    // fallback to MongoDB
  }

  await connectDB();

  // Backfill: create certificates for completed enrollments that don't have one yet
  const completedEnrollments = await Enrollment.find({
    userId: wallet,
    completedAt: { $ne: null },
  }).lean();

  for (const enrollment of completedEnrollments) {
    const existing = await Certificate.findOne({
      wallet,
      courseId: enrollment.courseId,
    });
    if (!existing) {
      const course = await getCourseById(enrollment.courseId);
      if (course) {
        await Certificate.create({
          wallet,
          courseId: enrollment.courseId,
          courseTitle: course.title,
          trackId: course.trackId,
          xpEarned: course.xpTotal,
          txHash: null,
          issuedAt: enrollment.completedAt,
        });
      }
    }
  }

  const certs = await Certificate.find({ wallet })
    .sort({ issuedAt: -1 })
    .lean();

  return NextResponse.json(
    certs.map((c) => ({
      wallet: c.wallet,
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      trackId: c.trackId,
      xpEarned: c.xpEarned,
      txHash: c.txHash ?? null,
      issuedAt: c.issuedAt.toISOString(),
      nftMetadata: null,
    })),
  );
}
