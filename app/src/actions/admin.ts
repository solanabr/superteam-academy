'use server';

import dbConnect from '@/lib/db';
import User from '@/models/User';
import Course from '@/models/Course';

export async function getAdminStats() {
  await dbConnect();

  const [
    totalUsers,
    activeLearners,
    totalCourses,
    totalEnrollmentsResult
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastActiveDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Course.countDocuments({}),
    User.aggregate([
      { $project: { enrollmentCount: { $size: "$enrolledCourses" } } },
      { $group: { _id: null, total: { $sum: "$enrollmentCount" } } }
    ])
  ]);

  const totalEnrollments = totalEnrollmentsResult[0]?.total || 0;

  return {
    totalUsers,
    activeLearners,
    totalCourses,
    totalEnrollments
  };
}

export async function getRecentUsers() {
    await dbConnect();
    const users = await User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username walletAddress createdAt role xp')
        .lean();

    return users.map((u: any) => ({
        ...u,
        _id: u._id.toString(),
        createdAt: u.createdAt.toISOString()
    }));
}
