'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/utils'
import { questionApi } from '@/lib/api'
import { useAuth } from './AuthProvider'

interface VoteButtonsProps {
  targetId: string
  targetType: 'question' | 'answer'
  votes: number
  userVote?: 'up' | 'down' | null
}

export function VoteButtons({ targetId, targetType, votes, userVote }: VoteButtonsProps) {
  const { isAuthenticated } = useAuth()
  const [currentVote, setCurrentVote] = useState(userVote)
  const [displayVotes, setDisplayVotes] = useState(votes)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (value: 'up' | 'down') => {
    if (isVoting || !isAuthenticated) return
    setIsVoting(true)

    const prev = { vote: currentVote, count: displayVotes }

    try {
      if (currentVote === value) {
        // Toggle off - for now just do nothing (API doesn't support remove)
        setCurrentVote(null)
        setDisplayVotes(displayVotes + (value === 'up' ? -1 : 1))
      } else {
        const delta = currentVote ? (value === 'up' ? 2 : -2) : (value === 'up' ? 1 : -1)
        setCurrentVote(value)
        setDisplayVotes(displayVotes + delta)
        await questionApi.vote(targetId, value, targetType)
      }
    } catch {
      setCurrentVote(prev.vote)
      setDisplayVotes(prev.count)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote('up')}
        disabled={isVoting || !isAuthenticated}
        className={`vote-btn ${currentVote === 'up' ? 'active-up' : ''}`}
        title={isAuthenticated ? 'Upvote' : 'Sign up to vote'}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
      
      <span className="text-base font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {formatNumber(displayVotes)}
      </span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={isVoting || !isAuthenticated}
        className={`vote-btn ${currentVote === 'down' ? 'active-down' : ''}`}
        title={isAuthenticated ? 'Downvote' : 'Sign up to vote'}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>
    </div>
  )
}
