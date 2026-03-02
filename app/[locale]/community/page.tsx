import { createClient } from '@/lib/supabase/server'
import { CreatePostModal } from '@/components/community/create-post-modal'
import { CommunityPostList } from '@/components/community/community-post-list'

function shortWallet(wallet?: string | null) {
  if (!wallet) return null
  if (wallet.length <= 16) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
}

function authorName(profile?: any) {
  return profile?.username || shortWallet(profile?.wallet_address) || 'Anonymous'
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('community_posts')
    .select('id, user_id, title, content, category, upvotes, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  const postIds = (posts || []).map((post: any) => post.id)
  const userIds = Array.from(new Set((posts || []).map((post: any) => post.user_id).filter(Boolean)))

  const [{ data: profiles }, { data: comments }, voteQuery] = await Promise.all([
    userIds.length
      ? supabase
          .from('profiles')
          .select('id, username, wallet_address')
          .in('id', userIds)
      : Promise.resolve({ data: [] as any[] } as any),
    postIds.length
      ? supabase
          .from('community_comments')
          .select('id, post_id')
          .in('post_id', postIds)
      : Promise.resolve({ data: [] as any[] } as any),
    user && postIds.length
      ? supabase
          .from('community_post_votes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
      : Promise.resolve({ data: [] as any[] } as any)
  ])

  const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]))
  const repliesCountByPostId = new Map<string, number>()
  for (const comment of comments || []) {
    const key = (comment as any).post_id
    repliesCountByPostId.set(key, (repliesCountByPostId.get(key) || 0) + 1)
  }
  const upvotedPostIds = new Set((voteQuery?.data || []).map((row: any) => row.post_id))
  const normalizedPosts = (posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category || 'General',
    upvotes: Number(post.upvotes || 0),
    created_at: post.created_at,
    repliesCount: repliesCountByPostId.get(post.id) || 0,
    authorName: authorName(profileById.get(post.user_id)),
    isUpvoted: upvotedPostIds.has(post.id)
  }))

  return (
    <div className="container py-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Community</h1>
          <p className="text-muted-foreground">Discuss courses, ask questions, and share solutions.</p>
        </div>
        <CreatePostModal canPost={Boolean(user)} />
      </div>

      <CommunityPostList posts={normalizedPosts} canVote={Boolean(user)} />
    </div>
  )
}
