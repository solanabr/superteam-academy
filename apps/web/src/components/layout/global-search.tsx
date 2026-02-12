'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, FileText, Users } from 'lucide-react';
import { courses, userProfiles } from '@/lib/mock-data';

export function GlobalSearch() {
  const t = useTranslations('globalSearch');
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = useCallback((path: string) => {
    setOpen(false);
    router.push(path);
  }, [router]);

  // Flatten lessons
  const allLessons = courses.flatMap((c) =>
    c.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, courseSlug: c.slug, courseTitle: c.title }))
    )
  );

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={t('searchLabel')}>
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('placeholder')} />
        <CommandList>
          <CommandEmpty>{t('noResults')}</CommandEmpty>

          <CommandGroup heading={t('coursesGroup')}>
            {courses.filter((c) => c.status === 'published').map((course) => (
              <CommandItem key={course.slug} onSelect={() => navigate(`/courses/${course.slug}`)}>
                <BookOpen className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-sm">{course.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t('lessonsGroup')}>
            {allLessons.slice(0, 8).map((lesson) => (
              <CommandItem key={lesson.id} onSelect={() => navigate(`/courses/${lesson.courseSlug}/lessons/${lesson.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-sm">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">{lesson.courseTitle}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t('usersGroup')}>
            {userProfiles.filter((u) => u.isProfilePublic).map((user) => (
              <CommandItem key={user.id} onSelect={() => navigate(`/profile/${user.username}`)}>
                <Users className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
