'use client'

import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/routing'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  const router = useRouter()
  return (
    <div className="container py-24 flex flex-col items-center gap-6">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div className="text-center space-y-3 max-w-xl">
        <h1 className="text-3xl font-extrabold">Oops, this page crashed</h1>
        <p className="text-muted-foreground">{error.message || 'An unexpected error occurred while rendering this route.'}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
        <Button variant="outline" onClick={() => router.push('/')} className="rounded-xl">Go Home</Button>
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href="/docs">Open Docs</Link>
        </Button>
      </div>
    </div>
  )
}
