import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { AdminBadge } from "@/components/admin/admin-badge";
import type { AdminLearningPathWithRefs } from "@/lib/content/queries";

interface PathsTableProps {
  paths: AdminLearningPathWithRefs[];
}

/**
 * Paths sub-view of the Content tab (#513 WS-C) — READ-ONLY, ZERO on-chain.
 * Shows each path's resolved course sequence, and loudly flags any `courseId`
 * ref that resolves to nothing instead of the silent drop `pathCourseRefIds`
 * callers get elsewhere today — the net-new dangling-ref detection
 * (`resolveRefs`, `getLearningPathsForAdminWithRefs`) exists specifically so
 * this view never hides a broken ref.
 */
export async function PathsTable({ paths }: PathsTableProps) {
  const t = await getTranslations("admin.contentScreen.paths");

  return (
    <section>
      <h3 className="mb-4 font-display text-lg font-bold text-text">
        {t("heading")}
      </h3>
      <AdminCard>
        {paths.length === 0 ? (
          <p className="text-sm text-text-3">{t("empty")}</p>
        ) : (
          <AdminTableShell
            columns={[
              { key: "path", label: t("table.path") },
              { key: "courses", label: t("table.courses") },
            ]}
          >
            {paths.map((path) => {
              const hasNothing =
                path.resolvedCourses.length === 0 &&
                path.danglingCourseIds.length === 0;
              return (
                <tr
                  key={path._id}
                  className="transition-colors hover:bg-subtle"
                >
                  <td className="py-3 pr-4 align-top font-medium text-text">
                    {path.title}
                  </td>
                  <td className="py-3 align-top">
                    {hasNothing ? (
                      <span className="text-sm text-text-3">
                        {t("noCourses")}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {path.resolvedCourses.map((course) => (
                          <AdminBadge key={course._id} tone="neutral">
                            {course.title}
                          </AdminBadge>
                        ))}
                        {path.danglingCourseIds.map((id) => (
                          <AdminBadge key={id} tone="danger" title={id}>
                            {t("danglingBadge")}: {id}
                          </AdminBadge>
                        ))}
                      </div>
                    )}
                    {path.danglingCourseIds.length > 0 && (
                      <p className="mt-1 text-xs font-medium text-danger">
                        {t("danglingCount", {
                          count: path.danglingCourseIds.length,
                        })}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </AdminTableShell>
        )}
      </AdminCard>
    </section>
  );
}
