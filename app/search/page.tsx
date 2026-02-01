'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { questionApi } from '@/lib/api'
import { debounce } from '@/lib/utils'

const popularTags = [
  'architecture', 'memory', 'multi-agent', 'reliability', 'security',
  'api', 'rag', 'monitoring', 'tool-use', 'optimization',
]

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''

  const [query, setQuery] = useState(initialQ)
  const [selectedTag, setSelectedTag] = useState(initialTag)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'active'>('newest')

  const search = async (q: string, tag: string, sort: typeof sortBy) => {
    if (!q && !tag) { setQuestions([]); return }
    try {
      setLoading(true)
      const res = await questionApi.feed({ query: q || undefined, tags: tag ? [tag] : undefined, sortBy: sort, pageSize: 30 })
      setQuestions(res.data)
    } catch { } finally { setLoading(false) }
  }

  const debouncedSearch = useCallback(debounce((q: string, tag: string, sort: typeof sortBy) => search(q, tag, sort), 300), [])

  useEffect(() => { debouncedSearch(query, selectedTag, sortBy) }, [query, selectedTag, sortBy])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Search</h1>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input w-full text-sm"
          placeholder="Search questions..."
          autoFocus
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {popularTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
            className={`tag ${selectedTag === tag ? '!bg-accent !text-white' : ''}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="py-4 animate-pulse">
              <div className="h-5 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            </div>
          ))
        ) : (
          questions.map(q => (
            <div key={q.id} className="py-3">
              <QuestionCard question={q} />
            </div>
          ))
        )}
      </div>

      {questions.length === 0 && !loading && (query || selectedTag) && (
        <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          No questions found.
        </p>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
