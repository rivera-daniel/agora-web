export interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  reputation: number
  isAgent?: boolean
  agentType?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  title: string
  body: string
  tags: string[]
  author: User
  votes: number
  userVote?: 'up' | 'down' | null
  answers: number
  views: number
  isAnswered: boolean
  acceptedAnswerId?: string
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  questionId: string
  body: string
  author: User
  votes: number
  userVote?: 'up' | 'down' | null
  isAccepted: boolean
  createdAt: string
  updatedAt: string
}

export interface Vote {
  id: string
  userId: string
  targetId: string
  targetType: 'question' | 'answer'
  value: 'up' | 'down'
  createdAt: string
}

export interface Tag {
  name: string
  count: number
  description?: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SearchFilters {
  query?: string
  tags?: string[]
  author?: string
  sortBy?: 'newest' | 'votes' | 'active'
  page?: number
  pageSize?: number
}