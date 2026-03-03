# Course Management Service

**Status**: Backend API implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **Authority** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` |

---

## Overview

The Course Management Service provides admin functionality for creating, updating, and managing courses on the platform. It interfaces with the on-chain program.

## On-Chain Program Instructions

| Instruction | Signer | Description |
|-------------|--------|-------------|
| create_course | authority | Register new course |
| update_course | authority | Update course details |
| initialize | authority | One-time platform setup |
| update_config | authority | Rotate backend signer |

## Functions to Implement

### 1. Initialize Platform

```typescript
interface InitializeConfig {
  authority: PublicKey;        // Squads multisig
  backendSigner: PublicKey;    // Initial backend signer
  xpMint?: Keypair;            // Optional custom XP mint
}

async function initializePlatform(
  config: InitializeConfig,
  authority: Keypair
): Promise<{
  configPda: PublicKey;
  xpMint: PublicKey;
}>
```

**On-chain accounts:**
- config (PDA) - created
- xpMint (Keypair) - created as Token-2022
- authority (signer)
- backendMinterRole (PDA) - auto-created
- systemProgram
- tokenProgram (Token-2022)

### 2. Create Course

```typescript
interface CourseParams {
  courseId: string;            // Unique ID (max 50 chars)
  creator: PublicKey;          // Course creator wallet
  contentTxId: string;        // Arweave content transaction
  lessonCount: number;         // Number of lessons (1-255)
  difficulty: 1 | 2 | 3;      // Easy/Medium/Hard
  xpPerLesson: number;         // XP per lesson
  trackId: number;             // Track identifier (1-10)
  trackLevel: number;          // Level within track (1-10)
  prerequisite?: string;        // Optional prerequisite course ID
  creatorRewardXp: number;     // XP reward for creator
  minCompletionsForReward: number; // Threshold for creator reward
}

async function createCourse(
  params: CourseParams,
  authority: Keypair
): Promise<{ coursePda: PublicKey }>
```

### 3. Update Course

```typescript
interface UpdateCourseParams {
  newContentTxId?: string;     // New Arweave content
  newIsActive?: boolean;       // Activate/deactivate
  newXpPerLesson?: number;     // Update XP reward
  newCreatorRewardXp?: number; // Update creator reward
  newMinCompletionsForReward?: number;
}

async function updateCourse(
  courseId: string,
  params: UpdateCourseParams,
  authority: Keypair
): Promise<{ txHash: string }>
```

### 4. Rotate Backend Signer

```typescript
async function rotateBackendSigner(
  newSigner: PublicKey,
  oldSignerPda?: PublicKey,    // Optional: deactivate old minter
  authority: Keypair
): Promise<{ txHash: string }>
```

### 5. Fetch Courses

```typescript
async function getAllCourses(): Promise<Course[]>
async function getActiveCourses(): Promise<Course[]>
async function getCourseById(courseId: string): Promise<Course | null>
async function getCoursesByTrack(trackId: number): Promise<Course[]>
async function getCoursesByCreator(creator: PublicKey): Promise<Course[]>
```

### 6. Fetch Course Details

```typescript
interface Course {
  courseId: string;
  creator: PublicKey;
  contentTxId: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  isActive: boolean;
  prerequisite: string | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  bump: number;
}

async function getCourseDetails(courseId: string): Promise<Course>
```

## Course Data Schema

```typescript
// On-chain Course PDA (192 bytes)
interface OnChainCourse {
  discriminator: "course";
  courseId: string;           // 50 bytes max
  creator: PublicKey;         // 32 bytes
  contentTxId: string;       // 32 bytes (Arweave TX ID)
  lessonCount: u8;           // 1 byte
  difficulty: u8;            // 1 byte
  xpPerLesson: u32;          // 4 bytes
  trackId: u8;                // 1 byte
  trackLevel: u8;             // 1 byte
  isActive: bool;             // 1 byte
  prerequisite: [u8; 50];     // 50 bytes (course_id or empty)
  creatorRewardXp: u32;       // 4 bytes
  minCompletionsForReward: u32; // 4 bytes
  totalCompletions: u32;      // 4 bytes
  bump: u8;                   // 1 byte
  reserved: [u8; 8];          // 8 bytes
}
```

## Content Fetching

```typescript
async function fetchCourseContent(contentTxId: string): Promise<CourseContent>

interface CourseContent {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  index: number;
  title: string;
  contentTxId: string;
  quiz?: Quiz;
}
```

## Admin Dashboard Endpoints

```
POST   /api/admin/courses/create
PUT    /api/admin/courses/:id
DELETE /api/admin/courses/:id (deactivate)
GET    /api/admin/courses
GET    /api/admin/courses/:id
POST   /api/admin/config/rotate-signer
GET    /api/admin/stats
```

## Events

- `CourseCreated` - Emitted on create_course
- `CourseUpdated` - Emitted on update_course
- `ConfigUpdated` - Emitted on update_config
