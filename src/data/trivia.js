const TRIVIA_QUESTIONS = [
  {
    question: "What is the name of the world in Genshin Impact?",
    answers: ["teyvat"],
    reward: 55
  },
  {
    question: "How many elements exist in Genshin Impact?",
    answers: ["seven", "7"],
    reward: 50
  },
  {
    question: "What organization governs Mondstadt?",
    answers: ["knights of favonius"],
    reward: 55
  },
  {
    question: "What is Mondstadt's ideal?",
    answers: ["freedom"],
    reward: 50
  },
  {
    question: "What is Liyue's ideal?",
    answers: ["contracts"],
    reward: 50
  },
  {
    question: "What is Inazuma's ideal?",
    answers: ["eternity"],
    reward: 50
  },
  {
    question: "What is Sumeru known as?",
    answers: ["nation of wisdom"],
    reward: 55
  },
  {
    question: "What is Fontaine's ideal?",
    answers: ["justice"],
    reward: 50
  },
  {
    question: "What is Natlan's ideal?",
    answers: ["war"],
    reward: 50
  },
  {
    question: "What is the starting region of Genshin Impact?",
    answers: ["mondstadt"],
    reward: 50
  },
  {
    question: "What is Liyue's main city called?",
    answers: ["liyue harbor"],
    reward: 55
  },
  {
    question: "What is Inazuma's main city called?",
    answers: ["inazuma city"],
    reward: 55
  },
  {
    question: "What is Fontaine's capital called?",
    answers: ["court of fontaine"],
    reward: 55
  },
  {
    question: "How many main nations are in Teyvat?",
    answers: ["seven", "7"],
    reward: 50
  },
  {
    question: "Which region is associated with Hydro?",
    answers: ["fontaine"],
    reward: 50
  },
  {
    question: "Which region is associated with Pyro?",
    answers: ["natlan"],
    reward: 50
  },
  {
    question: "Which region is associated with Cryo?",
    answers: ["snezhnaya"],
    reward: 50
  },
  {
    question: "Which region is associated with Dendro?",
    answers: ["sumeru"],
    reward: 50
  },
  {
    question: "What type of game is Genshin Impact?",
    answers: ["open-world action rpg", "action rpg"],
    reward: 55
  },
  {
    question: "How many players can play together in co-op?",
    answers: ["up to 4", "4", "4 players"],
    reward: 50
  },
  {
    question: "What system is used to obtain characters?",
    answers: ["gacha system", "gacha"],
    reward: 50
  },
  {
    question: "What allows characters to use elemental powers?",
    answers: ["visions", "vision"],
    reward: 50
  },
  {
    question: "Which character can switch elements?",
    answers: ["traveler", "the traveler"],
    reward: 55
  },
  {
    question: "What enhances characters using duplicates?",
    answers: ["constellations", "constellation"],
    reward: 50
  },
  {
    question: "What are daily missions called?",
    answers: ["commissions", "daily commissions"],
    reward: 50
  },
  {
    question: "What is resin used for?",
    answers: ["claiming rewards"],
    reward: 50
  },
  {
    question: "What is the Spiral Abyss?",
    answers: ["endgame combat challenge"],
    reward: 55
  },
  {
    question: "What is the reaction between Pyro and Hydro?",
    answers: ["vaporize"],
    reward: 55
  },
  {
    question: "What is the reaction between Cryo and Hydro?",
    answers: ["freeze"],
    reward: 55
  },
  {
    question: "What is the reaction between Electro and Hydro?",
    answers: ["electro-charged", "electro charged"],
    reward: 55
  },
  {
    question: "What is the reaction between Pyro and Cryo?",
    answers: ["melt"],
    reward: 55
  },
  {
    question: "What is the reaction between Dendro and Electro?",
    answers: ["quicken"],
    reward: 55
  },
  {
    question: "What is the reaction between Dendro and Hydro?",
    answers: ["bloom"],
    reward: 55
  },
  {
    question: "What do Geo reactions mainly produce?",
    answers: ["shields", "shield"],
    reward: 50
  },
  {
    question: "What effect does Anemo primarily cause?",
    answers: ["swirl"],
    reward: 50
  },
  {
    question: "Which element does not create transformative reactions?",
    answers: ["geo"],
    reward: 55
  },
  {
    question: "What stat boosts reaction damage?",
    answers: ["elemental mastery"],
    reward: 55
  },
  {
    question: "Who is the Anemo Archon?",
    answers: ["barbatos"],
    reward: 60
  },
  {
    question: "Who is the Geo Archon?",
    answers: ["morax", "zhongli"],
    reward: 60
  },
  {
    question: "Who is the Electro Archon?",
    answers: ["beelzebul", "raiden ei", "ei"],
    reward: 60
  },
  {
    question: "Who is the Dendro Archon?",
    answers: ["buer", "nahida"],
    reward: 60
  },
  {
    question: "Who is the Hydro Archon?",
    answers: ["focalors", "furina"],
    reward: 60
  },
  {
    question: "Who is the Cryo Archon?",
    answers: ["tsaritsa", "the tsaritsa"],
    reward: 60
  },
  {
    question: "Who leads Liyue?",
    answers: ["liyue qixing", "qixing"],
    reward: 55
  },
  {
    question: "Who leads Sumeru academically?",
    answers: ["akademiya", "the akademiya"],
    reward: 55
  },
  {
    question: "What organization is from Snezhnaya?",
    answers: ["fatui", "the fatui"],
    reward: 55
  },
  {
    question: "Who serves the Tsaritsa?",
    answers: ["fatui harbingers", "harbingers"],
    reward: 55
  },
  {
    question: "What is Adventure Rank?",
    answers: ["player progression level"],
    reward: 50
  },
  {
    question: "What are Ley Line Outcrops?",
    answers: ["resource challenges"],
    reward: 50
  },
  {
    question: "What are domains?",
    answers: ["dungeon-like challenges", "dungeon challenges"],
    reward: 50
  },
  {
    question: "What is a weekly boss?",
    answers: ["boss with weekly rewards"],
    reward: 50
  },
  {
    question: "What are artifacts used for?",
    answers: ["stat bonuses", "stats"],
    reward: 50
  },
  {
    question: "What is the highest artifact rarity?",
    answers: ["5-star", "5 star"],
    reward: 50
  },
  {
    question: "What is the highest weapon rarity?",
    answers: ["5-star", "5 star"],
    reward: 50
  },
  {
    question: "What is used to upgrade talents?",
    answers: ["talent books", "books"],
    reward: 50
  },
  {
    question: "What increases a character's level cap?",
    answers: ["ascension"],
    reward: 50
  },
  {
    question: "What unlocks higher world difficulty?",
    answers: ["world level"],
    reward: 50
  },
  {
    question: "What reveals the map?",
    answers: ["statues of the seven", "statue of the seven"],
    reward: 50
  },
  {
    question: "What restores health at statues?",
    answers: ["statue healing"],
    reward: 50
  },
  {
    question: "What are teleport points called?",
    answers: ["waypoints", "waypoint"],
    reward: 50
  },
  {
    question: "What are oculi used for?",
    answers: ["upgrading statues", "upgrade statues"],
    reward: 50
  },
  {
    question: "What is gliding used for?",
    answers: ["air travel"],
    reward: 50
  },
  {
    question: "What resource is used to sprint?",
    answers: ["stamina"],
    reward: 50
  },
  {
    question: "What happens if stamina runs out while swimming?",
    answers: ["character drowns", "drowns", "you drown"],
    reward: 55
  },
  {
    question: "What are Seelies?",
    answers: ["guiding spirits", "spirits"],
    reward: 50
  },
  {
    question: "What are chests used for?",
    answers: ["rewards", "loot"],
    reward: 50
  },
  {
    question: "What type of world is Teyvat?",
    answers: ["open-world", "open world"],
    reward: 50
  },
  {
    question: "When was Genshin Impact released?",
    answers: ["2020"],
    reward: 55
  },
  {
    question: "Who developed Genshin Impact?",
    answers: ["mihoyo", "mihoyo"],
    reward: 55
  },
  {
    question: "Is Genshin Impact free-to-play?",
    answers: ["yes", "y"],
    reward: 45
  },
  {
    question: "Does Genshin Impact require internet?",
    answers: ["yes", "y"],
    reward: 45
  },
  {
    question: "What is the main story called?",
    answers: ["archon quest", "archon quests"],
    reward: 50
  },
  {
    question: "What are character-specific quests called?",
    answers: ["story quests", "story quest"],
    reward: 50
  },
  {
    question: "What are limited-time quests called?",
    answers: ["event quests", "event quest"],
    reward: 50
  },
  {
    question: "What is the premium currency?",
    answers: ["primogems", "primogem"],
    reward: 50
  },
  {
    question: "What is the pity system?",
    answers: ["guaranteed reward mechanic"],
    reward: 55
  },
  {
    question: "What destroyed a civilization 500 years ago?",
    answers: ["a calamity", "calamity"],
    reward: 60
  },
  {
    question: "What is Khaenri'ah?",
    answers: ["a fallen civilization", "fallen civilization"],
    reward: 60
  },
  {
    question: "What is Celestia?",
    answers: ["realm of gods"],
    reward: 60
  },
  {
    question: "What are Archons?",
    answers: ["elemental gods", "gods"],
    reward: 55
  },
  {
    question: "What do visions grant?",
    answers: ["elemental abilities", "elemental powers"],
    reward: 55
  },
  {
    question: "What are delusions?",
    answers: ["artificial visions"],
    reward: 55
  },
  {
    question: "What is the Abyss Order?",
    answers: ["antagonist faction"],
    reward: 55
  },
  {
    question: "Who are Descenders?",
    answers: ["beings from outside teyvat"],
    reward: 60
  },
  {
    question: "What is elemental resonance?",
    answers: ["team buff effect"],
    reward: 55
  },
  {
    question: "What defines team synergy?",
    answers: ["elemental reactions"],
    reward: 55
  },
  {
    question: "Approximately how many playable characters exist?",
    answers: ["80+", "80 plus"],
    reward: 60
  },
  {
    question: "What determines character scaling?",
    answers: ["stats like atk and hp"],
    reward: 55
  },
  {
    question: "What heavily boosts builds?",
    answers: ["artifacts", "artifact"],
    reward: 55
  },
  {
    question: "What is energy recharge used for?",
    answers: ["faster bursts"],
    reward: 55
  },
  {
    question: "What is an elemental burst?",
    answers: ["ultimate ability", "ultimate"],
    reward: 55
  },
  {
    question: "What is an elemental skill?",
    answers: ["basic elemental ability"],
    reward: 55
  },
  {
    question: "What is co-op mode limited to?",
    answers: ["4 players", "4", "up to 4"],
    reward: 50
  },
  {
    question: "What enables fast travel?",
    answers: ["waypoints", "waypoint"],
    reward: 50
  },
  {
    question: "What tracks quests?",
    answers: ["quest log", "quest journal"],
    reward: 50
  },
  {
    question: "What is the Traveler's main goal?",
    answers: ["find their sibling", "find sibling"],
    reward: 60
  }
];

function getRandomTrivia() {
  const idx = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
  return TRIVIA_QUESTIONS[idx];
}

module.exports = {
  TRIVIA_QUESTIONS,
  getRandomTrivia
};
