import {useMemo, useState} from 'react';
import {Plus, Sparkles, Target, Trash2} from 'lucide-react';
import {DAYS, ITEMS, PLACES, messMenu, type Item} from '../lib/catalog';
import {MEAL_HOURS, currentMeal, minutesNow, range, status} from '../lib/hours';
import {targets} from '../lib/goals';
import {addToPlate, dayKey, diary, profile, removeEntry, useStore} from '../lib/store';
import {bestValue, fillMeal} from '../lib/suggest';
import {dayTotals} from '../lib/totals';
import {ItemRow} from './ItemRow';
import {MacroBars, MacroRing, StatusPill, rupees, r0, useToast} from './ui';

const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export function TodayView({openGoal, goMenu}: {openGoal: () => void; goMenu: () => void}) {
  const prof = useStore(profile), d = useStore(diary);
  const goal = prof ? targets(prof) : null;
  const k = dayKey(), entries = d[k] ?? [];
  const eaten = dayTotals(entries);
  const toast = useToast();
  const now = minutesNow();
  const cur = currentMeal(now);
  const dayIdx = (new Date().getDay() + 6) % 7;
  const day = DAYS[cur.tomorrow ? (dayIdx + 1) % 7 : dayIdx];
  const dishes = messMenu(day, cur.meal).filter(x => x.item);
  const mainItems = dishes.map(x => x.item!).filter(i => !/beverage|milk|drink|cereal|health/i.test(i.category));
  const mealTotal = mainItems.reduce((s, i) => ({kcal: s.kcal + (i.est?.kcal ?? 0), p: s.p + (i.est?.p ?? 0)}), {kcal: 0, p: 0});

  const open = PLACES.filter(p => p.kind !== 'mess' && p.priced && p.hours && status(p.hours, now).open);
  // Hours are only verified for a few places, so fall back to every priced outlet that isn't known to be closed.
  const fallback = PLACES.filter(p => p.kind !== 'mess' && p.priced && (!p.hours || status(p.hours, now).open));
  const pool = ITEMS.filter(i => (open.length ? open : fallback).some(p => p.id === i.placeId));

  const [budget, setBudget] = useState(150);
  const remaining = goal ? {kcal: Math.max(250, goal.kcal - eaten.kcal), p: Math.max(10, goal.p - eaten.p)} : {kcal: 650, p: 30};
  const mealTarget = {kcal: Math.min(remaining.kcal, goal ? Math.max(400, goal.kcal * 0.35) : 650), p: remaining.p};
  const combos = useMemo(() => fillMeal(pool, mealTarget, budget), [pool.length, mealTarget.kcal, mealTarget.p, budget]); // eslint-disable-line react-hooks/exhaustive-deps
  const best = useMemo(() => bestValue(pool, 'rupee', 5), [pool.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCombo = (items: Item[]) => { items.forEach(i => addToPlate(i.id)); toast(`Added ${items.length} items to plate`); };
  const addMeal = () => { mainItems.forEach(i => addToPlate(i.id)); toast(`Added ${cur.meal.toLowerCase()} to plate`); };

  return <section className="view">
    <header className="hello">
      <h1>{greeting()}</h1>
      <p className="muted">{new Date().toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
    </header>

    <div className="card progress">
      <MacroRing m={eaten} goal={goal?.kcal} size={128} />
      <div className="progress-right">
        {goal ? <>
          <p className="progress-line"><strong>{Math.max(0, goal.kcal - r0(eaten.kcal))}</strong> kcal left · <strong>{Math.max(0, goal.p - r0(eaten.p))}g</strong> protein to go</p>
          <MacroBars m={eaten} goal={goal} />
          <button type="button" className="link" onClick={openGoal}>Edit goal</button>
        </> : <>
          <p className="progress-line">Set a daily goal to track calories and protein against your needs.</p>
          <button type="button" className="btn-primary" onClick={openGoal}><Target size={16} /> Set my goal</button>
        </>}
      </div>
    </div>

    <div className="card list">
      <div className="card-head">
        <h2 className="card-title">{cur.live ? 'Serving now' : cur.tomorrow ? 'Tomorrow' : 'Up next'} · Mess {cur.meal.toLowerCase()}</h2>
        <StatusPill open={cur.live} label={range(MEAL_HOURS[cur.meal])} />
      </div>
      {dishes.slice(0, 7).map((x, i) => <ItemRow key={i} item={x.item!} role={x.role} />)}
      <div className="card-foot">
        <span className="muted">One of each main item ≈ {r0(mealTotal.kcal)} kcal · {r0(mealTotal.p)}g protein</span>
        <button type="button" className="btn-ghost" onClick={addMeal}><Plus size={16} /> Add meal</button>
      </div>
    </div>

    <div className="card">
      <div className="card-head"><h2 className="card-title"><Sparkles size={16} /> Fill my {goal ? 'day' : 'next meal'}</h2>
        <select className="fchip" aria-label="Budget" value={budget} onChange={e => setBudget(Number(e.target.value))}>{[80, 120, 150, 200, 300].map(b => <option key={b} value={b}>≤ ₹{b}</option>)}</select>
      </div>
      <p className="muted small">{open.length ? `From places open now (${open.map(p => p.name).join(', ')}).` : 'From priced outlets not known to be closed (most hours are unverified).'} Aiming for ~{r0(mealTarget.kcal)} kcal with the most protein.</p>
      {combos.length ? combos.map(c => <div className="combo" key={c.placeId}>
        <div className="combo-main">
          <strong>{c.place}</strong>
          <span>{c.items.map(i => i.name).join(' + ')}</span>
          <small>{r0(c.kcal)} kcal · <b>{r0(c.p)}g protein</b> · {rupees(c.price)}</small>
        </div>
        <button type="button" className="add" aria-label={`Add ${c.place} combo to plate`} onClick={() => addCombo(c.items)}><Plus size={18} /></button>
      </div>) : <p className="muted">Nothing fits that budget. Try a higher one.</p>}
    </div>

    <div className="card list">
      <div className="card-head"><h2 className="card-title">Best protein for your money</h2><button type="button" className="link" onClick={goMenu}>See all</button></div>
      {best.map(i => <ItemRow key={i.id} item={i} showPlace />)}
    </div>

    {entries.length > 0 && <div className="card list">
      <h2 className="card-title">Today's log</h2>
      {entries.map(e => <div className="log-row" key={e.id}>
        <div><strong>{e.label}</strong><small>{e.items.map(i => `${i.qty > 1 ? i.qty + '× ' : ''}${i.name}`).join(', ')}</small></div>
        <span className="muted">{r0(dayTotals([e]).kcal)} kcal</span>
        <button type="button" className="icon-btn" aria-label={`Delete ${e.label} entry`} onClick={() => { const before = diary.get(); removeEntry(k, e.id); toast('Entry deleted', () => diary.set(before)); }}><Trash2 size={16} /></button>
      </div>)}
    </div>}
    <WeekChart goal={goal?.kcal} />
  </section>;
}

function WeekChart({goal}: {goal?: number}) {
  const d = useStore(diary);
  const days = [...Array(7)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - 6 + i); return {k: dayKey(x), label: x.toLocaleDateString('en-IN', {weekday: 'narrow'}), kcal: dayTotals(d[dayKey(x)]).kcal}; });
  if (days.every(x => !x.kcal)) return null;
  const max = Math.max(goal ?? 0, ...days.map(x => x.kcal), 1);
  return <div className="card">
    <h2 className="card-title">Last 7 days</h2>
    <div className="week" role="img" aria-label={days.map(x => `${x.k}: ${r0(x.kcal)} kcal`).join(', ')}>
      {goal && <div className="week-goal" style={{bottom: `${(goal / max) * 100}%`}}><span>{goal}</span></div>}
      {days.map(x => <div className="week-col" key={x.k}><div className="week-bar" style={{height: `${(x.kcal / max) * 100}%`}} title={`${r0(x.kcal)} kcal`} /><span>{x.label}</span></div>)}
    </div>
  </div>;
}
