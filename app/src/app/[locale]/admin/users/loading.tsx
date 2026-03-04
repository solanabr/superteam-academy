import type { ReactNode } from "react";
import { AdminUsersSkeleton } from "@/components/admin/users/users-skeleton";

export default function AdminUsersLoading(): ReactNode {
  return <AdminUsersSkeleton />;
}

