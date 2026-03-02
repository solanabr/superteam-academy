import { integrationService } from "~/services/course-service";

export async function GET() {

   const courses = await integrationService.getCourses()

   return new Response(JSON.stringify(courses), {
      status: 200,
   })
}