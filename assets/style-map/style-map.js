
(() => {
const DATA = {"groups":[{"id":"uniques","title":"Unique items","rows":[{"title":"Rainbow Facet's name","looks":[{"main":"%GREEN%\\\\%BLUE%\\\\%PURPLE%\\\\%RED%\\\\%ORANGE%\\\\%YELLOW%\\\\  %TAN%(x  %GOLD%%GOLD%Jewel  %TAN%x)  %YELLOW%/%YELLOW%/%ORANGE%/%ORANGE%/%RED%/%RED%/%PURPLE%/%PURPLE%/%BLUE%/%BLUE%/%GREEN%/%GREEN%/%GOLD%","minimal":"%GREEN%*%BLUE%*%PURPLE%*%RED%*%ORANGE%*%YELLOW%*  %TAN%(x  %GOLD%%GOLD%Jewel  %TAN%x)  %YELLOW%*%ORANGE%*%RED%*%PURPLE%*%BLUE%*%GREEN%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:6","sound":34}]},{"title":"Uniques from Diablo Clone and Rathma","looks":[{"main":"%BLUE%X\\%TEAL%X\\%GREEN%X\\O/X%TEAL%/X%BLUE%/X  %GOLD%Boneweave  %BLUE%X\\%TEAL%X\\%GREEN%X\\O/X%TEAL%/X%BLUE%/X%GOLD%","minimal":"%BLUE%*%TEAL%**%GREEN%***%TEAL%**%BLUE%*  %GOLD%Boneweave  %BLUE%*%TEAL%**%GREEN%***%TEAL%**%BLUE%*%GOLD%","where":"sections/150-uniques.filter:457","sound":4651}]},{"title":"Uniques: High value tier","looks":[{"main":"%BLUE%\\\\%PURPLE%\\\\%RED%\\\\%ORANGE%\\\\  %GOLD%>  %WHITE%O  %GOLD%Ring  %WHITE%O  %GOLD%<  %ORANGE%/%ORANGE%/%RED%/%RED%/%PURPLE%/%PURPLE%/%BLUE%/%BLUE%/%GOLD%","minimal":"%BLUE%*%PURPLE%*%RED%*%ORANGE%*%GOLD%*  %WHITE%>  %GOLD%Ring  %WHITE%<  %GOLD%*%ORANGE%*%RED%*%PURPLE%*%BLUE%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:10","sound":34}]},{"title":"Uniques: Medium value tier","looks":[{"main":"%PURPLE%\\%RED%\\\\%ORANGE%\\\\  %GOLD%>  %WHITE%•  %GOLD%Grand Charm  %WHITE%•  %GOLD%<  %ORANGE%/%ORANGE%/%RED%/%RED%/%PURPLE%/%GOLD%","minimal":"%PURPLE%*%RED%*%ORANGE%*%GOLD%*  %WHITE%>  %GOLD%Grand Charm  %WHITE%<  %GOLD%*%ORANGE%*%RED%*%PURPLE%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:34","sound":3915}]},{"title":"Uniques: Minimal value tier","looks":[{"main":"%RED%\\%ORANGE%\\\\  %GOLD%>  %WHITE%•  %GOLD%Ceremonial Javelin  %WHITE%•  %GOLD%<  %ORANGE%/%ORANGE%/%RED%/%GOLD%","minimal":"%RED%*%ORANGE%*%GOLD%*  %WHITE%>  %GOLD%Ceremonial Javelin  %WHITE%<  %GOLD%*%ORANGE%*%RED%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:56","sound":0}]},{"title":"Uniques of the Minimal value tier you haven't discovered","looks":[{"main":"%ORANGE%\\%YELLOW%\\%TAN%\\%LIGHT_GRAY%\\  %GOLD%>  %WHITE%*  %GOLD%Ceremonial Javelin  %WHITE%*  %GOLD%<  %LIGHT_GRAY%/%TAN%/%YELLOW%/%ORANGE%/%GOLD%","minimal":"%ORANGE%*%YELLOW%*%TAN%*%LIGHT_GRAY%*  %WHITE%>  %GOLD%Ceremonial Javelin  %WHITE%<  %LIGHT_GRAY%*%TAN%*%YELLOW%*%ORANGE%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:55","sound":2594}]},{"title":"Uniques in no tier you haven't discovered","looks":[{"main":"%ORANGE%*%YELLOW%*%TAN%*%LIGHT_GRAY%* %WHITE%>  %GOLD%Light Plate  %WHITE%< %LIGHT_GRAY%*%TAN%*%YELLOW%*%ORANGE%*%GOLD%","minimal":"%ORANGE%*%YELLOW%*%TAN%*%LIGHT_GRAY%*  %GOLD%Light Plate  %LIGHT_GRAY%*%TAN%*%YELLOW%*%ORANGE%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:531","sound":2594}]},{"title":"Uniques for low level dueling","looks":[{"main":"%TEAL%*%LIGHT_GRAY%*%GRAY%* %WHITE%>  %GOLD%War Hat  %WHITE%< %GRAY%*%LIGHT_GRAY%*%TEAL%*%GOLD%","minimal":"%TEAL%*%LIGHT_GRAY%*%GRAY%*  %GOLD%War Hat  %GRAY%*%LIGHT_GRAY%*%TEAL%*%GOLD%","where":"sections/160-uniques-value-tiers.filter:560","sound":0}]},{"title":"Uniques in no tier","looks":[{"main":"%GOLD%*%LIGHT_GRAY%*%GRAY%* %WHITE%>  %GOLD%Light Plate  %WHITE%< %GRAY%*%LIGHT_GRAY%*%GOLD%*","minimal":"%GOLD%*%LIGHT_GRAY%*%GRAY%*  %GOLD%Light Plate  %GRAY%*%LIGHT_GRAY%*%GOLD%*","where":"sections/160-uniques-value-tiers.filter:568","sound":0}]}],"same":[]},{"id":"sets","title":"Set items","rows":[{"title":"Set items: High value tier","looks":[{"main":"%DARK_GREEN%\\%PURPLE%\\%RED%\\  %GREEN%>  %WHITE%o  %GREEN%%GREEN%Corona  %WHITE%o  %GREEN%<  %RED%/%PURPLE%/%DARK_GREEN%/%GREEN%","minimal":"%PURPLE%*%RED%*%GREEN%*%DARK_GREEN%*  %WHITE%>  %GREEN%%GREEN%Corona  %WHITE%<  %DARK_GREEN%*%GREEN%*%RED%*%PURPLE%*%GREEN%","where":"sections/170-sets.filter:150","sound":2585}]},{"title":"Set items: Medium value tier","looks":[{"main":"%PURPLE%*%GREEN%*%DARK_GREEN%* %GREEN%>  %WHITE%•  %GREEN%%GREEN%Hunter's Guise  %WHITE%•  %GREEN%< %DARK_GREEN%*%GREEN%*%PURPLE%*%GREEN%","minimal":"%PURPLE%*%GREEN%*%DARK_GREEN%*  %WHITE%>  %GREEN%%GREEN%Hunter's Guise  %WHITE%<  %DARK_GREEN%*%GREEN%*%PURPLE%*%GREEN%","where":"sections/170-sets.filter:152","sound":2585}]},{"title":"Set items of the Medium value tier you haven't discovered","looks":[{"main":"%ORANGE%*%YELLOW%*%GREEN%*%DARK_GREEN%* %GREEN%>  %WHITE%•  %GREEN%%GREEN%Hunter's Guise  %WHITE%•  %GREEN%< %DARK_GREEN%*%GREEN%*%YELLOW%*%ORANGE%*%GREEN%","minimal":"%ORANGE%*%YELLOW%*%GREEN%*%DARK_GREEN%*  %WHITE%>  %GREEN%%GREEN%Hunter's Guise  %WHITE%<  %DARK_GREEN%*%GREEN%*%YELLOW%*%ORANGE%*%GREEN%","where":"sections/170-sets.filter:151","sound":2594}]},{"title":"Set items in no tier you haven't discovered","looks":[{"main":"%ORANGE%*%YELLOW%*%GREEN%*%DARK_GREEN%* %GREEN%>  %GREEN%Sash  %GREEN%< %DARK_GREEN%*%GREEN%*%YELLOW%*%ORANGE%*%GREEN%","minimal":"%ORANGE%*%YELLOW%*%GREEN%*%DARK_GREEN%*  %GREEN%Sash  %DARK_GREEN%*%GREEN%*%YELLOW%*%ORANGE%*%GREEN%","where":"sections/170-sets.filter:189","sound":2594}]},{"title":"Set items for low level dueling","looks":[{"main":"%TEAL%*%GREEN%*%DARK_GREEN%* %GREEN%>  %GREEN%Heavy Gloves  %GREEN%< %DARK_GREEN%*%GREEN%*%TEAL%*%GREEN%","minimal":"%TEAL%*%GREEN%*%DARK_GREEN%*  %GREEN%Heavy Gloves  %DARK_GREEN%*%GREEN%*%TEAL%*%GREEN%","where":"sections/170-sets.filter:192","sound":0}]},{"title":"Set items: standard look","looks":[{"main":"%PURPLE%*%GREEN%*%DARK_GREEN%* %GREEN%>  %GREEN%%GREEN%Ring  %GREEN%< %DARK_GREEN%*%GREEN%*%PURPLE%*%GREEN%","minimal":"%PURPLE%*%GREEN%*%DARK_GREEN%*  %GREEN%%GREEN%Ring  %DARK_GREEN%*%GREEN%*%PURPLE%*%GREEN%","where":"sections/170-sets.filter:196","sound":0}]},{"title":"Normal tier set items from character level 60","looks":[{"main":"%DARK_GREEN%*%GREEN%*%DARK_GREEN%* %GREEN%>  %GREEN%Sash  %GREEN%< %DARK_GREEN%*%GREEN%*%DARK_GREEN%*%GREEN%","minimal":"%DARK_GREEN%*%GREEN%*%DARK_GREEN%*%GREEN%  %GREEN%Sash  %DARK_GREEN%*%GREEN%*%DARK_GREEN%*%GREEN%","where":"sections/170-sets.filter:210","sound":0}]}],"same":[]},{"id":"rares","title":"Rare and magic items","rows":[{"title":"Rare items worth a look","looks":[{"main":"%PURPLE%\\%YELLOW%\\ %PURPLE%• %YELLOW%>  %YELLOW%%YELLOW%Diadem  %YELLOW%< %PURPLE%• %YELLOW%/%PURPLE%/%YELLOW%","minimal":"%PURPLE%• %YELLOW%>  %YELLOW%%YELLOW%Diadem  %YELLOW%< %PURPLE%•","where":"sections/190-rares.filter:27","sound":31}]},{"title":"Magic charms","looks":[{"main":"%TEAL%\\(%PURPLE%(  %BLUE%Grand Charm %WHITE%• %BLUE%92  %PURPLE%)%TEAL%)/%BLUE%","minimal":"%TEAL%*%BLUE%*%PURPLE%*  %BLUE%Grand Charm %WHITE%• %BLUE%92  %PURPLE%*%BLUE%*%TEAL%*%BLUE%","where":"sections/200-magic.filter:32","sound":0},{"main":"%TEAL%\\(%PURPLE%(  %BLUE%Grand Charm %WHITE%• %BLUE%Item Level 92  %PURPLE%)%TEAL%)/%BLUE%","minimal":"%TEAL%*%BLUE%*%PURPLE%*  %BLUE%Grand Charm %WHITE%• %BLUE%Item Level 92  %PURPLE%*%BLUE%*%TEAL%*%BLUE%","where":"sections/200-magic.filter:33","sound":0}]},{"title":"Rare jewels","looks":[{"main":"%PURPLE%\\%YELLOW%\\ %PURPLE%• %YELLOW%>  %TAN%(x  %YELLOW%%YELLOW%Jewel  %TAN%x)%YELLOW%  %YELLOW%< %PURPLE%• %YELLOW%/%PURPLE%/%YELLOW%","minimal":"%PURPLE%• %YELLOW%>  %TAN%(x  %YELLOW%%YELLOW%Jewel  %TAN%x)%YELLOW%  %YELLOW%< %PURPLE%•","where":"sections/190-rares.filter:23","sound":31}]},{"title":"Magic Small, Grand, and Large Charms (Small and Grand on levels 0-4 or of item level 90+, Large on levels 0-6)","looks":[{"main":"%TEAL%\\%BLUE%(%PURPLE%(  %BLUE%Grand Charm  %PURPLE%)%BLUE%)%TEAL%/%BLUE%","minimal":"%TEAL%*%BLUE%*%PURPLE%*  %BLUE%Grand Charm  %PURPLE%*%BLUE%*%TEAL%*%BLUE%","where":"sections/200-magic.filter:51","sound":0}]},{"title":"Magic Small and Grand Charms below item level 90 (levels 5-12)","looks":[{"main":"%TEAL%\\%BLUE%((  %BLUE%Small Charm  %BLUE%))%TEAL%/%BLUE%","minimal":"%TEAL%*%BLUE%**  %BLUE%Small Charm  %BLUE%**%TEAL%*","where":"sections/200-magic.filter:53","sound":0}]},{"title":"Magic Large Charms of item level 90+ (levels 8 and 10)","looks":[{"main":"%PURPLE%-  %BLUE%Large Charm  %PURPLE%-%BLUE%","minimal":"%PURPLE%*  %BLUE%Large Charm  %PURPLE%*","where":"sections/200-magic.filter:55","sound":0}]},{"title":"Magic Large Charms below item level 90 (levels 8 and 10)","looks":[{"main":"%TEAL%-  %BLUE%Large Charm  %TEAL%-%BLUE%","minimal":"%TEAL%*  %BLUE%Large Charm  %TEAL%*","where":"sections/200-magic.filter:56","sound":0}]}],"same":["Medium value rare items","Low value rare items","Ethereal rare crafting bases","Magic crafting bases","Magic jewels","Magic rings","Magic class items"]},{"id":"runes","title":"Runes","rows":[{"title":"Runes El to Tal: a stack of 10 or more","looks":[{"main":"%DARK_GREEN%\\x%GRAY%\\x%LIGHT_GRAY%\\x  %WHITE%El Rune  %LIGHT_GRAY%x/%GRAY%x/%DARK_GREEN%x/%WHITE%","minimal":"%DARK_GREEN%x%GRAY%x%LIGHT_GRAY%x  %WHITE%El Rune  %LIGHT_GRAY%x%GRAY%x%DARK_GREEN%x%WHITE%","where":"sections/110-runes.filter:49","sound":0}]},{"title":"Runes Ral to Io: a stack of 10 or more","looks":[{"main":"%BLUE%\\x%GRAY%\\x%LIGHT_GRAY%\\x  %WHITE%Ral Rune  %LIGHT_GRAY%x/%GRAY%x/%BLUE%x/%WHITE%","minimal":"%BLUE%x%GRAY%x%LIGHT_GRAY%x  %WHITE%Ral Rune  %LIGHT_GRAY%x%GRAY%x%BLUE%x%WHITE%","where":"sections/110-runes.filter:51","sound":0}]},{"title":"Um and Mal runes","looks":[{"main":"%DARK_GREEN%x%GREEN%xX%YELLOW%X%TAN%O%YELLOW%X%GREEN%Xx%DARK_GREEN%x   %WHITE%Um Rune   %DARK_GREEN%x%GREEN%xX%YELLOW%X%TAN%O%YELLOW%X%GREEN%Xx%DARK_GREEN%x%WHITE%","minimal":"%DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x   %WHITE%Um Rune   %DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x%WHITE%","where":"sections/110-runes.filter:57","sound":2679},{"main":"%DARK_GREEN%xX%GREEN%\\X%YELLOW%X%TAN%O%YELLOW%X%GREEN%X/%DARK_GREEN%Xx   %WHITE%Mal Rune   %DARK_GREEN%xX%GREEN%\\X%YELLOW%X%TAN%O%YELLOW%X%GREEN%X/%DARK_GREEN%Xx%WHITE%","minimal":"%DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x   %WHITE%Mal Rune   %DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x%WHITE%","where":"sections/110-runes.filter:58","sound":2679}]},{"title":"Ist and Gul runes","looks":[{"main":"%BLUE%xX%DARK_GREEN%\\X%GREEN%\\X%YELLOW%X%TAN%O%YELLOW%X%GREEN%X/%DARK_GREEN%X/%BLUE%Xx   %WHITE%Ist Rune   %BLUE%xX%DARK_GREEN%\\X%GREEN%\\X%YELLOW%X%TAN%O%YELLOW%X%GREEN%X/%DARK_GREEN%X/%BLUE%Xx%WHITE%","minimal":"%BLUE%x%DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x%BLUE%x   %WHITE%Ist Rune   %BLUE%x%DARK_GREEN%x%GREEN%x%YELLOW%x%TAN%o%YELLOW%x%GREEN%x%DARK_GREEN%x%BLUE%x%WHITE%","where":"sections/110-runes.filter:59","sound":34}]},{"title":"Vex, Ohm, and Lo runes","looks":[{"main":"%BLUE%xX%PURPLE%\\X%ORANGE%\\X%YELLOW%X%TAN%O%YELLOW%X%ORANGE%X/%PURPLE%X/%BLUE%Xx   %WHITE%Vex Rune   %BLUE%xX%PURPLE%\\X%ORANGE%\\X%YELLOW%X%TAN%O%YELLOW%X%ORANGE%X/%PURPLE%X/%BLUE%Xx%WHITE%","minimal":"%BLUE%x%PURPLE%x%ORANGE%x%YELLOW%x%TAN%o%YELLOW%x%ORANGE%x%PURPLE%x%BLUE%x   %WHITE%Vex Rune   %BLUE%x%PURPLE%x%ORANGE%x%YELLOW%x%TAN%o%YELLOW%x%ORANGE%x%PURPLE%x%BLUE%x%WHITE%","where":"sections/110-runes.filter:61","sound":34}]},{"title":"Sur, Ber, Jah, Cham, and Zod runes (and BIG GG)","looks":[{"main":"%PURPLE%xX%RED%\\X%ORANGE%\\X%YELLOW%X%TAN%O%YELLOW%X%ORANGE%X/%RED%X/%PURPLE%Xx   %WHITE%Ber Rune   %PURPLE%xX%RED%\\X%ORANGE%\\X%YELLOW%X%TAN%O%YELLOW%X%ORANGE%X/%RED%X/%PURPLE%Xx%WHITE%","minimal":"%PURPLE%x%RED%x%ORANGE%x%YELLOW%x%TAN%o%YELLOW%x%ORANGE%x%RED%x%PURPLE%x   %WHITE%Ber Rune   %PURPLE%x%RED%x%ORANGE%x%YELLOW%x%TAN%o%YELLOW%x%ORANGE%x%RED%x%PURPLE%x%WHITE%","where":"sections/110-runes.filter:62","sound":418}]}],"same":["Runes El to Tal: fewer than 10","Runes Ral to Io: fewer than 10","Runes Lum to Fal: fewer than 10","Runes Lum to Fal: a stack of 10 or more","A single Lem Rune","A single Pul Rune","Lem and Pul Runes: a stack of 2 or more"]},{"id":"pd2","title":"PD2 items","rows":[{"title":"Worldstone Shards, big stacks","looks":[{"main":"%RED%xX%CORAL%X%WHITE%O%CORAL%X%RED%Xx   %WHITE%Worldstone Shards x 12   %RED%xX%CORAL%X%WHITE%O%CORAL%X%RED%Xx","minimal":"%RED%xx%CORAL%x%WHITE%o%CORAL%x%RED%xx   %WHITE%Worldstone Shards x 12   %RED%xx%CORAL%x%WHITE%o%CORAL%x%RED%xx","where":"sections/120-pd2-items.filter:6","sound":0}]},{"title":"Catalyst Shard","looks":[{"main":"%GRAY%x%LIGHT_GRAY%X%WHITE%XOX%LIGHT_GRAY%X%GRAY%x   %WHITE%Catalyst Shard   %GRAY%x%LIGHT_GRAY%X%WHITE%XOX%LIGHT_GRAY%X%GRAY%x","minimal":"%GRAY%x%LIGHT_GRAY%x%WHITE%o%LIGHT_GRAY%x%GRAY%x   %WHITE%Catalyst Shard   %GRAY%x%LIGHT_GRAY%x%WHITE%o%LIGHT_GRAY%x%GRAY%x","where":"sections/120-pd2-items.filter:12","sound":0}]},{"title":"Puzzlepiece","looks":[{"main":"%GOLD%[%ORANGE%X%GOLD%][%YELLOW%X%GOLD%][%TAN%X%GOLD%]  %WHITE%Puzzlepiece  %GOLD%[%TAN%X%GOLD%][%YELLOW%X%GOLD%][%ORANGE%X%GOLD%]","minimal":"%ORANGE%x%YELLOW%x%TAN%x  %WHITE%Puzzlepiece  %TAN%x%YELLOW%x%ORANGE%x","where":"sections/120-pd2-items.filter:17","sound":2679},{"main":"%GOLD%[%ORANGE%X%GOLD%][%YELLOW%X%GOLD%][%TAN%X%GOLD%]  %WHITE%Larzuk's %WHITE%Puzzlepiece  %GOLD%[%TAN%X%GOLD%][%YELLOW%X%GOLD%][%ORANGE%X%GOLD%]","minimal":"%ORANGE%x%YELLOW%x%TAN%x  %WHITE%Larzuk's %WHITE%Puzzlepiece  %TAN%x%YELLOW%x%ORANGE%x","where":"sections/120-pd2-items.filter:18","sound":2679}]},{"title":"Puzzlebox","looks":[{"main":"%GOLD%[%BLUE%X%GOLD%][%PURPLE%X%GOLD%][%ORANGE%X%GOLD%][%YELLOW%X%GOLD%]  %WHITE%Larzuk's Puzzlebox  %GOLD%[%YELLOW%X%GOLD%][%ORANGE%X%GOLD%][%PURPLE%X%GOLD%][%BLUE%X%GOLD%]","minimal":"%BLUE%x%PURPLE%x%ORANGE%x%YELLOW%x%TAN%x  %WHITE%Larzuk's Puzzlebox  %TAN%x%YELLOW%x%ORANGE%x%PURPLE%x%BLUE%x","where":"sections/120-pd2-items.filter:24","sound":34}]},{"title":"Demonic Cube","looks":[{"main":"%RED%xX%CORAL%\\X%WHITE%\\XOX/%CORAL%X/%RED%Xx  %WHITE%Demonic Cube  %RED%xX%CORAL%\\X%WHITE%\\XOX/%CORAL%X/%RED%Xx","minimal":"%RED%x%CORAL%xx%WHITE%xox%CORAL%xx%RED%x  %WHITE%Demonic Cube  %RED%x%CORAL%xx%WHITE%xox%CORAL%xx%RED%x","where":"sections/120-pd2-items.filter:32","sound":34}]},{"title":"Vial of Lightsong","looks":[{"main":"%PURPLE%xX%BLUE%xX%LIGHT_GRAY%x\\%WHITE%\\V/%LIGHT_GRAY%/x%BLUE%Xx%PURPLE%Xx  %WHITE%Vials of Lightsong %TAN%x %WHITE%12  %PURPLE%xX%BLUE%xX%LIGHT_GRAY%x\\%WHITE%\\V/%LIGHT_GRAY%/x%BLUE%Xx%PURPLE%Xx","minimal":"%PURPLE%x%BLUE%x%LIGHT_GRAY%x%WHITE%v%LIGHT_GRAY%x%BLUE%x%PURPLE%x  %WHITE%Vials of Lightsong %TAN%x %WHITE%12  %PURPLE%x%BLUE%x%LIGHT_GRAY%x%WHITE%v%LIGHT_GRAY%x%BLUE%x%PURPLE%x","where":"sections/120-pd2-items.filter:54","sound":418},{"main":"%PURPLE%xX%BLUE%xX%LIGHT_GRAY%x\\%WHITE%\\V/%LIGHT_GRAY%/x%BLUE%Xx%PURPLE%Xx  %WHITE%Vial of Lightsong  %PURPLE%xX%BLUE%xX%LIGHT_GRAY%x\\%WHITE%\\V/%LIGHT_GRAY%/x%BLUE%Xx%PURPLE%Xx","minimal":"%PURPLE%x%BLUE%x%LIGHT_GRAY%x%WHITE%v%LIGHT_GRAY%x%BLUE%x%PURPLE%x  %WHITE%Vial of Lightsong  %PURPLE%x%BLUE%x%LIGHT_GRAY%x%WHITE%v%LIGHT_GRAY%x%BLUE%x%PURPLE%x","where":"sections/120-pd2-items.filter:55","sound":418}]},{"title":"Lilith's Mirror","looks":[{"main":"%PURPLE%xX%RED%xX%ORANGE%x\\%TAN%\\%WHITE%V%TAN%/%ORANGE%/x%RED%Xx%PURPLE%Xx  %WHITE%Lilith's Mirrors %TAN%x %WHITE%12  %PURPLE%xX%RED%xX%ORANGE%x\\%TAN%\\%WHITE%V%TAN%/%ORANGE%/x%RED%Xx%PURPLE%Xx","minimal":"%PURPLE%x%RED%x%ORANGE%x%TAN%x%WHITE%v%TAN%x%ORANGE%x%RED%x%PURPLE%x  %WHITE%Lilith's Mirrors %TAN%x %WHITE%12  %PURPLE%x%RED%x%ORANGE%x%TAN%x%WHITE%v%TAN%x%ORANGE%x%RED%x%PURPLE%x","where":"sections/120-pd2-items.filter:60","sound":418},{"main":"%PURPLE%xX%RED%xX%ORANGE%x\\%TAN%\\%WHITE%V%TAN%/%ORANGE%/x%RED%Xx%PURPLE%Xx  %WHITE%Lilith's Mirror  %PURPLE%xX%RED%xX%ORANGE%x\\%TAN%\\%WHITE%V%TAN%/%ORANGE%/x%RED%Xx%PURPLE%Xx","minimal":"%PURPLE%x%RED%x%ORANGE%x%TAN%x%WHITE%v%TAN%x%ORANGE%x%RED%x%PURPLE%x  %WHITE%Lilith's Mirror  %PURPLE%x%RED%x%ORANGE%x%TAN%x%WHITE%v%TAN%x%ORANGE%x%RED%x%PURPLE%x","where":"sections/120-pd2-items.filter:61","sound":418}]}],"same":["Worldstone Shards, small stacks","Skeleton Key","Horadric Almanac","Horadric Navigator","Key of Destruction","Key of Hate","Key of Terror","Token of Absolution","Pandemonium Talisman","Baal's Eye, Diablo's Horn, and Mephisto's Brain","Relic of the Ancients","Sigil of Madawc","Sigil of Talic","Sigil of Korlic","Vision of Terror","Pure Demonic Essence, Black Soulstone, and Prime Evil Soul","Voidstone","Hellfire Ashes and Splinter of the Void","Trang-Oul's Jawbone","Tainted Worldstone Shard","Shadow of Hatred","Demonic Insignia","Talisman of Transgression and Flesh of Malic","Craft Infusions in a stack, in town, and in the inventory"]},{"id":"descriptions","title":"Item descriptions","rows":[],"same":["Skill, shop, charm, and jewel highlights","Highlights of leveling caster weapons with cast rate","Weapons with Amplify Damage","Weapons with Lower Resist","Enhanced Damage 250-299, below character level 80","Enhanced Damage 300-399, below character level 80","Enhanced Damage 300-399, from character level 80","Enhanced Damage 400-499","Enhanced Damage 500-599","Enhanced Damage 600-699","Enhanced Damage 700+"]}],"cube":"Erazure - Minimal","foot":"Every label whose symbols differ, from the filter's own rules (Season 14 - November 27th).","clips":[31,34,35,40,259,309,317,329,418,422,619,705,770,869,1123,1166,1257,1349,1352,1802,2232,2246,2261,2301,2302,2324,2332,2333,2346,2348,2387,2399,2403,2437,2440,2443,2446,2447,2448,2464,2465,2472,2473,2475,2585,2594,2679,3915,3925,4249,4304,4609,4629,4632,4633,4639,4651,4707,4714,4715,4716,4717,4718,4719,4720,4721,4722,4723,4724,4725,4726,4727,4728,4729]};
const root = document.querySelector(".style-map");
const $ = (s) => root.querySelector(s);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// The label as BH draws it: each color code colors what follows; an unknown %word% is shown as is
function drawLabel(text) {
  const box = el("span", "d2label");
  let color = "WHITE", pos = 0;
  const re = /%([A-Z_]+)%/g;
  let m;
  const put = (t) => {
    for (const part of t.split(/(\\+)/)) {
      if (!part) continue;
      const s = el("span", "c-" + color);
      if (/^\\+$/.test(part)) for (const ch of part) s.append(el("span", "bs", "/"));
      else s.textContent = part;
      box.append(s);
    }
  };
  while ((m = re.exec(text))) {
    if (m.index > pos) put(text.slice(pos, m.index));
    if (/^(WHITE|RED|GREEN|BLUE|GOLD|GRAY|BLACK|TAN|ORANGE|YELLOW|PURPLE|DARK_GREEN|CORAL|SAGE|TEAL|LIGHT_GRAY)$/.test(m[1]))
      color = m[1];
    else put(m[1] === "PERCENT" ? "%" : m[0]);
    pos = re.lastIndex;
  }
  if (pos < text.length) put(text.slice(pos));
  const g = el("div", "ground");
  g.append(box);
  return g;
}

// A drop sound to hear on the page (2026-11-15, audit LFB-08): the game's own clip, from the Filter Editor's copies
// (Erazure-Filter-Editor-Assets/sounds: 4-bit IMA ADPCM, its rate, length, first sample and step index, then two
// samples a byte), decoded and played on a click. DATA.clips: the sounds there are clips of.
const CLIPS = new Set(DATA.clips || []);
const CLIP_BASE = (document.querySelector(".md-content") ? "../" : "") + "Erazure-Filter-Editor-Assets/sounds/";
const CLIP_STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80,
  88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
  876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
  5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086,
  29794, 32767];
const CLIP_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
const clipCache = {};
let audio = null, playingClip = null;
function decodeClip(buf) {
  const dv = new DataView(buf), rate = dv.getUint32(0, true), n = dv.getUint32(4, true);
  let pred = dv.getInt16(8, true), index = Math.min(dv.getUint16(10, true), 88);
  const out = new Float32Array(n), bytes = new Uint8Array(buf, 12);
  out[0] = pred / 32768;
  for (let i = 1; i < n; i++) {
    const b = bytes[(i - 1) >> 1], code = (i - 1) & 1 ? b >> 4 : b & 15, step = CLIP_STEPS[index];
    let delta = step >> 3;
    if (code & 4) delta += step;
    if (code & 2) delta += step >> 1;
    if (code & 1) delta += step >> 2;
    pred = code & 8 ? Math.max(-32768, pred - delta) : Math.min(32767, pred + delta);
    index = Math.max(0, Math.min(88, index + CLIP_INDEX[code]));
    out[i] = pred / 32768;
  }
  return {rate, samples: out};
}
async function playClip(id, btn) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") await audio.resume();
    clipCache[id] = clipCache[id] || fetch(CLIP_BASE + id + ".adpcm").then((r) => {
      if (!r.ok) throw new Error("no clip");
      return r.arrayBuffer();
    }).then(decodeClip);
    const c = await clipCache[id];
    if (playingClip) { try { playingClip.stop(); } catch (e) { /* ended */ } }
    const buf = audio.createBuffer(1, c.samples.length, c.rate);
    buf.copyToChannel(c.samples, 0);
    const src = audio.createBufferSource();
    src.buffer = buf;
    src.connect(audio.destination);
    src.start();
    playingClip = src;
    btn.classList.add("on");
    src.onended = () => btn.classList.remove("on");
  } catch (e) {
    btn.disabled = true;
    btn.title = "This sound can't play here";
  }
}
function playButton(id) {
  if (!CLIPS.has(+id)) return null;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "play";
  b.textContent = "\u25B6";
  b.title = "Play the drop sound";
  b.setAttribute("aria-label", "Play the drop sound");
  b.addEventListener("click", (e) => { e.stopPropagation(); playClip(+id, b); });
  return b;
}
$("#cube").textContent = DATA.cube;
const groups = $("#groups");
/* the search (the website ideas' #28, 2026-11-22): a row whose name, group or labels hold every word typed; ?search= in
   the address keeps it, as on the item pages */
const plain = (t) => t.replace(/%[A-Z_]+%/g, "").toLowerCase();
// the titles of the looks that are the same, as a sentence lists them (semicolons between titles with commas of their
// own: "Runes El to Tal, fewer than 10; Runes Ral to Io, fewer than 10; and ...")
const listOf = (xs) => {
  const sep = xs.some((x) => /[,:]/.test(x)) ? "; " : ", ";
  return xs.length < 3 ? xs.join(" and ") : xs.slice(0, -1).join(sep) + sep + "and " + xs[xs.length - 1];
};
const view = {q: ""};
try { view.q = new URLSearchParams(location.search).get("search") || ""; } catch (e) {}
const hit = (g, r) => {
  const words = view.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hay = [g.title, r.title || r, ...(r.looks || []).flatMap((x) => [plain(x.main), plain(x.minimal)])].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
};
function render() {
groups.replaceChildren();
let n = 0;
for (const g of DATA.groups) {
  const rowsShown = g.rows.filter((r) => hit(g, r)), sameShown = g.same.filter((r) => hit(g, r));
  if (!rowsShown.length && !sameShown.length) continue;
  n += rowsShown.length + sameShown.length;
  const sec = el("section");
  sec.id = "minimal-" + g.id;
  sec.append(el("h2", "kind", g.title));
  if (rowsShown.length) {
    const t = el("div", "table");
    t.append(el("div", "head item", "Item"), el("div", "head", "Erazure - Main"), el("div", "head", "Minimal"));
    for (const r of rowsShown) {
      r.looks.forEach((look, i) => {
        const a = drawLabel(look.main), b = drawLabel(look.minimal);
        a.prepend(el("span", "cap", "Main"));
        b.prepend(el("span", "cap", "Minimal"));
        const it = el("div", i ? "item more" : "item");
        const pb = look.sound ? playButton(look.sound) : null;  // the look's drop sound, Main's and Minimal's alike
        if (pb) it.append(pb);
        it.append(el("span", "t", r.title));
        t.append(it, a, b);
      });
    }
    sec.append(t);
  }
  if (sameShown.length) sec.append(el("p", "same", (g.rows.length ? "The same as in Main: " : "All the same as in Main: ") + listOf(sameShown) + "."));
  groups.append(sec);
}
if (!n) groups.append(el("p", "empty", "Nothing matches. Try an item's name (Ber, Grand Charm) or a kind (rare, set)."));
$("#count").textContent = view.q.trim() ? `${n} match${n === 1 ? "" : "es"}` : "";
try {
  const p = new URLSearchParams(location.search);
  p.delete("search"); p.delete("h");
  if (view.q.trim()) p.set("search", view.q.trim());
  const s = p.toString();
  history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
} catch (e) {}
}
let timer = 0;
$("#q").value = view.q;
$("#q").addEventListener("input", (e) => { view.q = e.target.value; clearTimeout(timer); timer = setTimeout(render, 120); });
render();
$("#foot").textContent = DATA.foot;
})();
