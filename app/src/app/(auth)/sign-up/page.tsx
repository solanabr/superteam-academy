"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
  const t = useTranslations("Auth");

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-white/10 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">{t("createAccount")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder={t("username")} className="bg-zinc-950/60" />
          <Input type="email" placeholder={t("email")} className="bg-zinc-950/60" />
          <Input type="password" placeholder={t("password")} className="bg-zinc-950/60" />
          <Button className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">{t("submitSignUp")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
