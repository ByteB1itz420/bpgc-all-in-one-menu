import {describe, expect, it} from 'vitest';
import {estimate, kcalOf, match} from './nutrition';
import {FOODS} from './foods';
import {ITEMS, PLACES} from './catalog';
import {targets} from './goals';
import {fillMeal} from './suggest';
import {isOpen} from './hours';

describe('data integrity', () => {
  it('has unique item ids', () => {
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
  });
  it('gives every food item a macro estimate', () => {
    const missing = ITEMS.filter(i => !i.est && !/vinayak food nc/i.test(i.name));
    expect(missing.map(i => `${i.place}/${i.category}/${i.name}`)).toEqual([]);
  });
  it('keeps category-only guesses rare', () => {
    const rough = ITEMS.filter(i => i.est?.conf === 'rough');
    expect(rough.length / ITEMS.length).toBeLessThan(0.05);
  });
  it('has sane reference foods', () => {
    for (const [k, f] of Object.entries(FOODS)) {
      expect(f.pcf.every(n => n >= 0), k).toBe(true);
      expect(kcalOf(f.pcf), k).toBeLessThan(1500);
    }
  });
  it('lists every place', () => { expect(PLACES.length).toBe(12); });
});

describe('estimates', () => {
  const kcal = (n: string, c = '') => estimate(n, c)!.kcal;
  it('uses the category for short names', () => {
    expect(match('Masala', 'Dosa')?.key).toBe('dosa');
    expect(match('Chicken', 'Burger')?.key).toBe('chicken_burger');
    expect(match('Chicken Tikka', 'Subs (Non-Veg)')?.key).toBe('chicken_sub');
  });
  it('adds modifiers', () => {
    expect(kcal('Cheese Masala Dosa')).toBeGreaterThan(kcal('Masala Dosa'));
    expect(kcal('Masala Dosa')).toBeGreaterThan(kcal('Plain Dosa'));
    expect(estimate('Paneer Fried Cheese', 'Maggi')!.notes).toEqual(expect.arrayContaining(['+ cheese', '+ paneer', '+ fried']));
  });
  it('scales pieces, doubles and full portions', () => {
    expect(kcal('Samosa(2Pc)')).toBe(kcal('Samosa(1Pc)') * 2);
    expect(kcal('Double Omelette')).toBe(kcal('Single Omelette') * 2);
    expect(kcal('Chicken Butter (Full)')).toBeGreaterThan(kcal('Chicken Butter (Half)') * 1.8);
    expect(kcal('Hot Tea', 'Hot Beverages (90ml)')).toBeLessThan(kcal('Tea'));
  });
  it('does not double count intrinsic ingredients', () => {
    expect(estimate('Chicken Biryani')!.notes).toEqual([]);
    expect(estimate('Paneer Butter Masala')!.notes).toEqual([]);
  });
  it('shrinks mess curries and sums combos', () => {
    expect(estimate('Dal Fry', '', {mess: true})!.kcal).toBeLessThan(kcal('Dal Fry'));
    const combo = estimate('Sambhar + Chutney', '', {mess: true})!;
    expect(combo.kcal).toBe(kcal('Sambar') + kcal('Chutney'));
  });
  it('gives honest ranges', () => {
    const e = estimate('Vada Pav')!;
    expect(e.lo).toBeLessThan(e.kcal); expect(e.hi).toBeGreaterThan(e.kcal);
  });
});

describe('goals and suggestions', () => {
  it('computes Mifflin–St Jeor targets', () => {
    const t = targets({sex: 'male', age: 20, heightCm: 175, weightKg: 70, activity: 1.55, goal: 'maintain'});
    expect(t.kcal).toBeGreaterThan(2500); expect(t.kcal).toBeLessThan(2700); expect(t.p).toBe(112);
  });
  it('suggests meals within budget', () => {
    const combos = fillMeal(ITEMS, {kcal: 700, p: 40}, 200);
    expect(combos.length).toBeGreaterThan(0);
    for (const c of combos) { expect(c.price).toBeLessThanOrEqual(200); expect(c.kcal).toBeLessThanOrEqual(805); }
  });
  it('handles overnight hours', () => {
    expect(isOpen({open: 23 * 60, close: 120}, 60)).toBe(true);
    expect(isOpen({open: 23 * 60, close: 120}, 600)).toBe(false);
  });
});
