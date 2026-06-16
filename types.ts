
export type SpecKind = 'number' | 'currency' | 'text' | 'boolean' | 'enum';

export type BetterDirection = 'higher' | 'lower' | 'none';

export interface Spec {
  id: string;
  name: string;
  /** How the value should be interpreted for comparison/scoring. Defaults to 'text'. */
  kind?: SpecKind;
  /** Display unit, e.g. 'ANSI Lumens', 'USD', 'ms'. */
  unit?: string;
  /** Which direction is "better" for winner-highlight and decision scoring. Defaults to 'none'. */
  betterDirection?: BetterDirection;
  /** Default weight (0~100) used by the decision matrix. */
  weight?: number;
  /** Grouping label, e.g. 'Price', 'Image', 'Performance'. */
  category?: string;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  imageUrl: string;
  /** Product category, e.g. 'Home Theater Projector'. Used for the category filter. */
  category?: string;
  specs: { [key: string]: string }; // key is spec.id
}
