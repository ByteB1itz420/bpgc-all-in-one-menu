import {FOODS, MODS, type Food, type FoodKey, type ModKey, type PCF} from './foods';

export type Confidence = 'good'|'fair'|'rough';
export type Estimate = {
  kcal: number; p: number; c: number; f: number;
  /** Plausible kcal range for this serving. */
  lo: number; hi: number;
  conf: Confidence;
  key: FoodKey;
  food: string;
  serving: string;
  /** Human-readable adjustments, e.g. "+ cheese", "× 2 pieces". */
  notes: string[];
};
export type Macros = {kcal: number; p: number; c: number; f: number};

export const RANGE: Record<Confidence, number> = {good: 0.12, fair: 0.22, rough: 0.35};
export const kcalOf = ([p, c, f]: PCF) => 4 * p + 4 * c + 9 * f;

const SPELLING: [RegExp, string][] = [
  [/\bomlett?e?s?\b|\bomelete\b|\bomelet\b|\bomlette\b/g, 'omelette'],
  [/\bmaggie\b/g, 'maggi'],
  [/\bpanner\b|\bpaneeer\b/g, 'paneer'],
  [/\bchilly\b/g, 'chilli'],
  [/\bs?c?hezwan\b|\bsezwan\b|\bsezwhan\b|\bscz\b|\bshezwan\b/g, 'schezwan'],
  [/\bnoddles?\b/g, 'noodles'],
  [/\bchichen\b/g, 'chicken'],
  [/\bs\/w\b/g, 'sandwich'],
  [/\butthappam\b|\buthappam\b|\buttapa\b|\buttappam\b/g, 'uttapam'],
  [/\bpartha\b/g, 'paratha'],
  [/\bkulchha\b/g, 'kulcha'],
  [/\bnan\b/g, 'naan'],
  [/\bbhurjee\b/g, 'bhurji'],
  [/\balu\b/g, 'aloo'],
  [/\bwada\b/g, 'vada'],
  [/\bsambhar\b/g, 'sambar'],
  [/\bmilksake\b/g, 'milkshake'],
  [/\bmousambl\b|\bmousambi\b|\bmosambi\b/g, 'mosambi'],
  [/\bstawraberry\b/g, 'strawberry'],
  [/\bcholcolate\b/g, 'chocolate'],
  [/\bpattice\b|\bpatties\b/g, 'patty'],
  [/\bpics\b/g, 'pcs'],
  [/\bbhendi\b/g, 'bhindi'],
  [/\bkhichhidi\b|\bkhichadi\b/g, 'khichdi'],
  [/\bmakhni\b/g, 'makhani'],
  [/\bgobhi\b/g, 'gobi'],
  [/\bseek\b/g, 'seekh'],
  [/\bkabab\b/g, 'kebab'],
  [/\btripple\b/g, 'triple'],
  [/\bhongkong\b/g, 'hong kong'],
  [/\bpatato\b/g, 'potato'],
  [/\bmayonese\b|\bmayonnaise\b/g, 'mayo'],
  [/\bchowmin\b/g, 'chowmein'],
  [/\bcheezy\b/g, 'cheese'],
  [/\bchhole\b/g, 'chole'],
  [/\bbundi\b/g, 'boondi'],
  [/\bpakode\b|\bpakora\b/g, 'pakoda'],
  [/\bkit kat\b/g, 'kitkat'],
  [/\bwater melon\b/g, 'watermelon'],
  [/\bdoughnuts?\b/g, 'donut'],
  [/\bcafereal\b/g, 'cafreal'],
];

export const normalize = (s: string) => {
  let t = ' ' + s.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ') + ' ';
  for (const [re, to] of SPELLING) t = t.replace(re, to);
  return t.replace(/\s+/g, ' ').trim();
};

type Rule = [re: RegExp, key: FoodKey|null, cat?: RegExp];
// First match wins, so specific rules come before generic ones. `null` marks a non-food line.
const RULES: Rule[] = [
  [/vinayak food nc/, null],
  // Extras sold alone
  [/^extra ghee/, 'extra_ghee'],
  [/^(extra )?butter( \(extra\))?$|^extra butter/, 'extra_butter'],
  [/^(extra )?(grated |slice )?cheese( \(extra\))?( \/ butter)?$|^extra cheese/, 'extra_cheese'],
  [/^mayo$/, 'extra_mayo'],
  // Desserts and bakery
  [/thick shake|(oreo|kitkat|munch|black forest|nutella|brownie).*shake/, 'thick_shake'],
  [/shake/, 'milkshake'],
  [/(kitkat|cookie|munch|hazelnut|caramel|chocolate|honey|irish) frappe/, 'premium_frappe'],
  [/frappe/, 'frappe'],
  [/bread ?\+ ?butter ?\+ ?jam|bread butter jam/, 'bread_butter_jam'],
  [/bread butter/, 'bread_butter'],
  [/gadbad|sundae/, 'ice_cream'],
  [/brownie/, 'brownie'],
  [/\bdonut/, 'donut'],
  [/pastry/, 'pastry'],
  [/muffin/, 'muffin'],
  [/mousse/, 'mousse'],
  [/cookie|nankhatai/, 'cookies'],
  [/khari/, 'khari'],
  [/mini pancake/, 'mini_pancakes'],
  [/(nutella|biscoff|chocolate|hazelnut|matcha).*pancake/, 'choc_pancake'],
  [/pancake/, 'pancake'],
  [/waffle/, 'waffle'],
  [/doracake/, 'doracake'],
  [/gulab jamun/, 'gulab_jamun'],
  [/laddoo|balushahi/, 'laddoo'],
  [/halwa/, 'halwa'],
  [/kheer/, 'kheer'],
  [/malai sandwich/, 'malai_sandwich'],
  [/shahi tukda/, 'shahi_tukda'],
  [/custard/, 'custard'],
  [/choco bite/, 'choco_bite'],
  [/^fruit$/, 'fruit'],
  // Drinks
  [/mango lassi/, 'mango_lassi'],
  [/salted lassi/, 'salt_lassi'],
  [/\blassi/, 'lassi'],
  [/buttermilk|chaas/, 'buttermilk'],
          [/cold chocolate/, 'milkshake'],
  [/cold coffee/, 'cold_coffee'],
  [/cold (bournvita|boost|horlicks)/, 'cold_malt'],
  [/rose milk/, 'rose_milk'],
  [/bournvita|boost|horlicks/, 'malt_drink'],
  [/^(hot )?badam/, 'badam_milk'],
  [/hot chocolate/, 'hot_chocolate'],
  [/hot (&|and) cold milk|hot milk|^milk$/, 'milk'],
  [/(irish|caramel|hazel ?nut) cappuccino/, 'flavoured_cappuccino'],
  [/cappuccino/, 'cappuccino'],
  [/matcha/, 'matcha'],
  [/latte/, 'latte'],
  [/espresso|americano/, 'espresso'],
  [/black (coffee|tea)|lemon tea/, 'black_tea'],
  [/green tea/, 'green_tea'],
  [/ice(d)? tea/, 'iced_tea'],
  [/masala tea|special tea|ginger tea/, 'masala_tea'],
  [/special coffee/, 'coffee'],
  [/\btea\b/, 'tea'],
  [/coke float/, 'coke_float'],
  [/mojito|cooler|blue lagoon|litchi blast/, 'mojito'],
  // Soups (before chicken, noodles and lemon rules)
  [/thukpa|noodles? soup/, 'noodle_soup'],
  [/cream of/, 'cream_soup'],
  [/tomato soup/, 'tomato_soup'],
  [/(chicken).*(soup|manchow|hot (&|and|n) sour|lemon coriander)/, 'chicken_soup'],
  [/(mutton).*(soup|manchow|hot (&|and|n) sour|lemon coriander)/, 'mutton_soup'],
  [/(prawns?).*(soup|manchow|hot (&|and|n) sour|lemon coriander)/, 'prawn_soup'],
  [/soup|manchow|hot (&|and|n) sour|lemon coriander|limon coriander|^veg clear$|^sweet corn$/, 'soup'],
  [/rasam/, 'rasam'],
  [/\bcoffee\b/, 'coffee'],
  // Pizza, pasta, bakes
  [/chicken.*pizza/, 'chicken_pizza'],
  [/plain cheese pizza/, 'cheese_pizza'],
  [/pizza/, 'pizza'],
  [/white sauce|oregano cheese pasta/, 'pasta_white'],
  [/pasta|penne|spaghetti|arabiata|red sauce/, 'pasta_red'],
  [/garlic bread/, 'garlic_bread'],
  // Street snacks
  [/medu vada/, 'medu_vada'],
  [/vada pav|butter cheese vada/, 'vada_pav'],
  [/batata vada/, 'batata_vada'],
  [/samosa pav/, 'samosa_pav'],
  [/samosa/, 'samosa'],
  [/dabeli/, 'dabeli'],
  [/pav bhaji/, 'pav_bhaji'],
  [/misal/, 'misal_pav'],
  [/puri bhaji/, 'puri_bhaji'],
  [/chole bhature/, 'chole_bhature'],
  [/chole kulcha/, 'chole_kulcha'],
  [/^bhature$|bhatura/, 'bhature'],
  [/dahi (sev )?puri/, 'dahi_puri'],
  [/pani puri/, 'pani_puri'],
  [/sev puri/, 'sev_puri'],
  [/bhel/, 'bhel'],
  [/dahi kachori/, 'dahi_kachori'],
  [/mirchi bhaj/, 'mirchi_bhajji'],
  [/bread pakoda/, 'bread_pakoda'],
  [/paneer pakoda/, 'paneer_65'],
  [/pakoda/, 'pakoda'],
  [/cutlet/, 'veg_cutlet'],
  [/bread roll/, 'bread_roll'],
  [/tikki burger/, 'tikki_burger'],
  [/aloo tikki/, 'aloo_tikki'],
  [/masala idli/, 'masala_idli'],
  [/idli/, 'idli'],
  [/upma/, 'upma'],
  [/poha/, 'poha'],
  [/sweet ?corn/, 'sweet_corn'],
  [/(chicken.*(loaded|fries))|chips loaded/, 'loaded_fries'],
  [/loaded/, 'loaded_fries'],
  [/fries|french fry/, 'fries'],
  [/momos?\b/, 'momos'],
  // Subs (Sub Spot), before puffs so "Chicken Patty" sub is a sub
  [/chicken salad/, 'chicken_salad'],
  [/\bsubs?\b.*club|club.*\bsubs?\b/, 'club_sub'],
  [/salad.*\bsubs?\b/, 'veg_sub_salad'],
  [/(chicken).*\bsubs?\b/, 'chicken_sub'],
  [/(paneer).*\bsubs?\b/, 'paneer_sub'],
  [/(aloo).*\bsubs?\b/, 'aloo_sub'],
  [/\bsubs?\b/, 'sub'],
  [/puff|\bpatty\b/, 'puff'],
  // Wraps, burgers, sandwiches
  [/alfham/, 'alfaham'],
  [/(mix|meat).*shawarma/, 'mix_shawarma'],
  [/(paneer|mushroom).*shawarma/, 'veg_shawarma'],
  [/shawarma/, 'shawarma'],
  [/zinger/, 'zinger'],
  [/chicken.*burger/, 'chicken_burger'],
  [/burger/, 'burger'],
  [/chicken.*(roll|frankie|kathi)/, 'chicken_roll'],
  [/paneer.*(roll|frankie|kathi)/, 'paneer_roll'],
  [/egg.*(roll|frankie|kathi)/, 'egg_roll'],
  [/roll|frankie|kathi/, 'roll'],
  [/club.*sandwich|sandwich.*club/, 'club_sandwich'],
  [/chicken.*(sandwich|toast)/, 'chicken_sandwich'],
  [/paneer.*sandwich/, 'paneer_sandwich'],
  [/corn.*sandwich/, 'corn_sandwich'],
  [/mushroom.*sandwich/, 'mushroom_sandwich'],
  [/(egg|omelette).*sandwich/, 'egg_sandwich'],
  [/chutney sandwich|cheese chutney/, 'chutney_sandwich'],
  [/cheese.*(grill|sandwich)|grill.*cheese/, 'cheese_grill_sandwich'],
  [/grill/, 'grill_sandwich'],
  [/sandwich/, 'sandwich'],
  // Eggs
  [/bread omelette/, 'bread_omelette'],
  [/omelette pav|(half|full) fry pav|palti pav/, 'omelette_pav'],
  [/bhurji pav/, 'bhurji_pav'],
  [/(egg|anda) bhurji/, 'egg_bhurji'],
  [/egg curry/, 'egg_curry'],
  [/egg (masala|lababdar|kadai|sukka|handi)/, 'egg_masala'],
  [/egg (chilli|65|salt|china|malaysian|dragon)/, 'egg_chilli'],
  [/omelette/, 'omelette'],
  [/boiled egg/, 'boiled_egg'],
  [/half fry|full fry|fried egg|jungly/, 'half_fry'],
  // Dosa
  [/podi masala dosa/, 'set_dosa_masala'],
  [/rava/, 'rava_dosa'],
  [/dosa/, 'dosa'],
  [/uttapam/, 'uttapam'],
  // Breads
  [/kerala paratha/, 'kerala_paratha'],
  [/aloo.*paratha/, 'aloo_paratha'],
  [/paneer.*paratha/, 'paneer_paratha'],
  [/(gobi|onion|pyaaz|mix|mint|methi).*paratha/, 'stuffed_paratha'],
  [/paratha/, 'paratha'],
  [/chapati|phulka/, 'chapati'],
  [/roti/, 'roti'],
  [/naan/, 'naan'],
  [/kulcha/, 'kulcha'],
      [/^pav$/, 'pav'],
  [/\bpuri\b/, 'puri'],
  // Maggi and Indo-Chinese
  [/korean maggi/, 'korean_maggi'],
  [/maggi/, 'maggi'],
  [/triple/, 'triple_rice'],
  [/volcano/, 'volcano_rice'],
  [/chop ?suey/, 'chopsuey'],
  [/biryani rice/, 'pulao'],
  [/chicken.*biryani/, 'chicken_biryani'],
  [/mutton.*biryani/, 'mutton_biryani'],
  [/prawns?.*biryani/, 'prawn_biryani'],
  [/fish.*biryani/, 'fish_biryani'],
  [/egg.*biryani/, 'egg_biryani'],
  [/paneer.*biryani/, 'paneer_biryani'],
  [/mushroom.*biryani/, 'mushroom_biryani'],
  [/biryani/, 'biryani'],
  [/fried rice|schezwan rice|hong kong rice/, 'fried_rice'],
  [/noodles?|chowmein|hakka/, 'noodles'],
  [/chicken 65/, 'chicken_65'],
  [/chicken.*(chilli|manchurian)/, 'chilli_chicken'],
  [/lollipop/, 'lollipop'],
  [/strips/, 'strips'],
  [/wings/, 'wings'],
  [/chicken (tawa|dry|salt|china|malaysian|crispy|dragon|garlic|cafreal)/, 'chicken_dry'],
  [/paneer (65|cafreal)/, 'paneer_65'],
  [/paneer (chilli|manchurian|schezwan|garlic|cheese garlic)|chilli paneer/, 'chilli_paneer'],
  [/tofu/, 'tofu'],
  [/baby ?corn/, 'babycorn'],
  [/mushroom (manchurian|chilli|65)/, 'mushroom_starter'],
  [/manchurian/, 'manchurian'],
  [/(gobi|veg) (chilli|65|crispy)|veg crispy/, 'veg_crispy'],
  [/prawns?/, 'prawn_starter', /starter/i],
  [/fish (tawa|cafreal)/, 'fish_fry'],
  [/potato/, 'honey_potato'],
  // Rice
  [/chicken pulao/, 'chicken_pulao'],
  [/pulao/, 'pulao'],
  [/khichdi/, 'khichdi'],
  [/curd rice/, 'curd_rice'],
  [/ghee rice/, 'ghee_rice'],
  [/jeera rice/, 'jeera_rice'],
  [/\brice\b/, 'rice'],
  // Curries and tandoor
  [/butter chicken|chicken butter|chicken makhan/, 'butter_chicken'],
  [/paneer tikka masala/, 'paneer_gravy'],
  [/tikka masala/, 'chicken_gravy'],
  [/(methi malai|korma|badami|pistawala|lababdar|mughlai|maharaja|mumtaz|laziz|lazeez).*chicken|chicken (korma|badami|pistawala|lababdar|mughlai|maharaja|mumtaz|laziz|lazeez)/, 'rich_chicken'],
  [/paneer.*tikka|tikka.*paneer/, 'paneer_tikka'],
  [/chicken tikka|chicken (achari|kalimiri|pahadi|malai) (tikka|kebab)/, 'chicken_tikka'],
  [/tandoori/, 'tandoori'],
  [/veg seekh/, 'veg_seekh'],
  [/seekh/, 'seekh'],
  [/aloo.*tikka|tikka.*aloo/, 'aloo_tikka'],
  [/fish (tikka|hariyali|kalimari|kalimiri)/, 'fish_tikka'],
  [/kebab/, 'kebab'],
  [/dal gosht|mutton/, 'mutton_gravy'],
  [/prawns?/, 'prawn_gravy'],
  [/\bfish\b/, 'fish_curry'],
  [/chicken/, 'chicken_gravy'],
  [/dal makhani/, 'dal_makhani'],
  [/\bdal\b/, 'dal'],
  [/palak paneer/, 'palak_paneer'],
  [/paneer bhurji|^bhurji$/, 'paneer_bhurji'],
  [/kaju/, 'kaju_curry'],
  [/kofta/, 'malai_kofta'],
  [/paneer/, 'paneer_gravy'],
  [/egg/, 'egg_masala'],
  [/lauki/, 'sabzi'],
  [/chole|chana/, 'chole'],
  [/rajma/, 'rajma'],
  [/soya/, 'soya'],
  [/methi mat+ar/, 'methi_matar'],
  [/mushroom/, 'mushroom_gravy'],
  [/korma/, 'veg_korma'],
  [/bhindi/, 'bhindi'],
  [/vegetable|veg (kadai|kolhapuri|hyderabadi|handi|jal ?frezi)|mix veg masala/, 'veg_gravy'],
  [/dum aloo|aloo (mat+ar|kadai|handi)|aloo gravy/, 'aloo_gravy'],
  [/aloo|beans|gobi|baingan|tawa veg|mix veg|methi/, 'sabzi'],
  // Salads and sides
  [/sprout/, 'sprout_salad'],
  [/macaroni/, 'macaroni_salad'],
  [/mexican salad/, 'mexican_salad'],
  [/millet salad/, 'millet_salad'],
  [/chicken salad/, 'chicken_salad'],
  [/salad/, 'salad'],
  [/boondi raita/, 'boondi_raita'],
  [/raita/, 'raita'],
  [/curd|\bdahi\b/, 'curd'],
  [/pickle/, 'pickle'],
  [/masala papad/, 'masala_papad'],
  [/fried papad/, 'fried_papad'],
  [/papad/, 'papad'],
  [/fryums/, 'fryums'],
  [/thecha/, 'thecha'],
  [/chutney|ketchup/, 'chutney'],
  [/croutons/, 'croutons'],
  [/cornflakes/, 'cornflakes'],
  [/sirka onion|^onion$|^lemon$/, 'onion_lemon'],
  [/farsaan|farsan|\bsev\b/, 'farsan'],
  [/sambar/, 'sambar'],
  [/lime|lemon/, 'lime'],
  [/juice|mosambi|orange|pineapple|watermelon|grape|mixed fruit|sitafal|chikoo|chiku/, 'juice'],
];

// When the name alone doesn't say what the dish is, the category often does.
const CATEGORY_FALLBACK: [RegExp, FoodKey][] = [
  [/shake/, 'milkshake'], [/juice/, 'juice'], [/mojito|cooler/, 'mojito'], [/beverage|coffee|tea/, 'tea'],
  [/rava/, 'rava_dosa'], [/dosa/, 'dosa'], [/uttapam/, 'uttapam'], [/paratha/, 'paratha'], [/maggi/, 'maggi'],
  [/burger/, 'burger'], [/sandwich/, 'sandwich'], [/frank|roll/, 'roll'], [/omelette/, 'omelette'],
  [/pizza/, 'pizza'], [/pasta|pazzta/, 'pasta_red'], [/noodle/, 'noodles'], [/biryani/, 'biryani'], [/rice/, 'fried_rice'],
  [/soup/, 'soup'], [/starter/, 'veg_crispy'], [/main course|indian/, 'veg_gravy'], [/tandoor/, 'kebab'],
  [/bread/, 'naan'], [/shawarma/, 'shawarma'], [/salad/, 'salad'], [/dessert|bakery|pastr/, 'pastry'],
  [/momo/, 'momos'], [/chinese/, 'fried_rice'], [/chaat/, 'pani_puri'], [/egg/, 'omelette'], [/snack|bite/, 'puff'],
];

// Categories that act as a noun for short names ("Masala" under "Dosa" = masala dosa).
const TYPED_CATEGORY = /dosa|uttapam|paratha|maggi|burger|omelette|sandwich|frank|shake|juice|beverage|cooler|subs|milk|tea|coffee/;

const words = (s: string) => s.replace(/\([^)]*\)/g, ' ').replace(/\d+/g, ' ').trim().split(/\s+/).filter(Boolean).length;

type Match = {key: FoodKey|null; phase: 'name'|'combined'|'category'};
function findRule(text: string, category: string): Match['key']|undefined {
  for (const [re, key, cat] of RULES) if (re.test(text) && (!cat || cat.test(category))) return key;
  return undefined;
}
export function match(name: string, category = ''): Match|undefined {
  const n = normalize(name), c = normalize(category), both = `${n} ${c}`;
  // Use the category as the noun unless the name already names the dish type.
  const noun = c.match(TYPED_CATEGORY)?.[0];
  const typed = !!noun && !/[,&]/.test(c) && (words(n) <= 2 || !n.includes(noun.slice(0, 4)));
  const first = typed ? both : n;
  let key = findRule(first, c);
  if (key !== undefined) return {key, phase: typed ? 'combined' : 'name'};
  key = findRule(both, c);
  if (key !== undefined) return {key, phase: 'combined'};
  for (const [re, k] of CATEGORY_FALLBACK) if (re.test(c)) return {key: k, phase: 'category'};
  return undefined;
}

const MOD_WORDS: [ModKey, RegExp][] = [
  ['cheese', /chees/], ['butter', /\bbutter\b(?! ?scotch)/], ['ghee', /\bghee\b/], ['egg', /\begg\b|\banda\b|omelette/],
  ['paneer', /paneer/], ['chicken', /chicken/], ['mutton', /mutton|\bmeat\b/], ['prawns', /prawn/], ['fish', /\bfish\b/],
  ['mushroom', /mushroom/], ['corn', /\bcorn\b/], ['veg', /\bveg\b/], ['schezwan', /schezwan/], ['fried', /\bfried\b/],
  ['masala', /masala/], ['spring', /spring/], ['mysore', /mysore/], ['podi', /podi/], ['onion', /onion/],
  ['tomato', /tomato/], ['noodle', /noodle/], ['boba', /with boba/],
];
// Mods that only apply when a food opts in via `mods`, because the word means something else elsewhere.
const OPT_IN = new Set<ModKey>(['veg', 'fried', 'masala', 'spring', 'mysore', 'podi', 'onion', 'tomato', 'noodle']);
const NO_MODS = new Set(['drink', 'dessert', 'extra', 'side', 'salad']);

const round = (n: number) => Math.round(n);
const addTo = (a: PCF, b: PCF, k = 1): PCF => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export function estimate(name: string, category = '', opts: {mess?: boolean} = {}): Estimate|null {
  // Mess combos: "Sambar + Chutney" is both; "Paneer Lazeez / Bhurji" is either (first shown).
  if (opts.mess && /\s(\/|or)\s/.test(name)) return estimate(name.split(/\s(?:\/|or)\s/)[0], category, opts);
  if (opts.mess && name.includes('+') && !/bread ?\+ ?butter ?\+ ?jam/i.test(name)) {
    const parts = [...new Set(name.split('+').map(s => s.trim()).filter(Boolean))].map(s => estimate(s, category, opts)).filter((x): x is Estimate => !!x)
      .filter((e, i, all) => all.findIndex(o => o.key === e.key) === i);
    if (!parts.length) return null;
    return combine(parts, name);
  }
  const m = match(name, category);
  if (!m || !m.key) return null;
  const food: Food = FOODS[m.key];
  const n = normalize(name), ctx = `${n} ${normalize(category)}`;
  let pcf: PCF = [...food.pcf];
  const notes: string[] = [];
  let mods = 0;

  if (!NO_MODS.has(food.kind) || food.kind === 'drink') {
    for (const [mod, re] of MOD_WORDS) {
      if (!re.test(n) || food.has?.includes(mod)) continue;
      if (food.kind === 'drink' && mod !== 'boba') continue;
      if (NO_MODS.has(food.kind) && food.kind !== 'drink') continue;
      if (mod === 'masala' && /double masala|masala.?ae.?magic/.test(n)) continue;
      const add = food.mods?.[mod] ?? (OPT_IN.has(mod) ? undefined : MODS[mod]);
      if (!add || kcalOf(add) === 0) continue;
      pcf = addTo(pcf, add);
      notes.push(`+ ${mod === 'noodle' ? 'noodles' : mod}`);
      mods++;
    }
    if (/\bmix\b/.test(n) && (food.kind === 'noodles' || food.kind === 'rice')) {
      pcf = addTo(addTo(pcf, MODS.chicken), MODS.egg);
      notes.push('+ chicken & egg (mixed)');
      mods++;
    }
  }

  let mul = 1;
  const count = ctx.match(/(\d+)\s*\(?\s*(?:pcs|pc|pieces|nos|eggs?)\b/);
  if (count && food.pieces) {
    const k = Number(count[1]) / food.pieces;
    if (k !== 1) { mul *= k; notes.push(`× ${count[1]} ${food.kind === 'egg' ? 'eggs' : 'pieces'}`); }
  }
  if (/\bdouble\b/.test(n) && !/double masala/.test(n)) {
    if (food.double?.add) { pcf = addTo(pcf, food.double.add); notes.push('double (extra egg)'); }
    else { const k = food.double?.mul ?? 1.6; mul *= k; notes.push(`double (× ${k})`); }
    mods++;
  }
  if (/\(full\)/.test(n)) { mul *= 1.9; notes.push('full portion (× 1.9)'); }
  if (/\(big\)|\bbig\b/.test(n)) { mul *= 1.5; notes.push('big (× 1.5)'); }
  if (/\blarge\b/.test(n)) { mul *= 1.35; notes.push('large (× 1.35)'); }
  if (/\bsmall\b/.test(n)) { mul *= 0.7; notes.push('small (× 0.7)'); }
  if (/\bpaper\b/.test(n)) { mul *= 1.2; notes.push('paper dosa (× 1.2)'); }
  const ml = ctx.match(/(\d+)\s*ml\b/);
  if (ml && food.ml) {
    const k = Number(ml[1]) / food.ml;
    if (Math.abs(k - 1) > 0.05) { mul *= k; notes.push(`${ml[1]} ml serving`); }
  }
  let serving = food.serving;
  if (opts.mess) {
    const k = food.kind === 'gravy' || food.kind === 'dal' || food.kind === 'sabzi' ? 0.6 : food.kind === 'rice' || food.kind === 'biryani' ? 0.75 : 1;
    if (k !== 1) { mul *= k; serving = food.kind === 'rice' || food.kind === 'biryani' ? '1 mess serving (≈150 g)' : '1 mess katori (≈150 g)'; }
  }

  pcf = [pcf[0] * mul, pcf[1] * mul, pcf[2] * mul];
  let conf: Confidence = m.phase === 'category' ? 'rough' : food.conf ?? 'good';
  if (conf === 'good' && (mods >= 2 || opts.mess || mul > 1.7 || mul < 0.6)) conf = 'fair';
  return finish(pcf, conf, m.key, food.label, serving, notes);
}

function finish(pcf: PCF, conf: Confidence, key: FoodKey, food: string, serving: string, notes: string[]): Estimate {
  const kcal = kcalOf(pcf), r = RANGE[conf];
  const step = kcal >= 100 ? 10 : 5;
  return {
    kcal: round(kcal), p: round(pcf[0]), c: round(pcf[1]), f: round(pcf[2]),
    lo: Math.floor(kcal * (1 - r) / step) * step, hi: Math.ceil(kcal * (1 + r) / step) * step,
    conf, key, food, serving, notes,
  };
}

const rank: Confidence[] = ['good', 'fair', 'rough'];
function combine(parts: Estimate[], name: string): Estimate {
  const pcf = parts.reduce<PCF>((a, e) => addTo(a, [e.p, e.c, e.f]), [0, 0, 0]);
  const worst = parts.reduce((w, e) => (rank.indexOf(e.conf) > rank.indexOf(w) ? e.conf : w), 'good' as Confidence);
  return finish(pcf, worst === 'good' ? 'fair' : worst, parts[0].key, name, parts.map(e => e.serving).join(' + '), parts.map(e => e.food));
}

/** Macros for a quantity and portion multiplier. */
export const scale = (e: Pick<Macros, 'kcal'|'p'|'c'|'f'>, k: number): Macros => ({kcal: e.kcal * k, p: e.p * k, c: e.c * k, f: e.f * k});
export const sum = (xs: Macros[]): Macros => xs.reduce((a, x) => ({kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f}), {kcal: 0, p: 0, c: 0, f: 0});
