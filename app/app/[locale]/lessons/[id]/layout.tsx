import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const prefixes: Record<string, string> = { 'pt-BR': 'Aula', en: 'Lesson', es: 'Lección' };
  return { title: `${prefixes[locale] ?? 'Lesson'} ${id} — Superteam Academy` };
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
