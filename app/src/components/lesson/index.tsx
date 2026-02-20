import dynamic from "next/dynamic";

export const CodeEditor = dynamic(
  () => import("./code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground animate-pulse">Loading editor...</p>
      </div>
    ),
  },
);
