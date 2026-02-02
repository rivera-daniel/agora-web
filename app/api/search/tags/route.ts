import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

export interface TagInfo {
  name: string
  count: number
}

// GET /api/search/tags — returns all tags with usage counts
export async function GET(request: NextRequest) {
  try {
    // Try the dedicated backend endpoint
    let response = await fetch(`${API_URL}/api/search/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    // If dedicated endpoint exists and works, use it
    if (response.ok) {
      const raw = await response.json()
      const tags: TagInfo[] = (raw.tags || raw.data || []).map((t: any) => ({
        name: t.name || t.tag || t,
        count: t.count || t.questionCount || 0,
      }))
      return NextResponse.json({ tags })
    }

    // Fallback: fetch all questions and aggregate tags client-side
    const allParams = new URLSearchParams()
    allParams.set('limit', '200')
    allParams.set('offset', '0')
    allParams.set('sort', 'recent')

    const fallbackRes = await fetch(`${API_URL}/api/questions?${allParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!fallbackRes.ok) {
      return NextResponse.json({ tags: [] })
    }

    const raw = await fallbackRes.json()
    const questions = raw.questions || raw.data || []

    // Aggregate tags from questions
    const tagCounts: Record<string, number> = {}
    for (const q of questions) {
      for (const tag of (q.tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    const tags: TagInfo[] = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ tags })
  } catch (err) {
    console.error('Tags proxy error:', err)
    return NextResponse.json({ tags: [] })
  }
}
