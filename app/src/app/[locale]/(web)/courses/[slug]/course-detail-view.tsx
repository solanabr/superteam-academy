"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "@/i18n/navigation";
import { useAPIQuery, useAPIMutation } from "@/lib/api/useAPI";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";

type Course = {
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  published: boolean;
  modules: Array<{
    slug: string;
    title: string;
    order: number;
    lessons: Array<{ slug: string; title: string; order: number }>;
  }>;
};

export function CourseDetailView({ slug }: { slug: string }) {
  const t = useTranslations("courses");
  const t_auth = useTranslations("auth");
  const session = useAuthStore((s) => s.session);
  const wallet_connected = useWalletStore((s) => s.connected);
  const wallet_public_key = useWalletStore((s) => s.public_key);
  const { signMessage } = useWallet();

  const { data: course, isPending, error } = useAPIQuery<Course>({
    queryKey: ["course", slug],
    path: `/api/courses/${slug}`,
  });

  const [enroll_error, set_enroll_error] = useState<string | null>(null);
  const [enroll_success, set_enroll_success] = useState(false);

  const { data: enrollment_status, isPending: is_status_pending } = useAPIQuery<{
    enrolled: boolean;
    source: "db" | "on_chain" | "none";
  }>({
    queryKey: ["enrollment-status", slug],
    path: `/api/enrollment/status?course_slug=${encodeURIComponent(slug)}`,
    enabled: Boolean(session),
  });

  const enroll_prepare_mutation = useAPIMutation<{ message: string }, { course_slug: string }>(
    "post",
    "/api/enrollment/sync",
  );

  const enroll_confirm_mutation = useAPIMutation<
    { enrolled: boolean; already_enrolled?: boolean },
    { course_slug: string; message: string; signature: string }
  >("post", "/api/enrollment/sync/confirm");

  const handle_enroll = async () => {
    set_enroll_error(null);
    if (!session) {
      set_enroll_error(t_auth("validationError"));
      return;
    }
    if (!wallet_connected || !wallet_public_key) {
      set_enroll_error(t("enrollmentError"));
      return;
    }
    if (!signMessage) {
      set_enroll_error("Wallet does not support message signing.");
      return;
    }
    try {
      const prepared = await enroll_prepare_mutation.mutateAsync({ course_slug: slug });
      const message = prepared.message;
      const encoder = new TextEncoder();
      const signed = await signMessage(encoder.encode(message));
      const signature_base64 = btoa(String.fromCharCode(...signed));
      await enroll_confirm_mutation.mutateAsync({
        course_slug: slug,
        message,
        signature: signature_base64,
      });
      set_enroll_success(true);
    } catch (err) {
      set_enroll_error(err instanceof Error ? err.message : "Enrollment failed");
    }
  };

  if (isPending) return <p className="container mx-auto py-8">{t("title")}...</p>;
  if (error || !course) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-destructive">{error?.message ?? "Course not found"}</p>
        <Link href="/courses">
          <Button variant="outline" className="mt-4 rounded-none">
            Back to courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold text-foreground">{course.title}</h1>
      {course.description && (
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      )}

      {enroll_success && (
        <p className="mt-4 text-sm text-primary" role="status">
          {t("enrollmentSuccess")}
        </p>
      )}
      {enroll_error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {enroll_error}
        </p>
      )}
      <div className="mt-4">
        <Button
          onClick={handle_enroll}
          disabled={
            enroll_success ||
            is_status_pending ||
            enrollment_status?.enrolled === true ||
            enroll_prepare_mutation.isPending ||
            enroll_confirm_mutation.isPending
          }
          className="rounded-none"
        >
          {enrollment_status?.enrolled || enroll_success ? t("enrolled") : t("enroll")}
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("modules")}</h2>
        <ul className="mt-4 space-y-4">
          {course.modules.map((mod) => (
            <li key={mod.slug} className="border border-border bg-card p-4">
              <h3 className="font-medium">{mod.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {mod.lessons.map((les) => (
                  <li key={les.slug}>
                    <Link href={`/courses/${slug}/lessons/${les.slug}`}>
                      {les.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
