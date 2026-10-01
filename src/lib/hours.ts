import type {Meal} from './catalog';

/** Minutes after midnight. `close` < `open` means the place closes after midnight. */
export type Hours = {open: number; close: number};
const t = (h: number, m = 0) => h * 60 + m;

export const MEAL_HOURS: Record<Meal, Hours> = {
  Breakfast: {open: t(7, 30), close: t(9, 30)},
  Lunch: {open: t(12), close: t(14, 30)},
  Snacks: {open: t(17), close: t(18)},
  Dinner: {open: t(19, 30), close: t(21, 30)},
};

// Only hours that have been confirmed. Everything else shows "Hours not verified".
export const PLACE_HOURS: Record<string, Hours> = {
  Relish: {open: t(13), close: t(2)},
  ANC: {open: t(23), close: t(2)},
  CNC: {open: t(23), close: t(3)},
  DNC: {open: t(23), close: t(2)},
};

export const minutesNow = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

export function isOpen(h: Hours, now = minutesNow()) {
  return h.close > h.open ? now >= h.open && now < h.close : now >= h.open || now < h.close;
}

export function fmt(min: number) {
  const h = Math.floor(min / 60) % 24, m = min % 60, ap = h < 12 ? 'AM' : 'PM', hh = h % 12 || 12;
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
}
export const range = (h: Hours) => `${fmt(h.open)}–${fmt(h.close)}`;

export function status(h: Hours|null, now = minutesNow()): {open: boolean|null; label: string} {
  if (!h) return {open: null, label: 'Hours not verified'};
  return isOpen(h, now) ? {open: true, label: `Open · closes ${fmt(h.close)}`} : {open: false, label: `Closed · opens ${fmt(h.open)}`};
}

/** The meal being served now, or the next one today/tomorrow. */
export function currentMeal(now = minutesNow()): {meal: Meal; live: boolean; tomorrow: boolean} {
  const order: Meal[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
  for (const meal of order) {
    const h = MEAL_HOURS[meal];
    if (now >= h.open && now < h.close) return {meal, live: true, tomorrow: false};
    if (now < h.open) return {meal, live: false, tomorrow: false};
  }
  return {meal: 'Breakfast', live: false, tomorrow: true};
}
