import dynamic from 'next/dynamic';

// Load the admin dashboard client-side only to avoid SSR issues with wallet adapters
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminDashboard />;
}
