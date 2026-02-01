'use client'

import { cn, sanitizeLink } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Safe markdown renderer without dangerouslySetInnerHTML
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Parse markdown and return React elements (simplified version)
  const renderContent = () => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let currentParagraph: string[] = []

    const processParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ')
        elements.push(
          <p key={elements.length} className="mb-4 text-foreground/90">
            {processInlineElements(text)}
          </p>
        )
        currentParagraph = []
      }
    }

    const processInlineElements = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      let lastIndex = 0

      // Process bold text
      const boldRegex = /\*\*([^*]+)\*\*/g
      const italicRegex = /\*([^*]+)\*/g
      const codeRegex = /`([^`]+)`/g
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

      // Combine all patterns
      const combinedRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
      const matches = text.matchAll(combinedRegex)

      for (const match of matches) {
        // Add text before the match
        if (match.index! > lastIndex) {
          parts.push(text.slice(lastIndex, match.index))
        }

        const matchText = match[0]
        
        if (matchText.startsWith('**')) {
          // Bold
          parts.push(
            <strong key={`bold-${match.index}`} className="font-semibold">
              {matchText.slice(2, -2)}
            </strong>
          )
        } else if (matchText.startsWith('*')) {
          // Italic
          parts.push(
            <em key={`italic-${match.index}`} className="italic">
              {matchText.slice(1, -1)}
            </em>
          )
        } else if (matchText.startsWith('`')) {
          // Code
          parts.push(
            <code key={`code-${match.index}`} className="bg-muted px-1.5 py-0.5 rounded text-sm text-primary">
              {matchText.slice(1, -1)}
            </code>
          )
        } else if (matchText.startsWith('[')) {
          // Link
          const linkMatch = matchText.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            const [, linkText, href] = linkMatch
            const safeHref = sanitizeLink(href)
            parts.push(
              <a
                key={`link-${match.index}`}
                href={safeHref}
                className="text-primary hover:underline"
                rel="noopener noreferrer"
              >
                {linkText}
              </a>
            )
          }
        }

        lastIndex = match.index! + matchText.length
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts.length > 0 ? parts : [text]
    }

    for (const line of lines) {
      // Headers
      if (line.startsWith('# ')) {
        processParagraph()
        elements.push(
          <h1 key={elements.length} className="text-2xl font-bold mb-4">
            {processInlineElements(line.slice(2))}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        processParagraph()
        elements.push(
          <h2 key={elements.length} className="text-xl font-semibold mb-3">
            {processInlineElements(line.slice(3))}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        processParagraph()
        elements.push(
          <h3 key={elements.length} className="text-lg font-semibold mb-2">
            {processInlineElements(line.slice(4))}
          </h3>
        )
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        processParagraph()
        elements.push(
          <li key={elements.length} className="ml-4 list-disc">
            {processInlineElements(line.slice(2))}
          </li>
        )
      } else if (line.trim() === '') {
        processParagraph()
      } else {
        currentParagraph.push(line)
      }
    }

    processParagraph()

    return elements
  }

  return (
    <div className={cn('markdown-renderer', className)}>
      <div className="bg-info/10 border border-info/20 rounded p-3 mb-4 text-sm">
        ℹ️ For full markdown support, install react-markdown and rehype-sanitize packages.
      </div>
      <div className="prose prose-invert max-w-none">
        {renderContent()}
      </div>
    </div>
  )
}