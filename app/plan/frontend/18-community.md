# Community/Forum Service

## Overview

The Community/Forum Service provides discussion threads and Q&A for learners.

## Features

- Discussion threads per course/lesson
- Q&A with upvotes
- Code snippets in posts
- Markdown support
- Notifications for replies
- Moderation tools

## Data Types

```typescript
// types/community.ts
export interface Thread {
  id: string;
  title: string;
  content: string;
  author: User;
  category: 'general' | 'help' | 'showcase' | 'feedback';
  courseId?: string;
  lessonId?: string;
  tags: string[];
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reply {
  id: string;
  threadId: string;
  content: string;
  author: User;
  upvotes: number;
  isAccepted: boolean; // For Q&A
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
}
```

## Database Schema

```sql
-- Threads
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  category VARCHAR(50) NOT NULL,
  course_id VARCHAR(50),
  lesson_id VARCHAR(50),
  tags TEXT[],
  upvotes INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  upvotes INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes
CREATE TABLE thread_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE TABLE reply_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Indexes
CREATE INDEX idx_threads_category ON threads(category);
CREATE INDEX idx_threads_course ON threads(course_id);
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_replies_thread ON replies(thread_id);
```

## Implementation

### 1. Community Service

```typescript
// services/community-service.ts
import { Thread, Reply, Category } from '@/types/community';

export interface ICommunityService {
  // Threads
  getThreads(options: { category?: string; courseId?: string; page?: number }): Promise<Thread[]>;
  getThread(id: string): Promise<Thread | null>;
  createThread(data: CreateThreadInput): Promise<Thread>;
  updateThread(id: string, data: UpdateThreadInput): Promise<Thread>;
  deleteThread(id: string): Promise<void>;
  
  // Replies
  getReplies(threadId: string): Promise<Reply[]>;
  createReply(threadId: string, content: string): Promise<Reply>;
  updateReply(id: string, content: string): Promise<Reply>;
  deleteReply(id: string): Promise<void>;
  acceptReply(id: string): Promise<void>;
  
  // Voting
  upvoteThread(threadId: string): Promise<void>;
  upvoteReply(replyId: string): Promise<void>;
  removeUpvoteThread(threadId: string): Promise<void>;
  removeUpvoteReply(replyId: string): Promise<void>;
}

export class PrismaCommunityService implements ICommunityService {
  constructor(private prisma: any) {}
  
  async getThreads(options: { category?: string; courseId?: string; page?: number }): Promise<Thread[]> {
    const { category, courseId, page = 1 } = options;
    const pageSize = 20;
    
    return this.prisma.thread.findMany({
      where: {
        ...(category && { category }),
        ...(courseId && { courseId }),
      },
      include: {
        author: { select: { id: true, name: true, avatar_url: true } },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }
  
  async getThread(id: string): Promise<Thread | null> {
    return this.prisma.thread.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar_url: true, wallet_address: true } },
      },
    });
  }
  
  async createThread(data: CreateThreadInput): Promise<Thread> {
    return this.prisma.thread.create({
      data: {
        title: data.title,
        content: data.content,
        author_id: data.authorId,
        category: data.category,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        tags: data.tags || [],
      },
      include: {
        author: { select: { id: true, name: true, avatar_url: true } },
      },
    });
  }
  
  async getReplies(threadId: string): Promise<Reply[]> {
    return this.prisma.reply.findMany({
      where: { thread_id: threadId },
      include: {
        author: { select: { id: true, name: true, avatar_url: true } },
      },
      orderBy: [
        { isAccepted: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }
  
  async createReply(threadId: string, content: string, authorId: string): Promise<Reply> {
    const [reply] = await this.prisma.$transaction([
      this.prisma.reply.create({
        data: {
          thread_id: threadId,
          content,
          author_id: authorId,
        },
        include: {
          author: { select: { id: true, name: true, avatar_url: true } },
        },
      }),
      this.prisma.thread.update({
        where: { id: threadId },
        data: { reply_count: { increment: 1 } },
      }),
    ]);
    
    return reply;
  }
  
  async acceptReply(id: string): Promise<void> {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
      select: { thread_id: true },
    });
    
    if (!reply) return;
    
    await this.prisma.$transaction([
      // Unaccept previous
      this.prisma.reply.updateMany({
        where: { thread_id: reply.thread_id, isAccepted: true },
        data: { isAccepted: false },
      }),
      // Accept this one
      this.prisma.reply.update({
        where: { id },
        data: { isAccepted: true },
      }),
    ]);
  }
  
  async upvoteThread(threadId: string, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.threadUpvote.create({
        data: { thread_id: threadId, user_id: userId },
      }),
      this.prisma.thread.update({
        where: { id: threadId },
        data: { upvotes: { increment: 1 } },
      }),
    ]);
  }
}

interface CreateThreadInput {
  title: string;
  content: string;
  authorId: string;
  category: string;
  courseId?: string;
  lessonId?: string;
  tags?: string[];
}
```

### 2. Community Hook

```typescript
// hooks/useCommunity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community-service';
import { useAuth } from './useAuth';

export function useThreads(options: { category?: string; courseId?: string; page?: number }) {
  return useQuery({
    queryKey: ['threads', options],
    queryFn: () => communityService.getThreads(options),
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: ['thread', id],
    queryFn: () => communityService.getThread(id),
    enabled: !!id,
  });
}

export function useReplies(threadId: string) {
  return useQuery({
    queryKey: ['replies', threadId],
    queryFn: () => communityService.getReplies(threadId),
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<CreateThreadInput, 'authorId'>) =>
      communityService.createThread({ ...data, authorId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useCreateReply(threadId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (content: string) =>
      communityService.createReply(threadId, content, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', threadId] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
    },
  });
}
```

### 3. Forum Page

```typescript
// app/(dashboard)/community/page.tsx
'use client';

import { useState } from 'react';
import { useThreads } from '@/hooks/useCommunity';
import { ThreadCard } from '@/components/community/ThreadCard';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { CreateThreadButton } from '@/components/community/CreateThreadButton';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'help', name: 'Help & Q&A', icon: '❓' },
  { id: 'showcase', name: 'Showcase', icon: '🎨' },
  { id: 'feedback', name: 'Feedback', icon: '📢' },
];

export default function CommunityPage() {
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  
  const { data: threads, isLoading } = useThreads({
    category: category === 'all' ? undefined : category,
    page,
  });
  
  return (
    <div className="community-page">
      <header className="page-header">
        <h1>Community</h1>
        <CreateThreadButton />
      </header>
      
      <CategoryFilter
        categories={CATEGORIES}
        active={category}
        onChange={setCategory}
      />
      
      <div className="threads-list">
        {isLoading ? (
          <LoadingSkeleton />
        ) : threads?.length === 0 ? (
          <EmptyState />
        ) : (
          threads?.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))
        )}
      </div>
      
      <Pagination current={page} onChange={setPage} />
    </div>
  );
}
```

### 4. Thread Detail Page

```typescript
// app/(dashboard)/community/[id]/page.tsx
'use client';

import { useThread, useReplies, useCreateReply } from '@/hooks/useCommunity';
import { ThreadHeader } from '@/components/community/ThreadHeader';
import { ReplyCard } from '@/components/community/ReplyCard';
import { ReplyForm } from '@/components/community/ReplyForm';

export default function ThreadPage({ params }: { params: { id: string } }) {
  const { data: thread, isLoading: threadLoading } = useThread(params.id);
  const { data: replies, isLoading: repliesLoading } = useReplies(params.id);
  const createReply = useCreateReply(params.id);
  
  if (threadLoading) return <Loading />;
  if (!thread) return <NotFound />;
  
  return (
    <div className="thread-page">
      <ThreadHeader thread={thread} />
      
      <div className="thread-content">
        <div className="content-body">
          <MarkdownContent content={thread.content} />
        </div>
        
        <div className="thread-actions">
          <UpvoteButton 
            count={thread.upvotes} 
            onUpvote={() => communityService.upvoteThread(thread.id)}
          />
        </div>
      </div>
      
      <div className="replies-section">
        <h2>{replies?.length || 0} Replies</h2>
        
        {repliesLoading ? (
          <Loading />
        ) : (
          replies?.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onAccept={() => communityService.acceptReply(reply.id)}
              isAuthor={thread.author.id === currentUser?.id}
            />
          ))
        )}
      </div>
      
      {!thread.isLocked && (
        <ReplyForm
          onSubmit={(content) => createReply.mutate(content)}
          isSubmitting={createReply.isPending}
        />
      )}
    </div>
  );
}
```

### 5. Markdown with Code Blocks

```typescript
// components/common/MarkdownContent.tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          
          return isInline ? (
            <code className="inline-code" {...props}>
              {children}
            </code>
          ) : (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

## API Endpoints

```
# Threads
GET    /api/community/threads           # List threads
GET    /api/community/threads/:id       # Get thread
POST   /api/community/threads           # Create thread
PUT    /api/community/threads/:id       # Update thread
DELETE /api/community/threads/:id       # Delete thread
POST   /api/community/threads/:id/upvote # Upvote thread

# Replies
GET    /api/community/threads/:id/replies # List replies
POST   /api/community/threads/:id/replies # Create reply
PUT    /api/community/replies/:id       # Update reply
DELETE /api/community/replies/:id       # Delete reply
POST   /api/community/replies/:id/upvote # Upvote reply
POST   /api/community/replies/:id/accept # Accept answer
```

## Moderation

- Report threads/replies
- Auto-moderation for spam
- Admin lock/delete powers
- User ban functionality
