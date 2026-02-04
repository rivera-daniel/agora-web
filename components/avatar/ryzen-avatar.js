// ═══════════════════════════════════════════════════════════════════
//  RYZEN AVATAR — Three.js 3D Particle Cloud
//  Nexus centerpiece · 3500 particles · WebGL rendering
//
//  Usage:
//    import { RyzenAvatar } from './ryzen-avatar.js';
//    const avatar = new RyzenAvatar(containerEl, { size: 160 });
//    avatar.setState('thinking');   // 'idle' | 'thinking' | 'working'
//    avatar.getState();             // → current state string
//    avatar.destroy();              // cleanup
// ═══════════════════════════════════════════════════════════════════

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@r170/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@r170/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@r170/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@r170/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@r170/examples/jsm/postprocessing/OutputPass.js';

export class RyzenAvatar {
  static STATES = ['idle', 'thinking', 'working'];

  constructor(container, opts = {}) {
    this.size = opts.size || 160;
    this.pixelRatio = opts.pixelRatio || window.devicePixelRatio || 1;
    this.particleCount = opts.particles || 3500;
    this.bloomEnabled = opts.bloom !== false;
    this.onStateChange = opts.onStateChange || null;

    this._state = 'idle';
    this._blend = 1;
    this._time = 0;
    this._raf = null;
    this._container = container;
    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._composer = null;
    this._particles = null;
    this._particleSystem = null;

    // Particle state (CPU-side updates)
    this._particleData = {
      baseRadius: new Float32Array(this.particleCount),
      theta: new Float32Array(this.particleCount),
      phi: new Float32Array(this.particleCount),
      vTheta: new Float32Array(this.particleCount),
      vPhi: new Float32Array(this.particleCount),
      baseSize: new Float32Array(this.particleCount),
      baseAlpha: new Float32Array(this.particleCount),
      layer: new Uint8Array(this.particleCount),
      nxOff: new Float32Array(this.particleCount),
      nyOff: new Float32Array(this.particleCount),
      phase: new Float32Array(this.particleCount),
      colorR: new Uint8Array(this.particleCount),
      colorG: new Uint8Array(this.particleCount),
      colorB: new Uint8Array(this.particleCount),
    };

    this._init();
  }

  _init() {
    this._setupScene();
    this._initNoise();
    this._initParticles();
    this._setupPostProcessing();
    this._start();
  }

  _setupScene() {
    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x08080e);

    // Camera - positioned to view origin
    const aspect = 1;
    this._camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    this._camera.position.z = 280;

    // Renderer
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.borderRadius = '50%';
    this._container.appendChild(canvas);

    this._renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    this._renderer.setSize(this.size, this.size, false);
    this._renderer.setPixelRatio(this.pixelRatio);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;

    // CSS halo for aesthetic enhancement
    this._addHaloStyle();
  }

  _addHaloStyle() {
    const style = document.createElement('style');
    style.textContent = `
      [data-ryzen-root] {
        position: relative;
        display: inline-block;
        cursor: pointer;
        user-select: none;
      }
      [data-ryzen-canvas] {
        border-radius: 50%;
        display: block;
      }
      [data-ryzen-halo] {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        pointer-events: none;
        z-index: -1;
        transition: box-shadow 1.2s ease;
      }
      [data-ryzen-halo].idle {
        box-shadow: 0 0 28px 10px rgba(0,204,255,0.38), 0 0 60px 20px rgba(0,180,230,0.22), 0 0 120px 35px rgba(0,160,200,0.1);
        animation: ryzen-breathe 4s ease-in-out infinite;
      }
      [data-ryzen-halo].thinking {
        box-shadow: 0 0 30px 10px rgba(255,200,50,0.4), 0 0 65px 20px rgba(255,170,30,0.2), 0 0 110px 35px rgba(255,150,20,0.09);
        animation: ryzen-think 2s ease-in-out infinite;
      }
      [data-ryzen-halo].working {
        box-shadow: 0 0 32px 12px rgba(30,220,110,0.45), 0 0 70px 24px rgba(40,200,100,0.22), 0 0 120px 40px rgba(50,180,80,0.1);
        animation: ryzen-work 1.5s ease-in-out infinite;
      }
      @keyframes ryzen-breathe { 0%,100%{opacity:.85} 50%{opacity:1} }
      @keyframes ryzen-think { 0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)} }
      @keyframes ryzen-work { 0%,100%{opacity:.8} 50%{opacity:1} }
    `;
    document.head.appendChild(style);

    // Wrap canvas and add halo
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-ryzen-root', '');
    wrapper.style.width = this.size + 'px';
    wrapper.style.height = this.size + 'px';

    const halo = document.createElement('div');
    halo.setAttribute('data-ryzen-halo', '');
    halo.className = this._state;
    halo.style.width = (this.size * 1.4) + 'px';
    halo.style.height = (this.size * 1.4) + 'px';

    this._container.appendChild(wrapper);
    wrapper.appendChild(halo);
    wrapper.appendChild(this._renderer.domElement);

    this._renderer.domElement.setAttribute('data-ryzen-canvas', '');
    this._haloEl = halo;

    // Click to cycle states
    wrapper.addEventListener('click', () => {
      const idx = RyzenAvatar.STATES.indexOf(this._state);
      this.setState(RyzenAvatar.STATES[(idx + 1) % RyzenAvatar.STATES.length]);
    });
  }

  _initNoise() {
    // Perlin-like noise via permutation table
    this._perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this._perm[i] = p[i & 255];
  }

  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  _grad(h, x, y) { const g = h & 3; return ((g & 1) ? -x : x) + ((g & 2) ? -y : y); }

  _noise(x, y) {
    const pm = this._perm;
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = this._fade(x), v = this._fade(y);
    const a = pm[X] + Y, b = pm[X + 1] + Y;
    const mix = (a, b, t) => a + t * (b - a);
    return mix(
      mix(this._grad(pm[a], x, y), this._grad(pm[b], x - 1, y), u),
      mix(this._grad(pm[a + 1], x, y - 1), this._grad(pm[b + 1], x - 1, y - 1), u), v
    );
  }

  _fbm(x, y) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < 3; i++) {
      v += a * this._noise(x * f, y * f);
      a *= 0.5;
      f *= 2;
    }
    return v;
  }

  // Color palette: Blue → Purple → Magenta
  static PAL = [
    [50, 100, 255], [65, 70, 250], [100, 50, 235], [140, 42, 220],
    [180, 42, 200], [215, 50, 170], [245, 60, 135], [255, 85, 150],
  ];

  _colorAt(t) {
    t = ((t % 1) + 1) % 1;
    const P = RyzenAvatar.PAL;
    const idx = t * (P.length - 1), lo = Math.floor(idx), f = idx - lo;
    const a = P[Math.min(lo, P.length - 1)], b = P[Math.min(lo + 1, P.length - 1)];
    const mix = (x, y, t) => x + t * (y - x);
    return [mix(a[0], b[0], f) | 0, mix(a[1], b[1], f) | 0, mix(a[2], b[2], f) | 0];
  }

  _initParticles() {
    const N = this.particleCount;
    const R = 100; // Cloud radius in world units

    // Layer distribution: 600 core, 1500 shell, 1400 outer
    const layers = [[0, 600], [1, 1500], [2, 1400]];
    let idx = 0;

    for (const [l, count] of layers) {
      for (let i = 0; i < count; i++, idx++) {
        this._particleData.layer[idx] = l;

        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);

        // Radius distribution per layer
        let rFrac;
        if (l === 0) rFrac = Math.pow(Math.random(), 0.5) * 0.38;
        else if (l === 1) rFrac = 0.28 + Math.pow(Math.random(), 0.8) * 0.40;
        else rFrac = 0.55 + Math.pow(Math.random(), 0.6) * 0.45;

        this._particleData.baseRadius[idx] = rFrac * R;
        this._particleData.theta[idx] = th;
        this._particleData.phi[idx] = ph;
        this._particleData.vTheta[idx] = (Math.random() - 0.5) * 0.005;
        this._particleData.vPhi[idx] = (Math.random() - 0.5) * 0.003;

        // Size by layer
        this._particleData.baseSize[idx] = l === 0 ? 2.2 + Math.random() * 3.0
                                          : l === 1 ? 1.2 + Math.random() * 2.2
                                          :           0.6 + Math.random() * 1.4;

        this._particleData.baseAlpha[idx] = l === 0 ? 0.6 + Math.random() * 0.4
                                           : l === 1 ? 0.35 + Math.random() * 0.4
                                           :           0.15 + Math.random() * 0.35;

        // Color from palette
        const ct = (th / (Math.PI * 2) + rFrac * 0.4) % 1;
        const col = this._colorAt(ct);
        this._particleData.colorR[idx] = col[0];
        this._particleData.colorG[idx] = col[1];
        this._particleData.colorB[idx] = col[2];

        // Noise offsets
        this._particleData.nxOff[idx] = Math.random() * 100;
        this._particleData.nyOff[idx] = Math.random() * 100;
        this._particleData.phase[idx] = Math.random() * Math.PI * 2;
      }
    }

    // Create Three.js geometry and particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = this._particleData.colorR[i] / 255;
      colors[i * 3 + 1] = this._particleData.colorG[i] / 255;
      colors[i * 3 + 2] = this._particleData.colorB[i] / 255;
      sizes[i] = this._particleData.baseSize[i];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom material with glow
    const material = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      fog: false,
    });

    this._particleSystem = new THREE.Points(geometry, material);
    this._scene.add(this._particleSystem);
  }

  _setupPostProcessing() {
    if (!this.bloomEnabled) return;

    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(new RenderPass(this._scene, this._camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(this.size, this.size),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this._composer.addPass(bloom);
    this._composer.addPass(new OutputPass());
  }

  _start() {
    const tick = (ts) => {
      this._raf = requestAnimationFrame(tick);
      this._time = ts;
      if (this._blend < 1) this._blend = Math.min(1, this._blend + 0.018);
      this._update(ts);
      this._render();
    };
    this._raf = requestAnimationFrame(tick);
  }

  _update(ts) {
    const t = ts * 0.001;
    const N = this.particleCount;
    const R = 100;
    const st = this._state;
    const bl = this._blend;
    const mix = (a, b, t) => a + t * (b - a);

    for (let i = 0; i < N; i++) {
      // Update angles
      this._particleData.theta[i] += this._particleData.vTheta[i];
      this._particleData.phi[i] += this._particleData.vPhi[i] * 0.5;

      // Noise displacement
      const nx = this._fbm(this._particleData.nxOff[i] + t * 0.22, this._particleData.nyOff[i]) * 16;
      const ny = this._fbm(this._particleData.nxOff[i], this._particleData.nyOff[i] + t * 0.22) * 16;

      // Radius modulation based on state
      let rm = this._particleData.baseRadius[i];
      const idleB = Math.sin(t * 0.7 + this._particleData.phase[i]) * 6;
      const idleD = Math.sin(t * 0.25 + this._particleData.phase[i] * 0.5) * 4;

      if (st === 'idle') {
        rm += idleB + idleD;
      } else if (st === 'thinking') {
        const pulse = Math.sin(t * 2.0 + this._particleData.phase[i] * 0.5) * 25;
        const sec = Math.sin(t * 0.9 + this._particleData.phase[i]) * 10;
        rm += mix(idleB + idleD, pulse + sec, bl);
      } else {
        const tight = -this._particleData.baseRadius[i] * 0.05;
        const osc = Math.sin(t * 5 + this._particleData.phase[i]) * 6;
        rm += mix(idleB + idleD, tight + osc, bl);
      }

      // Rotation speed
      let rs = 0.04;
      if (st === 'thinking') rs = mix(0.04, 0.1, bl);
      if (st === 'working') rs = mix(0.04, 0.5, bl);

      const gt = this._particleData.theta[i] + t * rs;

      // 3D position
      const sinPhi = Math.sin(this._particleData.phi[i]);
      const x = rm * sinPhi * Math.cos(gt) + nx;
      const y = rm * sinPhi * Math.sin(gt) + ny;
      const z = rm * Math.cos(this._particleData.phi[i]);

      const positions = this._particleSystem.geometry.attributes.position.array;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this._particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  _render() {
    if (this._composer) {
      this._composer.render();
    } else {
      this._renderer.render(this._scene, this._camera);
    }
  }

  setState(s) {
    if (!RyzenAvatar.STATES.includes(s) || s === this._state) return;
    this._state = s;
    this._blend = 0;
    if (this._haloEl) {
      this._haloEl.className = s;
    }
    if (this.onStateChange) this.onStateChange(s);
  }

  getState() {
    return this._state;
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.domElement.remove();
    }
    if (this._particleSystem?.geometry) {
      this._particleSystem.geometry.dispose();
    }
    if (this._particleSystem?.material) {
      this._particleSystem.material.dispose();
    }
  }
}
