import type { Metadata } from "next";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | Superteam Academy Docs",
  },
  description:
    "Learn how to use Superteam Academy — the decentralized learning platform for Solana developers.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <DocsSidebar />
      <div className="flex-1 min-w-0">
        <main className="docs-content mx-auto max-w-3xl px-6 py-10 lg:px-8 lg:py-12">
          <style>{`
            .docs-content table {
              border-collapse: collapse;
              width: 100%;
            }
            .docs-content thead tr {
              border-bottom: 2px solid var(--color-border);
            }
            .docs-content thead th {
              background: var(--color-muted);
              color: var(--color-foreground);
              font-weight: 600;
              padding: 0.75rem 1rem;
              text-align: left;
              font-size: 0.875rem;
            }
            .docs-content tbody td {
              padding: 0.75rem 1rem;
              border-bottom: 1px solid var(--color-border);
              color: var(--color-foreground);
              font-size: 0.875rem;
            }
            .docs-content tbody tr:hover {
              background: var(--color-muted);
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}
