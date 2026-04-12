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
const { getTodayBanner, CHARACTERS, CHARACTER_ELEMENTS } = require("./data/banners");
const { getRandomTrivia } = require("./data/trivia");
const { loadUsers, saveUsers, getProfile, loadUserProfile, saveUserProfile, connectDatabase } = require("./storage");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || "!";
const WISH_COST = 160;
const TRIVIA_COOLDOWN_MS = 60 * 1000;
const ACTIVITY_COOLDOWN_MS = 2 * 60 * 1000;
const ACTIVITY_REWARD_PRIMOS = 8;
const ACTIVITY_REWARD_EXP = 4;
const ACTIVITY_MIN_MESSAGE_LEN = 8;
const LEVEL_UP_REWARD_PRIMOS = Number.parseInt(process.env.LEVEL_UP_REWARD_PRIMOS || "25", 10);
const GENSHIN_API_BASE = "https://genshin.jmp.blue";
const WISH_ANIMATION_WAIT_MS = Number.parseInt(process.env.WISH_ANIMATION_WAIT_MS || "7000", 10);
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

const CHARACTER_SLUG_OVERRIDES = {
  "raiden shogun": "raiden",
  "hu tao": "hu-tao",
  "kuki shinobu": "kuki-shinobu",
  "mizuki": "yumemizuki-mizuki",
  "yun jin": "yun-jin",
  "yae miko": "yae-miko",
  "shikanoin heizou": "shikanoin-heizou"
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

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
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

function buildWishResultEmbed(username, count, results, profile, bannerName, levelsGained, levelUpPrimos) {
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

  const rarityColor = summary.five > 0 ? 0xf39c12 : summary.four > 0 ? 0x3498db : 0x95a5a6;
  const embed = new EmbedBuilder()
    .setTitle(`${EMOJI.shenhePeek} ${username}'s Wish Results`)
    .setDescription(`**${count} wishes** on **${bannerName}**`)
    .setColor(rarityColor)
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

  if (count === 1 && results[0]) {
    embed.setImage(wishItemImageUrl(results[0]));
  }

  return embed;
}

function buildWishHighlightEmbeds(results) {
  return results
    .filter((result) => result.rarity !== "3-star")
    .slice(0, 10)
    .map((result, index) => {
      const color = result.rarity === "5-star" ? 0xf39c12 : 0x3498db;
      const elementKey = CHARACTER_ELEMENTS[result.item] || "";
      const elementEmoji = elementEmojiForKey(elementKey);
      const elementText = elementKey ? `${elementEmoji} ${titleCase(elementKey)}` : "Unknown Element";
      return new EmbedBuilder()
        .setTitle(`Highlight ${index + 1}: ${result.item}`)
        .setDescription(`${result.rarity}${result.featured ? " (featured)" : ""}\n${elementText}`)
        .setColor(color)
        .setImage(characterCardUrl(result.item));
    });
}

function buildWishSlideEmbed(username, bannerName, results, index) {
  const result = results[index];
  const elementKey = CHARACTER_ELEMENTS[result.item] || "";
  const elementEmoji = elementEmojiForKey(elementKey);
  const elementText = elementKey ? `${elementEmoji} ${titleCase(elementKey)}` : "N/A";
  const color = result.rarity === "5-star" ? 0xf39c12 : result.rarity === "4-star" ? 0x3498db : 0x95a5a6;

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJI.shenheGroove} ${username}'s 10-Pull Reveal`)
    .setDescription(
      [
        `Pull **${index + 1}/${results.length}**`,
        `Result: **${result.item}**`,
        `Rarity: **${result.rarity}**${result.featured ? " (featured)" : ""}`,
        `Element: ${elementText}`
      ].join("\n")
    )
    .setColor(color)
    .setFooter({ text: `${bannerName} • Use Reveal to continue or Skip to jump to highlights` });

  const imageUrl = wishItemImageUrl(result);
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Pools loaded -> 5-star: ${ACTIVE_POOLS.fiveStarStandard.length}, 4-star: ${ACTIVE_POOLS.fourStarPool.length}`);
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
    await message.reply(
      [
        `${EMOJI.shenheSmile} Genshin Wish Bot Commands`,
        `${PREFIX}banner - show active banner`,
        `${PREFIX}wish [1|10] - spend primogems to wish`,
        `${PREFIX}trivia - get a trivia question for primogems`,
        `${PREFIX}answer <text> - answer active trivia`,
        `${PREFIX}characters - show your owned character roster`,
        `${PREFIX}profile - show your primogems, pity, and inventory`,
        `Passive rewards: chat messages (>=${ACTIVITY_MIN_MESSAGE_LEN} chars) earn ${ACTIVITY_REWARD_PRIMOS} primogems every ${Math.floor(ACTIVITY_COOLDOWN_MS / 60000)} min`
      ].join("\n")
    );
    return;
  }

  if (cmd === "banner") {
    const banner = getTodayBanner();

    const embed = new EmbedBuilder()
      .setTitle(`Today's Banner: ${banner.name}`)
      .setDescription(
        [
          `${EMOJI.shenheGroove} Featured 5-star: ${banner.featuredFiveStar}`,
          `${EMOJI.laylaConfident} Featured 4-stars: ${banner.featuredFourStars.join(", ")}`,
          `${EMOJI.primogem} Wish cost: ${WISH_COST} primogems per pull`
        ].join("\n")
      )
      .setColor(0xf1c40f)
      .setImage(characterCardUrl(banner.featuredFiveStar));

    await message.reply({ embeds: [embed] });
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
      .setDescription(`${EMOJI.primogem} **Primogems:** ${profile.primogems}`)
      .addFields(
        {
          name: `${EMOJI.shenheSmile} Progress`,
          value: `**Level:** ${profile.level}\n**EXP:** ${profile.exp} / ${profile.level * 100}\n**Total wishes:** ${profile.wishes}`,
          inline: false
        },
        {
          name: `${EMOJI.laylaHesitant} Pity & Guarantee`,
          value: `5-star: **${profile.pity5}/90**\n4-star: **${profile.pity4}/10**\nFeatured guarantee: **${profile.guaranteedFeatured5 ? "ON" : "OFF"}**`,
          inline: false
        },
        {
          name: `${EMOJI.laylaConfident} Inventory Totals`,
          value: `5-star: **${fiveStarCount}**\n4-star: **${fourStarCount}**\n3-star: **${threeStarCount}**`,
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

  if (cmd === "characters" || cmd === "roster") {
    const fiveStarRoster = formatRosterEntries(profile.inventory.fiveStar);
    const fourStarRoster = formatRosterEntries(profile.inventory.fourStar);
    const hasCharacters = fiveStarRoster.unique > 0 || fourStarRoster.unique > 0;

    if (!hasCharacters) {
      await message.reply(`${EMOJI.laylaSad} No characters owned yet. Use ${PREFIX}wish 1 or ${PREFIX}wish 10 to build your roster.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Character Roster`)
      .setDescription(
        [
          `Unique characters: ${fiveStarRoster.unique + fourStarRoster.unique}`,
          `Total character pulls: ${fiveStarRoster.total + fourStarRoster.total}`,
          "Constellation shown as C(count - 1)."
        ].join("\n")
      )
      .setColor(0x1abc9c)
      .addFields(
        {
          name: `5★ Characters (${fiveStarRoster.unique})`,
          value: fiveStarRoster.lines.length ? fiveStarRoster.lines.join("\n") : "None yet",
          inline: false
        },
        {
          name: `4★ Characters (${fourStarRoster.unique})`,
          value: fourStarRoster.lines.length ? fourStarRoster.lines.join("\n") : "None yet",
          inline: false
        }
      );

    await message.reply({ embeds: [embed] });

    const ownedFiveStarEntries = Object.entries(profile.inventory.fiveStar)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    if (ownedFiveStarEntries.length > 0) {
      const pages = chunkArray(ownedFiveStarEntries, 3);

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const names = page.map(([name]) => name);
        const collageBuffer = await buildFiveStarCollage(names);
        const fileName = `five-star-gallery-${index + 1}.png`;
        const attachment = new AttachmentBuilder(collageBuffer, { name: fileName });

        const embedPage = new EmbedBuilder()
          .setTitle(`${EMOJI.shenheGroove} 5★ Gallery ${index + 1}/${pages.length}`)
          .setDescription(page.map(([name, count]) => `**${name}** x${count}`).join(" • "))
          .setColor(0xf39c12)
          .setImage(`attachment://${fileName}`);

        await message.channel.send({ embeds: [embedPage], files: [attachment] });
      }
    }

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

      const collector = pickerMessage.createMessageComponentCollector({ time: 10 * 60 * 1000 });
      collector.on("collect", async (interaction) => {
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

      collector.on("end", async () => {
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
    const amountArg = Number.parseInt(args[0] || "1", 10);
    const amount = amountArg === 10 ? 10 : 1;
    const cost = amount * WISH_COST;

    if (profile.primogems < cost) {
      await message.reply(
        `${EMOJI.laylaHesitant} You need ${cost} primogems for ${amount} wish(es). Current primogems: ${profile.primogems}`
      );
      return;
    }

    const banner = getTodayBanner();
    const results = [];

    profile.primogems -= cost;

    for (let i = 0; i < amount; i += 1) {
      results.push(rollWish(profile, banner));
    }

    const levelsGained = gainExp(profile, amount * 12);
    const levelUpPrimos = awardLevelUpPrimos(profile, levelsGained);

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
      levelUpPrimos
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

    const animationColor = animationRarity === "5-star" ? 0xf39c12 : animationRarity === "4-star" ? 0x3498db : 0x95a5a6;
    const animationEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenheGroove} Wish Animation`)
      .setDescription("The wish is unfolding...")
      .setColor(animationColor)
      .setImage(animationImage || (amount === 10 ? characterCardUrl(banner.featuredFiveStar) : wishItemImageUrl(results[0])));

    await message.channel.send({ embeds: [animationEmbed], files: attachmentFiles });
    await wait(WISH_ANIMATION_WAIT_MS);

    const highlightEmbeds = buildWishHighlightEmbeds(results);

    if (amount !== 10) {
      if (highlightEmbeds.length > 0) {
        await message.channel.send({ embeds: highlightEmbeds });
      }

      await message.reply({ embeds: [resultEmbed] });
      return;
    }

    let revealIndex = 0;
    const revealIdPrefix = `wish_reveal_${message.id}`;

    const buildRevealRows = (completed) => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${revealIdPrefix}_next`)
          .setLabel("⬅ Reveal")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(completed),
        new ButtonBuilder()
          .setCustomId(`${revealIdPrefix}_skip`)
          .setLabel("Skip")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(completed)
      )
    ];

    const revealMessage = await message.channel.send({
      embeds: [buildWishSlideEmbed(message.author.username, banner.name, results, revealIndex)],
      components: buildRevealRows(false)
    });

    let finalized = false;
    const finishReveal = async () => {
      if (finalized) return;
      finalized = true;

      try {
        await revealMessage.edit({ components: buildRevealRows(true) });
      } catch {
        // Ignore edit errors if message was removed.
      }

      if (highlightEmbeds.length > 0) {
        await message.channel.send({ embeds: highlightEmbeds });
      }

      await message.reply({ embeds: [resultEmbed] });
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

      if (interaction.customId.endsWith("_skip")) {
        await interaction.update({
          embeds: [buildWishSlideEmbed(message.author.username, banner.name, results, revealIndex)],
          components: buildRevealRows(true)
        });
        revealCollector.stop("skipped");
        return;
      }

      revealIndex = Math.min(revealIndex + 1, results.length - 1);
      const completed = revealIndex >= results.length - 1;

      await interaction.update({
        embeds: [buildWishSlideEmbed(message.author.username, banner.name, results, revealIndex)],
        components: buildRevealRows(completed)
      });

      if (completed) {
        revealCollector.stop("completed");
      }
    });

    revealCollector.on("end", async () => {
      await finishReveal();
    });

    return;
  }

  if (cmd === "trivia") {
    const now = Date.now();

    if (now - profile.lastTriviaAt < TRIVIA_COOLDOWN_MS) {
      const remaining = Math.ceil((TRIVIA_COOLDOWN_MS - (now - profile.lastTriviaAt)) / 1000);
      await message.reply(`${EMOJI.laylaHesitant} You can request another trivia in ${remaining}s.`);
      return;
    }

    const trivia = getRandomTrivia();
    profile.activeTrivia = trivia;
    profile.lastTriviaAt = now;
    await saveUserProfile(message.author.id, profile);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJI.shenheTea} Trivia Time: ${message.author.username}`)
      .setDescription(
        [
          trivia.question,
          "",
          `Answer with: ${PREFIX}answer <your answer>`
        ].join("\n")
      )
      .setColor(0x2ecc71)
      .setThumbnail(`${GENSHIN_API_BASE}/characters/traveler-anemo/icon`);

    await message.reply({ embeds: [embed] });
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

    const correct = profile.activeTrivia.answers.includes(userAnswer);

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
