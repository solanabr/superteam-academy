# Frontend Phases

## Scope

Build app pages that use existing hooks and backend routes.

## Phase F1: App Foundation

- [ ] `app/(app)/layout.tsx`
- [ ] Wallet guard component
- [ ] Sidebar + top nav
- [ ] Shared components (header, empty state, XP badge, progress bar)

## Phase F2: Courses and Enrollment

- [ ] `/(app)/courses/page.tsx`
- [ ] `/(app)/courses/[courseId]/page.tsx`
- [ ] Enroll flow (`useEnroll`)
- [ ] Enrollment status + progress UI

## Phase F3: Lesson Flow

- [ ] `/(app)/courses/[courseId]/lessons/[lessonIndex]/page.tsx`
- [ ] Complete lesson via backend API
- [ ] Finalize course via backend API
- [ ] Dashboard page with active progress

## Phase F4: Credentials and Discovery

- [ ] Certifications page
- [ ] Leaderboard page
- [ ] Profile page
- [ ] Achievements section

## Phase F5: Settings and Admin

- [ ] Settings page
- [ ] Admin layout + authority gate
- [ ] Admin courses/minters/achievements/config pages

## Dependency Order

1. F1
2. F2
3. F3
4. F4
5. F5

## Milestone Definition

- Milestone M1: F1 complete
- Milestone M2: F2 + F3 complete (core learner journey)
- Milestone M3: F4 complete
- Milestone M4: F5 complete
