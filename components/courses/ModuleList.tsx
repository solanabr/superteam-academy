"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { CmsCourse } from "@/lib/cms/types";

type ModuleListProps = {
  course: CmsCourse;
};

export function ModuleList({ course }: ModuleListProps): JSX.Element {
  const { t } = useI18n();

  return (
    <ul className="space-y-3">
      {course.modules.map((module, index) => (
        <li key={module.title} className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            {t("common.module")} {index + 1}
          </p>
          <p className="font-medium">{module.title}</p>
          <p className="text-sm text-muted-foreground">
            {module.lessons.length} {t("common.lessons")}
          </p>
        </li>
      ))}
    </ul>
  );
}
