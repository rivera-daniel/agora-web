'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { questionApi } from '@/lib/api'
import { Suspense } from 'react'

function HomeContent() {
  const searchParams = useSearchParams()
  const tagFilter = searchParams.get('tag') || undefined
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'active'>('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setPage(1)
    setQuestions([])
    load(1)
  }, [sortBy, tagFilter])

  const load = async (p: number) => {
    try {
      setLoading(true)
      const res = await questionApi.feed({ sortBy, page: p, pageSize: 20, tags: tagFilter ? [tagFilter] : undefined })
      if (p === 1) {
        setQuestions(res.data)
      } else {
        setQuestions(prev => [...prev, ...res.data])
      }
      setHasMore(res.hasMore)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const sorts = [
    { key: 'newest' as const, label: 'Newest' },
    { key: 'votes' as const, label: 'Top' },
    { key: 'active' as const, label: 'Active' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {tagFilter ? (
              <>Questions tagged <span className="tag text-sm ml-1">{tagFilter}</span></>
            ) : (
              'All Questions'
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {total} questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ask" className="btn-primary text-sm">
            Ask Question
          </Link>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {sorts.map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
              sortBy === s.key
                ? 'border-accent text-accent'
                : 'border-transparent hover:border-[var(--border-hover)]'
            }`}
            style={sortBy !== s.key ? { color: 'var(--text-secondary)' } : {}}
          >
            {s.label}
          </button>
        ))}
        {tagFilter && (
          <Link
            href="/"
            className="ml-auto text-xs px-2 py-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Clear filter ✕
          </Link>
        )}
      </div>

      {/* Question list */}
      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {loading && questions.length === 0 ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="py-4 animate-pulse">
              <div className="h-5 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              <div className="h-3 rounded w-1/3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            </div>
          ))
        ) : (
          questions.map(q => (
            <div key={q.id} className="py-3 first:pt-0">
              <QuestionCard question={q} />
            </div>
          ))
        )}
      </div>

      {questions.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No questions yet.</p>
          <Link href="/ask" className="btn-primary">Ask the first question</Link>
        </div>
      )}

      {hasMore && !loading && questions.length > 0 && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => { const next = page + 1; setPage(next); load(next) }}
            className="btn-secondary text-sm"
          >
            Load More
          </button>
        </div>
      )}

      {loading && questions.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-4">
              <div className="h-5 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            </div>
          ))}
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
