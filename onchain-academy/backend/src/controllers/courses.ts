import { Request, Response } from "express";
import { Course } from "../models/courses";
import { Enrollment } from "../models/enrollment";
import { MilestoneProgress } from "../models/milestoneProgress";
import { User } from "../models/users";

// ─── Admin: Create Course ─────────────────────────────────────────────────────

/**
 * POST /admin/courses
 * Creates a new course. Must have exactly 5 milestones.
 * totalXP is auto-calculated from milestone xpRewards in the pre-save hook.
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      tags,
      difficulty,
      topic,
      milestones,
      author,
      sanityId,
    } = req.body;

    // Validate exactly 5 milestones
    if (!milestones || milestones.length < 1) {
      res.status(400).json({
        success: false,
        message: "A course must have at least 1 milestone",
      });
      return;
    }

    // Validate each milestone has at least 1 resource and 1 test
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];

      if (!milestone.resources || milestone.resources.length === 0) {
        res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} must have at least 1 resource`,
        });
        return; 
      }

      if (milestone.resources.length > 5) {
        res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} cannot have more than 5 resources`,
        });
        return;
      }

      if (!milestone.tests || milestone.tests.length === 0) {
        res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} must have at least 1 test`,
        });
        return;
      }

      if (!milestone.xpReward || milestone.xpReward <= 0) {
        res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} must have an xpReward greater than 0`,
        });
        return;
      }

      // Force correct order
      milestone.order = i + 1;
    }

    const course = await Course.create({
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      tags,
      difficulty,
      topic,
      milestones,
      author,
      sanityId,
      status: "draft", // Always starts as draft
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error: any) {
    // Handle duplicate slug
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "A course with this slug already exists",
      });
      return;
    }
    console.error("Create course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Admin: Publish Course ────────────────────────────────────────────────────

/**
 * PATCH /admin/courses/:slug/publish
 * Changes course status from draft to published.
 */
export const publishCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      { status: "published", publishedAt: new Date() },
      { new: true }
    );

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Course published",
      data: course,
    });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Get All Courses (Catalog) ────────────────────────────────────────────────

/**
 * GET /courses
 * Returns published courses with optional filters.
 * Query params: difficulty, topic, search, page, limit
 */
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      difficulty,
      topic,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const filter: Record<string, any> = { status: "published" };

    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topic = topic;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select(
          "title slug shortDescription thumbnail difficulty topic totalXP duration enrollmentCount author tags status"
        )
        .skip(skip)
        .limit(Number(limit))
        .sort({ publishedAt: -1 }),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Get Single Course ────────────────────────────────────────────────────────

/**
 * GET /courses/:slug
 * Returns full course with milestones, resources and tests.
 * If user is authenticated, also returns their enrollment + milestone progress.
 */
export const getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      status: "published",
    });

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // If user is authenticated, attach their progress
    const userId = (req as any).user?.id;
    let enrollment = null;
    let milestoneProgress = null;

    if (userId) {
      enrollment = await Enrollment.findOne({
        userId,
        courseId: course._id,
      });

      if (enrollment) {
        milestoneProgress = await MilestoneProgress.find({
          userId,
          courseId: course._id,
        }).sort({ milestoneOrder: 1 });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        course,
        enrollment,
        milestoneProgress,
      },
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Enroll in Course ─────────────────────────────────────────────────────────

/**
 * POST /courses/:slug/enroll
 * Enrolls the authenticated user in a course.
 * Creates an Enrollment record + 5 MilestoneProgress records (one per milestone).
 */
export const enrollInCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const course = await Course.findOne({
      slug: req.params.slug,
      status: "published",
    });

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId: course._id,
    });

    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        message: "Already enrolled in this course",
      });
      return;
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId: course._id,
    });

    // Create a MilestoneProgress record for each of the 5 milestones
    const milestoneProgressDocs = course.milestones.map((milestone) => ({
      userId,
      courseId: course._id,
      milestoneId: milestone._id,
      milestoneOrder: milestone.order,
      xpReward: milestone.xpReward,
      testAttempts: [],
      allTestsPassed: false,
      isXPUnlocked: false,
      isXPClaimed: false,
    }));

    await MilestoneProgress.insertMany(milestoneProgressDocs);

    // Increment course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: { enrollment },
    });
  } catch (error) {
    console.error("Enroll error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Complete Milestone ───────────────────────────────────────────────────────

/**
 * POST /courses/:slug/milestones/:milestoneId/complete
 * Body: { testId, score } — score is 0-100
 *
 * Records a test attempt for the milestone.
 * If score >= 80, marks the test as passed.
 * If ALL tests in the milestone are passed, marks the milestone as complete.
 * If ALL 5 milestones are complete, marks the course as complete + unlocks all XP.
 */
export const completeMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId } = req.params;
    const { testId, score } = req.body;

    if (score === undefined || score === null) {
      res.status(400).json({ success: false, message: "Score is required" });
      return;
    }

    if (score < 0 || score > 100) {
      res.status(400).json({ success: false, message: "Score must be between 0 and 100" });
      return;
    }

    // Get the course
    const course = await Course.findOne({ slug, status: "published" });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    if (!enrollment) {
      res.status(403).json({ success: false, message: "You are not enrolled in this course" });
      return;
    }

    // Get the milestone from the course
    const milestone = course.milestones.find(
      (m) => m._id?.toString() === milestoneId
    );
    if (!milestone) {
      res.status(404).json({ success: false, message: "Milestone not found" });
      return;
    }

    // Get this user's progress for this milestone
    let progress = await MilestoneProgress.findOne({
      userId,
      courseId: course._id,
      milestoneId,
    });

    if (!progress) {
      res.status(404).json({ success: false, message: "Milestone progress not found" });
      return;
    }

    const passed = score >= 80;

    // Check if this test was already attempted
    const existingAttemptIndex = progress.testAttempts.findIndex(
      (a) => a.testId.toString() === testId
    );

    if (existingAttemptIndex > -1) {
      // Update existing attempt
      progress.testAttempts[existingAttemptIndex].score = score;
      progress.testAttempts[existingAttemptIndex].passed = passed;
      progress.testAttempts[existingAttemptIndex].attempts += 1;
      progress.testAttempts[existingAttemptIndex].lastAttemptAt = new Date();
    } else {
      // First attempt on this test
      progress.testAttempts.push({
        testId,
        score,
        passed,
        attempts: 1,
        lastAttemptAt: new Date(),
      });
    }

    // Check if ALL tests in this milestone are now passed
    const allTestsPassed = milestone.tests.every((test) =>
      progress!.testAttempts.some(
        (a) => a.testId.toString() === test._id?.toString() && a.passed
      )
    );

    if (allTestsPassed && !progress.allTestsPassed) {
      progress.allTestsPassed = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    // Check if ALL 5 milestones are now complete
    const allMilestoneProgress = await MilestoneProgress.find({
      userId,
      courseId: course._id,
    });

    const courseComplete = allMilestoneProgress.every((mp) => mp.allTestsPassed);

    if (courseComplete && !enrollment.completedAt) {
      // Mark enrollment as complete
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Unlock XP on ALL milestone progress records
      await MilestoneProgress.updateMany(
        { userId, courseId: course._id },
        { isXPUnlocked: true }
      );

      // Increment course completion count
      await Course.findByIdAndUpdate(course._id, {
        $inc: { completionCount: 1 },
      });
    }

    res.status(200).json({
      success: true,
      message: passed
        ? allTestsPassed
          ? courseComplete
            ? "Milestone complete! Course complete! XP unlocked 🎉"
            : "Milestone complete!"
          : "Test passed!"
        : "Test failed — you can retake it anytime",
      data: {
        score,
        passed,
        allTestsPassed: progress.allTestsPassed,
        courseComplete,
        progress,
      },
    });
  } catch (error) {
    console.error("Complete milestone error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Claim XP ─────────────────────────────────────────────────────────────────

/**
 * POST /courses/:slug/milestones/:milestoneId/claim-xp
 * User manually claims XP for a completed milestone.
 * XP must be unlocked (course fully complete) and not already claimed.
 * Credits xpReward to user.totalXP and recalculates their level.
 */
export const claimMilestoneXP = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId } = req.params;

    const course = await Course.findOne({ slug });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const progress = await MilestoneProgress.findOne({
      userId,
      courseId: course._id,
      milestoneId,
    });

    if (!progress) {
      res.status(404).json({ success: false, message: "Milestone progress not found" });
      return;
    }

    if (!progress.isXPUnlocked) {
      res.status(403).json({
        success: false,
        message: "XP is locked — complete all 5 milestones first",
      });
      return;
    }

    if (progress.isXPClaimed) {
      res.status(400).json({
        success: false,
        message: "XP already claimed for this milestone",
      });
      return;
    }

    // Mark as claimed
    progress.isXPClaimed = true;
    progress.xpClaimedAt = new Date();
    await progress.save();

    // Credit XP to user and recalculate level
    // Level formula: level = floor(sqrt(totalXP / 100))
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    user.totalXP += progress.xpReward;
    user.level = Math.floor(Math.sqrt(user.totalXP / 100));
    await user.save();

    res.status(200).json({
      success: true,
      message: `${progress.xpReward} XP claimed! 🎉`,
      data: {
        xpClaimed: progress.xpReward,
        totalXP: user.totalXP,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Claim XP error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};