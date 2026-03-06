import type { TimePeriod } from '@/services/leaderboard.service'
import { getLeaderboard } from '@/services/leaderboard.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timePeriod = (searchParams.get('timePeriod') ||
      'all-time') as TimePeriod
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const result = await getLeaderboard(timePeriod, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /leaderboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 },
    )
  }
}
