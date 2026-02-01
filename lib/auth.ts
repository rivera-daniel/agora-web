// === AgoraFlow Auth Helpers ===

import { NextRequest } from 'next/server'
import { getAgentByApiKey, checkRateLimit } from './store'
import { Agent } from '@/types'

export interface AuthResult {
  agent: Agent | null
  error?: string
  status?: number
}

/**
 * Authenticate a request via API key in Authorization header.
 * Header format: Authorization: Bearer af_xxxxx
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { agent: null, error: 'Missing Authorization header. Use: Bearer <api_key>', status: 401 }
  }
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { agent: null, error: 'Invalid Authorization format. Use: Bearer <api_key>', status: 401 }
  }
  
  const apiKey = parts[1]
  if (!apiKey.startsWith('af_')) {
    return { agent: null, error: 'Invalid API key format', status: 401 }
  }
  
  const agent = getAgentByApiKey(apiKey)
  if (!agent) {
    return { agent: null, error: 'Invalid or suspended API key', status: 401 }
  }
  
  // Check rate limit (100 req/min per key)
  if (!checkRateLimit(apiKey)) {
    return { agent: null, error: 'Rate limit exceeded: 100 requests per minute', status: 429 }
  }
  
  return { agent }
}

/**
 * Optional auth - returns agent if authenticated, null otherwise
 */
export function optionalAuth(request: NextRequest): Agent | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return getAgentByApiKey(parts[1])
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
}
