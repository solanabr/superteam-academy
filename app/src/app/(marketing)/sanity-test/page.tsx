'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Database,
  FileText,
  BookOpen,
} from 'lucide-react';

interface SanityTestResult {
  success: boolean;
  message?: string;
  error?: string;
  connection?: {
    projectId: string;
    dataset: string;
    apiVersion: string;
    connected: boolean;
  };
  documentCounts?: {
    tracks: number;
    instructors: number;
    courses: number;
    lessons: number;
    achievements: number;
  };
  sampleData?: {
    tracks: Array<{ _id: string; title: string; slug: { current: string } }>;
    courses: Array<{ _id: string; title: string; slug: { current: string }; published: boolean }>;
    instructors: Array<{ _id: string; name: string; slug: { current: string } }>;
  };
  timestamp?: string;
}

export default function SanityTestPage() {
  const [testResult, setTestResult] = useState<SanityTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setRetrying(false);
    try {
      const response = await fetch('/api/sanity/test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    runTest();
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            <Database className="mr-2 h-3 w-3" />
            System Test
          </Badge>
          <h1 className="mb-4 text-4xl font-bold">Sanity CMS Connection Test</h1>
          <p className="text-muted-foreground text-lg">
            Verify your Sanity CMS integration is working correctly
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : testResult?.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Connection Status
            </CardTitle>
            <CardDescription>
              {loading
                ? 'Testing connection...'
                : testResult?.success
                  ? testResult.message
                  : 'Connection failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult?.connection && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="mb-3 font-semibold">Configuration</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project ID:</span>
                    <code className="bg-background rounded px-2 py-1">
                      {testResult.connection.projectId}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dataset:</span>
                    <code className="bg-background rounded px-2 py-1">
                      {testResult.connection.dataset}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Version:</span>
                    <code className="bg-background rounded px-2 py-1">
                      {testResult.connection.apiVersion}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {testResult?.error && (
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-red-600">Error Details</h4>
                <p className="text-destructive text-sm">{testResult.error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleRetry} disabled={loading || retrying} variant="outline">
                {retrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry Test'
                )}
              </Button>
              <Button asChild variant="outline">
                <a href="/studio" target="_blank" rel="noopener noreferrer">
                  Open Studio
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Counts */}
        {testResult?.documentCounts && (
          <Card>
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
              <CardDescription>Document counts by type in your Sanity dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-1 text-2xl font-bold">{testResult.documentCounts.tracks}</div>
                  <div className="text-muted-foreground text-sm">Learning Tracks</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-1 text-2xl font-bold">{testResult.documentCounts.courses}</div>
                  <div className="text-muted-foreground text-sm">Courses</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-1 text-2xl font-bold">{testResult.documentCounts.lessons}</div>
                  <div className="text-muted-foreground text-sm">Lessons</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-1 text-2xl font-bold">
                    {testResult.documentCounts.instructors}
                  </div>
                  <div className="text-muted-foreground text-sm">Instructors</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-1 text-2xl font-bold">
                    {testResult.documentCounts.achievements}
                  </div>
                  <div className="text-muted-foreground text-sm">Achievements</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Data */}
        {testResult?.sampleData && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
              <CardDescription>Preview of available content in your Sanity dataset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {testResult.sampleData.tracks.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Tracks ({testResult.sampleData.tracks.length})
                  </h4>
                  <div className="space-y-2">
                    {testResult.sampleData.tracks.map((track) => (
                      <div
                        key={track._id}
                        className="bg-muted flex items-center justify-between rounded p-3"
                      >
                        <span className="text-sm">{track.title}</span>
                        <code className="bg-background text-muted-foreground rounded px-2 py-1 text-xs">
                          {track.slug?.current || 'No slug'}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.sampleData.courses.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Courses ({testResult.sampleData.courses.length})
                  </h4>
                  <div className="space-y-2">
                    {testResult.sampleData.courses.map((course) => (
                      <div
                        key={course._id}
                        className="bg-muted flex items-center justify-between rounded p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{course.title}</span>
                          <Badge
                            variant={course.published ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {course.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <code className="bg-background text-muted-foreground rounded px-2 py-1 text-xs">
                          {course.slug?.current || 'No slug'}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.sampleData.instructors.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Instructors ({testResult.sampleData.instructors.length})
                  </h4>
                  <div className="space-y-2">
                    {testResult.sampleData.instructors.map((instructor) => (
                      <div
                        key={instructor._id}
                        className="bg-muted flex items-center justify-between rounded p-3"
                      >
                        <span className="text-sm">{instructor.name}</span>
                        <code className="bg-background text-muted-foreground rounded px-2 py-1 text-xs">
                          {instructor.slug?.current || 'No slug'}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.sampleData.tracks.length === 0 &&
                testResult.sampleData.courses.length === 0 &&
                testResult.sampleData.instructors.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      No content found in your Sanity dataset
                    </p>
                    <Button asChild>
                      <a href="/studio" target="_blank" rel="noopener noreferrer">
                        Create Content in Studio
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Get started with Sanity CMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
                  1
                </div>
                <div>
                  <h5 className="mb-1 font-semibold">Access Sanity Studio</h5>
                  <p className="text-muted-foreground text-sm">
                    Navigate to <code className="bg-muted rounded px-1">/studio</code> to manage
                    your content
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
                  2
                </div>
                <div>
                  <h5 className="mb-1 font-semibold">Create Content</h5>
                  <p className="text-muted-foreground text-sm">
                    Add tracks, instructors, courses, lessons, and achievements through the Studio
                    interface
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
                  3
                </div>
                <div>
                  <h5 className="mb-1 font-semibold">Integrate with Frontend</h5>
                  <p className="text-muted-foreground text-sm">
                    Use the Sanity hooks and queries to fetch content in your React components
                  </p>
                </div>
              </div>
            </div>

            <div className="border-muted-foreground/20 flex items-start gap-4 rounded-lg border p-4">
              <BookOpen className="h-6 w-6" />
              <div>
                <h5 className="mb-1 font-semibold">Documentation</h5>
                <p className="text-muted-foreground mb-2 text-sm">
                  Check the SANITY_SETUP.md file for detailed setup instructions and usage examples
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://www.sanity.io/docs" target="_blank">
                    View Sanity Docs
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
