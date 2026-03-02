'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'

type Props = {
  postId: string
  initialUpvotes: number
  initialUpvoted: boolean
  canVote: boolean
}

export function UpvoteButton({ postId, initialUpvotes, initialUpvoted, canVote }: Props) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onVote = async () => {
    if (!canVote || loading) return
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/community/posts/${postId}/upvote`, {
      method: 'POST',
      credentials: 'include'
    })
    const payload = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(payload?.error || 'Failed to vote')
      return
    }

    setUpvoted(Boolean(payload?.upvoted))
    setUpvotes(Number(payload?.upvotes || 0))
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={upvoted ? 'default' : 'outline'}
        size="sm"
        onClick={onVote}
        disabled={!canVote || loading}
        className="h-8"
      >
        <ChevronUp className="mr-1 h-4 w-4" />
        {upvotes}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
