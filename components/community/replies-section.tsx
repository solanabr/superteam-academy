'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type ReplyItem = {
  id: string
  user_id: string
  content: string
  created_at: string
  profile?: {
    username?: string | null
    wallet_address?: string | null
  } | null
}

function shortWallet(wallet?: string | null) {
  if (!wallet) return null
  if (wallet.length <= 16) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
}

function displayAuthor(reply: ReplyItem) {
  return reply.profile?.username || shortWallet(reply.profile?.wallet_address) || 'Anonymous'
}

export function RepliesSection({
  postId,
  initialReplies,
  canReply
}: {
  postId: string
  initialReplies: ReplyItem[]
  canReply: boolean
}) {
  const [replies, setReplies] = useState<ReplyItem[]>(initialReplies)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = content.trim()
    if (!trimmed) {
      setError('Reply content is required')
      return
    }

    setLoading(true)
    const postRes = await fetch(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: trimmed })
    })
    const postPayload = await postRes.json().catch(() => ({}))

    if (!postRes.ok) {
      setLoading(false)
      setError(postPayload?.error || 'Failed to send reply')
      return
    }

    const getRes = await fetch(`/api/community/posts/${postId}/replies`, {
      credentials: 'include'
    })
    const getPayload = await getRes.json().catch(() => ({}))
    setLoading(false)

    if (!getRes.ok) {
      setError(getPayload?.error || 'Reply saved, but list refresh failed')
      return
    }

    setReplies(getPayload?.replies || [])
    setContent('')
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
      <h2 className="text-xl font-black">Replies ({replies.length})</h2>

      {canReply ? (
        <form onSubmit={submitReply} className="mt-4 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Reply'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sign in to reply.</p>
      )}

      <div className="mt-6 space-y-3">
        {replies.length > 0 ? (
          replies.map((reply) => (
            <article key={reply.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold">{displayAuthor(reply)}</p>
                <p className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-muted-foreground">
            No replies yet.
          </div>
        )}
      </div>
    </section>
  )
}
