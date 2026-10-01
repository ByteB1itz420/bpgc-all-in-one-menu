# BPGC Eats

Campus food for BITS Goa: the weekly mess menu, 8 outlets, 3 night canteens (ANC/CNC/DNC) and a campus map, with **macro estimates for every item**, a plate builder, daily goals and a food log. Prices and timings may change at the counter. Nothing is ordered through the app.

## Run

```
npm install
npm run dev        # local dev server
npm test           # vitest: data integrity, macro engine, goals, suggestions
npm run lint
npm run build      # typecheck + production build
```

## Layout

- `src/data/` holds the menu data. Every outlet item has a frozen `id`, so reordering the JSON never moves likes.
- `src/lib/foods.ts` is the reference nutrition per campus serving (protein/carbs/fat; kcal derived).
- `src/lib/nutrition.ts` matches menu names to foods, applies modifiers (cheese, double, half/full, pieces, ml, mess katori) and returns an estimate with a range and confidence.
- `src/lib/catalog.ts` builds the unified item list (mess, outlets, NC), diet tags and places.
- `src/lib/hours.ts` has the verified hours and open/closed logic. `goals.ts` has Mifflin–St Jeor targets. `suggest.ts` has protein-per-₹ and "Fill my meal".
- `src/lib/store.ts` keeps the plate, goal, diary and prefs on this device only (localStorage).
- `src/lib/hearts.ts` handles likes via Supabase anonymous auth and RLS RPCs (see `bpgc-supabase-setup.sql`).
- `src/components/` holds the screens: Today, Menu, Plate, Map (lazy-loaded).
- `attic/` holds the old admin preview. It is not built.

## Macro estimates

Values are recipe estimates built from IFCT 2017 and USDA ingredient data. They are not measured at BPGC. Each item shows a kcal range and a confidence level (good / fair / rough), and the detail sheet explains how the estimate was made. To correct a dish, edit `foods.ts` or add a rule in `nutrition.ts`, then run `npm test`.

## Deploy

Vercel: https://bpgc-food.vercel.app/. The public Supabase URL and publishable key are in `hearts.ts`. Never put a service-role key in client code.
