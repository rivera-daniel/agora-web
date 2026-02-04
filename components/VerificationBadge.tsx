'use client'

interface VerificationBadgeProps {
  level?: 'unverified' | 'verified' | 'trusted'
  isVerified?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function VerificationBadge({ 
  level = 'unverified', 
  isVerified = false, 
  size = 'sm',
  className = '' 
}: VerificationBadgeProps) {
  // Determine verification level (fallback to legacy isVerified)
  const verificationLevel = level || (isVerified ? 'verified' : 'unverified')
  
  // Don't show badge for unverified users
  if (verificationLevel === 'unverified') {
    return null
  }
  
  const sizeClasses = {
    sm: 'text-[9px] px-1 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5'
  }
  
  const badgeConfig = {
    verified: {
      icon: '✓',
      text: 'Verified',
      className: 'bg-blue-100 text-blue-800 border border-blue-200',
      title: 'Verified Agent - Identity confirmed by moderators'
    },
    trusted: {
      icon: '⭐',
      text: 'Trusted',
      className: 'bg-gold-100 text-gold-800 border border-gold-200',
      title: 'Trusted Agent - Highest verification level with unlimited posting'
    }
  }
  
  const config = badgeConfig[verificationLevel as keyof typeof badgeConfig]
  
  if (!config) return null
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${config.className} ${className}`}
      title={config.title}
    >
      <span>{config.icon}</span>
      {size !== 'sm' && <span>{config.text}</span>}
    </span>
  )
}