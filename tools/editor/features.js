/* Erazure's features a player can switch off (or, for the few Erazure ships switched off, on). Each names sections or
   aliases by name, so it follows every new Erazure:
     sections: the %CONTINUE% rules of these sections that notify nothing are switched off (//), so only label text and
               description lines go; a section's stopping rules, hides and alerts are never touched; with descOnly,
               only the rules that write description lines alone (output %NAME%{...}: the label untouched);
     aliases:  these aliases (names or a name pattern) are set to FALSE, the way Erazure's own tag systems are wired;
     switchOn: (on: false by default) the switched-off rules of a section whose text has `match` are switched on.
   Finer switches (2026-11-12, the author: "players may want more granular control ... for charm tags, they may want to
   choose individual tags to turn off"), each part switched off on its own while the feature is on
   (EZ.edits.featureParts has the rules):
     parts: true    the rules the feature switches off, a part per stat block (300, 305) or comment heading ("Gold
                    Find", "+N Chain Lightning Sentry");
     parts: "text"  a part per line the rules draw ("+#% Monster Rarity");
     partAliases:   a part per stat the aliases show (set to FALSE), named by the tagLines section's stat blocks;
     samples:       items the Features area runs with the feature on and off, to show what it changes (for the
                    features whose rules can't be drawn on their own).
   tools/editor_selftest.py checks every feature against today's source. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.features = [
  {id: "affix-tags", group: "Tags", title: "Affix tags",
   sub: "The short tags of magic, rare, unique and set items' stats (11r, 3fcr, 15ias...).",
   sections: ["300-affix-tags.filter"], parts: true},
  {id: "roll-tags", group: "Tags", title: "Unique and set roll tags",
   sub: "The tags of the rolls that vary on unique and set items (Shako's life, Griffon's damage...).",
   aliases: /^ROLL_.*_TAG$/, partAliases: /^ROLL_.*_TAG$/,
   tagLines: "300-affix-tags.filter"},
  {id: "rw-tags", group: "Tags", title: "Runeword roll tags", sub: "The tags of the rolls that vary on runewords.",
   sections: ["305-runeword-rolls.filter"], parts: true},
  {id: "lowlvl-tags", group: "Tags", title: "Low-level rare tags",
   sub: "Every roll of the stats Erazure picks, on rare and crafted items below affix level 60.",
   aliases: /^LOWLVL_.*_TAG$/, partAliases: /^LOWLVL_.*_TAG$/,
   tagLines: "300-affix-tags.filter"},
  {id: "staffmods", group: "Tags", title: "Staffmod tags",
   sub: "The +skills of non-magical class items, staves, wands, scepters and orbs, and the enhanced damage, defense " +
        "and resistance tags beside them.", sections: ["310-staffmods.filter"],
   parts: true},
  {id: "charm-tags", group: "Tags", title: "Charm tags",
   sub: "The tags of identified magic charms (Low Level Dueling ones too), and of Annihilus, Hellfire Torch and Gheed's " +
        "Fortune.",
   sections: ["240-charms.filter"], parts: true},
  {id: "jewel-tags", group: "Tags", title: "Jewel tags",
   sub: "The tags of identified jewels (Rainbow Facets and Low Level Dueling ones too), and their cube notes.",
   sections: ["250-jewels.filter"], parts: true},
  {id: "quiver-tags", group: "Tags", title: "Arrow and bolt tags", sub: "The tags of magic and rare quivers.",
   sections: ["260-arrow-bolt-affixes.filter"], parts: true},
  {id: "sell-tags", group: "Tags", title: "Sell value tags ($)", sub: "Items that sell to vendors for a lot of gold.",
   sections: ["315-sell-value-tags.filter"], parts: true},
  {id: "small-sell", group: "Tags", title: "Sell tags on small items Erazure hides",
   sub: "On filter levels 1-4 (the less strict ones), a small non-magical item that sells for a lot shows as its ($) " +
        "tag instead of being hidden. Switched off, it stays hidden there.",
   aliases: ["SMALL_SELL_BASE", "SMALL_SELL_GOLD", "SMALL_SELL_GRAY", "SMALL_SELL_NK"],
   samples: [{spec: {code: "dgr", sockets: 0, sell: 30000}, level: 1, clvl: 48}]},
  {id: "resist-tags", group: "Descriptions", title: "Resistance lines",
   sub: "The starred All Resistances, Triple and Dual Resist lines in an item's description (the short 11r tags on " +
        "its label are Affix tags).", sections: ["285-resist-tags.filter"], parts: "text"},
  {id: "boss-tags", group: "Descriptions", title: "Boss gear tags",
   sub: "Rathma, D.Clone and Lucion under items that suit those fights.", sections: ["270-boss-gear-tags.filter"],
   parts: true},
  {id: "highlights", group: "Descriptions", title: "Skill and shop highlights",
   sub: "The starred +skills lines, and the Cost line of good shop items.", sections: ["280-skills-shop-highlights.filter"],
   parts: true},
  {id: "ed-highlights", group: "Descriptions", title: "Enhanced damage, Amplify and Lower Resist highlights",
   sub: "High enhanced damage, damage reduction, Amplify Damage and Lower Resist on striking.",
   sections: ["320-highlights-ed-amp-lr.filter", "350-ed-dr-highlights.filter"], parts: "text"},
  {id: "notes", group: "Descriptions", title: "Item notes",
   sub: "Recipes, upgrades, max sockets and other notes over the item's stats.",
   sections: ["230-item-description-notes.filter"], parts: true},
  {id: "craft-notes", group: "Descriptions", title: "Crafting base notes",
   sub: "The Crafted Affix Level: N line on rings, amulets and other bases worth crafting with.",
   sections: ["340-high-alvl-crafting-bases.filter"], parts: true},
  {id: "max-res", group: "Descriptions", title: "Max resistance and Cannot Be Frozen lines",
   sub: "The totals of maximum resistances and Cannot Be Frozen.", sections: ["360-max-res-cannot-be-frozen.filter"],
   parts: "text"},
  {id: "anniversary", group: "Descriptions", title: "Anniversary Edition line",
   sub: "The orange line on uniques with an alternate skin.", sections: ["365-special-edition.filter"]},
  {id: "speed", group: "Descriptions", title: "Weapon speed and range",
   sub: "A weapon's base speed and range under its name.", sections: ["330-tooltip-tags.filter"]},
  {id: "tier-lines", group: "Descriptions", title: "Item tier lines", on: false,
   sub: "Normal, Exceptional or Elite under weapons and armor in the inventory, stash and Cube (off in Erazure).",
   switchOn: {section: "330-tooltip-tags.filter", match: "Tier:"},
   samples: [{spec: {code: "uar", place: "INVENTORY"}, level: 1}]},
  {id: "key-notes", group: "Items", title: "Area notes on Keys",
   sub: "Outside town, the hover box of a Key or Skeleton Key tells you about the area you're in: its layout (static, " +
        "semi-static or tile-based) and where its exits, dungeons and bosses usually are.",
   sections: ["070-keys.filter"]},
  {id: "map-resists", group: "Maps", title: "Map resistance lines",
   sub: "The monsters' highest resistances and immunities on maps.", sections: ["140-map-resistances.filter"]},
  {id: "map-mods", group: "Maps", title: "Map mod highlights",
   sub: "The hover box lines that point out a map's monster density, rarity and dangerous mods (the tier, Map and " +
        "mf / den / rar tags on its label stay).",
   sections: ["145-map-rolls-and-notifications.filter"], descOnly: true, parts: "text"},
  {id: "map-exp", group: "Maps", title: "Map experience lines",
   sub: "A map's experience tag (2.0x Experience) and the experience at your level.",
   sections: ["146-map-experience.filter"], parts: "text"},
  {id: "grail-looks", group: "Grail", title: "Grail looks of undiscovered items",
   sub: "Unique and set items you haven't discovered look different and always show. Switched off, they look like " +
        "discovered ones and are hidden where those are (the game's Force Show Undiscovered option still shows the " +
        "hidden ones, with the game's name).",
   aliases: ["GRAIL_NEW"],
   samples: [{spec: {code: "cap", quality: "UNI", discovered: false}, level: 12},
             {spec: {code: "cap", quality: "UNI", discovered: false}, level: 1}]},
  {id: "lowest-sockets", group: "Strictness", title: "Level 1 shows every non-magical base with 2+ sockets",
   sub: "Filter level 1 (Lowest Strictness) shows them at every character level. Switched off, it hides them once " +
        "your character reaches a certain level, as level 2 (Relaxed Filtering) does.", aliases: ["LOWEST_SOCKETED_BASE"],
   samples: [{spec: {code: "lbw", sockets: 4}, level: 1, clvl: 40}]},
];
