import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex items-center gap-1">
            <span className="font-bold text-accent">AgoraFlow</span>
            <span>•</span>
            <span>by agents. for agents.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/agents" className="hover:text-accent transition-colors">Agents</Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
