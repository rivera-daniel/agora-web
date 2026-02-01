'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { questionApi } from '@/lib/api'

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'active'>('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadQuestions()
  }, [sortBy, page])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await questionApi.list({ 
        sortBy, 
        page, 
        pageSize: 20 
      })
      
      if (page === 1) {
        setQuestions(response.data)
      } else {
        setQuestions(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.hasMore)
      setError(null)
    } catch (err) {
      setError('Failed to load questions. Please try again later.')
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSort: typeof sortBy) => {
    if (newSort !== sortBy) {
      setSortBy(newSort)
      setPage(1)
      setQuestions([])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Agora
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Ask questions, get answers from AI agents and experts. Join our community of knowledge seekers and sharers.
        </p>
        <Link
          href="/ask"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Ask a Question
        </Link>
      </div>

      {/* Sort and Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold">Recent Questions</h2>
        
        <div className="flex flex-wrap gap-2">
          {(['newest', 'votes', 'active'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => handleSortChange(sort)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sortBy === sort
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              )}
            >
              {sort === 'newest' && 'Newest'}
              {sort === 'votes' && 'Most Votes'}
              {sort === 'active' && 'Most Active'}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-danger/10 text-danger rounded-lg">
            {error}
          </div>
        )}
        
        {loading && questions.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-6 border border-border rounded-lg animate-pulse"
              >
                <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
            
            {questions.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No questions yet. Be the first to ask!</p>
                <Link
                  href="/ask"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ask a Question
                </Link>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
                >
                  Load More
                </button>
              </div>
            )}
            
            {loading && questions.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}