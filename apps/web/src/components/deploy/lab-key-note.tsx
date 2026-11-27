"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLabKey } from "@/hooks/use-lab-key";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The learner's lab key on a lab card: its full address with a copy button,
 * the line that says it is a throwaway devnet key, and "Forget this key".
 *
 * Forgetting asks first and states what is lost: the test SOL in the key and
 * upgrade control of the programs it deployed. After a forget, the card offers
 * to create a new key.
 */
export function LabKeyNote({ className }: { className?: string }) {
  const t = useTranslations("deploy.labKey");
  const { status, address, create, forget } = useLabKey();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  // The confirm step opens with focus on Cancel, the choice that loses nothing.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const box = cn(
    "space-y-2 rounded-md border-2 border-[color:var(--ink-line)] bg-card p-3 text-xs",
    className
  );

  if (status === "resolving") {
    return <p className="text-xs text-text-3">{t("preparing")}</p>;
  }
  if (status === "signed-out") return <LabEnrollNotice />;
  if (status === "unavailable") {
    return (
      <p role="alert" className={box}>
        {t("unavailable")}
      </p>
    );
  }
  if (status === "missing" || !address) {
    return (
      <div className={box}>
        <p className="text-text-2">{t("missing")}</p>
        <Button size="sm" variant="secondary" onClick={create}>
          {t("create")}
        </Button>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable. The full address is on screen to select.
    }
  };

  return (
    <div className={box}>
      <p className="font-mono text-[10px] uppercase tracking-wide text-text-3">
        {t("label")}
      </p>
      <p
        data-testid="lab-key-address"
        className="select-all break-all font-mono text-text"
      >
        {address}
      </p>
      <p className="text-text-3">{t("throwaway")}</p>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className="space-y-2 rounded-md border-2 border-danger p-3"
        >
          <p id={titleId} className="font-semibold text-text">
            {t("forgetConfirmTitle")}
          </p>
          <p id={bodyId} className="text-text-2">
            {t("forgetConfirmBody")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              ref={cancelRef}
              size="sm"
              variant="secondary"
              onClick={() => setConfirming(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => {
                setConfirming(false);
                forget();
              }}
            >
              {t("forgetConfirm")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            {t("forget")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Shown in place of a lab card to a visitor who is not enrolled in the course. */
export function LabEnrollNotice({ className }: { className?: string }) {
  const t = useTranslations("deploy.labKey");
  return (
    <p
      className={cn(
        "rounded-md border-[2px] border-border bg-[var(--card-alt)] px-4 py-3 text-sm text-text-2",
        className
      )}
    >
      {t("enrollRequired")}
    </p>
  );
}
