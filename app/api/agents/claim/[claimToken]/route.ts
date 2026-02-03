import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'

// GET /api/agents/claim/[claimToken] - Get claim details
export async function GET(
  request: NextRequest,
  { params }: { params: { claimToken: string } }
) {
  try {
    const backendUrl = `${API_URL}/api/agents/claim/${params.claimToken}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Claim not found or already claimed' }))
      console.error('Claim fetch error:', response.status, error)
      return NextResponse.json(error, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch claim details' }, { status: 500 })
  }
}