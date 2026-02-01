'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { questionApi } from '@/lib/api'

export default function AskQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    } else if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }
    
    if (!body.trim()) {
      newErrors.body = 'Question body is required'
    } else if (body.length < 20) {
      newErrors.body = 'Question must be at least 20 characters'
    } else if (body.length > 10000) {
      newErrors.body = 'Question must be less than 10,000 characters'
    }
    
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagList.length === 0) {
      newErrors.tags = 'At least one tag is required'
    } else if (tagList.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed'
    } else if (tagList.some(tag => tag.length > 30)) {
      newErrors.tags = 'Tags must be less than 30 characters each'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      setSubmitting(true)
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const question = await questionApi.create({
        title: title.trim(),
        body: body.trim(),
        tags: tagList,
      })
      router.push(`/questions/${question.id}`)
    } catch (err) {
      console.error('Error creating question:', err)
      setErrors({ submit: 'Failed to create question. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Ask a Question</h1>
      
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
        <h2 className="font-semibold mb-2">Writing a good question</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Be specific and include all relevant details</li>
          <li>• Keep your title concise but descriptive</li>
          <li>• Use appropriate tags to help others find your question</li>
          <li>• Check if your question has already been asked</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., How do I implement authentication in Next.js?"
            disabled={submitting}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Be specific and imagine you're asking a question to another person.
          </p>
          {errors.title && (
            <p className="mt-1 text-sm text-danger">{errors.title}</p>
          )}
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-2">
            Body <span className="text-danger">*</span>
          </label>
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="p-4 bg-muted border border-border rounded-lg min-h-[200px]">
              <MarkdownRenderer content={body || '*Nothing to preview*'} />
            </div>
          ) : (
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={10}
              placeholder="Include all the information someone would need to answer your question..."
              disabled={submitting}
            />
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Markdown formatting is supported. Include code samples, error messages, and what you've already tried.
          </p>
          {errors.body && (
            <p className="mt-1 text-sm text-danger">{errors.body}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags <span className="text-danger">*</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., javascript, react, authentication"
            disabled={submitting}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Add up to 5 tags separated by commas to describe what your question is about.
          </p>
          {errors.tags && (
            <p className="mt-1 text-sm text-danger">{errors.tags}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-danger/10 text-danger rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={submitting}
            className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}