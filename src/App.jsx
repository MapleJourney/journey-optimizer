import { useState, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// GAME DATA
// ═══════════════════════════════════════════════════════════
const CLASS_DATA = {
  Hero:           { mainStat:"STR", color:"#e8a020", emoji:"⚔️"  },
  "Dark Knight":  { mainStat:"STR", color:"#9b59b6", emoji:"🛡️" },
  Paladin:        { mainStat:"STR", color:"#4a90d9", emoji:"✝️"  },
  Bowmaster:      { mainStat:"DEX", color:"#52a843", emoji:"🏹"  },
  Marksman:       { mainStat:"DEX", color:"#27ae60", emoji:"🎯"  },
  "Night Lord":   { mainStat:"LUK", color:"#7b52e8", emoji:"🌑"  },
  Shadower:       { mainStat:"LUK", color:"#8e44ad", emoji:"🗡️" },
  Bishop:         { mainStat:"INT", color:"#d4af37", emoji:"✨"  },
  "Archmage F/P": { mainStat:"INT", color:"#c0392b", emoji:"🔥"  },
  "Archmage I/L": { mainStat:"INT", color:"#2980b9", emoji:"❄️"  },
};

const CONTENT_TREE = [
  { id:"guild",     label:"Guild",      icon:"🏰", color:"#7b52e8", children:[
    { id:"guild_conquest",   label:"Guild Conquest",      icon:"🏰", desc:"Conquest territory damage" },
    { id:"guild_war",        label:"Guild War",           icon:"⚔️", desc:"GW PVP vs other guilds" },
    { id:"guild_tg",         label:"Training Grounds",    icon:"🎯", desc:"Kill dummies for score" },
  ]},
  { id:"character", label:"Character",  icon:"⚔️", color:"#e8a020", children:[
    { id:"chapter_hunt",         label:"Chapter Hunt",        icon:"🗺️", desc:"Regular chapter mob clearing" },
    { id:"chapter_boss",         label:"Chapter Boss",        icon:"💀", desc:"Chapter boss encounters" },
    { id:"chapter_breakthrough", label:"Breakthrough",        icon:"🔥", desc:"Breakthrough stage bosses" },
  ]},
  { id:"boss_cat",  label:"Boss",       icon:"👹", color:"#c0392b", children:[
    { id:"world_boss", label:"World Boss", icon:"🌍", desc:"Server-wide world boss event" },
    { id:"raid_boss",  label:"Raid Boss",  icon:"⚡", desc:"Zakum and guild raid bosses" },
  ]},
  { id:"dungeon",   label:"Dungeons",   icon:"🏚️", color:"#27ae60", children:[
    { id:"mush_mom",       label:"Mush Mom",        icon:"🍄", desc:"Mush Mom boss dungeon" },
    { id:"exp_dungeon",    label:"EXP Dungeon",     icon:"⭐", desc:"EXP gain farming" },
    { id:"fish_dungeon",   label:"Fish Dungeon",    icon:"🐟", desc:"Mushroom fish farming" },
    { id:"hero_dungeon",   label:"Hero Dungeon",    icon:"🦸", desc:"Hero-class dungeon" },
    { id:"enhance_dungeon",label:"Enhance Dungeon", icon:"⚙️", desc:"Gear enhancement dungeon" },
  ]},
  { id:"pvp_cat",   label:"PvP",        icon:"🏆", color:"#e74c3c", children:[
    { id:"arena", label:"Arena PvP", icon:"🏆", desc:"Arena PVP ranked matches" },
  ]},
];

const ALL_CONTENT = CONTENT_TREE.flatMap(g => g.children);

const BOSS_IDS = new Set(["guild_war","guild_conquest","chapter_boss","chapter_breakthrough","world_boss","raid_boss","mush_mom","hero_dungeon","enhance_dungeon"]);
const MOB_IDS  = new Set(["guild_tg","chapter_hunt","exp_dungeon","fish_dungeon"]);
const PVP_IDS  = new Set(["arena"]);
function getType(cid) { return PVP_IDS.has(cid) ? "pvp" : MOB_IDS.has(cid) ? "mob" : "boss"; }
function getArtSet(cid) {
  if (cid === "world_boss") return "world_boss";
  if (cid === "raid_boss")  return "raid_boss";
  if (cid === "guild_war")  return "guild_war";
  if (PVP_IDS.has(cid))    return "pvp";
  if (MOB_IDS.has(cid))    return "mob";
  return "boss";
}

// ─── All companion classes with role data ─────────────────
const ALL_COMPANIONS = [
  { id:"il",   name:"Archmage I/L", emoji:"❄️", color:"#2980b9", role:"mob",  tier:"S",
    legendaryAbility:"Empirical Knowledge (Passive): 31% chance on hit to debuff enemy with highest Max HP. Up to 3 stacks (per unique Explorer Magician): +5% Damage +5% Ignore DEF per stack for 10s",
    subNote:"BiS mob main — AoE freeze + crit resistance reduction. Empirical Knowledge def ignore stacks are strong even as sub" },
  { id:"fp",   name:"Archmage F/P", emoji:"🔥", color:"#c0392b", role:"boss", tier:"S",
    legendaryAbility:"Empirical Knowledge (Passive): 31% chance on hit to debuff enemy with highest Max HP. Up to 3 stacks (per unique Explorer Magician): +5% Damage +5% Ignore DEF per stack for 10s. DoT mechanic for boss farming",
    subNote:"Shares Empirical Knowledge with I/L — can't stack same-type. BiS boss main for DoT + def ignore synergy" },
  { id:"nl",   name:"Night Lord",   emoji:"🌑", color:"#7b52e8", role:"both", tier:"A",
    legendaryAbility:"Adventurer's Curiosity (Passive, Archer equiv — NL is Thief): Burst damage amp window via Alchemic Mixture active. Strong single-target burst",
    subNote:"Versatile sub used in both mob and boss presets. Alchemic burst window syncs well with skill rotations" },
  { id:"bm",   name:"Bowmaster",    emoji:"🏹", color:"#52a843", role:"boss", tier:"A",
    legendaryAbility:"Adventurer's Curiosity (Passive): +50% Monster Collection chance, +15% Crit Rate stacking up to 3× per unique Explorer Archer at Master Level. Storm of Arrows — high sustained boss DPS",
    subNote:"Triple BM sub stack is endgame BiS for boss content. Each BM contributes Crit Rate stacks independently" },
  { id:"mm",   name:"Marksman",     emoji:"🎯", color:"#27ae60", role:"both", tier:"A",
    legendaryAbility:"Adventurer's Curiosity (Passive): +50% Monster Collection chance, +15% Crit Rate stacking up to 3× per unique Explorer Archer at Master Level. Snipe — high single-target proc",
    subNote:"Strong all-rounder sub. Shares Archer passive with BM — stack both for maximum Crit Rate contribution" },
  { id:"bsh",  name:"Bishop",       emoji:"✨", color:"#d4af37", role:"boss", tier:"A",
    legendaryAbility:"Holy Symbol (active): Party EXP/drop rate boost. Empirical Knowledge (Passive, shared across Explorer Magicians): +5% Damage +5% Ignore DEF per stack for 10s",
    subNote:"Best boss main for Holy Symbol + def ignore. Flexible — works in mob content too" },
  { id:"pal",  name:"Paladin",      emoji:"✝️", color:"#4a90d9", role:"boss", tier:"B",
    legendaryAbility:"Invincible Belief (Passive, Warrior type): Auto-activates when HP <15%, restoring 44% Max HP/sec for 3s. Up to 3 stacks per unique Explorer Warrior; 90s CD. Vessel of Light — attack speed passive",
    subNote:"Best sub for high AS builds. Vessel of Light passive boosts damage on fast-attacking characters" },
  { id:"dk",   name:"Dark Knight",  emoji:"🛡️", color:"#9b59b6", role:"both", tier:"B",
    legendaryAbility:"Invincible Belief (Passive, Warrior type): Auto-HP restore when low. Legion Bonus: Flat STR. Beholder passive — accuracy + survivability bonus",
    subNote:"Hidden OP in GW/WB — accuracy helps hit high-evasion targets. Invincible Belief warrior passive overlaps with Hero/Paladin" },
  { id:"hero", name:"Hero",         emoji:"⚔️", color:"#e8a020", role:"boss", tier:"B",
    legendaryAbility:"Invincible Belief (Passive, Warrior type): Auto-HP restore below 15% HP, 44% Max HP/sec for 3s. Up to 3 stacks per unique Explorer Warrior; 90s CD. Enrage — burst damage amp",
    subNote:"Consistent boss sub filler. Warrior passive (Invincible Belief) stacks across Hero/Paladin/DK up to 3×" },
  { id:"shad", name:"Shadower",     emoji:"🗡️", color:"#8e44ad", role:"mob",  tier:"B",
    legendaryAbility:"Shadow Partner — mirrors a portion of your attack damage. Good for AoE mob clearing",
    subNote:"Decent mob sub. Shadow Partner mirrors attacks — value scales with your own damage output" },
];

// ─── Companion preset builder ─────────────────────────────
function buildCompPreset(type, compLevel, unlockedIds) {
  const unlocked = ALL_COMPANIONS.filter(c => unlockedIds.has(c.id));
  const maxSubs = compLevel >= 7 ? 6 : 5;

  // Boss preset
  if (type === "boss") {
    const mainPriority = ["bsh","fp","nl","bm","mm"];
    const subPriority  = ["bm","bm","bm","nl","pal","hero","dk","mm"];
    const main = mainPriority.find(id => unlockedIds.has(id)) || unlocked[0]?.id;
    const subs = [];
    for (const id of subPriority) {
      if (subs.length >= maxSubs) break;
      if (unlockedIds.has(id)) subs.push(id);
    }
    // Fill remaining with whatever is unlocked
    for (const c of unlocked) {
      if (subs.length >= maxSubs) break;
      if (c.id !== main && !subs.includes(c.id)) subs.push(c.id);
    }
    return { main, subs: subs.slice(0, maxSubs) };
  }

  // Mob preset
  if (type === "mob") {
    const mainPriority = ["il","bsh","nl","mm"];
    const subPriority  = ["il","nl","mm","shad","dk","bsh"];
    const main = mainPriority.find(id => unlockedIds.has(id)) || unlocked[0]?.id;
    const subs = [];
    for (const id of subPriority) {
      if (subs.length >= maxSubs) break;
      if (unlockedIds.has(id) && id !== main) subs.push(id);
    }
    for (const c of unlocked) {
      if (subs.length >= maxSubs) break;
      if (c.id !== main && !subs.includes(c.id)) subs.push(c.id);
    }
    return { main, subs: subs.slice(0, maxSubs) };
  }

  // PvP preset
  const mainPriority = ["bsh","nl","pal"];
  const subPriority  = ["nl","dk","pal","mm","bm","hero"];
  const main = mainPriority.find(id => unlockedIds.has(id)) || unlocked[0]?.id;
  const subs = [];
  for (const id of subPriority) {
    if (subs.length >= maxSubs) break;
    if (unlockedIds.has(id) && id !== main) subs.push(id);
  }
  for (const c of unlocked) {
    if (subs.length >= maxSubs) break;
    if (c.id !== main && !subs.includes(c.id)) subs.push(c.id);
  }
  return { main, subs: subs.slice(0, maxSubs) };
}

// ─── Full artifact database from community guide ──────────
const ALL_ARTIFACTS = [
  // LEGENDARY
  { id:"ancientbook",  name:"Ancient Book",               rarity:"Legendary", emoji:"📖", color:"#52a843",
    possession:"Critical Rate +5%",
    equipped:"Crit Rate +10%, Crit Damage +30% of Crit Rate",
    usage:"All content (Hunting / Boss / Stage / Arena)",
    summary:"Undisputed tier 1 — boosts both Crit Rate and Crit Damage simultaneously. Acts as a passive damage artifact that always occupies one fixed slot. Universal across every content type.",
    best:["boss","mob","pvp","all"] },
  { id:"icespiritstone",name:"Ice Spirit Stone",          rarity:"Legendary", emoji:"🔵", color:"#52a843",
    possession:"Critical Damage +10%",
    equipped:"Recovers 1% MP every 2 sec. When MP >50%, Crit DMG +20%; if MP >75%, effect doubled (total +40%)",
    usage:"Hunting / Boss / Stage / Arena",
    summary:"Tricky activation — MP management required. If you can maintain conditions, Crit DMG is top-tier in all content. With good mana setup can outperform Ancient Book. Especially strong if you have abundant max MP.",
    best:["boss","mob","pvp"] },
  { id:"starstone",   name:"Star Stone",                  rarity:"Legendary", emoji:"⭐", color:"#52a843",
    possession:"Defense +10%",
    equipped:"Incoming damage +20% (penalty), Boss Monster Damage +50%",
    usage:"Boss / Stage breakthrough",
    summary:"Massive boss damage boost. Invaluable when stuck on chapter bosses. Incoming damage penalty can cause survival issues in Guild Wars/Rudy PQ — compensate with lower potion ratio.",
    best:["boss"] },
  { id:"hexnecklace", name:"Hexagonal Crystal Necklace",  rarity:"Unique", emoji:"💎", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"Every 20 sec, Damage +24% of current value for 30 sec (stacks up to 3× = 72% total at Awakening 3)",
    usage:"Hunting / Boss / Guild content",
    summary:"Beacon of light for free-to-play players. Once fully stacked (takes ~60 sec), provides massive sustained damage increase. Less efficient in short Arena fights where it can't fully ramp. High value in long boss fights, Guild Raids, and Wars lasting over 1 minute. Stack value scales with Awakening level.",
    best:["boss","mob"] },
  { id:"seyrams",     name:"Seyram's Necklace",           rarity:"Legendary", emoji:"📿", color:"#52a843",
    possession:"Basic Attack Damage +15%",
    equipped:"2+ nearby enemies: Normal Monster Damage +30%. 1 enemy: Boss Monster Damage +10%",
    usage:"Stage / Hunting / Hero Training Ground",
    summary:"Called 'Stone-Book tier trinity' on release. Flips between mob and boss damage based on enemy count. Especially powerful in Stage pushing and Training Ground. In pure 1-boss content only the 10% applies, so priority drops slightly.",
    best:["mob","boss"] },
  // UNIQUE
  { id:"oldmusicbox", name:"Old Music Box",               rarity:"Unique", emoji:"🎵", color:"#e8a020",
    possession:"Debuff Resistance +10",
    equipped:"When debuffed: removes 1 debuff, Attack Power +25% for 25 sec (cd: 20 sec)",
    usage:"Arena",
    summary:"Easy to activate during Arena stun exchanges. Reduces losses even when you lose the stun battle. Arena-exclusive positioning — can stop and roll Critical Resistance on potentials if needed.",
    best:["pvp"] },
  { id:"holygrail",  name:"Holy Grail",                   rarity:"Unique", emoji:"🏆", color:"#e8a020",
    possession:"Damage +30%",
    equipped:"2% chance on enemy kill: Final Damage +15% for 30 sec. Always triggers on boss kill.",
    usage:"Stage / Guild Raid & War",
    summary:"Possession effect alone gives solid damage boost. In Guild Raids/Wars triggers on every boss kill — high utility. Artifact slot competition is fierce so it's not always a fixed slot, but excellent if you're stage-stuck.",
    best:["boss"] },
  { id:"rainbowsnail",name:"Rainbow Snail Shell",         rarity:"Unique", emoji:"🐌", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"Combat start 15 sec: Crit Rate +15%, Crit Damage +20%",
    usage:"Stage / Arena",
    summary:"Feels like a limited Ancient Book — strong in content requiring early rush or explosive firepower. Good performance for a Unique in short burst windows.",
    best:["pvp","boss"] },
  { id:"silverpendant",name:"Silver Pendant",             rarity:"Unique", emoji:"🪙", color:"#e8a020",
    possession:"Defense Penetration +5%",
    equipped:"On attack, 15% chance: target incoming damage +10% for 5 sec, target HP recovery -5% for 30 sec (stacks up to 5×)",
    usage:"Boss / Arena",
    summary:"Decent for late-game boss endurance. In Arena can create comeback situations. The stacks apply to the enemy, not you — in party play like Rudy PQ, only one person should carry it.",
    best:["boss","pvp"] },
  { id:"arwenshoes",  name:"Arwen's Glass Shoes",         rarity:"Unique", emoji:"👠", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"Companion summon duration +20% (~6 extra seconds)",
    usage:"Hunting (value scales with companion dependency)",
    summary:"Extends companion uptime significantly. For characters with high companion contribution in hunting, efficiency is quite significant. Can be considered in other content too depending on setup.",
    best:["mob"] },
  { id:"helenagloves",name:"Helena's Smelly Gloves",      rarity:"Unique", emoji:"🧤", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"Attack Speed +8%, Max Damage Multiplier increases by 25% of Attack Speed",
    usage:"Boss / Arena",
    summary:"Boosts AS + AS-proportional Max Damage. High variance depending on character setup. Reasonable starter choice if no specific artifact to slot.",
    best:["boss","pvp"] },
  { id:"wallow",      name:"Wallow",                      rarity:"Unique", emoji:"🍃", color:"#e8a020",
    possession:"Incoming Damage Reduction +5%",
    equipped:"5% chance when taking damage: recover 3% HP, immune to damage for 1 sec (cd: 5 sec)",
    usage:"Arena",
    summary:"Frequently creates upsets by interrupting opponent's damage timing in mid-to-late Arena. Like Old Music Box, somewhat regrettable not to have in Arena.",
    best:["pvp"] },
  { id:"fireherb",    name:"Fire Herb",                   rarity:"Unique", emoji:"🌺", color:"#e8a020",
    possession:"(Details unavailable)",
    equipped:"(Details unavailable)",
    usage:"Stage / Hunting",
    summary:"Simple structure. With Normal Monster Damage on potential, shows good perceived effect. 'Nice to use if you have it' for Stage/Hunting.",
    best:["mob"] },
  { id:"soulpouch",   name:"Soul Pouch",                  rarity:"Unique", emoji:"💜", color:"#e8a020",
    possession:"Evasion +20",
    equipped:"[Arena] Final Damage +20% during combat",
    usage:"Arena specialized",
    summary:"Dedicated Arena artifact. Low versatility outside Arena but can be top priority within it for specific matchup setups.",
    best:["pvp"] },
  { id:"ancientshard",name:"Ancient Document Fragment",   rarity:"Unique", emoji:"📜", color:"#e8a020",
    possession:"Max Damage Multiplier +15%",
    equipped:"[Guild Raid] Final Damage +20% during combat",
    usage:"Guild Raid specialized",
    summary:"Close to a dedicated Guild Raid priority artifact. Rarely used elsewhere but shows very high efficiency for Guild Bosses.",
    best:["boss"] },
  { id:"litlamp",     name:"Lit Lamp",                    rarity:"Unique", emoji:"🪔", color:"#e8a020",
    possession:"Boss Monster Damage +15%",
    equipped:"[World Boss] Final Damage +20% during combat",
    usage:"World Boss specialized",
    summary:"Practically priority 1 in World Boss presets. High efficiency within WB but low versatility in other content.",
    best:["boss"] },
  { id:"burninglava", name:"Burning Lava",                rarity:"Unique", emoji:"🧪", color:"#e8a020",
    possession:"Accuracy +10",
    equipped:"On attack vs buffed target: FD +4%. Vs debuffed: FD +8%. Vs shielded: FD +60%",
    usage:"Arena / Guild War specialized (shield stripping)",
    summary:"Tricky activation conditions. Practically specialized for stripping shields — counter vs Marksman shield copies. Shows definite counter performance in GW vs mobs with many shields. Low versatility in general boss/hunting.",
    best:["pvp","boss"] },
  { id:"soulcontract",name:"Soul Contract",               rarity:"Unique", emoji:"📋", color:"#e8a020",
    possession:"Skill Damage +15%",
    equipped:"[Chapter Hunting] Skill cooldown reduced by 20% during combat",
    usage:"Hunting",
    summary:"Noticeably increases kills per minute when used directly. Less significant if enemies melt in one hit. For a Legendary slot, versatility is disappointing — hunting preset competes with Necklace/Shoes/Book/Herb/Gloves.",
    best:["mob"] },
  { id:"mushroomhat", name:"Mushroom Mom's Hat",          rarity:"Unique", emoji:"🍊", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"Accuracy +5; on attack, Damage +1% per 1 accuracy exceeding target evasion (up to 20%)",
    usage:"Rudy Party Quest / Early artifact shortage",
    summary:"Supplements accuracy; compare vs Hex when considering. Wasteful if already overflowing with accuracy. Brief utility for catching Alishar in Rudy PQ. Good temporary multi-content filler early on.",
    best:["boss","mob"] },
  { id:"darkcontract",name:"Dark Contract",               rarity:"Unique", emoji:"📕", color:"#e8a020",
    possession:"Attack Power 100, Max HP 1,000",
    equipped:"Critical Rate +9.6% when attacking bosses",
    usage:"Boss (Early)",
    summary:"Good when artifacts are generally scarce early — roll potential options well and use temporarily. Think of it as a bridge artifact when you lack options early on.",
    best:["boss"] },
  { id:"clearspring", name:"Clear Spring Water",          rarity:"Unique", emoji:"💧", color:"#e8a020",
    possession:"Attack Power 100, Defense 70",
    equipped:"[Growth Dungeon] Final Damage +10% during combat",
    usage:"Growth Dungeon / EXP Dungeon specialized",
    summary:"Close to a Growth Dungeon exclusive. The perceived effect may not feel significant for one artifact slot — use selectively based on your growth path.",
    best:["mob"] },
  { id:"candle",      name:"Candle",                      rarity:"Unique", emoji:"🕯️", color:"#e8a020",
    possession:"Damage +30%",
    equipped:"Combat start: FD +8%. After 20 sec: Boss Monster Damage +30%. All effects end 30 sec after battle start.",
    usage:"Boss (early burst window)",
    summary:"Strong burst in the opening 30 seconds. Inventory damage possession is solid. Falls off after 30 sec — situational value depending on fight duration.",
    best:["boss"] },
  { id:"peachherb",   name:"Peach Tree Herb Pouch",       rarity:"Unique", emoji:"🍑", color:"#e8a020",
    possession:"Attack Speed +5%",
    equipped:"On attack, 20% chance: target damage taken +15% for 5 sec. Once per battle if target has buffs: removes 1 buff + target damage taken +15% for 5 sec",
    usage:"Boss / Arena (debuff/buff-stripping situations)",
    summary:"Useful for stripping 1 buff and applying a damage taken debuff. Situational — most valuable when opponents rely on key buffs.",
    best:["boss","pvp"] },
  { id:"bottleemotion",name:"Bottle of Emotion",          rarity:"Unique", emoji:"🫙", color:"#e8a020",
    possession:"Min Damage Multiplier +18%",
    equipped:"Attack +18%, Final Damage +0.6% per 3% Attack Speed exceeding 60% (up to +12%)",
    usage:"Attack Speed builds",
    summary:"Scales with Attack Speed. Min Damage Multiplier possession is decent. Value increases significantly on high AS builds.",
    best:["mob","boss"] },
];

// ─── 3-slot artifact BiS sets ─────────────────────────────
const ART_SETS = {
  boss:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal — boosts Crit Rate AND Crit Damage together. Fixed slot in every boss preset." },
      { slot:2, id:"starstone",     tier:"BiS",    reason:"Boss Monster Damage +50% equipped effect. Massive for chapter bosses and single-target boss fights." },
      { slot:3, id:"hexnecklace",   tier:"Strong", reason:"Ramps to massive sustained damage in fights lasting 1+ min — staple in Guild Raids, World Boss, long boss content. Unique rarity, widely obtainable." },
    ],
    alts:["Seyram's Necklace (if 2+ targets)","Holy Grail","Lit Lamp (World Boss only)","Ancient Document Fragment (Guild Raid only)","Silver Pendant","Candle"],
    note:"Ancient Book and Ice Spirit Stone are Legendary (green) — dramatically stronger than Unique. Prioritize getting those to Legendary first. Hexagonal Crystal Necklace is Unique but still excellent due to strong stacking effect.",
  },
  world_boss:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal fixed slot — Crit Rate + Crit Damage always valuable." },
      { slot:2, id:"litlamp",       tier:"BiS",    reason:"[World Boss] FD +20% during combat + 15% Boss DMG possession — practically priority 1 for WB." },
      { slot:3, id:"hexnecklace",   tier:"BiS",    reason:"Long fight = full 3 stacks of stacking damage. WB is exactly the long-duration content Hex was designed for." },
    ],
    alts:["Star Stone","Silver Pendant","Seyram's Necklace"],
    note:"Lit Lamp is World Boss specialized — swap it back out for other content.",
  },
  mob:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal — Crit Rate + Crit Damage. Always take this in any preset." },
      { slot:2, id:"seyrams",       tier:"BiS",    reason:"2+ enemies: Normal Monster Damage +30%. Massive in Training Grounds, Chapter Hunt, AFK farming." },
      { slot:3, id:"arwenshoes",    tier:"Strong", reason:"Companion uptime +20% (~6 extra sec). High value if companion contribution is significant in mob clearing." },
    ],
    alts:["Hexagonal Crystal Necklace","Soul Contract","Fire Herb","Clear Spring Water (EXP Dungeon)"],
    note:"Seyram's Necklace flips to +30% Normal DMG when hitting 2+ targets — it's the strongest mob artifact in the game in those conditions.",
  },
  pvp:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal Crit Rate + Crit DMG boost. Fixed slot even in Arena." },
      { slot:2, id:"oldmusicbox",   tier:"BiS",    reason:"Arena exclusive — removes debuffs, ATK +25%. Easy to activate during stun exchanges. Frustrating to be without." },
      { slot:3, id:"wallow",        tier:"Strong", reason:"5% chance for 1-sec damage immunity on hit — frequently creates upsets in mid-to-late Arena." },
    ],
    alts:["Soul Pouch (FD +20% Arena only)","Rainbow Snail Shell","Burning Lava (shield counters)","Helena's Smelly Gloves"],
    note:"Arena fights are short — prioritize burst and disruption. Wallow and Old Music Box are 'regrettable not to have' in Arena.",
  },
  guild_war:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal. Always in preset." },
      { slot:2, id:"hexnecklace",   tier:"BiS",    reason:"Long fight duration = full stack ramp. High adoption value in GW per community guide." },
      { slot:3, id:"burninglava",   tier:"Strong", reason:"GW-specialized: +60% FD when target is shielded — counter vs shield-heavy opponents and mobs." },
    ],
    alts:["Holy Grail (triggers on boss kill)","Star Stone","Silver Pendant"],
    note:"Burning Lava shines specifically in GW vs opponents who use shields. Swap for Holy Grail if you're not facing shield-heavy matchups.",
  },
  raid_boss:{
    slots:[
      { slot:1, id:"ancientbook",   tier:"BiS",    reason:"Universal. Always in preset." },
      { slot:2, id:"ancientshard",  tier:"BiS",    reason:"[Guild Raid] FD +20% — dedicated Guild Raid artifact with very high efficiency for Guild Bosses." },
      { slot:3, id:"hexnecklace",   tier:"Strong", reason:"Triggers on boss kill transitions in Raid — high utility in multi-boss Guild Raid content." },
    ],
    alts:["Holy Grail","Star Stone","Silver Pendant"],
    note:"Ancient Document Fragment is practically a Guild Raid exclusive but dominates in that content.",
  },
};

// ─── Priority engine ──────────────────────────────────────
function getPriority(cid, stats) {
  const type = getType(cid);
  const atCrit = stats.critRate >= 100;
  const atEva  = stats.evasion >= 70;
  const atAs   = stats.atkSpd >= 120;
  const rows = [{ stat:"Final Damage %", val:stats.finalDmg, note:"Always #1 — final multiplier on every other stat" }];
  if (type === "pvp") {
    rows.push(
      { stat:"Normal Monster Damage %", val:stats.normalDmg, note:"Arena opponents count as normal mobs" },
      { stat:"Crit Damage %",           val:stats.critDmg,   note: atCrit ? "Pure damage at 100% crit" : "Only effective at 100% crit rate" },
      { stat:"Defense Penetration %",   val:stats.defPen,    note:"Reduces opponent effective defense" },
      { stat:"Accuracy",                val:stats.accuracy,  note:"Prevents misses vs high-evasion opponents", noSuffix:true },
      { stat:"Evasion",                 val:stats.evasion,   note: atEva ? "⚠️ At cap (70% equiv)" : "Survivability — caps around 70% evasion chance", noSuffix:true },
    );
  } else if (type === "mob") {
    rows.push(
      { stat:"Crit Damage %",           val:stats.critDmg,     note: atCrit ? "Pure damage at 100% crit" : "Only effective at 100% crit rate" },
      { stat:"Normal Monster Damage %", val:stats.normalDmg,   note:"Mob multiplier — zero value vs bosses" },
      { stat:"Defense Penetration %",   val:stats.defPen,      note:"Multiplicative; rarely wasteful" },
      { stat:"Main Stat %",             val:stats.mainStatPct, note:"Scales full attack line; % >> flat" },
      { stat:"Attack Speed %",          val:stats.atkSpd,      note: atAs ? "⚠️ At 120% cap" : "More hits; diminishing past ~80%" },
    );
  } else {
    rows.push(
      { stat:"Crit Damage %",           val:stats.critDmg,     note: atCrit ? "Pure damage at 100% crit" : "Only effective at 100% crit rate" },
      { stat:"Boss Monster Damage %",   val:stats.bossDmg,     note:"Boss multiplier — zero value on normal mobs" },
      { stat:"Defense Penetration %",   val:stats.defPen,      note:"Critical vs high-armor bosses: 6000/(6000+def)" },
      { stat:"Main Stat %",             val:stats.mainStatPct, note:"Scales full attack line; % >> flat" },
    );
  }
  if (cid === "guild_tg") rows.push({ stat:"Accuracy (min 215)", val:stats.accuracy, note:"Required to hit later TG waves", noSuffix:true });
  rows.push(
    { stat:"Attack Speed %", val:stats.atkSpd, note: atAs ? "⚠️ At 120% cap — stop investing" : "Soft DR; don't sacrifice primary stats" },
    { stat:"Evasion", val:stats.evasion, note: atEva ? "⚠️ At cap — stop investing" : "Hard cap ~70% evasion chance", noSuffix:true },
  );
  const seen = new Set();
  return rows.filter(r => { if (seen.has(r.stat)) return false; seen.add(r.stat); return true; });
}

// ─── Score engine ─────────────────────────────────────────
function scoreAndAnalyze(stats, cid) {
  const type = getType(cid);
  const isBoss = type === "boss";
  const isMob  = type === "mob";
  const isPvP  = type === "pvp";

  const cr   = stats.critRate      || 0;
  const cd   = stats.critDmg       || 0;
  const fd   = stats.finalDmg      || 0;
  const bd   = stats.bossDmg       || 0;
  const nd   = stats.normalDmg     || 0;
  const dp   = stats.defPen        || 0;
  const ms   = stats.mainStatPct   || 0;
  const as_  = stats.atkSpd        || 0;
  const sk   = stats.skillDmg      || 0;
  const amp  = stats.dmgAmp        || 0;
  const ba   = stats.basicAtkDmg   || 0;
  const se   = stats.statusEffectDmg|| 0;
  const mn   = stats.minDmgMult    || 0;
  const mx   = stats.maxDmgMult    || 0;

  const atCrit = cr  >= 100;
  const atAs   = as_ >= 120;
  const atEva  = (stats.evasion||0) >= 217;

  // ── Score calculation ──────────────────────────────────
  let raw = 0;
  raw += Math.min(fd,  80) * 1.00;   // Final Damage — #1 multiplier
  if (atCrit) raw += Math.min(cd, 250) * 0.40;  // Crit DMG (unlocked)
  else        raw += Math.min(cr, 100) * 0.15;   // partial credit toward 100%
  if (isBoss || isPvP) raw += Math.min(bd, 200) * 0.25;
  if (isMob  || isPvP) raw += Math.min(nd, 150) * 0.30;
  raw += Math.min(dp,  60) * 0.50;   // Def Pen — multiplicative
  raw += Math.min(ms,  80) * 0.20;
  // Secondary damage stats
  raw += Math.min(sk,  80) * 0.10;   // Skill Damage
  raw += Math.min(amp, 50) * 0.12;   // Damage Amplification (additive to damage pool)
  raw += Math.min(ba,  60) * 0.07;   // Basic Attack Damage
  raw += Math.min(se,  40) * 0.06;   // Status Effect Damage
  // Variance stats — affect min/max spread, not average
  // Min Dmg Mult raises floor, Max raises ceiling — both contribute to effective DPS
  const avgDmgMult = ((mn + mx) / 2) || 0;
  raw += Math.min(avgDmgMult, 200) * 0.05;
  const score = Math.min(100, Math.round(raw / 1.6));

  // ── Breakdown rows ──────────────────────────────────────
  const breakdown = [];

  breakdown.push({
    key:"finalDmg", label:"Final Damage %", val:fd,
    contribution: Math.min(fd,80)*1.0,
    weight:"1.0×", cap:80, group:"core",
    status: fd===0?"empty": fd<30?"low": fd<60?"mid":"good",
  });
  breakdown.push({
    key:"critRate", label:"Crit Rate %", val:cr,
    contribution: atCrit ? 0 : Math.min(cr,100)*0.15,
    weight: atCrit?"✅ Capped":"0.15× (unlock Crit DMG)", cap:100, group:"core",
    status: cr===0?"empty": cr<50?"low": cr<100?"mid":"good",
    note: atCrit?"Capped — full Crit DMG multiplier is live":`Need ${(100-cr).toFixed(1)}% more to fully unlock Crit Damage multiplier`,
  });
  breakdown.push({
    key:"critDmg", label:"Crit Damage %", val:cd,
    contribution: atCrit ? Math.min(cd,250)*0.4 : 0,
    weight: atCrit?"0.4×":"⚠️ Locked (100% Crit Rate required)", cap:250, group:"core",
    status: !atCrit?"locked": cd<100?"low": cd<200?"mid":"good",
    note: !atCrit?"Zero value until Crit Rate = 100%":undefined,
  });
  if (isBoss || isPvP) breakdown.push({
    key:"bossDmg", label:"Boss Damage %", val:bd,
    contribution: Math.min(bd,200)*0.25,
    weight:"0.25×", cap:200, group:"core",
    status: bd===0?"empty": bd<50?"low": bd<120?"mid":"good",
  });
  if (isMob || isPvP) breakdown.push({
    key:"normalDmg", label:"Normal Monster Damage %", val:nd,
    contribution: Math.min(nd,150)*0.30,
    weight:"0.30×", cap:150, group:"core",
    status: nd===0?"empty": nd<40?"low": nd<100?"mid":"good",
  });
  breakdown.push({
    key:"defPen", label:"Defense Penetration %", val:dp,
    contribution: Math.min(dp,60)*0.5,
    weight:"0.5×", cap:60, group:"core",
    status: dp===0?"empty": dp<20?"low": dp<45?"mid":"good",
    note:"Multiplicative vs enemy DEF: 6000÷(6000+DEF). Each early % = huge gain",
  });
  breakdown.push({
    key:"mainStatPct", label:"Main Stat %", val:ms,
    contribution: Math.min(ms,80)*0.20,
    weight:"0.2×", cap:80, group:"core",
    status: ms===0?"empty": ms<25?"low": ms<60?"mid":"good",
  });
  // Secondary
  breakdown.push({
    key:"skillDmg", label:"Skill Damage %", val:sk,
    contribution: Math.min(sk,80)*0.10,
    weight:"0.10×", cap:80, group:"secondary",
    status: sk===0?"empty": sk<30?"low":"mid",
    note:"Applies to active skills only — strong if skill-dependent class",
  });
  breakdown.push({
    key:"dmgAmp", label:"Damage Amplification %", val:amp,
    contribution: Math.min(amp,50)*0.12,
    weight:"0.12×", cap:50, group:"secondary",
    status: amp===0?"empty": amp<20?"low":"mid",
    note:"Additive to your total damage pool — broadly applies to all hit types",
  });
  breakdown.push({
    key:"basicAtkDmg", label:"Basic Attack Damage %", val:ba,
    contribution: Math.min(ba,60)*0.07,
    weight:"0.07×", cap:60, group:"secondary",
    status: ba===0?"empty":"mid",
    note:"Only applies to basic auto-attacks — less relevant for skill-heavy builds",
  });
  breakdown.push({
    key:"statusEffectDmg", label:"Status Effect Damage %", val:se,
    contribution: Math.min(se,40)*0.06,
    weight:"0.06×", cap:40, group:"secondary",
    status: se===0?"empty":"mid",
    note:"Only procs when enemy is afflicted — World Boss and poison builds benefit most",
  });
  // Variance / Range stats
  breakdown.push({
    key:"minDmgMult", label:"Min Damage Multiplier %", val:mn,
    contribution: Math.min(mn,200)*0.025,
    weight:"0.025×", cap:200, group:"variance",
    status: mn===0?"empty": mn<50?"low": mn<150?"mid":"good",
    note:"Raises your damage floor. Narrows variance gap with Max Dmg — more consistent output",
  });
  breakdown.push({
    key:"maxDmgMult", label:"Max Damage Multiplier %", val:mx,
    contribution: Math.min(mx,300)*0.025,
    weight:"0.025×", cap:300, group:"variance",
    status: mx===0?"empty": mx<100?"low": mx<250?"mid":"good",
    note:"Raises your damage ceiling. Helena's Smelly Gloves give AS×25% to Max Dmg Mult",
  });

  // ── Damage variance analysis ───────────────────────────
  const dmgSpread = mx > mn ? mx - mn : 0;
  const avgDmgMultVal = (mn + mx) / 2;

  // ── Optimizations ─────────────────────────────────────
  const opts = [];

  if (!atCrit) opts.push({
    priority:1, urgency:"critical", icon:"🎯",
    title:`Crit Rate: ${cr}% → 100%`,
    detail:`Missing ${(100-cr).toFixed(1)}% Crit Rate. Every point of Crit Damage % is completely wasted until you hit 100%. This unlocks your entire CritDMG multiplier (currently ${cd}%). Fix this first — nothing else matters more.`,
  });

  if (fd < 30) opts.push({
    priority: atCrit?1:2, urgency: fd===0?"critical":"high", icon:"⚡",
    title:`Final Damage %: ${fd}% is very low`,
    detail:`Final Damage is the last multiplier in the damage formula — it amplifies everything else (crit, boss dmg, def pen, everything). At ${fd}%, you're leaving massive damage on the table. Target 60–80%+. Prioritize FD% above all else on cube rerolls.`,
  });
  else if (fd < 60) opts.push({
    priority: atCrit?1:2, urgency:"medium", icon:"⚡",
    title:`Final Damage %: ${fd}% — room to grow`,
    detail:`Good foundation. FD% scales well all the way to ~80%. Each additional % is your highest-efficiency stat. Keep prioritizing it on cube rerolls.`,
  });

  if (atCrit && cd < 150) opts.push({
    priority:2, urgency:"high", icon:"💥",
    title:`Crit Damage %: ${cd}% — primary growth area`,
    detail:`With 100% Crit Rate, Crit DMG% is now your #2 priority stat. Every fight is a full crit — you're fully capitalizing on this multiplier. Target 200%+. Currently contributing ${(Math.min(cd,250)*0.4).toFixed(0)} score pts.`,
  });
  else if (atCrit && cd < 200) opts.push({
    priority:3, urgency:"medium", icon:"💥",
    title:`Crit Damage %: ${cd}% — push further`,
    detail:`Strong but not capped. Endgame players run 200%+. Each 10% = meaningful DPS at 100% crit. Keep rolling.`,
  });

  if (dp < 20) opts.push({
    priority: atCrit?3:4, urgency:"high", icon:"🔓",
    title:`Defense Pen: ${dp}% — underinvested`,
    detail:`Def Pen is multiplicative, not additive. Against a 6,000 DEF boss: 0% = ÷2.0 modifier, 20% = ÷1.7, 40% = ÷1.43. The early points are insanely efficient. Target 30–40% before touching secondary stats.`,
  });
  else if (dp < 40) opts.push({
    priority:4, urgency:"medium", icon:"🔓",
    title:`Defense Pen: ${dp}% — more helps`,
    detail:`Still meaningful multiplicative gains up to ~60%. Worth pushing before investing in secondary stats.`,
  });
  else if (dp >= 60) opts.push({
    priority:9, urgency:"tip", icon:"✅",
    title:`Defense Pen: ${dp}% — at diminishing cap`,
    detail:`Above 60% you're in severe diminishing returns. Stop here and redirect into Crit DMG%, FD%, or content-specific dmg.`,
  });

  if (isBoss && bd < 50) opts.push({
    priority:4, urgency:"medium", icon:"👹",
    title:`Boss Damage %: ${bd}% — low for boss content`,
    detail:`Boss DMG% is your 4th-priority multiplier for boss content. Worth picking up on gear/cube rolls. Remember: zero value in mob content.`,
  });
  if ((isMob||isPvP) && nd < 40) opts.push({
    priority:4, urgency:"medium", icon:"👾",
    title:`Normal Monster Dmg %: ${nd}% — low for ${isMob?"mob":"PvP"} content`,
    detail:`Normal Monster DMG% is your content multiplier here. High priority for Training Grounds and AFK farming. Zero value vs bosses.`,
  });

  // Min/Max Dmg Mult analysis
  if (dmgSpread > 150) opts.push({
    priority:6, urgency:"medium", icon:"📊",
    title:`Damage Variance: Min ${mn}% / Max ${mx}% — large spread`,
    detail:`Your damage range varies ${dmgSpread.toFixed(0)}% between min and max hits. Large variance means inconsistent DPS and unpredictable burst. Raising Min Dmg Mult tightens this gap for more reliable output. Items with Min Dmg Mult on potential are worth targeting.`,
  });
  if (mx < 100 && (fd > 30 || cd > 100)) opts.push({
    priority:7, urgency:"low", icon:"📈",
    title:`Max Damage Multiplier: ${mx}% — room to push`,
    detail:`Max Dmg Mult raises your damage ceiling. At your damage stat levels, pushing Max Dmg Mult gives meaningful top-end gains. Helena's Smelly Gloves give Max Dmg Mult = 25% of your Attack Speed — a strong synergy if AS is already high.`,
  });
  if (mn < mx * 0.5 && mn < 80) opts.push({
    priority:7, urgency:"low", icon:"📉",
    title:`Min Damage Multiplier: ${mn}% — low relative to Max`,
    detail:`Min Dmg Mult is ${(mn/(mx||1)*100).toFixed(0)}% of your Max. Raising the floor reduces variance and makes your DPS more consistent — especially valuable in timed content like Guild War where RNG on low rolls hurts.`,
  });

  if (atAs) opts.push({
    priority:5, urgency:"warn", icon:"⚠️",
    title:`Attack Speed ${as_}% — OVER 120% hard cap`,
    detail:`Attack Speed is hard-capped at 120%. Everything above that is wasted. Swap those rolls/resources to FD%, Crit DMG%, or Def Pen immediately.`,
  });

  if (ms < 20) opts.push({
    priority:5, urgency:"low", icon:"📊",
    title:`Main Stat %: ${ms}% — low`,
    detail:`Main Stat% scales your full attack line. Lower priority than FD/CritDMG/DefPen but % form outperforms flat stats significantly late game.`,
  });

  if (cid==="guild_tg" && (stats.accuracy||0) < 215) opts.push({
    priority:1, urgency:"critical", icon:"🎯",
    title:`Accuracy ${stats.accuracy||0} — below 215 TG minimum`,
    detail:`Training Grounds later waves require 215+ Accuracy. Missing hits = 0 damage. Hard floor requirement — reach this before anything else.`,
  });

  if (atEva && !isPvP) opts.push({
    priority:9, urgency:"tip", icon:"✅",
    title:`Evasion ${stats.evasion} — at soft cap`,
    detail:`Evasion soft-caps at ~217 flat (≈70% evasion chance). No further investment needed. Redirect to damage stats.`,
  });

  // Damage Amplification low
  if (amp < 15 && (fd > 30 || atCrit)) opts.push({
    priority:7, urgency:"low", icon:"🔆",
    title:`Damage Amplification: ${amp}% — untapped secondary`,
    detail:`Dmg Amp adds broadly to your total damage pool and is worth picking up once your core stats (FD%, Crit, DefPen) are solid. Target 30%+ as a secondary goal.`,
  });

  opts.sort((a,b)=>a.priority-b.priority);
  return { score, breakdown, opts };
}

// ─── Example stats (Snacks/Hero from screenshots) ─────────
const EXAMPLE_STATS = {
  finalDmg:54.8, critRate:82.3, critDmg:180.9, bossDmg:86.1, normalDmg:69.3,
  defPen:20.4, mainStatPct:22, atkSpd:61.8, evasion:217, accuracy:267,
  skillDmg:57, dmgAmp:38.4, basicAtkDmg:52.2, statusEffectDmg:17.4,
  damage:581.2, statPropDmg:236.9, minDmgMult:124.5, maxDmgMult:223,
  expGain:86.2, mesoDrop:60.5, maxHp:7466112, mpRecovery:5, hpRecovery:0,
  dmgTakenDec:15.6, debuffTolerance:21, skillCdDec:0,
  str:23638, dex:212, int_:51, luk:583, cp:1194000000000,
};
const EMPTY_STATS = {
  finalDmg:0, critRate:0, critDmg:0, bossDmg:0, normalDmg:0,
  defPen:0, mainStatPct:0, atkSpd:0, evasion:0, accuracy:0,
  skillDmg:0, dmgAmp:0, basicAtkDmg:0, statusEffectDmg:0,
  damage:0, statPropDmg:0, minDmgMult:0, maxDmgMult:0,
  expGain:0, mesoDrop:0, maxHp:0, mpRecovery:0, hpRecovery:0,
  dmgTakenDec:0, debuffTolerance:0, skillCdDec:0,
  str:0, dex:0, int_:0, luk:0, cp:0,
};

// ─── Guides data ──────────────────────────────────────────
const GUIDES = [
  { id:"wb", title:"World Boss Guide", icon:"🌍", author:"Lost4ever510", date:"2/23/26", sections:[
    { heading:"Key Stats", body:"Status effect damage and Def Pen are your main boosters. For artifacts, Hex is a staple — add Lantern/Star Rock if you have them." },
    { heading:"Companion Setup", body:"Running triple MM + NL. BiS endgame is triple MM + triple BM with NL/BM front. Charm works as a budget option (main stat + status effect dmg)." },
    { heading:"Rotation", body:"Time your hard-hitting abilities with buffs active (for NL, that's Alchemic). Don't sacrifice a full cast cycle to optimize buff timing — one full cast beats waiting." },
    { heading:"Attack Debuff Tip", body:"During the first half, wait for the attack debuff to time out before casting. If your big skill fires right before expiry, wait 1–2s — you usually won't lose a cast." },
    { heading:"Companion Timing", body:"Always summon for the second stun at 30s. Locks in 2 stacks of Hex for its full duration — massive damage window." },
  ]},
  { id:"gw", title:"Guild Wars Guide", icon:"⚔️", author:"Lost4ever510", date:"2/23/26", sections:[
    { heading:"Timer Mechanic", body:"Bosses give +20s on kill. Timer caps at 35s — wait until 15s to clear. Gives time for skill resets and lets Hex fully stack." },
    { heading:"Manual vs Auto", body:"ALWAYS play manual until you can no longer one-shot the boss. Basic attack until shield breaks, then unload your strongest skill." },
    { heading:"Adds Mechanic", body:"Adds despawn at the same time you killed the last boss. If you can't kill adds, don't waste skills on them — wait for boss to go vulnerable." },
    { heading:"Artifacts", body:"Hex is a staple. Others: Book, Icy Soul Rock, Star Rock, Sayrams — mix based on what you have." },
    { heading:"Stats to Note", body:"Normal damage matters — mobs are mixed in with bosses. Accuracy is underrated; later-stage mobs have high evasion, making DK hidden OP." },
    { heading:"Companion Timing", body:"Summon companion at ~10s on the last boss you can kill, to maximize uptime — unless running the shoe artifact." },
    { heading:"Recommended Page", body:"IL-MM-MM-BM-NL-HERO-DK (Lost4ever510). Tested without DK and IL — both were worse. With Bishop/Pally the preset may shift slightly, YMMV." },
  ]},
  { id:"tg", title:"Training Grounds Guide", icon:"🎯", author:"Snacks", date:"1/14/26", sections:[
    { heading:"Objective", body:"Kill as many dummies as possible. Each dummy respawns in ~9–10s. Every ~30 kills = +2s time extension. Kill lots, kill fast." },
    { heading:"Required Stats", body:"Min 215 Accuracy for later waves. Remove all single-target skills from your preset. Load Normal mob damage, crit rate/damage. Max MP helps if you burn out from the AS buff dummy." },
    { heading:"Companion", body:"Highest-level Mage on auto-summon. Enough kills + time extensions = summon twice per run." },
    { heading:"Pathing", body:"Path that maximizes targets hit per basic auto attack. NLs talk to Snacks, Shads talk to Ikrmba. Everyone else find one of us." },
    { heading:"Buff Dummies — Critical", body:"• Blue circle (Wooden dummy) — 2× dmg + move/attack speed. Use while 1–2 shotting dummies.\n• Purple circle (Green dummy) — flat 3× dmg. Switch here when you start 3-shotting.\n• Yellow circle — sets ALL dummies to 1 HP briefly. Sweep the whole map immediately after." },
    { heading:"Hazards to Dodge", body:"Green vertical attack (stuns), small red circle (debuffs speed + attack), whirlwind (sends you flying sideways)." },
    { heading:"Final Damage Pickups", body:"Small FD% buffs near the yellow dummy. Grab them on your path — don't break your route for them." },
  ]},
];

// ═══════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════
function StatRow({ label, field, value, onChange, noSuffix=false, max=9999999, step=0.1 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderBottom:"1px solid #0e0e1c" }}>
      <label style={{ fontSize:12, color:"#8888aa", flex:1 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <input
          type="number" min={0} max={max} step={step} value={value}
          onChange={e => onChange(field, Math.max(0, Math.min(max, Number(e.target.value))))}
          style={{
            width:72, background:"#0b0b18", border:"1px solid #252540",
            borderRadius:6, color:"#e8e8f0", fontSize:13, fontWeight:600,
            textAlign:"right", padding:"4px 6px", outline:"none",
          }}
        />
        {!noSuffix && <span style={{ fontSize:11, color:"#444", width:14 }}>%</span>}
      </div>
    </div>
  );
}

function SectionLabel({ children, color="#c0392b" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, margin:"14px 0 8px" }}>
      <span style={{ fontSize:10, fontWeight:800, color, letterSpacing:1.2, textTransform:"uppercase" }}>{children}</span>
      <div style={{ height:1, flex:1, background:"#1a1a28" }} />
    </div>
  );
}

function ContentPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(() => {
    for (const g of CONTENT_TREE) if (g.children.some(c => c.id === selected)) return g.id;
    return CONTENT_TREE[0].id;
  });
  const selGroup = CONTENT_TREE.find(g => g.children.some(c => c.id === selected));
  const selChild = selGroup?.children.find(c => c.id === selected);
  return (
    <div>
      <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:6 }}>
        {CONTENT_TREE.map(g => (
          <button key={g.id} onClick={() => setOpen(open===g.id ? null : g.id)} style={{
            padding:"3px 9px", borderRadius:20, fontSize:10, cursor:"pointer",
            border: open===g.id ? `1.5px solid ${g.color}` : "1px solid #1e1e30",
            background: open===g.id ? g.color+"22" : "#0d0d1c",
            color: open===g.id ? g.color : "#666", transition:"all .1s",
          }}>{g.icon} {g.label} {open===g.id?"▲":"▾"}</button>
        ))}
      </div>
      {CONTENT_TREE.filter(g=>open===g.id).map(g=>(
        <div key={g.id} style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6, paddingLeft:8, borderLeft:`2px solid ${g.color}33` }}>
          {g.children.map(c=>(
            <button key={c.id} onClick={()=>{onSelect(c.id);setOpen(null);}} style={{
              padding:"3px 9px", borderRadius:20, fontSize:10, cursor:"pointer",
              border: selected===c.id?`1.5px solid ${g.color}`:"1px solid #1e1e30",
              background: selected===c.id?g.color+"22":"#0d0d1c",
              color: selected===c.id?g.color:"#888", transition:"all .1s",
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      ))}
      {selChild && (
        <div style={{ fontSize:10, color:"#333", marginBottom:4 }}>
          {selChild.icon} <span style={{color:selGroup?.color}}>{selChild.label}</span>
          <span style={{color:"#1e1e2a",marginLeft:6}}>— {selChild.desc}</span>
        </div>
      )}
    </div>
  );
}

function GuideCard({ guide, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"#0f0f1e", border:"1px solid #1e1e30", borderRadius:10, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#3a3a60"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e30"}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{guide.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#e8e8f0" }}>{guide.title}</div>
          <div style={{ fontSize:11, color:"#444", marginTop:2 }}>by {guide.author} · {guide.date}</div>
        </div>
        <span style={{ color:"#444" }}>›</span>
      </div>
    </div>
  );
}

function GuideDetail({ guide, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ background:"none",border:"none",color:"#7b52e8",cursor:"pointer",fontSize:13,padding:"0 0 16px 0" }}>← Back to Guides</button>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:28 }}>{guide.icon}</span>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"#e8e8f0" }}>{guide.title}</div>
          <div style={{ fontSize:11, color:"#555" }}>by {guide.author} · {guide.date}</div>
        </div>
      </div>
      {guide.sections.map((s,i)=>(
        <div key={i} style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#7b52e8", textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{s.heading}</div>
          <div style={{ fontSize:13, color:"#b0b0cc", lineHeight:1.75, whiteSpace:"pre-line" }}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}

function ArtCard({ art }) {
  const [expanded, setExpanded] = useState(false);
  const isLeg = art.rarity === "Legendary";
  return (
    <div onClick={()=>setExpanded(p=>!p)} style={{
      background: expanded?(isLeg?"#0c1a0c":"#0e0e1e"):(isLeg?"#0a120a":"#0c0c18"),
      border:`1px solid ${isLeg?"#1e3a1e":"#1e1e2e"}`,
      borderRadius:9, marginBottom:6, cursor:"pointer", overflow:"hidden",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px"}}>
        <span style={{fontSize:18,flexShrink:0}}>{art.emoji}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e0e0f0"}}>{art.name}</div>
          <div style={{fontSize:10,color:"#555",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{art.possession}</div>
        </div>
        <span style={{fontSize:11,color:"#333",flexShrink:0}}>{expanded?"▲":"▾"}</span>
      </div>
      {expanded && (
        <div style={{padding:"0 12px 10px",borderTop:`1px solid ${isLeg?"#1a2a1a":"#141424"}`}}>
          <div style={{marginTop:8,fontSize:11,color:"#52a843",lineHeight:1.6,marginBottom:4}}>✦ <span style={{fontWeight:600}}>Equipped:</span> {art.equipped}</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:4}}>📦 <span style={{color:"#666"}}>Usage:</span> {art.usage}</div>
          <div style={{fontSize:11,color:"#8888aa",lineHeight:1.7,borderTop:"1px solid #111120",paddingTop:6,marginTop:4}}>{art.summary}</div>
        </div>
      )}
    </div>
  );
}

const TIER_COLOR = { BiS:"#e8a020", Strong:"#7b52e8", Good:"#27ae60", S:"#ffd700", A:"#52a843", B:"#4a90d9" };

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const TABS = [
  { id:"input",    icon:"📋", label:"Stats"     },
  { id:"priority", icon:"🎯", label:"Priority"  },
  { id:"score",    icon:"📊", label:"Score"     },
  { id:"artifact", icon:"🏺", label:"Artifacts" },
  { id:"companion",icon:"🧙", label:"Companion" },
  { id:"guides",   icon:"📖", label:"Guides"    },
  { id:"info",     icon:"ℹ️",  label:"How It Works"},
];

export default function App() {
  const [cls,         setCls]        = useState("Hero");
  const [cid,         setCid]        = useState("chapter_boss");
  const [tab,         setTab]        = useState("input");
  const [stats,       setStats]      = useState({...EMPTY_STATS});
  const [imgPreview,  setImgPreview] = useState(null);
  const [activeGuide, setActiveGuide]= useState(null);
  const [ign,         setIgn]        = useState("");
  const [level,       setLevel]      = useState("");
  const [saveMsg,     setSaveMsg]    = useState("");
  const [compLevel,   setCompLevel]  = useState(7);
  const [unlockedIds, setUnlockedIds]= useState(new Set(ALL_COMPANIONS.map(c=>c.id)));
  const [showOptional,setShowOptional]=useState(false);

  const update = useCallback((f,v)=>setStats(p=>({...p,[f]:v})),[]);
  const clsData  = CLASS_DATA[cls]||CLASS_DATA.Hero;
  const type     = getType(cid);
  const priority = useMemo(()=>getPriority(cid,stats),[cid,stats]);
  const {score,breakdown,opts} = useMemo(()=>scoreAndAnalyze(stats,cid),[stats,cid]);
  const artSetKey = getArtSet(cid);
  const artSet   = ART_SETS[artSetKey] || ART_SETS.boss;
  const compPreset = useMemo(()=>buildCompPreset(type,compLevel,unlockedIds),[type,compLevel,unlockedIds]);
  const selLabel = ALL_CONTENT.find(c=>c.id===cid)?.label??"—";
  const selGroup = CONTENT_TREE.find(g=>g.children.some(c=>c.id===cid));
  const scoreColor = score>=70?"#52a843":score>=40?"#e8a020":"#c0392b";

  function handleImg(e) {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>setImgPreview(ev.target.result); r.readAsDataURL(f);
  }
  function handleSave() {
    const data={ign,cls,cid,stats,compLevel,level,version:2};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`${ign||"profile"}_optimizer.json`; a.click();
    URL.revokeObjectURL(url); setSaveMsg("Saved!"); setTimeout(()=>setSaveMsg(""),2000);
  }
  function handleLoad(e) {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      try {
        const d=JSON.parse(ev.target.result);
        if(d.ign) setIgn(d.ign); if(d.cls) setCls(d.cls); if(d.cid) setCid(d.cid);
        if(d.stats) setStats({...EMPTY_STATS,...d.stats}); if(d.compLevel) setCompLevel(d.compLevel);
        if(d.level) setLevel(d.level);
        setSaveMsg("Profile loaded!"); setTimeout(()=>setSaveMsg(""),2000);
      } catch { setSaveMsg("Invalid file"); setTimeout(()=>setSaveMsg(""),2000); }
    }; r.readAsText(f);
  }
  function toggleComp(id) {
    setUnlockedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  return (
    <div style={{ minHeight:"100vh", background:"#080812", fontFamily:"'Segoe UI',sans-serif", color:"#e8e8f0", maxWidth:500, margin:"0 auto" }}>

      {/* ── HEADER ── */}
      <div style={{ padding:"14px 16px 0", borderBottom:"1px solid #111120" }}>

        {/* Brand row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:26 }}>{clsData.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:"#e8c840",
              letterSpacing:-.3, lineHeight:1,
              textShadow:"0 0 18px #e8c84066, 0 0 40px #e8c84033" }}>
              Snack Your Journey
            </div>
            <div style={{ fontSize:9, color:"#444", letterSpacing:1.2, textTransform:"uppercase", marginTop:2 }}>
              MapleStory Idle RPG · Optimizer
            </div>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={handleSave} style={{ padding:"5px 9px", background:"#0d1a0d", border:"1px solid #1e3a1e", borderRadius:6, color:"#52a843", fontSize:10, cursor:"pointer", fontWeight:700 }}>💾</button>
            <label style={{ padding:"5px 9px", background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:6, color:"#7b52e8", fontSize:10, cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center" }}>
              📂<input type="file" accept=".json" onChange={handleLoad} style={{display:"none"}} />
            </label>
          </div>
        </div>

        {/* Profile row: IGN + Level + CP */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:6, marginBottom:10 }}>
          <input value={ign} onChange={e=>setIgn(e.target.value)} placeholder="IGN…"
            style={{ background:"#0d0d1c", border:"1px solid #2a2a40", borderRadius:7,
              color:"#e8e8f0", fontSize:14, fontWeight:700, padding:"5px 10px", outline:"none" }} />
          <input value={level} onChange={e=>setLevel(e.target.value)} placeholder="Lv"
            style={{ width:46, background:"#0d0d1c", border:"1px solid #2a2a40", borderRadius:7,
              color:"#e8c840", fontSize:12, fontWeight:700, padding:"5px 7px", outline:"none", textAlign:"center" }} />
          <input value={stats.cp||""} onChange={e=>update("cp", Number(e.target.value.replace(/[^0-9]/g,"")))}
            placeholder="CP"
            style={{ width:90, background:"#0d0d1c", border:"1px solid #2a2a40", borderRadius:7,
              color:"#7b52e8", fontSize:11, fontWeight:700, padding:"5px 7px", outline:"none", textAlign:"right" }} />
        </div>

        {/* Profile snapshot card (shown when IGN or CP is set) */}
        {(ign || stats.cp > 0) && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
            background:"#0a0a16", border:"1px solid #1a1a2e", borderRadius:10, marginBottom:10 }}>
            {/* Avatar / class badge */}
            <div style={{ width:40, height:40, borderRadius:10, background:clsData.color+"22",
              border:`2px solid ${clsData.color}66`, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22, flexShrink:0 }}>{clsData.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                <span style={{ fontSize:15, fontWeight:900, color:"#e8e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ign||"—"}</span>
                {level && <span style={{ fontSize:10, color:"#e8c840", fontWeight:700, flexShrink:0 }}>Lv {level}</span>}
                <span style={{ fontSize:10, color:"#555", fontWeight:600, flexShrink:0 }}>{cls}</span>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:3, flexWrap:"wrap" }}>
                {stats.cp > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:9, color:"#444" }}>CP</span>
                    <span style={{ fontSize:11, fontWeight:800, color:"#7b52e8" }}>
                      {stats.cp >= 1e12 ? `${(stats.cp/1e12).toFixed(2)}T`
                        : stats.cp >= 1e9 ? `${(stats.cp/1e9).toFixed(1)}B`
                        : stats.cp >= 1e6 ? `${(stats.cp/1e6).toFixed(1)}M`
                        : stats.cp.toLocaleString()}
                    </span>
                  </div>
                )}
                {stats.maxHp > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:9, color:"#444" }}>HP</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#c0392b" }}>
                      {stats.maxHp >= 1e6 ? `${(stats.maxHp/1e6).toFixed(1)}M` : stats.maxHp.toLocaleString()}
                    </span>
                  </div>
                )}
                {stats.str > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:9, color:"#444" }}>STR</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#e8a020" }}>{stats.str.toLocaleString()}</span>
                  </div>
                )}
                {stats.finalDmg > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:9, color:"#444" }}>FD</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#52a843" }}>{stats.finalDmg}%</span>
                  </div>
                )}
                {stats.critRate > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:9, color:"#444" }}>CR</span>
                    <span style={{ fontSize:11, fontWeight:700, color: stats.critRate>=100?"#52a843":"#e8a020" }}>{stats.critRate}%</span>
                  </div>
                )}
              </div>
            </div>
            {/* Score badge */}
            {score > 0 && (
              <div style={{ width:38, height:38, borderRadius:9, background:scoreColor+"22",
                border:`2px solid ${scoreColor}55`, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:900, color:scoreColor, lineHeight:1 }}>{score}</div>
                <div style={{ fontSize:7, color:scoreColor, opacity:.7 }}>Score</div>
              </div>
            )}
          </div>
        )}
        {saveMsg && <div style={{ fontSize:11, color:"#52a843", fontWeight:700, marginBottom:6, textAlign:"center" }}>{saveMsg}</div>}

        {/* CLASS header */}
        <div style={{ fontSize:10, fontWeight:800, color:"#555", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Class</div>
        <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:12 }}>
          {Object.entries(CLASS_DATA).map(([c,d])=>(
            <button key={c} onClick={()=>setCls(c)} style={{
              padding:"3px 8px", borderRadius:20, fontSize:10, cursor:"pointer",
              border: cls===c?`1.5px solid ${d.color}`:"1px solid #1a1a28",
              background: cls===c?d.color+"22":"#0d0d1c",
              color: cls===c?d.color:"#555", transition:"all .1s",
            }}>{d.emoji} {c}</button>
          ))}
        </div>

        {/* CONTENT header */}
        <div style={{ fontSize:10, fontWeight:800, color:"#555", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Content</div>
        <ContentPicker selected={cid} onSelect={setCid} />

        {/* Tab bar */}
        <div style={{ display:"flex", overflowX:"auto" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=="guides")setActiveGuide(null);}} style={{
              flex:"0 0 auto", padding:"7px 8px", background:"none", border:"none",
              borderBottom: tab===t.id?"2px solid #7b52e8":"2px solid transparent",
              color: tab===t.id?"#9b72f8":"#444", fontSize:10, cursor:"pointer",
              fontWeight: tab===t.id?700:400, whiteSpace:"nowrap", transition:"all .1s",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding:"16px" }}>

        {/* ══ STATS TAB ══ */}
        {tab==="input" && (
          <div>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              <button onClick={()=>{setStats({...EXAMPLE_STATS});setIgn("Snacks");setCls("Hero");}} style={{ flex:1,padding:"8px",background:"#1a1a2e",border:"1px solid #2e2e50",borderRadius:8,color:"#9b72f8",fontSize:11,cursor:"pointer",fontWeight:600 }}>⚡ Load Example</button>
              <button onClick={()=>setStats({...EMPTY_STATS})} style={{ flex:1,padding:"8px",background:"#1a1010",border:"1px solid #3a1a1a",borderRadius:8,color:"#c0392b",fontSize:11,cursor:"pointer",fontWeight:600 }}>🗑 Clear</button>
            </div>

            {/* Image upload */}
            <label style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:"#0d0d1c",border:"1px dashed #3a3a58",borderRadius:10,cursor:"pointer",marginBottom:14 }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#7b52e8"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#3a3a58"}>
              <span style={{fontSize:22}}>📸</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#9b72f8"}}>{imgPreview?"Change screenshot":"Upload stats screenshot"}</div>
                <div style={{fontSize:10,color:"#444",marginTop:2}}>Character → Stats panel → tap your CP number to see all stats</div>
              </div>
              <span style={{fontSize:18,color:"#333"}}>+</span>
              <input type="file" accept="image/*" onChange={handleImg} style={{display:"none"}} />
            </label>
            {imgPreview && (
              <div style={{marginBottom:10,position:"relative"}}>
                <img src={imgPreview} alt="stats" style={{width:"100%",borderRadius:8,border:"1px solid #2a2a40",maxHeight:220,objectFit:"contain",background:"#0a0a18"}}/>
                <button onClick={()=>setImgPreview(null)} style={{position:"absolute",top:5,right:5,background:"#c0392b",border:"none",borderRadius:"50%",width:22,height:22,color:"#fff",cursor:"pointer",fontSize:13,lineHeight:"22px",fontWeight:700}}>×</button>
              </div>
            )}
            {imgPreview && (
              <div style={{marginBottom:14,padding:"9px 12px",background:"#0a0e1a",border:"1px solid #1a2a3a",borderRadius:8,fontSize:10,color:"#4a90d9",lineHeight:1.8}}>
                📋 <strong style={{color:"#6ab0f0"}}>From your screenshot, enter:</strong><br/>
                &nbsp;• <span style={{color:"#7b52e8"}}>CP</span> — tap the number at the top of your stat screen<br/>
                &nbsp;• <span style={{color:"#e8a020"}}>Final Damage %</span>, Crit Rate %, Crit Damage % — Required section<br/>
                &nbsp;• Boss/Normal Dmg %, Def Pen %, Attack Speed — Required section<br/>
                &nbsp;• Min/Max Damage Multiplier % — Optional → Damage Stats<br/>
                &nbsp;• STR/DEX/INT/LUK + Max HP — Optional → Character Stats
              </div>
            )}

            {/* REQUIRED */}
            <SectionLabel color="#c0392b">Required · {selLabel}</SectionLabel>
            <div style={{background:"#0c0c1a",borderRadius:10,border:"1px solid #2a1a1a",overflow:"hidden",marginBottom:4}}>
              <StatRow label="Final Damage %"           field="finalDmg"  value={stats.finalDmg}  onChange={update} />
              <StatRow label="Crit Rate %"              field="critRate"  value={stats.critRate}  onChange={update} max={100} />
              <StatRow label="Crit Damage %"            field="critDmg"   value={stats.critDmg}   onChange={update} />
              {type==="boss" && <StatRow label="Boss Monster Damage %"   field="bossDmg"   value={stats.bossDmg}   onChange={update} />}
              {(type==="mob"||type==="pvp") && <StatRow label="Normal Monster Damage %" field="normalDmg" value={stats.normalDmg} onChange={update} />}
              <StatRow label="Defense Penetration %"    field="defPen"    value={stats.defPen}    onChange={update} max={100} />
              <StatRow label="Attack Speed %"           field="atkSpd"    value={stats.atkSpd}    onChange={update} />
              <StatRow label="Accuracy"                 field="accuracy"  value={stats.accuracy}  onChange={update} noSuffix max={9999} step={1} />
              <StatRow label="Evasion"                  field="evasion"   value={stats.evasion}   onChange={update} noSuffix max={9999} step={1} />
            </div>

            {/* OPTIONAL toggle */}
            <button onClick={()=>setShowOptional(p=>!p)} style={{ width:"100%",padding:"8px",background:"#0d0d1c",border:"1px solid #1e1e30",borderRadius:8,color:"#666",fontSize:11,cursor:"pointer",marginBottom:showOptional?0:4,fontWeight:600 }}>
              {showOptional?"▲ Hide":"▼ Show"} Optional Stats
            </button>

            {showOptional && (
              <>
                <SectionLabel color="#555">Damage Stats</SectionLabel>
                <div style={{background:"#0c0c1a",borderRadius:10,border:"1px solid #1a1a28",overflow:"hidden",marginBottom:4}}>
                  {type==="boss" && <StatRow label="Normal Monster Damage %" field="normalDmg" value={stats.normalDmg} onChange={update} />}
                  {(type==="mob"||type==="pvp") && <StatRow label="Boss Monster Damage %" field="bossDmg" value={stats.bossDmg} onChange={update} />}
                  <StatRow label="Damage %"                field="damage"       value={stats.damage}       onChange={update} />
                  <StatRow label="Damage Amplification %"  field="dmgAmp"       value={stats.dmgAmp}       onChange={update} />
                  <StatRow label="Skill Damage %"          field="skillDmg"     value={stats.skillDmg}     onChange={update} />
                  <StatRow label="Basic Attack Damage %"   field="basicAtkDmg"  value={stats.basicAtkDmg}  onChange={update} />
                  <StatRow label="Status Effect Damage %"  field="statusEffectDmg" value={stats.statusEffectDmg} onChange={update} />
                  <StatRow label="Stat Prop. Damage %"     field="statPropDmg"  value={stats.statPropDmg}  onChange={update} />
                  <StatRow label="Min Damage Multiplier %" field="minDmgMult"   value={stats.minDmgMult}   onChange={update} />
                  <StatRow label="Max Damage Multiplier %" field="maxDmgMult"   value={stats.maxDmgMult}   onChange={update} />
                </div>

                <SectionLabel color="#555">Character Stats</SectionLabel>
                <div style={{background:"#0c0c1a",borderRadius:10,border:"1px solid #1a1a28",overflow:"hidden",marginBottom:4}}>
                  <StatRow label="Combat Power (CP)"  field="cp"    value={stats.cp||0}  onChange={update} noSuffix max={99999999999999} step={1000000} />
                  <StatRow label={`Main Stat % (${clsData.mainStat})`} field="mainStatPct" value={stats.mainStatPct} onChange={update} />
                  <StatRow label="STR"  field="str"  value={stats.str}  onChange={update} noSuffix max={999999} step={1} />
                  <StatRow label="DEX"  field="dex"  value={stats.dex}  onChange={update} noSuffix max={99999}  step={1} />
                  <StatRow label="INT"  field="int_" value={stats.int_} onChange={update} noSuffix max={99999}  step={1} />
                  <StatRow label="LUK"  field="luk"  value={stats.luk}  onChange={update} noSuffix max={99999}  step={1} />
                  <StatRow label="Max HP"             field="maxHp"      value={stats.maxHp}      onChange={update} noSuffix max={99999999} step={1} />
                </div>

                <SectionLabel color="#555">Utility / Economy</SectionLabel>
                <div style={{background:"#0c0c1a",borderRadius:10,border:"1px solid #1a1a28",overflow:"hidden",marginBottom:4}}>
                  <StatRow label="EXP Gain %"             field="expGain"       value={stats.expGain}       onChange={update} />
                  <StatRow label="Meso Drop %"             field="mesoDrop"      value={stats.mesoDrop}      onChange={update} />
                  <StatRow label="Damage Taken Decrease %" field="dmgTakenDec"   value={stats.dmgTakenDec}   onChange={update} />
                  <StatRow label="HP Recovery / Sec"       field="hpRecovery"    value={stats.hpRecovery}    onChange={update} noSuffix step={1} />
                  <StatRow label="MP Recovery / Sec"       field="mpRecovery"    value={stats.mpRecovery}    onChange={update} noSuffix step={1} />
                  <StatRow label="Debuff Tolerance"        field="debuffTolerance" value={stats.debuffTolerance} onChange={update} noSuffix step={1} />
                  <StatRow label="Skill CD Decrease %"     field="skillCdDec"    value={stats.skillCdDec}    onChange={update} />
                </div>
              </>
            )}

            <div style={{marginTop:12,padding:"9px 12px",background:"#0a0a14",border:"1px solid #1a1a28",borderRadius:9,fontSize:10,color:"#444",lineHeight:1.7}}>
              📸 <strong style={{color:"#6666aa"}}>Screenshot tip:</strong> Character → Stats panel → tap your <span style={{color:"#7b52e8"}}>CP number</span> to expand all stats · Evasion shows as a flat number · enter Min/Max Dmg Multiplier % in Optional → Damage Stats
            </div>
          </div>
        )}

        {/* ══ PRIORITY TAB ══ */}
        {tab==="priority" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:"#e0e0f0"}}>Stat Priority</div>
                <div style={{fontSize:10,color:"#555",marginTop:1}}>{selLabel} · {cls} — invest in order ↓</div>
              </div>
              <div style={{padding:"3px 8px",background:selGroup?.color+"22",border:`1px solid ${selGroup?.color}44`,borderRadius:20,fontSize:10,color:selGroup?.color,fontWeight:700}}>
                {type==="boss"?"Boss Mode":type==="pvp"?"PvP Mode":"Mob Mode"}
              </div>
            </div>
            {priority.map((p,i)=>{
              const isTop=i<3;
              const pctFill=p.val>0?Math.min(100,(p.val/(p.noSuffix?500:100))*100):0;
              const rankColors=["#ffd700","#c0c0c0","#cd7f32"];
              return (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 12px",marginBottom:6,borderRadius:10,background:isTop?"#0e0e20":"#0a0a16",border:`1px solid ${isTop?"#2a2a44":"#141420"}`}}>
                  <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,background:isTop?rankColors[i]+"22":"#111120",color:isTop?rankColors[i]:"#333",border:`1.5px solid ${isTop?rankColors[i]+"66":"#1a1a28"}`,marginTop:1}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <div style={{fontSize:13,fontWeight:700,color:isTop?"#e8e8f8":"#aaaacc"}}>{p.stat}</div>
                      {p.val>0 && <div style={{fontSize:12,fontWeight:800,color:isTop?"#9b72f8":"#555",flexShrink:0,marginLeft:8}}>{p.val}{p.noSuffix?"":"%"}</div>}
                    </div>
                    <div style={{fontSize:10,color:"#555",marginTop:3,lineHeight:1.5}}>{p.note}</div>
                    {p.val>0 && (
                      <div style={{marginTop:6,height:3,background:"#111120",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,width:`${pctFill}%`,background:isTop?"linear-gradient(90deg,#7b52e8,#9b72f8)":"#2a2a40",transition:"width .3s"}}/>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:10,padding:"9px 12px",background:"#0a0a14",border:"1px solid #1a1a28",borderRadius:9,fontSize:11,color:"#555"}}>
              💡 Upgrade #1 before #2. Switching content type changes this order — always re-check when you swap presets.
            </div>
          </div>
        )}

        {/* ══ SCORE TAB ══ */}
        {tab==="score" && (()=>{
          const grade = score>=95?"S":score>=80?"A":score>=60?"B":score>=35?"C":"D";
          const gc    = {S:"#ffd700",A:"#52a843",B:"#7b52e8",C:"#e8a020",D:"#c0392b"}[grade];
          const gl    = {S:"Legendary",A:"Strong",B:"Solid",C:"Developing",D:"Needs Work"}[grade];
          const urgencyStyle = {
            critical:{ bg:"#1e0000", border:"#6a0000", color:"#ff6b6b", label:"CRITICAL" },
            high:    { bg:"#1a0e00", border:"#5a3000", color:"#e8a020", label:"HIGH" },
            medium:  { bg:"#0e1020", border:"#2a2a50", color:"#7b52e8", label:"MEDIUM" },
            low:     { bg:"#0a0e0a", border:"#1e2e1e", color:"#52a843", label:"LOW" },
            warn:    { bg:"#1a0e00", border:"#5a3000", color:"#e8a020", label:"WARNING" },
            tip:     { bg:"#080e18", border:"#1a2a3a", color:"#4a90d9", label:"TIP" },
            waste:   { bg:"#1e0a0a", border:"#4a1010", color:"#c0392b", label:"WASTE" },
          };
          const statusColor = {good:"#52a843",mid:"#e8a020",low:"#c0392b",empty:"#222",locked:"#1a1a1a"};
          const statusLabel = {good:"✅ Good",mid:"📈 OK",low:"🔴 Low",empty:"— Empty",locked:"🔒 Locked"};

          // ── Full damage multiplier sim (core + secondary + variance) ──
          function calcFullDmg(s) {
            const cr  = Math.min(s.critRate||0, 100);
            const fd  = 1 + (s.finalDmg||0)/100;
            const cm  = cr>=100 ? (1+(s.critDmg||0)/100) : (1+(cr/100)*((s.critDmg||0)/100));
            const bm  = type==="boss" ? (1+(s.bossDmg||0)/100) : (1+(s.normalDmg||0)/100);
            const dp  = 1 + Math.min(s.defPen||0, 60)/100;
            const ms  = 1 + (s.mainStatPct||0)/100;
            const sk  = 1 + Math.min(s.skillDmg||0, 80)/100 * 0.7;
            const amp = 1 + (s.dmgAmp||0)/100;
            const se  = 1 + Math.min(s.statusEffectDmg||0, 40)/100 * 0.4;
            const avgVar = (1 + (s.minDmgMult||0)/100 + 1 + (s.maxDmgMult||0)/100) / 2;
            return fd * cm * bm * dp * ms * sk * amp * se * avgVar;
          }
          const baseMulti = calcFullDmg(stats);
          const INC = 5;

          const allMarginals = [
            {key:"finalDmg",    label:"Final Damage %",      group:"core",      val:stats.finalDmg||0,    blocked:false,
              inc:calcFullDmg({...stats,finalDmg:(stats.finalDmg||0)+INC})},
            {key:"critDmg",     label:"Crit Damage %",       group:"core",      val:stats.critDmg||0,     blocked:stats.critRate<100,
              inc:calcFullDmg({...stats,critDmg:(stats.critDmg||0)+INC})},
            {key:"critRate",    label:"Crit Rate →100%",     group:"core",      val:stats.critRate||0,    blocked:stats.critRate>=100,
              inc:calcFullDmg({...stats,critRate:Math.min((stats.critRate||0)+INC,100)})},
            {key:"contDmg",     label:type==="boss"?"Boss Dmg %":"Normal Mob Dmg %", group:"core",
              val:type==="boss"?(stats.bossDmg||0):(stats.normalDmg||0), blocked:false,
              inc:calcFullDmg(type==="boss"?{...stats,bossDmg:(stats.bossDmg||0)+INC}:{...stats,normalDmg:(stats.normalDmg||0)+INC})},
            {key:"defPen",      label:"Defense Pen %",       group:"core",      val:stats.defPen||0,      blocked:(stats.defPen||0)>=60,
              inc:calcFullDmg({...stats,defPen:Math.min((stats.defPen||0)+INC,60)})},
            {key:"mainStatPct", label:"Main Stat %",         group:"core",      val:stats.mainStatPct||0, blocked:false,
              inc:calcFullDmg({...stats,mainStatPct:(stats.mainStatPct||0)+INC})},
            {key:"skillDmg",    label:"Skill Damage %",      group:"secondary", val:stats.skillDmg||0,    blocked:false,
              inc:calcFullDmg({...stats,skillDmg:(stats.skillDmg||0)+INC})},
            {key:"dmgAmp",      label:"Dmg Amplification %", group:"secondary", val:stats.dmgAmp||0,      blocked:false,
              inc:calcFullDmg({...stats,dmgAmp:(stats.dmgAmp||0)+INC})},
            {key:"minDmgMult",  label:"Min Dmg Multiplier %",group:"variance",  val:stats.minDmgMult||0,  blocked:false,
              inc:calcFullDmg({...stats,minDmgMult:(stats.minDmgMult||0)+INC})},
            {key:"maxDmgMult",  label:"Max Dmg Multiplier %",group:"variance",  val:stats.maxDmgMult||0,  blocked:false,
              inc:calcFullDmg({...stats,maxDmgMult:(stats.maxDmgMult||0)+INC})},
          ].map(m=>({...m, gain:m.blocked?0:Math.max(0,((m.inc/baseMulti)-1)*100)}))
           .sort((a,b)=>b.gain-a.gain);
          const maxGain = Math.max(...allMarginals.map(m=>m.gain),0.01);

          // Damage range stats
          const mn = stats.minDmgMult||0;
          const mx = stats.maxDmgMult||0;
          const dmgSpread = Math.max(0, mx-mn);
          const avgMult   = (mn+mx)/2;
          const consistency = mx>0 ? Math.round((mn/mx)*100) : 0;

          const totalContrib = breakdown.reduce((s,r)=>s+(r.contribution||0),0);
          const bdCore      = breakdown.filter(r=>r.group==="core");
          const bdSecondary = breakdown.filter(r=>r.group==="secondary");
          const bdVariance  = breakdown.filter(r=>r.group==="variance");
          const groupColors = {core:"#7b52e8",secondary:"#4a90d9",variance:"#52a843"};

          function renderBDRow(row) {
            const sc = statusColor[row.status]||"#333";
            const sl = statusLabel[row.status]||"—";
            const pct = row.cap ? Math.min(100,(row.val/row.cap)*100) : 0;
            const contribPct = totalContrib>0 ? (row.contribution/totalContrib)*100 : 0;
            const isLocked = row.status==="locked";
            const isEmpty  = row.status==="empty";
            return (
              <div key={row.key} style={{marginBottom:5,padding:"8px 10px",
                background:isLocked?"#070707":isEmpty?"#09090e":"#0c0c18",
                border:`1px solid ${isLocked?"#0d0d0d":isEmpty?"#131320":sc+"28"}`,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:sc,flexShrink:0,opacity:isLocked?0.3:1}}/>
                  <span style={{fontSize:11,fontWeight:600,color:isLocked?"#2a2a2a":"#c0c0d8",flex:1}}>{row.label}</span>
                  <span style={{fontSize:12,fontWeight:900,color:isLocked?"#1a1a1a":sc}}>
                    {row.val||0}{row.key==="accuracy"||row.key==="evasion"?"":"%"}
                  </span>
                  <span style={{fontSize:8,color:"#1e1e1e",marginLeft:2}}>/{row.cap}{row.key==="accuracy"||row.key==="evasion"?"":"%"}</span>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:row.note?3:0}}>
                  <div style={{flex:1,height:3,background:"#0a0a14",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:2,width:`${pct}%`,transition:"width .3s",
                      background:isLocked?"#0f0f0f":pct>=100?"#52a843":pct>50?"#7b52e8":"#c0392b"}}/>
                  </div>
                  <span style={{fontSize:8,color:"#2a2a3a",width:22,textAlign:"right",flexShrink:0}}>{pct.toFixed(0)}%</span>
                  <div style={{width:1,height:8,background:"#141420",flexShrink:0}}/>
                  <span style={{fontSize:9,fontWeight:700,color:row.contribution>0?"#7b52e8":"#1e1e1e",
                    minWidth:24,textAlign:"right",flexShrink:0}}>
                    {row.contribution>0?`+${row.contribution.toFixed(0)}`:"—"}
                  </span>
                </div>
                {row.note && (
                  <div style={{fontSize:9,color:isLocked?"#5a1a1a":"#484858",lineHeight:1.5,
                    borderTop:"1px solid #0a0a14",paddingTop:3,marginTop:2}}>↳ {row.note}</div>
                )}
              </div>
            );
          }

          return (
            <div>
              {/* ── Score header ── */}
              <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:13,padding:"12px 14px",
                background:"#0a0a18",border:"1px solid #161626",borderRadius:13}}>
                <div style={{position:"relative",width:84,height:84,flexShrink:0}}>
                  <svg width="84" height="84" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
                    <circle cx="42" cy="42" r="35" fill="none" stroke="#0e0e1e" strokeWidth="6"/>
                    <circle cx="42" cy="42" r="35" fill="none" stroke={scoreColor} strokeWidth="6"
                      strokeDasharray={`${2*Math.PI*35}`}
                      strokeDashoffset={`${2*Math.PI*35*(1-score/100)}`}
                      strokeLinecap="round"/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:23,fontWeight:900,color:"#e8e8f0",lineHeight:1}}>{score}</div>
                    <div style={{fontSize:8,color:"#2a2a3a"}}>/ 100</div>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:7,marginBottom:5}}>
                    <div style={{fontSize:36,fontWeight:900,color:gc,lineHeight:1,letterSpacing:-2,
                      textShadow:`0 0 18px ${gc}55`}}>{grade}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:"#d8d8f0"}}>{gl}</div>
                      <div style={{fontSize:9,color:"#383848",marginTop:1}}>{selLabel} · {type==="boss"?"Boss":type==="pvp"?"PvP":"Mob"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:2}}>
                    {["D","C","B","A","S"].map(g=>{
                      const c={S:"#ffd700",A:"#52a843",B:"#7b52e8",C:"#e8a020",D:"#c0392b"}[g];
                      const a=g===grade;
                      return <div key={g} style={{flex:1,height:15,borderRadius:3,display:"flex",
                        alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,
                        background:a?c+"2a":"#09090e",border:`1px solid ${a?c:"#121220"}`,
                        color:a?c:"#1e1e2e"}}>{g}</div>;
                    })}
                  </div>
                </div>
              </div>

              {/* ── Damage Range Panel ── */}
              {(mn>0||mx>0) && (
                <div style={{marginBottom:13,padding:"10px 12px",background:"#080810",
                  border:"1px solid #141424",borderRadius:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                    <span style={{fontSize:10,fontWeight:800,color:"#52a843"}}>📊 Damage Range</span>
                    <div style={{height:1,flex:1,background:"#0e0e1a"}}/>
                    <span style={{fontSize:9,color:"#2a2a3a"}}>consistency: <span style={{
                      color:consistency>=70?"#52a843":consistency>=40?"#e8a020":"#c0392b",fontWeight:700
                    }}>{consistency}%</span></span>
                  </div>
                  <div style={{position:"relative",height:18,background:"#0c0c18",borderRadius:5,
                    overflow:"hidden",marginBottom:6}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,
                      width:`${Math.min(100,mn/3)}%`,
                      background:"linear-gradient(90deg,#7b52e8,#4a90d9)",borderRadius:"5px 0 0 5px"}}/>
                    <div style={{position:"absolute",left:`${Math.min(100,mn/3)}%`,top:0,bottom:0,
                      width:`${Math.min(100-mn/3,dmgSpread/3)}%`,
                      background:"linear-gradient(90deg,#4a90d988,#52a84344)"}}/>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
                      justifyContent:"space-between",padding:"0 7px"}}>
                      <span style={{fontSize:8,fontWeight:700,color:"#d0d0e8"}}>Min {mn}%</span>
                      {dmgSpread>0&&<span style={{fontSize:7,color:"#666"}}>spread ±{(dmgSpread/2).toFixed(0)}%</span>}
                      <span style={{fontSize:8,fontWeight:700,color:"#d0d0e8"}}>Max {mx}%</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,fontSize:9}}>
                    {[
                      {l:"Avg Mult", v:`${avgMult.toFixed(0)}%`, c:"#7b52e8"},
                      {l:"Spread",   v:`${dmgSpread.toFixed(0)}%`, c:dmgSpread>150?"#c0392b":dmgSpread>80?"#e8a020":"#52a843"},
                      {l:"Floor/Ceil",v:`${consistency}%`, c:consistency>=70?"#52a843":consistency>=40?"#e8a020":"#c0392b"},
                    ].map(s=>(
                      <div key={s.l} style={{flex:1,padding:"4px 6px",background:"#0c0c18",borderRadius:5,textAlign:"center"}}>
                        <div style={{color:"#333",marginBottom:1,fontSize:8}}>{s.l}</div>
                        <div style={{fontWeight:800,color:s.c,fontSize:10}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {dmgSpread>120&&<div style={{marginTop:6,fontSize:9,color:"#e8a020",lineHeight:1.5}}>
                    ⚠️ High spread ({dmgSpread.toFixed(0)}%). Raising Min Dmg Mult tightens variance — more reliable DPS in timed content.
                  </div>}
                  {mx>0&&mn===0&&<div style={{marginTop:6,fontSize:9,color:"#c0392b",lineHeight:1.5}}>
                    🚨 Min Dmg Mult is 0 — your damage floor is unprotected. Even small gains here significantly reduce RNG loss.
                  </div>}
                </div>
              )}

              {/* ── Marginal Gain Simulator ── */}
              <div style={{marginBottom:13,padding:"10px 12px",background:"#070710",
                border:"1px solid #121222",borderRadius:10}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                  <span style={{fontSize:11,fontWeight:800,color:"#7b52e8"}}>⚡ Best +5 investment right now</span>
                  <div style={{height:1,flex:1,background:"#0e0e1a"}}/>
                </div>
                <div style={{fontSize:9,color:"#2e2e3e",marginBottom:7}}>% total damage gain from +5 to each stat</div>
                {allMarginals.map((m,i)=>{
                  const barW = m.blocked?0:(m.gain/maxGain)*100;
                  const isTop = i===0&&!m.blocked&&m.gain>0;
                  const gColor = groupColors[m.group]||"#333";
                  const barColor = m.blocked?"#0d0d0d":isTop?"#e8a020":gColor;
                  return (
                    <div key={m.key} style={{marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                        <div style={{width:4,height:4,borderRadius:"50%",background:gColor,
                          opacity:m.blocked?0.15:1,flexShrink:0}}/>
                        {isTop&&<span style={{fontSize:7,fontWeight:900,color:"#e8a020",
                          background:"#1e1000",border:"1px solid #3a2000",borderRadius:5,
                          padding:"0 4px",flexShrink:0}}>BEST</span>}
                        <span style={{fontSize:10,fontWeight:isTop?800:400,
                          color:m.blocked?"#1e1e1e":isTop?"#d8c880":"#666",flex:1}}>{m.label}</span>
                        <span style={{fontSize:9,fontWeight:700,
                          color:m.blocked?"#181818":isTop?"#e8a020":"#383838"}}>
                          {m.blocked?"blocked":m.gain<0.005?"~0":`+${m.gain.toFixed(2)}%`}
                        </span>
                      </div>
                      <div style={{height:4,background:"#0b0b16",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${barW}%`,background:barColor,borderRadius:2,
                          transition:"width .4s",boxShadow:isTop?`0 0 5px ${barColor}66`:undefined}}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{marginTop:7,display:"flex",gap:8,fontSize:8,color:"#2a2a3a",
                  borderTop:"1px solid #0c0c18",paddingTop:6,flexWrap:"wrap"}}>
                  {Object.entries(groupColors).map(([g,c])=>(
                    <div key={g} style={{display:"flex",alignItems:"center",gap:3}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:c}}/>
                      <span style={{textTransform:"capitalize"}}>{g}</span>
                    </div>
                  ))}
                  <span style={{marginLeft:"auto",color:"#1e1e2e"}}>blocked = prereq unmet</span>
                </div>
              </div>

              {/* ── Optimization Roadmap ── */}
              {opts.length>0&&(
                <div style={{marginBottom:13}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                    <span style={{fontSize:10,fontWeight:800,color:"#444",letterSpacing:1,textTransform:"uppercase"}}>Optimization Roadmap</span>
                    <div style={{height:1,flex:1,background:"#111120"}}/>
                    <span style={{fontSize:9,color:"#1e1e2e"}}>{opts.length}</span>
                  </div>
                  {opts.map((o,i)=>{
                    const s=urgencyStyle[o.urgency]||urgencyStyle.tip;
                    return (
                      <div key={i} style={{padding:"9px 11px",background:s.bg,
                        border:`1px solid ${s.border}`,borderRadius:8,marginBottom:5}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:7}}>
                          <div style={{width:19,height:19,borderRadius:4,background:s.color+"18",
                            border:`1px solid ${s.color}33`,display:"flex",alignItems:"center",
                            justifyContent:"center",fontSize:10,flexShrink:0,marginTop:1}}>{o.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:2}}>
                              <span style={{fontSize:7,fontWeight:900,color:s.color,background:s.color+"15",
                                border:`1px solid ${s.color}28`,borderRadius:5,padding:"1px 4px",
                                letterSpacing:.5,flexShrink:0}}>{s.label}</span>
                              <span style={{fontSize:11,fontWeight:800,color:"#c8c8e0"}}>#{i+1} — {o.title}</span>
                            </div>
                            <div style={{fontSize:10,color:"#666",lineHeight:1.7}}>{o.detail}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Grouped Stat Breakdown ── */}
              {[
                {label:"Core Multipliers",  rows:bdCore,      color:"#7b52e8", note:"Direct formula multipliers — highest ROI"},
                {label:"Secondary Damage",  rows:bdSecondary, color:"#4a90d9", note:"Additive pool — strong once core is solid"},
                {label:"Damage Range",       rows:bdVariance,  color:"#52a843", note:"Min=floor · Max=ceiling · avg affects DPS"},
              ].map(section=>(
                <div key={section.label} style={{marginBottom:11}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <div style={{width:3,height:12,borderRadius:2,background:section.color,flexShrink:0}}/>
                    <span style={{fontSize:10,fontWeight:800,color:section.color}}>{section.label}</span>
                    <div style={{height:1,flex:1,background:"#0e0e1a"}}/>
                    <span style={{fontSize:8,color:"#2a2a3a",maxWidth:130,textAlign:"right",lineHeight:1.3}}>{section.note}</span>
                  </div>
                  {section.rows.map(renderBDRow)}
                </div>
              ))}

            </div>
          );
        })()}

        {/* ══ ARTIFACTS TAB ══ */}
        {tab==="artifact" && (
          <div>
            {/* BiS 3-slot set */}
            <div style={{marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#e8e8f0"}}>Best 3-Slot Set</div>
                  <div style={{fontSize:10,color:"#555",marginTop:1}}>{selLabel}</div>
                </div>
                <div style={{fontSize:10,color:"#52a843",fontWeight:700,background:"#52a84322",border:"1px solid #52a84344",borderRadius:12,padding:"2px 8px"}}>🟢 Leg. = Best</div>
              </div>

              {artSet.slots.map((s,i)=>{
                const art = ALL_ARTIFACTS.find(a=>a.id===s.id);
                if (!art) return null;
                const tc = TIER_COLOR[s.tier]||"#7b52e8";
                const isLeg = art.rarity==="Legendary";
                return (
                  <div key={i} style={{display:"flex",gap:10,padding:"12px 14px",background: isLeg?"#0c1a0c":"#100e1a",border:`1px solid ${isLeg?"#1e3a1e":tc+"44"}`,borderRadius:10,marginBottom:8,alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:tc+"22",border:`2px solid ${tc}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{art.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:10,color:"#0d0d0d",background:isLeg?"#52a843":"#e8a020",borderRadius:4,padding:"1px 5px",fontWeight:800}}>{isLeg?"Legendary":"Unique"}</span>
                        <div style={{fontSize:13,fontWeight:800,color:"#e0e0f0"}}>{art.name}</div>
                        <div style={{fontSize:9,fontWeight:700,color:tc,background:tc+"22",border:`1px solid ${tc}44`,borderRadius:4,padding:"1px 5px",marginLeft:"auto"}}>{s.tier}</div>
                      </div>
                      <div style={{fontSize:10,color:isLeg?"#52a843":"#d4a020",marginBottom:3}}>✦ {art.equipped}</div>
                      <div style={{fontSize:11,color:"#666",lineHeight:1.6}}>{s.reason}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alts */}
            <div style={{padding:"10px 14px",background:"#0c0c1a",border:"1px solid #1a1a28",borderRadius:9,marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Alternatives if slots unavailable</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {artSet.alts.map(a=>(
                  <div key={a} style={{padding:"3px 10px",background:"#141428",border:"1px solid #2a2a40",borderRadius:20,fontSize:10,color:"#888"}}>{a}</div>
                ))}
              </div>
            </div>

            <div style={{padding:"10px 14px",background:"#0e1a0e",border:"1px solid #1e3a1e",borderRadius:9,fontSize:11,color:"#52a843",lineHeight:1.7,marginBottom:16}}>
              🟢 {artSet.note}
            </div>

            {/* Full artifact reference */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:10,fontWeight:800,color:"#555",letterSpacing:1.2,textTransform:"uppercase"}}>All Artifacts — Reference</span>
              <div style={{height:1,flex:1,background:"#1a1a28"}}/>
            </div>

            {["Legendary","Unique"].map(rarity=>(
              <div key={rarity} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:rarity==="Legendary"?"#52a843":"#e8a020",letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>
                  {rarity==="Legendary"?"🟢":"🟡"} {rarity}
                </div>
                {ALL_ARTIFACTS.filter(a=>a.rarity===rarity).map((art,i)=>{
                  const [open,setOpen] = [false,()=>{}]; // no expandable needed, show inline
                  return (
                    <ArtCard key={art.id} art={art} />
                  );
                })}
              </div>
            ))}

            <div style={{marginTop:4,padding:"9px 12px",background:"#1a0f0a",border:"1px solid #3a2010",borderRadius:9,fontSize:11,color:"#aa6644"}}>
              ⚠️ Boss DMG artifacts = zero value in mob content. Normal DMG = zero vs bosses. Always swap presets.
            </div>
          </div>
        )}

        {/* ══ COMPANION TAB ══ */}
        {tab==="companion" && (
          <div>
            {/* Settings */}
            <div style={{background:"#0c0c1a",border:"1px solid #1e1e30",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#9b72f8",marginBottom:10}}>Your Setup</div>

              {/* Companion level */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <label style={{fontSize:12,color:"#888",flex:1}}>Companion Level (summon slots)</label>
                <select value={compLevel} onChange={e=>setCompLevel(Number(e.target.value))}
                  style={{background:"#0b0b18",border:"1px solid #252540",borderRadius:6,color:"#e8e8f0",fontSize:13,fontWeight:600,padding:"4px 8px",outline:"none"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(l=>(
                    <option key={l} value={l}>Lv {l} — {l>=7?"1 main + 6 sub":l>=2?`1 main + ${l-1} sub`:"1 main only"}</option>
                  ))}
                </select>
              </div>

              {/* Unlocked companions */}
              <div style={{fontSize:11,color:"#555",marginBottom:6}}>Unlocked companions (tap to toggle)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {ALL_COMPANIONS.map(c=>{
                  const on=unlockedIds.has(c.id);
                  return (
                    <button key={c.id} onClick={()=>toggleComp(c.id)} style={{
                      padding:"3px 9px",borderRadius:20,fontSize:10,cursor:"pointer",
                      border: on?`1.5px solid ${c.color}`:"1px solid #1e1e30",
                      background: on?c.color+"22":"#0d0d1c",
                      color: on?c.color:"#444", transition:"all .1s",
                    }}>{c.emoji} {c.name}</button>
                  );
                })}
              </div>
            </div>

            {/* Recommended preset */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#e8e8f0"}}>Recommended Preset</div>
                  <div style={{fontSize:10,color:"#555",marginTop:1}}>{selLabel} · {compLevel>=7?"1 main + 6 subs":`1 main + ${Math.max(0,compLevel-1)} subs`}</div>
                </div>
                <div style={{padding:"3px 8px",background:selGroup?.color+"22",border:`1px solid ${selGroup?.color}44`,borderRadius:20,fontSize:10,color:selGroup?.color,fontWeight:700}}>
                  {type==="boss"?"Boss":type==="pvp"?"PvP":"Mob"}
                </div>
              </div>

              {/* Main companion */}
              {compPreset.main && (()=>{
                const c=ALL_COMPANIONS.find(x=>x.id===compPreset.main);
                if(!c) return null;
                return (
                  <div style={{padding:"12px 14px",background:"#0f0f22",border:`2px solid ${c.color}66`,borderRadius:12,marginBottom:10,position:"relative"}}>
                    <div style={{position:"absolute",top:8,right:10,fontSize:9,fontWeight:800,color:"#ffd700",background:"#ffd70022",border:"1px solid #ffd70044",borderRadius:6,padding:"2px 6px"}}>MAIN</div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <span style={{fontSize:26}}>{c.emoji}</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:c.color}}>{c.name}</div>
                        <div style={{fontSize:10,color:TIER_COLOR[c.tier],fontWeight:700}}>Tier {c.tier} · {type==="mob"?"Mob Main":"Boss Main"}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#8888cc",lineHeight:1.65}}>🟢 {c.legendaryAbility}</div>
                  </div>
                );
              })()}

              {/* Sub companions */}
              <div style={{fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Sub Companions ({compPreset.subs.length}/{compLevel>=7?6:Math.max(0,compLevel-1)})</div>
              {compPreset.subs.length===0 && (
                <div style={{padding:"10px",background:"#0d0d1c",border:"1px solid #1e1e30",borderRadius:8,fontSize:11,color:"#444",textAlign:"center"}}>Unlock more companions to fill sub slots</div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {compPreset.subs.map((id,i)=>{
                  const c=ALL_COMPANIONS.find(x=>x.id===id);
                  if(!c) return null;
                  return (
                    <div key={i} style={{padding:"10px 12px",background:"#0c0c1a",border:`1px solid ${c.color}44`,borderRadius:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <span style={{fontSize:18}}>{c.emoji}</span>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:c.color}}>{c.name}</div>
                          <div style={{fontSize:9,color:TIER_COLOR[c.tier],fontWeight:700}}>Tier {c.tier}</div>
                        </div>
                      </div>
                      <div style={{fontSize:10,color:"#555",lineHeight:1.5}}>{c.subNote}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All companion reference */}
            <div style={{marginTop:14}}>
              <SectionLabel color="#555">All Companions — Quick Reference</SectionLabel>
              <div style={{background:"#0c0c1a",border:"1px solid #1a1a28",borderRadius:10,overflow:"hidden"}}>
                {ALL_COMPANIONS.map((c,i)=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:i<ALL_COMPANIONS.length-1?"1px solid #0e0e1c":"none",opacity:unlockedIds.has(c.id)?1:0.35}}>
                    <span style={{fontSize:16}}>{c.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:c.color}}>{c.name}</div>
                      <div style={{fontSize:10,color:"#555"}}>{c.legendaryAbility}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{fontSize:11,fontWeight:800,color:TIER_COLOR[c.tier]}}>{c.tier}</div>
                      <div style={{fontSize:9,color:"#444"}}>{c.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ GUIDES TAB ══ */}
        {tab==="guides" && (
          <div>
            {activeGuide?(
              <GuideDetail guide={GUIDES.find(g=>g.id===activeGuide)} onBack={()=>setActiveGuide(null)}/>
            ):(
              <>
                <div style={{fontSize:11,color:"#444",marginBottom:16}}>Guild knowledge base — Journey Discord guides</div>
                {GUIDES.map(g=><GuideCard key={g.id} guide={g} onClick={()=>setActiveGuide(g.id)}/>)}
                <div style={{marginTop:12,padding:"10px 12px",background:"#0d0d1c",borderRadius:8,border:"1px dashed #2a2a3a",fontSize:11,color:"#444",textAlign:"center"}}>
                  More guides coming — Conquest, Arena, Raid Boss…
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ INFO TAB ══ */}
        {tab==="info" && (
          <div>
            {/* Hero banner */}
            <div style={{padding:"16px",background:"linear-gradient(135deg,#0e0e22,#1a1030)",border:"1px solid #2a2044",borderRadius:12,marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#7b52e8",textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>How Your Score Is Calculated</div>
              <div style={{fontSize:15,fontWeight:900,color:"#e8e8f8",lineHeight:1.4,marginBottom:8}}>
                ATK × <span style={{color:"#e8a020"}}>FinalDMG%</span> × <span style={{color:"#9b72f8"}}>CritDMG%</span> × <span style={{color:"#52a843"}}>BossDMG%</span> × <span style={{color:"#4a90d9"}}>DefFactor</span>
              </div>
              <div style={{fontSize:11,color:"#666",lineHeight:1.7}}>Each stat multiplies the others. Final Damage% is applied last — it amplifies everything. That's why it's always #1.</div>
            </div>

            {/* Score components */}
            <div style={{marginBottom:20}}>
              <SectionLabel color="#555">Score Components (0–100)</SectionLabel>
              {[
                {label:"Final Damage %",     weight:"~35%",color:"#e8a020",desc:"Highest weight. Applied as the final multiplier — amplifies every other stat."},
                {label:"Crit Damage %",       weight:"~25%",color:"#9b72f8",desc:"Only counted when Crit Rate ≥ 100%. At 82% crit, only 82% of Crit DMG is effective."},
                {label:"Boss / Normal DMG %", weight:"~20%",color:"#52a843",desc:"Content-specific. Boss DMG = zero vs mobs. Normal DMG = zero vs bosses."},
                {label:"Defense Penetration %",weight:"~12%",color:"#4a90d9",desc:"Reduces monster effective defense. Formula: 6000/(6000+def). Stronger vs high-armor targets."},
                {label:"Main Stat %",         weight:"~8%", color:"#d4af37",desc:"Scales your base attack line. % stat is far more valuable than flat stat in late game."},
              ].map((c,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"10px 12px",background:"#0c0c1a",borderRadius:9,marginBottom:6,border:`1px solid ${c.color}22`}}>
                  <div style={{width:4,borderRadius:4,background:c.color,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <div style={{fontSize:12,fontWeight:700,color:c.color}}>{c.label}</div>
                      <div style={{fontSize:10,color:c.color,opacity:.7,fontWeight:700}}>{c.weight}</div>
                    </div>
                    <div style={{fontSize:11,color:"#666",marginTop:3,lineHeight:1.6}}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hard caps */}
            <div style={{marginBottom:20}}>
              <SectionLabel color="#555">Hard Caps — Never Exceed</SectionLabel>
              <div style={{background:"#0c0c1a",border:"1px solid #2a1a1a",borderRadius:10,overflow:"hidden"}}>
                {[
                  {stat:"Evasion",     cap:"~70% chance",color:"#c0392b",note:"Hard cap. A flat Evasion value of ~217 already exceeds this — further investment is wasted."},
                  {stat:"Crit Rate",   cap:"100%",       color:"#e8a020",note:"Hard cap. Beyond 100% does nothing. Crit DMG% only has value once you're here."},
                  {stat:"Attack Speed",cap:"120%",       color:"#7b52e8",note:"Soft cap. Severe diminishing returns. Don't sacrifice primary damage stats to push AS."},
                ].map((h,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<2?"1px solid #111120":"none"}}>
                    <div style={{padding:"2px 8px",borderRadius:6,background:h.color+"22",border:`1px solid ${h.color}44`,fontSize:11,fontWeight:800,color:h.color,flexShrink:0}}>{h.cap}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#ccc"}}>{h.stat}</div>
                      <div style={{fontSize:10,color:"#555",marginTop:1}}>{h.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Def Pen deep dive */}
            <div style={{marginBottom:20}}>
              <SectionLabel color="#555">Defense Penetration Deep Dive</SectionLabel>
              <div style={{padding:"12px 14px",background:"#0c0c1a",border:"1px solid #1a2a3a",borderRadius:10}}>
                <div style={{fontFamily:"monospace",fontSize:12,color:"#4a90d9",marginBottom:8}}>Dmg% = 6000 / (6000 + monster_def × (1 − defPen))</div>
                <div style={{fontSize:11,color:"#666",lineHeight:1.8}}>
                  vs 6k defense boss at 0 Def Pen: you deal 50% of your damage.{"\n"}
                  At 10% Def Pen: 6000/(6000+5400) = 52.6% → <span style={{color:"#52a843"}}>+5.3% boost</span>{"\n"}
                  At 20% Def Pen: 6000/(6000+4800) = 55.6% → <span style={{color:"#52a843"}}>+11.1% boost</span>{"\n"}
                  Multiple lines stack as: (1−x1)(1−x2)(1−x3) — near-linear, not hard-diminishing.
                </div>
              </div>
            </div>

            {/* Content cheat sheet */}
            <div>
              <SectionLabel color="#555">Content Type Cheat Sheet</SectionLabel>
              <div style={{background:"#0c0c1a",border:"1px solid #1a1a28",borderRadius:10,overflow:"hidden"}}>
                {[
                  {type:"Boss Content",  ex:"Chapter Boss, Breakthrough, World Boss, Raid, GW, Conquest",stat:"Boss DMG%",  color:"#c0392b"},
                  {type:"Mob Content",   ex:"Training Grounds, Chapter Hunt, EXP Dungeon, Fish Dungeon",  stat:"Normal DMG%",color:"#52a843"},
                  {type:"Arena PvP",     ex:"Arena ranked matches — opponents count as normal mobs",       stat:"Normal DMG%",color:"#e74c3c"},
                ].map((r,i)=>(
                  <div key={i} style={{padding:"10px 14px",borderBottom:i<2?"1px solid #111120":"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#e0e0f0"}}>{r.type}</div>
                      <div style={{fontSize:10,fontWeight:700,color:r.color,background:r.color+"22",padding:"2px 7px",borderRadius:5}}>Use {r.stat}</div>
                    </div>
                    <div style={{fontSize:10,color:"#555"}}>{r.ex}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,padding:"9px 12px",background:"#1a0f0a",border:"1px solid #3a2010",borderRadius:9,fontSize:11,color:"#aa6644"}}>
                ⚠️ Boss DMG% = absolute zero in mob content, and vice versa. Always swap your preset.
              </div>
            </div>
          </div>
        )}

      </div>

      <div style={{padding:"12px 16px",borderTop:"1px solid #0f0f1e",marginTop:8}}>
        <div style={{fontSize:10,color:"#222234",textAlign:"center"}}>Journey Guild · MapleStory Idle RPG Optimizer</div>
      </div>
    </div>
  );
}
