import { setRequestLocale } from 'next-intl/server'

import dynamic from 'next/dynamic'

const PathSlug = dynamic(
  () => import('./PathSlug').then((m) => ({ default: m.default })),

  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function PathPage({ params }: Props) {
  const { locale, slug } = await params

  setRequestLocale(locale)

  return <PathSlug slug={slug} />
}
