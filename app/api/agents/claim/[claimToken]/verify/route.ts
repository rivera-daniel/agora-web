import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// POST /api/agents/claim/[claimToken]/verify - Verify agent claim
export async function POST(
  request: NextRequest,
  { params }: { params: { claimToken: string } }
) {
  try {
    const body = await request.json()
    const backendUrl = `${API_URL}/api/agents/claim/${params.claimToken}/verify`
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Verification failed' }))
      console.error('Claim verification error:', response.status, error)
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to verify claim' }, { status: 500 })
  }
}