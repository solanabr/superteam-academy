import { Request, Response } from "express";
import mongoose from "mongoose";
import { Course } from "../models/courses";
import { Enrollment } from "../models/enrollment";
import { MilestoneProgress } from "../models/milestoneProgress";
import { User } from "../models/users";
import { updateStreak } from "../services/streak";
import { getLevel } from "../services/gamification";
import {
  checkProgressAchievements,
  checkSkillAchievements,
  checkPerfectScore,
} from "../services/achievements";
import { xpMinter } from '../services/onchain/xp-minter.service';


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
 * Code challenges are graded by matching user output to expected output.j
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

    // Update streak and award daily XP bonuses
    let streakResult = { xpAwarded: 0, currentStreak: 0, milestoneReached: null as number | null };
    try {
      streakResult = await updateStreak(userId);
    } catch (streakErr) {
      console.error("[completeMilestone] streak update failed:", streakErr);
    }

    // Award challenge XP for first-time code_challenge pass
    let challengeXP = 0;
    if (test.type === "code_challenge" && passed) {
      const existingPass = progress.testAttempts.find(
        (a) => a.testId.toString() === testId && a.passed
      );
      // Only first-time pass awards XP (attempts === 1 means this is the first pass)
      const isFirstPass =
        existingAttemptIndex === -1 ||
        (existingAttemptIndex > -1 &&
          progress.testAttempts[existingAttemptIndex].attempts === 1 &&
          progress.testAttempts[existingAttemptIndex].passed);
      if (isFirstPass) {
        challengeXP = 25;
        const user = await User.findById(userId);
        if (user) {
          user.totalXP = (user.totalXP || 0) + challengeXP;
          user.level = getLevel(user.totalXP);
          await user.save();
        }
      }
    }

    // Perfect score achievement — 100% on first attempt
    if (score === 100) {
      const attempt = progress.testAttempts.find((a) => a.testId.toString() === testId);
      if (attempt && attempt.attempts === 1) {
        checkPerfectScore(userId).catch((err) =>
          console.error("[completeMilestone] perfect score check failed:", err)
        );
      }
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

      // Check progress + skill achievements on course completion
      const completedEnrollments = await Enrollment.find({
        userId,
        completedAt: { $exists: true, $ne: null },
      })
        .populate<{ courseId: { topic: string } }>("courseId", "topic")
        .lean();

      const completedTopics = completedEnrollments
        .map((e) => (e.courseId as any)?.topic)
        .filter(Boolean);

      checkProgressAchievements(userId).catch((err) =>
        console.error("[completeMilestone] progress achievement check failed:", err)
      );
      checkSkillAchievements(userId, completedTopics).catch((err) =>
        console.error("[completeMilestone] skill achievement check failed:", err)
      );
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
        xpAwarded: streakResult.xpAwarded + challengeXP,
        streakBonus: streakResult.xpAwarded,
        challengeXP,
        currentStreak: streakResult.currentStreak,
        streakMilestoneReached: streakResult.milestoneReached,
      },
    });
  } catch (error) {
    console.error("Complete milestone error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Claim XP ─────────────────────────────────────────────────────────────────

const USE_ONCHAIN_XP = process.env.USE_ONCHAIN_XP === 'true';

/**
 * POST /courses/:slug/milestones/:milestoneId/claim-xp
 * User manually claims XP for a completed milestone.
 * XP must be unlocked (course fully complete) and not already claimed.
 * Credits xpReward to user.totalXP and mints on-chain if wallet connected.
 */
export const claimMilestoneXP = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { slug, milestoneId } = req.params;

    // Find course
    const course = await Course.findOne({ slug });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Find milestone progress
    const progress = await MilestoneProgress.findOne({
      userId,
      courseId: course._id,
      milestoneId,
    });

    if (!progress) {
      res.status(404).json({ success: false, message: "Milestone progress not found" });
      return;
    }

    // Validate XP is unlocked
    if (!progress.isXPUnlocked) {
      res.status(403).json({
        success: false,
        message: "XP is locked — complete all course milestones first",
      });
      return;
    }

    // Check if already claimed
    if (progress.isXPClaimed) {
      res.status(400).json({
        success: false,
        message: "XP already claimed for this milestone",
        data: {
          alreadyClaimed: true,
          claimedAt: progress.xpClaimedAt,
          txSignature: progress.onchainTxSignature,
        },
      });
      return;
    }

    // Get user
    const user = await User.findById(userId).populate('wallets');
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Mark as claimed in progress (do this FIRST to prevent double-claims)
    progress.isXPClaimed = true;
    progress.xpClaimedAt = new Date();

    let onchainResult = null;
    let mintSuccess = false;

    // Attempt on-chain minting if enabled and user has wallet
    if (USE_ONCHAIN_XP && user.wallets && user.wallets.length > 0) {
      try {
        // Find primary wallet or use first one
        const primaryWallet = user.wallets.find((w: any) => w.isPrimary) || user.wallets[0];
        
        progress.mintStatus = 'pending';
        await progress.save(); // Save pending status
        
        console.log(`Minting ${progress.xpReward} XP on-chain to ${primaryWallet.publicKey}...`);
        
        // Mint XP tokens on-chain
        onchainResult = await xpMinter.mintXP(primaryWallet.publicKey, progress.xpReward);
        
        // Update progress with transaction details
        progress.onchainTxSignature = onchainResult.signature;
        progress.onchainMintedAt = new Date();
        progress.mintStatus = 'success';
        mintSuccess = true;
        
        console.log(`✅ On-chain mint successful: ${onchainResult.signature}`);
      } catch (error: any) {
        console.error('On-chain minting failed:', error);
        
        // Record the error but don't fail the whole request
        progress.mintStatus = 'failed';
        progress.mintError = error.message || 'Unknown minting error';
        
        // Fallback: We'll still credit XP in database
        console.log('⚠️ Falling back to database XP tracking');
      }
    } else {
      progress.mintStatus = 'not_attempted';
      console.log('⚠️ On-chain minting disabled or no wallet connected');
    }

    await progress.save();

    // Credit XP to user in database (always do this as backup)
    user.totalXP += progress.xpReward;
    user.level = Math.floor(Math.sqrt(user.totalXP / 100));
    await user.save();

    // Prepare response
    const response: any = {
      success: true,
      message: `${progress.xpReward} XP claimed! 🎉`,
      data: {
        xpClaimed: progress.xpReward,
        totalXP: user.totalXP,
        level: user.level,
        onchain: {
          attempted: USE_ONCHAIN_XP && user.wallets?.length > 0,
          success: mintSuccess,
          signature: onchainResult?.signature,
          explorerUrl: onchainResult?.signature 
            ? `https://explorer.solana.com/tx/${onchainResult.signature}?cluster=devnet`
            : null,
        },
      },
    };

    // Add warning if on-chain failed but DB succeeded
    if (USE_ONCHAIN_XP && user.wallets?.length > 0 && !mintSuccess) {
      response.warning = 'On-chain minting failed. XP recorded in database. Contact support if issue persists.';
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Claim XP error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
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
    let lessonXP = 0;
    if (!progress.completedLessons.some((id) => id.equals(lessonObjectId))) {
      progress.completedLessons.push(lessonObjectId);
      await progress.save();

      // Award lesson XP (first completion only)
      lessonXP = 10;
      const user = await User.findById(userId);
      if (user) {
        user.totalXP = (user.totalXP || 0) + lessonXP;
        user.level = getLevel(user.totalXP);
        await user.save();
      }
    } else {
      await progress.save();
    }

    // Update streak — counts lesson completion activity
    let streakResultLesson = { xpAwarded: 0, currentStreak: 0, milestoneReached: null as number | null };
    try {
      streakResultLesson = await updateStreak(userId);
    } catch (streakErr) {
      console.error("[completeLesson] streak update failed:", streakErr);
    }

    // Check progress achievements (fire-and-forget)
    checkProgressAchievements(userId).catch((err) =>
      console.error("[completeLesson] achievement check failed:", err)
    );

    res.status(200).json({
      success: true,
      message: "Lesson marked as complete",
      data: {
        completedLessons: progress.completedLessons,
        xpAwarded: lessonXP + streakResultLesson.xpAwarded,
        lessonXP,
        streakBonus: streakResultLesson.xpAwarded,
        currentStreak: streakResultLesson.currentStreak,
        streakMilestoneReached: streakResultLesson.milestoneReached,
      },
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getCertificateDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }
    
    const enrollment = await Enrollment.findOne({ userId: (req as any).user.id, courseId: course._id });
    if (!enrollment) {
      res.status(403).json({ success: false, message: "You are not enrolled in this course" });
      return;
    }

    if (!enrollment.completedAt) {
      res.status(403).json({ success: false, message: "You have not completed this course" });
      return;
    }

    const certificate = {
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      completedAt: enrollment.completedAt,
    }
    
    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Get certificate details error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export const getCourseBySanityId = async (req: Request, res: Response) => {
  try {
    const { sanityId } = req.params;
    const course = await Course.findOne({ sanityId });
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }
    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Get course by sanity id error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
