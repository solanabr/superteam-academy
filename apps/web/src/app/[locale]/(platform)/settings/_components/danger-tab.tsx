"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WarningOctagon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

// Danger zone: irreversible account-deletion request (readiness G6).
//
// Two-step guard: a confirmation dialog PLUS a type-to-confirm input (the user
// must type the literal confirmation word). On success we clear the local
// Supabase session and hard-redirect to the localized landing page. Copy makes
// explicit that on-chain XP and credentials are permanent and cannot be erased.

// Word the user must type to arm the delete button. This is the ENGLISH source
// token that also appears translated in the label copy; keeping it fixed (not
// itself translated) means the armed state is unambiguous across locales.
const CONFIRM_WORD = "DELETE";

export function DangerTab() {
  const t = useTranslations("settings");
  const locale = useLocale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canConfirm || isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });

      if (!res.ok) {
        setError(t("deleteAccountFailed"));
        setIsDeleting(false);
        return;
      }

      // Drop the local session so the client state matches the server-side
      // sign-out, then leave the platform. Full navigation (not router.push)
      // guarantees a clean reload with no stale authenticated state.
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.assign(`/${locale}`);
    } catch {
      setError(t("deleteAccountFailed"));
      setIsDeleting(false);
    }
  };

  const closeDialog = () => {
    if (isDeleting) return;
    setDialogOpen(false);
    setConfirmText("");
    setError(null);
  };

  return (
    <Card className="[border-color:var(--danger-border)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <WarningOctagon
            className="mt-0.5 h-5 w-5 shrink-0 text-danger"
            weight="fill"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="font-display font-black text-danger">
              {t("deleteAccountTitle")}
            </h3>
            <p className="text-sm text-text-2">
              {t("deleteAccountDescription")}
            </p>
          </div>
        </div>

        {/* On-chain permanence notice — XP and credentials cannot be erased. */}
        <p className="rounded-lg border px-4 py-3 text-sm text-text-2 [background:var(--danger-light)] [border-color:var(--danger-border)]">
          {t("deleteAccountOnChainNotice")}
        </p>

        <Button
          variant="destructiveOutline"
          onClick={() => setDialogOpen(true)}
        >
          {t("deleteAccountButton")}
        </Button>
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-danger">
              {t("deleteAccountConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteAccountConfirmBody")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="delete-confirm"
              className="text-sm font-medium text-text-2"
            >
              {t("deleteAccountConfirmPrompt", { word: CONFIRM_WORD })}
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full rounded-lg border-[2.5px] border-border bg-bg px-3 py-2 text-sm outline-none focus-visible:border-danger focus-visible:ring-2 focus-visible:ring-danger"
              aria-describedby={error ? "delete-error" : undefined}
            />
            {error && (
              <p id="delete-error" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isDeleting}
            >
              {t("deleteAccountCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canConfirm || isDeleting}
            >
              {isDeleting && (
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isDeleting
                ? t("deleteAccountDeleting")
                : t("deleteAccountConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
