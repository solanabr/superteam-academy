# Contributing to Superteam Academy

Thank you for your interest in contributing to Superteam Academy! This guide will help you get started.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/superteam-brazil-academy.git`
3. Install dependencies: `cd app && npm install --legacy-peer-deps`
4. Copy `.env.local.example` to `.env.local` and fill in your keys
5. Start the dev server: `npm run dev`

## 📚 Adding a New Course

Courses are stored in **MongoDB**. To add a course via the Admin Dashboard:

1. Get admin access (contact the maintainer with your wallet address)
2. Navigate to `/admin/courses` → **Create New Course**
3. Fill in course metadata: title, slug, description, difficulty, tags
4. Use the **Curriculum Editor** to add modules and lessons
5. Set `isPublished: true` when ready

### Lesson Types

| Type        | Description                               |
| ----------- | ----------------------------------------- |
| `text`      | Markdown content with syntax highlighting |
| `video`     | YouTube/Arweave embed + text content      |
| `challenge` | Code editor with test cases               |
| `quiz`      | Multiple-choice questions                 |

## 🌐 Adding a Translation

1. Create a new JSON file in `app/messages/` (e.g., `fr.json`)
2. Copy the structure from `en.json` and translate all strings
3. Add the new locale to `app/src/i18n/routing.ts`
4. Update the language switcher in `Navbar.tsx`

## 🎨 Code Style

- **TypeScript** — strict mode, avoid `any`
- **Tailwind CSS** — use design tokens from the theme
- **Components** — use Shadcn/UI primitives
- **Naming** — PascalCase for components, camelCase for functions

## 🔀 Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit with descriptive messages: `git commit -m "feat: add quiz workspace"`
3. Push and open a PR against `main`
4. Ensure the build passes before requesting review

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
