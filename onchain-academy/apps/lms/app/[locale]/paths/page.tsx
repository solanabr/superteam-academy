import { setRequestLocale } from 'next-intl/server'

import dynamic from 'next/dynamic'

const Path = dynamic(
  () => import('./Paths').then((m) => ({ default: m.default })),

  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string }>
}

export default async function PathPage({ params }: Props) {
  const { locale } = await params

  setRequestLocale(locale)

  return <Path />
}
