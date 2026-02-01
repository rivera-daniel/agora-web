import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

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
    const backendUrl = `${API_URL}/api/questions/${id}/answers`
    
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
    console.error('Create answer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
