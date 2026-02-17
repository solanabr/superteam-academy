import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <DashboardSkeleton />
      </main>
      <Footer />
    </div>
  );
}
