/**
 * Testimonials carousel (BRIEF §10) — zero-dependency snap-scroll row.
 * ===========================================================================
 * Renders real <article> cards (crawlable quotes) into #testimonials-root and
 * wires three input modes over ONE native scroller:
 *   • snap scroll  — CSS `scroll-snap-type` does the settling,
 *   • drag / swipe — pointer events map 1:1 to scrollLeft (snap re-engages on
 *                    release); native touch scrolling is left to the browser,
 *   • keyboard     — real <button> chevron-left/right controls + focusable
 *                    cards, so Tab + Enter/Space drive the whole thing.
 * Prev/next disable at the track ends. Smooth scrolling degrades to instant
 * under prefers-reduced-motion. Never reads or writes the pricing/bento state.
 */

/* Inline SVGs from the asset pack — all currentColor (BRIEF §5). */
const STAR =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345z"/></svg>';
const LINK_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>';
const CHEVRON_LEFT =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>';
const CHEVRON_RIGHT =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m8.25 4.5l7.5 7.5l-7.5 7.5"/></svg>';

/** Real-feeling proof. Rendered here, never hardcoded into index.html. */
const TESTIMONIALS = [
  {
    initials: 'PN',
    name: 'Priya Nair',
    role: 'VP Data',
    company: 'Northwind Logistics',
    rating: 5,
    quote:
      'Strata replaced four brittle Airflow DAGs in a weekend. Our freshness SLA went from “sometime tomorrow” to under a minute — and nobody babysits pipelines anymore.',
  },
  {
    initials: 'MH',
    name: 'Marcus Holloway',
    role: 'Head of Analytics',
    company: 'Corewave',
    rating: 5,
    quote:
      'The autonomous modeling is the real deal. It caught a schema drift at 2am, reshaped the feature set, and shipped the fix before our on-call even woke up.',
  },
  {
    initials: 'LF',
    name: 'Lena Fischer',
    role: 'Staff Engineer',
    company: 'Vertex Labs',
    rating: 5,
    quote:
      'We cut warehouse spend by 38% in the first month. Lineage and cost in one view meant we finally killed the queries nobody remembered writing.',
  },
  {
    initials: 'DR',
    name: 'Diego Ramos',
    role: 'Director of Ops',
    company: 'Atlas Data',
    rating: 4,
    quote:
      'Onboarding took an afternoon, not a quarter. The connector grid covered every source we had — and the ones it didn’t were a webhook away.',
  },
  {
    initials: 'AK',
    name: 'Aisha Khan',
    role: 'CTO',
    company: 'Helios',
    rating: 5,
    quote:
      'The first platform our data and engineering teams actually agree on. Decisions land back in Slack and Salesforce automatically — no glue code, no tickets.',
  },
  {
    initials: 'TB',
    name: 'Tom Becker',
    role: 'Lead Data Scientist',
    company: 'Lumen',
    rating: 5,
    quote:
      'Anomaly detection that ranks what actually matters. We stopped drowning in alerts and started shipping models that move the number.',
  },
];

/** Five palette stars; the first `rating` are filled, the rest read as faint. */
function starsHTML(rating) {
  let out = '';
  for (let i = 1; i <= 5; i++) {
    out += `<span class="t-card__star${i <= rating ? '' : ' t-card__star--empty'}">${STAR}</span>`;
  }
  return out;
}

function cardHTML(t) {
  return (
    `<article class="t-card" tabindex="0" aria-roledescription="testimonial"` +
    ` aria-label="${t.name}, ${t.role} at ${t.company}">` +
    `<div class="t-card__rating" role="img" aria-label="Rated ${t.rating} out of 5">${starsHTML(t.rating)}</div>` +
    `<blockquote class="t-card__quote">${t.quote}</blockquote>` +
    `<footer class="t-card__author">` +
    `<span class="t-card__avatar" aria-hidden="true">${t.initials}</span>` +
    `<span class="t-card__meta">` +
    `<span class="t-card__name">${t.name}</span>` +
    `<span class="t-card__role">${t.role}, ${t.company}</span>` +
    `</span>` +
    `<a class="t-card__link" href="#proof" aria-label="Read ${t.company}'s story">${LINK_ICON}</a>` +
    `</footer>` +
    `</article>`
  );
}

export function mountTestimonials(root) {
  if (!root) return;

  root.classList.add('t-carousel');
  root.innerHTML =
    `<div class="t-track">${TESTIMONIALS.map(cardHTML).join('')}</div>` +
    `<div class="t-controls">` +
    `<button class="t-btn t-btn--prev" type="button" aria-label="Previous testimonial">${CHEVRON_LEFT}</button>` +
    `<button class="t-btn t-btn--next" type="button" aria-label="Next testimonial">${CHEVRON_RIGHT}</button>` +
    `</div>`;

  const track = root.querySelector('.t-track');
  const prev = root.querySelector('.t-btn--prev');
  const next = root.querySelector('.t-btn--next');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- one card + gap = the scroll step ---- */
  const stepSize = () => {
    const card = track.querySelector('.t-card');
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const page = (dir) =>
    track.scrollBy({
      left: dir * stepSize(),
      behavior: reduce.matches ? 'auto' : 'smooth',
    });

  prev.addEventListener('click', () => page(-1));
  next.addEventListener('click', () => page(1));

  /* ---- disable the arrows at the track ends (rAF-throttled) ----
     A few-px tolerance absorbs sub-pixel rounding and the track's inline
     padding, so the ends are detected cleanly. */
  const EPS = 6;
  let raf = 0;
  const sync = () => {
    raf = 0;
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= EPS;
    next.disabled = track.scrollLeft >= max - EPS;
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };
  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  sync();

  /* ---- drag to scroll (mouse/pen only; touch keeps native momentum) ---- */
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    try {
      track.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be gone — ignore */
    }
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  // Swallow the click that ends a drag so the card link doesn't navigate.
  track.addEventListener(
    'click',
    (e) => {
      if (moved) e.preventDefault();
    },
    true,
  );
}
