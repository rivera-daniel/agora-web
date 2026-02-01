'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * AtomLogo — Premium Animated 3D atom for AgoraFlow
 * 
 * Pure Canvas 2D with 3D projection. Zero dependencies.
 * 
 * Features:
 *   - Warm golden/orange glowing nucleus with internal sparkle particles
 *   - 3 electrons on controlled orbital paths (blue + golden accents)
 *   - Subtle motion-blur trails with directional elongation
 *   - Complementary color scheme: golden nucleus + blue/gold orbits
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

// Each orbit has a color mode: 'gold' or 'blue'
const ORBITALS = [
  { tiltX: 0.05,           tiltZ: 0.03,          speed: 1.0,  phase: 0,     color: 'blue' as const },
  { tiltX: Math.PI / 3,    tiltZ: Math.PI / 6,   speed: 0.78, phase: 2.094, color: 'gold' as const },
  { tiltX: -Math.PI / 3,   tiltZ: -Math.PI / 6,  speed: 1.15, phase: 4.189, color: 'blue' as const },
]

const ORBIT_R = 0.78
const NUCLEUS_R = 0.17
const ELECTRON_R = 0.06
const ORBIT_PERIOD = 5.5       // seconds per full orbit
const Y_ROT_SPEED = 0.25       // whole-atom rotation rad/s (slightly slower for control)
const RING_SEGMENTS = 120
const TRAIL_LENGTH = 16         // motion blur trail

// ─── Noise helper (cheap deterministic wobble — toned down) ─────

function noise(t: number, freq: number, amp: number): number {
  return Math.sin(t * freq) * amp +
    Math.sin(t * freq * 1.7 + 1.3) * amp * 0.4
}

// ─── Theme-aware colors ─────────────────────────────────────────

interface ColorSet {
  // Nucleus — warm golden/orange
  nucleusCore: string
  nucleusMiddle: string
  nucleusOuter: string
  nucleusGlowInner: string
  nucleusGlowOuter: string
  // Orbits — two palettes
  goldOrbit: string
  goldOrbitAlpha: number
  goldElectronHSL: [number, number, number]
  blueOrbit: string
  blueOrbitAlpha: number
  blueElectronHSL: [number, number, number]
  // Shared
  highlight: string
  sparkColorGold: string
  sparkColorBlue: string
}

const DARK_COLORS: ColorSet = {
  nucleusCore: '#FFD700',       // pure gold
  nucleusMiddle: '#FFB000',     // warm transition
  nucleusOuter: '#FF8C00',      // deep orange
  nucleusGlowInner: 'rgba(255, 200, 60, 0.4)',
  nucleusGlowOuter: 'rgba(255, 140, 0, 0)',
  goldOrbit: '#FFA540',
  goldOrbitAlpha: 0.28,
  goldElectronHSL: [35, 95, 60],  // warm gold
  blueOrbit: '#4A9EFF',
  blueOrbitAlpha: 0.25,
  blueElectronHSL: [215, 90, 62], // vibrant blue
  highlight: '#FFF4D6',
  sparkColorGold: '#FFD080',
  sparkColorBlue: '#7CBFFF',
}

const LIGHT_COLORS: ColorSet = {
  nucleusCore: '#FFD700',
  nucleusMiddle: '#FFB000',
  nucleusOuter: '#FF8C00',
  nucleusGlowInner: 'rgba(255, 190, 40, 0.3)',
  nucleusGlowOuter: 'rgba(255, 140, 0, 0)',
  goldOrbit: '#D48A20',
  goldOrbitAlpha: 0.3,
  goldElectronHSL: [38, 88, 50],
  blueOrbit: '#2570CC',
  blueOrbitAlpha: 0.28,
  blueElectronHSL: [218, 80, 50],
  highlight: '#FFF0C0',
  sparkColorGold: '#E8A830',
  sparkColorBlue: '#5090DD',
}

// ─── Fallback static SVG ────────────────────────────────────────

function AtomFallback({ size, isDark }: { size: number; isDark: boolean }) {
  const c = isDark ? DARK_COLORS : LIGHT_COLORS
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AgoraFlow">
      <circle cx="20" cy="20" r="3.5" fill={c.nucleusMiddle} opacity="0.9" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.goldOrbit} strokeWidth="0.7" fill="none" opacity="0.35" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.blueOrbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="5.5" stroke={c.goldOrbit} strokeWidth="0.7" fill="none" opacity="0.35" transform="rotate(-60 20 20)" />
      <circle cx="36" cy="20" r="1.5" fill={c.goldOrbit} opacity="0.85" />
      <circle cx="12" cy="11.1" r="1.5" fill={c.blueOrbit} opacity="0.85" />
      <circle cx="12" cy="28.9" r="1.5" fill={c.goldOrbit} opacity="0.85" />
    </svg>
  )
}

// ─── Nucleus sparkle particle ───────────────────────────────────

interface NucleusSparkle {
  angle: number       // angular position
  dist: number        // distance from center (0-1 of nucleus radius)
  speed: number       // angular speed
  size: number        // relative size
  phase: number       // phase offset for twinkle
  twinkleSpeed: number
}

// ─── Spark particle system ──────────────────────────────────────

interface Spark {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
  isGold: boolean
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
  const hoverAmtRef = useRef(0)

  const onEnter = useCallback(() => { hoverRef.current = true }, [])
  const onLeave = useCallback(() => { hoverRef.current = false }, [])

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
    const isLarge = size >= 56

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS

    // Spark pool
    const sparks: Spark[] = []
    const MAX_SPARKS = isLarge ? 18 : 8

    // Nucleus sparkle particles (internal crystalline sparkles)
    const nucleusSparkles: NucleusSparkle[] = []
    const NUM_SPARKLES = isLarge ? 18 : 15
    for (let i = 0; i < NUM_SPARKLES; i++) {
      nucleusSparkles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 0.2 + Math.random() * 0.75,
        speed: (Math.random() - 0.5) * 0.8,
        size: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.5 + Math.random() * 3,
      })
    }

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

    function hsl(h: number, s: number, l: number, a = 1): string {
      return `hsla(${h}, ${s}%, ${l}%, ${a})`
    }

    function transform(p: Vec3, tiltX: number, tiltZ: number, gRotX: number, gRotY: number): Vec3 {
      let v = rotX(p, tiltX)
      v = rotZ(v, tiltZ)
      v = rotX(v, gRotX)
      v = rotY(v, gRotY)
      return v
    }

    function emitSpark(x: number, y: number, vx: number, vy: number, isGold: boolean) {
      if (sparks.length >= MAX_SPARKS) {
        const dead = sparks.findIndex(s => s.life <= 0)
        if (dead >= 0) {
          sparks[dead] = { x, y, vx: vx + (Math.random() - 0.5) * 0.6, vy: vy + (Math.random() - 0.5) * 0.6, life: 1, maxLife: 1, size: Math.random() * 1.2 + 0.4, isGold }
        }
        return
      }
      sparks.push({ x, y, vx: vx + (Math.random() - 0.5) * 0.6, vy: vy + (Math.random() - 0.5) * 0.6, life: 1, maxLife: 1, size: Math.random() * 1.2 + 0.4, isGold })
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

      const gRotY = t * (Y_ROT_SPEED + hAmt * 0.16)
      const gRotX = Math.sin(t * 0.09) * 0.08 + Math.sin(t * 0.23) * 0.03

      ctx!.clearRect(0, 0, size, size)

      type Drawable = { z: number; draw: () => void }
      const items: Drawable[] = []

      // ── orbital rings ──
      for (const orb of ORBITALS) {
        const isGoldOrbit = orb.color === 'gold'
        const orbitColor = isGoldOrbit ? colors.goldOrbit : colors.blueOrbit
        const orbitAlpha = isGoldOrbit ? colors.goldOrbitAlpha : colors.blueOrbitAlpha

        const pts: { x: number; y: number; z3: number }[] = []
        for (let i = 0; i <= RING_SEGMENTS; i++) {
          const θ = (i / RING_SEGMENTS) * Math.PI * 2
          // Gentle wobble — controlled, not chaotic
          const wobble = 1 + noise(t * 0.4 + θ * 2 + orb.phase, 1.5, 0.006)
          const r = ORBIT_R * wobble
          const v = transform(
            { x: Math.cos(θ) * r, y: 0, z: Math.sin(θ) * r },
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
              ctx!.strokeStyle = orbitColor
              ctx!.globalAlpha = orbitAlpha * 0.35
              ctx!.lineWidth = lineW * 0.6
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }

        if (frontPts.length > 1) {
          items.push({
            z: 1,
            draw: () => {
              // Subtle glow pass for front orbits
              if (isLarge) {
                ctx!.beginPath()
                ctx!.moveTo(frontPts[0].x, frontPts[0].y)
                for (let i = 1; i < frontPts.length; i++) ctx!.lineTo(frontPts[i].x, frontPts[i].y)
                ctx!.strokeStyle = orbitColor
                ctx!.globalAlpha = orbitAlpha * 0.2
                ctx!.lineWidth = lineW * 2.5
                ctx!.stroke()
              }
              // Main line
              ctx!.beginPath()
              ctx!.moveTo(frontPts[0].x, frontPts[0].y)
              for (let i = 1; i < frontPts.length; i++) ctx!.lineTo(frontPts[i].x, frontPts[i].y)
              ctx!.strokeStyle = orbitColor
              ctx!.globalAlpha = orbitAlpha * (1 + hAmt * 0.2)
              ctx!.lineWidth = lineW * (1 + hAmt * 0.15)
              ctx!.stroke()
              ctx!.globalAlpha = 1
            }
          })
        }
      }

      // ── electrons + motion blur trails ──
      for (let oi = 0; oi < ORBITALS.length; oi++) {
        const orb = ORBITALS[oi]
        const isGoldOrbit = orb.color === 'gold'
        const eBase = isGoldOrbit ? colors.goldElectronHSL : colors.blueElectronHSL
        const baseSpeed = orb.speed * (1 + hAmt * 0.5)
        const angle = (t / ORBIT_PERIOD) * Math.PI * 2 * baseSpeed + orb.phase

        const eHue = eBase[0] + Math.sin(t * 0.5 + oi * 2) * 3
        const eSat = eBase[1]
        const eLit = eBase[2]

        // Current position
        const wobbleR = 1 + noise(t * 0.4 + angle * 2 + orb.phase, 1.5, 0.006)
        const curV = transform(
          { x: Math.cos(angle) * ORBIT_R * wobbleR, y: 0, z: Math.sin(angle) * ORBIT_R * wobbleR },
          orb.tiltX, orb.tiltZ, gRotX, gRotY
        )
        const curP = project(curV, center, scale)

        // Previous position for motion direction
        const prevAngle = angle - 0.15
        const prevWobbleR = 1 + noise(t * 0.4 + prevAngle * 2 + orb.phase, 1.5, 0.006)
        const prevV = transform(
          { x: Math.cos(prevAngle) * ORBIT_R * prevWobbleR, y: 0, z: Math.sin(prevAngle) * ORBIT_R * prevWobbleR },
          orb.tiltX, orb.tiltZ, gRotX, gRotY
        )
        const prevP = project(prevV, center, scale)

        const dx = curP.x - prevP.x
        const dy = curP.y - prevP.y
        const motionAngle = Math.atan2(dy, dx)

        // Trail
        const trailCount = isLarge ? TRAIL_LENGTH : Math.min(TRAIL_LENGTH, 12)
        for (let i = trailCount; i >= 1; i--) {
          const trailAngle = angle - i * 0.05
          const tw = 1 + noise(t * 0.4 + trailAngle * 2 + orb.phase, 1.5, 0.006)
          const v = transform(
            { x: Math.cos(trailAngle) * ORBIT_R * tw, y: 0, z: Math.sin(trailAngle) * ORBIT_R * tw },
            orb.tiltX, orb.tiltZ, gRotX, gRotY
          )
          const p = project(v, center, scale)

          const progress = 1 - i / (trailCount + 1)
          const trailR = ELECTRON_R * scale * p.s * progress * 0.6
          const trailAlpha = progress * progress * 0.2
          const elongation = 1.2 + (1 - progress) * 0.6
          const trailLit = eLit + (1 - progress) * 12

          items.push({
            z: v.z,
            draw: () => {
              trailDot(p.x, p.y, trailR, motionAngle, elongation, hsl(eHue, eSat, trailLit), trailAlpha)
            }
          })
        }

        // Electron body
        const eR = ELECTRON_R * scale * curP.s * (1 + hAmt * 0.12)
        const eColor = hsl(eHue, eSat, eLit)
        const eBright = hsl(eHue, eSat - 10, eLit + 25)

        items.push({
          z: curV.z,
          draw: () => {
            // Outer glow
            if (isLarge) {
              glow(curP.x, curP.y, eR * 3, hsl(eHue, eSat, eLit + 10, 0.12), 'rgba(0,0,0,0)', 0.15)
              glow(curP.x, curP.y, eR * 2, hsl(eHue, eSat, eLit, 0.2), 'rgba(0,0,0,0)', 0.2)
            } else {
              glow(curP.x, curP.y, eR * 2.5, hsl(eHue, eSat, eLit, 0.3), 'rgba(0,0,0,0)', 0.3)
            }
            // Core gradient
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
              circle(curP.x - eR * 0.25, curP.y - eR * 0.25, eR * 0.28, colors.highlight, 0.45)
            }
          }
        })

        // Sparse sparks from electrons
        if (isLarge && Math.random() < 0.05 + hAmt * 0.08) {
          const sparkVx = (curP.x - prevP.x) * 0.25 + (Math.random() - 0.5) * 1.2
          const sparkVy = (curP.y - prevP.y) * 0.25 + (Math.random() - 0.5) * 1.2
          emitSpark(curP.x, curP.y, sparkVx, sparkVy, isGoldOrbit)
        }
      }

      // ── nucleus ──
      {
        const p = project({ x: 0, y: 0, z: 0 }, center, scale)
        const nR = NUCLEUS_R * scale * p.s
        // Controlled breathing
        const breath = 1 + Math.sin(t * 1.0) * 0.04 + Math.sin(t * 2.3) * 0.015
        const hoverExpand = 1 + hAmt * 0.2
        const pulse = breath * hoverExpand

        items.push({
          z: 0,
          draw: () => {
            // Warm ambient glow (controlled, premium)
            if (isLarge) {
              glow(p.x, p.y, nR * 4.5 * pulse, 'rgba(255, 170, 40, 0.06)', 'rgba(255, 140, 0, 0)', 0.08 + hAmt * 0.04)
              glow(p.x, p.y, nR * 3.0 * pulse, 'rgba(255, 180, 60, 0.1)', 'rgba(255, 140, 0, 0)', 0.12 + hAmt * 0.05)
            }
            // Inner golden glow
            glow(p.x, p.y, nR * 2.0 * pulse, colors.nucleusGlowInner, colors.nucleusGlowOuter, 0.22 + hAmt * 0.12)
            glow(p.x, p.y, nR * 1.4 * pulse, colors.nucleusCore, 'rgba(255,200,80,0)', 0.3 + hAmt * 0.12)

            // Core body with warm gradient
            const ng = ctx!.createRadialGradient(
              p.x - nR * 0.12, p.y - nR * 0.12, 0,
              p.x, p.y, nR * pulse
            )
            ng.addColorStop(0, colors.nucleusCore)
            ng.addColorStop(0.45, colors.nucleusMiddle)
            ng.addColorStop(1, colors.nucleusOuter)
            ctx!.beginPath()
            ctx!.arc(p.x, p.y, nR * pulse, 0, Math.PI * 2)
            ctx!.globalAlpha = 0.95
            ctx!.fillStyle = ng
            ctx!.fill()
            ctx!.globalAlpha = 1

            // Internal sparkle particles (crystalline effect like the reference)
            if (nR > 2) {
              for (const sp of nucleusSparkles) {
                const spAngle = sp.angle + t * sp.speed
                const spDist = sp.dist * nR * pulse * 0.85
                const spX = p.x + Math.cos(spAngle) * spDist
                const spY = p.y + Math.sin(spAngle) * spDist
                // Twinkle effect
                const twinkle = Math.max(0, Math.sin(t * sp.twinkleSpeed + sp.phase))
                const twinkleBoost = 0.7 + hAmt * 0.7
                const spAlpha = twinkle * twinkle * 0.7 * twinkleBoost
                const spSize = sp.size * (nR * 0.12) * (0.5 + twinkle * 0.5) * (1 + hAmt * 0.35)
                if (spAlpha > 0.05) {
                  // Sparkle glow
                  glow(spX, spY, spSize * 2.8, 'rgba(255, 255, 230, 0.45)', 'rgba(255, 255, 200, 0)', spAlpha * 0.45)
                  // Sparkle core
                  circle(spX, spY, Math.max(spSize, 0.3), '#FFFDE8', spAlpha)
                }
              }
            }

            // Bright specular highlight on nucleus
            if (nR > 2) {
              const hlR = nR * 0.22 * pulse
              const hlG = ctx!.createRadialGradient(
                p.x - nR * 0.18, p.y - nR * 0.22, 0,
                p.x - nR * 0.18, p.y - nR * 0.22, hlR
              )
              hlG.addColorStop(0, 'rgba(255,255,255,0.55)')
              hlG.addColorStop(1, 'rgba(255,255,255,0)')
              ctx!.beginPath()
              ctx!.arc(p.x - nR * 0.18, p.y - nR * 0.22, hlR, 0, Math.PI * 2)
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
          s.life -= dt * 2.2
          if (s.life <= 0) {
            sparks.splice(i, 1)
            continue
          }
          const alpha = s.life * s.life * 0.45
          const sparkHue = s.isGold ? 38 + (1 - s.life) * 8 : 215 + (1 - s.life) * 8
          const sparkSat = s.isGold ? 92 : 85
          items.push({
            z: 0.5,
            draw: () => {
              circle(s.x, s.y, s.size * s.life, hsl(sparkHue, sparkSat, 72), alpha)
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
