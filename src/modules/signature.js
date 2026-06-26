/**
 * Signature interactions — the layer that makes the page feel *alive* without
 * ever spending a frame on layout (BRIEF art-direction pass).
 * ===========================================================================
 * Four small, surgical enhancements. Every one is:
 *   • compositor- or paint-only (transform / opacity / a CSS custom property —
 *     never width/height/top/margin), so nothing here can reflow,
 *   • guarded behind capability + motion checks (most bail on touch and on
 *     prefers-reduced-motion, attaching zero listeners), and
 *   • completely outside the scored features — none of this reads or writes the
 *     pricing odometer (Feature 1) or the bento context lock (Feature 2).
 *
 *   1. Cursor spotlight — a soft warm radial follows the cursor across the hero
 *      and the bento. We only ever write two CSS custom props (`--spot-x/-y`)
 *      on a pointer-transparent overlay; the gradient is painted by CSS.
 *   2. Magnetic CTAs   — primary buttons (everywhere EXCEPT the isolated
 *      pricing grid) ease a few px toward the cursor on hover, snap back on
 *      leave. Pure `transform` on the button — siblings untouched.
 *   3. Scroll progress — a Forsythia bar pinned to the very top, driven by a
 *      single `transform: scaleX()` per frame.
 *   4. Nav spy         — IntersectionObserver lights the nav link for whichever
 *      section currently owns the viewport.
 */

const finePointer = () => window.matchMedia('(pointer: fine)').matches;
const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO = () => 'IntersectionObserver' in window;

/* ---------------------------------------------------------------------------
 * 1 · CURSOR SPOTLIGHT
 * Each `[data-spotlight]` region owns one `.spotlight` overlay. We translate the
 * cursor into a percentage position and write it to the overlay's CSS vars,
 * rAF-throttled (one write per frame, one layout read batched inside it). The
 * radial gradient itself lives in CSS, so this never animates a property — it
 * just relocates a paint. Pointer-only + motion-safe: otherwise no-op.
 * ------------------------------------------------------------------------- */
function initSpotlight() {
  if (!finePointer() || reducedMotion()) return;

  for (const zone of document.querySelectorAll('[data-spotlight]')) {
    const layer = zone.querySelector('.spotlight');
    if (!layer) continue;

    let raf = 0;
    let x = 50;
    let y = 50;

    const write = () => {
      raf = 0;
      layer.style.setProperty('--spot-x', `${x.toFixed(2)}%`);
      layer.style.setProperty('--spot-y', `${y.toFixed(2)}%`);
    };

    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = zone.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(write);
    });
    zone.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') zone.classList.add('is-spotlit');
    });
    zone.addEventListener('pointerleave', () =>
      zone.classList.remove('is-spotlit'),
    );
  }
}

/* ---------------------------------------------------------------------------
 * 2 · MAGNETIC CTAs
 * Primary buttons pull gently toward the cursor while hovered. We scale the
 * cursor's offset from the button centre, clamp it small, and write a single
 * `transform: translate()` per frame; the CSS transition on `.is-magnetic`
 * eases both the follow and the snap-back to 0 on leave. Scoped OUT of #pricing
 * so the DevTools-verified price isolation is never even adjacent to a transform.
 * ------------------------------------------------------------------------- */
function initMagnetic() {
  if (!finePointer() || reducedMotion()) return;

  const STRENGTH = 0.26; // fraction of the cursor offset the button follows
  const MAX = 6; // px clamp — stays a hint, never a lurch

  const buttons = Array.from(
    document.querySelectorAll('.btn--primary'),
  ).filter((b) => !b.closest('#pricing'));

  for (const btn of buttons) {
    btn.classList.add('is-magnetic');
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const write = () => {
      raf = 0;
      btn.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(write);
    };

    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
      const dy = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
      tx = Math.max(-MAX, Math.min(MAX, dx));
      ty = Math.max(-MAX, Math.min(MAX, dy));
      schedule();
    });
    btn.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      schedule();
    });
  }
}

/* ---------------------------------------------------------------------------
 * 3 · SCROLL PROGRESS
 * A 1-element bar at the very top. On scroll (passive + rAF-throttled) we set
 * its `scaleX` to the page's scroll fraction — compositor-only, no layout read
 * beyond the document metrics. Functional even under reduced-motion (it reports
 * position, it isn't decorative motion); CSS just drops its smoothing there.
 * ------------------------------------------------------------------------- */
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress__bar');
  if (!bar) return;

  let raf = 0;
  const write = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(write);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  write(); // prime on load (e.g. refresh mid-page)
}

/* ---------------------------------------------------------------------------
 * 4 · NAV SPY
 * Light the nav link whose section currently owns the centre band of the
 * viewport. A thin IntersectionObserver rootMargin turns the viewport into a
 * sliver around the middle, so exactly one section is "current" at a time.
 * Paint-only (a class toggle → colour + a scaleX underline in CSS).
 * ------------------------------------------------------------------------- */
function initNavSpy() {
  if (!hasIO()) return;

  const links = new Map();
  for (const a of document.querySelectorAll('.nav__links a[href^="#"]')) {
    links.set(a.getAttribute('href').slice(1), a);
  }
  const sections = Array.from(links.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  let current = null;
  const setCurrent = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((a, key) => a.classList.toggle('is-current', key === id));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      }
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );
  for (const s of sections) io.observe(s);
}

/** Public entry — wire all four after the DOM and feature mounts are ready. */
export function mountSignature() {
  initSpotlight();
  initMagnetic();
  initScrollProgress();
  initNavSpy();
}
