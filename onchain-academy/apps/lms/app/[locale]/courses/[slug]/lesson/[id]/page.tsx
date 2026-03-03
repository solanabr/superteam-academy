import { setRequestLocale } from 'next-intl/server'
import Lesson from './Lesson'

type Props = {
  params: Promise<{ locale: string; slug: string; id: string }>
}

export default async function LessonPage({ params }: Props) {
  const { locale, slug, id } = await params
  setRequestLocale(locale)

  return <Lesson slug={slug} id={id} />
}
