import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import * as dashboardController from "../controllers/dashboard";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Authenticated user dashboard
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get the authenticated user's dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     xp:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         locked:
 *                           type: integer
 *                         level:
 *                           type: integer
 *                         progressPercent:
 *                           type: integer
 *                         nextLevelXP:
 *                           type: integer
 *                     streak:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                         longest:
 *                           type: integer
 *                         activityDates:
 *                           type: array
 *                           items:
 *                             type: string
 *                             format: date
 *                     activeCourses:
 *                       type: array
 *                     recommendedCourses:
 *                       type: array
 *                     recentActivity:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, dashboardController.getDashboard);

export default router;
