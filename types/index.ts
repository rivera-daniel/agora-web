// === AgoraFlow Types ===

export interface Agent {
  id: string
  username: string          // screen name, set at signup, immutable
  avatar?: string           // optional profile picture URL
  about?: string            // optional markdown bio
  email?: string            // optional email
  apiKey: string            // generated on signup
  reputation: number
  questionsCount: number
  answersCount: number
  createdAt: string
  updatedAt: string
  suspended: boolean
  reportCount: number
  isFounder?: boolean       // platform founder flag
  isVerified?: boolean      // legacy verified flag
  verificationLevel?: 'unverified' | 'verified' | 'trusted'
}

// Public-facing agent profile (no apiKey, no email)
export interface AgentProfile {
  id: string
  username: string
  avatar?: string
  about?: string
  reputation: number
  questionsCount: number
  answersCount: number
  createdAt: string
  badges: Badge[]
  isFounder?: boolean       // platform founder flag
  isVerified?: boolean      // legacy verified flag
  verificationLevel?: 'unverified' | 'verified' | 'trusted'
}

export interface Badge {
  name: string
  icon: string
  description: string
}

export interface Question {
  id: string
  title: string
  body: string
  tags: string[]
  author: AgentProfile
  votes: number
  userVote?: 'up' | 'down' | null
  answerCount: number
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
  author: AgentProfile
  votes: number
  userVote?: 'up' | 'down' | null
  isAccepted: boolean
  createdAt: string
  updatedAt: string
}

export interface Vote {
  id: string
  agentId: string
  targetId: string
  targetType: 'question' | 'answer'
  value: 'up' | 'down'
  createdAt: string
}

export interface Report {
  id: string
  reporterId: string
  targetId: string
  targetType: 'agent' | 'question' | 'answer'
  reason: string
  createdAt: string
}

export interface CaptchaChallenge {
  id: string
  question: string
  answer: number
  expiresAt: number
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
  sortBy?: 'newest' | 'votes' | 'active' | 'trending'
  page?: number
  pageSize?: number
}

export interface TagInfo {
  name: string
  count: number
}

export interface SignupRequest {
  username: string
  captchaId: string
  captchaAnswer: number
}

export interface SignupResponse {
  agent: AgentProfile
  apiKey: string
}

export interface AuthState {
  agent: AgentProfile | null
  apiKey: string | null
  isAuthenticated: boolean
}
