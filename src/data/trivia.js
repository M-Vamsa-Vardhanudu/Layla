const TRIVIA_QUESTIONS = [
  {
    category: "lore",
    question: "What is the name of the world in Genshin Impact?",
    answers: ["teyvat"],
    options: ["avalon", "teyvat", "hyrule", "eldoria"],
    reward: 160
  },
  {
    category: "regions",
    question: "Which nation is known as the City of Freedom?",
    answers: ["mondstadt"],
    options: ["liyue", "inazuma", "mondstadt", "sumeru"],
    reward: 160
  },
  {
    category: "regions",
    question: "Which region is inspired by Japan?",
    answers: ["inazuma"],
    options: ["liyue", "fontaine", "inazuma", "sumeru"],
    reward: 160
  },
  {
    category: "regions",
    question: "Which nation follows the ideal of Justice?",
    answers: ["fontaine"],
    options: ["natlan", "fontaine", "sumeru", "mondstadt"],
    reward: 160
  },
  {
    category: "elements",
    question: "Which element is associated with Zhongli?",
    answers: ["geo"],
    options: ["anemo", "geo", "cryo", "hydro"],
    reward: 160
  },
  {
    category: "elements",
    question: "Which element does Nahida use?",
    answers: ["dendro"],
    options: ["electro", "dendro", "hydro", "pyro"],
    reward: 160
  },
  {
    category: "combat",
    question: "What reaction occurs between Pyro and Cryo?",
    answers: ["melt"],
    options: ["freeze", "overload", "melt", "swirl"],
    reward: 160
  },
  {
    category: "combat",
    question: "What reaction occurs between Electro and Pyro?",
    answers: ["overload"],
    options: ["overload", "melt", "freeze", "bloom"],
    reward: 160
  },
  {
    category: "combat",
    question: "What reaction occurs between Hydro and Cryo?",
    answers: ["freeze"],
    options: ["freeze", "vaporize", "swirl", "quicken"],
    reward: 160
  },
  {
    category: "systems",
    question: "What currency is used to perform wishes?",
    answers: ["primogems", "primogem"],
    options: ["mora", "resin", "primogems", "genesis crystals"],
    reward: 160
  },
  {
    category: "systems",
    question: "What is the maximum rarity of characters?",
    answers: ["5-star", "5 star"],
    options: ["3-star", "4-star", "5-star", "6-star"],
    reward: 160
  },
  {
    category: "systems",
    question: "What system guarantees a high-rarity pull after many wishes?",
    answers: ["pity system"],
    options: ["luck system", "pity system", "boost system", "drop system"],
    reward: 160
  },
  {
    category: "gameplay",
    question: "What resource is consumed to claim boss rewards?",
    answers: ["resin"],
    options: ["stamina", "resin", "mora", "energy"],
    reward: 160
  },
  {
    category: "gameplay",
    question: "What are the teleport locations called?",
    answers: ["waypoints", "waypoint"],
    options: ["anchors", "portals", "waypoints", "shrines"],
    reward: 160
  },
  {
    category: "gameplay",
    question: "What is the name of daily tasks in the game?",
    answers: ["commissions", "daily commissions"],
    options: ["missions", "orders", "commissions", "quests"],
    reward: 160
  },
  {
    category: "characters",
    question: "Who is the Electro Archon?",
    answers: ["raiden shogun", "ei"],
    options: ["venti", "zhongli", "raiden shogun", "nahida"],
    reward: 160
  },
  {
    category: "characters",
    question: "Who is known as the Darknight Hero?",
    answers: ["diluc"],
    options: ["kaeya", "diluc", "childe", "albedo"],
    reward: 160
  },
  {
    category: "characters",
    question: "Who is the Dendro Archon?",
    answers: ["nahida"],
    options: ["furina", "nahida", "ei", "venti"],
    reward: 160
  },
  {
    category: "lore",
    question: "What is the name of the mysterious floating companion?",
    answers: ["paimon"],
    options: ["lumine", "paimon", "dainsleif", "fischl"],
    reward: 160
  },
  {
    category: "lore",
    question: "What is Khaenri'ah known as?",
    answers: ["a fallen civilization"],
    options: ["a hidden island", "a fallen civilization", "a weapon", "a kingdom of gods"],
    reward: 160
  }
];

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function getRandomTrivia() {
  const q = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];

  return {
    ...q,
    options: shuffleArray([...q.options])
  };
}

module.exports = {
  TRIVIA_QUESTIONS,
  getRandomTrivia
};