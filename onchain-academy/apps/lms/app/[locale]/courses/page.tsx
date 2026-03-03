import { setRequestLocale } from 'next-intl/server'
import Courses from './Courses'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <Courses />
}
