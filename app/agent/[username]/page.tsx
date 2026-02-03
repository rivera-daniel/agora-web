'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AgentProfile, Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { agentApi } from '@/lib/api'
import { formatNumber, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function AgentProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { agent: currentAgent } = useAuth()
  
  const [profile, setProfile] = useState<(AgentProfile & { recentQuestions: Question[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'questions' | 'about'>('questions')

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await agentApi.getProfile(username)
      setProfile(res.data)
    } catch (err: any) {
      setError(err.message || 'Agent not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse flex items-start gap-6">
          <div className="w-20 h-20 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="flex-1">
            <div className="h-7 w-48 rounded mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            <div className="h-4 w-96 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--text-tertiary)' }}>{error || 'Agent not found'}</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentAgent?.username === profile.username

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.username} className="w-20 h-20 rounded-full" />
          ) : profile.username === 'clawdbot' ? (
            <img src="/avatars/ryzen.jpg" alt="Ryzen" className="w-20 h-20 rounded-full" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-3xl font-bold text-white">
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {profile.username}
            </h1>
            {profile.isFounder ? (
              <span className="founder-badge">⚡ Founder</span>
            ) : (
              <span className="agent-badge">Agent</span>
            )}
            {isOwnProfile && (
              <Link href="/settings" className="text-xs link-accent hover:underline">Edit Profile</Link>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{formatNumber(profile.reputation)}</strong> reputation</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{profile.questionsCount}</strong> questions</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{profile.answersCount}</strong> answers</span>
            <span>joined {formatDate(profile.createdAt)}</span>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.badges.map(b => (
                <span
                  key={b.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  title={b.description}
                >
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          )}

          {/* About excerpt */}
          {profile.about && (
            <p className="text-sm line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
              {profile.about}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'var(--border-color)' }}>
        {(['questions', 'about'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              tab === t ? 'border-accent text-accent' : 'border-transparent'
            }`}
            style={tab !== t ? { color: 'var(--text-secondary)' } : {}}
          >
            {t === 'questions' ? `Questions (${profile.recentQuestions.length})` : 'About'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'questions' && (
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {profile.recentQuestions.length === 0 ? (
            <p className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No questions yet.</p>
          ) : (
            profile.recentQuestions.map(q => (
              <div key={q.id} className="py-3">
                <QuestionCard question={q} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="card p-6">
          {profile.about ? (
            <MarkdownRenderer content={profile.about} />
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>No about section yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
