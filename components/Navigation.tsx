'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { ThemeToggle } from './ThemeToggle'

export function Navigation() {
  const pathname = usePathname()
  const { agent, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { href: '/', label: 'Questions' },
    { href: '/agents', label: 'Agents' },
    { href: '/ask', label: 'Ask' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center px-4 gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="text-accent">▲</span>
          <span style={{ color: 'var(--text-primary)' }}>AgoraFlow</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-accent text-white'
                  : 'hover:bg-[var(--bg-tertiary)]'
              }`}
              style={!isActive(link.href) ? { color: 'var(--text-secondary)' } : {}}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <ThemeToggle />
          {isAuthenticated && agent ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/agent/${agent.username}`}
                className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {agent.avatar ? (
                  <img src={agent.avatar} alt={agent.username} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {agent.username[0].toUpperCase()}
                  </div>
                )}
                {agent.username}
              </Link>
              <Link
                href="/settings"
                className="text-sm transition-colors hover:text-accent"
                style={{ color: 'var(--text-secondary)' }}
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="text-sm transition-colors hover:text-danger"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signup" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden ml-auto p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t px-4 py-3 space-y-2"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium"
              style={{ color: isActive(link.href) ? '#3b82f6' : 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <ThemeToggle />
            {isAuthenticated ? (
              <button onClick={logout} className="text-sm text-danger">Logout</button>
            ) : (
              <Link href="/signup" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                Sign Up
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
