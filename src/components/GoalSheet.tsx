import {useState} from 'react';
import {ACTIVITY, targets, type Profile} from '../lib/goals';
import {profile} from '../lib/store';
import {Segmented, Sheet} from './ui';

const DEFAULT: Profile = {sex: 'male', age: 20, heightCm: 170, weightKg: 65, activity: 1.375, goal: 'maintain'};

export function GoalSheet({open, onClose}: {open: boolean; onClose: () => void}) {
  return <Sheet open={open} onClose={onClose} title="Your daily goal">{open && <Form onClose={onClose} />}</Sheet>;
}

function Form({onClose}: {onClose: () => void}) {
  const [p, setP] = useState<Profile>(() => profile.get() ?? DEFAULT);
  const t = targets(p);
  const num = (k: 'age'|'heightCm'|'weightKg', label: string, unit: string, min: number, max: number) =>
    <label className="field"><span>{label}</span><span className="input-unit"><input type="number" inputMode="decimal" min={min} max={max} value={p[k]} onChange={e => setP({...p, [k]: Number(e.target.value)})} /><small>{unit}</small></span></label>;
  const valid = p.age >= 15 && p.age <= 80 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 250;
  return <div className="sheet-body">
    <p className="muted">Takes 30 seconds. It is saved only on this device.</p>
    <div className="form-grid">
      <div className="field"><span>Sex</span><Segmented label="Sex" value={p.sex} options={[['male', 'Male'], ['female', 'Female']]} onChange={sex => setP({...p, sex})} /></div>
      {num('age', 'Age', 'yr', 15, 80)}
      {num('heightCm', 'Height', 'cm', 120, 230)}
      {num('weightKg', 'Weight', 'kg', 30, 250)}
    </div>
    <label className="field"><span>Activity</span>
      <select value={p.activity} onChange={e => setP({...p, activity: Number(e.target.value)})}>{ACTIVITY.map(a => <option key={a.k} value={a.k}>{a.label}</option>)}</select>
    </label>
    <div className="field"><span>Goal</span><Segmented label="Goal" value={p.goal} options={[['cut', 'Lose fat'], ['maintain', 'Maintain'], ['bulk', 'Build muscle']]} onChange={goal => setP({...p, goal})} /></div>
    {valid && <div className="goal-preview">
      <div><strong>{t.kcal}</strong><small>kcal</small></div>
      <div><strong>{t.p}g</strong><small>protein</small></div>
      <div><strong>{t.c}g</strong><small>carbs</small></div>
      <div><strong>{t.f}g</strong><small>fat</small></div>
    </div>}
    <p className="fine">Mifflin–St Jeor estimate. Protein is 1.6–2.0 g per kg. It's a starting point, not medical advice.</p>
    <div className="row-btns">
      {profile.get() && <button type="button" className="btn-ghost" onClick={() => { profile.set(null); onClose(); }}>Remove goal</button>}
      <button type="button" className="btn-primary" disabled={!valid} onClick={() => { profile.set(p); onClose(); }}>Save goal</button>
    </div>
  </div>;
}
