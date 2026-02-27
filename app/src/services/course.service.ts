import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/models';
import { courses, courseContent } from '@/content/courses';

export class CourseService {
  static async ensureSeeded(): Promise<void> {
    await connectToDatabase();
    const existing = await Course.countDocuments();
    if (existing > 0) {
      for (const catalogItem of courses) {
        const full = courseContent[catalogItem.slug];
        await Course.updateOne(
          { slug: catalogItem.slug, $or: [{ id: { $exists: false } }, { id: null }, { id: '' }] },
          { $set: { id: full?.id || catalogItem.slug } }
        );
      }
      return;
    }

    const docs = courses.map((catalogItem) => {
      const full = courseContent[catalogItem.slug];
      const modules = full?.modules || [];
      const lessonsCount =
        modules.length > 0
          ? modules.reduce((acc, courseModule) => acc + courseModule.lessons.length, 0)
          : catalogItem.lessonsCount;

      return {
        id: full?.id || catalogItem.slug,
        slug: catalogItem.slug,
        title: catalogItem.title,
        description: catalogItem.description,
        thumbnail: catalogItem.thumbnail,
        difficulty: catalogItem.difficulty,
        duration: catalogItem.duration,
        xpReward: catalogItem.xpReward,
        track: catalogItem.track,
        lessonsCount,
        modulesCount: modules.length > 0 ? modules.length : catalogItem.modulesCount,
        tags: catalogItem.tags || [],
        prerequisites: full?.prerequisites || [],
        learningObjectives: full?.learningObjectives || [],
        modules,
        instructor: catalogItem.instructor,
      };
    });

    if (docs.length > 0) {
      await Course.insertMany(docs, { ordered: false });
    }
  }

  static async getAllCourses() {
    await this.ensureSeeded();
    return Course.find({}).sort({ title: 1 }).lean();
  }

  static async getAllTracks(): Promise<string[]> {
    await this.ensureSeeded();
    const tracks = await Course.distinct('track', { track: { $ne: null } });
    return tracks.filter(Boolean) as string[];
  }

  static async getCourseBySlug(slug: string) {
    await this.ensureSeeded();
    return Course.findOne({ slug }).lean();
  }

  static async getLesson(courseSlug: string, lessonSlug: string) {
    const course = await this.getCourseBySlug(courseSlug);
    if (!course) return null;

    for (const courseModule of course.modules || []) {
      const lesson = courseModule.lessons.find((item) => item.slug === lessonSlug);
      if (lesson) {
        return {
          course,
          module: courseModule,
          lesson,
        };
      }
    }

    return null;
  }
}
