# Season 14 Alliance Open Beta Tentative Patch Notes (2026-10-19)

The open-beta notes of 2026-10-19 (posted as a PDF), as posted. Screenshot text is transcribed where it shows
item stats; the credits are left out. Checked against the game data of the beta build 2026-10-19 10:31 UTC
(game-data repo `PD2-Game-Data`, `beta-2026-10-19-1031`): where they differ, see the last section.


# Guilds

- Guilds are here. Create, join, and manage them from the in-game guild menu
- Up to 500 members per guild
- Guild Halls:
  - Each guild gets its own Guild Hall game, with separate halls for softcore/hardcore & ladder/non-ladder
  - Up to 100 players in a Guild Hall game
  - Skills and summons are disabled inside
- Ranks: Initiate, Warrior, Officer, and Guild Master.
- Guild chat notifications when someone joins, leaves, or is kicked
- Steeg Stone:
  - This is the heart of your Guild Hall. Donate gold to it to raise your guild's tier
  - The Steeg also holds your guild's member list, showing each member's rank, name, class and level. You can sort by any column.
  - Members can be removed, promoted, and demoted from the list depending on your rank
  - Members playing a different game type (softcore/hardcore, ladder/non-ladder) are shown in grey.
- Guild Vault:
  - Shared item storage with tabs and shared gold
  - Individual vault tabs can be locked to a minimum rank; the lock toggle is on the tab itself, right click to toggle between rank requirements
- Trophy Case:
  - You can copy an item into the trophy case displaying its icon and tooltip
  - Each displayed item records who added it and when
  - Item slots can be locked and unlocked
- Message Board:
  - Leave messages on the message board for other guildies to read!
- Guild chat: /guild m <message> (/g m)
- Player titles are now hidden in the chat lobby by default to make room for guild tags. Use /showtitles to bring them back.
- The Old Clan System has been retired as it is now replaced with the Guild System
  - New clans can no longer be created. Existing clans aren't affected


# Global Chat

- New global chat: use /global <message> or /gc. It's on by default; turn it off with /toggle GlobalChat
- Who can send: accounts created before the current ladder started, or accounts with a level 30+ character.
- Trading in the global chat is not allowed and can result in a mute


# Notifications

- Separate softcore and hardcore announcements which can be toggled with /toggle ScAnnouncements and /toggle HcAnnouncements
- All announcements can be disabled with /toggle Announcements
- Friend login/logout whispers can be turned off with /toggle FriendsOnline and /toggle FriendsOffline
- Online/offline notifications for guild members, which you can turn off with /toggle GuildOnline and /toggle GuildOffline


# General Changes

- Reworked the Stash
  - Added a Map tab that contains white maps and map materials
  - Added a Unique and Set Tab which will allow you to store 1 copy of each item
  - The materials tab has now been split into the Gems, Runes, Ubers and Misc
  - Search filtering for compendium tabs
  - Removed personal gold
  - Increased shared gold stash cap to 25 million
  - The stash now displays “Search” text over the search bar to make it more clear
  - Ctrl+Shift+Left Click now transfers one material from the stash cube to the stash
  - Ctrl+Shift+Right Click now transfers the entire stack from the stash cube to the stash
  - Added the ability to toggle “Auto Deposit” aka “affinity” on tabs
  - Mousewheel support.
    - Anywhere switches between Stash, Uniques, Sets, Gems, Runes, Ubers and Maps
    - Mousewheel over subcategories switches between subcategories (and wraps around)
    - Mousewheel over compendium page contents switches between pages (and wraps to switch subcategories)
    - You can hold shift while mousewheeling to force swapping between categories
  - Added support for the “Holy Grail Challenge” which we are calling “Discovery”
    - When you self find an item it will be marked in your unique or set tab as self found if the following conditions are met
      - If a party member finds the item you must be within the same act when the item is dropped
      - You must be there when the item is identified
    - Once all items have been self found at least once you will unlock the “Discovery Aura”
    - The top X (minimum top 25, exact number undetermined) players to unlock the Discovery Aura will get an exclusive version infused with lightning
- Removed portal shrines
- Reduced the chance for exploding, poison and fire shrines to appear
- Resistance shrines now grant +10% maximum resists to their respective elements
- Increased the drop rate of worldstone shards in corrupted zones by 50%
- Added shift + left-click dragging across inventory potions to move them into available belt slots
- You can now recreate a character from character select. It keeps the name, hardcore/softcore, guild membership, and creation date. A checkbox picks ladder or non-ladder.
  - If you’re a guild master on hardcore use this feature on death to maintain ownership
- Improved charm inventory visual clarity
  - Unique charms now have a message to signify only being able to equip one of each unique charm
  - Charms will now go slightly transparent when out of the charm inventory
- Mercenaries now receive full experience credit from their owner’s kills
- Removed mercenary experience penalties from monster level differences and the per-kill experience cap. mercenaries still cannot exceed their owner’s level
- Increased the base leash distance of all player pets
- Added a “Deposit Materials” button
  - This button will deposit all stackable materials to their associated tabs
- Reworked stacked items
  - There is no longer a stacked and unstacked version
  - Stackable items can now be placed directly in sockets from the stack
  - Keys are no longer required for stack related recipes
- The following stats now apply to all attack based projectiles created from “multishot” style abilities (e.g. multiple shot, split throw, etc)
  - Blind
  - Open Wounds
  - Crushing Blow
  - Slow
- 18 new “Special Edition” artwork items (rare chance to spawn)
  - Ormus (depending on element of selected skill)
  - Ribcracker (white)
  - Stormspire (light gold)
  - Earthshifter (orange)
  - Fleshripper (crystal red)
  - Buriza Do-Kyanon (dark blue)
  - Hellslayer (dark red)
  - Chance guards
  - Herald of Zakarum (light green)
  - The Grandfather (orange)
  - Venomgrip
  - Giant Skull (dark gold)
  - Headhunter's Glory (black)
  - Medusa's Gaze (crystal blue)
  - Guardian Angel (light blue)
  - Spirit Shroud (white -- inventory art is translucent glowy)
  - String of Ears
  - War Travelers


# Loot Filter

- Added loot-filter settings to always hide healing potions and mana potions (these override filter settings). Rejuvenation and utility potions are unaffected
- Added force show undiscovered and force show unowned options for unique and set items (these override filter settings)
- Added bindable shortcuts for toggling both potion-hiding settings, force show undiscovered, and force show unowned


# Controller

- Added the ability to disable auto aim on a per skill basis
- Changed the joystick movement to stop immediately after releasing the joystick


# Bug Fixes

- Fixed a bug that caused skyfall’s thunderstorm proc to not trigger while the player is casting
- Fixed rarity on maps capping at 31%
- Fixed eaglehorn’s damage capping incorrectly
- Fixed bleed and poison from different sources overriding each other
- Fixed rathma / mendeln stage 3 health not sharing properly when taking poison damage
- Fixed rathma / mendeln stage 3 reducing poison length on top of poison damage
- Fixed WW merc leash kicking in after using WW causing him to yo-yo between monsters/player
- Fixed WW merc using WW against larger monsters getting stuck inside (just WW’s a slightly longer distance against large monster, could still potentially get stuck but should be much less likely)
- Fixed a crash with controller when entering a new game with the show loot button held
- Fixed an issue causing skills that modify animation rate to cause desync (Dragontail, Double Swing, Frenzy, Berserk)
- Fix various other issues with animations that could cause desync
- Fixed a bug causing powerstrike to gain hidden enhanced damage%
- Fixed a bug with fireball/hydra fireball hitting twice under certain conditions
- Fixed a bug with absorb/lifesteal causing enemies with maximum HP to overflow to 0 (DClone)
- Fixed a bug that would cause a C0000005 error to pop-up on game start that required a computer reboot
- Fixed critical strike and deadly strike incorrectly applying to non-weapon physical spells. Twister, tornado, and shockwave retain this functionality
- Fixed mastery bonuses not correctly scaling added flat elemental damage on ranged attacks
- Summons and monsters without weapons now correctly benefit from applicable critical strike and deadly strike bonuses
- Fixed normal mouse quick casting occasionally leaving an unintended namelock


# Maps

- Sanatorium moved to tier 1
- Reduced the frequency of Souls in Sanatorium
- Increased the drop rate of unique maps by 25%
- Added a monsters remaining tracker for maps and corrupted zones
  - Note: The number will not begin tracking down until the majority of the map has been revealed and less than 100 monsters are remaining
- The Poisoned Well map has been added as Tier 1 (Item code: T18) - Made by Roofooevazan
  - Note: This map will have no immunities for the first season it is in rotation
- The Descent from Mount Arreat map has been added as Tier 2 (Item code: T2A) - Made by Isaidwhatever
  - Note: This map will have no immunities for the first season it is in rotation
- The Dark Temple map has been added as Tier 2 (Item code: T29) - Made by Roofooevazan
  - Note: This map will have no immunities for the first season it is in rotation


# Map Events

- Increased dark wanderer event worldstone shard drops from 2–5 to 4–10
- Shadow of mendeln now always drops a splinter of the void

Corrupted Heroes Event
- Reduce health bonus from +200% to +100%
- Reduce bonus loot from +75% to +55%
- Add +55% chance to drop specific base types on ears in order to make each one feel more unique (E.g. Amazon increases chance to drop ranged weapons, Assassin melee weapons, Paladin shields, etc)
  - paladin = increased chance to drop shields
  - sorceress = increased chance to drop caster weapons
  - necromancer = increased chance to drop accessories
    - Note: accessories will include gloves, belts, boots and jewelry
  - barbarian = increased chance to drop helmets and body armors
  - amazon = increased chance to drop ranged weapons
  - assassin = increased chance to drop melee weapons
  - druid = increased chance to drop class-specific items

> Screenshot, Corrupted Amazon's Ear (LI), Quantity: 4: Cube with a map to add treacherous bonuses · +25% monster
> rarity · Monsters have +55% chance to drop additional ranged weapons · Monsters have +55% chance to drop additional
> items · Monsters have +25% increased velocity · Monsters have +50% increased cast and attack speed · Monsters have
> +100% increased health

New Map Event
- This map event will contain an area with super chests and a loot pinata boss
- This area will be filling with deadly sarcophagi spawning constant monsters


# Ubers

Diablo Clone
- Tormented soul pillars are no longer targetable
- Adjusted the pillars in diablo clone to potentially stop projectiles bugging through


# Amazon

- Mana gained per energy increased from +1.5 to +2

Power Strike
- Synergies increased from 20% to 25%

Lightning Strike
- Synergies increased from 8% to 10%

Jab
- Damage scaling per level reduced from +18% to +15%
- Synergies reduced from +15% to +12%

Charged Strike
- Synergies increased from 8% to 10%

Penetrate
- Fixed incorrect tooltip description stating lowers target’s defense instead of pierces enemies physical resistance

Multiple Shot
- Base enhanced damage bonus increased from +30% to +50%
- Base arrow count increased from 3 to 5
- Maximum arrow count increased from 24 to 25
- Enhanced damage per level increased from +2% to +4%

Plague Javelin
- Fixed Javelin and Spear Mastery’s displayed poison damage synergy from 6% to 12% per base point, matching its actual value

Evade
- Fixed Evade’s dodge chance and tooltip. They now use the same scaling, capped at 40%

Valkyrie
- Fixed the Power Strike synergy only applying to the nova instead of also applying to the direct lightning damage

Fire Arrow
- Fixed Immolation Arrow’s synergy not correctly applying to burning ground damage
- Burning ground’s Magic Arrow synergy reduced from 18% to 15% per base point, matching the main skill

Strafe
- Fixed the tooltip displaying one additional attack at low levels
- Now correctly displays 2 attacks at level 1, increasing by 1 per level to a maximum of 5 at level 4

Immolation Arrow
- Fixed trail fire damage scaling differently from the impact ground fire
- Trail damage is now four times its previous value, matching the impact ground fire


# Assassin

- Mana gained per energy increased from +1.75 to +2

Phoenix Strike
- First stage meteor impact synergy reduced from 14% to 10% to match other synergies
- First stage meteor impact damage increased with the following values
  - Level 1-8 damage scaling increased from 10-10 to 12-12
  - Level 8-16 damage scaling increased from 19-21 to 23-25
  - Level 16-22 damage scaling increased from 29-33 to 35-40
  - Level 22-28 damage scaling increased from 38-42 to 46-50
  - Level 28+ damage scaling increased from 46-50 to 55-60
- Third stage Ice damage increased with the following values
  - Base damage increased from 16–32 to 32–64
  - Level 1-8 damage scaling increased from 4–4 to 8–8
  - Level 8-16 damage scaling increased from 8–8 to 16–16
  - Level 16-22 damage scaling increased from 12–13 to 24–26
  - Level 22-28 damage scaling increased from 20–21 to 40–42
  - Level 28+ damage scaling increased from 28–29 to 56–58

Blades of Ice
- Stage 2 wave range slightly increased
- Stage 2 wave deceleration reduced

Fists of Fire
- Fixed burning ground receiving its damage synergy from Phoenix Strike instead of Tiger Strike
- Burning ground now correctly receives 26% damage per base point in Tiger Strike and Dragon Flight

Lightning Sentry
- AI delay reduced from 15 to 13

Chain Lightning Sentry
- AI delay reduced from 15 to 14

Shadow Warrior
- Added tooltip details regarding how the shadow’s skills scale
- Will now cast whatever Assassin buffs the player has applied automatically

Shadow Master
- Added tooltip details regarding how the shadow’s skills scale

Mind Blast
- Fixed dragon flight removing mind blast stacks

Blade Fury
- Claw and dagger mastery now applies
- Fixed blade fury incorrectly displaying 85% weapon damage instead of 75%


# Barbarian

- Mana gained per energy increased from +1 to +1.5

Two Handed Mastery
- Enhanced damage base bonus reduced from +45% to +40%
- Enhanced damage bonus per level reduced from +15% to +10%
- Reduced CB efficiency range from 10-25 to 5-20

One Handed Mastery
- Critical strike cap increased from +35% to +45%

Leap Attack
- Enhanced damage per level increased from +15% to +18%
- Synergies increased from +10% to +14%

Natural Resistance
- All resistance cap reduced from +75% to +65%

Warcry
- Can no longer be casted in shapeshift forms

Concentrate
- Now converts it’s splash damage to magic damage

Whirlwind
- Base enhanced damage reduced from 40% to 20%
- Enhanced damage per level reduced from 6% to 5%
- Two handed attack frame speed reduced from 5 to 6 to match one handed attack frames

Double Throw
- Fixed incorrect mana costs displayed in the tooltips

Split Throw
- Fixed incorrect mana costs displayed in the tooltips


# Druid

- Mana gained per level increased from +2 to +3

Spirit Wolf
- Level 2–8 damage scaling reduced from 2–2 to 1–2
- Level 9–16 damage scaling reduced from 3–3 to 2–3
- Level 17–22 damage scaling increased from 4–4 to 5–6
- Level 23–28 damage scaling increased from 5–5 to 7–8
- Level 29+ damage scaling increased from 6–6 to 9–10
- Health bonus per level increased from +35% to +50%
- Grizzly’s enhanced damage bonus now scales with base points instead of total skill level

Dire Wolves
- Base damage increased from 33–38 to 36–42
- Level 2–8 damage scaling increased from 3–4 to 4–5
- Level 9–16 damage scaling increased from 4–5 to 6–7
- Level 17–22 damage scaling increased from 5–6 to 8–9
- Level 23–28 damage scaling increased from 6–7 to 10–12
- Level 29+ damage scaling increased from 7–8 to 13–14
- Raven and Spirit Wolf damage synergies reduced from 7% to 5% per base point
- Grizzly’s enhanced damage bonus now scales with base points instead of total skill level
- Now have 8% (+1% every second level) physical pierce capping at 20%
- Base health bonus and health bonus per level increased from +50% to +57%
- Spirit Wolf attack rating synergy removed
- Now gains 50 attack rating at skill level 1 and 25 additional attack rating per level

Fissure
- Level 16-22 scaling increased from 12-14 to 14-16
- Level 22-28 scaling increased from 20-22 to 22-24
- Level 28+ scaling increased from 32-34 to 34-36

Fireclaw
- Damage scaling has been completely reworked
- Firestorm trails no longer shotgun and deal much greater damage
  - Note: This should make it’s aoe damage much less reliant on shotgunning and should feel more consistent at longer ranges
- Now deals additional fire damage applied to it’s melee splash damage
- Increased firestorm projectile speed by 50%
- Slightly increased range

Twister
- Beginning acceleration has been increased and it will now taper off to similar speeds as previous
- Base damage increased from 6-8 to 6.5-9
- Level 1-8 damage scaling increased from 2-3 to 2-3.5
- Level 8-16 damage scaling increased from 3.5-4.5 to 4-5
- Level 16-22 damage scaling increased from 9.5-10.5 to 10.5-11.5
- Level 22-28 damage scaling increased from 20-21 to 22-23
- Level 28+ damage scaling increased from 30.5–31.5 to 34–35
- Deadly strike and critical strike now affect twister

Tornado
- Level 1-8 damage scaling increased from 6-8 to 7-9
- Level 8-16 damage scaling increased from 14-16 to 15-18
- Level 16-22 damage scaling increased from 22-24 to 24-26
- Level 22-28 damage scaling increased from 30-32 to 33-35
- Level 28+ damage scaling increased from 38-40 to 42-44
- Deadly strike and critical strike now affect tornado

Hurricane
- Synergies increased from 12% to 13%
- Level 1-8 damage scaling increased from 4-4 to 4-7
- Level 8-16 damage scaling increased from 8-8 to 8-11
- Level 16-22 damage scaling increased from 12-12 to 12-15
- Level 22-28 damage scaling increased from 16-16 to 16-19
- Level 28+ damage scaling increased from 20-20 to 20-23

Grizzly
- Base damage reduced from 20–30 to 17–26
- Level 2–8 damage scaling reduced from 7–7 to 6–6
- Level 9–16 damage scaling reduced from 9–9 to 7–8
- Level 17–22 damage scaling reduced from 11–11 to 9–10
- Level 23–28 damage scaling reduced from 14–14 to 12–12
- Level 29+ damage scaling reduced from 17–17 to 14–15
- Spirit Wolf attack rating synergy removed
- Now gains 50 attack rating at skill level 1 and 25 additional attack rating per level

Shockwave
- Deadly strike and critical strike now affect shockwave

Feral Rage
- Fixed minimum life steal scaling above the intended maximum

Poison Creeper
- Now has a 2 second cooldown

Carrion Vine
- Fixed actual life restoration and synergy values not matching the skill’s displayed values

Solar Creeper
- Fixed actual mana restoration and synergy values not matching the skill’s displayed values
- Fixed Carrion Vine’s synergy not being applied to the summoned creeper

Heart of Wolverine
- Fixed the aura granting more damage and attack rating than displayed
- Actual damage and attack rating scaling reduced from 10% to 8% per additional skill level, matching the tooltip

Spirit of Barbs
- Carrion Vine damage synergy increased from 5% to 7% per base point, matching the displayed value
- Fixed spirit of barbs granting maximum deadly strike with soft points instead of base points
- Now properly grants deadly strike to summons


# Necromancer

- Mana gained per level increased from +2 to +3
- Fixed Necromancer skeleton health tooltips displaying incorrect values

Poison Strike
- Fixed the poison pierce bonus applying beyond the duration of the attack animation

Poison Nova
- Synergies increased from 10% to 11%
- Level 28+ damage scaling per level reduced by 10%

Lower Resist
- -11% to enemy elemental resistance base value increased to -20%
  - Note: Procs have had their level adjusted to offset these changes and will have their old values
  - Note: Monster casted values remain unchanged

Amplify Damage
- -11% to enemy physical resistance base value increased to -15%
  - Note: Procs have had their level adjusted to offset these changes and will have their old values
  - Note: Monster casted values remain unchanged

Decrepify
- Base -% to enemy movement, cast and attack speed increased from -10% to -20%
- -% to monster movement speed now caps at -60%
- Now gains -1% to enemy physical resistance every 2 levels instead of every 3
- Fixed procs not granting the proper value of movement speed slow (was applying at a lower value than intended previously)
- Note: Procs have had their level adjusted to offset these changes and will have their old values
  - Slow values will be slightly buffed, -% to enemy physical resistance values will be the same
- Note: Monster casted values remain unchanged

Skeleton Archer
- Base damage increased from 15–20 to 20–25
- Level 2–8 damage scaling increased from 4–4 to 5–5
- Level 9–16 damage scaling increased from 8–8 to 9–9
- Level 17–22 damage scaling increased from 18–18 to 21–21
- Level 23–28 damage scaling increased from 28–28 to 32–32
- Level 29+ damage scaling increased from 38–38 to 44–44
- Skeletal Mage damage bonus is now displayed on Skeleton Mastery instead of being listed as a synergy on Raise Skeletal Mage

Weaken
- Fixed weaken item procs not reducing enemies defense

Blood Golem
- Cooldown increased from 1 second to 2

Dark Pact
- Base explosion radius increased from 3 to 4


# Paladin

- Mana gained per level increased from +1.5 to +2
- Mana gained per energy increased from +1.5 to +2

Blessed Hammer
- Hammers now phase through walls and objects

Smite
- Fixed several desync issues
- Increased melee splash radius by 20%
- Now benefits from life steal and mana steal

Concentration Aura
- Base chance to be uninterruptible reduced from 20% to 15%
- Chance to be uninterruptible now increases by +1% every 3 levels

Fist of the Heavens
- Reworked the holy bolts to deal damage to enemies they pierce through instead of just the target the bolt was initially targeting
- Added a 3 frame next-hit delay to Holy Bolt projectiles to prevent repeated damage ticks against the same enemy
- Fixed only 4 of fist of heavens holy bolts dealing damage

Thorns
- Now grants a 15% +1% per level chance to apply a second stack of open wounds on attackers takes damage proc

Sacrifice
- Now cost 3% of your maximum health instead of a % of your physical damage
- Fixed the explosion-radius tooltip displaying half the actual radius


# Sorceress

- Mana gained per level increased from +2 to +3
- Life gained per level increased from +1 to +1.25

Blaze
- Velocity scaling changed from a diminishing return scaling that goes from 30-50% to 25% +1% per level (caps at 60%)
- Now grants the player phasing during the duration
  - Note: Phasing allows the player to walk through enemies
- Fixed burning ground incorrectly receiving a damage synergy from Warmth
- Burning ground’s Fire Wall synergy increased from 3% to 6% per base point, matching the skill

Chilling Armor
- Now deals aoe damage on hit similar to blizzard
- Cold enchant synergy replaced with blizzard

Shiver Armor
- Cold enchant synergy replaced with frost nova

Frost Nova
- Synergies increased from 7% to 8%

Lesser Hydra
- Projectile speed increased by 25%

Hydra
- Projectile speed increased by 25%

Teleport
- Improved tooltip description

Warmth
- Fixed Warmth granting percentage attack rating instead of flat attack rating
- Now correctly grants 20 attack rating at level 1 and 10 additional attack rating per level

Meteor
- Fixed burning ground receiving a synergy from Fire Wall instead of Inferno

Fire / Cold Enchant
- Fixed ranged attacks with enchants not properly gaining mastery bonuses


# Items

Matriarchal javelin maximum socket count increased from 2 to 3

Pul Rune
- Chest / Helm / Shield / Quiver
  - Enhanced defense bonus increased from +50% to +75%

Eth Rune
- Chest / Helm / Shield / Quiver
  - Regenerate mana increased by 15% to 20%

Gul Rune
- Chest / Helm / Shield / Quiver
  - +4% to maximum poison resist increased to +5%

Vex Rune
- Chest / Helm / Shield / Quiver
  - +4% to maximum fire resist increased to +5%

Ohm Rune
- Chest / Helm / Shield / Quiver
  - +4% to maximum cold resist increased to +5%

Lo Rune
- Chest / Helm / Shield / Quiver
  - +4% to maximum lightning resist increased to +5%

Armors
- Splint mail maximum socket count increased from 2 to 3
- Plate mail maximum socket count increased from 2 to 3
- Field plate maximum socket count increased from 2 to 3
- Ghost Armor maximum socket count increased from 2 to 3
- Serpentskin Armor maximum socket count increased from 2 to 3
- Demonhide Armor maximum socket count increased from 2 to 3
- Trellised Armor maximum socket count increased from 2 to 3
- Tigulated mail maximum socket count increased from 2 to 3
- Mesh Armor maximum socket count increased from 2 to 3
- Cuirass Armor maximum socket count increased from 2 to 3
- Russet Armor maximum socket count increased from 2 to 3
- Templar Armor maximum socket count increased from 2 to 3
- Armet maximum socket count increased from 2 to 3
- Giant Conch maximum socket count increased from 2 to 3


# Affixes

- Added +2-5% (fire/light/cold/poison/magic) damage as a prefix on jewels
- Implemented a new system that increases the chance for high end affixes to appear on items in maps based on the tier
  - E.g. Tier 1 will receive a small increased chance for high end affixes to drop and Tier 3 will receive a larger increased chance with dungeons receiving the largest increased chance
  - Note: This will be applied in a future beta update

Added several new prefixes
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
- Destructive (10-20% crushing blow) can now spawn on dropped rare gloves
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
- Venomous (+3 to poison and bone skills (necromancer only)) can now spawn on dropped rare wands
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
- Echoing (+3 to warcry skills (barbarian only)) can now spawn on dropped rare weapons
- Furious (+3 to combat masteries (barbarian only)) can now spawn on dropped rare weapons
- +2-3% to maximum resistances can now spawn on magic, rare and crafted belts or shields
- +3-5% to maximum resistances can now spawn on magic, rare and crafted shields

Added several new suffixes
- Savage (+66-80% Enhanced Damage) can now spawn on dropped rare quivers
- of Evisceration (+41-63 to Maximum Damage) can now also spawn on dropped rare weapons (excluding staves, orbs and wands)
- of the Squid (+61-80 to Life) can now also spawn on dropped rare amulets
- of Acceleration (40% faster run/walk) can now spawn on dropped rare boots
- of the Archmage (30% faster cast rate) can now spawn on dropped rare chests and shields
- of the Magus (20% faster cast rate) can now spawn on dropped rare belts, gloves and amulets
- of Thawing (cannot be frozen) can now spawn on dropped rare chests and shields


# Uniques

Halaberd’s Reign
- +2 to masteries removed
- +1-2 to battle cry increased to +2-3
- +1-2 to battle orders increased to +2-3

Doom’s Finger
- +60-80 to maximum damage reduced to +40-60
- +60-80% damage to demons increased to +80-100%
- +20-30% chance of deadly strike increased to +25-35%

Skull Collector
- +2 to necromancer skills increased to +2-3

The Cranium Basher
- 8% chance to cast level 33 amplify damage on striking increased to 14%
  - Note: the level of amplify damage has also been adjusted with the recent curse changes, -% to enemy physical resistance will remain the same value

Plague Bearer
- 5% chance to cast level 14 poison nova on striking increased to 8% chance to cast level 20

Demon Machine
- Chance to cast multiple shot on X sources can no longer proc other proc effects (Self casted multiple shot remains unchanged)

Warshrike
- Removed +25% deadly strike multiplier
- Added +25-35% critical strike multiplier
- Removed +50% deadly strike
- Added +25-35% critical strike chance

Seraph’s Hymn
- +50-80% damage to demons increased to +80-120%
- +50-80% damage to undead increased to +80-120%

Swiftwind Needle
- +20-30% faster run walk increased to +20-40%
- +15-35 to dexterity increased to +25-35

Earth Shifter
- 10% chance to cast level 28 volcano on kill increased to 14%

Sage’s Defiance
- Physical damage taken reduced by 12-20% increased to 15-25%

Templar’s Might
- +20-30 to strength increased to +40-50
- +20-30 to vitality increased to +40-50

Stalkers Cull
- +10% maximum deadly strike removed
- Added +30-50% critical strike multiplier
- Removed +20% chance of deadly strike
- Added +20% chance of critical strike

Leadcrow
- +20% increased attack speed removed
- Added +12% chance to reanimate as foul crow

Flamebellow
- +170-240% enhanced damage increased to +180-240%
- +5-10 to vitality increased to +10-20

Rakescar
- +38 poison damage over 2 seconds increased to +76 poison damage over 2 seconds

Frostburn
- Increase maximum mana +15-25% increased to +20-40%
- +10-20% enhanced defense removed

Viperfork
- 700 poison damage over 1 second increased to 1400 poison damage over 2 seconds

Cerberus Bite
- +1-2 to hunger increased to +2
- +1-2 to feral rage increased to +2
- +80-120% bonus attack rating increased to +120-180%

Pompeii’s Wrath
- Slows target by 10% increased to 40%

Cranebeak
- -25% target defense increased to -75%

Horizon’s Tornado
- +4-6 to tornado (druid only) reduced to +3-4
- +4-6 to twister (druid only) reduced to +3-4
- 15% chance to cast level 28 twister on casting increased to 30% chance to cast level 32 twister on casting

Blood Crescent
- +40-60% enhanced damage increased to +60-80%

Wraith Flight
- +5-15 mana after each kill increased to +8-15
- Added +6% chance to reanimate as wraith
- Adds 200-300 magic damage increased to adds 200-450

Pus Spitter
- +2-3 to all skills reduced to +2

The Patriarch
- -40% increased attack speed removed

Bing Sz Wang
- 33% chance to cast level 15 frozen orb increased to level 25

Stormspike
- 75% Chance to cast Level 23 charged bolt when struck changed to 25% chance to cast level 32 charged bolt on striking

Shatterblade
- 16% chance to cast level 32 ice barrage on kill increased to 18%

Fleshripper
- +2 to martial arts (assassin only) increased to +2-3
- +300-360 open wounds damage per second increased to +320-360

Demon’s Arch
- -[10-20]% to enemy lightning resistance increased to -[15-25]%
- -[10-20]% to enemy fire resistance increased to -[15-25]%

Fenris
- -5 to -10% to enemy physical resistance reduced to -5 to -8%

Uldyssian’s Awakening
- +3-4 to amazon skills removed
- Added +3-4 to all skills

Witherstring
- Added slows target by 30%

Rogue’s Bow
- +2-3 to guided arrow (amazon only) changed to +2-3 to multiple shot (amazon only)

Kuko Shakaku
- +2 to mana after each kill increased to +3-6

Cliff Killer
- Adds [5-10] to [20-30] Damage increased to [10-20] to [30-40]

Goldstrike Arch
- +200-250% enhanced damage increased to +225-275%

The Fetid Sprinkler
- 160 poison damage over 4 seconds increased to 160 poison damage over 2 seconds

Astreon’s Iron Ward
- Slows target by 15% increased to 25%

The Salamander
- 20% chance to cast level 14 lesser hydra on casting increased to 24%

Maelstrom
- +1-2 to mana after each kill increased to +2-3

Blackhand Key
- +1-2 to necromancer skills increased to +2

Mageslayer
- Added +1 to assassin skills

Whispering Mirage
- -5 to -8% physical resistance pierce reduced to -5%
- +2 to shadow warrior and shadow master now rolls +1-2

Shadow Killer
- +4-8 to mana after each kill increased to +5-8
- +20% faster cast rate increased to +25%
- 33% chance to cast level 24 frost nova on striking increased to level 50

Armageddon’s Blade
- “Charsi’s forge is said to burn even hotter this season”

Added a new unique “Warriv’s Warder”

> Screenshot, Warriv's Warder (Heater, required level 43): +6 to Dodge [6-8] · +22% Faster Run/Walk [20-30] · -100%
> Increased Chance of Blocking · +20% Chance of Crushing Blow · +103 Defense [100-150] · Heal Stamina Plus 75% · All
> Resistances +35 · +5 Lightning Absorb

Added a new unique “Spectral Plate” - tc87
- Note: Phasing allows you to walk through other player/monster hitboxes

> Screenshot, Spectral Plate (Great Hauberk, required level 65): Indestructible · Phasing When Equipped · +1 to All
> Skills · +37 to Energy [24-38] · Lightning Resist +43% [40-50] · Physical Damage Taken Reduced by 11% [8-12] ·
> Ethereal (Cannot be Repaired)


# Runewords

Added a new runeword “Madness” - 4 socket weapons

> Screenshot, Madness (Berserker Axe, 'SurMalVexShael', required level 64): Melee Attacks Deal Splash Damage · 19%
> Chance to cast level 26 Lower Resist on striking · 8% Chance to cast level 11 Life Tap on striking · 19% Chance to
> cast level 27 Amplify Damage on striking · +45% Increased Attack Speed · +219% Enhanced Damage [200-250] · +75 to
> Maximum Damage [70-120] · 7% Mana stolen per hit · Prevent Monster Heal · All Resistances +24 [20-30] · +4 Life
> after each Kill · Socketed (4)

Added a new runeword “Finesse” - 3 socket armor

> Screenshot, Finesse (Mesh Armor, 'NefRalDol', required level 31): +20% Increased Attack Speed · +32% Chance to
> Pierce [25-35] · +100% Enhanced Defense [50-100] · +30 Defense vs. Missile · Replenish Life +20 · Fire Resist +30% ·
> 45% Extra Gold from Monsters · Socketed (3)

Add a new runeword “Deception” - 3 socket helmets

> Screenshot, Deception (Winged Helm, 'FalAmnHel', required level 41): +19% Critical Strike Multiplier [15-20] · +9%
> Chance of Critical Strike [5-10] · +117 Defense [80-120] · +17 to Strength [0-10] · -50 to Life · Attacker Takes
> Damage of 20 · Requirements -15% · Socketed (3)

Added a new runeword “Jealousy” - 3 socket amazon throwing weapons
- Note: the +3 to javelin skills is from the matriarchal javelin weapon base

> Screenshot, Jealousy (Matriarchal Javelin, 'LoGulThul', required level 59): Melee Attacks Deal Splash Damage · +12
> to Split Throw · +3 to Javelin and Spear Skills (Amazon Only) · +2 to Passive and Magic Skills (Amazon Only) · +20%
> Faster Hit Recovery · +283% Enhanced Damage [260-320] · 50% Bonus to Attack Rating · Adds 3-14 cold damage · 5%
> Life stolen per hit · -14% to Enemy Poison Resistance [12-16] · +20% Chance of Deadly Strike · Socketed (3)

Gloom
- Removed 5% damage taken gained as mana
- Added +1 to maximum curses
- +20-40% faster hit recovery reduced to +20%
- +20% increased curse resistance increased to +30-40%

Famine
- -10 to -15% to enemy fire resistance increased to -15 to -20%
- -10 to -15% to enemy lightning resistance increased to -15 to -20%
- -10 to -15% to enemy cold resistance increased to -15 to -20%

Hand of Justice
- Level 12 holy fire aura when equipped increased to level 14

Eternity
- +4 to revive increased to +12

Delirium
- Added +1 to delirium form (oskill)
  - Abilities cannot be used when in delirium form
    - -10% to enemy physical resistance
    - Ignores target’s defense

Epiphany
- +20% faster cast rate increased to +35%
- +1-750 lightning damage increased to 1-1250


# Set Items

Cow King’s Leathers
- Now grants +1 to cow form (oskill) when wearing the full set
  - Abilities cannot be used when in cow form
  - Cow form grants the following bonuses
    - +75% increased chance to find magic items
    - +150% enhanced damage
    - +10% physical damage reduction

Immortal king’s stone crusher
- Enhanced damage reduced from 175–225% to 150–200%
- Damage to demons reduced from 175–225% to 150–200%
- Damage to undead reduced from 175-225% to 150-200%


# Crafting

Hitpower Helmet
- Removed +10-20% faster hit recovery
- Added +10-15% chance to pierce
- +100-200 to attack rating reduced to +100-150

Hitpower Amulet
- Removed +10-20% faster hit recovery
- Added +10-15% chance to pierce
- +150-250 to attack rating reduced to +100-150

Bountiful Amulet
- +1-3 to light radius replaced with +30-50% extra gold from monsters

Bountiful Ring
- +1-3 light radius replaced with 20-30% extra gold from monsters

Bountiful Belt
- +20-30% better chance of getting magic items reduced to +15-25%
- +1-3 light radius replaced with 25-40% extra gold from monsters

Bountiful Gloves
- +15-25% better chance of getting magic items reduced to +10-20%
- +1-3 to light radius replaced with +20-30% extra gold from monsters

Bountiful Boots recipe
- +15-25% better chance of getting magic items reduced to +10-20%
- +1-3 light radius replaced with 20-30% extra gold from monsters

Bountiful Helm
- +20-30% better chance of getting magic items reduced to +15-25%
- +1-3 to light radius replaced with +25-40% extra gold from monsters

Bountiful Quiver
- +20-30% extra gold from monsters increased to 25-40%

Bountiful Weapon
- +20-30% better chance of getting magic items reduced to +15-25%
- +1-3 to light radius replaced with +25-40% extra gold from monsters

Blood Chest/Shield Craft
- +5-8% to maximum health reduced to 5-7%


# Corruptions

- Indestructible corruptions replaced with repair durability

Chest
- +10% curse resistance moved from tier 3 to tier 2
  - +10% curse resistance increased to +10-20%
- +10% faster cast rate moved from tier 2 to tier 3
  - +10% faster cast rate increased to +20%

Boots
- +15-25 replenish life replaced with half freeze duration

Gloves
- +15-25 replenish life replaced with half freeze duration

Belt
- +15-20 replenish life replaced with half freeze duration

Shield
- +10% curse resistance increased to +15-25%

Helm
- +10% curse resistance increased to +10-20%


# Notes vs the game data (build 2026-10-19 10:31 UTC)

Compared with the S13 live data and every closed-beta build (`live-2026-05-13-1541` to `beta-2026-10-19-1031`).

Not in the game data:
- Blood Golem cooldown 1 to 2 seconds, Poison Creeper 2 second cooldown: Skills.txt `delay` is 25 frames (1 second)
  for both, in S13 and in this build
- Worldstone shards +50% in corrupted zones, unique maps +25%: TreasureClassEx and ItemRatio unchanged (code, or a
  later build)
- Shadow Warrior casting the player's buffs: code, not in the tables (the 2026-10-10 notes had "Now applies all of
  your buffs when summoned" on Shadow Master)

Different in the game data:
- Decrepify procs: physical resistance is not the same. Since the 2026-10-15 build (its notes: "Fixed physical
  resistance reduction being locked at -10%") it is -(10 + level/2), with proc levels 4 lower: Exile -10 to -17,
  Lawbringer -15, The Fetid Sprinkler -13, Executioner's Justice -20. Movement slow is 5 more (Exile -28 to -33),
  attack and cast slow unchanged
- Immortal King's Stone Crusher: damage to undead is 125-225 to 100-200 (the notes: 175-225 to 150-200)
- Map tier affix bonus ("will be applied in a future beta update"): in since the 2026-10-12 build (affix versions
  101-104)
- Paladin mana per level: already +2 in S13 (CharStats 8 quarters)
- Master's, Echoing, Furious ("dropped rare weapons"): not on bows, crossbows, staves, wands, scepters, daggers or
  clubs

In the game data, not in these notes:
- Rare circlets roll at most 10% physical damage reduction (of Protecting 10-15 and Vanguard's exclude circlets since
  the 2026-10-12 build; of Defending 5-10 is left): in the 2026-10-10 notes, gone from these
- Phoenix Strike's meteor base damage 20-40 to 24-48
- Decoy's strafe arrows use their own skill (DoppleZonStrafe) since the 2026-10-19 build, with base damage and +10%
  per base point of Strafe and Valkyrie
- Jewel 3-5% elemental skill damage prefixes need affix level 50 (was 42) since the 2026-10-19 build; the new 3-5%
  magic one is named Scintillating (as the all resistances prefix) and is version 100, so it gets no map tier bonus
  (its elemental twins are 102)
