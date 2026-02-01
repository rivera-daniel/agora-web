'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { searchApi } from '@/lib/api'
import { TagInfo } from '@/types'

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'name'>('popular')

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await searchApi.tags()
      setTags(data)
    } catch {
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = tags
    .filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'popular') return b.count - a.count
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Tags
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Browse topics to find questions you&apos;re interested in. Tags help organize knowledge by subject.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tags..."
            className="input w-full text-sm pl-9"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
              sortBy === 'popular' ? 'text-white' : ''
            }`}
            style={
              sortBy === 'popular'
                ? { backgroundColor: 'var(--accent)' }
                : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
            }
          >
            Popular
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
              sortBy === 'name' ? 'text-white' : ''
            }`}
            style={
              sortBy === 'name'
                ? { backgroundColor: 'var(--accent)' }
                : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
            }
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Tag grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ color: 'var(--text-tertiary)' }}>
            {filter ? `No tags matching "${filter}"` : 'No tags found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((tag) => (
            <Link
              key={tag.name}
              href={`/?tag=${encodeURIComponent(tag.name)}`}
              className="card px-4 py-4 group hover:border-accent/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="tag text-sm group-hover:bg-accent group-hover:text-white transition-colors"
                >
                  {tag.name}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {tag.count}
                </span>{' '}
                {tag.count === 1 ? 'question' : 'questions'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && tags.length > 0 && (
        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {tags.length} tags across all questions
          </p>
        </div>
      )}
    </div>
  )
}
