import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { getRoadmap, roadmaps } from "@/lib/roadmaps";
import { RoadmapViewer } from "@/components/roadmap/roadmap-viewer";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return roadmaps.map((r) => ({ slug: r.slug }));
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) notFound();

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="border-b border-border bg-background px-4 py-3 lg:px-6">
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Roadmaps
        </Link>
        <h1 className="text-xl font-bold">{roadmap.title} Roadmap</h1>
        <p className="text-sm text-muted-foreground">{roadmap.description}</p>
      </div>
      <div className="flex-1">
        <RoadmapViewer roadmap={roadmap} />
      </div>
    </div>
  );
}
