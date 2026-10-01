import {itemById, type Item} from './catalog';
import {scale, sum, type Macros} from './nutrition';
import type {DiaryEntry, LoggedItem, PlateLine} from './store';

export type ResolvedLine = PlateLine & {item: Item; m: Macros; price: number|null};

export function resolvePlate(lines: PlateLine[]): ResolvedLine[] {
  return lines.flatMap(l => {
    const item = itemById.get(l.itemId);
    if (!item?.est) return [];
    return [{...l, item, m: scale(item.est, l.qty * l.portion), price: item.price == null ? null : item.price * l.qty}];
  });
}
export const plateTotals = (lines: ResolvedLine[]) => ({
  ...sum(lines.map(l => l.m)),
  price: lines.reduce((s, l) => s + (l.price ?? 0), 0),
  qty: lines.reduce((s, l) => s + l.qty, 0),
});
export const toLogged = (l: ResolvedLine): LoggedItem => ({itemId: l.itemId, name: l.item.name, place: l.item.place, qty: l.qty, portion: l.portion, price: l.price, ...l.m});
export const dayTotals = (entries: DiaryEntry[] = []) => sum(entries.flatMap(e => e.items));

export function mealLabel(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 19 ? 'Snacks' : h < 22.5 ? 'Dinner' : 'Late night';
}
