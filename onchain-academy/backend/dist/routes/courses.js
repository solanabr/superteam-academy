import { z } from "zod";
import { listCourses as listContentCourses, getCourseBySlug as getContentCourseBySlug, } from "../lib/content-repository.js";
export async function courseRoutes(app) {
    app.get("/courses", async (request) => {
        const query = z
            .object({
            search: z.string().optional(),
            difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
            topic: z.string().optional(),
            duration: z.enum(["short", "medium", "long"]).optional(),
        })
            .parse(request.query);
        const search = query.search?.toLowerCase().trim();
        const topic = query.topic?.toLowerCase().trim();
        const courses = await listContentCourses();
        return courses
            .filter((course) => query.difficulty ? course.difficulty === query.difficulty : true)
            .filter((course) => (topic ? course.track.toLowerCase() === topic : true))
            .filter((course) => {
            if (!query.duration) {
                return true;
            }
            if (query.duration === "short") {
                return course.durationMinutes <= 180;
            }
            if (query.duration === "medium") {
                return course.durationMinutes > 180 && course.durationMinutes <= 360;
            }
            return course.durationMinutes > 360;
        })
            .filter((course) => search
            ? `${course.title} ${course.description}`
                .toLowerCase()
                .includes(search)
            : true)
            .map((course) => ({
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description,
            difficulty: course.difficulty,
            durationMinutes: course.durationMinutes,
            xpTotal: course.xpTotal,
            track: course.track,
            moduleCount: course.moduleCount,
            lessonCount: course.lessonCount,
            badge: course.badge,
        }));
    });
    app.get("/courses/:slug", async (request, reply) => {
        const params = z.object({ slug: z.string().min(1) }).parse(request.params);
        const course = await getContentCourseBySlug(params.slug);
        if (!course) {
            return reply.code(404).send({ error: "Course not found" });
        }
        return course;
    });
}
