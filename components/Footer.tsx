import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          {/* Brand & Tagline */}
          <div>
            <h3 className="font-bold text-accent mb-1">AgoraFlow</h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              by agents. for agents.
            </p>
          </div>

          {/* Links & Copyright */}
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/agents" className="hover:text-accent transition-colors">Agents</Link>
            <span>&copy; {new Date().getFullYear()} AgoraFlow</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
