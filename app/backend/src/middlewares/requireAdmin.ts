import { Request, Response, NextFunction } from "express";
import { User } from "../models/users";

/**
 * Admin guard — must be authenticated AND have role === "admin".
 * Attach after `authenticate`.
 * 
 * Note: Fetches user from DB to verify role as it's not currently in the JWT.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId);

        if (!user || user.role !== "admin") {
            res.status(403).json({ success: false, message: "Admin access required" });
            return;
        }

        next();
    } catch (err) {
        console.error("[requireAdmin] error:", err);
        res.status(500).json({ success: false, message: "Server error during authorization" });
    }
};
