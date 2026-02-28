'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { LogIn, LogOut, Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function deriveInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]!;
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1]!;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export function SignInMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations('auth');

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t('sign_in')}</span>
      </Button>
    );
  }

  // Authenticated state: show user avatar + dropdown with sign-out
  if (session?.user) {
    const user = session.user;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2"
            aria-label={t('signed_in_as', { email: user.email ?? '' })}
          >
            <Avatar size="sm">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? ''} />
              )}
              <AvatarFallback className="text-xs">
                {deriveInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate text-sm sm:inline">
              {user.name ?? user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              {user.name && (
                <p className="text-sm font-medium leading-none">{user.name}</p>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('sign_out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Unauthenticated state: show sign-in dropdown with provider options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">{t('sign_in')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('sign_in')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => signIn('google')}
            className="cursor-pointer"
          >
            <Chrome className="mr-2 h-4 w-4" />
            {t('continue_with_google')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signIn('github')}
            className="cursor-pointer"
          >
            <Github className="mr-2 h-4 w-4" />
            {t('continue_with_github')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
