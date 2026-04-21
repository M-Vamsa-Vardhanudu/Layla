const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

const userProfileSchema = new mongoose.Schema(
  {
    _id: String,
    primogems: { type: Number, default: 160 },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    guaranteedFeatured5: { type: Boolean, default: false },
    pity5: { type: Number, default: 0 },
    pity4: { type: Number, default: 0 },
    wishes: { type: Number, default: 0 },
    inventory: {
      fiveStar: { type: Map, of: Number, default: {} },
      fourStar: { type: Map, of: Number, default: {} },
      threeStar: { type: Map, of: Number, default: {} }
    },
    activeTrivia: { type: Object, default: null },
    lastTriviaAt: { type: Number, default: 0 },
    lastActivityAt: { type: Number, default: 0 },
    lastBannerVoteAt: { type: Number, default: 0 },
    lastWishAt: { type: Number, default: 0 },
    lastClashAt: { type: Number, default: 0 },
    lastHardClashAt: { type: Number, default: 0 },
    preferredClashCharacter: { type: String, default: null }
  },
  { collection: "users", timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

const bannerVotesSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "banner_votes_current" },
    votes: { type: Map, of: Number, default: {} },
    lastReset: { type: Date, default: Date.now }
  },
  { collection: "banner_votes" }
);

const bannerHistorySchema = new mongoose.Schema(
  {
    _id: String,
    date: String,
    featuredCharacter: String,
    featuredFourStars: [String],
    timestamp: { type: Date, default: Date.now }
  },
  { collection: "banner_history" }
);

const BannerVotes = mongoose.model("BannerVotes", bannerVotesSchema);
const BannerHistory = mongoose.model("BannerHistory", bannerHistorySchema);

async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  }
}

async function loadUsers() {
  await connectDatabase();
  const users = await UserProfile.find();
  const usersMap = {};

  users.forEach((doc) => {
    usersMap[doc._id] = doc.toObject();
    delete usersMap[doc._id].__v;
  });

  return usersMap;
}

async function saveUsers(users) {
  await connectDatabase();

  for (const [userId, profile] of Object.entries(users)) {
    await UserProfile.updateOne(
      { _id: userId },
      { $set: profile },
      { upsert: true }
    );
  }
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
    lastActivityAt: 0,
    lastBannerVoteAt: 0,
    lastWishAt: 0,
    lastClashAt: 0,
    lastHardClashAt: 0,
    preferredClashCharacter: null
  };
}

function normalizeInventoryBucket(bucket) {
  if (!bucket) return {};
  if (bucket instanceof Map) return Object.fromEntries(bucket.entries());
  if (typeof bucket.toObject === "function") return bucket.toObject();
  if (typeof bucket === "object") return { ...bucket };
  return {};
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
  profile.lastBannerVoteAt ??= defaults.lastBannerVoteAt;
  profile.lastWishAt ??= defaults.lastWishAt;
  profile.lastClashAt ??= defaults.lastClashAt;
  profile.lastHardClashAt ??= defaults.lastHardClashAt;
  profile.preferredClashCharacter ??= defaults.preferredClashCharacter;

  profile.inventory ??= defaults.inventory;
  profile.inventory.fiveStar = normalizeInventoryBucket(profile.inventory.fiveStar);
  profile.inventory.fourStar = normalizeInventoryBucket(profile.inventory.fourStar);
  profile.inventory.threeStar = normalizeInventoryBucket(profile.inventory.threeStar);

  return profile;
}

async function getProfile(users, userId) {
  if (!users[userId]) {
    users[userId] = {
      ...getDefaultProfile(),
      _id: userId
    };
  }
  return hydrateProfile(users[userId]);
}

async function loadUserProfile(userId) {
  await connectDatabase();
  const doc = await UserProfile.findById(userId);

  if (!doc) {
    const newProfile = {
      _id: userId,
      ...getDefaultProfile()
    };
    await UserProfile.create(newProfile);
    return newProfile;
  }

  return hydrateProfile(doc.toObject());
}

async function saveUserProfile(userId, profile) {
  await connectDatabase();
  const profileData = {
    ...profile,
    _id: userId
  };
  delete profileData.__v;
  delete profileData.createdAt;
  delete profileData.updatedAt;

  await UserProfile.updateOne({ _id: userId }, { $set: profileData }, { upsert: true });
}

async function saveBannerVote(characterName) {
  await connectDatabase();
  const doc = await BannerVotes.findById("banner_votes_current");
  
  if (!doc) {
    await BannerVotes.create({
      _id: "banner_votes_current",
      votes: { [characterName]: 1 },
      lastReset: Date.now()
    });
  } else {
    const votes = Object.fromEntries(doc.votes);
    votes[characterName] = (votes[characterName] || 0) + 1;
    await BannerVotes.updateOne(
      { _id: "banner_votes_current" },
      { $set: { votes } }
    );
  }
}

async function getBannerVotes() {
  await connectDatabase();
  const doc = await BannerVotes.findById("banner_votes_current");
  
  if (!doc) {
    return {};
  }
  
  return Object.fromEntries(doc.votes);
}

async function resetBannerVotes() {
  await connectDatabase();
  await BannerVotes.updateOne(
    { _id: "banner_votes_current" },
    { $set: { votes: {}, lastReset: Date.now() } },
    { upsert: true }
  );
}

async function saveBannerHistory(date, featuredCharacter, featuredFourStars) {
  await connectDatabase();
  await BannerHistory.updateOne(
    { _id: date },
    {
      $set: {
        date,
        featuredCharacter,
        featuredFourStars,
        timestamp: Date.now()
      }
    },
    { upsert: true }
  );
}

async function getBannerHistory(days = 21) {
  await connectDatabase();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);
  
  const history = await BannerHistory.find({ timestamp: { $gte: pastDate } }).sort({ timestamp: -1 });
  return history.map((doc) => ({ date: doc.date, character: doc.featuredCharacter }));
}

module.exports = {
  loadUsers,
  saveUsers,
  getProfile,
  loadUserProfile,
  saveUserProfile,
  connectDatabase,
  saveBannerVote,
  getBannerVotes,
  resetBannerVotes,
  saveBannerHistory,
  getBannerHistory
};
