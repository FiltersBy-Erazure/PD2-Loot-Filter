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

`sections/` at the split (2026-09-29). "Main lines" are where each file's content sits in `Erazure-Main.filter` as of S13; they shift as sections grow. Each file starts at its header's top border line, so it opens with the complete header box.

| File | Main lines | Contents |
|---|---|---|
| `010-filter-levels` | 1–15 | 12 `ItemDisplayFilterName[]` lines; their order defines FILTLVL 1–12 |
| `020-horadric-cube` | 16–45 | Filter level, variant name and `<<VERSION>>` in the Cube description |
| `030-toggles` | 46–89 | The 8 variant alias blocks (Main active) |
| `040-aliases` | 90–276 | `TOWN`, rune / item / unique / set / rare / map group aliases |
| `050-customization` | 277–542 | Commented-out opt-in rules for players |
| `060-gold-potions-tomes` | 543–736 | Gold; health, mana, rejuvenation, utility and throwing potions; tomes and scrolls |
| `070-keys` | 737–1305 | MAPID list and key rules |
| `080-quest-items` | 1306–1334 | |
| `090-gems` | 1335–1469 | |
| `100-sound-ids` | 1470–1522 | |
| `110-runes` | 1523–1707 | El-Tal → Sur-Zod, rune notifications and map icons |
| `120-pd2-items` | 1708–1979 | Shards, Puzzlepiece/box, Demonic Cube, Almanac, Navigator, Skeleton Key, Vial, Mirror, Essences, Uber keys/organs/ancients, DClone/Rathma/Lucion items, orbs, infusions, ears, Scarab (BIG GG items) |
| `130-maps` | 1980–2125 | Map names (T1–T3, unique, T4 dungeons), area level |
| `140-map-resistances` | 2126–2640 | S13 per-map resistance display: explanation, then one block per map |
| `145-map-rolls-and-notifications` | 2641–2844 | Map contents and modifier highlights, catalyzed, tier tags, map icons and notifications, mf/den/rar/exp prefixes, arenas |
| `150-uniques` | 2845–3301 | Revealed names, DClone/Rathma uniques, BIG GG display |
| `160-uniques-value-tiers` | 3302–3806 | High / medium / minimal value, low-level duel, all other uniques |
| `170-sets` | 3807–4013 | |
| `180-crafted` | 4014–4020 | |
| `190-rares` | 4021–4237 | Heavy on hide rules; eth rare weapon notifications |
| `200-magic` | 4238–4541 | Heavy on hide rules; magic charms; eth magic weapon notifications |
| `210-nonmagic-armor` | 4542–5095 | General non-magic rules, arrows/bolts, armors, shields, circlets, helms, belts, boots, gloves, barbarian helms, druid pelts and clubs, necromancer heads |
| `220-nonmagic-weapons` | 5096–5697 | Necro wands through swords, ethereal non-magic, %ED tag on superior items, paladin shields |
| `230-item-description-notes` | 5698–5958 | CONTINUE-only notes; maximum block dexterity |
| `240-charms` | 5959–6139 | Magic charm display |
| `250-jewels` | 6140–6241 | |
| `260-arrow-bolt-affixes` | 6242–6329 | |
| `270-rathma-gear-tags` | 6330–6358 | |
| `280-skills-shop-highlights` | 6359–7113 | +Skills items and shop highlights (largest file, ~27k tokens) |
| `290-sell-value-tags` | 7114–7171 | High sell value ($), low cost vendor |
| `300-affix-tags` | 7172–7990 | ~45 stat-tag groups: MF, GF, resists, FCR, IAS, skills… |
| `310-staffmods` | 7991–8267 | |
| `320-highlights-ed-amp-lr` | 8268–8314 | |
| `330-tooltip-tags` | 8315–8336 | Cannot Be Frozen, weapon speed & range, item tier type (commented out) |
| `340-high-alvl-crafting-bases` | 8337–8385 | |
| `350-ed-dr-highlights` | 8386–8422 | Chest/shield ED and damage-reduction highlights |
| `360-max-res-resist-tags` | 8423–8464 | Maximum resistances, resistance tags |
| `370-catch-all` | 8465–8466 | `ItemDisplay[]:%NAME%{%NAME%}//` (must stay last) |

To add a section, give it a number between its neighbours (`115-new-topic.filter`). To split one, move lines into a new file; `python tools/build.py --check` then proves the 8 filters didn't change.

Worth having the agent explain once: two section headers appear twice. "Indestructible" appears twice inside `300-affix-tags` (Main 7852 and 7981), and "Maximum Resistances" appears in `300-affix-tags` (7542) and `360-max-res-resist-tags` (8424). That's probably deliberate, one for tagging and one for highlighting, but it's worth confirming.

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
5. Work through the list. Set the new season name in `version.json` (`"season": "Season NN"`), then run `build.bat` (it stamps the date), run the linter, test in game, and push.

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
- Deciding what's worth showing at level 9 for endgame players. That's your design judgment and community feedback.
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

1. **Does the PD2 launcher serve your `main` branch directly to players?** If it does, every push reaches players immediately. Work on a branch (`setup` now) and merge to `main` only after in-game testing.
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
