import { setRequestLocale } from 'next-intl/server'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(
  () => import('./Dashboard').then((m) => ({ default: m.default })),
  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <Dashboard />
}
