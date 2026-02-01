'use client'

/**
 * AtomLogoCSS — Pure CSS/SVG animated atom logo
 * 
 * Zero JavaScript animation. Uses CSS keyframes for:
 *   - 3 orbital ring rotations (3D transforms)
 *   - 3 electrons orbiting along paths
 *   - Nucleus pulse
 * 
 * Incredibly lightweight — no canvas, no requestAnimationFrame.
 * GPU-composited CSS transforms only.
 * 
 * Trade-off: Less "true 3D" depth feel than canvas version,
 * but buttery smooth and zero JS overhead.
 */

interface AtomLogoCSSProps {
  size?: number
  className?: string
}

export function AtomLogoCSS({ size = 40, className = '' }: AtomLogoCSSProps) {
  const id = `atom-${size}`
  const nucleusR = size * 0.09
  const electronR = size * 0.04
  const orbitRx = size * 0.42
  const orbitRy = size * 0.15
  const half = size / 2
  const strokeW = Math.max(0.5, size / 65)

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="AgoraFlow"
      role="img"
    >
      <style>{`
        @keyframes ${id}-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${id}-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.95; }
          50%      { transform: translate(-50%, -50%) scale(1.06); opacity: 1; }
        }
        @keyframes ${id}-glow {
          0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.2;  transform: translate(-50%, -50%) scale(1.15); }
        }
        .${id}-orbit {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .${id}-orbit svg {
          width: 100%;
          height: 100%;
        }
        .${id}-o1 { animation: ${id}-spin 8s linear infinite; transform: rotateX(70deg) rotateZ(0deg); }
        .${id}-o2 { animation: ${id}-spin 9.5s linear infinite reverse; transform: rotateX(70deg) rotateZ(60deg); }
        .${id}-o3 { animation: ${id}-spin 11s linear infinite; transform: rotateX(70deg) rotateZ(-60deg); }
        .${id}-nucleus {
          position: absolute;
          top: 50%; left: 50%;
          width: ${nucleusR * 2}px;
          height: ${nucleusR * 2}px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 35%, var(--atom-highlight, #60a5fa), var(--atom-accent, #3b82f6) 70%);
          animation: ${id}-pulse 3s ease-in-out infinite;
          z-index: 2;
        }
        .${id}-nucleus-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: ${nucleusR * 5}px;
          height: ${nucleusR * 5}px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--atom-accent, #3b82f6), transparent 70%);
          animation: ${id}-glow 3s ease-in-out infinite;
          z-index: 1;
          pointer-events: none;
        }
      `}</style>

      {/* Nucleus glow */}
      <div className={`${id}-nucleus-glow`} />

      {/* Nucleus */}
      <div className={`${id}-nucleus`} />

      {/* Three orbital planes */}
      {[1, 2, 3].map(i => (
        <div key={i} className={`${id}-orbit ${id}-o${i}`}>
          <svg viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Orbit ring */}
            <ellipse
              cx={half}
              cy={half}
              rx={orbitRx}
              ry={orbitRx}
              stroke="var(--atom-accent, #3b82f6)"
              strokeWidth={strokeW}
              opacity="0.25"
            />
            {/* Electron on the ring */}
            <circle
              cx={half + orbitRx}
              cy={half}
              r={electronR}
              fill="var(--atom-electron, #2563eb)"
              opacity="0.9"
            />
            {/* Electron glow */}
            <circle
              cx={half + orbitRx}
              cy={half}
              r={electronR * 2.5}
              fill="var(--atom-accent, #3b82f6)"
              opacity="0.15"
            />
          </svg>
        </div>
      ))}
    </div>
  )
}
