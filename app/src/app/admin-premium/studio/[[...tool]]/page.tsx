/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../../../sanity.config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';

// Admin addresses/emails that can access Sanity Studio
const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '').split(',').filter(Boolean);

function isAdmin(user: any): boolean {
  if (!user) return false;

  // Check if email is in admin list
  if (user.email && ADMIN_ADDRESSES.includes(user.email.toLowerCase())) {
    return true;
  }

  // Check if wallet address is in admin list
  if (user.walletAddress && ADMIN_ADDRESSES.includes(user.walletAddress.toLowerCase())) {
    return true;
  }

  return false;
}

export default function StudioPage() {
  const { user, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Check if user is in admin list
    const authorized = isAdmin(user);
    setIsAuthorized(authorized);
    setIsLoading(false);
  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-muted/50 flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="text-destructive h-5 w-5" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>Sanity Studio is only accessible to administrators.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              If you believe you should have access, please contact your system administrator.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">Back to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
