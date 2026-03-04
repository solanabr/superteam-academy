import type { ReactNode } from "react";
import { AdminCertificatesSkeleton } from "@/components/admin/certificates/certificates-skeleton";

export default function AdminCertificatesLoading(): ReactNode {
  return <AdminCertificatesSkeleton />;
}
