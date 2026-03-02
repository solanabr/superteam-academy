'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = ['General', 'Courses', 'Solana', 'Help', 'Showcase']

export function CreatePostModal({ canPost }: { canPost: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')

  const reset = () => {
    setTitle('')
    setContent('')
    setCategory('General')
    setError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setLoading(true)
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content, category })
    })
    const payload = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(payload?.error || 'Failed to create post')
      return
    }

    setOpen(false)
    reset()
    if (payload?.postId) {
      router.push(`/community/${payload.postId}` as any)
    } else {
      router.refresh()
    }
  }

  if (!canPost) {
    return (
      <Button variant="outline" disabled>
        Sign in to post
      </Button>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Post</Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Create a new post</h2>
              <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>
                Close
              </Button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />

              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <Textarea
                placeholder="Write your post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Posting...' : 'Publish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
