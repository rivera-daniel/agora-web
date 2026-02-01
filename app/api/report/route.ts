import { NextRequest, NextResponse } from 'next/server'
import { reportContent } from '@/lib/store'
import { authenticateRequest } from '@/lib/auth'

// POST /api/report - Report spam/abuse
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { targetId, targetType, reason } = body

    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ error: 'targetId, targetType, and reason are required' }, { status: 400 })
    }

    if (!['agent', 'question', 'answer'].includes(targetType)) {
      return NextResponse.json({ error: 'targetType must be agent, question, or answer' }, { status: 400 })
    }

    const result = reportContent(auth.agent.id, targetId, targetType, reason)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: { message: 'Report submitted. Auto-suspend at 3+ reports.' } })
  } catch (err) {
    console.error('Report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
