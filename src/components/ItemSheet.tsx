import {useState} from 'react';
import {Minus, Plus} from 'lucide-react';
import type {Item} from '../lib/catalog';
import {placeById} from '../lib/catalog';
import {scale} from '../lib/nutrition';
import {addToPlate} from '../lib/store';
import {proteinPerKcal, proteinPerRupee} from '../lib/suggest';
import {LikeButton} from './ItemRow';
import {ConfDots, DietMark, MacroBars, MacroRing, Segmented, Sheet, rupees, useToast} from './ui';

const PORTIONS: [string, string][] = [['0.5', '½'], ['1', '1×'], ['1.5', '1½'], ['2', '2×']];

export function ItemSheet({item, onClose}: {item: Item|null; onClose: () => void}) {
  return <Sheet open={!!item} onClose={onClose} title={item?.name ?? ''}>{item && <Body key={item.id} item={item} onClose={onClose} />}</Sheet>;
}

function Body({item, onClose}: {item: Item; onClose: () => void}) {
  const [portion, setPortion] = useState('1');
  const [qty, setQty] = useState(1);
  const toast = useToast();
  const e = item.est;
  const k = Number(portion) * qty;
  const m = e ? scale(e, k) : null;
  const place = placeById.get(item.placeId);
  return <div className="sheet-body">
    <div className="detail-head">
      <DietMark diet={item.diet} />
      <span>{item.place}{item.placeId !== 'mess' ? ` · ${item.category}` : ''}</span>
      {item.price != null ? <strong className="price">{rupees(item.price)}</strong> : <span className="muted">{place?.note ?? 'Price not listed'}</span>}
      <LikeButton item={item} />
    </div>
    {e && m ? <>
      <div className="detail-macros">
        <MacroRing m={m} />
        <div className="detail-right">
          <p className="range">≈ {Math.round(e.lo * k)}–{Math.round(e.hi * k)} kcal</p>
          <ConfDots conf={e.conf} label />
          <MacroBars m={m} />
        </div>
      </div>
      <div className="detail-controls">
        <div><span className="ctl-label">Portion</span><Segmented label="Portion size" value={portion} options={PORTIONS} onChange={setPortion} /></div>
        <div><span className="ctl-label">Quantity</span>
          <div className="stepper"><button type="button" aria-label="One less" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button><span aria-live="polite">{qty}</span><button type="button" aria-label="One more" onClick={() => setQty(q => q + 1)}><Plus size={16} /></button></div>
        </div>
      </div>
      <button type="button" className="btn-primary wide" onClick={() => { addToPlate(item.id, qty, Number(portion)); toast(`Added ${qty} × ${item.name}`); onClose(); }}>
        Add to plate{item.price != null ? ` · ${rupees(item.price * qty)}` : ''}
      </button>
      {item.price != null && e.p >= 5 && <p className="value-line">{proteinPerRupee(item).toFixed(1)} g protein per ₹10 · {proteinPerKcal(item).toFixed(1)} g per 100 kcal</p>}
      <details className="how">
        <summary>How we estimated this</summary>
        <ul>
          <li>Based on: <strong>{e.food}</strong>, {e.serving}</li>
          {e.notes.length > 0 && <li>Adjusted for: {e.notes.join(', ')}</li>}
          <li>Numbers come from recipe estimates using IFCT 2017 and USDA ingredient data. They were not measured at BPGC, so kitchens and portions vary. The range shows the likely spread.</li>
        </ul>
      </details>
    </> : <p className="muted">We don't have a nutrition estimate for this item.</p>}
    {item.note && <p className="muted">{item.note}</p>}
  </div>;
}
