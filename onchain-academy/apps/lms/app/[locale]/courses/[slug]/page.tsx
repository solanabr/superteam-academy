import { setRequestLocale } from 'next-intl/server'
import CourseSlug from './CourseSlug'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function CoursesPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  return <CourseSlug slug={slug} />
}
