# ADR 0002: Sanity CMS with Mock Data Fallback

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires a headless CMS for course content management with support for modules, lessons, challenges, and learning paths. Suggested options: Sanity, Strapi, Contentful, or similar.

The CMS must support:

- Structured content: courses > modules > lessons (content + challenge types)
- Rich text with markdown and code blocks
- Media management for course thumbnails and lesson images
- Draft/publish workflow for content editors
- Course metadata: difficulty, duration, XP rewards, track association

Additionally, the app must be fully functional without CMS credentials configured — reviewers and local developers need to run the app immediately without signing up for a third-party service.

## Decision

Use **Sanity CMS** (v3) as the headless CMS with a **graceful fallback to mock data** when the Sanity project ID is not configured.

### CMS Layer Architecture

```
data-service.ts
├── if (sanityClient exists)
│   └── Fetch from Sanity via GROQ queries
│       └── On query failure → console.warn + return mock data
└── if (sanityClient is null)
    └── Return mock data directly
```

The Sanity client is initialized as `null` when `NEXT_PUBLIC_SANITY_PROJECT_ID` is not set in the environment. The data service checks `!!client` before every query.

### Schema Design

Five Sanity document types mirror the domain model:

| Schema | Fields | Notes |
|--------|--------|-------|
| `course` | title, slug, description, difficulty, track, modules[], thumbnail | Top-level course container |
| `module` | title, description, lessons[] | Ordered group of lessons within a course |
| `lesson` | title, type (content/challenge), content (markdown), duration | Individual learning unit |
| `challenge` | prompt, starterCode, tests[], hints[], solution, language | Code challenge attached to a lesson |
| `learning-path` | title, description, courses[], color | Curated sequence of courses |

### Mock Data

`mock-data.ts` and `mock-courses.ts` provide 6 complete courses (124 lessons, 41 challenges) with the same shape as Sanity documents. Courses 1-2 have fully detailed modules with working code challenges.

## Consequences

### Positive

- **Zero-config onboarding**: `pnpm dev` works immediately without any Sanity account. Mock data provides a complete, realistic experience for development, testing, and bounty review.
- **Type safety**: GROQ queries return typed results matching the domain `Course` interface. Mock data uses the same types.
- **CDN caching**: Sanity client uses `useCdn: true` in production for global edge caching.
- **Content Studio**: Sanity's embedded studio gives content editors a visual interface for course creation (configured but optional).
- **ISR compatibility**: Server components call `getAllCourses()` with `revalidate = 3600`. When Sanity is connected, content updates propagate within 1 hour.

### Negative

- **Dual maintenance**: Changes to the domain model must be reflected in both Sanity schemas and mock data. Mitigated by the shared `Course` TypeScript interface.
- **GROQ learning curve**: Sanity's GROQ query language is less familiar than GraphQL. Only 3 queries are needed (allCourses, courseBySlug, allLearningPaths), keeping complexity low.
- **No real-time preview**: Content editors don't see live previews during editing. Acceptable for an LMS where content changes are deliberate.

### Alternatives Considered

- **Strapi**: Self-hosted, requires a running backend. Adds infrastructure complexity and breaks the "fully static" deployment model.
- **Contentful**: Similar capabilities to Sanity but with a more rigid content model and lower free tier limits. GraphQL-first API adds bundle weight.
- **MDX files in repo**: Simplest approach, but doesn't meet the "headless CMS" requirement. No visual editing interface for non-developer content authors.
- **Supabase**: Good for user data (mentioned in bounty FAQ), but its content modeling is less mature than dedicated CMS platforms. Could complement Sanity for user-generated content.
