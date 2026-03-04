export default function StudioLoading() {
  return (
    <div role="status" aria-busy="true" className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
