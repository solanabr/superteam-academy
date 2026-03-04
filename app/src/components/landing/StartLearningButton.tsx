"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { SignInModal } from "@/components/auth/SignInModal";

export function StartLearningButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("landing");
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick() {
    if (session) {
      router.push("/courses");
    } else {
      setModalOpen(true);
    }
  }

  return (
    <>
      <Button
        size="lg"
        className="glow-primary-pulse gap-2 px-8 text-base font-semibold"
        onClick={handleClick}
      >
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
        {t("hero.cta")}
      </Button>
      <SignInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        callbackUrl={`/${locale}/courses`}
      />
    </>
  );
}
