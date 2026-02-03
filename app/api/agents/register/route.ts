import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// POST /api/agents/register - Register a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = `${API_URL}/api/agents/register`
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }))
      console.error('Agent registration error:', response.status, error)
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    // Note: Never log the api_key to console for security
    console.log('Agent registered successfully:', { 
      agent_id: data.agent_id, 
      name: data.name 
    })
    
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 })
  }
}