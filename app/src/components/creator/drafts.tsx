'use client';

import { FileEdit, PlusCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface DraftCourse {
  id: string;
  title: string;
  lessonsCount: number;
  lastEdited: string;
}

const MOCK_DRAFTS: DraftCourse[] = [
  {
    id: 'token-extensions',
    title: 'Token-2022 Extensions Masterclass',
    lessonsCount: 3,
    lastEdited: '2026-02-22',
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface DraftsProps {
  className?: string;
}

export function Drafts({ className }: DraftsProps) {
  const hasDrafts = MOCK_DRAFTS.length > 0;

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center gap-2">
          <FileEdit className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Drafts</CardTitle>
          {hasDrafts && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {MOCK_DRAFTS.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!hasDrafts ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <PlusCircle className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No drafts yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create your first course to start teaching on Superteam Academy
              </p>
            </div>
            <Button size="sm" className="mt-2 gap-1.5" asChild>
              <a href="/studio" target="_blank" rel="noopener noreferrer">
                <PlusCircle className="size-3.5" />
                Create Your First Course
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_DRAFTS.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/30"
              >
                <FileEdit className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{draft.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {draft.lessonsCount} lesson{draft.lessonsCount !== 1 ? 's' : ''} drafted
                    {' '}
                    &middot; Last edited {formatDate(draft.lastEdited)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs shrink-0"
                  asChild
                >
                  <a href="/studio" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                    Continue Editing
                  </a>
                </Button>
              </div>
            ))}

            {/* Add new */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full gap-1.5 text-xs"
              asChild
            >
              <a href="/studio" target="_blank" rel="noopener noreferrer">
                <PlusCircle className="size-3.5" />
                Create New Course
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
