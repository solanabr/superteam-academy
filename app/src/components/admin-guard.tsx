"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "@/i18n/navigation"; 
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { userDb, loading } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!userDb || userDb.role !== "ADMIN") {
      setIsChecking(false);
    } else {
      setIsChecking(false);
    }
  }, [userDb, loading]);

  if (loading || isChecking) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!userDb || userDb.role !== "ADMIN") {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have administrator privileges.</p>
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
    );
  }

  return <>{children}</>;
}