'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface UserTableProps {
  users: UserProfile[];
}

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  professor: 'bg-blue-500/20 text-blue-400',
  student: 'bg-emerald-500/20 text-emerald-400',
};

export function UserTable({ users }: UserTableProps) {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter((u) => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t('searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRoles')}</SelectItem>
            <SelectItem value="student">{t('roleStudent')}</SelectItem>
            <SelectItem value="professor">{t('roleProfessor')}</SelectItem>
            <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border">
        <div className="grid grid-cols-[1fr_120px_80px_80px_60px] gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>{t('userName')}</span>
          <span>{t('role')}</span>
          <span className="text-right">{t('coursesEnrolled')}</span>
          <span className="text-right">XP</span>
          <span className="text-right">{t('actions')}</span>
        </div>
        {filtered.map((user) => (
          <div key={user.id} className="grid grid-cols-[1fr_120px_80px_80px_60px] gap-2 border-b px-4 py-3 text-sm last:border-b-0">
            <div className="min-w-0">
              <p className="truncate font-medium">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <Badge variant="secondary" className={roleBadgeColor[user.role] ?? ''}>
                {user.role}
              </Badge>
            </div>
            <span className="text-right">{user.enrolledCourseIds.length}</span>
            <span className="text-right">{user.totalXP.toLocaleString()}</span>
            <div className="text-right">
              {user.role === 'student' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      ↑
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('promoteConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('promoteDesc', { name: user.displayName })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancelAction')}</AlertDialogCancel>
                      <AlertDialogAction>{t('confirmAction')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">{t('noUsers')}</div>
        )}
      </div>
    </div>
  );
}
