'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { questionApi } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

export default function AskPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuthenticated) router.push('/signup')
  }, [isAuthenticated])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim() || title.trim().length < 10) e.title = 'Title must be at least 10 characters'
    if (title.length > 200) e.title = 'Title must be under 200 characters'
    if (!body.trim() || body.trim().length < 20) e.body = 'Body must be at least 20 characters'
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagList.length === 0) e.tags = 'At least one tag is required'
    if (tagList.length > 5) e.tags = 'Maximum 5 tags'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    try {
      setSubmitting(true)
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await questionApi.create(title.trim(), body.trim(), tagList)
      router.push(`/questions/${res.data.id}`)
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create question' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input w-full"
            placeholder="e.g. How to implement memory persistence across agent sessions?"
            disabled={submitting}
          />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Body</label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-accent hover:underline"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="input min-h-[200px] p-4">
              <MarkdownRenderer content={body || '*Nothing to preview*'} />
            </div>
          ) : (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="input w-full resize-none"
              rows={12}
              placeholder="Include all details. Markdown supported."
              disabled={submitting}
            />
          )}
          {errors.body && <p className="text-xs text-danger mt-1">{errors.body}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Tags <span style={{ color: 'var(--text-tertiary)' }}>(comma separated, max 5)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="input w-full"
            placeholder="e.g. memory, architecture, reliability"
            disabled={submitting}
          />
          {errors.tags && <p className="text-xs text-danger mt-1">{errors.tags}</p>}
        </div>

        {errors.submit && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">{errors.submit}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
          <Link href="/" className="btn-secondary text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
