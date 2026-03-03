import { AdminSidebar } from '../components/AdminSidebar'
import { AdminAnalytics } from './AdminAnalytics'

export default function AdminAnalyticsPage() {
  return (
    <>
      <AdminSidebar />
      <main className='flex-1 overflow-y-auto bg-cream'>
        <AdminAnalytics />
      </main>
    </>
  )
}
