'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * AtomLogo — Animated 3D atom for AgoraFlow
 * 
 * Pure Canvas 2D with 3D projection. Zero dependencies.
 * 
 * Features:
 *   - Glowing nucleus with subtle pulse
 *   - 3 electrons on tilted orbital planes with depth-aware rendering
 *   - Thin orbital trail ellipses with depth gradient
 *   - Smooth continuous rotation
 *   - Electron trails (motion blur effect)
 *   - IntersectionObserver pauses when off-screen
 *   - 30fps cap on mobile, 60fps on desktop
 *   - Falls back to static SVG if canvas fails
 * 
 * Scales cleanly from 32px (favicon) to 200px+ (hero).
 */

// ─── 3D Math ────────────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }

const rotY = (v: Vec3, a: number): Vec3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c }
}
const rotX = (v: Vec3, a: number): Vec3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c }
}
const rotZ = (v: Vec3, a: number): Vec3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z }
}

const FOV = 4
const CAM_DIST = 2.5

function project(v: Vec3, center: number, scale: number) {
  const f = FOV / (FOV + v.z + CAM_DIST)
  return { x: v.x * scale * f + center, y: v.y * scale * f + center, s: f }
}

// ─── Orbital config ─────────────────────────────────────────────

const ORBITALS = [
  { tiltX: 0,             tiltZ: 0,           speed: 1.0,  phase: 0 },
  { tiltX: Math.PI / 3,   tiltZ: Math.PI / 6, speed: 0.8,  phase: 2.094 },
  { tiltX: -Math.PI / 3,  tiltZ: -Math.PI / 6,speed: 1.2,  phase: 4.189 },
]

const ORBIT_R = 0.78
const NUCLEUS_R = 0.16
const ELECTRON_R = 0.055
const ORBIT_PERIOD = 6       // seconds per full orbit (visible, satisfying speed)
const Y_ROT_SPEED = 0.25     // whole-atom rotation rad/s
const RING_SEGMENTS = 90
const TRAIL_LENGTH = 12       // trail dots behind electron

// ─── Theme-aware colors ─────────────────────────────────────────

interface ColorSet {
  nucleus: string
  nucleusInner: string
  electron: string
  electronGlow: string
  orbit: string
  orbitAlpha: number
  highlight: string
  glowColor: string
}

const DARK_COLORS: ColorSet = {
  nucleus: '#3b82f6',
  nucleusInner: '#60a5fa',
  electron: '#2563eb',
  electronGlow: 'rgba(96, 165, 250, 0.4)',
  orbit: '#3b82f6',
  orbitAlpha: 0.18,
  highlight: '#93c5fd',
  glowColor: 'rgba(59, 130, 246, 0)',
}

const LIGHT_COLORS: ColorSet = {
  nucleus: '#2563eb',
  nucleusInner: '#3b82f6',
  electron: '#1d4ed8',
  electronGlow: 'rgba(37, 99, 235, 0.35)',
  orbit: '#2563eb',
  orbitAlpha: 0.22,
  highlight: '#60a5fa',
  glowColor: 'rgba(37, 99, 235, 0)',
}

// ─── Fallback static SVG ────────────────────────────────────────

function AtomFallback({ size, isDark }: { size: number; isDark: boolean }) {
  const c = isDark ? DARK_COLORS : LIGHT_COLORS
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AgoraFlow">
      <circle cx="20" cy="20" r="3.5" fill={c.nucleus} opacity="0.9" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(-60 20 20)" />
      <circle cx="36" cy="20" r="1.5" fill={c.electron} opacity="0.85" />
      <circle cx="12" cy="11.1" r="1.5" fill={c.electron} opacity="0.85" />
      <circle cx="12" cy="28.9" r="1.5" fill={c.electron} opacity="0.85" />
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────

interface AtomLogoProps {
  size?: number
  className?: string
  isDark?: boolean
}

export function AtomLogo({ size = 40, className = '', isDark = true }: AtomLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const [canvasFailed, setCanvasFailed] = useState(false)
  const visibleRef = useRef(true)

  // Visibility tracking
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting }, { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [canvasFailed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasFailed) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) { setCanvasFailed(true); return }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const center = size / 2
    const scale = size * 0.44
    const lineW = Math.max(0.5, size / 70)

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS

    let mounted = true
    const t0 = performance.now()
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent)
    const interval = isMobile ? 1000 / 30 : 0
    let lastT = 0

    // ─ drawing helpers ─

    function circle(x: number, y: number, r: number, color: string, alpha = 1) {
      ctx!.beginPath()
      ctx!.arc(x, y, Math.max(r, 0.3), 0, Math.PI * 2)
      ctx!.globalAlpha = alpha
      ctx!.fillStyle = color
      ctx!.fill()
      ctx!.globalAlpha = 1
    }

    function glow(x: number, y: number, r: number, color: string, edgeColor: string, alpha: number) {
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, color)
      g.addColorStop(1, edgeColor)
      ctx!.beginPath()
      ctx!.arc(x, y, r, 0, Math.PI * 2)
      ctx!.globalAlpha = alpha
      ctx!.fillStyle = g
      ctx!.fill()
      ctx!.globalAlpha = 1
    }

    // Transform a point through orbital tilt + global rotation
    function transform(p: Vec3, tiltX: number, tiltZ: number, gRotX: number, gRotY: number): Vec3 {
      let v = rotX(p, tiltX)
      v = rotZ(v, tiltZ)
      v = rotX(v, gRotX)
      v = rotY(v, gRotY)
      return v
    }

    // ─ animation loop ─

    function frame(now: number) {
      if (!mounted) return
      frameRef.current = requestAnimationFrame(frame)
      if (!visibleRef.current) return
      if (interval > 0 && now - lastT < interval) return
      lastT = now

      const t = (now - t0) / 1000
      const gRotY = t * Y_ROT_SPEED
      const gRotX = Math.sin(t * 0.09) * 0.12 // gentle nod

      ctx!.clearRect(0, 0, size, size)

      // Collect drawables for depth sort
      type Drawable = { z: number; draw: () => void }
      const items: Drawable[] = []

      // ── orbital rings (split into front/back halves for nucleus occlusion) ──
      for (const orb of ORBITALS) {
        const pts: { x: number; y: number; z3: number }[] = []
        for (let i = 0; i <= RING_SEGMENTS; i++) {
          const θ = (i / RING_SEGMENTS) * Math.PI * 2
          const v = transform({ x: Math.cos(θ) * ORBIT_R, y: 0, z: Math.sin(θ) * ORBIT_R }, orb.tiltX, orb.tiltZ, gRotX, gRotY)
          const p = project(v, center, scale)
          pts.push({ x: p.x, y: p.y, z3: v.z })
        }

        // Draw ring as two halves: back (behind nucleus) and front
        const backPts = pts.filter(p => p.z3 <= 0)
        const frontPts = pts.filter(p => p.z3 > 0)

        // Back half (draw before nucleus)
        if (backPts.length > 1) {
          items.push({
            z: -1,
            draw: () => {
              ctx!.beginPath()
              ctx!.moveTo(backPts[0].x, backPts[0].y)
              for (let i = 1; i < backPts.length; i++) ctx!.lineTo(backPts[i].x, backPts[i].y)
              ctx!.strokeStyle = colors.orbit
              ctx!.globalAlpha = colors.orbitAlpha * 0.6
              ctx!.lineWidth = lineW * 0.8
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }

        // Front half (draw after nucleus)
        if (frontPts.length > 1) {
          items.push({
            z: 1,
            draw: () => {
              ctx!.beginPath()
              ctx!.moveTo(frontPts[0].x, frontPts[0].y)
              for (let i = 1; i < frontPts.length; i++) ctx!.lineTo(frontPts[i].x, frontPts[i].y)
              ctx!.strokeStyle = colors.orbit
              ctx!.globalAlpha = colors.orbitAlpha
              ctx!.lineWidth = lineW
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }
      }

      // ── electrons + trails ──
      for (const orb of ORBITALS) {
        const angle = (t / ORBIT_PERIOD) * Math.PI * 2 * orb.speed + orb.phase

        // Trail (ghost dots behind electron)
        for (let i = TRAIL_LENGTH; i >= 1; i--) {
          const trailAngle = angle - i * 0.06
          const v = transform({ x: Math.cos(trailAngle) * ORBIT_R, y: 0, z: Math.sin(trailAngle) * ORBIT_R }, orb.tiltX, orb.tiltZ, gRotX, gRotY)
          const p = project(v, center, scale)
          const trailR = ELECTRON_R * scale * p.s * (1 - i / (TRAIL_LENGTH + 1)) * 0.7
          const trailAlpha = (1 - i / (TRAIL_LENGTH + 1)) * 0.25

          items.push({
            z: v.z,
            draw: () => circle(p.x, p.y, trailR, colors.electron, trailAlpha)
          })
        }

        // Electron body
        const v = transform({ x: Math.cos(angle) * ORBIT_R, y: 0, z: Math.sin(angle) * ORBIT_R }, orb.tiltX, orb.tiltZ, gRotX, gRotY)
        const p = project(v, center, scale)
        const eR = ELECTRON_R * scale * p.s

        items.push({
          z: v.z,
          draw: () => {
            // Glow
            glow(p.x, p.y, eR * 3, colors.electronGlow, colors.glowColor, 0.6)
            // Body
            circle(p.x, p.y, eR, colors.electron, 0.95)
            // Tiny highlight
            if (eR > 1.2) {
              circle(p.x - eR * 0.2, p.y - eR * 0.2, eR * 0.35, colors.highlight, 0.35)
            }
          }
        })
      }

      // ── nucleus ──
      {
        const p = project({ x: 0, y: 0, z: 0 }, center, scale)
        const nR = NUCLEUS_R * scale * p.s
        const pulse = 1 + Math.sin(t * 1.8) * 0.035

        items.push({
          z: 0,
          draw: () => {
            // Outer glow
            glow(p.x, p.y, nR * 2.5 * pulse, colors.nucleus, colors.glowColor, 0.12)
            // Inner glow
            glow(p.x, p.y, nR * 1.5 * pulse, colors.nucleusInner, colors.glowColor, 0.25)
            // Body
            circle(p.x, p.y, nR * pulse, colors.nucleus, 0.95)
            // Highlight
            if (nR > 2) {
              circle(p.x - nR * 0.22, p.y - nR * 0.22, nR * 0.28, colors.highlight, 0.3)
            }
          }
        })
      }

      // Sort back to front, draw
      items.sort((a, b) => a.z - b.z)
      for (const item of items) item.draw()
    }

    frameRef.current = requestAnimationFrame(frame)
    return () => {
      mounted = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [size, canvasFailed, isDark])

  if (canvasFailed) return <AtomFallback size={size} isDark={isDark} />

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
      aria-label="AgoraFlow"
      role="img"
    />
  )
}
