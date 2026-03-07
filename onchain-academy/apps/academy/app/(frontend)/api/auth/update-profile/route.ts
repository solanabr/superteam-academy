import { auth } from '@/libs/auth'
import { getPostHogClient } from '@/libs/posthog-server'
import { getPayloadClient } from '@/libs/payload'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/** Twitter-style username: starts with letter, 3-30 chars, lowercase letters/numbers/underscores */
const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,29}$/

function validateUsername(
  username: string,
): { valid: true } | { valid: false; error: string } {
  if (!username) return { valid: false, error: 'Username is required' }

  const cleaned = username.trim().toLowerCase()

  console.log('update profile received', username)

  if (cleaned.length < 3)
    return { valid: false, error: 'Username must be at least 3 characters' }
  if (cleaned.length > 30)
    return { valid: false, error: 'Username must be 30 characters or less' }
  if (/^\d/.test(cleaned))
    return { valid: false, error: 'Username cannot start with a number' }
  if (/\s/.test(cleaned))
    return { valid: false, error: 'Username cannot contain spaces' }
  if (/-/.test(cleaned))
    return {
      valid: false,
      error: 'Username cannot contain dashes, use underscores instead',
    }
  if (!USERNAME_REGEX.test(cleaned))
    return {
      valid: false,
      error:
        'Username can only contain lowercase letters, numbers, and underscores',
    }

  return { valid: true }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
    })

    if (!session?.user) {
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

    // Validate username if provided
    if (username) {
      const cleaned = username.trim().toLowerCase()
      const validation = validateUsername(cleaned)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // Check uniqueness in Payload CMS
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'users',
        where: { username: { equals: cleaned } },
        limit: 1,
      })

      // If found and it's not the current user, it's taken
      if (docs.length > 0 && docs[0].betterAuthId !== session.user.id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 },
        )
      }
    }

    // Update user via Better Auth internal adapter
    const ctx = await auth.$context
    await ctx.internalAdapter.updateUser(session.user.id, {
      name: name || session.user.name,
      ...(username && { username: username.trim().toLowerCase() }),
      ...(bio !== undefined && { bio }),
      ...(twitter !== undefined && { twitter }),
      ...(github !== undefined && { github }),
      ...(linkedin !== undefined && { linkedin }),
      ...(telegram !== undefined && { telegram }),
      ...(walletAddress && { walletAddress }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
    })

    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: session.user.id,
      event: 'profile_updated',
      properties: {
        has_username: !!username,
        has_wallet: !!walletAddress,
        onboarding_complete: !!onboardingComplete,
      },
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
