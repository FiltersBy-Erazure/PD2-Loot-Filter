/* The PD2 armory loader (the author, 2026-11-24: "pulling character data directly from ... pd2 armory", gear, stats,
   skills and level, into the calculators). erazure.js's "Your character" box loads this file on first use, on a page
   whose window.ezCharPage has an armory(V) function (Damage Calculator, IAS Calculator, Breakpoints, Monster Damage).

   Where the character comes from: PD2's armory, GET https://api.projectdiablo2.com/game/character/<name>, the save as
   the game server last wrote it (file.updated_at). Its answers carry CORS for www.projectdiablo2.com only, so the page
   asks our Worker (tools/armory_worker.js, PROXY below) or the player pastes the armory's own answer (site(name)).
   A name the armory doesn't know and a save it can't read answer alike: HTTP 500, "Failed to parse character".

   What the armory gives (memory pd2-armory-api): class (id 0-6: ama sor nec pal bar dru ass), level, the points put
   into each attribute and skill (no + skills), life and mana, and every item: base code, quality, ethereal, where it
   is (Equipped: equipment_id 1 helm ... 4 right hand, 5 left hand, 11 / 12 the other weapon set's hands; Stored with
   storage_id 1 = the inventory, where charms count), and its stats by ItemStatCost name with the values the game
   shows (a per-level stat per level: 0.5 life a level). A socketed item's stats are already in its parent's: nothing
   is added for sockets, but its elemental damage's maximum (socketedMax). Some names are the armory's own (PSEUDO): all_attributes, all_resist, maxdamage_percent ([the
   total with sockets, the item's own roll]: Call to Arms [278, 233] = 233 + Ohm's 45, both min and max), min_damage
   / max_damage, and the elemental damage (firedam [min, max], colddam [min, max, length] ..., poisondam [its total
   damage min, max, seconds], turned back into the game's stats 57-59 and 326); a name neither knows goes into the
   notes. It leaves out the set bonuses (ARMORY_DATA's, from tools/armory_data.py), quests, auras and
   buffs.

   read(json) -> C, the character with both weapon sets; view(C, k) -> V, set k worked out:
   V = {name, cls, lvl, saved, hc, dead, life, mana, k, sets, weapons: [I (right hand first), I?], shield, quiver,
        boots, armor, items (all worn in this set), st {stat id: total} (worn + charms + set bonuses), sp {stat id:
        {param: total}} (stats with a parameter: 83 class skills, 97 oskills, 107 one skill, 151 auras, 188 skill
        tabs, 362-366 element skills ...), other / otherSp (the same without the weapons' own), attr {str, dex, vit,
        ene} (the character screen's), skills {id: {base, total}}, wc (the weapon class the human animations use, as
        the IAS engine's humanWC), form ("human", "wolf", "bear": the Druid's form with the most points, 2 or more),
        passive {stat id: total} and passiveFrom {stat id: [skill ids]} (the class's passive skills' faster cast rate,
        hit recovery and block rate: Weapon Block's FBR), worn sets [{set, n, of}], notes [what wasn't counted]}
   I = {code, name, quality, eth, rw, type, kind: "weapon" | "shield" | "quiver" | "other", slot, st, sp}: the item's own
   stats, its sockets' in. */
(function () {
  "use strict";
  /* armory-data:start */
  const ARMORY_DATA = {"stats":{"strength":0,"energy":1,"dexterity":2,"vitality":3,"statpts":4,"newskills":5,"hitpoints":6,"maxhp":7,"mana":8,"maxmana":9,"stamina":10,"maxstamina":11,"level":12,"experience":13,"gold":14,"goldbank":15,"item_armor_percent":16,"item_maxdamage_percent":17,"item_mindamage_percent":18,"tohit":19,"toblock":20,"mindamage":21,"maxdamage":22,"secondary_mindamage":23,"secondary_maxdamage":24,"damagepercent":25,"manarecovery":26,"manarecoverybonus":27,"staminarecoverybonus":28,"lastexp":29,"nextexp":30,"armorclass":31,"armorclass_vs_missile":32,"armorclass_vs_hth":33,"normal_damage_reduction":34,"magic_damage_reduction":35,"damageresist":36,"magicresist":37,"maxmagicresist":38,"fireresist":39,"maxfireresist":40,"lightresist":41,"maxlightresist":42,"coldresist":43,"maxcoldresist":44,"poisonresist":45,"maxpoisonresist":46,"damageaura":47,"firemindam":48,"firemaxdam":49,"lightmindam":50,"lightmaxdam":51,"magicmindam":52,"magicmaxdam":53,"coldmindam":54,"coldmaxdam":55,"coldlength":56,"poisonmindam":57,"poisonmaxdam":58,"poisonlength":59,"lifedrainmindam":60,"lifedrainmaxdam":61,"manadrainmindam":62,"manadrainmaxdam":63,"stamdrainmindam":64,"stamdrainmaxdam":65,"stunlength":66,"velocitypercent":67,"attackrate":68,"other_animrate":69,"quantity":70,"value":71,"durability":72,"maxdurability":73,"hpregen":74,"item_maxdurability_percent":75,"item_maxhp_percent":76,"item_maxmana_percent":77,"item_attackertakesdamage":78,"item_goldbonus":79,"item_magicbonus":80,"item_knockback":81,"item_timeduration":82,"item_addclassskills":83,"unsentparam1":84,"item_addexperience":85,"item_healafterkill":86,"item_reducedprices":87,"item_doubleherbduration":88,"item_lightradius":89,"item_lightcolor":90,"item_req_percent":91,"item_levelreq":92,"item_fasterattackrate":93,"item_levelreqpct":94,"lastblockframe":95,"item_fastermovevelocity":96,"item_nonclassskill":97,"state":98,"item_fastergethitrate":99,"monster_playercount":100,"skill_poison_override_length":101,"item_fasterblockrate":102,"skill_bypass_undead":103,"skill_bypass_demons":104,"item_fastercastrate":105,"skill_bypass_beasts":106,"item_singleskill":107,"item_restinpeace":108,"curse_resistance":109,"item_poisonlengthresist":110,"item_normaldamage":111,"item_howl":112,"item_stupidity":113,"item_damagetomana":114,"item_ignoretargetac":115,"item_fractionaltargetac":116,"item_preventheal":117,"item_halffreezeduration":118,"item_tohit_percent":119,"item_damagetargetac":120,"item_demondamage_percent":121,"item_undeaddamage_percent":122,"item_demon_tohit":123,"item_undead_tohit":124,"item_throwable":125,"item_elemskill":126,"item_allskills":127,"item_attackertakeslightdamage":128,"ironmaiden_level":129,"lifetap_level":130,"thorns_percent":131,"bonearmor":132,"bonearmormax":133,"item_freeze":134,"item_openwounds":135,"item_crushingblow":136,"item_kickdamage":137,"item_manaafterkill":138,"item_healafterdemonkill":139,"item_extrablood":140,"item_deadlystrike":141,"item_absorbfire_percent":142,"item_absorbfire":143,"item_absorblight_percent":144,"item_absorblight":145,"item_absorbmagic_percent":146,"item_absorbmagic":147,"item_absorbcold_percent":148,"item_absorbcold":149,"item_slow":150,"item_aura":151,"item_indesctructible":152,"item_cannotbefrozen":153,"item_staminadrainpct":154,"item_reanimate":155,"item_pierce":156,"item_magicarrow":157,"item_explosivearrow":158,"item_throw_mindamage":159,"item_throw_maxdamage":160,"skill_handofathena":161,"skill_staminapercent":162,"skill_passive_staminapercent":163,"skill_concentration":164,"skill_enchant":165,"skill_pierce":166,"skill_conviction":167,"skill_chillingarmor":168,"skill_frenzy":169,"skill_decrepify":170,"skill_armor_percent":171,"alignment":172,"target0":173,"target1":174,"goldlost":175,"conversion_level":176,"conversion_maxhp":177,"unit_dooverlay":178,"attack_vs_montype":179,"damage_vs_montype":180,"fade":181,"armor_override_percent":182,"equipped_eth":183,"missing_hp":184,"uber_difficulty":185,"map_glob_boss_dropskillers":186,"map_glob_boss_dropcorruptedunique":187,"item_addskill_tab":188,"openwounds_stack":189,"curse_slots":190,"item_skillonequip":191,"extra_shadow":192,"extra_spiritwolf":193,"item_numsockets":194,"item_skillonattack":195,"item_skillonkill":196,"item_skillondeath":197,"item_skillonhit":198,"item_skillonlevelup":199,"item_skilloncast":200,"item_skillongethit":201,"item_skillonblock":202,"item_skilloncrit":203,"item_charged_skill":204,"item_skillonpierce":205,"desecrated":206,"desecrator":207,"progressive_mindblast":208,"joustreduction_zeraes":209,"item_maxdeadlystrike":210,"map_glob_boss_dropubermats":211,"map_glob_boss_droppuzzlebox":212,"item_mindamage_energy":213,"item_armor_perlevel":214,"item_armorpercent_perlevel":215,"item_hp_perlevel":216,"item_mana_perlevel":217,"item_maxdamage_perlevel":218,"item_maxdamage_percent_perlevel":219,"item_strength_perlevel":220,"item_dexterity_perlevel":221,"item_energy_perlevel":222,"item_vitality_perlevel":223,"item_tohit_perlevel":224,"item_tohitpercent_perlevel":225,"item_cold_damagemax_perlevel":226,"item_fire_damagemax_perlevel":227,"item_ltng_damagemax_perlevel":228,"item_pois_damagemax_perlevel":229,"item_resist_cold_perlevel":230,"item_resist_fire_perlevel":231,"item_resist_ltng_perlevel":232,"item_resist_pois_perlevel":233,"item_absorb_cold_perlevel":234,"item_absorb_fire_perlevel":235,"item_absorb_ltng_perlevel":236,"item_absorb_pois_perlevel":237,"item_thorns_perlevel":238,"item_find_gold_perlevel":239,"item_find_magic_perlevel":240,"item_regenstamina_perlevel":241,"item_stamina_perlevel":242,"item_damage_demon_perlevel":243,"item_damage_undead_perlevel":244,"item_tohit_demon_perlevel":245,"item_tohit_undead_perlevel":246,"item_crushingblow_perlevel":247,"item_openwounds_perlevel":248,"item_kick_damage_perlevel":249,"item_deadlystrike_perlevel":250,"item_find_gems_perlevel":251,"item_replenish_durability":252,"item_replenish_quantity":253,"item_extra_stack":254,"item_find_item":255,"item_crit_multiplier":256,"item_ds_multiplier":257,"item_crit_chance":258,"previous_hitpoints":259,"item_thrust_damage":260,"item_thrust_damage_percent":261,"item_absorb_slash":262,"item_absorb_crush":263,"item_absorb_thrust":264,"item_absorb_slash_percent":265,"item_absorb_crush_percent":266,"item_absorb_thrust_percent":267,"item_crushingblow_efficiency":268,"extra_cold_arrows":269,"item_shiny_appearance":270,"joustreduction_leorics":271,"map_glob_dropsocketed":272,"map_glob_dropbonus":273,"map_glob_dropethereal":274,"map_glob_bossdropstreasure":275,"treacherous":276,"map_mon_att":277,"phasing":278,"zon_ear_drops":279,"sin_ear_drops":280,"barb_ear_drops":281,"necro_ear_drops":282,"paladin_ear_drops":283,"sorc_ear_drops":284,"map_mon_dropclassitems":285,"item_resist_ltng_bytime":286,"item_resist_pois_bytime":287,"item_absorb_cold_bytime":288,"item_absorb_fire_bytime":289,"item_absorb_ltng_bytime":290,"item_absorb_pois_bytime":291,"item_find_gold_bytime":292,"item_find_magic_bytime":293,"item_regenstamina_bytime":294,"item_stamina_bytime":295,"item_damage_demon_bytime":296,"item_damage_undead_bytime":297,"item_tohit_demon_bytime":298,"item_tohit_undead_bytime":299,"item_crushingblow_bytime":300,"item_openwounds_bytime":301,"item_kick_damage_bytime":302,"item_deadlystrike_bytime":303,"item_find_gems_bytime":304,"item_pierce_cold":305,"item_pierce_fire":306,"item_pierce_ltng":307,"item_pierce_pois":308,"item_damage_vs_monster":309,"item_damage_percent_vs_monster":310,"item_tohit_vs_monster":311,"item_tohit_percent_vs_monster":312,"item_ac_vs_monster":313,"item_ac_percent_vs_monster":314,"firelength":315,"burningmin":316,"burningmax":317,"progressive_damage":318,"progressive_steal":319,"progressive_other":320,"progressive_fire":321,"progressive_cold":322,"progressive_lightning":323,"item_extra_charges":324,"progressive_tohit":325,"poison_count":326,"damage_framerate":327,"pierce_idx":328,"passive_fire_mastery":329,"passive_ltng_mastery":330,"passive_cold_mastery":331,"passive_pois_mastery":332,"passive_fire_pierce":333,"passive_ltng_pierce":334,"passive_cold_pierce":335,"passive_pois_pierce":336,"passive_critical_strike":337,"passive_dodge":338,"passive_avoid":339,"passive_evade":340,"passive_warmth":341,"passive_mastery_melee_th":342,"passive_mastery_melee_dmg":343,"passive_mastery_melee_crit":344,"passive_mastery_throw_th":345,"passive_mastery_throw_dmg":346,"passive_mastery_throw_crit":347,"passive_weaponblock":348,"passive_summon_resist":349,"modifierlist_skill":350,"modifierlist_level":351,"last_sent_hp_pct":352,"source_unit_type":353,"source_unit_id":354,"shortparam1":355,"questitemdifficulty":356,"passive_mag_mastery":357,"passive_mag_pierce":358,"item_splashonhit":359,"corrupted":360,"corruptor":361,"item_elemskill_cold":362,"item_elemskill_fire":363,"item_elemskill_lightning":364,"item_elemskill_poison":365,"item_elemskill_magic":366,"skill_cold_enchant":367,"max_curses":368,"map_defense":369,"map_play_magicbonus":370,"map_play_goldbonus":371,"map_glob_density":372,"map_play_addexperience":373,"map_glob_arealevel":374,"map_glob_monsterrarity":375,"map_mon_firemindam":376,"map_mon_firemaxdam":377,"map_mon_lightmindam":378,"map_mon_lightmaxdam":379,"map_mon_magicmindam":380,"map_mon_magicmaxdam":381,"map_mon_coldmindam":382,"map_mon_coldmaxdam":383,"map_mon_coldlength":384,"map_mon_poisonmindam":385,"map_mon_poisonmaxdam":386,"map_mon_poisonlength":387,"map_mon_passive_fire_mastery":388,"map_mon_passive_ltng_mastery":389,"map_mon_passive_cold_mastery":390,"map_mon_passive_pois_mastery":391,"map_mon_fasterattackrate":392,"map_mon_fastercastrate":393,"map_mon_tohit":394,"map_mon_ac%":395,"map_mon_absorbcold_percent":396,"map_mon_absorbmagic_percent":397,"map_mon_absorblight_percent":398,"map_mon_absorbfire_percent":399,"map_mon_normal_damage_reduction":400,"map_mon_velocitypercent":401,"map_mon_hpregen":402,"map_mon_lifedrainmindam":403,"map_mon_fastergethitrate":404,"map_mon_maxhp_percent":405,"map_mon_pierce":406,"map_mon_openwounds":407,"map_mon_crushingblow":408,"map_mon_curse_resistance":409,"map_play_ac%":410,"map_play_fastergethitrate":411,"map_play_toblock":412,"map_play_hpregen":413,"map_mon_passive_fire_pierce":414,"map_mon_passive_ltng_pierce":415,"map_mon_passive_cold_pierce":416,"map_mon_passive_pois_pierce":417,"map_play_maxfireresist":418,"map_play_maxlightresist":419,"map_play_maxcoldresist":420,"map_play_maxpoisonresist":421,"item_replenish_charges":422,"item_leap_speed":423,"item_healafterhit":424,"passive_phys_pierce":425,"map_mon_ed%":426,"map_mon_splash":427,"map_play_fireresist":428,"map_play_lightresist":429,"map_play_coldresist":430,"map_play_poisonresist":431,"map_mon_phys_as_extra_ltng":432,"map_mon_phys_as_extra_cold":433,"map_mon_phys_as_extra_fire":434,"map_mon_phys_as_extra_pois":435,"map_mon_phys_as_extra_mag":436,"map_glob_add_mon_doll":437,"map_glob_add_mon_succ":438,"map_glob_add_mon_vamp":439,"map_glob_add_mon_cow":440,"map_glob_add_mon_horde":441,"map_glob_add_mon_ghost":442,"extra_bonespears":443,"extra_revives":444,"immune_stat":445,"mon_cooldown1":446,"mon_cooldown2":447,"mon_cooldown3":448,"map_mon_deadlystrike":449,"map_mon_cannotbefrozen":450,"map_play_fasterattackrate":451,"map_play_fastercastrate":452,"map_mon_skillondeath":453,"map_play_maxhp_percent":454,"map_play_maxmana_percent":455,"map_play_damageresist":456,"map_play_velocitypercent":457,"heroic":458,"extra_spirits":459,"gustreduction":460,"extra_skele_war":461,"extra_skele_mage":462,"extra_hydra":463,"extra_valk":464,"joustreduction":465,"grims_extra_skele_mage":466,"map_play_lightradius":467,"blood_warp_life_reduction":468,"pierce_count":469,"map_glob_add_mon_souls":470,"map_glob_add_mon_fetish":471,"dclone_clout":472,"maxlevel_clout":473,"dev_clout":474,"extra_skele_archer":475,"extra_golem":476,"transform_dye":477,"inc_splash_radius":478,"item_numsockets_textonly":479,"rathma_clout":480,"extra_holybolts":481,"pvp_cd":482,"dragonflightreduction":483,"item_dmgpercent_pereth":484,"corpseexplosionradius":485,"mirrored":486,"item_dmgpercent_permissinghppercent":487,"lifedrain_percentcap":488,"inc_splash_radius_permissinghp":489,"eaglehorn_raven":490,"pvp_disable":491,"pvp_lld_cd":492,"map_glob_skirmish_mode":493,"map_mon_dropjewelry":494,"map_mon_dropweapons":495,"map_mon_droparmor":496,"map_mon_dropcrafting":497,"map_glob_extra_boss":498,"map_glob_add_mon_shriek":499,"map_force_event":500,"deep_wounds":501,"map_mon_dropcharms":502,"map_glob_dropcorrupted":503,"curse_effectiveness":504,"map_glob_boss_dropfacet":505,"map_mon_dropjewels":506,"es_efficiency":507,"map_glob_sundermonsters":508,"extra_grizzly":509,"no_wolves":510},"p":[83,97,98,107,126,151,155,179,180,188,191,195,196,197,198,199,200,201,202,203,204,205,359,360,362,363,364,365,366,427,453],"per":{"214":[3,[31],4],"216":[3,[7],2],"217":[3,[9],2],"218":[3,[22,24,160],4],"220":[3,[0],2],"221":[3,[2],2],"222":[3,[1],2],"223":[3,[3],2],"224":[1,[19],2],"225":[1,[119],2],"226":[3,[55],2],"227":[3,[49],2],"228":[3,[51],2],"229":[3,[58],2],"230":[3,[43],2],"231":[3,[39],2],"232":[3,[41],2],"233":[3,[45],2],"234":[3,[149],2],"235":[3,[143],2],"236":[3,[145],2],"237":[3,[147],2],"238":[3,[78],2],"239":[3,[79],2],"240":[3,[80],2],"241":[3,[28],2],"242":[3,[11],2],"243":[3,[121],2],"244":[3,[122],2],"245":[1,[123],2],"246":[1,[124],2],"247":[3,[136],2],"248":[3,[135],2],"249":[3,[137],2],"250":[3,[141],2]},"skills":{"6":[0,0,"Magic Arrow","mag",1,[8,17,22],0],"7":[0,0,"Fire Arrow","fire",6,[6,27],0],"8":[0,1,"Inner Sight","mag",1,[],0],"9":[0,1,"Critical Strike","",1,[],0],"10":[0,2,"Jab","",1,[30],0],"11":[0,0,"Cold Arrow","cold",6,[6,21],0],"12":[0,0,"Multiple Shot","",6,[],0],"13":[0,1,"Dodge","",18,[],0],"14":[0,2,"Power Strike","ltng",6,[20,34],0],"15":[0,2,"Poison Javelin","pois",1,[19,25],0],"16":[0,0,"Exploding Arrow","fire",18,[6,27],0],"17":[0,1,"Slow Movement","mag",12,[],0],"18":[0,1,"Avoid","",12,[],0],"19":[0,2,"Javelin and Spear Mastery","",6,[],0],"20":[0,2,"Lightning Bolt","ltng",12,[14,35],0],"21":[0,0,"Ice Arrow","cold",12,[6,11,31],0],"22":[0,0,"Guided Arrow","mag",18,[],0],"23":[0,1,"Penetrate","",24,[],0],"24":[0,2,"Charged Strike","ltng",18,[14,34],0],"25":[0,2,"Plague Javelin","pois",18,[15,19],1],"26":[0,0,"Strafe","",24,[23],0],"27":[0,0,"Immolation Arrow","fire",30,[6,7,16],0],"28":[0,1,"Decoy","mag",18,[9,23,26,32,33],0],"29":[0,1,"Evade","",6,[],0],"30":[0,2,"Fend","",18,[10],0],"31":[0,0,"Freezing Arrow","cold",30,[11,21],0],"32":[0,1,"Valkyrie","mag",30,[9,14,23,28,33],1],"33":[0,1,"Pierce","",12,[],0],"34":[0,2,"Lightning Strike","ltng",30,[14,24],0],"35":[0,2,"Lightning Fury","ltng",30,[14,20],0],"36":[1,8,"Fire Bolt","fire",1,[47,376],0],"37":[1,8,"Warmth","fire",1,[],0],"38":[1,9,"Charged Bolt","ltng",1,[43,49],0],"39":[1,10,"Ice Bolt","cold",1,[45,55],0],"40":[1,10,"Cold Enchant","cold",1,[60],0],"41":[1,8,"Inferno","fire",1,[46,51],0],"42":[1,9,"Static Field","ltng",1,[63],0],"43":[1,9,"Telekinesis","ltng",1,[38,48],0],"44":[1,10,"Frost Nova","cold",6,[39,50],0],"45":[1,10,"Ice Blast","cold",6,[39,55],0],"46":[1,8,"Blaze","fire",6,[51],1],"47":[1,8,"Fire Ball","fire",12,[36,376],0],"48":[1,9,"Nova","ltng",12,[38,43],0],"49":[1,9,"Lightning","ltng",12,[38,53],0],"50":[1,10,"Shiver Armor","cold",12,[44],0],"51":[1,8,"Fire Wall","fire",12,[46],1],"52":[1,8,"Enchant Fire","fire",18,[37],0],"53":[1,9,"Chain Lightning","ltng",24,[38,49],0],"54":[1,9,"Teleport","ltng",18,[],0],"55":[1,10,"Glacial Spike","cold",18,[39,45,59],0],"56":[1,8,"Meteor","fire",24,[41,46,47],1],"57":[1,9,"Thunder Storm","ltng",24,[38,48],0],"58":[1,9,"Energy Shield","ltng",30,[],0],"59":[1,10,"Blizzard","cold",24,[39,45],1],"60":[1,10,"Chilling Armor","cold",24,[59],0],"61":[1,8,"Fire Mastery","fire",30,[],0],"62":[1,8,"Hydra","fire",30,[36,383],0],"63":[1,9,"Lightning Mastery","ltng",30,[],0],"64":[1,10,"Frozen Orb","cold",30,[39,44],0],"65":[1,10,"Cold Mastery","cold",30,[],0],"66":[2,16,"Amplify Damage","mag",1,[374],0],"67":[2,17,"Teeth","mag",1,[68,84,93],0],"68":[2,17,"Bone Armor","mag",6,[78,88],1],"69":[2,18,"Skeleton Mastery","mag",1,[],0],"70":[2,18,"Raise Skeleton Warrior","mag",1,[69,80,89],0],"71":[2,16,"Dim Vision","mag",6,[374],0],"72":[2,16,"Weaken","mag",18,[374],0],"73":[2,17,"Poison Strike","pois",1,[68,83],0],"74":[2,17,"Corpse Explosion","fire",6,[66,83,95],0],"75":[2,18,"Clay Golem","mag",6,[79,85,90,94],1],"76":[2,16,"Iron Maiden","mag",12,[374],0],"77":[2,16,"Terror","mag",12,[374],0],"78":[2,17,"Bone Wall","mag",12,[68,88],1],"79":[2,18,"Golem Mastery","mag",12,[],0],"80":[2,18,"Raise Skeletal Mage","mag",12,[],0],"81":[2,16,"Confuse","mag",18,[374],0],"82":[2,16,"Life Tap","mag",12,[374],0],"83":[2,17,"Desecrate","pois",12,[73,92],0],"84":[2,17,"Bone Spear","mag",18,[67,68,93],0],"85":[2,18,"Blood Golem","",18,[75,79,90,94],1],"86":[2,16,"Attract","mag",24,[374],0],"87":[2,16,"Decrepify","mag",24,[374],0],"88":[2,17,"Bone Prison","mag",24,[68,78],1],"89":[2,18,"Raise Skeleton Archer","mag",24,[69,70],0],"90":[2,18,"Iron Golem","mag",24,[75,79,85,94],1],"91":[2,16,"Lower Resist","mag",30,[374],0],"92":[2,17,"Poison Nova","pois",30,[73,83],0],"93":[2,17,"Bone Spirit","mag",30,[67,68,84],0],"94":[2,18,"Fire Golem","fire",30,[75,79,85,90],1],"95":[2,18,"Revive","mag",30,[83],0],"96":[3,24,"Sacrifice","",6,[122,124],0],"97":[3,24,"Smite","",1,[],0],"98":[3,25,"Might","",1,[],0],"99":[3,26,"Prayer","",1,[],0],"100":[3,26,"Resist Fire","fire",1,[],0],"101":[3,24,"Holy Bolt","mag",1,[99,121,364,371],0],"102":[3,25,"Holy Fire","fire",6,[100,108,125],0],"103":[3,25,"Thorns","",6,[98,104],0],"104":[3,26,"Defiance","",6,[],0],"105":[3,26,"Resist Cold","cold",1,[],0],"106":[3,24,"Zeal","",1,[96],0],"107":[3,24,"Charge","",12,[98,115],0],"108":[3,25,"Blessed Aim","",12,[],0],"109":[3,26,"Cleansing","mag",12,[],0],"110":[3,26,"Resist Lightning","ltng",1,[],0],"111":[3,24,"Vengeance","",18,[102,114,118,123],0],"112":[3,24,"Blessed Hammer","mag",18,[108,115],0],"113":[3,25,"Concentration","",18,[],0],"114":[3,25,"Holy Freeze","cold",18,[105,108,125],0],"115":[3,26,"Vigor","",18,[],0],"116":[3,24,"Holy Sword","mag",24,[],0],"117":[3,24,"Holy Shield","mag",18,[97,104],0],"118":[3,25,"Holy Shock","ltng",24,[108,110,125],0],"119":[3,25,"Sanctuary","mag",24,[98,108,116],0],"120":[3,26,"Meditation","mag",24,[],0],"121":[3,24,"Fist of the Heavens","ltng",24,[101,364,371],0],"122":[3,25,"Fanaticism","",30,[],0],"123":[3,25,"Conviction","",30,[],0],"124":[3,26,"Redemption","",30,[],0],"125":[3,26,"Salvation","",30,[],0],"126":[4,32,"Bash","",1,[139,144],0],"127":[4,33,"Sword Mastery","",1,[],0],"128":[4,33,"One Handed Weapon Mastery","",1,[],0],"129":[4,33,"Mace Mastery","",1,[],0],"130":[4,34,"Howl","",1,[],0],"131":[4,34,"Find Potion","",1,[],0],"132":[4,32,"Leap","",12,[],0],"133":[4,32,"Double Swing","",1,[139,147],0],"134":[4,33,"Two Handed Weapon Mastery","",6,[],0],"135":[4,33,"Throwing Mastery","",1,[],0],"136":[4,33,"Spear Mastery","",6,[],0],"137":[4,34,"Taunt","",18,[],0],"138":[4,34,"Shout","",6,[],0],"139":[4,32,"Stun","stun",6,[144],0],"140":[4,32,"Double Throw","",12,[133,147],0],"141":[4,33,"Combat Reflexes","",12,[],0],"142":[4,34,"Find Item","",12,[],0],"143":[4,32,"Leap Attack","",24,[126,132],0],"144":[4,32,"Concentrate","mag",12,[126,155],0],"145":[4,33,"Iron Skin","",18,[],0],"146":[4,34,"Battle Cry","",30,[],0],"147":[4,32,"Frenzy","",6,[133,139],0],"148":[4,33,"Increased Speed","",24,[],0],"149":[4,34,"Battle Orders","",24,[],0],"150":[4,34,"Grim Ward","",24,[],0],"151":[4,32,"Whirlwind","",30,[],0],"152":[4,32,"Berserk","",24,[137,141],0],"153":[4,33,"Natural Resistance","",30,[],0],"154":[4,34,"War Cry","",6,[130,137,138,146,149,155],0],"155":[4,34,"Battle Command","",30,[],0],"221":[5,40,"Summon Ravens","cold",1,[227,237,247],0],"222":[5,40,"Poison Creeper","pois",1,[231,238,241],0],"223":[5,41,"Werewolf","",1,[],1],"224":[5,41,"Lycanthropy","",1,[],0],"225":[5,42,"Firestorm","fire",1,[229,234],0],"226":[5,40,"Oak Sage","",30,[231,241],0],"227":[5,40,"Summon Spirit Wolf","",12,[221,237,247],0],"228":[5,41,"Werebear","",1,[],1],"229":[5,42,"Molten Boulder","fire",6,[234,244,249],0],"230":[5,42,"Arctic Blast","cold",1,[235,245,250],0],"231":[5,40,"Carrion Vine","",12,[226,241],1],"232":[5,41,"Feral Rage","",6,[248],0],"233":[5,41,"Maul","",6,[],0],"234":[5,42,"Fissure","fire",12,[225,229],1],"235":[5,42,"Cyclone Armor","",6,[240,245],1],"236":[5,40,"Heart of Wolverine","",6,[],0],"237":[5,40,"Summon Dire Wolf","",24,[221,227,247],0],"238":[5,41,"Rabies","pois",18,[222,224,232],0],"239":[5,41,"Fire Claws","fire",24,[229,249],0],"240":[5,42,"Twister","",12,[230,245,250],0],"241":[5,40,"Solar Creeper","pois",24,[226,231],1],"242":[5,41,"Hunger","",12,[233],0],"243":[5,41,"Shock Wave","",18,[228,240],0],"244":[5,42,"Volcano","fire",24,[229,234,249],1],"245":[5,42,"Tornado","",24,[230,240,250],0],"246":[5,40,"Spirit of Barbs","",18,[231],0],"247":[5,40,"Summon Grizzly","",30,[221,227],1],"248":[5,41,"Fury","",30,[232],0],"249":[5,42,"Armageddon","fire",30,[229,239,244],0],"250":[5,42,"Hurricane","cold",30,[230,245],0],"251":[6,48,"Fire Blast","fire",1,[256,261,262,271,272,366],0],"252":[6,49,"Claw and Dagger Mastery","",1,[],0],"253":[6,49,"Psychic Hammer","mag",1,[264,268,273],0],"254":[6,50,"Tiger Strike","",1,[],0],"255":[6,50,"Dragon Talon","",1,[270,275],0],"256":[6,48,"Shock Web","ltng",6,[251,261,262,271,272,366],1],"257":[6,48,"Blade Sentinel","",6,[266,277],0],"258":[6,49,"Burst of Speed","",6,[],0],"259":[6,50,"Fists of Fire","fire",6,[254,275],0],"260":[6,50,"Dragon Claw","",6,[263],0],"261":[6,48,"Charged Bolt Sentry","ltng",12,[251,271,276,366],0],"262":[6,48,"Wake of Fire","fire",12,[251,272],0],"263":[6,49,"Weapon Block","",12,[],0],"264":[6,49,"Cloak of Shadows","",12,[],1],"265":[6,50,"Cobra Strike","pois",12,[],0],"266":[6,48,"Blade Fury","",18,[257,277],0],"267":[6,49,"Fade","",18,[],0],"268":[6,49,"Shadow Warrior","",18,[],1],"269":[6,50,"Claws of Thunder","ltng",18,[260],0],"270":[6,50,"Dragon Tail","fire",18,[255,275],0],"271":[6,48,"Chain Lightning Sentry","ltng",30,[251,261,366],0],"272":[6,48,"Wake of Inferno","fire",24,[251,262],0],"273":[6,49,"Mind Blast","",18,[253,264,268],0],"274":[6,50,"Blades of Ice","cold",24,[254],0],"275":[6,50,"Dragon Flight","",24,[],1],"276":[6,48,"Death Sentry","fire",30,[251,261,272],0],"277":[6,48,"Blade Shield","",24,[257,266],0],"278":[6,49,"Venom","pois",30,[265],0],"279":[6,49,"Shadow Master","",30,[],1],"280":[6,50,"Phoenix Strike","",30,[],0],"364":[3,24,"Holy Nova","mag",30,[99,101,121,371],1],"365":[0,-1,"Freezing Arrow","cold",24,[11,21,31],0],"366":[6,48,"Lightning Sentry","ltng",24,[251,261,271],0],"367":[2,18,"Blood Warp","",24,[],1],"368":[4,33,"Deep Wounds","",30,[150],0],"369":[1,10,"Ice Barrage","cold",24,[39,55,59],0],"370":[5,42,"Gust","cold",18,[],1],"371":[3,24,"Holy Light","mag",12,[99,101,121],0],"372":[0,-1,"Attack","",1,[],0],"373":[6,-1,"Attack","",1,[],0],"374":[2,16,"Curse Mastery","",1,[],0],"375":[4,32,"Split Throw","",18,[144,148],0],"376":[1,8,"Combustion","fire",24,[36,47],1],"377":[5,-1,"Attack","",1,[],0],"378":[3,24,"Joust","",24,[],1],"379":[0,-1,"Attack","",1,[],0],"380":[6,-1,"Blade Dance","",30,[],0],"381":[2,16,"Dark Pact","mag",6,[66,71,72,76,77,81,82,86,87,91,374],0],"382":[4,-1,"Attack","",1,[],0],"383":[1,8,"Lesser Hydra","fire",12,[36,62],0],"384":[5,-1,"Attack","",1,[],0]},"weapons":{"hax":["1hs","1hs",0],"axe":["1hs","1hs",0],"2ax":["1hs","1hs",0],"mpi":["1hs","1hs",0],"wax":["1hs","1hs",0],"lax":["stf","stf",2],"bax":["stf","stf",2],"btx":["stf","stf",2],"gax":["stf","stf",2],"gix":["stf","stf",2],"wnd":["1hs","1hs",0],"ywn":["1hs","1hs",0],"bwn":["1hs","1hs",0],"gwn":["1hs","1hs",0],"clb":["1hs","1hs",0],"scp":["1hs","1hs",0],"gsc":["1hs","1hs",0],"wsp":["1hs","1hs",0],"spc":["1hs","1hs",0],"mac":["1hs","1hs",0],"mst":["1hs","1hs",0],"fla":["1hs","1hs",0],"whm":["1hs","1hs",0],"mau":["stf","stf",2],"gma":["stf","stf",2],"ssd":["1hs","1hs",0],"scm":["1hs","1hs",0],"sbr":["1hs","1hs",0],"flc":["1hs","1hs",0],"crs":["1hs","1hs",0],"bsd":["1hs","1hs",0],"lsd":["1hs","1hs",0],"wsd":["1hs","1hs",0],"2hs":["1hs","2hs",3],"clm":["1hs","2hs",3],"gis":["1hs","2hs",3],"bsw":["1hs","2hs",3],"flb":["1hs","2hs",3],"gsd":["1hs","2hs",3],"dgr":["1ht","1ht",0],"dir":["1ht","1ht",0],"kri":["1ht","1ht",0],"bld":["1ht","1ht",0],"tkf":["1ht","1ht",4],"tax":["1hs","1hs",4],"bkf":["1ht","1ht",4],"bal":["1hs","1hs",4],"jav":["1ht","1ht",4],"pil":["1ht","1ht",4],"ssp":["1ht","1ht",4],"glv":["1ht","1ht",4],"tsp":["1ht","1ht",4],"spr":["2ht","2ht",2],"tri":["2ht","2ht",2],"brn":["2ht","2ht",2],"spt":["2ht","2ht",2],"pik":["2ht","2ht",2],"bar":["stf","stf",2],"vou":["stf","stf",2],"scy":["stf","stf",2],"pax":["stf","stf",2],"hal":["stf","stf",2],"wsc":["stf","stf",2],"sst":["stf","stf",2],"lst":["stf","stf",2],"cst":["stf","stf",2],"bst":["stf","stf",2],"wst":["stf","stf",2],"sbw":["bow","bow",2],"hbw":["bow","bow",2],"lbw":["bow","bow",2],"cbw":["bow","bow",2],"sbb":["bow","bow",2],"lbb":["bow","bow",2],"swb":["bow","bow",2],"lwb":["bow","bow",2],"lxb":["xbw","xbw",2],"mxb":["xbw","xbw",2],"hxb":["xbw","xbw",2],"rxb":["xbw","xbw",2],"gps":["1ht","1ht",4],"ops":["1ht","1ht",4],"gpm":["1ht","1ht",4],"opm":["1ht","1ht",4],"gpl":["1ht","1ht",4],"opl":["1ht","1ht",4],"d33":["1ht","1ht",0],"g33":["1ht","1ht",0],"leg":["1hs","1hs",0],"hdm":["1hs","1hs",0],"hfh":["1hs","1hs",0],"hst":["stf","stf",2],"msf":["stf","stf",2],"9ha":["1hs","1hs",0],"9ax":["1hs","1hs",0],"92a":["1hs","1hs",0],"9mp":["1hs","1hs",0],"9wa":["1hs","1hs",0],"9la":["stf","stf",2],"9ba":["stf","stf",2],"9bt":["stf","stf",2],"9ga":["stf","stf",2],"9gi":["stf","stf",2],"9wn":["1hs","1hs",0],"9yw":["1hs","1hs",0],"9bw":["1hs","1hs",0],"9gw":["1hs","1hs",0],"9cl":["1hs","1hs",0],"9sc":["1hs","1hs",0],"9qs":["1hs","1hs",0],"9ws":["1hs","1hs",0],"9sp":["1hs","1hs",0],"9ma":["1hs","1hs",0],"9mt":["1hs","1hs",0],"9fl":["1hs","1hs",0],"9wh":["1hs","1hs",0],"9m9":["stf","stf",2],"9gm":["stf","stf",2],"9ss":["1hs","1hs",0],"9sm":["1hs","1hs",0],"9sb":["1hs","1hs",0],"9fc":["1hs","1hs",0],"9cr":["1hs","1hs",0],"9bs":["1hs","1hs",0],"9ls":["1hs","1hs",0],"9wd":["1hs","1hs",0],"92h":["1hs","2hs",3],"9cm":["1hs","2hs",3],"9gs":["1hs","2hs",3],"9b9":["1hs","2hs",3],"9fb":["1hs","2hs",3],"9gd":["1hs","2hs",3],"9dg":["1ht","1ht",0],"9di":["1ht","1ht",0],"9kr":["1ht","1ht",0],"9bl":["1ht","1ht",0],"9tk":["1ht","1ht",4],"9ta":["1hs","1hs",4],"9bk":["1ht","1ht",4],"9b8":["1hs","1hs",4],"9ja":["1ht","1ht",4],"9pi":["1ht","1ht",4],"9s9":["1ht","1ht",4],"9gl":["1ht","1ht",4],"9ts":["1ht","1ht",4],"9sr":["2ht","2ht",2],"9tr":["2ht","2ht",2],"9br":["2ht","2ht",2],"9st":["2ht","2ht",2],"9p9":["2ht","2ht",2],"9b7":["stf","stf",2],"9vo":["stf","stf",2],"9s8":["stf","stf",2],"9pa":["stf","stf",2],"9h9":["stf","stf",2],"9wc":["stf","stf",2],"8ss":["stf","stf",2],"8ls":["stf","stf",2],"8cs":["stf","stf",2],"8bs":["stf","stf",2],"8ws":["stf","stf",2],"8sb":["bow","bow",2],"8hb":["bow","bow",2],"8lb":["bow","bow",2],"8cb":["bow","bow",2],"8s8":["bow","bow",2],"8l8":["bow","bow",2],"8sw":["bow","bow",2],"8lw":["bow","bow",2],"8lx":["xbw","xbw",2],"8mx":["xbw","xbw",2],"8hx":["xbw","xbw",2],"8rx":["xbw","xbw",2],"qf1":["1hs","1hs",0],"qf2":["1hs","1hs",0],"ktr":["ht1","ht1",0],"wrb":["ht1","ht1",0],"axf":["ht1","ht1",0],"ces":["ht1","ht1",0],"clw":["ht1","ht1",0],"btl":["ht1","ht1",0],"skr":["ht1","ht1",0],"9ar":["ht1","ht1",0],"9wb":["ht1","ht1",0],"9xf":["ht1","ht1",0],"9cs":["ht1","ht1",0],"9lw":["ht1","ht1",0],"9tw":["ht1","ht1",0],"9qr":["ht1","ht1",0],"7ar":["ht1","ht1",0],"7wb":["ht1","ht1",0],"7xf":["ht1","ht1",0],"7cs":["ht1","ht1",0],"7lw":["ht1","ht1",0],"7tw":["ht1","ht1",0],"7qr":["ht1","ht1",0],"7ha":["1hs","1hs",0],"7ax":["1hs","1hs",0],"72a":["1hs","1hs",0],"7mp":["1hs","1hs",0],"7wa":["1hs","1hs",0],"7la":["stf","stf",2],"7ba":["stf","stf",2],"7bt":["stf","stf",2],"7ga":["stf","stf",2],"7gi":["stf","stf",2],"7wn":["1hs","1hs",0],"7yw":["1hs","1hs",0],"7bw":["1hs","1hs",0],"7gw":["1hs","1hs",0],"7cl":["1hs","1hs",0],"7sc":["1hs","1hs",0],"7qs":["1hs","1hs",0],"7ws":["1hs","1hs",0],"7sp":["1hs","1hs",0],"7ma":["1hs","1hs",0],"7mt":["1hs","1hs",0],"7fl":["1hs","1hs",0],"7wh":["1hs","1hs",0],"7m7":["stf","stf",2],"7gm":["stf","stf",2],"7ss":["1hs","1hs",0],"7sm":["1hs","1hs",0],"7sb":["1hs","1hs",0],"7fc":["1hs","1hs",0],"7cr":["1hs","1hs",0],"7bs":["1hs","1hs",0],"7ls":["1hs","1hs",0],"7wd":["1hs","1hs",0],"72h":["1hs","2hs",3],"7cm":["1hs","2hs",3],"7gs":["1hs","2hs",3],"7b7":["1hs","2hs",3],"7fb":["1hs","2hs",3],"7gd":["1hs","2hs",3],"7dg":["1ht","1ht",0],"7di":["1ht","1ht",0],"7kr":["1ht","1ht",0],"7bl":["1ht","1ht",0],"7tk":["1ht","1ht",4],"7ta":["1hs","1hs",4],"7bk":["1ht","1ht",4],"7b8":["1hs","1hs",4],"7ja":["1ht","1ht",4],"7pi":["1ht","1ht",4],"7s7":["1ht","1ht",4],"7gl":["1ht","1ht",4],"7ts":["1ht","1ht",4],"7sr":["2ht","2ht",2],"7tr":["2ht","2ht",2],"7br":["2ht","2ht",2],"7st":["2ht","2ht",2],"7p7":["2ht","2ht",2],"7o7":["stf","stf",2],"7vo":["stf","stf",2],"7s8":["stf","stf",2],"7pa":["stf","stf",2],"7h7":["stf","stf",2],"7wc":["stf","stf",2],"6ss":["stf","stf",2],"6ls":["stf","stf",2],"6cs":["stf","stf",2],"6bs":["stf","stf",2],"6ws":["stf","stf",2],"6sb":["bow","bow",2],"6hb":["bow","bow",2],"6lb":["bow","bow",2],"6cb":["bow","bow",2],"6s7":["bow","bow",2],"6l7":["bow","bow",2],"6sw":["bow","bow",2],"6lw":["bow","bow",2],"6lx":["xbw","xbw",2],"6mx":["xbw","xbw",2],"6hx":["xbw","xbw",2],"6rx":["xbw","xbw",2],"ob1":["1hs","1hs",0],"ob2":["1hs","1hs",0],"ob3":["1hs","1hs",0],"ob4":["1hs","1hs",0],"ob5":["1hs","1hs",0],"am1":["bow","bow",2],"am2":["bow","bow",2],"am3":["2ht","2ht",2],"am4":["2ht","2ht",2],"am5":["1ht","1ht",4],"ob6":["1hs","1hs",0],"ob7":["1hs","1hs",0],"ob8":["1hs","1hs",0],"ob9":["1hs","1hs",0],"oba":["1hs","1hs",0],"am6":["bow","bow",2],"am7":["bow","bow",2],"am8":["2ht","2ht",2],"am9":["2ht","2ht",2],"ama":["1ht","1ht",4],"obb":["1hs","1hs",0],"obc":["1hs","1hs",0],"obd":["1hs","1hs",0],"obe":["1hs","1hs",0],"obf":["1hs","1hs",0],"amb":["bow","bow",2],"amc":["bow","bow",2],"amd":["2ht","2ht",2],"ame":["2ht","2ht",2],"amf":["1ht","1ht",4],"tpfs":["1ht","1ht",4],"tpfm":["1ht","1ht",4],"tpfl":["1ht","1ht",4],"tpgs":["1ht","1ht",4],"tpgm":["1ht","1ht",4],"tpgl":["1ht","1ht",4],"tpcs":["1ht","1ht",4],"tpcm":["1ht","1ht",4],"tpcl":["1ht","1ht",4],"tpls":["1ht","1ht",4],"tplm":["1ht","1ht",4],"tpll":["1ht","1ht",4],"7cr2":["2hs","2hs",2]},"types":{"shield":["ashd","head","shie","shld"],"quiver":["bowq","mboq","mxbq","xboq"],"charm":["chap","char","lcha","lchp","mcha","mchp","scha","schp"]},"setItems":{"Civerb's Ward":["Civerb's Vestments",1,[[[36,0,10]],[[45,0,25]]]],"Civerb's Icon":["Civerb's Vestments",2,[[[43,0,25]]]],"Civerb's Cudgel":["Civerb's Vestments",2,[[[122,0,100]]]],"Hsarus' Iron Heel":["Hsarus' Defense",2,[[[224,0,10]]]],"Hsarus' Iron Fist":["Hsarus' Defense",2,[[[214,0,2.5]]]],"Hsarus' Iron Stay":["Hsarus' Defense",2,[[[214,0,2.5]]]],"Cleglaw's Tooth":["Cleglaw's Brace",2,[[[218,0,1.25]]]],"Cleglaw's Claw":["Cleglaw's Brace",2,[[[39,0,15],[41,0,15],[43,0,15],[45,0,15]]]],"Cleglaw's Pincers":["Cleglaw's Brace",2,[[[224,0,10]]]],"Iratha's Collar":["Iratha's Finery",2,[[[39,0,10],[41,0,10],[43,0,10],[45,0,10]],[[83,0,1]]]],"Iratha's Cuff":["Iratha's Finery",2,[[[93,0,20]]]],"Iratha's Coil":["Iratha's Finery",2,[[[214,0,2]],[[83,0,1]]]],"Iratha's Cord":["Iratha's Finery",2,[[[2,0,10]],[[22,0,10],[24,0,10],[160,0,10]]]],"Isenhart's Lightbrand":["Isenhart's Armory",2,[[[228,0,5]]]],"Isenhart's Parry":["Isenhart's Armory",2,[[],[[231,0,1]]]],"Isenhart's Case":["Isenhart's Armory",2,[[[214,0,2]],[[230,0,1]]]],"Isenhart's Horns":["Isenhart's Armory",2,[[],[[232,0,1]]]],"Vidala's Barb":["Vidala's Rig",2,[[[224,0,8]],[[93,0,20]],[[221,0,2]]]],"Vidala's Fetlock":["Vidala's Rig",2,[[[39,0,8],[41,0,8],[43,0,8],[45,0,8]]]],"Vidala's Ambush":["Vidala's Rig",2,[[[39,0,24]],[[214,0,2.5]]]],"Vidala's Snare":["Vidala's Rig",2,[[[80,0,50]]]],"Milabrega's Orb":["Milabrega's Regalia",2,[[],[[20,0,30]]]],"Milabrega's Rod":["Milabrega's Regalia",2,[]],"Milabrega's Diadem":["Milabrega's Regalia",2,[[[43,0,40]]]],"Milabrega's Robe":["Milabrega's Regalia",2,[]],"Cathan's Rule":["Cathan's Traps",2,[[[9,0,50]],[[39,0,10],[41,0,10],[43,0,10],[45,0,10]],[[116,0,35]]]],"Cathan's Mesh":["Cathan's Traps",2,[[[238,0,1]],[[39,0,30]]]],"Cathan's Visage":["Cathan's Traps",2,[[[214,0,2]],[[19,0,60]]]],"Cathan's Sigil":["Cathan's Traps",2,[[[19,0,50]],[[80,0,25]]]],"Cathan's Seal":["Cathan's Traps",2,[[[0,0,10]],[[22,0,10],[24,0,10],[160,0,10]]]],"Tancred's Crowbill":["Tancred's Battlegear",2,[[[93,0,20]]]],"Tancred's Spine":["Tancred's Battlegear",2,[[[214,0,6]]]],"Tancred's Hobnails":["Tancred's Battlegear",2,[[[96,0,30]],[[0,0,10]]]],"Tancred's Weird":["Tancred's Battlegear",2,[[[80,0,78]],[[19,0,160]]]],"Tancred's Skull":["Tancred's Battlegear",2,[[[39,0,10],[41,0,10],[43,0,10],[45,0,10]]]],"Sigon's Gage":["Sigon's Complete Steel",2,[[[93,0,30]]]],"Sigon's Visor":["Sigon's Complete Steel",2,[[[224,0,8]]]],"Sigon's Shelter":["Sigon's Complete Steel",2,[[[78,0,20]]]],"Sigon's Sabot":["Sigon's Complete Steel",2,[[[19,0,50]],[[80,0,50]]]],"Sigon's Wrap":["Sigon's Complete Steel",2,[[[214,0,2]]]],"Sigon's Guard":["Sigon's Complete Steel",2,[]],"Infernal Cranium":["Infernal Tools",2,[[[214,0,4]]]],"Infernal Spire":["Infernal Tools",2,[[[224,0,10]],[[97,73,2]]]],"Infernal Sign":["Infernal Tools",2,[[[45,0,45]],[[153,0,1]]]],"Berserker's Headgear":["Berserker's Garb",2,[[[224,0,8]],[[83,4,1]]]],"Berserker's Hauberk":["Berserker's Garb",2,[[[214,0,4.5]],[[219,0,28]]]],"Berserker's Hatchet":["Berserker's Garb",2,[[[17,0,50],[18,0,50]],[[218,0,1]]]],"Death's Hand":["Death's Disguise",2,[[[93,0,30]],[[218,0,0.5]]]],"Death's Guard":["Death's Disguise",2,[[[39,0,15],[41,0,15],[43,0,15],[45,0,15]]]],"Death's Touch":["Death's Disguise",2,[[[54,0,25],[55,0,75],[56,0,75]]]],"Angelic Sickle":["Angelical Raiment",2,[[[17,0,75],[18,0,75]],[[93,0,30]]]],"Angelic Mantle":["Angelical Raiment",2,[[[31,0,150]],[[39,0,50]]]],"Angelic Halo":["Angelical Raiment",2,[[[224,0,12]],[[80,0,50]]]],"Angelic Wings":["Angelical Raiment",2,[[[7,0,75]],[[127,0,1]]]],"Arctic Horn":["Arctic Gear",2,[[[224,0,8]],[[54,0,20],[55,0,30],[56,0,75]]]],"Arctic Furs":["Arctic Gear",2,[[[214,0,3]],[[43,0,15]]]],"Arctic Binding":["Arctic Gear",2,[[[80,0,40]],[[43,0,10]]]],"Arctic Mitts":["Arctic Gear",2,[[[19,0,50],[156,0,25]],[[2,0,10]]]],"Arcanna's Sign":["Arcanna's Tricks",2,[[[80,0,50]],[[39,0,30]]]],"Arcanna's Deathwand":["Arcanna's Tricks",2,[[[9,0,75]],[[27,0,20]],[[93,0,40]]]],"Arcanna's Head":["Arcanna's Tricks",2,[[[214,0,3]],[[41,0,25]]]],"Arcanna's Flesh":["Arcanna's Tricks",2,[[[31,0,100]],[[1,0,20]],[[27,0,20]]]],"Expansion":["",0,[]],"Natalya's Totem":["Natalya's Odium",2,[[[1,0,20]]]],"Natalya's Mark":["Natalya's Odium",2,[[],[[115,0,1]]]],"Natalya's Shadow":["Natalya's Odium",2,[[],[[83,6,1]]]],"Natalya's Soul":["Natalya's Odium",2,[[],[[137,0,30]]]],"Aldur's Stony Gaze":["Aldur's Watchtower",2,[[[1,0,15]],[[1,0,15]],[[1,0,15]]]],"Aldur's Deception":["Aldur's Watchtower",2,[[[3,0,15]],[[3,0,15]],[[3,0,15]]]],"Aldur's Rhythm":["Aldur's Watchtower",2,[[[0,0,15]],[[0,0,15]],[[0,0,15]]]],"Aldur's Advance":["Aldur's Watchtower",2,[[[2,0,15]],[[2,0,15]],[[2,0,15]]]],"Immortal King's Will":["Immortal King",2,[[],[[36,0,8]]]],"Immortal King's Soul Cage":["Immortal King",2,[[[99,0,25]],[[43,0,40]],[[39,0,40]],[[41,0,40]],[[16,0,50]]]],"Immortal King's Detail":["Immortal King",2,[[[31,0,105]],[[99,0,25]],[[16,0,100]],[[36,0,20]],[[188,33,2]]]],"Immortal King's Forge":["Immortal King",2,[[[93,0,25]],[[31,0,120]],[[60,0,10]],[[62,0,10]],[[134,0,2]]]],"Immortal King's Pillar":["Immortal King",2,[[[80,0,25]],[[188,32,2]],[[31,0,160]],[[118,0,1]]]],"Immortal King's Stone Crusher":["Immortal King",2,[[[48,0,211],[49,0,397]],[[50,0,7],[51,0,477]],[[54,0,127],[55,0,364],[56,0,150]],[[57,0,3490],[58,0,3490],[59,0,50]],[[52,0,250],[53,0,361]]]],"Tal Rasha's Fine-Spun Cloth":["Tal Rasha's Wrappings",2,[[[31,0,60]],[[105,0,10]]]],"Tal Rasha's Adjudication":["Tal Rasha's Wrappings",2,[[],[],[[105,0,10]]]],"Tal Rasha's Lidless Eye":["Tal Rasha's Wrappings",2,[[[83,1,1]],[[333,0,15]],[[334,0,15]],[[331,0,15]]]],"Tal Rasha's Guardianship":["Tal Rasha's Wrappings",2,[[[105,0,10]]]],"Tal Rasha's Horadric Crest":["Tal Rasha's Wrappings",0,[]],"Griswold's Valor":["Griswold's Legacy",2,[[[188,25,2]]]],"Griswold's Heart":["Griswold's Legacy",2,[[[105,0,30]]]],"Griswold's Redemption":["Griswold's Legacy",2,[[[188,24,2]],[[21,0,10],[22,0,20]],[[21,0,10],[22,0,20]]]],"Griswold's Honor":["Griswold's Legacy",2,[[[99,0,30]]]],"Trang-Oul's Guise":["Trang-Oul's Avatar",2,[[[105,0,30]]]],"Trang-Oul's Scales":["Trang-Oul's Avatar",2,[[],[[41,0,50]],[[36,0,25]]]],"Trang-Oul's Wing":["Trang-Oul's Avatar",2,[[],[[336,0,25]]]],"Trang-Oul's Claws":["Trang-Oul's Avatar",2,[[],[],[[97,56,20]]]],"Trang-Oul's Girth":["Trang-Oul's Avatar",2,[[],[[43,0,40]]]],"M'avina's True Sight":["M'avina's Battle Hymn",2,[[[127,0,1]],[[119,0,50]],[[39,0,25],[41,0,25],[43,0,25],[45,0,25]],[[329,0,5]]]],"M'avina's Embrace":["M'avina's Battle Hymn",2,[[[96,0,30]],[[99,0,30]]]],"M'avina's Icy Clutch":["M'avina's Battle Hymn",2,[[],[],[[54,0,131],[55,0,252],[56,0,100]],[[331,0,5]]]],"M'avina's Tenet":["M'avina's Battle Hymn",2,[[],[],[[39,0,25],[41,0,25],[43,0,25],[45,0,25]]]],"M'avina's Caster":["M'avina's Battle Hymn",2,[[[52,0,228],[53,0,754]],[],[[188,0,2]]]],"Telling of Beads":["The Disciple",2,[[],[[9,0,100]]]],"Laying of Hands":["The Disciple",2,[[[57,0,1127],[58,0,1127],[59,0,50]]]],"Rite of Passage":["The Disciple",2,[[],[[99,0,20]]]],"Dark Adherent":["The Disciple",2,[]],"Credendum":["The Disciple",2,[[],[[99,0,20]]]],"Dangoon's Teaching":["Heaven's Brethren",2,[[],[[127,0,2]]]],"Taebaek's Glory":["Heaven's Brethren",2,[[],[[127,0,1]]]],"Haemosu's Adamant":["Heaven's Brethren",2,[[[105,0,20]]]],"Ondal's Almighty":["Heaven's Brethren",2,[[[105,0,20]]]],"Guillaume's Face":["Orphan's Call",2,[[],[[116,0,20]]]],"Wilhelm's Pride":["Orphan's Call",2,[[],[[121,0,150]]]],"Magnus' Skin":["Orphan's Call",2,[[],[[122,0,150]]]],"Whitstan's Guard":["Orphan's Call",2,[[],[[17,0,150],[18,0,150]]]],"Hwanin's Splendor":["Hwanin's Majesty",0,[]],"Hwanin's Refuge":["Hwanin's Majesty",0,[]],"Hwanin's Blessing":["Hwanin's Majesty",0,[]],"Hwanin's Justice":["Hwanin's Majesty",2,[]],"Sazabi's Cobalt Redeemer":["Sazabi's Grand Tribute",0,[]],"Sazabi's Ghost Liberator":["Sazabi's Grand Tribute",2,[[[74,0,30]]]],"Sazabi's Mental Sheath":["Sazabi's Grand Tribute",0,[]],"Bul-Kathos' Sacred Charge":["Bul-Kathos' Children",2,[[[93,0,30]]]],"Bul-Kathos' Tribal Guardian":["Bul-Kathos' Children",2,[[[141,0,20]]]],"Bul-Kathos' Death Band":["Bul-Kathos' Children",2,[[[153,0,1]]]],"Cow King's Horns":["Cow King's Leathers",0,[]],"Cow King's Hide":["Cow King's Leathers",0,[]],"Cow King's Hooves":["Cow King's Leathers",0,[]],"Naj's Puzzler":["Naj's Ancient Set",0,[]],"Naj's Light Plate":["Naj's Ancient Set",2,[[[105,0,20]]]],"Naj's Circlet":["Naj's Ancient Set",2,[[[127,0,1]]]],"Sander's Paragon":["McAuley's Folly",0,[]],"Sander's Riprap":["McAuley's Folly",0,[]],"Sander's Taboo":["McAuley's Folly",0,[]],"Sander's Superstition":["McAuley's Folly",2,[[[127,0,2]]]]},"sets":{"Civerb's Vestments":["Civerb's Vestments",["Civerb's Ward","Civerb's Icon","Civerb's Cudgel"],{"2":[[39,0,25]]},[[0,0,15],[122,0,100],[41,0,25],[36,0,10]]],"Hsarus' Defense":["Hsarus' Defense",["Hsarus' Iron Heel","Hsarus' Iron Fist","Hsarus' Iron Stay"],{"2":[[78,0,9]]},[[22,0,5],[24,0,5],[160,0,5],[153,0,1],[41,0,25]]],"Cleglaw's Brace":["Cleglaw's Brace",["Cleglaw's Tooth","Cleglaw's Claw","Cleglaw's Pincers"],{"2":[[31,0,50]]},[[31,0,50],[62,0,6],[136,0,35],[93,0,20]]],"Iratha's Finery":["Iratha's Finery",["Iratha's Collar","Iratha's Cuff","Iratha's Coil","Iratha's Cord"],{"2":[[31,0,50]],"3":[[96,0,20]]},[[39,0,20],[41,0,20],[43,0,20],[45,0,20],[40,0,2],[44,0,2],[42,0,2],[46,0,2],[2,0,15]]],"Isenhart's Armory":["Isenhart's Armory",["Isenhart's Lightbrand","Isenhart's Parry","Isenhart's Case","Isenhart's Horns"],{"2":[[0,0,10]],"3":[[2,0,10]]},[[60,0,5],[119,0,35],[20,0,30],[96,0,20],[39,0,10],[41,0,10],[43,0,10],[45,0,10]]],"Vidala's Rig":["Vidala's Rig",["Vidala's Barb","Vidala's Fetlock","Vidala's Ambush","Vidala's Snare"],{"2":[[19,0,75]],"3":[[2,0,15]]},[[54,0,15],[55,0,20],[56,0,50],[134,0,1],[156,0,30],[0,0,10]]],"Milabrega's Regalia":["Milabrega's Regalia",["Milabrega's Orb","Milabrega's Rod","Milabrega's Diadem","Milabrega's Robe"],{"2":[[19,0,75]],"3":[[19,0,125]]},[[60,0,8],[83,3,2],[62,0,10],[45,0,15]]],"Cathan's Traps":["Cathan's Traps",["Cathan's Rule","Cathan's Mesh","Cathan's Visage","Cathan's Sigil","Cathan's Seal"],{"2":[[48,0,15],[49,0,20]]},[[93,0,40],[35,0,3],[39,0,25],[41,0,25],[43,0,25],[45,0,25],[105,0,10],[9,0,20],[188,48,2]]],"Tancred's Battlegear":["Tancred's Battlegear",["Tancred's Crowbill","Tancred's Spine","Tancred's Hobnails","Tancred's Weird","Tancred's Skull"],{"2":[[39,0,10],[41,0,10],[43,0,10],[45,0,10]],"3":[[60,0,5]],"4":[[150,0,35]]},[[79,0,75],[228,0,0.75]]],"Sigon's Complete Steel":["Sigon's Complete Steel",["Sigon's Gage","Sigon's Visor","Sigon's Shelter","Sigon's Sabot","Sigon's Wrap","Sigon's Guard"],{"2":[[60,0,10]],"3":[[31,0,100]]},[[39,0,12],[78,0,12],[34,0,7],[49,0,24],[9,0,20]]],"Infernal Tools":["Infernal Tools",["Infernal Cranium","Infernal Spire","Infernal Sign"],{"2":[[138,0,3],[99,0,20]],"3":[[9,0,10]]},[[119,0,20],[83,2,1],[57,0,62],[58,0,62],[59,0,50],[62,0,6]]],"Berserker's Garb":["Berserker's Arsenal",["Berserker's Headgear","Berserker's Hauberk","Berserker's Hatchet"],{"2":[[7,0,50]]},[[110,0,75],[57,0,45],[58,0,58],[59,0,75],[31,0,75],[83,4,1],[96,0,20]]],"Death's Disguise":["Death's Disguise",["Death's Hand","Death's Guard","Death's Touch"],{"2":[[60,0,8]]},[[119,0,40],[21,0,10],[23,0,10],[159,0,10],[39,0,25],[41,0,25],[43,0,25],[45,0,25]]],"Angelical Raiment":["Angelic Raiment",["Angelic Sickle","Angelic Mantle","Angelic Halo","Angelic Wings"],{"2":[[2,0,10]],"3":[[9,0,50]]},[[39,0,25],[41,0,25],[43,0,25],[45,0,25],[153,0,1],[80,0,40],[27,0,8]]],"Arctic Gear":["Arctic Gear",["Arctic Horn","Arctic Furs","Arctic Binding","Arctic Mitts"],{"2":[[0,0,5]],"3":[[7,0,50]]},[[54,0,6],[55,0,14],[56,0,100],[153,0,1],[156,0,30]]],"Arcanna's Tricks":["Arcanna's Tricks",["Arcanna's Sign","Arcanna's Deathwand","Arcanna's Head","Arcanna's Flesh"],{"2":[[9,0,25]],"3":[[7,0,50]]},[[105,0,30],[62,0,5],[9,0,25],[127,0,1]]],"Natalya's Odium":["Natalya's Odium",["Natalya's Totem","Natalya's Mark","Natalya's Shadow","Natalya's Soul"],{"2":[[35,0,12]],"3":[[31,0,200]],"4":[[45,0,20]]},[[39,0,40],[41,0,40],[43,0,40],[45,0,40],[83,6,2],[60,0,8],[62,0,8],[31,0,150],[36,0,20],[181,0,0],[192,0,1]]],"Aldur's Watchtower":["Aldur's Watchtower",["Aldur's Stony Gaze","Aldur's Deception","Aldur's Rhythm","Aldur's Advance"],{"2":[[119,0,150],[105,0,10]],"3":[[80,0,50],[105,0,20]],"4":[[60,0,10]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,5,3],[31,0,150],[62,0,10],[9,0,150],[17,0,350],[18,0,350],[1,0,15]]],"Immortal King":["Immortal King",["Immortal King's Will","Immortal King's Soul Cage","Immortal King's Detail","Immortal King's Forge","Immortal King's Pillar","Immortal King's Stone Crusher"],{"2":[[19,0,50]],"3":[[19,0,75]],"4":[[19,0,125]],"5":[[19,0,200]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,4,3],[7,0,150],[35,0,10],[17,0,100],[18,0,100]]],"Tal Rasha's Wrappings":["Tal Rasha's Wrappings",["Tal Rasha's Fine-Spun Cloth","Tal Rasha's Adjudication","Tal Rasha's Lidless Eye","Tal Rasha's Guardianship","Tal Rasha's Horadric Crest"],{"2":[[74,0,10]],"3":[[80,0,50]],"4":[[99,0,25]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,1,3],[31,0,150],[7,0,150],[32,0,50]]],"Griswold's Legacy":["Griswold's Legacy",["Griswold's Valor","Griswold's Heart","Griswold's Redemption","Griswold's Honor"],{"2":[[0,0,20]],"3":[[2,0,30]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,3,3],[19,0,200],[7,0,150],[99,0,30],[105,0,20],[80,0,25]]],"Trang-Oul's Avatar":["Trang-Oul's Avatar",["Trang-Oul's Guise","Trang-Oul's Scales","Trang-Oul's Wing","Trang-Oul's Claws","Trang-Oul's Girth"],{"2":[[27,0,20],[97,47,18]],"3":[[27,0,15],[97,51,26]],"4":[[97,47,10]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,2,3],[9,0,100],[60,0,20],[27,0,15],[74,0,10],[97,388,2]]],"M'avina's Battle Hymn":["M'avina's Battle Hymn",["M'avina's True Sight","M'avina's Embrace","M'avina's Icy Clutch","M'avina's Tenet","M'avina's Caster"],{"2":[[0,0,20]],"3":[[2,0,30]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[83,0,2],[31,0,100],[19,0,100],[80,0,100]]],"The Disciple":["The Disciple",["Telling of Beads","Laying of Hands","Rite of Passage","Dark Adherent","Credendum"],{"2":[[31,0,150]],"4":[[0,0,10]],"5":[[2,0,10]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[127,0,2],[9,0,100],[122,0,150],[121,0,150]]],"Heaven's Brethren":["Heaven's Brethren",["Dangoon's Teaching","Taebaek's Glory","Haemosu's Adamant","Ondal's Almighty"],{"2":[[28,0,50]],"3":[[74,0,30]],"4":[[48,0,30],[49,0,30]]},[[39,0,50],[41,0,50],[43,0,50],[45,0,50],[127,0,2],[153,0,1],[89,0,5],[74,0,40],[105,0,20]]],"Orphan's Call":["Orphan's Call",["Guillaume's Face","Wilhelm's Pride","Magnus' Skin","Whitstan's Guard"],{"2":[[7,0,50]],"3":[[78,0,250]],"4":[[31,0,100]]},[[7,0,100],[2,0,10],[0,0,20],[31,0,100],[39,0,30],[41,0,30],[43,0,30],[45,0,30],[80,0,80]]],"Hwanin's Majesty":["Hwanin's Majesty",["Hwanin's Splendor","Hwanin's Refuge","Hwanin's Blessing","Hwanin's Justice"],{"2":[[60,0,10]],"3":[[96,0,30]]},[[127,0,2],[60,0,10],[31,0,300],[39,0,30],[41,0,30],[43,0,30],[45,0,30],[121,0,100]]],"Sazabi's Grand Tribute":["Sazabi's Grand Tribute",["Sazabi's Cobalt Redeemer","Sazabi's Ghost Liberator","Sazabi's Mental Sheath"],{"2":[[96,0,40],[105,0,40]]},[[39,0,30],[41,0,30],[43,0,30],[45,0,30],[60,0,15],[76,0,27],[127,0,2]]],"Bul-Kathos' Children":["Bul-Kathos' Children",["Bul-Kathos' Sacred Charge","Bul-Kathos' Tribal Guardian","Bul-Kathos' Death Band"],{},[[48,0,200],[49,0,200],[127,0,2],[19,0,200],[31,0,500],[122,0,200],[121,0,200],[141,0,25],[136,0,25]]],"Cow King's Leathers":["Cow King's Leathers",["Cow King's Horns","Cow King's Hide","Cow King's Hooves"],{"2":[[45,0,25]]},[[11,0,100],[0,0,20],[79,0,100],[80,0,100],[93,0,30],[97,483,1]]],"Naj's Ancient Set":["Naj's Ancient Vestige",["Naj's Puzzler","Naj's Light Plate","Naj's Circlet"],{"2":[[31,0,175]]},[[127,0,1],[74,0,10],[2,0,15],[39,0,50],[41,0,50],[43,0,50],[45,0,50],[0,0,20],[9,0,100]]],"McAuley's Folly":["Sander's Folly",["Sander's Paragon","Sander's Riprap","Sander's Taboo","Sander's Superstition"],{"2":[[31,0,50]],"3":[[19,0,75]]},[[127,0,1],[80,0,50],[9,0,50],[60,0,4]]]},"life":[12,8,8,12,16,8,12],"lifeLvl":[8,5,6,8,8,6,8],"passive":[[13,99,"lvl",[],[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103]],[141,99,"blvl",[],[0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198]],[263,102,"lvl",["h2h","h2h2"],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99]]]};
  /* armory-data:end */
  const D = ARMORY_DATA;
  const ARMORY = "https://api.projectdiablo2.com/game/character/";
  const CLS = ["ama", "sor", "nec", "pal", "bar", "dru", "ass"];
  const CLS_NAME = {ama: "Amazon", sor: "Sorceress", nec: "Necromancer", pal: "Paladin", bar: "Barbarian", dru: "Druid",
    ass: "Assassin"};
  const P = new Set(D.p || []);
  const TYPES = {};
  Object.keys(D.types || {}).forEach(k => D.types[k].forEach(t => { TYPES[t] = k; }));
  // the armory's own names: [stat id, value index] each
  const PSEUDO = {
    all_attributes: [[0, 0], [1, 0], [2, 0], [3, 0]],
    all_resist: [[39, 0], [41, 0], [43, 0], [45, 0]],
    maxdamage_percent: [[17, 0], [18, 0]],
    // "+X to Minimum / Maximum Damage": one-handed, two-handed and thrown alike (Properties' dmg-min / dmg-max)
    min_damage: [[21, 0], [23, 0], [159, 0]],
    max_damage: [[22, 0], [24, 0], [160, 0]],
    firedam: [[48, 0], [49, 1]],
    lightdam: [[50, 0], [51, 1]],
    magicdam: [[52, 0], [53, 1]],
    colddam: [[54, 0], [55, 1], [56, 2]],
  };
  // "+N to Fire Skills" (PD2's stats 362-366) raise the skills of that EType: the author's character screen showed
  // Fists of Fire (EType fire) at 40 with Firelizard's Talons' +4 (2026-11-20). null would leave them out with a note.
  const ELEMENT_SKILLS = true;  // the author's Fists of Fire read 40 on the character screen with the claws' +4 (2026-11-20)
  const ELEMENT_STAT = {362: "cold", 363: "fire", 364: "ltng", 365: "pois", 366: "mag"};
  const WEREWOLF = 223, WEREBEAR = 228, BATTLE_ORDERS = 149;
  const HAND = {4: [0, 0], 5: [0, 1], 11: [1, 0], 12: [1, 1]};  // equipment_id: [weapon set, 0 right / 1 left]
  const HAND_NAME = {"Right Hand": 4, "Left Hand": 5, "Right Hand Switch": 11, "Left Hand Switch": 12};

  function fail(kind, extra) {
    const e = new Error(kind);
    e.kind = kind;
    if (extra) Object.assign(e, extra);
    return e;
  }

  function add(st, sp, id, par, val) {
    if (typeof val !== "number" || !isFinite(val)) return;
    if (P.has(id)) {
      const row = sp[id] || (sp[id] = {});
      row[par] = (row[par] || 0) + val;
    } else {
      st[id] = (st[id] || 0) + val;
    }
  }

  // one stat line, as [stat id, param, value] rows; a per-level stat folded into the stats it adds to at level lvl
  function put(st, sp, id, par, val, lvl) {
    const per = D.per && D.per[id];
    if (per && !P.has(id)) {
      const scale = Math.pow(2, per[0]), raw = Math.round(val * scale), n = Math.floor(raw * lvl / scale);
      per[1].forEach(t => add(st, sp, t, 0, n));
      return;
    }
    add(st, sp, id, par, val);
  }

  function statsOf(it, lvl, notes) {
    const st = {}, sp = {};
    (it.modifiers || []).forEach(m => {
      const v = Array.isArray(m.values) ? m.values : [];
      // poison as the armory shows it, [total min, total max, seconds]: back to the game's stats, a frame's in 256ths
      // (57 / 58) for 59 frames, and one poison source (326, poison_count: the game averages their lengths)
      if (m.name === "poisondam") {
        /* what is socketed with poison (Rainbow Facets: +37 over 2 s; Tal): the armory adds the sockets' damage to the
           item's own minimum, scaled to the item's seconds, but keeps one maximum and one length (2026-11-25: Plague
           Bearer, 300 over 3 s, with four facets read [519, 300, 3]; Spectral Plate, none of its own, with three
           [110, 37, 2]). The game holds each as a source of its own (57 / 58 a frame, 59 its length, 326 one more
           source), so the sockets' poison goes back in as theirs and the item's own is what is left of the minimum */
        const socks = [];
        (Array.isArray(it.socketed) ? it.socketed : []).forEach(s => ((s && s.modifiers) || []).forEach(q => {
          if (q.name === "poisondam" && Array.isArray(q.values) && +q.values[2] > 0) socks.push(q.values.map(Number));
        }));
        const src = (lo, hi, sec) => {
          const len = Math.round(sec * 25);
          if (!(len > 0) || !(hi > 0)) return;
          put(st, sp, 57, 0, Math.floor(lo * 256 / len), lvl);
          put(st, sp, 58, 0, Math.floor(hi * 256 / len), lvl);
          put(st, sp, 59, 0, len, lvl);
          put(st, sp, 326, 0, 1, lvl);
        };
        if (!socks.length) { src(+v[0] || 0, +v[1] || 0, +v[2] || 0); return; }
        const own = (+v[0] || 0) - socks.reduce((t, s) => t + s[0] * (+v[2] || 0) / s[2], 0);
        if (own > 1.5) src(Math.min(own, +v[1] || 0), +v[1] || 0, +v[2] || 0);
        socks.forEach(s => src(s[0], s[1], s[2]));
        return;
      }
      const pseudo = PSEUDO[m.name];
      if (pseudo) {
        pseudo.forEach(([id, i]) => { if (typeof v[i] === "number") put(st, sp, id, 0, v[i], lvl); });
        return;
      }
      const id = D.stats ? D.stats[m.name] : undefined;
      if (id === undefined) {
        notes.push((m.label || m.name) + " (" + (it.name || "an item") + ")");
        return;
      }
      if (P.has(id)) {
        if (v.length === 2) put(st, sp, id, v[0], v[1], lvl);
        else if (v.length === 1) put(st, sp, id, 0, v[0], lvl);
        // 3 or 4 values: chance to cast, charges, splash: nothing the calculators count
      } else if (v.length) {
        put(st, sp, id, 0, v[0], lvl);
      }
    });
    socketedMax(it, st);
    return {st, sp};
  }

  /* elemental damage on a socketed item: the armory adds what is socketed to the item's own minimum but keeps the
     item's own maximum (2026-11-24: the author's Firelizard's Talons, 236-480 fire, with three Rainbow Facets of 17-45
     read [287, 480], where the game has 287-615: the author's BH stats screen showed 355-762 with the 24% fire
     mastery). An item with none of its own reads its sockets' (Call to Arms' Ral: [5, 30]). So a pair whose minimum
     isn't the sockets' alone gets their maxima added. */
  const ELEM_MAX = {firedam: 49, lightdam: 51, magicdam: 53, colddam: 55};
  function socketedMax(it, st) {
    const socks = Array.isArray(it.socketed) ? it.socketed : [];
    Object.keys(ELEM_MAX).forEach(name => {
      let lo = 0, hi = 0, n = 0;
      socks.forEach(s => ((s && s.modifiers) || []).forEach(m => {
        if (m.name === name && Array.isArray(m.values)) { lo += +m.values[0] || 0; hi += +m.values[1] || 0; n++; }
      }));
      const own = n ? (it.modifiers || []).find(m => m.name === name && Array.isArray(m.values)) : null;
      if (!own) return;
      const min = +own.values[0] || 0, max = +own.values[1] || 0, id = ELEM_MAX[name];
      st[id] = (st[id] || 0) - max + (min === lo ? Math.max(max, hi) : max + hi);
    });
  }

  function itemOf(it, lvl, notes) {
    const code = it.base_code || (it.base && it.base.id) || "";
    const type = (it.base && it.base.type_code) || "";
    const kind = D.weapons && D.weapons[code] ? "weapon" : TYPES[type] === "shield" ? "shield" :
      TYPES[type] === "quiver" ? "quiver" : "other";
    const s = statsOf(it, lvl, notes);
    return {code, type, kind, name: String(it.name || ""), quality: (it.quality && it.quality.name) || "",
      eth: !!it.is_ethereal, rw: !!it.is_runeword, slot: (it.location && it.location.equipment) || "",
      wclass: it.base && it.base.class ? [it.base.class.base_code || "", it.base.class["2hd_code"] || ""] : null,
      st: s.st, sp: s.sp};
  }

  function sum(into, intoSp, st, sp) {
    Object.keys(st).forEach(id => { into[id] = (into[id] || 0) + st[id]; });
    Object.keys(sp).forEach(id => Object.keys(sp[id]).forEach(par => {
      const row = intoSp[id] || (intoSp[id] = {});
      row[par] = (row[par] || 0) + sp[id][par];
    }));
  }

  function read(json) {
    if (!json || typeof json !== "object" || !json.character || !Array.isArray(json.items)) throw fail("paste");
    const ch = json.character, notes = [];
    const cls = CLS[ch.class && ch.class.id];
    if (!cls) throw fail("paste");
    const lvl = Math.max(1, Math.min(99, Number(ch.level) || 1));
    const C = {
      name: String(ch.name || ""), cls, clsName: CLS_NAME[cls], lvl,
      hc: !!(ch.status && ch.status.is_hardcore), ladder: !!(ch.status && ch.status.is_ladder),
      dead: !!(ch.status && ch.status.is_dead),
      saved: json.file && json.file.updated_at ? json.file.updated_at * 1000 : 0,
      life: Number(ch.life) || 0, mana: Number(ch.mana) || 0,
      base: {str: 0, dex: 0, vit: 0, ene: 0},
      skills: [], worn: [], hands: [[null, null], [null, null]], charms: [],
      failed: Array.isArray(json.failed_items) ? json.failed_items.length : 0, notes,
    };
    const a = ch.attributes || {};
    C.base = {str: Number(a.strength) || 0, dex: Number(a.dexterity) || 0, vit: Number(a.vitality) || 0,
      ene: Number(a.energy) || 0};
    (ch.skills || []).forEach(s => {
      const id = Number(s.id), base = Number(s.level) || 0;
      if (base > 0 && D.skills && D.skills[id]) C.skills.push({id, base});
    });
    json.items.forEach(it => {
      const loc = it.location || {};
      if (loc.zone === "Equipped" || loc.storage_id === 0 && loc.zone_id === 1) {
        const eq = Number(loc.equipment_id) || HAND_NAME[loc.equipment] || 0;
        const I = itemOf(it, lvl, notes);
        const h = HAND[eq];
        if (h) C.hands[h[0]][h[1]] = I;
        else C.worn.push(I);
      } else if (loc.zone === "Stored" && loc.storage_id === 1 && TYPES[it.base && it.base.type_code] === "charm") {
        // never by location.equipment: stored charms can carry a stale "Belt" there
        C.charms.push(itemOf(it, lvl, notes));
      }
    });
    C.sets = [0, 1].map(k => ({label: setLabel(C.hands[k]), inHand: k === 0}));
    // the set in hand when saved, unless only it holds Battle Orders (a Call to Arms swap)
    const bo = k => C.hands[k].some(I => I && I.sp[97] && I.sp[97][BATTLE_ORDERS] > 0);
    const empty = k => !C.hands[k][0] && !C.hands[k][1];
    C.def = bo(0) && !bo(1) && !empty(1) ? 1 : 0;
    return C;
  }

  function setLabel(hands) {
    const names = hands.filter(Boolean).map(I => I.name || "an item");
    return names.length ? names.join(" and ") : "no weapon";
  }

  function setBonuses(worn) {
    const own = {}, count = {}, rows = [], worn2 = [];
    worn.forEach(I => {
      if (I.quality === "Set" && D.setItems && D.setItems[I.name] && !own[I.name]) own[I.name] = D.setItems[I.name];
    });
    Object.keys(own).forEach(n => { const s = own[n][0]; count[s] = (count[s] || 0) + 1; });
    Object.keys(own).forEach(n => {
      const [s, func, slots] = own[n], c = count[s];
      if (func === 2) {
        slots.forEach((slot, i) => { if (c >= i + 2) rows.push(...slot); });
      } else if (func === 1) {  // one bonus per other item of the set worn, in the set's order
        const others = ((D.sets[s] || [])[1] || []).filter(x => x !== n);
        slots.forEach((slot, i) => { if (others[i] && own[others[i]]) rows.push(...slot); });
      }
    });
    Object.keys(count).forEach(s => {
      const set = D.sets && D.sets[s];
      if (!set) return;
      const [name, items, partial, full] = set;
      for (let n = 2; n <= count[s]; n++) if (partial[n]) rows.push(...partial[n]);
      if (count[s] >= items.length) rows.push(...full);
      worn2.push({set: name, n: count[s], of: items.length});
    });
    return {rows, worn: worn2};
  }

  function weaponClass(cls, weapons, other) {
    const w = weapons[0];
    if (!w) return "hth";
    const a = D.weapons[w.code] || (w.wclass ? [w.wclass[0], w.wclass[1], 0] : null);
    if (!a) return "hth";
    if (weapons[1]) {
      if (cls === "ass") return "ht2";
      if (cls === "bar") {
        const b = D.weapons[weapons[1].code] || [""], x = a[0], y = b[0];
        if (x === "1hs") return y === "1ht" ? "1js" : "1ss";
        if (x === "1ht") return y === "1ht" ? "1jt" : y === "1hs" ? "1st" : "1ss";
        return "1ss";
      }
    }
    if (a[2] & 2) return (a[2] & 1) && cls === "bar" && other ? a[0] : a[1] || a[0];
    return a[0];
  }

  // what set k wears in all: the items, the charms, the set bonuses
  function totals(C, k) {
    const hands = C.hands[k], items = C.worn.concat(hands.filter(Boolean));
    const st = {}, sp = {};
    items.concat(C.charms).forEach(I => sum(st, sp, I.st, I.sp));
    const sb = setBonuses(items), bonus = {}, bonusSp = {};
    sb.rows.forEach(([id, par, val]) => put(bonus, bonusSp, id, par, val, C.lvl));
    sum(st, sp, bonus, bonusSp);
    return {hands, items, st, sp, worn: sb.worn};
  }

  // skill levels: the points put in, then + all skills, + the class's skills, + the skill's tab, + the skill itself
  // (class only) and oskills, once the character has the skill (points, or an item giving it); another class's skill
  // an oskill gives: its level + all skills (the author's game, 2026-11-24: a Call to Arms' +4 Battle Command on an
  // Assassin with +8 to all skills on that weapon set reads level 12), never the class's or a tab's
  function skillsOf(C, st, sp, notes) {
    const all = st[127] || 0, cls = CLS.indexOf(C.cls), clsSk = ((sp[83] || {})[cls]) || 0;
    const tabs = sp[188] || {}, one = sp[107] || {}, osk = sp[97] || {}, skills = {};
    const elem = {};
    Object.keys(ELEMENT_STAT).forEach(id => {
      const n = Object.keys(sp[id] || {}).reduce((t, par) => t + sp[id][par], 0) + (st[id] || 0);
      if (n) elem[ELEMENT_STAT[id]] = n;
    });
    const has = {};
    C.skills.forEach(s => { has[s.id] = s.base; });
    Object.keys(one).concat(Object.keys(osk)).forEach(id => { if (!(id in has)) has[id] = 0; });
    Object.keys(has).forEach(id => {
      const info = D.skills[id], base = has[id], o = (osk[id] || 0), s1 = (one[id] || 0);
      if (!info || info[0] !== cls) {
        if (o > 0) skills[id] = {base: 0, total: o + all};
        return;
      }
      if (base + o + s1 <= 0) return;
      let total = base + all + clsSk + (info[1] >= 0 ? (tabs[info[1]] || 0) : 0) + s1 + o;
      if (ELEMENT_SKILLS && elem[info[3]]) total += elem[info[3]];
      skills[id] = {base, total};
    });
    if (ELEMENT_SKILLS === null && notes) {
      Object.keys(elem).forEach(e => notes.push("+" + elem[e] + " to " + ({cold: "Cold", fire: "Fire", ltng: "Lightning",
        pois: "Poison", mag: "Magic"})[e] + " Skills (not in the skill levels yet)"));
    }
    return skills;
  }

  /* life. The armory's is the save's, with the weapon set in hand then (set 0), rounded to a whole point: the game keeps
     life in 256ths and the character screen drops the fraction, so the two can be 1 apart (the author's, 2026-11-24:
     the screen's 1,805, the armory's 1,806, from 1,672 x 1.08 = 1,805.76 with Siggard's Staunch's 8% maximum life). The
     life before the % maximum life is whole but for the class's part of a point a level (CharStats' LifePerLevel in
     quarters: a Sorceress's 1.25, a Necromancer's or Druid's 1.5), so it is found back from the armory's, and the
     screen's whole points worked out from it. The other set's: that life with the flat life and Vitality that differ,
     the other set's % on it (Milabrega's Orb's +50: 1,722 x 1.08 = 1,859.76, so 1,859; pd2.tools read 1,860). */
  function lifeRaw(base, pct) {
    const b = Math.round(base * 256);
    return (b + Math.trunc(b * pct / 100)) / 256;
  }
  function baseLife(C, t0) {
    const pct = t0.st[76] || 0;
    const f = ((((D.lifeLvl || [])[CLS.indexOf(C.cls)] || 0) * (C.lvl - 1)) % 4) / 4;
    const k = Math.floor(C.life / (1 + pct / 100) - f);
    for (const n of [k, k + 1, k - 1, k + 2]) if (Math.round(lifeRaw(n + f, pct)) === C.life) return n + f;
    return C.life / (1 + pct / 100);   // not found back: the armory's as it is
  }
  function lifeOf(C, t, t0) {
    const perVit = ((D.life || [])[CLS.indexOf(C.cls)] || 0) / 4;
    const base = baseLife(C, t0) + ((t.st[7] || 0) - (t0.st[7] || 0)) + ((t.st[3] || 0) - (t0.st[3] || 0)) * perVit;
    return Math.max(1, Math.floor(lifeRaw(base, t.st[76] || 0) + 1e-9));
  }

  function view(C, k) {
    k = k === 1 ? 1 : 0;
    const notes = C.notes.slice(), t = totals(C, k), t0 = k ? totals(C, 0) : t;
    const {hands, items, st, sp} = t;
    const weapons = [hands[0], hands[1]].filter(I => I && I.kind === "weapon");
    const shield = hands.find(I => I && I.kind === "shield") || null;
    const quiver = hands.find(I => I && I.kind === "quiver") || null;
    const other = Object.assign({}, st), otherSp = JSON.parse(JSON.stringify(sp));
    weapons.forEach(I => {
      Object.keys(I.st).forEach(id => { other[id] -= I.st[id]; if (!other[id]) delete other[id]; });
      Object.keys(I.sp).forEach(id => Object.keys(I.sp[id]).forEach(par => {
        otherSp[id][par] -= I.sp[id][par];
        if (!otherSp[id][par]) delete otherSp[id][par];
      }));
    });
    const attr = {str: C.base.str + (st[0] || 0), dex: C.base.dex + (st[2] || 0), vit: C.base.vit + (st[3] || 0),
      ene: C.base.ene + (st[1] || 0)};
    const skills = skillsOf(C, st, sp, notes);
    const t1 = totals(C, 1 - k), swap = skillsOf(C, t1.st, t1.sp, null);
    const hard = id => (skills[id] && skills[id].base) || 0;
    const wolf = hard(WEREWOLF), bear = hard(WEREBEAR);
    const form = C.cls !== "dru" || Math.max(wolf, bear) < 2 ? "human" : wolf >= bear ? "wolf" : "bear";
    const slot = n => items.find(I => I.slot === n) || null;
    const offhand = hands.some(I => I && I !== weapons[0]);
    /* the class's passive skills that raise faster cast rate, hit recovery or block rate (ARMORY_DATA.passive: PD2's
       Dodge, Combat Reflexes, Weapon Block), which the gear's totals leave out: on while the character has the skill,
       with the item type in hand it needs (Weapon Block: a claw). The author's Assassin, 2026-11-24: 70 faster block
       rate on gear and Weapon Block's 18 (level 18 with + skills), 88 on the BH stats screen. */
    const passive = {}, passiveFrom = {};
    (D.passive || []).forEach(([id, stat, by, itypes, vals]) => {
      const s = skills[id];
      if (!s || !(s.total > 0)) return;
      if (itypes.length && !weapons.some(I => itypes.includes(I.type))) return;
      const v = vals[Math.max(0, Math.min(vals.length - 1, by === "blvl" ? s.base : s.total))] || 0;
      if (v) { passive[stat] = (passive[stat] || 0) + v; (passiveFrom[stat] = passiveFrom[stat] || []).push(id); }
    });
    return {
      name: C.name, cls: C.cls, clsName: C.clsName, lvl: C.lvl, saved: C.saved, hc: C.hc, dead: C.dead,
      life: lifeOf(C, t, t0), mana: C.mana, k, sets: C.sets, weapons, shield, quiver, boots: slot("Boots"),
      armor: slot("Armor"), items, st, sp, other, otherSp, attr, skills, swap, form, passive, passiveFrom,
      wc: weaponClass(C.cls, weapons, offhand), worn: t.worn, failed: C.failed, notes,
      // a skill's {base, total} (0 / 0 when the character hasn't it); the other weapon set's (a precast's: Battle
      // Command from a Call to Arms on the swap)
      skill: id => skills[id] || {base: 0, total: 0},
      swapSkill: id => swap[id] || {base: 0, total: 0},
      /* of these skill ids, the character's main one: the most points put in; a tie (a skill and its maxed
         synergies) goes to the skill the others are synergies of (Zeal over Sacrifice, Frenzy over Double Swing),
         then the one without a cooldown (2026-11-25: Fire Ball over Combustion, each the other's synergy; 90 of 230
         Fire Ball Sorceresses loaded as Combustion, cast once in 2.5 seconds), then the one needing the higher level,
         then the higher level with + skills; none with points: null */
      pick(ids) { return this.rank(ids)[0] || null; },
      // the same order for all of them with points (a page takes the first its weapons can do: Dragon Claw needs two
      // claws)
      rank(ids) {
        const pts = id => (skills[id] ? skills[id].base : 0), info = id => D.skills[id] || [];
        const lvl = id => (skills[id] ? skills[id].total : 0);
        const req = id => info(id)[4] || 0, cd = id => info(id)[6] || 0;
        const synOf = (id, group) => group.some(o => o !== id && (info(o)[5] || []).includes(+id));
        return ids.filter(id => pts(id) > 0).sort((a, b) => {
          if (pts(a) !== pts(b)) return pts(b) - pts(a);
          const tie = ids.filter(id => pts(id) === pts(a));
          return (synOf(a, tie) - synOf(b, tie)) || cd(a) - cd(b) || req(b) - req(a) || lvl(b) - lvl(a);
        });
      },
      // an aura an item gives while worn ("Level 12 Fanaticism Aura When Equipped": stats 151 and PD2's 191)
      aura: id => Math.max(((sp[151] || {})[id]) || 0, ((sp[191] || {})[id]) || 0),
    };
  }

  function site(name) {
    return ARMORY + encodeURIComponent(String(name || "").trim());
  }

  const NAME = /^[A-Za-z][A-Za-z_-]{1,14}$/;

  // a character by name through our Worker (proxy: its address, erazure.js's ARMORY_PROXY)
  async function get(name, proxy) {
    name = String(name || "").trim();
    if (!NAME.test(name)) throw fail("name", {name});
    if (!proxy) throw fail("noproxy", {name});
    let res;
    try {
      res = await fetch(String(proxy).replace(/\/+$/, "") + "/character/" + encodeURIComponent(name), {cache: "no-store"});
    } catch (e) {
      throw fail("network", {name});
    }
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    if (!res.ok) {
      // the armory's own answer for a name it doesn't know or a save it can't read
      const missing = json && (json.name === "GeneralError" || /parse character/i.test(json.message || ""));
      throw fail(missing || res.status === 404 ? "missing" : "network", {name, status: res.status});
    }
    return read(json);
  }

  function parse(text) {
    let json;
    try { json = JSON.parse(String(text || "").trim()); } catch (e) { throw fail("paste"); }
    if (json && json.name === "GeneralError") throw fail("missing");
    return read(json);
  }

  window.ezArmory = {
    api: 1, NAME, site, get, parse, read, view,
    className: code => CLS_NAME[code] || "",
    skillName: id => (D.skills[id] || [])[2] || "",
  };
})();
