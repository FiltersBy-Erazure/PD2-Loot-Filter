---
title: Grail Planner
hide:
  - navigation
  - toc
---

<style>
  /* this page only: room for the item list, and the text above it at a readable width */
  .md-grid { max-width: 72rem; }
  .md-content__inner > :is(p, ul, ol, h2, h3, .admonition, .md-typeset__scrollwrap) { max-width: 50rem; }
  .md-content__inner > .grid.cards { margin-bottom: 1.6rem; }
  @media (min-width: 60em) { .md-typeset.md-content__inner > .grid.cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>

# Grail Planner

The holy grail is finding every unique and set item in the game at least once. The game keeps count of what you've
found (its Discovery Progress), and this filter reads it: a unique or set item you haven't found yet is never hidden, on
any filter level, and always gets a minimap icon and a chat line when it drops.

This page helps with the rest of the hunt. It works out how many T1-T3 maps the grail
takes, what makes it faster, which items take the longest, and where to target farm each item instead: every act boss,
superunique and special encounter, in each difficulty. It keeps track of the items you've found, and tells you what to
do next for the ones you're missing.

[Open the planner](#tab-overview){ .md-button .md-button--primary } [Your Grail](#tab-planner){ .md-button }

## Corrupted Ears in short

Much of this page compares maps with and without a Corrupted Ear, so here is what one does.

- **Where they come from:** the Corrupted Heroes map event. The red text "You feel a corrupted presence watching you, as
  if you're being hunted..." announces it, and powerful copies of player characters invade the map through black
  portals (up to 3 portals and 5 invaders a map). Each invader drops a full set of rare items, one per equipment slot,
  and the Corrupted Ear of its own class.
- **How to use one:** cube a Corrupted Ear with a map in the Horadric Cube. The ear is used up and the map gets its
  bonuses.
- **What every ear gives:** each kill has a 50% chance to drop its loot a second time, and the map has +10% monster
  rarity (a few more elite packs). That alone makes every item map monsters drop about 1.5 times as common.
- **What each ear adds:** each kill also has a 10% chance to drop one more item from the ear's own pool (the table
  below), which is where the ears differ.
- **What it costs:** monsters have +100% health, and each ear makes the map harder in its own way (faster monsters,
  crushing blow, extra elemental damage, lower resistances: the Corrupted Ears tab lists them). An ear map takes
  longer, so when this page says an ear saves maps, it means fewer maps, not less time.
- **Which ear:** the one whose pool holds the most of what you're missing. Your Grail picks it from your ticks.

| Ear | Its pool |
|---|---|
| Amazon | Ranged weapons: javelins, bows, crossbows, throwing weapons |
| Assassin | Melee weapons: swords, axes, spears, polearms, maces, claws, scepters |
| Barbarian | Helms and body armor, Barbarian helms and Druid pelts too |
| Druid | Every class's own items: Amazon weapons, claws, Barbarian helms, pelts, Necromancer heads, Paladin shields, orbs |
| Necromancer | Accessories: gloves, boots, belts, rings and amulets |
| Paladin | Shields, Paladin shields and Necromancer heads too |
| Sorceress | Caster weapons: orbs, staves and wands |

## Quick start

1. **Set the bar.** Pick the tier you run (or All), non-magical or rare maps, and your magic find. Every number on the
   page follows it, and the bar stays at the top while you scroll.
2. **Tick what you have.** Tick the items you've found under **Every Item**. Your ticks stay in your own browser and are
   never sent anywhere. To move them to another browser or device, or to bring a list from a spreadsheet or another
   grail tracker, use **Copy or paste your list** under **Your Grail**: "Show my list" and "Copy" give you your list,
   "Use pasted list" ticks the items of a pasted one (one item per line).
3. **Read Your Grail.** It's your plan: the Corrupted Ear to run on your maps, the missing items one kill finds at least
   as often as a whole map and where to farm them, the slowest ones, and the maps to finish. Each missing item gets its
   best bet.
4. **Click an item** under Every Item for its best bet, its five best farm spots in each difficulty, in the Corrupted
   Zones and among the ubers and events, its chance per map with each ear, and Gheed's map event.
5. **Prefer spots that don't move?** Choose **Fixed spots only** in Your Grail, above the item list or under Target Farming: the
   suggestions then keep to monsters that stand in the same place every game, such as Bone Ash in the Cathedral or
   Pindleskin at the temple's portal.

## The tabs

<div class="grid cards" markdown>

-   **[Overview](#tab-overview)**

    ---

    The short answer for your settings: how many grail items maps drop, the maps for half, 90% and all of them, how
    fast the grail fills, what makes it faster, and the items that are hard to find in maps.

-   **[Filter Display](#tab-filter)**

    ---

    How the filter shows an item you haven't found yet and one you have, drawn as the game draws it, on the lowest and
    the strictest filter level.

-   **[Your Grail](#tab-planner)**

    ---

    Your plan from your ticks: the ear to run, the items to target farm and where, the slowest ones, and the maps to
    finish, with a best bet for each missing item. Copy or paste your list here.

-   **[Every Item](#tab-items)**

    ---

    Every grail item: its chance per map without an ear and with each ear, the maps for a 90% chance to see it, and its
    best farm spot. Click a row for its best bet and all its spots.

-   **[Target Farming](#tab-farm)**

    ---

    Every act boss, superunique and special encounter in each difficulty, by the grail items it drops, and the items it
    is the best spot for. Then gambling: the gold per new grail item of every gamble base at your character level.

-   **[Corrupted Ears](#tab-ears)**

    ---

    What a Corrupted Ear does to a map, each ear's pool and dangers, and every grail item each ear raises.

-   **[FAQ](#tab-faq)**

    ---

    What players ask first: reading your Discovery Progress, which ear, ears vs time, maps vs kills, drop level, rare
    maps, magic find, Corrupted Zones and the filter's stars.

-   **[How It's Worked Out](#tab-method)**

    ---

    The rules behind every number: the grail, drops, maps, farm spots, Corrupted Zones, ubers and events, and what's
    left out.

</div>

## Words on this page

| Word | What it means |
|---|---|
| **1 in 1,200 maps** | A chance, not a promise: on average one drop every 1,200 full map clears. A 90% chance to see the item takes about 2.3 times that many; luck runs ahead or behind. |
| **Kills, runs, vaults, shops, gambles** | Farm spots count per kill: per run for Uber Tristram and the Uber Ancients (one, two or three ancients, your choice at their statues), per vault (its 10 chests) for Lucion's vault, per shop for Gheed's map event, per gamble (with its gold) for gambling. A kill and a map clear take very different times, so compare spots with spots and maps with maps. |
| **No ear, Any ear, Best ear** | An item's chance per map without a Corrupted Ear, with any ear (what every ear gives), and with the ear whose pool has the item's base. |
| **Best ear ×** | How many times more often the best ear finds an item than no ear. |
| **Maps for 90%** | The maps for a 90% chance to see an item. |
| **Best bet** | Where an item comes from best: target farming its best boss or superunique when one kill there finds it at least as often as a whole map with its best ear ("beats maps"), maps otherwise. |
| **A kill = 3 maps** | One kill finds the item as often as 3 maps with its best ear: farming wins as long as a kill takes you less time than 3 maps. |
| **Drop level** | The lowest monster level that can drop an item: not the level you need to wear it. The farm spots reach level 68 in Normal and 75 in Nightmare, so the highest-level items only come from Hell. |
| **Normal, Nightmare, Hell** | The difficulties. A "normal base" (beside exceptional and elite) is an item's base tier. |
| **Fixed spot, random spot** | A fixed spot is the same every game (the Cathedral, Travincal, Nihlathak's Temple); a random one is anywhere in its area. |
| **Areas from a waypoint** | The areas to walk through from the nearest waypoint (towns have one; a portal counts as one step). |
| **With its minions** | A superunique's own drop is the main number; "with its minions" adds the monsters around it. |
| **Corrupted Zone** | In Hell games made with Baal's quest done, one group of areas at a time has area level 85, so its superuniques drop at level 88 while the zone lasts. |
| **Ubers and events** | Lilith, Uber Duriel, Uber Izual, Diablo Clone, Uber Tristram, the Uber Ancients and Lucion's vault. |
| **A model** | The numbers follow how the game rolls drops (what each monster can drop, its quality, magic find) and the map model behind the filter's experience tags, solo: estimates, not a drop log. |

## Good to know

- **The first items come quickly, the last ones slowly.** A few items that drop once in thousands of maps decide when
  the grail ends. Target farm the ones a kill finds faster than a map: Your Grail names them and their spots.
- **Low-level uniques come from Normal.** A low-level base is a bigger share of a low-level monster's drops, so Normal
  superuniques and act bosses beat Hell, per kill, for many of them.
- **High-level items need Hell.** The act bosses drop up to six items a kill; the Uber Ancients drop the most per fight.
- **Two items have one source each:** Annihilus drops from Diablo Clone, the Hellfire Torch from Uber Tristram.
- **Magic find helps the most,** then a Corrupted Ear on every map; which ear matters less than using one, and Your
  Grail picks it for the items you're missing.
- **Gambling counts too:** a gambled item is unique 1 time in 2,000 and a set item 1 time in 1,000. A low-level character
  gambles a base's low-level uniques and sets cheaply (Discovery Progress is per account, so they count); high-level items cost billions of gold that way.
- **One version is enough:** an item with several versions (the Rainbow Facets, Akarat's Devotion...) is one grail item.

<!-- the grail planner (website/hooks.py puts it here, from Erazure-Grail-Planner.html) -->
<div id="grail-map-here"></div>
