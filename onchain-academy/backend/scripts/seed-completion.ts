import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "../src/models/users";
import { Course } from "../src/models/courses";
import { Enrollment } from "../src/models/enrollment";

const ADMIN_EMAIL = "admin@osmos.academy";
const COURSE_SLUG = "introduction-to-solana-ecosystem";

async function main() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set in .env");

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
        console.error("❌ Admin user not found. Run seed-admin.ts first.");
        await mongoose.disconnect();
        return;
    }

    const course = await Course.findOne({ slug: COURSE_SLUG });
    if (!course) {
        console.error(`❌ Course "${COURSE_SLUG}" not found.`);
        await mongoose.disconnect();
        return;
    }

    const enrollment = await Enrollment.findOneAndUpdate(
        { userId: user._id, courseId: course._id },
        {
            $set: {
                completedAt: new Date(),
                enrolledAt: new Date(Date.now() - 86400000), // 1 day ago
                lastAccessedAt: new Date(),
            }
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Enrollment for user "${user.username}" in course "${course.title}" marked as COMPLETED.`);
    console.log(`   Enrollment ID: ${enrollment._id}`);

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
