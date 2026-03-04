import { Header } from "@/components/landing/header";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full px-4 py-8">{children}</main>
    </>
  );
}
