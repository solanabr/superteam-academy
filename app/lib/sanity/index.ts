import { sanityClient, getCourses, getCourse, getLesson, getLessonsByCourse } from './client';

type Locale = 'en' | 'pt-BR' | 'es';

export function getLocalizedLesson(lesson: Record<string, unknown>, locale: Locale) {
  const titleField = locale === 'en' ? 'title' : `title${locale.replace('-', '')}`;
  const contentField = locale === 'en' ? 'content' : `content${locale.replace('-', '')}`;
  
  return {
    ...lesson,
    title: (lesson[titleField] as string) || (lesson.title as string),
    content: lesson[contentField],
  };
}

export async function getCourseWithLocale(slug: string, locale: Locale = 'en') {
  const course = await getCourse(slug);
  
  if (!course) return null;
  
  const titleField = locale === 'en' ? 'title' : `title${locale.replace('-', '')}`;
  
  const localizedLessons = (course.lessons || []).map((lesson: Record<string, unknown>) => 
    getLocalizedLesson(lesson, locale)
  );
  
  return {
    ...course,
    title: (course[titleField] as string) || course.title,
    lessons: localizedLessons,
  };
}

export { getCourses, getCourse, getLesson, getLessonsByCourse };
