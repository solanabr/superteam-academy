# Content Synchronization Guide (Backend)

Osmos Academy uses Sanity as its primary content authoring tool. However, the application requires this data to reside locally in the MongoDB instance for performant querying and cross-referencing with user states.

This guide outlines the backend's role in this pipeline.

## 🔄 The Sync Process

Because the frontend Next.js app communicates primarily with the SolLearn API, the backend acts as the bridge that caches Sanity's content.

1. **Triggering a Sync**: An authenticated Admin (via the `/osadmin` frontend dashboard) triggers a synchronization request to the backend API.
2. **Fetching Data**: The backend connects to the Sanity project using the `@sanity/client` and executes GROQ queries to pull down the latest *published* content (Courses, Milestones, Lessons, Quizzes, etc.).
3. **Parsing & Normalizing**: The data payloads are parsed and normalized to fit the strict Mongoose schemas defined in `src/models/`.
4. **Upserting to MongoDB**: The backend performs atomic upsert operations in MongoDB. It links the nested relationships (e.g., associating Lessons to Milestones, and Milestones to Courses) accurately based on Sanity's reference schemas.

## 🗂️ Mongoose Schemas & Mapping

The backend maintains mirrors of the Sanity schemas:
- **Course Model**: Holds title, description, thumbnail URL, and references to nested milestones.
- **Milestone Model**: Groups the learning materials and outlines the required `xpReward`.
- **Lesson/Challenge Models**: Contains the raw text content (or block content references) and test cases for code execution.

*Note: The backend schemas might not reflect a 1:1 mapping of Sanity's rich text blocks. Often, rich text is stored dynamically as JSON or strings, while structured properties (references, XP, strings) are mapped strictly.*

## ⚙️ Automating Syncs (Webhooks)

While manual syncing is currently implemented via the Admin dashboard, the architecture supports Webhook integration.
In the future, Sanity Webhooks can be configured to POST directly to a secured backend endpoint (e.g., `/api/v1/sanity/webhook`) whenever a document is published or deleted in Sanity. The backend would verify the webhook signature and granularly update only the modified document in MongoDB.
