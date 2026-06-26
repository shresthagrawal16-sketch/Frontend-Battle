/**
 * Effects — scroll-reveal, nav scroll-state, and stat count-up (BRIEF §6, §7).
 * ===========================================================================
 * Three small, native enhancements that decorate the page around the scored
 * features. All are IntersectionObserver-driven (no scroll spam) and degrade
 * gracefully: with no-JS or reduced-motion the content is simply shown at rest.
 * None of them read or mutate the pricing odometer or the bento context lock.
 */

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO = () => 'IntersectionObserver' in window;

/* ---------------------------------------------------------------------------
 * Nav glassmorphism scroll-state — a 1px sentinel at the top of the page. Once
 * it scrolls out of view, the sticky header deepens its frost + lifts a shadow.
 * ------------------------------------------------------------------------- */
function initNavScroll() {
  const header = document.querySelector('.site-header');
  const sentinel = document.querySelector('.scroll-sentinel');
  if (!header || !sentinel || !hasIO()) return;

  const io = new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
    { threshold: 0 },
  );
  io.observe(sentinel);
}

/* ---------------------------------------------------------------------------
 * Scroll-reveal — fade-up [data-reveal] blocks as they enter (~300ms, 12px).
 * The hidden start-state lives behind `.reveal-on` (added here only when motion
 * is allowed), so without it everything renders visible. Never the hero.
 * ------------------------------------------------------------------------- */
function initReveal() {
  // `[data-reveal]` fades a block in as one unit; `[data-reveal-group]` does the
  // same but its CSS staggers the block's direct children for section
  // choreography. Both share this single observer.
  const els = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if (!els.length) return;

  if (prefersReduced() || !hasIO()) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // reveal once, then stop watching
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------------------
 * Stat count-up — ease-out roll from 0 to the real value over ~1000ms, fired
 * when the strip enters view. Timing comes from the rAF timestamp (no timers).
 * The real numbers stay in the HTML for SEO; we only re-count them on scroll-in.
 * ------------------------------------------------------------------------- */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function formatStat(value, el) {
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const grouped = el.dataset.group === 'true';
  const fixed = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  if (!grouped) return fixed;
  return Number(fixed).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function countUp(el) {
  const target = parseFloat(el.dataset.countTo);
  if (!Number.isFinite(target)) return;
  const duration = 1000;
  let start = null;

  const frame = (now) => {
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / duration);
    el.textContent = formatStat(target * easeOutCubic(t), el);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = formatStat(target, el); // exact final value
  };
  requestAnimationFrame(frame);
}

function initStats() {
  const nums = document.querySelectorAll('[data-count-to]');
  if (!nums.length) return;

  // Reduced-motion / no-IO: leave the real values from the HTML untouched.
  if (prefersReduced() || !hasIO()) return;

  // Prime each to 0 (the strip is below the fold, so no visible flash).
  nums.forEach((el) => (el.textContent = formatStat(0, el)));

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target);
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.4 },
  );
  nums.forEach((el) => io.observe(el));
}

/** Public entry — wire all three after the DOM (and feature mounts) are ready. */
export function mountEffects() {
  initNavScroll();
  initReveal();
  initStats();
}
