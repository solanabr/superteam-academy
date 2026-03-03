import { setRequestLocale } from 'next-intl/server'
import Certificate from './Certificate'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <Certificate certificateId={id} />
}
