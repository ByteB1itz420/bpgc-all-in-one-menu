import menuData from '../data/menu.json';
import ncData from '../data/nc.json';
import messIds from '../data/mess-ids.json';
import dietData from '../data/diet.json';
import {estimate, type Estimate} from './nutrition';
import {PLACE_HOURS, type Hours} from './hours';

export type Diet = 'veg'|'egg'|'nonveg'|'unsure';
export type PlaceKind = 'mess'|'outlet'|'nc';
export type Place = {id: string; name: string; kind: PlaceKind; hours: Hours|null; note?: string; priced: boolean};
export type Item = {
  id: string; placeId: string; place: string; category: string; name: string;
  price: number|null; diet: Diet; est: Estimate|null; note?: string;
};
export type Day = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
export type Meal = 'Breakfast'|'Lunch'|'Snacks'|'Dinner';
export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

type RawItem = {id: string; name: string; price: number|string|null; note?: string};
type MessRow = {role: string} & Record<Day, string>;
const menu = menuData as unknown as {mess: Record<Meal, MessRow[]>; outlets: {name: string; cats: {name: string; items: RawItem[]}[]}[]};
const nc = ncData as Record<string, {id: string; name: string; price: number; category: string}[]>;
const diets = dietData as Record<string, string>;

/** Name-based diet guess, used only when the curated tag is missing. */
export function inferDiet(name: string, category = ''): Diet {
  const t = `${name} ${category}`.toLowerCase();
  if (/chicken|mutton|fish|prawn|\bmeat\b|\bham\b|alfham|lollipop|wings|keema(?!.*soya)/.test(name.toLowerCase())) return 'nonveg';
  if (/\begg|omelet|omlet|omelette|anda\b|half fry|full fry|bhurji(?!.*paneer)/.test(name.toLowerCase()) && !/paneer/.test(name.toLowerCase())) return 'egg';
  if (/pastry|brownie|muffin|donut|doughnut|cake|pancake|waffle|cookie|kebab|mayo/.test(t)) return 'unsure';
  return 'veg';
}
const dietOf = (id: string, name: string, category: string): Diet => {
  const d = diets[id];
  if (d === 'veg' || d === 'egg' || d === 'nonveg') return d;
  return inferDiet(name, category);
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const PLACES: Place[] = [
  {id: 'mess', name: 'Mess', kind: 'mess', hours: null, priced: false, note: 'Included in mess fee'},
  ...menu.outlets.map(o => ({id: slug(o.name), name: o.name, kind: 'outlet' as const, hours: PLACE_HOURS[o.name] ?? null, priced: o.name !== 'Relish', note: o.name === 'Relish' ? 'Food truck · prices not listed' : undefined})),
  ...['ANC', 'CNC', 'DNC'].map(n => ({id: n.toLowerCase(), name: n, kind: 'nc' as const, hours: PLACE_HOURS[n] ?? null, priced: true, note: `Night canteen at ${n[0]} Mess`})),
];
export const placeById = new Map(PLACES.map(p => [p.id, p]));

const items: Item[] = [];
menu.outlets.forEach(o => o.cats.forEach(c => c.items.forEach(i => {
  const price = i.price == null || i.price === '' ? null : Number(i.price);
  items.push({id: i.id, placeId: slug(o.name), place: o.name, category: c.name, name: i.name, price, note: i.note,
    diet: o.name === 'Relish' ? (c.name === 'Non-veg' || /chicken/i.test(i.name) ? 'nonveg' : 'veg') : dietOf(i.id, i.name, c.name),
    est: estimate(i.name, c.name)});
})));
for (const [canteen, list] of Object.entries(nc)) for (const i of list) {
  items.push({id: i.id, placeId: canteen.toLowerCase(), place: canteen, category: i.category, name: i.name, price: i.price, diet: inferDiet(i.name, i.category), est: estimate(i.name, i.category)});
}
const messRole = new Map<string, string>();
for (const meal of MEALS) for (const row of menu.mess[meal]) for (const d of DAYS) { const dish = row[d]?.trim(); if (dish && !messRole.has(dish)) messRole.set(dish, row.role); }
for (const [name, id] of Object.entries(messIds as Record<string, string>)) {
  items.push({id, placeId: 'mess', place: 'Mess', category: messRole.get(name) ?? 'Mess', name, price: null, diet: inferDiet(name), est: estimate(name, messRole.get(name) ?? '', {mess: true})});
}

export const ITEMS = items;
export const itemById = new Map(items.map(i => [i.id, i]));
export const itemsByPlace = (placeId: string) => items.filter(i => i.placeId === placeId);
const messIdByName = messIds as Record<string, string>;

export type MessDish = {role: string; item: Item|null; listed: boolean};
export function messMenu(day: Day, meal: Meal): MessDish[] {
  return menu.mess[meal].flatMap((row): MessDish[] => {
    const dish = (row[day] || '').trim();
    if (!dish) return [];
    if (dish === '******') return [{role: row.role, item: null, listed: false}];
    return [{role: row.role, item: itemById.get(messIdByName[dish]) ?? null, listed: true}];
  });
}
