import { Router } from "express";
import * as community from "../controllers/community";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { communityWriteLimiter } from "../middlewares/rateLimit";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Forum threads, replies, upvoting, and Q&A features
 */

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /community/threads:
 *   get:
 *     summary: List community threads
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [discussion, question]
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: solved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, top]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of threads
 */
router.get("/threads", community.getThreads);

/**
 * @swagger
 * /community/threads/{id}:
 *   get:
 *     summary: Get a single thread with replies
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: replyPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: replyLimit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thread details and paginated replies
 *       404:
 *         description: Thread not found
 */
router.get("/threads/:id", community.getThread);

// ─── Authenticated writes (rate limited) ─────────────────────────────────────

/**
 * @swagger
 * /community/threads:
 *   post:
 *     summary: Create a new thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               type: { type: string, enum: [discussion, question] }
 *               tags: { type: array, items: { type: string } }
 *               courseId: { type: string }
 *               milestoneId: { type: string }
 *     responses:
 *       201:
 *         description: Thread created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/threads", communityWriteLimiter, authenticate, community.createThread);

/**
 * @swagger
 * /community/threads/{id}:
 *   patch:
 *     summary: Update a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Thread updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Thread not found
 */
router.patch("/threads/:id", communityWriteLimiter, authenticate, community.updateThread);

/**
 * @swagger
 * /community/threads/{id}:
 *   delete:
 *     summary: Delete a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thread deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Thread not found
 */
router.delete("/threads/:id", authenticate, community.deleteThread);

/**
 * @swagger
 * /community/threads/{id}/vote:
 *   post:
 *     summary: Toggle upvote on a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vote toggled
 */
router.post("/threads/:id/vote", communityWriteLimiter, authenticate, community.voteThread);

/**
 * @swagger
 * /community/threads/{id}/replies:
 *   post:
 *     summary: Post a reply to a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *               parentReplyId: { type: string }
 *     responses:
 *       201:
 *         description: Reply posted
 *       403:
 *         description: Thread locked
 */
router.post("/threads/:id/replies", communityWriteLimiter, authenticate, community.createReply);

/**
 * @swagger
 * /community/threads/{id}/replies/{replyId}/vote:
 *   post:
 *     summary: Toggle upvote on a reply
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vote toggled
 */
router.post("/threads/:id/replies/:replyId/vote", communityWriteLimiter, authenticate, community.voteReply);

/**
 * @swagger
 * /community/threads/{id}/replies/{replyId}/accept:
 *   post:
 *     summary: Accept a reply as the answer
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Answer accepted
 */
router.post("/threads/:id/replies/:replyId/accept", authenticate, community.acceptReply);

/**
 * @swagger
 * /community/threads/{id}/replies/{replyId}:
 *   delete:
 *     summary: Delete a reply
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reply deleted
 */
router.delete("/threads/:id/replies/:replyId", authenticate, community.deleteReply);

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /community/threads/{id}/pin:
 *   patch:
 *     summary: Toggle pin status of a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pin toggled
 */
router.patch("/threads/:id/pin", authenticate, requireAdmin, community.pinThread);

/**
 * @swagger
 * /community/threads/{id}/lock:
 *   patch:
 *     summary: Toggle lock status of a thread
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lock toggled
 */
router.patch("/threads/:id/lock", authenticate, requireAdmin, community.lockThread);

export default router;
