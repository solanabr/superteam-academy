export const metadata = {
  title: "Superteam Academy Studio",
  description: "Content management for Superteam Academy",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50">
      {children}
    </div>
  );
}
