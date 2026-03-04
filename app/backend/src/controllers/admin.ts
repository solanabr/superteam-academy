import { Request, Response } from "express";
import { User } from "../models/users";
import { Course } from "../models/courses";
import { Enrollment } from "../models/enrollment";
import { MilestoneProgress } from "../models/milestoneProgress";
import { AchievementReceipt } from "../models/achievementReceipt";
import { AchievementType } from "../models/achievementType";
import { Thread } from "../models/thread";
import { Reply } from "../models/reply";

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/courses
 * All courses regardless of status, with enrollment/completion stats.
 */
export const adminGetCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;

        const [courses, total] = await Promise.all([
            Course.find(filter)
                .select("title slug status difficulty topic totalXP enrollmentCount completionCount rating ratingCount publishedAt createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Course.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: courses,
            pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("[adminGetCourses] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * PATCH /api/v1/admin/courses/:slug
 * Update course metadata and full structure (milestones, lessons, tests).
 */
export const adminUpdateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const course = await Course.findOne({ slug });

        if (!course) {
            res.status(404).json({ success: false, message: "Course not found" });
            return;
        }

        const allowed = [
            "title", "description", "shortDescription", "thumbnail", "tags",
            "difficulty", "topic", "status", "author", "milestones", "sanityId"
        ];

        // Apply updates
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) {
                // Special handling for status change to 'published'
                if (key === "status" && req.body[key] === "published" && course.status !== "published") {
                    course.publishedAt = new Date();
                }
                (course as any)[key] = req.body[key];
            }
        });

        // Using .save() instead of findOneAndUpdate to trigger the pre-save hook
        // which auto-calculates totalXP and duration based on milestones/lessons.
        await course.save();

        res.status(200).json({ success: true, message: "Course updated", data: course });
    } catch (err) {
        console.error("[adminUpdateCourse] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * PATCH /api/v1/admin/courses/:slug/archive
 * Archive a published course (hides it from catalog).
 */
export const adminArchiveCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await Course.findOneAndUpdate(
            { slug: req.params.slug },
            { status: "archived" },
            { new: true }
        );
        if (!course) {
            res.status(404).json({ success: false, message: "Course not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Course archived", data: { status: course.status } });
    } catch (err) {
        console.error("[adminArchiveCourse] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * DELETE /api/v1/admin/courses/:slug
 * Hard delete — only allowed for draft courses.
 */
export const adminDeleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            res.status(404).json({ success: false, message: "Course not found" });
            return;
        }
        if (course.status !== "draft") {
            res.status(400).json({ success: false, message: "Only draft courses can be deleted. Archive published courses instead." });
            return;
        }
        await course.deleteOne();
        res.status(200).json({ success: true, message: "Course deleted" });
    } catch (err) {
        console.error("[adminDeleteCourse] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/users
 * Paginated user list with optional search (username, name, email).
 */
export const adminGetUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, role, page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, any> = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("username name email avatar role isBanned totalXP level currentStreak lastActive createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error("[adminGetUsers] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/v1/admin/users/:id
 * Full user profile for admin: enrollments, achievements, recent activity.
 */
export const adminGetUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [user, enrollments, achievements] = await Promise.all([
            User.findById(id).select("-__v").lean(),
            Enrollment.find({ userId: id })
                .populate("courseId", "title slug difficulty")
                .sort({ createdAt: -1 })
                .lean(),
            AchievementReceipt.find({ userId: id })
                .sort({ awardedAt: -1 })
                .lean(),
        ]);

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user, enrollments, achievements },
        });
    } catch (err) {
        console.error("[adminGetUser] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Set user role to "user" or "admin".
 */
export const adminSetRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            res.status(400).json({ success: false, message: "role must be 'user' or 'admin'" });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: "username name email role" }
        );
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({ success: true, message: `Role updated to ${role}`, data: user });
    } catch (err) {
        console.error("[adminSetRole] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * PATCH /api/v1/admin/users/:id/ban
 * Toggle ban status. Body: { banned: true|false }
 */
export const adminBanUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { banned } = req.body;
        if (typeof banned !== "boolean") {
            res.status(400).json({ success: false, message: "banned (boolean) is required" });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: banned },
            { new: true, select: "username name email isBanned" }
        );
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: banned ? "User banned" : "User unbanned",
            data: user,
        });
    } catch (err) {
        console.error("[adminBanUser] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/analytics/overview
 * High-level platform health metrics.
 */
export const analyticsOverview = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);

        const [
            totalUsers,
            activeToday,
            activeThisWeek,
            totalEnrollments,
            totalCompletions,
            xpDistributed,
            totalThreads,
            totalReplies,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ lastActive: { $gte: startOfDay } }),
            User.countDocuments({ lastActive: { $gte: startOfWeek } }),
            Enrollment.countDocuments(),
            Enrollment.countDocuments({ completedAt: { $exists: true, $ne: null } }),
            User.aggregate([{ $group: { _id: null, total: { $sum: "$totalXP" } } }]),
            Thread.countDocuments({ isDeleted: false }),
            Reply.countDocuments({ isDeleted: false }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                users: { total: totalUsers, activeToday, activeThisWeek },
                enrollments: { total: totalEnrollments, completed: totalCompletions },
                xpDistributed: xpDistributed[0]?.total ?? 0,
                community: { threads: totalThreads, replies: totalReplies },
            },
        });
    } catch (err) {
        console.error("[analyticsOverview] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/v1/admin/analytics/courses
 * Per-course enrollment, completion, rating, and avg completion time.
 */
export const analyticsCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const courses = await Course.find({ status: { $ne: "draft" } })
            .select("title slug status difficulty totalXP enrollmentCount completionCount rating ratingCount")
            .lean();

        // Avg completion time per course (milliseconds → hours)
        const completionTimes = await Enrollment.aggregate([
            { $match: { completedAt: { $exists: true, $ne: null } } },
            {
                $project: {
                    courseId: 1,
                    durationMs: { $subtract: ["$completedAt", "$createdAt"] },
                },
            },
            {
                $group: {
                    _id: "$courseId",
                    avgCompletionMs: { $avg: "$durationMs" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const timeMap = new Map(
            completionTimes.map((c) => [
                c._id.toString(),
                {
                    avgCompletionHours: Math.round(c.avgCompletionMs / 3600000),
                    completedCount: c.count,
                },
            ])
        );

        const data = courses.map((c) => ({
            ...c,
            completionRate:
                c.enrollmentCount > 0
                    ? Math.round((c.completionCount / c.enrollmentCount) * 100)
                    : 0,
            ...(timeMap.get(c._id.toString()) ?? {}),
        }));

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("[analyticsCourses] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/v1/admin/analytics/users
 * New user signups by day (last 30 days) + level distribution.
 */
export const analyticsUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [signupsByDay, levelDist] = await Promise.all([
            User.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", count: 1, _id: 0 } },
            ]),
            User.aggregate([
                { $group: { _id: "$level", count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $project: { level: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        res.status(200).json({
            success: true,
            data: { signupsByDay, levelDistribution: levelDist },
        });
    } catch (err) {
        console.error("[analyticsUsers] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/v1/admin/analytics/achievements
 * Each achievement: minted count + percentage of user base.
 */
export const analyticsAchievements = async (req: Request, res: Response): Promise<void> => {
    try {
        const [types, totalUsers] = await Promise.all([
            AchievementType.find().lean(),
            User.countDocuments(),
        ]);

        const data = types.map((t) => ({
            key: t.key,
            name: t.name,
            category: t.category,
            mintedCount: t.mintedCount,
            percentOfUsers:
                totalUsers > 0 ? Math.round((t.mintedCount / totalUsers) * 100) : 0,
            isActive: t.isActive,
        }));

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("[analyticsAchievements] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


/**
 * 
 */