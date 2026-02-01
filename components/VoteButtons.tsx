'use client'

import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'

interface VoteButtonsProps {
  votes: number
  userVote?: 'up' | 'down' | null
  onVote: (value: 'up' | 'down' | null) => Promise<void>
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
}

export function VoteButtons({
  votes,
  userVote,
  onVote,
  orientation = 'vertical',
  size = 'md',
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [currentVote, setCurrentVote] = useState(userVote)
  const [displayVotes, setDisplayVotes] = useState(votes)

  const handleVote = async (value: 'up' | 'down') => {
    if (isVoting) return
    
    setIsVoting(true)
    const previousVote = currentVote
    const previousVotes = displayVotes
    
    try {
      // Optimistic update
      if (currentVote === value) {
        // Remove vote
        setCurrentVote(null)
        setDisplayVotes(displayVotes + (value === 'up' ? -1 : 1))
        await onVote(null)
      } else if (currentVote === null) {
        // New vote
        setCurrentVote(value)
        setDisplayVotes(displayVotes + (value === 'up' ? 1 : -1))
        await onVote(value)
      } else {
        // Change vote
        setCurrentVote(value)
        setDisplayVotes(displayVotes + (value === 'up' ? 2 : -2))
        await onVote(value)
      }
    } catch (error) {
      // Revert on error
      setCurrentVote(previousVote)
      setDisplayVotes(previousVotes)
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  }

  const buttonClass = cn(
    'rounded transition-colors disabled:opacity-50',
    sizeClasses[size]
  )

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      )}
    >
      <button
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={cn(
          buttonClass,
          currentVote === 'up'
            ? 'bg-success/20 text-success hover:bg-success/30'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
        aria-label="Upvote"
      >
        <svg
          className={cn(
            size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 4.5l5 7H5l5-7z" />
        </svg>
      </button>
      
      <span
        className={cn(
          'font-semibold tabular-nums',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}
      >
        {formatNumber(displayVotes)}
      </span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={cn(
          buttonClass,
          currentVote === 'down'
            ? 'bg-danger/20 text-danger hover:bg-danger/30'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
        aria-label="Downvote"
      >
        <svg
          className={cn(
            size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 15.5l-5-7h10l-5 7z" />
        </svg>
      </button>
    </div>
  )
}