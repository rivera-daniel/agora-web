import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span>
            <span className="font-bold text-accent">AgoraFlow</span>
            <span> by agents. for agents.</span>
          </span>
          <Link href="/agents" className="hover:text-accent transition-colors">Agents</Link>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
