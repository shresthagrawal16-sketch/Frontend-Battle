/**
 * Hero parallax + tilt (BRIEF §6 — fake-3D depth, zero library).
 * ===========================================================================
 * Pointer-only progressive enhancement. We translate the cursor's position into
 * two custom properties on the hero (`--mx`, `--my` ∈ [-1, 1]); hero.css's
 * layered planes consume them at different rates (closer planes move more) and
 * the shard plane adds a perspective tilt. All motion is therefore native CSS —
 * this module never animates a property itself.
 *
 * Guardrails:
 *   • Bails out entirely on coarse pointers (touch) and reduced-motion, so no
 *     listeners are attached and the props stay 0 → every transform is neutral.
 *   • Writes are throttled to one rAF per frame; the layout read (the hero rect)
 *     is batched inside that same frame, never per raw pointer event.
 *   • Touches only the hero element — completely isolated from pricing/bento.
 */
export function mountHeroParallax(hero) {
  if (!hero) return;

  // Pointer-only + motion-safe. If either fails, leave the hero perfectly static.
  const finePointer = window.matchMedia('(pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  let cx = 0; // last pointer viewport coords
  let cy = 0;
  let leaving = false; // settle-to-centre flag
  let raf = 0;

  const apply = () => {
    raf = 0;
    // One layout read per frame (batched), not per pointer event.
    const r = hero.getBoundingClientRect();
    let mx = 0;
    let my = 0;
    if (!leaving && r.width && r.height) {
      mx = ((cx - r.left) / r.width - 0.5) * 2;
      my = ((cy - r.top) / r.height - 0.5) * 2;
      mx = Math.max(-1, Math.min(1, mx));
      my = Math.max(-1, Math.min(1, my));
    }
    leaving = false;
    hero.style.setProperty('--mx', mx.toFixed(3));
    hero.style.setProperty('--my', my.toFixed(3));
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return; // ignore touch drags
    cx = e.clientX;
    cy = e.clientY;
    schedule();
  });

  // On leave, zero the props; the CSS transition on .hero__par eases the settle.
  hero.addEventListener('pointerleave', () => {
    leaving = true;
    schedule();
  });
}
