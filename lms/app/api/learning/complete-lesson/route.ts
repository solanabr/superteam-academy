import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { ensureUser, getUtcDay } from "@/lib/db/helpers";

export async function POST(req: NextRequest) {
  const { userId, courseId, lessonIndex } = await req.json();
  if (!userId || !courseId || lessonIndex === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();
  const user = await ensureUser(userId);
  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    return NextResponse.json({ error: "not enrolled" }, { status: 400 });
  }

  if (!enrollment.lessonsCompleted.includes(lessonIndex)) {
    enrollment.lessonsCompleted.push(lessonIndex);
    enrollment.percentComplete =
      (enrollment.lessonsCompleted.length / enrollment.totalLessons) * 100;

    if (enrollment.lessonsCompleted.length === enrollment.totalLessons) {
      enrollment.completedAt = new Date();
    }
    await enrollment.save();

    // Award XP
    user.xp += 50;

    // Update streak
    const today = getUtcDay();
    if (today > user.streak.lastDay) {
      if (today === user.streak.lastDay + 1) {
        user.streak.current += 1;
      } else {
        user.streak.current = 1;
      }
      user.streak.lastDay = today;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    }

    await user.save();
  }

  return NextResponse.json({ ok: true });
}
