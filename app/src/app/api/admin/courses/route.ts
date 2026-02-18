import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin course management API.
 * In production: verify admin wallet signature, use Prisma for persistence.
 */

// In-memory store for demo (production: Prisma)
const customCourses: any[] = []

export async function GET() {
  return NextResponse.json({ courses: customCourses, total: customCourses.length })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, titleEn, slug, description, difficulty, category, icon, tokenGated, requiredToken, modules } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'title and slug required' }, { status: 400 })
  }

  // Validate slug uniqueness
  if (customCourses.some(c => c.slug === slug)) {
    return NextResponse.json({ error: 'slug already exists' }, { status: 409 })
  }

  const course = {
    id: `custom-${Date.now()}`,
    slug,
    title,
    titleEn: titleEn || title,
    description: description || '',
    difficulty: difficulty || 'BEGINNER',
    category: category || 'General',
    icon: icon || '📚',
    tokenGated: tokenGated || false,
    requiredToken: requiredToken || null,
    modules: modules || [],
    students: 0,
    published: true,
    createdAt: new Date().toISOString(),
  }

  customCourses.push(course)

  return NextResponse.json({ success: true, course })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { slug, ...updates } = body

  const idx = customCourses.findIndex(c => c.slug === slug)
  if (idx < 0) {
    return NextResponse.json({ error: 'course not found' }, { status: 404 })
  }

  customCourses[idx] = { ...customCourses[idx], ...updates, updatedAt: new Date().toISOString() }
  return NextResponse.json({ success: true, course: customCourses[idx] })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  const idx = customCourses.findIndex(c => c.slug === slug)
  if (idx < 0) {
    return NextResponse.json({ error: 'course not found' }, { status: 404 })
  }

  customCourses.splice(idx, 1)
  return NextResponse.json({ success: true })
}
