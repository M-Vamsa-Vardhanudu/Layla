const TRIVIA_QUESTIONS = [
  {
    question: "What is the name of the nation ruled by the Anemo Archon?",
    answers: ["mondstadt"],
    reward: 60
  },
  {
    question: "Which element does Hu Tao use?",
    answers: ["pyro"],
    reward: 50
  },
  {
    question: "What is Paimon often called by the Traveler?",
    answers: ["emergency food"],
    reward: 80
  },
  {
    question: "Which region is associated with the Electro element?",
    answers: ["inazuma"],
    reward: 60
  },
  {
    question: "Who is the Hydro Archon in Fontaine?",
    answers: ["furina"],
    reward: 70
  },
  {
    question: "What is the max original resin cap in Genshin Impact?",
    answers: ["160"],
    reward: 70
  },
  {
    question: "Which weapon type does Xiao use?",
    answers: ["polearm", "spear"],
    reward: 55
  },
  {
    question: "What is the in-game currency used for wishing?",
    answers: ["primogems", "primogem"],
    reward: 40
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
