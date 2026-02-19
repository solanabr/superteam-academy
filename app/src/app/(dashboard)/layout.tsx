// app/src/app/(dashboard)/layout.tsx
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
//import { ModeToggle } from "@/components/mode-toggle"; // Мы создадим этот компонент позже
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Superteam Academy
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <MainNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden mt-6">
          {children}
        </main>
      </div>
    </div>
  );
}