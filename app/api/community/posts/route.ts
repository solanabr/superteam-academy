import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, category } = await req.json()
    const trimmedTitle = String(title || '').trim()
    const trimmedContent = String(content || '').trim()
    const trimmedCategory = String(category || 'General').trim()

    if (!trimmedTitle || !trimmedContent) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        title: trimmedTitle,
        content: trimmedContent,
        category: trimmedCategory
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, postId: data.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
