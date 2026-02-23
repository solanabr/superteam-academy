"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-foreground">Stay in the loop</p>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          type="email"
          placeholder="you@example.com"
          className="max-w-xs"
          aria-label="Email for newsletter"
        />
        <Button type="submit" size="sm">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
