import type { 
  Question, 
  Answer, 
  User, 
  Vote, 
  ApiResponse, 
  PaginatedResponse,
  SearchFilters 
} from '@/types'

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper function to build query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
}

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  
  return response.json()
}

// Question APIs
export const questionApi = {
  async list(filters?: SearchFilters): Promise<PaginatedResponse<Question>> {
    const params: Record<string, any> = {}
    if (filters?.query) params.q = filters.query
    if (filters?.tags?.length) params.tags = filters.tags.join(',')
    if (filters?.author) params.author = filters.author
    if (filters?.sortBy) params.sort = filters.sortBy
    if (filters?.page) params.page = filters.page
    if (filters?.pageSize) params.pageSize = filters.pageSize
    
    const queryString = buildQueryString(params)
    return apiRequest<PaginatedResponse<Question>>(`/questions?${queryString}`)
  },

  async get(id: string): Promise<Question> {
    const response = await apiRequest<ApiResponse<Question>>(`/questions/${id}`)
    return response.data
  },

  async create(data: {
    title: string
    body: string
    tags: string[]
  }): Promise<Question> {
    const response = await apiRequest<ApiResponse<Question>>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data
  },

  async update(id: string, data: Partial<{
    title: string
    body: string
    tags: string[]
  }>): Promise<Question> {
    const response = await apiRequest<ApiResponse<Question>>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/questions/${id}`, {
      method: 'DELETE',
    })
  },

  async vote(id: string, value: 'up' | 'down' | null): Promise<Vote> {
    const response = await apiRequest<ApiResponse<Vote>>(`/questions/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    })
    return response.data
  },
}

// Answer APIs
export const answerApi = {
  async list(questionId: string): Promise<Answer[]> {
    const response = await apiRequest<ApiResponse<Answer[]>>(`/questions/${questionId}/answers`)
    return response.data
  },

  async create(questionId: string, body: string): Promise<Answer> {
    const response = await apiRequest<ApiResponse<Answer>>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    })
    return response.data
  },

  async update(id: string, body: string): Promise<Answer> {
    const response = await apiRequest<ApiResponse<Answer>>(`/answers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ body }),
    })
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/answers/${id}`, {
      method: 'DELETE',
    })
  },

  async vote(id: string, value: 'up' | 'down' | null): Promise<Vote> {
    const response = await apiRequest<ApiResponse<Vote>>(`/answers/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    })
    return response.data
  },

  async accept(id: string): Promise<Answer> {
    const response = await apiRequest<ApiResponse<Answer>>(`/answers/${id}/accept`, {
      method: 'POST',
    })
    return response.data
  },
}

// User APIs
export const userApi = {
  async get(id: string): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>(`/users/${id}`)
    return response.data
  },

  async getByUsername(username: string): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>(`/users/username/${username}`)
    return response.data
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiRequest<ApiResponse<User>>('/users/me')
      return response.data
    } catch {
      return null
    }
  },

  async updateProfile(data: Partial<{
    displayName: string
    bio: string
    avatar: string
  }>): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data
  },
}

// Search API
export const searchApi = {
  async search(query: string, filters?: Omit<SearchFilters, 'query'>): Promise<PaginatedResponse<Question>> {
    return questionApi.list({ ...filters, query })
  },
}

export default apiRequest