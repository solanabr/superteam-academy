import { AdminSidebar } from '../components/AdminSidebar'
import { AdminUsers } from './AdminUsers'

export default function AdminUsersPage() {
  return (
    <>
      <AdminSidebar />
      <main className='flex-1 overflow-y-auto bg-cream'>
        <AdminUsers />
      </main>
    </>
  )
}
