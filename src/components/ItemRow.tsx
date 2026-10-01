import {Heart, Plus} from 'lucide-react';
import type {Item} from '../lib/catalog';
import {hearts} from '../lib/hearts';
import {addToPlate} from '../lib/store';
import {DietMark, MacroChips, rupees, useHearts, useOpenItem, useToast} from './ui';

export function LikeButton({item}: {item: Item}) {
  const h = useHearts();
  const mine = !!h.mine[item.id], n = h.counts[item.id] || 0;
  return <button type="button" className={'like' + (mine ? ' on' : '')} aria-pressed={mine} disabled={!!h.busy[item.id]}
    aria-label={`${mine ? 'Unlike' : 'Like'} ${item.name}, ${n} ${n === 1 ? 'like' : 'likes'}`} onClick={e => { e.stopPropagation(); void hearts.like(item.id); }}>
    <Heart size={16} fill={mine ? 'currentColor' : 'none'} /><span>{n || ''}</span>
  </button>;
}

export function ItemRow({item, showPlace = false, role}: {item: Item; showPlace?: boolean; role?: string}) {
  const open = useOpenItem(), toast = useToast();
  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToPlate(item.id);
    navigator.vibrate?.(10);
    toast(`Added ${item.name}`);
  };
  return <div className="item" role="button" tabIndex={0} onClick={() => open(item)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); } }} aria-label={`${item.name}, details`}>
    <div className="item-main">
      <div className="item-title"><DietMark diet={item.diet} /><span className="item-name">{item.name}</span></div>
      <div className="item-meta">
        {role && <span className="item-role">{role}</span>}
        {showPlace && <span className="item-role">{item.place}{item.place !== item.category && item.placeId !== 'mess' ? ` · ${item.category}` : ''}</span>}
        {item.est ? <MacroChips m={item.est} compact /> : <span className="muted">No estimate</span>}
      </div>
    </div>
    <div className="item-side">
      {item.price != null && <span className="price">{rupees(item.price)}</span>}
      <div className="item-actions">
        <LikeButton item={item} />
        {item.est && <button type="button" className="add" onClick={add} aria-label={`Add ${item.name} to plate`}><Plus size={18} /></button>}
      </div>
    </div>
  </div>;
}
