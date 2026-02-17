import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { roadmaps } from "@/lib/roadmaps";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function RoadmapsPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <h1 className="text-3xl font-bold mb-2">Developer Roadmaps</h1>
        <p className="text-muted-foreground mb-10">
          Interactive learning paths to guide your Solana development journey.
          Zoom, pan, and explore each roadmap.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((rm) => (
            <Link key={rm.slug} href={`/roadmaps/${rm.slug}`}>
              <Card className="h-full group hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {rm.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                  <CardDescription>{rm.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
