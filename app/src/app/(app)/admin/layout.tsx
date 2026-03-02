import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/admin-guard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Platform administration — course statistics, user metrics, content management, and system overview for Superteam Academy.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
