const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

const ELEMENTS = ["PYRO", "HYDRO", "CRYO", "ELECTRO", "DENDRO", "ANEMO", "GEO"];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const LOBBY_TIMEOUT_MS = 45 * 1000;
const ROUND_COUNT = 5;
const TURN_ACTION_TIMEOUT_MS = 25 * 1000;
const BOSS_ART_FILE = path.resolve(__dirname, "..", "..", "311882f16264d6498dcf1ae277b9e031_3641850878197328239.webp");

const activeClashByChannel = new Map();

const BOSS_NAMES = [
  "Abyssal Warden",
  "Elemental Tyrant",
  "Primordial Behemoth",
  "Crimson Ruin Sentinel",
  "Stormbound Colossus",
  "Void-Edge Sovereign",
  "Twilight Devourer"
];

const MOVE_LABELS = {
  attack: "Attack",
  skill: "Skill",
  burst: "Burst",
  guard: "Guard"
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function normalize(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isPlayerReady(profile) {
  return Object.keys(profile.inventory.fiveStar || {}).length > 0 || Object.keys(profile.inventory.fourStar || {}).length > 0;
}

function getOwnedCharacterEntries(profile) {
  const entries = [];

  for (const [name, count] of Object.entries(profile.inventory.fiveStar || {})) {
    if (count > 0) {
      entries.push({ name, count, rarity: "fiveStar" });
    }
  }

  for (const [name, count] of Object.entries(profile.inventory.fourStar || {})) {
    if (count > 0) {
      entries.push({ name, count, rarity: "fourStar" });
    }
  }

  return entries.sort((left, right) => {
    const rarityRank = (value) => (value === "fiveStar" ? 2 : 1);
    return right.count - left.count || rarityRank(right.rarity) - rarityRank(left.rarity) || left.name.localeCompare(right.name);
  });
}

function getLeadCharacter(profile, characterElements) {
  const entries = getOwnedCharacterEntries(profile);
  if (!entries.length) return null;

  const chosen = entries[0];
  const element = characterElements[chosen.name] || "ANEMO";
  const copies = chosen.count;

  return {
    name: chosen.name,
    rarity: chosen.rarity,
    copies,
    element,
    power: (chosen.rarity === "fiveStar" ? 122 : 100) + Math.min(24, (copies - 1) * 4)
  };
}

function getCharacterByName(profile, characterElements, characterName) {
  const entries = getOwnedCharacterEntries(profile);
  const picked = entries.find((entry) => normalize(entry.name) === normalize(characterName));
  if (!picked) return null;

  return {
    name: picked.name,
    rarity: picked.rarity,
    copies: picked.count,
    element: characterElements[picked.name] || "ANEMO",
    power: (picked.rarity === "fiveStar" ? 122 : 100) + Math.min(24, (picked.count - 1) * 4)
  };
}

function buildCharacterSelectOptions(profile, limit = 25) {
  return getOwnedCharacterEntries(profile)
    .slice(0, limit)
    .map((entry) => ({
      label: entry.name,
      value: entry.name,
      description: `x${entry.count} • ${entry.rarity === "fiveStar" ? "5-star" : "4-star"}`
    }));
}

function getElementLabel(element) {
  return titleCase(element || "Unknown");
}

function getReaction(leftElement, rightElement) {
  const a = String(leftElement || "").toUpperCase();
  const b = String(rightElement || "").toUpperCase();

  if (!a || !b || a === b) {
    return null;
  }

  const sorted = [a, b].sort().join("-");

  switch (sorted) {
    case "CRYO-PYRO":
      return { name: "Melt", multiplier: 1.55 };
    case "HYDRO-PYRO":
      return { name: "Vaporize", multiplier: 1.45 };
    case "CRYO-HYDRO":
      return { name: "Freeze", multiplier: 1.18 };
    case "DENDRO-HYDRO":
      return { name: "Bloom", multiplier: 1.24 };
    case "DENDRO-ELECTRO":
      return { name: "Quicken", multiplier: 1.28 };
    case "DENDRO-PYRO":
      return { name: "Burning", multiplier: 1.18 };
    case "ELECTRO-HYDRO":
      return { name: "Electro-Charged", multiplier: 1.25 };
    case "ANEMO-CRYO":
    case "ANEMO-DENDRO":
    case "ANEMO-ELECTRO":
    case "ANEMO-HYDRO":
    case "ANEMO-PYRO":
      return { name: "Swirl", multiplier: 1.14 };
    case "ANEMO-GEO":
      return { name: "Crystallize", multiplier: 1.08 };
    case "GEO-CRYO":
    case "GEO-DENDRO":
    case "GEO-ELECTRO":
    case "GEO-HYDRO":
    case "GEO-PYRO":
      return { name: "Crystallize", multiplier: 1.1 };
    default:
      return null;
  }
}

function chooseBoss() {
  const resistance = pick(ELEMENTS);
  const weakElements = shuffle(ELEMENTS.filter((element) => element !== resistance)).slice(0, 2);
  const aura = pick(ELEMENTS.filter((element) => element !== resistance));

  return {
    name: pick(BOSS_NAMES),
    resistance,
    weakElements,
    aura,
    maxHp: 2200 + Math.floor(Math.random() * 350)
  };
}

function getMoveForPlayer(player, round) {
  const resolveRatio = player.resolve / player.maxResolve;
  const burstReady = player.burstCharge > 0;
  const roll = Math.random();

  if (resolveRatio < 0.3 && roll < 0.45) {
    return { kind: "guard", base: 0.0 };
  }

  if (burstReady && (round >= 3 || roll < 0.22)) {
    return { kind: "burst", base: 220.0 };
  }

  if (roll < 0.45) {
    return { kind: "skill", base: 162.0 };
  }

  return { kind: "attack", base: 118.0 };
}

function formatPlayerLabel(player) {
  return `${player.displayName} (${player.character.name} ${getElementLabel(player.element)})`;
}

function bossElementMultiplier(element, boss) {
  const upper = String(element || "").toUpperCase();
  if (upper === boss.resistance) return 0.72;
  if (boss.weakElements.includes(upper)) return 1.38;
  return 1.0;
}

function buildBattleCardSvg({ boss, hpRemaining, round, totalRounds, fieldAura, players, combatLog }) {
  const hpPct = Math.max(0, Math.min(1, hpRemaining / boss.maxHp));
  const hpBarWidth = Math.round(420 * hpPct);
  const weakText = boss.weakElements.map(getElementLabel).join(", ");
  const playerLines = players.map((player) => `${player.displayName} - ${player.character.name} (${getElementLabel(player.element)})`);
  const logLines = combatLog.slice(-6);

  const playerMarkup = playerLines.slice(0, 4).map((line, index) => {
    const y = 505 + index * 34;
    return `<text x="58" y="${y}" fill="#e9eefc" font-size="22" font-weight="600">${escapeXml(line)}</text>`;
  }).join("\n");

  const logMarkup = logLines.slice(0, 6).map((line, index) => {
    const y = 660 + index * 24;
    return `<text x="58" y="${y}" fill="#d2d8ea" font-size="18">${escapeXml(line)}</text>`;
  }).join("\n");

  return `
  <svg width="1400" height="800" viewBox="0 0 1400 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#090b11" />
        <stop offset="100%" stop-color="#171a27" />
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(7,9,14,0.97)" />
        <stop offset="100%" stop-color="rgba(18,22,34,0.88)" />
      </linearGradient>
      <linearGradient id="hp" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ff6a4d" />
        <stop offset="100%" stop-color="#c0392b" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.55" />
      </filter>
    </defs>

    <rect width="1400" height="800" fill="url(#bg)" />
    <rect x="0" y="0" width="710" height="800" fill="url(#panel)" />
    <rect x="700" y="0" width="700" height="800" fill="#0c0f16" />

    <rect x="650" y="0" width="110" height="800" fill="url(#panel)" />

    <rect x="46" y="40" rx="20" ry="20" width="610" height="90" fill="#171c2a" opacity="0.95" filter="url(#shadow)" />
    <text x="58" y="92" fill="#ffffff" font-size="42" font-weight="800">${escapeXml(boss.name)}</text>
    <text x="58" y="120" fill="#ffcf70" font-size="20" font-weight="700">Round ${round} / ${totalRounds}</text>

    <text x="58" y="170" fill="#d9dfef" font-size="23" font-weight="700">HP</text>
    <rect x="58" y="184" width="420" height="24" rx="12" fill="#293042" />
    <rect x="58" y="184" width="${hpBarWidth}" height="24" rx="12" fill="url(#hp)" />
    <text x="494" y="203" fill="#ffffff" font-size="19" font-weight="700">${Math.max(0, Math.round(hpRemaining))} / ${boss.maxHp}</text>

    <text x="58" y="255" fill="#ffac73" font-size="22" font-weight="700">Resistance</text>
    <text x="220" y="255" fill="#ffffff" font-size="22" font-weight="600">${escapeXml(getElementLabel(boss.resistance))}</text>

    <text x="58" y="295" fill="#8fd3ff" font-size="22" font-weight="700">Weaknesses</text>
    <text x="220" y="295" fill="#ffffff" font-size="22" font-weight="600">${escapeXml(weakText)}</text>

    <text x="58" y="335" fill="#d7f58d" font-size="22" font-weight="700">Field Aura</text>
    <text x="220" y="335" fill="#ffffff" font-size="22" font-weight="600">${escapeXml(getElementLabel(fieldAura))}</text>

    <text x="58" y="390" fill="#f0f4ff" font-size="24" font-weight="800">Party</text>
    ${playerMarkup}

    <text x="58" y="612" fill="#f0f4ff" font-size="24" font-weight="800">Combat Log</text>
    ${logMarkup}
  </svg>`;
}

async function renderBossCardBuffer(session) {
  const artExists = fs.existsSync(BOSS_ART_FILE);
  const bossArtBuffer = artExists
    ? await sharp(BOSS_ART_FILE)
        .resize(720, 800, { fit: "cover" })
        .png()
        .toBuffer()
    : await sharp({
        create: {
          width: 720,
          height: 800,
          channels: 4,
          background: { r: 18, g: 20, b: 30, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

  const cardSvg = buildBattleCardSvg({
    boss: session.boss,
    hpRemaining: session.hpRemaining,
    round: session.round,
    totalRounds: session.totalRounds,
    fieldAura: session.fieldAura,
    players: session.players,
    combatLog: session.combatLog
  });
  const overlay = Buffer.from(cardSvg);

  return sharp({
    create: {
      width: 1400,
      height: 800,
      channels: 4,
      background: { r: 7, g: 9, b: 14, alpha: 1 }
    }
  })
    .composite([
      { input: bossArtBuffer, left: 680, top: 0 },
      { input: overlay, left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
}

function createPlayerState(user, profile, characterElements, preferredCharacterName = null) {
  const selected = preferredCharacterName
    ? getCharacterByName(profile, characterElements, preferredCharacterName)
    : null;
  const lead = selected || getLeadCharacter(profile, characterElements);
  if (!lead) return null;

  const resolve = 260 + (profile.level * 10) + (lead.rarity === "fiveStar" ? 40 : 10);
  return {
    userId: user.id,
    displayName: user.username,
    profile,
    character: lead,
    element: lead.element,
    resolve,
    maxResolve: resolve,
    shield: 0,
    burstCharge: lead.rarity === "fiveStar" ? 2 : 1,
    damageDone: 0,
    active: true
  };
}

function buildLobbyEmbed(session, emoji) {
  const playerLines = session.players.map((player) => `• ${player.displayName} - ${player.character.name} (${getElementLabel(player.element)})`).join("\n");

  return new EmbedBuilder()
    .setTitle(`${emoji?.shenheGroove || "Elemental Clash"} Elemental Clash Lobby`)
    .setDescription(
      [
        "Join the raid, choose your character from your dropdown, then start.",
        "",
        `Players: **${session.players.length}/${MAX_PLAYERS}**`,
        `Need at least **${MIN_PLAYERS}** players to start.`,
        "",
        playerLines || "No players yet"
      ].join("\n")
    )
    .setColor(0x7c2d12);
}

function buildFinalEmbed(session, emoji, outcomeText) {
  const winners = session.players.filter((player) => player.active).map((player) => player.displayName);
  const losers = session.players.filter((player) => !player.active).map((player) => player.displayName);

  return new EmbedBuilder()
    .setTitle(`${emoji?.shenheSmile || "Elemental Clash"} Elemental Clash Result`)
    .setDescription(
      [
        outcomeText,
        "",
        winners.length ? `Active players: ${winners.join(", ")}` : "No active players survived.",
        losers.length ? `Knocked out: ${losers.join(", ")}` : "",
        `Boss resistance: ${getElementLabel(session.boss.resistance)}`,
        `Boss weaknesses: ${session.boss.weakElements.map(getElementLabel).join(", ")}`
      ]
        .filter(Boolean)
        .join("\n")
    )
    .setColor(session.bossHp <= 0 ? 0x2ecc71 : 0xe74c3c);
}

function chooseReactionBonus(previousElement, currentElement, auraElement) {
  const reactions = [];
  const prevReaction = getReaction(previousElement, currentElement);
  if (prevReaction) reactions.push(prevReaction);

  const auraReaction = getReaction(auraElement, currentElement);
  if (auraReaction) reactions.push(auraReaction);

  if (!reactions.length) {
    return { name: null, multiplier: 1 };
  }

  const best = reactions.reduce((winner, candidate) => (candidate.multiplier > winner.multiplier ? candidate : winner));
  let multiplier = best.multiplier;
  if (reactions.length > 1) {
    multiplier += 0.08;
  }

  return {
    name: best.name,
    multiplier: Math.min(2.05, multiplier)
  };
}

function chooseMoveType(player) {
  const ratio = player.resolve / player.maxResolve;
  const roll = Math.random();

  if (ratio < 0.35 && roll < 0.45) return { type: "guard", baseDamage: 0 };
  if (player.burstCharge > 0 && (roll < 0.22 || ratio > 0.72)) return { type: "burst", baseDamage: 222 };
  if (roll < 0.55) return { type: "skill", baseDamage: 160 };
  return { type: "attack", baseDamage: 118 };
}

function calcCharacterPower(player) {
  const rarityBonusBase = player.character.rarity === "fiveStar" ? 0.18 : 0.1;
  const rarityScale = player.character.rarity === "fourStar" ? 0.8 : 1.0;
  const rarityBonus = rarityBonusBase * rarityScale;
  const copyBonus = Math.min(0.1, Math.max(0, player.character.copies - 1) * 0.012);
  const levelBonus = Math.min(0.08, player.profile.level * 0.004);
  return 1 + rarityBonus + copyBonus + levelBonus;
}

function getCharacterDamageVariance(rarity) {
  if (rarity === "fiveStar") {
    return 0.7 + Math.random() * 0.6;
  }
  return 0.9 + Math.random() * 0.2;
}

function getCharacterWinRate(rarity) {
  if (rarity === "fiveStar") {
    return 0.75;
  }
  return 0.65;
}

function calcMoveMultiplier(moveType) {
  switch (moveType) {
    case "attack":
      return 1;
    case "skill":
      return 1.2;
    case "burst":
      return 1.55;
    case "guard":
      return 0.18;
    default:
      return 1;
  }
}

function formatRoundLine(player, move, damage, reactionName, counterDamage, resolveAfter) {
  const reactionText = reactionName ? ` with ${reactionName}` : "";
  const counterText = counterDamage > 0 ? ` | counter ${counterDamage}` : "";
  return `${player.displayName}: ${MOVE_LABELS[move.type]}${reactionText} for ${damage}${counterText} | resolve ${Math.max(0, Math.round(resolveAfter))}`;
}

async function grantRewards(session, saveUserProfile, loadUsers, getProfile, emoji, won) {
  const baseReward = won ? 3000 : 500;
  const roundBonus = session.round * (won ? 300 : 50);
  const difficultyBonus = won ? 500 : 0;
  const reward = baseReward + roundBonus + difficultyBonus;
  const users = await loadUsers();

  for (const player of session.players) {
    const profile = await getProfile(users, player.userId);
    profile.primogems += reward;
    await saveUserProfile(player.userId, profile);
  }

  const text = won
    ? `${emoji?.primogem || ""} Team clear reward: **${reward}** primogems each (base ${baseReward} + round ${roundBonus} + bonus ${difficultyBonus}).`
    : `${emoji?.primogem || ""} Consolation reward: **${reward}** primogems each (base ${baseReward} + round ${roundBonus}).`;

  return text;
}

async function startElementalClashSession({
  message,
  profile,
  loadUsers,
  getProfile,
  saveUserProfile,
  prefix,
  emoji,
  characterElements
}) {
  if (activeClashByChannel.has(message.channel.id)) {
    await message.reply(`${emoji.laylaHesitant} Another Elemental Clash is already running in this channel.`);
    return;
  }

  if (!isPlayerReady(profile)) {
    await message.reply(`${emoji.laylaHesitant} You need at least one character before starting Elemental Clash.`);
    return;
  }

  const session = {
    channelId: message.channel.id,
    initiatorId: message.author.id,
    players: [],
    boss: null,
    bossHp: 0,
    round: 0,
    combatLog: [],
    active: true,
    lobbyMessage: null,
    collector: null,
    battleStarted: false,
    timeoutId: null,
    customIdPrefix: `clash_${message.id}`
  };

  const initiator = createPlayerState(message.author, profile, characterElements);
  if (!initiator) {
    await message.reply(`${emoji.laylaHesitant} You need at least one owned character to join Elemental Clash.`);
    return;
  }

  session.players.push(initiator);
  activeClashByChannel.set(message.channel.id, session);

  const buildRows = (locked = false) => {
    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${session.customIdPrefix}_join`)
          .setLabel("Join")
          .setStyle(ButtonStyle.Success)
          .setDisabled(locked),
        new ButtonBuilder()
          .setCustomId(`${session.customIdPrefix}_leave`)
          .setLabel("Leave")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(locked),
        new ButtonBuilder()
          .setCustomId(`${session.customIdPrefix}_start`)
          .setLabel("Start")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(locked || message.author.id !== session.initiatorId || session.players.length < MIN_PLAYERS),
        new ButtonBuilder()
          .setCustomId(`${session.customIdPrefix}_cancel`)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(locked || message.author.id !== session.initiatorId)
      )
    ];

    for (const player of session.players) {
      const options = buildCharacterSelectOptions(player.profile);
      if (!options.length) {
        continue;
      }

      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`${session.customIdPrefix}_pick_${player.userId}`)
            .setPlaceholder(`${player.displayName} choose character`)
            .setMinValues(1)
            .setMaxValues(1)
            .setDisabled(locked)
            .addOptions(options.map((option) => ({
              ...option,
              default: normalize(player.character.name) === normalize(option.value)
            })))
        )
      );
    }

    return rows;
  };

  const lobbyMessage = await message.reply({
    embeds: [buildLobbyEmbed(session, emoji)],
    components: buildRows(false),
    files: [new AttachmentBuilder(BOSS_ART_FILE, { name: "boss-preview.webp" })]
  });

  session.lobbyMessage = lobbyMessage;

  const refreshLobby = async () => {
    try {
      await lobbyMessage.edit({
        embeds: [buildLobbyEmbed(session, emoji)],
        components: buildRows(false)
      });
    } catch {
      // Ignore edit errors when the message is removed.
    }
  };

  const cleanup = async () => {
    activeClashByChannel.delete(message.channel.id);
    session.active = false;

    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    if (session.collector) {
      session.collector.stop("cleanup");
    }

    try {
      await lobbyMessage.edit({ components: [] });
    } catch {
      // Ignore edit errors when the message is removed.
    }
  };

  const startBattle = async () => {
    session.battleStarted = true;
    session.boss = chooseBoss();
    session.bossHp = session.boss.maxHp;

    try {
      await lobbyMessage.edit({
        embeds: [new EmbedBuilder()
          .setTitle(`${emoji.shenheGroove} Elemental Clash`)
          .setDescription(`The boss has appeared. Each player now chooses actions with buttons.`)
          .setColor(0x8b1e1e)
          .setImage("attachment://boss-preview.webp")],
        components: []
      });
    } catch {
      // Ignore edit errors when the message is removed.
    }

    const battleMessage = lobbyMessage;
    const totalRounds = ROUND_COUNT;

    for (let round = 1; round <= totalRounds; round += 1) {
      session.round = round;
      const fieldAura = pick(ELEMENTS);
      const roundLog = [];
      let previousElement = null;

      for (const player of session.players) {
        if (!player.active) {
          continue;
        }

        const turnPrefix = `${session.customIdPrefix}_turn_${round}_${player.userId}`;
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${turnPrefix}_attack`).setLabel("Attack").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`${turnPrefix}_skill`).setLabel("Skill").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`${turnPrefix}_burst`).setLabel("Burst").setStyle(ButtonStyle.Danger).setDisabled(player.burstCharge <= 0),
          new ButtonBuilder().setCustomId(`${turnPrefix}_guard`).setLabel("Defend").setStyle(ButtonStyle.Secondary)
        );

        const turnPrompt = new EmbedBuilder()
          .setTitle(`${emoji.shenheTea} ${player.displayName}'s Turn`)
          .setDescription(
            [
              `Character: **${player.character.name}** (${getElementLabel(player.element)})`,
              `Resolve: **${Math.round(player.resolve)} / ${player.maxResolve}**`,
              `Burst Charges: **${player.burstCharge}**`,
              `Boss HP: **${Math.max(0, session.bossHp)} / ${session.boss.maxHp}**`,
              `Boss Resistance: **${getElementLabel(session.boss.resistance)}**`,
              `Boss Weaknesses: **${session.boss.weakElements.map(getElementLabel).join(", ")}**`,
              `Field Aura: **${getElementLabel(fieldAura)}**`,
              "",
              `You have ${Math.floor(TURN_ACTION_TIMEOUT_MS / 1000)}s to choose. Default is Attack.`
            ].join("\n")
          )
          .setColor(0x5865f2);

        await battleMessage.edit({ embeds: [turnPrompt], components: [actionRow] });

        let selectedMoveType = "attack";
        const turnCollector = battleMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: TURN_ACTION_TIMEOUT_MS
        });

        await new Promise((resolveTurn) => {
          turnCollector.on("collect", async (interaction) => {
            if (!interaction.customId.startsWith(turnPrefix)) {
              return;
            }

            if (interaction.user.id !== player.userId) {
              await interaction.reply({
                content: `${emoji.laylaHesitant} It is currently ${player.displayName}'s turn.`,
                ephemeral: true
              });
              return;
            }

            const moveType = interaction.customId.split("_").pop();
            if (!["attack", "skill", "burst", "guard"].includes(moveType)) {
              await interaction.reply({
                content: `${emoji.laylaHesitant} Invalid action.`,
                ephemeral: true
              });
              return;
            }

            if (moveType === "burst" && player.burstCharge <= 0) {
              await interaction.reply({
                content: `${emoji.laylaHesitant} You have no burst charges right now.`,
                ephemeral: true
              });
              return;
            }

            selectedMoveType = moveType;
            await interaction.deferUpdate();
            turnCollector.stop("selected");
          });

          turnCollector.on("end", () => {
            resolveTurn();
          });
        });

        await battleMessage.edit({ components: [] });

        const moveBase = {
          attack: 118,
          skill: 160,
          burst: 222,
          guard: 0
        };

        const move = {
          type: selectedMoveType,
          baseDamage: moveBase[selectedMoveType] ?? 118
        };

        if (move.type === "burst") {
          player.burstCharge = Math.max(0, player.burstCharge - 1);
        }

        const reaction = chooseReactionBonus(previousElement, player.element, fieldAura);
        const elementMultiplier = bossElementMultiplier(player.element, session.boss);
        const power = calcCharacterPower(player);
        const variance = getCharacterDamageVariance(player.character.rarity);
        const moveMultiplier = calcMoveMultiplier(move.type);
        const winRate = getCharacterWinRate(player.character.rarity);
        const isSuccessHit = Math.random() < winRate;

        let damage = Math.round(move.baseDamage * moveMultiplier * power * elementMultiplier * reaction.multiplier * variance);
        if (isSuccessHit) {
          damage = Math.round(damage * 1.25);
        }

        if (move.type === "guard") {
          damage = Math.max(0, Math.round(18 * power));
        }

        if (damage < 18) {
          damage = 18;
        }

        session.bossHp -= damage;
        player.damageDone += damage;

        let counterDamage = Math.round((36 + round * 10) * (move.type === "burst" ? 1.12 : move.type === "guard" ? 0.4 : 1));
        counterDamage = Math.max(12, counterDamage - player.shield);

        if (move.type === "skill") {
          player.shield = Math.min(45, player.shield + 20);
        }

        if (move.type === "burst") {
          player.shield = Math.min(55, player.shield + 14);
        }

        if (move.type === "guard") {
          counterDamage = Math.floor(counterDamage * 0.55);
          player.shield = Math.min(60, player.shield + 28);
        }

        player.resolve -= counterDamage;
        if (player.resolve <= 0) {
          player.resolve = 0;
          player.active = false;
          roundLog.push(`${player.displayName} landed ${damage} but was knocked out.`);
        } else {
          roundLog.push(formatRoundLine(player, move, damage, reaction.name, counterDamage, player.resolve));
        }

        if (session.bossHp <= 0) {
          session.combatLog.push(...roundLog);
          break;
        }

        previousElement = player.element;
      }

      session.combatLog.push(`Round ${round} aura: ${getElementLabel(fieldAura)}`);
      session.combatLog.push(...roundLog);

      if (session.bossHp <= 0) {
        break;
      }

      if (round < totalRounds) {
        for (const player of session.players) {
          if (player.active && player.burstCharge < 2 && round % 2 === 0) {
            player.burstCharge += 1;
          }

          if (player.active && player.shield > 0) {
            player.shield = Math.max(0, player.shield - 8);
          }
        }
      }

      const cardBuffer = await renderBossCardBuffer({
        boss: session.boss,
        hpRemaining: Math.max(0, session.bossHp),
        round,
        totalRounds,
        fieldAura,
        players: session.players,
        combatLog: session.combatLog
      });

      const fileName = `clash-round-${round}.png`;
      const attachment = new AttachmentBuilder(cardBuffer, { name: fileName });
      const embed = new EmbedBuilder()
        .setTitle(`${emoji.shenheGroove} Elemental Clash - Round ${round}`)
        .setDescription(
          [
            `Boss HP: **${Math.max(0, session.bossHp)} / ${session.boss.maxHp}**`,
            `Aura this round: **${getElementLabel(fieldAura)}**`,
            `Resistance: **${getElementLabel(session.boss.resistance)}**`,
            `Weaknesses: **${session.boss.weakElements.map(getElementLabel).join(", ")}**`,
            "",
            session.combatLog.slice(-6).join("\n")
          ].join("\n")
        )
        .setColor(session.bossHp <= 0 ? 0x2ecc71 : 0xc0392b)
        .setImage(`attachment://${fileName}`);

      await battleMessage.edit({ embeds: [embed], files: [attachment], components: [] });
      await wait(2500);
    }

    const won = session.bossHp <= 0;
    const rewardLine = await grantRewards(session, saveUserProfile, loadUsers, getProfile, emoji, won);

    const finalBuffer = await renderBossCardBuffer({
      boss: session.boss,
      hpRemaining: Math.max(0, session.bossHp),
      round: session.round,
      totalRounds: ROUND_COUNT,
      fieldAura: session.boss.aura,
      players: session.players,
      combatLog: session.combatLog
    });

    const finalFile = new AttachmentBuilder(finalBuffer, { name: "clash-final.webp" });
    const finalOutcome = won
      ? `${emoji.shenheSmile} The team defeated ${session.boss.name}.
${rewardLine}`
      : `${emoji.laylaSad} The team could not break the boss before time ran out.
${rewardLine}`;

    const finalEmbed = buildFinalEmbed(session, emoji, finalOutcome);

    await battleMessage.edit({
      embeds: [finalEmbed],
      files: [finalFile],
      components: []
    });

    await cleanup();
  };

  session.timeoutId = setTimeout(async () => {
    if (!session.battleStarted && session.players.length >= MIN_PLAYERS) {
      await startBattle();
    } else if (!session.battleStarted) {
      await message.channel.send(`${emoji.laylaHesitant} Elemental Clash cancelled because not enough players joined.`);
      await cleanup();
    }
  }, LOBBY_TIMEOUT_MS);

  const collector = lobbyMessage.createMessageComponentCollector({
    time: LOBBY_TIMEOUT_MS
  });

  session.collector = collector;

  collector.on("collect", async (interaction) => {
    if (!interaction.customId.startsWith(session.customIdPrefix)) return;

    const action = interaction.customId.slice(session.customIdPrefix.length + 1);
    const currentProfileUsers = await loadUsers();
    const currentProfile = await getProfile(currentProfileUsers, interaction.user.id);
    const existingIndex = session.players.findIndex((player) => player.userId === interaction.user.id);

    if (action.startsWith("pick_")) {
      const ownerId = action.replace("pick_", "");
      if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: `${emoji.laylaHesitant} This character picker is not for you.`, ephemeral: true });
        return;
      }

      const playerIndex = session.players.findIndex((player) => player.userId === ownerId);
      if (playerIndex < 0) {
        await interaction.reply({ content: `${emoji.laylaHesitant} Join the raid first, then pick a character.`, ephemeral: true });
        return;
      }

      const selectedName = interaction.values?.[0];
      const updatedState = createPlayerState(interaction.user, currentProfile, characterElements, selectedName);
      if (!updatedState) {
        await interaction.reply({ content: `${emoji.laylaHesitant} Could not use that character for this battle.`, ephemeral: true });
        return;
      }

      session.players[playerIndex] = updatedState;
      await interaction.deferUpdate();
      await refreshLobby();
      return;
    }

    if (action === "join") {
      if (existingIndex >= 0) {
        await interaction.reply({ content: `${emoji.laylaHesitant} You are already in the raid.`, ephemeral: true });
        return;
      }

      if (session.players.length >= MAX_PLAYERS) {
        await interaction.reply({ content: `${emoji.laylaHesitant} The party is already full.`, ephemeral: true });
        return;
      }

      if (!isPlayerReady(currentProfile)) {
        await interaction.reply({ content: `${emoji.laylaHesitant} You need at least one character to join.`, ephemeral: true });
        return;
      }

      const player = createPlayerState(interaction.user, currentProfile, characterElements);
      if (!player) {
        await interaction.reply({ content: `${emoji.laylaHesitant} You need at least one owned character to join.`, ephemeral: true });
        return;
      }

      session.players.push(player);
      await interaction.deferUpdate();
      await refreshLobby();
      return;
    }

    if (action === "leave") {
      if (existingIndex < 0) {
        await interaction.reply({ content: `${emoji.laylaHesitant} You are not in the raid.`, ephemeral: true });
        return;
      }

      if (interaction.user.id === session.initiatorId) {
        await interaction.reply({ content: `${emoji.laylaHesitant} The host cannot leave. Cancel the lobby instead.`, ephemeral: true });
        return;
      }

      session.players.splice(existingIndex, 1);
      await interaction.deferUpdate();
      await refreshLobby();
      return;
    }

    if (action === "cancel") {
      if (interaction.user.id !== session.initiatorId) {
        await interaction.reply({ content: `${emoji.laylaHesitant} Only the host can cancel this lobby.`, ephemeral: true });
        return;
      }

      await interaction.deferUpdate();
      await message.channel.send(`${emoji.laylaSad} Elemental Clash cancelled by the host.`);
      await cleanup();
      return;
    }

    if (action === "start") {
      if (interaction.user.id !== session.initiatorId) {
        await interaction.reply({ content: `${emoji.laylaHesitant} Only the host can start the raid.`, ephemeral: true });
        return;
      }

      if (session.players.length < MIN_PLAYERS) {
        await interaction.reply({ content: `${emoji.laylaHesitant} You need at least ${MIN_PLAYERS} players to start.`, ephemeral: true });
        return;
      }

      await interaction.deferUpdate();
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }

      await startBattle();
      return;
    }
  });

  collector.on("end", async () => {
    if (!session.battleStarted) {
      activeClashByChannel.delete(message.channel.id);
      try {
        await lobbyMessage.edit({ components: [] });
      } catch {
        // Ignore edit errors when the message is removed.
      }
    }
  });
}

module.exports = {
  startElementalClashSession
};
