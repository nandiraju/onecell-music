import { useEffect, useRef } from 'react';

const INTRO_SEEN_KEY = '1cell-intro-seen';

// Static boot screen: logo + skip hint. No motion — click, press any key,
// or wait out the timeout to continue to the Now Playing screen.
export default function IntroSplash({ onComplete, force = false }) {
  const rootRef = useRef(null);
  const skippedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      try { window.sessionStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) { /* storage unavailable */ }
      onComplete();
    };

    const isTestEnv = import.meta.env.MODE === 'test';
    let alreadySeen = false;
    try { alreadySeen = window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch (e) { /* storage unavailable */ }

    if (isTestEnv || (alreadySeen && !force)) {
      finish();
      return undefined;
    }

    const root = rootRef.current;

    const skip = () => {
      if (skippedRef.current) return;
      skippedRef.current = true;
      finish();
    };

    const timeoutId = window.setTimeout(skip, 1800);
    root.addEventListener('click', skip);
    window.addEventListener('keydown', skip);

    return () => {
      window.clearTimeout(timeoutId);
      root.removeEventListener('click', skip);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="intro-splash" ref={rootRef}>
      <img src="/1cell-logo.svg" alt="1Cell.Ai" className="intro-logo" draggable="false" />
      <div className="intro-skip-hint">Click or press any key to skip</div>
    </div>
  );
}
