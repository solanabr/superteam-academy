# On-chain Academy CMS Guide

This guide explains how to manage content on the On-chain Academy platform using our embedded Sanity Studio CMS.

## Table of Contents
1. [Overview](#overview)
2. [Accessing the Studio](#accessing-the-studio)
3. [Content Types](#content-types)
4. [Creating a Course](#creating-a-course)
5. [Managing Lessons and XP](#managing-lessons-and-xp)
6. [Best Practices](#best-practices)

## Overview
On-chain Academy uses **Sanity.io** as a headless CMS to store and serve all course and lesson content. The CMS is built directly into the Next.js application, allowing administrators and professors to manage curriculums without leaving the platform context.

## Accessing the Studio
To access the Sanity Studio dashboard:
1. Ensure you are logged in as an administrator or professor.
2. Navigate to `[Your-Domain]/studio` (e.g., `http://localhost:3000/studio`).
3. You will see the "Course Studio" interface where you can manage all schemas.

> [!NOTE]
> The `/studio` route bypasses internationalization (i18n) middleware to ensure the CMS loads correctly without locale prefixes.

## Content Types

### 1. Courses
Courses are the top-level organizational units. Each course contains a title, description, language, prerequisites, and a list of lessons.
- **Fields**: Title, Slug, Description, Language, Categories, Difficulty.

### 2. Modules / Chapters (Lessons)
A lesson is a distinct piece of educational content within a course.
- **Fields**: Title, Module ID, Content (Rich Text + Code Blocks), XP Reward.

## Creating a Course
1. Open the Studio and select **Courses** from the left navigation pane.
2. Click the `+` or "Create new" button in the top right.
3. Fill in the **Title** and automatically generate the **Slug**.
4. Configure the **Prerequisites** if the learner must complete another course first.
5. Define the **Reward Mint** address if this course issues an on-chain Metaplex Core credential upon completion.

## Managing Lessons and XP
When creating a **Lesson** document:
1. Assign it an **XP Reward** (e.g., 100 XP). This is the exact amount of Token-2022 XP tokens the user will be minted on-chain when they complete the lesson.
2. Write content using the Portable Text editor.
3. For interactive coding exercises, use the **Code Editor** block if configured, mapping JDoodle language parameters.

> [!IMPORTANT]
> The order of lessons is determined by the array reference list in the parent **Course** document. Ensure you drag-and-drop the lessons into the correct chronological order inside the Course view.

## Best Practices
- **Never change a Course Slug** after it has been published and students have enrolled, as enrollments are tied to the slug/ID.
- Ensure the total XP of a course aligns with your gamification strategy.
- Always preview lessons via the frontend before publishing.
