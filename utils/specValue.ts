import { Product, Spec, BetterDirection, SpecKind } from '../types';

/**
 * Parse a raw spec string into a comparable number.
 * Strips currency symbols, thousands separators, units and trailing text,
 * then extracts the leading numeric token.
 * Returns null when no number can be derived (e.g. "Infinite", "DLP").
 *
 * Shared by the chart, winner-highlight and decision-scoring code paths so
 * they all agree on what "the number" of a cell is.
 */
export const parseSpecValue = (value: string | undefined | null): number | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[$,₩€£]/g, '').trim();
  const match = cleaned.match(/-?\d*\.?\d+/);
  if (match) {
    const n = parseFloat(match[0]);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};

/** True when a spec can participate in numeric comparison/scoring. */
export const isNumericSpec = (spec: Spec): boolean =>
  spec.kind === 'number' || spec.kind === 'currency';

/**
 * A spec drives ranking only when it is numeric AND has a better-direction.
 * (Price = lower-is-better, Brightness = higher-is-better, etc.)
 */
export const isScorableSpec = (spec: Spec): boolean =>
  isNumericSpec(spec) && (spec.betterDirection === 'higher' || spec.betterDirection === 'lower');

export interface BestWorst {
  best: number | null;
  worst: number | null;
  direction: BetterDirection;
}

/**
 * For each scorable spec, compute the best and worst numeric value across the
 * given products. Used to paint the winner (and loser) cells.
 */
export const computeBestWorstMap = (
  products: Product[],
  specs: Spec[],
): Record<string, BestWorst> => {
  const map: Record<string, BestWorst> = {};
  for (const spec of specs) {
    if (!isScorableSpec(spec)) continue;
    const nums = products
      .map(p => parseSpecValue(p.specs[spec.id]))
      .filter((n): n is number => n !== null);
    if (nums.length < 2) continue; // nothing to highlight with a single value
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max === min) continue; // all equal -> no winner
    const higher = spec.betterDirection !== 'lower';
    map[spec.id] = {
      best: higher ? max : min,
      worst: higher ? min : max,
      direction: spec.betterDirection ?? 'higher',
    };
  }
  return map;
};

export type CellRank = 'best' | 'worst' | 'none';

/** Classify a single cell value against the precomputed best/worst map. */
export const rankCell = (
  specId: string,
  rawValue: string | undefined,
  bestWorst: Record<string, BestWorst>,
): CellRank => {
  const bw = bestWorst[specId];
  if (!bw) return 'none';
  const n = parseSpecValue(rawValue);
  if (n === null) return 'none';
  if (n === bw.best) return 'best';
  if (n === bw.worst) return 'worst';
  return 'none';
};

/**
 * Normalize a spec's values across products onto a 0~100 scale where 100 is
 * always "best" (inverts for lower-is-better). Returns a map of productId -> score.
 * Products with no parseable value get a neutral 50 so they don't unfairly win or lose.
 */
export const normalizeSpec = (
  products: Product[],
  spec: Spec,
): Record<string, number> => {
  const result: Record<string, number> = {};
  const entries = products.map(p => ({ id: p.id, n: parseSpecValue(p.specs[spec.id]) }));
  const nums = entries.map(e => e.n).filter((n): n is number => n !== null);
  if (nums.length === 0) {
    products.forEach(p => { result[p.id] = 50; });
    return result;
  }
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const range = max - min;
  const higher = spec.betterDirection !== 'lower';
  for (const { id, n } of entries) {
    if (n === null || range === 0) {
      result[id] = range === 0 && n !== null ? 100 : 50;
      continue;
    }
    const ratio = (n - min) / range; // 0 at min, 1 at max
    result[id] = Math.round((higher ? ratio : 1 - ratio) * 100);
  }
  return result;
};

export interface ProductScore {
  productId: string;
  total: number;          // 0~100 weighted score
  perSpec: Record<string, number>; // specId -> weighted contribution
  valueScore: number | null; // total per price unit (가성비), null when no price
}

/**
 * Weighted decision-matrix scoring.
 * @param weights specId -> weight (0~100). Specs with weight 0 are ignored.
 * @param priceSpecId optional spec used for the value (price-performance) score.
 */
export const computeScores = (
  products: Product[],
  specs: Spec[],
  weights: Record<string, number>,
  priceSpecId?: string,
): ProductScore[] => {
  const scorable = specs.filter(s => isScorableSpec(s) && (weights[s.id] ?? 0) > 0);
  const totalWeight = scorable.reduce((sum, s) => sum + (weights[s.id] ?? 0), 0);
  const normalized: Record<string, Record<string, number>> = {};
  for (const s of scorable) normalized[s.id] = normalizeSpec(products, s);

  return products.map(product => {
    const perSpec: Record<string, number> = {};
    let total = 0;
    for (const s of scorable) {
      const w = weights[s.id] ?? 0;
      const contribution = totalWeight > 0 ? (normalized[s.id][product.id] * w) / totalWeight : 0;
      perSpec[s.id] = contribution;
      total += contribution;
    }
    let valueScore: number | null = null;
    if (priceSpecId) {
      const price = parseSpecValue(product.specs[priceSpecId]);
      if (price && price > 0) valueScore = (total / price) * 1000; // scaled for readability
    }
    return { productId: product.id, total: Math.round(total * 10) / 10, perSpec, valueScore };
  });
};

/**
 * Infer reasonable metadata for a legacy/imported spec from its name.
 * Lets older localStorage data and CSV/JSON imports gain comparison behaviour
 * without the user hand-tagging every field.
 */
export const inferSpecMeta = (name: string): Partial<Spec> => {
  const n = name.toLowerCase();
  const has = (...keys: string[]) => keys.some(k => n.includes(k));

  if (has('price', 'msrp', 'cost', '가격', '가격(', 'usd')) {
    return { kind: 'currency', betterDirection: 'lower', unit: 'USD', category: 'Price' };
  }
  if (has('lag', 'response time', 'latency', 'weight', 'pixel pitch', 'power', 'consumption')) {
    return { kind: 'number', betterDirection: 'lower', category: 'Performance' };
  }
  if (has('brightness', 'lumen', 'nit', 'contrast', 'refresh', 'hz', 'resolution width',
          'screen size', 'size', 'speaker', 'watt', 'touch point', 'lamp', 'life',
          'warranty', 'released', 'year', 'hdr count')) {
    return { kind: 'number', betterDirection: 'higher', category: 'Performance' };
  }
  return { kind: 'text', betterDirection: 'none', category: 'General' };
};

/**
 * Ensure every spec has the metadata fields populated. Specs that already carry
 * a `kind` are left untouched; the rest are inferred from their name.
 */
export const withInferredMeta = (specs: Spec[]): Spec[] =>
  specs.map(s => (s.kind ? s : { ...s, ...inferSpecMeta(s.name) }));
