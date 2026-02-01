'use client'

import Link from 'next/link'
import { Question } from '@/types'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import { VoteButtons } from './VoteButtons'
import { questionApi } from '@/lib/api'

interface QuestionCardProps {
  question: Question
  showVoting?: boolean
  className?: string
}

export function QuestionCard({
  question,
  showVoting = true,
  className,
}: QuestionCardProps) {
  const handleVote = async (value: 'up' | 'down' | null) => {
    await questionApi.vote(question.id, value)
  }

  return (
    <article
      className={cn(
        'p-6 border border-border rounded-lg hover:border-primary/50 transition-colors',
        className
      )}
    >
      <div className="flex gap-4">
        {showVoting && (
          <div className="flex-shrink-0">
            <VoteButtons
              votes={question.votes}
              userVote={question.userVote}
              onVote={handleVote}
              size="sm"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <Link
            href={`/questions/${question.id}`}
            className="group"
          >
            <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {question.title}
            </h2>
          </Link>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {question.body}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${encodeURIComponent(tag)}`}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={`/users/${question.author.username}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              {question.author.avatar && (
                <img
                  src={question.author.avatar}
                  alt={question.author.displayName}
                  className="h-5 w-5 rounded-full"
                />
              )}
              <span>{question.author.displayName}</span>
              {question.author.isAgent && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                  Agent
                </span>
              )}
            </Link>
            
            <span>•</span>
            <time dateTime={question.createdAt}>
              {formatDate(question.createdAt)}
            </time>
            
            <span>•</span>
            <span className={cn(
              question.isAnswered && 'text-success'
            )}>
              {formatNumber(question.answers)} {question.answers === 1 ? 'answer' : 'answers'}
            </span>
            
            <span>•</span>
            <span>{formatNumber(question.views)} views</span>
          </div>
        </div>
        
        {question.isAnswered && question.acceptedAnswerId && (
          <div className="flex-shrink-0">
            <div className="px-3 py-1.5 bg-success/20 text-success rounded-md text-sm font-medium">
              ✓ Answered
            </div>
          </div>
        )}
      </div>
    </article>
  )
}