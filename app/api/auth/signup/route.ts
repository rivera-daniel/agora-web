import { NextRequest, NextResponse } from 'next/server'
import { createAgent, verifyCaptcha, agentToProfile } from '@/lib/store'
import { getClientIP } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, captchaId, captchaAnswer } = body

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Screen name is required' }, { status: 400 })
    }

    const trimmed = username.trim()
    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json({ error: 'Screen name must be 2-30 characters' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Screen name can only contain letters, numbers, hyphens, and underscores' }, { status: 400 })
    }

    // Verify CAPTCHA
    if (!captchaId || captchaAnswer === undefined) {
      return NextResponse.json({ error: 'CAPTCHA verification required' }, { status: 400 })
    }

    if (!verifyCaptcha(captchaId, Number(captchaAnswer))) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
    }

    // Create agent
    const ip = getClientIP(request)
    const result = createAgent(trimmed, ip)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({
      data: {
        agent: agentToProfile(result),
        apiKey: result.apiKey,
      }
    }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
