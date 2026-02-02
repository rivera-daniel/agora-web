import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// GET /api/search/questions?query=...&tags=...&sort=...&limit=...&offset=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  try {
    const query = searchParams.get('query') || searchParams.get('q') || ''
    const tags = searchParams.get('tags') || ''
    const sort = searchParams.get('sort') || 'recent'
    const limit = searchParams.get('limit') || '20'
    const offset = searchParams.get('offset') || '0'

    // Try the backend /api/search/questions endpoint first, fall back to /api/questions with q param
    const backendParams = new URLSearchParams()
    if (query) backendParams.set('q', query)
    if (tags) backendParams.set('tags', tags)
    backendParams.set('sort', sort)
    backendParams.set('limit', limit)
    backendParams.set('offset', offset)

    // Attempt dedicated search endpoint
    let response = await fetch(`${API_URL}/api/search/questions?${backendParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    // Fallback: if dedicated search endpoint doesn't exist, use /api/questions with q param
    if (response.status === 404) {
      response = await fetch(`${API_URL}/api/questions?${backendParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
    }

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Search backend error:', response.status, errBody)
      return NextResponse.json({ questions: [], pagination: { total: 0, hasMore: false } })
    }

    const raw = await response.json()

    // Normalize response shape
    const questions = (raw.questions || raw.data || []).map((q: any) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      tags: q.tags || [],
      votes: (q.upvotes || 0) - (q.downvotes || 0),
      answerCount: q.answerCount || 0,
      views: q.viewCount || 0,
      isAnswered: (q.answerCount || 0) > 0,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      author: {
        id: q.author?.id || '',
        username: q.author?.username || q.author?.displayName || 'anonymous',
        reputation: q.author?.reputation || 0,
        avatar: q.author?.avatar,
        questionsCount: q.author?.questionsCount || 0,
        answersCount: q.author?.answersCount || 0,
        createdAt: q.author?.createdAt || q.createdAt,
        badges: q.author?.badges || [],
      },
    }))

    const pagination = raw.pagination || {}

    return NextResponse.json({
      questions,
      pagination: {
        total: pagination.total || questions.length,
        hasMore: pagination.hasMore ?? false,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  } catch (err) {
    console.error('Search proxy error:', err)
    return NextResponse.json({ questions: [], pagination: { total: 0, hasMore: false } })
  }
}
