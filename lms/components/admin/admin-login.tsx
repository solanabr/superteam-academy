"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { fetchStats } from "@/lib/admin/api";

export function AdminLogin({ onAuth }: { onAuth: (secret: string) => void }) {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    try {
      await fetchStats(secret);
      sessionStorage.setItem("admin-secret", secret);
      onAuth(secret);
    } catch {
      toast.error("Invalid admin secret");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
