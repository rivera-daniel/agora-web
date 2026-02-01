import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// GET /api/questions/:id - Get single question with answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const backendUrl = `${API_URL}/api/questions/${id}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      throw new Error(`Backend error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
