'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/routing'
import { Input } from '@/components/ui/input'
import { UpvoteButton } from '@/components/community/upvote-button'
import { MessageSquare, Search } from 'lucide-react'

type CommunityPostItem = {
  id: string
  title: string
  content: string
  category: string | null
  upvotes: number
  created_at: string
  repliesCount: number
  authorName: string
  isUpvoted: boolean
}

export function CommunityPostList({
  posts,
  canVote
}: {
  posts: CommunityPostItem[]
  canVote: boolean
}) {
  const [query, setQuery] = useState('')

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        String(post.category || '').toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      )
    })
  }, [posts, query])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, categories, or authors..."
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <article key={post.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/community/${post.id}`} className="line-clamp-1 text-lg font-bold hover:text-primary">
                    {post.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">
                    {post.category || 'General'} | by {post.authorName} | {new Date(post.created_at).toLocaleDateString()} | {post.repliesCount} replies
                  </p>
                </div>
                <UpvoteButton
                  postId={post.id}
                  initialUpvotes={Number(post.upvotes || 0)}
                  initialUpvoted={post.isUpvoted}
                  canVote={canVote}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 p-6 text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
            {query ? 'No posts match your search.' : 'No posts yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
