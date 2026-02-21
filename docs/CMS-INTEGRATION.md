# Sanity CMS Integration

This document describes the Sanity CMS integration for courses and community features in Superteam Academy.

## Architecture

The CMS integration follows a clean service-based architecture with clear separation of concerns:

```
packages/cms/
├── src/
│   ├── schemas.ts           # TypeScript types for all CMS content
│   ├── queries.ts            # GROQ queries for fetching data
│   ├── services/
│   │   ├── cms-service.ts    # Base CMS service class
│   │   ├── course-service.ts # Course-specific operations
│   │   └── community-service.ts # Community-specific operations
│   └── index.ts              # Public exports

frontend/
├── lib/
│   ├── cms.ts                # Course CMS integration
│   └── community-cms.ts      # Community CMS integration
└── services/
    └── CommunityService.ts   # Frontend service wrapper
```

## Content Types

### Courses
- **Course**: Top-level course entity with metadata
- **Module**: Lesson groupings within courses
- **Lesson**: Individual lessons with content
- **Track**: Learning paths/categories
- **CourseReview**: User reviews and ratings

### Community
- **Discussion**: Forum posts with categories and tags
- **DiscussionComment**: Threaded comments on discussions
- **Event**: Workshops, AMAs, hackathons, meetups
- **EventRegistration**: Event attendance tracking
- **Project**: Community-built projects showcase
- **CommunityMember**: Extended member profiles with badges

### Users
- **AcademyUser**: User accounts with enrollment tracking
- **Author**: Content creators/instructors

## Service Layer

### Base CMS Service (`CMSService`)

Provides core functionality for all CMS services:
- Client initialization
- Image URL resolution
- GROQ query execution
- Configuration status

### Course Service (`CourseService`)

Methods:
- `getAllCourses()` - Fetch all published courses
- `getCourseBySlug(slug)` - Get course by slug
- `getCourseById(idOrSlug)` - Get course by ID or slug with full module/lesson data
- `getCoursesByTrack(track)` - Filter courses by track
- `getTracks()` - Get all learning tracks
- `getCourseReviews(idOrSlug)` - Get course reviews with pagination
- `resolveCourseImageUrl(image, width, height)` - Generate optimized image URLs

### Community Service (`CommunityService`)

Methods:
- **Discussions**: `getAllDiscussions()`, `getDiscussionBySlug()`, `getDiscussionsByCategory()`, `getTrendingDiscussions()`, `getUnansweredDiscussions()`
- **Events**: `getUpcomingEvents()`, `getPastEvents()`, `getEventBySlug()`, `getEventsByStatus()`
- **Projects**: `getAllProjects()`, `getFeaturedProjects()`, `getProjectBySlug()`, `getProjectsByCategory()`
- **Members**: `getAllMembers()`, `getTopMembers(limit)`, `getMembersByBadge(badge)`
- **Image resolution**: `resolveEventImageUrl()`, `resolveProjectImageUrl()`, `resolveUserImageUrl()`

## Usage

### In Server Components

```tsx
import { getCoursesCMS } from "@/lib/cms";
import { getAllDiscussions } from "@/lib/community-cms";

export default async function Page() {
  const courses = await getCoursesCMS();
  const discussions = await getAllDiscussions();
  
  return <div>{/* Render content */}</div>;
}
```

### With Service Factory

```tsx
import { createServices } from "@/services/ServiceFactory";

const services = createServices(connection, programId);

// Access community service
const discussions = await services.community.getAllDiscussions();
const events = await services.community.getUpcomingEvents();
```

## Fallback Behavior

All pages include mock data fallbacks when Sanity is not configured:
- Development works without Sanity credentials
- Mock data structure matches Sanity schema
- Easy migration path when connecting Sanity

## Configuration

Set environment variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

Check configuration status:

```tsx
import { isSanityConfigured } from "@/lib/cms";

if (isSanityConfigured) {
  // Use Sanity data
} else {
  // Use mock data
}
```

## Benefits

1. **Clean Abstraction**: Service classes hide CMS implementation details
2. **Type Safety**: Full TypeScript types for all content
3. **Reusability**: Shared logic across frontend and backend
4. **Testability**: Easy to mock services for testing
5. **Maintainability**: Changes to CMS only affect service layer
6. **Gradual Migration**: Mock data allows development without CMS setup

## GROQ Query Examples

### Discussions with Author and Comment Count

```groq
*[_type == "discussion"] | order(pinned desc, publishedAt desc) {
  _id,
  title,
  excerpt,
  category,
  tags,
  pinned,
  solved,
  "author": author->{
    _id,
    name,
    image
  },
  "commentCount": count(*[_type == "discussionComment" && references(^._id)])
}
```

### Events with Attendee Count

```groq
*[_type == "event" && status == "upcoming"] | order(startDate asc) {
  _id,
  title,
  description,
  type,
  startDate,
  "attendeeCount": count(*[_type == "eventRegistration" && references(^._id)])
}
```

## Future Enhancements

- [ ] Real-time updates via Sanity webhooks
- [ ] Content preview mode for editors
- [ ] Analytics integration
- [ ] Search indexing with Algolia
- [ ] CDN caching for optimized image delivery
- [ ] Comments moderation workflow
- [ ] Event registration management
- [ ] Project submission flow
