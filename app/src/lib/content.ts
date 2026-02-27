
import dbConnect from '@/lib/db';
import Course from '@/models/Course';

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: 'video' | 'text' | 'challenge' | 'quiz';
  content: string; // Markdown
  videoUrl?: string; // YouTube/Arweave
  xp: number;
  initialCode?: string;
  testCode?: string;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  _id?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
  id?: string;
  _id?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  difficulty?: string;
  duration?: string;
  prerequisites?: string[];
  modules: Module[];
  xp: number;
  _id?: string;
  author?: { name: string };
  isPublished?: boolean;
}

export const ContentService = {
  getCourses: async (): Promise<Course[]> => {
    await dbConnect();
    // Use .lean() to get POJOs
    const courses = await Course.find({}).lean();
    return courses.map((c: any) => ({
      ...c,
      id: c._id.toString(),
      tags: c.tags || [],
      difficulty: c.difficulty || 'Beginner',
      duration: c.duration || '2h',
      isPublished: c.isPublished !== undefined ? c.isPublished : true,
      modules: c.modules.map((m: any) => ({
        ...m,
        id: m._id ? m._id.toString() : undefined,
        _id: m._id ? m._id.toString() : undefined,
        lessons: m.lessons.map((l: any) => ({
          ...l,
          id: l._id ? l._id.toString() : l.id,
          _id: l._id ? l._id.toString() : undefined
        }))
      }))
    }));
  },

  getCourseBySlug: async (slug: string): Promise<Course | null> => {
    await dbConnect();
    const course = await Course.findOne({ slug }).lean();
    if (!course) return null;
    
    // Cast to any to handle _id mapping
    const c = course as any;
    return {
      ...c,
      id: c._id.toString(),
      tags: c.tags || [],
      difficulty: c.difficulty || 'Beginner',
      duration: c.duration || '2h',
      isPublished: c.isPublished !== undefined ? c.isPublished : true,
      modules: c.modules.map((m: any) => ({
        ...m,
        id: m._id ? m._id.toString() : undefined,
        _id: m._id ? m._id.toString() : undefined,
        lessons: m.lessons.map((l: any) => ({
          ...l,
          id: l._id ? l._id.toString() : l.id,
          _id: l._id ? l._id.toString() : undefined
        }))
      }))
    };
  }
};
