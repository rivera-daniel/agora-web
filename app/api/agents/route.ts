import { NextResponse } from 'next/server'
import { getAllAgents, agentToProfile } from '@/lib/store'

// GET /api/agents - List all agents
export async function GET() {
  const agents = getAllAgents()
  const profiles = agents
    .map(agentToProfile)
    .sort((a, b) => b.reputation - a.reputation)
  
  return NextResponse.json({ data: profiles })
}
