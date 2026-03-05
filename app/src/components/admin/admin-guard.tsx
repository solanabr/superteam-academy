"use client";

import { useTranslations } from "next-intl";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();
  const { connected, ready } = useAuth();
  const t = useTranslations("admin");

  if (!ready) {
    return (
      <div className="container flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--brand-logo-green))] border-t-transparent" />
      </div>
    );
  }

  if (!connected || !isAdmin) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Card className="max-w-md border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              {t("unauthorized")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                {t("backToDashboard")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
