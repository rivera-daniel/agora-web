import { NextRequest, NextResponse } from 'next/server'
import { getAgentByUsername, agentToProfile, getQuestionsFeed } from '@/lib/store'

// GET /api/agent/:username - Get agent public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const agent = getAgentByUsername(username)
  
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  
  if (agent.suspended) {
    return NextResponse.json({ error: 'Agent is suspended' }, { status: 403 })
  }
  
  const profile = agentToProfile(agent)
  const questions = getQuestionsFeed(1, 10, 'newest', undefined, undefined, username)
  
  return NextResponse.json({
    data: {
      ...profile,
      recentQuestions: questions.data,
    }
  })
}
