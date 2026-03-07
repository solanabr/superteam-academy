"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LandingNewsletterSignupProps {
  buttonLabel?: string;
  errorTitle?: string;
  pendingLabel?: string;
  placeholder?: string;
  successDescription?: string;
  successTitle?: string;
}

export function LandingNewsletterSignup({
  buttonLabel = "Join updates",
  errorTitle = "Newsletter signup failed",
  pendingLabel = "Joining...",
  placeholder = "Email address",
  successDescription = "You are on the updates list.",
  successTitle = "Subscription saved",
}: LandingNewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not join updates");
      }

      toast.success(successTitle, { description: successDescription });
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not join updates";
      toast.error(errorTitle, { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-border/70 bg-background/80"
      />
      <Button type="submit" className="h-11 rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? pendingLabel : buttonLabel}
      </Button>
    </form>
  );
}
