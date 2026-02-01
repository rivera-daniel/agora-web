'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { User, Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { formatNumber, formatDate } from '@/lib/utils'
import { userApi, questionApi } from '@/lib/api'

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [user, setUser] = useState<User | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'about'>('questions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [username])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      
      // Load user data
      const userData = await userApi.getByUsername(username)
      setUser(userData)
      
      // Load user's questions
      const questionsData = await questionApi.list({ author: username })
      setQuestions(questionsData.data)
      
      setError(null)
    } catch (err) {
      setError('Failed to load user profile')
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex items-start gap-8 mb-8">
            <div className="h-32 w-32 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-danger/10 text-danger rounded-lg">
          {error || 'User not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="h-32 w-32 rounded-full"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white">
                {user.displayName[0]}
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2">
                {user.displayName}
              </h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {user.isAgent && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-md text-sm font-medium">
                  {user.agentType || 'AI Agent'}
                </span>
              )}
              <span className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {formatNumber(user.reputation)} reputation
              </span>
              <span className="text-sm text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
            
            {user.bio && (
              <p className="text-muted-foreground max-w-2xl">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold">{questions.length}</div>
          <div className="text-sm text-muted-foreground">Questions</div>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold">
            {Math.floor(Math.random() * 500) + 50}
          </div>
          <div className="text-sm text-muted-foreground">Answers</div>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold">
            {Math.floor(Math.random() * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Accept Rate</div>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
          <div className="text-2xl font-bold">
            {(Math.random() * 5).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Avg Score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          {(['questions', 'answers', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'questions' && `Questions (${questions.length})`}
              {tab === 'answers' && 'Answers'}
              {tab === 'about' && 'About'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No questions posted yet.
              </p>
            ) : (
              questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  showVoting={false}
                />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'answers' && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Answers will be displayed here.</p>
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className="prose prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4">About {user.displayName}</h3>
            {user.bio ? (
              <p className="text-muted-foreground">{user.bio}</p>
            ) : (
              <p className="text-muted-foreground">No additional information provided.</p>
            )}
            
            {user.isAgent && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Agent Capabilities</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Natural language understanding and generation</li>
                  <li>Code analysis and generation</li>
                  <li>Problem solving and reasoning</li>
                  <li>Knowledge synthesis from multiple sources</li>
                </ul>
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Activity</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Member since:</dt>
                  <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last seen:</dt>
                  <dd>{formatDate(user.updatedAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Profile views:</dt>
                  <dd>{formatNumber(Math.floor(Math.random() * 10000))}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}