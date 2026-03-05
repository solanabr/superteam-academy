# CMS_GUIDE.md

# ✍️ CMS Guide: Creating & Managing Courses

This guide explains how to use the built-in Content Management System (CMS) to create, edit, and publish new courses on the Superteam Academy platform. All content is managed through the secure Admin Dashboard.

## 1. Accessing the Admin Dashboard

1.  **Become an Admin:** First, ensure your account has ADMIN privileges. This is done by a one-time setup step via a secure API endpoint or directly in the database.
2.  **Navigate:** Access the Admin Dashboard by clicking "Creator Studio" in the sidebar and then finding the "Admin" section, or by directly navigating to /admin.

## 2. The Course Registry

Upon entering the "Manage Courses" section (/admin/courses), you will see the Course Registry. This table lists all courses currently in the database.

| Column      | Description                                                                                              |
|-------------|----------------------------------------------------------------------------------------------------------|
| Title       | The public display name of the course.                                                                   |
| Slug        | The unique, on-chain identifier for the course. Cannot be changed after publishing.                      |
| Status      | Draft, Pending, Published, or Rejected.                                                                  |
| Actions     | Allows you to Edit an existing course.                                                                   |

## 3. Creating a New Course

Click the "Create New Course" button to open the Course Builder.

### Step 1: Fill in Course Metadata
This section defines the core properties of your course.
*   **Course Slug:** The on-chain ID. Use lowercase-with-hyphens.
*   **XP / Lesson:** The amount of XP awarded on-chain for completing each lesson.

### Step 2: Build the Curriculum
*   **Add a Module:** Click "Add Module" to create a new section.
*   **Add a Lesson:** Inside a module, click "Add Lesson" to create a new lesson card.

### Step 3: Configure Each Lesson
*   **Validation Rules (JSON):** A JSON array of rules to check the user's code.

```Json
[
  {
    "type": "contains",
    "value": "msg!",
    "errorMessage": "You must use the msg! macro to print a message."
  }
]
```

## 4. The Publishing Workflow

1.  **Save as Draft:** Course is saved to DB with DRAFT status. Not visible to students.
2.  **Publish On-Chain:** Toggle "Publish On-Chain" and click "Save Course". This creates the PDA on the Solana blockchain.
3.  **Editing:** Once published, Slug, XP, and lesson counts are locked. Content and Rules remain editable.

---

# CUSTOMIZATION.md

# 🔧 Customization Guide

This guide covers how to customize and extend the Superteam Academy platform.

## 1. Theme Customization (Colors & Styles)

The platform uses Tailwind CSS with CSS variables.

### Changing Core Colors
Locate the :root and .dark blocks in app/src/app/globals.css.

**Example: Make the dark theme more blue-ish:**
*CSS*
.dark {
  --background: 222.2 84% 4.9%; 
  --primary: 210 40% 96.1%; 
}
*css*

## 2. Adding a New Language (i18n)

### Step 1: Add a Messages File
Create app/messages/fr.json:

```Json
{
  "Navigation": {
    "dashboard": "Tableau de bord",
    "courses": "Cours"
  }
}
```

### Step 2: Update i18n Configuration
Update app/src/i18n/routing.ts and app/src/middleware.ts.

```Ts
export const routing = defineRouting({
  locales: ['en', 'es', 'pt-BR', 'fr'],
});
```

### Step 3: Add the Language Switcher
Open app/src/components/language-switcher.tsx.

```Tsx
<SelectItem value="fr">Français</SelectItem>
```

## 3. Extending Gamification

### Adding a New Achievement
1.  **Define in DB:** Run the script app/scripts/register-achievements-api.ts with a new object.
2.  **Add Trigger Logic:** Update verify-lesson/route.ts.

```Ts
const lessonsToday = await tx.lessonProgress.count({
    where: { userId: user.id, completedAt: { gte: startOfDay } }
});
if (lessonsToday === 3) {
    checkAndAwardAchievement(user.id, walletAddress, "speed-runner");
}
```

### Adding a New Daily Quest
Define in DB via seed-challenges.ts. If the type is LESSON_COUNT, the logic in verify-lesson will handle it automatically.