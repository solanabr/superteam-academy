"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Set your new password to complete recovery.");

  useEffect(() => {
    if (!supabase) {
      setStatusMessage("Supabase auth is not configured.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setStatusMessage("Open this page from the password reset email link.");
      }
    });
  }, [supabase]);

  const handleUpdatePassword = async () => {
    if (!supabase) {
      alert("Supabase auth is not configured.");
      return;
    }
    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        alert(`Password update failed: ${error.message}`);
        return;
      }
      setStatusMessage("Password updated successfully. Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(100vh-56px)] py-12 px-4 text-foreground">
      <div className="mx-auto max-w-[560px] rounded-[28px] bg-surface border border-white/10 p-7 md:p-8 apple-shadow">
        <p className="text-[13px] uppercase tracking-[0.14em] text-white/50 font-semibold">Account Recovery</p>
        <h1 className="mt-2 text-[34px] md:text-[42px] leading-[1.08] font-semibold tracking-[-0.03em] text-white">
          Reset password
        </h1>
        <p className="mt-3 text-[14px] text-white/70">{statusMessage}</p>
        <div className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="h-11 w-full rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className="h-11 w-full rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <Button variant="default" className="h-11 w-full rounded-[14px]" onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
