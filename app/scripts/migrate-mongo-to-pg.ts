// app/scripts/migrate-mongo-to-pg.ts
import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- ИМПОРТ

// Эмуляция __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Migration: Mongo -> Postgres");

    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is missing");
    }

    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db();

    // 1. USERS
    console.log("Migrating Users...");
    const users = await db.collection("User").find().toArray();
    const userIdMap = new Map<string, string>(); 

    for (const u of users) {
        const newUser = await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                image: u.image,
                walletAddress: u.walletAddress,
                username: u.username,
                bio: u.bio,
                twitterHandle: u.twitterHandle,
                githubHandle: u.githubHandle,
                role: u.role || "USER",
                xp: u.xp || 0,
                level: u.level || 0,
                streak: u.streak || 0,
                lastLogin: u.lastLogin ? new Date(u.lastLogin) : new Date(),
                lastLessonAt: u.lastLessonAt ? new Date(u.lastLessonAt) : null,
                hasCompletedOnboarding: u.hasCompletedOnboarding || false,
                preferences: u.preferences || undefined,
            }
        });
        userIdMap.set(u._id.toString(), newUser.id);
    }
    console.log(`✅ Migrated ${users.length} users.`);


    console.log("Migrating Accounts...");
    const accounts = await db.collection("Account").find().toArray();
    
    for (const acc of accounts) {
        const uid = userIdMap.get(acc.userId.toString());
        if (uid) {
            await prisma.account.create({
                data: {
                    userId: uid,
                    type: acc.type,
                    provider: acc.provider,
                    providerAccountId: acc.providerAccountId,
                    refresh_token: acc.refresh_token,
                    access_token: acc.access_token,
                    expires_at: acc.expires_at,
                    token_type: acc.token_type,
                    scope: acc.scope,
                    id_token: acc.id_token,
                    session_state: acc.session_state
                }
            });
        }
    }
    console.log(`✅ Migrated accounts.`);

    // 2. COURSES
    console.log("Migrating Courses...");
    const courses = await db.collection("Course").find().toArray();
    const courseIdMap = new Map<string, string>();

    for (const c of courses) {
        const newAuthorId = c.authorId ? userIdMap.get(c.authorId.toString()) : null;
        
        const newCourse = await prisma.course.create({
            data: {
                slug: c.slug,
                title: c.title,
                description: c.description,
                difficulty: c.difficulty,
                xpPerLesson: c.xpPerLesson,
                imageUrl: c.imageUrl,
                status: c.status || "DRAFT",
                reviewComment: c.reviewComment,
                authorId: newAuthorId
            }
        });
        courseIdMap.set(c._id.toString(), newCourse.id);

        const modules = await db.collection("CourseModule").find({ courseId: c._id }).toArray();
        for (const m of modules) {
            const newModule = await prisma.courseModule.create({
                data: {
                    courseId: newCourse.id,
                    title: m.title,
                    order: m.order
                }
            });

            const lessons = await db.collection("Lesson").find({ moduleId: m._id }).toArray();
            for (const l of lessons) {
                await prisma.lesson.create({
                    data: {
                        moduleId: newModule.id,
                        title: l.title,
                        content: l.content,
                        initialCode: l.initialCode,
                        order: l.order,
                        isChallenge: l.isChallenge,
                        validationRules: l.validationRules || undefined
                    }
                });
            }
        }
    }
    console.log(`✅ Migrated courses.`);

    // 3. ACHIEVEMENTS
    console.log("Migrating Achievements...");
    const achievements = await db.collection("Achievement").find().toArray();
    const achievementIdMap = new Map<string, string>();

    for (const a of achievements) {
        const newAch = await prisma.achievement.create({
            data: {
                slug: a.slug,
                name: a.name,
                description: a.description,
                image: a.image,
                xpReward: a.xpReward,
                collectionAddress: a.collectionAddress
            }
        });
        achievementIdMap.set(a._id.toString(), newAch.id);
    }
    
    // 4. CHALLENGES (Новый блок)
    console.log("Migrating Challenges...");
    const challenges = await db.collection("Challenge").find().toArray();
    const challengeIdMap = new Map<string, string>();

    for (const c of challenges) {
        const newCh = await prisma.challenge.create({
            data: {
                title: c.title,
                description: c.description,
                xpReward: c.xpReward,
                targetCount: c.targetCount,
                type: c.type,
                period: c.period || "DAILY",
                expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
                isActive: c.isActive
            }
        });
        challengeIdMap.set(c._id.toString(), newCh.id);
    }

    // 5. RELATIONS
    console.log("Migrating Relations...");

    // UserEnrollment
    const enrollments = await db.collection("UserEnrollment").find().toArray();
    for (const e of enrollments) {
        const uid = userIdMap.get(e.userId.toString());
        if (uid) {
            await prisma.userEnrollment.create({
                data: { userId: uid, courseId: e.courseId, enrolledAt: new Date(e.enrolledAt) }
            });
        }
    }

    // LessonProgress
    const progress = await db.collection("LessonProgress").find().toArray();
    for (const p of progress) {
        const uid = userIdMap.get(p.userId.toString());
        if (uid) {
            await prisma.lessonProgress.create({
                data: { 
                    userId: uid, 
                    courseId: p.courseId, 
                    lessonIndex: p.lessonIndex, 
                    status: p.status, 
                    codeSnippet: p.codeSnippet,
                    completedAt: p.completedAt ? new Date(p.completedAt) : null
                }
            });
        }
    }

    // XPHistory
    const history = await db.collection("XPHistory").find().toArray();
    for (const h of history) {
        const uid = userIdMap.get(h.userId.toString());
        if (uid) {
            await prisma.xPHistory.create({
                data: { 
                    userId: uid, 
                    amount: h.amount, 
                    source: h.source, 
                    description: h.description,
                    createdAt: new Date(h.createdAt)
                }
            });
        }
    }

    // UserAchievement
    const userAchs = await db.collection("UserAchievement").find().toArray();
    for (const ua of userAchs) {
        const uid = userIdMap.get(ua.userId.toString());
        const aid = achievementIdMap.get(ua.achievementId.toString());
        if (uid && aid) {
            await prisma.userAchievement.create({
                data: { 
                    userId: uid, 
                    achievementId: aid, 
                    earnedAt: new Date(ua.earnedAt),
                    mintAddress: ua.mintAddress
                }
            });
        }
    }

    // UserChallenge (Новый блок)
    const userChallenges = await db.collection("UserChallenge").find().toArray();
    for (const uc of userChallenges) {
        const uid = userIdMap.get(uc.userId.toString());
        const cid = challengeIdMap.get(uc.challengeId.toString());
        if (uid && cid) {
            await prisma.userChallenge.create({
                data: {
                    userId: uid,
                    challengeId: cid,
                    currentCount: uc.currentCount,
                    isCompleted: uc.isCompleted,
                    claimedAt: uc.claimedAt ? new Date(uc.claimedAt) : null,
                    dateKey: uc.dateKey
                }
            });
        }
    }
    
    // Discussion (Новый блок)
    const discussions = await db.collection("Discussion").find().toArray();
    const discussionIdMap = new Map<string, string>();
    
    // Сначала создаем родительские комментарии (у которых parentId = null)
    // Потом ответы. Для простоты можно попробовать создать все, и Postgres сам разрулит связи по ID.
    // Но так как ID меняются на CUID, нам нужно сначала создать родителей, запомнить их новые ID, 
    // а потом создать детей, подставив новые ID.
    
    // Сортируем: сначала null parentId
    discussions.sort((a, b) => (a.parentId === null ? -1 : 1));

    for (const d of discussions) {
        const uid = userIdMap.get(d.userId.toString());
        if (uid) {
            // Если есть родитель, ищем его новый ID
            const newParentId = d.parentId ? discussionIdMap.get(d.parentId.toString()) : null;

            // Если родитель был, но его нет в мапе (например удален), пропускаем этот коммент
            if (d.parentId && !newParentId) continue;

            const newDisc = await prisma.discussion.create({
                data: {
                    userId: uid,
                    courseId: d.courseId,
                    lessonIndex: d.lessonIndex,
                    content: d.content,
                    createdAt: new Date(d.createdAt),
                    parentId: newParentId
                }
            });
            discussionIdMap.set(d._id.toString(), newDisc.id);
        }
    }

    console.log("🎉 FULL MIGRATION COMPLETE!");
    await client.close();
    await prisma.$disconnect();
}

main().catch(console.error);