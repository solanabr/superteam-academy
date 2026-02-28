import { Header } from "@/components/layout/Header";

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}
