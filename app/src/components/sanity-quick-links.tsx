'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink, Database, FileText, Zap } from 'lucide-react';

export function SanityQuickLinks() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-primary h-5 w-5" />
            <CardTitle className="text-lg">Sanity CMS is Connected!</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <CardDescription>
          Your content management system is ready to use. Get started below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/studio" target="_blank">
            <div className="group hover:border-primary hover:bg-accent flex items-start gap-3 rounded-lg border p-3 transition-colors">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="group-hover:text-primary mb-1 font-semibold">Open Studio</h4>
                <p className="text-muted-foreground text-sm">Manage your content</p>
              </div>
              <ExternalLink className="text-muted-foreground mt-1 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>

          <Link href="/sanity-test">
            <div className="group hover:border-primary hover:bg-accent flex items-start gap-3 rounded-lg border p-3 transition-colors">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="group-hover:text-primary mb-1 font-semibold">Test Connection</h4>
                <p className="text-muted-foreground text-sm">Verify CMS integration</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            What&apos;s Set Up
          </h5>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>• 5 content types: Tracks, Courses, Lessons, Instructors, Achievements</li>
            <li>• React hooks for easy data fetching</li>
            <li>• GROQ queries library</li>
            <li>• TypeScript types</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="https://www.sanity.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm transition-colors"
          >
            View Documentation
            <ExternalLink className="h-3 w-3" />
          </a>
          <Badge variant="secondary" className="text-xs">
            Ready to use
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
