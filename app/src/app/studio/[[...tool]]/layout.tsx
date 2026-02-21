export const metadata = {
  title: "Superteam Academy Studio",
  description: "Content management for Superteam Academy",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
