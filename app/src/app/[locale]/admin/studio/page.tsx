"use client";

export default function SanityStudioPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-card p-4 border-b border-border">
          <h1 className="text-xl font-bold">Sanity Studio</h1>
          <p className="text-sm text-muted-foreground">
            Content management for courses, lessons, and achievements
          </p>
        </div>
        <div className="bg-muted/50 p-16 text-center text-muted-foreground">
          <p className="text-lg mb-2">Sanity Studio Embed</p>
          <p className="text-sm">
            Configure <code className="bg-muted px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SANITY_PROJECT_ID</code> in
            your environment variables to enable the embedded studio.
          </p>
          <p className="text-sm mt-4">
            Alternatively, access the hosted studio at{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              https://your-project.sanity.studio
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
