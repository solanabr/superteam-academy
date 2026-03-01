"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FLAG_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive" },
  { value: "off-topic", label: "Off-topic" },
  { value: "other", label: "Other" },
] as const;

interface FlagButtonProps {
  threadId?: string;
  answerId?: string;
}

export function FlagButton({ threadId, answerId }: FlagButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/community/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          answerId,
          reason,
          details: details || undefined,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setReason("");
        setDetails("");
      }, 1500);
    } catch {
      // Silent fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[var(--text-2)] transition-colors hover:text-[var(--danger)]"
          aria-label="Report"
        >
          <Flag size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
        </DialogHeader>
        {submitted ? (
          <p className="py-4 text-sm text-[var(--primary)]">
            Report submitted. Thank you.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {FLAG_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text)]">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] p-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
