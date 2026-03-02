"use client";

import dynamic from "next/dynamic";

const CoursePreview = dynamic(
  () =>
    import("@/components/cms/course-preview").then((m) => ({
      default: m.CoursePreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--foreground, #ccc)",
        }}
      >
        Loading preview...
      </div>
    ),
  },
);

export function CoursePreviewLoader(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
  serverURL: string;
}) {
  return <CoursePreview {...props} />;
}
