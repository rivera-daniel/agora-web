'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Atom3D - Animated 3D atom logo for AgoraFlow
 * 
 * Pure Canvas 2D with 3D projection math (zero dependencies).
 * Renders:
 *   - Glowing nucleus sphere (#3b82f6 blue accent)
 *   - 3 electrons orbiting on different tilted planes
 *   - Thin orbital trail ellipses
 *   - Smooth continuous rotation (~35 sec full orbit)
 * 
 * Scales cleanly from 32px (nav) to 200px+ (hero).
 * Falls back to static SVG on canvas failure.
 */

// ─── 3D Math Helpers ────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }

function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos }
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos }
}

function rotateZ(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos, z: v.z }
}

function project(v: Vec3, fov: number, distance: number, center: number): { x: number; y: number; scale: number } {
  const factor = fov / (fov + v.z + distance)
  return { x: v.x * factor + center, y: v.y * factor + center, scale: factor }
}

// ─── Orbital config ─────────────────────────────────────────────

interface OrbitalConfig {
  tiltX: number
  tiltZ: number
  speed: number
  phase: number
}

const ORBITALS: OrbitalConfig[] = [
  { tiltX: 0,             tiltZ: 0,              speed: 1.0,  phase: 0 },
  { tiltX: Math.PI / 3,   tiltZ: Math.PI / 6,    speed: 0.85, phase: 2.1 },
  { tiltX: -Math.PI / 3,  tiltZ: -Math.PI / 6,   speed: 1.15, phase: 4.2 },
]

const ORBIT_RADIUS = 0.75  // normalized (0-1 space, will be scaled)
const NUCLEUS_RADIUS = 0.18
const ELECTRON_RADIUS = 0.05
const ORBIT_PERIOD = 35     // seconds for one full orbit
const ROTATION_SPEED = 0.15 // radians/sec for whole-atom Y rotation
const ORBIT_SEGMENTS = 80

// ─── Colors ─────────────────────────────────────────────────────

const BLUE_ACCENT = '#3b82f6'
const BLUE_DARKER = '#2563eb'
const BLUE_LIGHTER = '#60a5fa'
const BLUE_GLOW = 'rgba(59, 130, 246, 0.15)'
const BLUE_GLOW_STRONG = 'rgba(59, 130, 246, 0.3)'

// ─── Fallback SVG ───────────────────────────────────────────────

function FallbackLogo({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AgoraFlow Logo"
    >
      <circle cx="20" cy="20" r="4" fill={BLUE_ACCENT} opacity="0.9" />
      <ellipse cx="20" cy="20" rx="16" ry="6" stroke={BLUE_ACCENT} strokeWidth="0.8" fill="none" opacity="0.4" />
      <ellipse cx="20" cy="20" rx="16" ry="6" stroke={BLUE_ACCENT} strokeWidth="0.8" fill="none" opacity="0.4" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="6" stroke={BLUE_ACCENT} strokeWidth="0.8" fill="none" opacity="0.4" transform="rotate(-60 20 20)" />
      <circle cx="36" cy="20" r="1.5" fill={BLUE_DARKER} opacity="0.8" />
      <circle cx="12" cy="11" r="1.5" fill={BLUE_DARKER} opacity="0.8" />
      <circle cx="12" cy="29" r="1.5" fill={BLUE_DARKER} opacity="0.8" />
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────

interface Atom3DProps {
  size?: number
  className?: string
}

export function Atom3D({ size = 40, className = '' }: Atom3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const [canvasFailed, setCanvasFailed] = useState(false)

  // Visibility tracking for perf
  const isVisibleRef = useRef(true)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvasFailed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasFailed) return

    const ctx = canvas.getContext('2d')
    if (!ctx) { setCanvasFailed(true); return }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const center = size / 2
    const scale = size * 0.45 // How much of the canvas the atom fills
    const fov = 4
    const cameraDistance = 2.5
    // Scale rendering params so hero sizes (140+) look rich, not blurry
    const lineScale = Math.max(1, size / 60)

    let mounted = true
    const startTime = performance.now()

    // Reduce to 30fps on mobile for battery
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    const targetInterval = isMobile ? 1000 / 30 : 0
    let lastFrame = 0

    function drawCircle(x: number, y: number, radius: number, color: string, alpha: number = 1) {
      if (!ctx) return
      ctx.beginPath()
      ctx.arc(x, y, Math.max(radius, 0.5), 0, Math.PI * 2)
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function drawGlow(x: number, y: number, radius: number, color: string, alpha: number) {
      if (!ctx) return
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.globalAlpha = alpha
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function animate(now: number) {
      if (!mounted) return
      frameRef.current = requestAnimationFrame(animate)

      if (!isVisibleRef.current) return
      if (targetInterval > 0 && now - lastFrame < targetInterval) return
      lastFrame = now

      const elapsed = (now - startTime) / 1000
      const globalRotY = elapsed * ROTATION_SPEED
      const globalRotX = Math.sin(elapsed * 0.08) * 0.1

      // Clear
      ctx!.clearRect(0, 0, size, size)

      // Collect all drawable items with z-depth for proper ordering
      const drawables: Array<{
        z: number
        draw: () => void
      }> = []

      // --- Orbital rings ---
      ORBITALS.forEach((orbital) => {
        // Generate ring points in 3D, then project
        const points: Array<{ x: number; y: number; z: number }> = []
        for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
          const theta = (i / ORBIT_SEGMENTS) * Math.PI * 2
          let p: Vec3 = {
            x: Math.cos(theta) * ORBIT_RADIUS,
            y: 0,
            z: Math.sin(theta) * ORBIT_RADIUS,
          }
          // Apply orbital tilt
          p = rotateX(p, orbital.tiltX)
          p = rotateZ(p, orbital.tiltZ)
          // Apply global rotation
          p = rotateX(p, globalRotX)
          p = rotateY(p, globalRotY)
          
          const proj = project(p, fov, cameraDistance, center)
          points.push({ x: proj.x, y: proj.y, z: p.z })
        }

        // Average z for depth sorting
        const avgZ = points.reduce((s, p) => s + p.z, 0) / points.length

        drawables.push({
          z: avgZ,
          draw: () => {
            if (!ctx) return
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y)
            }
            ctx.strokeStyle = BLUE_ACCENT
            ctx.globalAlpha = 0.25
            ctx.lineWidth = 0.6 * lineScale
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        })
      })

      // --- Electrons ---
      ORBITALS.forEach((orbital) => {
        const angle = (elapsed / ORBIT_PERIOD) * Math.PI * 2 * orbital.speed + orbital.phase
        let p: Vec3 = {
          x: Math.cos(angle) * ORBIT_RADIUS,
          y: 0,
          z: Math.sin(angle) * ORBIT_RADIUS,
        }
        // Orbital tilt
        p = rotateX(p, orbital.tiltX)
        p = rotateZ(p, orbital.tiltZ)
        // Global rotation
        p = rotateX(p, globalRotX)
        p = rotateY(p, globalRotY)

        const proj = project(p, fov, cameraDistance, center)
        const eRadius = ELECTRON_RADIUS * scale * proj.scale

        drawables.push({
          z: p.z,
          draw: () => {
            // Electron glow
            drawGlow(proj.x, proj.y, eRadius * 2.5, BLUE_LIGHTER, 0.3 * proj.scale)
            // Electron body
            drawCircle(proj.x, proj.y, eRadius, BLUE_DARKER, 0.9)
          }
        })
      })

      // --- Nucleus ---
      {
        let p: Vec3 = { x: 0, y: 0, z: 0 }
        const proj = project(p, fov, cameraDistance, center)
        const nRadius = NUCLEUS_RADIUS * scale * proj.scale
        const pulse = 1 + Math.sin(elapsed * 2) * 0.04

        drawables.push({
          z: 0,
          draw: () => {
            // Outer glow
            drawGlow(proj.x, proj.y, nRadius * 2.2 * pulse, BLUE_ACCENT, 0.15)
            // Inner glow
            drawGlow(proj.x, proj.y, nRadius * 1.4 * pulse, BLUE_LIGHTER, 0.25)
            // Nucleus body
            drawCircle(proj.x, proj.y, nRadius * pulse, BLUE_ACCENT, 0.95)
            // Highlight
            drawCircle(proj.x - nRadius * 0.25, proj.y - nRadius * 0.25, nRadius * 0.3, '#93c5fd', 0.4)
          }
        })
      }

      // Sort back-to-front (painter's algorithm)
      drawables.sort((a, b) => a.z - b.z)
      drawables.forEach(d => d.draw())
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      mounted = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [size, canvasFailed])

  if (canvasFailed) {
    return <FallbackLogo size={size} />
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
      aria-label="AgoraFlow - Animated atom logo"
      role="img"
    />
  )
}
