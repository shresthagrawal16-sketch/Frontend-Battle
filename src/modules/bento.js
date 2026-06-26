/**
 * Feature 2 — Bento ↔ Accordion with Context Lock (Phase C, BRIEF §8)
 * ===========================================================================
 * SINGLE DOM, CSS-DRIVEN LAYOUT SWAP — there is exactly ONE list of feature
 * <article> nodes. They are NOT duplicated for desktop/mobile. The same markup
 * is restyled purely by media query:
 *
 *   • ≥768px  → an asymmetric Bento grid (mix of large/wide/small cells), every
 *               body visible. Hover/focus highlights the "active" cell.
 *   • ≤767px  → the very same articles stack as a touch Accordion: bodies
 *               collapse via `grid-template-rows: 0fr → 1fr`, only one open at a
 *               time, the chevron rotates on open.
 *
 * THE CONTEXT LOCK (the 10-pt gotcha) — `activeIndex` is the single source of
 * truth, held in a plain JS variable (NOT inferred from the DOM):
 *
 *   • Desktop: hovering OR focusing a cell writes `activeIndex` and paints the
 *     accent highlight.
 *   • Mobile:  opening an accordion panel writes `activeIndex`.
 *   • A `matchMedia('(max-width:767px)')` `change` listener re-projects
 *     `activeIndex` onto whichever layout we just crossed into:
 *        desktop → mobile : the matching panel opens (smoothly).
 *        mobile  → desktop : that node reads as the active/highlighted cell.
 *
 * ZERO DEPENDENCIES — every bit of the accordion (open/close, single-open
 * invariant, chevron rotation, height transition) is hand-written here + CSS.
 * No animation/UI library is imported anywhere. deps stay {}.
 */

/* Inline SVGs from the asset pack — all currentColor so they inherit the
   palette from their parent (BRIEF §5). */
const ICON = {
  'arrow-path':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>',
  'cog-8-tooth':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93c.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204c.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78c-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107c-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93c-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204c-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78c.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107c.397-.165.71-.505.78-.929l.15-.894Z"/><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"/></g></svg>',
  'chart-pie':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/><path d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"/></g></svg>',
  'arrow-trending-up':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>',
  'link-solid':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037a.75.75 0 0 1-.646 1.353a5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.267a.75.75 0 0 1 1-.353a5.25 5.25 0 0 1 1.449 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757 1.757a3.75 3.75 0 1 0 5.304 5.304l4.5-4.5a3.75 3.75 0 0 0-1.035-6.037a.75.75 0 0 1-.354-1Z" clip-rule="evenodd"/></svg>',
  'cube-16-solid':
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8.372 1.349a.75.75 0 0 0-.744 0l-4.81 2.748L8 7.131l5.182-3.034zM14 5.357L8.75 8.43v6.005l4.872-2.784A.75.75 0 0 0 14 11zm-6.75 9.078V8.43L2 5.357V11c0 .27.144.518.378.651z"/></svg>',
  'chevron-down':
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19.5 8.25l-7.5 7.5l-7.5-7.5"/></svg>',
};

/**
 * The ONE list of feature nodes (rendered, never hardcoded in HTML).
 * `size` drives the asymmetric bento spans on desktop; it is ignored in the
 * mobile accordion. Each icon is mapped meaningfully per BRIEF §5.
 */
const FEATURES = [
  {
    icon: 'arrow-path',
    size: 'lg',
    title: 'Real-time ingestion',
    desc: 'Stream from Kafka, Postgres, S3, or any of 200+ connectors. Strata ingests, dedupes, and schematizes every event the moment it lands — no batch windows, no nightly jobs to babysit.',
  },
  {
    icon: 'cog-8-tooth',
    size: 'wide',
    title: 'Autonomous modeling',
    desc: 'Models retrain themselves as your data drifts. Strata profiles each column, proposes transforms, and keeps feature pipelines fresh — without a data engineer in the loop.',
  },
  {
    icon: 'chart-pie',
    size: 'sm',
    title: 'Anomaly detection',
    desc: 'Baselines every metric automatically and surfaces the outliers that matter, ranked by what changed, why, and which segment drove it.',
  },
  {
    icon: 'arrow-trending-up',
    size: 'sm',
    title: 'Live observability',
    desc: 'Trace every record from source to decision. Freshness, lineage, and cost dashboards update live so pipelines never go stale unnoticed.',
  },
  {
    icon: 'link-solid',
    size: 'wide',
    title: 'Native integrations',
    desc: 'Push decisions back into the tools your team already runs — Slack, Salesforce, webhooks, reverse-ETL. One config, bi-directional sync, zero glue code.',
  },
  {
    icon: 'cube-16-solid',
    size: 'wide',
    title: 'Enterprise platform',
    desc: 'SOC 2 Type II, role-based access, and single-tenant isolation on a serverless core that scales from your first event to billions a day.',
  },
];

/* ---- Module state ---- */
let items = []; // article elements, in render order (index === array index)
let activeIndex = 0; // SINGLE SOURCE OF TRUTH for the context lock
let mql = null; // matchMedia('(max-width: 767px)') — true ⇒ accordion mode

/* ===========================================================================
   RENDER (once, at mount). All feature copy comes from FEATURES — none of it
   is baked into index.html. Header is a real <button> inside an <h3> (WAI-ARIA
   accordion pattern) with aria-expanded + aria-controls; the panel carries the
   matching id and is a labelled region.
   =========================================================================== */
function featureHTML(f, i) {
  const open = i === activeIndex;
  return (
    `<article class="feat feat--${f.size}${open ? ' is-active is-open' : ''}" data-index="${i}">` +
    `<h3 class="feat__heading">` +
    `<button class="feat__toggle" id="feat-btn-${i}" type="button"` +
    ` aria-expanded="${open}" aria-controls="feat-panel-${i}">` +
    `<span class="feat__icon">${ICON[f.icon]}</span>` +
    `<span class="feat__title">${f.title}</span>` +
    `<span class="feat__chevron">${ICON['chevron-down']}</span>` +
    `</button>` +
    `</h3>` +
    `<div class="feat__panel" id="feat-panel-${i}" role="region" aria-labelledby="feat-btn-${i}">` +
    `<div class="feat__panel-inner"><p class="feat__desc">${f.desc}</p></div>` +
    `</div>` +
    `</article>`
  );
}

/* ===========================================================================
   STATE PROJECTION — three tiny writers, all driven by `activeIndex`.
   =========================================================================== */

/** Paint the context-lock highlight onto whichever cell is active. */
function paintHighlight() {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle('is-active', i === activeIndex);
  }
}

/** Accordion writer: open exactly `openIdx` (or none when -1). */
function setOpen(openIdx) {
  for (let i = 0; i < items.length; i++) {
    const on = i === openIdx;
    items[i].classList.toggle('is-open', on);
    items[i]
      .querySelector('.feat__toggle')
      .setAttribute('aria-expanded', String(on));
  }
}

/** Bento writer: every body is visible, so every header reads as expanded. */
function expandAll() {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('is-open');
    items[i].querySelector('.feat__toggle').setAttribute('aria-expanded', 'true');
  }
}

/**
 * Re-project `activeIndex` onto the current layout. Called once at mount and on
 * every breakpoint crossing — THIS is what carries the active node across the
 * Bento↔Accordion boundary in both directions.
 */
function applyMode() {
  if (mql.matches) setOpen(activeIndex); // mobile  → open the active panel
  else expandAll(); //                      desktop → all bodies visible
  paintHighlight(); // highlight tracks the active node in both layouts
}

/* ===========================================================================
   INTERACTION — desktop hover/focus sets active; mobile click toggles accordion.
   =========================================================================== */

/** Desktop only: hovering/focusing a cell makes it the active node. */
function activate(i) {
  if (mql.matches || i === activeIndex) return;
  activeIndex = i;
  paintHighlight();
}

/** Click handler shared by mouse + keyboard (real <button> ⇒ Enter/Space). */
function onToggle(i, btn) {
  if (mql.matches) {
    // Accordion: toggle this panel, enforce single-open, remember the node.
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    activeIndex = i; // last-touched node stays "active" across the breakpoint
    setOpen(isOpen ? -1 : i);
    paintHighlight();
  } else {
    activate(i); // Bento: a click is just another way to highlight
  }
}

/* ===========================================================================
   MOUNT — render once, wire listeners, project initial state. Public entry.
   =========================================================================== */
export function mountBento(root) {
  if (!root) return;

  root.classList.add('bento');
  root.classList.remove('section__placeholder');
  root.removeAttribute('data-phase');

  // The ONE and only innerHTML write for this feature.
  root.innerHTML = FEATURES.map(featureHTML).join('');
  items = Array.from(root.querySelectorAll('.feat'));

  mql = window.matchMedia('(max-width: 767px)');

  // Toggle via delegation (covers the button and the svg inside it).
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.feat__toggle');
    if (!btn) return;
    onToggle(Number(btn.closest('.feat').dataset.index), btn);
  });

  // Desktop context lock: hover OR keyboard-focus a cell to make it active.
  // (mouseenter/focusin don't bubble, so bind per node — cheap, 6 nodes.)
  for (const it of items) {
    const i = Number(it.dataset.index);
    it.addEventListener('mouseenter', () => activate(i));
    it.addEventListener('focusin', () => activate(i));
  }

  // The breakpoint listener — one event, not resize spam. Re-projects the lock.
  mql.addEventListener('change', applyMode);

  applyMode(); // initial paint from activeIndex (correct for either layout)
}
