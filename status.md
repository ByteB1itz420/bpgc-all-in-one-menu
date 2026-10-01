# BPGC Eats — Status

Audit date: 2026-10-01. Method: read every source file, ran `tsc --noEmit` and `vite build` on a scratch copy, and ran scripts over the JSON data.

## What exists today
| Area | State |
|---|---|
| Mess menu (Mon–Sun × 4 meals, 106 dishes) | Working |
| Outlet menus (8 outlets, 922 items, prices) | Working. Relish has no prices |
| Night canteens ANC / CNC / DNC (237 items) | Working |
| Cart (price-only estimate, no order) | Working |
| Likes (Supabase anonymous auth + RLS RPCs) | Working. Falls back to local-only if config is empty |
| Campus map (OSM raster embedded, 10 pins) | Working, heavy |
| Light/dark theme (pull-cord lamp, clink sound) | Working. Palette is inconsistent (see B7) |
| Macros (toggle, per-item line) | **Barely there: 90 of 1,265 items (7%)** |
| Admin panel | Dead code. Not imported anywhere, and fails typecheck |
| PWA (manifest, service worker, icons) | Referenced but files are missing from the repo |
| Tests, lint, CI | None (git repo exists, remote on GitHub) |

`vite build` succeeds. `tsc --noEmit` fails (AdminPanel only).

## Bugs and problems found

### Correctness / data
| # | Severity | Finding | Where |
|---|---|---|---|
| B1 | High | **Macro coverage is 7%.** Outlets 76/922, **NC 0/237**, mess 14/106. Every other item shows "Macro estimate unavailable". This is the headline feature and it is mostly empty. | macros.json |
| B2 | High | **Macros ignore portion and size.** One base entry is reused for every variant. There are 41 items with "(Double)", "(6 pcs)", "Half/Full" in the name. "Omlet Pav (Double)" gets the same numbers as a single one. Totals can't be trusted for estimates. | macros.json, `getMacro` |
| B3 | High | **Macro source is misleading.** Figures come from generic HealthifyMe values ("not measured at BPGC"). They are fine as a seed, but there is no range or confidence shown. A single-number "≈182 kcal" looks more precise than it is. | `macroLine` |
| B4 | Med | **Cart only covers price, not macros.** There is no daily or meal total for kcal/P/C/F, which is the most useful thing a macro app can do. | App.tsx cart |
| B5 | Med | **Mess items can't be added to a plate or cart.** Only likes and macros exist there. | App.tsx mess tab |
| B6 | Med | **Diet filter drops 93 "unknown" items.** Choosing Veg hides anything unclassified, and tags are inferred from names. The caveat is shown, but the filter silently excludes real veg items. | diet.json, `filtered` |
| B7 | Med | **Theme colours conflict.** style.css defines `:root` twice (green/olive, then mauve `#655A7C / #AB92BF / #FDF1E2`) and `body.dark` twice (green, then `#352928`). The later blocks win by cascade order, and the dead green rules are still shipped. Dark text `#D8C7DE` on `#352928` and muted `#655A7C` on cream need a contrast check. | style.css |
| B8 | Med | **Cart total is repeated in every category header** ("Cart ₹X" in each section). It is noise, and it is the whole-outlet total, not the category's. | App.tsx |
| B9 | Med | **State resets surprise the user.** Switching outlet or night canteen wipes the cart (`setCombo({})`) with no warning. Switching tabs keeps stale cart items but hides the bar. | App.tsx |
| B10 | Low | Night canteen hours are hard-coded in JSX. Mess times are hard-coded. Nothing shows "open now / closed". | App.tsx |
| B11 | Low | 27 duplicate item names within an outlet (Foodking "Plain", "Masala", "Paneer" …). They are distinguished only by category, so search results are ambiguous. | menu.json |
| B12 | Low | Two mess slots are `******` ("Not listed"). That is correct, but the user sees role text with no date or "updated" stamp. Menu freshness is unknown. | menu.json |
| B13 | Low | Item IDs are positional (`o3-c2-i14`). Reordering or inserting an item in menu.json **silently re-points all likes and macros** to the wrong items. | `itemId`, diet.json, macros.json |

### Engineering
| # | Severity | Finding |
|---|---|---|
| E1 | High | **App.tsx is 1 very long file with ~90 lines of minified-style JSX.** It is hard to read, review or test. No components (MessTab, OutletTab, Cart, Filters, HeartButton are all inline). |
| E2 | High | **1.6 MB JS bundle (1.04 MB gzip)**, with about 1.25 MB of base64 map images inside TS modules. There is no code-splitting, so the map is loaded even for people who only want a menu. |
| E3 | Med | AdminPanel.tsx fails `tsc` (macro tuple cast, nullable kcal) and is not reachable. Either finish it or delete it. It also contains a real admin email and a fake "no database" warning. |
| E4 | Med | `manifest.webmanifest`, `sw.js`, `apple-touch-icon.png` are referenced by index.html and main.tsx but are not in the repo. Most likely they live only in the Vercel deploy. Rebuilding from this repo gives 404s and no PWA. |
| E5 | Med | `hearts.ts`: after every like it refetches **all** counts (`heart_counts`). The cost grows with the number of items. The session-refresh code is also duplicated. The anonymous-sign-up path has no CAPTCHA, so it can be abused (the SQL file says so itself). |
| E6 | Med | `heart_counts` is a full `GROUP BY` on every call, with no cache and no limit. Fine for now, costly at scale. |
| E7 | Low | Audio is created per click (`new AudioContext` each time). Sound defaults on, which is unexpected on campus. A cord-pull lamp, clink sounds and a custom theme toggle add a lot of code for little value. |
| E8 | Low | `React.PointerEvent` and `import React` are used with the new JSX transform (harmless). `key={cap}` with numeric/mixed tuple types is loosely typed. No ESLint, no Prettier. |
| E9 | Low | Supabase publishable key is in source. That is OK by design (RLS protects it), but rotate it if abuse appears. No service-role key was found. |
| E10 | Low | No analytics or error reporting, so there is no way to know what people actually use. |
| E11 | Low | No CI. (Correction: the folder *is* a git repo with a GitHub remote; the first audit missed it.) GitHub is not connected to Vercel. |

### Accessibility / UX
- Icon-only controls (cart `▤`, `⌃`) are used as glyphs, not SVG. Tap targets in the cart and like button are likely under 44 px.
- Text sizes of 11 px and letter-spaced uppercase labels are used widely. They are hard to read on phones.
- Search only covers one outlet at a time. There is no global search ("where can I get a paneer roll?").
- The map needs a tap, then fullscreen, then a second tap on a pin. It is slow to reach "where is this outlet?".
- The hero in the CSS (`.hero`) is unused, which shows leftover design debt.

## Done in this audit
- [x] Read all source, data and SQL
- [x] Typecheck and build verified
- [x] Data-integrity scripts (coverage, dangling refs, duplicate IDs). No dangling macro refs and no duplicate IDs were found; SQL seeds all 1,265 IDs.
- [x] plan.md written

## Progress — v2 redesign (branch `redesign`, 2026-10-01)

**Fixed**
- B1: macro estimates now cover **1,264 of 1,265 items** (the one left out, "Vinayak Food NC", is not a food). Estimates come from a rule-based engine over ~200 reference foods. Fewer than 5% are category-only guesses.
- B2: modifiers, pieces, double, half/full, ml and big/small are applied; mess curries use a smaller katori.
- B3: every estimate shows a kcal range, a confidence level and a "How we estimated this" panel.
- B4, B5, B9: the cart is now a Plate. It accepts mess, outlet and NC items; shows price plus kcal/P/C/F; has a portion and quantity per line; persists across tabs; supports log, share and undo.
- B6: the diet filter no longer hides items silently. Unknown tags are inferred where safe; the rest show as "unsure", with a hidden-count note.
- B7: there is one token-based theme in the brand palette (light and dark), with the dead green rules removed.
- B8: the repeated per-category cart total is gone.
- B10: there is a central hours table and open/closed pills, and "Serving now" for the mess.
- B11: search is global and shows place and category.
- B13: item IDs are frozen into menu.json, so likes and macros no longer depend on position.
- E1: App.tsx is split into `src/lib` and `src/components`.
- E2: map images are real files (webp) and the Map tab is lazy-loaded. JS dropped from 1.04 MB to about 115 KB gzipped.
- E3: the admin preview is moved to `attic/` and excluded, so `tsc` is clean.
- E4: added the manifest, icons and a service worker (offline menu).
- E5: liking is optimistic and updates a single count, with no full refetch. Session code is deduplicated.
- E7: the lamp cord, clink sound and per-click AudioContext are removed.
- E8: added ESLint, strict TS with no unused code, and Vitest (14 tests).

**Still open**
- Phase 3 work: a real admin tool, a "report wrong price/macro" table, Turnstile/rate limits on anonymous sign-ups, analytics/Sentry, CI, and connecting GitHub to Vercel.
- Outlet hours other than Relish and the NCs are unverified.
- Macro values are estimates. Weighing a few popular items would raise confidence.
