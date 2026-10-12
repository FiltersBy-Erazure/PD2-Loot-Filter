# Season 14 "Alliance": developer stream notes (TENTATIVE)

Summarised from the Reddit recaps by /u/SenpaiSomething (PD2 developer), read 2026-10-04.
**Not patch notes.** The tentative closed-beta patch notes come with the final stream on 2026-10-10 and
are updated during the beta (moderator reply on stream #2), so confirm everything below against them.

- Stream #1 (2026-09-19): https://www.reddit.com/r/ProjectDiablo2/comments/1wl5k87/project_diablo_2_s14_developer_stream_1_recap/
- Stream #2 (2026-09-26): https://www.reddit.com/r/ProjectDiablo2/comments/1wr3of6/project_diablo_2_s14_developer_stream_2_recap/
- Stream #3 (2026-10-03): https://www.reddit.com/r/ProjectDiablo2/comments/1wx13w6/project_diablo_2_s14_developer_stream_3_recap/

## Dates (stream #2, #3)
- Final dev stream with the tentative closed-beta patch notes: **Sat 2026-10-10, 10am PST**; the closed
  beta starts at the end of that stream.
- Closed beta **Oct 10–18**, open beta **Oct 19–21**, season reset **Oct 23, 10am PST**.

## Announced changes
**Stream #1**
- Stash rework: a Unique tab and a Set tab (one of every unique/set, stat ranges shown even when not
  owned), a Map tab, and an "Affinity" toggle per page (matching items go there when sent to the stash).
- "Discovery Progress" (holy grail) over every unique and set item: an item is discovered when found and
  identified in the same game (dev reply: you have to identify it), for every party member present.
  Discovered items get a red diamond; completing all uniques and sets gives the "Discovery Aura".
- Personal gold removed; shared stash gold limit 25m.
- Jewels can roll up to +5% elemental damage as a prefix (dev reply: works like the +5% on a facet).
- Stacked items no longer have a stacked and unstacked form and can be socketed straight from a stack.
- Rare "alternate skins" for some items (Ormus' Robes colour depends on its skill).
- A new map by Roofooevazan; a monsters-remaining counter in maps and corrupted zones.
- Skills: Blessed Hammer, Blaze, Dire Wolves, Twister; Gloom reworked; character-select sorting.

**Stream #2**
- Corruptions: Indestructible becomes repair durability (auto repair); chest +10% curse resistance moves
  to tier 2 and becomes +10-20%, chest +10% FCR becomes +20% in tier 3; boots, gloves and belt
  replenish life become half freeze duration; shield curse resistance +20-25%, helm +10-15%.
- "Deposit Materials" stash button; improved charm inventory visuals.
- Six more alternate skins: Giant Skull, Stormspire, Medusa's Gaze, String of Ears, Guardian Angel,
  Fleshripper.
- New map "Poisoned Well" (Diablo 1 inspired) by Roofooevazan.
- Guilds (up to 100 members, chat, tags, emblems, shared stash, trophy case) with a per-league
  **Guild Hall** that "will function like a town" (no maps, PvP or combat); global chat; /toggle.
- Skills: Smite, Shadow Master, Fist of the Heavens.

**Stream #3**
- Discovery progress also requires being in the same act when the item drops.
- New runewords: **Madness** (4-socket weapons, any weapon type per a moderator), **Finesse** (3-socket
  armor), **Deception** (3-socket helms), **Jealousy** (3-socket Amazon throwing weapons; the +3 javelin
  skills come from the Matriarchal Javelin base).
- Maximum sockets 2 → 3: Matriarchal Javelin, Splint Mail, Plate Mail, Field Plate, Ghost Armor,
  Serpentskin Armor, Demonhide Armor, Trellised Armor, Armet, Giant Conch.
- Six more alternate arts (18 in total): Spirit Shroud, Hellslayer, Chance Guards, Grandfather,
  Head Hunter's Glory, War Traveler.
- Delirium Form o-skill on Delirium; Cow Form o-skill for the full Cow King's Leathers set.
- A new map event (area with super chests and a boss with extra loot); a new map by Isaidwhatever.
- Guild vault tabs lockable by rank; skill (Concentrate, Chilling/Shiver Armor) and controller changes.

## Filter impact checklist (`beta` branch; updated 2026-10-10 from the S14 closed-beta game data)
Every S14 rule block is marked `// S14:`. Game data: `ProjectD2\Beta\` (BH.dll built 2026-10-10), diffed against `ProjectD2\Live\`.

| Change | Status | Sections |
|---|---|---|
| Grail over uniques and sets | Done: `Alias[GRAIL_NEW]` (`!ALLDISCOVERED`; BH PR #95 adds ANYDISCOVERED, ALLDISCOVERED, ANYOWNED, ALLOWNED) on the hide rules. Open: the look of undiscovered items, designed in game | 040, 160, 170 |
| Stacked/unstacked forms merged | Done: runes, gems and skulls drop and stack as their plain code (QTY=1 on the ground); the `...s` codes are "(old)" legacy items and left the rules. BIG GG (author's lines) and LIL GG; stack/unstack notes and "+ Key" removed; plural and `x QTY` for every gem stack, the four boss items (Relics of the Ancients, Visions of Terror, Voidstones, Shadows of Hatred), Vials of Lightsong, Lilith's Mirrors, Tokens of Absolution and Pandemonium Talismans. In game (author): the boss items, the vial and the mirror stack only in the stash, not in the inventory. Rejuvenation potions stack in the stash too: `STASH` lines show their names at every filter level | 060, 090, 100, 110, 120, 250 |
| New maps: Poisoned Well `t18` (T1), Dark Temple `t29` (T2), Descent from Mount Arreat `t2a` (T2) | Done: names (130), resistance blocks (140), Cursing Knights (`t29`) and native Succubus Witches (`t2a`) in 145; codes allow-listed for lint. The tier aliases use MAPTIER (no change). 130 and 140 tier groups re-sorted to S14 tiers (Sanatorium `t14` is T1) | 130, 140, 145 |
| Map resistances | Done: all blocks checked against the S14 data (start area = Misc.txt `len`; Levels.txt `nmon` monsters, MonStats.txt hell resistances). Only Throne of Insanity changed: magic 75 to 50 (75 was the wiki's Demon Rascal; the game data has 50 in S13 and S14). Zhar's Sanctum counts areas 177-179 (176 is the portal entrance), Djinn's Domain 197-198. Guest monsters from the game data's map-mod rows (author): STAT499 is Minions of Destruction (PD2 gave them the Shrieking Terrors code), so the "Cold with Shrieking Terrors" lines are gone and Minions give Poison 95 (also Fire 75 on Blood Moon, Fallen Gardens, Warlord of Blood and Imperial Palace, Phys 50 on Imperial Palace); Ghost poison is 50, which only tops Outer Void's 30 (as do Vampire Lords); Souls give Imperial Palace Magic 25. `!STAT360>0` (no resistances on corrupted maps) now also on t18, t29, t2a, t35, t3b | 140 |
| Guild Halls | Done: MAPID 202-206 in `Alias[TOWN]`; the town gamble rule (210) also takes TOWN, so if the hall's "Anya and Gheed" (guild tier 4, S14 string table) gamble there, those items don't get the Gheed-event lines. Whether they gamble there: not checked in game | 040, 210 |
| Corruption changes | Done (S14 CubeMain.txt: same ids, new outcomes): 48 = repair durability + 50-80% ED, a gray "Rep" (Repair Durability block) and its ED on the ED lines; 34 on boots/gloves/belts = half freeze duration (UNI/SET Hfd line; rep-life lines only for helms, which fixes a "0drain"); chest 62 = Reduced Curse Duration (rcd line for MAG/RARE/CRAFT) | 300 |
| New runewords | Done: 230 notes (Finesse 3os chests, Deception 3os helms, Madness every 4os weapon, Jealousy 3os `amf`), rune notes in 110 (Madness on Sur/Mal/Vex, Deception on Fal, Jealousy on Lo/Gul), 305 regenerated. Bases (220): eth +3 `amf` with 0 or 3 sockets and eth 4os Ettin Axe, Berserker Axe, Scourge, Phase Blade show on levels 0-7, with ED 15+ on 8-12 | 110, 220, 230, 305 |
| Max sockets 2 to 3 (`spl plt fld xui xea xla xtu ulm uhl amf`) | Done: 230 C:3 values and "upgrade first" list (adds `hlm xlm fhl xhl`, drops the seven bases); 3os Ghost/Serpentskin/Demonhide/Trellised like Cuirass/Mesh and 3os Armet/Giant Conch like Spired Helm/Corona (210). Also fixed `spk`/`xpk` to C:3 (wrong since before S14) | 210, 230 |
| Jewel prefixes (+2-5% elemental, +2-3% magic skill damage) | Done: MAG/RARE jewel tags in the large charm look (`cm2`, 240) | 250 |
| Curse proc levels | Done: Amplify Damage / Lower Resist proc tags show the S14 levels (11/19/27 and 1/1/6) | 300 |
| Alternate skins (Special Edition) | No tag (author) | - |
| New map event "The Bitter Depths" (area 207) | Work in progress in the beta | 145 |

Use `python tools/explain_item.py` to see which rules an item hits before and after a change.

## Closed beta: to circle back to
- 145: the "+X% Fire/Cold/Light/Poison Damage" lines for the new maps, after testing.
- 145: the red "Additional Boss" list, after seeing the three new map bosses.
- 140: Hell Bovines, Reanimated Horde and Stygian Dolls have no map-mod row. The legend's values match reanimatedhorde6 (in game "Unholy Corpse") and bonefetish6 ("Undead Stygian Doll"; bonefetish7 "Undead Soul Killer" is the same), and every hellbovine row has Phys 50. Check in game which monsters those map mods add. If it is these rows: Dolls give Imperial Palace Phys 33, Hell Bovines give it Magic 33 and give Outer Void Poison 33 (hellbovine) or 65 (hellbovineMap/Mage).
- 160 unique tiers (author's flags): Warshrike (review); up: Sage's Defiance, Stalker's Cull, Frostburn, Wraith Flight, Uldyssian's Awakening, Shadow Killer; down: Whispering Mirage; Cliff Killer and Mageslayer to minimal?; Skyfall (proc fix). Warriv's Warder and Spectral Plate: community review (default look until then).
- Roll picks (`pick_rolls.bat`, `pick_runewords.bat`): uniques and sets all picked by the author (2026-10-12); the runeword Gloom still names `fhr` (a fixed 20% in S14; its new roll is Curse Resistance `cr`); Bannerlord's Call's `os17` (+2-3 Slow Movement) waits for a label; Stalker's Cull can now pick `stat256` (`mult`).
- BH's affix level formula (`GetAffixLevel` still subtracts qlvl/2): asked in `docs/dev-feedback.md`; then 190 (unidentified rare chests/shields at levels 10 and 12), 340 and the reroll levels in 240/250.
- Next beta update (affixes: rare-only affixes, max res on shields/belts, gloves and helm ED, circlets): re-diff Live vs Beta, then 190, 300, 350/360.
  Prepared 2026-10-11: magic/rare gloves ED tag (tan up to 29, red 30-69, purple 70+, one tag with an ED
  corruption); rare Cannot Be Frozen joins the corruption's `Cbf` tag; all four max res on magic/rare shields and
  belts as one `max` tag (single-element lines skip them; also handles a per-element affix on belts); the rare belt
  "Max Resistances" highlight takes `MAXRES>1`. Already fine: +2 class skills, FCR 20/30, FRW 40, gloves DS/CB,
  rare helm PDR, helm ED (red). Snapshot of the old beta data: `tools/.cache/pd2data-beta-2026-10-10.mpq`.
  After the update: diff its MagicPrefix/MagicSuffix with the new Beta data (exact max-res affix, ranges, affix
  levels); spawn the items above; for the rare-only affixes, use their affix levels in 190 (levels 10/12 hide rare
  helms, shields, gloves; helms hidden from 3/8; gloves above char level 89 only for Asn/Ama) and review 350's PDR
  tiers for prefix plus suffix.
- Zhar's Sanctum's area level: the data says 87; the filter keeps 89 (author).

## Closed beta: unique/set roll tags to check in game

Spawn the items and compare with the roll picker's preview (`pick_rolls.bat`).

**Tag order (done 2026-10-08).** `300-affix-tags` is sorted into one block per stat in PD2's display order
(`descpriority`, `tools/tag_order.py --fix`; lint flags a misplaced line). Stats of equal priority come in an
order that differs per item (Kira's Guardian: -cold, -fire, -lightning; Ormus' Robes: cold, lightning, fire
skill damage), so those can still read out of order on some items.

**-res group.** Kira's Guardian and Mang Song's Lesson show their three -% enemy resistances from one line
(`-10%/-15%/-10%`, gray slashes) in the item's own order: cold/fire/lightning on both (screenshots 2026-10-08).
`ERES_ORDER` in `gen_unique_rolls.py` holds it; another order needs its own `ROLL_ERES<ORDER>_TAG` line in 300
and on the weapon -res corruption lines.

**Game data.** The roll tags now come from PD2's own item tables (`docs/pd2-unique-set-items.tsv`), extracted from
the live S13 client on 2026-10-08. When the beta client is installed, run
`python tools/pd2_data.py --extract "<Diablo II folder>"` on it, then `python tools/gen_unique_rolls.py`, to pick up
S14 item changes. Spot-check items that had no tags before: Marrowwalk, Metalgrid, Atma's Scarab, Soul Drainer,
Witchwild String, Anvilguard Strap, Blood Raven's Charge, Ebonbane, the Kadala's Heirloom versions.

**Also check:**
- Drain life shows `15drain` (red, no minus sign: `$f(ABS(STAT74))`), max resistance `5%max`.
- New tags: `def` shows the item's total defense (BH's DEF), `+60-100fire`/`cold`, auras (gold), single skills
  (tan abbreviations; Holy Fire and Vigor share their label with the aura, colored differently).
- A unique/set with a roll **and** a corruption of the same stat shows the tag once (roll lines skip those
  corruptions, e.g. `!STAT360=48`).
- Existing, unrelated to the roll tags: a set ring with the FCR corruption matches both the
  `rin (MAG OR RARE OR CRAFT OR SET) FCR=10/20` lines and the `(UNI OR SET) (STAT360=42 OR ...)` lines (Faster
  Cast Rate block of `300-affix-tags`), so it may show `fcr` twice.

## Closed beta: runeword roll tags to check in game

`sections/305-runeword-rolls.filter` (generated by `tools/gen_runeword_rolls.py`, picks in `pick_runewords.bat`) tags
every runeword's variable rolls on a line under its name, in the look of the same stat's 300 tag. Made from the
S13 client's tables on 2026-10-08: re-extract on the beta client for Madness, Finesse, Deception and Jealousy.

**Settled (author's screenshots, 2026-10-08):** the label is the runeword's name (gold), its base line and the tag
line, so the base line counts toward BH's 56 characters (Lionheart and Insight were cut to "Lionhea" / "Insig").
The superior `NNed`, `Sup` and `Inf` tags no longer go on runeword bases (`!RW` on those `220` lines): a base line
is now at most `Eth <base>`. New labels: `abs` (magic absorb, orange), `X%crit` (crit chance), `dvm`
(defense vs missile), `dcoy` (+Decoy); mana regeneration is `rgn` (was `regen`). Lionheart shows `25s 15d 20v`
(its own short labels); Loyalty shows power strike on spears and strafe on bows (each version its own rolls).

**Check:**
- Spirit (sword and shield), Insight, Enigma, Call to Arms, Infinity: each tag is there, in the tooltip's
  order (top to bottom = left to right), with the tooltip's value (runes included: Call to Arms' ED counts Ohm).
- Enigma: `775def 0.75str 0.75mf`. The per-level tags show the stat as BH reads it divided by 8 (`$f(STAT220/8)`);
  check they match the tooltip's per-level value. Fortitude's life per level (not picked yet) assumes the stored
  value is shifted like life (`$f(STAT216/2048)`): check before picking it.
- Enigma's `def`: BH's DEF is the item's defense stat, so it may show base + roll rather than the roll alone.
- Famine's `-15%/-15%/-15%` follows its properties' order (cold, fire, lightning); check the tooltip agrees.
- Quiver runewords (Echo, Ancient's Scripture / Foresight): the tables give their runes the armor stats.
- Insight is 1 character over in an ethereal Matriarchal Spear (its longest elite base; the picks file says
  TOO LONG): "Insigh". It fits its other bases.
