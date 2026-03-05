"use client";

import { Button } from "@/components/ui/button";

interface NewsletterFormProps {
  placeholder: string;
  submitLabel: string;
}

export function NewsletterForm({
  placeholder,
  submitLabel,
}: NewsletterFormProps) {
  return (
    <form
      className="flex max-w-xs gap-2 sm:max-w-[18rem]"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder={placeholder}
        className="search-bar min-w-0 flex-1 rounded-md border-2 border-[#008c4C] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008c4C] focus:ring-offset-0"
      />
      <Button
        type="submit"
        size="sm"
        className="shrink-0 bg-[#008c4C] text-white hover:bg-[#006b3a] hover:text-white"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
