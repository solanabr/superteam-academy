# 🚀 MISSION: SUPERTEAM ACADEMY V1.0 (PRODUCTION POLISH)

**Role:** You are the Lead UI/UX Architect and Senior Full-Stack Engineer for this project.

**Objective:** Transform the current functional MVP into a world-class, award-winning dApp for the Superteam Brazil Hackathon. The focus is on visual "WOW" factor, perfect polish, complete i18n coverage, and critical bug fixes.

**Context:** The codebase uses Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Prisma (Postgres), and Solana/Anchor.

---

## 🎨 TASK 1: FUTURISTIC UI REDESIGN (THE "WOW" FACTOR)

**Goal:** Redesign every single page to look like a premium, futuristic Web3 product (think Vercel meets Solana meets Cyberpunk).

**Design Guidelines:**
*   **Theme:** Deep dark mode by default (`#0a0a0a` or `#050505`). Use subtle gradients (purple, pink, cyan) for backgrounds and borders.
*   **Typography:** Use `Inter` or a more tech-focused font for headers. Increase contrast and hierarchy.
*   **Components:**
    *   **Cards:** Add glassmorphism (`backdrop-blur-md`, `bg-opacity-50`), subtle borders with gradients, and hover effects (`scale-105`, `shadow-glow`).
    *   **Buttons:** Replace default shadcn buttons with custom variants (glow effects, gradient borders).
    *   **Layout:** Ensure perfect alignment and whitespace (padding/margin) on all breakpoints (Mobile to 4K).
*   **Animations:** Use `framer-motion` for smooth page transitions, element entry animations, and hover states.

**Pages to Redesign:**
1.  **Landing Page (`/`):** Make the Hero section massive and interactive. Add animated background elements (grid, floating nodes).
2.  **Dashboard (`/dashboard`):** Make the stats cards pop. The `Activity Heatmap` should be visually stunning (neon green cells).
3.  **Course Catalog (`/courses`):** Course cards should look like collectible items.
4.  **Course Detail (`/courses/[id]`):** Clean up the sidebar and curriculum list. The progress bar should be prominent.
5.  **Lesson View (`/lessons/[id]`):** The Split View must be pixel-perfect. The Code Editor should feel like VS Code. The Terminal should look like a real hackerman console.
6.  **Profile (`/profile`):** This is the user's trophy room. Make it look epic.
7. **And all the other pages, especially (`/admin`, `/admin/courses/[slug]`).**

---

## 🌍 TASK 2: FULL INTERNATIONALIZATION (i18n)

**Goal:** 100% text coverage in English (EN), Spanish (ES), and Portuguese (PT-BR).

**Instructions:**
1.  **Scan:** Go through every `.tsx` file in `app/src/app`. Find EVERY hardcoded string.
2.  **Extract:** Move these strings to `app/messages/en.json`, organizing them by page/component scope (e.g., `"Profile": { ... }`).
3.  **Translate:** Create keys in `es.json` and `pt-BR.json` with accurate translations.
4.  **Implement:** Replace hardcoded text with `{t('key')}` using `useTranslations` hook.

---

## 🔒 TASK 3: ADMIN & CREATOR LOGIC HARDENING

**Goal:** Prevent breaking the blockchain state by locking critical fields for published courses.

**File:** `app/src/app/[locale]/admin/courses/[slug]/page.tsx`
**Logic:**
*   Check `course.status`.
*   **If `APPROVED` (Published):**
    *   **DISABLE:** `Slug` input, `Difficulty` select, `XP/Lesson` input, `Add Module` button, `Remove Module` button, `Add Lesson` button, `Remove Lesson` button.
    *   **DISABLE:** The "Publish On-Chain" switch (it should be locked to ON).
    *   **ENABLE:** `Title`, `Description`, `Image URL`, Lesson `Content` (Markdown), `Initial Code`, `Validation Rules`. (Admins must be able to fix typos).

---

## 🐛 TASK 4: BUG FIXES & POLISH

1.  **Profile NFT Click Area:** In `app/src/components/profile-view.tsx` and `credential-card.tsx`, fix the issue where the NFT card's click area covers half the page. Ensure the `onClick` is strictly bound to the visible card dimensions.
2.  **Restore 3D Effect:** Bring back the `framer-motion` 3D tilt effect on `CredentialCard` that was lost during debugging. It must look premium.
3.  **General QA:** Fix any console warnings (e.g., `unique key` props, `html` hydration mismatches).

---

## 📋 TASK 5: COMPLIANCE CHECK (SCOPE OF WORK)

**Reference:** Read the attached PDF (`Scope of Work`).
**Action:**
1.  Verify that we have implemented:
    *   **Onboarding Flow:** (Quiz -> Recommendation).
    *   **Certificates:** (Metaplex Core, Downloadable, Shareable).
    *   **Gamification:** (Streaks, XP, Leaderboard).
    *   **CMS:** (Admin & Creator Dashboards).
2.  If ANYTHING is missing (e.g., a specific button in the footer or a field in the profile), implement it immediately.

---

## 📄 TASK 6: ULTIMATE README

**File:** `README.md`
**Content:** Create a professional, visually appealing README that acts as a sales pitch for the judges.
*   **Header:** Project Logo & Title.
*   **Value Prop:** One sentence pitch.
*   **Screenshots:** Placeholders for screenshots of Dashboard, Course View, and Profile.
*   **Features List:** Bullet points highlighting the Tech Stack (Next.js 14, Solana, Prisma) and Key Features (Evolving NFTs, Anti-Cheat Engine).
*   **Setup Guide:** Clear, step-by-step instructions to run locally (`pnpm install`, `.env` setup, `pnpm dev`).
*   **Architecture:** Brief overview of the Hybrid Web2/Web3 architecture.