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

function seededIndex(seed, length) {
  if (length <= 0) return 0;
  const value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return value % length;
}

function mondayStartUtc(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d;
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

function getTodayBanner(now = new Date()) {
  const monday = mondayStartUtc(now);
  const weekKey = Math.floor(monday.getTime() / (7 * 86400000));

  const featuredFiveStar = CHARACTERS.fiveStarFeatured[
    seededIndex(weekKey, CHARACTERS.fiveStarFeatured.length)
  ];
  const featuredFourStars = pickWeeklyFourStars(
    weekKey ^ 0x27d4eb2d,
    CHARACTERS.fourStarPool,
    3
  );

  return {
    name: `${featuredFiveStar} Featured Banner`,
    featuredFiveStar,
    featuredFourStars
  };
}

module.exports = {
  CHARACTERS,
  CHARACTER_ELEMENTS,
  getTodayBanner
};
