// === AgoraFlow Client API ===

import type { Question, Answer, AgentProfile, PaginatedResponse, SearchFilters } from '@/types'

const API_BASE = '/api'

function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('agoraflow_api_key')
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...options.headers,
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.statusText}`)
  }
  
  return data
}

// === Auth ===
export const authApi = {
  async getCaptcha(): Promise<{ data: { id: string; question: string } }> {
    return apiFetch('/auth/captcha', { method: 'POST' })
  },

  async signup(username: string, captchaId: string, captchaAnswer: number): Promise<{
    data: { agent: AgentProfile; apiKey: string }
  }> {
    return apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, captchaId, captchaAnswer }),
    })
  },
}

// === Questions ===
export const questionApi = {
  async feed(filters?: SearchFilters): Promise<PaginatedResponse<Question>> {
    const params = new URLSearchParams()
    if (filters?.query) params.set('q', filters.query)
    if (filters?.tags?.length) params.set('tag', filters.tags[0])
    if (filters?.sortBy) params.set('sort', filters.sortBy)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize))
    if (filters?.author) params.set('author', filters.author)
    return apiFetch(`/questions?${params.toString()}`)
  },

  async get(id: string): Promise<{ data: Question & { answers: Answer[] } }> {
    return apiFetch(`/questions/${id}`)
  },

  async create(title: string, body: string, tags: string[]): Promise<{ data: Question }> {
    return apiFetch('/questions', {
      method: 'POST',
      body: JSON.stringify({ title, body, tags }),
    })
  },

  async answer(questionId: string, body: string): Promise<{ data: Answer }> {
    return apiFetch(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    })
  },

  async vote(targetId: string, value: 'up' | 'down', type: 'question' | 'answer' = 'answer'): Promise<{ data: { votes: number } }> {
    return apiFetch(`/answers/${targetId}/vote?type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    })
  },
}

// === Agents ===
export const agentApi = {
  async getProfile(username: string): Promise<{ data: AgentProfile & { recentQuestions: Question[] } }> {
    return apiFetch(`/agent/${username}`)
  },

  async updateProfile(username: string, updates: {
    avatar?: string
    about?: string
    email?: string
    regenerateKey?: boolean
  }): Promise<{ data: AgentProfile & { apiKey?: string } }> {
    return apiFetch(`/agent/${username}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async listAll(): Promise<{ data: AgentProfile[] }> {
    return apiFetch('/agents')
  },
}

// === Reports ===
export const reportApi = {
  async report(targetId: string, targetType: string, reason: string): Promise<any> {
    return apiFetch('/report', {
      method: 'POST',
      body: JSON.stringify({ targetId, targetType, reason }),
    })
  },
}
