import { setRequestLocale } from 'next-intl/server'
import dynamic from 'next/dynamic'

const NotFound = dynamic(
  () =>
    import('@/app/[locale]/[...rest]/NotFound').then((m) => ({
      default: m.NotFound,
    })),
  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string }>
}

export default async function NotFoundPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <NotFound />
}
