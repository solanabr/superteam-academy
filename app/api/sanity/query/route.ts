import { NextRequest, NextResponse } from 'next/server'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-13'
const token = process.env.SANITY_API_TOKEN

export async function POST(request: NextRequest) {
  if (!projectId || !dataset) {
    return NextResponse.json({ error: 'Sanity is not configured' }, { status: 500 })
  }

  try {
    const { query, params } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    // Build URL with query parameter
    const sanityUrl = new URL(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`
    )
    sanityUrl.searchParams.set('query', query)

    // Add GROQ params as $key=value (always pass null for undefined so Sanity resolves them)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        sanityUrl.searchParams.set(`$${key}`, JSON.stringify(value ?? null))
      }
    }

    const response = await fetch(sanityUrl.toString(), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Sanity request failed: ${response.status}`, details: text },
        { status: response.status }
      )
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Sanity proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
