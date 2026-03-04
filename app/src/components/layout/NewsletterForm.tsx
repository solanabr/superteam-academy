"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

interface NewsletterFormProps {
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
}

export function NewsletterForm({
  placeholder,
  buttonLabel,
  successMessage,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
    toast.success(successMessage);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="pl-9 bg-background/50"
          disabled={submitted}
          required
          aria-label={placeholder}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="default"
        disabled={submitted}
        className="shrink-0"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}
