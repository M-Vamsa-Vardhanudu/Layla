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
    lastActivityAt: { type: Number, default: 0 }
  },
  { collection: "users", timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

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
    lastActivityAt: 0
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

module.exports = {
  loadUsers,
  saveUsers,
  getProfile,
  loadUserProfile,
  saveUserProfile,
  connectDatabase
};
