/** Reusable GROQ queries for the academy CMS */

export const courseFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  description,
  level,
  duration,
  image,
  published,
  xpReward,
  track,
  onchainStatus,
  arweaveTxId,
  coursePda,
  createSignature,
  lastSyncError,
  "author": author->{
    _id,
    name,
    slug,
    image,
    bio,
    walletAddress
  }
`;

export const moduleFields = /* groq */ `
  _id,
  _type,
  title,
  slug,
  description,
  order,
  "lessonCount": count(lessons)
`;

export const lessonFields = /* groq */ `
  _id,
  _type,
  title,
  slug,
  content,
  order,
  xpReward,
  duration
`;

export const searchCoursesQuery = /* groq */ `
  *[_type == "course" && published == true && (
    title match $q || description match $q
  )] | order(_createdAt desc) [0...10] {
    ${courseFields}
  }
`;

export const allCoursesQuery = /* groq */ `
  *[_type == "course" && published == true] | order(_createdAt desc) {
    ${courseFields}
  }
`;

/** All courses without published filter — used for on-chain enrichment. */
export const allCoursesIndexQuery = /* groq */ `
  *[_type == "course"] | order(_createdAt desc) {
    ${courseFields}
  }
`;

export const courseBySlugQuery = /* groq */ `
  *[_type == "course" && slug.current == $slug][0] {
    ${courseFields},
    "modules": *[_type == "module" && references(^._id)] | order(order asc) {
      ${moduleFields},
      "lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
        ${lessonFields}
      }
    }
  }
`;

export const coursesByTrackQuery = /* groq */ `
  *[_type == "course" && published == true && track == $track] | order(_createdAt desc) {
    ${courseFields}
  }
`;

export const lessonBySlugQuery = /* groq */ `
  *[_type == "lesson" && slug.current == $slug][0] {
    ${lessonFields},
    "module": *[_type == "module" && references(^._id)][0] {
      ${moduleFields},
      "course": *[_type == "course" && references(^._id)][0] {
        ${courseFields}
      }
    }
  }
`;

export const allTracksQuery = /* groq */ `
  *[_type == "track"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    image,
    "courseCount": count(*[_type == "course" && track == ^.slug.current && published == true])
  }
`;

export const authorBySlugQuery = /* groq */ `
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    image,
    bio,
    walletAddress,
    "courses": *[_type == "course" && author._ref == ^._id && published == true] {
      ${courseFields}
    }
  }
`;

export const userFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  authId,
  name,
  email,
  walletAddress,
  image,
  bio,
  location,
  website,
  username,
  role,
  xpBalance,
  enrolledCourses,
  completedCourses,
  savedCourses,
  title,
  company,
  education,
  experienceLevel,
  preferredTopics,
  learningGoals,
  timeCommitment,
  github,
  linkedin,
  twitter,
  portfolio,
  skills,
  languages,
  timezone,
  availability,
  onboardingCompleted,
  onboardingStep,
  profileCompleteness,
  settings,
  linkedAccounts,
  lastActiveAt
`;

export const userByAuthIdQuery = /* groq */ `
  *[_type == "academyUser" && authId == $authId][0] {
    ${userFields}
  }
`;

export const userByEmailQuery = /* groq */ `
  *[_type == "academyUser" && email == $email][0] {
    ${userFields}
  }
`;

export const userByWalletQuery = /* groq */ `
  *[_type == "academyUser" && walletAddress == $walletAddress][0] {
    ${userFields}
  }
`;

export const userByUsernameQuery = /* groq */ `
  *[_type == "academyUser" && username == $username][0] {
    ${userFields}
  }
`;

export const allUsersQuery = /* groq */ `
  *[_type == "academyUser"] | order(_createdAt desc) {
    ${userFields}
  }
`;

export const adminUsersQuery = /* groq */ `
  *[_type == "academyUser" && role in ["admin", "superadmin"]] | order(_createdAt desc) {
    ${userFields}
  }
`;

export const userCountQuery = /* groq */ `
  count(*[_type == "academyUser"])
`;

export const userStatsQuery = /* groq */ `
  {
    "totalUsers": count(*[_type == "academyUser"]),
    "activeUsers": count(*[_type == "academyUser" && lastActiveAt > $since]),
    "adminCount": count(*[_type == "academyUser" && role in ["admin", "superadmin"]]),
    "totalEnrollments": count(*[_type == "academyUser" && count(enrolledCourses) > 0])
  }
`;

export const discussionFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  excerpt,
  content,
  category,
  tags,
  pinned,
  solved,
  locked,
  views,
  points,
  publishedAt,
  "author": author->{
    _id,
    name,
    image
  },
  "commentCount": count(*[_type == "discussionComment" && references(^._id)])
`;

export const allDiscussionsQuery = /* groq */ `
  *[_type == "discussion"] | order(pinned desc, publishedAt desc) {
    ${discussionFields}
  }
`;

export const discussionBySlugQuery = /* groq */ `
  *[_type == "discussion" && slug.current == $slug][0] {
    ${discussionFields},
    "comments": *[_type == "discussionComment" && references(^._id)] | order(publishedAt asc) {
      _id,
      content,
      points,
      accepted,
      publishedAt,
      "author": author->{
        _id,
        name,
        image
      }
    }
  }
`;

export const discussionsByCategoryQuery = /* groq */ `
  *[_type == "discussion" && category == $category] | order(pinned desc, publishedAt desc) {
    ${discussionFields}
  }
`;

export const discussionsByTagQuery = /* groq */ `
  *[_type == "discussion" && $tag in tags] | order(publishedAt desc) {
    ${discussionFields}
  }
`;

export const eventFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  description,
  type,
  status,
  startDate,
  endDate,
  timezone,
  location,
  isOnline,
  image,
  maxAttendees,
  registrationUrl,
  recordingUrl,
  speakers,
  tags,
  publishedAt,
  "attendeeCount": count(*[_type == "eventRegistration" && references(^._id)])
`;

export const upcomingEventsQuery = /* groq */ `
  *[_type == "event" && status == "upcoming"] | order(startDate asc) {
    ${eventFields}
  }
`;

export const pastEventsQuery = /* groq */ `
  *[_type == "event" && status == "past"] | order(startDate desc) {
    ${eventFields}
  }
`;

export const eventBySlugQuery = /* groq */ `
  *[_type == "event" && slug.current == $slug][0] {
    ${eventFields}
  }
`;

export const projectFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  description,
  category,
  tags,
  githubUrl,
  liveUrl,
  image,
  featured,
  stars,
  contributors,
  xpReward,
  publishedAt,
  "author": author->{
    _id,
    name,
    image
  }
`;

export const allProjectsQuery = /* groq */ `
  *[_type == "project"] | order(featured desc, publishedAt desc) {
    ${projectFields}
  }
`;

export const featuredProjectsQuery = /* groq */ `
  *[_type == "project" && featured == true] | order(publishedAt desc) {
    ${projectFields}
  }
`;

export const projectBySlugQuery = /* groq */ `
  *[_type == "project" && slug.current == $slug][0] {
    ${projectFields}
  }
`;

export const projectsByCategoryQuery = /* groq */ `
  *[_type == "project" && category == $category] | order(featured desc, publishedAt desc) {
    ${projectFields}
  }
`;

export const memberFields = /* groq */ `
  _id,
  _type,
  title,
  badges,
  streak,
  joinedAt,
  "user": user->{
    _id,
    name,
    image,
    xpBalance,
    "courseCount": count(completedCourses)
  }
`;

export const allMembersQuery = /* groq */ `
  *[_type == "communityMember"] | order(user->xpBalance desc) {
    ${memberFields},
    "achievementCount": 0
  }
`;

export const topMembersQuery = /* groq */ `
  *[_type == "communityMember"] | order(user->xpBalance desc) [0...$limit] {
    ${memberFields},
    "achievementCount": 0
  }
`;

export const membersByBadgeQuery = /* groq */ `
  *[_type == "communityMember" && $badge in badges] | order(user->xpBalance desc) {
    ${memberFields},
    "achievementCount": 0
  }
`;

export const lessonNoteFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  lessonId,
  title,
  content,
  timestamp
`;

export const notesByLessonAndUserQuery = /* groq */ `
  *[_type == "lessonNote" && lessonId == $lessonId && user._ref == $userId] | order(timestamp asc) {
    ${lessonNoteFields}
  }
`;
