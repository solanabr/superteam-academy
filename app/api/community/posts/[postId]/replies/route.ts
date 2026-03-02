import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = {
  params: Promise<{ postId: string }>
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const { data: replies, error } = await supabase
      .from('community_comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = Array.from(new Set((replies || []).map((reply: any) => reply.user_id).filter(Boolean)))
    const { data: profiles } = userIds.length
      ? await supabase
          .from('profiles')
          .select('id, username, wallet_address, avatar_url')
          .in('id', userIds)
      : { data: [] as any[] }

    const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]))
    const merged = (replies || []).map((reply: any) => ({
      ...reply,
      profile: profileById.get(reply.user_id) || null
    }))

    return NextResponse.json({ ok: true, replies: merged })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load replies'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { postId } = await params
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await req.json()
    const trimmed = String(content || '').trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: trimmed
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, replyId: data.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create reply'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
