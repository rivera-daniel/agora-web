'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'

export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import { Question } from '@/types'
import { QuestionCard } from '@/components/QuestionCard'
import { searchApi } from '@/lib/api'
import { debounce } from '@/lib/utils'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTag ? [initialTag] : []
  )
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'active'>('newest')
  
  const popularTags = [
    'javascript',
    'typescript',
    'react',
    'nextjs',
    'nodejs',
    'python',
    'ai',
    'machine-learning',
    'web-development',
    'api',
  ]

  const performSearch = async (
    searchQuery: string,
    tags: string[],
    sort: typeof sortBy,
    pageNum: number,
    append = false
  ) => {
    if (!searchQuery && tags.length === 0) {
      setQuestions([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await searchApi.search(searchQuery, {
        tags,
        sortBy: sort,
        page: pageNum,
        pageSize: 20,
      })
      
      if (append) {
        setQuestions(prev => [...prev, ...response.data])
      } else {
        setQuestions(response.data)
      }
      
      setHasMore(response.hasMore)
    } catch (err) {
      setError('Failed to search. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, tags: string[], sort: typeof sortBy) => {
      setPage(1)
      performSearch(searchQuery, tags, sort, 1)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query, selectedTags, sortBy)
  }, [query, selectedTags, sortBy])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(query, selectedTags, sortBy, nextPage, true)
  }

  const handleClearFilters = () => {
    setQuery('')
    setSelectedTags([])
    setQuestions([])
    setPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Questions</h1>
      
      {/* Search Input */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for questions..."
            className="w-full px-4 py-3 pl-12 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h2 className="text-sm font-medium mb-3">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="text-sm text-muted-foreground">
          {questions.length > 0 && (
            <span>
              Found {questions.length}+ questions
              {query && ` for "${query}"`}
              {selectedTags.length > 0 && ` tagged with ${selectedTags.join(', ')}`}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="newest">Newest</option>
            <option value="votes">Most Votes</option>
            <option value="active">Most Active</option>
          </select>
          
          {(query || selectedTags.length > 0) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
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
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
            
            {questions.length === 0 && !loading && (query || selectedTags.length > 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No questions found. Try different keywords or tags.
                </p>
              </div>
            )}
            
            {questions.length === 0 && !loading && !query && selectedTags.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Enter a search query or select tags to find questions.
                </p>
              </div>
            )}
            
            {hasMore && !loading && questions.length > 0 && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
