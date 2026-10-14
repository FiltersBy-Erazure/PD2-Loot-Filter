# Season 14 Alliance Beta Patch Notes (2026-10-12)

The closed-beta update of 2026-10-12 (BH.dll / ProjectDiablo.dll built 2026-10-12 23:5x UTC), as posted. The game
data differs in places: see the game-data repo's diff (`PD2-Game-Data`, `beta-2026-10-10-2141` to
`beta-2026-10-12-2351`) and `docs/dev-feedback.md`.


# Skill Changes

Whirlwind
- Base enhanced damage reduced from 40% to 20%
- Enhanced damage per level reduced from 6% to 5%
- Two handed attack frame speed reduced from 5 to 6

Two Handed Weapon Mastery
- Reduced CB efficiency range from 10-25 to 5-20

Fireclaw
- Increased firestorm projectile speed by 50%
- slightly increased range

Combustion
- Synergies reduced from 12% to 8%

Multiple Shot
- Fixed the tooltip not properly matching the s14 values
- Chance to cast multiple shot on X sources can no longer proc other proc effects (Self casted multiple shot remains unchanged)

Sacrifice
- Now cost 3% of your maximum health instead of a % of your physical damage

Power Strike
- Fixed it's nova not spawning

Lightning Strike
- Fixed it's chain lightning not spawning

Decrepify
- Fixed the tooltip displaying incorrect values


# Item Changes

Madness
- 14% chance to cast lower resist on striking increased to 19%
- 14% chance to cast amplify damage on striking increased to 19%

Deception
- +10% critical strike chance reduced to +5-10%
- +15-25% critical strike multiplier reduced to +15-20%


# General Changes

- Added hotkeys for each stash category
- Made affinity disabled by default on stash tabs
- Added an "All Items" tab to the unique stash
- Merged scepters into maces on the uniques stash in order to make room for the all items tab
- Made scrolling while within the stash prioritize scrolling through your current tab
- Added a hotkey for gamble refresh / deposit all materials
- Temporarily disabled Descent from Mount Arreat due to a crash
- Discovery eligibility now persists between games (If players who were eligible for discovery join a new game they are still eligible for discovery on identification)
- Renamed the Bossing tab to Ubers
- Set items are now sorted by required level when searching the tab
- The horadric cube is now disabled in the stash when you do not own it
- Moved the misc stash tab above the map tab
- Added phasing to guild halls


# Bug Fixes

- Fixed the mouse wheel being inverted on the regular stash tabs
- Fixed the guild vault losing sockets on load
- Gambling now properly grants discovery progress
- Gheed event now properly grants discovery progress to users who were there when the event spawned
- Items left on the floor for extended periods now properly grant discovery progress
- Hitpower amulets now properly roll pierce and their proper attack rating values
- Fixed players getting grail credit from different acts
- Fixed the paladin and necromancer ear tooltips being reversed on maps
- Fixed a crash when hovering over ears
- Fixed losing buffs on act transition
- Fixed chat reloading on act transition
- Fixed the mouse cursor jumping to the middle of the screen on act transition
- Fixed the edge of the map being visible on the new dark temple map
- Fixed the guild floors sometimes displaying the incorrect tile
- Fixed the 9th stash tab missing it's hover tooltip
- Fixed the new stash tabs not displaying their sockets or socketed items
- Fixed Enhanced Damage and Enhanced Defense not applying on Unique and Set stash tabs
- Fixed portal shrines still spawning
- Fixed several guild name strings
- Fixed phasing also allowing players to walk through doors


# Prefix changes

- +2 to class skill affixes can now spawn on dropped rare chest, helm and shields
- Visceral (+301-400% Enhanced Damage) is now a dropped rare only affix and can spawn on all weapon types (excluding staves, orbs and wands)
- Scintillating (+12-15 all resistance) can now also spawn on dropped rare rings
- Celestial (+301-400 to Attack Rating against Demons, +201-300% Damage to Demons) is now a dropped rare only affix and can now spawn on all weapons instead of only magic bows and crossbows
- Vanguard's (physical damage reduced by 4-6%) can now spawn on dropped rare helmets, chests and shields
- Immortal's (physical damage reduced by 6-10%) can now spawn on dropped rare chests and shields
- Savage (66-80% enhanced damage) can now spawn on rare dropped quivers
- Unearthly (+101-150 to Attack Rating against Demons, +51-100% Damage to Demons) can now also spawn on dropped rare quivers
- Pure (+76-175 to Attack Rating against Undead, +76-125% Damage to Undead) can now also spawn on dropped rare quivers
- Devastating (10-20% deadly strike) can now spawn on dropped rare gloves
- Devastating (20-30% deadly strike) can now spawn on dropped rare helmets
- Devastating (10-20% crushing blow) can now spawn on dropped rare gloves
- Destructive (20-30% crushing blow) can now spawn on dropped rare helmets
- Deadly strike no longer spawns on circlets, coronets, tiaras or diadems
- Crushing blow no longer spawns on circlets, coronets, tiaras or diadems
- Deadly (21-30% enhanced damage) no longer spawns on helmets (still spawns on circlets)
- Reinforcing (20-40% enhanced damage) can now spawn on, magic, rare and crafted helmets
- Empowering (40-60% enhanced damage) can now spawn on magic, rare and crafted helmets
- Bolstering (60-80% enhanced damage) can now spawn on dropped rare helmets
- Gloves can now roll up to 60% enhanced damage on magic, rare and crafted gloves
- Marshal's (+3 to offensive aura's (paladin only)) can now spawn on dropped rare paladin shields
- Rose Branded (+3 to combat skills (paladin only)) can now spawn on dropped rare paladin shields
- Guardian's (+3 to defensive auras (paladin only)) can now spawn on dropped rare paladin shields
- Golemlord's (+3 to summoning skills (necromancer only)) can now spawn on dropped rare wands
- Cursing (+3 to curses (necromancer only)) can now spawn on dropped rare wands
- Powered (+3 to lightning spells (sorceress only)) can now spawn on dropped rare staves and orbs
- Volcanic (+3 to fire spells (sorceress only)) can now spawn on dropped rare staves and orbs
- Glacial (+3 to cold spells (sorceress only)) can now spawn on dropped rare staves and orbs
- Archer's (+3 to bow and crossbow skills (amazon only)) can now spawn on dropped rare bows
- Lancer's (+3 to javelin and spear skills (amazon only)) can now spawn on dropped rare amazon spears and javelins
- Communal (+3 to shape shifting (druid only)) can now spawn on dropped rare clubs and druid pelts
- Gaean +3 to Elemental (druid only)) can now spawn on dropped rare clubs and druid pelts
- Keeper's +3 to Summoning (druid only)) can now spawn on dropped rare clubs and druid pelts
- Cunning (+3 to traps (assassin only)) can now spawn on dropped rare claws and non throwing daggers
- Kenshi's (+3 to martial arts (assassin only)) can now spawn on dropped rare claws and non throwing daggers
- Shadow (+3 to shadow disciplines (assassin only)) can now spawn on dropped rare claws and non throwing daggers
- Master's (+3 to combat skills (barbarian only)) can now spawn on dropped rare weapons
- warcries's (+3 to combat skills (barbarian only)) can now spawn on dropped rare weapons
- Combat Masteries's (+3 to combat skills (barbarian only)) can now spawn on dropped rare weapons
- +2-3% to maximum resistances can now spawn on magic, rare and crafted belts
- +3-5% to maximum resistances can now spawn on magic, rare and crafted shields


# Suffix changes

- Savage (+66-80% Enhanced Damage) can now spawn on dropped rare quivers
- of Evisceration (+41-63 to Maximum Damage) can now also spawn on dropped rare weapons (excluding staves, orbs and wands)
- of the Squid (+61-80 to Life) can now also spawn on dropped rare amulets
- of Acceleration (40% faster run/walk) can now spawn on dropped rare boots
- of the Archmage (30% faster cast rate) can now spawn on dropped rare chests and shields
- of the Magus (20% faster cast rate) can now spawn on dropped rare belts, gloves and amulets
- of Thawing (cannot be frozen) can now spawn on dropped rare chests and shields
