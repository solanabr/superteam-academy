import { Router, Request, Response, NextFunction } from "express";
import * as coursesController from "../controllers/courses";
import { authenticate } from "../middlewares/auth";

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

/**
 * Admin guard — must be authenticated AND have role === "admin".
 * Attach after `authenticate`.
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
        res.status(403).json({ success: false, message: "Admin access required" });
        return;
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
 *                 minItems: 5
 *                 maxItems: 5
 *                 description: Must be exactly 5 milestones
 *               author:
 *                 type: object
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
 *         description: Course detail (+ optional progress if authenticated and enrolled)
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
 *               - score
 *             properties:
 *               testId:
 *                 type: string
 *                 description: The _id of the test being attempted
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Score percentage. >= 80 to pass.
 *     responses:
 *       200:
 *         description: Attempt recorded. Response indicates pass/fail and whether the milestone or course is now complete.
 *       400:
 *         description: Invalid score
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

export default router;
