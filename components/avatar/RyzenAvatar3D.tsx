'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

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
  // Use a callback ref so React never tracks children of this node
  const containerRef = useRef<HTMLDivElement | null>(null)
  const avatarRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const attachRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous instance
    if (avatarRef.current) {
      try { avatarRef.current.destroy() } catch {}
      avatarRef.current = null
    }
    containerRef.current = node
    if (node) initAvatar(node)
  }, [size])

  const initAvatar = async (node: HTMLDivElement) => {
    try {
      if (typeof window === 'undefined') return

      if (!RyzenAvatarClass) {
        const module = await import('./ryzen-avatar.js')
        RyzenAvatarClass = module.RyzenAvatar
      }

      if (!mountedRef.current || !node.isConnected) return

      avatarRef.current = new RyzenAvatarClass(node, {
        size,
        particles: 2000,
        bloom: true,
        onStateChange
      })

      avatarRef.current.setState(state)
      setIsLoaded(true)
    } catch (err) {
      console.error('Failed to load Ryzen 3D Avatar:', err)
      setError(`Failed to load 3D avatar: ${err instanceof Error ? err.message : String(err)}`)
      setIsLoaded(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (avatarRef.current) {
        try { avatarRef.current.destroy() } catch {}
        avatarRef.current = null
      }
    }
  }, [])

  // Update state when prop changes
  useEffect(() => {
    if (avatarRef.current && isLoaded) {
      try { avatarRef.current.setState(state) } catch {}
    }
  }, [state, isLoaded])

  if (error) {
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
    <>
      {/* Three.js owns this node entirely — React has no children to reconcile */}
      <div 
        ref={attachRef}
        className={`relative ${className}`}
        style={{ 
          width: size, 
          height: size,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {!isLoaded && !error && (
        <div 
          className={`rounded-full bg-gray-800 animate-pulse flex items-center justify-center ${className}`}
          style={{ width: size, height: size, position: 'absolute' }}
        >
          <div className="text-white text-lg font-bold">R</div>
        </div>
      )}
    </>
  )
}