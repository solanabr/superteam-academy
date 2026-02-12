'use client';

import { useTranslations } from 'next-intl';
import { userProfiles } from '@/lib/mock-data';
import { UserTable } from '@/components/admin/user-table';

export default function AdminUsersPage() {
  const t = useTranslations('admin');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('users')}</h1>
      <div className="mt-6">
        <UserTable users={userProfiles} />
      </div>
    </div>
  );
}
