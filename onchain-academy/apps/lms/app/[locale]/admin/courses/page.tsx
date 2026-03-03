import { AdminSidebar } from '../components/AdminSidebar'
import { AdminCourses } from './AdminCourses'

export default function AdminCoursesPage() {
  return (
    <>
      <AdminSidebar />
      <main className='flex-1 overflow-y-auto bg-cream'>
        <AdminCourses />
      </main>
    </>
  )
}
