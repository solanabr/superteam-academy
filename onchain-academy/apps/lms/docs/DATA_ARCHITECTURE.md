# Data Architecture & Analytics Strategy

For the Superteam Academy LMS, data storage and analytics rely on three distinct systems: **Payload CMS**, **PostHog**, and **Google Analytics 4 (GA4)**. This document outlines exactly what each service is responsible for to ensure a clean, scalable, and performant architecture.

---

## 1. Payload CMS

**Role:** The Core Database & Source of Truth.
Payload should hold all structured application state, content, and persistent user data. It acts as both your headless CMS and your primary database.

**What to store here:**

- **User Profiles:** `wallet_address`, `google_id`, `github_id`, display name, avatar, and bio.
- **Gamification Data (Stubbed State):** Since the on-chain logic is stubbed initially, store the user's `current_xp`, `streak_count`, `last_active_date`, and unlocked `achievements`.
- **App State & Progress:** Which courses a user is enrolled in, and an array of their completed `lesson_ids`.
- **Course Content:** Course metadata, lesson markdown, video links, code challenge prompts, and expected outputs.

**Why Payload?**
It provides a secure place to validate application logic (e.g., checking if a user is allowed to proceed to the next lesson or if they have earned a streak) and serves the core content required for the LMS to function.

---

## 2. PostHog

**Role:** Product Analytics & User Behavior.
PostHog should track _how_ the users are interacting with the application to help you improve the user experience and the product itself.

**What to track here:**

- **Deep Event Tracking:** Trigger custom events when a user: `starts_lesson`, `runs_code`, `fails_code_challenge`, `passes_code_challenge`, or `connects_wallet`.
- **Session Replays & Heatmaps:** Fulfills the hackathon requirement. Watch screen recordings to observe exactly where developers get stuck on specific coding challenges.
- **User Journeys:** Call `posthog.identify(walletAddress)` when a user logs in to stitch together the exact path a specific developer took through the LMS.

**Why PostHog?**
Storing every single button click or failed code run in your primary Payload database would bloat it and slow down the application. PostHog is purpose-built to handle millions of these micro-interactions and provides native heatmaps & session replays.

---

## 3. Google Analytics 4 (GA4)

**Role:** Marketing & Acquisition.
GA4 should be used strictly for top-level traffic analytics and acquisition metrics. Keep it simple and high-level.

**What to track here:**

- **Traffic Sources:** Are users arriving at Superteam Academy from Twitter, a Superteam blog post, or organic Google searches?
- **Landing Page Conversion:** Track how many people land on the homepage vs. how many actually click "Sign Up" or "Explore Courses."
- **Basic Pageviews:** Identify which course landing pages generate the most interest before users even log in.

**Why GA4?**
While GA4 isn't great at deeply tracking logged-in app sessions (like specific coding challenge interactions), it remains the industry standard for answering "where did our traffic come from?" and evaluating top-of-funnel marketing efforts.
