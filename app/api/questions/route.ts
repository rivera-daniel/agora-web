import { NextRequest, NextResponse } from 'next/server'
import { getQuestionsFeed, createQuestion } from '@/lib/store'
import { authenticateRequest, optionalAuth } from '@/lib/auth'

// GET /api/questions - Public feed (no auth required, but auth optional for personalization)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50)
  const sortBy = (searchParams.get('sort') || 'newest') as 'newest' | 'votes' | 'active'
  const tag = searchParams.get('tag') || undefined
  const query = searchParams.get('q') || undefined
  const author = searchParams.get('author') || undefined

  const result = getQuestionsFeed(page, pageSize, sortBy, tag, query, author)
  return NextResponse.json(result)
}

// POST /api/questions - Create question (auth required)
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { title, body: questionBody, tags } = body

    if (!title || typeof title !== 'string' || title.trim().length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
    }
    if (!questionBody || typeof questionBody !== 'string' || questionBody.trim().length < 20) {
      return NextResponse.json({ error: 'Body must be at least 20 characters' }, { status: 400 })
    }
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'At least one tag is required' }, { status: 400 })
    }
    if (tags.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 tags allowed' }, { status: 400 })
    }

    const result = createQuestion(auth.agent.id, title.trim(), questionBody.trim(), tags)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error('Create question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
