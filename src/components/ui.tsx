import {createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode} from 'react';
import {X} from 'lucide-react';
import type {Diet, Item} from '../lib/catalog';
import type {Confidence, Macros} from '../lib/nutrition';
import {hearts} from '../lib/hearts';

export const rupees = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')}`;
export const r0 = (n: number) => Math.round(n);

/** Opens the item detail sheet from anywhere. */
export const OpenItem = createContext<(item: Item) => void>(() => {});
export const useOpenItem = () => useContext(OpenItem);

/** Small toast with optional undo, owned by App. */
export type ToastFn = (msg: string, undo?: () => void) => void;
export const Toast = createContext<ToastFn>(() => {});
export const useToast = () => useContext(Toast);

export function useHearts() { return useSyncExternalStore(hearts.subscribe, hearts.snapshot, hearts.snapshot); }

const DIET_LABEL: Record<Diet, string> = {veg: 'Veg', egg: 'Contains egg', nonveg: 'Non-veg', unsure: 'Diet not confirmed'};
export function DietMark({diet}: {diet: Diet}) {
  return <span className={`diet diet-${diet}`} role="img" aria-label={DIET_LABEL[diet]} title={DIET_LABEL[diet]}><span /></span>;
}

const CONF_LABEL: Record<Confidence, string> = {good: 'Good estimate', fair: 'Fair estimate', rough: 'Rough guess'};
export function ConfDots({conf, label = false}: {conf: Confidence; label?: boolean}) {
  const n = conf === 'good' ? 3 : conf === 'fair' ? 2 : 1;
  return <span className="conf" title={CONF_LABEL[conf]} aria-label={CONF_LABEL[conf]}>
    {[0, 1, 2].map(i => <i key={i} className={i < n ? 'on' : ''} />)}
    {label && <span>{CONF_LABEL[conf]}</span>}
  </span>;
}

export function MacroChips({m, compact = false}: {m: Macros; compact?: boolean}) {
  return <span className={'chips' + (compact ? ' compact' : '')}>
    <span className="chip-kcal">{r0(m.kcal)} kcal</span>
    <span className="chip-p">P {r0(m.p)}g</span>
    {!compact && <><span className="chip-c">C {r0(m.c)}g</span><span className="chip-f">F {r0(m.f)}g</span></>}
  </span>;
}

/** Donut of calories by macro, kcal in the middle. */
export function MacroRing({m, size = 132, goal}: {m: Macros; size?: number; goal?: number}) {
  const stroke = size * 0.1, rad = (size - stroke) / 2, circ = 2 * Math.PI * rad;
  const parts = [{k: 'p', v: m.p * 4}, {k: 'c', v: m.c * 4}, {k: 'f', v: m.f * 9}];
  const total = parts.reduce((s, x) => s + x.v, 0) || 1;
  const fill = goal ? Math.min(1, m.kcal / goal) : 1;
  let off = 0;
  return <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${r0(m.kcal)} kcal${goal ? ` of ${goal}` : ''}`}>
    <circle cx={size / 2} cy={size / 2} r={rad} className="ring-track" strokeWidth={stroke} fill="none" />
    <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
      {parts.map(x => {
        const len = (x.v / total) * circ * fill;
        const el = <circle key={x.k} cx={size / 2} cy={size / 2} r={rad} className={`ring-${x.k}`} strokeWidth={stroke} fill="none" strokeDasharray={`${Math.max(0, len - 1.5)} ${circ}`} strokeDashoffset={-off} />;
        off += len;
        return el;
      })}
    </g>
    <text x="50%" y="47%" textAnchor="middle" className="ring-num" style={{fontSize: size * 0.2}}>{r0(m.kcal)}</text>
    <text x="50%" y="64%" textAnchor="middle" className="ring-unit" style={{fontSize: size * 0.09}}>{goal ? `of ${goal} kcal` : 'kcal'}</text>
  </svg>;
}

export function MacroBars({m, goal}: {m: Macros; goal?: Macros|null}) {
  const rows: [string, 'p'|'c'|'f', string][] = [['Protein', 'p', 'chip-p'], ['Carbs', 'c', 'chip-c'], ['Fat', 'f', 'chip-f']];
  return <div className="bars">
    {rows.map(([label, k]) => {
      const v = m[k], g = goal?.[k];
      const pct = g ? Math.min(100, (v / g) * 100) : Math.min(100, (v * (k === 'f' ? 9 : 4) / Math.max(1, m.kcal)) * 100);
      return <div className="bar-row" key={k}>
        <span className="bar-label">{label}</span>
        <span className="bar-track"><span className={`bar-fill fill-${k}`} style={{width: `${pct}%`}} /></span>
        <span className="bar-val">{r0(v)}{g ? <small> / {g}g</small> : 'g'}</span>
      </div>;
    })}
  </div>;
}

export function Sheet({open, onClose, title, children, wide = false}: {open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement|null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('locked'); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="sheet-wrap" onClick={onClose}>
    <div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={e => e.stopPropagation()}>
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}

export function Segmented<T extends string>({value, options, onChange, label}: {value: T; options: [T, string][]; onChange: (v: T) => void; label: string}) {
  return <div className="segmented" role="tablist" aria-label={label}>
    {options.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}

export function StatusPill({open, label}: {open: boolean|null; label: string}) {
  return <span className={'pill ' + (open === true ? 'pill-open' : open === false ? 'pill-closed' : 'pill-unknown')}>{label}</span>;
}
