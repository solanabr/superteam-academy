import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Course",
};

export default function CreateCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
