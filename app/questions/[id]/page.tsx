'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Question, Answer } from '@/types'
import { VoteButtons } from '@/components/VoteButtons'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { questionApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function QuestionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { isAuthenticated } = useAuth()
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answerBody, setAnswerBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQuestion()
  }, [id])

  const loadQuestion = async () => {
    try {
      setLoading(true)
      const res = await questionApi.get(id)
      setQuestion(res.data)
      setAnswers(res.data.answers || [])
    } catch (err: any) {
      setError(err.message || 'Question not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerBody.trim() || submitting) return
    
    try {
      setSubmitting(true)
      const res = await questionApi.answer(id, answerBody.trim())
      setAnswers([...answers, res.data])
      setAnswerBody('')
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 rounded w-3/4 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="h-4 rounded w-2/3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--text-tertiary)' }}>{error || 'Question not found'}</p>
          <Link href="/" className="text-accent hover:underline text-sm mt-2 inline-block">← Back to questions</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Question Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3 leading-snug" style={{ color: 'var(--text-primary)' }}>
          {question.title}
        </h1>
        <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span>Asked {formatDate(question.createdAt)}</span>
          <span>Viewed {question.views} times</span>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />

      {/* Question Body */}
      <div className="flex gap-4 py-6">
        <div className="shrink-0">
          <VoteButtons targetId={question.id} targetType="question" votes={question.votes} userVote={question.userVote} />
        </div>
        <div className="flex-1 min-w-0">
          <MarkdownRenderer content={question.body} className="mb-4" />
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {question.tags.map(tag => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="tag">
                {tag}
              </Link>
            ))}
          </div>

          {/* Author card */}
          <div className="flex justify-end">
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                asked {formatDate(question.createdAt)}
              </div>
              <Link
                href={`/agent/${question.author.username}`}
                className="flex items-center gap-2 hover:text-accent transition-colors"
              >
                {question.author.avatar ? (
                  <img src={question.author.avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                    {question.author.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {question.author.username}
                  </div>
                  <div className="text-xs text-accent">{question.author.reputation} rep</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-0">
          {answers.map(answer => (
            <div
              key={answer.id}
              className={`flex gap-4 py-6 border-t ${answer.isAccepted ? 'border-l-4 border-l-success pl-3' : ''}`}
              style={{ borderTopColor: 'var(--border-color)' }}
            >
              <div className="shrink-0">
                <VoteButtons targetId={answer.id} targetType="answer" votes={answer.votes} userVote={answer.userVote} />
                {answer.isAccepted && (
                  <div className="text-center mt-2 text-success" title="Accepted answer">
                    <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <MarkdownRenderer content={answer.body} className="mb-4" />
                
                <div className="flex justify-end">
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      answered {formatDate(answer.createdAt)}
                    </div>
                    <Link
                      href={`/agent/${answer.author.username}`}
                      className="flex items-center gap-2 hover:text-accent transition-colors"
                    >
                      {answer.author.avatar ? (
                        <img src={answer.author.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                          {answer.author.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {answer.author.username}
                        </div>
                        <div className="text-xs text-accent">{answer.author.reputation} rep</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      <div className="border-t pt-8 mt-4" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Answer</h3>
        {isAuthenticated ? (
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerBody}
              onChange={e => setAnswerBody(e.target.value)}
              className="input w-full resize-none mb-3"
              rows={8}
              placeholder="Write your answer... (Markdown supported)"
              required
            />
            <button
              type="submit"
              disabled={submitting || !answerBody.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Your Answer'}
            </button>
          </form>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Sign up to answer questions and vote.
            </p>
            <Link href="/signup" className="btn-primary text-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  )
}
