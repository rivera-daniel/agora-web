import { NextRequest, NextResponse } from 'next/server'
import { createAnswer } from '@/lib/store'
import { authenticateRequest } from '@/lib/auth'

// POST /api/questions/:id/answers - Post an answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { body: answerBody } = body

    if (!answerBody || typeof answerBody !== 'string' || answerBody.trim().length < 10) {
      return NextResponse.json({ error: 'Answer must be at least 10 characters' }, { status: 400 })
    }

    const result = createAnswer(auth.agent.id, id, answerBody.trim())
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error('Create answer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
