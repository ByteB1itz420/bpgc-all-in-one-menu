import {Suspense, lazy, useCallback, useEffect, useRef, useState} from 'react';
import {House, Map as MapIcon, Moon, Sun, SunMoon, UtensilsCrossed, BookOpen} from 'lucide-react';
import type {Item} from './lib/catalog';
import {plate, prefs, useStore} from './lib/store';
import {plateTotals, resolvePlate} from './lib/totals';
import {GoalSheet} from './components/GoalSheet';
import {ItemSheet} from './components/ItemSheet';
import {MenuView, type MenuSection} from './components/MenuView';
import {PlateView} from './components/PlateView';
import {TodayView} from './components/TodayView';
import {OpenItem, Toast, rupees, r0, useHearts} from './components/ui';

const MapPanel = lazy(() => import('./components/MapPanel'));
type Tab = 'today'|'menu'|'plate'|'map';
const TABS: [Tab, string, typeof House][] = [['today', 'Today', House], ['menu', 'Menu', BookOpen], ['plate', 'Plate', UtensilsCrossed], ['map', 'Map', MapIcon]];

function useTheme() {
  const {theme} = useStore(prefs);
  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
  const next = () => prefs.set(p => ({...p, theme: p.theme === 'system' ? 'dark' : p.theme === 'dark' ? 'light' : 'system'}));
  return {theme, next};
}

export function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [section, setSection] = useState<MenuSection>('mess');
  const [item, setItem] = useState<Item|null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string; undo?: () => void; id: number}|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const {theme, next} = useTheme();
  const lines = resolvePlate(useStore(plate));
  const t = plateTotals(lines);
  const heartMsg = useHearts().message;

  const showToast = useCallback((msg: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setToast({msg, undo, id: Date.now()});
    timer.current = setTimeout(() => setToast(null), undo ? 5000 : 2200);
  }, []);
  const go = (next: Tab) => { setTab(next); window.scrollTo({top: 0}); };
  const closeItem = useCallback(() => setItem(null), []);
  const closeGoal = useCallback(() => setGoalOpen(false), []);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : SunMoon;

  return <OpenItem.Provider value={setItem}><Toast.Provider value={showToast}>
    <div className="app">
      <header className="top">
        <button type="button" className="brand" onClick={() => go('today')} aria-label="BPGC Eats, home"><img src="/icon.svg" alt="" width={28} height={28} /><span>BPGC <b>Eats</b></span></button>
        <nav className="top-nav" aria-label="Sections">
          {TABS.map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>{label}{k === 'plate' && t.qty > 0 && <span className="badge">{t.qty}</span>}</button>)}
        </nav>
        <button type="button" className="icon-btn" onClick={next} aria-label={`Theme: ${theme}. Change theme`} title={`Theme: ${theme}`}><ThemeIcon size={20} /></button>
      </header>

      <main className="main">
        {heartMsg && <p className="banner" role="status">{heartMsg}</p>}
        {tab === 'today' && <TodayView openGoal={() => setGoalOpen(true)} goMenu={() => go('menu')} />}
        {tab === 'menu' && <MenuView section={section} setSection={setSection} />}
        {tab === 'plate' && <PlateView go={go} />}
        {tab === 'map' && <section className="view"><Suspense fallback={<div className="skeleton" style={{height: 320}} />}><MapPanel /></Suspense></section>}
        <footer className="foot">
          <p>Prices and timings may change at the counter. Macros are estimates, not lab measurements.</p>
          <p>Made by Ayush Singh &amp; Hemakshi Pandit</p>
        </footer>
      </main>

      {tab !== 'plate' && t.qty > 0 && <button type="button" className="plate-bar" onClick={() => go('plate')}>
        <UtensilsCrossed size={18} /><span>{t.qty} {t.qty === 1 ? 'item' : 'items'}</span>
        <span className="plate-bar-stats">{r0(t.kcal)} kcal · {r0(t.p)}g P{t.price ? ` · ${rupees(t.price)}` : ''}</span>
      </button>}

      <nav className="bottom-nav" aria-label="Sections">
        {TABS.map(([k, label, Icon]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>
          <span className="nav-icon"><Icon size={22} strokeWidth={tab === k ? 2.4 : 1.8} />{k === 'plate' && t.qty > 0 && <span className="badge">{t.qty}</span>}</span>{label}
        </button>)}
      </nav>

      {toast && <div className="toast" role="status" key={toast.id}>
        <span>{toast.msg}</span>
        {toast.undo && <button type="button" onClick={() => { toast.undo!(); setToast(null); }}>Undo</button>}
      </div>}
      <ItemSheet item={item} onClose={closeItem} />
      <GoalSheet open={goalOpen} onClose={closeGoal} />
    </div>
  </Toast.Provider></OpenItem.Provider>;
}
