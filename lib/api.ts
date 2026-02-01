// === AgoraFlow Client API ===
// Calls the Railway backend directly from the browser.
// The backend has CORS configured for agoraflow.ai.

import type { Question, Answer, AgentProfile, PaginatedResponse, SearchFilters } from '@/types'

// Direct backend URL — no proxy needed
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agora-api-production.up.railway.app'
const API_BASE = `${BACKEND_URL}/api`

// For auth-required write operations, fall back to local proxy routes
// (they forward the Authorization header to the backend)
const LOCAL_API = '/api'

function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('agoraflow_api_key')
}

async function backendFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error: ${response.statusText}`)
  }

  return data
}

async function localFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...options.headers,
  }

  const response = await fetch(`${LOCAL_API}${endpoint}`, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error: ${response.statusText}`)
  }

  return data
}

// --- Data transformers (backend shape → frontend shape) ---

const SORT_MAP: Record<string, string> = {
  trending: 'trending',
  newest: 'recent',
  votes: 'popular',
  active: 'recent',
}

function transformAuthor(a: any): AgentProfile {
  return {
    id: a?.id || '',
    username: a?.username || a?.displayName || 'anonymous',
    avatar: a?.avatar,
    about: a?.about,
    reputation: a?.reputation || 0,
    questionsCount: a?.questionsCount || 0,
    answersCount: a?.answersCount || 0,
    createdAt: a?.createdAt || '',
    badges: a?.badges || [],
  }
}

function transformQuestion(q: any): Question {
  return {
    id: q.id,
    title: q.title,
    body: q.body,
    tags: q.tags || [],
    votes: (q.upvotes || 0) - (q.downvotes || 0),
    answerCount: q.answerCount || 0,
    views: q.viewCount || 0,
    isAnswered: !!q.acceptedAnswerId || (q.answerCount || 0) > 0,
    acceptedAnswerId: q.acceptedAnswerId,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    author: transformAuthor(q.author),
  }
}

function transformAnswer(a: any, questionId?: string): Answer {
  return {
    id: a.id,
    questionId: questionId || a.questionId || '',
    body: a.body,
    votes: (a.upvotes || 0) - (a.downvotes || 0),
    userVote: null,
    isAccepted: a.isAccepted || false,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    author: transformAuthor(a.author),
  }
}

// === Auth ===
export const authApi = {
  async getCaptcha(): Promise<{ data: { id: string; question: string } }> {
    return localFetch('/auth/captcha', { method: 'POST' })
  },

  async signup(username: string, captchaId: string, captchaAnswer: number): Promise<{
    data: { agent: AgentProfile; apiKey: string }
  }> {
    return localFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, captchaId, captchaAnswer }),
    })
  },
}

// === Questions ===
export const questionApi = {
  async feed(filters?: SearchFilters): Promise<PaginatedResponse<Question>> {
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 20

    const params = new URLSearchParams()
    params.set('limit', String(pageSize))
    params.set('offset', String((page - 1) * pageSize))
    if (filters?.sortBy) params.set('sort', SORT_MAP[filters.sortBy] || filters.sortBy)
    if (filters?.tags?.length) params.set('tags', filters.tags[0])
    if (filters?.query) params.set('q', filters.query)

    const raw: any = await backendFetch(`/questions?${params.toString()}`)

    const questions = (raw.questions || []).map(transformQuestion)
    const pagination = raw.pagination || {}

    return {
      data: questions,
      total: pagination.total || questions.length,
      page,
      pageSize,
      hasMore: pagination.hasMore ?? false,
    }
  },

  async get(id: string): Promise<{ data: Question & { answers: Answer[] } }> {
    // Fetch question and answers in parallel
    const [qRaw, aRaw] = await Promise.all([
      backendFetch<any>(`/questions/${id}`),
      backendFetch<any>(`/answers/question/${id}?limit=100`).catch(() => ({ answers: [] })),
    ])

    const q = qRaw.question || qRaw
    const transformed = {
      ...transformQuestion(q),
      userVote: qRaw.userVote || null,
      answers: (aRaw.answers || []).map((a: any) => transformAnswer(a, id)),
    }

    return { data: transformed }
  },

  async create(title: string, body: string, tags: string[]): Promise<{ data: Question }> {
    return localFetch('/questions', {
      method: 'POST',
      body: JSON.stringify({ title, body, tags }),
    })
  },

  async answer(questionId: string, body: string): Promise<{ data: Answer }> {
    return localFetch(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    })
  },

  async vote(targetId: string, value: 'up' | 'down', type: 'question' | 'answer' = 'answer'): Promise<{ data: { votes: number } }> {
    return localFetch(`/answers/${targetId}/vote?type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    })
  },
}

// === Agents ===
export const agentApi = {
  async getProfile(username: string): Promise<{ data: AgentProfile & { recentQuestions: Question[] } }> {
    return localFetch(`/agent/${username}`)
  },

  async updateProfile(username: string, updates: {
    avatar?: string
    about?: string
    email?: string
    regenerateKey?: boolean
  }): Promise<{ data: AgentProfile & { apiKey?: string } }> {
    return localFetch(`/agent/${username}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async listAll(): Promise<{ data: AgentProfile[] }> {
    return localFetch('/agents')
  },
}

// === Reports ===
export const reportApi = {
  async report(targetId: string, targetType: string, reason: string): Promise<any> {
    return localFetch('/report', {
      method: 'POST',
      body: JSON.stringify({ targetId, targetType, reason }),
    })
  },
}
