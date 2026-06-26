# BRIEF.md — Next-Gen AI Platform Speed Run (Phase 1)

> Single source of truth for this build. Read this fully before writing any code.
> 3-hour timed hackathon. Vibe-coding with Claude Code. Optimize for the scoring matrix, not for feature creep.

---

## 0. NON-NEGOTIABLE STACK DECISION

- **Vanilla JS + Vite + custom CSS variables.** NO React/Next/Vue.
- Reason: the entire scoring matrix punishes frameworks. "No global re-renders", "isolate updates to text nodes", "Feature 2 from scratch, no libraries". In Vanilla, surgical `textContent` updates are the default — the state-isolation points (15) come almost for free and DevTools flame charts stay clean.
- **ZERO runtime UI/animation libraries.** No Framer Motion, Radix, Shadcn, HeadlessUI, Bootstrap-JS, GSAP, AOS, anime.js. Their presence in `package.json` = automatic disqualification.
- Allowed: Vite (build tool only), three.js (ONLY if hero 3D attempted AND everything scored is already deployed).
- Styling: custom CSS with CSS custom properties. Tailwind is *permitted* but adds risk/time — prefer hand-written CSS for full control over the isolation requirement.

---

## 1. SCORING MATRIX (100 pts) — what we are actually graded on

### Logic, Architecture & State Isolation — 40 pts
- **Feature 1 completion (15):** dynamic multi-currency pricing from a multi-dimensional matrix. NO hardcoded UI price values. DQ if structural values are hardcoded.
- **Re-render & State Isolation Guardrail (15):** changing billing cycle OR currency must update ONLY the targeted price text nodes. No parent/layout reflow. Audited in Chrome DevTools. Points docked instantly if global components reflow.
- **Feature 2 + Zero-Dependency (10):** responsive Bento→Accordion with automatic active-index context tracking on resize. Banned library present = automatic 0/10.

### SEO Optimization & Semantic HTML — 30 pts (EASIEST POINTS — LOCK EARLY)
- **Semantic DOM (15):** `<main> <header> <section> <article> <nav> <footer>` over deep `<div>` nesting.
- **SEO Hygiene & Metadata (10):** meta tags, Open Graph tags, accessible `alt`/`aria` attributes, crawlable text.
- **Loading Sequence Performance (5):** full loader + entry orchestration within **500ms**, must NOT delay TTI.

### UI/UX Usability & Motion Matching — 30 pts
- **Asset Compliance & Design Polish (15):** meaningful integration of ALL asset categories (SVG pack, font list, color palette). Missing/unused assets = heavy deductions.
- **Breakpoint Fluidity (10):** flawless mobile/tablet/desktop. No horizontal clipping or overlapping type.
- **Motion Accuracy (5):** hover states, easing, replication accuracy.

---

## 2. DISQUALIFICATION CRITERIA — avoid at all costs
- Broken / private / non-existent GitHub repo → make repo PUBLIC, push early.
- Live link 404/500/fails to build → deploy from minute ~35, redeploy after every chunk, verify in incognito.
- Plagiarism / unmodified boilerplate.
- Empty/mock repo (config templates only, no feature code).
- Banned component libraries in dependency config.
- Hardcoded currency/billing metrics instead of a dynamic matrix.

---

## 3. COLOR PALETTE (lock as CSS variables; meaningful use required for 15 pts)

| Name | Hex | Role |
|---|---|---|
| Oceanic Noir | `#172B36` | Primary dark background (use INSTEAD of pure black) |
| Nocturnal Expedition | `#114C5A` | Secondary dark / card surfaces on dark |
| Forsythia | `#FFC801` | Primary accent — CTAs, highlights, active states |
| Deep Saffron | `#FF9932` | Secondary accent / gradient partner |
| Arctic Powder | `#F1F6F4` | Light background / text on dark |
| Mystic Mint | `#D9E8E2` | Muted surfaces / borders |

Signature gradient (from palette mocks): **Deep Saffron → Forsythia** warm gradient over a Noir/Mint field. Use it as the hero hero signature.

```css
:root{
  --c-noir:    #172B36;
  --c-nocturnal:#114C5A;
  --c-forsythia:#FFC801;
  --c-saffron: #FF9932;
  --c-arctic:  #F1F6F4;
  --c-mint:    #D9E8E2;
  --grad-warm: linear-gradient(135deg, var(--c-saffron), var(--c-forsythia));
}
```
All palette contrast ratios are 9:1+ when paired correctly (dark text on light surfaces, light text on dark) — respect pairings for accessibility points.

---

## 4. TYPOGRAPHY (two families, both Google Fonts — both must be used)

- **JetBrains Mono** → section headings, the pricing NUMBERS, technical labels, "tech/code" feel.
- **Inter** → body text, UI elements, descriptions.

Load via `<link>` in `<head>` (preconnect to fonts.gstatic.com). Use `font-display: swap`.

```css
:root{
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

---

## 5. SVG ASSET PACK (14 icons — all in /assets/icons, all converted to currentColor)

> CRITICAL: original files have hardcoded `fill="#000000"`/`stroke="#000000"`. ALL must be `currentColor` so they inherit palette. Pre-converted versions are provided below — inline them or save as files and color via CSS `color:`.

| File | Use in build |
|---|---|
| chevron-down / chevron-up | Accordion toggle (Feature 2) — rotate on open |
| chevron-up-solid | accordion active variant |
| chevron-left / chevron-right | testimonial carousel arrows |
| arrow-path | "automation / sync" feature icon |
| arrow-trending-up | "performance / analytics" feature + pricing |
| chart-pie | "data insights" bento node |
| cog-8-tooth | "configuration / automation engine" bento node |
| cube-16-solid | "platform / infrastructure" node or logo mark |
| link / link-solid | "integrations" feature |
| search | nav search affordance |
| x-mark | modal/menu close |

Every icon must appear somewhere meaningful. Unused icons = deductions.

---

## 6. MOTION TOKENS (derived from demo.mp4, reconciled with PDF hard caps)

The reference video is a MOTION-LANGUAGE reference, not a layout spec (it shows no pricing & no resize). Copy its *feel and timing*, apply to OUR required components. PDF caps override the video where they conflict.

```css
:root{
  --t-micro: 180ms;   /* hovers, toggles, icon rotate — PDF: 150-200ms */
  --t-reflow: 350ms;  /* accordion, layout reflows — PDF: 300-400ms */
  --e-out:   cubic-bezier(0, 0, 0.2, 1);     /* ease-out for micro */
  --e-inout: cubic-bezier(0.4, 0, 0.2, 1);   /* ease-in-out for reflow */
}
```

Confirmed motions to replicate:
- CTA hover: embedded chevron translateX +4px, 150ms ease-out. No body scale/color shift.
- Card hover (integrations style): background lightens one step, ~200ms. No scale, no shadow, siblings unaffected.
- Accordion: panel height 0→auto over 300–400ms **ease-in-out**; chevron rotates ~180–200ms.
- Content swaps (currency/tab): opacity cross-fade ~150–300ms ease-in-out.
- Tab indicator: translateX 250ms ease-out.

### HARD CONSTRAINTS
- Total entry orchestration **< 500ms**, must NOT block TTI or semantic HTML indexing.
- Entry: staggered fade-up (headline → subhead → CTA), ~80ms stagger, each ~200ms ease-out. Keep total under 500ms.
- ALL motion via native CSS transitions/animations OR WAAPI. NO JS animation engines, NO CSS-in-JS runtime.
- DO NOT animate pricing numbers with a long count-up (risks layout thrash under DevTools). Use instant or fast ~150ms opacity cross-fade on the price `<span>` only.

---

## 7. FEATURE 1 — Pricing Matrix & Performance-Isolated Currency Switcher

**Requirement:** pricing tier component toggling Monthly/Annual across 3 currencies: INR (₹), USD ($), EUR (€). Values computed dynamically from a multi-dimensional config matrix factoring: base tier rate, flat 20% annual discount multiplier (×0.8), and regional tariff variables.

### Data model (NO hardcoded UI values)
```js
const PRICING = {
  tiers: {
    starter:  { base: 1000, label: 'Starter' },
    pro:      { base: 3000, label: 'Pro', popular: true },
    enterprise:{ base: 8000, label: 'Enterprise' },
  },
  currencies: {
    INR: { symbol: '₹', tariff: 1.00, locale: 'en-IN' },
    USD: { symbol: '$', tariff: 0.012, locale: 'en-US' },
    EUR: { symbol: '€', tariff: 0.011, locale: 'de-DE' },
  },
  annualMultiplier: 0.8, // flat 20% discount
};
// price = base * currency.tariff * (annual ? annualMultiplier : 1)
```
(Tune base/tariff numbers to taste — the KEY is they come from the matrix, never typed into HTML.)

### STATE ISOLATION — the 15-pt guardrail (most important architecture decision)
- On first render, compute & write each tier's price into a dedicated `<span class="price" data-tier="pro">` node.
- Store references to ONLY the price spans (and any "/mo" suffix nodes).
- On currency change OR billing toggle: recompute, then write `.textContent` to ONLY those stored span references. Touch nothing else.
- Do NOT re-render cards, grid, or rebuild DOM. No `innerHTML` on containers. No framework setState that cascades.
- The toggle/dropdown's own visual state (knob slide, selected pill) is fine to animate — just don't let it reflow the price layout.
- VERIFY in DevTools Performance: record, flip toggle, confirm only text nodes repaint, zero layout/recalc on parent. Use the "Paint flashing" + "Layout Shift Regions" rendering overlays to prove it.

---

## 8. FEATURE 2 — Bento-to-Accordion with Context Lock (Zero-Dependency)

**Requirement:** Bento-Grid on desktop. On mobile, refactors into a fluid touch-optimized Accordion. State persistence + context lock across the breakpoint.

### Structure (single DOM, CSS-driven layout swap — do NOT maintain two separate DOM trees)
- One list of feature "nodes". Each node = `<article>` with header (icon + title) + body (description).
- Desktop (CSS grid, e.g. `min-width: 768px`): arranged as a bento grid (mix of large/wide/small cells). All bodies visible.
- Mobile (`max-width: 767px`): same articles stack as accordion; bodies collapsed (`max-height:0`/`grid-template-rows:0fr`), only one open at a time, chevron toggle.
- Use `grid-template-rows: 0fr → 1fr` or `max-height` transition for the accordion open/close (350ms ease-in-out).

### Context Lock (the gotcha — 10 pts on the line)
- Track `activeIndex` in a plain JS variable (NOT in DOM-only state).
- Desktop: hovering/interacting with a bento node sets `activeIndex`.
- On `resize` (or matchMedia change) crossing the breakpoint desktop→mobile: read `activeIndex` and programmatically open the matching accordion panel smoothly on layout transition.
- Use `window.matchMedia('(max-width:767px)').addEventListener('change', ...)` rather than raw resize spam; debounce if using resize.
- Mobile→desktop: persist which node was open so it reads as the active/hovered bento cell.

### Zero-dependency reminder
- Accordion open/close, chevron rotation, height transition — ALL hand-written. No library. Library in deps = 0/10.

---

## 9. PAGE STRUCTURE (semantic — drives 15 pts)

```
<header>  → <nav> (logo[cube icon], links, search icon)
<main>
  <section id="hero">      headline(mono) + subhead(inter) + CTA + warm-gradient bg
  <section id="features">  ← FEATURE 2 bento/accordion (icons: cog, chart-pie, arrow-path, link)
  <section id="pricing">   ← FEATURE 1 matrix + currency switcher + billing toggle
  <section id="proof">     testimonials carousel (chevron-left/right) + stats
<footer>  newsletter CTA + links
```
Use real heading hierarchy (one `<h1>`, then `<h2>` per section). No heading skips.

---

## 10. SEO / HEAD CHECKLIST (10 pts — do this in the first 20 minutes)
- `<title>` + `<meta name="description">`
- Open Graph: og:title, og:description, og:type, og:image, og:url
- Twitter card tags
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<html lang="en">`
- `alt` on every meaningful image; `aria-label` on icon-only buttons; `aria-expanded` on accordion headers
- Crawlable text (no text baked only into images/canvas)
- A `robots` meta allowing indexing; optionally a tiny `sitemap`/`manifest`.

---

## 11. TIMELINE (3h)
- 0:00–0:20  assets in, BRIEF read, scaffold Vite vanilla, push PUBLIC repo, wire Vercel/Netlify.
- 0:20–0:35  semantic shell + full SEO head + fonts + palette tokens + icon files. Deploy (live link exists).
- 0:35–1:10  Feature 1 pricing matrix + isolated currency/billing. DevTools verify isolation.
- 1:10–1:45  Feature 2 bento↔accordion + context lock on matchMedia.
- 1:45–2:15  motion layer (hovers, entry <500ms, accordion easing), wire all SVGs.
- 2:15–2:40  responsive pass (mobile/tablet/desktop, no clipping), asset-compliance audit.
- 2:40–3:00  record demo (<100MB), final deploy, verify in incognito, confirm repo public + non-empty, submit (repo link + live link + video).

---

## 12. PRE-SUBMIT CHECKLIST
- [ ] `package.json` has ZERO banned libraries
- [ ] No hardcoded prices in HTML — all from matrix
- [ ] DevTools: toggle/currency change repaints text nodes only, zero parent layout shift
- [ ] Bento→accordion morphs at breakpoint; context lock opens correct panel
- [ ] All 6 palette colors used meaningfully; both fonts loaded & used; all 14 icons placed
- [ ] Entry orchestration measured < 500ms; TTI not blocked
- [ ] Semantic tags throughout; one h1; alt/aria present; OG tags present
- [ ] No horizontal scroll at 320/768/1280px
- [ ] Repo PUBLIC, non-empty, builds clean
- [ ] Live link loads in incognito (no 404/500)
- [ ] Demo video < 100MB on Drive, link set to "anyone with link"
