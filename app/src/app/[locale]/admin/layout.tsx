import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { get_session } from "@/lib/auth/session";
import { require_admin } from "@/lib/auth/role-guard";
import { AdminLayoutShell } from "@/components/layout/admin-layout";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps): Promise<ReactNode> {
  const { locale } = await params;
  const session = await get_session();
  if (!session || !require_admin(session.role)) {
    redirect(`/${locale}/login`);
  }

  return <AdminLayoutShell session={session} locale={locale}>{children}</AdminLayoutShell>;
}

