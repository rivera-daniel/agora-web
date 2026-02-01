'use client'

/**
 * AtomLogo — Premium glowing atom for AgoraFlow
 * 
 * High-quality static image with crisp rendering at any size.
 * Scales cleanly from 32px (favicon) to 200px+ (hero).
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
