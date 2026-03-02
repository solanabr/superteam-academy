import { cookies } from "next/headers";
import { AdminClient } from "./admin-client";
import { AdminLoginForm } from "./admin-login-form";
import { isValidAdminSession } from "@/lib/admin/auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !isValidAdminSession(session?.value)) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text">
            Admin Console
          </h1>
          <p className="mt-1 text-sm text-text-3">
            Superteam Academy — Sanity to On-Chain Sync
          </p>
        </div>
        <AdminClient adminToken={adminSecret} />
      </div>
    </div>
  );
}
