import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { RepliesSection } from '@/components/community/replies-section'
import { UpvoteButton } from '@/components/community/upvote-button'

type Props = {
  params: Promise<{ locale: string; postId: string }>
}

function shortWallet(wallet?: string | null) {
  if (!wallet) return null
  if (wallet.length <= 16) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
}

function authorName(profile?: any) {
  return profile?.username || shortWallet(profile?.wallet_address) || 'Anonymous'
}

export default async function CommunityPostPage({ params }: Props) {
  const { locale, postId } = await params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('community_posts')
    .select('id, user_id, title, content, category, upvotes, created_at')
    .eq('id', postId)
    .single()

  if (!post) {
    notFound()
  }

  const [{ data: profile }, { data: replies }, voteLookup] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, wallet_address')
      .eq('id', post.user_id)
      .maybeSingle(),
    supabase
      .from('community_comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true }),
    user
      ? supabase
          .from('community_post_votes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any)
  ])

  const replyUserIds = Array.from(new Set((replies || []).map((reply: any) => reply.user_id).filter(Boolean)))
  const { data: replyProfiles } = replyUserIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, wallet_address')
        .in('id', replyUserIds)
    : { data: [] as any[] }
  const replyProfileById = new Map((replyProfiles || []).map((p: any) => [p.id, p]))
  const mergedReplies = (replies || []).map((reply: any) => ({
    ...reply,
    profile: replyProfileById.get(reply.user_id) || null
  }))

  const upvoted = Boolean(voteLookup?.data?.id)

  return (
    <div className="container py-12 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/community" className="text-sm font-bold text-primary hover:underline">
          Back to Community
        </Link>
      </div>

      <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <span>{post.category || 'General'}</span>
          <span>|</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
          <span>|</span>
          <span>by {authorName(profile)}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">{post.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{post.content}</p>
        <div className="mt-5">
          <UpvoteButton
            postId={post.id}
            initialUpvotes={Number(post.upvotes || 0)}
            initialUpvoted={upvoted}
            canVote={Boolean(user)}
          />
        </div>
      </article>

      <RepliesSection postId={post.id} initialReplies={mergedReplies} canReply={Boolean(user)} />
    </div>
  )
}
