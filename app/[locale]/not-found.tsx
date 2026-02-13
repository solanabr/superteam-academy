import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const t = await getTranslations('NotFound')
  return (
    <div className="container py-24 flex flex-col items-center gap-6">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>
      <Button asChild className="rounded-xl">
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </div>
  )
}
