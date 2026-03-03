import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import GoogleAuthService from "../services/googleAuth";
import GithubAuthService from "../services/githubAuth";
import WalletAuthService from "../services/walletAuth";

import { User } from "../models/users";
import { GoogleAuth } from "../models/googleAuth";
import { GithubAuth } from "../models/githubAuth";
import { Nonce } from "../models/nonce";
import { WalletAuth } from "../models/walletAuth";


const signToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
};

/**
 * POST /auth/google
 * Body: { idToken: string }
 *
 * Handles both sign-up and sign-in with Google.
 * If user doesn't exist, creates a new account using Google profile data.
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ success: false, message: "Google ID token is required" });
      return;
    }

    // 1. Verify the token with Google
    const googleResult = await GoogleAuthService.verifySignInToken(idToken);

    if (!googleResult.success || !googleResult.data) {
      res.status(401).json({ success: false, message: googleResult.error || "Invalid Google token" });
      return;
    }

    const { googleId, email, name, givenName, picture } = googleResult.data;

    // 2. Check if this Google account is already linked
    let googleAuthRecord = await GoogleAuth.findOne({ googleId });

    // 3a. Existing Google user — just log them in
    if (googleAuthRecord) {
      const user = await User.findById(googleAuthRecord.userId);

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      // Update last active
      user.lastActive = new Date();
      await user.save();

      const token = signToken(user._id.toString());

      res.status(200).json({
        success: true,
        message: "Logged in with Google",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          username: user.username,
          totalXP: user.totalXP,
          level: user.level,
        },
      });
      return;
    }

    // 3b. Google account not linked — check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // 4. No user at all — create a brand new one from Google data
      user = await User.create({
        email,
        name,
        // Build a default username from their first name + random suffix
        username: `${givenName.toLowerCase().replace(/\s+/g, "")}_${Math.random().toString(36).slice(2, 7)}`,
        avatar: picture,
        lastActive: new Date(),
      });
    }

    // 5. Link the Google account to this user (new or existing)
    await GoogleAuth.create({
      userId: user._id,
      googleId,
      email,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: user ? "Google account linked and logged in" : "Account created with Google",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        username: user.username,
        totalXP: user.totalXP,
        level: user.level,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


/**
 * POST /auth/github
 * Body: { code: string }
 *
 * Handles both sign-up and sign-in with GitHub.
 * If user doesn't exist, creates a new account using GitHub profile data.
 */
export const githubAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: "GitHub OAuth code is required" });
      return;
    }

    // 1. Exchange code for GitHub profile
    const githubResult = await GithubAuthService.verifyCode(code);

    if (!githubResult.success || !githubResult.data) {
      res.status(401).json({ success: false, message: githubResult.error || "GitHub authentication failed" });
      return;
    }

    const { githubId, username, email, name, avatar, bio, twitterUsername } = githubResult.data;

    // 2. Check if this GitHub account is already linked
    let githubAuthRecord = await GithubAuth.findOne({ githubId });

    // 3a. Existing GitHub user — just log them in
    if (githubAuthRecord) {
      const user = await User.findById(githubAuthRecord.userId);

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      user.lastActive = new Date();
      await user.save();

      const token = signToken(user._id.toString());

      res.status(200).json({
        success: true,
        message: "Logged in with GitHub",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          username: user.username,
          totalXP: user.totalXP,
          level: user.level,
          role: user.role,
        },
      });
      return;
    }

    // 3b. GitHub not linked — check if a user with this email already exists
    let user = email ? await User.findOne({ email }) : null;

    if (!user) {
      // 4. Create a brand new user from GitHub profile data
      user = await User.create({
        email,
        name,
        username: `${username.toLowerCase().replace(/\s+/g, "")}_${Math.random().toString(36).slice(2, 7)}`,
        avatar,
        bio,
        ...(twitterUsername && { twitter: `https://twitter.com/${twitterUsername}` }),
        ...(githubResult.data.blog && { website: githubResult.data.blog }),
        lastActive: new Date(),
      });
    }

    // 5. Link the GitHub account to this user
    await GithubAuth.create({
      userId: user._id,
      githubId,
      username,
      email,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Account created with GitHub",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        username: user.username,
        totalXP: user.totalXP,
        level: user.level,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


/**
 * POST /auth/wallet/nonce
 * Body: { publicKey: string }
 *
 * Generates a nonce for the given wallet address.
 * Nonce expires in 5 minutes — stored in MongoDB with TTL.
 * Frontend uses this nonce to build and sign the message.
 */
export const getNonce = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      res.status(400).json({ success: false, message: "Public key is required" });
      return;
    }

    // Validate it's actually a Solana public key
    if (!WalletAuthService.isValidPublicKey(publicKey)) {
      res.status(400).json({ success: false, message: "Invalid Solana public key" });
      return;
    }

    // Generate a secure random nonce
    const nonce = crypto.randomBytes(32).toString("hex");

    // Nonce expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert — if a nonce already exists for this wallet, replace it
    await Nonce.findOneAndUpdate(
      { publicKey },
      { nonce, expiresAt },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      nonce,
      message: `Sign in to SolLearn\nNonce: ${nonce}`,
      expiresAt,
    });
  } catch (error) {
    console.error("Nonce generation error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/wallet/verify
 * Body: { publicKey: string, signature: number[], nonce: string }
 *
 * Verifies the signed message, then finds or creates the user.
 * Wallet address is the identity — no email required.
 */
export const verifyWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicKey, signature, nonce } = req.body;

    // 1. Basic validation
    if (!publicKey || !signature || !nonce) {
      res.status(400).json({ success: false, message: "publicKey, signature and nonce are required" });
      return;
    }

    if (!Array.isArray(signature)) {
      res.status(400).json({ success: false, message: "Signature must be an array of numbers" });
      return;
    }

    // 2. Check nonce exists and hasn't expired
    const nonceRecord = await Nonce.findOne({ publicKey });

    if (!nonceRecord) {
      res.status(401).json({ success: false, message: "Nonce not found — request a new one" });
      return;
    }

    if (nonceRecord.nonce !== nonce) {
      res.status(401).json({ success: false, message: "Nonce mismatch" });
      return;
    }

    if (new Date() > nonceRecord.expiresAt) {
      await Nonce.deleteOne({ publicKey });
      res.status(401).json({ success: false, message: "Nonce expired — request a new one" });
      return;
    }

    // 3. Verify the signature
    const verification = WalletAuthService.verifySignature({ publicKey, signature, nonce });

    if (!verification.success) {
      res.status(401).json({ success: false, message: verification.error });
      return;
    }

    // 4. Delete the nonce — one-time use only (prevents replay attacks)
    await Nonce.deleteOne({ publicKey });

    // 5. Check if this wallet is already linked to a user
    let walletRecord = await WalletAuth.findOne({ publicKey });

    if (walletRecord) {
      // Existing wallet user — log them in
      const user = await User.findById(walletRecord.userId);

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      user.lastActive = new Date();
      await user.save();

      const token = signToken(user._id.toString());

      res.status(200).json({
        success: true,
        message: "Logged in with wallet",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          username: user.username,
          totalXP: user.totalXP,
          level: user.level,
        },
      });
      return;
    }

    // 6. New wallet — create a brand new user
    // Wallet address is the identity, no email needed
    const user = await User.create({
      username: `sol_${publicKey.slice(0, 6).toLowerCase()}_${Math.random().toString(36).slice(2, 6)}`,
      lastActive: new Date(),
    });

    // 7. Link the wallet — first wallet is always primary
    await WalletAuth.create({
      userId: user._id,
      publicKey,
      isPrimary: true,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Account created with wallet",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        username: user.username,
        totalXP: user.totalXP,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Wallet verify error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};