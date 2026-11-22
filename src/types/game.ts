export type GameStage = 'TITLE' | 'MENU' | 'KITCHEN' | 'CHAI' | 'DASTARKHWAN';

export type HeatLevel = 'band' | 'dheemi' | 'darmiyani' | 'tez';

export type CookwareType = 'tawa' | 'karahi' | 'handi';

export type DishId =
  | 'anda-half-fry'
  | 'anda-full-fry'
  | 'masala-omelette'
  | 'lahori-channay'
  | 'halwa-poori'
  | 'bong-paye';

export type ChaiId = 'doodh-patti' | 'karak-chai' | 'ilaichi-chai' | 'kashmiri-chai';

export type FamilyMemberId = 'Dadi' | 'Abbu' | 'Ammi' | 'Chotu';

export interface IngredientSpec {
  id: string;
  label: string;
  urduHint: string;
  category: 'fat' | 'base' | 'spice' | 'bread' | 'garnish';
  color: string;
  accentColor: string;
}

export interface NashtaRecipe {
  id: DishId;
  title: string;
  urduSubtitle: string;
  description: string;
  cookware: CookwareType;
  cookwareLabel: string;
  idealHeat: HeatLevel;
  requiresMix: boolean;
  requiresFlip: boolean;
  mixLabel: string;
  flipLabel: string;
  ingredients: IngredientSpec[];
  garnish: IngredientSpec;
  targetCookMin: number;
  targetCookMax: number;
  unlockStickerId: string;
  signatureColor: string;
}

export interface ChaiRecipe {
  id: ChaiId;
  title: string;
  urduSubtitle: string;
  description: string;
  usesWater: boolean;
  requiresColdShock: boolean;
  requiresIlaichi: boolean;
  targetPattiScoops: number;
  targetCheeniScoops: number;
  pattiLabel: string;
  liquidColorStart: string;
  liquidColorFinish: string;
  garnishLabel: string;
}

export interface KitchenState {
  addedIngredients: string[];
  isMixed: boolean;
  isFlipped: boolean;
  garnishAdded: boolean;
  cookProgress: number; // 0 - 100
  burnLevel: number; // 0 - 100
  heatLevel: HeatLevel;
  isPlated: boolean;
}

export interface ChaiState {
  selectedChaiId: ChaiId | null;
  addedBaseItems: string[]; // e.g., 'milk', 'water', 'ilaichi', 'soda'
  pattiScoops: number;
  cheeniScoops: number;
  pinkShockTriggered: boolean;
  boilLevel: number; // 0 - 100
  boilSaved: boolean;
  boilOverOccurred: boolean;
  phaintiCount: number; // 0 - 5
  garnishAdded: boolean;
  chaiProgress: number; // 0 - 100
  heatLevel: HeatLevel;
  isPoured: boolean;
}

export interface FamilyCraving {
  requester: FamilyMemberId;
  dishId: DishId;
  chaiId: ChaiId;
  headline: string;
  romanUrduNote: string;
  englishMeaning: string;
  cookingTip: string;
  source: 'gemini' | 'local';
}

export interface FamilyReaction {
  speaker: FamilyMemberId;
  mood: 'delighted' | 'impressed' | 'playful' | 'gentle';
  romanUrdu: string;
  english: string;
}

export interface DastarkhwanVerdict {
  reactions: FamilyReaction[];
  chefTitle: string;
  summaryNote: string;
  source: 'gemini' | 'local';
}

export interface StickerSpec {
  id: string;
  title: string;
  urduName: string;
  region: string;
  story: string;
  tiltDeg: number;
  unlockHint: string;
}

export interface ScoreBreakdown {
  dishCraft: number;
  chaiMastery: number;
  boilSaveAndPhainti: number;
  naniGarnish: number;
  hospitalityExtras: number;
  cravingBonus: number;
  total: number;
  stars: number;
}
