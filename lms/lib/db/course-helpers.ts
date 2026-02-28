import { connectDB } from "./mongodb";
import { CourseModel } from "./models/course";
import type { Course } from "@/types/course";

function toPlainCourse(doc: any): Course {
  return {
    id: doc.courseId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    thumbnail: doc.thumbnail,
    creator: doc.creator,
    difficulty: doc.difficulty,
    lessonCount: doc.lessonCount,
    challengeCount: doc.challengeCount,
    xpTotal: doc.xpTotal,
    trackId: doc.trackId,
    trackLevel: doc.trackLevel,
    duration: doc.duration,
    prerequisiteId: doc.prerequisiteId,
    isActive: doc.isActive,
    totalCompletions: doc.totalCompletions ?? 0,
    totalEnrollments: doc.totalEnrollments ?? 0,
    modules: doc.modules,
    createdAt: doc.createdAt,
    contentTxId: doc.contentTxId,
  };
}

export async function getAllCourses(): Promise<Course[]> {
  await connectDB();
  const docs = await CourseModel.find({}).lean();
  return docs.map(toPlainCourse);
}

export async function getCourseById(idOrSlug: string): Promise<Course | null> {
  await connectDB();
  const doc = await CourseModel.findOne({
    $or: [{ courseId: idOrSlug }, { slug: idOrSlug }],
  }).lean();
  return doc ? toPlainCourse(doc) : null;
}

export async function getCoursesByTrack(trackId: number): Promise<Course[]> {
  await connectDB();
  const docs = await CourseModel.find({ trackId }).lean();
  return docs.map(toPlainCourse);
}

export async function getCourseWithTxHash(
  idOrSlug: string,
): Promise<
  (Course & { onChainTxHash?: string; onChainAddress?: string }) | null
> {
  await connectDB();
  const doc = await CourseModel.findOne({
    $or: [{ courseId: idOrSlug }, { slug: idOrSlug }],
  }).lean();
  if (!doc) return null;
  return {
    ...toPlainCourse(doc),
    onChainTxHash: (doc as any).onChainTxHash,
    onChainAddress: (doc as any).onChainAddress,
  };
}
