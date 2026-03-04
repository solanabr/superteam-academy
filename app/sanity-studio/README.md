# Caminho. Sanity Studio

Sanity Studio for managing courses, lessons, tracks, and landing page content.

## Prerequisites

- Node.js 18+
- npm or yarn
- Access to the Sanity project: `efj5r9bz`

## Setup

1. Install dependencies:
```bash
cd sanity-studio
npm install
```

2. (Optional) Add a Sanity token for write operations:
Create a `.env.local` file:
```env
SANITY_API_TOKEN=your_token_here
```

To get a token:
- Go to https://www.sanity.io/manage/personal/project/efj5r9bz
- Navigate to **API > Tokens**
- Create a new token with **Editor** permissions

## Development

Start the local development server:
```bash
npm run dev
```

The Studio will be available at: http://localhost:3333

## Deployment

Deploy the Studio to get a production URL:

```bash
npx sanity deploy
```

After deployment, you'll get a URL like:
`https://caminho.sanity.studio`

### Configure the Admin Dashboard

Once deployed, update the admin dashboard to link to your Studio:

**Option 1: Environment Variable (Recommended)**

Add to your root `.env.local`:
```env
NEXT_PUBLIC_SANITY_STUDIO_URL=https://caminho.sanity.studio
```

**Option 2: Hardcode the URL**

Edit `src/app/(app)/admin/courses/page.tsx`:
```typescript
const SANITY_STUDIO_URL = "https://caminho.sanity.studio";
```

Then restart your Next.js dev server.

## Content Types

### Track
Learning tracks that group related courses (e.g., "Solana Fundamentals", "DeFi Protocols")

### Course
Individual courses with modules, lessons, difficulty levels, and XP rewards

### Module
Organizational units that group lessons within a course

### Lesson
Core content units:
- **Content**: Educational material with rich text
- **Challenge**: Interactive coding exercises with starter code and validation

### Landing Page
Marketing content for the homepage (hero, features, testimonials)

## Content Workflow

1. Create a Track (if needed)
2. Create Lessons (content or challenge type)
3. Create Modules and add Lessons to them
4. Create a Course and:
   - Assign it to a Track
   - Add Modules to it
   - Set difficulty, duration, XP reward
5. Publish to make it live on the site

## Troubleshooting

**"Project not found" error**
- Ensure you're using the correct project ID: `efj5r9bz`
- Check that you have access to the project

**Can't write/publish content**
- You need Editor or Admin permissions
- Add your SANITY_API_TOKEN to `.env.local`

**Changes not appearing on the site**
- Course list pages use ISR with 60-second revalidation
- Wait 60 seconds or rebuild the Next.js app

## Schema Files

All schema definitions are in `/schemaTypes/`:
- `track.ts` - Learning tracks
- `course.ts` - Courses
- `module.ts` - Modules
- `lesson.ts` - Lessons (content & challenges)
- `landingPage.ts` - Landing page content
- `index.ts` - Schema registry

## Links

- Sanity Project: https://www.sanity.io/manage/personal/project/efj5r9bz
- GROQ Cheat Sheet: https://www.sanity.io/docs/groq
- Studio Documentation: https://www.sanity.io/docs/sanity-studio
