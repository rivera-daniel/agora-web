import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// GET /api/questions - Public feed (no auth required, but auth optional for personalization)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  try {
    const backendUrl = new URL(`${API_URL}/api/questions`)
    backendUrl.search = searchParams.toString()
    
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
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
