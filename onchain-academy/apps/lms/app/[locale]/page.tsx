import { setRequestLocale } from 'next-intl/server'
import dynamic from 'next/dynamic'

const Home = dynamic(
  () => import('../components/home').then((m) => ({ default: m.LandingA })),
  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <Home />
}
