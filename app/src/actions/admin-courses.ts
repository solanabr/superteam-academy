'use server';

import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import { revalidatePath } from 'next/cache';

export async function getAdminCourses() {
  await dbConnect();
  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
  return courses.map((c: any) => ({
    ...c,
    id: c._id.toString(),
    _id: c._id.toString(),
    modules: c.modules?.map((m: any) => ({
        ...m,
        _id: m._id?.toString(),
        lessons: m.lessons?.map((l: any) => ({
            ...l,
            _id: l._id?.toString()
        })) || []
    })) || []
  }));
}

export async function getAdminCourse(id: string) {
    await dbConnect();
    const course = await Course.findById(id).lean();
    if (!course) return null;
    
    // Deep convert _id to string
    const c = course as any;
    return {
        ...c,
        id: c._id.toString(),
        _id: c._id.toString(),
        modules: c.modules?.map((m: any) => ({
            ...m,
            _id: m._id?.toString(),
            lessons: m.lessons?.map((l: any) => ({
                ...l,
                _id: l._id?.toString()
            })) || []
        })) || []
    };
}

export async function createCourse(data: any) {
  await dbConnect();
  
  // Basic validation
  if (!data.title || !data.slug) {
      throw new Error("Title and Slug are required");
  }

  const course = await Course.create({
      ...data,
      modules: [] // Start empty
  });

  revalidatePath('/admin/courses');
  return { success: true, id: course._id.toString() };
}

export async function updateCourse(id: string, data: any) {
    await dbConnect();
    
    // Mongoose update
    await Course.findByIdAndUpdate(id, {
        $set: {
            title: data.title,
            slug: data.slug,
            description: data.description,
            difficulty: data.difficulty,
            duration: data.duration,
            tags: data.tags,
            image: data.image
        }
    });

    revalidatePath(`/admin/courses`);
    revalidatePath(`/admin/courses/${id}`);
    return { success: true };
}

export async function deleteCourse(id: string) {
    await dbConnect();
    await Course.findByIdAndDelete(id);
    revalidatePath('/admin/courses');
    return { success: true };
}

// Module Management
export async function addModule(courseId: string, title: string) {
    await dbConnect();
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    course.modules.push({ title, lessons: [] });
    await course.save();

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}

export async function updateModule(courseId: string, moduleId: string, title: string) {
    await dbConnect();
    await Course.findOneAndUpdate(
        { _id: courseId, "modules._id": moduleId },
        { $set: { "modules.$.title": title } }
    );
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}

export async function deleteModule(courseId: string, moduleId: string) {
    await dbConnect();
    await Course.findByIdAndUpdate(courseId, {
        $pull: { modules: { _id: moduleId } }
    });
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}

// Lesson Management
export async function addLesson(courseId: string, moduleId: string, lessonData: any) {
    await dbConnect();
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const moduleIndex = course.modules.findIndex((m: any) => m._id.toString() === moduleId);
    if (moduleIndex === -1) throw new Error("Module not found");

    course.modules[moduleIndex].lessons.push(lessonData);
    await course.save();

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}

export async function updateLesson(courseId: string, moduleId: string, lessonId: string, lessonData: any) {
    await dbConnect();
    console.log("Updating lesson:", lessonId, "with data:", JSON.stringify(lessonData, null, 2));
    
    // Using array filters to update nested lesson
    await Course.findOneAndUpdate(
        { _id: courseId },
        { $set: { "modules.$[mod].lessons.$[les]": lessonData } },
        { 
            arrayFilters: [{ "mod._id": moduleId }, { "les._id": lessonId }]
        }
    );

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    await dbConnect();
    await Course.findOneAndUpdate(
        { _id: courseId, "modules._id": moduleId },
        { $pull: { "modules.$.lessons": { _id: lessonId } } }
    );
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
}
