import type {Macros} from './nutrition';

export type Profile = {sex: 'male'|'female'; age: number; heightCm: number; weightKg: number; activity: number; goal: 'cut'|'maintain'|'bulk'};
export const ACTIVITY = [
  {k: 1.2, label: 'Mostly sitting'},
  {k: 1.375, label: 'Light (walk to class)'},
  {k: 1.55, label: 'Moderate (exercise 3–5×/week)'},
  {k: 1.725, label: 'Very active (daily training)'},
];

/** Mifflin–St Jeor BMR × activity, adjusted for goal; protein by body weight; fat 25% of kcal. */
export function targets(p: Profile): Macros {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const kcal = Math.round((bmr * p.activity + (p.goal === 'cut' ? -400 : p.goal === 'bulk' ? 300 : 0)) / 10) * 10;
  const protein = Math.round(p.weightKg * (p.goal === 'cut' ? 2 : p.goal === 'bulk' ? 1.8 : 1.6));
  const fat = Math.round(kcal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {kcal, p: protein, c: carbs, f: fat};
}
