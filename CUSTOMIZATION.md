# 🔧 Customization Guide

This guide covers how to customize and extend the Superteam Academy platform to fit your community's needs.

## 1. Theme Customization (Colors & Styles)

The platform is built using Tailwind CSS and CSS variables, allowing for easy theme adjustments without changing the component logic.

### Changing Core Colors

1.  Open `app/src/app/globals.css`.
2.  Locate the `:root` (Light Mode) and `.dark` (Dark Mode) blocks.
3.  Modify the HSL values for the following variables:
    *   `--background`: Main background color.
    *   `--foreground`: Primary text color.
    *   `--primary`: The accent color for buttons and highlights.
    *   `--card`: Background color for cards and containers.

**Example: Change primary color to Solana Green:**

*CSS*
.dark {
  --primary: 142.1 70.6% 45.3%; /* Vibrant Green */
  --primary-foreground: 144.1 5.8% 0%;
}
*css*

## 2. Adding a New Language (i18n)

We use `next-intl` for full internationalization. To add a new language (e.g., German - `de`):

### Step 1: Create the Dictionary
Create a new file `app/messages/de.json` and copy the structure from `en.json`:

```Json
{
  "Navigation": {
    "dashboard": "Dashboard",
    "courses": "Kurse",
    "leaderboard": "Bestenliste"
  },
  ...
}
```

### Step 2: Configure Routing
1. Update `app/src/i18n/routing.ts`:

```Ts
export const routing = defineRouting({
  locales: ['en', 'es', 'pt-BR', 'de'], // Add 'de'
  defaultLocale: 'en'
});
```

2. Update the matcher in `app/src/middleware.ts`:

```Ts
export const config = {
  matcher: ['/', '/(en|es|pt-BR|de)/:path*']
};
```

### Step 3: Update the Switcher
Add the new option to `app/src/components/language-switcher.tsx`:

```Tsx
<SelectContent>
  <SelectItem value="en">English</SelectItem>
  <SelectItem value="de">Deutsch</SelectItem>
  ...
</SelectContent>
```

## 3. Extending Gamification

### Adding New Achievements

1.  **Database Entry:** Use the Admin API or the `register-achievements-api.ts` script to add a new achievement type to the database and blockchain.
2.  **Trigger Logic:** Add a logic check in `app/src/app/api/verify-lesson/route.ts`.

```Ts
// Example: Award badge for completing 5 lessons in total
const completedCount = await tx.lessonProgress.count({
    where: { userId: user.id, status: "completed" }
});

if (completedCount === 5) {
    await checkAndAwardAchievement(user.id, walletAddress, "high-five-badge");
}
```

### Modifying Daily Quests

The quest system is dynamic. To add a new quest, simply add a record to the `Challenge` table with `period: "DAILY"`. If the type is `LESSON_COUNT`, the progress tracking is handled automatically by the `verify-lesson` API.

## 4. Performance & Analytics

*   **Analytics:** To change the tracking provider, update `app/src/components/providers/posthog-provider.tsx`.
*   **Error Tracking:** Sentry configuration can be found and modified in `sentry.client.config.ts` and `sentry.server.config.ts`.