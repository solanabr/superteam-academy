import { setRequestLocale } from 'next-intl/server'

import dynamic from 'next/dynamic'

const Profile = dynamic(
  () => import('./Profile').then((m) => ({ default: m.Profile })),

  { ssr: true },
)

type Props = {
  params: Promise<{ locale: string; username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { locale, username } = await params

  setRequestLocale(locale)

  return <Profile username={username} />
}
