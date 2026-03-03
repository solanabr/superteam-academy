/**
 * Community Threads API — CRUD + upvote.
 *
 * GET  → list threads (with category, course, pagination)
 * POST → create a new thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';
import { prisma } from '@/backend/prisma';

const PAGE_SIZE = 20;
const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 10000;
const VALID_CATEGORIES = ['general', 'help', 'showcase', 'feedback'];

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`threads-list:${ip}`);
    if (!success) return response!;

    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const courseId = searchParams.get('courseId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const where = {
        ...(category && VALID_CATEGORIES.includes(category) ? { category } : {}),
        ...(courseId ? { course_id: courseId } : {}),
    };

    const [threads, total] = await Promise.all([
        prisma.threads.findMany({
            where,
            include: {
                author: {
                    select: { id: true, name: true, avatar_url: true, username: true },
                },
            },
            orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.threads.count({ where }),
    ]);

    return NextResponse.json({
        threads,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE),
        },
    });
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { success, response } = await checkRateLimit(`threads-create:${ip}`, 'strict');
    if (!success) return response!;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
        title?: string;
        content?: string;
        category?: string;
        courseId?: string;
        lessonId?: string;
        tags?: string[];
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { title, content, category, courseId, lessonId, tags } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: `Content must be under ${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: `Invalid category. Must be: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const thread = await prisma.threads.create({
        data: {
            title: title.trim(),
            content: content.trim(),
            author_id: session.user.id,
            category: category || 'general',
            course_id: courseId || null,
            lesson_id: lessonId || null,
            tags: Array.isArray(tags) ? tags.slice(0, 5).map((t) => String(t).trim()) : [],
        },
        include: {
            author: {
                select: { id: true, name: true, avatar_url: true, username: true },
            },
        },
    });

    return NextResponse.json(thread, { status: 201 });
}
