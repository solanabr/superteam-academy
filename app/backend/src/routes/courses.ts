import { Router, Request, Response, NextFunction } from "express";
import * as coursesController from "../controllers/courses";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

// ─── Middleware Helpers ───────────────────────────────────────────────────────

/**
 * Soft auth — attaches user to req if token is present, but doesn't block
 * unauthenticated requests. Used for public routes that show extra data when
 * the user is logged in (e.g. GET /courses/:slug shows progress if enrolled).
 */
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authenticate(req, res, next);
    }
    next();
};



// ─── Swagger Tags ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Public course catalog and enrollment
 *   - name: Admin — Courses
 *     description: Admin-only course management
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /courses/admin:
 *   post:
 *     summary: Create a new course (admin only)
 *     tags: [Admin — Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - description
 *               - shortDescription
 *               - difficulty
 *               - topic
 *               - milestones
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *                 description: URL-friendly unique identifier e.g. "intro-to-solana"
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *                 maxLength: 160
 *               thumbnail:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               topic:
 *                 type: string
 *                 enum: [solana-basics, smart-contracts, defi, nfts, tokens, web3-frontend, security, tooling]
 *               milestones:
 *                 type: array
 *                 description: At least 1 milestone required
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [title, xpReward, lessons, tests]
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Getting Started with Solana
 *                     description:
 *                       type: string
 *                     xpReward:
 *                       type: integer
 *                       example: 100
 *                       description: XP awarded when the full course is completed
 *                     lessons:
 *                       type: array
 *                       maxItems: 5
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *                     tests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [title, type]
 *                         properties:
 *                           title:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [quiz, code_challenge]
 *                           passThreshold:
 *                             type: integer
 *                             default: 80
 *                           questions:
 *                             type: array
 *                             description: Required when type=quiz
 *                             items:
 *                               $ref: '#/components/schemas/QuizQuestion'
 *                           codeChallenge:
 *                             description: Required when type=code_challenge
 *                             $ref: '#/components/schemas/CodeChallenge'
 *               author:
 *                 type: object
 *                 required: [name]
 *                 properties:
 *                   name:
 *                     type: string
 *                   avatar:
 *                     type: string
 *                   title:
 *                     type: string
 *               sanityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error (e.g. not exactly 5 milestones, duplicate slug)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post("/admin", authenticate, requireAdmin, coursesController.createCourse);

/**
 * @swagger
 * /courses/admin/{slug}/publish:
 *   patch:
 *     summary: Publish a draft course (admin only)
 *     tags: [Admin — Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course published
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.patch("/admin/:slug/publish", authenticate, requireAdmin, coursesController.publishCourse);

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all published courses (catalog)
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *           enum: [solana-basics, smart-contracts, defi, nfts, tokens, web3-frontend, security, tooling]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search on title, shortDescription, and tags
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated list of published courses
 *       500:
 *         description: Server error
 */
router.get("/", coursesController.getCourses);

/**
 * @swagger
 * /courses/{slug}:
 *   get:
 *     summary: Get a single course by slug
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     description: >
 *       Public endpoint. If a valid Bearer token is provided and the user is
 *       enrolled, the response also includes their `enrollment` and
 *       `milestoneProgress` records.
 *     responses:
 *       200:
 *         description: Course detail with full milestones, lessons, and tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     enrollment:
 *                       nullable: true
 *                       allOf:
 *                         - $ref: '#/components/schemas/Enrollment'
 *                     milestoneProgress:
 *                       nullable: true
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MilestoneProgress'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:slug", optionalAuth, coursesController.getCourseBySlug);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED USER ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /courses/{slug}/enroll:
 *   post:
 *     summary: Enroll the authenticated user in a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrolled successfully. Returns enrollment record.
 *       400:
 *         description: Already enrolled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post("/:slug/enroll", authenticate, coursesController.enrollInCourse);

/**
 * @swagger
 * /courses/{slug}/rate:
 *   post:
 *     summary: Rate and review a course (only after completion)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Great course, learned a lot!"
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Course not completed yet
 *       404:
 *         description: Course or enrollment not found
 *       500:
 *         description: Server error
 */
router.post("/:slug/rate", authenticate, coursesController.rateCourse);

/**
 * @swagger
 * /courses/{slug}/milestones/{milestoneId}/complete:
 *   post:
 *     summary: Submit a test attempt for a milestone
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *             properties:
 *               testId:
 *                 type: string
 *                 description: The _id of the test being attempted
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               quizAnswers:
 *                 type: array
 *                 description: Required when the test type is "quiz"
 *                 example:
 *                   - questionId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                     selectedLabel: "A"
 *                   - questionId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                     selectedLabel: "C"
 *                 items:
 *                   type: object
 *                   required: [questionId, selectedLabel]
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: The _id of the quiz question
 *                       example: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                     selectedLabel:
 *                       type: string
 *                       description: The label of the selected option (e.g. "A", "B")
 *                       example: "A"
 *               codeResults:
 *                 type: array
 *                 description: Required when the test type is "code_challenge"
 *                 example:
 *                   - input: "5"
 *                     output: "25"
 *                   - input: "3"
 *                     output: "9"
 *                 items:
 *                   type: object
 *                   required: [input, output]
 *                   properties:
 *                     input:
 *                       type: string
 *                       description: The test case input that was run
 *                       example: "5"
 *                     output:
 *                       type: string
 *                       description: The actual output produced by the user's code
 *                       example: "25"
 *     responses:
 *       200:
 *         description: Attempt recorded. Response indicates pass/fail and whether the milestone or course is now complete.
 *       400:
 *         description: Missing required fields (e.g. testId, quizAnswers, or codeResults)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Course, milestone, or progress record not found
 *       500:
 *         description: Server error
 */
router.post(
    "/:slug/milestones/:milestoneId/complete",
    authenticate,
    coursesController.completeMilestone
);

/**
 * @swagger
 * /courses/{slug}/milestones/{milestoneId}/claim-xp:
 *   post:
 *     summary: Claim XP for a completed milestone
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     description: >
 *       XP is only claimable once all 5 milestones in the course are complete
 *       (isXPUnlocked = true). Each milestone's XP can only be claimed once.
 *     responses:
 *       200:
 *         description: XP credited to user account. Returns xpClaimed, totalXP, and new level.
 *       400:
 *         description: XP already claimed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: XP is still locked — course not yet complete
 *       404:
 *         description: Course or milestone progress not found
 *       500:
 *         description: Server error
 */
router.post(
    "/:slug/milestones/:milestoneId/claim-xp",
    authenticate,
    coursesController.claimMilestoneXP
);

/**
 * @swagger
 * /courses/{slug}/milestones/{milestoneId}/tests/{testId}:
 *   get:
 *     summary: Get test details (for taking a test)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the test document including questions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Course, milestone, or test not found
 *       500:
 *         description: Server error
 */
router.get(
    "/:slug/milestones/:milestoneId/tests/:testId",
    authenticate,
    coursesController.getTest
);

/**
 * @swagger
 * /courses/{slug}/milestones/{milestoneId}/lessons/{lessonId}/complete:
 *   post:
 *     summary: Mark a lesson as complete
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson marked as complete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Course, milestone, or progress record not found
 *       500:
 *         description: Server error
 */
router.post(
    "/:slug/milestones/:milestoneId/lessons/:lessonId/complete",
    authenticate,
    coursesController.completeLesson
);

/**
 * @swagger
 * /courses/{slug}/certificate:
 *   get:
 *     summary: Get certificate details for a completed course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate details returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled or course not completed
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:slug/certificate", authenticate, coursesController.getCertificateDetails);

/**
 * @swagger
 * /courses/sanity/{sanityId}:
 *   get:
 *     summary: Get a course by its Sanity ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: sanityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course data returned successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/sanity/:sanityId", coursesController.getCourseBySanityId);

export default router;
