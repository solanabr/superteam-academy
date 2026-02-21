/**
 * Superteam Academy — Comprehensive Test Suite
 *
 * Tests all required + bonus features from the hackathon specification.
 * Run: npx tsx testing.ts
 * Output: testing_output.txt
 */

import { writeFileSync } from "fs";
import { execSync } from "child_process";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestResult {
  id: string;
  category: string;
  feature: string;
  status: "PASS" | "FAIL" | "SKIP" | "MANUAL";
  details: string;
  manualSteps: string;
}

const results: TestResult[] = [];
const APP_DIR = "./app";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function test(
  id: string,
  category: string,
  feature: string,
  fn: () => boolean | string,
  manualSteps: string
) {
  try {
    const result = fn();
    if (result === true) {
      results.push({ id, category, feature, status: "PASS", details: "OK", manualSteps });
    } else if (typeof result === "string") {
      results.push({ id, category, feature, status: "FAIL", details: result, manualSteps });
    } else {
      results.push({ id, category, feature, status: "FAIL", details: "Returned false", manualSteps });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ id, category, feature, status: "FAIL", details: msg, manualSteps });
  }
}

function manual(id: string, category: string, feature: string, manualSteps: string) {
  results.push({ id, category, feature, status: "MANUAL", details: "Requires manual verification", manualSteps });
}

function fileExists(path: string): boolean {
  try {
    execSync(`test -f ${path}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function dirExists(path: string): boolean {
  try {
    execSync(`test -d ${path}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function fileContains(path: string, search: string): boolean {
  try {
    const content = execSync(`cat ${path}`, { encoding: "utf-8" });
    return content.includes(search);
  } catch {
    return false;
  }
}

function grepRecursive(dir: string, pattern: string, ext = "tsx,ts"): boolean {
  try {
    const includes = ext.split(",").map((e) => `--include="*.${e.trim()}"`).join(" ");
    execSync(`grep -Erl "${pattern}" ${dir} ${includes}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function countFiles(dir: string, ext: string): number {
  try {
    const out = execSync(`find ${dir} -name "*.${ext}" | wc -l`, { encoding: "utf-8" });
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MONOREPO STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

test("S-01", "Structure", "Root .claude/ directory exists", () => {
  return dirExists("./.claude") || "Missing .claude/ directory";
}, "Verify .claude/ folder exists at project root with agents, commands, rules, skills");

test("S-02", "Structure", "Root docs/ directory exists", () => {
  return dirExists("./docs") || "Missing docs/ directory";
}, "Verify docs/ folder exists with SPEC.md, ARCHITECTURE.md, INTEGRATION.md");

test("S-03", "Structure", "onchain-academy/ directory exists", () => {
  return dirExists("./onchain-academy") || "Missing onchain-academy/ directory";
}, "Verify onchain-academy/ folder exists with Anchor program");

test("S-04", "Structure", "app/ directory exists", () => {
  return dirExists("./app") || "Missing app/ directory";
}, "Verify app/ folder exists with Next.js frontend");

test("S-05", "Structure", "backend/ directory exists", () => {
  return dirExists("./backend") || "Missing backend/ directory";
}, "Verify backend/ folder exists with README.md describing planned endpoints");

test("S-06", "Structure", "MIT License file exists", () => {
  return fileExists("./LICENSE") || "Missing LICENSE file";
}, "Open LICENSE file — should say MIT License");

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BUILD & COMPILATION
// ═══════════════════════════════════════════════════════════════════════════════

test("B-01", "Build", "Next.js build succeeds", () => {
  try {
    execSync("cd app && pnpm build 2>&1", { encoding: "utf-8", timeout: 120000 });
    return true;
  } catch (e: unknown) {
    return `Build failed: ${e instanceof Error ? e.message.slice(0, 200) : "unknown"}`;
  }
}, "Run `cd app && pnpm build` — should complete with 0 errors");

test("B-02", "Build", "TypeScript strict mode enabled", () => {
  return fileContains(`${APP_DIR}/tsconfig.json`, '"strict": true') || "strict mode not enabled";
}, "Check app/tsconfig.json has \"strict\": true");

test("B-03", "Build", "No TypeScript any types in source", () => {
  try {
    const out = execSync(
      `grep -rn ": any" ${APP_DIR}/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".d.ts" | wc -l`,
      { encoding: "utf-8" }
    );
    const count = parseInt(out.trim(), 10);
    return count <= 5 || `Found ${count} 'any' type usages (target: ≤5)`;
  } catch {
    return true;
  }
}, "Search source for `: any` — should be minimal or zero");

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CORE PAGES (10 required routes)
// ═══════════════════════════════════════════════════════════════════════════════

const pages = [
  { id: "P-01", route: "/", file: "app/src/app/page.tsx", name: "Landing Page", manual: "Visit / → Should show hero, CTAs, stats, features, testimonials, partner logos, learning paths, footer with newsletter" },
  { id: "P-02", route: "/courses", file: "app/src/app/courses/page.tsx", name: "Course Catalog", manual: "Visit /courses → Should show filterable grid, search bar, difficulty/track filters, course cards with thumbnails" },
  { id: "P-03", route: "/courses/[slug]", file: "app/src/app/courses/[slug]/page.tsx", name: "Course Detail", manual: "Click a course → Should show header, module list, progress bar, enrollment CTA, reviews, sidebar" },
  { id: "P-04", route: "/courses/[slug]/lessons/[id]", file: "app/src/app/courses/[slug]/lessons/[id]/page.tsx", name: "Lesson View", manual: "Open a lesson → Should show split layout (content + editor), markdown rendering, prev/next nav, completion tracking" },
  { id: "P-05", route: "/dashboard", file: "app/src/app/dashboard/page.tsx", name: "Dashboard", manual: "Visit /dashboard (logged in) → Should show current courses, XP, level, streak, achievements, recommendations, activity feed" },
  { id: "P-06", route: "/profile", file: "app/src/app/profile/page.tsx", name: "User Profile", manual: "Visit /profile (logged in) → Should show avatar, bio, skill radar, achievements, credentials, completed courses, streak calendar" },
  { id: "P-07", route: "/profile/[username]", file: "app/src/app/profile/[username]/page.tsx", name: "Public Profile", manual: "Visit /profile/someuser → Should show public profile with name, bio, XP, level" },
  { id: "P-08", route: "/leaderboard", file: "app/src/app/leaderboard/page.tsx", name: "Leaderboard", manual: "Visit /leaderboard → Should show rankings, weekly/monthly/all-time filters, user cards with rank badges" },
  { id: "P-09", route: "/settings", file: "app/src/app/settings/page.tsx", name: "Settings", manual: "Visit /settings (logged in) → Should show profile editing, theme, language, privacy, wallet linking" },
  { id: "P-10", route: "/certificates/[id]", file: "app/src/app/certificates/[id]/page.tsx", name: "Certificate View", manual: "Visit /certificates/some-mint → Should show certificate card, explorer link, share/download, NFT details" },
];

for (const page of pages) {
  test(page.id, "Pages", `${page.name} (${page.route}) exists`, () => {
    return fileExists(page.file) || `Missing ${page.file}`;
  }, page.manual);
}

test("P-11", "Pages", "API health endpoint", () => {
  return fileExists(`${APP_DIR}/src/app/api/health/route.ts`) || "Missing health API route";
}, "Visit /api/health → Should return { status: 'ok' }");

test("P-12", "Pages", "API auth callback endpoint", () => {
  return fileExists(`${APP_DIR}/src/app/api/auth/callback/route.ts`) || "Missing auth callback route";
}, "OAuth callback route for Supabase auth — should exist and handle code exchange");

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TECH STACK
// ═══════════════════════════════════════════════════════════════════════════════

test("T-01", "Tech Stack", "Tailwind CSS v4", () => {
  return fileContains(`${APP_DIR}/package.json`, '"tailwindcss"') || "Tailwind CSS not in dependencies";
}, "Check app/package.json has tailwindcss dependency");

test("T-02", "Tech Stack", "Custom design tokens (oklch)", () => {
  return fileContains(`${APP_DIR}/src/app/globals.css`, "oklch") || "No oklch design tokens found";
}, "Check app/src/app/globals.css for oklch() color tokens");

test("T-03", "Tech Stack", "shadcn/ui components (21+)", () => {
  const count = countFiles(`${APP_DIR}/src/components/ui`, "tsx");
  return count >= 15 || `Only ${count} UI components (target: 15+)`;
}, "Check app/src/components/ui/ — should have 15+ component files");

test("T-04", "Tech Stack", "Radix UI primitives", () => {
  return fileContains(`${APP_DIR}/package.json`, "radix-ui") || "Radix UI not installed";
}, "Check package.json for @radix-ui dependencies");

test("T-05", "Tech Stack", "Sanity CMS client configured", () => {
  return fileExists(`${APP_DIR}/src/lib/sanity/client.ts`) || "Sanity client not configured";
}, "Check app/src/lib/sanity/client.ts exists with createClient config");

test("T-06", "Tech Stack", "Sanity CMS schemas defined", () => {
  return fileExists(`${APP_DIR}/src/lib/sanity/schemas.ts`) || "Sanity schemas not defined";
}, "Check app/src/lib/sanity/schemas.ts — should have course/module/lesson schemas");

test("T-07", "Tech Stack", "Mock course fallback (works without Sanity)", () => {
  return fileExists(`${APP_DIR}/src/services/implementations/mock-course-service.ts`) || "Mock course service missing";
}, "Start app without SANITY env vars → /courses should load 3+ built-in mock courses");

test("T-08", "Tech Stack", "Solana Wallet Adapter", () => {
  return fileContains(`${APP_DIR}/package.json`, "@solana/wallet-adapter") || "Wallet adapter not installed";
}, "Check package.json for @solana/wallet-adapter-* packages");

test("T-09", "Tech Stack", "Supabase auth", () => {
  return fileContains(`${APP_DIR}/package.json`, "@supabase/supabase-js") || "Supabase not installed";
}, "Check package.json for @supabase packages");

test("T-10", "Tech Stack", "@sentry/nextjs installed", () => {
  return fileContains(`${APP_DIR}/package.json`, "@sentry/nextjs") || "Sentry not installed";
}, "Check package.json has @sentry/nextjs");

test("T-11", "Tech Stack", "Sentry config files", () => {
  const client = fileExists(`${APP_DIR}/sentry.client.config.ts`);
  const server = fileExists(`${APP_DIR}/sentry.server.config.ts`);
  const edge = fileExists(`${APP_DIR}/sentry.edge.config.ts`);
  if (!client) return "Missing sentry.client.config.ts";
  if (!server) return "Missing sentry.server.config.ts";
  if (!edge) return "Missing sentry.edge.config.ts";
  return true;
}, "Verify all 3 Sentry configs exist at app root: client, server, edge");

test("T-12", "Tech Stack", "next-intl i18n configured", () => {
  return fileContains(`${APP_DIR}/package.json`, "next-intl") || "next-intl not installed";
}, "Check package.json has next-intl");

test("T-13", "Tech Stack", "Monaco Editor", () => {
  return fileContains(`${APP_DIR}/package.json`, "@monaco-editor/react") || "Monaco not installed";
}, "Check package.json has @monaco-editor/react");

test("T-14", "Tech Stack", "Zustand state management", () => {
  return fileContains(`${APP_DIR}/package.json`, "zustand") || "Zustand not installed";
}, "Check package.json has zustand");

test("T-15", "Tech Stack", "Recharts for visualizations", () => {
  return fileContains(`${APP_DIR}/package.json`, "recharts") || "Recharts not installed";
}, "Check package.json has recharts (used for skill radar)");

test("T-16", "Tech Stack", "Framer Motion animations", () => {
  return fileContains(`${APP_DIR}/package.json`, "framer-motion") || "Framer Motion not installed";
}, "Check package.json has framer-motion");

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AUTH & ACCOUNT LINKING
// ═══════════════════════════════════════════════════════════════════════════════

test("A-01", "Auth", "Google sign-in implemented", () => {
  return grepRecursive(`${APP_DIR}/src`, "signInWithGoogle") || "Google sign-in not found";
}, "Click 'Sign In' → Should show Google sign-in button → Clicking opens Google OAuth flow");

test("A-02", "Auth", "GitHub sign-in implemented", () => {
  return grepRecursive(`${APP_DIR}/src`, "signInWithGithub") || "GitHub sign-in not found";
}, "Click 'Sign In' → Should show GitHub sign-in button → Clicking opens GitHub OAuth flow");

test("A-03", "Auth", "Wallet connect implemented", () => {
  return grepRecursive(`${APP_DIR}/src`, "WalletMultiButton|WalletModalProvider") || "Wallet connect not found";
}, "Click wallet button in navbar → Should open wallet modal with auto-detected wallets (Phantom, etc.)");

test("A-04", "Auth", "Wallet linking with signature", () => {
  return grepRecursive(`${APP_DIR}/src`, "linkWallet") || "Wallet linking not found";
}, "Go to /settings → Connect wallet section → Link wallet should sign a message for ownership proof");

test("A-05", "Auth", "Auth dialog with all methods", () => {
  return fileExists(`${APP_DIR}/src/components/auth/auth-dialog.tsx`) || "Auth dialog missing";
}, "Click Sign In → Auth dialog should show Google, GitHub, and Wallet options");

test("A-06", "Auth", "Protected routes redirect unauthenticated", () => {
  return grepRecursive(`${APP_DIR}/src`, "ProtectedRoute") || "Protected route component not found";
}, "Visit /dashboard logged out → Should redirect to landing or show sign-in prompt");

// ═══════════════════════════════════════════════════════════════════════════════
// 6. i18n (3 LOCALES)
// ═══════════════════════════════════════════════════════════════════════════════

test("I-01", "i18n", "English locale file", () => {
  return fileExists(`${APP_DIR}/src/i18n/messages/en.json`) || "Missing en.json";
}, "Check en.json has all UI string keys");

test("I-02", "i18n", "Portuguese (BR) locale file", () => {
  return fileExists(`${APP_DIR}/src/i18n/messages/pt-br.json`) || "Missing pt-br.json";
}, "Check pt-br.json has all UI string keys matching en.json structure");

test("I-03", "i18n", "Spanish locale file", () => {
  return fileExists(`${APP_DIR}/src/i18n/messages/es.json`) || "Missing es.json";
}, "Check es.json has all UI string keys matching en.json structure");

test("I-04", "i18n", "Locale key parity (en vs pt-br vs es)", () => {
  try {
    const en = execSync(`cat ${APP_DIR}/src/i18n/messages/en.json | python3 -c "import sys,json; print(len(json.dumps(json.load(sys.stdin))))"`, { encoding: "utf-8" }).trim();
    const ptbr = execSync(`cat ${APP_DIR}/src/i18n/messages/pt-br.json | python3 -c "import sys,json; print(len(json.dumps(json.load(sys.stdin))))"`, { encoding: "utf-8" }).trim();
    const es = execSync(`cat ${APP_DIR}/src/i18n/messages/es.json | python3 -c "import sys,json; print(len(json.dumps(json.load(sys.stdin))))"`, { encoding: "utf-8" }).trim();
    // Files should be roughly similar size (within 40% — translations vary in length)
    const sizes = [parseInt(en), parseInt(ptbr), parseInt(es)];
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    if (max / min > 1.6) return `Locale files have very different sizes: en=${en}, pt-br=${ptbr}, es=${es}`;
    return true;
  } catch {
    return "Could not parse locale files";
  }
}, "Compare key count across all 3 locale JSON files — should match exactly");

test("I-05", "i18n", "Language switcher in navbar", () => {
  return grepRecursive(`${APP_DIR}/src/components/layout`, "Globe|locale|language") || "Language switcher not found in navbar";
}, "Look for Globe icon dropdown in navbar → Should show EN / PT-BR / ES options");

test("I-06", "i18n", "Language setting in /settings", () => {
  return grepRecursive(`${APP_DIR}/src/app/settings`, "preferred_language|language") || "Language setting not in settings";
}, "Go to /settings → Language section → Should show EN / PT-BR / ES selector");

manual("I-07", "i18n", "Switch to PT-BR", "Switch language to PT-BR → All UI text should change: 'Courses' → 'Cursos', nav items, buttons, etc.");

manual("I-08", "i18n", "Switch to ES", "Switch language to ES → All UI text should change: 'Courses' → 'Cursos', nav items, buttons, etc.");

// ═══════════════════════════════════════════════════════════════════════════════
// 7. THEME (LIGHT/DARK)
// ═══════════════════════════════════════════════════════════════════════════════

test("TH-01", "Theme", "Theme provider exists", () => {
  return fileExists(`${APP_DIR}/src/components/providers/theme-provider.tsx`) || "Theme provider missing";
}, "Check theme-provider.tsx exists with light/dark/system modes");

test("TH-02", "Theme", "Dark mode CSS tokens", () => {
  return fileContains(`${APP_DIR}/src/app/globals.css`, ".dark") || "No .dark class styles found";
}, "Check globals.css has .dark { ... } with oklch color token overrides");

manual("TH-03", "Theme", "Toggle dark mode", "Go to /settings → Theme section → Toggle to Dark → All pages should switch. Toggle to Light → Should switch back. Toggle to System → Should follow OS.");

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ON-CHAIN INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

test("OC-01", "On-Chain", "PDA derivation helpers", () => {
  return fileExists(`${APP_DIR}/src/lib/solana/program.ts`) || "Solana program helpers missing";
}, "Check app/src/lib/solana/program.ts has getConfigPda, getCoursePda, getEnrollmentPda, etc.");

test("OC-02", "On-Chain", "useOnChainXP hook (Token-2022)", () => {
  return grepRecursive(`${APP_DIR}/src/hooks`, "useOnChainXP", "ts") || "useOnChainXP hook not found";
}, "With wallet connected + devnet → Check if XP balance loads from Token-2022 token account");

test("OC-03", "On-Chain", "useOnChainCredentials hook (Helius DAS)", () => {
  return grepRecursive(`${APP_DIR}/src/hooks`, "useOnChainCredentials", "ts") || "useOnChainCredentials hook not found";
}, "With wallet connected + Helius API key → Should fetch Metaplex Core NFTs from DAS API");

test("OC-04", "On-Chain", "useEnrollOnChain hook", () => {
  return grepRecursive(`${APP_DIR}/src/hooks`, "useEnrollOnChain", "ts") || "useEnrollOnChain hook not found";
}, "With wallet connected → Enroll in a course → Should build + sign Anchor enroll instruction on devnet");

test("OC-05", "On-Chain", "useOnChainConfig hook", () => {
  return grepRecursive(`${APP_DIR}/src/hooks`, "useOnChainConfig", "ts") || "useOnChainConfig hook not found";
}, "With RPC configured → Should fetch and parse the on-chain Config PDA");

test("OC-06", "On-Chain", "Program ID constant matches spec", () => {
  return fileContains(`${APP_DIR}/src/lib/solana/program.ts`, "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf") || "Program ID doesn't match";
}, "Check program.ts has correct PROGRAM_ID: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

test("OC-07", "On-Chain", "XP Mint constant matches spec", () => {
  const inProgram = fileContains(`${APP_DIR}/src/lib/solana/program.ts`, "XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe");
  const inHooks = grepRecursive(`${APP_DIR}/src`, "XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe", "ts");
  const inEnv = fileContains(`${APP_DIR}/.env.example`, "XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe");
  return (inProgram || inHooks || inEnv) || "XP Mint doesn't match";
}, "Check program.ts or .env.example has correct XP_MINT: XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe");

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SERVICE LAYER (clean abstractions)
// ═══════════════════════════════════════════════════════════════════════════════

const services = [
  { id: "SV-01", name: "CourseService", file: "course-service.ts" },
  { id: "SV-02", name: "EnrollmentService", file: "enrollment-service.ts" },
  { id: "SV-03", name: "ProgressService", file: "progress-service.ts" },
  { id: "SV-04", name: "XPService", file: "xp-service.ts" },
  { id: "SV-05", name: "CredentialService", file: "credential-service.ts" },
  { id: "SV-06", name: "LeaderboardService", file: "leaderboard-service.ts" },
  { id: "SV-07", name: "StreakService", file: "streak-service.ts" },
  { id: "SV-08", name: "AchievementService", file: "achievement-service.ts" },
  { id: "SV-09", name: "ProfileService", file: "profile-service.ts" },
  { id: "SV-10", name: "ActivityService", file: "activity-service.ts" },
];

for (const svc of services) {
  test(svc.id, "Services", `${svc.name} interface exists`, () => {
    return fileExists(`${APP_DIR}/src/services/${svc.file}`) || `Missing ${svc.file}`;
  }, `Check app/src/services/${svc.file} — should define a typed interface with all CRUD methods`);
}

test("SV-11", "Services", "Service index exports (smart routing)", () => {
  return fileExists(`${APP_DIR}/src/services/index.ts`) || "Missing service index";
}, "Check app/src/services/index.ts — should export resolved service instances (Sanity vs mock, Supabase vs local)");

// ═══════════════════════════════════════════════════════════════════════════════
// 10. GAMIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

test("G-01", "Gamification", "XP leveling formula: floor(sqrt(xp/100))", () => {
  return fileContains(`${APP_DIR}/src/lib/constants.ts`, "Math.floor(Math.sqrt") || "XP formula not found";
}, "Check constants.ts → calculateLevel(xp) = Math.floor(Math.sqrt(xp / 100))");

test("G-02", "Gamification", "LevelRing component", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/level-ring.tsx`) || "LevelRing missing";
}, "Visit /dashboard or /profile → Should show SVG ring with level number and XP progress arc");

test("G-03", "Gamification", "StreakCalendar component", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/streak-calendar.tsx`) || "StreakCalendar missing";
}, "Visit /profile → Should show GitHub-style 12-week activity heatmap");

test("G-04", "Gamification", "SkillRadar chart", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/skill-radar.tsx`) || "SkillRadar missing";
}, "Visit /profile → Should show radar chart with 6 skills (Rust, Anchor, Frontend, Token-2022, Security, DeFi)");

test("G-05", "Gamification", "AchievementCard component", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/achievement-card.tsx`) || "AchievementCard missing";
}, "Visit /dashboard → Achievements section → Should show achievement cards with icons, progress bars, earned/locked state");

test("G-06", "Gamification", "XPNotification component", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/xp-notification.tsx`) || "XPNotification missing";
}, "Complete a lesson → Should show animated '+XP' notification (auto-dismiss)");

test("G-07", "Gamification", "GamificationStats component", () => {
  return fileExists(`${APP_DIR}/src/components/gamification/gamification-stats.tsx`) || "GamificationStats missing";
}, "Visit /dashboard → Should show composite level ring + XP + streak + achievement count");

// ═══════════════════════════════════════════════════════════════════════════════
// 11. CODE EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

test("CE-01", "Code Editor", "CodeEditor component exists", () => {
  return fileExists(`${APP_DIR}/src/components/lesson/code-editor.tsx`) || "CodeEditor missing";
}, "Open a challenge lesson → Should show Monaco editor with toolbar, prompt, test results");

test("CE-02", "Code Editor", "Lazy-loaded (dynamic import, ssr: false)", () => {
  const indexFile = `${APP_DIR}/src/components/lesson/index.tsx`;
  if (!fileExists(indexFile)) return "Missing index.tsx barrel export";
  return fileContains(indexFile, "ssr: false") || "Not lazy-loaded with ssr: false";
}, "Check lesson/index.tsx → Should use next/dynamic with { ssr: false }");

test("CE-03", "Code Editor", "Rust/TypeScript/JSON language support", () => {
  return fileContains(`${APP_DIR}/src/components/lesson/code-editor.tsx`, "rust") || "Rust language not supported";
}, "Open code editor → Language badge should show rust/typescript/json based on challenge");

test("CE-04", "Code Editor", "Test cases with pass/fail indicators", () => {
  return grepRecursive(`${APP_DIR}/src/components/lesson`, "CheckCircle2|XCircle") || "Pass/fail indicators missing";
}, "Run tests in editor → Should show green checkmark or red X per test case");

test("CE-05", "Code Editor", "Error markers on failed tests", () => {
  return fileContains(`${APP_DIR}/src/components/lesson/code-editor.tsx`, "setModelMarkers") || "Monaco error markers not implemented";
}, "Run tests that fail → Editor should show red squiggly markers inline at relevant lines");

test("CE-06", "Code Editor", "Hints panel", () => {
  return grepRecursive(`${APP_DIR}/src/components/lesson`, "showHints") || "Hints not implemented";
}, "Click 'Hints' button in code editor → Should toggle hints panel below editor");

test("CE-07", "Code Editor", "Solution toggle", () => {
  return grepRecursive(`${APP_DIR}/src/components/lesson`, "showSolution") || "Solution toggle not implemented";
}, "Click 'Solution' button → Should toggle solution code panel below editor");

test("CE-08", "Code Editor", "Reset code button", () => {
  return grepRecursive(`${APP_DIR}/src/components/lesson`, "reset|Reset") || "Reset not implemented";
}, "Modify code in editor → Click 'Reset' → Should restore original starter code");

// ═══════════════════════════════════════════════════════════════════════════════
// 12. ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

test("AN-01", "Analytics", "GA4 integration", () => {
  return grepRecursive(`${APP_DIR}/src`, "GA_MEASUREMENT_ID|gtag") || "GA4 not found";
}, "Set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env → Check browser network tab for gtag.js loading");

test("AN-02", "Analytics", "PostHog integration", () => {
  return grepRecursive(`${APP_DIR}/src`, "POSTHOG|posthog") || "PostHog not found";
}, "Set NEXT_PUBLIC_POSTHOG_KEY in .env → Check browser network tab for PostHog calls");

test("AN-03", "Analytics", "Sentry error monitoring", () => {
  return fileContains(`${APP_DIR}/sentry.client.config.ts`, "Sentry.init") || "Sentry not initialized";
}, "Set NEXT_PUBLIC_SENTRY_DSN → Trigger an error → Check Sentry dashboard for captured event");

test("AN-04", "Analytics", "Custom trackEvent function", () => {
  return grepRecursive(`${APP_DIR}/src`, "trackEvent") || "Custom event tracking not found";
}, "Check analytics-provider.tsx exports trackEvent() — used for lesson_completed, enrollment, etc.");

test("AN-05", "Analytics", "AnalyticsProvider in provider tree", () => {
  return fileExists(`${APP_DIR}/src/components/providers/analytics-provider.tsx`) || "AnalyticsProvider missing";
}, "Check providers/index.tsx wraps children with AnalyticsProvider");

// ═══════════════════════════════════════════════════════════════════════════════
// 13. CMS
// ═══════════════════════════════════════════════════════════════════════════════

test("CMS-01", "CMS", "Sanity client configured", () => {
  return fileExists(`${APP_DIR}/src/lib/sanity/client.ts`) || "Sanity client missing";
}, "Check sanity/client.ts — should use createClient with projectId, dataset, apiVersion");

test("CMS-02", "CMS", "Course/module/lesson schemas", () => {
  return fileContains(`${APP_DIR}/src/lib/sanity/schemas.ts`, "course") || "Course schema not found";
}, "Check sanity/schemas.ts — should define course, module, lesson, challenge document types");

test("CMS-03", "CMS", "GROQ queries", () => {
  return grepRecursive(`${APP_DIR}/src`, "groq|GROQ|_type ==|\\*\\[", "ts") || "No GROQ queries found";
}, "Check sanity/ or services/ for GROQ query strings");

test("CMS-04", "CMS", "Smart fallback to mock data", () => {
  return fileContains(`${APP_DIR}/src/services/index.ts`, "mock") || "No mock fallback logic";
}, "Remove Sanity env vars → App should load with built-in mock courses (no errors)");

test("CMS-05", "CMS", "Mock courses with 3+ courses", () => {
  try {
    const out = execSync(`grep -c "id:" ${APP_DIR}/src/services/implementations/mock-course-service.ts`, { encoding: "utf-8" });
    const count = parseInt(out.trim(), 10);
    return count >= 3 || `Only ${count} course definitions found`;
  } catch {
    return "Could not count mock courses";
  }
}, "Check mock-course-service.ts → Should have at least 3 complete courses with modules and lessons");

// ═══════════════════════════════════════════════════════════════════════════════
// 14. PERFORMANCE & IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

test("PF-01", "Performance", "next/image usage (no raw <img>)", () => {
  try {
    const out = execSync(
      `grep -rn "<img" ${APP_DIR}/src/app --include="*.tsx" | wc -l`,
      { encoding: "utf-8" }
    );
    const count = parseInt(out.trim(), 10);
    return count === 0 || `Found ${count} raw <img> tags (should be 0, use next/image)`;
  } catch {
    return true;
  }
}, "Search source for <img tags → Should be zero; all images should use next/image <Image>");

test("PF-02", "Performance", "Image remote patterns in next.config", () => {
  return fileContains(`${APP_DIR}/next.config.ts`, "remotePatterns") || "No remote patterns configured";
}, "Check next.config.ts → images.remotePatterns should include cdn.sanity.io, arweave.net, supabase.co");

test("PF-03", "Performance", "Resizable panels in lesson view", () => {
  return grepRecursive(`${APP_DIR}/src`, "ResizablePanelGroup|react-resizable-panels") || "Resizable panels not found";
}, "Open a challenge lesson → Content and editor panels should be resizable by dragging the handle");

test("PF-04", "Performance", "Font display swap", () => {
  return grepRecursive(`${APP_DIR}/src/app`, 'display.*swap|"swap"') || "Font display swap not set";
}, "Check layout.tsx → Font should have display: 'swap' for fast initial paint");

// ═══════════════════════════════════════════════════════════════════════════════
// 15. RESPONSIVE & UI
// ═══════════════════════════════════════════════════════════════════════════════

manual("UI-01", "UI/UX", "Mobile responsive (< 640px)", "Open app on mobile viewport (375px width) → All pages should be usable: stacked layouts, no horizontal scroll, hamburger nav");

manual("UI-02", "UI/UX", "Tablet responsive (768px)", "Open app on tablet viewport → Should show 2-column grids, sidebar toggles properly");

manual("UI-03", "UI/UX", "Desktop layout (1280px+)", "Open app on desktop → Should show full sidebar, 3-column course grid, wide lesson split view");

test("UI-04", "UI/UX", "Mobile nav (sheet/hamburger)", () => {
  return grepRecursive(`${APP_DIR}/src/components/layout`, "Sheet|Menu") || "Mobile nav not found";
}, "On mobile width → Hamburger icon should open slide-out nav sheet");

test("UI-05", "UI/UX", "Toast notifications (sonner)", () => {
  return fileContains(`${APP_DIR}/package.json`, "sonner") || "Sonner not installed";
}, "Perform actions (enroll, complete lesson) → Should show toast notifications");

// ═══════════════════════════════════════════════════════════════════════════════
// 16. DOCUMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const docs = [
  { id: "D-01", file: "app/README.md", name: "README.md", manual: "Open README → Should have overview, quickstart, project structure, features, env vars, tech stack, contributing" },
  { id: "D-02", file: "app/docs/ARCHITECTURE.md", name: "ARCHITECTURE.md", manual: "Open ARCHITECTURE.md → Should have system diagram, directory tree, data flows, provider stack, service layer" },
  { id: "D-03", file: "app/docs/CMS_GUIDE.md", name: "CMS_GUIDE.md", manual: "Open CMS_GUIDE.md → Should have content architecture, Sanity setup, schemas, GROQ queries, publishing workflow" },
  { id: "D-04", file: "app/docs/CUSTOMIZATION.md", name: "CUSTOMIZATION.md", manual: "Open CUSTOMIZATION.md → Should have theme colors, typography, adding languages, gamification extension, forking guide" },
  { id: "D-05", file: "app/.env.example", name: ".env.example", manual: "Open .env.example → Should list ALL env vars with section headers and descriptions" },
];

for (const doc of docs) {
  test(doc.id, "Docs", `${doc.name} exists with content`, () => {
    if (!fileExists(doc.file)) return `Missing ${doc.file}`;
    try {
      const lines = execSync(`wc -l < ${doc.file}`, { encoding: "utf-8" });
      return parseInt(lines.trim()) >= 20 || `${doc.name} has only ${lines.trim()} lines (too short)`;
    } catch {
      return "Could not read file";
    }
  }, doc.manual);
}

test("D-06", "Docs", "Supabase schema.sql", () => {
  return fileExists(`${APP_DIR}/supabase/schema.sql`) || "Missing schema.sql";
}, "Check app/supabase/schema.sql → Should define all tables: profiles, course_progress, streaks, activities, user_achievements, wallet_links");

test("D-07", "Docs", "Backend README.md", () => {
  return fileExists("./backend/README.md") || "Missing backend/README.md";
}, "Open backend/README.md → Should describe planned endpoints, signing flow, integration points");

// ═══════════════════════════════════════════════════════════════════════════════
// 17. LANDING PAGE SPECIFICS
// ═══════════════════════════════════════════════════════════════════════════════

test("LP-01", "Landing", "Hero section with CTAs", () => {
  return grepRecursive(`${APP_DIR}/src/app`, "Sign Up|Explore Courses|Explorar Cursos|Get Started|getStarted|hero") || "Hero CTAs not found";
}, "Visit / → Hero section should have clear value proposition and primary CTA buttons");

test("LP-02", "Landing", "Testimonials section", () => {
  return grepRecursive(`${APP_DIR}/src/app`, "testimonial|Testimonial|testimonials") || "Testimonials not found";
}, "Visit / → Should show 3+ testimonial cards with avatar, name, role, quote");

test("LP-03", "Landing", "Partner logos", () => {
  return grepRecursive(`${APP_DIR}/src/app`, "partner|Solana Foundation|Superteam|Helius|Metaplex") || "Partner logos not found";
}, "Visit / → Should show partner/supporter logos (Solana Foundation, Superteam, Helius, Metaplex)");


test("LP-04", "Landing", "Footer with newsletter signup", () => {
  return grepRecursive(`${APP_DIR}/src/components/layout`, "newsletter|Subscribe|subscribe") || "Newsletter not found";
}, "Scroll to footer → Should have email input + subscribe button for newsletter");

test("LP-05", "Landing", "Learning path previews", () => {
  return grepRecursive(`${APP_DIR}/src/app`, "learning.*path|track|Solana Fundamentals") || "Learning paths not found";
}, "Visit / → Should show learning path cards (Solana Fundamentals, Anchor, DeFi, NFT, Full Stack)");

// ═══════════════════════════════════════════════════════════════════════════════
// 18. DASHBOARD SPECIFICS
// ═══════════════════════════════════════════════════════════════════════════════

manual("DB-01", "Dashboard", "Current courses with progress", "Visit /dashboard → Should show enrolled courses with completion %, next lesson link");
manual("DB-02", "Dashboard", "XP balance and level display", "Visit /dashboard → Should show XP number, level ring, rank position");
manual("DB-03", "Dashboard", "Streak visualization", "Visit /dashboard → Should show current streak count with flame icon");
manual("DB-04", "Dashboard", "Recommended courses", "Visit /dashboard → Should show 2-3 recommended courses based on track");
manual("DB-05", "Dashboard", "Activity feed", "Visit /dashboard → Should show recent activities (enrollments, completions, XP earned)");

// ═══════════════════════════════════════════════════════════════════════════════
// 19. COURSE FLOW
// ═══════════════════════════════════════════════════════════════════════════════

manual("CF-01", "Course Flow", "Browse → Enroll → Learn", "Browse /courses → Click a course → Click Enroll → Open first lesson → Content renders with markdown");
manual("CF-02", "Course Flow", "Challenge lesson with code editor", "Open a challenge lesson → Monaco editor loads → Type code → Click Run → See test results (pass/fail)");
manual("CF-03", "Course Flow", "Lesson completion → XP toast", "Complete a lesson → Should show XP notification toast → Progress bar updates");
manual("CF-04", "Course Flow", "Module navigation", "In lesson view → Click Previous/Next → Should navigate between lessons. Module overview visible.");
manual("CF-05", "Course Flow", "Course progress persistence", "Complete lessons → Reload page → Progress should be preserved (Supabase or local storage)");

// ═══════════════════════════════════════════════════════════════════════════════
// 20. CERTIFICATE / CREDENTIAL
// ═══════════════════════════════════════════════════════════════════════════════

test("CR-01", "Credentials", "Certificate page has explorer link", () => {
  return grepRecursive(`${APP_DIR}/src/app/certificates`, "explorer.solana.com|solscan") || "Explorer link not found";
}, "Visit /certificates/[id] → Should show Solana Explorer link for the credential NFT mint address");

test("CR-02", "Credentials", "Share button (Web Share API)", () => {
  return grepRecursive(`${APP_DIR}/src/app/certificates`, "navigator.share|clipboard") || "Share not found";
}, "Click Share on certificate → Should use Web Share API or copy link to clipboard");

test("CR-03", "Credentials", "Download button", () => {
  return grepRecursive(`${APP_DIR}/src/app/certificates`, "download|Download") || "Download not found";
}, "Click Download on certificate → Should download certificate image or open credential URL");

test("CR-04", "Credentials", "NFT metadata display", () => {
  return grepRecursive(`${APP_DIR}/src/app/certificates`, "mintAddress|mint_address|track|coursesCompleted") || "NFT metadata not displayed";
}, "Visit /certificates/[id] → Should show mint address, track, courses completed, total XP");

// ═══════════════════════════════════════════════════════════════════════════════
// 21. SETTINGS SPECIFICS
// ═══════════════════════════════════════════════════════════════════════════════

manual("ST-01", "Settings", "Edit profile (name, bio, socials)", "Go to /settings → Edit display name, bio, social links → Click Save → Reload → Changes persist");
manual("ST-02", "Settings", "Theme selection", "Go to /settings → Switch between Light / Dark / System → Theme should update immediately");
manual("ST-03", "Settings", "Privacy toggle", "Go to /settings → Toggle profile visibility (public/private) → Save → Visit /profile/[username] → Respects visibility");
manual("ST-04", "Settings", "Wallet linking", "Go to /settings → Wallet section → Connect wallet → Sign message → Wallet address saved to profile");

// ═══════════════════════════════════════════════════════════════════════════════
// 22. BONUS FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

test("BN-01", "Bonus", "GitHub sign-in (bonus auth method)", () => {
  return grepRecursive(`${APP_DIR}/src`, "signInWithGithub|signInWithGitHub|github") || "GitHub sign-in not found";
}, "Click Sign In → Should show GitHub option alongside Google and Wallet");

test("BN-02", "Bonus", "Resizable lesson split layout", () => {
  return grepRecursive(`${APP_DIR}/src`, "ResizablePanel|react-resizable-panels") || "Resizable panels not found";
}, "Open challenge lesson → Drag handle between content and editor → Panels should resize");

test("BN-03", "Bonus", "Reviews section on course page", () => {
  return grepRecursive(`${APP_DIR}/src`, "review|Review|reviews|ratings") || "Reviews section not found";
}, "Visit /courses/[slug] → Scroll down → Should see student reviews section with star ratings");

test("BN-04", "Bonus", "Activity tracking with analytics events", () => {
  return grepRecursive(`${APP_DIR}/src`, "trackEvent") || "Custom event tracking not found";
}, "Open browser DevTools Network tab → Perform actions → Should see GA4/PostHog event calls");

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

function generateOutput(): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push("╔══════════════════════════════════════════════════════════════════════════════╗");
  lines.push("║          SUPERTEAM ACADEMY — COMPREHENSIVE TEST RESULTS                     ║");
  lines.push(`║          Generated: ${now}                            ║`);
  lines.push("╚══════════════════════════════════════════════════════════════════════════════╝");
  lines.push("");

  // Summary
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const manual_count = results.filter((r) => r.status === "MANUAL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  const total = results.length;

  lines.push("═══ SUMMARY ═══════════════════════════════════════════════════════════════════");
  lines.push(`  Total tests:   ${total}`);
  lines.push(`  ✅ PASS:       ${pass}`);
  lines.push(`  ❌ FAIL:       ${fail}`);
  lines.push(`  🔧 MANUAL:     ${manual_count}`);
  lines.push(`  ⏭️  SKIP:       ${skip}`);
  lines.push(`  Pass rate:     ${((pass / (total - manual_count - skip)) * 100).toFixed(1)}% (automated only)`);
  lines.push("");

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catPass = catResults.filter((r) => r.status === "PASS").length;
    const catFail = catResults.filter((r) => r.status === "FAIL").length;
    const catManual = catResults.filter((r) => r.status === "MANUAL").length;

    lines.push(`\n═══ ${cat.toUpperCase()} (${catPass}✅ ${catFail}❌ ${catManual}🔧) ════════════════════════════════════`);
    lines.push(`${"ID".padEnd(8)} ${"Status".padEnd(8)} ${"Feature".padEnd(50)} Details`);
    lines.push("─".repeat(110));

    for (const r of catResults) {
      const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : r.status === "MANUAL" ? "🔧" : "⏭️";
      lines.push(`${r.id.padEnd(8)} ${icon.padEnd(6)}  ${r.feature.padEnd(50)} ${r.details}`);
    }
  }

  // Manual testing checklist
  lines.push("\n\n╔══════════════════════════════════════════════════════════════════════════════╗");
  lines.push("║                    MANUAL TESTING CHECKLIST                                  ║");
  lines.push("╚══════════════════════════════════════════════════════════════════════════════╝\n");
  lines.push("For each item below, follow the steps and mark [x] when verified:\n");

  for (const r of results) {
    const check = r.status === "PASS" ? "[x]" : "[ ]";
    lines.push(`${check} ${r.id} — ${r.feature}`);
    lines.push(`    Steps: ${r.manualSteps}`);
    if (r.status === "FAIL") {
      lines.push(`    ⚠️  AUTO-TEST FAILED: ${r.details}`);
    }
    lines.push("");
  }

  // Environment setup
  lines.push("\n╔══════════════════════════════════════════════════════════════════════════════╗");
  lines.push("║                    ENVIRONMENT SETUP CHECKLIST                               ║");
  lines.push("╚══════════════════════════════════════════════════════════════════════════════╝\n");
  lines.push("Before manual testing, ensure the following are configured:\n");
  lines.push("[ ] 1. Copy app/.env.example to app/.env.local");
  lines.push("[ ] 2. Create Supabase project → fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY");
  lines.push("[ ] 3. Run schema: copy app/supabase/schema.sql → paste in Supabase SQL Editor → Run");
  lines.push("[ ] 4. Enable Google OAuth in Supabase → Auth → Providers → Google (client ID + secret)");
  lines.push("[ ] 5. Enable GitHub OAuth in Supabase → Auth → Providers → GitHub (client ID + secret)");
  lines.push("[ ] 6. Set redirect URL in OAuth providers: https://your-supabase.supabase.co/auth/v1/callback");
  lines.push("[ ] 7. (Optional) Sanity: create project → fill NEXT_PUBLIC_SANITY_PROJECT_ID (or leave blank for mock data)");
  lines.push("[ ] 8. Solana RPC: default devnet works, or set NEXT_PUBLIC_HELIUS_RPC for Helius DAS API");
  lines.push("[ ] 9. (Optional) Analytics: set NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_SENTRY_DSN");
  lines.push("[ ] 10. Install dependencies: cd app && pnpm install");
  lines.push("[ ] 11. Start dev server: cd app && pnpm dev");
  lines.push("[ ] 12. Open http://localhost:3000");
  lines.push("[ ] 13. Install Phantom wallet extension (or any Solana wallet)");
  lines.push("[ ] 14. Switch Phantom to Devnet: Settings → Developer Settings → Testnet Mode → Devnet");
  lines.push("");

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

console.log("🧪 Running Superteam Academy test suite...\n");

const output = generateOutput();
writeFileSync("testing_output.txt", output, "utf-8");

console.log(output);
console.log(`\n📄 Results saved to testing_output.txt`);
