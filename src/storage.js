const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function loadUsers() {
  ensureStorage();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function saveUsers(users) {
  ensureStorage();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

function getDefaultProfile() {
  return {
    primogems: 160,
    level: 1,
    exp: 0,
    guaranteedFeatured5: false,
    pity5: 0,
    pity4: 0,
    wishes: 0,
    inventory: {
      fiveStar: {},
      fourStar: {},
      threeStar: {}
    },
    activeTrivia: null,
    lastTriviaAt: 0,
    lastActivityAt: 0
  };
}

function hydrateProfile(profile) {
  const defaults = getDefaultProfile();

  profile.primogems ??= defaults.primogems;
  profile.level ??= defaults.level;
  profile.exp ??= defaults.exp;
  profile.guaranteedFeatured5 ??= defaults.guaranteedFeatured5;
  profile.pity5 ??= defaults.pity5;
  profile.pity4 ??= defaults.pity4;
  profile.wishes ??= defaults.wishes;
  profile.activeTrivia ??= defaults.activeTrivia;
  profile.lastTriviaAt ??= defaults.lastTriviaAt;
  profile.lastActivityAt ??= defaults.lastActivityAt;

  profile.inventory ??= defaults.inventory;
  profile.inventory.fiveStar ??= {};
  profile.inventory.fourStar ??= {};
  profile.inventory.threeStar ??= {};

  return profile;
}

function getProfile(users, userId) {
  if (!users[userId]) {
    users[userId] = getDefaultProfile();
  }
  return hydrateProfile(users[userId]);
}

module.exports = {
  loadUsers,
  saveUsers,
  getProfile
};
