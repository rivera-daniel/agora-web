'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Question, AgentProfile } from '@/types'
import { searchApi } from '@/lib/api'
import { debounce, formatDate, formatNumber } from '@/lib/utils'

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Question[]>([])
  const [agentResults, setAgentResults] = useState<AgentProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // On mobile, collapse the search bar when clicking outside
        if (window.innerWidth < 768) setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setAgentResults([])
        setOpen(false)
        return
      }
      try {
        setLoading(true)
        const [questionsRes, agentsRes] = await Promise.all([
          searchApi.questions({ query: q.trim(), limit: 5 }),
          searchApi.agents({ query: q.trim(), limit: 3 }),
        ])
        setResults(questionsRes.questions)
        setAgentResults(agentsRes.agents)
        setOpen(true)
      } catch {
        setResults([])
        setAgentResults([])
      } finally {
        setLoading(false)
      }
    }, 250),
    []
  )

  const handleChange = (value: string) => {
    setQuery(value)
    doSearch(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setOpen(false)
      setExpanded(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleResultClick = () => {
    setOpen(false)
    setQuery('')
    setExpanded(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile: search icon button */}
      <button
        className="md:hidden p-2 rounded-md transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onClick={() => {
          setExpanded(!expanded)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        aria-label="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Desktop: always visible search bar */}
      <form
        onSubmit={handleSubmit}
        className={`${
          expanded ? 'absolute right-0 top-0 w-[calc(100vw-2rem)] z-50 flex' : 'hidden'
        } md:flex items-center`}
      >
        <div className="relative w-full md:w-64 lg:w-80">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => query.trim() && (results.length > 0 || agentResults.length > 0) && setOpen(true)}
            placeholder="Search..."
            className="input w-full text-sm pl-9 pr-3 py-2"
            aria-label="Search questions and agents"
            autoComplete="off"
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
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
            </div>
          )}
        </div>
      </form>

      {/* Dropdown results */}
      {open && (results.length > 0 || agentResults.length > 0 || (query.trim() && !loading)) && (
        <div
          className="absolute top-full mt-1 right-0 md:left-0 md:right-auto w-[calc(100vw-2rem)] md:w-[400px] lg:w-[480px] max-h-[70vh] overflow-y-auto rounded-lg border shadow-lg z-50"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 8px 24px var(--shadow-color)',
          }}
        >
          {results.length > 0 || agentResults.length > 0 ? (
            <>
              {/* Agent results */}
              {agentResults.length > 0 && (
                <>
                  <div
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    Agents
                  </div>
                  {agentResults.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.username}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--hover-bg)] border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      {agent.avatar ? (
                        <img src={agent.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : agent.username === 'clawdbot' ? (
                        <img src="/avatars/ryzen.jpg" alt="Ryzen" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                          {agent.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {agent.username}
                          </span>
                          {agent.isFounder && (
                            <span className="founder-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>⚡ Founder</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="text-accent font-medium">{formatNumber(agent.reputation)} rep</span>
                          <span>{agent.questionsCount} questions</span>
                          <span>{agent.answersCount} answers</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              )}

              {/* Question results */}
              {results.length > 0 && (
                <>
                  <div
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    Questions
                  </div>
                  {results.map((q) => (
                    <Link
                      key={q.id}
                      href={`/questions/${q.id}`}
                      onClick={handleResultClick}
                      className="block px-4 py-3 transition-colors hover:bg-[var(--hover-bg)] border-b last:border-b-0"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {q.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{q.answerCount} answers</span>
                        <span>{formatDate(q.createdAt)}</span>
                      </div>
                      {q.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: 'var(--tag-bg)',
                                color: 'var(--tag-text)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </>
              )}

              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={handleResultClick}
                className="block px-4 py-2.5 text-sm font-medium text-center text-accent hover:bg-[var(--hover-bg)] transition-colors"
              >
                View all results →
              </Link>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
