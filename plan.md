# BPGC Eats — Plan to make it an elite app

Goal: the fastest way for a BITS Goa student to decide what to eat, with **trustworthy macros**, honest estimates, and a UI that is simple, modern and on-theme.

Findings referenced as B#/E# are in [status.md](status.md).

## Principles
1. **Decide in under 10 seconds.** Open the app and see what is open now and what is for this meal.
2. **Honest numbers.** Show ranges and confidence, never fake precision.
3. **One theme.** Use the existing brand palette and nothing else.
4. **Fewer, better things.** Remove or demote novelty (lamp cord, clink sound) in favour of clarity.

## Theme (follow the brand colours)
Keep the colours already in style.css and delete the dead green rules (B7). Define them once as tokens.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FDF1E2` | `#352928` |
| `--surface` | `#FFF8EF` | `#453537` |
| `--surface-2` | `#EEE0EA` | `#443638` |
| `--text` | `#655A7C` (darken to ~`#4A4060` if contrast < 4.5:1) | `#FDF1E2` |
| `--accent` | `#AB92BF` | `#D8C7DE` |
| `--line` | `#C5AFCB` | `#836D80` |

Macro colours, used consistently everywhere (derive from the palette, not new hues):
- Calories → text colour, bold
- Protein → accent `#AB92BF`
- Carbs → a lighter tint of accent
- Fat → a muted `#836D80`

Verify every text/background pair for WCAG AA. Respect `prefers-color-scheme` and keep the manual toggle as a simple sun/moon button.

## Phase 0 — Foundation (1–2 days)
- [ ] `git init`, add `.gitignore`, connect to GitHub, hook up Vercel auto-deploy (E11).
- [ ] Add missing PWA files: `public/manifest.webmanifest`, icons, `sw.js` (E4).
- [ ] Add `vite.config.ts` and `@vitejs/plugin-react`; add ESLint + Prettier; add `npm run typecheck`.
- [ ] Delete or quarantine AdminPanel.tsx until it is real (E3). Make `tsc` pass.
- [ ] Split App.tsx into `components/` (MessTab, OutletTab, NightTab, Cart, Filters, ItemRow, MacroBadge, HeartButton) and `lib/` (hearts, macros, hours) (E1).
- [ ] **Stable item IDs** in the data: slug IDs such as `gajalaxmi/vada-pav` instead of positions. Add a migration map and update the SQL (B13).
- [ ] Move map images to real files in `public/`, lazy-load the Map tab with `React.lazy` (E2). Target: main bundle under 250 KB gzip.

## Phase 1 — Macro engine (the core feature, 1–2 weeks)
This is what makes the app elite, and B1–B4 say it is currently the weakest part.

### 1. A real nutrition dataset
Replace `macros.json` with a schema that is per **ingredient/dish with portion variants**:

```json
{
  "id": "gajalaxmi/vada-pav",
  "portions": [{ "label": "1 pav", "grams": 140, "kcal": 290, "p": 7, "c": 42, "f": 11 }],
  "range": 0.15,
  "confidence": "estimated | reference | measured",
  "source": "IFCT 2017 / USDA / HealthifyMe / manual",
  "tags": ["fried", "cheese", "double"]
}
```
- Base data: **IFCT 2017** (Indian Food Composition Tables) first, then USDA, then labelled brand data.
- **Coverage target: 100% of items**, in priority order: the most-liked and most-ordered items, then mess (106), then NC (237), then the rest of the outlets (922).
- Do the bulk mapping semi-automatically: group similar names (for example "Mysore Masala Dosa" → `masala_dosa` with `+butter/cheese` modifiers), review by hand, and mark each entry with confidence.

### 2. Modifiers and sizes (fixes B2)
Parse the name tokens (`Double`, `Cheese`, `Butter`, `Half/Full`, `6 pcs`, `Large`, `Egg`, `Chicken`) into multipliers or additions, so "Cheese Palti Pav (Double)" is computed and not copied. Users can also adjust a portion slider: ½ / 1 / 1.5 / 2.

### 3. Honest display (fixes B3)
- Show a **range** ("≈ 280–340 kcal") and a confidence dot (●●● reference, ●●○ estimated, ●○○ rough).
- Tap an item for a detail sheet: macro ring, portion, source, and "how this was estimated".
- Always say: estimated, not measured at BPGC. The user can report a wrong value from the sheet.

### 4. Meal and day tracker (fixes B4, B5)
- The cart becomes a **Plate**: any item from mess, outlets or NC, with quantity and portion.
- Totals: price **and** kcal, P, C, F, with a stacked macro bar and a percent-of-goal ring.
- **Goal setup (30 seconds):** height, weight, age, sex, activity, goal (cut/maintain/bulk) → TDEE via Mifflin-St Jeor, protein target 1.6–2.2 g/kg. Stored on device. No account required.
- "Log this plate" adds it to today's diary (local-first), with a 7-day trend.
- Plate persists across outlet and tab changes (fixes B9), and is grouped by outlet.

### 5. Smart suggestions (the "good estimates" part)
- "**Best protein per ₹**" and "**Best protein per kcal**" sorts, in every outlet.
- "**Fill my day**": given the remaining macros, suggest 3 plates from what is open now within a budget. Start simple with a greedy or knapsack search over the item set; it runs client-side.
- Filters: high protein (≥ 20 g), under 500 kcal, budget cap, diet. Fix diet inference and add a third "unsure" state rather than hiding items (B6).

## Phase 2 — UI/UX redesign (1–2 weeks)
Simple, modern, calm. Mobile-first, since nearly all use is on phones.

### Information architecture
Bottom tab bar (thumb reach): **Today · Menu · Plate · Map**
- **Today**: greeting, what's open now, the current mess meal, "Fill my day" card, today's progress ring. This is the default landing screen.
- **Menu**: a segmented control Mess / Outlets / Night. One global search bar across everything (fixes the per-outlet search limit).
- **Plate**: items, totals, macro bar, log button.
- **Map**: nearest open place, with a "Directions" button.

### Visual language
- Cards with generous spacing, 16–20 px radius, one soft shadow, 1 px `--line` borders.
- Type: one family (Inter or system-ui), 4 sizes, minimum 14 px body. Retire the 11 px letter-spaced uppercase labels.
- Item row = name, one-line macro chips (`290 kcal · P 7 · C 42 · F 11`), price, and a single `+` button. The like count becomes a small secondary control.
- Replace the glyph icons (`▤ ⌃ ⌖`) with one SVG icon set (Lucide).
- Macro ring and stacked bar as inline SVG, colours from the tokens above, animated with restrained 150–200 ms ease-out. Respect `prefers-reduced-motion`.
- Bottom sheet for item detail and the plate (swipe to dismiss). Sticky plate bar showing `₹ · kcal`.
- Skeleton loaders, meaningful empty states, and undo toasts (for example "Removed – Undo").
- Open/closed pills on every outlet ("Open · closes 2:00 AM"), driven by real hours data (B10).

### UX details that feel elite
- Current meal auto-selected by time of day; today's weekday auto-selected (already done, keep).
- Remember the last outlet, filters and diet preference.
- One-tap **share plate** as an image or text ("Dinner: 620 kcal, 38 g protein, ₹140").
- Haptics on add (where supported). Sound off by default, or remove it.
- Keep the lamp-cord toggle only as an easter egg, if at all. The primary toggle must be obvious.
- Accessibility: 44 px tap targets, visible focus, labelled controls, screen-reader text for ranges, AA contrast.

## Phase 3 — Trust, data ops and growth (ongoing)
- Real admin tool (or a simple Supabase dashboard flow) for menu, price, hours and macro edits, with an audit log. Until then, edit the JSON in git and review changes by PR. Do not ship the preview admin.
- "Last verified" date on every outlet and the mess menu. A "Report a wrong price/macro" button that writes to a Supabase `reports` table.
- Move hours, menus and macros to Supabase tables with a cached JSON snapshot for offline use.
- Harden hearts: Turnstile on anonymous sign-up, rate limits, return only the changed count instead of refetching everything (E5, E6).
- Privacy-friendly analytics (Plausible or Umami) and Sentry for errors (E10).
- Offline-first PWA: the menu works with no signal on campus Wi-Fi.
- Stretch: weekly mess nutrition summary, "what did I eat this week", friends' plates, and a mess feedback loop tied to likes.

## Testing and quality gates
- Unit tests (Vitest) for the macro maths, the modifier parser, TDEE and the suggestion search.
- Data tests in CI: every item has a macro entry; IDs are unique and stable; kcal ≈ 4P + 4C + 9F within 15%; no dangling refs. (Two base entries already fail this: `lemon_juice`, `black_coffee`.)
- Playwright smoke tests on a 375 px viewport. Lighthouse budgets: Performance ≥ 90, Accessibility ≥ 95.

## Suggested order (highest value first)
1. Phase 0 foundation, then stable IDs.
2. Macro dataset at 100% coverage, with portions and modifiers.
3. Plate with macro totals, plus goals.
4. New Today screen and bottom nav; apply the theme tokens.
5. Suggestions ("best protein per ₹", "Fill my day").
6. Reporting, hours, admin and hardening.

## Open questions for you
- Should goals and diary stay on-device only (simplest, private), or sync with accounts later?
- Do you want to keep the playful extras (lamp cord, clink sound), or drop them for a cleaner feel?
- Can someone verify real portion sizes at 3–5 popular outlets (for example weigh a Vada Pav)? Even a handful of measured items would raise confidence a lot.
