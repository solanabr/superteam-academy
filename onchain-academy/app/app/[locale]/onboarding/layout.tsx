import { Header } from "@/components/landing/header";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <><Header />{children}</>;
}