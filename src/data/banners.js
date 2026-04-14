const ALL_FIVE_STARS = [
  "Albedo",
  "Alhaitham",
  "Aloy",
  "Arataki Itto",
  "Arlecchino",
  "Baizhu",
  "Chiori",
  "Clorinde",
  "Cyno",
  "Dehya",
  "Diluc",
  "Emilie",
  "Eula",
  "Furina",
  "Ganyu",
  "Hu Tao",
  "Jean",
  "Kaedehara Kazuha",
  "Kamisato Ayaka",
  "Kamisato Ayato",
  "Keqing",
  "Kinich",
  "Klee",
  "Lyney",
  "Mona",
  "Mualani",
  "Nahida",
  "Navia",
  "Neuvillette",
  "Nilou",
  "Qiqi",
  "Raiden Shogun",
  "Sangonomiya Kokomi",
  "Shenhe",
  "Sigewinne",
  "Tartaglia",
  "Tighnari",
  "Traveler",
  "Venti",
  "Wanderer",
  "Wriothesley",
  "Xianyun",
  "Xiao",
  "Yae Miko",
  "Yelan",
  "Yoimiya",
  "Zhongli"
];

const STANDARD_FIVE_STARS = [
  "Qiqi",
  "Diluc",
  "Keqing",
  "Mona",
  "Tighnari"
];

const CHARACTERS = {
  fiveStarFeatured: ALL_FIVE_STARS.filter((name) => !STANDARD_FIVE_STARS.includes(name)),
  fiveStarStandard: [...STANDARD_FIVE_STARS],
  fourStarPool: [
    "Amber",
    "Barbara",
    "Beidou",
    "Bennett",
    "Candace",
    "Charlotte",
    "Chevreuse",
    "Chongyun",
    "Collei",
    "Diona",
    "Dori",
    "Faruzan",
    "Fischl",
    "Freminet",
    "Gaming",
    "Gorou",
    "Kachina",
    "Kaeya",
    "Kaveh",
    "Kirara",
    "Kujou Sara",
    "Kuki Shinobu",
    "Layla",
    "Lisa",
    "Lynette",
    "Mika",
    "Ningguang",
    "Noelle",
    "Razor",
    "Rosaria",
    "Sayu",
    "Sethos",
    "Shikanoin Heizou",
    "Sucrose",
    "Thoma",
    "Xiangling",
    "Xingqiu",
    "Xinyan",
    "Yanfei",
    "Yaoyao",
    "Yun Jin"
  ],
  threeStarWeapons: [
    "Cool Steel",
    "Harbinger of Dawn",
    "Skyrider Sword",
    "Slingshot",
    "Raven Bow",
    "Sharpshooter's Oath",
    "Thrilling Tales of Dragon Slayers",
    "Debate Club",
    "Ferrous Shadow",
    "Bloodtainted Greatsword"
  ]
};

const CHARACTER_ELEMENTS = {
  "Albedo": "GEO",
  "Alhaitham": "DENDRO",
  "Aloy": "CRYO",
  "Arataki Itto": "GEO",
  "Arlecchino": "PYRO",
  "Baizhu": "DENDRO",
  "Chiori": "GEO",
  "Clorinde": "ELECTRO",
  "Cyno": "ELECTRO",
  "Dehya": "PYRO",
  "Diluc": "PYRO",
  "Emilie": "DENDRO",
  "Eula": "CRYO",
  "Furina": "HYDRO",
  "Ganyu": "CRYO",
  "Hu Tao": "PYRO",
  "Jean": "ANEMO",
  "Kaedehara Kazuha": "ANEMO",
  "Kamisato Ayaka": "CRYO",
  "Kamisato Ayato": "HYDRO",
  "Keqing": "ELECTRO",
  "Kinich": "DENDRO",
  "Klee": "PYRO",
  "Lyney": "PYRO",
  "Mona": "HYDRO",
  "Mualani": "HYDRO",
  "Nahida": "DENDRO",
  "Navia": "GEO",
  "Neuvillette": "HYDRO",
  "Nilou": "HYDRO",
  "Qiqi": "CRYO",
  "Raiden Shogun": "ELECTRO",
  "Sangonomiya Kokomi": "HYDRO",
  "Shenhe": "CRYO",
  "Sigewinne": "HYDRO",
  "Tartaglia": "HYDRO",
  "Tighnari": "DENDRO",
  "Traveler": "ANEMO",
  "Venti": "ANEMO",
  "Wanderer": "ANEMO",
  "Wriothesley": "CRYO",
  "Xianyun": "ANEMO",
  "Xiao": "ANEMO",
  "Yae Miko": "ELECTRO",
  "Yelan": "HYDRO",
  "Yoimiya": "PYRO",
  "Zhongli": "GEO",
  "Amber": "PYRO",
  "Barbara": "HYDRO",
  "Beidou": "ELECTRO",
  "Bennett": "PYRO",
  "Candace": "HYDRO",
  "Charlotte": "CRYO",
  "Chevreuse": "PYRO",
  "Chongyun": "CRYO",
  "Collei": "DENDRO",
  "Diona": "CRYO",
  "Dori": "ELECTRO",
  "Faruzan": "ANEMO",
  "Fischl": "ELECTRO",
  "Freminet": "CRYO",
  "Gaming": "PYRO",
  "Gorou": "GEO",
  "Kachina": "GEO",
  "Kaeya": "CRYO",
  "Kaveh": "DENDRO",
  "Kirara": "DENDRO",
  "Kujou Sara": "ELECTRO",
  "Kuki Shinobu": "ELECTRO",
  "Layla": "CRYO",
  "Lisa": "ELECTRO",
  "Lynette": "ANEMO",
  "Mika": "CRYO",
  "Ningguang": "GEO",
  "Noelle": "GEO",
  "Razor": "ELECTRO",
  "Rosaria": "CRYO",
  "Sayu": "ANEMO",
  "Sethos": "ELECTRO",
  "Shikanoin Heizou": "ANEMO",
  "Sucrose": "ANEMO",
  "Thoma": "PYRO",
  "Xiangling": "PYRO",
  "Xingqiu": "HYDRO",
  "Xinyan": "PYRO",
  "Yanfei": "PYRO",
  "Yaoyao": "DENDRO",
  "Yun Jin": "GEO"
};

const DAY_MS = 24 * 60 * 60 * 1000;
const BANNER_ROTATION_DAYS = 3;
const BANNER_ROTATION_MS = BANNER_ROTATION_DAYS * DAY_MS;

function seededIndex(seed, length) {
  if (length <= 0) return 0;
  const value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return value % length;
}

function pickWeeklyFourStars(seed, pool, count) {
  if (pool.length <= count) return [...pool];

  const picked = [];
  const used = new Set();
  let rollingSeed = seed;

  while (picked.length < count) {
    rollingSeed = (Math.imul(rollingSeed, 1664525) + 1013904223) >>> 0;
    const index = rollingSeed % pool.length;
    if (used.has(index)) continue;

    used.add(index);
    picked.push(pool[index]);
  }

  return picked;
}

function getBannerCycleWindow(now = new Date()) {
  const timeMs = now instanceof Date ? now.getTime() : Number(now);
  const cycleIndex = Math.floor(timeMs / BANNER_ROTATION_MS);
  const cycleStart = new Date(cycleIndex * BANNER_ROTATION_MS);
  const cycleEnd = new Date((cycleIndex + 1) * BANNER_ROTATION_MS);

  return {
    cycleIndex,
    cycleStart,
    cycleEnd,
    rotationDays: BANNER_ROTATION_DAYS
  };
}

function getTodayBanner(now = new Date()) {
  const cycle = getBannerCycleWindow(now);

  const featuredFiveStar = CHARACTERS.fiveStarFeatured[
    seededIndex(cycle.cycleIndex, CHARACTERS.fiveStarFeatured.length)
  ];
  const featuredFourStars = pickWeeklyFourStars(
    cycle.cycleIndex ^ 0x27d4eb2d,
    CHARACTERS.fourStarPool,
    3
  );

  return {
    name: `${featuredFiveStar} Featured Banner`,
    featuredFiveStar,
    featuredFourStars,
    resetAt: cycle.cycleEnd,
    startedAt: cycle.cycleStart,
    rotationDays: cycle.rotationDays
  };
}

async function getVotedBanner(votes, bannerHistory) {
  if (!votes || Object.keys(votes).length === 0) {
    const randomChar = CHARACTERS.fiveStarFeatured[Math.floor(Math.random() * CHARACTERS.fiveStarFeatured.length)];
    return { character: randomChar, source: "random" };
  }

  const sortedVotes = Object.entries(votes)
    .filter(([char]) => CHARACTERS.fiveStarFeatured.includes(char))
    .sort((a, b) => b[1] - a[1]);

  if (sortedVotes.length === 0) {
    const randomChar = CHARACTERS.fiveStarFeatured[Math.floor(Math.random() * CHARACTERS.fiveStarFeatured.length)];
    return { character: randomChar, source: "random" };
  }

  const recentChars = new Set(bannerHistory.slice(0, 3).map((h) => h.character));
  
  for (const [character, voteCount] of sortedVotes) {
    if (!recentChars.has(character)) {
      return { character, source: "voted", voteCount };
    }
  }

  const nextBestChar = sortedVotes.find(([char]) => !recentChars.has(char));
  if (nextBestChar) {
    return { character: nextBestChar[0], source: "voted_alternative", voteCount: nextBestChar[1] };
  }

  const randomChar = CHARACTERS.fiveStarFeatured[Math.floor(Math.random() * CHARACTERS.fiveStarFeatured.length)];
  return { character: randomChar, source: "random_rerun_overflow" };
}

module.exports = {
  CHARACTERS,
  CHARACTER_ELEMENTS,
  getTodayBanner,
  getVotedBanner
};
