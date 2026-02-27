import type { Metadata } from 'next';

const META: Record<string, string> = {
  'pt-BR': 'Painel — Superteam Academy',
  en: 'Dashboard — Superteam Academy',
  es: 'Panel — Superteam Academy',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: META[locale] ?? META['en'] };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
