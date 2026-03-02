import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = {
  params: Promise<{ postId: string }>
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { postId } = await params
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, upvotes')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const { data: existingVote, error: voteLookupError } = await supabase
      .from('community_post_votes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (voteLookupError) {
      const msg = String(voteLookupError.message || '').toLowerCase()
      const missingVotesTable =
        msg.includes('community_post_votes') &&
        (msg.includes('does not exist') || msg.includes('schema cache'))
      if (missingVotesTable) {
        return NextResponse.json(
          { error: 'Missing table: public.community_post_votes. Run scripts/005_community_post_votes.sql.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: voteLookupError.message }, { status: 500 })
    }

    const currentUpvotes = Number(post.upvotes || 0)
    if (existingVote?.id) {
      const [{ error: deleteError }, { data: updated, error: updateError }] = await Promise.all([
        supabase
          .from('community_post_votes')
          .delete()
          .eq('id', existingVote.id),
        supabase
          .from('community_posts')
          .update({ upvotes: Math.max(0, currentUpvotes - 1), updated_at: new Date().toISOString() })
          .eq('id', postId)
          .select('upvotes')
          .single()
      ])

      if (deleteError || updateError) {
        return NextResponse.json({ error: deleteError?.message || updateError?.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, upvoted: false, upvotes: updated?.upvotes || 0 })
    }

    const [{ error: insertError }, { data: updated, error: updateError }] = await Promise.all([
      supabase
        .from('community_post_votes')
        .insert({ post_id: postId, user_id: user.id }),
      supabase
        .from('community_posts')
        .update({ upvotes: currentUpvotes + 1, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select('upvotes')
        .single()
    ])

    if (insertError || updateError) {
      return NextResponse.json({ error: insertError?.message || updateError?.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, upvoted: true, upvotes: updated?.upvotes || currentUpvotes + 1 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upvote post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
