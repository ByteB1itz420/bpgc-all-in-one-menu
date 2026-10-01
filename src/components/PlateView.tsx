import {Minus, Plus, Share2, Trash2, UtensilsCrossed} from 'lucide-react';
import {setPortion, changeQty, logEntry, plate, profile, useStore, diary, dayKey} from '../lib/store';
import {mealLabel, plateTotals, resolvePlate, toLogged, dayTotals} from '../lib/totals';
import {targets} from '../lib/goals';
import {MacroBars, MacroRing, rupees, r0, useOpenItem, useToast} from './ui';

const PORTION_LABEL: Record<number, string> = {0.5: '½', 1: '1×', 1.5: '1½', 2: '2×'};
const nextPortion = (p: number) => ({0.5: 1, 1: 1.5, 1.5: 2, 2: 0.5} as Record<number, number>)[p] ?? 1;

export function PlateView({go}: {go: (tab: 'menu') => void}) {
  const lines = resolvePlate(useStore(plate));
  const prof = useStore(profile), d = useStore(diary);
  const goal = prof ? targets(prof) : null;
  const t = plateTotals(lines);
  const eaten = dayTotals(d[dayKey()]);
  const toast = useToast(), open = useOpenItem();

  if (!lines.length) return <section className="view">
    <div className="empty-state">
      <UtensilsCrossed size={40} strokeWidth={1.5} />
      <h2>Your plate is empty</h2>
      <p>Add items from any menu to see the total price, calories and macros before you order.</p>
      <button type="button" className="btn-primary" onClick={() => go('menu')}>Browse menus</button>
    </div>
  </section>;

  const groups = new Map<string, typeof lines>();
  for (const l of lines) groups.set(l.item.place, [...(groups.get(l.item.place) ?? []), l]);
  const label = mealLabel();

  const share = async () => {
    const text = `${label} plate: ${r0(t.kcal)} kcal · ${r0(t.p)}g protein${t.price ? ` · ${rupees(t.price)}` : ''}\n` + lines.map(l => `• ${l.qty}× ${l.item.name} (${l.item.place})`).join('\n') + '\n— BPGC Eats';
    try {
      if (navigator.share) await navigator.share({text});
      else { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    } catch { /* cancelled */ }
  };
  const clear = () => { const before = plate.get(); plate.set([]); toast('Plate cleared', () => plate.set(before)); };
  const log = () => { logEntry(label, lines.map(toLogged)); const before = plate.get(); plate.set([]); toast(`Logged to today's ${label.toLowerCase()}`, () => plate.set(before)); };

  return <section className="view">
    <div className="card plate-summary">
      <MacroRing m={t} size={120} />
      <div className="plate-sum-right">
        <div className="sum-line"><span>{t.qty} {t.qty === 1 ? 'item' : 'items'}</span>{t.price > 0 && <strong>{rupees(t.price)}</strong>}</div>
        <MacroBars m={t} />
        {goal && <p className="fine">After this, today: {r0(eaten.kcal + t.kcal)} / {goal.kcal} kcal · {r0(eaten.p + t.p)} / {goal.p}g protein</p>}
      </div>
    </div>
    {[...groups].map(([place, ls]) => <div className="card" key={place}>
      <h3 className="card-title">{place}</h3>
      {ls.map(l => <div className="plate-line" key={l.key}>
        <button type="button" className="plate-name" onClick={() => open(l.item)}>
          <strong>{l.item.name}</strong>
          <small>{r0(l.m.kcal)} kcal · P {r0(l.m.p)}g{l.price != null ? ` · ${rupees(l.price)}` : ''}</small>
        </button>
        <button type="button" className="portion-btn" onClick={() => setPortion(l.key, nextPortion(l.portion))} aria-label={`Portion ${PORTION_LABEL[l.portion]}, change`}>{PORTION_LABEL[l.portion] ?? `${l.portion}×`}</button>
        <div className="stepper small">
          <button type="button" aria-label={`One less ${l.item.name}`} onClick={() => { const before = plate.get(); changeQty(l.key, -1); if (l.qty === 1) toast(`Removed ${l.item.name}`, () => plate.set(before)); }}><Minus size={14} /></button>
          <span>{l.qty}</span>
          <button type="button" aria-label={`One more ${l.item.name}`} onClick={() => changeQty(l.key, 1)}><Plus size={14} /></button>
        </div>
      </div>)}
    </div>)}
    <p className="fine center">Price estimate only. Nothing is ordered. Macros are estimates; tap an item to see how.</p>
    <div className="row-btns sticky-actions">
      <button type="button" className="icon-btn" onClick={clear} aria-label="Clear plate"><Trash2 size={18} /></button>
      <button type="button" className="btn-ghost" onClick={share}><Share2 size={16} /> Share</button>
      <button type="button" className="btn-primary" onClick={log}>Log as {label.toLowerCase()}</button>
    </div>
  </section>;
}
