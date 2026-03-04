import { Router } from "express";
import * as achievementsController from "../controllers/achievements";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Achievements
 *     description: Achievement types catalog and user receipts
 */

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /achievements/types:
 *   get:
 *     summary: Get all active achievement types (catalog)
 *     tags: [Achievements]
 *     description: >
 *       Returns all AchievementType documents (the "mint authority" accounts).
 *       Public — no authentication required.
 *     responses:
 *       200:
 *         description: List of achievement types grouped by category
 *       500:
 *         description: Server error
 */
router.get("/types", achievementsController.getAchievementTypes);

// ─── Authenticated ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /achievements/me:
 *   get:
 *     summary: Get the authenticated user's earned achievements
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Returns all AchievementReceipt documents (soulbound NFT stubs)
 *       belonging to the authenticated user, each enriched with its
 *       AchievementType metadata.
 *     responses:
 *       200:
 *         description: Array of receipts, newest first
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/me", authenticate, achievementsController.getMyAchievements);

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /achievements/admin/award:
 *   post:
 *     summary: Manually award an achievement to a user (admin only)
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, key]
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               key:
 *                 type: string
 *                 example: "bug_hunter"
 *     responses:
 *       201:
 *         description: Achievement awarded
 *       200:
 *         description: User already has this achievement
 *       400:
 *         description: Missing userId or key
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Achievement type not found or supply cap reached
 *       500:
 *         description: Server error
 */
router.post(
    "/admin/award",
    authenticate,
    requireAdmin,
    achievementsController.adminAwardAchievement
);

export default router;
