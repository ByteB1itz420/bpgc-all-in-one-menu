import {useSyncExternalStore} from 'react';
import type {Profile} from './goals';
import type {Macros} from './nutrition';

/** A tiny persisted store. Everything stays on this device. */
function persisted<T>(key: string, fallback: T) {
  let value: T = fallback;
  try { const raw = localStorage.getItem(key); if (raw) value = JSON.parse(raw) as T; } catch { /* private mode */ }
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T|((v: T) => T)) {
      value = typeof next === 'function' ? (next as (v: T) => T)(value) : next;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
      listeners.forEach(l => l());
    },
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}
export type Store<T> = ReturnType<typeof persisted<T>>;
export function useStore<T>(s: Store<T>) { return useSyncExternalStore(s.subscribe, s.get, s.get); }

export type PlateLine = {key: string; itemId: string; qty: number; portion: number};
export const plate = persisted<PlateLine[]>('bpgc-plate-v1', []);

export function addToPlate(itemId: string, qty = 1, portion = 1) {
  plate.set(lines => {
    const hit = lines.find(l => l.itemId === itemId && l.portion === portion);
    if (hit) return lines.map(l => (l === hit ? {...l, qty: l.qty + qty} : l));
    return [...lines, {key: `${itemId}:${portion}:${Date.now()}`, itemId, qty, portion}];
  });
}
export function changeQty(key: string, delta: number) {
  plate.set(lines => lines.flatMap(l => (l.key !== key ? [l] : l.qty + delta <= 0 ? [] : [{...l, qty: l.qty + delta}])));
}
export function setPortion(key: string, portion: number) { plate.set(lines => lines.map(l => (l.key === key ? {...l, portion} : l))); }

export const profile = persisted<Profile|null>('bpgc-profile-v1', null);

export type LoggedItem = Macros & {itemId: string; name: string; place: string; qty: number; portion: number; price: number|null};
export type DiaryEntry = {id: string; at: number; label: string; items: LoggedItem[]};
export const diary = persisted<Record<string, DiaryEntry[]>>('bpgc-diary-v1', {});
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function logEntry(label: string, items: LoggedItem[]) {
  const k = dayKey();
  diary.set(d => {
    const next = {...d, [k]: [...(d[k] ?? []), {id: crypto.randomUUID?.() ?? String(Date.now()), at: Date.now(), label, items}]};
    // Keep 60 days.
    const keys = Object.keys(next).sort();
    for (const old of keys.slice(0, Math.max(0, keys.length - 60))) delete next[old];
    return next;
  });
}
export function removeEntry(day: string, id: string) { diary.set(d => ({...d, [day]: (d[day] ?? []).filter(e => e.id !== id)})); }

export type Prefs = {theme: 'system'|'light'|'dark'; diet: 'all'|'veg'|'egg'|'nonveg'; lastOutlet: string; lastNc: string};
export const prefs = persisted<Prefs>('bpgc-prefs-v1', {theme: 'system', diet: 'all', lastOutlet: 'gajalaxmi', lastNc: 'anc'});
