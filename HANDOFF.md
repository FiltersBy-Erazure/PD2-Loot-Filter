# Erazure PD2 Loot Filter: Claude Code in VS Code Handoff

*Prepared 2026-09-27 from the state of `FiltersBy-Erazure/PD2-Loot-Filter` at the Season 13 build (last filter commit 2026-05-28, "Season 13 - May 28th"). Revised the same day for Claude Code in VS Code instead of Cursor, and on 2026-09-29 for the section-file layout: the filter's source is now `sections/`, and all 8 published filters are generated from it.*

This document is for two readers:
- **You (the author):** it covers setting up the project in VS Code with the Claude Code extension, what changes about your workflow, and the order to do things in.
- **Claude Code:** it's the project briefing. When a task is bigger than a one-rule tweak, start the conversation with `@HANDOFF.md`.

`CLAUDE.md` in the repo root is loaded automatically at the start of every Claude Code conversation. It's kept short on purpose. This document holds the longer background and is only read when you mention it.

---

## 1. What's in this kit

| File | What it does |
|---|---|
| `HANDOFF.md` | This document. Project briefing for you and the agent. |
| `CLAUDE.md` | Loaded into every Claude Code conversation: build system, variants, search rules, file-format rules, filter semantics, and the checklist to follow before changing a rule. |
| `sections/*.filter` | **The filter's source.** 38 numbered files, joined in filename order. Edit these, never the root `.filter` files. |
| `tools/build.py` | Joins the sections into `Erazure-Main.filter`, stamps the version into the Cube, and generates the 7 variants. `--check` changes nothing and exits 1 if anything is out of date; `--stamp` sets today's date first. |
| `build.bat` | Double-click to publish-build: stamp today's date, build all 8 filters, check them. Shows BUILD OK or BUILD FAILED. |
| `version.json` | Season name and release date shown in the Horadric Cube (`Season 13 - May 28th`). `build.bat` updates the date; you change the season. |
| `.claude/settings.json` | Rules Claude Code **enforces** rather than just asks for: (1) blocks Claude from editing the 8 generated root filters; (2) lets it run the build script without asking; (3) a hook that rebuilds after every edit, so the 8 filters can't fall out of sync with the sections. |
| `.claude/hooks/rebuild.py` | The hook itself. It acts only when a file in `sections/`, `version.json` or `filter_definitions.json` was edited, and never stamps the date. Silent on success; on failure it exits 2, which sends the error back to Claude. |
| `.github/workflows/check-filters.yml` | GitHub Action that fails if the 8 filters don't match `sections/`. A safety net for edits made on github.com. |
| `.gitattributes` | Tells git never to convert line endings in `.filter` files (see §4.2), and to keep `build.bat` in Windows format. |
| `docs/pd2-item-filtering.wiki` | Raw copy of the PD2 wiki's Item Filtering page, with your S13 UTF-8 correction and a note about what's missing. |
| `docs/pd2-item-codes.wiki`, `docs/pd2-filter-info.wiki`, `docs/pd2-formula-info.wiki` | The three pages Item Filtering pulls in, downloaded raw on 2026-09-28. |
| `docs/patch-notes/pd2-patch-notes-2026-09-27.wiki` | Full Patch Notes page as of 2026-09-27, including the Season 14 Dev Streams #1–2. |

---

## 2. The filter as it actually is (measured, not assumed)

### 2.1 Repository shape

- **8 published filter files** in the repo root, each 8,466 lines / 825 KB, UTF-8, CRLF line endings. The PD2 launcher reads these, through `filter_definitions.json`.
- **The 8 files are identical except for 6 lines.** The Toggles section (`sections/030-toggles.filter`) holds 8 labelled blocks of 3 aliases each. Exactly one block is uncommented:
  ```
  //  Erazure - Main
  Alias[BIG_GG]:FALSE
  Alias[POE_SOUNDS]:FALSE
  Alias[REVEALED]:FALSE
  ```
  Every variant is Main with its own block uncommented and Main's block commented out. The build does the switching; nobody comments or uncomments blocks by hand.
- **`filter_definitions.json`** tells the launcher the display name, description and file name of each variant. Its `display_name` values match the `//  Erazure - ...` headers in the Toggles block exactly, and the build relies on that.
- **How a build works** (`tools/build.py`):
  1. Read `sections/*.filter` in filename order. Fix any file with LF line endings, a BOM or no final line break (only those invisible characters change) and report it.
  2. Join them, and replace `<<VERSION>>` in the Cube section with the text from `version.json`. That is `Erazure-Main.filter`.
  3. For each other variant, switch on its toggle block and switch off Main's. Write the file.
  4. Stop with a clear error if: `<<VERSION>>` isn't there exactly once; a rule comes after the catch-all; a toggle block other than Main's is active; a variant in `filter_definitions.json` has no toggle block; a section name isn't `NNN-topic.filter` or two share a number.
- **Workflow before 2026-09:** edits were made in the GitHub web editor and committed once per file, 8 commits per change (1,588 commits by then, almost all "Update Erazure-X.filter"). History from before the split lives in `git log -- Erazure-Main.filter`.

### 2.2 Size and what that means for an LLM

About 825 KB is roughly 200k+ tokens per file. **No conversation will "see the whole filter" at once.** Claude Code works by searching (grep) and reading line ranges, the same way you'd use Ctrl+F. Three consequences:

1. Claude is only as good as its searches. Every prompt about an item should make it list all the rules that mention that item before it proposes anything. `CLAUDE.md` already requires this.
2. Searching the root `*.filter` files returns **every hit 8 times**. `CLAUDE.md` tells Claude to search `sections/` only.
3. The section files make small sections cheap to read whole (Runes is about 7k tokens), and let you work on one topic at a time. But rule order still runs across all sections, so a search for an item always covers all of `sections/`.

**Keep the reference docs out of `CLAUDE.md` imports.** In `CLAUDE.md`, a bare `@path` (not in backticks) loads that whole file at the start of *every* conversation. `@docs/pd2-item-filtering.wiki` would add about 107 KB to every session. The kit's `CLAUDE.md` writes those paths in backticks so Claude searches them only when it needs to. Keep it that way if you edit the file. The same goes for prompts: never `@`-mention a root `.filter` file, which attaches all 825 KB.

### 2.3 Rule anatomy (Main, S13)

| Measure | Count |
|---|---|
| `ItemDisplay` rules | 4,870 |
| …using `%CONTINUE%` | ~3,730 (**~77%**) |
| …that hide (empty name output, no CONTINUE) | ~565 |
| …that end evaluation with a visible name | ~560 |
| Rules using `FILTLVL` | 1,237 |
| Rules using `CLVL` | 950 |
| `Alias` definitions | 86 |
| Notification keywords | `%PX%` 526, `%DOT%` 488, `%MAP%` 330, `%BORDER%` 206, `%SOUNDID%` 204, `%TIER%` 91 |
| Rules referencing `REVEALED` / `BIG_GG` / `POE_SOUNDS` | 526 / 70 / 55 |

**How the filter works:**
- Most of the file is layered `%CONTINUE%` rules. Each adds something (a color, a symbol, a stat tag, a description line) to `%NAME%` and passes the item on.
- Hiding happens mainly in the Rare, Magic and Non-Magical base sections, gated by `FILTLVL` and `CLVL`.
- Everything that survives falls through to the catch-all on the final line: `ItemDisplay[]:%NAME%{%NAME%}//`.
- Notification keywords are processed separately (see §3), so a hide rule doesn't necessarily silence a notification set elsewhere.

### 2.4 Section map

`sections/` at the split (2026-09-29). "Main lines" are where each file's content sits in `Erazure-Main.filter` as of the S14 beta (2026-10-15); they shift as sections grow. Each file starts at its header's top border line, so it opens with the complete header box.

| File | Main lines | Contents |
|---|---|---|
| `010-filter-levels` | 1–15 | 12 `ItemDisplayFilterName[]` lines; their order defines FILTLVL 1–12 |
| `020-horadric-cube` | 16–51 | Filter level, variant name and `<<VERSION>>` in the Cube description |
| `030-toggles` | 52–95 | The 8 variant alias blocks (Main active) |
| `040-aliases` | 96–293 | `TOWN`, rune / item / unique / set / rare / map group aliases |
| `045-unique-set-rolls` | 294–850 | GENERATED (`tools/gen_unique_rolls.py`): the `ROLL_<X>_TAG` aliases of the unique/set roll tags (added S14); since 2026-10-19 also the cut rules' cases (`tools/label_cuts.py`), the `Holy Sprinkler` base name and the short names |
| `047-runeword-base-names` | 901–915 (2026-10-19) | GENERATED (`tools/gen_runeword_rolls.py`): runewords on a renamed base (`Holy Sprinkler`), their name line written again |
| `050-customization` | 851–1116 | Commented-out opt-in rules for players |
| `060-gold-potions-tomes` | 1117–1343 | Gold; health, mana, rejuvenation, utility and throwing potions; tomes and scrolls |
| `070-keys` | 1344–1913 | MAPID list and key rules |
| `080-quest-items` | 1914–1942 | |
| `090-gems` | 1943–2073 | |
| `100-sound-ids` | 2074–2127 | |
| `110-runes` | 2128–2308 | El-Tal → Sur-Zod, rune notifications and map icons |
| `120-pd2-items` | 2309–2594 | Shards, Puzzlepiece/box, Demonic Cube, Almanac, Navigator, Skeleton Key, Vial, Mirror, Essences, Uber keys/organs/ancients, DClone/Rathma/Lucion items, orbs, infusions, ears, Scarab (BIG GG items) |
| `130-maps` | 2595–2753 | Map names (T1–T3, unique, T4 dungeons), area level |
| `140-map-resistances` | 2754–3306 | S13 per-map resistance display: explanation, then one block per map |
| `145-map-rolls-and-notifications` | 3307–3526 | Map contents and modifier highlights, catalyzed, tier tags, map looks and tier icons, the tag line (mf/den/rar/exp prefixes) |
| `146-map-experience` | 3527–3880 | GENERATED (`tools/gen_map_exp.py`): two description lines per map, `2.0x Experience` (the roll multiplier) and `2.6x at Level 98` (vs an average white map at your level), and their aliases |
| `147-map-display-end` | 3881–3901 | Every map's last rule (closing minimap icons for T1–T3, T4 and unique maps), arenas |
| `150-uniques` | 3902–4360 | Revealed names, DClone/Rathma uniques, BIG GG display |
| `160-uniques-value-tiers` | 4361–4882 | High / medium / minimal value, low-level duel, all other uniques |
| `170-sets` | 4883–5095 | Revealed names, high / medium value, low-level duel, rings and amulets, normal / exceptional / elite sets |
| `180-crafted` | 5096–5102 | |
| `190-rares` | 5103–5318 | Heavy on hide rules; eth rare weapon notifications |
| `200-magic` | 5319–5623 | Heavy on hide rules; magic charms; eth magic weapon notifications |
| `205-white-runeword-bases` | 5624–5705 | The `RWB_<TAG>_<TYPE>` aliases: each +skill runeword base of white class items (codes, sockets, skills) that 210/220 tag and keep from their hide rules (added S14) |
| `210-nonmagic-armor` | 5706–6260 | General non-magic rules, arrows/bolts, armors, shields, circlets, helms, belts, boots, gloves, barbarian helms, druid pelts and clubs, necromancer heads |
| `220-nonmagic-weapons` | 6261–6854 | Necro wands through swords, ethereal non-magic, %ED tag on superior items, paladin shields |
| `230-item-description-notes` | 6855–7116 | CONTINUE-only notes; maximum block dexterity |
| `240-charms` | 7117–7297 | Magic charm display |
| `250-jewels` | 7298–7417 | |
| `260-arrow-bolt-affixes` | 7418–7505 | |
| `270-boss-gear-tags` | 7508–7638 | Boss tags on identified rare/crafted gear and magic amulets: one line naming every boss an item suits (Rathma / D.Clone / Lucion; helms: D.Clone and Lucion only; rings: Rathma only). Conditions are aliases `BOSSTAG_<RA/DC/LU>_<slot>`, one rule per combination; was `270-rathma-gear-tags` until 2026-10-18 |
| `280-skills-shop-highlights` | 7535–8289 | +Skills items and shop highlights (~27k tokens) |
| `300-affix-tags` | 8290–9553 | 113 stat blocks, one per stat in the game's stat order: MF, GF, resists, FCR, IAS, skills… (largest file, ~28k tokens) |
| `305-runeword-rolls` | 9554–10067 | GENERATED (`tools/gen_runeword_rolls.py`): runeword roll tags, aliases and tag lines in 300's stat order (added S14) |
| `310-staffmods` | 10068–10364 | |
| `315-sell-value-tags` | 10365–10424 | Sell value ($6k below character level 30, then ($)) and low cost vendor ($): left-most tag of the lower line, so after every tag section (was `290` until S14) |
| `320-highlights-ed-amp-lr` | 10425–10471 | |
| `330-tooltip-tags` | 10472–10493 | Cannot Be Frozen, weapon speed & range, item tier type (commented out) |
| `340-high-alvl-crafting-bases` | 10494–10540 | |
| `350-ed-dr-highlights` | 10541–10577 | Chest/shield ED and damage-reduction highlights |
| `360-max-res-resist-tags` | 10578–10619 | Maximum resistances, resistance tags |
| `370-catch-all` | 10620–10621 | `ItemDisplay[]:%NAME%{%NAME%}//` (must stay last) |

To add a section, give it a number between its neighbours (`115-new-topic.filter`). To split one, move lines into a new file; `python tools/build.py --check` then proves the 8 filters didn't change.

Worth having the agent explain once: "Maximum Resistances" appears in `300-affix-tags` (Main 8213) and `360-max-res-resist-tags` (10156). That's probably deliberate, one for tagging and one for highlighting, but it's worth confirming. (S13 also had "Indestructible" twice in `300-affix-tags`; in S14 the first one heads corruption 48's ED tag, Main 8376.)

---

## 3. PD2 filter semantics the agent must get right

The full reference is `docs/pd2-item-filtering.wiki`. These are the points that cause real bugs:

1. **Order is behavior.** Rules are checked top to bottom. The first match *without* `%CONTINUE%` wins and evaluation stops.
2. **`%CONTINUE%`** writes the current output into `%NAME%` and keeps going, so later rules build on the modified name. Adding a CONTINUE rule early can change what dozens of later rules produce.
3. **Hiding** happens when the name output is empty: `ItemDisplay[...]:` or text only inside `{}`. Descriptions can still show for hidden items.
4. **Notifications are processed separately.** `%BORDER-xx%`, `%MAP-xx%`, `%DOT-xx%`, `%PX-xx%` and `%SOUNDID-n%` are applied in their own pass over only the rules that have one, so they can fire even after an earlier rule has stopped (or hidden) the display. In that pass the *first* matching rule alone decides the drop sound and text notification, `%CONTINUE%` or not (BH `MapNotify.cpp`), so a sound rule placed after another matching notification rule never plays. Minimap icons stack until the first matching notification rule without `%CONTINUE%`. `%TIER-n%` limits a notification to levels 0–n, and BH reads only one digit (0–9); without it, a notification fires at every level, which with 12 levels is *not* the same as `%TIER-9%`.
5. **Filter levels:** the order of the `ItemDisplayFilterName` lines defines levels 1–12, and level 0 = "Show All Items". A rule without `FILTLVL` applies at every level.
6. **Aliases are find-and-replace at load,** in definition order. `Alias[BIG_GG]:FALSE` means `ItemDisplay[BIG_GG ...]` becomes `ItemDisplay[FALSE ...]`. In conditions BH replaces the name wherever it occurs, even inside a longer word; in output only `%NAME%`-style uses.
7. **Length limits (BH `TrimItemText`):** a name shows 56 characters (512 for items in a shop); color codes don't count toward that, and everything together is cut at 511. Descriptions are cut with "..." past about 500, less when the item's own text is long. (The wiki's "125 internal" is not what BH does.)
8. **Encoding (author correction):** since S13, UTF-8 displays `•`, `ÿ`, `§`, `¹²³` correctly. The wiki's ANSI advice is out of date. Don't convert.
9. **AND and OR have equal precedence** and are read left to right (BH `ProcessConditions`): `A OR B C` means `(A OR B) AND C`, not `A OR (B AND C)`. Always bracket OR groups. The linter flags an AND that follows an OR inside the same brackets.
10. **Keywords are uppercase.** BH only recognizes `%[A-Z_]+%` (plus digits for `%STAT36%`-style ones); anything else, including a lowercase `%white%` or an unknown `%BLK%`, is shown as text. `%PERCENT%` displays a literal `%`.

The wiki lags behind new features. What the game actually does is in the PD2 BH source, https://github.com/Project-Diablo-2/BH (`BH/Modules/Item/ItemDisplay.cpp` for parsing and display, `BH/Modules/MapNotify/MapNotify.cpp` for notifications and sounds); points 4, 6, 7, 9 and 10 were checked there on 2026-10-03 (commit `caa2b93`). When the wiki and BH disagree, BH wins; the author wins over both.

The wiki page pulls in three other pages. They were downloaded raw on 2026-09-28 and live next to it: `docs/pd2-item-codes.wiki` (the item-code table: `hp5`, `yps`, `r30`, base codes…), `docs/pd2-filter-info.wiki` and `docs/pd2-formula-info.wiki`. For anything not in them, the agent should confirm codes against existing rules in the filter, or ask you, and never guess.

---

## 4. Setting up VS Code + Claude Code

### 4.1 Get the repo onto your machine
The working copy lives at `C:\Users\Erik Admin\Projects\PD2-Loot-Filter` (cloned fresh on 2026-09-28). The older 2025 clone, including the abandoned `builder/` + `sections/` batch-file experiment, is archived untouched at `Projects\PD2-Loot-Filter-old-2025`.
1. Open the repo folder in VS Code (**File → Open Folder**). Claude Code picks up `CLAUDE.md` and `.claude/settings.json` from the folder you open, so open the repo itself, not your home folder.
2. Python 3 is installed (3.14.7, through the python.org install manager). `build.bat` and the hook both use it.

### 4.2 Line endings
**`.gitattributes` must stay committed.** Your filters are stored with CRLF line endings. This machine has `core.autocrlf=true` set globally, which can rewrite line endings on commit and turn a one-line change into an 8,466-line diff. The `*.filter -text` line tells git to leave filter files alone (sections included), and the repo also has `core.autocrlf=false` set locally. The build also puts any section file that picked up LF endings back to CRLF.

### 4.3 Syntax highlighting
In VS Code Extensions, search for **"TommyC90"** / "Diablo 2 Loot Filter".

Also check the bottom-right status bar shows **UTF-8** and **CRLF** when a `.filter` file is open. If it shows anything else, don't save the file. Your README currently tells players to expect Windows 1252, which is out of date since S13 and worth updating.

### 4.4 Stop search results coming back 8 times
`CLAUDE.md` tells Claude to search `sections/` only, and the deny rule in `.claude/settings.json` stops it from editing the 8 generated filters. For your own Ctrl+Shift+F searches, you can add this to `.vscode/settings.json` so only the sections are searched:
```json
{ "search.exclude": { "Erazure-*.filter": true } }
```

### 4.5 Model and modes
Use the strongest model for anything that involves reasoning about rule order. For quick one-line edits the model matters less.

| Task | Claude Code approach | Why |
|---|---|---|
| "Why does X show / not show at level 9?" | **Plan mode** (Shift+Tab to cycle modes) | Read-only. It searches and explains without touching the files. |
| One specific rule tweak you can point at | Select the line in the section file and ask | The selection is sent with your prompt, so the edit stays small. |
| "Add support for new S14 item Y across all levels" | **Normal mode**, approve each edit | Searches, edits, and the hook rebuilds all 8 filters. Review each diff before accepting. |
| Anything big | **Plan mode first**, then approve the plan | You get a list of affected sections, lines and levels before any edit. |

Claude Code checkpoints its own edits, so you can rewind a bad run (Esc Esc, or `/rewind`). Git is still your real undo: commit before any large task.

---

## 5. Recommended order of work

### Phase 0: Setup (done 2026-09-29)
Everything in §4. **Done when:** the repo is cloned locally, the kit files are committed, and `python tools/build.py --check` prints `All 8 filters in sync`.

### Phase 1: Section files (adopted 2026-09-29)
From now on:
1. Edit **only** files in `sections/`. When Claude edits them, the hook rebuilds the 8 filters automatically.
2. When a change is ready to publish, double-click **`build.bat`**. It stamps today's date into the Cube, builds all 8 filters and checks them.
3. Test in game (§8).
4. Commit `sections/`, `version.json` and all 8 filters together in **one** commit with a real message, e.g. `S13: hide magic rings at level 3+ for non-Amazon`. Work on a branch (`setup` for now).
5. Push, and merge to `main` when you're happy (see §9 Q1).

The GitHub Action re-checks on every push. If you edit a section on github.com, the 8 filters don't rebuild there, so the check fails until you pull, run `build.bat` and push again. Editing a root filter on github.com makes the check fail too, which is the point.

Optional first agent task, to make sure the agent has understood the project:
> Read @HANDOFF.md (CLAUDE.md is already loaded). Then, without editing anything, explain how an unidentified magic ring is displayed at filter levels 1, 3 and 12 for a level-85 Sorceress. List every rule that matches in order, with section file and line, including CONTINUE layers and notification keywords.

Check its answer against what you know. If it's wrong, fix `CLAUDE.md` rather than the prompt, so the correction applies to every future chat.

### Phase 2: A linter (done 2026-10-03)
**Status:** `tools/lint_filter.py` exists and runs in the GitHub Action after the build check. It takes its keyword, condition and formula tables from the BH source (not the wiki), item codes from `docs/`, and accepted findings from `tools/lint_allow.txt`. `--all` also shows allow-listed findings and info notes; `--customization` lints the commented-out player options in `050-customization` as if enabled (§9 Q5). Its docstring lists every check. Beyond the list below it also checks: duplicate notification keywords in one rule, `%TIER-n%` above 9, item codes not in `docs/`, aliases that would hang BH or rewrite other words, and AND-after-OR grouping (§3 point 9).

The original brief:

Have the agent write `tools/lint_filter.py`. It should check the built `Erazure-Main.filter` but report locations as `sections/<file>:<line>`:
- Unbalanced `[` `]`, `(` `)` or `{` `}`, and `ItemDisplay` lines missing `]:`.
- `%KEYWORD%` tokens not in the wiki's keyword lists, and alias names used but never defined. Catches typos like `%GOLF%`.
- Estimated name length over 56 displayed / 125 internal characters, and descriptions over 500.
- `%CONTINUE%` inside `{}` (it's ignored there).
- Notification keywords with no `%TIER-n%` in sections where you normally set one (report only, since it may be intentional).
- Exact duplicate rules.
- Rules unreachable because an earlier rule with identical or broader conditions and no CONTINUE always matches first. Start with exact-duplicate conditions only; full logic analysis is much harder.

(The build already stops if a rule comes after the catch-all.) HiimFilter's `validate_filters.py` is a useful checklist of what to test, but its repo has no license, so use it for ideas, not code.

**Done when:** it runs clean on the current S13 filter, or every warning is either a real bug you want fixed or on an allow-list. Then add it to the GitHub Action next to the build check.

Be realistic about the limits: a linter catches syntax and typos. It can't tell you whether hiding something at level 8 is the right *design* call. Only you and in-game testing can.

### Phase 3: A "which rules match this item?" tool (optional, more ambitious)
**Status (2026-10-04):** a first version exists. `python tools/explain_item.py <code> <quality> --level N [--set K=V ...]` lists the matching rules in order with BH semantics, where the display stops (shown or hidden), and which rule decides the drop sound. Unspecified values (stats, class, map...) make rules "maybe". Item groups are not derived from the code yet (pass `--groups`), and there is no file of expected results yet.

The original brief:

`tools/explain_item.py`: you describe an item (code, quality, ethereal, sockets, a few stats, character level, class, filter level, variant), and it walks the filter top to bottom showing which rules match, what `%NAME%` becomes after each CONTINUE, where evaluation stops, and which notifications fire.
- This is the closest thing to a test suite this project can have. You'd keep a file of items with expected output, e.g. "Ber at FILTLVL 12 in BIG_GG outside town shows BIG GG".
- It's a real project, because it needs a parser for the condition language (AND/OR/!/parentheses/comparisons/`~` ranges) and a model of every code you use.
- Build it in stages: item codes and qualities first, then FILTLVL/CLVL, then stats.
- Worth it if you plan to keep maintaining the filter for several more seasons.

### Phase 4: Season update routine
At each ladder reset:
1. Refresh `docs/pd2-item-filtering.wiki` and `docs/pd2-item-codes.wiki` from the wiki. Re-add your correction notes if they still apply.
2. Save that season's patch notes to `docs/patch-notes/season-NN.wiki`. Use `https://wiki.projectdiablo2.com/w/index.php?title=Patch_Notes&action=raw&templates=expand`; if it comes back as mostly `{{...}}` lines, download the individual season page instead.
3. Agent prompt:
   > Read @docs/patch-notes/season-NN.wiki. List every new or changed item, base, rune, map, stat or filter-syntax feature. For each, search `sections/` and say whether the filter already handles it (with section file and line), and propose where and how to add or change rules. Don't edit yet.
4. Re-check the BH tables at the top of `tools/lint_filter.py` (conditions, keywords, formula variables, notification keywords) against the current `BH/Modules/Item/ItemDisplay.cpp`, and update the commit noted there.
5. Work through the list. Set the new season name in `version.json` (`"season": "Season NN"`) and in the "Updated for Season NN." that ends each description in `filter_definitions.json` (what players read in the launcher), then run `build.bat` (it stamps the date), run the linter, test in game, and push.

**Unique/set roll tags:** `python tools/item_data.py fetch` refreshes `docs/items/` from the wiki (the git diff shows what changed on uniques and sets), then `python tools/gen_unique_rolls.py` regenerates the fingerprints and default picks; review lines marked `CHOOSE` in `tools/unique_roll_picks.txt`.

**Runeword roll tags:** `python tools/pd2_data.py --extract "<Diablo II folder>"` also rewrites `docs/pd2-runewords.tsv` (the git diff shows new and changed runewords), then `python tools/gen_runeword_rolls.py` regenerates `305-runeword-rolls` and the default picks; it reports any runeword it can't tell apart from another (`--report NAME` shows why). Review new runewords in `pick_runewords.bat`; `--requests` lists picked rolls that still need a look in 300.

**Unique/set tier page:** `python tools/tier_map.py` regenerates `Erazure-Unique-Set-Tiers.html` (the players' page: each unique and set item's tier and conditions, from the filter's own rules; `build.bat` and the hook run it, CI checks it). It goes to `main` with the filters, and GitHub Pages serves it from there. `--findings` lists the filter checks (tier rules on a base no such item drops as, rule comments naming an item that is not on its base, labels BH cuts at 56 characters). After `--extract` (new items or bases), run it and read the findings.

**Non-magical bases page:** `python tools/base_map.py` regenerates `Erazure-Non-Magic-Bases.html` (the players' page: each non-magical armor and weapon base's tags, notifications, own displays and hiding, per filter level, from the filter's own rules; `build.bat` and the hook run it, CI checks it; the website's Non-magical Bases page shows it). One table per item type: Levels, Shows (pill or the tag as the game draws it), Icon, Chat, Eth, Quality, ED, Sockets, Character level, and Class / Item level / All res / Skills / Other where the type uses them; rows sorted Tag, Notify, Shows as, Hidden, then by levels, eth, quality, ED, sockets, level; bases of one type, tier, socket maximum and size with identical rows grouped. The named runeword bases stay words (`RWB_*` from 205: "unless a Plague, Chaos or Malice base"), and a tag's skill combinations open in a drop-down. `--base 7wn,uit` prints bases' rows with the rules behind them; `--findings` lists rules that apply to no white base and minimap icons on items a rule hides at that level (0 since 2026-10-12). The `($)` rules of claws, staves, scepters and class helms are left out: a `($)` is only for bases of 2 inventory squares or less (`AREA<3`, the author's choice), and those are all bigger. Base sockets and sizes and skill names come from `--tier-data` (`docs/pd2-bases.tsv`, `docs/pd2-skills.tsv`).

**Magic and rare items pages:** `python tools/magic_rare_map.py` regenerates `Erazure-Magic-Items.html` and `Erazure-Rare-Items.html` (the players' pages: how each armor, weapon, quiver, ring, amulet, jewel and charm base shows when it drops unidentified as a magic or rare item, per filter level, from the filter's own rules; `build.bat` and the hook run it, CI checks it; the website's Magic Items and Rare Items pages show them). It runs on `base_map.py`'s engine with the Non-magical Bases page's layout; its rows join BH's display pass and notification pass, so a hidden item with a minimap icon shows as a Hidden row with that icon. `QLVL` comes from the `qlvl` column of `docs/pd2-bases.tsv` (`--tier-data`). `--base uar,jew [--quality RARE]` prints bases' rows; `--findings` lists minimap icons on hidden items and 190/200 rules that apply to no base. Built and checked 2026-10-14 against the filter's rules evaluated directly, every base over hundreds of thousands of drop cases.

**Filter levels page:** `python tools/level_map.py` regenerates `Erazure-Filter-Levels.html` (the players' page that replaced the README's "Differences Between Filter Level Tiers": what each filter level shows, notifies and hides for every kind of item that drops, at every character level, from the filter's own rules; `build.bat` and the hook run it, CI checks it; the website's Filter Levels page shows it). Columns are the levels that behave the same, potions aside (0 | 1 | 2 | 3-4 | 5-7 | 8-9 | 10 | 11 | 12, found by the tool); rows are kinds of items (gold, potions, scrolls, keys, gems, runes, PD2 items, maps, quest items, uniques and sets by tier, rare, magic and non-magical items by type, non-magical ones as a plain and a best-case row) with sub-rows where their items behave differently; a cell has its state per character level (a strip), words and details (Normal difficulty and the special areas as notes). Below the table, "What changes" cards list each level group's changes from the one before it, item by item, as small tables (rows: character levels, gold piles, ethereal or not, classes...; columns: the levels before, then now; changed rows marked; "High value → Medium value" when nothing else matters), level 11 against 8-9 and level 12 marking what it shares with 10. A cell's details use the same tables. The author's one-line intros are `INTROS` in the tool. `--row NAME`, `--changes`, `--findings` (a launcher name's "Hides 35%" (or H5 / M5) the rules don't do, a level group split by more than potions or with no `INTROS` line). Its engine evaluates every case of a drop at once as bitmasks (about 10 s for the whole page); checked 2026-10-14 against the rules evaluated one case at a time, no differences.

**Website:** https://filtersby-erazure.github.io/PD2-Loot-Filter/ is MkDocs with the Material theme. Its pages are `website/docs/*.md` (the README's text) and its config is `website/mkdocs.yml`; `website/hooks.py` puts the tier map into the Unique & Set Tiers page, the bases map into the Non-magical Bases page, the magic and rare maps into the Magic Items and Rare Items pages and the level map into the Filter Levels page at build time (from `Erazure-Unique-Set-Tiers.html`, `Erazure-Non-Magic-Bases.html`, `Erazure-Magic-Items.html`, `Erazure-Rare-Items.html` and `Erazure-Filter-Levels.html`, between their templates' `tier-map` / `base-map` / `magic-map` / `rare-map` / `level-map` markers). Every visit starts dark (`website/overrides/main.html` forgets a light/dark switch saved by an earlier visit). `site_preview.bat` previews it locally (it installs MkDocs Material 9.7.7 into `tools/.cache/mkdocs-venv` on first use). `publish_beta.py` copies `website/` and `.github/workflows/pages.yml` to `main`, where that workflow builds and deploys the site on every push. Pages source: GitHub Actions.

**With a beta (as for Season 14, 2026-10):** do the work on a `beta` branch made from `setup`, with `"season": "Season NN Beta"` in `version.json` so the Cube shows it. The launcher only serves `main`, so to let beta testers pick the beta build, `python tools/publish_beta.py` copies `beta`'s `Erazure-Main.filter` to `main` as `Erazure-S14-Beta.filter` plus a `filter_definitions.json` entry, and the website (`website/`, its Pages workflow and the tier page `Erazure-Unique-Set-Tiers.html`), never touching the 8 live files (`--push` only with the author's go-ahead). Patch notes change during a beta: diff each update against what is done. At launch: merge `beta` → `setup` → `main`, set the final season name, `build.bat`, and `python tools/publish_beta.py --remove`. The S14 list is in `docs/patch-notes/s14-dev-streams.md`.

---

## 6. Prompt patterns that work for this filter

**Understand before changing:**
> Find every rule in `sections/` that can match `<item code / group>`. Include CONTINUE layers, hide rules, FILTLVL/CLVL conditions, class conditions, variant aliases, and notification keywords. List them in order with section file and line, and explain what the player sees at levels 1, 5, 9 and 12.

**Make a change safely:**
> I want `<behavior>` at filter levels `<n–m>` for `<classes / all>` in `<all variants / BIG GG only>`. First show me the rules that currently decide this and where the new or changed rule must go and why, including what it would shadow. Wait for my OK, then edit the section files only (the hook rebuilds), run the linter, and show the diff.

**Explain a surprise from in-game:**
> In game at filter level `<n>`, character level `<x>` `<class>`, a `<item description>` showed as `<what you saw>` / was hidden / didn't notify. Trace which rules produced that, and why.

**Refactor carefully:**
> In `sections/<file>`, find rules that could be merged without changing behavior at any filter level. Propose them as a list with before/after. Don't apply anything.

The agent should ask you back about which levels, classes and variants a change applies to. The rules file tells it to, so when it asks, that's working as intended.

---

## 7. Where an LLM helps here, and where it doesn't

**Helps a lot:**
- Finding every interacting rule in 8,500 lines quickly.
- Spotting shadowing and ordering problems.
- Writing consistent repetitive blocks (maps, runes, stat tags).
- Writing and maintaining the tools (build, lint, explain).
- Turning patch notes into a to-do list.

**Helps somewhat, verify everything:**
- PD2-specific facts: item codes, stat IDs, what's valuable this season. General Diablo 2 knowledge is often wrong for PD2, so the agent should rely on `docs/` and your existing rules, not memory.
- Knowing what the filter language supports: it will sometimes invent keywords or conditions that don't exist. The linter from Phase 2 catches most of these.

**Doesn't help:**
- Deciding what's worth showing at level 8 for endgame players. That's your design judgment and community feedback.
- Whether it actually looks right in game (colors, symbol alignment, BIG GG timing).

**About the comparison articles:** the published Cursor / Claude Code / Codex comparisons are benchmarked on mainstream languages. They say nothing about a niche format like this one. What will decide output quality here is the reference docs in `docs/`, the rules file, and whether the agent searches before it edits. All three are set up by this kit.

---

## 8. In-game test checklist (before each push)

- [ ] `build.bat` → BUILD OK (or `python tools/build.py --check` → in sync, if you don't want a new date)
- [ ] `python tools/lint_filter.py` clean (accepted findings in `tools/lint_allow.txt`)
- [ ] Load `Erazure-Main.filter` locally (`Diablo II\ProjectD2\filters\local`, Local Filter, Save Filter)
- [ ] Horadric Cube description shows the right variant name and version string
- [ ] Spot-check the items you changed at the lowest and highest filter level they apply to
- [ ] If you touched BIG GG / Revealed / PoE logic, load that variant as well and check it
- [ ] Changes that hide things: confirm at level 0 ("Show All") the item still appears

---

## 9. Open questions to settle (the agent can't answer these)

1. ~~Does the PD2 launcher serve your `main` branch directly to players?~~ **Settled 2026-10-04: yes.** The launcher's `filters.json` entry is `https://api.github.com/repos/FiltersBy-Erazure/PD2-Loot-Filter/contents` (GitHub contents API, no `?ref=`), which returns the default branch, `main`. Every push to `main` reaches players on their next Play; other branches never do.
2. ~~Is `Erazure-Main.filter` always the right source?~~ **Settled 2026-09-29:** `sections/` is the source; `Erazure-Main.filter` is generated like the other 7.
3. **Duplicate section names** (Indestructible, Maximum Resistances; see §2.4): intentional?
4. **README encoding instructions:** update from "Windows 1252" to UTF-8 for S13+?
5. **Player customization section (`sections/050-customization.filter`):** *(partly settled 2026-10-03: `python tools/lint_filter.py --customization` lints them as if enabled; not part of CI.)* Should the linter check those commented-out rules as if enabled, so they don't break when a player uncomments one?

---

## 10. Commit message convention (suggested)

```
S13: <what changed, player-facing>

- <detail with section file refs if useful>
- Levels affected: <n–m>; Variants: <all / BIG GG / …>
```
One commit per logical change, covering the changed section files, `version.json` (if stamped) and all 8 filters at once. Tag each season's release with `git tag s13-2026-05-28`, for example, so you can always compare against the last release.
