"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

type Props = {
  courseSlug: string;
  prevLesson: {
    id: string;
    title: string;
    type: "content" | "challenge";
  } | null;
  nextLesson: {
    id: string;
    title: string;
    type: "content" | "challenge";
  } | null;
};

export function LessonNavigation({
  courseSlug,
  prevLesson,
  nextLesson,
}: Props) {
  const t = useTranslations("lessonView");

  return (
    <nav aria-label="Lesson navigation" className="flex shrink-0 gap-2">
      {prevLesson ? (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/courses/${courseSlug}/lessons/${prevLesson.id}?type=${prevLesson.type}`}
          >
            <CaretLeft className="mr-1 size-4" weight="bold" />
            {t("previous")}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <CaretLeft className="mr-1 size-4" weight="bold" />
          {t("previous")}
        </Button>
      )}
      {nextLesson ? (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/courses/${courseSlug}/lessons/${nextLesson.id}?type=${nextLesson.type}`}
          >
            {t("next")}
            <CaretRight className="ml-1 size-4" weight="bold" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {t("next")}
          <CaretRight className="ml-1 size-4" weight="bold" />
        </Button>
      )}
    </nav>
  );
}
