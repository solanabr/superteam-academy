import { AdminProviders } from "@/components/admin/admin-providers";
import { AdminPanel } from "@/components/admin/admin-panel";

export default function AdminPage() {
  return (
    <AdminProviders>
      <AdminPanel />
    </AdminProviders>
  );
}
