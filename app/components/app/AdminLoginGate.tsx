"use client";

import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const JWT_REQUIRED_PATHS = ["/admin/courses", "/admin/config", "/admin/minters", "/admin/achievements"];

export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token, login, logout, loading, error, isAdminAuthenticated } = useAdminAuth();
  const [password, setPassword] = useState("");

  const needsJwt = JWT_REQUIRED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const showGate = needsJwt && !isAdminAuthenticated;

  if (!needsJwt) {
    return <>{children}</>;
  }

  if (showGate) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Admin login required</CardTitle>
          <CardDescription>
            Use ADMIN_PASSWORD (backend .env) to create or update courses, config, minters, and
            achievements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password-gate">Password</Label>
            <Input
              id="admin-password-gate"
              type="password"
              placeholder="ADMIN_PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={() => login(password)}
            disabled={loading || !password}
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
        <span>Admin JWT active</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
      {children}
    </>
  );
}
