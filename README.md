# Genshin-Style Discord Wish Bot

A Discord bot with:
- Banner-based wishing system with pity counters
- Primogem economy
- Genshin trivia questions that reward primogems
- Leveling system with EXP gains from gameplay
- Character card/icon images from genshin.dev API

## Features

- 3-day rotating banner (`!banner`)
- Wishing (`!wish 1` or `!wish 10`)
  - Cooldown: 10 seconds per user
  - 5-star base chance: 0.6%
  - 4-star base chance: 5.7%
  - 5-star pity: guaranteed by 90 pulls
  - 4-star pity: guaranteed by 10 pulls
- User profile (`!profile`) with primogems, pity, and inventory totals
- RPG-style leveling
  - Gain EXP from wishes and correct trivia answers
  - Level-up requirement scales as `level * 100` EXP
- Trivia rewards (`!trivia` + `!answer`)
- Passive activity rewards from normal chat messages
- Per-pull image embeds for wish results
- Activity rewards
  - Non-command messages with at least 8 characters earn 8 primogems every 2 minutes
  - Adds small EXP gain from activity too
- Coinflip betting with primogem rewards or losses (`!coinflip`)
- Player-to-player trading with two-step approval (`!trade`)
- Elemental Clash raid minigame with boss splash art and elemental reactions (`!clash`)
  - Cooldown: 3 minutes per user
  - Fallback command when buttons fail: `!clashfix`

## Setup

1. Install Node.js 18 or later.
2. Create a Discord application and bot at https://discord.com/developers/applications.
3. Enable these Bot Gateway Intents:
   - Message Content Intent
4. Copy `.env.example` to `.env` and set your token.

Example `.env`:

DISCORD_TOKEN=your_bot_token_here
PREFIX=!
THREE_STAR_WISH_GIF_FILE=threestar.gif
FOUR_STAR_WISH_GIF_FILE=fourstar.gif
FIVE_STAR_WISH_GIF_FILE=fivestar.gif
THREE_STAR_WISH_GIF_URL=https://your-direct-3-star.gif
FOUR_STAR_WISH_GIF_URL=https://your-direct-4-star.gif
FIVE_STAR_WISH_GIF_URL=https://your-direct-5-star.gif

Notes:
- The bot first tries local GIF files (e.g. `threestar.gif`) and sends them as Discord attachments.
- If a local file is missing, it falls back to the configured URL for that rarity.

## Install and Run

npm install
npm start

## Commands

- `!help`
- `!banner`
- `!wish 1`
- `!wish 10`
- `!trivia`
- `!answer <text>`
- `!clash`
- `!clashfix <join|leave|start|cancel|pick <character>|attack|skill|burst|guard>`
- `!coinflip <heads|tails> <bet>`
- `!trade @user`
- `!trade @user give <amount> <type> [item name] receive <amount> <type> [item name]`
- `!profile`

Passive system:

- You do not need a command for this.
- Sending normal chat messages earns periodic primogems (anti-spam cooldown applied).

## Data Storage

- User profiles are stored in MongoDB through `MONGODB_URI`.
- This includes primogems, pity counters, inventory, active trivia state, and trade updates.

## External API

- The bot uses `https://genshin.jmp.blue` (genshin.dev API host) for character card/icon images in embeds.
