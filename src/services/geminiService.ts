import {
  ChaiId,
  DastarkhwanVerdict,
  DishId,
  FamilyCraving,
  FamilyMemberId,
} from '../types/game';

const VALID_DISH_IDS: DishId[] = [
  'anda-half-fry',
  'anda-full-fry',
  'masala-omelette',
  'lahori-channay',
  'halwa-poori',
  'bong-paye',
];

const VALID_CHAI_IDS: ChaiId[] = [
  'doodh-patti',
  'karak-chai',
  'ilaichi-chai',
  'kashmiri-chai',
];

const VALID_MEMBERS: FamilyMemberId[] = ['Dadi', 'Abbu', 'Ammi', 'Chotu'];

const FALLBACK_CRAVINGS: FamilyCraving[] = [
  {
    requester: 'Dadi',
    dishId: 'halwa-poori',
    chaiId: 'ilaichi-chai',
    headline: 'Itwaar Morning at Bhati Gate',
    romanUrduNote: 'Subah ki thandi hawa chal rahi hai, garma garam Halwa Poori aur Ilaichi Chai ho jaye!',
    englishMeaning: 'The cool morning breeze is blowing—let us have piping hot Halwa Poori and Ilaichi Chai!',
    cookingTip: 'Watch the brass karahi closely so your poori puffs like a golden balloon!',
    source: 'local',
  },
  {
    requester: 'Abbu',
    dishId: 'lahori-channay',
    chaiId: 'karak-chai',
    headline: 'Gawalmandi Craving',
    romanUrduNote: 'Aaj daftar se chhutti hai—kali mirch walay Lahori Channay aur tez Karak Chai mangti hai!',
    englishMeaning: 'Day off today—craving peppery Lahori Channay and bold Karak Chai!',
    cookingTip: 'Give the channay a proper bhunai stir and brew Karak Chai with 3 strong patti chamach.',
    source: 'local',
  },
  {
    requester: 'Chotu',
    dishId: 'anda-half-fry',
    chaiId: 'kashmiri-chai',
    headline: 'Kites Over the Rooftop',
    romanUrduNote: 'Chhat par patang urane se pehle naram zardi Half-Fry aur gulabi Kashmiri Chai chahiye!',
    englishMeaning: 'Before flying kites on the rooftop, I want runny-yolk Half-Fry and rosy Kashmiri Chai!',
    cookingTip: 'Keep Aanch gentle on the Half-Fry and use the cold-water shock to turn Kashmiri Chai pink.',
    source: 'local',
  },
  {
    requester: 'Ammi',
    dishId: 'masala-omelette',
    chaiId: 'doodh-patti',
    headline: 'Golden Light in the Courtyard',
    romanUrduNote: 'Jharokhay se dhoop aa rahi hai—pyaz omelette aur khalis Doodh Patti sab ko pasand aayegi!',
    englishMeaning: 'Morning sun is streaming through the jharokha—everyone will love Pyaz Omelette and pure Doodh Patti!',
    cookingTip: 'Whisk the eggs with pyaz before flipping, and never add water to Doodh Patti.',
    source: 'local',
  },
];

export function getInstantFallbackCraving(seedIndex = 0): FamilyCraving {
  return FALLBACK_CRAVINGS[Math.abs(seedIndex) % FALLBACK_CRAVINGS.length];
}

export async function fetchMorningCraving(seedIndex = 0): Promise<FamilyCraving> {
  const cacheKey = `lahori_craving_v1_${seedIndex % 4}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as FamilyCraving;
      if (VALID_DISH_IDS.includes(parsed.dishId) && VALID_CHAI_IDS.includes(parsed.chaiId)) {
        return parsed;
      }
    }
  } catch {
    // ignore cache error
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);

  try {
    const moods = [
      'Golden Basant breeze over Androon Lahore rooftops',
      'Sunday morning near Badshahi Mosque and Food Street',
      'Cool winter sunshine through carved wooden jharokha',
      'Family gathering on the courtyard charpai',
    ];
    const res = await fetch('/api/gemini/cravings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ morningMood: moods[seedIndex % moods.length] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return getInstantFallbackCraving(seedIndex);
    }
    const data = (await res.json()) as Partial<FamilyCraving>;
    const normalized: FamilyCraving = {
      requester: VALID_MEMBERS.includes(data.requester as FamilyMemberId)
        ? (data.requester as FamilyMemberId)
        : 'Dadi',
      dishId: VALID_DISH_IDS.includes(data.dishId as DishId)
        ? (data.dishId as DishId)
        : FALLBACK_CRAVINGS[seedIndex % FALLBACK_CRAVINGS.length].dishId,
      chaiId: VALID_CHAI_IDS.includes(data.chaiId as ChaiId)
        ? (data.chaiId as ChaiId)
        : FALLBACK_CRAVINGS[seedIndex % FALLBACK_CRAVINGS.length].chaiId,
      headline: data.headline || 'Androon Lahore Morning',
      romanUrduNote:
        data.romanUrduNote || FALLBACK_CRAVINGS[seedIndex % FALLBACK_CRAVINGS.length].romanUrduNote,
      englishMeaning:
        data.englishMeaning || FALLBACK_CRAVINGS[seedIndex % FALLBACK_CRAVINGS.length].englishMeaning,
      cookingTip:
        data.cookingTip || FALLBACK_CRAVINGS[seedIndex % FALLBACK_CRAVINGS.length].cookingTip,
      source: 'gemini',
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(normalized));
    } catch {
      // ignore
    }
    return normalized;
  } catch {
    clearTimeout(timeout);
    return getInstantFallbackCraving(seedIndex);
  }
}

export function buildLocalVerdict(params: {
  dishName: string;
  dishState: string;
  garnishAdded: boolean;
  chaiName: string;
  chaiAccuracy: string;
  boilSaved: boolean;
  phaintiCount: number;
  extrasServed: string[];
  totalScore: number;
}): DastarkhwanVerdict {
  const isBurnt = params.dishState === 'burnt';
  const isUnder = params.dishState === 'undercooked';
  const chefTitle =
    params.totalScore >= 90
      ? 'Ustad-e-Dastarkhwan'
      : params.totalScore >= 75
        ? 'Androon Master Chef'
        : params.totalScore >= 55
          ? 'Shahi Nashta Apprentice'
          : 'Subah Ka Mehmaan Chef';

  const dadiLine = params.garnishAdded
    ? {
        romanUrdu: `Wah beta! Nani ka garnish aur ${params.chaiName} ki phainti ne dil jeet liya!`,
        english: `Bravo! Nani's garnish and that aerated ${params.chaiName} won my heart!`,
        mood: 'delighted' as const,
      }
    : {
        romanUrdu: `Bohat pyaar se banaya hai, bas agli baar Nani ka garnish zaroor dalna!`,
        english: `Made with so much love—just remember Nani's secret garnish next time!`,
        mood: 'gentle' as const,
      };

  const abbuLine = isBurnt
    ? {
        romanUrdu: `${params.dishName} thori zyada karari ho gayi, par ${params.chaiName} zabardast hai!`,
        english: `The ${params.dishName} got a bit extra crispy, but the ${params.chaiName} hits the spot!`,
        mood: 'playful' as const,
      }
    : isUnder
      ? {
          romanUrdu: `Aanch thori aur tez hoti to ${params.dishName} aur mazedar banti, phir bhi shabash!`,
          english: `A touch more heat would make ${params.dishName} even richer, still great effort!`,
          mood: 'gentle' as const,
        }
      : {
          romanUrdu: `Kya baat hai! Garma garam ${params.dishName} bilkul Food Street jaisa zaiqa de raha hai!`,
          english: `Incredible! Piping hot ${params.dishName} tastes straight out of Lahore Food Street!`,
          mood: 'impressed' as const,
        };

  const ammiLine = params.boilSaved
    ? {
        romanUrdu: `Chai ubalne se bacha li! Tumhari aanch pe nazar bilkul ustadon jaisi hai.`,
        english: `You saved the chai from boiling over! Your heat control is just like a pro chef.`,
        mood: 'impressed' as const,
      }
    : {
        romanUrdu: `Dastarkhwan kitna saaf aur pyaara sajaya hai! Roz subah aisa nashta chahiye.`,
        english: `The dastarkhwan looks so neat and inviting! We need this breakfast every morning.`,
        mood: 'delighted' as const,
      };

  const hasAcharOrChutney =
    params.extrasServed.includes('achar') || params.extrasServed.includes('chutney');
  const chotuLine = hasAcharOrChutney
    ? {
        romanUrdu: `Oye hoye! Achar-chutney ke sath to niwala double mazedar ho gaya, aur chai bhi mast!`,
        english: `Woohoo! With achar and chutney every bite is twice as yummy, and the chai rocks!`,
        mood: 'delighted' as const,
      }
    : {
        romanUrdu: `Mera niwala sab se bara! Agli plate aur thora achar bhi idhar bhej dein!`,
        english: `My bite is the biggest! Pass another plate and some tangy achar this way!`,
        mood: 'playful' as const,
      };

  return {
    reactions: [
      { speaker: 'Dadi', ...dadiLine },
      { speaker: 'Abbu', ...abbuLine },
      { speaker: 'Ammi', ...ammiLine },
      { speaker: 'Chotu', ...chotuLine },
    ],
    chefTitle,
    summaryNote: `Your ${params.dishName} and ${params.chaiName} brought the whole Androon Lahore family together around the morning dastarkhwan.`,
    source: 'local',
  };
}

export async function fetchDastarkhwanVerdict(params: {
  dishName: string;
  dishState: string;
  garnishAdded: boolean;
  chaiName: string;
  chaiAccuracy: string;
  boilSaved: boolean;
  phaintiCount: number;
  extrasServed: string[];
  cravingMatched: boolean;
  totalScore: number;
}): Promise<DastarkhwanVerdict> {
  const cacheKey = `lahori_verdict_${params.dishName}_${params.dishState}_${params.chaiName}_${params.garnishAdded}_${params.boilSaved}_${params.extrasServed.join(',')}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as DastarkhwanVerdict;
    }
  } catch {
    // ignore
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('/api/gemini/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return buildLocalVerdict(params);
    }
    const data = (await res.json()) as Partial<DastarkhwanVerdict>;
    if (!Array.isArray(data.reactions) || data.reactions.length < 4) {
      return buildLocalVerdict(params);
    }
    const normalized: DastarkhwanVerdict = {
      reactions: data.reactions.slice(0, 4).map((r, i) => ({
        speaker: VALID_MEMBERS[i] ?? 'Dadi',
        mood:
          r.mood === 'delighted' || r.mood === 'impressed' || r.mood === 'playful' || r.mood === 'gentle'
            ? r.mood
            : 'delighted',
        romanUrdu: String(r.romanUrdu || 'Bohat mazedar nashta hai!'),
        english: String(r.english || 'Such a delicious breakfast!'),
      })),
      chefTitle: String(data.chefTitle || 'Ustad-e-Dastarkhwan'),
      summaryNote: String(
        data.summaryNote || 'The whole family loved sharing your morning breakfast.'
      ),
      source: 'gemini',
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(normalized));
    } catch {
      // ignore
    }
    return normalized;
  } catch {
    clearTimeout(timeout);
    return buildLocalVerdict(params);
  }
}
