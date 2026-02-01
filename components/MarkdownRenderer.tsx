'use client'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderContent = () => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeLines: string[] = []
    let currentParagraph: string[] = []

    const flush = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ')
        elements.push(<p key={elements.length}>{processInline(text)}</p>)
        currentParagraph = []
      }
    }

    const processInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      let lastIdx = 0
      const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
      const matches = text.matchAll(re)

      for (const m of matches) {
        if (m.index! > lastIdx) parts.push(text.slice(lastIdx, m.index))
        const s = m[0]
        if (s.startsWith('**')) {
          parts.push(<strong key={`b${m.index}`}>{s.slice(2, -2)}</strong>)
        } else if (s.startsWith('*')) {
          parts.push(<em key={`i${m.index}`}>{s.slice(1, -1)}</em>)
        } else if (s.startsWith('`')) {
          parts.push(<code key={`c${m.index}`}>{s.slice(1, -1)}</code>)
        } else if (s.startsWith('[')) {
          const lm = s.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (lm) {
            const href = lm[2].startsWith('http') || lm[2].startsWith('/') ? lm[2] : '#'
            parts.push(<a key={`a${m.index}`} href={href} rel="noopener noreferrer">{lm[1]}</a>)
          }
        }
        lastIdx = m.index! + s.length
      }
      if (lastIdx < text.length) parts.push(text.slice(lastIdx))
      return parts.length ? parts : [text]
    }

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(<pre key={elements.length}><code>{codeLines.join('\n')}</code></pre>)
          codeLines = []
          inCodeBlock = false
        } else {
          flush()
          inCodeBlock = true
        }
        continue
      }
      if (inCodeBlock) { codeLines.push(line); continue }

      if (line.startsWith('### ')) { flush(); elements.push(<h3 key={elements.length}>{processInline(line.slice(4))}</h3>) }
      else if (line.startsWith('## ')) { flush(); elements.push(<h2 key={elements.length}>{processInline(line.slice(3))}</h2>) }
      else if (line.startsWith('# ')) { flush(); elements.push(<h1 key={elements.length}>{processInline(line.slice(2))}</h1>) }
      else if (line.startsWith('- ') || line.startsWith('* ')) { flush(); elements.push(<li key={elements.length} className="ml-4 list-disc">{processInline(line.slice(2))}</li>) }
      else if (/^\d+\. /.test(line)) { flush(); elements.push(<li key={elements.length} className="ml-4 list-decimal">{processInline(line.replace(/^\d+\.\s/, ''))}</li>) }
      else if (line.startsWith('> ')) { flush(); elements.push(<blockquote key={elements.length}>{processInline(line.slice(2))}</blockquote>) }
      else if (line.trim() === '') { flush() }
      else { currentParagraph.push(line) }
    }
    flush()
    if (inCodeBlock && codeLines.length) {
      elements.push(<pre key={elements.length}><code>{codeLines.join('\n')}</code></pre>)
    }
    return elements
  }

  return (
    <div className={`prose-agora ${className}`}>
      {renderContent()}
    </div>
  )
}
