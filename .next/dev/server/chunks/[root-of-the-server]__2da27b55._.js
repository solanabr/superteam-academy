module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/sanity.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sanityClient",
    ()=>sanityClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sanity$2f$client$2f$dist$2f$index$2e$browser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@sanity/client/dist/index.browser.js [app-route] (ecmascript) <locals>");
;
const projectId = ("TURBOPACK compile-time value", "lfz551yj");
const dataset = ("TURBOPACK compile-time value", "production") ?? "production";
const apiVersion = ("TURBOPACK compile-time value", "2025-01-01") ?? "2025-01-01";
const readToken = process.env.SANITY_API_READ_TOKEN;
const sanityClient = ("TURBOPACK compile-time truthy", 1) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sanity$2f$client$2f$dist$2f$index$2e$browser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])({
    projectId,
    dataset,
    apiVersion,
    // Private datasets require a server-side read token.
    // Keep CDN on for public read; disable CDN when token is used.
    useCdn: !readToken,
    token: readToken
}) : "TURBOPACK unreachable";
}),
"[project]/src/services/ContentService.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getContentService",
    ()=>getContentService
]);
/**
 * ContentService
 *
 * Abstraction over course content delivery.
 * Currently reads from local JSON files at /src/content/courses/.
 * Swap for Sanity/Strapi/Contentful by replacing this implementation
 * without changing any component that calls it.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sanity.ts [app-route] (ecmascript)");
;
/**
 * LocalJsonContentService — reads from /src/content/courses/**
 * This is the default implementation used when no CMS env vars are set.
 */ class LocalJsonContentService {
    async getCourses() {
        // In Next.js App Router, dynamic require() works on server; 
        // on client, courses are fetched via the API. This stub always returns 
        // the known list so UI stays consistent.
        return KNOWN_COURSES;
    }
    async getCourse(courseId) {
        return KNOWN_COURSES.find((c)=>c.courseId === courseId) ?? null;
    }
    async getLesson(courseId, lessonIndex) {
        void courseId;
        void lessonIndex;
        // Resolved at build time via static JSON imports in lesson page
        return null;
    }
    async getLessonCount(courseId) {
        return LESSON_COUNTS[courseId] ?? 0;
    }
}
/** Hardcoded manifest — matches the folders in /src/content/courses/ */ const KNOWN_COURSES = [
    {
        courseId: "anchor-101",
        title: {
            en: "Anchor 101",
            pt: "Anchor 101",
            es: "Anchor 101"
        },
        description: {
            en: "Learn Solana program development with Anchor — accounts, instructions, and PDAs from the ground up.",
            pt: "Aprenda desenvolvimento de programas Solana com Anchor — contas, instruções e PDAs do zero.",
            es: "Aprende desarrollo de programas Solana con Anchor — cuentas, instrucciones y PDAs desde cero."
        },
        trackCollection: "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX"
    },
    {
        courseId: "solana-fundamentals",
        title: {
            en: "Solana Fundamentals",
            pt: "Fundamentos do Solana",
            es: "Fundamentos de Solana"
        },
        description: {
            en: "Master the core concepts of Solana: the account model, programs, transactions, and the runtime.",
            pt: "Domine os conceitos centrais do Solana: modelo de contas, programas, transações e o runtime.",
            es: "Domina los conceptos fundamentales de Solana: modelo de cuentas, programas, transacciones y el runtime."
        }
    },
    {
        courseId: "token-2022-deep-dive",
        title: {
            en: "Token-2022 Deep Dive",
            pt: "Mergulho Profundo no Token-2022",
            es: "Inmersión en Token-2022"
        },
        description: {
            en: "Explore the new Solana Token Extensions program: soulbound tokens, transfer hooks, and confidential transfers.",
            pt: "Explore o novo programa Token Extensions do Solana: tokens soulbound, hooks de transferência e transferências confidenciais.",
            es: "Explora el nuevo programa Token Extensions de Solana: tokens soulbound, hooks de transferencia y transferencias confidenciales."
        }
    },
    {
        courseId: "defi-on-solana",
        title: {
            en: "DeFi on Solana",
            pt: "DeFi no Solana",
            es: "DeFi en Solana"
        },
        description: {
            en: "Build decentralized finance apps on Solana: AMMs, liquidity pools, SPL token swaps, and yield farming.",
            pt: "Construa aplicações de finanças descentralizadas no Solana: AMMs, pools de liquidez e yield farming.",
            es: "Construye aplicaciones de finanzas descentralizadas en Solana: AMMs, pools de liquidez y yield farming."
        }
    }
];
const LESSON_COUNTS = {
    "anchor-101": 3,
    "solana-fundamentals": 2,
    "token-2022-deep-dive": 1,
    "defi-on-solana": 1
};
/**
 * SanityContentService — reads from Sanity CMS
 */ class SanityContentService {
    async getCourses() {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"]) return KNOWN_COURSES;
        try {
            const courses = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"].fetch(`*[_type == "course"]{ courseId, title, description, trackCollection }`);
            return courses.length > 0 ? courses : KNOWN_COURSES; // fallback to json if no Sanity data
        } catch (err) {
            console.warn("[ContentService] Sanity getCourses failed, using fallback", err);
            return KNOWN_COURSES;
        }
    }
    async getCourse(courseId) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"]) return KNOWN_COURSES.find((c)=>c.courseId === courseId) ?? null;
        try {
            const course = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"].fetch(`*[_type == "course" && courseId == $courseId][0]{ courseId, title, description, trackCollection }`, {
                courseId
            });
            return course ?? KNOWN_COURSES.find((c)=>c.courseId === courseId) ?? null;
        } catch (err) {
            console.warn("[ContentService] Sanity getCourse failed, using fallback", err);
            return KNOWN_COURSES.find((c)=>c.courseId === courseId) ?? null;
        }
    }
    async getLesson(courseId, lessonIndex) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"]) return null; // We rely on static JSON for now if not using CMS fully
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"].fetch(`*[_type == "lesson" && courseId == $courseId && lessonIndex == $lessonIndex][0]{
          lessonIndex, title, description, xpReward, content, starterCode, videoUrl, tests
        }`, {
                courseId,
                lessonIndex
            });
        } catch (err) {
            console.warn("[ContentService] Sanity getLesson failed", err);
            return null;
        }
    }
    async getLessonCount(courseId) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"]) return LESSON_COUNTS[courseId] ?? 0;
        try {
            const count = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sanity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanityClient"].fetch(`count(*[_type == "lesson" && courseId == $courseId])`, {
                courseId
            });
            return count > 0 ? count : LESSON_COUNTS[courseId] ?? 0;
        } catch (err) {
            console.warn("[ContentService] Sanity getLessonCount failed, using fallback", err);
            return LESSON_COUNTS[courseId] ?? 0;
        }
    }
}
/** Singleton */ let _contentService = null;
function getContentService() {
    if (!_contentService) {
        if ("TURBOPACK compile-time truthy", 1) {
            _contentService = new SanityContentService();
        } else //TURBOPACK unreachable
        ;
    }
    return _contentService;
}
}),
"[project]/src/app/api/course-catalog/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ContentService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ContentService.ts [app-route] (ecmascript)");
;
;
const dynamic = "force-dynamic";
function inferDifficulty(courseId) {
    if (courseId.includes("fundamentals")) return 1;
    if (courseId.includes("anchor")) return 2;
    if (courseId.includes("defi")) return 3;
    return 2;
}
function inferXpPerLesson(courseId) {
    if (courseId.includes("fundamentals")) return 100;
    if (courseId.includes("anchor")) return 120;
    if (courseId.includes("defi")) return 150;
    return 100;
}
async function GET() {
    const service = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ContentService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getContentService"])();
    const courses = await service.getCourses();
    const items = await Promise.all(courses.map(async (c, idx)=>({
            courseId: c.courseId,
            lessonCount: await service.getLessonCount(c.courseId),
            difficulty: inferDifficulty(c.courseId),
            xpPerLesson: inferXpPerLesson(c.courseId),
            trackId: idx + 1,
            trackLevel: 1,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
            totalCompletions: 0,
            totalEnrollments: 0,
            isActive: true
        })));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        source: "content-service",
        courses: items
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2da27b55._.js.map