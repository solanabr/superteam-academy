import { Request, Response } from "express";
import mongoose from "mongoose";
import { Course } from "../models/courses";
import { Enrollment } from "../models/enrollment";
import { MilestoneProgress } from "../models/milestoneProgress";
import { User } from "../models/users";
import { updateStreak } from "../services/streak";

// ─── Admin: Create Course ─────────────────────────────────────────────────────

/**
 * POST /admin/courses
 * Creates a new course. Must have at least 1 milestone.
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
      certificate,
    } = req.body;

    // Validate exactly 5 milestones
    if (!milestones || milestones.length < 1) {
      res.status(400).json({
        success: false,
        message: "A course must have at least 1 milestone",
      });
      return;
    }

    // Validate each milestone has at least 1 lesson and 1 test
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];

      if (!milestone.lessons || milestone.lessons.length === 0) {
        res.status(400).json({
          success: false,
          message: `Milestone ${i + 1} must have at least 1 lesson`,
        });
        return;
      }

      // if (milestone.lessons.length > 5) {
      //   res.status(400).json({
      //     success: false,
      //     message: `Milestone ${i + 1} cannot have more than 5 lessons`,
      //   });
      //   return;
      // }

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
 * Returns full course with milestones, lessons and tests.
 * Includes detailed stats and user reviews.
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

    // Derived stats
    let totalLessons = 0;
    course.milestones.forEach(m => totalLessons += m.lessons.length);

    // Fetch reviews (top 10 recent)
    const recentReviews = await Enrollment.find({
      courseId: course._id,
      rating: { $exists: true },
    })
      .sort({ ratedAt: -1 })
      .limit(10)
      .populate("userId", "name avatar"); // Assuming User has name and avatar

    const formattedReviews = recentReviews.map(r => ({
      user: (r.userId as any).name,
      avatar: (r.userId as any).avatar,
      rating: r.rating,
      comment: r.comment,
      ratedAt: r.ratedAt,
    }));

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
        course: {
          ...course.toObject(),
          milestoneCount: course.milestones.length,
          lessonCount: totalLessons,
        },
        reviews: formattedReviews,
        enrollment,
        milestoneProgress,
      },
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /courses/:slug/rate
 * Allows users who have completed the course to rate and review it.
 * Updates Course.rating and Course.ratingCount denormalized fields.
 */
export const rateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      return;
    }

    const course = await Course.findOne({ slug, status: "published" });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    if (!enrollment || !enrollment.completedAt) {
      res.status(403).json({
        success: false,
        message: "You must complete the course before rating it",
      });
      return;
    }

    const isFirstTimeRating = !enrollment.rating;
    const oldRating = enrollment.rating || 0;

    // Update enrollment
    enrollment.rating = rating;
    enrollment.comment = comment;
    enrollment.ratedAt = new Date();
    await enrollment.save();

    // Update course average rating
    // Logic: ((currentRating * ratingCount) - oldRating + newRating) / newRatingCount
    let newRatingCount = course.ratingCount;
    if (isFirstTimeRating) {
      newRatingCount += 1;
    }

    const currentRatingTotal = course.rating * course.ratingCount;
    const updatedRating = (currentRatingTotal - oldRating + rating) / newRatingCount;

    course.rating = Number(updatedRating.toFixed(1));
    course.ratingCount = newRatingCount;
    await course.save();

    res.status(200).json({
      success: true,
      message: "Thank you for your rating!",
      data: { rating: course.rating, ratingCount: course.ratingCount },
    });
  } catch (error) {
    console.error("Rate course error:", error);
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
 * Body: { testId, quizAnswers?, codeResults? }
 *
 * Performs backend grading of a test attempt.
 * Quizzes are graded by comparing selected options to the correct ones.
 * Code challenges are graded by matching user output to expected output.
 *
 * A milestone is considered complete if the cumulative weighted score 
 * (Sum of (BestScore % * TestPoints)) across all tests in the milestone is >= 80.
 * If ALL 5 milestones are complete, the course is marked as complete.
 */
export const completeMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId } = req.params;
    const { testId, quizAnswers, codeResults } = req.body;

    if (!testId) {
      res.status(400).json({ success: false, message: "testId is required" });
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

    // Find the specific test
    const test = milestone.tests.find((t) => t._id?.toString() === testId);
    if (!test) {
      res.status(404).json({ success: false, message: "Test not found" });
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

    // MAKE SURE THE USER HAS COMPLETED ALL LESSONS IN THIS MILESTONE
    if (milestone.lessons.length !== progress.completedLessons.length) {
      res.status(400).json({ success: false, message: "You have not completed all lessons in this milestone" });
      return;
    }

    // --- Backend Grading ---
    let score = 0;

    if (test.type === "quiz") {
      if (!quizAnswers || !Array.isArray(quizAnswers)) {
        res.status(400).json({ success: false, message: "quizAnswers array is required for quiz tests" });
        return;
      }

      if (!test.questions || test.questions.length === 0) {
        score = 100; // No questions means automatic pass
      } else {
        let correctCount = 0;
        test.questions.forEach((q) => {
          const answer = quizAnswers.find((a: any) => a.questionId === q._id?.toString());
          if (answer) {
            const option = q.options.find((opt) => opt.label === answer.selectedLabel);
            if (option?.isCorrect) {
              correctCount++;
            }
          }
        });
        score = Math.round((correctCount / test.questions.length) * 100);
      }
    } else if (test.type === "code_challenge") {
      if (!codeResults || !Array.isArray(codeResults)) {
        res.status(400).json({ success: false, message: "codeResults array is required for code challenges" });
        return;
      }

      const challenge = test.codeChallenge;
      if (!challenge || !challenge.testCases || challenge.testCases.length === 0) {
        score = 100;
      } else {
        let passedCases = 0;
        challenge.testCases.forEach((tc) => {
          const result = codeResults.find((r: any) => r.input === tc.input);
          // Case-insensitive trim match for robustness
          if (result && result.output?.toString().trim() === tc.expectedOutput.trim()) {
            passedCases++;
          }
        });
        score = Math.round((passedCases / challenge.testCases.length) * 100);
      }
    }

    const passed = score >= test.passThreshold;

    // --- Update Progress ---
    const existingAttemptIndex = progress.testAttempts.findIndex(
      (a) => a.testId.toString() === testId
    );

    if (existingAttemptIndex > -1) {
      // Keep best score
      if (score > progress.testAttempts[existingAttemptIndex].score) {
        progress.testAttempts[existingAttemptIndex].score = score;
        progress.testAttempts[existingAttemptIndex].passed = passed;
      }
      progress.testAttempts[existingAttemptIndex].attempts += 1;
      progress.testAttempts[existingAttemptIndex].lastAttemptAt = new Date();
    } else {
      progress.testAttempts.push({
        testId: new mongoose.Types.ObjectId(testId),
        score,
        passed,
        attempts: 1,
        lastAttemptAt: new Date(),
      });
    }

    // --- Weighted Scoring Logic ---
    // Total score = Sum(BestScore% * TestPoints)
    // Milestone passes if TotalScore >= 80 (standardized threshold)
    let cumulativeScore = 0;
    milestone.tests.forEach((t) => {
      const attempt = progress!.testAttempts.find((a) => a.testId.toString() === t._id?.toString());
      if (attempt) {
        cumulativeScore += (attempt.score / 100) * (t.points || 100);
      }
    });

    const isMilestonePass = cumulativeScore >= 80;

    if (isMilestonePass && !progress.allTestsPassed) {
      progress.allTestsPassed = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    // Update streak
    try {
      await updateStreak(userId);
    } catch (streakErr) {
      console.error("[completeMilestone] streak update failed:", streakErr);
    }

    // Check if ALL 5 milestones are now complete
    const allMilestoneProgress = await MilestoneProgress.find({
      userId,
      courseId: course._id,
    });

    const courseComplete = allMilestoneProgress.every((mp) => mp.allTestsPassed);

    if (courseComplete && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      await enrollment.save();

      await MilestoneProgress.updateMany(
        { userId, courseId: course._id },
        { isXPUnlocked: true }
      );

      await Course.findByIdAndUpdate(course._id, {
        $inc: { completionCount: 1 },
      });
    }

    res.status(200).json({
      success: true,
      message: passed
        ? isMilestonePass
          ? courseComplete
            ? "Milestone complete! Course complete! XP unlocked 🎉"
            : "Milestone complete!"
          : "Test passed! Complete other tests in this milestone to proceed."
        : "Test score lower than required. You can retake it anytime.",
      data: {
        score,
        passed,
        cumulativeScore,
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
        message: "XP is locked — complete all course milestones first",
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

// ─── Get Test ─────────────────────────────────────────────────────────────────

/**
 * GET /courses/:slug/milestones/:milestoneId/tests/:testId
 * Returns the full test document (questions, passThreshold, etc.) directly
 * from the DB so the frontend never has to rely on localStorage data,
 * which could be tampered with.
 *
 * Requires the user to be enrolled in the course.
 */
export const getTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId, testId } = req.params;

    // Fetch the published course
    const course = await Course.findOne({ slug, status: "published" });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Verify the user is enrolled
    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    if (!enrollment) {
      res.status(403).json({ success: false, message: "You are not enrolled in this course" });
      return;
    }

    // Find the milestone
    const milestone = course.milestones.find(
      (m) => m._id?.toString() === milestoneId
    );
    if (!milestone) {
      res.status(404).json({ success: false, message: "Milestone not found" });
      return;
    }

    // Find the test within the milestone
    const test = milestone.tests.find(
      (t) => t._id?.toString() === testId
    );
    if (!test) {
      res.status(404).json({ success: false, message: "Test not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: { test },
    });
  } catch (error) {
    console.error("Get test error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Complete Lesson ──────────────────────────────────────────────────────────

/**
 * POST /courses/:slug/milestones/:milestoneId/lessons/:lessonId/complete
 * Marks a lesson as complete for the authenticated user.
 */
export const completeLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId, lessonId } = req.params;

    const course = await Course.findOne({ slug, status: "published" });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    if (!enrollment) {
      res.status(403).json({ success: false, message: "You are not enrolled in this course" });
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

    const lessonObjectId = new mongoose.Types.ObjectId(lessonId);

    // Add to completedLessons only if not already present
    if (!progress.completedLessons.some((id) => id.equals(lessonObjectId))) {
      progress.completedLessons.push(lessonObjectId);
      await progress.save();
    }

    // Update streak — counts lesson completion activity
    try {
      await updateStreak(userId);
    } catch (streakErr) {
      console.error("[completeLesson] streak update failed:", streakErr);
    }

    res.status(200).json({
      success: true,
      message: "Lesson marked as complete",
      data: { completedLessons: progress.completedLessons },
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
