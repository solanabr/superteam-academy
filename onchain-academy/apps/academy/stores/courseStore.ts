import type { LessonContent } from '@/libs/types/course.types'
import { create } from 'zustand'

interface CourseModule {
  moduleTitle: string
  lessons: LessonContent[]
}

interface CourseState {
  courseModules: Record<string, CourseModule[]>
  setCourseModules: (courseSlug: string, modules: CourseModule[]) => void
}

export const useCourseStore = create<CourseState>((set) => ({
  courseModules: {},
  setCourseModules: (courseSlug, modules) =>
    set((state) => ({
      courseModules: {
        ...state.courseModules,
        [courseSlug]: modules,
      },
    })),
}))
