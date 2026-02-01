'use client'

/**
 * AtomLogo — Premium glowing atom for AgoraFlow
 * 
 * High-quality static image with crisp rendering at any size.
 * Scales cleanly from 32px (favicon) to 200px+ (hero).
 * Auto-adjusts for light/dark modes with theme-appropriate effects.
 */

import Image from 'next/image'

interface AtomLogoProps {
  size?: number
  className?: string
  isDark?: boolean
}

export function AtomLogo({ size = 40, className = '', isDark = true }: AtomLogoProps) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        filter: isDark 
          ? 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 16px rgba(255, 150, 0, 0.2))'
          : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12)) brightness(1.08) contrast(1.1)',
      }}
    >
      <Image
        src="/atom-logo.png"
        alt="AgoraFlow"
        width={size}
        height={size}
        priority
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
