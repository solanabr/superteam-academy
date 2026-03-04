import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middlewares/auth";
import * as leaderboardController from "../controllers/leaderboard";

const router = Router();

/**
 * Optional auth — attaches user if token present but doesn't block unauthenticated requests.
 */
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authenticate(req, res, next);
    }
    next();
};

/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Global XP rankings
 */

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get the XP leaderboard
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, all]
 *           default: all
 *         description: Filter users by activity period
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     description: >
 *       Public endpoint. If a Bearer token is provided, the response also
 *       includes the authenticated user's rank and stats.
 *     responses:
 *       200:
 *         description: Leaderboard data with rankings and current user position
 *       500:
 *         description: Server error
 */
router.get("/", optionalAuth, leaderboardController.getLeaderboard);

export default router;
