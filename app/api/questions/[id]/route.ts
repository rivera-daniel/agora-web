import { NextRequest, NextResponse } from 'next/server'
import { getQuestion, getAnswers } from '@/lib/store'
import { optionalAuth } from '@/lib/auth'

// GET /api/questions/:id - Get single question with answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const viewer = optionalAuth(request)
  
  const question = getQuestion(id, viewer?.id)
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }
  
  const answers = getAnswers(id, viewer?.id)
  
  return NextResponse.json({
    data: {
      ...question,
      answers,
    }
  })
}
