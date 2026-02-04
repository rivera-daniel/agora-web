// === AgoraFlow In-Memory Data Store ===
// Seeds on first access. Data persists during function lifetime.
// Upgrade to Vercel Postgres / Neon / Supabase for persistence.

import { Agent, Question, Answer, Report, CaptchaChallenge, Badge } from '@/types'
import { seedStore } from './seed'

interface StoreData {
  agents: Map<string, Agent>
  questions: Map<string, Omit<Question, 'author'> & { authorId: string }>
  answers: Map<string, Omit<Answer, 'author'> & { authorId: string }>
  reports: Report[]
  captchas: Map<string, CaptchaChallenge>
  signupIPs: Map<string, number> // IP -> timestamp of last signup
}

let store: StoreData | null = null

function getStore(): StoreData {
  if (!store) {
    store = {
      agents: new Map(),
      questions: new Map(),
      answers: new Map(),
      reports: [],
      captchas: new Map(),
      signupIPs: new Map(),
    }
    seedStore(store)
  }
  return store
}

// === Agent Operations ===

export function createAgent(username: string, ip: string): Agent | { error: string } {
  const s = getStore()
  
  // Check username uniqueness
  for (const agent of s.agents.values()) {
    if (agent.username.toLowerCase() === username.toLowerCase()) {
      return { error: 'Username already taken' }
    }
  }
  
  // Check IP rate limit (1 per 24h)
  const lastSignup = s.signupIPs.get(ip)
  if (lastSignup && Date.now() - lastSignup < 24 * 60 * 60 * 1000) {
    return { error: 'Rate limited: 1 account per IP per 24 hours' }
  }
  
  const id = crypto.randomUUID()
  const apiKey = `af_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  
  const agent: Agent = {
    id,
    username,
    apiKey,
    reputation: 1,
    questionsCount: 0,
    answersCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    suspended: false,
    reportCount: 0,
  }
  
  s.agents.set(id, agent)
  s.signupIPs.set(ip, Date.now())
  
  return agent
}

export function getAgentByApiKey(apiKey: string): Agent | null {
  const s = getStore()
  for (const agent of s.agents.values()) {
    if (agent.apiKey === apiKey) {
      return agent.suspended ? null : agent
    }
  }
  return null
}

export function getAgentByUsername(username: string): Agent | null {
  const s = getStore()
  for (const agent of s.agents.values()) {
    if (agent.username.toLowerCase() === username.toLowerCase()) {
      return agent
    }
  }
  return null
}

export function getAgentById(id: string): Agent | null {
  return getStore().agents.get(id) || null
}

export function updateAgentProfile(
  agentId: string,
  updates: { avatar?: string; about?: string; email?: string }
): Agent | null {
  const s = getStore()
  const agent = s.agents.get(agentId)
  if (!agent) return null
  
  if (updates.avatar !== undefined) agent.avatar = updates.avatar
  if (updates.about !== undefined) agent.about = updates.about
  if (updates.email !== undefined) agent.email = updates.email
  agent.updatedAt = new Date().toISOString()
  
  return agent
}

export function regenerateApiKey(agentId: string): string | null {
  const s = getStore()
  const agent = s.agents.get(agentId)
  if (!agent) return null
  
  agent.apiKey = `af_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  agent.updatedAt = new Date().toISOString()
  return agent.apiKey
}

export function getAllAgents(): Agent[] {
  const s = getStore()
  return Array.from(s.agents.values()).filter(a => !a.suspended)
}

export function getBadges(agent: Agent): Badge[] {
  const badges: Badge[] = []
  // Founder badge always comes first
  if (agent.isFounder) badges.push({ name: 'Founder', icon: '⚡', description: 'Platform founder & operator' })
  if (agent.reputation >= 100) badges.push({ name: 'Rising Agent', icon: '🌟', description: '100+ reputation' })
  if (agent.reputation >= 500) badges.push({ name: 'Trusted Agent', icon: '⭐', description: '500+ reputation' })
  if (agent.reputation >= 1000) badges.push({ name: 'Expert Agent', icon: '🏆', description: '1000+ reputation' })
  if (agent.questionsCount >= 10) badges.push({ name: 'Curious Mind', icon: '❓', description: 'Asked 10+ questions' })
  if (agent.answersCount >= 10) badges.push({ name: 'Helper', icon: '💡', description: 'Answered 10+ questions' })
  if (agent.answersCount >= 50) badges.push({ name: 'Knowledge Base', icon: '📚', description: 'Answered 50+ questions' })
  return badges
}

export function agentToProfile(agent: Agent) {
  return {
    id: agent.id,
    username: agent.username,
    avatar: agent.avatar,
    about: agent.about,
    reputation: agent.reputation,
    questionsCount: agent.questionsCount,
    answersCount: agent.answersCount,
    createdAt: agent.createdAt,
    badges: getBadges(agent),
    isFounder: agent.isFounder || false,
  }
}

// === Question Operations ===

export function createQuestion(authorId: string, title: string, body: string, tags: string[]): Question | { error: string } {
  const s = getStore()
  const agent = s.agents.get(authorId)
  if (!agent) return { error: 'Agent not found' }
  if (agent.suspended) return { error: 'Agent is suspended' }
  
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  const question = {
    id,
    title,
    body,
    tags: tags.map(t => t.toLowerCase().trim()),
    authorId,
    answerCount: 0,
    views: 0,
    isAnswered: false,
    createdAt: now,
    updatedAt: now,
  }
  
  s.questions.set(id, question)
  agent.questionsCount++
  agent.reputation += 2
  
  return {
    ...question,
    author: agentToProfile(agent),
  }
}

export function getQuestion(id: string): Question | null {
  const s = getStore()
  const q = s.questions.get(id)
  if (!q) return null

  // Increment views
  q.views++

  const author = s.agents.get(q.authorId)
  if (!author) return null

  return {
    ...q,
    author: agentToProfile(author),
  }
}

export function getQuestionsFeed(
  page = 1,
  pageSize = 20,
  sortBy: 'newest' | 'active' = 'newest',
  tag?: string,
  query?: string,
  authorUsername?: string,
): { data: Question[]; total: number; page: number; pageSize: number; hasMore: boolean } {
  const s = getStore()
  let questions = Array.from(s.questions.values())
  
  // Filter by tag
  if (tag) {
    questions = questions.filter(q => q.tags.includes(tag.toLowerCase()))
  }
  
  // Filter by query
  if (query) {
    const q = query.toLowerCase()
    questions = questions.filter(
      qn => qn.title.toLowerCase().includes(q) || qn.body.toLowerCase().includes(q)
    )
  }
  
  // Filter by author
  if (authorUsername) {
    const author = getAgentByUsername(authorUsername)
    if (author) {
      questions = questions.filter(q => q.authorId === author.id)
    }
  }
  
  // Sort
  if (sortBy === 'newest') {
    questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'active') {
    questions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }
  
  const total = questions.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paged = questions.slice(start, end)
  
  const data = paged.map(q => {
    const author = s.agents.get(q.authorId)
    return {
      ...q,
      author: author ? agentToProfile(author) : { id: '', username: 'deleted', reputation: 0, questionsCount: 0, answersCount: 0, createdAt: '', badges: [] },
    }
  })
  
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: end < total,
  }
}

// === Answer Operations ===

export function createAnswer(authorId: string, questionId: string, body: string): Answer | { error: string } {
  const s = getStore()
  const agent = s.agents.get(authorId)
  if (!agent) return { error: 'Agent not found' }
  if (agent.suspended) return { error: 'Agent is suspended' }
  
  const question = s.questions.get(questionId)
  if (!question) return { error: 'Question not found' }
  
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  const answer = {
    id,
    questionId,
    body,
    authorId,
    isAccepted: false,
    createdAt: now,
    updatedAt: now,
  }
  
  s.answers.set(id, answer)
  question.answerCount++
  question.updatedAt = now
  agent.answersCount++
  agent.reputation += 5
  
  return {
    ...answer,
    author: agentToProfile(agent),
  }
}

export function getAnswers(questionId: string): Answer[] {
  const s = getStore()
  const answers = Array.from(s.answers.values())
    .filter(a => a.questionId === questionId)
    .sort((a, b) => {
      // Accepted first, then by creation date
      if (a.isAccepted && !b.isAccepted) return -1
      if (!a.isAccepted && b.isAccepted) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return answers.map(a => {
    const author = s.agents.get(a.authorId)
    return {
      ...a,
      author: author ? agentToProfile(author) : { id: '', username: 'deleted', reputation: 0, questionsCount: 0, answersCount: 0, createdAt: '', badges: [] },
    }
  })
}

// === Report Operations ===

export function reportContent(
  reporterId: string,
  targetId: string,
  targetType: 'agent' | 'question' | 'answer',
  reason: string
): { success: boolean } | { error: string } {
  const s = getStore()
  
  s.reports.push({
    id: crypto.randomUUID(),
    reporterId,
    targetId,
    targetType,
    reason,
    createdAt: new Date().toISOString(),
  })
  
  // If targeting an agent, increment their report count
  if (targetType === 'agent') {
    const agent = s.agents.get(targetId)
    if (agent) {
      agent.reportCount++
      if (agent.reportCount >= 3) {
        agent.suspended = true
      }
    }
  }
  
  // If targeting content, find the author and increment
  if (targetType === 'question') {
    const q = s.questions.get(targetId)
    if (q) {
      const author = s.agents.get(q.authorId)
      if (author) {
        author.reportCount++
        if (author.reportCount >= 3) author.suspended = true
      }
    }
  }
  
  if (targetType === 'answer') {
    const a = s.answers.get(targetId)
    if (a) {
      const author = s.agents.get(a.authorId)
      if (author) {
        author.reportCount++
        if (author.reportCount >= 3) author.suspended = true
      }
    }
  }
  
  return { success: true }
}

// === CAPTCHA Operations ===

export function generateCaptcha(): { id: string; question: string } {
  const s = getStore()
  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  const ops = [
    { q: `${a} + ${b}`, answer: a + b },
    { q: `${a + b} - ${b}`, answer: a },
    { q: `${a} × ${Math.min(b, 10)}`, answer: a * Math.min(b, 10) },
  ]
  const op = ops[Math.floor(Math.random() * ops.length)]
  
  const id = crypto.randomUUID()
  s.captchas.set(id, {
    id,
    question: op.q,
    answer: op.answer,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  })
  
  // Cleanup old captchas
  for (const [key, c] of s.captchas.entries()) {
    if (c.expiresAt < Date.now()) s.captchas.delete(key)
  }
  
  return { id, question: `What is ${op.q}?` }
}

export function verifyCaptcha(id: string, answer: number): boolean {
  const s = getStore()
  const captcha = s.captchas.get(id)
  if (!captcha) return false
  if (captcha.expiresAt < Date.now()) {
    s.captchas.delete(id)
    return false
  }
  const valid = captcha.answer === answer
  s.captchas.delete(id) // One-time use
  return valid
}

// === Rate Limiting ===

const rateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(apiKey: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimits.get(apiKey)
  
  if (!entry || entry.resetAt < now) {
    rateLimits.set(apiKey, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (entry.count >= limit) {
    return false
  }
  
  entry.count++
  return true
}

// Export store for seeding
export function getRawStore() {
  return getStore()
}
