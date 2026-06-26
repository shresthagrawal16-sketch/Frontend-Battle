/**
 * Strata — application entry point.
 *
 * ARCHITECTURE NOTE (this is what the Phase B "state isolation" points hinge on):
 * ---------------------------------------------------------------------------
 * No framework, by design. Every UI update in this app is a *surgical* DOM
 * write — `textContent` on a cached node reference — never a container
 * re-render. Each feature is its own module that:
 *   1. mounts once into a root element,
 *   2. caches references to ONLY the nodes it will mutate (e.g. price spans),
 *   3. exposes a narrow imperative API for updates.
 * Keeping that boundary strict is what guarantees "changing currency/billing
 * touches only the targeted text nodes, zero parent reflow" under DevTools.
 *
 * PHASE A (current): import global styles + flag the document ready. There is
 * deliberately NO animation logic here — the hero entry orchestration is 100%
 * CSS (see hero.css), so it cannot block TTI or DOM indexing.
 *
 * PHASE B → ./pricing/pricing.js mounts into #pricing-root
 * PHASE C → ./modules/bento.js   mounts into #features (#bento-root)
 */
import './styles/main.css';
import { mountPricing } from './pricing/pricing.js';
import { mountBento } from './modules/bento.js';
import { mountHeroParallax } from './modules/hero.js';
import { mountEffects } from './modules/effects.js';

/**
 * Mark the document as hydrated. The CSS entry animation does NOT depend on
 * this class (it must run even if JS fails to load), but later phases can gate
 * progressive enhancements on `.is-ready`.
 */
function boot() {
  document.documentElement.classList.add('is-ready');

  // --- Phase B: dynamic pricing matrix + isolated currency/billing switch ---
  mountPricing(document.querySelector('#pricing-root'));

  // --- Phase C: bento (desktop) ↔ accordion (mobile) with context lock ---
  mountBento(document.querySelector('#bento-root'));

  // --- Polish layer: hero parallax/tilt + scroll-reveal, nav frost, count-up.
  //     Pure enhancement — runs after the feature mounts, never blocks the
  //     CSS hero entry, and bails out on touch / reduced-motion where relevant.
  mountHeroParallax(document.querySelector('#hero'));
  mountEffects();
}

boot();
