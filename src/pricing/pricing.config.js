/**
 * Feature 1 — the pricing MATRIX (BRIEF §7).
 * ---------------------------------------------------------------------------
 * This file is the single source of truth for every number rendered in the
 * pricing section. NOTHING is typed into the HTML — every displayed figure is
 * derived from this matrix at runtime via `computePrice()`:
 *
 *     price = base · currency.tariff · (annual ? annualMultiplier : 1)
 *
 * That makes the section a true multi-dimensional product:
 *     tier (3) × currency (3) × billing (2) = 18 derived prices.
 * Tune any base/tariff and the whole UI follows — which is exactly what the
 * "no hardcoded UI values / DQ if structural values are hardcoded" rule wants.
 */

/* ---- Tiers: base rate (in the INR reference unit) + display copy ---- */
export const PRICING = {
  tiers: {
    starter: {
      base: 1000,
      label: 'Starter',
      blurb: 'For small teams wiring up their first real-time data flows.',
      cta: 'Start free',
      features: [
        'Up to 5 data sources',
        '1M events / month',
        'Daily model refresh',
        'Community support',
      ],
    },
    pro: {
      base: 3000,
      label: 'Pro',
      popular: true,
      blurb: 'For scaling teams that need streaming data and automations.',
      cta: 'Start free trial',
      features: [
        'Up to 50 data sources',
        '50M events / month',
        'Real-time model refresh',
        'Priority support',
        'Custom automations',
      ],
    },
    enterprise: {
      base: 8000,
      label: 'Enterprise',
      blurb: 'For organizations running mission-critical data at scale.',
      cta: 'Contact sales',
      features: [
        'Unlimited data sources',
        'Unlimited events',
        'Real-time + streaming',
        'Dedicated success engineer',
        'SSO, SLA & audit logs',
      ],
    },
  },

  /* ---- Currencies: symbol (rendered statically), regional tariff
     multiplier, and locale used for thousands-separator grouping. ---- */
  currencies: {
    INR: { symbol: '₹', tariff: 1.0, locale: 'en-IN' },
    USD: { symbol: '$', tariff: 0.012, locale: 'en-US' },
    EUR: { symbol: '€', tariff: 0.011, locale: 'de-DE' },
  },

  /* ---- Flat 20% annual discount (×0.8) ---- */
  annualMultiplier: 0.8,
};

/* Display order (kept out of the keyed maps so iteration order is explicit). */
export const TIER_ORDER = ['starter', 'pro', 'enterprise'];
export const CURRENCY_ORDER = ['INR', 'USD', 'EUR'];

/* Billing modes — suffix + caption come from here too (never hardcoded in HTML). */
export const BILLING = {
  monthly: { annual: false, suffix: '/mo', label: 'monthly', note: 'Billed monthly' },
  annual: { annual: true, suffix: '/yr', label: 'annual', note: 'Save 20% · billed annually' },
};

/**
 * The one formula. Returns a sensibly-rounded INTEGER for the given
 * (tier, currency, billing) coordinate. Integer results keep the odometer's
 * digit columns crisp; locale grouping is applied separately for display.
 */
export function computePrice(tierKey, currencyKey, annual) {
  const base = PRICING.tiers[tierKey].base;
  const { tariff } = PRICING.currencies[currencyKey];
  const raw = base * tariff * (annual ? PRICING.annualMultiplier : 1);
  return Math.round(raw);
}

/** The locale's grouping separator (',' for en-US/en-IN, '.' for de-DE). */
export function groupSeparator(locale) {
  const part = new Intl.NumberFormat(locale)
    .formatToParts(1000000)
    .find((p) => p.type === 'group');
  return part ? part.value : ',';
}

/** Locale-grouped string of an integer value (for the accessible price text). */
export function formatNumber(value, locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/**
 * Widest digit count any price can reach across the entire matrix. Drives how
 * many fixed odometer digit-slots we pre-build, so the layout width is constant
 * for every tier/currency/billing combination (zero layout shift on change).
 */
export function maxPriceDigits() {
  let max = 1;
  for (const tier of TIER_ORDER) {
    for (const currency of CURRENCY_ORDER) {
      for (const annual of [false, true]) {
        const digits = String(computePrice(tier, currency, annual)).length;
        if (digits > max) max = digits;
      }
    }
  }
  return max;
}
