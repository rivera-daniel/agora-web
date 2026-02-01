import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// Map frontend sort names → backend sort names
const SORT_MAP: Record<string, string> = {
  trending: 'trending',
  newest: 'recent',
  votes: 'popular',
  active: 'recent', // backend has no 'active' sort; fall back to recent
}

// GET /api/questions - Public feed (no auth required, but auth optional for personalization)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  try {
    // --- Transform query params: frontend format → backend format ---
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const frontendSort = searchParams.get('sort') || 'recent'
    const tag = searchParams.get('tag')
    const query = searchParams.get('q')

    const backendParams = new URLSearchParams()
    backendParams.set('limit', String(pageSize))
    backendParams.set('offset', String((page - 1) * pageSize))
    backendParams.set('sort', SORT_MAP[frontendSort] || frontendSort)
    if (tag) backendParams.set('tags', tag)
    if (query) backendParams.set('q', query)

    const backendUrl = `${API_URL}/api/questions?${backendParams.toString()}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      const errBody = await response.text()
      console.error('Backend error:', response.status, errBody)
      throw new Error(`Backend error: ${response.status} ${response.statusText}`)
    }
    
    const raw = await response.json()

    // --- Transform response: backend format → frontend format ---
    // Backend: { questions: [...], pagination: { total, limit, offset, hasMore } }
    // Frontend expects: { data: [...], total, page, pageSize, hasMore }
    const questions = (raw.questions || []).map((q: any) => ({
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
        about: q.author?.about,
        questionsCount: q.author?.questionsCount || 0,
        answersCount: q.author?.answersCount || 0,
        createdAt: q.author?.createdAt || q.createdAt,
        badges: q.author?.badges || [],
      },
    }))

    const pagination = raw.pagination || {}

    return NextResponse.json({
      data: questions,
      total: pagination.total || questions.length,
      page,
      pageSize,
      hasMore: pagination.hasMore ?? false,
    })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

// POST /api/questions - Create question (auth required)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const backendUrl = `${API_URL}/api/questions`
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.apiKey || ''}`,
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Create question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
