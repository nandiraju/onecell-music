import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Maximize2, Sparkles, Waves, BarChart2, Atom, Disc } from 'lucide-react';

const VISUALIZER_MODES = ['nebula', 'liquid', 'spectrum', 'orbital', 'radial'];

const VisualizerCanvas = forwardRef(function VisualizerCanvas({
  audioRef,
  isPlaying,
  accentColor = '#00f0ff',
  secondaryColor = '#7000ff',
  defaultMode = 'spectrum'
}, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState(defaultMode); // 'nebula', 'liquid', 'spectrum', 'orbital', 'radial'

  // Audio Context & Analyzer refs
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const isInitializedRef = useRef(false);
  const animFrameIdRef = useRef(null);

  // Particles & physics
  const particlesRef = useRef([]);
  const peaksRef = useRef([]);
  const phaseRef = useRef(0);
  const beatValueRef = useRef(0);

  // Initialize Particles
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 140; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 400,
        z: Math.random() * 800 + 100,
        size: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.6 + 0.3
      });
    }
    particlesRef.current = particles;
  }, []);

  // Web Audio Context setup
  const initAudio = () => {
    if (isInitializedRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      isInitializedRef.current = true;
    } catch (e) {
      console.warn('AudioContext fallback initialization:', e);
      dataArrayRef.current = new Uint8Array(256);
      isInitializedRef.current = true;
    }
  };

  // Resume context on play
  useEffect(() => {
    if (isPlaying) {
      if (!isInitializedRef.current) {
        initAudio();
      } else if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
  }, [isPlaying]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // getBoundingClientRect() returns the element's PROJECTED on-screen box
    // — while the cube (an ancestor) is mid-rotation that box keeps
    // foreshortening even though the canvas's own CSS size never actually
    // changes. Reading it every frame fed shrinking/distorted w,h into the
    // draw calls during the ~0.9s spin: the trail-fade clear only wiped the
    // (smaller) foreshortened region, leaving stale un-cleared pixels at
    // the true edges that reappeared as a "ghost" once it settled back
    // flat, and `w/2`,`h/2`-based draw math went off-center, reading as
    // overflow. ResizeObserver's contentRect is transform-agnostic — it
    // always reports the element's own untransformed layout size — so that
    // feeds a stable ref used for BOTH the backing-buffer size and every
    // frame's draw dimensions; nothing here ever calls getBoundingClientRect
    // again. The rAF-wrapped write is a light debounce so a live resize
    // drag doesn't thrash canvas.width (which clears the buffer every set).
    const sizeRef = { width: 0, height: 0 };
    let resizeFrame = null;
    const applySize = () => {
      const { width, height } = sizeRef;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(width * dpr);
      const h = Math.floor(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const queueApplySize = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(applySize);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize && entry.contentBoxSize[0];
      sizeRef.width = box ? box.inlineSize : entry.contentRect.width;
      sizeRef.height = box ? box.blockSize : entry.contentRect.height;
      queueApplySize();
    });
    resizeObserver.observe(canvas);
    // Still worth keeping: devicePixelRatio can change (e.g. dragging the
    // window to a display with different scaling) without the canvas's own
    // layout size changing at all, which ResizeObserver wouldn't catch.
    window.addEventListener('resize', queueApplySize);

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);
      const w = sizeRef.width;
      const h = sizeRef.height;
      if (!w || !h) return;

      phaseRef.current += 0.02;

      // Extract frequency spectrum
      let bass = 0, mid = 0, treble = 0, avg = 0;
      const audioActive = audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0;

      if (analyserRef.current && audioActive && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        let bassSum = 0;
        for (let i = 0; i < 16; i++) bassSum += dataArrayRef.current[i];
        bass = (bassSum / 16) / 255;

        let midSum = 0;
        for (let i = 16; i < 90; i++) midSum += dataArrayRef.current[i];
        mid = (midSum / 74) / 255;

        let trebleSum = 0;
        for (let i = 90; i < 200; i++) trebleSum += dataArrayRef.current[i];
        treble = (trebleSum / 110) / 255;

        let totalSum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) totalSum += dataArrayRef.current[i];
        avg = (totalSum / dataArrayRef.current.length) / 255;
      } else {
        // Idle gentle wave
        const idle = Math.sin(phaseRef.current * 0.8) * 0.5 + 0.5;
        bass = 0.08 + idle * 0.05;
        mid = 0.06 + idle * 0.04;
        treble = 0.05 + idle * 0.03;
        avg = 0.06 + idle * 0.04;

        if (dataArrayRef.current) {
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            dataArrayRef.current[i] = Math.max(0, Math.sin(phaseRef.current * 1.5 + i * 0.08) * 20 + 25);
          }
        }
      }

      // Beat decay
      if (bass > beatValueRef.current && bass > 0.65) {
        beatValueRef.current = bass;
      } else {
        beatValueRef.current *= 0.96;
      }

      // Clear with trail
      ctx.fillStyle = 'rgba(7, 10, 19, 0.28)';
      ctx.fillRect(0, 0, w, h);

      // Render mode
      if (mode === 'nebula') {
        drawNebula(ctx, w, h, bass, mid, treble, avg);
      } else if (mode === 'liquid') {
        drawLiquid(ctx, w, h, bass, mid, treble, avg);
      } else if (mode === 'spectrum') {
        drawSpectrum(ctx, w, h, bass, mid, treble, avg);
      } else if (mode === 'orbital') {
        drawOrbital(ctx, w, h, bass, mid, treble, avg);
      } else if (mode === 'radial') {
        drawRadial(ctx, w, h, bass, mid, treble, avg);
      }
    };

    render();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', queueApplySize);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode, accentColor, secondaryColor]);

  // MODE 1: NEBULA
  const drawNebula = (ctx, w, h, bass, mid, treble, avg) => {
    const cx = w / 2;
    const cy = h / 2;

    const coreRadius = Math.max(15, 45 + bass * 60);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2.8);
    grad.addColorStop(0, hexToRgba(accentColor, 0.45 + bass * 0.4));
    grad.addColorStop(0.4, hexToRgba(secondaryColor, 0.25 + mid * 0.3));
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    const fov = 350;
    const beatKick = 1 + beatValueRef.current * 0.8;

    particlesRef.current.forEach((p) => {
      p.z -= (1.4 + bass * 4.0);
      if (p.z <= 10) {
        p.z = 700;
        p.x = (Math.random() - 0.5) * 600;
        p.y = (Math.random() - 0.5) * 400;
      }

      const rotSpeed = 0.005 + avg * 0.015;
      const rx = p.x * Math.cos(rotSpeed) - p.y * Math.sin(rotSpeed);
      const ry = p.x * Math.sin(rotSpeed) + p.y * Math.cos(rotSpeed);
      p.x = rx;
      p.y = ry;

      const scale = fov / (fov + p.z);
      const px = cx + p.x * scale;
      const py = cy + p.y * scale;

      if (px >= 0 && px <= w && py >= 0 && py <= h) {
        const pSize = Math.max(1, p.size * scale * beatKick);
        const alpha = Math.min(1, p.baseAlpha * scale * (1 + bass * 1.2));
        ctx.fillStyle = hexToRgba(scale > 0.6 ? accentColor : secondaryColor, alpha);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Reactive frequency ring
    const ringRadius = Math.min(w, h) * 0.28 + bass * 35;
    const points = 120;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = (idx / points) * Math.PI * 2 + phaseRef.current * 0.5;
      const data = dataArrayRef.current;
      const freqIndex = Math.floor((idx / points) * (data ? data.length * 0.6 : 60));
      const val = data ? (data[freqIndex] / 255) : 0.2;
      const r = ringRadius + val * 55 * (1 + mid * 0.8);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = hexToRgba(accentColor, 0.8);
    ctx.lineWidth = 2.5 + bass * 2.5;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // MODE 2: LIQUID
  const drawLiquid = (ctx, w, h, bass, mid, treble, avg) => {
    const cy = h * 0.55;
    const slices = 48;
    const sliceWidth = w / slices;

    const layers = [
      { color: secondaryColor, alpha: 0.25, freqMul: 0.5, speed: 0.9, yOffset: 25, amp: 70 },
      { color: accentColor, alpha: 0.5, freqMul: 0.9, speed: 1.3, yOffset: 0, amp: 95 },
      { color: '#ffffff', alpha: 0.75, freqMul: 1.2, speed: 1.8, yOffset: -15, amp: 45 }
    ];

    layers.forEach((layer) => {
      ctx.beginPath();
      ctx.moveTo(0, h);

      let prevX = 0;
      let prevY = cy + layer.yOffset;

      for (let i = 0; i <= slices; i++) {
        const x = i * sliceWidth;
        const data = dataArrayRef.current;
        const freqIdx = Math.floor((i / slices) * (data ? data.length * 0.5 : 40));
        const freqVal = data ? (data[freqIdx] / 255) : 0.15;

        const sine = Math.sin(phaseRef.current * layer.speed + i * layer.freqMul * 0.25);
        const y = (cy + layer.yOffset) - (freqVal * layer.amp * (1 + bass * 0.8)) + (sine * 18);

        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const xc = (prevX + x) / 2;
          const yc = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, xc, yc);
        }
        prevX = x;
        prevY = y;
      }

      ctx.lineTo(w, prevY);
      ctx.lineTo(w, h);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, cy - 100, 0, h);
      waveGrad.addColorStop(0, hexToRgba(layer.color, layer.alpha));
      waveGrad.addColorStop(1, 'rgba(5, 8, 16, 0.05)');

      ctx.fillStyle = waveGrad;
      ctx.fill();

      ctx.strokeStyle = hexToRgba(layer.color, layer.alpha + 0.2);
      ctx.lineWidth = 2;
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  };

  // MODE 3: SPECTRUM
  const drawSpectrum = (ctx, w, h, bass, mid, treble, avg) => {
    const barCount = 42;
    const spacing = 4;
    const totalSpacing = spacing * (barCount - 1);
    const barWidth = Math.max(3, (w * 0.88 - totalSpacing) / barCount);
    const startX = (w - (barCount * barWidth + totalSpacing)) / 2;
    const baseLine = h * 0.76;
    const maxHeight = h * 0.52;

    if (peaksRef.current.length !== barCount) {
      peaksRef.current = new Array(barCount).fill(0);
    }

    for (let i = 0; i < barCount; i++) {
      const data = dataArrayRef.current;
      const binIdx = Math.floor(Math.pow(i / barCount, 1.4) * (data ? data.length * 0.75 : 80));
      const val = data ? (data[binIdx] / 255) : 0.15;

      const barHeight = Math.max(6, val * maxHeight * (1 + (i < 10 ? bass * 0.3 : 0)));
      const x = startX + i * (barWidth + spacing);
      const y = baseLine - barHeight;

      if (barHeight > peaksRef.current[i]) {
        peaksRef.current[i] = barHeight;
      } else {
        peaksRef.current[i] = Math.max(6, peaksRef.current[i] - 2.0);
      }

      const pillarGrad = ctx.createLinearGradient(x, y, x, baseLine);
      const barColor = interpolateColor(accentColor, secondaryColor, i / barCount);
      pillarGrad.addColorStop(0, hexToRgba(barColor, 0.95));
      pillarGrad.addColorStop(0.7, hexToRgba(barColor, 0.45));
      pillarGrad.addColorStop(1, hexToRgba(barColor, 0.1));

      ctx.fillStyle = pillarGrad;
      roundRect(ctx, x, y, barWidth, barHeight, 3);
      ctx.fill();

      // Top glowing highlight
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, y, barWidth, 2.5, 1);
      ctx.fill();

      // Floating peak cap
      const peakY = baseLine - peaksRef.current[i] - 4;
      ctx.fillStyle = hexToRgba('#ffffff', 0.9);
      ctx.fillRect(x, peakY, barWidth, 2);

      // Floor reflection
      const reflGrad = ctx.createLinearGradient(x, baseLine, x, baseLine + barHeight * 0.35);
      reflGrad.addColorStop(0, hexToRgba(barColor, 0.25));
      reflGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = reflGrad;
      roundRect(ctx, x, baseLine + 2, barWidth, barHeight * 0.35, 2);
      ctx.fill();
    }
  };

  // MODE 4: ORBITAL
  const drawOrbital = (ctx, w, h, bass, mid, treble, avg) => {
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.22;
    const coreR = baseR * (0.8 + bass * 0.45);

    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseR * 2.2);
    glow.addColorStop(0, hexToRgba(accentColor, 0.5 + bass * 0.4));
    glow.addColorStop(0.5, hexToRgba(secondaryColor, 0.2));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0f1d';
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accentColor, 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();

    const rings = [
      { r: coreR * 0.75, count: 6, width: 4, speed: 0.015, color: accentColor },
      { r: coreR * 1.05, count: 12, width: 3, speed: -0.012, color: secondaryColor },
      { r: coreR * 1.35, count: 18, width: 2, speed: 0.008, color: accentColor }
    ];

    rings.forEach((ring) => {
      const segAngle = (Math.PI * 2) / ring.count;
      for (let s = 0; s < ring.count; s++) {
        const start = s * segAngle + phaseRef.current * ring.speed * 60;
        const end = start + segAngle * 0.65;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, start, end);
        ctx.strokeStyle = hexToRgba(ring.color, 0.7 + mid * 0.3);
        ctx.lineWidth = ring.width;
        ctx.stroke();
      }
    });

    const spikes = 64;
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2 + phaseRef.current * 0.2;
      const data = dataArrayRef.current;
      const binIdx = Math.floor((i / spikes) * (data ? data.length * 0.5 : 30));
      const val = data ? (data[binIdx] / 255) : 0.2;
      const spikeLen = 10 + val * 65 * (1 + bass * 0.8);

      const x1 = cx + Math.cos(angle) * (coreR * 1.4);
      const y1 = cy + Math.sin(angle) * (coreR * 1.4);
      const x2 = cx + Math.cos(angle) * (coreR * 1.4 + spikeLen);
      const y2 = cy + Math.sin(angle) * (coreR * 1.4 + spikeLen);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = hexToRgba(accentColor, 0.4 + val * 0.6);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  };

  // MODE 5: RADIAL
  const drawRadial = (ctx, w, h, bass, mid, treble, avg) => {
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.24;
    const bars = 80;

    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 29, 0.7)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accentColor, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const normI = i <= bars / 2 ? i / (bars / 2) : (bars - i) / (bars / 2);
      const data = dataArrayRef.current;
      const binIdx = Math.floor(Math.pow(normI, 1.2) * (data ? data.length * 0.6 : 40));
      const val = data ? (data[binIdx] / 255) : 0.15;

      const barLen = Math.max(4, val * 90 * (1 + bass * 0.7));
      const rInner = baseRadius;
      const rOuter = baseRadius + barLen;

      const x1 = cx + Math.cos(angle) * rInner;
      const y1 = cy + Math.sin(angle) * rInner;
      const x2 = cx + Math.cos(angle) * rOuter;
      const y2 = cy + Math.sin(angle) * rOuter;

      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      barGrad.addColorStop(0, hexToRgba(accentColor, 0.3));
      barGrad.addColorStop(1, hexToRgba(secondaryColor, 0.95));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = barGrad;
      ctx.lineWidth = (Math.PI * 2 * baseRadius / bars) * 0.65;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  };

  const cycleMode = () => {
    setMode((prev) => {
      const idx = VISUALIZER_MODES.indexOf(prev);
      return VISUALIZER_MODES[(idx + 1) % VISUALIZER_MODES.length];
    });
  };

  useImperativeHandle(ref, () => ({
    cycleMode,
    setMode,
    toggleFullscreen
  }));

  return (
    <div className="visualizer-container" ref={containerRef}>
      <canvas ref={canvasRef} id="visualizer-canvas" />

      <div className="visualizer-overlay-bar">
        <div className="vis-modes-group">
          <button
            className={`vis-mode-btn ${mode === 'nebula' ? 'active' : ''}`}
            onClick={() => setMode('nebula')}
            title="3D Orbiting Particle Nebula"
          >
            <Sparkles size={13} /> Nebula
          </button>
          <button
            className={`vis-mode-btn ${mode === 'liquid' ? 'active' : ''}`}
            onClick={() => setMode('liquid')}
            title="Flowing Sinusoidal Silk"
          >
            <Waves size={13} /> Liquid
          </button>
          <button
            className={`vis-mode-btn ${mode === 'spectrum' ? 'active' : ''}`}
            onClick={() => setMode('spectrum')}
            title="Glass Equalizer Pillars"
          >
            <BarChart2 size={13} /> Spectrum
          </button>
          <button
            className={`vis-mode-btn ${mode === 'orbital' ? 'active' : ''}`}
            onClick={() => setMode('orbital')}
            title="Cybernetic Pulsar Reactor"
          >
            <Atom size={13} /> Orbital
          </button>
          <button
            className={`vis-mode-btn ${mode === 'radial' ? 'active' : ''}`}
            onClick={() => setMode('radial')}
            title="360° Circular Soundwave"
          >
            <Disc size={13} /> Radial
          </button>
        </div>
      </div>

      <button className="vis-fullscreen-btn" onClick={toggleFullscreen} title="Fullscreen Visualizer (F)">
        <Maximize2 size={15} />
      </button>

      {/* Only shown via CSS while actually in fullscreen (:fullscreen) */}
      <img src="/1cell-logo.svg" alt="1Cell AI" className="vis-fullscreen-logo" />
    </div>
  );
});

export default VisualizerCanvas;

// Color and Shape Helpers
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0, 240, 255, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function interpolateColor(color1, color2, factor) {
  const c1 = parseInt(color1.replace('#', ''), 16);
  const c2 = parseInt(color2.replace('#', ''), 16);
  const r = Math.round(((c1 >> 16) & 255) + factor * (((c2 >> 16) & 255) - ((c1 >> 16) & 255)));
  const g = Math.round(((c1 >> 8) & 255) + factor * (((c2 >> 8) & 255) - ((c1 >> 8) & 255)));
  const b = Math.round((c1 & 255) + factor * ((c2 & 255) - (c1 & 255)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

