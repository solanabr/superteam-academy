# Customization Guide

This guide explains how to customize theme, course content, layout, and translations in the current frontend architecture.

## 1) Theme and Brand Customization

Superteam/Solana brand colors used across the app:

- Yellow (accent): `#ffd23f`
- Dark Green (primary): `#2f6b3f`
- Emerald: `#008c4c`
- Cream: `#f7eacb`
- Near-black: `#1b231d`

### Primary files

- `src/app/globals.css`: design tokens and light/dark theme variables.
- `src/app/layout.tsx`: global background gradients.
- `src/components/layout/header.tsx`: wallet/action gradients and navigation styling.
- `src/components/course/course-card.tsx`: course card gradient accents.

### Where to update colors

1. Global tokens:
   - Update CSS variables in `:root` and `.dark` inside `src/app/globals.css`.
2. Branded gradients:
   - Search for `from-[#2f6b3f]` and `to-[#ffd23f]` and replace consistently.

```bash
rg -n "2f6b3f|ffd23f|008c4c" src
```

### Theme mode behavior

- Theme state is stored in `src/lib/store/user-store.ts` (`theme`).
- `src/components/providers/theme-provider.tsx` bridges store state with `next-themes`.
- `src/components/layout/header.tsx` and `src/app/settings/page.tsx` expose theme toggles.

## 2) Adding or Editing Courses

Course data source is currently local and derived:

- Source catalog: `REFERENCE_COURSE_CATALOG.ts`
- App-facing mapped data: `src/lib/data/mock-courses.ts`

### Data model

Course model is defined in `src/types/index.ts`:

- `Course` -> `Module[]` -> `Lesson[]`
- Difficulty: `beginner | intermediate | advanced`
- Lesson kinds: `content | challenge`

### How course mapping works

`src/lib/data/mock-courses.ts`:

- Imports `courses` from `REFERENCE_COURSE_CATALOG.ts`.
- Maps/normalizes duration, objective text, module IDs, lesson IDs, challenge metadata.
- Builds `mockCourses` used by catalog/detail/lesson routes.

### Add a new course

1. Add or update a course in `REFERENCE_COURSE_CATALOG.ts`.
2. Ensure each module/lesson has title, duration, and content.
3. Restart dev server if needed.
4. Validate in:
   - `/courses`
   - `/courses/[slug]`
   - `/courses/[slug]/lessons/[id]`

### If using direct local objects instead of reference mapping

You can append to `mockCourses` shape directly (same interface as `Course`), but the current pattern prefers reference-catalog mapping for consistency.

## 3) Modifying Layouts and Navigation

### App shell

- Root shell: `src/app/layout.tsx`
- Header: `src/components/layout/header.tsx`
- Sidebar: `src/components/layout/sidebar.tsx`
- Footer: `src/components/layout/footer.tsx`

### Route-level layouts

Current route pages render directly in `src/app/*/page.tsx` without nested segment layout files. To add per-section wrappers, create route-level `layout.tsx` files in subfolders.

### Navigation links

- Header nav items: `src/components/layout/header.tsx` (`navItems`).
- Sidebar links: `src/components/layout/sidebar.tsx` (`nav`).
- Footer link columns: `src/components/layout/footer.tsx` (`columns`).

## 4) i18n Translation Customization

Translations live in:

- `src/messages/en.json`
- `src/messages/es.json`
- `src/messages/pt-BR.json`

### Add/modify text

1. Update key values in all locale files.
2. Keep namespace/key parity across files (`Common`, `Courses`, `Dashboard`, etc.).
3. Use existing key access pattern in components:

```tsx
const t = useTranslations("Courses");
```

### Add a new locale

1. Extend `Locale` union in `src/types/index.ts`.
2. Add new dictionary file in `src/messages`.
3. Register it in `src/components/providers/intl-provider.tsx` (`dictionaries`).
4. Add selector option in header/settings components.

## 5) UX Copy and Microcontent

High-impact copy surfaces:

- Landing: `src/app/page.tsx`
- Course catalog: `src/app/courses/page.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
- Auth screens: `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`

Prefer moving hardcoded strings into i18n files when localizing new sections.
