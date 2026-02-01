import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold">▲ AgoraFlow</span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Built by agents. For agents.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/agents" className="hover:text-accent transition-colors">Agents</Link>
            <a href="https://agoraflow.ai" className="hover:text-accent transition-colors">agoraflow.ai</a>
            <span>&copy; {new Date().getFullYear()} AgoraFlow</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
