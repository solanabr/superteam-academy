/** Standard page container — max-w-6xl, responsive padding. */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 flex-1">
      {children}
    </main>
  );
}
