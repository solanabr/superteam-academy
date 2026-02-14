import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { client } from "@/sanity/lib/client";

export async function POST() {
  await connectDB();

  const stats = await Enrollment.aggregate([
    {
      $group: {
        _id: "$courseId",
        enrolled: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $ne: ["$completedAt", null] }, 1, 0] },
        },
      },
    },
  ]);

  const results = [];
  for (const s of stats) {
    try {
      await client
        .patch(s._id)
        .set({
          totalEnrollments: s.enrolled,
          totalCompletions: s.completed,
        })
        .commit();
      results.push({ courseId: s._id, enrolled: s.enrolled, completed: s.completed });
    } catch {
      // Course may not exist in Sanity (sample data only)
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
