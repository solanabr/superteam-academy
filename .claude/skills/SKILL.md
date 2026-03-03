# Solana Academy — Frontend Skill

This document is the canonical reference for frontend development on the Solana Academy Platform.

## Core Technology Stack

| Component | Technology | Version |
| --- | --- | --- |
| Framework | Next.js | 14.2+ |
| UI Framework | React | 18.3+ |
| Language | TypeScript | 5.5+ |
| Styling | Tailwind CSS | 3.4+ |
| Client State | Zustand | 4.5+ |
| Server State | TanStack Query | 5.48+ |
| Wallet Integration | @solana/wallet-adapter | 0.15+ |
| i18n | next-intl | 3.15+ |
| Code Editor | @monaco-editor/react | 4.7+ |

## Project Structure

```
.
├── app/                 ← Next.js App Directory (routes & pages)
├── components/          ← React components (UI, page sections)
├── lib/                 ← Utilities, services, hooks
│   ├── hooks/          ← Custom React hooks
│   ├── services/       ← Business logic services
│   ├── types/          ← TypeScript interfaces
│   ├── utils/          ← Helper functions
│   └── i18n/           ← Internationalization
├── public/             ← Static assets
├── docs/               ← Documentation
└── .claude/            ← This project configuration
    ├── skills/         ← Skill guides
    ├── rules/          ← Code standards
    ├── commands/       ← Automated workflows
    └── agents/         ← AI agent prompts
```

## Component Architecture

### For Pages (under `app/`)
- Each page imports relevant components
- Keep page logic minimal; delegate to components
- Use server components for data fetching where possible

### For Reusable Components (under `components/`)
- Keep components under 300 lines
- Use TypeScript for all props
- Export via index files within subdirectories
- Document complex components with JSDoc

### For Utilities (under `lib/`)
- **hooks/**: Custom React hooks for reusable logic
- **services/**: Business logic (API calls, data transformation)
- **types/**: Shared TypeScript interfaces
- **utils/**: Pure functions (formatting, validation)

## Key Patterns & Best Practices

### State Management

**Client State (Zustand):**
- Learner profile, UI preferences
- Use selectors to avoid unnecessary re-renders
- Persist to localStorage for offline support

**Server State (TanStack Query):**
- Course listings, enrollment data, submissions
- Auto-stale-while-revalidate (5 min default)
- Automatic refetching on window focus

**Component State (useState):**
- Form inputs, UI toggles
- Local to the component only

### Service Layer

```typescript
// All API calls go through services
interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course>;
  enrollCourse(courseId: string): Promise<Enrollment>;
}

// Components never call fetch() directly
// Components use hooks which call services
const useCourses = () => useQuery(['courses'], courseService.getAllCourses);
```

### Error Handling

- Always catch errors in async operations
- Show user-friendly error messages
- Log errors to monitoring service (Sentry, etc.)
- Provide recovery options (retry, go back)

### Performance

- Code-split heavy components (CodeEditor, Charts)
- Lazy-load images with Next.js Image component
- Use React.memo for expensive components
- Cache API responses via TanStack Query
- Optimize bundle size (target: <200KB gzipped)

## Development Workflow

### 1. Identify Task Type
- **New Page** → Create under `app/[route]/`
- **New Component** → Create under `components/[category]/`
- **New Hook** → Create under `lib/hooks/`
- **New Service** → Create under `lib/services/`
- **New Type** → Add to `lib/types/index.ts`

### 2. Check Code Standards
- See `.claude/rules/typescript.md` for type patterns
- See `.claude/rules/react.md` for component patterns
- Run `npm run lint` to catch issues

### 3. Test Before Commit
- Type check: `npm run type-check`
- Build: `npm run build`
- Lint: `npm run lint`
- Local test: `npm run dev`

### 4. Commit & Push
- Use clear commit messages
- Reference related issues/tasks
- GitHub Actions will run tests automatically

## Implementation Checklist

When creating new features, verify:

- [ ] TypeScript strict mode enabled; no `any` types
- [ ] Props fully typed (no implicit `any`)
- [ ] Error handling for all async operations
- [ ] Internationalization: use `useI18n()` for all user-facing text
- [ ] Accessibility: semantic HTML, aria labels where needed
- [ ] Performance: images optimized, components memoized if needed
- [ ] Tests written for business logic
- [ ] Documentation updated (JSDoc, ARCHITECTURE.md)
- [ ] No console warnings/errors
- [ ] Builds successfully (`npm run build`)

## Common Gotchas

### Hydration Mismatch
Client and server render different content:
- **Fix**: Use `useEffect` for client-only values
- **Fix**: Use `suppressHydrationWarning` only as last resort

### Stale Props
Component receives old props due to memoization:
- **Fix**: Include all dependencies in `useCallback` dependencies
- **Fix**: Use proper key in lists (never index)

### Memory Leaks
Subscriptions not cleaned up:
- **Fix**: Always return cleanup function from `useEffect`
- **Fix**: Check `isMounted` before setState in async operations

### Missing Error Handling
Unhandled promise rejections:
- **Fix**: Always `.catch()` or `try/catch` in async functions
- **Fix**: Validate API responses before using

## Verifying Implementations

Before marking a task complete:

1. **Build Check**: `npm run build` (no errors)
2. **Type Check**: `npm run type-check` (no errors)
3. **Lint Check**: `npm run lint` (no errors)
4. **Dev Test**: `npm run dev` then test in browser
5. **Code Review**: Self-review code against patterns in `.claude/rules/`

## When Stuck

1. Check similar implementations in `components/` or existing pages
2. Review patterns in `.claude/rules/typescript.md` and `.claude/rules/react.md`
3. Check `.claude/skills/frontend-development.md` for detailed examples
4. Review `docs/SPECIFICATION.md` for feature requirements

## Future On-Chain Integration

When implementing blockchain features:

1. Add `lib/services/on-chain.service.ts` for Solana interactions
2. Create hook: `lib/hooks/useProgram.ts` for program instructions
3. Follow patterns in `.claude/skills/` for Anchor programs
4. Always validate user input before signing transactions
5. Test extensively on devnet before mainnet

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
