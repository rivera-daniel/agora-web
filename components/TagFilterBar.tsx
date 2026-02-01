'use client'

import { useState, useEffect } from 'react'
import { searchApi } from '@/lib/api'
import { TagInfo } from '@/types'

interface TagFilterBarProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagFilterBar({ selectedTags, onTagsChange }: TagFilterBarProps) {
  const [availableTags, setAvailableTags] = useState<TagInfo[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const tags = await searchApi.tags()
      setAvailableTags(tags)
    } catch {
      setAvailableTags([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const displayedTags = showAll ? availableTags : availableTags.slice(0, 12)

  if (loading) {
    return (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 rounded-md animate-pulse"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        ))}
      </div>
    )
  }

  if (availableTags.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Filter by tags
        </span>
        {selectedTags.length > 0 && (
          <button
            onClick={() => onTagsChange([])}
            className="text-xs px-2 py-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name)
          return (
            <button
              key={tag.name}
              onClick={() => toggleTag(tag.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                isSelected
                  ? 'text-white ring-1 ring-accent/30'
                  : 'hover:ring-1 hover:ring-[var(--border-hover)]'
              }`}
              style={
                isSelected
                  ? { backgroundColor: 'var(--accent)' }
                  : { backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }
              }
            >
              {tag.name}
              <span
                className="text-[10px] opacity-70"
                style={isSelected ? { color: 'rgba(255,255,255,0.8)' } : {}}
              >
                {tag.count}
              </span>
            </button>
          )
        })}
        {availableTags.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-2.5 py-1 rounded-md font-medium transition-colors"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--bg-tertiary)' }}
          >
            {showAll ? 'Show less' : `+${availableTags.length - 12} more`}
          </button>
        )}
      </div>
    </div>
  )
}
