require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const sharp = require("sharp");

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");
const { getTodayBanner, CHARACTERS, CHARACTER_ELEMENTS, getVotedBanner } = require("./data/banners");
const { getRandomTrivia } = require("./data/trivia");
const { startElementalClashSession, handleElementalClashFallbackCommand } = require("./data/elementalClash");
const { loadUsers, saveUsers, getProfile, loadUserProfile, saveUserProfile, connectDatabase, saveBannerVote, getBannerVotes, resetBannerVotes, saveBannerHistory, getBannerHistory } = require("./storage");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";
const WISH_COST = 160;
const WISH_EMBED_COLOR = 0xf39c12;
const WISH_COOLDOWN_MS = 10 * 1000;
const CLASH_NORMAL_COOLDOWN_MS = 2 * 60 * 1000;
const CLASH_HARD_COOLDOWN_MS = 2 * 60 * 1000;
const TRIVIA_COOLDOWN_MS = 3 * 1000;
const ACTIVITY_COOLDOWN_MS = 2 * 60 * 1000;
const ACTIVITY_REWARD_PRIMOS = 8;
const ACTIVITY_REWARD_EXP = 4;
const ACTIVITY_MIN_MESSAGE_LEN = 8;
const LEVEL_UP_REWARD_PRIMOS = Number.parseInt(process.env.LEVEL_UP_REWARD_PRIMOS || "25", 10);
const GENSHIN_API_BASE = "https://genshin.jmp.blue";
const WISH_ANIMATION_WAIT_MS = Number.parseInt(process.env.WISH_ANIMATION_WAIT_MS || "7000", 10);
const TRADE_OFFER_TIMEOUT_MS = 10 * 60 * 1000;
const BANNER_VOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PORT = Number.parseInt(process.env.PORT || "0", 10);
const ROOT_DIR = path.resolve(__dirname, "..");
const WISH_GIF_FILES = {
  "3-star": process.env.THREE_STAR_WISH_GIF_FILE || "threestar.gif",
  "4-star": process.env.FOUR_STAR_WISH_GIF_FILE || "fourstar.gif",
  "5-star": process.env.FIVE_STAR_WISH_GIF_FILE || "fivestar.gif"
};
const WISH_GIF_URLS = {
  "3-star": process.env.THREE_STAR_WISH_GIF_URL || "https://media1.tenor.com/m/KGwWGVz9-XQAAAAd/genshin-impact-wish.gif",
  "4-star": process.env.FOUR_STAR_WISH_GIF_URL || "https://media1.tenor.com/m/pVzBgcp1RPQAAAAd/genshin-impact-animation.gif",
  "5-star": process.env.FIVE_STAR_WISH_GIF_URL || "https://media1.tenor.com/m/Nc7Fgo43GLwAAAAd/genshin-gold-genshin-wish.gif"
};
const EMOJI = {
  shenhePeek: "<:shenhepeek:1492343728981934241>",
  shenheGroove: "<a:shenhegroove:1492343726792642720>",
  shenheTea: "<:shenhetea:1492343723445715046>",
  shenheSmile: "<:shenhesmile:1492343719406342257>",
  primogem: "<:primogemgenshinimpact:1492343125799075860>",
  laylaConfident: "<:laylaconfident:1492343094140604537>",
  laylaHesitant: "<a:laylahesitant:1492343064574951545>",
  laylaSad: "<:laylasad:1492343025525854299>",
  one: "<:one:1492350639252963339>",
  two: "<:two:1492350637227380907>",
  three: "<:three:1492350635486613716>",
  four: "<:four:1492350633779658893>",
  five: "<:five:1492350631313408124>",
  six: "<:six:1492350629245354034>",
  seven: "<:seven:1492350626581975111>",
  eight: "<:eight:1492350623449092146>",
  nine: "<:nine:1492350620466937899>",
  dendro: "<:GenshinImpactDendroElementIcon:1492352308023918682>",
  anemo: "<:GenshinImpactAnemoElementIcon768:1492352305478107136>",
  electro: "<:GenshinImpactElectroElementIcon:1492352302948945930>",
  geo: "<:GenshinImpactGeoElementIconEarth:1492352300457656520>",
  cryo: "<:GenshinImpactCryoElementIconIce7:1492352298364698694>",
  pyro: "<:GenshinImpactFireElementIconPyro:1492352295814303904>",
  hydro: "<:GenshinImpactHydroElement768x768:1492352293264429238>"
};
const AESTHETIC_EMOJIS = [
  "<a:heartneon:1493248741153706175>",
  "<a:nabluehearts:1493248753816047646>",
  "<a:NeonFire:1493248755649220880>",
  "<a:Neon_heart_floating73:1493248759071637574>",
  "<a:vaflyinghearts21:1493248761617584331>",
  "<a:aheartneonpink:1493248732819361945>"
];
const AESTHETIC_SEPARATOR = "---------";

function numberToEmojiText(value) {
  const digitMap = {
    "0": "0",
    "1": EMOJI.one,
    "2": EMOJI.two,
    "3": EMOJI.three,
    "4": EMOJI.four,
    "5": EMOJI.five,
    "6": EMOJI.six,
    "7": EMOJI.seven,
    "8": EMOJI.eight,
    "9": EMOJI.nine
  };

  return String(value)
    .split("")
    .map((digit) => digitMap[digit] || digit)
    .join(" ");
}

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAestheticBlock(lines) {
  return lines
    .filter((line) => line !== null && line !== undefined && String(line).trim().length > 0)
    .map((line, index) => `${AESTHETIC_EMOJIS[index % AESTHETIC_EMOJIS.length]} ${line}`)
    .join(`\n${AESTHETIC_SEPARATOR}\n`);
}

function elementEmojiForKey(elementKey) {
  const key = String(elementKey || "").toUpperCase();
  if (key === "DENDRO") return EMOJI.dendro;
  if (key === "ANEMO") return EMOJI.anemo;
  if (key === "ELECTRO") return EMOJI.electro;
  if (key === "GEO") return EMOJI.geo;
  if (key === "CRYO") return EMOJI.cryo;
  if (key === "PYRO") return EMOJI.pyro;
  if (key === "HYDRO") return EMOJI.hydro;
  return "";
}

function characterPreviewDescription(name, profile) {
  const fiveCount = profile.inventory.fiveStar[name] || 0;
  const fourCount = profile.inventory.fourStar[name] || 0;
  const copies = fiveCount + fourCount;
  const rarity = fiveCount > 0 ? "5-star" : "4-star";
  const elementKey = CHARACTER_ELEMENTS[name] || "";
  const elementEmoji = elementEmojiForKey(elementKey);
  const elementText = elementKey ? `${elementEmoji} ${titleCase(elementKey)}` : "Unknown Element";

  return [`Rarity: **${rarity}**`, `Copies: **x${copies}**`, `Element: ${elementText}`].join("\n");
}

function findOwnedCharacterName(profile, requestedName) {
  const target = normalize(String(requestedName || ""));
  if (!target) return null;

  const owned = [...new Set([
    ...Object.keys(profile.inventory.fiveStar || {}),
    ...Object.keys(profile.inventory.fourStar || {})
  ])];

  return owned.find((name) => normalize(name) === target) || null;
}

const CHARACTER_SLUG_OVERRIDES = {
  "raiden shogun": "raiden",
  "hu tao": "hu-tao",
  "kuki shinobu": "kuki-shinobu",
  "mizuki": "yumemizuki-mizuki",
  "yun jin": "yun-jin",
  "yae miko": "yae-miko",
  "shikanoin heizou": "shikanoin-heizou"
};

const TRADE_RARITY_LABELS = {
  fiveStar: "5-star",
  fourStar: "4-star",
  threeStar: "3-star"
};

if (!TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const ACTIVE_POOLS = CHARACTERS;
const pendingTrades = new Map();

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAnswer(text) {
  return normalize(String(text || ""))
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");

  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  const curr = new Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    curr[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[right.length];
}

function isTriviaAnswerCorrect(userInput, answers) {
  const normalizedInput = normalizeAnswer(userInput);
  if (!normalizedInput) return false;

  const normalizedAnswers = (answers || []).map((answer) => normalizeAnswer(answer)).filter(Boolean);
  if (!normalizedAnswers.length) return false;

  if (normalizedAnswers.includes(normalizedInput)) {
    return true;
  }

  return normalizedAnswers.some((candidate) => {
    const distance = levenshteinDistance(normalizedInput, candidate);
    const maxLength = Math.max(normalizedInput.length, candidate.length);
    const threshold = maxLength <= 6 ? 1 : 2;
    return distance <= threshold;
  });
}

function buildTriviaOptions(trivia, optionCount = 4) {
  const correctAnswer = (trivia.answers && trivia.answers[0]) || "Unknown";
  const correctNormalized = new Set((trivia.answers || []).map((answer) => normalizeAnswer(answer)).filter(Boolean));
  const distractorPool = (trivia.options || [])
    .filter((candidate) => !correctNormalized.has(normalizeAnswer(candidate)));

  const used = new Set([normalizeAnswer(correctAnswer)]);
  const options = [
    {
      label: titleCase(correctAnswer),
      value: "correct"
    }
  ];

  while (options.length < optionCount && distractorPool.length > 0) {
    const index = Math.floor(Math.random() * distractorPool.length);
    const [candidate] = distractorPool.splice(index, 1);
    const normalizedCandidate = normalizeAnswer(candidate);
    if (!normalizedCandidate || used.has(normalizedCandidate)) continue;

    used.add(normalizedCandidate);
    options.push({
      label: titleCase(candidate),
      value: `wrong_${options.length}`
    });
  }

  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

function toCharacterSlug(name) {
  const normalized = normalize(name).replace(/[^a-z0-9\s-]/g, "");
  return CHARACTER_SLUG_OVERRIDES[normalized] || normalized.replace(/\s+/g, "-");
}

function toWeaponSlug(name) {
  return normalize(name)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function characterCardUrl(name) {
  return `${GENSHIN_API_BASE}/characters/${toCharacterSlug(name)}/card`;
}

function weaponIconUrl(name) {
  return `${GENSHIN_API_BASE}/weapons/${toWeaponSlug(name)}/icon`;
}

function wishItemImageUrl(result) {
  if (!result) return null;
  return result.rarity === "3-star" ? weaponIconUrl(result.item) : characterCardUrl(result.item);
}

function wishGifUrl(rarity) {
  return WISH_GIF_URLS[rarity] || null;
}

function wishGifFilePath(rarity) {
  const configuredPath = WISH_GIF_FILES[rarity];
  if (!configuredPath) return null;

  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(ROOT_DIR, configuredPath);

  return fs.existsSync(resolvedPath) ? resolvedPath : null;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

function formatRemainingDuration(ms) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatDaysHoursRemaining(ms) {
  const clampedMs = Math.max(0, ms);
  const totalHours = Math.ceil(clampedMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}

function formatTopVoteStandings(votes, limit = 3) {
  const entries = Object.entries(votes || {})
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  if (entries.length === 0) {
    return "No votes yet.";
  }

  const totalVotes = entries.reduce((sum, [, count]) => sum + count, 0);
  return entries
    .slice(0, limit)
    .map(([name, count], index) => {
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return `${index + 1}. ${name} - ${count} votes (${percentage}%)`;
    })
    .join("\n");
}

function flipCoin() {
  return Math.random() < 0.5 ? "heads" : "tails";
}

function startHealthServer() {
  if (!PORT) return;

  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  server.listen(PORT, () => {
    console.log(`Health server listening on port ${PORT}`);
  });
}

function addInventory(profile, rarity, itemName) {
  const bucket = profile.inventory[rarity];
  bucket[itemName] = (bucket[itemName] || 0) + 1;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollWish(profile, banner) {
  profile.pity5 += 1;
  profile.pity4 += 1;
  profile.wishes += 1;

  const guaranteed5 = profile.pity5 >= 90;
  const guaranteed4 = profile.pity4 >= 10;
  const chance = Math.random();

  if (guaranteed5 || chance < 0.006) {
    profile.pity5 = 0;
    profile.pity4 = 0;

    let result;
    if (profile.guaranteedFeatured5) {
      result = banner.featuredFiveStar;
      profile.guaranteedFeatured5 = false;
    } else if (Math.random() < 0.5) {
      result = banner.featuredFiveStar;
    } else {
      const offBannerPool = ACTIVE_POOLS.fiveStarStandard.filter((name) => name !== banner.featuredFiveStar);
      result = pick(offBannerPool.length ? offBannerPool : ACTIVE_POOLS.fiveStarStandard);
      profile.guaranteedFeatured5 = true;
    }

    addInventory(profile, "fiveStar", result);

    return {
      rarity: "5-star",
      item: result,
      featured: result === banner.featuredFiveStar
    };
  }

  if (guaranteed4 || chance < 0.106) {
    profile.pity4 = 0;
    const featuredRate = Math.random() < 0.5;

    const result = featuredRate
      ? pick(banner.featuredFourStars)
      : pick(ACTIVE_POOLS.fourStarPool);

    addInventory(profile, "fourStar", result);

    return {
      rarity: "4-star",
      item: result,
      featured: banner.featuredFourStars.includes(result)
    };
  }

  const weapon = pick(ACTIVE_POOLS.threeStarWeapons);
  addInventory(profile, "threeStar", weapon);

  return {
    rarity: "3-star",
    item: weapon,
    featured: false
  };
}

function inventorySummary(profile) {
  const fiveStarCount = Object.values(profile.inventory.fiveStar).reduce((a, b) => a + b, 0);
  const fourStarCount = Object.values(profile.inventory.fourStar).reduce((a, b) => a + b, 0);
  const threeStarCount = Object.values(profile.inventory.threeStar).reduce((a, b) => a + b, 0);

  return `5-star: ${fiveStarCount} | 4-star: ${fourStarCount} | 3-star: ${threeStarCount}`;
}

function topItems(bucket, limit = 3) {
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([name, count]) => `${name} x${count}`);
}

function topItemsDetailed(bucket, limit = 3) {
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit);
}

function formatCharacterPullsWithElement(entries) {
  if (!entries.length) return "none yet";

  return entries
    .map(([name, count]) => {
      const elementKey = CHARACTER_ELEMENTS[name] || "";
      const elementEmoji = elementEmojiForKey(elementKey);
      return `• ${elementEmoji ? `${elementEmoji} ` : ""}**${name}** x${count}`;
    })
    .join("\n");
}

function chunkArray(arr, chunkSize) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

async function buildFiveStarCollage(characterNames) {
  const cardWidth = 360;
  const cardHeight = 640;
  const gap = 10;

  const cardBuffers = await Promise.all(characterNames.map(async (name) => {
    try {
      const response = await fetch(characterCardUrl(name));
      if (!response.ok) {
        return sharp({
          create: {
            width: cardWidth,
            height: cardHeight,
            channels: 4,
            background: { r: 24, g: 26, b: 38, alpha: 1 }
          }
        }).png().toBuffer();
      }

      const raw = Buffer.from(await response.arrayBuffer());
      return sharp(raw)
        .resize(cardWidth, cardHeight, { fit: "cover" })
        .png()
        .toBuffer();
    } catch {
      return sharp({
        create: {
          width: cardWidth,
          height: cardHeight,
          channels: 4,
          background: { r: 24, g: 26, b: 38, alpha: 1 }
        }
      }).png().toBuffer();
    }
  }));

  const totalWidth = cardBuffers.length * cardWidth + (cardBuffers.length - 1) * gap;
  return sharp({
    create: {
      width: totalWidth,
      height: cardHeight,
      channels: 4,
      background: { r: 15, g: 17, b: 24, alpha: 1 }
    }
  })
    .composite(cardBuffers.map((buffer, index) => ({
      input: buffer,
      left: index * (cardWidth + gap),
      top: 0
    })))
    .png()
    .toBuffer();
}

async function buildWishHighlightsCollage(results) {
  const highlightResults = results.filter((result) => result.rarity !== "3-star").slice(0, 10);
  if (highlightResults.length === 0) {
    return null;
  }

  const cardWidth = 280;
  const cardHeight = 420;
  const gap = 14;
  const columns = Math.min(3, highlightResults.length);
  const rows = Math.ceil(highlightResults.length / columns);

  const cardBuffers = await Promise.all(highlightResults.map(async (result) => {
    try {
      const response = await fetch(characterCardUrl(result.item));
      if (!response.ok) {
        return sharp({
          create: {
            width: cardWidth,
            height: cardHeight,
            channels: 4,
            background: { r: 24, g: 26, b: 38, alpha: 1 }
          }
        }).png().toBuffer();
      }

      const raw = Buffer.from(await response.arrayBuffer());
      return sharp(raw)
        .resize(cardWidth, cardHeight, { fit: "cover" })
        .png()
        .toBuffer();
    } catch {
      return sharp({
        create: {
          width: cardWidth,
          height: cardHeight,
          channels: 4,
          background: { r: 24, g: 26, b: 38, alpha: 1 }
        }
      }).png().toBuffer();
    }
  }));

  const totalWidth = columns * cardWidth + (columns - 1) * gap;
  const totalHeight = rows * cardHeight + (rows - 1) * gap;

  return sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 15, g: 17, b: 24, alpha: 1 }
    }
  })
    .composite(cardBuffers.map((buffer, index) => ({
      input: buffer,
      left: (index % columns) * (cardWidth + gap),
      top: Math.floor(index / columns) * (cardHeight + gap)
    })))
    .png()
    .toBuffer();
}

function formatRosterEntries(bucket, limit = 12) {
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const shown = entries.slice(0, limit).map(([name, count]) => {
    const constellation = Math.max(0, count - 1);
    return `• ${name} x${count}${constellation > 0 ? ` (C${constellation})` : ""}`;
  });

  if (entries.length > limit) {
    shown.push(`...and ${entries.length - limit} more`);
  }

  return {
    lines: shown,
    unique: entries.length,
    total: entries.reduce((sum, [, count]) => sum + count, 0),
    topName: entries[0]?.[0] || null
  };
}

function gainExp(profile, amount) {
  profile.exp += amount;
  let levelsGained = 0;

  while (profile.exp >= profile.level * 100) {
    profile.exp -= profile.level * 100;
    profile.level += 1;
    levelsGained += 1;
  }

  return levelsGained;
}

function awardLevelUpPrimos(profile, levelsGained) {
  if (levelsGained <= 0) return 0;
  const bonusPrimos = levelsGained * LEVEL_UP_REWARD_PRIMOS;
  profile.primogems += bonusPrimos;
  return bonusPrimos;
}

function normalizeTradeType(token) {
  const compact = normalize(token).replace(/[^a-z0-9]/g, "");

  if (["primogem", "primogems", "primo", "primos"].includes(compact)) {
    return { kind: "primogems" };
  }

  if (["5star", "fivestar"].includes(compact)) {
    return { kind: "item", rarity: "fiveStar", label: TRADE_RARITY_LABELS.fiveStar };
  }

  if (["4star", "fourstar"].includes(compact)) {
    return { kind: "item", rarity: "fourStar", label: TRADE_RARITY_LABELS.fourStar };
  }

  if (["3star", "threestar"].includes(compact)) {
    return { kind: "item", rarity: "threeStar", label: TRADE_RARITY_LABELS.threeStar };
  }

  return null;
}

function parseTradeSide(tokens) {
  if (tokens.length < 2) return null;

  const amount = Number.parseInt(tokens[0], 10);
  if (!Number.isInteger(amount) || amount <= 0) return null;

  const typeInfo = normalizeTradeType(tokens[1]);
  if (!typeInfo) return null;

  if (typeInfo.kind === "primogems") {
    if (tokens.length !== 2) return null;

    return {
      kind: "primogems",
      amount,
      label: `${amount} primogems`
    };
  }

  const itemName = tokens.slice(2).join(" ").trim();
  if (!itemName) return null;

  return {
    kind: "item",
    amount,
    rarity: typeInfo.rarity,
    rarityLabel: typeInfo.label,
    itemName,
    label: `${amount} x ${itemName} (${typeInfo.label})`
  };
}

function formatTradeSide(side) {
  return side.label;
}

function findInventoryEntry(bucket, itemName) {
  const normalizedName = normalize(itemName);

  for (const [existingName, count] of Object.entries(bucket)) {
    if (normalize(existingName) === normalizedName) {
      return { name: existingName, count };
    }
  }

  return null;
}

function resolveTradeSide(profile, side) {
  if (side.kind === "primogems") {
    if (profile.primogems < side.amount) {
      return { ok: false, reason: `needs ${side.amount} primogems but only has ${profile.primogems}` };
    }

    return { ok: true, resolvedSide: { ...side } };
  }

  const bucket = profile.inventory[side.rarity];
  const entry = findInventoryEntry(bucket, side.itemName);

  if (!entry) {
    return { ok: false, reason: `does not own ${side.itemName}` };
  }

  if (entry.count < side.amount) {
    return { ok: false, reason: `only has ${entry.count} of ${entry.name}` };
  }

  return {
    ok: true,
    resolvedSide: {
      ...side,
      itemName: entry.name
    }
  };
}

function applyTradeTransfer(profile, fromSide, toSide) {
  if (fromSide.kind === "primogems") {
    profile.primogems -= fromSide.amount;
  } else {
    const fromBucket = profile.inventory[fromSide.rarity];
    fromBucket[fromSide.itemName] -= fromSide.amount;

    if (fromBucket[fromSide.itemName] <= 0) {
      delete fromBucket[fromSide.itemName];
    }
  }

  if (toSide.kind === "primogems") {
    profile.primogems += toSide.amount;
    return;
  }

  const toBucket = profile.inventory[toSide.rarity];
  toBucket[toSide.itemName] = (toBucket[toSide.itemName] || 0) + toSide.amount;
}

function buildTradeEmbed(trade, stage, initiatorName, targetName) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.shenheGroove} Trade Offer`)
    .setColor(stage === "completed" ? 0x2ecc71 : stage === "cancelled" ? 0xe74c3c : 0xf39c12)
    .setDescription(
      [
        `**From:** ${initiatorName}`,
        `**To:** ${targetName}`,
        `**Offer:** ${formatTradeSide(trade.offer)}`,
        `**Request:** ${formatTradeSide(trade.request)}`,
        "",
        stage === "pendingTarget"
          ? `${EMOJI.laylaConfident} Waiting for the target to accept.`
          : stage === "pendingInitiator"
            ? `${EMOJI.laylaConfident} Target accepted. Waiting for the proposer to confirm.`
            : stage === "completed"
              ? `${EMOJI.shenheSmile} Trade completed successfully.`
              : `${EMOJI.laylaSad} Trade cancelled.`
      ].join("\n")
    )
    .setFooter({ text: "Both players must approve before any inventory changes happen." });
}

function hasActiveTradeForUser(userId) {
  for (const trade of pendingTrades.values()) {
    if (trade.initiatorId === userId || trade.targetId === userId) {
      return true;
    }
  }

  return false;
}

function getTradableCharacterChoices(profile, limit = 25) {
  const entries = [
    ...Object.entries(profile.inventory.fiveStar).map(([name, count]) => ({ rarity: "fiveStar", name, count })),
    ...Object.entries(profile.inventory.fourStar).map(([name, count]) => ({ rarity: "fourStar", name, count }))
  ]
    .filter((entry) => entry.count > 0)
    .sort((left, right) => {
      const rarityRank = (value) => (value === "fiveStar" ? 2 : 1);
      return rarityRank(right.rarity) - rarityRank(left.rarity) || right.count - left.count || left.name.localeCompare(right.name);
    })
    .slice(0, limit);

  return entries.map((entry) => ({
    label: entry.name,
    value: `${entry.rarity}::${entry.name}`,
    description: `x${entry.count} • ${TRADE_RARITY_LABELS[entry.rarity]}`,
    rarity: entry.rarity,
    name: entry.name,
    count: entry.count
  }));
}

function resolveCharacterTradeSelection(profile, selection) {
  if (!selection?.rarity || !selection?.name) {
    return { ok: false, reason: "selection was missing" };
  }

  const bucket = profile.inventory[selection.rarity];
  const entry = findInventoryEntry(bucket, selection.name);

  if (!entry || entry.count <= 0) {
    return { ok: false, reason: `does not own ${selection.name}` };
  }

  return {
    ok: true,
    resolved: {
      rarity: selection.rarity,
      name: entry.name
    }
  };
}

function buildWishResultEmbed(username, count, results, profile, bannerName, levelsGained, levelUpPrimos, summaryImage = null) {
  const summary = {
    five: results.filter((r) => r.rarity === "5-star").length,
    four: results.filter((r) => r.rarity === "4-star").length,
    three: results.filter((r) => r.rarity === "3-star").length
  };

  const highlights = results
    .filter((r) => r.rarity !== "3-star")
    .map((r) => {
      const rarityEmoji = r.rarity === "5-star" ? EMOJI.shenheGroove : EMOJI.laylaConfident;
      const elementKey = CHARACTER_ELEMENTS[r.item] || "";
      const elementEmoji = elementEmojiForKey(elementKey);
      const elementText = elementKey ? ` ${titleCase(elementKey)}` : "";
      return `${rarityEmoji} ${r.rarity} ${r.item}${r.featured ? " (featured)" : ""}${elementEmoji ? ` • ${elementEmoji}${elementText}` : ""}`;
    })
    .slice(0, 10);

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJI.shenhePeek} ${username}'s Wish Results`)
    .setDescription(`**${count} wishes** on **${bannerName}**`)
    .setColor(WISH_EMBED_COLOR)
    .addFields(
      {
        name: `${EMOJI.shenheGroove} Pull Summary`,
        value: `${numberToEmojiText(summary.five)} x 5-star   ${numberToEmojiText(summary.four)} x 4-star   ${numberToEmojiText(summary.three)} x 3-star`,
        inline: false
      },
      {
        name: `${EMOJI.primogem} Resources`,
        value: `Primogems left: **${profile.primogems}**\nPity: **${profile.pity5}/90** (5★) | **${profile.pity4}/10** (4★)`,
        inline: false
      },
      {
        name: `${EMOJI.shenheSmile} Progress`,
        value: `Level: **${profile.level}**\nEXP: **${profile.exp}/${profile.level * 100}**`,
        inline: false
      }
    );

  if (levelsGained > 0) {
    embed.addFields({
      name: `${EMOJI.shenheTea} Level Up`,
      value: `You gained **${levelsGained}** level(s).\nBonus: **+${levelUpPrimos}** primogems`,
      inline: false
    });
  }

  if (highlights.length > 0) {
    embed.addFields({
      name: `${EMOJI.laylaConfident} Highlights`,
      value: highlights.join("\n"),
      inline: false
    });
  }

  if (summaryImage) {
    embed.setImage(summaryImage);
  } else if (count === 1 && results[0]) {
    embed.setImage(wishItemImageUrl(results[0]));
  }

  return embed;
}

function buildWishHighlightEmbeds(results) {
  return results
    .filter((result) => result.rarity !== "3-star")
    .slice(0, 10)
    .map((result, index) => {
      const elementKey = CHARACTER_ELEMENTS[result.item] || "";
      const elementEmoji = elementEmojiForKey(elementKey);
      const elementText = elementKey ? `${elementEmoji} ${titleCase(elementKey)}` : "Unknown Element";
      return new EmbedBuilder()
        .setTitle(`Highlight ${index + 1}: ${result.item}`)
        .setDescription(`${result.rarity}${result.featured ? " (featured)" : ""}\n${elementText}`)
        .setColor(WISH_EMBED_COLOR)
        .setImage(characterCardUrl(result.item));
    });
}

function buildWishSlideEmbed(username, bannerName, results, index) {
  const result = results[index];
  const elementKey = CHARACTER_ELEMENTS[result.item] || "";
  const elementEmoji = elementEmojiForKey(elementKey);
  const elementText = elementKey ? `${elementEmoji} ${titleCase(elementKey)}` : "N/A";
  const embed = new EmbedBuilder()
    .setTitle(`${EMOJI.shenheGroove} ${username}'s 10-Pull Reveal`)
    .setDescription(
      [
        `${AESTHETIC_EMOJIS[0]} Pull **${index + 1}/${results.length}**`,
        `${AESTHETIC_EMOJIS[1]} Result: **${result.item}**`,
        `${AESTHETIC_EMOJIS[2]} Rarity: **${result.rarity}**${result.featured ? " (featured)" : ""}`,
        `${AESTHETIC_EMOJIS[3]} Element: ${elementText}`
      ].join("\n")
    )
    .setColor(WISH_EMBED_COLOR)
    .setFooter({ text: `${bannerName} • Use Reveal to continue or Summary to view the collage` });

  const imageUrl = wishItemImageUrl(result);
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

async function getActiveBanner(now = new Date()) {
  const scheduledBanner = getTodayBanner(now);
  const cycleKey = scheduledBanner.startedAt.toISOString();
  const bannerHistory = await getBannerHistory();
  const currentCycleBanner = bannerHistory.find((entry) => entry.date === cycleKey);

  if (currentCycleBanner) {
    return {
      ...scheduledBanner,
      featuredFiveStar: currentCycleBanner.character,
      name: `${currentCycleBanner.character} Featured Banner`
    };
  }

  const votes = await getBannerVotes();
  const votedBanner = await getVotedBanner(votes, bannerHistory);
  const featuredFiveStar = votedBanner.character || scheduledBanner.featuredFiveStar;

  await saveBannerHistory(cycleKey, featuredFiveStar, scheduledBanner.featuredFourStars);
  await resetBannerVotes();

  return {
    ...scheduledBanner,
    featuredFiveStar,
    name: `${featuredFiveStar} Featured Banner`
  };
}

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Pools loaded -> 5-star: ${ACTIVE_POOLS.fiveStarStandard.length}, 4-star: ${ACTIVE_POOLS.fourStarPool.length}`);
});

client.once("clientReady", async () => {
  try {
    const banner = await getActiveBanner();
    console.log(`Active banner resolved -> ${banner.featuredFiveStar}`);
  } catch (error) {
    console.error("Failed to resolve active banner:", error);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const users = await loadUsers();
  const profile = await getProfile(users, message.author.id);
  const isCommand = message.content.startsWith(PREFIX);

  if (!isCommand) {
    const now = Date.now();
    const trimmedContent = message.content.trim();
    const canReward =
      trimmedContent.length >= ACTIVITY_MIN_MESSAGE_LEN &&
      now - profile.lastActivityAt >= ACTIVITY_COOLDOWN_MS;

    if (canReward) {
      profile.lastActivityAt = now;
      profile.primogems += ACTIVITY_REWARD_PRIMOS;
      const levelsGained = gainExp(profile, ACTIVITY_REWARD_EXP);
      awardLevelUpPrimos(profile, levelsGained);
      await saveUserProfile(message.author.id, profile);
    }

    return;
  }

  const [command, ...args] = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const cmd = (command || "").toLowerCase();

  if (cmd === "help") {
    const helpEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenheSmile} Genshin Wish Bot Commands`)
      .setColor(0xe6b8ff)
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━━",
          `${EMOJI.primogem} **Wishing**`,
          `${AESTHETIC_EMOJIS[0]} \`${PREFIX}banner\` — Show active banner & featured characters`,
          `${AESTHETIC_EMOJIS[1]} \`${PREFIX}vote\` — Vote for next banner's featured 5★ (UI + 24h cooldown)`,
          `${AESTHETIC_EMOJIS[2]} \`${PREFIX}wish [1|10]\` — Spend primogems to wish`,
          `${AESTHETIC_EMOJIS[3]} Wish cooldown: **${Math.floor(WISH_COOLDOWN_MS / 1000)}s** per user`,
          `${AESTHETIC_EMOJIS[3]} \`${PREFIX}characters\` — View your character roster (sorting & pagination)`,
          `${AESTHETIC_EMOJIS[4]} \`${PREFIX}profile\` — Check primogems, pity, level & inventory`,
          "",
          "━━━━━━━━━━━━━━━━━━━",
          `${EMOJI.laylaConfident} **Mini-Games & Events**`,
          `${AESTHETIC_EMOJIS[0]} \`${PREFIX}trivia\` — Get a trivia question for primogem rewards`,
          `${AESTHETIC_EMOJIS[1]} \`${PREFIX}answer <text>\` — Answer active trivia`,
          `${AESTHETIC_EMOJIS[2]} \`${PREFIX}clash\` — Elemental Clash info and start modes`,
          "",
          "━━━━━━━━━━━━━━━━━━━",
          `${EMOJI.shenheTea} **Gambling & Trading**`,
          `${AESTHETIC_EMOJIS[0]} \`${PREFIX}coinflip <heads|tails> <bet>\` — 50/50 primogem gamble`,
          `${AESTHETIC_EMOJIS[1]} \`${PREFIX}trade @user\` — Trade characters (lock & confirm system)`,
          "",
          "━━━━━━━━━━━━━━━━━━━",
          `${EMOJI.shenheSmile} **Utility**`,
          `${AESTHETIC_EMOJIS[0]} \`${PREFIX}primogems\` — Check your primogem balance`,
          `${AESTHETIC_EMOJIS[1]} **Chat Rewards** — Send messages (8+ chars) to earn ${ACTIVITY_REWARD_PRIMOS} primos every ${Math.floor(ACTIVITY_COOLDOWN_MS / 60000)} minutes`,
          "━━━━━━━━━━━━━━━━━━━"
        ].join("\n")
      );

    await message.reply({ embeds: [helpEmbed] });
    return;
  }

  if (cmd === "banner") {
    const banner = await getActiveBanner();
    const remainingMs = Math.max(0, new Date(banner.resetAt).getTime() - Date.now());
    const timeLeft = formatDaysHoursRemaining(remainingMs);

    const embed = new EmbedBuilder()
      .setTitle(`Today's Banner: ${banner.name}`)
      .setDescription(
        formatAestheticBlock([
          `${EMOJI.shenheGroove} Featured 5-star: ${banner.featuredFiveStar}`,
          `${EMOJI.laylaConfident} Featured 4-stars: ${banner.featuredFourStars.join(", ")}`,
          `${EMOJI.primogem} Wish cost: ${WISH_COST} primogems per pull`,
          `${EMOJI.shenheTea} Resets in: **${timeLeft}** (every ${banner.rotationDays} days)`
        ])
      )
      .setColor(0xf1c40f)
      .setImage(characterCardUrl(banner.featuredFiveStar));

    await message.reply({ embeds: [embed] });
    return;
  }

  if (cmd === "vote") {
    await getActiveBanner();

    const now = Date.now();
    const elapsed = now - (profile.lastBannerVoteAt || 0);
    if (elapsed < BANNER_VOTE_COOLDOWN_MS) {
      const remaining = BANNER_VOTE_COOLDOWN_MS - elapsed;
      await message.reply(
        `${EMOJI.laylaHesitant} You can vote once every 24 hours. Try again in **${formatRemainingDuration(remaining)}**.`
      );
      return;
    }

    const voteOptions = [...CHARACTERS.fiveStarFeatured]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        label: name,
        value: name,
        description: `${name} featured vote`
      }));

    const currentVotes = await getBannerVotes();
    const topStandings = formatTopVoteStandings(currentVotes, 3);

    let selectedCharacter = null;
    const voteIdPrefix = `vote_${message.id}`;

    const selectRows = chunkArray(voteOptions, 25).map((chunk, index) => (
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`${voteIdPrefix}_pick_${index}`)
          .setPlaceholder(index === 0 ? "Pick a featured 5-star character" : "More featured 5-star options")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(chunk)
      )
    ));

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${voteIdPrefix}_confirm`)
        .setLabel("Confirm Vote")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${voteIdPrefix}_cancel`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    const buildVoteEmbed = () => new EmbedBuilder()
      .setTitle(`${EMOJI.shenheSmile} Banner Vote`)
      .setColor(0x9b59b6)
      .setDescription(
        formatAestheticBlock([
          "Choose one featured 5-star from the dropdown.",
          `Selected: **${selectedCharacter || "None"}**`,
          `Top 3 right now:\n${topStandings}`,
          "Press Confirm Vote to submit.",
          "You can vote once every 24 hours."
        ])
      );

    const voteMessage = await message.reply({
      embeds: [buildVoteEmbed()],
      components: [...selectRows, buttonRow]
    });

    const collector = voteMessage.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.customId.startsWith(voteIdPrefix)) return;

      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: `${EMOJI.laylaHesitant} This voting panel belongs to ${message.author.username}.`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.includes("_pick_")) {
        selectedCharacter = interaction.values[0];
        await interaction.update({
          embeds: [buildVoteEmbed()],
          components: [...selectRows, buttonRow]
        });
        return;
      }

      if (interaction.customId.endsWith("_cancel")) {
        await interaction.update({
          embeds: [new EmbedBuilder().setColor(0x95a5a6).setDescription(`${EMOJI.laylaSad} Vote cancelled.`)],
          components: []
        });
        collector.stop("cancelled");
        return;
      }

      if (interaction.customId.endsWith("_confirm")) {
        if (!selectedCharacter) {
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} Pick a character first before confirming.`,
            ephemeral: true
          });
          return;
        }

        const freshProfile = await loadUserProfile(message.author.id);
        const freshNow = Date.now();
        const freshElapsed = freshNow - (freshProfile.lastBannerVoteAt || 0);
        if (freshElapsed < BANNER_VOTE_COOLDOWN_MS) {
          const remaining = BANNER_VOTE_COOLDOWN_MS - freshElapsed;
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} You can vote again in **${formatRemainingDuration(remaining)}**.`,
            ephemeral: true
          });
          return;
        }

        try {
          await saveBannerVote(selectedCharacter);
          freshProfile.lastBannerVoteAt = freshNow;
          await saveUserProfile(message.author.id, freshProfile);

          const votes = await getBannerVotes();
          const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
          const charVotes = votes[selectedCharacter] || 0;
          const percentage = totalVotes > 0 ? Math.round((charVotes / totalVotes) * 100) : 0;
          const topAfterVote = formatTopVoteStandings(votes, 3);

          const voteEmbed = new EmbedBuilder()
            .setTitle(`${EMOJI.shenheSmile} Vote Recorded`)
            .setColor(0x9b59b6)
            .setDescription(
              formatAestheticBlock([
                `Character: **${selectedCharacter}**`,
                "Your vote counted successfully.",
                `Current votes: **${charVotes}** (${percentage}% of ${totalVotes} total)`,
                `Top 3 now:\n${topAfterVote}`,
                "You can vote again after 24 hours."
              ])
            );

          await interaction.update({ embeds: [voteEmbed], components: [] });
          collector.stop("confirmed");
        } catch (error) {
          console.error("Vote error:", error);
          await interaction.reply({
            content: `${EMOJI.laylaSad} Error saving vote. Please try again.`,
            ephemeral: true
          });
        }
      }
    });

    collector.on("end", async () => {
      if (voteMessage.editable) {
        try {
          await voteMessage.edit({ components: [] });
        } catch {
          // Ignore when message is deleted or no longer editable.
        }
      }
    });

    return;
  }

  if (cmd === "profile") {
    const top5 = topItemsDetailed(profile.inventory.fiveStar);
    const top4 = topItemsDetailed(profile.inventory.fourStar);

    const fiveStarCount = Object.values(profile.inventory.fiveStar).reduce((a, b) => a + b, 0);
    const fourStarCount = Object.values(profile.inventory.fourStar).reduce((a, b) => a + b, 0);
    const threeStarCount = Object.values(profile.inventory.threeStar).reduce((a, b) => a + b, 0);

    const profileEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenhePeek} ${message.author.username}'s Profile`)
      .setColor(0x5dade2)
      .setDescription(
        formatAestheticBlock([
          `Primogems: **${profile.primogems}**`,
          `Level: **${profile.level}**`,
          `Total wishes: **${profile.wishes}**`
        ])
      )
      .addFields(
        {
          name: `${EMOJI.shenheSmile} Progress`,
          value: formatAestheticBlock([
            `Level: **${profile.level}**`,
            `EXP: **${profile.exp} / ${profile.level * 100}**`,
            `Total wishes: **${profile.wishes}**`
          ]),
          inline: false
        },
        {
          name: `${EMOJI.laylaHesitant} Pity & Guarantee`,
          value: formatAestheticBlock([
            `5-star: **${profile.pity5}/90**`,
            `4-star: **${profile.pity4}/10**`,
            `Featured guarantee: **${profile.guaranteedFeatured5 ? "ON" : "OFF"}**`
          ]),
          inline: false
        },
        {
          name: `${EMOJI.laylaConfident} Inventory Totals`,
          value: formatAestheticBlock([
            `5-star: **${fiveStarCount}**`,
            `4-star: **${fourStarCount}**`,
            `3-star: **${threeStarCount}**`
          ]),
          inline: true
        },
        {
          name: `${EMOJI.shenheGroove} Top 5-star Pulls`,
          value: formatCharacterPullsWithElement(top5),
          inline: false
        },
        {
          name: `${EMOJI.laylaConfident} Top 4-star Pulls`,
          value: formatCharacterPullsWithElement(top4),
          inline: false
        }
      );

    await message.reply({ embeds: [profileEmbed] });
    return;
  }

  if (cmd === "primogems") {
    const primogemsEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI.primogem} ${message.author.username}'s Primogems`)
      .setColor(0x5dade2)
      .setDescription(
        formatAestheticBlock([
          `Primogems: **${profile.primogems}**`,
          `Level: **${profile.level}**`,
          `Total wishes: **${profile.wishes}**`
        ])
      );

    await message.reply({ embeds: [primogemsEmbed] });
    return;
  }

  if (cmd === "clashauto") {
    const rawInput = args.join(" ").trim();

    if (!rawInput) {
      const current = profile.preferredClashCharacter || "Not set";
      await message.reply(`${EMOJI.shenheTea} Current clash auto-select: **${current}**`);
      return;
    }

    const lowered = rawInput.toLowerCase();
    if (["clear", "reset", "none", "off"].includes(lowered)) {
      profile.preferredClashCharacter = null;
      await saveUserProfile(message.author.id, profile);
      await message.reply(`${EMOJI.shenheSmile} Clash auto-select cleared. The bot will use your top owned character again.`);
      return;
    }

    const ownedName = findOwnedCharacterName(profile, rawInput);
    if (!ownedName) {
      await message.reply(`${EMOJI.laylaHesitant} You do not own **${rawInput}**. Use ${PREFIX}characters to check your roster.`);
      return;
    }

    profile.preferredClashCharacter = ownedName;
    await saveUserProfile(message.author.id, profile);
    await message.reply(`${EMOJI.shenheSmile} Clash auto-select set to **${ownedName}**.`);
    return;
  }

  if (cmd === "clash") {
    const modeArg = String(args[0] || "").toLowerCase();
    const difficulty = ["hard", "nightmare", "difficult"].includes(modeArg) ? "hard" : ["normal", "easy", "standard"].includes(modeArg) ? "normal" : null;

    if (!difficulty) {
      const banner = await getActiveBanner();
      const clashInfoEmbed = new EmbedBuilder()
        .setTitle(`${EMOJI.shenheGroove} Elemental Clash`)
        .setColor(0x7c2d12)
        .setDescription(
          formatAestheticBlock([
            "Choose a mode to start a raid.",
            `Use ${PREFIX}clash normal for the standard raid.`,
            `Use ${PREFIX}clash hard for Dottore mode.`,
            `Auto-pick your main unit with ${PREFIX}clashauto <character|clear>.`,
            `If buttons fail, use ${PREFIX}clashfix <action> [args].`,
            `Normal: 250 fee, 2000 reward per person.`,
            `Hard: 500 fee, 5000 reward per person.`,
            `Cooldown: 2 minutes for both modes.`
          ])
        )
        .setImage(characterCardUrl(banner.featuredFiveStar));

      await message.reply({ embeds: [clashInfoEmbed] });
      return;
    }
    const cooldownMs = difficulty === "hard" ? CLASH_HARD_COOLDOWN_MS : CLASH_NORMAL_COOLDOWN_MS;
    const cooldownStamp = difficulty === "hard" ? (profile.lastHardClashAt || 0) : (profile.lastClashAt || 0);

    const now = Date.now();
    if (now - cooldownStamp < cooldownMs) {
      const remainingMs = cooldownMs - (now - cooldownStamp);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      await message.reply(`${EMOJI.laylaHesitant} ${difficulty === "hard" ? "Hard" : "Normal"} clash cooldown active. Try again in ${minutes}m ${seconds}s.`);
      return;
    }

    const started = await startElementalClashSession({
      message,
      profile,
      loadUsers,
      getProfile,
      saveUserProfile,
      prefix: PREFIX,
      emoji: EMOJI,
      characterElements: CHARACTER_ELEMENTS,
      difficulty
    });

    if (started) {
      if (difficulty === "hard") {
        profile.lastHardClashAt = now;
      } else {
        profile.lastClashAt = now;
      }
      await saveUserProfile(message.author.id, profile);
    }

    return;
  }

  if (cmd === "clashfix") {
    await handleElementalClashFallbackCommand({
      message,
      args,
      loadUsers,
      getProfile,
      saveUserProfile,
      emoji: EMOJI,
      characterElements: CHARACTER_ELEMENTS
    });
    return;
  }

  if (cmd === "coinflip" || cmd === "flip") {
    const guess = (args[0] || "").toLowerCase();
    const bet = Number.parseInt(args[1] || "", 10);

    if (!["heads", "tails"].includes(guess)) {
      await message.reply(`${EMOJI.laylaHesitant} Usage: ${PREFIX}coinflip <heads|tails> <bet>`);
      return;
    }

    if (!Number.isInteger(bet) || bet <= 0) {
      await message.reply(`${EMOJI.laylaHesitant} Bet must be a positive number of primogems.`);
      return;
    }

    if (profile.primogems < bet) {
      await message.reply(
        `${EMOJI.laylaHesitant} You only have ${profile.primogems} primogems, so you cannot bet ${bet}.`
      );
      return;
    }

    const result = flipCoin();
    const win = result === guess;

    profile.primogems += win ? bet : -bet;
    await saveUserProfile(message.author.id, profile);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJI.primogem} Coinflip Result`)
      .setColor(win ? 0x2ecc71 : 0xe74c3c)
      .setDescription(
        formatAestheticBlock([
          `You guessed: **${guess}**`,
          `Result: **${result}**`,
          `Bet: **${bet}** primogems`,
          win
            ? `You won **${bet}** primogems and now have **${profile.primogems}**.`
            : `You lost **${bet}** primogems and now have **${profile.primogems}**.`
        ])
      );

    await message.reply({ embeds: [embed] });
    return;
  }

  if (cmd === "trade") {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!targetUser) {
      await message.reply(
        `${EMOJI.laylaHesitant} Usage: ${PREFIX}trade @user`
      );
      return;
    }

    if (targetUser.bot) {
      await message.reply(`${EMOJI.laylaHesitant} You cannot trade with bots.`);
      return;
    }

    if (targetUser.id === message.author.id) {
      await message.reply(`${EMOJI.laylaHesitant} You cannot trade with yourself.`);
      return;
    }

    if (hasActiveTradeForUser(message.author.id) || hasActiveTradeForUser(targetUser.id)) {
      await message.reply(`${EMOJI.laylaHesitant} One of those users already has a pending trade.`);
      return;
    }

    const restTokens = message.content
      .slice(PREFIX.length)
      .trim()
      .split(/\s+/)
      .slice(2);

    if (restTokens.length === 0) {
      const targetProfile = await getProfile(users, targetUser.id);
      const initiatorChoices = getTradableCharacterChoices(profile);
      const targetChoices = getTradableCharacterChoices(targetProfile);

      if (!initiatorChoices.length) {
        await message.reply(`${EMOJI.laylaHesitant} You do not have any tradable 4-star/5-star characters yet.`);
        return;
      }

      if (!targetChoices.length) {
        await message.reply(`${EMOJI.laylaHesitant} ${targetUser.username} does not have any tradable 4-star/5-star characters yet.`);
        return;
      }

      const tradeId = `trade_${message.id}`;
      const trade = {
        id: tradeId,
        initiatorId: message.author.id,
        targetId: targetUser.id,
        stage: "selecting",
        timeoutId: null,
        selection: {
          initiator: null,
          target: null
        },
        locked: {
          initiator: false,
          target: false
        },
        confirmed: {
          initiator: false,
          target: false
        }
      };

      const parseSelection = (value) => {
        const [rarity, ...nameParts] = String(value || "").split("::");
        const name = nameParts.join("::");
        if (!rarity || !name) return null;
        return { rarity, name };
      };

      const formatSelection = (selection) => {
        if (!selection) return "Not selected";
        return `${selection.name} (${TRADE_RARITY_LABELS[selection.rarity] || selection.rarity})`;
      };

      const buildCharacterTradeEmbed = (stage = "selecting") => {
        return new EmbedBuilder()
          .setTitle(`${EMOJI.shenheGroove} Character Trade Setup`)
          .setColor(stage === "completed" ? 0x2ecc71 : stage === "cancelled" ? 0xe74c3c : 0x3498db)
          .setDescription(
            formatAestheticBlock([
              `**${message.author.username} gives:** ${formatSelection(trade.selection.initiator)}`,
              `**${targetUser.username} gives:** ${formatSelection(trade.selection.target)}`,
              `Lock status: ${message.author.username} ${trade.locked.initiator ? "✅" : "❌"} | ${targetUser.username} ${trade.locked.target ? "✅" : "❌"}`,
              `Confirm status: ${message.author.username} ${trade.confirmed.initiator ? "✅" : "❌"} | ${targetUser.username} ${trade.confirmed.target ? "✅" : "❌"}`,
              stage === "completed"
                ? `${EMOJI.shenheSmile} Trade completed.`
                : stage === "cancelled"
                  ? `${EMOJI.laylaSad} Trade cancelled.`
                  : `${EMOJI.laylaConfident} Pick one character each, both users lock in, then both users press Confirm.`
            ])
          )
          .setFooter({ text: "Changing selection or unlocking removes your confirm." });
      };

      const buildCharacterTradeRows = (disabled = false) => {
        const initiatorSelect = new StringSelectMenuBuilder()
          .setCustomId(`${tradeId}_pick_initiator`)
          .setPlaceholder(trade.selection.initiator ? `Selected: ${trade.selection.initiator.name}` : `${message.author.username} picks a character`)
          .setMinValues(1)
          .setMaxValues(1)
          .setDisabled(disabled || trade.locked.initiator)
          .addOptions(initiatorChoices.map((option) => ({
            label: option.label,
            value: option.value,
            description: option.description,
            default: trade.selection.initiator
              ? trade.selection.initiator.rarity === option.rarity && trade.selection.initiator.name === option.name
              : false
          })));

        const targetSelect = new StringSelectMenuBuilder()
          .setCustomId(`${tradeId}_pick_target`)
          .setPlaceholder(trade.selection.target ? `Selected: ${trade.selection.target.name}` : `${targetUser.username} picks a character`)
          .setMinValues(1)
          .setMaxValues(1)
          .setDisabled(disabled || trade.locked.target)
          .addOptions(targetChoices.map((option) => ({
            label: option.label,
            value: option.value,
            description: option.description,
            default: trade.selection.target
              ? trade.selection.target.rarity === option.rarity && trade.selection.target.name === option.name
              : false
          })));

        return [
          new ActionRowBuilder().addComponents(initiatorSelect),
          new ActionRowBuilder().addComponents(targetSelect),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${tradeId}_lock_initiator`)
              .setLabel(trade.locked.initiator ? `${message.author.username} Locked` : `${message.author.username} Lock In`)
              .setStyle(trade.locked.initiator ? ButtonStyle.Success : ButtonStyle.Primary)
              .setDisabled(disabled),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_lock_target`)
              .setLabel(trade.locked.target ? `${targetUser.username} Locked` : `${targetUser.username} Lock In`)
              .setStyle(trade.locked.target ? ButtonStyle.Success : ButtonStyle.Primary)
              .setDisabled(disabled),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_confirm_initiator`)
              .setLabel(trade.confirmed.initiator ? `${message.author.username} Confirmed` : `${message.author.username} Confirm`)
              .setStyle(trade.confirmed.initiator ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(disabled || !trade.locked.initiator || !trade.selection.initiator),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_confirm_target`)
              .setLabel(trade.confirmed.target ? `${targetUser.username} Confirmed` : `${targetUser.username} Confirm`)
              .setStyle(trade.confirmed.target ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(disabled || !trade.locked.target || !trade.selection.target),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_cancel`)
              .setLabel("Cancel")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(disabled)
          )
        ];
      };

      const tradeMessage = await message.reply({
        embeds: [buildCharacterTradeEmbed()],
        components: buildCharacterTradeRows(false)
      });

      pendingTrades.set(tradeId, trade);

      const cancelCharacterTrade = async (reason = "cancelled") => {
        if (!pendingTrades.has(tradeId)) return;
        pendingTrades.delete(tradeId);

        if (trade.timeoutId) {
          clearTimeout(trade.timeoutId);
        }

        trade.stage = "cancelled";

        try {
          await tradeMessage.edit({
            embeds: [buildCharacterTradeEmbed("cancelled")],
            components: []
          });
        } catch {
          // Ignore edit errors when the message no longer exists.
        }

        if (reason === "expired") {
          await message.channel.send(`${EMOJI.laylaHesitant} Trade expired before both users confirmed.`);
        }
      };

      const finalizeCharacterTrade = async () => {
        try {
          const freshUsers = await loadUsers();
          const initiatorProfile = await getProfile(freshUsers, message.author.id);
          const freshTargetProfile = await getProfile(freshUsers, targetUser.id);
          const initiatorSelection = resolveCharacterTradeSelection(initiatorProfile, trade.selection.initiator);
          const targetSelection = resolveCharacterTradeSelection(freshTargetProfile, trade.selection.target);

          if (!initiatorSelection.ok || !targetSelection.ok) {
            const reason = !initiatorSelection.ok ? initiatorSelection.reason : targetSelection.reason;
            await message.channel.send(`${EMOJI.laylaHesitant} Trade failed: ${reason}.`);
            await cancelCharacterTrade("invalid-state");
            return;
          }

          const initiatorFromBucket = initiatorProfile.inventory[initiatorSelection.resolved.rarity];
          const targetFromBucket = freshTargetProfile.inventory[targetSelection.resolved.rarity];
          const initiatorToBucket = initiatorProfile.inventory[targetSelection.resolved.rarity];
          const targetToBucket = freshTargetProfile.inventory[initiatorSelection.resolved.rarity];

          initiatorFromBucket[initiatorSelection.resolved.name] -= 1;
          if (initiatorFromBucket[initiatorSelection.resolved.name] <= 0) {
            delete initiatorFromBucket[initiatorSelection.resolved.name];
          }

          targetFromBucket[targetSelection.resolved.name] -= 1;
          if (targetFromBucket[targetSelection.resolved.name] <= 0) {
            delete targetFromBucket[targetSelection.resolved.name];
          }

          initiatorToBucket[targetSelection.resolved.name] = (initiatorToBucket[targetSelection.resolved.name] || 0) + 1;
          targetToBucket[initiatorSelection.resolved.name] = (targetToBucket[initiatorSelection.resolved.name] || 0) + 1;

          await saveUsers({
            [message.author.id]: initiatorProfile,
            [targetUser.id]: freshTargetProfile
          });

          pendingTrades.delete(tradeId);

          if (trade.timeoutId) {
            clearTimeout(trade.timeoutId);
          }

          trade.stage = "completed";

          await tradeMessage.edit({
            embeds: [buildCharacterTradeEmbed("completed")],
            components: []
          });

          await message.channel.send(
            `${EMOJI.shenheSmile} Trade completed: ${message.author.username} traded **${initiatorSelection.resolved.name}** for **${targetSelection.resolved.name}** from ${targetUser.username}.`
          );
        } catch {
          await message.channel.send(`${EMOJI.laylaHesitant} Trade could not be completed because a database update failed.`);
          await cancelCharacterTrade("db-error");
        }
      };

      trade.timeoutId = setTimeout(() => {
        cancelCharacterTrade("expired").catch(() => {});
      }, TRADE_OFFER_TIMEOUT_MS);

      const collector = tradeMessage.createMessageComponentCollector({
        time: TRADE_OFFER_TIMEOUT_MS
      });

      collector.on("collect", async (interaction) => {
        if (!interaction.customId.startsWith(tradeId)) return;

        if (![message.author.id, targetUser.id].includes(interaction.user.id)) {
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} Only the two trading users can interact with this trade.`,
            ephemeral: true
          });
          return;
        }

        if (interaction.customId.endsWith("_cancel")) {
          await interaction.deferUpdate();
          await cancelCharacterTrade("cancelled");
          collector.stop("cancelled");
          return;
        }

        if (interaction.customId.endsWith("_pick_initiator")) {
          if (interaction.user.id !== message.author.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${message.author.username} can pick this side.`,
              ephemeral: true
            });
            return;
          }

          const selected = parseSelection(interaction.values[0]);
          if (!selected) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Invalid selection. Try again.`,
              ephemeral: true
            });
            return;
          }

          trade.selection.initiator = selected;
          trade.locked.initiator = false;
          trade.confirmed.initiator = false;
          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }

        if (interaction.customId.endsWith("_pick_target")) {
          if (interaction.user.id !== targetUser.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${targetUser.username} can pick this side.`,
              ephemeral: true
            });
            return;
          }

          const selected = parseSelection(interaction.values[0]);
          if (!selected) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Invalid selection. Try again.`,
              ephemeral: true
            });
            return;
          }

          trade.selection.target = selected;
          trade.locked.target = false;
          trade.confirmed.target = false;
          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }

        if (interaction.customId.endsWith("_lock_initiator")) {
          if (interaction.user.id !== message.author.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${message.author.username} can lock this side.`,
              ephemeral: true
            });
            return;
          }

          if (!trade.selection.initiator) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Pick your character first before locking in.`,
              ephemeral: true
            });
            return;
          }

          trade.locked.initiator = !trade.locked.initiator;
          trade.confirmed.initiator = false;

          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }

        if (interaction.customId.endsWith("_lock_target")) {
          if (interaction.user.id !== targetUser.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${targetUser.username} can lock this side.`,
              ephemeral: true
            });
            return;
          }

          if (!trade.selection.target) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Pick your character first before locking in.`,
              ephemeral: true
            });
            return;
          }

          trade.locked.target = !trade.locked.target;
          trade.confirmed.target = false;

          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }

        if (interaction.customId.endsWith("_confirm_initiator")) {
          if (interaction.user.id !== message.author.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${message.author.username} can confirm this side.`,
              ephemeral: true
            });
            return;
          }

          if (!trade.selection.initiator || !trade.locked.initiator) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Select and lock your character before confirming.`,
              ephemeral: true
            });
            return;
          }

          trade.confirmed.initiator = true;

          if (trade.locked.initiator && trade.locked.target && trade.selection.initiator && trade.selection.target && trade.confirmed.initiator && trade.confirmed.target) {
            await interaction.deferUpdate();
            await finalizeCharacterTrade();
            collector.stop("completed");
            return;
          }

          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }

        if (interaction.customId.endsWith("_confirm_target")) {
          if (interaction.user.id !== targetUser.id) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Only ${targetUser.username} can confirm this side.`,
              ephemeral: true
            });
            return;
          }

          if (!trade.selection.target || !trade.locked.target) {
            await interaction.reply({
              content: `${EMOJI.laylaHesitant} Select and lock your character before confirming.`,
              ephemeral: true
            });
            return;
          }

          trade.confirmed.target = true;

          if (trade.locked.initiator && trade.locked.target && trade.selection.initiator && trade.selection.target && trade.confirmed.initiator && trade.confirmed.target) {
            await interaction.deferUpdate();
            await finalizeCharacterTrade();
            collector.stop("completed");
            return;
          }

          await interaction.update({ embeds: [buildCharacterTradeEmbed()], components: buildCharacterTradeRows(false) });
          return;
        }
      });

      collector.on("end", async () => {
        if (pendingTrades.has(tradeId)) {
          pendingTrades.delete(tradeId);
        }

        if (trade.timeoutId) {
          clearTimeout(trade.timeoutId);
        }

        if (trade.stage === "selecting") {
          try {
            await tradeMessage.edit({ components: [] });
          } catch {
            // Ignore edit errors when the message no longer exists.
          }
        }
      });

      return;
    }

    if (restTokens[0]?.toLowerCase() !== "give") {
      await message.reply(
        `${EMOJI.laylaHesitant} Usage: ${PREFIX}trade @user`
      );
      return;
    }

    const receiveIndex = restTokens.findIndex((token) => token.toLowerCase() === "receive");
    if (receiveIndex < 0) {
      await message.reply(
        `${EMOJI.laylaHesitant} Include both give and receive sections in the trade command.`
      );
      return;
    }

    const offerTokens = restTokens.slice(1, receiveIndex);
    const requestTokens = restTokens.slice(receiveIndex + 1);

    const offer = parseTradeSide(offerTokens);
    const request = parseTradeSide(requestTokens);

    if (!offer || !request) {
      await message.reply(
        [
          `${EMOJI.laylaHesitant} Invalid trade format.`,
          `Example: ${PREFIX}trade @user give 100 primogems receive 1 5-star Raiden Shogun`,
          `Example: ${PREFIX}trade @user give 1 4-star Bennett receive 50 primogems`
        ].join("\n")
      );
      return;
    }

    const tradeId = `trade_${message.id}`;
    const trade = {
      id: tradeId,
      initiatorId: message.author.id,
      targetId: targetUser.id,
      offer,
      request,
      stage: "pendingTarget",
      timeoutId: null
    };

    const buildTradeRows = (stage) => {
      if (stage === "pendingTarget") {
        return [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${tradeId}_accept`)
              .setLabel("Accept")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_decline`)
              .setLabel("Decline")
              .setStyle(ButtonStyle.Danger)
          )
        ];
      }

      if (stage === "pendingInitiator") {
        return [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${tradeId}_confirm`)
              .setLabel("Confirm")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`${tradeId}_cancel`)
              .setLabel("Cancel")
              .setStyle(ButtonStyle.Danger)
          )
        ];
      }

      return [];
    };

    const tradeMessage = await message.reply({
      embeds: [buildTradeEmbed(trade, "pendingTarget", message.author.username, targetUser.username)],
      components: buildTradeRows("pendingTarget")
    });

    pendingTrades.set(tradeId, trade);

    const expireTrade = async (reason = "expired") => {
      if (!pendingTrades.has(tradeId)) return;
      pendingTrades.delete(tradeId);

      if (trade.timeoutId) {
        clearTimeout(trade.timeoutId);
      }

      trade.stage = "cancelled";

      try {
        await tradeMessage.edit({
          embeds: [buildTradeEmbed(trade, "cancelled", message.author.username, targetUser.username)],
          components: []
        });
      } catch {
        // Ignore edit errors when the message no longer exists.
      }

      if (reason === "expired") {
        await message.channel.send(`${EMOJI.laylaHesitant} Trade expired before both users approved it.`);
      }
    };

    trade.timeoutId = setTimeout(() => {
      expireTrade("expired").catch(() => {});
    }, TRADE_OFFER_TIMEOUT_MS);

    const collector = tradeMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: TRADE_OFFER_TIMEOUT_MS
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.customId.startsWith(tradeId)) return;

      if (trade.stage === "pendingTarget") {
        if (interaction.user.id !== targetUser.id) {
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} Only ${targetUser.username} can accept or decline this trade.`,
            ephemeral: true
          });
          return;
        }

        if (interaction.customId.endsWith("_decline")) {
          await interaction.deferUpdate();
          await expireTrade("declined");
          collector.stop("declined");
          return;
        }

        await interaction.deferUpdate();

        trade.stage = "pendingInitiator";
        await tradeMessage.edit({
          embeds: [buildTradeEmbed(trade, "pendingInitiator", message.author.username, targetUser.username)],
          components: buildTradeRows("pendingInitiator")
        });
        return;
      }

      if (trade.stage === "pendingInitiator") {
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} Only ${message.author.username} can finalize this trade.`,
            ephemeral: true
          });
          return;
        }

        if (interaction.customId.endsWith("_cancel")) {
          await interaction.deferUpdate();
          await expireTrade("cancelled");
          collector.stop("cancelled");
          return;
        }

        if (!interaction.customId.endsWith("_confirm")) {
          return;
        }

        await interaction.deferUpdate();

        try {
          const users = await loadUsers();
          const initiatorProfile = await getProfile(users, message.author.id);
          const targetProfile = await getProfile(users, targetUser.id);
          const resolvedOffer = resolveTradeSide(initiatorProfile, trade.offer);
          const resolvedRequest = resolveTradeSide(targetProfile, trade.request);

          if (!resolvedOffer.ok || !resolvedRequest.ok) {
            const reason = !resolvedOffer.ok ? resolvedOffer.reason : resolvedRequest.reason;
            pendingTrades.delete(tradeId);

            if (trade.timeoutId) {
              clearTimeout(trade.timeoutId);
            }

            trade.stage = "cancelled";

            await tradeMessage.edit({
              embeds: [buildTradeEmbed(trade, "cancelled", message.author.username, targetUser.username)],
              components: []
            });
            await message.channel.send(`${EMOJI.laylaHesitant} Trade failed: ${reason}.`);
            collector.stop("invalid-state");
            return;
          }

          applyTradeTransfer(initiatorProfile, resolvedOffer.resolvedSide, resolvedRequest.resolvedSide);
          applyTradeTransfer(targetProfile, resolvedRequest.resolvedSide, resolvedOffer.resolvedSide);

          await saveUsers({
            [message.author.id]: initiatorProfile,
            [targetUser.id]: targetProfile
          });
        } catch (error) {
          await message.channel.send(
            `${EMOJI.laylaHesitant} Trade could not be completed because the database update failed. Please try again.`
          );
          return;
        }

        pendingTrades.delete(tradeId);

        if (trade.timeoutId) {
          clearTimeout(trade.timeoutId);
        }

        trade.stage = "completed";

        await tradeMessage.edit({
          embeds: [buildTradeEmbed(trade, "completed", message.author.username, targetUser.username)],
          components: []
        });

        await message.channel.send(
          `${EMOJI.shenheSmile} Trade completed between ${message.author.username} and ${targetUser.username}.`
        );
        collector.stop("completed");
      }
    });

    collector.on("end", async () => {
      if (pendingTrades.has(tradeId)) {
        pendingTrades.delete(tradeId);
      }

      if (trade.timeoutId) {
        clearTimeout(trade.timeoutId);
      }

      if (trade.stage === "pendingTarget" || trade.stage === "pendingInitiator") {
        try {
          await tradeMessage.edit({ components: [] });
        } catch {
          // Ignore edit errors when the message no longer exists.
        }
      }
    });

    return;
  }

  if (cmd === "characters" || cmd === "roster") {
    const fiveStarRoster = formatRosterEntries(profile.inventory.fiveStar, 9999);
    const fourStarRoster = formatRosterEntries(profile.inventory.fourStar, 9999);
    const hasCharacters = fiveStarRoster.unique > 0 || fourStarRoster.unique > 0;

    if (!hasCharacters) {
      await message.reply(`${EMOJI.laylaSad} No characters owned yet. Use ${PREFIX}wish 1 or ${PREFIX}wish 10 to build your roster.`);
      return;
    }

    const rosterIdPrefix = `roster_${message.id}`;
    let currentSort = "dupes";
    let currentPage = 0;

    const buildRosterPages = (sort) => {
      let five5Entries = Object.entries(profile.inventory.fiveStar).filter(([, count]) => count > 0);
      let five4Entries = Object.entries(profile.inventory.fourStar).filter(([, count]) => count > 0);

      if (sort === "element") {
        five5Entries = five5Entries.sort(([a], [b]) => {
          const elemA = CHARACTER_ELEMENTS[a] || "";
          const elemB = CHARACTER_ELEMENTS[b] || "";
          return elemA.localeCompare(elemB) || a.localeCompare(b);
        });
        five4Entries = five4Entries.sort(([a], [b]) => {
          const elemA = CHARACTER_ELEMENTS[a] || "";
          const elemB = CHARACTER_ELEMENTS[b] || "";
          return elemA.localeCompare(elemB) || a.localeCompare(b);
        });
      } else if (sort === "name") {
        five5Entries = five5Entries.sort(([a], [b]) => a.localeCompare(b));
        five4Entries = five4Entries.sort(([a], [b]) => a.localeCompare(b));
      } else if (sort === "dupes") {
        five5Entries = five5Entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        five4Entries = five4Entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      }

      const allEntries = [...five5Entries, ...five4Entries];
      const pageSize = 10;
      const pages = [];

      for (let i = 0; i < allEntries.length; i += pageSize) {
        pages.push(allEntries.slice(i, i + pageSize));
      }

      return pages.length > 0 ? pages : [[]];
    };

    const buildRosterEmbed = (page, pageNum, totalPages, sort) => {
      const lines = page.map(([name, count]) => {
        const elementKey = CHARACTER_ELEMENTS[name] || "";
        const elementEmoji = elementEmojiForKey(elementKey);
        const constellation = Math.max(0, count - 1);
        const rarity = profile.inventory.fiveStar[name] ? "5★" : "4★";
        const constellationText = constellation > 0 ? ` (C${constellation})` : "";
        return `• ${rarity} ${elementEmoji ? `${elementEmoji} ` : ""}**${name}** x${count}${constellationText}`;
      });

      return new EmbedBuilder()
        .setTitle(`${EMOJI.shenheSmile} Character Roster - Page ${pageNum + 1}/${totalPages}`)
        .setDescription(lines.length > 0 ? lines.join("\n") : "No characters on this page")
        .setFooter({ text: `Sorted by: ${sort} | Total unique: ${fiveStarRoster.unique + fourStarRoster.unique}` })
        .setColor(0x1abc9c);
    };

    const buildSortAndPaginationRows = (currentPages, currentPageNum, sort) => {
      const sortOptions = [
        { label: "By Duplication", value: "dupes", emoji: "📦" },
        { label: "By Rarity", value: "rarity", emoji: "⭐" },
        { label: "By Element", value: "element", emoji: "🌀" },
        { label: "By Name (A-Z)", value: "name", emoji: "🔤" }
      ];

      const rows = [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`${rosterIdPrefix}_sort`)
            .setPlaceholder(`Current sort: ${sortOptions.find((o) => o.value === sort)?.label || "Duplication"}`)
            .addOptions(sortOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
              default: opt.value === sort
            })))
        )
      ];

      if (currentPages.length > 1) {
        rows.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${rosterIdPrefix}_prev`)
              .setLabel("⬅ Previous")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPageNum === 0),
            new ButtonBuilder()
              .setCustomId(`${rosterIdPrefix}_next`)
              .setLabel("Next ➡")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPageNum + 1 >= currentPages.length),
            new ButtonBuilder()
              .setCustomId(`${rosterIdPrefix}_gallery`)
              .setLabel("📸 5-Star Gallery")
              .setStyle(ButtonStyle.Secondary)
          )
        );
      }

      return rows;
    };

    const summaryEmbed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Character Roster`)
      .setDescription(
        [
          `Unique characters: ${fiveStarRoster.unique + fourStarRoster.unique}`,
          `Total character pulls: ${fiveStarRoster.total + fourStarRoster.total}`,
          `5★: ${fiveStarRoster.unique} | 4★: ${fourStarRoster.unique}`,
          "Constellation shown as C(count - 1)."
        ].join("\n")
      )
      .setColor(0x1abc9c);

    await message.reply({ embeds: [summaryEmbed] });

    let pages = buildRosterPages(currentSort);
    let rosterMessage = await message.channel.send({
      embeds: [buildRosterEmbed(pages[currentPage], currentPage, pages.length, currentSort)],
      components: buildSortAndPaginationRows(pages, currentPage, currentSort)
    });

    const collector = rosterMessage.createMessageComponentCollector({ time: 15 * 60 * 1000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.customId.startsWith(rosterIdPrefix)) return;

      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: `${EMOJI.laylaHesitant} This roster belongs to ${message.author.username}.`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.endsWith("_sort")) {
        currentSort = interaction.values[0];
        pages = buildRosterPages(currentSort);
        currentPage = 0;
        await interaction.update({
          embeds: [buildRosterEmbed(pages[currentPage], currentPage, pages.length, currentSort)],
          components: buildSortAndPaginationRows(pages, currentPage, currentSort)
        });
        return;
      }

      if (interaction.customId.endsWith("_prev")) {
        if (currentPage > 0) currentPage -= 1;
        await interaction.update({
          embeds: [buildRosterEmbed(pages[currentPage], currentPage, pages.length, currentSort)],
          components: buildSortAndPaginationRows(pages, currentPage, currentSort)
        });
        return;
      }

      if (interaction.customId.endsWith("_next")) {
        if (currentPage + 1 < pages.length) currentPage += 1;
        await interaction.update({
          embeds: [buildRosterEmbed(pages[currentPage], currentPage, pages.length, currentSort)],
          components: buildSortAndPaginationRows(pages, currentPage, currentSort)
        });
        return;
      }

      if (interaction.customId.endsWith("_gallery")) {
        await interaction.deferReply();
        const ownedFiveStarEntries = Object.entries(profile.inventory.fiveStar)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

        if (ownedFiveStarEntries.length > 0) {
          const galleryPages = chunkArray(ownedFiveStarEntries, 3);

          for (let index = 0; index < galleryPages.length; index += 1) {
            const page = galleryPages[index];
            const names = page.map(([name]) => name);
            const collageBuffer = await buildFiveStarCollage(names);
            const fileName = `five-star-gallery-${index + 1}.png`;
            const attachment = new AttachmentBuilder(collageBuffer, { name: fileName });

            const embedPage = new EmbedBuilder()
              .setTitle(`${EMOJI.shenheGroove} 5★ Gallery ${index + 1}/${galleryPages.length}`)
              .setDescription(page.map(([name, count]) => `**${name}** x${count}`).join(" • "))
              .setColor(0xf39c12)
              .setImage(`attachment://${fileName}`);

            await interaction.followUp({ embeds: [embedPage], files: [attachment] });
          }
        }
        return;
      }
    });

    collector.on("end", async () => {
      try {
        const disabledRows = buildSortAndPaginationRows(pages, currentPage, currentSort).map((row) => {
          const components = row.components.map((comp) => {
            if (comp instanceof StringSelectMenuBuilder) {
              return StringSelectMenuBuilder.from(comp).setDisabled(true);
            }
            if (comp instanceof ButtonBuilder) {
              return ButtonBuilder.from(comp).setDisabled(true);
            }
            return comp;
          });
          return new ActionRowBuilder().addComponents(...components);
        });
        await rosterMessage.edit({ components: disabledRows });
      } catch {
        // Ignore edit errors if message was removed.
      }
    });

    const ownedCharacterNames = [...new Set([
      ...Object.keys(profile.inventory.fiveStar),
      ...Object.keys(profile.inventory.fourStar)
    ])].sort((a, b) => a.localeCompare(b));

    if (ownedCharacterNames.length > 0) {
      const firstCharacter = ownedCharacterNames[0];
      const previewEmbed = new EmbedBuilder()
        .setTitle(`${EMOJI.shenhePeek} Character Preview`)
        .setDescription(`Selected: **${firstCharacter}**\n${characterPreviewDescription(firstCharacter, profile)}`)
        .setColor(0x2f95dc)
        .setImage(characterCardUrl(firstCharacter));

      const pickerIdPrefix = `char_picker_${message.id}`;
      const pickerRows = chunkArray(ownedCharacterNames, 25).map((chunk, index) => (
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`${pickerIdPrefix}_${index}`)
            .setPlaceholder(index === 0 ? "Pick a character to preview" : "More characters")
            .addOptions(chunk.map((name) => ({
              label: name,
              value: name,
              description: `View ${name}`
            })))
        )
      ));

      const pickerMessage = await message.channel.send({ embeds: [previewEmbed], components: pickerRows });

      const pickerCollector = pickerMessage.createMessageComponentCollector({ time: 10 * 60 * 1000 });
      pickerCollector.on("collect", async (interaction) => {
        if (!interaction.customId.startsWith(pickerIdPrefix)) return;

        if (interaction.user.id !== message.author.id) {
          await interaction.reply({
            content: `${EMOJI.laylaHesitant} This picker belongs to ${message.author.username}.`,
            ephemeral: true
          });
          return;
        }

        const selected = interaction.values[0];
        const updatedEmbed = new EmbedBuilder()
          .setTitle(`${EMOJI.shenhePeek} Character Preview`)
          .setDescription(`Selected: **${selected}**\n${characterPreviewDescription(selected, profile)}`)
          .setColor(0x2f95dc)
          .setImage(characterCardUrl(selected));

        await interaction.update({ embeds: [updatedEmbed], components: pickerRows });
      });

      pickerCollector.on("end", async () => {
        try {
          const disabledRows = pickerRows.map((row) => {
            const disabled = StringSelectMenuBuilder.from(row.components[0]).setDisabled(true);
            return new ActionRowBuilder().addComponents(disabled);
          });
          await pickerMessage.edit({ components: disabledRows });
        } catch {
          // Ignore edit errors if message was removed.
        }
      });
    }

    return;
  }

  if (cmd === "wish") {
    const now = Date.now();
    if (now - (profile.lastWishAt || 0) < WISH_COOLDOWN_MS) {
      const remaining = Math.ceil((WISH_COOLDOWN_MS - (now - (profile.lastWishAt || 0))) / 1000);
      await message.reply(`${EMOJI.laylaHesitant} Wish cooldown active. Try again in ${remaining}s.`);
      return;
    }

    const amountArg = Number.parseInt(args[0] || "1", 10);
    const amount = amountArg === 10 ? 10 : 1;
    const cost = amount * WISH_COST;

    if (profile.primogems < cost) {
      await message.reply(
        `${EMOJI.laylaHesitant} You need ${cost} primogems for ${amount} wish(es). Current primogems: ${profile.primogems}`
      );
      return;
    }

    const banner = await getActiveBanner();
    const results = [];

    profile.primogems -= cost;

    for (let i = 0; i < amount; i += 1) {
      results.push(rollWish(profile, banner));
    }

    const levelsGained = gainExp(profile, amount * 12);
    const levelUpPrimos = awardLevelUpPrimos(profile, levelsGained);
  profile.lastWishAt = now;

    await saveUserProfile(message.author.id, profile);

    const highestResult =
      results.find((r) => r.rarity === "5-star") ||
      results.find((r) => r.rarity === "4-star");

    const resultEmbed = buildWishResultEmbed(
      message.author.username,
      amount,
      results,
      profile,
      banner.name,
      levelsGained,
      levelUpPrimos,
      null
    );

    const animationRarity = amount === 10
      ? (results.some((result) => result.rarity === "5-star") ? "5-star" : "4-star")
      : results[0].rarity;

    const attachmentFiles = [];
    let animationImage = null;
    const localGifPath = wishGifFilePath(animationRarity);
    if (localGifPath) {
      const attachmentName = path.basename(localGifPath);
      animationImage = `attachment://${attachmentName}`;
      attachmentFiles.push({ attachment: localGifPath, name: attachmentName });
    } else {
      animationImage = wishGifUrl(animationRarity);
    }

    const animationEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenheGroove} Wish Animation`)
      .setDescription("The wish is unfolding...")
      .setColor(WISH_EMBED_COLOR)
      .setImage(animationImage || (amount === 10 ? characterCardUrl(banner.featuredFiveStar) : wishItemImageUrl(results[0])));

    const revealMessage = await message.channel.send({ embeds: [animationEmbed], files: attachmentFiles });
    await wait(WISH_ANIMATION_WAIT_MS);

    const highlightSummaryBuffer = amount === 10 ? await buildWishHighlightsCollage(results) : null;
    const highlightSummaryAttachment = highlightSummaryBuffer ? new AttachmentBuilder(highlightSummaryBuffer, { name: "wish-summary.png" }) : null;
    const summaryEmbed = amount === 10
      ? buildWishResultEmbed(
          message.author.username,
          amount,
          results,
          profile,
          banner.name,
          levelsGained,
          levelUpPrimos,
          highlightSummaryAttachment ? "attachment://wish-summary.png" : null
        )
      : resultEmbed;

    if (amount !== 10) {
      await message.reply({ embeds: [resultEmbed] });
      return;
    }

    let revealIndex = 0;
    let summaryShown = false;
    const revealIdPrefix = `wish_reveal_${message.id}`;

    const buildRevealRows = (completed, summaryActive = true) => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${revealIdPrefix}_next`)
          .setLabel("⬅ Reveal")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(completed || summaryShown),
        new ButtonBuilder()
          .setCustomId(`${revealIdPrefix}_summary`)
          .setLabel("Summary")
          .setStyle(ButtonStyle.Success)
          .setDisabled(!summaryActive || summaryShown)
      )
    ];

    const showSummary = async (interaction = null) => {
      if (summaryShown) return;
      summaryShown = true;

      const payload = {
        embeds: [summaryEmbed],
        components: buildRevealRows(true, false)
      };

      if (highlightSummaryAttachment) {
        payload.files = [highlightSummaryAttachment];
      }

      if (interaction) {
        await interaction.update(payload);
      } else {
        await revealMessage.edit(payload);
      }

      revealCollector.stop("summary");
    };

    await revealMessage.edit({
      embeds: [buildWishSlideEmbed(message.author.username, banner.name, results, revealIndex)],
      components: buildRevealRows(false)
    });

    let finalized = false;
    const finishReveal = async () => {
      if (finalized) return;
      finalized = true;

      if (summaryShown) {
        return;
      }

      try {
        await revealMessage.edit({ components: buildRevealRows(true, false) });
      } catch {
        // Ignore edit errors if message was removed.
      }
    };

    const revealCollector = revealMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000
    });

    revealCollector.on("collect", async (interaction) => {
      if (!interaction.customId.startsWith(revealIdPrefix)) return;

      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: `${EMOJI.laylaHesitant} This reveal belongs to ${message.author.username}.`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.endsWith("_summary")) {
        await showSummary(interaction);
        return;
      }

      revealIndex = Math.min(revealIndex + 1, results.length - 1);
      const completed = revealIndex >= results.length - 1;

      await interaction.update({
        embeds: [buildWishSlideEmbed(message.author.username, banner.name, results, revealIndex)],
        components: buildRevealRows(completed, true)
      });
    });

    revealCollector.on("end", async () => {
      await finishReveal();
    });

    return;
  }

  if (cmd === "trivia") {
    const now = Date.now();

    if (profile.activeTrivia) {
      await message.reply(`${EMOJI.laylaHesitant} You already have an active trivia. Use the dropdown (or ${PREFIX}answer) first.`);
      return;
    }

    if (now - profile.lastTriviaAt < TRIVIA_COOLDOWN_MS) {
      const remaining = Math.ceil((TRIVIA_COOLDOWN_MS - (now - profile.lastTriviaAt)) / 1000);
      await message.reply(`${EMOJI.laylaHesitant} You can request another trivia in ${remaining}s.`);
      return;
    }

    const trivia = getRandomTrivia();
    const options = buildTriviaOptions(trivia);
    const triviaSessionId = `trivia_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    profile.activeTrivia = {
      sessionId: triviaSessionId,
      question: trivia.question,
      answers: trivia.answers,
      reward: trivia.reward,
      options
    };
    profile.lastTriviaAt = now;
    await saveUserProfile(message.author.id, profile);

    const triviaSelect = new StringSelectMenuBuilder()
      .setCustomId(`trivia_select_${message.author.id}_${triviaSessionId}`)
      .setPlaceholder("Choose your answer")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options.map((option) => ({
        label: option.label.slice(0, 100),
        value: option.value
      })));

    const triviaRow = new ActionRowBuilder().addComponents(triviaSelect);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenheTea} Trivia Time: ${message.author.username}`)
      .setDescription(
        [
          profile.activeTrivia.question,
          "",
          `Pick from the dropdown below.`,
          `Text fallback: ${PREFIX}answer <your answer>`
        ].join("\n")
      )
      .setColor(0x2ecc71)
      .setThumbnail(`${GENSHIN_API_BASE}/characters/traveler-anemo/icon`);

    const triviaMessage = await message.reply({ embeds: [embed], components: [triviaRow] });

    const collector = triviaMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30 * 1000
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId !== `trivia_select_${message.author.id}_${triviaSessionId}`) {
        return;
      }

      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: `${EMOJI.laylaHesitant} This trivia belongs to ${message.author.username}.`,
          ephemeral: true
        });
        return;
      }

      if (!profile.activeTrivia || profile.activeTrivia.sessionId !== triviaSessionId) {
        await interaction.reply({
          content: `${EMOJI.laylaHesitant} This trivia session is no longer active.`,
          ephemeral: true
        });
        collector.stop("resolved");
        return;
      }

      const chosenValue = interaction.values[0];
      const correct = chosenValue === "correct";

      if (correct) {
        profile.primogems += profile.activeTrivia.reward;
        const reward = profile.activeTrivia.reward;
        const levelsGained = gainExp(profile, 20);
        const levelUpPrimos = awardLevelUpPrimos(profile, levelsGained);
        profile.activeTrivia = null;
        await saveUserProfile(message.author.id, profile);

        const levelLine = levelsGained > 0
          ? ` ${EMOJI.shenheTea} Level up by ${levelsGained} to level ${profile.level}. ${EMOJI.primogem} Level-up bonus: +${levelUpPrimos} primogems.`
          : "";

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${EMOJI.shenheSmile} Correct!`)
              .setDescription(
                `You earned ${reward} primogems. ${EMOJI.primogem} Current primogems: ${profile.primogems}.${levelLine}`
              )
              .setColor(0x2ecc71)
          ],
          components: []
        });

        collector.stop("resolved");
        return;
      }

      profile.activeTrivia = null;
      await saveUserProfile(message.author.id, profile);
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${EMOJI.laylaSad} Not quite`)
            .setDescription("No primogems this round. Try another trivia.")
            .setColor(0xe74c3c)
        ],
        components: []
      });

      collector.stop("resolved");
    });

    collector.on("end", async (reason) => {
      if (reason === "resolved") return;
      if (!profile.activeTrivia || profile.activeTrivia.sessionId !== triviaSessionId) return;

      profile.activeTrivia = null;
      await saveUserProfile(message.author.id, profile);

      try {
        await triviaMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${EMOJI.laylaHesitant} Trivia Expired`)
              .setDescription("Time is up. Use the trivia command again.")
              .setColor(0xf39c12)
          ],
          components: []
        });
      } catch {
        // Ignore edit failures when the message is deleted.
      }
    });

    return;
  }

  if (cmd === "answer") {
    if (!profile.activeTrivia) {
      await message.reply(`${EMOJI.laylaHesitant} You do not have an active trivia. Use ${PREFIX}trivia first.`);
      return;
    }

    const userAnswer = normalize(args.join(" "));
    if (!userAnswer) {
      await message.reply(`${EMOJI.laylaHesitant} Please type an answer after the command.`);
      return;
    }

    const correct = isTriviaAnswerCorrect(userAnswer, profile.activeTrivia.answers);

    if (correct) {
      profile.primogems += profile.activeTrivia.reward;
      const reward = profile.activeTrivia.reward;
      const levelsGained = gainExp(profile, 20);
      const levelUpPrimos = awardLevelUpPrimos(profile, levelsGained);
      profile.activeTrivia = null;
      await saveUserProfile(message.author.id, profile);

      const levelLine = levelsGained > 0
        ? ` ${EMOJI.shenheTea} Level up by ${levelsGained} to level ${profile.level}. ${EMOJI.primogem} Level-up bonus: +${levelUpPrimos} primogems.`
        : "";

      await message.reply(`${EMOJI.shenheSmile} Correct. You earned ${reward} primogems. ${EMOJI.primogem} Current primogems: ${profile.primogems}.${levelLine}`);
      return;
    }

    profile.activeTrivia = null;
    await saveUserProfile(message.author.id, profile);
    await message.reply(`${EMOJI.laylaSad} Not quite. No primogems this round. Try another trivia.`);
    return;
  }
});

startHealthServer();
connectDatabase().catch(err => console.error("MongoDB connection failed:", err));
client.login(TOKEN);
