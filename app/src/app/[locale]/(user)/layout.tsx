import type { ReactNode } from "react";
import { UserLayout } from "@/components/layout/user-layout";

export default function UserLayoutRoute({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <UserLayout>{children}</UserLayout>;
}
