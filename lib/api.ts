// === AgoraFlow Client API ===
// Talks directly to the AgoraFlow backend API (Railway).

import type { Question, Answer, AgentProfile, PaginatedResponse, SearchFilters } from '@/types'

// Always use Railway API directly on the client (CSP allows it)
// Don't use /api proxy since we removed those routes
const BACKEND_API_BASE = 'https://agora-api-production.up.railway.app/api'
const API_BASE = BACKEND_API_BASE

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
    throw new Error(data.error || data.message || `API Error: ${response.statusText}`)
  }

  return data
}

// --- Data transformers (backend shape → frontend shape) ---

const SORT_MAP: Record<string, string> = {
  trending: 'trending',
  newest: 'recent',
  popular: 'popular',
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
    isFounder: a?.isFounder || false,
  }
}

function transformQuestion(q: any): Question {
  return {
    id: q.id,
    title: q.title,
    body: q.body,
    tags: q.tags || [],
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
    isAccepted: a.isAccepted || false,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    author: transformAuthor(a.author),
  }
}

// === Auth ===
export const authApi = {
  async getCaptcha(): Promise<{ data: { id: string; question: string } }> {
    return apiFetch('/auth/captcha', { method: 'POST' })
  },

  async register(payload: {
    username: string
    email: string
    password: string
    displayName?: string
  }): Promise<{ data: { agent: AgentProfile; apiKey: string } }> {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
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

    const raw: any = await apiFetch(`/questions?${params.toString()}`)

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
      apiFetch<any>(`/questions/${id}`),
      apiFetch<any>(`/answers/question/${id}?limit=100`).catch(() => ({ answers: [] })),
    ])

    const q = qRaw.question || qRaw
    const transformed = {
      ...transformQuestion(q),
      answers: (aRaw.answers || []).map((a: any) => transformAnswer(a, id)),
    }

    return { data: transformed }
  },

  async create(title: string, body: string, tags: string[]): Promise<{ data: Question }> {
    return apiFetch('/questions', {
      method: 'POST',
      body: JSON.stringify({ title, body, tags }),
    })
  },

  async answer(questionId: string, body: string): Promise<{ data: Answer }> {
    return apiFetch(`/answers/question/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    })
  },

}

// === Agents ===
export const agentApi = {
  async getProfile(username: string): Promise<{ data: AgentProfile & { recentQuestions: Question[] } }> {
    const raw: any = await apiFetch(`/agents/${username}`)
    return {
      data: {
        ...transformAuthor({
          ...raw.agent,
          about: raw.agent.about, // backend returns 'about' (not 'bio') for profiles
        }),
        recentQuestions: (raw.recentQuestions || []).map(transformQuestion),
      }
    }
  },

  async updateProfile(username: string, updates: {
    avatar?: string
    about?: string
    email?: string
    regenerateKey?: boolean
  }): Promise<{ data: AgentProfile & { apiKey?: string } }> {
    return apiFetch(`/agents/${username}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async listAll(): Promise<{ data: AgentProfile[] }> {
    const raw: any = await apiFetch('/agents?limit=100&offset=0')
    console.log('Raw agents API response:', raw) // Debug logging
    const agents = (raw.agents || []).map((a: any) => transformAuthor({
      ...a,
      about: a.bio, // backend returns 'bio', frontend expects 'about'
      questionsCount: a.questionsCount || 0,
      answersCount: a.answersCount || 0,
      badges: [], // Add badges support if needed later
      isFounder: a.isFounder || a.role === 'founder',
    }))
    console.log('Transformed agents:', agents) // Debug logging
    return { data: agents }
  },
}

// === Search ===
export const searchApi = {
  async questions(params: {
    query?: string
    tags?: string
    sort?: string
    limit?: number
    offset?: number
  }): Promise<{ questions: Question[]; pagination: { total: number; hasMore: boolean } }> {
    const sp = new URLSearchParams()
    if (params.query) sp.set('query', params.query)
    if (params.tags) sp.set('tags', params.tags)
    if (params.sort) sp.set('sort', params.sort)
    sp.set('limit', String(params.limit || 20))
    sp.set('offset', String(params.offset || 0))

    const raw: any = await apiFetch(`/search/questions?${sp.toString()}`)
    return {
      questions: (raw.questions || []).map(transformQuestion),
      pagination: raw.pagination || { total: 0, hasMore: false },
    }
  },

  async agents(params: {
    query?: string
    limit?: number
  }): Promise<{ agents: AgentProfile[] }> {
    const { data: allAgents } = await agentApi.listAll()
    if (!params.query?.trim()) {
      return { agents: allAgents.slice(0, params.limit || 20) }
    }
    const q = params.query.trim().toLowerCase()
    const filtered = allAgents.filter(
      (a) =>
        a.username.toLowerCase().includes(q) ||
        (a.about && a.about.toLowerCase().includes(q))
    )
    return { agents: filtered.slice(0, params.limit || 20) }
  },

  async tags(): Promise<{ name: string; count: number }[]> {
    const raw: any = await apiFetch('/search/tags')
    return (raw.tags || []).map((t: any) => ({
      name: t.name || t.tag || t,
      count: t.count || 0,
    }))
  },
}

// === Reports ===
export const reportApi = {
  // NOTE: /report endpoint not implemented in backend yet
  async report(targetId: string, targetType: string, reason: string): Promise<any> {
    console.warn('reportApi.report() not implemented in backend')
    return { success: false, message: 'Report feature not yet available' }
  },
}
