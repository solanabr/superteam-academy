# Content Management System Guide

Superteam Academy features a robust, dual-dashboard approach for managing course content, user data, and platform analytics. Authorized individuals and administrators can choose the environment that best fits their workflow.

## Management Interfaces

### 1. Custom Admin Dashboard (`/en/admin`)

A streamlined, user-friendly interface built directly into the Next.js frontend. Designed for quick course management, user oversight, and analytics monitoring within the academy's native UI.

**Features:**

- **Overview** (`/en/admin`) - Dashboard with KPIs, charts, and recent activity
- **Courses** (`/en/admin/courses`) - Browse, edit, and manage course metadata
- **CMS Creator** (`/en/admin/cms`) - Visual course builder with module/lesson tree
- **Users** (`/en/admin/users`) - User management, roles, and moderation
- **Analytics** (`/en/admin/analytics`) - Platform metrics, funnels, and leaderboards

**Access Control:**

- Requires `admin` or `instructor` role in the Users collection
- Authenticated via Better Auth session
- Role-based permissions enforced at API level

### 2. Payload CMS Dashboard (`/admin`)

The underlying headless CMS admin panel providing complete, granular database control over all collections. Ideal for deep structural edits, bulk operations, and advanced data management.

**Collections Available:**

- **Courses** - Top-level course metadata and configuration
- **Modules** - Course sections and organizational structure
- **Lessons** - Individual learning units within modules
- **Lesson Contents** - Rich content blocks (markdown, video, quizzes, challenges)
- **Users** - Learner profiles, authentication, and roles
- **XP Records** - Experience point transactions and history
- **Streaks** - Daily learning streak tracking
- **Reviews** - Course ratings and feedback
- **Media** - Uploaded images, videos, and assets

**Access Control:**

- Requires Payload admin credentials (separate from Better Auth)
- Full CRUD operations on all collections
- Advanced filtering, sorting, and bulk editing

## Content Schema

The educational content follows a strict hierarchical structure to ensure logical learning flow and proper data relationships.

### Hierarchy

```
Course
├── Module 1
│   ├── Lesson 1.1
│   │   └── Lesson Content (blocks, quiz, challenge)
│   ├── Lesson 1.2
│   │   └── Lesson Content
│   └── Lesson 1.3
├── Module 2
│   ├── Lesson 2.1
│   └── Lesson 2.2
└── Module 3
```

### Collection Details

#### Courses

The top-level syllabus defining the umbrella topic, learning outcomes, and course-wide metadata.

**Key Fields:**

- `title` (localized) - Course name in EN, ES, PT
- `slug` - URL-friendly identifier (auto-generated from title)
- `description` (localized) - Short summary (max 300 chars)
- `longDescription` (localized) - Rich text overview
- `difficulty` - Beginner | Intermediate | Advanced
- `duration` - Estimated completion time (e.g., "8 hours")
- `xpReward` - Total XP earnable for course completion
- `topic` - Category (e.g., "Core", "DeFi", "Security", "NFTs")
- `thumbnail` - Media upload for course card
- `learningOutcomes` - Array of learning objectives
- `prerequisites` - Array of prerequisite knowledge/courses
- `status` - `draft` | `published`
- `certificate` - Boolean for certificate eligibility
- `onChainCredential` - Boolean for NFT credential minting
- `instructor` - Relationship to Users collection
- `onChainCourseId` - Maps to Solana program course PDA

**Computed Fields:**

- `totalLessons` - Auto-calculated from related lessons
- `enrollmentCount` - Live enrollment count
- `rating` - Average rating (0-5)
- `ratingCount` - Total number of ratings

#### Modules

Sub-sections grouping related lessons within a course. Modules define major learning milestones.

**Key Fields:**

- `title` (localized) - Module name
- `course` - Relationship to parent Course
- `sortOrder` - Numerical order within course (0, 1, 2...)

**Usage:**

- Modules provide logical breaks in curriculum
- Each module should focus on a specific sub-topic
- Order determines display sequence in frontend

#### Lessons

The atomic units of learning. Each lesson represents a single learning activity.

**Key Fields:**

- `title` (localized) - Lesson name
- `module` - Relationship to parent Module
- `type` - `video` | `reading` | `code_challenge` | `quiz` | `hybrid`
- `duration` - Estimated time (e.g., "15 min")
- `xpReward` - XP earned upon completion
- `sortOrder` - Numerical order within module (0, 1, 2...)
- `onChainLessonIndex` - Maps to bitmap index in Solana Enrollment account

**Lesson Types:**

- **Video** - Video content with optional transcript
- **Reading** - Text-based educational content
- **Code Challenge** - Interactive coding exercise with tests
- **Quiz** - Multiple choice or code-based assessment
- **Hybrid** - Combination of multiple content types

#### Lesson Contents

The actual educational material tied to a lesson. Supports rich, interactive content blocks.

**Key Fields:**

- `lesson` - One-to-one relationship with Lesson (unique)
- `blocks` - Array of content blocks (ordered)
- `challenge` - Code challenge configuration (optional)
- `quiz` - Quiz configuration (optional)
- `hints` - Array of progressive hints
- `solution` - Solution explanation or code

**Content Blocks:**

1. **Markdown Block**
   - `blockType: 'markdown'`
   - `content` (localized) - Markdown text with code syntax highlighting
   - Supports: headings, lists, links, inline code, code blocks

2. **Video Block**
   - `blockType: 'video'`
   - `url` - Video embed URL (YouTube, Vimeo, etc.)
   - `videoTitle` (localized) - Video title

3. **Callout Block**
   - `blockType: 'callout'`
   - `content` (localized) - Callout text
   - `calloutVariant` - `info` | `warning` | `tip`

**Challenge Configuration:**

- `prompt` (localized) - Challenge description
- `objectives` - Array of learning objectives
- `starterCode` - Pre-populated code template
- `language` - `rust` | `typescript` | `json`
- `testCases` - Array of test cases with expected outputs
- `solutionCode` - Reference solution

**Quiz Configuration:**

- `questions` - Array of quiz questions
  - `questionType` - `radio` (single choice) | `checkbox` (multiple choice) | `code`
  - `prompt` (localized) - Question text
  - `options` (localized) - Array of answer choices
  - `correctIndex` - Zero-based index for radio questions
  - `correctIndices` - Array of indices for checkbox questions
  - `starterCode` - For code-based questions
  - `expected` - Expected code output

## Creating and Editing Courses

### Workflow Overview

Whether using the Custom Admin Dashboard or Payload CMS, follow this logical flow:

1. **Initialize the Course** → 2. **Build Modules** → 3. **Create Lessons** → 4. **Author Content** → 5. **Publish**

### Step-by-Step Guide

#### 1. Initialize the Course

**In Custom Admin Dashboard:**

- Navigate to `/en/admin/courses`
- Click "Create New Course"
- Fill out course metadata form
- Set status to "Draft"
- Save course

**In Payload CMS:**

- Navigate to `/admin/collections/courses`
- Click "Create New"
- Fill out all required fields:
  - Title (EN, ES, PT)
  - Description (localized)
  - Difficulty level
  - XP reward
  - Topic/category
- Upload thumbnail image
- Add learning outcomes and prerequisites
- Set status to "Draft"
- Save

**Best Practices:**

- Use clear, descriptive titles
- Keep descriptions concise (under 300 chars)
- Set realistic XP rewards (100-5000 range)
- Always start in Draft mode

#### 2. Build the Skeleton (Modules)

**In Custom Admin Dashboard:**

- Navigate to `/en/admin/cms`
- Select your course from dropdown
- Click "Add Module"
- Enter module title (localized)
- Set sort order (0, 1, 2...)
- Save module

**In Payload CMS:**

- Navigate to `/admin/collections/modules`
- Click "Create New"
- Enter module title (localized)
- Select parent course from relationship dropdown
- Set `sortOrder` (0 for first module, 1 for second, etc.)
- Save

**Module Planning:**

- Aim for 3-7 modules per course
- Each module should cover a distinct sub-topic
- Order modules from foundational to advanced
- Use descriptive module titles (e.g., "Introduction to Accounts", "Building Your First Program")

#### 3. Create Lessons

**In Custom Admin Dashboard:**

- Navigate to `/en/admin/cms`
- Expand module in course tree
- Click "Add Lesson"
- Fill out lesson form:
  - Title (localized)
  - Type (video, reading, challenge, quiz)
  - Duration estimate
  - XP reward
  - Sort order
- Save lesson

**In Payload CMS:**

- Navigate to `/admin/collections/lessons`
- Click "Create New"
- Fill out fields:
  - Title (localized)
  - Select parent module
  - Choose lesson type
  - Set duration (e.g., "15 min")
  - Set XP reward (10-100 typical range)
  - Set `sortOrder` within module
- Save

**Lesson Planning:**

- Start with reading/video lessons for theory
- Follow with challenges/quizzes for practice
- Typical lesson: 10-30 minutes
- XP should reflect difficulty and time investment

#### 4. Author the Content

**In Payload CMS:**

- Navigate to `/admin/collections/lesson-contents`
- Click "Create New"
- Select the lesson (one-to-one relationship)
- Build content blocks:

**For Reading Lessons:**

1. Add Markdown blocks
2. Write educational content with proper formatting
3. Use code blocks for examples
4. Add Callout blocks for important notes
5. Order blocks logically

**For Video Lessons:**

1. Add Video block
2. Enter video URL (YouTube embed link)
3. Add video title
4. Optionally add Markdown blocks for context/transcript

**For Code Challenges:**

1. Fill out Challenge section:
   - Write clear prompt
   - List learning objectives
   - Provide starter code template
   - Define test cases with expected outputs
   - Write reference solution
2. Add Markdown blocks for instructions
3. Add hints array for progressive help

**For Quizzes:**

1. Fill out Quiz section:
   - Add questions array
   - For each question:
     - Write prompt
     - Choose question type (radio/checkbox/code)
     - Add answer options (for radio/checkbox)
     - Set correct answer(s)
2. Add Markdown blocks for context

**Content Best Practices:**

- Use clear, concise language
- Break content into digestible chunks
- Include code examples with syntax highlighting
- Add visual aids (images, diagrams) via Media uploads
- Provide hints for challenges (3-5 progressive hints)
- Write detailed solution explanations
- Localize all content (EN, ES, PT)

#### 5. Publish the Course

**Pre-Publishing Checklist:**

- [ ] All modules have titles and correct sort order
- [ ] All lessons have content and correct sort order
- [ ] All lesson contents are complete and localized
- [ ] Course metadata is accurate (XP, duration, difficulty)
- [ ] Thumbnail image is uploaded
- [ ] Learning outcomes and prerequisites are listed
- [ ] Content has been reviewed for quality

**Publishing:**

**In Custom Admin Dashboard:**

- Navigate to `/en/admin/courses`
- Find your course
- Click "Edit"
- Change status from "Draft" to "Published"
- Save

**In Payload CMS:**

- Navigate to `/admin/collections/courses`
- Find your course
- Edit the course
- Change `status` field to "Published"
- Save

**Post-Publishing:**

- Course immediately becomes visible on frontend
- Learners can enroll and start lessons
- XP rewards are activated
- Course appears in course catalog and search

## Publishing Workflow

### Draft vs. Published States

**Draft State:**

- Content is saved in database but hidden from public
- Not visible in course catalog or search
- Not enrollable by learners
- Allows iterative development and QA
- Can be edited freely without affecting live users

**Published State:**

- Content is live and visible to all users
- Appears in course catalog and search results
- Enrollable by learners
- XP rewards are active
- Lesson completion tracked on-chain
- Should only be edited with caution (affects enrolled users)

### Status Transitions

```
Draft → Published → (optional) Archived
```

**Draft → Published:**

- Requires admin or instructor role
- Should only be done after thorough QA
- Irreversible without manual intervention

**Published → Draft (Unpublishing):**

- Possible but not recommended if users are enrolled
- May cause confusion for enrolled learners
- Use "Archived" status instead for deprecated courses

### Role-Based Access Control

**Roles:**

- `learner` - Default role, can enroll and complete courses
- `instructor` - Can create, edit, and publish courses
- `admin` - Full access to all collections and settings

**Permissions:**

| Action                 | Learner | Instructor   | Admin     |
| ---------------------- | ------- | ------------ | --------- |
| View published courses | ✅      | ✅           | ✅        |
| Enroll in courses      | ✅      | ✅           | ✅        |
| Create courses         | ❌      | ✅           | ✅        |
| Edit courses           | ❌      | ✅ (own)     | ✅ (all)  |
| Publish courses        | ❌      | ✅           | ✅        |
| Delete courses         | ❌      | ❌           | ✅        |
| Manage users           | ❌      | ❌           | ✅        |
| View analytics         | ❌      | ✅ (limited) | ✅ (full) |

## Internationalization (i18n)

Superteam Academy supports three languages out of the box:

- **English (EN)** - Primary language
- **Spanish (ES)** - Spanish localization
- **Portuguese (PT)** - Brazilian Portuguese localization

### Localized Fields

The following fields support localization:

- Course: `title`, `description`, `longDescription`, `learningOutcomes`, `prerequisites`
- Module: `title`
- Lesson: `title`
- Lesson Content: All `content` fields, `videoTitle`, quiz prompts, challenge prompts

### Translation Workflow

1. **Create content in primary language (EN)**
2. **Add translations for ES and PT:**
   - In Payload CMS, each localized field has tabs for EN/ES/PT
   - Switch tabs to enter translations
   - Ensure all user-facing text is translated
3. **Test in each locale:**
   - Frontend supports `/en/`, `/es/`, `/pt/` routes
   - Verify translations display correctly

### Adding New Languages

To add a new language (e.g., French):

1. Update `payload.config.ts`:

```typescript
localization: {
  locales: ['en', 'es', 'pt', 'fr'],
  defaultLocale: 'en',
}
```

2. Add translation file in `messages/fr.json`

3. Update routing config to recognize `/fr/` paths

4. Translate all existing content in Payload CMS

## Advanced Features

### On-Chain Integration

Courses can be linked to Solana smart contract state:

**Fields:**

- `onChainCourseId` - Course PDA seed (e.g., "anchor-101")
- `trackId` - Maps to on-chain track ID
- `trackLevel` - Level within the track
- `onChainLessonIndex` - Lesson bitmap index in Enrollment account

**Workflow:**

1. Deploy course on-chain using Anchor program
2. Note the course PDA seed
3. Set `onChainCourseId` in Payload CMS
4. Map lesson indices to on-chain bitmap
5. Lesson completions are recorded on-chain

### Credentials and Certificates

**Certificates:**

- Set `certificate: true` on Course
- Learners receive PDF certificate upon completion
- Certificate includes course name, completion date, XP earned

**On-Chain Credentials (NFTs):**

- Set `onChainCredential: true` on Course
- Learners receive soulbound Metaplex Core NFT upon completion
- NFT metadata includes course details and achievement proof
- Minted via `issue_credential` program instruction

### XP Rewards

**Course-Level XP:**

- Set on Course: `xpReward` (total for completing entire course)
- Typically 1000-5000 XP for full courses

**Lesson-Level XP:**

- Set on each Lesson: `xpReward` (earned upon lesson completion)
- Typical ranges:
  - Reading: 10-25 XP
  - Video: 15-30 XP
  - Quiz: 25-50 XP
  - Challenge: 50-100 XP

**XP Distribution:**

- XP is awarded immediately upon lesson completion
- Recorded in `XpRecords` collection with source tracking
- Aggregated for leaderboards and user profiles
- Can be viewed in `/en/admin/analytics`

### Reviews and Ratings

**Review System:**

- Learners can rate courses (1-5 stars) after completion
- Reviews stored in `Reviews` collection
- Course `rating` and `ratingCount` auto-updated
- Displayed on course cards and detail pages

**Managing Reviews:**

- View all reviews in Payload CMS: `/admin/collections/reviews`
- Moderate inappropriate reviews (admin only)
- Export review data for analysis

### Streaks

**Daily Streak Tracking:**

- Automatically tracked in `Streaks` collection
- Increments when user completes any lesson
- Resets if user misses a day
- Displayed in user dashboard

**Streak Management:**

- View streak data: `/admin/collections/streaks`
- Manual adjustments possible (admin only)

## Troubleshooting

### Common Issues

**Course not appearing after publishing:**

- Verify `status` is set to "Published"
- Check that course has at least one module with lessons
- Clear Next.js cache: `npm run build`
- Check browser console for API errors

**Lesson content not displaying:**

- Verify Lesson Content exists for the lesson
- Check that `lesson` relationship is correctly set
- Ensure content blocks are not empty
- Verify localization is complete for current locale

**XP not being awarded:**

- Check that lesson has `xpReward` > 0
- Verify user is authenticated
- Check XP Records collection for transaction
- Review server logs for errors

**Images not loading:**

- Verify image is uploaded to Media collection
- Check that relationship is correctly set
- Ensure image URL is accessible
- Check CORS settings if using external CDN

### Support and Maintenance

**Database Backups:**

- Regular PostgreSQL backups recommended
- Use `pg_dump` for full database exports
- Store backups securely off-site

**Content Versioning:**

- Payload CMS supports draft/published versions
- Consider using Git for content source control
- Document major content changes in release notes

**Performance Optimization:**

- Use Payload's built-in caching
- Optimize images before upload (WebP format recommended)
- Monitor database query performance
- Consider CDN for media assets

## Best Practices Summary

1. **Always start in Draft mode** - Test thoroughly before publishing
2. **Use consistent naming** - Clear, descriptive titles for courses/modules/lessons
3. **Localize all content** - Ensure EN/ES/PT translations are complete
4. **Set realistic XP rewards** - Balance difficulty and time investment
5. **Order content logically** - Use `sortOrder` to create coherent learning paths
6. **Include interactive elements** - Mix reading, video, quizzes, and challenges
7. **Provide progressive hints** - Help learners without giving away solutions
8. **Write detailed solutions** - Explain the "why" behind correct answers
9. **Test before publishing** - Review all content in each locale
10. **Monitor analytics** - Use admin dashboard to track engagement and completion rates

## Additional Resources

- **Architecture Documentation**: See `ARCHITECTURE.md` for technical details
- **Deployment Guide**: See `README.md` for deployment instructions
- **Customization Guide**: See `CUSTOMIZATION.md` for theming and branding
- **Payload CMS Docs**: https://payloadcms.com/docs
- **Next.js Docs**: https://nextjs.org/docs
