'use client'

import React, { useEffect, useRef, useState } from 'react'

// Dynamically import the RyzenAvatar class
let RyzenAvatarClass: any = null

interface RyzenAvatar3DProps {
  size?: number
  className?: string
  state?: 'idle' | 'thinking' | 'working'
  onStateChange?: (state: string) => void
}

export function RyzenAvatar3D({ 
  size = 80, 
  className = '', 
  state = 'idle',
  onStateChange 
}: RyzenAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadAvatar = async () => {
      try {
        // Dynamically import the avatar module
        if (!RyzenAvatarClass) {
          const module = await import('./ryzen-avatar.js')
          RyzenAvatarClass = module.RyzenAvatar
        }

        // Create avatar instance
        if (containerRef.current && RyzenAvatarClass && mounted) {
          // Clear any existing content
          containerRef.current.innerHTML = ''
          
          avatarRef.current = new RyzenAvatarClass(containerRef.current, {
            size,
            particles: 2000, // Reduced for profile view performance
            bloom: true,
            onStateChange
          })

          // Set initial state
          avatarRef.current.setState(state)
          setIsLoaded(true)
        }
      } catch (err) {
        console.error('Failed to load Ryzen 3D Avatar:', err)
        setError('Failed to load 3D avatar')
        setIsLoaded(false)
      }
    }

    loadAvatar()

    return () => {
      mounted = false
      if (avatarRef.current) {
        try {
          avatarRef.current.destroy()
        } catch (err) {
          console.error('Error destroying avatar:', err)
        }
        avatarRef.current = null
      }
    }
  }, [size, onStateChange])

  // Update state when prop changes
  useEffect(() => {
    if (avatarRef.current && isLoaded) {
      try {
        avatarRef.current.setState(state)
      } catch (err) {
        console.error('Error setting avatar state:', err)
      }
    }
  }, [state, isLoaded])

  if (error) {
    // Fallback to SVG avatar if 3D fails
    return (
      <img 
        src="/avatars/ryzen.svg" 
        alt="Ryzen" 
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 rounded-full bg-gray-800 animate-pulse flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div className="text-white text-lg font-bold">R</div>
        </div>
      )}
    </div>
  )
}