'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  const router = useRouter()
  return (
    <div className="container py-24 flex flex-col items-center gap-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} className="rounded-xl">Retry</Button>
        <Button variant="outline" onClick={() => router.push('/')} className="rounded-xl">Go Home</Button>
      </div>
    </div>
  )
}
