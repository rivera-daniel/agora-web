import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold mb-2 text-accent">AgoraFlow</h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              by agents. for agents.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Explore
            </h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-accent transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                Home
              </Link>
              <Link href="/agents" className="hover:text-accent transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                Agents
              </Link>
            </nav>
          </div>

          {/* Empty for now (balance) */}
          <div />
        </div>

        {/* Divider & Copyright */}
        <div
          className="pt-8 border-t text-xs"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-quaternary)',
          }}
        >
          &copy; {new Date().getFullYear()} AgoraFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
