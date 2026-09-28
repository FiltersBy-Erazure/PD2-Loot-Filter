# Erazure PD2 Loot Filter: Claude Code in VS Code Handoff

*Prepared 2026-09-27 from the state of `FiltersBy-Erazure/PD2-Loot-Filter` at the Season 13 build (last filter commit 2026-05-28, "Season 13 - May 28th"). Revised the same day for Claude Code in VS Code instead of Cursor.*

This document is for two readers:
- **You (the author):** it covers setting up the project in VS Code with the Claude Code extension, what changes about your workflow, and the order to do things in.
- **Claude Code:** it's the project briefing. When a task is bigger than a one-rule tweak, start the conversation with `@HANDOFF.md`.

`CLAUDE.md` in the repo root is loaded automatically at the start of every Claude Code conversation. It's kept short (about 75 lines) on purpose. This document holds the longer background and is only read when you mention it.

---

## 1. What's in this kit

| File | Put it at | What it does |
|---|---|---|
| `HANDOFF.md` | repo root | This document. Project briefing for you and the agent. |
| `CLAUDE.md` | repo root | Loaded into every Claude Code conversation: filter semantics, file-format rules, the "search Main only" rule, and the checklist to follow before changing a rule. |
| `.claude/settings.json` | `.claude/` | Rules Claude Code **enforces** rather than just asks for: (1) blocks Claude from editing the 7 generated variant files; (2) lets it run the build script without asking each time; (3) a hook that re-runs the build script after every edit, so the variants can't fall out of sync. |
| `.claude/hooks/rebuild_variants.py` | `.claude/hooks/` | The hook itself. It only acts when `Erazure-Main.filter` or `filter_definitions.json` was edited. It's silent on success; on failure it exits 2, which sends the error back to Claude. |
| `tools/build_variants.py` | `tools/` | Generates the 7 variant filters from `Erazure-Main.filter`. `--check` exits 1 if any variant has drifted. |
| `.github/workflows/check-variants.yml` | `.github/workflows/` | GitHub Action that fails if the variants don't match Main. It's a safety net for web-UI edits. |
| `.gitattributes` | repo root | Tells git never to convert line endings in `.filter` files (see §4.2 for why this matters on Windows). |
| `docs/pd2-item-filtering.wiki` | `docs/` | Raw copy of the PD2 wiki's Item Filtering page, with your S13 UTF-8 correction and a note about what's missing. |
| `docs/pd2-item-codes.wiki`, `docs/pd2-filter-info.wiki`, `docs/pd2-formula-info.wiki` | `docs/` | The three pages Item Filtering pulls in, downloaded raw on 2026-09-28. |
| `docs/patch-notes/pd2-patch-notes-2026-09-27.wiki` | `docs/patch-notes/` | Full Patch Notes page as of 2026-09-27, including the Season 14 Dev Streams #1–2. |

---

## 2. The filter as it actually is (measured, not assumed)

### 2.1 Repository shape

- **8 filter files**, each 8,476 lines / 827 KB, UTF-8, CRLF line endings.
- **The 8 files are identical except for 6 lines.** The Toggles section (lines 46–88 of Main) holds 8 labelled blocks of 3 aliases each. Exactly one block is uncommented:
  ```
  //  Erazure - Main
  Alias[BIG_GG]:FALSE
  Alias[POE_SOUNDS]:FALSE
  Alias[REVEALED]:FALSE
  ```
  Every variant is Main with its own block uncommented and Main's block commented out.
- **`filter_definitions.json`** tells the launcher the display name, description and file name of each variant. Its `display_name` values match the `//  Erazure - ...` headers in the Toggles block exactly, and the build script relies on that.
- **Current workflow:** edits are made in the GitHub web editor and committed once per file. That's 8 commits per change: 1,588 commits so far, almost all "Update Erazure-X.filter". The commits for one change don't always look alike (on 2026-05-28 one variant's diff was 312 lines and another's was 75), but the files end up identical apart from the toggles. That's the point where drift could slip in, and it's what the build script removes.

### 2.2 Size and what that means for an LLM

About 827 KB is roughly 200k+ tokens per file. **No conversation will "see the whole filter" at once.** Claude Code works by searching (grep) and reading line ranges, the same way you'd use Ctrl+F. Two consequences:

1. Claude is only as good as its searches. Every prompt about an item should make it list all the rules that mention that item before it proposes anything. `CLAUDE.md` already requires this.
2. Searching all `*.filter` files returns **every hit 8 times**, which fills the context with duplicates and uses up your plan's usage faster. `CLAUDE.md` tells Claude to search `Erazure-Main.filter` only.

**Keep the reference docs out of `CLAUDE.md` imports.** In `CLAUDE.md`, a bare `@path` (not in backticks) loads that whole file at the start of *every* conversation. `@docs/pd2-item-filtering.wiki` would add about 107 KB to every session. The kit's `CLAUDE.md` writes those paths in backticks so Claude searches them only when it needs to. Keep it that way if you edit the file.

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

### 2.4 Section map (Main, line numbers as of S13)

| Line | Section | Notes |
|---|---|---|
| 1 | Filter Levels | 12 `ItemDisplayFilterName[]` lines; their order defines FILTLVL 1–12 |
| 16 | Horadric Cube | Shows filter level, variant name and **season/version string** in the Cube description |
| 46 | Toggles | The variant switch (the 8 alias blocks) |
| 90 | Aliases | `TOWN`, rune decoration aliases, etc. |
| 277 | Loot Filter Customization | Commented-out opt-in rules for players (potions, quivers…) |
| 543–737 | Gold, Potions, Tomes/Scrolls, Keys | Keys block is ~300 CONTINUE rules |
| 1307–1471 | Quest Items, Gems, Sound IDs | |
| 1524–1708 | Runes (El-Tal → Sur-Zod) | Includes "Rune Notifications and Map Icons" at 1578 |
| 1708–1981 | Shards, Puzzlebox, Demonic Cube, Almanac, Navigator, Skeleton Key, Vial, Mirror, Essences, Ubers, DClone, Rathma, Lucion, Orbs, Infusions, Ears, Scarab | BIG GG / LIL GG items live here |
| 1981–2846 | Maps and Arenas | Tier 1–3 and Unique maps, per-map blocks |
| 2846–3807 | Unique Items | Incl. DClone/Rathma uniques, value tiers, low-level duel uniques |
| 3807 | Set Items | |
| 4014 | Crafted Items | |
| 4021 | Rare Items | Heavy on hide rules; eth rare weapon notifications at 4188 |
| 4238 | Magic Items | Heavy on hide rules; eth magic weapon notifications at 4493 |
| 4542 | Non-Magical Items | Bases by type: armors, shields, weapons…; arrows/bolts 4757 |
| ~5700 | Item Description Notes | CONTINUE-only |
| 5959 | Magic Charm Display | |
| ~6146 | Jewels Display | |
| ~6374 | +Skills Items and Shop Highlights | 374 CONTINUE rules |
| ~7130 | High Sell Value Tag ($) | |
| 7193–7991 | Stat tag sections | Affixes, MF, GF, resists, FCR, IAS, skills, etc. |
| ~8007 | Staffmods Display | |
| ~8354 | High Affix Level Crafting Bases | |
| 8397–8474 | Highlights, Max Res, Resistance tags | |
| 8476 | Catch-all | `ItemDisplay[]:%NAME%{%NAME%}//` (must stay last) |

Worth having the agent explain once: two section headers appear twice ("Indestructible" at 7862 and 7991, "Maximum Resistances" at 7552 and 8434). That's probably deliberate, one for tagging and one for highlighting, but it's worth confirming.

---

## 3. PD2 filter semantics the agent must get right

The full reference is `docs/pd2-item-filtering.wiki`. These are the points that cause real bugs:

1. **Order is behavior.** Rules are checked top to bottom. The first match *without* `%CONTINUE%` wins and evaluation stops.
2. **`%CONTINUE%`** writes the current output into `%NAME%` and keeps going, so later rules build on the modified name. Adding a CONTINUE rule early can change what dozens of later rules produce.
3. **Hiding** happens when the name output is empty: `ItemDisplay[...]:` or text only inside `{}`. Descriptions can still show for hidden items.
4. **Notifications are processed separately.** `%BORDER-xx%`, `%MAP-xx%`, `%DOT-xx%`, `%PX-xx%` (and sounds) are applied in their own pass, so they can fire even after an earlier rule has stopped evaluation. Without `%TIER-n%`, a notification behaves as `%TIER-9%` and fires at every level.
5. **Filter levels:** the order of the `ItemDisplayFilterName` lines defines levels 1–12, and level 0 = "Show All Items". A rule without `FILTLVL` applies at every level.
6. **Aliases are find-and-replace at load.** `Alias[BIG_GG]:FALSE` means `ItemDisplay[BIG_GG ...]` becomes `ItemDisplay[FALSE ...]`.
7. **Length limits:** names are capped at 56 displayed / 125 internal characters (each color keyword counts 3, `%NL%` counts 2). Descriptions are capped at 500. A heavily decorated rune name can silently break past these limits.
8. **Encoding (author correction):** since S13, UTF-8 displays `•`, `ÿ`, `§`, `¹²³` correctly. The wiki's ANSI advice is out of date. Don't convert.

**Gap in the reference copy:** the wiki page pulls in three other pages that aren't in the download:
- `{{:Item Codes}}`, the item-code table (`hp5`, `yps`, `r30`, base codes…). This is the one that matters.
- `{{:Filter_Info}}`
- `{{:Formula_Info}}`

Download Item Codes the same way you downloaded the main page and save it as `docs/pd2-item-codes.wiki`:
`https://wiki.projectdiablo2.com/w/index.php?title=Item_Codes&action=raw`
Until then, the agent should confirm item codes against existing rules in the filter, or ask you, and never guess.

---

## 4. Setting up VS Code + Claude Code

### 4.1 Get the repo onto your machine
The working copy lives at `C:\Users\Erik Admin\Projects\PD2-Loot-Filter` (cloned fresh on 2026-09-28). The older 2025 clone, including the abandoned `builder/` + `sections/` batch-file experiment, is archived untouched at `Projects\PD2-Loot-Filter-old-2025`.
1. Open the repo folder in VS Code (**File → Open Folder**). Claude Code picks up `CLAUDE.md` and `.claude/settings.json` from the folder you open, so open the repo itself, not your home folder.
2. Install Python 3 (python.org, and tick "Add to PATH"). Then turn off the Microsoft Store `python.exe` alias (Settings → Apps → Advanced app settings → App execution aliases). Otherwise `python` opens the Store instead of running the build script.

### 4.2 Line endings
**`.gitattributes` must be committed before anything else from Windows.** Your filters are stored with CRLF line endings. This machine has `core.autocrlf=true` set globally, which can rewrite line endings on commit and turn a one-line change into an 8,476-line diff. The `*.filter -text` line tells git to leave the files alone, and the repo also has `core.autocrlf=false` set locally.

### 4.3 Syntax highlighting
In VS Code Extensions, search for **"TommyC90"** / "Diablo 2 Loot Filter".

Also check the bottom-right status bar shows **UTF-8** and **CRLF** when a `.filter` file is open. If it shows anything else, don't save the file. Your README currently tells players to expect Windows 1252, which is out of date since S13 and worth updating.

### 4.4 Stop search results coming back 8 times
`CLAUDE.md` tells Claude to search `Erazure-Main.filter` only, and the deny rules in `.claude/settings.json` stop it from editing the 7 generated files. For your own Ctrl+Shift+F searches, you can add this to `.vscode/settings.json`:
```json
{ "search.exclude": { "Erazure-Main-PoE.filter": true, "Erazure-Revealed*.filter": true, "Erazure-BIG-GG*.filter": true } }
```

### 4.5 Model and modes
Use the strongest model for anything that involves reasoning about rule order. For quick one-line edits the model matters less.

| Task | Claude Code approach | Why |
|---|---|---|
| "Why does X show / not show at level 9?" | **Plan mode** (Shift+Tab to cycle modes) | Read-only. It searches and explains without touching the file. |
| One specific rule tweak you can point at | Select the line in the editor and ask | The selection is sent with your prompt, so the edit stays small. |
| "Add support for new S14 item Y across all levels" | **Normal mode**, approve each edit | Searches, edits, and the hook rebuilds variants. Review each diff before accepting. |
| Anything big | **Plan mode first**, then approve the plan | You get a list of affected lines and levels before any edit. |

Claude Code checkpoints its own edits, so you can rewind a bad run (Esc Esc, or `/rewind`). Git is still your real undo: commit before any large task.

---

## 5. Recommended order of work

### Phase 0: Setup (you, ~30 min)
Everything in §4. **Done when:** the repo is cloned locally, the kit files are committed, and `python tools/build_variants.py --check` prints `All 8 filters in sync.`

### Phase 1: One source file (already built, adopt it)
From now on:
1. Edit **only** `Erazure-Main.filter`.
2. Run `python tools/build_variants.py`.
3. Commit all changed files together in **one** commit with a real message, e.g. `S13: hide magic rings at level 3+ for non-Amazon`.
4. Push.

The GitHub Action re-checks on every push. If you ever edit a variant on github.com by accident, the check fails and you'll know.

Optional first agent task, to make sure the agent has understood the project:
> Read @HANDOFF.md (CLAUDE.md is already loaded). Then, without editing anything, explain how an unidentified magic ring is displayed at filter levels 1, 3 and 12 for a level-85 Sorceress. List every rule that matches in order, with line numbers, including CONTINUE layers and notification keywords.

Check its answer against what you know. If it's wrong, fix `CLAUDE.md` rather than the prompt, so the correction applies to every future chat.

### Phase 2: A linter (agent task)
Have the agent write `tools/lint_filter.py`. It should report by line number:
- Unbalanced `[` `]`, `(` `)` or `{` `}`, and `ItemDisplay` lines missing `]:`.
- `%KEYWORD%` tokens not in the wiki's keyword lists, and alias names used but never defined. Catches typos like `%GOLF%`.
- Estimated name length over 56 displayed / 125 internal characters, and descriptions over 500.
- `%CONTINUE%` inside `{}` (it's ignored there).
- Notification keywords with no `%TIER-n%` in sections where you normally set one (report only, since it may be intentional).
- Any rule after the catch-all.
- Exact duplicate rules.
- Rules unreachable because an earlier rule with identical or broader conditions and no CONTINUE always matches first. Start with exact-duplicate conditions only; full logic analysis is much harder.

**Done when:** it runs clean on the current S13 filter, or every warning is either a real bug you want fixed or on an allow-list. Then add it to the GitHub Action next to the sync check.

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
   > Read @docs/patch-notes/season-NN.wiki. List every new or changed item, base, rune, map, stat or filter-syntax feature. For each, say whether @Erazure-Main.filter already handles it, with line numbers, and propose where and how to add or change rules. Don't edit yet.
4. Work through the list, then update the Cube version string (`Season NN - <date>`, Horadric Cube section), rebuild, run the linter, test in game, and push.

---

## 6. Prompt patterns that work for this filter

**Understand before changing:**
> Find every rule in @Erazure-Main.filter that can match `<item code / group>`. Include CONTINUE layers, hide rules, FILTLVL/CLVL conditions, class conditions, variant aliases, and notification keywords. List them in file order with line numbers and explain what the player sees at levels 1, 5, 9 and 12.

**Make a change safely:**
> I want `<behavior>` at filter levels `<n–m>` for `<classes / all>` in `<all variants / BIG GG only>`. First show me the rules that currently decide this and where the new or changed rule must go and why, including what it would shadow. Wait for my OK, then edit Main only, run the build script and the linter, and show the diff.

**Explain a surprise from in-game:**
> In game at filter level `<n>`, character level `<x>` `<class>`, a `<item description>` showed as `<what you saw>` / was hidden / didn't notify. Trace which rules produced that, and why.

**Refactor carefully:**
> In the `<section>` section, find rules that could be merged without changing behavior at any filter level. Propose them as a list with before/after. Don't apply anything.

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

- [ ] `python tools/build_variants.py --check` → in sync
- [ ] Linter clean (once Phase 2 exists)
- [ ] Load `Erazure-Main.filter` locally (`Diablo II\ProjectD2\filters\local`, Local Filter, Save Filter)
- [ ] Horadric Cube description shows the right variant name and version string
- [ ] Spot-check the items you changed at the lowest and highest filter level they apply to
- [ ] If you touched BIG GG / Revealed / PoE logic, load that variant as well and check it
- [ ] Changes that hide things: confirm at level 0 ("Show All") the item still appears

---

## 9. Open questions to settle (the agent can't answer these)

1. **Does the PD2 launcher serve your `main` branch directly to players?** If it does, every push reaches players immediately. Consider doing your work on a `dev` branch and merging to `main` only after in-game testing.
2. **Is `Erazure-Main.filter` always the right source?** The build script assumes the Main toggle block is the active one in Main. If you'd rather keep a separate template file, e.g. `src/Erazure.filter.template`, the script is easy to adapt.
3. **Duplicate section names** (Indestructible, Maximum Resistances): intentional?
4. **README encoding instructions:** update from "Windows 1252" to UTF-8 for S13+?
5. **Player customization section (line 277):** should the linter check those commented-out rules as if enabled, so they don't break when a player uncomments one?

---

## 10. Commit message convention (suggested)

```
S13: <what changed, player-facing>

- <detail with line refs if useful>
- Levels affected: <n–m>; Variants: <all / BIG GG / …>
```
One commit per logical change, covering all 8 files at once. Tag each season's release with `git tag s13-2026-05-28`, for example, so you can always compare against the last release.
