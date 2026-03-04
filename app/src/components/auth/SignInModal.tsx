"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
}

export function SignInModal({ open, onOpenChange, callbackUrl = "/courses" }: SignInModalProps) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tc("close")} className="sm:max-w-sm">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-bold">
            {t("signInModalTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("signInSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <OAuthButtons callbackUrl={callbackUrl} />
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("termsText")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
