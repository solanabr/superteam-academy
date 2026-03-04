import { Router } from "express";
import * as authController from "../controllers/auth";
import { authLimiter } from "../middlewares/rateLimit";

const router = Router();

// Rate limiting applied to every auth route
router.use(authLimiter);

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and wallet verification
 */

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from the client
 *     responses:
 *       200:
 *         description: Login successful
 *       201:
 *         description: Account created and login successful
 *       400:
 *         description: Missing idToken
 *       401:
 *         description: Invalid Google token
 *       500:
 *         description: Server error
 */
router.post("/google", authController.googleAuth);

/**
 * @swagger
 * /auth/github:
 *   post:
 *     summary: Authenticate with GitHub
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: GitHub OAuth code
 *     responses:
 *       200:
 *         description: Login successful
 *       201:
 *         description: Account created and login successful
 *       400:
 *         description: Missing code
 *       401:
 *         description: GitHub authentication failed
 *       500:
 *         description: Server error
 */
router.post("/github", authController.githubAuth);

/**
 * @swagger
 * /auth/wallet/nonce:
 *   post:
 *     summary: Get a nonce for wallet verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicKey
 *             properties:
 *               publicKey:
 *                 type: string
 *                 description: Solana public key
 *     responses:
 *       200:
 *         description: Nonce generated successfully
 *       400:
 *         description: Missing or invalid public key
 *       500:
 *         description: Server error
 */
router.post("/wallet/nonce", authController.getNonce);

/**
 * @swagger
 * /auth/wallet/verify:
 *   post:
 *     summary: Verify wallet signature and login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicKey
 *               - signature
 *               - nonce
 *             properties:
 *               publicKey:
 *                 type: string
 *                 description: Solana public key
 *               signature:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Message signature (array of bytes)
 *               nonce:
 *                 type: string
 *                 description: The nonce provided by /wallet/nonce
 *     responses:
 *       200:
 *         description: Login successful
 *       201:
 *         description: Account created and login successful
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Signature verification failed or nonce expired
 *       500:
 *         description: Server error
 */
router.post("/wallet/verify", authController.verifyWallet);

export default router;
