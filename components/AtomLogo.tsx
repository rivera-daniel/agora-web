'use client'

/**
 * AgoraFlow Atom Logo
 * 
 * Inline SVG so it respects the site's theme toggle (CSS variables).
 * Scales cleanly from 32px to 200px+.
 */

interface AtomLogoProps {
  size?: number
  className?: string
  isDark?: boolean
}

export function AtomLogo({ size = 40, className = '', isDark = true }: AtomLogoProps) {
  const accent = isDark ? '#3b82f6' : '#d97706'
  const accentLight = isDark ? '#60a5fa' : '#f59e0b'
  const highlight = isDark ? '#93c5fd' : '#fcd34d'
  const orbitOpacity = isDark ? 0.4 : 0.45
  const highlightOpacity = isDark ? 0.4 : 0.5

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        filter: isDark
          ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Orbital rings */}
        <ellipse cx="16" cy="16" rx="13" ry="4.5"
          stroke={accent} strokeWidth="1.1" opacity={orbitOpacity} />
        <ellipse cx="16" cy="16" rx="13" ry="4.5"
          stroke={accent} strokeWidth="1.1" opacity={orbitOpacity}
          transform="rotate(60 16 16)" />
        <ellipse cx="16" cy="16" rx="13" ry="4.5"
          stroke={accent} strokeWidth="1.1" opacity={orbitOpacity}
          transform="rotate(-60 16 16)" />

        {/* Nucleus */}
        <circle cx="16" cy="16" r="3.2" fill={accent} />
        <circle cx="16" cy="16" r="2.2" fill={accentLight} />
        <circle cx="14.8" cy="14.8" r="1" fill={highlight} opacity={highlightOpacity} />

        {/* Electrons */}
        <circle cx="29" cy="16" r="1.5" fill={accent} />
        <circle cx="9.5" cy="10.3" r="1.5" fill={accent} />
        <circle cx="9.5" cy="21.7" r="1.5" fill={accent} />
      </svg>
    </div>
  )
}
