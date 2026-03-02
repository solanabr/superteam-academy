export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container px-4 pb-20 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pb-8">
      {children}
    </div>
  );
}
