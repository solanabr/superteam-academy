import { sanityClient, urlFor } from './client';

export interface AdminCourse {
  _id?: string;
  title: string;
  slug: { current: string };
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  totalXp: number;
  creator: string;
  image?: { asset: { _ref: string } };
  order: number;
  lessons?: { _ref: string }[];
}

export interface AdminLesson {
  _id?: string;
  title: string;
  slug: { current: string };
  type: 'reading' | 'coding' | 'quiz';
  xpReward: number;
  order: number;
  titleEn?: string;
  titlePtBr?: string;
  titleEs?: string;
  contentEn?: unknown[];
  contentPtBr?: unknown[];
  contentEs?: unknown[];
  starterCode?: string;
  solution?: string;
  testCases?: { input: string; expected: string; description: string }[];
}

export async function getAllCourses(): Promise<AdminCourse[]> {
  const query = `*[_type == "course"] | order(order) {
    _id,
    title,
    slug,
    description,
    level,
    totalXp,
    creator,
    "imageUrl": image.asset->url,
    order
  }`;
  return sanityClient.fetch(query);
}

export async function getCourseById(id: string): Promise<AdminCourse | null> {
  const query = `*[_type == "course" && _id == $id][0] {
    _id,
    title,
    slug,
    description,
    level,
    totalXp,
    creator,
    image,
    order,
    lessons
  }`;
  return sanityClient.fetch(query, { id });
}

export async function createCourse(course: Omit<AdminCourse, '_id'>): Promise<{ _id: string }> {
  return sanityClient.create({
    _type: 'course',
    ...course,
  });
}

export async function updateCourse(id: string, course: Partial<AdminCourse>): Promise<{ _id: string }> {
  return sanityClient.patch(id).set(course).commit();
}

export async function deleteCourse(id: string): Promise<void> {
  await sanityClient.delete(id);
}

export async function getAllLessons(): Promise<AdminLesson[]> {
  const query = `*[_type == "lesson"] | order(order) {
    _id,
    title,
    slug,
    type,
    xpReward,
    order,
    titleEn,
    titlePtBr,
    titleEs,
    starterCode,
    solution,
    testCases
  }`;
  return sanityClient.fetch(query);
}

export async function getLessonById(id: string): Promise<AdminLesson | null> {
  const query = `*[_type == "lesson" && _id == $id][0] {
    _id,
    title,
    slug,
    type,
    xpReward,
    order,
    titleEn,
    titlePtBr,
    titleEs,
    contentEn,
    contentPtBr,
    contentEs,
    starterCode,
    solution,
    testCases
  }`;
  return sanityClient.fetch(query, { id });
}

export async function createLesson(lesson: Omit<AdminLesson, '_id'>): Promise<{ _id: string }> {
  return sanityClient.create({
    _type: 'lesson',
    ...lesson,
  });
}

export async function updateLesson(id: string, lesson: Partial<AdminLesson>): Promise<{ _id: string }> {
  return sanityClient.patch(id).set(lesson).commit();
}

export async function deleteLesson(id: string): Promise<void> {
  await sanityClient.delete(id);
}

export async function addLessonToCourse(courseId: string, lessonId: string): Promise<void> {
  const course = await getCourseById(courseId);
  if (!course) throw new Error('Course not found');
  
  const currentLessons = course.lessons || [];
  await sanityClient.patch(courseId).set({ lessons: [...currentLessons, { _type: 'reference', _ref: lessonId }] }).commit();
}

export async function getCoursesWithLessonCounts(): Promise<{ _id: string; title: string; lessonCount: number }[]> {
  const query = `*[_type == "course"] | order(order) {
    _id,
    title,
    "lessonCount": count(lessons[])
  }`;
  return sanityClient.fetch(query);
}

export async function uploadImage(file: File): Promise<{ assetId: string; url: string }> {
  const asset = await sanityClient.assets.upload('image', file, {
    filename: file.name,
  });
  
  return {
    assetId: asset._id,
    url: urlFor(asset).url(),
  };
}

export async function getAnalytics() {
  const [
    totalCourses,
    totalLessons,
    coursesWithLessons,
  ] = await Promise.all([
    sanityClient.fetch(`count(*[_type == "course"])`),
    sanityClient.fetch(`count(*[_type == "lesson"])`),
    sanityClient.fetch(`*[_type == "course"] { "title": title, "lessonCount": count(lessons[]) }`),
  ]);
  
  const totalEnrollments = coursesWithLessons.reduce((acc: number, c: { lessonCount: number }) => acc + c.lessonCount, 0);
  
  return {
    totalCourses,
    totalLessons,
    totalEnrollments,
    courses: coursesWithLessons,
  };
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sanityClient.fetch(`count(*[_type == "course"])`);
    return { success: true, message: `Connected! Found ${result} courses.` };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
