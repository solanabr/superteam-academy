/**
 * scripts/seed-admin.ts
 *
 * Creates (or upserts) an admin User document directly in MongoDB,
 * bypassing all OAuth flows.  Prints the user's JWT so you can use it
 * immediately in Swagger / Postman / etc.
 *
 * Usage:
 *   npx ts-node scripts/seed-admin.ts
 *
 * Env vars read from .env (same file as the main app).
 */

import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../src/models/users";

const ADMIN_NAME = "Admin User";
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = process.argv[2] || "admin@osmos.academy";

async function main() {
    const MONGO_URI = process.env.MONGO_URI;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!MONGO_URI) throw new Error("MONGO_URI is not set in .env");
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Upsert — safe to run multiple times
    const user = await User.findOneAndUpdate(
        { email: ADMIN_EMAIL },
        {
            $setOnInsert: {
                email: ADMIN_EMAIL,
                username: ADMIN_USERNAME,
                name: ADMIN_NAME,
            },
            $set: {
                role: "admin",
            },
        },
        { upsert: true, new: true }
    );

    console.log(`\n👤 Admin user:`);
    console.log(`   id:       ${user._id}`);
    console.log(`   email:    ${user.email}`);
    console.log(`   username: ${user.username}`);
    console.log(`   role:     ${user.role}`);

    // Sign a long-lived JWT (30 days) for immediate use
    const token = jwt.sign(
        { id: user._id.toString() },
        JWT_SECRET,
        { expiresIn: "30d" }
    );

    console.log(`\n🔑 Your admin JWT (valid 30 days):\n`);
    console.log(token);
    console.log("\nPaste this as: Authorization: Bearer <token>\n");

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
