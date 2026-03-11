"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteButtonProps {
  threadId?: string;
  answerId?: string;
  onDeleted: () => void;
}

export function DeleteButton({
  threadId,
  answerId,
  onDeleted,
}: DeleteButtonProps) {
  const t = useTranslations("community");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const url = threadId
        ? `/api/community/threads/${threadId}/delete`
        : `/api/community/answers/${answerId}/delete`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        setOpen(false);
        onDeleted();
      }
    } catch {
      // Silent fail
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[var(--text-2)] transition-colors hover:text-[var(--danger)]"
          aria-label={t("delete")}
        >
          <Trash size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {threadId ? t("deleteThread") : t("deleteAnswer")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--text-2)]">{t("confirmDelete")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
            )}
            {t("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
