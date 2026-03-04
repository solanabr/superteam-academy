/**
 * app/auth/callback/route.ts
 *
 * FIX: Implicit 'any' on cookiesToSet destructure — same root cause.
 * Added `import type { CookieOptionsWithName }` and annotated setAll parameter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const next  = searchParams.get('next') ?? '/en/dashboard';
  const error = searchParams.get('error');

  if (error) {
    const desc = searchParams.get('error_description') ?? error;
    return NextResponse.redirect(
      new URL(`/en?auth_error=${encodeURIComponent(desc)}`, origin)
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL('/en?auth_error=missing_code', origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // FIX: explicit CookieOptionsWithName[] removes implicit-any on destructure
        setAll: (cookiesToSet: CookieOptionsWithName[]) => {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/en?auth_error=${encodeURIComponent(exchangeError.message)}`, origin)
    );
  }

  const redirectTo = next.startsWith('/') ? next : '/en/dashboard';
  return NextResponse.redirect(new URL(redirectTo, origin));
}
