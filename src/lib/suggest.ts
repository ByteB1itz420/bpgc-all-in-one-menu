import type {Item} from './catalog';

type Priced = Item & {price: number; est: NonNullable<Item['est']>};
const priced = (items: Item[]) => items.filter((i): i is Priced => i.price != null && i.price > 0 && !!i.est && i.est.kcal > 40);

/** Grams of protein per ₹10. */
export const proteinPerRupee = (i: Item) => (i.est && i.price ? (i.est.p / i.price) * 10 : 0);
/** Grams of protein per 100 kcal. */
export const proteinPerKcal = (i: Item) => (i.est && i.est.kcal ? (i.est.p / i.est.kcal) * 100 : 0);

export function bestValue(items: Item[], by: 'rupee'|'kcal', n = 5) {
  const f = by === 'rupee' ? proteinPerRupee : proteinPerKcal;
  return priced(items).filter(i => i.est.p >= 8).sort((a, b) => f(b) - f(a)).slice(0, n);
}

export type Combo = {placeId: string; place: string; items: Priced[]; kcal: number; p: number; price: number; score: number};

/**
 * Suggest one meal per place that lands near a calorie target with as much protein as possible,
 * within budget. Small exhaustive search over the top candidates of each place (≤3 items).
 */
export function fillMeal(items: Item[], target: {kcal: number; p: number}, budget: number, n = 3): Combo[] {
  const byPlace = new Map<string, Priced[]>();
  for (const i of priced(items)) {
    if (i.est.kcal > target.kcal * 1.15 || i.price > budget || /^extra|mayo/i.test(i.name)) continue;
    const list = byPlace.get(i.placeId) ?? [];
    list.push(i);
    byPlace.set(i.placeId, list);
  }
  const best: Combo[] = [];
  for (const [placeId, list] of byPlace) {
    const cand = list.sort((a, b) => proteinPerKcal(b) - proteinPerKcal(a)).slice(0, 18);
    let top: Combo|null = null;
    const consider = (picked: Priced[]) => {
      const kcal = picked.reduce((s, i) => s + i.est.kcal, 0), p = picked.reduce((s, i) => s + i.est.p, 0), price = picked.reduce((s, i) => s + i.price, 0);
      if (price > budget || kcal > target.kcal * 1.15) return;
      const score = 1.6 * Math.min(p, target.p) / Math.max(target.p, 1) - Math.abs(kcal - target.kcal) / target.kcal - price / budget * 0.15;
      if (!top || score > top.score) top = {placeId, place: picked[0].place, items: picked, kcal, p, price, score};
    };
    for (let a = 0; a < cand.length; a++) {
      consider([cand[a]]);
      for (let b = a + 1; b < cand.length; b++) {
        consider([cand[a], cand[b]]);
        for (let c = b + 1; c < cand.length; c++) consider([cand[a], cand[b], cand[c]]);
      }
    }
    if (top) best.push(top);
  }
  return best.sort((a, b) => b.score - a.score).slice(0, n);
}
