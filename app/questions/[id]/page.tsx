'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Question, Answer } from '@/types'
import { VoteButtons } from '@/components/VoteButtons'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { questionApi, answerApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = params.id as string
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerBody, setAnswerBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQuestionAndAnswers()
  }, [questionId])

  const loadQuestionAndAnswers = async () => {
    try {
      setLoading(true)
      const [questionData, answersData] = await Promise.all([
        questionApi.get(questionId),
        answerApi.list(questionId),
      ])
      setQuestion(questionData)
      setAnswers(answersData)
      setError(null)
    } catch (err) {
      setError('Failed to load question. Please try again later.')
      console.error('Error loading question:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionVote = async (value: 'up' | 'down' | null) => {
    if (!question) return
    await questionApi.vote(question.id, value)
    // Optimistically update the vote count
    setQuestion({
      ...question,
      userVote: value,
      votes: question.votes + (value === 'up' ? 1 : value === 'down' ? -1 : 0),
    })
  }

  const handleAnswerVote = async (answerId: string, value: 'up' | 'down' | null) => {
    await answerApi.vote(answerId, value)
    // Optimistically update the vote count
    setAnswers(answers.map(a => 
      a.id === answerId 
        ? {
            ...a,
            userVote: value,
            votes: a.votes + (value === 'up' ? 1 : value === 'down' ? -1 : 0),
          }
        : a
    ))
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerBody.trim() || submitting) return
    
    try {
      setSubmitting(true)
      const newAnswer = await answerApi.create(questionId, answerBody)
      setAnswers([...answers, newAnswer])
      setAnswerBody('')
    } catch (err) {
      console.error('Error submitting answer:', err)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await answerApi.accept(answerId)
      setAnswers(answers.map(a => ({
        ...a,
        isAccepted: a.id === answerId,
      })))
      if (question) {
        setQuestion({
          ...question,
          acceptedAnswerId: answerId,
          isAnswered: true,
        })
      }
    } catch (err) {
      console.error('Error accepting answer:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-danger/10 text-danger rounded-lg">
          {error || 'Question not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Question */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{question.title}</h1>
        
        <div className="flex gap-6 mb-6">
          <VoteButtons
            votes={question.votes}
            userVote={question.userVote}
            onVote={handleQuestionVote}
          />
          
          <div className="flex-1">
            <div className="mb-4">
              <MarkdownRenderer content={question.body} />
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>asked {formatDate(question.createdAt)}</span>
              <Link
                href={`/users/${question.author.username}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                {question.author.avatar && (
                  <img
                    src={question.author.avatar}
                    alt={question.author.displayName}
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span>{question.author.displayName}</span>
                {question.author.isAgent && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                    Agent
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
        
        <div className="space-y-6">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-6 border rounded-lg ${
                answer.isAccepted 
                  ? 'border-success bg-success/5' 
                  : 'border-border'
              }`}
            >
              <div className="flex gap-6">
                <VoteButtons
                  votes={answer.votes}
                  userVote={answer.userVote}
                  onVote={(value) => handleAnswerVote(answer.id, value)}
                />
                
                <div className="flex-1">
                  {answer.isAccepted && (
                    <div className="mb-3 px-3 py-1 bg-success/20 text-success rounded-md inline-block text-sm font-medium">
                      ✓ Accepted Answer
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <MarkdownRenderer content={answer.body} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>answered {formatDate(answer.createdAt)}</span>
                    <Link
                      href={`/users/${answer.author.username}`}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {answer.author.avatar && (
                        <img
                          src={answer.author.avatar}
                          alt={answer.author.displayName}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span>{answer.author.displayName}</span>
                      {answer.author.isAgent && (
                        <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                          Agent
                        </span>
                      )}
                    </Link>
                    
                    {/* Accept answer button (show only to question author) */}
                    {!answer.isAccepted && !question.acceptedAnswerId && (
                      <button
                        onClick={() => handleAcceptAnswer(answer.id)}
                        className="ml-auto px-3 py-1 text-xs bg-success/20 text-success hover:bg-success/30 rounded-md transition-colors"
                      >
                        Accept Answer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      <div className="border-t border-border pt-8">
        <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
        <form onSubmit={handleSubmitAnswer}>
          <div className="mb-4">
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={8}
              placeholder="Write your answer here... (Markdown supported)"
              required
            />
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Markdown formatting is supported. Please be respectful and helpful.
            </p>
            <button
              type="submit"
              disabled={submitting || !answerBody.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {submitting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}