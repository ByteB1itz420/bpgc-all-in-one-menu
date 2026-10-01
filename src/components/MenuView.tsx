import {useDeferredValue, useMemo, useState} from 'react';
import {Search, X} from 'lucide-react';
import {DAYS, ITEMS, MEALS, PLACES, itemsByPlace, messMenu, type Day, type Item, type Meal} from '../lib/catalog';
import {MEAL_HOURS, currentMeal, range, status} from '../lib/hours';
import {normalize} from '../lib/nutrition';
import {prefs, useStore} from '../lib/store';
import {proteinPerKcal, proteinPerRupee} from '../lib/suggest';
import {ItemRow} from './ItemRow';
import {Segmented, StatusPill, useHearts} from './ui';

export type MenuSection = 'mess'|'outlets'|'nc';
type Sort = 'menu'|'protein-rupee'|'protein-kcal'|'liked'|'price';
type Filters = {diet: 'all'|'veg'|'egg'|'nonveg'; highProtein: boolean; light: boolean; budget: number; sort: Sort};

const today = (): Day => DAYS[(new Date().getDay() + 6) % 7];

export function MenuView({section, setSection}: {section: MenuSection; setSection: (s: MenuSection) => void}) {
  const p = useStore(prefs);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim());
  const [f, setF] = useState<Filters>({diet: p.diet, highProtein: false, light: false, budget: 0, sort: 'menu'});
  const setDiet = (diet: Filters['diet']) => { setF({...f, diet}); prefs.set({...p, diet}); };
  const counts = useHearts().counts;

  const apply = (list: Item[]) => {
    let out = list.filter(i =>
      (f.diet === 'all' || i.diet === f.diet) &&
      (!f.highProtein || (i.est?.p ?? 0) >= 20) &&
      (!f.light || (i.est != null && i.est.kcal < 500)) &&
      (!f.budget || (i.price != null && i.price <= f.budget)));
    if (f.sort === 'protein-rupee') out = out.filter(i => i.price != null).sort((a, b) => proteinPerRupee(b) - proteinPerRupee(a));
    if (f.sort === 'protein-kcal') out = [...out].sort((a, b) => proteinPerKcal(b) - proteinPerKcal(a));
    if (f.sort === 'liked') out = [...out].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    if (f.sort === 'price') out = out.filter(i => i.price != null).sort((a, b) => a.price! - b.price!);
    return out;
  };
  const hiddenUnsure = (list: Item[]) => (f.diet !== 'all' ? list.filter(i => i.diet === 'unsure').length : 0);
  const filtersActive = f.diet !== 'all' || f.highProtein || f.light || f.budget > 0 || f.sort !== 'menu';

  const results = useMemo(() => {
    if (!q) return null;
    const terms = normalize(q).split(' ');
    return ITEMS.filter(i => { const t = normalize(`${i.name} ${i.category} ${i.place}`); return terms.every(x => t.includes(x)); });
  }, [q]);

  return <section className="view">
    <div className="search">
      <Search size={18} aria-hidden="true" />
      <input type="search" placeholder="Search all menus — e.g. paneer roll" aria-label="Search all menus" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
      {query && <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}
    </div>
    {!results && <Segmented label="Menu" value={section} onChange={setSection} options={[['mess', 'Mess'], ['outlets', 'Outlets'], ['nc', 'Night']]} />}
    <FilterBar f={f} setF={setF} setDiet={setDiet} active={filtersActive} />
    {results ? <SearchResults items={apply(results)} hidden={hiddenUnsure(results)} q={q} />
      : section === 'mess' ? <MessMenu apply={apply} />
      : <PlaceMenu kind={section === 'nc' ? 'nc' : 'outlet'} apply={apply} sorted={f.sort !== 'menu'} hiddenUnsure={hiddenUnsure} />}
  </section>;
}

function FilterBar({f, setF, setDiet, active}: {f: Filters; setF: (f: Filters) => void; setDiet: (d: Filters['diet']) => void; active: boolean}) {
  const chip = (on: boolean, label: string, click: () => void) => <button type="button" className={'fchip' + (on ? ' on' : '')} aria-pressed={on} onClick={click}>{label}</button>;
  return <div className="filters" aria-label="Filters">
    <div className="chip-scroll">
      {chip(f.diet === 'veg', 'Veg', () => setDiet(f.diet === 'veg' ? 'all' : 'veg'))}
      {chip(f.diet === 'egg', 'Egg', () => setDiet(f.diet === 'egg' ? 'all' : 'egg'))}
      {chip(f.diet === 'nonveg', 'Non-veg', () => setDiet(f.diet === 'nonveg' ? 'all' : 'nonveg'))}
      <span className="chip-sep" />
      {chip(f.highProtein, '20g+ protein', () => setF({...f, highProtein: !f.highProtein}))}
      {chip(f.light, 'Under 500 kcal', () => setF({...f, light: !f.light}))}
      <select className={'fchip' + (f.budget ? ' on' : '')} aria-label="Budget" value={f.budget} onChange={e => setF({...f, budget: Number(e.target.value)})}>
        <option value={0}>Any price</option>{[50, 100, 150, 200, 300].map(b => <option key={b} value={b}>Up to ₹{b}</option>)}
      </select>
      <select className={'fchip' + (f.sort !== 'menu' ? ' on' : '')} aria-label="Sort" value={f.sort} onChange={e => setF({...f, sort: e.target.value as Sort})}>
        <option value="menu">Menu order</option><option value="protein-rupee">Most protein per ₹</option><option value="protein-kcal">Most protein per kcal</option><option value="liked">Most liked</option><option value="price">Cheapest first</option>
      </select>
      {active && <button type="button" className="fchip clear" onClick={() => setF({diet: 'all', highProtein: false, light: false, budget: 0, sort: 'menu'})}>Reset</button>}
    </div>
  </div>;
}

function SearchResults({items, hidden, q}: {items: Item[]; hidden: number; q: string}) {
  if (!items.length) return <div className="empty">No matches for “{q}”. Try a shorter word or remove filters.</div>;
  return <div className="card list">
    <p className="list-note">{items.length} {items.length === 1 ? 'match' : 'matches'} across all menus{hidden ? ` · ${hidden} with unconfirmed diet hidden` : ''}</p>
    {items.slice(0, 80).map(i => <ItemRow key={i.id} item={i} showPlace />)}
    {items.length > 80 && <p className="list-note">Showing 80. Refine your search to see more.</p>}
  </div>;
}

function MessMenu({apply}: {apply: (l: Item[]) => Item[]}) {
  const [day, setDay] = useState<Day>(today);
  const cur = currentMeal();
  const isToday = day === today();
  return <>
    <div className="days" role="tablist" aria-label="Day">{DAYS.map(d => <button key={d} type="button" role="tab" aria-selected={day === d} className={day === d ? 'on' : ''} onClick={() => setDay(d)}>{d}{d === today() && <i aria-label="today" />}</button>)}</div>
    {MEALS.map((meal: Meal) => {
      const dishes = messMenu(day, meal);
      const shown = new Set(apply(dishes.flatMap(x => (x.item ? [x.item] : []))).map(i => i.id));
      const live = isToday && cur.live && cur.meal === meal;
      return <div className={'card list' + (live ? ' live' : '')} key={meal}>
        <div className="card-head"><h3 className="card-title">{meal}</h3><span className="muted">{range(MEAL_HOURS[meal])}</span>{live && <StatusPill open label="Serving now" />}</div>
        {dishes.map((x, i) => x.item ? (shown.has(x.item.id) && <ItemRow key={i} item={x.item} role={x.role} />)
          : <div className="item unlisted" key={i}><span className="item-role">{x.role}</span><span className="muted">Not listed this week</span></div>)}
      </div>;
    })}
    <p className="fine center">Mess curry and dal estimates use a smaller mess katori (≈150 g).</p>
  </>;
}

function PlaceMenu({kind, apply, sorted, hiddenUnsure}: {kind: 'outlet'|'nc'; apply: (l: Item[]) => Item[]; sorted: boolean; hiddenUnsure: (l: Item[]) => number}) {
  const p = useStore(prefs);
  const places = PLACES.filter(x => x.kind === kind);
  const saved = kind === 'nc' ? p.lastNc : p.lastOutlet;
  const place = places.find(x => x.id === saved) ?? places[0];
  const pick = (id: string) => prefs.set({...p, [kind === 'nc' ? 'lastNc' : 'lastOutlet']: id});
  const all = itemsByPlace(place.id);
  const items = apply(all);
  const st = status(place.hours);
  const cats = [...new Set(items.map(i => i.category))];
  const hidden = hiddenUnsure(all);
  return <>
    <div className="chip-scroll places" role="tablist" aria-label="Place">
      {places.map(x => { const s = status(x.hours); return <button key={x.id} type="button" role="tab" aria-selected={x.id === place.id} className={'place-chip' + (x.id === place.id ? ' on' : '')} onClick={() => pick(x.id)}>
        {s.open !== null && <i className={s.open ? 'dot-open' : 'dot-closed'} aria-label={s.open ? 'open' : 'closed'} />}{x.name}
      </button>; })}
    </div>
    <div className="place-head"><StatusPill open={st.open} label={st.label} />{place.note && <span className="muted">{place.note}</span>}</div>
    {!items.length && <div className="empty">Nothing here matches your filters.</div>}
    {hidden > 0 && <p className="list-note">{hidden} {hidden === 1 ? 'item' : 'items'} with unconfirmed diet hidden by the diet filter. Ask at the counter.</p>}
    {sorted ? <div className="card list">{items.map(i => <ItemRow key={i.id} item={i} role={i.category} />)}</div>
      : cats.map(c => <div className="card list" key={c}>
        <div className="card-head"><h3 className="card-title">{c}</h3><span className="muted">{items.filter(i => i.category === c).length}</span></div>
        {items.filter(i => i.category === c).map(i => <ItemRow key={i.id} item={i} />)}
      </div>)}
  </>;
}
