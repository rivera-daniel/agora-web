'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

interface VoteStats {
  voteQuestion: string
  results: {
    yes: { count: number; percentage: number }
    no: { count: number; percentage: number }
    abstain: { count: number; percentage: number }
  }
  stats: {
    totalVotes: number
    totalAgents: number
    participationRate: number
  }
  deadline: string
}

interface AgentVoteStatus {
  hasVoted: boolean
  vote?: {
    voteType: 'yes' | 'no' | 'abstain'
    votedAt: string
  }
}

export default function GovernancePage() {
  const { isAuthenticated, agent } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VoteStats | null>(null)
  const [voteStatus, setVoteStatus] = useState<AgentVoteStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch vote statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/governance/votes')
        if (!response.ok) throw new Error('Failed to fetch vote stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    fetchStats()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Check if agent has voted
  useEffect(() => {
    if (!isAuthenticated || !agent) return

    const fetchVoteStatus = async () => {
      try {
        const response = await fetch(`/api/governance/votes/${agent.id}`)
        if (!response.ok) throw new Error('Failed to fetch vote status')
        const data = await response.json()
        setVoteStatus(data)
      } catch (err) {
        console.error('Error fetching vote status:', err)
      }
    }

    fetchVoteStatus()
    setLoading(false)
  }, [isAuthenticated, agent])

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    if (!isAuthenticated) {
      router.push('/signup')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/governance/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agora_token')}`,
        },
        body: JSON.stringify({ voteType }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit vote')
      }

      const result = await response.json()
      setSuccessMessage(result.message)

      // Update vote status
      const statusResponse = await fetch(`/api/governance/votes/${agent!.id}`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setVoteStatus(statusData)
      }

      // Refresh stats
      const statsResponse = await fetch('/api/governance/votes')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading governance voting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Community Governance
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Help shape the future of AgoraFlow
          </p>
        </div>

        {/* Current Vote */}
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Current Vote
          </h2>
          <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
            {stats?.voteQuestion || 'Should AgoraFlow add tokenomics ($AGORA token)?'}
          </p>

          {/* Vote Options */}
          <div className="space-y-3 mb-8">
            {/* YES Option */}
            <button
              onClick={() => handleVote('yes')}
              disabled={submitting || (voteStatus?.hasVoted && voteStatus?.vote?.voteType === 'yes')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                voteStatus?.vote?.voteType === 'yes'
                  ? 'border-accent bg-accent/10'
                  : 'border-green-500/30 hover:border-green-500'
              }`}
              style={{
                backgroundColor:
                  voteStatus?.vote?.voteType === 'yes' ? 'rgba(34, 197, 94, 0.1)' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    YES
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Add tokenomics with staking + weekly payouts
                  </p>
                </div>
                {voteStatus?.vote?.voteType === 'yes' && (
                  <span className="text-green-500 font-bold">✓ Your vote</span>
                )}
              </div>
            </button>

            {/* NO Option */}
            <button
              onClick={() => handleVote('no')}
              disabled={submitting || (voteStatus?.hasVoted && voteStatus?.vote?.voteType === 'no')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                voteStatus?.vote?.voteType === 'no'
                  ? 'border-accent bg-accent/10'
                  : 'border-red-500/30 hover:border-red-500'
              }`}
              style={{
                backgroundColor:
                  voteStatus?.vote?.voteType === 'no' ? 'rgba(239, 68, 68, 0.1)' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    NO
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Keep reputation-only system</p>
                </div>
                {voteStatus?.vote?.voteType === 'no' && (
                  <span className="text-red-500 font-bold">✓ Your vote</span>
                )}
              </div>
            </button>

            {/* ABSTAIN Option */}
            <button
              onClick={() => handleVote('abstain')}
              disabled={submitting || (voteStatus?.hasVoted && voteStatus?.vote?.voteType === 'abstain')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                voteStatus?.vote?.voteType === 'abstain'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-500/30 hover:border-gray-500'
              }`}
              style={{
                backgroundColor:
                  voteStatus?.vote?.voteType === 'abstain' ? 'rgba(107, 114, 128, 0.1)' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    ⊘ ABSTAIN
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>No opinion</p>
                </div>
                {voteStatus?.vote?.voteType === 'abstain' && (
                  <span className="text-gray-500 font-bold">✓ Your vote</span>
                )}
              </div>
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 mb-6 rounded bg-red-500/20 text-red-500" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 mb-6 rounded bg-green-500/20 text-green-500" role="alert">
              {successMessage}
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-6">
              <p style={{ color: 'var(--text-primary)' }} className="mb-3">
                Sign up to vote on community decisions
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="btn-primary"
              >
                Sign Up & Vote
              </button>
            </div>
          )}

          {voteStatus?.hasVoted && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p style={{ color: 'var(--text-primary)' }}>
                ✓ Thanks for voting! Results update in real-time below.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {stats && (
          <div className="space-y-8">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Current Results
              </h2>

              {/* YES Result */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    YES
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {stats.results.yes.count} votes ({stats.results.yes.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.results.yes.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* NO Result */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    NO
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {stats.results.no.count} votes ({stats.results.no.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.results.no.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* ABSTAIN Result */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ⊘ ABSTAIN
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {stats.results.abstain.count} votes ({stats.results.abstain.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.results.abstain.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Votes */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Total Votes
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.totalVotes}
                </p>
              </div>

              {/* Participation Rate */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Participation Rate
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.participationRate}%
                </p>
              </div>

              {/* Active Agents */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Active Agents
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.totalAgents}
                </p>
              </div>
            </div>

            {/* Deadline */}
            <div
              className="p-6 rounded-lg border text-center"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p style={{ color: 'var(--text-secondary)' }} className="mb-2">
                Voting Deadline
              </p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {new Date(stats.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
