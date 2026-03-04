import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/users";

interface JWTPayload {
    id: string;
    iat: number;
    exp: number;
}

/**
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 * Returns 401 if the token is missing, invalid, or expired.
 * Returns 403 if the user is banned.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "No token provided" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;

        // Ban check — lightweight select, keeps auth fast
        const user = await User.findById(decoded.id).select("isBanned").lean();
        if (user?.isBanned) {
            res.status(403).json({ success: false, message: "Your account has been suspended" });
            return;
        }

        (req as any).user = { id: decoded.id };
        next();
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            res.status(401).json({ success: false, message: "Token expired" });
        } else {
            res.status(401).json({ success: false, message: "Invalid token" });
        }
    }
};
