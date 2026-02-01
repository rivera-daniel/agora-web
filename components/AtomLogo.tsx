'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * AtomLogo — Premium Animated 3D atom for AgoraFlow
 * 
 * Pure Canvas 2D with 3D projection. Zero dependencies.
 * 
 * Features:
 *   - Breathing nucleus with layered bloom/glow
 *   - 3 electrons on wobbly, organic orbital paths
 *   - Long motion-blur trails with directional elongation
 *   - Color-shifting electrons (each with its own hue drift)
 *   - Energy particles / sparks shedding off electrons
 *   - Hover interaction: nucleus expands, orbits speed up, glow intensifies
 *   - Depth-aware rendering with enhanced depth fog
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
  { tiltX: 0.05,           tiltZ: 0.03,          speed: 1.0,  phase: 0,     hueOffset: 0 },
  { tiltX: Math.PI / 3,    tiltZ: Math.PI / 6,   speed: 0.78, phase: 2.094, hueOffset: 25 },
  { tiltX: -Math.PI / 3,   tiltZ: -Math.PI / 6,  speed: 1.15, phase: 4.189, hueOffset: -15 },
]

const ORBIT_R = 0.78
const NUCLEUS_R = 0.17
const ELECTRON_R = 0.06
const ORBIT_PERIOD = 5.5       // seconds per full orbit
const Y_ROT_SPEED = 0.3        // whole-atom rotation rad/s
const RING_SEGMENTS = 120
const TRAIL_LENGTH = 22         // longer trail for motion blur effect
// ─── Noise helper (cheap deterministic wobble) ──────────────────

function noise(t: number, freq: number, amp: number): number {
  return Math.sin(t * freq) * amp +
    Math.sin(t * freq * 1.7 + 1.3) * amp * 0.5 +
    Math.sin(t * freq * 3.1 + 2.7) * amp * 0.2
}

// ─── Theme-aware colors ─────────────────────────────────────────

interface ColorSet {
  nucleusCore: string
  nucleusMiddle: string
  nucleusOuter: string
  electronBase: [number, number, number] // HSL base
  orbit: string
  orbitAlpha: number
  highlight: string
  glowColorBase: string
  sparkColor: string
  bgTint: string
}

const DARK_COLORS: ColorSet = {
  nucleusCore: '#93c5fd',
  nucleusMiddle: '#3b82f6',
  nucleusOuter: '#1d4ed8',
  electronBase: [217, 91, 60], // HSL blue
  orbit: '#3b82f6',
  orbitAlpha: 0.2,
  highlight: '#bfdbfe',
  glowColorBase: 'rgba(59, 130, 246, 0)',
  sparkColor: '#93c5fd',
  bgTint: 'rgba(59, 130, 246, 0.03)',
}

const LIGHT_COLORS: ColorSet = {
  nucleusCore: '#3b82f6',
  nucleusMiddle: '#2563eb',
  nucleusOuter: '#1e40af',
  electronBase: [221, 83, 53],
  orbit: '#2563eb',
  orbitAlpha: 0.25,
  highlight: '#60a5fa',
  glowColorBase: 'rgba(37, 99, 235, 0)',
  sparkColor: '#60a5fa',
  bgTint: 'rgba(37, 99, 235, 0.02)',
}

// ─── Fallback static SVG ────────────────────────────────────────

function AtomFallback({ size, isDark }: { size: number; isDark: boolean }) {
  const c = isDark ? DARK_COLORS : LIGHT_COLORS
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AgoraFlow">
      <circle cx="20" cy="20" r="3.5" fill={c.nucleusMiddle} opacity="0.9" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.orbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(-60 20 20)" />
      <circle cx="36" cy="20" r="1.5" fill={c.orbit} opacity="0.85" />
      <circle cx="12" cy="11.1" r="1.5" fill={c.orbit} opacity="0.85" />
      <circle cx="12" cy="28.9" r="1.5" fill={c.orbit} opacity="0.85" />
    </svg>
  )
}

// ─── Spark particle system ──────────────────────────────────────

interface Spark {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
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
  const hoverRef = useRef(false)
  const hoverAmtRef = useRef(0) // smooth 0→1 interpolation

  // Hover handlers
  const onEnter = useCallback(() => { hoverRef.current = true }, [])
  const onLeave = useCallback(() => { hoverRef.current = false }, [])

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
    const lineW = Math.max(0.5, size / 65)
    const isLarge = size >= 56 // enable extra effects for larger sizes

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS

    // Spark pool
    const sparks: Spark[] = []
    const MAX_SPARKS = isLarge ? 30 : 12

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

    function layeredGlow(x: number, y: number, baseR: number, color1: string, color2: string, color3: string) {
      // Three-layer bloom for premium look
      glow(x, y, baseR * 4, color1, 'rgba(0,0,0,0)', 0.06)
      glow(x, y, baseR * 2.5, color2, 'rgba(0,0,0,0)', 0.12)
      glow(x, y, baseR * 1.5, color3, 'rgba(0,0,0,0)', 0.2)
    }

    // Elongated trail dot (motion blur direction)
    function trailDot(x: number, y: number, r: number, angle: number, elongation: number, color: string, alpha: number) {
      ctx!.save()
      ctx!.translate(x, y)
      ctx!.rotate(angle)
      ctx!.beginPath()
      ctx!.ellipse(0, 0, Math.max(r * elongation, 0.3), Math.max(r, 0.3), 0, 0, Math.PI * 2)
      ctx!.globalAlpha = alpha
      ctx!.fillStyle = color
      ctx!.fill()
      ctx!.restore()
    }

    // HSL to CSS string
    function hsl(h: number, s: number, l: number, a = 1): string {
      return `hsla(${h}, ${s}%, ${l}%, ${a})`
    }

    // Transform a point through orbital tilt + global rotation
    function transform(p: Vec3, tiltX: number, tiltZ: number, gRotX: number, gRotY: number): Vec3 {
      let v = rotX(p, tiltX)
      v = rotZ(v, tiltZ)
      v = rotX(v, gRotX)
      v = rotY(v, gRotY)
      return v
    }

    // Emit sparks from position
    function emitSpark(x: number, y: number, vx: number, vy: number) {
      if (sparks.length >= MAX_SPARKS) {
        // Recycle oldest dead spark
        const dead = sparks.findIndex(s => s.life <= 0)
        if (dead >= 0) {
          sparks[dead] = { x, y, vx: vx + (Math.random() - 0.5) * 0.8, vy: vy + (Math.random() - 0.5) * 0.8, life: 1, maxLife: 1, size: Math.random() * 1.5 + 0.5 }
        }
        return
      }
      sparks.push({ x, y, vx: vx + (Math.random() - 0.5) * 0.8, vy: vy + (Math.random() - 0.5) * 0.8, life: 1, maxLife: 1, size: Math.random() * 1.5 + 0.5 })
    }

    // ─ animation loop ─

    function frame(now: number) {
      if (!mounted) return
      frameRef.current = requestAnimationFrame(frame)
      if (!visibleRef.current) return
      if (interval > 0 && now - lastT < interval) return
      lastT = now

      const dt = 1 / 60
      const t = (now - t0) / 1000

      // Smooth hover interpolation
      const hTarget = hoverRef.current ? 1 : 0
      hoverAmtRef.current += (hTarget - hoverAmtRef.current) * 0.08
      const hAmt = hoverAmtRef.current

      const gRotY = t * (Y_ROT_SPEED + hAmt * 0.15)
      const gRotX = Math.sin(t * 0.09) * 0.12 + Math.sin(t * 0.23) * 0.04

      ctx!.clearRect(0, 0, size, size)

      // Collect drawables for depth sort
      type Drawable = { z: number; draw: () => void }
      const items: Drawable[] = []

      // Global time-based hue shift (subtle)
      const globalHueShift = Math.sin(t * 0.3) * 8

      // ── orbital rings (wobbly, organic) ──
      for (const orb of ORBITALS) {
        const pts: { x: number; y: number; z3: number }[] = []
        for (let i = 0; i <= RING_SEGMENTS; i++) {
          const θ = (i / RING_SEGMENTS) * Math.PI * 2
          // Wobble the orbit radius organically
          const wobble = 1 + noise(t * 0.5 + θ * 2 + orb.phase, 1.7, 0.025) + noise(t * 0.8 + θ * 3, 2.3, 0.015)
          const r = ORBIT_R * wobble
          const v = transform(
            { x: Math.cos(θ) * r, y: noise(t * 0.3 + θ * 1.5 + orb.phase, 2.0, 0.012), z: Math.sin(θ) * r },
            orb.tiltX, orb.tiltZ, gRotX, gRotY
          )
          const p = project(v, center, scale)
          pts.push({ x: p.x, y: p.y, z3: v.z })
        }

        // Draw ring as two halves for depth
        const backPts = pts.filter(p => p.z3 <= 0)
        const frontPts = pts.filter(p => p.z3 > 0)

        if (backPts.length > 1) {
          items.push({
            z: -1,
            draw: () => {
              ctx!.beginPath()
              ctx!.moveTo(backPts[0].x, backPts[0].y)
              for (let i = 1; i < backPts.length; i++) ctx!.lineTo(backPts[i].x, backPts[i].y)
              ctx!.strokeStyle = colors.orbit
              ctx!.globalAlpha = colors.orbitAlpha * 0.45
              ctx!.lineWidth = lineW * 0.7
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }

        if (frontPts.length > 1) {
          items.push({
            z: 1,
            draw: () => {
              // Glowing orbit lines
              ctx!.beginPath()
              ctx!.moveTo(frontPts[0].x, frontPts[0].y)
              for (let i = 1; i < frontPts.length; i++) ctx!.lineTo(frontPts[i].x, frontPts[i].y)
              // Outer glow pass
              if (isLarge) {
                ctx!.strokeStyle = colors.orbit
                ctx!.globalAlpha = colors.orbitAlpha * 0.3
                ctx!.lineWidth = lineW * 3
                ctx!.stroke()
              }
              // Main line
              ctx!.beginPath()
              ctx!.moveTo(frontPts[0].x, frontPts[0].y)
              for (let i = 1; i < frontPts.length; i++) ctx!.lineTo(frontPts[i].x, frontPts[i].y)
              ctx!.strokeStyle = colors.orbit
              ctx!.globalAlpha = colors.orbitAlpha * (1 + hAmt * 0.3)
              ctx!.lineWidth = lineW * (1 + hAmt * 0.2)
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }
      }

      // ── electrons + motion blur trails ──
      for (let oi = 0; oi < ORBITALS.length; oi++) {
        const orb = ORBITALS[oi]
        const baseSpeed = orb.speed * (1 + hAmt * 0.3)
        const angle = (t / ORBIT_PERIOD) * Math.PI * 2 * baseSpeed + orb.phase

        // Per-electron hue shift
        const eHue = colors.electronBase[0] + orb.hueOffset + globalHueShift + Math.sin(t * 0.7 + oi * 2) * 12
        const eSat = colors.electronBase[1]
        const eLit = colors.electronBase[2]

        // Compute current and previous positions for motion direction
        const wobbleR = 1 + noise(t * 0.5 + angle * 2 + orb.phase, 1.7, 0.025)
        const curV = transform(
          { x: Math.cos(angle) * ORBIT_R * wobbleR, y: noise(t * 0.3 + angle * 1.5 + orb.phase, 2.0, 0.012), z: Math.sin(angle) * ORBIT_R * wobbleR },
          orb.tiltX, orb.tiltZ, gRotX, gRotY
        )
        const curP = project(curV, center, scale)

        const prevAngle = angle - 0.15
        const prevWobbleR = 1 + noise(t * 0.5 + prevAngle * 2 + orb.phase, 1.7, 0.025)
        const prevV = transform(
          { x: Math.cos(prevAngle) * ORBIT_R * prevWobbleR, y: noise(t * 0.3 + prevAngle * 1.5 + orb.phase, 2.0, 0.012), z: Math.sin(prevAngle) * ORBIT_R * prevWobbleR },
          orb.tiltX, orb.tiltZ, gRotX, gRotY
        )
        const prevP = project(prevV, center, scale)

        // Motion direction for elongation
        const dx = curP.x - prevP.x
        const dy = curP.y - prevP.y
        const motionAngle = Math.atan2(dy, dx)

        // Trail (elongated motion-blur dots)
        const trailCount = isLarge ? TRAIL_LENGTH : Math.min(TRAIL_LENGTH, 14)
        for (let i = trailCount; i >= 1; i--) {
          const trailAngle = angle - i * 0.055
          const tw = 1 + noise(t * 0.5 + trailAngle * 2 + orb.phase, 1.7, 0.025)
          const v = transform(
            { x: Math.cos(trailAngle) * ORBIT_R * tw, y: noise(t * 0.3 + trailAngle * 1.5 + orb.phase, 2.0, 0.012), z: Math.sin(trailAngle) * ORBIT_R * tw },
            orb.tiltX, orb.tiltZ, gRotX, gRotY
          )
          const p = project(v, center, scale)

          const progress = 1 - i / (trailCount + 1)
          const trailR = ELECTRON_R * scale * p.s * progress * 0.65
          // Trail fades from electron color to transparent, with elongation
          const trailAlpha = progress * progress * 0.35
          const elongation = 1.5 + (1 - progress) * 1.5 // more elongated further back
          const trailHue = eHue + i * 0.8 // slight rainbow shift along trail
          const trailLit = eLit + (1 - progress) * 15

          items.push({
            z: v.z,
            draw: () => {
              trailDot(p.x, p.y, trailR, motionAngle, elongation, hsl(trailHue, eSat, trailLit), trailAlpha)
            }
          })
        }

        // Electron body
        const eR = ELECTRON_R * scale * curP.s * (1 + hAmt * 0.15)
        const eColor = hsl(eHue, eSat, eLit)
        const eGlow = hsl(eHue, eSat, eLit + 15, 0.4)
        const eBright = hsl(eHue, eSat - 10, eLit + 30)

        items.push({
          z: curV.z,
          draw: () => {
            // Multi-layer glow
            if (isLarge) {
              layeredGlow(curP.x, curP.y, eR, hsl(eHue, eSat, eLit + 10, 0.08), hsl(eHue, eSat, eLit, 0.15), eGlow)
            } else {
              glow(curP.x, curP.y, eR * 3, eGlow, 'rgba(0,0,0,0)', 0.5)
            }
            // Core with subtle inner gradient
            const cg = ctx!.createRadialGradient(curP.x - eR * 0.2, curP.y - eR * 0.2, 0, curP.x, curP.y, eR)
            cg.addColorStop(0, eBright)
            cg.addColorStop(0.6, eColor)
            cg.addColorStop(1, hsl(eHue, eSat, eLit - 10))
            ctx!.beginPath()
            ctx!.arc(curP.x, curP.y, eR, 0, Math.PI * 2)
            ctx!.globalAlpha = 0.95
            ctx!.fillStyle = cg
            ctx!.fill()
            ctx!.globalAlpha = 1
            // Specular highlight
            if (eR > 1.2) {
              circle(curP.x - eR * 0.25, curP.y - eR * 0.25, eR * 0.3, colors.highlight, 0.5)
            }
          }
        })

        // Emit sparks from electron (only for larger sizes)
        if (isLarge && Math.random() < 0.15) {
          const sparkVx = (curP.x - prevP.x) * 0.3 + (Math.random() - 0.5) * 1.5
          const sparkVy = (curP.y - prevP.y) * 0.3 + (Math.random() - 0.5) * 1.5
          emitSpark(curP.x, curP.y, sparkVx, sparkVy)
        }
      }

      // ── nucleus ──
      {
        const p = project({ x: 0, y: 0, z: 0 }, center, scale)
        const nR = NUCLEUS_R * scale * p.s
        // Breathing: compound sinusoids for organic feel
        const breath = 1 + Math.sin(t * 1.2) * 0.06 + Math.sin(t * 2.7) * 0.02 + Math.sin(t * 0.5) * 0.03
        const hoverExpand = 1 + hAmt * 0.25
        const pulse = breath * hoverExpand

        const nucHue = colors.electronBase[0] + globalHueShift
        const nucPulseAlpha = 0.08 + Math.sin(t * 1.5) * 0.03 + hAmt * 0.06

        items.push({
          z: 0,
          draw: () => {
            // Huge outer bloom (ambient energy)
            if (isLarge) {
              glow(p.x, p.y, nR * 5 * pulse, hsl(nucHue, 80, 60, 0.06), 'rgba(0,0,0,0)', nucPulseAlpha)
              glow(p.x, p.y, nR * 3.5 * pulse, hsl(nucHue, 85, 55, 0.1), 'rgba(0,0,0,0)', nucPulseAlpha * 1.5)
            }
            // Mid glow
            glow(p.x, p.y, nR * 2.5 * pulse, colors.nucleusMiddle, colors.glowColorBase, 0.18 + hAmt * 0.1)
            // Inner glow (brighter)
            glow(p.x, p.y, nR * 1.6 * pulse, colors.nucleusCore, colors.glowColorBase, 0.35 + hAmt * 0.1)

            // Core body with gradient
            const ng = ctx!.createRadialGradient(
              p.x - nR * 0.15, p.y - nR * 0.15, 0,
              p.x, p.y, nR * pulse
            )
            ng.addColorStop(0, colors.nucleusCore)
            ng.addColorStop(0.5, colors.nucleusMiddle)
            ng.addColorStop(1, colors.nucleusOuter)
            ctx!.beginPath()
            ctx!.arc(p.x, p.y, nR * pulse, 0, Math.PI * 2)
            ctx!.globalAlpha = 0.95
            ctx!.fillStyle = ng
            ctx!.fill()
            ctx!.globalAlpha = 1

            // Bright specular highlight
            if (nR > 2) {
              const hlR = nR * 0.25 * pulse
              const hlG = ctx!.createRadialGradient(
                p.x - nR * 0.2, p.y - nR * 0.25, 0,
                p.x - nR * 0.2, p.y - nR * 0.25, hlR
              )
              hlG.addColorStop(0, 'rgba(255,255,255,0.6)')
              hlG.addColorStop(1, 'rgba(255,255,255,0)')
              ctx!.beginPath()
              ctx!.arc(p.x - nR * 0.2, p.y - nR * 0.25, hlR, 0, Math.PI * 2)
              ctx!.fillStyle = hlG
              ctx!.fill()
            }
          }
        })
      }

      // ── sparks ──
      if (isLarge) {
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]
          s.x += s.vx * dt * 60
          s.y += s.vy * dt * 60
          s.life -= dt * 2.5
          if (s.life <= 0) {
            sparks.splice(i, 1)
            continue
          }
          const alpha = s.life * s.life * 0.7
          const sparkHue = colors.electronBase[0] + globalHueShift + (1 - s.life) * 30
          items.push({
            z: 0.5,
            draw: () => {
              circle(s.x, s.y, s.size * s.life, hsl(sparkHue, 90, 75), alpha)
            }
          })
        }
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
      style={{ width: size, height: size, cursor: 'pointer' }}
      aria-label="AgoraFlow"
      role="img"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    />
  )
}
