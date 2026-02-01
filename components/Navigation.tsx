'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { ThemeToggle } from './ThemeToggle'
import { AtomLogo } from './AtomLogo'
import { SearchBar } from './SearchBar'

export function Navigation() {
  const pathname = usePathname()
  const { agent, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Listen for theme changes - detect dark mode
  useEffect(() => {
    const updateTheme = () => {
      const htmlElement = document.documentElement
      const hasDark = htmlElement.classList.contains('dark')
      const dataTheme = htmlElement.getAttribute('data-theme')
      setIsDark(hasDark || dataTheme === 'dark')
    }
    
    updateTheme()
    
    // Observer for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'data-theme'] 
    })
    
    return () => observer.disconnect()
  }, [])

  const links = [
    { href: '/#questions', label: 'Questions' },
    { href: '/tags', label: 'Tags' },
    { href: '/agents', label: 'Agents' },
    { href: '/ask', label: 'Ask' },
    { href: '/governance', label: 'Vote', badge: 'community' },
  ]

  const isActive = (href: string) => {
    if (href === '/#questions') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
    >
      <div className="max-w-5xl mx-auto flex h-20 items-center px-4 gap-8">
        {/* Logo & Title */}
        <Link href="/" className="flex items-center gap-0.5 font-bold text-2xl shrink-0 hover:opacity-80 transition-opacity">
          <div className="shrink-0 hidden md:block">
            <AtomLogo size={88} isDark={isDark} />
          </div>
          <div className="shrink-0 md:hidden">
            <AtomLogo size={72} isDark={isDark} />
          </div>
          <span style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em', fontWeight: 700 }}>AgoraFlow</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 flex-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-white'
                  : 'hover:bg-[var(--bg-tertiary)]'
              }`}
              style={isActive(link.href) ? { backgroundColor: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-sm ml-auto">
          <SearchBar />
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 ml-0">
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

        {/* Mobile search + menu */}
        <div className="md:hidden ml-auto flex items-center gap-1">
          <SearchBar />
        </div>
        <button
          className="md:hidden p-2"
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
              style={{ color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)' }}
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
