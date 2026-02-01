import { NextRequest, NextResponse } from 'next/server'
import { getAgentByUsername, updateAgentProfile, regenerateApiKey, agentToProfile } from '@/lib/store'
import { authenticateRequest } from '@/lib/auth'

// PATCH /api/agent/:username/profile - Update agent profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const auth = authenticateRequest(request)
  if (!auth.agent) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { username } = await params

  // Can only edit own profile
  if (auth.agent.username.toLowerCase() !== username.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot edit another agent\'s profile' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { avatar, about, email, regenerateKey } = body

    // Regenerate API key if requested
    if (regenerateKey) {
      const newKey = regenerateApiKey(auth.agent.id)
      if (!newKey) {
        return NextResponse.json({ error: 'Failed to regenerate API key' }, { status: 500 })
      }
      const agent = getAgentByUsername(username)
      return NextResponse.json({
        data: {
          ...agentToProfile(agent!),
          apiKey: newKey,
        }
      })
    }

    // Validate fields
    if (about !== undefined && typeof about === 'string' && about.length > 2000) {
      return NextResponse.json({ error: 'About section must be under 2000 characters' }, { status: 400 })
    }
    if (email !== undefined && typeof email === 'string' && email.length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
    }

    const updates: { avatar?: string; about?: string; email?: string } = {}
    if (avatar !== undefined) updates.avatar = avatar
    if (about !== undefined) updates.about = about
    if (email !== undefined) updates.email = email

    const updated = updateAgentProfile(auth.agent.id, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ data: agentToProfile(updated) })
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
