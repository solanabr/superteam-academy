# Solana Academy Platform — Frontend Specification

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** MVP Implementation

## 1. Executive Summary

The Solana Academy Platform is a web-based learning management system (LMS) designed to teach Solana development through interactive, hands-on courses. Learners progress through guided lessons with integrated code editors, earn XP rewards, and receive on-chain credentials upon course completion.

### Key Objectives
- Make Solana development accessible to beginners
- Provide hands-on, project-based learning
- Track learner progress on-chain
- Build a gamified, competitive learning community
- Integrate with Solana wallet ecosystem

## 2. Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                           │
│   (Next.js 14, React 18, Tailwind CSS, Framer Motion)              │
│                                                                     │
│  Pages: Home | Courses | Dashboard | Certificates | Leaderboard   │
│  Components: Header | CourseCard | CodeEditor | Navigation         │
│  UI Library: Button, Card, Input, ResizablePanel                   │
└────────────┬──────────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                              │
│                   (Hooks, Services, State)                           │
│                                                                     │
│  Services: CourseService, ProgressService, OnChainService          │
│  Hooks: useI18n, useLearningProgress, useProgram                    │
│  State: Zustand stores (learner, courses, achievements)             │
└────────────┬──────────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────────────┐
│                     DATA & INFRASTRUCTURE LAYER                       │
│                                                                     │
│  APIs: Helius RPC, Solana Web3.js                                   │
│  Storage: Local IndexedDB (learner data), Arweave (immutable)       │
│  Auth: Solana wallet (future: on-chain verification)                │
│  Internationalization: next-intl (20+ languages)                    │
└────────────┬──────────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────────────┐
│                   SOLANA BLOCKCHAIN (FUTURE)                          │
│                                                                     │
│  On-Chain Program: Academy.sol (Anchor)                             │
│  XP Token: Token-2022 (soulbound, non-transferable)                 │
│  Credentials: ZK-compressed PDAs via Light Protocol                 │
└────────────────────────────────────────────────────────────────────────┘
```

## 3. Page Specifications

### 3.1 Home Page (`/`)

**Purpose:** Landing page showcasing platform features and value proposition

**Sections:**
1. **Hero Section**
   - Platform title & tagline
   - CTA buttons: "Explore Courses" & "Get Started"
   - Hero image or animated background

2. **Features Section**
   - Interactive Code Learning
   - On-Chain Credentials
   - Global Leaderboard
   - Community-Driven Content

3. **Quick Stats**
   - Total courses available
   - Active learners (from on-chain)
   - Total XP awarded (from on-chain)

4. **Featured Courses**
   - Curated course cards
   - Difficulty badges
   - Enroll buttons

**Key Components:**
- `Header`
- `CourseCard`
- `Button`
- `Footer`

---

### 3.2 Courses Page (`/courses`)

**Purpose:** Browse and search all available courses

**Sections:**
1. **Search & Filter Bar**
   - Text search (by course name, description)
   - Filter by difficulty (Beginner, Intermediate, Advanced)
   - Filter by track (Solana Basics, Token Standard, DeFi, etc.)
   - Sort by (popularity, newest, duration)

2. **Course Grid**
   - Responsive grid layout (1-3 columns)
   - Each card shows:
     - Course thumbnail
     - Title & description
     - Difficulty badge
     - Duration estimate
     - XP reward
     - Enrollment status (Not started / In progress / Completed)
     - Instructor name

3. **Pagination or Infinite Scroll**
   - Load 12-24 courses per page/scroll

**Key Components:**
- `CourseCatalog`
- `CourseCard`
- `Input` (search)
- `Button` (filter)
- `Card`

**Key Services:**
- `course.service.ts`: `getAllCourses()`, `searchCourses()`, `filterCourses()`

---

### 3.3 Course Detail Page (`/courses/[slug]`)

**Purpose:** View detailed course information and access lessons

**Sections:**
1. **Course Header**
   - Banner/thumbnail
   - Title, description
   - Instructor info (avatar, bio, credentials)
   - Difficulty level, duration, XP reward
   - "Enroll" or "Continue Learning" CTA

2. **Tabs: About | Modules | Reviews**

   **About Tab:**
   - Full course description
   - Learning objectives (bullet list)
   - Prerequisites (if any)
   - Student reviews & ratings (future)

   **Modules Tab:**
   - Collapsible list of lessons
   - Each lesson shows:
     - Lesson title & description
     - Estimated duration
     - Difficulty
     - Lock icon (if prerequisites not met)
     - Completion status (not started / in progress / completed)
     - "Start Lesson" button

   **Reviews Tab:**
   - Student ratings & testimonials (future)

3. **Right Sidebar: Progress Widget**
   - Progress bar (lessons completed / total)
   - Current streak
   - XP earned in this course
   - Certificate status (pending / earned)
   - "Download Certificate" button (if completed)

**Key Components:**
- `Card`
- `Button`
- `ResizablePanel`
- `CodeEditor` (preview)

**Key Services:**
- `course.service.ts`: `getCourseById()`, `getCourseWithLessons()`
- `learning-progress.service.ts`: `getProgress()`

---

### 3.4 Lesson Page (`/courses/[slug]/lessons/[id]`)

**Purpose:** Complete individual lessons with code editor

**Layout:** Resizable side-by-side panels

**Left Panel (60% width):**
1. **Lesson Header**
   - Lesson title
   - Difficulty badge
   - Estimated duration

2. **Lesson Content**
   - Instructions (markdown formatted)
   - Code examples
   - Links to resources
   - Tips & hints section

3. **Submission Status**
   - "Run Code" button
   - "Submit Solution" button
   - Loading spinner during execution
   - Success/failure message with feedback

**Right Panel (40% width):**
1. **Code Editor** (`CodeEditor` component)
   - Monaco Editor instance
   - Language: JavaScript / Rust / TypeScript
   - Pre-filled starter code
   - Syntax highlighting
   - Auto-complete & suggestions

2. **Console Output**
   - Execution output
   - Error logs
   - Test results

3. **Challenge Info**
   - Expected output
   - Test cases
   - Hints (progressively revealed)

**Key Components:**
- `CodeEditor`
- `ChallengeRunner`
- `ResizablePanel`
- `Card`
- `Button`

**Key Services:**
- `course.service.ts`: `getLesson()`, `submitChallenge()`
- `learning-progress.service.ts`: `updateProgress()`, `awardXP()`

---

### 3.5 Dashboard Page (`/dashboard`)

**Purpose:** Learner overview of progress and achievements

**Sections:**
1. **Welcome Banner**
   - Greeting with learner name
   - Current XP & level
   - Current streak (days)

2. **Statistics Cards**
   - Courses in progress (count)
   - Courses completed (count)
   - Total XP earned (count)
   - Rank on leaderboard (if connected to on-chain)
   - Current streak (days)

3. **In-Progress Courses**
   - Cards showing:
     - Course name & thumbnail
     - Progress bar
     - Lessons remaining
     - Estimated time to complete
     - "Continue" button

4. **Recent Achievements**
   - Achievement badges (images)
   - Achievement name & description
   - Date earned
   - XP value

5. **XP History Graph** (future)
   - Line chart of XP earned over time
   - Filters: last 7 days, 30 days, all-time

6. **Recommended Courses**
   - Personalized recommendations based on progress
   - Course cards with "Enroll" button

**Key Components:**
- `GamificationUI`
- `Card`
- `Button`
- `ProgressBar` (custom)
- `Chart` (for XP history)

**Key Services:**
- `learning-progress.service.ts`: `getLearnerDashboard()`, `getAchievements()`, `getStats()`

---

### 3.6 Leaderboard Page (`/leaderboard`)

**Purpose:** Display global rankings based on XP (requires on-chain integration)

**Sections:**
1. **Filter & Sort**
   - Season selector (if multiple seasons exist)
   - Timeframe (all-time, this season, this month, this week)
   - Filter by track/category

2. **Leaderboard Table**
   - Columns: Rank | User | XP | Level | Courses Completed | Last Active
   - Clickable rows for user profiles
   - Highlight current user's row
   - Pagination (top 500 visible)

3. **Tabs: Global | Friends | Your Track**
   - Global: All users
   - Friends: Users you're following (future)
   - Your Track: Users in same track (future)

**Key Components:**
- `Card`
- `Button`
- `Table` (custom)
- `Input` (filters)

**Key Services:**
- (Future) On-chain service to fetch XP holders via Helius DAS API
- `learning-progress.service.ts`: `getLeaderboard()`

---

### 3.7 Profile Page (`/profile`)

**Purpose:** View & edit learner profile

**Sections:**
1. **Profile Header**
   - Avatar
   - Display name
   - Bio
   - Email
   - Wallet address (if connected)
   - Join date
   - "Edit Profile" button (for current user)

2. **Stats Section**
   - Total XP earned
   - Current level
   - Courses completed
   - Current streak
   - Achievements unlocked
   - Rank on leaderboard

3. **Completed Courses**
   - List of finished courses
   - Completion date
   - XP earned
   - "View Certificate" button for each

4. **Certificates**
   - Issued on-chain credentials
   - Verification link (on-chain proof)
   - Share button (social media)

5. **Activity Timeline** (future)
   - Recent lessons completed
   - Achievements earned
   - Timestamps

**Key Components:**
- `Card`
- `Button`
- `Avatar` (custom)
- `Badge` (for achievements)

**Key Services:**
- `learning-progress.service.ts`: `getLearnerProfile()`, `updateProfile()`
- (Future) On-chain service to fetch credentials

---

### 3.8 Certificates Page (`/certificates/[id]`)

**Purpose:** View issued certificate details

**Sections:**
1. **Certificate Display**
   - Certificate template (on-chain credential proof)
   - Course name
   - Issue date
   - Learner name
   - Unique certificate ID / verification hash
   - Solana transaction link (for on-chain verification)

2. **Actions**
   - Download certificate (PDF)
   - Share link
   - Verify on-chain (blockchain explorer link)

3. **Open Badge Integration** (future)
   - OpenBadge metadata
   - Import to badge wallet

**Key Components:**
- `Card`
- `Button`

**Key Services:**
- (Future) On-chain service to verify credentials

---

### 3.9 Settings Page (`/settings`)

**Purpose:** User preferences and account management

**Sections:**
1. **Profile Settings**
   - Edit name, email, bio
   - Change avatar
   - Update password (if email auth)

2. **Preferences**
   - Language selection (20+ languages via next-intl)
   - Theme (light / dark mode)
   - Notification settings
   - Email notifications (future)

3. **Privacy & Security**
   - Two-factor authentication (future)
   - Connected wallets (future)
   - Sessions (devices logged in)
   - Delete account

4. **Learning Settings**
   - Difficulty preference (Beginner, Intermediate, Advanced)
   - Tracks of interest (multi-select)
   - Auto-save code editor state (enable/disable)
   - Code editor theme (choose from Monaco themes)

5. **Export Data**
   - Export learning progress (JSON/CSV)
   - Export certificates (ZIP)

**Key Components:**
- `Card`
- `Input`
- `Button`
- `Toggle` (custom)
- `Select` (custom)

**Key Services:**
- `learning-progress.service.ts`: `updateSettings()`, `exportData()`

---

## 4. Data Models

### Learner
```typescript
interface Learner {
  id: string;                    // Unique identifier (UUID or wallet address)
  wallet?: PublicKey;            // Optional Solana wallet
  displayName: string;
  bio?: string;
  avatar?: string;               // IPFS or CDN URL
  email?: string;
  joinedAt: Date;
  totalXP: number;               // Cached, updates when claims credentials
  currentStreak: number;         // Days
  achievements: Achievement[];
  enrollments: Enrollment[];
}
```

### Course
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  track: string;                 // E.g., "Solana Basics", "Token Standard"
  duration: number;              // Minutes
  xpReward: number;              // Total XP for completing all lessons
  instructor: Instructor;
  thumbnail?: string;            // IPFS or CDN URL
  prerequisites?: string[];      // Course IDs
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Lesson
```typescript
interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;                 // Sequence within course
  content: string;               // Markdown
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: 'javascript' | 'rust' | 'typescript';
  starterCode: string;
  testCases: TestCase[];
  hints: string[];               // Revealed progressively
  xpReward: number;              // XP for completing this lesson
  estimatedDuration: number;     // Minutes
  resources?: Resource[];        // Links to external resources
}
```

### Enrollment
```typescript
interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;              // Percentage (0-100)
  lessonsCompleted: Lesson[]     // Array of completed lesson IDs
  xpEarned: number;              // XP from this course
}
```

### Achievement
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;                  // IPFS or CDN URL
  xpValue: number;
  criteria: AchievementCriteria; // E.g., { type: 'course_complete', value: 'course_id' }
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

### Credential (Future - On-Chain)
```typescript
interface Credential {
  id: string;                    // On-chain PDA address
  learnerId: PublicKey;          // Solana wallet
  courseId: string;
  issuedAt: Date;
  issuedOn: PublicKey;           // Solana block height / slot
  trackId: number;               // For track-level credentials (upgraded per new course)
  verificationHash: string;      // For blockchain proof
  metadata: {
    courseName: string;
    courseIcon: string;
    completionProof: string;     // Link to Arweave
  }
}
```

## 5. User Flows

### Flow 1: Browse & Enroll in Course

```
1. User lands on homepage
2. Clicks "Explore Courses"
3. Navigates to /courses page
4. Searches or filters courses
5. Clicks on a course card → /courses/[slug]
6. Reviews course details
7. Clicks "Enroll" button
   └─ Enrollment record created
   └─ Redirects to dashboard
8. Sees course in "In Progress" section
```

### Flow 2: Complete a Lesson

```
1. User clicks "Continue Learning" on course card
2. Navigates to first incomplete lesson → /courses/[slug]/lessons/[id]
3. Reads instructions & starter code
4. Writes solution in code editor
5. Clicks "Run Code" to test locally
6. Clicks "Submit Solution" to verify
7. Backend validates against test cases
   └─ Success: Awards XP, marks lesson complete, shows next lesson CTA
   └─ Failure: Shows error feedback & hints
8. Completes all lessons in course
9. Course marked as "Completed"
10. On-chain credential issued (future)
```

### Flow 3: View Profile & Achievements

```
1. User clicks profile icon in header
2. Navigates to /profile/[wallet] (public) or /profile (self, editable)
3. Views learner stats & achievements
4. Sees completed courses with certificates
5. Can share profile link or claim credentials on-chain
```

### Flow 4: Check Leaderboard Ranking

```
1. User clicks "Leaderboard" in navigation
2. Navigates to /leaderboard
3. Filters by timeframe & track (optional)
4. Sees ranking with current XP position
5. Can compare with friends (future)
6. Clicks on another user → sees their public profile
```

## 6. API Endpoints (Backend Requirements)

Since this is frontend-focused, backend endpoints should support:

### Courses
- `GET /api/v1/courses` - List all courses (paginated, filterable)
- `GET /api/v1/courses/[id]` - Get course details with lessons
- `GET /api/v1/courses/[id]/lessons/[lessonId]` - Get single lesson

### Learner & Progress
- `POST /api/v1/learners` - Create learner profile
- `GET /api/v1/learners/[id]` - Get learner profile
- `PATCH /api/v1/learners/[id]` - Update profile
- `GET /api/v1/learners/[id]/progress` - Get all enrollments & progress
- `GET /api/v1/learners/[id]/achievements` - Get achievements
- `GET /api/v1/learners/[id]/leaderboard-rank` - Get current rank

### Enrollments
- `POST /api/v1/enrollments` - Enroll in course
- `GET /api/v1/enrollments/[id]` - Get enrollment details
- `PATCH /api/v1/enrollments/[id]` - Update progress

### Submissions
- `POST /api/v1/submissions` - Submit lesson code
- `GET /api/v1/submissions/[id]` - Get submission status/results

### Leaderboard
- `GET /api/v1/leaderboard` - Get top 500 users (paginated)
- `GET /api/v1/leaderboard/rank/[wallet]` - Get specific user rank

### On-Chain (Future)
- `POST /api/v1/on-chain/issue-credential` - Issue on-chain credential
- `GET /api/v1/on-chain/verify/[credentialId]` - Verify credential proof

## 7. Internationalization (i18n)

Using **next-intl** for multi-language support.

**Supported Languages:** 20+ languages (en, es, fr, de, ja, zh, pt, ru, etc.)

**Translation Keys Structure:**
```typescript
export const translations = {
  en: {
    nav: { home, courses, dashboard, ... },
    home: { title, subtitle, features, ... },
    courses: { title, filters, search, ... },
    errors: { notFound, unauthorized, ... },
    // ... more sections
  },
  // ... other languages
};
```

**Usage in Components:**
```typescript
const { t } = useI18n();
return <h1>{t('home.title')}</h1>;
```

## 8. Performance Requirements

- **Page Load Time**: < 2 seconds (optimal)
- **Code Editor Load**: < 500ms
- **API Response**: < 500ms for most endpoints
- **Bundle Size**: < 200KB (gzipped)

**Optimizations:**
- Code-split React components
- Lazy-load code editor
- Cache course catalog
- Optimize images (WebP, responsive sizes)
- Use TanStack Query for caching

## 9. Security Considerations

- **Input Validation**: Sanitize all user inputs (XSS prevention)
- **Code Execution**: Run user code in isolated sandbox (Web Workers)
- **Authentication**: Wallet signature verification (future)
- **CORS**: Configure for Solana RPC endpoints
- **Secrets**: Never expose private keys; use backend signing for txs (future)

## 10. Testing Strategy

- **Unit Tests**: Services, utilities, hooks
- **Component Tests**: Rendering, interactions
- **Integration Tests**: Workflows (enroll → submit → complete)
- **E2E Tests**: Playwright for critical user paths
- **Code Editor Tests**: Test code execution sandbox

**Target Coverage**: 70%+ for critical paths

## 11. Deployment

- **Environment**: Vercel (Next.js optimized)
- **Staging**: `staging.academy.superteam.io`
- **Production**: `academy.superteam.io`
- **CDN**: Vercel's Edge Network + CloudFlare

## 12. Future Enhancements

- [ ] Live code collaboration (WebRTC)
- [ ] AI-powered hints & solution review
- [ ] Mentorship matching
- [ ] Corporate/institutional accounts
- [ ] Blockchain-verified credentials
- [ ] Mobile app (React Native)
- [ ] Offline-first PWA mode
- [ ] Video lessons integration
- [ ] Peer code reviews
- [ ] Community forums

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
