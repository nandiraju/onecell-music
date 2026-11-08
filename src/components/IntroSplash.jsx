import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PARTICLE_COUNT = 20;
const INTRO_SEEN_KEY = '1cell-intro-seen';

// Cinematic boot sequence: logo assembles from a blurred speck, rings and
// sparks pulse outward, then the whole thing rockets toward the viewer in an
// accelerating zoom that whites out into a flash — which is the moment the
// Now Playing screen (already mounted behind this overlay) gets revealed.
export default function IntroSplash({ onComplete, force = false }) {
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const glowRef = useRef(null);
  const ringRefs = useRef([]);
  const particleRefs = useRef([]);
  const flashRef = useRef(null);
  const skippedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      try { window.sessionStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) { /* storage unavailable */ }
      onComplete();
    };

    // Keep the test suite fast/deterministic and respect accessibility +
    // "already saw it this session" — all three skip straight to the app.
    const isTestEnv = import.meta.env.MODE === 'test';
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let alreadySeen = false;
    try { alreadySeen = window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch (e) { /* storage unavailable */ }

    if (isTestEnv || prefersReducedMotion || (alreadySeen && !force)) {
      finish();
      return undefined;
    }

    const root = rootRef.current;
    const logo = logoRef.current;
    const glow = glowRef.current;
    const rings = ringRefs.current;
    const particles = particleRefs.current;
    const flash = flashRef.current;

    gsap.set(logo, { scale: 0.15, opacity: 0, rotateZ: -10, filter: 'blur(14px)' });
    gsap.set(glow, { scale: 0.3, opacity: 0 });
    gsap.set(rings, { scale: 0.2, opacity: 0 });
    gsap.set(particles, { scale: 0, opacity: 0 });
    gsap.set(flash, { opacity: 0 });
    gsap.set(root, { autoAlpha: 1 });

    const tl = gsap.timeline({
      onComplete: () => { if (!skippedRef.current) finish(); }
    });

    tl
      // Logo materializes out of the dark, glow blooms behind it.
      .to(glow, { scale: 1, opacity: 0.9, duration: 0.6, ease: 'power2.out' }, 0)
      .to(logo, { scale: 1.08, opacity: 1, rotateZ: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 0.05)
      // Concentric rings ripple outward as the logo lands.
      .to(rings, { scale: 2.6, opacity: 0, duration: 1.1, ease: 'power2.out', stagger: 0.12 }, 0.1)
      // Spark burst right as the logo settles.
      .to(particles, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out', stagger: { each: 0.012, from: 'random' } }, 0.55)
      .to(particles, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 0.8)
      // Tiny settle-bounce so the landing reads as solid, not just a stop.
      .to(logo, { scale: 1, duration: 0.35, ease: 'back.out(2.2)' }, 0.95)
      .to({}, { duration: 0.3 })
      // Camera-push: logo rockets toward the viewer and blows out to white.
      .to(glow, { opacity: 0.55, scale: 1.5, duration: 0.5, ease: 'power1.inOut' }, '<')
      .to(logo, { scale: 18, opacity: 0, duration: 0.55, ease: 'power4.in' }, '-=0.1')
      .to(flash, { opacity: 1, duration: 0.22, ease: 'power2.in' }, '-=0.32')
      .to(flash, { opacity: 0, duration: 0.45, ease: 'power2.out' })
      // Overlay itself dissolves, handing off to the Now Playing screen underneath.
      .to(root, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, '-=0.15');

    const skip = () => {
      if (skippedRef.current) return;
      skippedRef.current = true;
      tl.kill();
      gsap.set(root, { autoAlpha: 0 });
      finish();
    };

    root.addEventListener('click', skip);
    window.addEventListener('keydown', skip);

    return () => {
      tl.kill();
      root.removeEventListener('click', skip);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const angles = Array.from({ length: PARTICLE_COUNT }, (_, i) => (360 / PARTICLE_COUNT) * i);

  return (
    <div className="intro-splash" ref={rootRef}>
      <div className="intro-grid-bg" />
      <div className="intro-vignette" />
      <div className="intro-stage">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`intro-ring intro-ring--${i}`} ref={(el) => { ringRefs.current[i] = el; }} />
        ))}
        <div className="intro-particle-field">
          {angles.map((angle, i) => (
            <span key={angle} className="intro-particle" style={{ '--angle': `${angle}deg` }}>
              <i className="intro-particle-dot" ref={(el) => { particleRefs.current[i] = el; }} />
            </span>
          ))}
        </div>
        <div className="intro-logo-glow" ref={glowRef} />
        <img src="/1cell-logo.svg" alt="1Cell.Ai" className="intro-logo" ref={logoRef} draggable="false" />
      </div>
      <div className="intro-flash" ref={flashRef} />
      <div className="intro-skip-hint">Click or press any key to skip</div>
    </div>
  );
}
