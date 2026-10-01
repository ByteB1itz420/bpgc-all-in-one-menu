// Reference nutrition for one serving *as sold on campus*, as protein/carbs/fat in grams.
// kcal is derived (4/4/9) so every entry is internally consistent.
// Values are recipe estimates built from IFCT 2017 (Indian Food Composition Tables) and
// USDA FoodData Central ingredient values, cross-checked against common Indian nutrition
// databases. They are not lab-measured at BPGC.

export type PCF = [p: number, c: number, f: number];
export type Kind = 'snack'|'dosa'|'bread'|'egg'|'sandwich'|'roll'|'burger'|'noodles'|'rice'|'biryani'|'gravy'|'dal'|'sabzi'|'starter'|'tandoor'|'soup'|'drink'|'dessert'|'side'|'salad'|'extra'|'maggi'|'bakery';
export type ModKey = 'cheese'|'butter'|'ghee'|'egg'|'paneer'|'chicken'|'mutton'|'prawns'|'fish'|'mushroom'|'corn'|'veg'|'schezwan'|'fried'|'masala'|'spring'|'mysore'|'podi'|'onion'|'tomato'|'noodle'|'boba'|'mayo';
export type Food = {
  label: string;
  serving: string;
  pcf: PCF;
  kind: Kind;
  /** Ingredients already counted in the base, so name words don't add them twice. */
  has?: ModKey[];
  /** The serving is this many pieces/eggs; "(2 pcs)" in a name scales by n/pieces. */
  pieces?: number;
  /** The serving is this many ml; "(200ml)" scales by ml/this. */
  ml?: number;
  /** Food-specific extra modifiers (e.g. "masala" on a dosa means potato filling). */
  mods?: Partial<Record<ModKey, PCF>>;
  /** What "double" means for this food. Default: ×1.6. */
  double?: {mul?: number; add?: PCF};
  /** Lower when the dish varies a lot between kitchens. */
  conf?: 'good'|'fair';
};

// Common add-ons, per typical campus amount.
export const MODS: Record<ModKey, PCF> = {
  cheese: [4, 1, 5],      // ~20 g processed cheese
  butter: [0, 0, 8],      // ~10 g
  ghee: [0, 0, 10],       // ~10 g
  egg: [6, 1, 5],         // 1 egg
  paneer: [11, 2, 13],    // ~60 g paneer
  chicken: [20, 0, 5],    // ~70 g cooked chicken
  mutton: [16, 0, 10],
  prawns: [16, 0, 1],
  fish: [16, 0, 4],
  mushroom: [2, 3, 2],
  corn: [2, 10, 1],
  veg: [1, 6, 2],
  schezwan: [1, 8, 3],    // ~2 tbsp sauce
  fried: [0, 0, 8],       // extra frying oil
  masala: [0, 0, 0],      // spice only unless the food overrides it
  spring: [4, 24, 8],
  mysore: [1, 5, 3],
  podi: [2, 4, 5],
  onion: [1, 5, 0],
  tomato: [0, 3, 0],
  noodle: [3, 20, 5],
  boba: [0, 36, 1],
  mayo: [0, 1, 10],
};

const potato: PCF = [2, 18, 5];
const dosaMods = {masala: potato, onion: MODS.onion, tomato: MODS.tomato, mysore: MODS.mysore, podi: MODS.podi, spring: MODS.spring, noodle: MODS.noodle};
const F = (label: string, serving: string, pcf: PCF, kind: Kind, extra: Omit<Food, 'label'|'serving'|'pcf'|'kind'> = {}): Food => ({label, serving, pcf, kind, ...extra});

export const FOODS = {
  // Street snacks and breakfast
  vada_pav: F('Vada pav', '1 vada pav', [7, 44, 12], 'snack'),
  batata_vada: F('Batata vada', '1 vada (≈70 g)', [3, 20, 8], 'snack', {pieces: 1}),
  samosa: F('Samosa', '1 samosa (≈80 g)', [4, 28, 13], 'snack', {pieces: 1}),
  samosa_pav: F('Samosa pav', '1 samosa + 1 pav', [7, 46, 14], 'snack'),
  dabeli: F('Dabeli', '1 dabeli', [6, 46, 11], 'snack'),
  pav_bhaji: F('Pav bhaji', '2 pav + bhaji', [11, 62, 18], 'snack'),
  misal_pav: F('Misal pav', '1 plate (misal + 2 pav)', [16, 56, 20], 'snack', {conf: 'fair'}),
  puri_bhaji: F('Puri bhaji', '4 puri + bhaji', [9, 62, 22], 'snack'),
  chole_bhature: F('Chole bhature', '2 bhature + chole', [17, 84, 28], 'snack'),
  chole_kulcha: F('Chole kulcha', '2 kulcha + chole', [15, 68, 12], 'snack'),
  bhature: F('Bhatura', '1 bhatura', [5, 32, 9], 'bread', {pieces: 1}),
  puri: F('Puri', '1 puri', [2, 12, 5], 'bread', {pieces: 1}),
  pani_puri: F('Pani puri', '6 puris', [5, 36, 7], 'snack'),
  sev_puri: F('Sev puri', '1 plate (6 pcs)', [5, 34, 14], 'snack'),
  dahi_puri: F('Dahi puri', '1 plate (6 pcs)', [8, 38, 9], 'snack'),
  bhel: F('Bhel puri', '1 plate', [6, 40, 8], 'snack'),
  dahi_kachori: F('Dahi kachori', '1 plate (2 kachori)', [8, 40, 15], 'snack'),
  mirchi_bhajji: F('Mirchi bhajji', '1 plate (3 pcs)', [5, 28, 16], 'snack'),
  pakoda: F('Onion pakoda', '1 plate (≈100 g)', [6, 30, 17], 'snack'),
  bread_pakoda: F('Bread pakoda', '2 pcs', [9, 44, 18], 'snack', {pieces: 2}),
  veg_cutlet: F('Veg cutlet', '2 pcs', [5, 32, 12], 'snack', {pieces: 2}),
  bread_roll: F('Bread roll', '1 roll', [4, 28, 9], 'snack'),
  aloo_tikki: F('Aloo tikki', '1 plate (2 tikki)', [5, 38, 14], 'snack'),
  medu_vada: F('Medu vada sambar', '2 vada + sambar + chutney', [13, 40, 18], 'snack'),
  idli: F('Idli sambar', '2 idli + sambar + chutney', [9, 48, 3], 'snack'),
  masala_idli: F('Masala idli', '1 plate', [8, 48, 9], 'snack'),
  upma: F('Upma', '1 plate (≈200 g)', [6, 38, 8], 'snack'),
  poha: F('Poha', '1 plate (≈200 g)', [5, 44, 8], 'snack'),
  farsan: F('Farsan / sev', '≈30 g', [4, 14, 10], 'side'),
  sweet_corn: F('Sweet corn cup', '1 cup', [5, 30, 7], 'snack', {has: ['corn']}),
  fries: F('French fries', '1 plate (≈150 g)', [5, 50, 20], 'snack'),
  loaded_fries: F('Loaded fries', '1 plate', [11, 58, 32], 'snack', {has: ['cheese', 'mayo'], conf: 'fair'}),
  garlic_bread: F('Cheese garlic bread', '4 pcs', [14, 50, 20], 'snack', {has: ['cheese', 'butter']}),
  momos: F('Veg momos', '1 plate (6–8 pcs)', [9, 46, 8], 'snack', {mods: {paneer: [6, 0, 6], chicken: [10, 0, 2]}}),
  puff: F('Veg puff', '1 puff', [5, 26, 16], 'bakery', {mods: {egg: [4, 0, 2], paneer: [3, 0, 2], chicken: [6, 0, 2]}}),

  // Dosa family (large campus dosa with sambar and chutney)
  dosa: F('Plain dosa', '1 dosa + sambar + chutney', [8, 45, 10], 'dosa', {mods: {...dosaMods, paneer: [9, 2, 11]}, double: {mul: 1.8}}),
  rava_dosa: F('Rava dosa', '1 dosa + sambar + chutney', [7, 44, 13], 'dosa', {mods: dosaMods}),
  uttapam: F('Uttapam', '1 uttapam + sambar + chutney', [9, 50, 9], 'dosa', {mods: dosaMods}),
  set_dosa_masala: F('Podi masala dosa', '1 dosa + sambar + chutney', [10, 64, 17], 'dosa', {has: ['masala', 'podi']}),

  // Breads
  chapati: F('Chapati', '1 chapati (≈40 g)', [3, 18, 3], 'bread', {pieces: 1}),
  roti: F('Tandoori roti', '1 roti', [4, 24, 1], 'bread', {pieces: 1}),
  naan: F('Naan', '1 naan', [8, 44, 5], 'bread', {pieces: 1}),
  kulcha: F('Kulcha', '1 kulcha', [6, 38, 4], 'bread', {pieces: 1}),
  paratha: F('Plain paratha', '1 paratha', [5, 34, 12], 'bread', {pieces: 1}),
  kerala_paratha: F('Kerala paratha', '1 paratha', [6, 40, 13], 'bread', {pieces: 1}),
  aloo_paratha: F('Aloo paratha', '1 paratha', [6, 40, 11], 'bread', {pieces: 1}),
  paneer_paratha: F('Paneer paratha', '1 paratha', [12, 36, 16], 'bread', {pieces: 1, has: ['paneer']}),
  stuffed_paratha: F('Stuffed paratha', '1 paratha', [5, 36, 10], 'bread', {pieces: 1}),
  pav: F('Pav', '1 pav', [3, 16, 1], 'bread', {pieces: 1}),
  bread_butter: F('Bread butter', '2 slices + butter', [5, 26, 9], 'bread', {has: ['butter']}),
  bread_butter_jam: F('Bread, butter & jam', '2 slices + butter + jam', [5, 38, 9], 'bread', {has: ['butter']}),

  // Eggs (serving = eggs as listed in `pieces`)
  omelette: F('Omelette', '1-egg omelette', [6, 1, 9], 'egg', {pieces: 1, has: ['egg'], double: {mul: 2}}),
  boiled_egg: F('Boiled egg', '1 egg', [6, 1, 5], 'egg', {pieces: 1, has: ['egg']}),
  half_fry: F('Fried egg', '1 egg', [6, 0, 8], 'egg', {pieces: 1, has: ['egg'], double: {mul: 2}}),
  egg_bhurji: F('Egg bhurji', '2 eggs', [13, 5, 18], 'egg', {pieces: 2, has: ['egg']}),
  bhurji_pav: F('Anda bhurji pav', '2-egg bhurji + 2 pav', [16, 40, 20], 'egg', {has: ['egg'], double: {add: [6, 1, 7]}}),
  omelette_pav: F('Omelette pav', '1-egg omelette + 2 pav', [10, 34, 11], 'egg', {has: ['egg'], double: {add: [6, 1, 8]}}),
  bread_omelette: F('Bread omelette', '2-egg omelette + 2 slices', [16, 28, 18], 'egg', {has: ['egg'], double: {add: [6, 1, 8]}}),
  egg_curry: F('Egg curry', '2 eggs in gravy', [14, 10, 22], 'gravy', {has: ['egg']}),

  // Sandwiches, burgers, rolls
  sandwich: F('Veg sandwich', '1 sandwich (3 slices)', [7, 38, 8], 'sandwich', {mods: {masala: [2, 14, 4]}}),
  grill_sandwich: F('Veg grilled sandwich', '1 sandwich', [8, 40, 13], 'sandwich', {mods: {masala: [2, 14, 4]}}),
  cheese_grill_sandwich: F('Cheese grilled sandwich', '1 sandwich', [13, 38, 18], 'sandwich', {has: ['cheese'], mods: {masala: [2, 14, 4]}}),
  chicken_sandwich: F('Chicken grilled sandwich', '1 sandwich', [22, 38, 14], 'sandwich', {has: ['chicken']}),
  club_sandwich: F('Club sandwich', '1 club sandwich', [24, 44, 20], 'sandwich', {has: ['chicken', 'egg', 'mayo']}),
  paneer_sandwich: F('Paneer sandwich', '1 sandwich', [15, 38, 18], 'sandwich', {has: ['paneer']}),
  egg_sandwich: F('Egg sandwich', '1 sandwich', [14, 36, 14], 'sandwich', {has: ['egg']}),
  corn_sandwich: F('Corn cheese sandwich', '1 sandwich', [12, 44, 16], 'sandwich', {has: ['corn', 'cheese']}),
  chutney_sandwich: F('Chutney sandwich', '1 sandwich', [6, 38, 7], 'sandwich'),
  mushroom_sandwich: F('Mushroom sandwich', '1 sandwich', [9, 40, 12], 'sandwich', {has: ['mushroom']}),
  burger: F('Veg burger', '1 burger', [9, 48, 15], 'burger', {has: ['mayo']}),
  chicken_burger: F('Chicken burger', '1 burger', [20, 42, 18], 'burger', {has: ['chicken', 'mayo']}),
  zinger: F('Chicken zinger burger', '1 burger', [22, 46, 24], 'burger', {has: ['chicken', 'mayo']}),
  tikki_burger: F('Aloo tikki burger', '1 burger', [8, 50, 14], 'burger', {has: ['mayo']}),
  roll: F('Veg roll / frankie', '1 roll', [8, 46, 12], 'roll'),
  paneer_roll: F('Paneer roll', '1 roll', [15, 42, 18], 'roll', {has: ['paneer']}),
  chicken_roll: F('Chicken roll', '1 roll', [22, 40, 16], 'roll', {has: ['chicken']}),
  egg_roll: F('Egg roll', '1 roll (1 egg)', [12, 40, 16], 'roll', {has: ['egg'], double: {add: [6, 1, 5]}}),
  shawarma: F('Chicken shawarma', '1 shawarma', [26, 40, 18], 'roll', {has: ['chicken', 'mayo']}),
  veg_shawarma: F('Veg shawarma', '1 shawarma', [10, 42, 14], 'roll', {has: ['mayo'], mods: {paneer: [8, 0, 10]}}),
  mix_shawarma: F('Mixed meat shawarma', '1 shawarma', [30, 40, 22], 'roll', {has: ['chicken', 'mutton', 'mayo']}),
  sub: F('Veg sub (6-inch)', '1 six-inch sub', [11, 52, 10], 'sandwich', {has: ['mayo']}),
  paneer_sub: F('Paneer tikka sub (6-inch)', '1 six-inch sub', [19, 50, 16], 'sandwich', {has: ['paneer', 'mayo']}),
  chicken_sub: F('Chicken sub (6-inch)', '1 six-inch sub', [26, 48, 12], 'sandwich', {has: ['chicken', 'mayo']}),
  club_sub: F('Chicken club sub (6-inch)', '1 six-inch sub', [30, 50, 16], 'sandwich', {has: ['chicken', 'mayo']}),
  aloo_sub: F('Aloo patty sub (6-inch)', '1 six-inch sub', [9, 60, 12], 'sandwich', {has: ['mayo']}),
  pizza: F('Veg pizza (8-inch)', '1 pizza', [24, 82, 24], 'snack', {has: ['cheese'], conf: 'fair'}),
  cheese_pizza: F('Cheese pizza (8-inch)', '1 pizza', [28, 80, 28], 'snack', {has: ['cheese'], conf: 'fair'}),
  chicken_pizza: F('Chicken pizza (8-inch)', '1 pizza', [36, 80, 26], 'snack', {has: ['cheese', 'chicken'], conf: 'fair'}),
  pasta_white: F('White sauce pasta', '1 plate', [15, 66, 24], 'snack', {has: ['cheese'], conf: 'fair'}),
  pasta_red: F('Red sauce pasta', '1 plate', [12, 70, 14], 'snack', {conf: 'fair'}),

  // Maggi and Indo-Chinese
  maggi: F('Maggi', '1 pack, cooked', [7, 44, 13], 'maggi', {mods: {veg: [1, 6, 2], fried: [0, 0, 8], masala: [0, 0, 0]}}),
  korean_maggi: F('Korean-style Maggi', '1 bowl', [9, 60, 18], 'maggi', {conf: 'fair'}),
  noodles: F('Veg hakka noodles', '1 plate', [11, 76, 18], 'noodles', {conf: 'fair'}),
  fried_rice: F('Veg fried rice', '1 plate', [10, 82, 15], 'rice', {conf: 'fair'}),
  triple_rice: F('Triple schezwan rice', '1 plate (rice + noodles + gravy)', [15, 110, 28], 'rice', {has: ['schezwan', 'noodle'], conf: 'fair'}),
  volcano_rice: F('Volcano rice', '1 plate', [14, 95, 25], 'rice', {conf: 'fair'}),
  chopsuey: F('Chop suey', '1 plate', [10, 80, 22], 'noodles', {conf: 'fair'}),
  manchurian: F('Veg manchurian', '1 plate', [7, 36, 20], 'starter', {conf: 'fair'}),
  mushroom_starter: F('Mushroom manchurian / chilli', '1 plate', [7, 24, 18], 'starter', {has: ['mushroom'], conf: 'fair'}),
  babycorn: F('Baby corn chilli / 65', '1 plate', [6, 34, 16], 'starter', {has: ['corn'], conf: 'fair'}),
  chilli_paneer: F('Chilli paneer', '1 plate (6 pcs)', [22, 20, 32], 'starter', {has: ['paneer'], pieces: 6}),
  paneer_65: F('Paneer 65 / pakoda', '1 plate', [20, 24, 34], 'starter', {has: ['paneer'], conf: 'fair'}),
  chilli_chicken: F('Chilli chicken', '1 plate (6 pcs)', [30, 18, 24], 'starter', {has: ['chicken'], pieces: 6}),
  chicken_65: F('Chicken 65', '1 plate', [32, 16, 28], 'starter', {has: ['chicken']}),
  chicken_dry: F('Chicken tawa fry / dry', '1 plate', [36, 10, 24], 'starter', {has: ['chicken'], conf: 'fair'}),
  lollipop: F('Chicken lollipop', '6 pcs', [28, 18, 30], 'starter', {has: ['chicken'], pieces: 6}),
  strips: F('Chicken strips', '5 pcs', [28, 24, 20], 'starter', {has: ['chicken'], pieces: 5}),
  wings: F('Chicken wings', '5 pcs', [26, 10, 26], 'starter', {has: ['chicken'], pieces: 5}),
  honey_potato: F('Honey chilli potato', '1 plate', [5, 62, 24], 'starter'),
  veg_crispy: F('Crispy veg / veg 65', '1 plate', [6, 36, 20], 'starter', {conf: 'fair'}),
  tofu: F('Chilli tofu', '1 plate', [18, 16, 20], 'starter'),
  egg_chilli: F('Egg chilli / 65', '1 plate (3 eggs)', [16, 18, 22], 'starter', {has: ['egg']}),
  prawn_starter: F('Prawn starter', '1 plate', [30, 16, 18], 'starter', {has: ['prawns'], conf: 'fair'}),
  fish_fry: F('Fish tawa fry', '1 plate', [34, 8, 20], 'starter', {has: ['fish'], conf: 'fair'}),

  // Soups
  soup: F('Veg soup', '1 bowl (≈250 ml)', [3, 18, 3], 'soup'),
  cream_soup: F('Cream soup', '1 bowl (≈250 ml)', [5, 18, 14], 'soup'),
  tomato_soup: F('Tomato soup', '1 bowl (≈250 ml)', [3, 20, 5], 'soup'),
  chicken_soup: F('Chicken soup', '1 bowl (≈250 ml)', [12, 12, 5], 'soup', {has: ['chicken']}),
  mutton_soup: F('Mutton soup', '1 bowl (≈250 ml)', [16, 10, 9], 'soup', {has: ['mutton']}),
  prawn_soup: F('Prawn soup', '1 bowl (≈250 ml)', [14, 10, 4], 'soup', {has: ['prawns']}),
  noodle_soup: F('Noodle soup / thukpa', '1 bowl', [8, 40, 6], 'soup', {has: ['noodle']}),
  rasam: F('Rasam', '1 katori', [2, 10, 2], 'soup'),
  sambar: F('Sambar', '1 katori (≈150 g)', [6, 18, 4], 'soup'),

  // Rice and biryani
  rice: F('Steamed rice', '1 plate (≈200 g cooked)', [5, 56, 1], 'rice'),
  jeera_rice: F('Jeera rice', '1 plate', [6, 58, 8], 'rice'),
  ghee_rice: F('Ghee rice', '1 plate', [6, 58, 12], 'rice', {has: ['ghee']}),
  curd_rice: F('Curd rice', '1 plate', [9, 50, 11], 'rice'),
  khichdi: F('Dal khichdi', '1 plate', [13, 58, 10], 'rice'),
  pulao: F('Veg pulao', '1 plate', [8, 62, 12], 'rice'),
  chicken_pulao: F('Chicken pulao', '1 plate', [24, 60, 16], 'rice', {has: ['chicken']}),
  biryani: F('Veg biryani', '1 plate', [11, 76, 17], 'biryani'),
  paneer_biryani: F('Paneer biryani', '1 plate', [20, 74, 24], 'biryani', {has: ['paneer']}),
  egg_biryani: F('Egg biryani', '1 plate (2 eggs)', [20, 74, 22], 'biryani', {has: ['egg']}),
  chicken_biryani: F('Chicken biryani', '1 plate', [30, 74, 22], 'biryani', {has: ['chicken']}),
  mutton_biryani: F('Mutton biryani', '1 plate', [32, 74, 28], 'biryani', {has: ['mutton']}),
  prawn_biryani: F('Prawn biryani', '1 plate', [28, 74, 18], 'biryani', {has: ['prawns']}),
  fish_biryani: F('Fish biryani', '1 plate', [30, 74, 20], 'biryani', {has: ['fish']}),
  mushroom_biryani: F('Mushroom biryani', '1 plate', [12, 76, 17], 'biryani', {has: ['mushroom']}),

  // Dals and curries (restaurant bowl ≈250 g; mess katori is scaled down)
  dal: F('Dal fry / tadka', '1 bowl (≈200 g)', [11, 28, 7], 'dal'),
  dal_makhani: F('Dal makhani', '1 bowl (≈200 g)', [12, 30, 18], 'dal', {has: ['butter']}),
  chole: F('Chole / chana masala', '1 bowl (≈200 g)', [12, 38, 11], 'gravy'),
  rajma: F('Rajma', '1 bowl (≈200 g)', [12, 36, 9], 'gravy'),
  sabzi: F('Dry sabzi', '1 bowl (≈200 g)', [5, 22, 12], 'sabzi', {conf: 'fair'}),
  bhindi: F('Bhindi masala', '1 bowl (≈200 g)', [4, 16, 13], 'sabzi'),
  aloo_gravy: F('Aloo curry', '1 bowl (≈200 g)', [5, 32, 14], 'gravy', {conf: 'fair'}),
  veg_gravy: F('Mixed veg curry', '1 bowl (≈250 g)', [7, 24, 18], 'gravy', {conf: 'fair'}),
  veg_korma: F('Veg korma', '1 bowl (≈250 g)', [8, 26, 24], 'gravy', {conf: 'fair'}),
  malai_kofta: F('Malai kofta', '1 bowl (≈250 g)', [10, 30, 32], 'gravy', {conf: 'fair'}),
  mushroom_gravy: F('Mushroom masala', '1 bowl (≈250 g)', [7, 14, 18], 'gravy', {has: ['mushroom'], conf: 'fair'}),
  soya: F('Soya chunks curry', '1 bowl (≈200 g)', [24, 18, 14], 'gravy'),
  methi_matar: F('Methi matar malai', '1 bowl (≈200 g)', [8, 22, 20], 'gravy', {conf: 'fair'}),
  paneer_gravy: F('Paneer curry', '1 bowl (≈250 g, ~120 g paneer)', [22, 16, 38], 'gravy', {has: ['paneer', 'butter', 'masala'], conf: 'fair'}),
  palak_paneer: F('Palak paneer', '1 bowl (≈250 g)', [20, 14, 30], 'gravy', {has: ['paneer']}),
  paneer_bhurji: F('Paneer bhurji', '1 bowl (≈200 g)', [24, 10, 34], 'gravy', {has: ['paneer']}),
  kaju_curry: F('Kaju curry', '1 bowl (≈250 g)', [16, 30, 44], 'gravy', {has: ['paneer'], conf: 'fair'}),
  chicken_gravy: F('Chicken curry', 'half portion (≈250 g)', [34, 12, 28], 'gravy', {has: ['chicken', 'masala'], conf: 'fair'}),
  butter_chicken: F('Butter chicken', 'half portion (≈250 g)', [34, 14, 36], 'gravy', {has: ['chicken', 'butter', 'masala']}),
  rich_chicken: F('Creamy chicken curry', 'half portion (≈250 g)', [34, 14, 38], 'gravy', {has: ['chicken'], conf: 'fair'}),
  mutton_gravy: F('Mutton curry', '1 portion (≈250 g)', [32, 10, 34], 'gravy', {has: ['mutton', 'masala'], conf: 'fair'}),
  prawn_gravy: F('Prawn curry', '1 portion (≈250 g)', [30, 12, 20], 'gravy', {has: ['prawns'], conf: 'fair'}),
  fish_curry: F('Fish curry', '1 portion (≈250 g)', [32, 10, 24], 'gravy', {has: ['fish'], conf: 'fair'}),
  egg_masala: F('Egg masala', '2 eggs in gravy', [14, 12, 24], 'gravy', {has: ['egg', 'masala']}),

  // Tandoor
  paneer_tikka: F('Paneer tikka', '6 pcs', [24, 10, 30], 'tandoor', {has: ['paneer'], pieces: 6}),
  chicken_tikka: F('Chicken tikka', '6 pcs', [42, 6, 16], 'tandoor', {has: ['chicken'], pieces: 6}),
  tandoori: F('Tandoori chicken', 'half chicken', [55, 5, 24], 'tandoor', {has: ['chicken']}),
  kebab: F('Chicken kebab', '1 plate (6 pcs)', [40, 6, 22], 'tandoor', {has: ['chicken'], conf: 'fair'}),
  seekh: F('Seekh kebab', '1 plate', [30, 8, 26], 'tandoor', {has: ['chicken']}),
  fish_tikka: F('Fish tikka', '1 plate', [40, 6, 16], 'tandoor', {has: ['fish']}),
  aloo_tikka: F('Tandoori aloo', '1 plate', [5, 38, 14], 'tandoor'),
  veg_seekh: F('Veg seekh kebab', '1 plate', [9, 30, 18], 'tandoor'),
  alfaham: F('Alfaham chicken', 'half chicken', [55, 4, 30], 'tandoor', {has: ['chicken']}),

  // Drinks
  tea: F('Tea with milk', '1 cup (≈120 ml)', [2, 10, 2], 'drink', {ml: 120}),
  masala_tea: F('Masala / special tea', '1 cup (≈120 ml)', [2, 12, 3], 'drink', {ml: 120}),
  coffee: F('Coffee with milk', '1 cup (≈120 ml)', [3, 12, 3], 'drink', {ml: 120}),
  black_tea: F('Black / lemon tea (sweetened)', '1 cup', [0, 5, 0], 'drink'),
  green_tea: F('Green tea', '1 cup', [0, 1, 0], 'drink'),
  espresso: F('Espresso / americano', '1 cup', [0, 1, 0], 'drink'),
  cappuccino: F('Cappuccino', '1 cup (≈180 ml)', [6, 12, 6], 'drink', {ml: 180}),
  latte: F('Café latte', '1 cup (≈240 ml)', [8, 15, 8], 'drink', {ml: 240}),
  flavoured_cappuccino: F('Flavoured cappuccino', '1 cup (≈180 ml)', [6, 24, 6], 'drink', {ml: 180}),
  milk: F('Hot milk', '1 glass (≈200 ml)', [7, 14, 7], 'drink', {ml: 200}),
  malt_drink: F('Bournvita / Horlicks / Boost', '1 glass (≈200 ml)', [9, 30, 7], 'drink', {ml: 200}),
  badam_milk: F('Badam milk', '1 glass (≈200 ml)', [8, 30, 11], 'drink', {ml: 200}),
  hot_chocolate: F('Hot chocolate', '1 cup (≈200 ml)', [7, 30, 8], 'drink', {ml: 200}),
  cold_coffee: F('Cold coffee', '1 glass (≈300 ml)', [8, 40, 10], 'drink', {ml: 300}),
  frappe: F('Frappe', '1 glass (≈300 ml)', [7, 52, 13], 'drink', {ml: 300, conf: 'fair'}),
  premium_frappe: F('Loaded frappe', '1 glass (≈300 ml)', [8, 62, 17], 'drink', {ml: 300, conf: 'fair'}),
  cold_malt: F('Cold Bournvita / Horlicks', '1 glass (≈300 ml)', [9, 40, 8], 'drink', {ml: 300}),
  rose_milk: F('Rose milk', '1 glass (≈300 ml)', [8, 38, 8], 'drink', {ml: 300}),
  milkshake: F('Milkshake', '1 glass (≈300 ml)', [9, 52, 10], 'drink', {ml: 300, conf: 'fair'}),
  thick_shake: F('Thick shake', '1 glass (≈350 ml)', [11, 74, 19], 'drink', {ml: 350, conf: 'fair'}),
  lassi: F('Sweet lassi', '1 glass (≈300 ml)', [8, 40, 7], 'drink', {ml: 300}),
  mango_lassi: F('Mango lassi', '1 glass (≈300 ml)', [8, 48, 7], 'drink', {ml: 300}),
  salt_lassi: F('Salted lassi', '1 glass (≈300 ml)', [7, 10, 6], 'drink', {ml: 300}),
  buttermilk: F('Buttermilk', '1 glass (≈200 ml)', [3, 5, 2], 'drink', {ml: 200}),
  juice: F('Fresh fruit juice', '1 glass (≈250 ml)', [1, 28, 0], 'drink', {ml: 250}),
  lime: F('Lime juice / soda (sweetened)', '1 glass (≈250 ml)', [0, 20, 0], 'drink', {ml: 250}),
  iced_tea: F('Iced tea', '1 glass (≈300 ml)', [0, 36, 0], 'drink', {ml: 300}),
  mojito: F('Mojito / cooler (non-alcoholic)', '1 glass (≈300 ml)', [0, 36, 0], 'drink', {ml: 300}),
  coke_float: F('Coke float', '1 glass', [2, 45, 5], 'drink'),
  matcha: F('Iced matcha latte', '1 glass', [7, 28, 7], 'drink', {conf: 'fair'}),

  // Desserts and bakery
  gulab_jamun: F('Gulab jamun', '2 pcs', [4, 46, 12], 'dessert', {pieces: 2}),
  laddoo: F('Laddoo / balushahi', '1 pc', [3, 34, 12], 'dessert', {pieces: 1}),
  halwa: F('Halwa', '1 katori', [7, 40, 18], 'dessert'),
  kheer: F('Kheer', '1 katori', [7, 38, 8], 'dessert'),
  malai_sandwich: F('Malai sandwich', '1 pc', [6, 30, 10], 'dessert'),
  shahi_tukda: F('Shahi tukda', '1 serving', [6, 40, 16], 'dessert'),
  custard: F('Fruit custard', '1 katori', [5, 28, 5], 'dessert'),
  choco_bite: F('Chocolate bite', '1 pc', [2, 18, 7], 'dessert'),
  fruit: F('Seasonal fruit', '1 fruit / bowl', [1, 20, 0], 'dessert'),
  ice_cream: F('Ice-cream sundae', '1 glass', [7, 60, 16], 'dessert', {conf: 'fair'}),
  donut: F('Chocolate donut', '1 donut', [4, 34, 16], 'bakery'),
  brownie: F('Brownie', '1 pc', [4, 42, 18], 'bakery'),
  pastry: F('Pastry', '1 slice', [4, 38, 15], 'bakery'),
  muffin: F('Muffin', '1 muffin', [5, 48, 18], 'bakery'),
  mousse: F('Chocolate mousse', '1 cup', [5, 28, 18], 'bakery'),
  cookies: F('Cookies', '250 g pack', [15, 160, 55], 'bakery'),
  khari: F('Khari', '250 g pack', [20, 140, 75], 'bakery'),
  pancake: F('Pancakes with syrup', '3 pancakes', [9, 72, 14], 'bakery', {conf: 'fair'}),
  choc_pancake: F('Chocolate / Nutella pancakes', '1 serving', [10, 74, 24], 'bakery', {conf: 'fair'}),
  mini_pancakes: F('Mini pancakes', '8 pcs', [8, 56, 14], 'bakery', {pieces: 8, conf: 'fair'}),
  waffle: F('Waffle', '1 waffle', [8, 62, 24], 'bakery', {conf: 'fair'}),
  doracake: F('Dorayaki cake', '1 pc', [6, 48, 15], 'bakery', {conf: 'fair'}),

  // Salads and sides
  salad: F('Green salad', '1 plate', [1, 9, 0], 'salad'),
  sprout_salad: F('Sprout salad', '1 bowl', [9, 24, 2], 'salad'),
  macaroni_salad: F('Macaroni salad', '1 katori', [5, 28, 13], 'salad'),
  mexican_salad: F('Mexican salad', '1 bowl', [7, 30, 8], 'salad'),
  millet_salad: F('Millet salad', '1 bowl', [7, 38, 8], 'salad'),
  chicken_salad: F('Chicken salad', '1 bowl', [26, 12, 12], 'salad', {has: ['chicken']}),
  veg_sub_salad: F('Veg salad bowl', '1 bowl', [6, 20, 9], 'salad'),
  curd: F('Plain curd', '1 katori (≈150 g)', [5, 6, 6], 'side'),
  raita: F('Raita', '1 katori', [5, 10, 6], 'side'),
  boondi_raita: F('Boondi raita', '1 katori', [5, 16, 9], 'side'),
  pickle: F('Pickle', '1 tsp', [0, 1, 2], 'side'),
  papad: F('Roasted papad', '1 papad', [3, 7, 0], 'side'),
  fried_papad: F('Fried papad', '1 papad', [3, 7, 4], 'side'),
  masala_papad: F('Masala papad', '1 papad', [4, 14, 6], 'side'),
  fryums: F('Fryums', '1 handful', [1, 12, 6], 'side'),
  chutney: F('Chutney', '2 tbsp', [1, 4, 3], 'side'),
  thecha: F('Thecha / chutney', '2 tbsp', [1, 4, 5], 'side'),
  onion_lemon: F('Onion & lemon', '1 side', [0, 5, 0], 'side'),
  croutons: F('Croutons', '1 handful', [1, 10, 4], 'side'),
  cornflakes: F('Cornflakes with milk', '30 g + 200 ml milk', [8, 38, 7], 'side'),

  // Extras sold on their own
  extra_cheese: F('Extra cheese', '1 portion (≈20 g)', [4, 1, 5], 'extra', {has: ['cheese']}),
  extra_butter: F('Extra butter', '1 portion (≈10 g)', [0, 0, 8], 'extra', {has: ['butter']}),
  extra_ghee: F('Extra ghee', '1 portion (≈10 g)', [0, 0, 10], 'extra', {has: ['ghee']}),
  extra_mayo: F('Mayonnaise', '1 portion (≈15 g)', [0, 1, 10], 'extra', {has: ['mayo']}),
} satisfies Record<string, Food>;

export type FoodKey = keyof typeof FOODS;
