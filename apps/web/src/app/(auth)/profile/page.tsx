'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-data';

export default function MyProfilePage() {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    router.replace(`/profile/${user.username}`);
  }, [router, user.username]);

  return null;
}
