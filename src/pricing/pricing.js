/**
 * Feature 1 — Pricing Matrix & Performance-Isolated Currency Switcher (Phase B)
 * ===========================================================================
 * THE ISOLATION ARCHITECTURE (this is the 15-pt scored core, BRIEF §7)
 * ---------------------------------------------------------------------------
 * No framework. No reactive system. The lifecycle is deliberately three sharp
 * phases:
 *
 *   1. RENDER ONCE  — build the cards + controls a single time via one
 *      `root.innerHTML =` assignment. After this, innerHTML is never touched
 *      again and no card/container is ever rebuilt.
 *
 *   2. CACHE        — query and store DIRECT references to ONLY the nodes that
 *      will ever mutate: the per-tier odometer digit strips, the currency
 *      symbol, the /mo·/yr suffix, the billing note, and the screen-reader
 *      price text. Everything else (grid, cards, headings, feature lists) is
 *      captured in `refs` by value-of-reference and then left untouched.
 *
 *   3. UPDATE       — on a billing toggle OR currency change we `compute →
 *      write to cached nodes`. The digit roll is done by writing a single
 *      custom property (`--odo-y`) that the CSS turns into a GPU-composited
 *      `translateY`. We NEVER read layout (no offsetHeight / getBounding
 *      ClientRect), never set innerHTML on a container, never re-render a
 *      parent. The only DOM writes are: a transform var on the digit strips,
 *      and `.textContent` on a handful of fixed-width / fixed-height text
 *      nodes. → zero parent reflow, provable under DevTools.
 */
import {
  PRICING,
  TIER_ORDER,
  CURRENCY_ORDER,
  BILLING,
  computePrice,
  groupSeparator,
  formatNumber,
  maxPriceDigits,
} from './pricing.config.js';

/* Odometer cell vocabularies. Index 0 is ALWAYS the blank cell, so leading /
   unused slots can roll to "nothing" while still reserving their width — that's
   how the container stays a constant width as digit counts change (999 ↔ 1,200,
   ₹8,000 ↔ $96). A digit `d` lives at strip index `d + 1`. */
const DIGIT_CELLS = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SEP_CELLS = ['', ',', '.'];
const STAGGER_MS = 35; // left→right per-column cascade (BRIEF §7: ~30–40ms)

/* Inline SVGs from the asset pack (currentColor so they inherit the palette). */
const ICON_CHEVRON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m8.25 4.5l7.5 7.5l-7.5 7.5"/></svg>';
const ICON_TREND =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>';
const ICON_CHECK =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75l6 6 9-13.5"/></svg>';

/* ---- Module state: the ONLY source of truth for what is displayed. ---- */
const state = { currency: CURRENCY_ORDER[0], annual: false };

/* ---- Caches (populated once in cacheRefs, then read-only). ---- */
const refs = {}; // tierKey -> { strips[], symbolEl, suffixEl, noteEl, srEl }
const segs = {}; // 'billing' | 'currency' -> { el, buttons[] }
let statusEl = null; // aria-live status region
let template = []; // ordered slots: {type:'digit'} | {type:'sep', digitsToRight}

/* ===========================================================================
   TEMPLATE — the fixed odometer layout, derived from the matrix.
   Builds `maxDigits` digit slots plus a separator slot at each group boundary
   (every 3 digits from the right). Because the slot count is fixed for ALL
   values, the price box never changes width → no layout shift, ever.
   =========================================================================== */
function buildTemplate(maxDigits) {
  const slots = [];
  for (let place = maxDigits - 1; place >= 0; place--) {
    slots.push({ type: 'digit' });
    // A thousands separator follows a digit that ends a 3-group (and isn't units).
    if (place % 3 === 0 && place !== 0) {
      slots.push({ type: 'sep', digitsToRight: place });
    }
  }
  return slots;
}

/**
 * Map an integer value → one target cell-index per slot (aligned to `template`).
 * Digits are right-aligned; unused leading slots roll to blank (index 0). A
 * separator shows only when the value has more digits than sit to its right.
 * Pure arithmetic — NO DOM reads.
 */
function slotTargets(value, sepChar) {
  const digits = String(value).split('');
  const digitSlots = template.filter((s) => s.type === 'digit').length;
  const pad = digitSlots - digits.length;
  const sepIdx = Math.max(SEP_CELLS.indexOf(sepChar), 1);

  const out = [];
  let d = 0; // index across the (padded) digit positions, left → right
  for (const slot of template) {
    if (slot.type === 'digit') {
      out.push(d < pad ? 0 : DIGIT_CELLS.indexOf(digits[d - pad]));
      d++;
    } else {
      out.push(digits.length > slot.digitsToRight ? sepIdx : 0);
    }
  }
  return out;
}

/* ===========================================================================
   HTML builders (used ONCE, at mount).
   =========================================================================== */
function odoSlotHTML(slot, cellIdx, delayMs) {
  const cells = (slot.type === 'digit' ? DIGIT_CELLS : SEP_CELLS)
    .map((c) => `<span class="odo__cell">${c}</span>`)
    .join('');
  const winCls = slot.type === 'digit' ? 'odo__win--digit' : 'odo__win--sep';
  return (
    `<span class="odo__win ${winCls}">` +
    `<span class="odo__strip" style="--odo-y:${cellIdx};--col-delay:${delayMs}ms">${cells}</span>` +
    `</span>`
  );
}

function priceRowHTML(tierKey) {
  const cur = PRICING.currencies[state.currency];
  const value = computePrice(tierKey, state.currency, state.annual);
  const targets = slotTargets(value, groupSeparator(cur.locale));
  const odo = template
    .map((slot, i) => odoSlotHTML(slot, targets[i], i * STAGGER_MS))
    .join('');
  const suffix = BILLING[state.annual ? 'annual' : 'monthly'].suffix;

  return (
    `<p class="tier__price-row">` +
    `<span class="price" data-tier="${tierKey}" aria-hidden="true">` +
    `<span class="price__symbol">${cur.symbol}</span>` +
    `<span class="odo">${odo}</span>` +
    `</span>` +
    `<span class="price__suffix" data-tier="${tierKey}" aria-hidden="true">${suffix}</span>` +
    `</p>`
  );
}

function srPriceText(tierKey) {
  const cur = PRICING.currencies[state.currency];
  const value = computePrice(tierKey, state.currency, state.annual);
  const billing = BILLING[state.annual ? 'annual' : 'monthly'];
  return `${PRICING.tiers[tierKey].label} plan, ${cur.symbol}${formatNumber(
    value,
    cur.locale,
  )} ${billing.suffix}`;
}

function tierCardHTML(tierKey) {
  const t = PRICING.tiers[tierKey];
  const note = BILLING[state.annual ? 'annual' : 'monthly'].note;
  const badge = t.popular
    ? `<span class="tier__badge">${ICON_TREND}Most popular</span>`
    : '';
  const features = t.features
    .map((f) => `<li class="tier__feature">${ICON_CHECK}<span>${f}</span></li>`)
    .join('');

  return (
    `<article class="tier${t.popular ? ' tier--popular' : ''}"${
      t.popular ? ' aria-label="Pro — most popular plan"' : ''
    }>` +
    `<header class="tier__head"><h3 class="tier__name">${t.label}</h3>${badge}</header>` +
    `<p class="tier__blurb">${t.blurb}</p>` +
    priceRowHTML(tierKey) +
    `<p class="tier__note" data-tier-note="${tierKey}">${note}</p>` +
    `<span class="sr-only" data-sr-price="${tierKey}">${srPriceText(tierKey)}</span>` +
    `<ul class="tier__features">${features}</ul>` +
    `<a class="btn ${t.popular ? 'btn--primary' : 'btn--ghost'} btn--block tier__cta" href="#footer">` +
    `${t.cta}<span class="btn__chevron" aria-hidden="true">${ICON_CHEVRON}</span>` +
    `</a>` +
    `</article>`
  );
}

function controlsHTML() {
  const billingBtns = [
    ['monthly', 'Monthly'],
    ['annual', 'Annual'],
  ]
    .map(
      ([k, label], i) =>
        `<button class="seg__btn" type="button" role="radio" aria-checked="${
          i === 0
        }" tabindex="${i === 0 ? 0 : -1}" data-billing="${k}">${label}${
          k === 'annual' ? ' <span class="seg__save">−20%</span>' : ''
        }</button>`,
    )
    .join('');

  const currencyBtns = CURRENCY_ORDER.map(
    (c, i) =>
      `<button class="seg__btn" type="button" role="radio" aria-checked="${
        i === 0
      }" tabindex="${i === 0 ? 0 : -1}" data-currency="${c}">${c}</button>`,
  ).join('');

  return (
    `<div class="pricing__controls">` +
    `<div class="seg seg--billing" role="radiogroup" aria-label="Billing cycle" style="--n:2;--idx:0">` +
    `<span class="seg__indicator" aria-hidden="true"></span>${billingBtns}</div>` +
    `<div class="seg seg--currency" role="radiogroup" aria-label="Currency" style="--n:${CURRENCY_ORDER.length};--idx:0">` +
    `<span class="seg__indicator" aria-hidden="true"></span>${currencyBtns}</div>` +
    `</div>`
  );
}

/* ===========================================================================
   CACHE — store direct references to ONLY the mutable nodes.
   =========================================================================== */
function cacheRefs(root) {
  statusEl = root.querySelector('.pricing__status');

  for (const tierKey of TIER_ORDER) {
    const priceEl = root.querySelector(`.price[data-tier="${tierKey}"]`);
    refs[tierKey] = {
      // The roll targets: every digit/separator strip, in template order.
      strips: Array.from(priceEl.querySelectorAll('.odo__strip')),
      symbolEl: priceEl.querySelector('.price__symbol'),
      suffixEl: root.querySelector(`.price__suffix[data-tier="${tierKey}"]`),
      noteEl: root.querySelector(`[data-tier-note="${tierKey}"]`),
      srEl: root.querySelector(`[data-sr-price="${tierKey}"]`),
    };
  }

  for (const which of ['billing', 'currency']) {
    const el = root.querySelector(`.seg--${which}`);
    segs[which] = { el, buttons: Array.from(el.querySelectorAll('.seg__btn')) };
  }
}

/* ===========================================================================
   UPDATE — compute → write to cached nodes. The whole guardrail lives here.
   =========================================================================== */
function render() {
  const cur = PRICING.currencies[state.currency];
  const billing = BILLING[state.annual ? 'annual' : 'monthly'];
  const sepChar = groupSeparator(cur.locale);

  for (const tierKey of TIER_ORDER) {
    const ref = refs[tierKey];
    const value = computePrice(tierKey, state.currency, state.annual);
    const targets = slotTargets(value, sepChar);

    // (1) Roll the odometer: transform-only, one custom-property write per
    //     strip. No layout read, no reflow — pure compositor work.
    for (let i = 0; i < ref.strips.length; i++) {
      ref.strips[i].style.setProperty('--odo-y', targets[i]);
    }

    // (2) Static, fixed-footprint text nodes. The symbol box is fixed-width,
    //     the suffix is constant-width, and the note has a reserved min-height,
    //     so these textContent writes repaint without shifting any layout.
    ref.symbolEl.textContent = cur.symbol;
    ref.suffixEl.textContent = billing.suffix;
    ref.noteEl.textContent = billing.note;
    // (3) Accessible price text (sr-only is position:absolute → out of flow).
    ref.srEl.textContent = srPriceText(tierKey);
  }

  if (statusEl) {
    statusEl.textContent = `Prices updated — ${state.currency}, ${billing.label} billing.`;
  }
}

/* ===========================================================================
   CONTROLS — segmented pills with a transform-driven sliding indicator.
   Their own active-state visuals change; they never touch the price layout.
   =========================================================================== */
function setSeg(which, idx) {
  const seg = segs[which];
  seg.el.style.setProperty('--idx', idx); // indicator slide = translateX (CSS)
  seg.buttons.forEach((btn, i) => {
    const on = i === idx;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  });
}

function onBilling(annual, idx) {
  if (annual === state.annual) return;
  state.annual = annual;
  setSeg('billing', idx);
  render();
}

function onCurrency(currency, idx) {
  if (currency === state.currency) return;
  state.currency = currency;
  setSeg('currency', idx);
  render();
}

function activate(which, btn) {
  const idx = segs[which].buttons.indexOf(btn);
  if (which === 'billing') onBilling(btn.dataset.billing === 'annual', idx);
  else onCurrency(btn.dataset.currency, idx);
}

function wireControls() {
  for (const which of ['billing', 'currency']) {
    const seg = segs[which];

    seg.el.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg__btn');
      if (btn) activate(which, btn);
    });

    // Roving-focus arrow-key support for the radiogroup (a11y).
    seg.el.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const current = segs[which].buttons.findIndex(
        (b) => b.getAttribute('aria-checked') === 'true',
      );
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next =
        (current + dir + seg.buttons.length) % seg.buttons.length;
      const btn = seg.buttons[next];
      activate(which, btn);
      btn.focus();
    });
  }
}

/* ===========================================================================
   MOUNT — render once, cache, wire. Public entry point.
   =========================================================================== */
export function mountPricing(root) {
  if (!root) return;

  // Derive the fixed odometer layout from the matrix (not hardcoded).
  template = buildTemplate(maxPriceDigits());

  root.classList.add('pricing');
  root.classList.remove('section__placeholder');
  root.removeAttribute('data-phase');

  // The ONE and only innerHTML write. Everything after is surgical.
  root.innerHTML =
    controlsHTML() +
    `<div class="pricing__grid">${TIER_ORDER.map(tierCardHTML).join('')}</div>` +
    `<p class="pricing__status sr-only" role="status" aria-live="polite"></p>`;

  cacheRefs(root);
  wireControls();
  // Initial prices are baked into the markup, so no first-frame roll is needed.
}
