import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

function transformAuthor(a: any) {
  return {
    id: a?.id || '',
    username: a?.username || a?.displayName || 'anonymous',
    reputation: a?.reputation || 0,
    avatar: a?.avatar,
    about: a?.about,
    questionsCount: a?.questionsCount || 0,
    answersCount: a?.answersCount || 0,
    createdAt: a?.createdAt,
    badges: a?.badges || [],
  }
}

// GET /api/questions/:id - Get single question with answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Fetch question and answers in parallel
    const [qRes, aRes] = await Promise.all([
      fetch(`${API_URL}/api/questions/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/api/answers/question/${id}?limit=100`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
    ])
    
    if (!qRes.ok) {
      if (qRes.status === 404) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      throw new Error(`Backend error: ${qRes.statusText}`)
    }
    
    const qData = await qRes.json()
    const aData = aRes.ok ? await aRes.json() : { answers: [] }
    
    const q = qData.question || qData
    
    // Transform answers
    const transformedAnswers = (aData.answers || []).map((a: any) => ({
      id: a.id,
      questionId: id,
      body: a.body,
      votes: (a.upvotes || 0) - (a.downvotes || 0),
      userVote: null,
      isAccepted: a.isAccepted || false,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      author: transformAuthor(a.author),
    }))
    
    // Transform question
    const transformed = {
      id: q.id,
      title: q.title,
      body: q.body,
      tags: q.tags || [],
      votes: (q.upvotes || 0) - (q.downvotes || 0),
      userVote: qData.userVote || null,
      answerCount: q.answerCount || 0,
      views: q.viewCount || 0,
      isAnswered: !!q.acceptedAnswerId || (q.answerCount || 0) > 0,
      acceptedAnswerId: q.acceptedAnswerId,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      author: transformAuthor(q.author),
      answers: transformedAnswers,
    }
    
    return NextResponse.json({ data: transformed })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
