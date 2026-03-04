import type { ReactNode } from "react";
import { AdminLogsSkeleton } from "@/components/admin/logs/logs-skeleton";

export default function AdminLogsLoading(): ReactNode {
  return <AdminLogsSkeleton />;
}
