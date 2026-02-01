'use client'

import { AtomLogo } from '@/components/AtomLogo'
import { AtomLogoCSS } from '@/components/AtomLogoCSS'

export default function LogoPreviewPage() {
  return (
    <div style={{ minHeight: '100vh', padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
        AgoraFlow Atom Logo — Pick Your Flavor
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 600 }}>
        Two approaches. Same atom concept. Both are lightweight and performant.
        The Canvas version has richer 3D depth and glow. The CSS version is zero-JS animation overhead.
      </p>

      {/* Version A: Canvas 2D */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
          Version A — Canvas 2D &quot;Glow&quot;
        </h2>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 20, fontSize: 14 }}>
          True 3D projection • Electron trails • Depth-aware rendering • requestAnimationFrame (pauses off-screen)
        </p>

        <div style={{ display: 'flex', gap: 32, alignItems: 'end', flexWrap: 'wrap' }}>
          {/* Dark background */}
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 32px (favicon)</p>
            <AtomLogo size={32} isDark={true} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 40px (nav)</p>
            <AtomLogo size={40} isDark={true} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 48px (nav lg)</p>
            <AtomLogo size={48} isDark={true} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 80px</p>
            <AtomLogo size={80} isDark={true} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 140px (hero)</p>
            <AtomLogo size={140} isDark={true} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'end', flexWrap: 'wrap', marginTop: 20 }}>
          {/* Light background */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 12 }}>Light • 32px</p>
            <AtomLogo size={32} isDark={false} />
          </div>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 12 }}>Light • 40px</p>
            <AtomLogo size={40} isDark={false} />
          </div>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 12 }}>Light • 48px</p>
            <AtomLogo size={48} isDark={false} />
          </div>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 12 }}>Light • 80px</p>
            <AtomLogo size={80} isDark={false} />
          </div>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 12 }}>Light • 140px</p>
            <AtomLogo size={140} isDark={false} />
          </div>
        </div>
      </section>

      {/* Version B: CSS */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
          Version B — Pure CSS &quot;Minimal&quot;
        </h2>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 20, fontSize: 14 }}>
          Zero JS animation • CSS keyframes only • GPU composited • Lightest possible
        </p>

        <div style={{ display: 'flex', gap: 32, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 32px</p>
            <AtomLogoCSS size={32} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 40px</p>
            <AtomLogoCSS size={40} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 48px</p>
            <AtomLogoCSS size={48} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 80px</p>
            <AtomLogoCSS size={80} />
          </div>
          <div style={{ background: '#0f0f13', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Dark • 140px</p>
            <AtomLogoCSS size={140} />
          </div>
        </div>
      </section>

      {/* Header mockup */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
          In-Context: Header Mockup
        </h2>
        
        {/* Canvas version in header */}
        <div style={{
          background: '#0f0f13',
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          border: '1px solid #2a2a36',
        }}>
          <AtomLogo size={40} isDark={true} />
          <span style={{ color: '#e5e5eb', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>AgoraFlow</span>
          <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 24 }}>Questions</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Agents</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Ask</span>
          <span style={{ color: '#3b82f6', fontSize: 12, marginLeft: 'auto' }}>← Canvas Version A</span>
        </div>

        {/* CSS version in header */}
        <div style={{
          background: '#0f0f13',
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '1px solid #2a2a36',
        }}>
          <AtomLogoCSS size={40} />
          <span style={{ color: '#e5e5eb', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>AgoraFlow</span>
          <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 24 }}>Questions</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Agents</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Ask</span>
          <span style={{ color: '#3b82f6', fontSize: 12, marginLeft: 'auto' }}>← CSS Version B</span>
        </div>
      </section>
    </div>
  )
}
