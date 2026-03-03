import { AdminOverview } from './AdminOverview'
import { AdminSidebar } from './components/AdminSidebar'

export default function AdminPage() {
  return (
    <>
      <AdminSidebar />
      <main className='flex-1 overflow-y-auto bg-cream'>
        <AdminOverview />
      </main>
    </>
  )
}
