# Supabase Local Setup

## Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker running

## Setup

```bash
cd apps/web

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start

# This will output your local credentials:
# API URL: http://localhost:54321
# anon key: eyJ...
# service_role key: eyJ...

# Apply migrations
supabase db reset
```

## Migrations

- `001_initial.sql` — Complete schema with all tables, indexes, and RLS policies

## Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with role (admin/professor/student) |
| `courses` | Course catalog with status and difficulty |
| `modules` | Course modules with ordering |
| `lessons` | Lessons (content/challenge/quiz/video) |
| `enrollments` | User-course enrollment records |
| `progress` | Lesson completion tracking |
| `streaks` | User activity streaks |
| `achievements` | Achievement definitions |
| `user_achievements` | User-achievement junction |
| `comments` | Lesson discussion threads |
| `notifications` | User notifications |

## RLS Policies

All tables have Row Level Security enabled with role-based policies:
- **Admin**: Full CRUD on all tables
- **Professor**: CRUD on own courses/modules/lessons, read student progress
- **Student**: Read published content, manage own progress/enrollments
