import { connectDB } from "./mongodb";
import { User, type IUser } from "./models/user";
import { Enrollment, type IEnrollment } from "./models/enrollment";
import { CourseModel } from "./models/course";

export async function ensureUser(wallet: string): Promise<IUser> {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { wallet },
    { $setOnInsert: { wallet } },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
  if (!user) {
    throw new Error(`Failed to ensure user for wallet: ${wallet}`);
  }
  return user;
}

export function getUtcDay(timestamp?: number): number {
  const ts = timestamp ?? Date.now() / 1000;
  return Math.floor(ts / 86400);
}

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** Find enrollment by courseId, falling back to slug lookup */
export async function findEnrollment(
  userId: string,
  courseId: string,
): Promise<IEnrollment | null> {
  await connectDB();
  let enrollment = await Enrollment.findOne({ userId, courseId });
  if (enrollment) return enrollment;

  // Fallback: courseId might be a slug — resolve to actual id
  const course = await CourseModel.findOne({
    slug: courseId,
    courseId: { $ne: courseId },
  }).lean();
  if (course) {
    enrollment = await Enrollment.findOne({
      userId,
      courseId: course.courseId,
    });
  }
  return enrollment;
}
