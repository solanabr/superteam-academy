"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThreadComposer, type ThreadScopeDefaults } from "./thread-composer";

interface CreateThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: ThreadScopeDefaults;
}

/**
 * Modal shell around the shared `ThreadComposer` — the community page's entry
 * point. The lesson pane composes the same form inline instead (a modal over a
 * lesson buried the context the learner was asking about).
 */
export function CreateThreadModal({
  open,
  onOpenChange,
  defaultScope,
}: CreateThreadModalProps) {
  const t = useTranslations("community");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("askQuestion")}</DialogTitle>
        </DialogHeader>

        <ThreadComposer
          defaultScope={defaultScope}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
