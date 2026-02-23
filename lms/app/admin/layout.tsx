import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "../globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin — Superteam Academy",
  description: "Admin dashboard for Superteam Academy on-chain operations",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${archivo.className} ${archivo.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
