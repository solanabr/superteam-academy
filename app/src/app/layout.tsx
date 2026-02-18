// Root layout - redirects are handled by middleware
// The actual layout with providers is in [locale]/layout.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
