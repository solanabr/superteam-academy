import { Header } from "@/components/landing/header";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full">{children}</main>
    </>
  );
}
