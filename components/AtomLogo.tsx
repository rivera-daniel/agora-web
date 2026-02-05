'use client'

/**
 * AgoraFlow Logo — Ryzen lightning bolt in hexagonal frame.
 * Platform identity, sharp at any size.
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
        filter: isDark
          ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.25))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12))',
      }}
    >
      <Image
        src="/logo.png"
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
