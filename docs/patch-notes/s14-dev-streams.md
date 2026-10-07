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

## Filter impact checklist (tentative; work on the `beta` branch)
Mark every S14 rule block with `// S14:`. Line numbers as of 2026-10-04.

| Change | What to do in the filter | Sections |
|---|---|---|
| Grail over uniques and sets | **Done (beta):** `Alias[GRAIL_NEW]` + `!GRAIL_NEW` on the 8 hide rules that can hide a unique or set; the look of undiscovered items is to be designed in the beta | 040, 160, 170 |
| Stacked/unstacked forms merged | ~140 rules use stacked codes (`rNNs`, `gXXs`, `skXs`) in `090-gems`, `100-sound-ids` (rune drop sounds `(r20s OR r21s) QTY=1`), `110-runes`. Find which code survives and a single drop's `QTY`, then rewrite | 090, 100, 110 |
| New maps (Poisoned Well; Isaidwhatever's map) | Per map, like S13's `t57`/`t3b`: alias in `040` (`UNIQUE_MAPS` or tier), names and area level in `130`, resistance block in `140`, tier and notification in `145` | 040, 130, 140, 145 |
| Guild Hall works like a town | Add its `MAPID` to `Alias[TOWN]` (`040-aliases.filter:4`) | 040 |
| Corruption changes | "Ind" tags on `STAT360=48`: `300-affix-tags.filter:619, 839, 1008, 1015, 1016` (roll lines skip it with `!STAT360=48`); rep-life tags on `STAT360=34`: `300:503, 505, 509` (boots/gloves/belt move to the "Half Freeze Duration" tags, `300:302`); curse resistance on `STAT360=49/62`: `260:35`, `300:453, 674` | 260, 300 |
| New runewords | Add to the "Possible Runewords" notes in `230`; keep the bases visible: `220-nonmagic-weapons.filter:72-79` hide white Amazon javelins by `TABSK2` (79 hides +3 javelin-skill `amf`, the Jealousy base); check 3-socket armor and helm hiding in `210` | 210, 220, 230 |
| Max sockets 2 → 3 (`spl plt fld xui xea xla xtu ulm uhl amf`) | Socket notes in `230`: "Corrupt After Upgrade: C:3" (`:147-148`), corruption C: values (`:183` helms, `:191` chests, `:210` weapons), "upgrade first" lists (`:142-161`) | 230 |
| Jewel +5% elemental damage prefix | Tag it in `250` (new stat, or the existing `STAT329-332` skill damage) | 250 |
| Alternate skins/arts (18 uniques) | In game: check they keep their base item code; new codes would bypass every code-based rule | ? |
| New map event | Check for an event stat worth tagging on maps | 145 |

Use `python tools/explain_item.py` to see which rules an item hits before and after a change.

## Closed beta: unique/set roll tags to check in game

Spawn the items and compare with the roll picker's preview (`pick_rolls.bat`).

**Tag order (deferred to the beta, author's choice 2026-10-07).** A later line in `300-affix-tags` puts its
tag further left, and the tags should read in the item's stat order. 370 of the 382 items with 2+ picked tags
do; `python tools/gen_unique_rolls.py --order` lists the rest. Fixing them means moving **existing** lines, and
those lines also tag magic/rare items, so their order changes too:

| Items | Cause |
|---|---|
| Ghostflame, Stormspire, The Grim Reaper | weapon `%f %c %l %p` lines (`300:173-179`) sit after the weapon ED lines (`300:162-164`) |
| Husoldal Evo | the replenish-life line covers every slot (`300:503`) |
| Biggin's Bonnet, Raekor's Virtue, Fenris, Gravepalm, Balefire, Deathbit, Demon Machine, Boneflesh | armor/quiver/weapon lines in other sections; `--order` shows the order wanted |

Kira's Guardian (circlet) and Mang Song's Lesson (weapon) list their -res rolls in opposite orders on the wiki,
so each got its own lines (the weapon roll lines after the `-% Enemy Poison Resist` line). Check in game that
both read as on the items: D2 sorts an item's stats by a fixed priority, so if both show the same order, one
wiki page is off and the lines need adjusting.

**Also check:**
- Drain life shows `15drain` (red, no minus sign: `$f(ABS(STAT74))`), max resistance `5%max`.
- New tags: `def` shows the item's total defense (BH's DEF), `+60-100fire`/`cold`, auras (gold), single skills
  (tan abbreviations; Holy Fire and Vigor share their label with the aura, colored differently).
- A unique/set with a roll **and** a corruption of the same stat shows the tag once (roll lines skip those
  corruptions, e.g. `!STAT360=48`).
- Existing, unrelated to the roll tags: a set ring with the FCR corruption matches both `300:787-788`
  (`rin (MAG OR RARE OR CRAFT OR SET) FCR=10/20`) and `300:790-791` (`(UNI OR SET) (STAT360=42 OR ...)`), so it
  may show `fcr` twice.
