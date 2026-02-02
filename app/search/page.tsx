'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Question, TagInfo } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { searchApi } from '@/lib/api'
import { debounce } from '@/lib/utils'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''
  const initialSort = searchParams.get('sort') || 'recent'

  const [query, setQuery] = useState(initialQ)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTag ? [initialTag] : [])
  const [availableTags, setAvailableTags] = useState<TagInfo[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState(initialSort)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  // Load available tags
  useEffect(() => {
    searchApi.tags().then(setAvailableTags).catch(() => {})
  }, [])

  // Initial search from URL params
  useEffect(() => {
    if (initialQ || initialTag) {
      doSearch(initialQ, initialTag ? [initialTag] : [], initialSort, 0, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doSearch = async (q: string, tags: string[], sort: string, off: number, replace: boolean) => {
    if (!q.trim() && tags.length === 0) {
      setQuestions([])
      setTotal(0)
      return
    }
    try {
      setLoading(true)
      const res = await searchApi.questions({
        query: q.trim() || undefined,
        tags: tags.length > 0 ? tags.join(',') : undefined,
        sort,
        limit: 20,
        offset: off,
      })
      if (replace) {
        setQuestions(res.questions)
      } else {
        setQuestions(prev => [...prev, ...res.questions])
      }
      setTotal(res.pagination.total)
      setHasMore(res.pagination.hasMore)
      setOffset(off + res.questions.length)
    } catch {
      if (replace) setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((q: string, tags: string[], sort: string) => {
      doSearch(q, tags, sort, 0, true)
      // Update URL without navigation
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (tags.length > 0) params.set('tag', tags.join(','))
      if (sort !== 'recent') params.set('sort', sort)
      router.replace(`/search?${params.toString()}`, { scroll: false })
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query, selectedTags, sortBy)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedTags, sortBy])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const sorts = [
    { key: 'recent', label: 'Recent' },
    { key: 'trending', label: 'Trending' },
    { key: 'popular', label: 'Popular' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Search header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Search Questions
        </h1>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-full text-base pl-11 pr-4 py-3"
            placeholder="Search by title, body, or tags..."
            autoFocus
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: tags */}
        <aside className="lg:w-64 shrink-0">
          <div
            className="lg:sticky lg:top-24 p-4 rounded-lg border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Filter by Tags
              </h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-accent hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.slice(0, 20).map((tag) => {
                const isSelected = selectedTags.includes(tag.name)
                return (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-all ${
                      isSelected ? 'text-white' : ''
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--accent)' }
                        : { backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }
                    }
                  >
                    {tag.name}
                    <span className="opacity-60 text-[10px]">{tag.count}</span>
                  </button>
                )
              })}
              {availableTags.length > 20 && (
                <Link
                  href="/tags"
                  className="text-xs px-2 py-1 rounded-md font-medium text-accent hover:underline"
                >
                  View all tags →
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Sort controls + result count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {total > 0 ? (
                <>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{total}</span> results
                  {query && (
                    <> for &ldquo;<span style={{ color: 'var(--text-primary)' }}>{query}</span>&rdquo;</>
                  )}
                </>
              ) : query || selectedTags.length > 0 ? (
                loading ? 'Searching...' : 'No results found'
              ) : (
                'Enter a search term or select tags'
              )}
            </p>
            <div className="flex gap-1">
              {sorts.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    sortBy === s.key ? 'text-white' : ''
                  }`}
                  style={
                    sortBy === s.key
                      ? { backgroundColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active tag pills */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {tag}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Results list */}
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {loading && questions.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="py-4 animate-pulse">
                  <div className="h-5 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                  <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                  <div className="h-3 rounded w-1/3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                </div>
              ))
            ) : (
              questions.map((q) => (
                <div key={q.id} className="py-3">
                  <QuestionCard question={q} />
                </div>
              ))
            )}
          </div>

          {/* Empty state */}
          {questions.length === 0 && !loading && (query || selectedTags.length > 0) && (
            <div className="text-center py-16">
              <svg
                className="mx-auto w-16 h-16 mb-4"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
                No questions found
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Try different keywords or tags
              </p>
              <Link href="/ask" className="btn-primary text-sm">
                Ask a new question
              </Link>
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && questions.length > 0 && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => doSearch(query, selectedTags, sortBy, offset, false)}
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
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-10 w-48 rounded mb-6 animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-12 w-full rounded mb-8 animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
