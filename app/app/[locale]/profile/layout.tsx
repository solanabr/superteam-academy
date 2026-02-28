import type { Metadata } from 'next';

const META: Record<string, string> = {
  'pt-BR': 'Perfil — Superteam Academy',
  en: 'Profile — Superteam Academy',
  es: 'Perfil — Superteam Academy',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: META[locale] ?? META['en'] };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
