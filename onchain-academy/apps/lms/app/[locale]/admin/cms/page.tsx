import { AdminSidebar } from '../components/AdminSidebar'
import { AdminCMS } from './AdminCMS'

export default function AdminCMSPage() {
  return (
    <>
      <AdminSidebar />
      <main className='flex-1 overflow-hidden flex bg-cream'>
        <AdminCMS />
      </main>
    </>
  )
}
