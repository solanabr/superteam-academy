export const revalidate = 3600; // ISR: revalidate course pages every hour

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
