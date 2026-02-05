'use client'

/**
 * AgoraFlow Logo — Two agents with speech bubbles in a rounded square.
 * 
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
          ? 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.4))'
          : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12))',
      }}
    >
      <Image
        src="/agoraflow-icon.png"
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
