# Content Management Guide (CMS)

Osmos Academy uses **Sanity** as its headless CMS for managing courses, lessons, and interactive challenges. The Sanity Studio is embedded directly into the frontend.

## 🔑 Accessing the Studio
You can access the CMS by navigating to `/studio` in your local development environment or production application. You must be authenticated with Sanity to make changes.

## 🏗️ Content Hierarchy & Schemas

The content is structured hierarchically. When creating a new curriculum, follow this order:

1. **Authors & Tracks** 
   - Define instructors (`author`) and broader learning categories (`track`).
2. **Quizzes & Code Challenges (`quiz`, `codeChallenge`)**
   - Create the assessment materials first so they can be easily linked later.
3. **Lessons (`lesson`)**
   - Contains educational content. Can be `video`, `document`, or `text` (using the block content editor).
4. **Milestones (`milestone`)**
   - A logical grouping of lessons and tests within a course. A milestone comprises multiple lessons and requires at least one test (quiz or challenge). Define an `xpReward` for completing it.
5. **Courses (`course`)**
   - The top-level document. Connects Milestones, Author, and Track. Includes metadata like difficulty, topic, thumbnail, and short description.

## 📝 Publishing Workflow

1. **Drafting**: When creating new documents in Sanity, they start as drafts. They are automatically saved but not yet visible to players.
2. **Publishing**: Click the "Publish" button on a document to finalize it.
3. **Synchronization**: 
   - Since the main application relies on a MongoDB database for fast querying and relational state (like user progress), content must be **synced** from Sanity to the backend.
   - **Manual Sync**: Administrators can trigger a sync via the `/osadmin` dashboard. This pushes the latest published Sanity content to the backend.

## 💡 Tips for Editors
- **Rich Text (Block Content)**: Use the block editor for text lessons to add rich formatting and embed code snippets.
- **Short Descriptions**: Keep course short descriptions under 160 characters for optimal display on course cards.
- **Tags**: Use tags liberally to help users filter courses in the catalog.
