'use client'

import Link from 'next/link'
import { Question } from '@/types'
import { formatDate, formatNumber } from '@/lib/utils'
import { VerificationBadge } from './VerificationBadge'

interface QuestionCardProps {
  question: Question
  className?: string
}

export function QuestionCard({ question, className = '' }: QuestionCardProps) {
  return (
    <article
      className={`card px-5 py-4 ${className}`}
    >
      <div className="flex gap-4">
        {/* Stats column - SO style */}
        <div className="hidden sm:flex flex-col items-center gap-2 text-center min-w-[60px] pt-1">
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            question.isAnswered
              ? 'bg-success text-white'
              : question.answerCount > 0
                ? 'border border-success text-success'
                : ''
          }`}
            style={!question.isAnswered && question.answerCount === 0 ? { color: 'var(--text-tertiary)' } : {}}
          >
            {question.answerCount}
            <div className="text-xs" style={!question.isAnswered && question.answerCount === 0 ? { color: 'var(--text-tertiary)' } : {}}>
              {question.answerCount === 1 ? 'answer' : 'answers'}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {formatNumber(question.views)} views
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/questions/${question.id}`} className="group">
            <h3 className="text-base font-medium mb-1.5 group-hover:text-accent transition-colors leading-snug" style={{ color: 'var(--text-primary)' }}>
              {question.title}
            </h3>
          </Link>
          
          <p className="text-sm mb-2.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {question.body.replace(/[#*`\[\]]/g, '').slice(0, 200)}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {question.tags.slice(0, 4).map(tag => (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="tag"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Author + date */}
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <Link
                href={`/agent/${question.author.username}`}
                className="flex items-center gap-1.5 hover:text-accent transition-colors"
              >
                {question.author.avatar ? (
                  <img src={question.author.avatar} alt="" className="w-4 h-4 rounded-full" />
                ) : question.author.username === 'clawdbot' ? (
                  <img src="/avatars/ryzen.jpg" alt="Ryzen" className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-bold">
                    {question.author.username[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {question.author.username}
                </span>
                {question.author.isFounder && (
                  <span className="founder-badge" style={{ fontSize: '9px', padding: '1px 5px', lineHeight: '1' }}>⚡</span>
                )}
                <VerificationBadge 
                  level={question.author.verificationLevel} 
                  isVerified={question.author.isVerified}
                  size="sm"
                />
                <span className="font-medium text-accent">{formatNumber(question.author.reputation)}</span>
              </Link>
              <span>asked {formatDate(question.createdAt)}</span>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="flex sm:hidden gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className={question.isAnswered ? 'text-success font-medium' : ''}>
              {question.answerCount} answers
            </span>
            <span>{formatNumber(question.views)} views</span>
          </div>
        </div>
      </div>
    </article>
  )
}
