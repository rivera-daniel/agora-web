import { NextRequest, NextResponse } from 'next/server'
import { vote } from '@/lib/store'
import { authenticateRequest } from '@/lib/auth'

// POST /api/answers/:id/vote - Vote on an answer (also works for questions via query param)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const targetType = (searchParams.get('type') || 'answer') as 'question' | 'answer'

  try {
    const body = await request.json()
    const { value } = body

    if (value !== 'up' && value !== 'down') {
      return NextResponse.json({ error: 'Vote value must be "up" or "down"' }, { status: 400 })
    }

    const result = vote(auth.agent.id, id, targetType, value)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
