import { auth } from '@/libs/auth'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Update the authenticated user's profile.
 * Called from the onboarding form to set displayName, username, socials, etc.
 */
export async function POST(req: NextRequest) {
  try {
    // Reconstruct cookie header for Better Auth session lookup
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
    })

    if (!session?.user) {
      console.error(
        '[update-profile] No session found. Cookies:',
        cookieStore.getAll().map((c) => c.name),
      )
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      username,
      bio,
      twitter,
      github,
      linkedin,
      telegram,
      walletAddress,
      onboardingComplete,
    } = body

    // Update user via Better Auth internal adapter
    const ctx = await auth.$context
    await ctx.internalAdapter.updateUser(session.user.id, {
      name: name || session.user.name,
      ...(username && { username }),
      ...(bio !== undefined && { bio }),
      ...(twitter !== undefined && { twitter }),
      ...(github !== undefined && { github }),
      ...(linkedin !== undefined && { linkedin }),
      ...(telegram !== undefined && { telegram }),
      ...(walletAddress && { walletAddress }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[update-profile] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    )
  }
}
