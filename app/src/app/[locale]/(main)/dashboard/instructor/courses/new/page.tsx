"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function NewCoursePage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Em produção: enviar para API/on-chain. Por ora apenas simula sucesso.
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    router.push("/dashboard");
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToDashboard")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t("createNewCourse")}</CardTitle>
          <CardDescription>{t("createCourseDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                {t("courseTitle")}
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("courseTitlePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                {t("courseDescription")}
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("courseDescriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium">
                {t("courseImageUrl")}
              </label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
              <p className="text-xs text-muted-foreground">
                {t("courseImageUrlHint")}
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? t("saving") : t("saveCourse")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
