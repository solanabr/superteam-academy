import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import * as profileController from "../controllers/profile";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Authenticated user profile
 */

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                           nullable: true
 *                         email:
 *                           type: string
 *                           nullable: true
 *                         name:
 *                           type: string
 *                           nullable: true
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                         twitter:
 *                           type: string
 *                           nullable: true
 *                         github:
 *                           type: string
 *                           nullable: true
 *                         discord:
 *                           type: string
 *                           nullable: true
 *                         website:
 *                           type: string
 *                           nullable: true
 *                         language:
 *                           type: string
 *                           example: en
 *                         theme:
 *                           type: string
 *                           example: dark
 *                         isPublic:
 *                           type: boolean
 *                         level:
 *                           type: integer
 *                         currentStreak:
 *                           type: integer
 *                         longestStreak:
 *                           type: integer
 *                         lastActive:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     xp:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: XP unlocked and credited to the user
 *                           example: 400
 *                         locked:
 *                           type: integer
 *                           description: XP earned from milestones but locked until the full course is completed
 *                           example: 200
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/me", authenticate, profileController.getProfile);

export default router;
