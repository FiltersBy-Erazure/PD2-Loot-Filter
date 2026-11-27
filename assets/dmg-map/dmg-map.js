
(function () {
  "use strict";
  /* fight:start */
  // where the page's script came from (on the website its own copy, assets/dmg-map/): the Fight tab's files lie beside
  // the page (opened as a file: "", the folder next to it)
  const SCRIPT_SRC = document.currentScript && document.currentScript.src;
  /* fight:end */
  /* calc-data:start */
  const DATA = {"weapons":[{"code":"hax","name":"Hand Axe","tier":"N","cat":"axe1","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[3,6],"eth":1},{"code":"axe","name":"Axe","tier":"N","cat":"axe1","lvl":0,"str":32,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[4,11],"eth":1},{"code":"2ax","name":"Double Axe","tier":"N","cat":"axe1","lvl":0,"str":43,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[5,13],"eth":1},{"code":"mpi","name":"Military Pick","tier":"N","cat":"axe1","lvl":0,"str":49,"dex":33,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[7,11],"eth":1},{"code":"wax","name":"War Axe","tier":"N","cat":"axe1","lvl":0,"str":67,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[12,20],"eth":1},{"code":"lax","name":"Large Axe","tier":"N","cat":"axe2","lvl":0,"str":35,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[6,13],"wc2":"STF","eth":1},{"code":"bax","name":"Broad Axe","tier":"N","cat":"axe2","lvl":0,"str":48,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[10,18],"wc2":"STF","eth":1},{"code":"btx","name":"Battle Axe","tier":"N","cat":"axe2","lvl":0,"str":54,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[12,32],"wc2":"STF","eth":1},{"code":"gax","name":"Great Axe","tier":"N","cat":"axe2","lvl":0,"str":63,"dex":39,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[9,30],"wc2":"STF","eth":1},{"code":"gix","name":"Giant Axe","tier":"N","cat":"axe2","lvl":0,"str":70,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[22,45],"wc2":"STF","eth":1},{"code":"wnd","name":"Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[2,4],"eth":1},{"code":"ywn","name":"Yew Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[2,8],"eth":1},{"code":"bwn","name":"Bone Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[3,7],"eth":1},{"code":"gwn","name":"Grim Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[5,11],"eth":1},{"code":"clb","name":"Club","tier":"N","cat":"club","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[1,6],"eth":1},{"code":"scp","name":"Scepter","tier":"N","cat":"scep","lvl":0,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[6,11],"eth":1},{"code":"gsc","name":"Grand Scepter","tier":"N","cat":"scep","lvl":0,"str":37,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[8,18],"eth":1},{"code":"wsp","name":"War Scepter","tier":"N","cat":"scep","lvl":0,"str":55,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[12,19],"eth":1},{"code":"spc","name":"Spiked Club","tier":"N","cat":"club","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[5,8],"eth":1},{"code":"mac","name":"Mace","tier":"N","cat":"mace","lvl":0,"str":27,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[3,10],"eth":1},{"code":"mst","name":"Morning Star","tier":"N","cat":"mace","lvl":0,"str":36,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[7,16],"eth":1},{"code":"fla","name":"Flail","tier":"N","cat":"mace","lvl":0,"str":41,"dex":35,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[1,24],"eth":1},{"code":"whm","name":"War Hammer","tier":"N","cat":"ham1","lvl":0,"str":53,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[22,32],"eth":1},{"code":"mau","name":"Maul","tier":"N","cat":"ham2","lvl":0,"str":69,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[30,43],"wc2":"STF","eth":1},{"code":"gma","name":"Great Maul","tier":"N","cat":"ham2","lvl":0,"str":99,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[38,58],"wc2":"STF","eth":1},{"code":"ssd","name":"Short Sword","tier":"N","cat":"swd1","lvl":0,"str":0,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[2,7],"eth":1},{"code":"scm","name":"Scimitar","tier":"N","cat":"swd1","lvl":0,"str":0,"dex":21,"wsm":-20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[2,6],"eth":1},{"code":"sbr","name":"Sabre","tier":"N","cat":"swd1","lvl":0,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[3,8],"eth":1},{"code":"flc","name":"Falchion","tier":"N","cat":"swd1","lvl":0,"str":33,"dex":0,"wsm":20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[9,17],"eth":1},{"code":"crs","name":"Crystal Sword","tier":"N","cat":"swd1","lvl":0,"str":43,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[5,15],"eth":1},{"code":"bsd","name":"Broad Sword","tier":"N","cat":"swd1","lvl":0,"str":48,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[7,14],"eth":1},{"code":"lsd","name":"Long Sword","tier":"N","cat":"swd1","lvl":0,"str":55,"dex":39,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[3,19],"eth":1},{"code":"wsd","name":"War Sword","tier":"N","cat":"swd1","lvl":0,"str":71,"dex":45,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[8,20],"eth":1},{"code":"2hs","name":"Two-Handed Sword","tier":"N","cat":"swd2","lvl":0,"str":35,"dex":27,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[2,9],"d2":[8,17],"wc2":"2HS","eth":1},{"code":"clm","name":"Claymore","tier":"N","cat":"swd2","lvl":0,"str":47,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[5,12],"d2":[13,30],"wc2":"2HS","eth":1},{"code":"gis","name":"Giant Sword","tier":"N","cat":"swd2","lvl":0,"str":56,"dex":34,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[3,16],"d2":[9,28],"wc2":"2HS","eth":1},{"code":"bsw","name":"Bastard Sword","tier":"N","cat":"swd2","lvl":0,"str":62,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[7,19],"d2":[20,28],"wc2":"2HS","eth":1},{"code":"flb","name":"Flamberge","tier":"N","cat":"swd2","lvl":0,"str":70,"dex":49,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[9,15],"d2":[13,26],"wc2":"2HS","eth":1},{"code":"gsd","name":"Great Sword","tier":"N","cat":"swd2","lvl":0,"str":100,"dex":60,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[12,20],"d2":[25,42],"wc2":"2HS","eth":1},{"code":"dgr","name":"Dagger","tier":"N","cat":"dag","lvl":0,"str":0,"dex":0,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[1,4],"eth":1},{"code":"dir","name":"Dirk","tier":"N","cat":"dag","lvl":0,"str":0,"dex":25,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[3,9],"eth":1},{"code":"kri","name":"Kris","tier":"N","cat":"dag","lvl":0,"str":0,"dex":45,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[2,11],"eth":1},{"code":"bld","name":"Blade","tier":"N","cat":"dag","lvl":0,"str":35,"dex":51,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[4,15],"eth":1},{"code":"tkf","name":"Throwing Knife","tier":"N","cat":"tkni","lvl":0,"str":0,"dex":21,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[2,3],"dt":[4,5],"eth":1},{"code":"tax","name":"Throwing Axe","tier":"N","cat":"taxe","lvl":0,"str":0,"dex":40,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[4,7],"dt":[7,8],"eth":1},{"code":"bkf","name":"Balanced Knife","tier":"N","cat":"tkni","lvl":0,"str":0,"dex":51,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[1,8],"dt":[6,11],"eth":1},{"code":"bal","name":"Balanced Axe","tier":"N","cat":"taxe","lvl":0,"str":0,"dex":57,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[5,10],"dt":[12,15],"eth":1},{"code":"jav","name":"Javelin","tier":"N","cat":"jave","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[1,5],"dt":[6,10],"eth":1},{"code":"pil","name":"Pilum","tier":"N","cat":"jave","lvl":0,"str":0,"dex":45,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[4,9],"dt":[7,20],"eth":1},{"code":"ssp","name":"Short Spear","tier":"N","cat":"jave","lvl":0,"str":40,"dex":40,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[2,13],"dt":[10,22],"eth":1},{"code":"glv","name":"Glaive","tier":"N","cat":"jave","lvl":0,"str":52,"dex":35,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[5,17],"dt":[16,22],"eth":1},{"code":"tsp","name":"Throwing Spear","tier":"N","cat":"jave","lvl":0,"str":0,"dex":65,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[5,15],"dt":[12,30],"eth":1},{"code":"spr","name":"Spear","tier":"N","cat":"spea","lvl":0,"str":0,"dex":20,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[3,15],"wc2":"2HT","eth":1},{"code":"tri","name":"Trident","tier":"N","cat":"spea","lvl":0,"str":38,"dex":24,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[9,15],"wc2":"2HT","eth":1},{"code":"brn","name":"Brandistock","tier":"N","cat":"spea","lvl":0,"str":40,"dex":50,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[7,17],"wc2":"2HT","eth":1},{"code":"spt","name":"Spetum","tier":"N","cat":"spea","lvl":0,"str":54,"dex":35,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[15,23],"wc2":"2HT","eth":1},{"code":"pik","name":"Pike","tier":"N","cat":"spea","lvl":0,"str":60,"dex":45,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[14,63],"wc2":"2HT","eth":1},{"code":"bar","name":"Bardiche","tier":"N","cat":"pole","lvl":0,"str":40,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[1,27],"wc2":"STF","eth":1},{"code":"vou","name":"Voulge","tier":"N","cat":"pole","lvl":0,"str":50,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[6,21],"wc2":"STF","eth":1},{"code":"scy","name":"Scythe","tier":"N","cat":"pole","lvl":0,"str":41,"dex":41,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[8,20],"wc2":"STF","eth":1},{"code":"pax","name":"Poleaxe","tier":"N","cat":"pole","lvl":0,"str":62,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[18,39],"wc2":"STF","eth":1},{"code":"hal","name":"Halberd","tier":"N","cat":"pole","lvl":0,"str":75,"dex":47,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[12,45],"wc2":"STF","eth":1},{"code":"wsc","name":"War Scythe","tier":"N","cat":"pole","lvl":0,"str":80,"dex":80,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[15,36],"wc2":"STF","eth":1},{"code":"sst","name":"Short Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[1,5],"wc2":"STF","eth":1},{"code":"lst","name":"Long Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[2,8],"wc2":"STF","eth":1},{"code":"cst","name":"Gnarled Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[4,12],"wc2":"STF","eth":1},{"code":"bst","name":"Battle Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[6,13],"wc2":"STF","eth":1},{"code":"wst","name":"War Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[12,28],"wc2":"STF","eth":1},{"code":"sbw","name":"Short Bow","tier":"N","cat":"bow","lvl":0,"str":0,"dex":15,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[1,4],"wc2":"BOW"},{"code":"hbw","name":"Hunter's Bow","tier":"N","cat":"bow","lvl":0,"str":0,"dex":28,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[2,6],"wc2":"BOW"},{"code":"lbw","name":"Long Bow","tier":"N","cat":"bow","lvl":0,"str":22,"dex":19,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[5,10],"wc2":"BOW"},{"code":"cbw","name":"Composite Bow","tier":"N","cat":"bow","lvl":0,"str":25,"dex":35,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[5,9],"wc2":"BOW"},{"code":"sbb","name":"Short Battle Bow","tier":"N","cat":"bow","lvl":0,"str":30,"dex":40,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[6,12],"wc2":"BOW"},{"code":"lbb","name":"Long Battle Bow","tier":"N","cat":"bow","lvl":0,"str":40,"dex":50,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[7,18],"wc2":"BOW"},{"code":"swb","name":"Short War Bow","tier":"N","cat":"bow","lvl":0,"str":35,"dex":55,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[6,14],"wc2":"BOW"},{"code":"lwb","name":"Long War Bow","tier":"N","cat":"bow","lvl":0,"str":50,"dex":65,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[3,23],"wc2":"BOW"},{"code":"lxb","name":"Light Crossbow","tier":"N","cat":"xbow","lvl":0,"str":21,"dex":27,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[8,11],"wc2":"XBW"},{"code":"mxb","name":"Crossbow","tier":"N","cat":"xbow","lvl":0,"str":40,"dex":33,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[11,19],"wc2":"XBW"},{"code":"hxb","name":"Heavy Crossbow","tier":"N","cat":"xbow","lvl":0,"str":60,"dex":40,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[20,33],"wc2":"XBW"},{"code":"rxb","name":"Repeating Crossbow","tier":"N","cat":"xbow","lvl":0,"str":40,"dex":50,"wsm":-40,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[9,18],"wc2":"XBW"},{"code":"9ha","name":"Hatchet","tier":"X","cat":"axe1","lvl":19,"str":25,"dex":25,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[15,30],"eth":1},{"code":"9ax","name":"Cleaver","tier":"X","cat":"axe1","lvl":22,"str":68,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[14,47],"eth":1},{"code":"92a","name":"Twin Axe","tier":"X","cat":"axe1","lvl":25,"str":85,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[18,54],"eth":1},{"code":"9mp","name":"Crowbill","tier":"X","cat":"axe1","lvl":25,"str":94,"dex":70,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[21,48],"eth":1},{"code":"9wa","name":"Naga","tier":"X","cat":"axe1","lvl":25,"str":121,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[23,64],"eth":1},{"code":"9la","name":"Military Axe","tier":"X","cat":"axe2","lvl":22,"str":73,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[21,61],"wc2":"STF","eth":1},{"code":"9ba","name":"Bearded Axe","tier":"X","cat":"axe2","lvl":25,"str":92,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[30,70],"wc2":"STF","eth":1},{"code":"9bt","name":"Tabar","tier":"X","cat":"axe2","lvl":25,"str":101,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[35,99],"wc2":"STF","eth":1},{"code":"9ga","name":"Gothic Axe","tier":"X","cat":"axe2","lvl":25,"str":115,"dex":79,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[23,100],"wc2":"STF","eth":1},{"code":"9gi","name":"Ancient Axe","tier":"X","cat":"axe2","lvl":25,"str":125,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[62,122],"wc2":"STF","eth":1},{"code":"9wn","name":"Burnt Wand","tier":"X","cat":"wand","lvl":19,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[8,18],"eth":1},{"code":"9yw","name":"Petrified Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[8,24],"eth":1},{"code":"9bw","name":"Tomb Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[10,22],"eth":1},{"code":"9gw","name":"Grave Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[13,29],"eth":1},{"code":"9cl","name":"Cudgel","tier":"X","cat":"club","lvl":18,"str":25,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[10,30],"eth":1},{"code":"9sc","name":"Rune Scepter","tier":"X","cat":"scep","lvl":19,"str":58,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[18,35],"eth":1},{"code":"9qs","name":"Holy Water Sprinkler","tier":"X","cat":"scep","lvl":25,"str":76,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[20,52],"eth":1},{"code":"9ws","name":"Divine Scepter","tier":"X","cat":"scep","lvl":25,"str":103,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[24,46],"eth":1},{"code":"9sp","name":"Barbed Club","tier":"X","cat":"club","lvl":20,"str":30,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[18,36],"eth":1},{"code":"9ma","name":"Flanged Mace","tier":"X","cat":"mace","lvl":23,"str":61,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[22,33],"eth":1},{"code":"9mt","name":"Jagged Star","tier":"X","cat":"mace","lvl":25,"str":74,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[29,45],"eth":1},{"code":"9fl","name":"Knout","tier":"X","cat":"mace","lvl":25,"str":82,"dex":73,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[18,50],"eth":1},{"code":"9wh","name":"Battle Hammer","tier":"X","cat":"ham1","lvl":25,"str":100,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[39,60],"eth":1},{"code":"9m9","name":"War Club","tier":"X","cat":"ham2","lvl":25,"str":124,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[69,113],"wc2":"STF","eth":1},{"code":"9gm","name":"Martel de Fer","tier":"X","cat":"ham2","lvl":25,"str":169,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[76,131],"wc2":"STF","eth":1},{"code":"9ss","name":"Gladius","tier":"X","cat":"swd1","lvl":18,"str":25,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[12,32],"eth":1},{"code":"9sm","name":"Cutlass","tier":"X","cat":"swd1","lvl":25,"str":25,"dex":52,"wsm":-30,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[12,30],"eth":1},{"code":"9sb","name":"Shamshir","tier":"X","cat":"swd1","lvl":23,"str":58,"dex":58,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[14,35],"eth":1},{"code":"9fc","name":"Tulwar","tier":"X","cat":"swd1","lvl":25,"str":70,"dex":42,"wsm":20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[23,50],"eth":1},{"code":"9cr","name":"Dimensional Blade","tier":"X","cat":"swd1","lvl":25,"str":85,"dex":60,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[18,51],"eth":1},{"code":"9bs","name":"Battle Sword","tier":"X","cat":"swd1","lvl":25,"str":92,"dex":43,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[23,48],"eth":1},{"code":"9ls","name":"Rune Sword","tier":"X","cat":"swd1","lvl":25,"str":103,"dex":79,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[14,60],"eth":1},{"code":"9wd","name":"Ancient Sword","tier":"X","cat":"swd1","lvl":25,"str":127,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[25,55],"eth":1},{"code":"92h","name":"Espandon","tier":"X","cat":"swd2","lvl":25,"str":73,"dex":61,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[12,37],"d2":[32,58],"wc2":"2HS","eth":1},{"code":"9cm","name":"Dacian Falx","tier":"X","cat":"swd2","lvl":25,"str":91,"dex":20,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[18,43],"d2":[38,87],"wc2":"2HS","eth":1},{"code":"9gs","name":"Tusk Sword","tier":"X","cat":"swd2","lvl":25,"str":104,"dex":71,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[14,53],"d2":[28,83],"wc2":"2HS","eth":1},{"code":"9b9","name":"Gothic Sword","tier":"X","cat":"swd2","lvl":25,"str":113,"dex":20,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[22,58],"d2":[58,86],"wc2":"2HS","eth":1},{"code":"9fb","name":"Zweihander","tier":"X","cat":"swd2","lvl":25,"str":125,"dex":94,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,51],"d2":[41,77],"wc2":"2HS","eth":1},{"code":"9gd","name":"Executioner Sword","tier":"X","cat":"swd2","lvl":25,"str":170,"dex":110,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,58],"d2":[68,115],"wc2":"2HS","eth":1},{"code":"9dg","name":"Poignard","tier":"X","cat":"dag","lvl":19,"str":25,"dex":0,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[9,26],"eth":1},{"code":"9di","name":"Rondel","tier":"X","cat":"dag","lvl":24,"str":25,"dex":58,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[14,38],"eth":1},{"code":"9kr","name":"Cinquedeas","tier":"X","cat":"dag","lvl":25,"str":25,"dex":88,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[17,45],"eth":1},{"code":"9bl","name":"Stiletto","tier":"X","cat":"dag","lvl":25,"str":47,"dex":97,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[28,52],"eth":1},{"code":"9tk","name":"Battle Dart","tier":"X","cat":"tkni","lvl":19,"str":25,"dex":52,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[12,20],"dt":[14,30],"eth":1},{"code":"9ta","name":"Francisca","tier":"X","cat":"taxe","lvl":22,"str":25,"dex":80,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[13,27],"dt":[22,41],"eth":1},{"code":"9bk","name":"War Dart","tier":"X","cat":"tkni","lvl":25,"str":25,"dex":97,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[8,30],"dt":[17,34],"eth":1},{"code":"9b8","name":"Hurlbat","tier":"X","cat":"taxe","lvl":25,"str":25,"dex":106,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[19,34],"dt":[24,34],"eth":1},{"code":"9ja","name":"War Javelin","tier":"X","cat":"jave","lvl":18,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[7,24],"dt":[18,40],"eth":1},{"code":"9pi","name":"Great Pilum","tier":"X","cat":"jave","lvl":25,"str":25,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[13,33],"dt":[17,52],"eth":1},{"code":"9s9","name":"Simbilan","tier":"X","cat":"jave","lvl":25,"str":80,"dex":80,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[10,40],"dt":[34,58],"eth":1},{"code":"9gl","name":"Spiculum","tier":"X","cat":"jave","lvl":25,"str":98,"dex":73,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[16,48],"dt":[32,65],"eth":1},{"code":"9ts","name":"Harpoon","tier":"X","cat":"jave","lvl":25,"str":25,"dex":118,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[16,44],"dt":[23,59],"eth":1},{"code":"9sr","name":"War Spear","tier":"X","cat":"spea","lvl":21,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[15,54],"wc2":"2HT","eth":1},{"code":"9tr","name":"Fuscina","tier":"X","cat":"spea","lvl":24,"str":77,"dex":25,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[24,53],"wc2":"2HT","eth":1},{"code":"9br","name":"War Fork","tier":"X","cat":"spea","lvl":25,"str":80,"dex":95,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[23,58],"wc2":"2HT","eth":1},{"code":"9st","name":"Yari","tier":"X","cat":"spea","lvl":25,"str":101,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[41,85],"wc2":"2HT","eth":1},{"code":"9p9","name":"Lance","tier":"X","cat":"spea","lvl":25,"str":110,"dex":88,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[33,163],"wc2":"2HT","eth":1},{"code":"9b7","name":"Lochaber Axe","tier":"X","cat":"pole","lvl":21,"str":80,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[9,83],"wc2":"STF","eth":1},{"code":"9vo","name":"Bill","tier":"X","cat":"pole","lvl":25,"str":95,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[20,76],"wc2":"STF","eth":1},{"code":"9s8","name":"Battle Scythe","tier":"X","cat":"pole","lvl":25,"str":82,"dex":82,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[25,64],"wc2":"STF","eth":1},{"code":"9pa","name":"Partizan","tier":"X","cat":"pole","lvl":23,"str":113,"dex":67,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[49,108],"wc2":"STF","eth":1},{"code":"9h9","name":"Bec-de-Corbin","tier":"X","cat":"pole","lvl":25,"str":133,"dex":91,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[18,122],"wc2":"STF","eth":1},{"code":"9wc","name":"Grim Scythe","tier":"X","cat":"pole","lvl":25,"str":140,"dex":140,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[44,100],"wc2":"STF","eth":1},{"code":"8ss","name":"Jo Staff","tier":"X","cat":"staf","lvl":18,"str":25,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[9,30],"wc2":"STF","eth":1},{"code":"8ls","name":"Quarterstaff","tier":"X","cat":"staf","lvl":23,"str":25,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[12,38],"wc2":"STF","eth":1},{"code":"8cs","name":"Cedar Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[15,46],"wc2":"STF","eth":1},{"code":"8bs","name":"Gothic Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[21,48],"wc2":"STF","eth":1},{"code":"8ws","name":"Rune Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[35,84],"wc2":"STF","eth":1},{"code":"8sb","name":"Edge Bow","tier":"X","cat":"bow","lvl":18,"str":25,"dex":43,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[8,25],"wc2":"BOW"},{"code":"8hb","name":"Razor Bow","tier":"X","cat":"bow","lvl":21,"str":25,"dex":62,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[11,29],"wc2":"BOW"},{"code":"8lb","name":"Cedar Bow","tier":"X","cat":"bow","lvl":23,"str":53,"dex":49,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[13,38],"wc2":"BOW"},{"code":"8cb","name":"Double Bow","tier":"X","cat":"bow","lvl":25,"str":58,"dex":73,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[14,35],"wc2":"BOW"},{"code":"8s8","name":"Short Siege Bow","tier":"X","cat":"bow","lvl":25,"str":65,"dex":80,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[17,40],"wc2":"BOW"},{"code":"8l8","name":"Large Siege Bow","tier":"X","cat":"bow","lvl":25,"str":80,"dex":95,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[13,56],"wc2":"BOW"},{"code":"8sw","name":"Rune Bow","tier":"X","cat":"bow","lvl":25,"str":73,"dex":103,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[19,46],"wc2":"BOW"},{"code":"8lw","name":"Gothic Bow","tier":"X","cat":"bow","lvl":25,"str":95,"dex":118,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[8,63],"wc2":"BOW"},{"code":"8lx","name":"Arbalest","tier":"X","cat":"xbow","lvl":22,"str":52,"dex":61,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[20,38],"wc2":"XBW"},{"code":"8mx","name":"Siege Crossbow","tier":"X","cat":"xbow","lvl":25,"str":80,"dex":70,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[28,60],"wc2":"XBW"},{"code":"8hx","name":"Ballista","tier":"X","cat":"xbow","lvl":25,"str":110,"dex":80,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[47,78],"wc2":"XBW"},{"code":"8rx","name":"Chu-Ko-Nu","tier":"X","cat":"xbow","lvl":25,"str":80,"dex":95,"wsm":-60,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[22,50],"wc2":"XBW"},{"code":"ktr","name":"Katar","tier":"N","cat":"claw","lvl":0,"str":20,"dex":20,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[5,8],"eth":1},{"code":"wrb","name":"Wrist Blade","tier":"N","cat":"claw","lvl":0,"str":33,"dex":33,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[6,10],"eth":1},{"code":"axf","name":"Hatchet Hands","tier":"N","cat":"claw","lvl":0,"str":37,"dex":37,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[3,17],"eth":1},{"code":"ces","name":"Cestus","tier":"N","cat":"claw","lvl":0,"str":42,"dex":42,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[8,17],"eth":1},{"code":"clw","name":"Claws","tier":"N","cat":"claw","lvl":0,"str":46,"dex":46,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[9,16],"eth":1},{"code":"btl","name":"Blade Talons","tier":"N","cat":"claw","lvl":0,"str":50,"dex":50,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[11,15],"eth":1},{"code":"skr","name":"Scissors Katar","tier":"N","cat":"claw","lvl":0,"str":55,"dex":55,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[10,19],"eth":1},{"code":"9ar","name":"Quhab","tier":"X","cat":"claw","lvl":21,"str":57,"dex":57,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[15,35],"eth":1},{"code":"9wb","name":"Wrist Spike","tier":"X","cat":"claw","lvl":24,"str":66,"dex":66,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[20,46],"eth":1},{"code":"9xf","name":"Fascia","tier":"X","cat":"claw","lvl":27,"str":69,"dex":69,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[12,53],"eth":1},{"code":"9cs","name":"Hand Scythe","tier":"X","cat":"claw","lvl":30,"str":73,"dex":73,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[23,46],"eth":1},{"code":"9lw","name":"Greater Claws","tier":"X","cat":"claw","lvl":33,"str":76,"dex":76,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[23,53],"eth":1},{"code":"9tw","name":"Greater Talons","tier":"X","cat":"claw","lvl":37,"str":79,"dex":79,"wsm":-30,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[25,45],"eth":1},{"code":"9qr","name":"Scissors Quhab","tier":"X","cat":"claw","lvl":40,"str":82,"dex":82,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[28,58],"eth":1},{"code":"7ar","name":"Suwayyah","tier":"E","cat":"claw","lvl":44,"str":99,"dex":99,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[54,71],"eth":1},{"code":"7wb","name":"Wrist Sword","tier":"E","cat":"claw","lvl":46,"str":105,"dex":105,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[46,63],"eth":1},{"code":"7xf","name":"War Fist","tier":"E","cat":"claw","lvl":51,"str":108,"dex":108,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[60,73],"eth":1},{"code":"7cs","name":"Battle Cestus","tier":"E","cat":"claw","lvl":54,"str":110,"dex":110,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[45,53],"eth":1},{"code":"7lw","name":"Feral Claws","tier":"E","cat":"claw","lvl":58,"str":113,"dex":113,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[30,73],"eth":1},{"code":"7tw","name":"Runic Talons","tier":"E","cat":"claw","lvl":60,"str":115,"dex":115,"wsm":-30,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[33,60],"eth":1},{"code":"7qr","name":"Scissors Suwayyah","tier":"E","cat":"claw","lvl":64,"str":118,"dex":118,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[55,70],"eth":1},{"code":"7ha","name":"Tomahawk","tier":"E","cat":"axe1","lvl":40,"str":125,"dex":67,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[44,75],"eth":1},{"code":"7ax","name":"Small Crescent","tier":"E","cat":"axe1","lvl":45,"str":115,"dex":83,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[47,75],"eth":1},{"code":"72a","name":"Ettin Axe","tier":"E","cat":"axe1","lvl":52,"str":145,"dex":45,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[41,83],"eth":1},{"code":"7mp","name":"War Spike","tier":"E","cat":"axe1","lvl":59,"str":133,"dex":54,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[38,60],"eth":1},{"code":"7wa","name":"Berserker Axe","tier":"E","cat":"axe1","lvl":64,"str":138,"dex":59,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[30,89],"eth":1},{"code":"7la","name":"Feral Axe","tier":"E","cat":"axe2","lvl":42,"str":196,"dex":0,"wsm":-15,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[31,154],"wc2":"STF","eth":1},{"code":"7ba","name":"Silver-edged Axe","tier":"E","cat":"axe2","lvl":48,"str":166,"dex":65,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[78,138],"wc2":"STF","eth":1},{"code":"7bt","name":"Decapitator","tier":"E","cat":"axe2","lvl":54,"str":189,"dex":33,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[61,171],"wc2":"STF","eth":1},{"code":"7ga","name":"Champion Axe","tier":"E","cat":"axe2","lvl":61,"str":167,"dex":59,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[74,118],"wc2":"STF","eth":1},{"code":"7gi","name":"Glorious Axe","tier":"E","cat":"axe2","lvl":66,"str":164,"dex":55,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[75,155],"wc2":"STF","eth":1},{"code":"7wn","name":"Polished Wand","tier":"E","cat":"wand","lvl":41,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[18,33],"eth":1},{"code":"7yw","name":"Ghost Wand","tier":"E","cat":"wand","lvl":48,"str":25,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[20,40],"eth":1},{"code":"7bw","name":"Lich Wand","tier":"E","cat":"wand","lvl":56,"str":25,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[10,31],"eth":1},{"code":"7gw","name":"Unearthed Wand","tier":"E","cat":"wand","lvl":64,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[22,28],"eth":1},{"code":"7cl","name":"Truncheon","tier":"E","cat":"club","lvl":39,"str":88,"dex":43,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[44,54],"eth":1},{"code":"7sc","name":"Mighty Scepter","tier":"E","cat":"scep","lvl":46,"str":125,"dex":65,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[50,65],"eth":1},{"code":"7qs","name":"Seraph Rod","tier":"E","cat":"scep","lvl":57,"str":108,"dex":69,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[56,68],"eth":1},{"code":"7ws","name":"Caduceus","tier":"E","cat":"scep","lvl":66,"str":97,"dex":70,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[46,54],"eth":1},{"code":"7sp","name":"Tyrant Club","tier":"E","cat":"club","lvl":42,"str":133,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[43,75],"eth":1},{"code":"7ma","name":"Reinforced Mace","tier":"E","cat":"mace","lvl":47,"str":145,"dex":46,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[56,66],"eth":1},{"code":"7mt","name":"Devil Star","tier":"E","cat":"mace","lvl":52,"str":153,"dex":44,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[56,69],"eth":1},{"code":"7fl","name":"Scourge","tier":"E","cat":"mace","lvl":57,"str":125,"dex":77,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[14,100],"eth":1},{"code":"7wh","name":"Legendary Mallet","tier":"E","cat":"ham1","lvl":61,"str":189,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[63,76],"eth":1},{"code":"7m7","name":"Ogre Maul","tier":"E","cat":"ham2","lvl":51,"str":225,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[96,132],"wc2":"STF","eth":1},{"code":"7gm","name":"Thunder Maul","tier":"E","cat":"ham2","lvl":65,"str":253,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[41,225],"wc2":"STF","eth":1},{"code":"7ss","name":"Falcata","tier":"E","cat":"swd1","lvl":42,"str":150,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[39,74],"eth":1},{"code":"7sm","name":"Ataghan","tier":"E","cat":"swd1","lvl":45,"str":138,"dex":95,"wsm":-20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[33,58],"eth":1},{"code":"7sb","name":"Elegant Blade","tier":"E","cat":"swd1","lvl":47,"str":109,"dex":122,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[41,56],"eth":1},{"code":"7fc","name":"Hydra Edge","tier":"E","cat":"swd1","lvl":51,"str":142,"dex":105,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[35,85],"eth":1},{"code":"7cr","name":"Phase Blade","tier":"E","cat":"swd1","lvl":54,"str":25,"dex":136,"wsm":-30,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[39,44]},{"code":"7bs","name":"Conquest Sword","tier":"E","cat":"swd1","lvl":58,"str":142,"dex":112,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[46,66],"eth":1},{"code":"7ls","name":"Cryptic Sword","tier":"E","cat":"swd1","lvl":61,"str":99,"dex":109,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[6,96],"eth":1},{"code":"7wd","name":"Mythical Sword","tier":"E","cat":"swd1","lvl":66,"str":147,"dex":124,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[50,63],"eth":1},{"code":"72h","name":"Legend Sword","tier":"E","cat":"swd2","lvl":44,"str":175,"dex":100,"wsm":-15,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,70],"d2":[63,118],"wc2":"2HS","eth":1},{"code":"7cm","name":"Highland Blade","tier":"E","cat":"swd2","lvl":49,"str":171,"dex":104,"wsm":-5,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,78],"d2":[84,120],"wc2":"2HS","eth":1},{"code":"7gs","name":"Balrog Blade","tier":"E","cat":"swd2","lvl":53,"str":185,"dex":87,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[19,94],"d2":[69,149],"wc2":"2HS","eth":1},{"code":"7b7","name":"Champion Sword","tier":"E","cat":"swd2","lvl":57,"str":163,"dex":103,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[30,68],"d2":[89,104],"wc2":"2HS","eth":1},{"code":"7fb","name":"Colossus Sword","tier":"E","cat":"swd2","lvl":60,"str":182,"dex":95,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[33,88],"d2":[76,151],"wc2":"2HS","eth":1},{"code":"7gd","name":"Colossus Blade","tier":"E","cat":"swd2","lvl":63,"str":189,"dex":110,"wsm":5,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[31,81],"d2":[73,144],"wc2":"2HS","eth":1},{"code":"7dg","name":"Bone Knife","tier":"E","cat":"dag","lvl":43,"str":38,"dex":75,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[28,56],"eth":1},{"code":"7di","name":"Mithril Point","tier":"E","cat":"dag","lvl":52,"str":55,"dex":98,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[43,61],"eth":1},{"code":"7kr","name":"Fanged Knife","tier":"E","cat":"dag","lvl":62,"str":42,"dex":86,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[19,65],"eth":1},{"code":"7bl","name":"Legend Spike","tier":"E","cat":"dag","lvl":66,"str":65,"dex":67,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[36,64],"eth":1},{"code":"7tk","name":"Flying Knife","tier":"E","cat":"tkni","lvl":48,"str":48,"dex":141,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[23,54],"dt":[23,54],"eth":1},{"code":"7ta","name":"Flying Axe","tier":"E","cat":"taxe","lvl":42,"str":88,"dex":108,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[17,65],"dt":[15,66],"eth":1},{"code":"7bk","name":"Winged Knife","tier":"E","cat":"tkni","lvl":57,"str":45,"dex":142,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[27,35],"dt":[23,39],"eth":1},{"code":"7b8","name":"Winged Axe","tier":"E","cat":"taxe","lvl":60,"str":96,"dex":122,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[11,56],"dt":[7,60],"eth":1},{"code":"7ja","name":"Hyperion Javelin","tier":"E","cat":"jave","lvl":40,"str":98,"dex":123,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[21,57],"dt":[28,55],"eth":1},{"code":"7pi","name":"Stygian Pilum","tier":"E","cat":"jave","lvl":46,"str":118,"dex":112,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[14,64],"dt":[21,75],"eth":1},{"code":"7s7","name":"Balrog Spear","tier":"E","cat":"jave","lvl":53,"str":127,"dex":95,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[33,63],"dt":[40,62],"eth":1},{"code":"7gl","name":"Ghost Glaive","tier":"E","cat":"jave","lvl":59,"str":89,"dex":137,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[19,60],"dt":[30,78],"eth":1},{"code":"7ts","name":"Winged Harpoon","tier":"E","cat":"jave","lvl":65,"str":76,"dex":145,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[27,35],"dt":[11,77],"eth":1},{"code":"7sr","name":"Hyperion Spear","tier":"E","cat":"spea","lvl":43,"str":155,"dex":120,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[44,149],"wc2":"2HT","eth":1},{"code":"7tr","name":"Stygian Pike","tier":"E","cat":"spea","lvl":49,"str":168,"dex":97,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[36,180],"wc2":"2HT","eth":1},{"code":"7br","name":"Mancatcher","tier":"E","cat":"spea","lvl":55,"str":132,"dex":134,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[52,115],"wc2":"2HT","eth":1},{"code":"7st","name":"Ghost Spear","tier":"E","cat":"spea","lvl":62,"str":122,"dex":163,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[23,194],"wc2":"2HT","eth":1},{"code":"7p7","name":"War Pike","tier":"E","cat":"spea","lvl":66,"str":165,"dex":106,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[41,223],"wc2":"2HT","eth":1},{"code":"7o7","name":"Ogre Axe","tier":"E","cat":"pole","lvl":45,"str":195,"dex":75,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[35,181],"wc2":"STF","eth":1},{"code":"7vo","name":"Colossus Voulge","tier":"E","cat":"pole","lvl":48,"str":210,"dex":55,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[21,206],"wc2":"STF","eth":1},{"code":"7s8","name":"Thresher","tier":"E","cat":"pole","lvl":53,"str":152,"dex":118,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[15,176],"wc2":"STF","eth":1},{"code":"7pa","name":"Cryptic Axe","tier":"E","cat":"pole","lvl":59,"str":165,"dex":103,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[41,188],"wc2":"STF","eth":1},{"code":"7h7","name":"Great Poleaxe","tier":"E","cat":"pole","lvl":63,"str":179,"dex":99,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[58,159],"wc2":"STF","eth":1},{"code":"7wc","name":"Giant Thresher","tier":"E","cat":"pole","lvl":66,"str":188,"dex":140,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[50,142],"wc2":"STF","eth":1},{"code":"6ss","name":"Walking Stick","tier":"E","cat":"staf","lvl":43,"str":25,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[86,106],"wc2":"STF","eth":1},{"code":"6ls","name":"Stalagmite","tier":"E","cat":"staf","lvl":49,"str":63,"dex":35,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[94,134],"wc2":"STF","eth":1},{"code":"6cs","name":"Elder Staff","tier":"E","cat":"staf","lvl":55,"str":44,"dex":37,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[100,116],"wc2":"STF","eth":1},{"code":"6bs","name":"Shillelagh","tier":"E","cat":"staf","lvl":62,"str":52,"dex":27,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[81,135],"wc2":"STF","eth":1},{"code":"6ws","name":"Archon Staff","tier":"E","cat":"staf","lvl":66,"str":34,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[104,124],"wc2":"STF","eth":1},{"code":"6sb","name":"Spider Bow","tier":"E","cat":"bow","lvl":41,"str":64,"dex":143,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[34,73],"wc2":"BOW"},{"code":"6hb","name":"Blade Bow","tier":"E","cat":"bow","lvl":45,"str":76,"dex":119,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[30,60],"wc2":"BOW"},{"code":"6lb","name":"Shadow Bow","tier":"E","cat":"bow","lvl":47,"str":52,"dex":188,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[22,86],"wc2":"BOW"},{"code":"6cb","name":"Great Bow","tier":"E","cat":"bow","lvl":51,"str":121,"dex":107,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[17,76],"wc2":"BOW"},{"code":"6s7","name":"Diamond Bow","tier":"E","cat":"bow","lvl":54,"str":89,"dex":132,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[48,58],"wc2":"BOW"},{"code":"6l7","name":"Crusader Bow","tier":"E","cat":"bow","lvl":57,"str":97,"dex":121,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[23,91],"wc2":"BOW"},{"code":"6sw","name":"Ward Bow","tier":"E","cat":"bow","lvl":60,"str":72,"dex":146,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[29,77],"wc2":"BOW"},{"code":"6lw","name":"Hydra Bow","tier":"E","cat":"bow","lvl":63,"str":134,"dex":167,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[14,100],"wc2":"BOW"},{"code":"6lx","name":"Pellet Bow","tier":"E","cat":"xbow","lvl":42,"str":83,"dex":155,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[40,99],"wc2":"XBW"},{"code":"6mx","name":"Gorgon Crossbow","tier":"E","cat":"xbow","lvl":50,"str":117,"dex":105,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[39,120],"wc2":"XBW"},{"code":"6hx","name":"Colossus Crossbow","tier":"E","cat":"xbow","lvl":56,"str":163,"dex":77,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[47,125],"wc2":"XBW"},{"code":"6rx","name":"Demon Crossbow","tier":"E","cat":"xbow","lvl":63,"str":141,"dex":98,"wsm":-60,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[43,66],"wc2":"XBW"},{"code":"ob1","name":"Eagle Orb","tier":"N","cat":"orb","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[2,5],"eth":1},{"code":"ob2","name":"Sacred Globe","tier":"N","cat":"orb","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[3,8],"eth":1},{"code":"ob3","name":"Smoked Sphere","tier":"N","cat":"orb","lvl":8,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[4,10],"eth":1},{"code":"ob4","name":"Clasped Orb","tier":"N","cat":"orb","lvl":13,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[5,12],"eth":1},{"code":"ob5","name":"Jared's Stone","tier":"N","cat":"orb","lvl":18,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[8,18],"eth":1},{"code":"am1","name":"Stag Bow","tier":"N","cat":"abow","lvl":14,"str":30,"dex":45,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[8,14],"wc2":"BOW"},{"code":"am2","name":"Reflex Bow","tier":"N","cat":"abow","lvl":20,"str":35,"dex":60,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[10,21],"wc2":"BOW"},{"code":"am3","name":"Maiden Spear","tier":"N","cat":"aspe","lvl":14,"str":54,"dex":40,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[20,26],"wc2":"2HT","eth":1},{"code":"am4","name":"Maiden Pike","tier":"N","cat":"aspe","lvl":20,"str":63,"dex":52,"wsm":0,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[25,60],"wc2":"2HT","eth":1},{"code":"am5","name":"Maiden Javelin","tier":"N","cat":"ajav","lvl":17,"str":33,"dex":47,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[8,14],"dt":[6,22],"eth":1},{"code":"ob6","name":"Glowing Orb","tier":"X","cat":"orb","lvl":24,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[8,21],"eth":1},{"code":"ob7","name":"Crystalline Globe","tier":"X","cat":"orb","lvl":27,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[10,26],"eth":1},{"code":"ob8","name":"Cloudy Sphere","tier":"X","cat":"orb","lvl":30,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[11,29],"eth":1},{"code":"ob9","name":"Sparkling Ball","tier":"X","cat":"orb","lvl":34,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[13,32],"eth":1},{"code":"oba","name":"Swirling Crystal","tier":"X","cat":"orb","lvl":37,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[18,42],"eth":1},{"code":"am6","name":"Ashwood Bow","tier":"X","cat":"abow","lvl":29,"str":56,"dex":77,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[19,38],"wc2":"BOW"},{"code":"am7","name":"Ceremonial Bow","tier":"X","cat":"abow","lvl":35,"str":73,"dex":110,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[22,53],"wc2":"BOW"},{"code":"am8","name":"Ceremonial Spear","tier":"X","cat":"aspe","lvl":32,"str":101,"dex":80,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[49,74],"wc2":"2HT","eth":1},{"code":"am9","name":"Ceremonial Pike","tier":"X","cat":"aspe","lvl":38,"str":115,"dex":98,"wsm":10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[60,140],"wc2":"2HT","eth":1},{"code":"ama","name":"Ceremonial Javelin","tier":"X","cat":"ajav","lvl":26,"str":25,"dex":109,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[26,51],"dt":[25,69],"eth":1},{"code":"obb","name":"Heavenly Stone","tier":"E","cat":"orb","lvl":44,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[21,46],"eth":1},{"code":"obc","name":"Eldritch Orb","tier":"E","cat":"orb","lvl":50,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[18,50],"eth":1},{"code":"obd","name":"Demon Heart","tier":"E","cat":"orb","lvl":56,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[23,55],"eth":1},{"code":"obe","name":"Vortex Orb","tier":"E","cat":"orb","lvl":63,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[12,66],"eth":1},{"code":"obf","name":"Dimensional Shard","tier":"E","cat":"orb","lvl":66,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[30,53],"eth":1},{"code":"amb","name":"Matriarchal Bow","tier":"E","cat":"abow","lvl":39,"str":87,"dex":187,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[31,74],"wc2":"BOW"},{"code":"amc","name":"Grand Matron Bow","tier":"E","cat":"abow","lvl":58,"str":108,"dex":152,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[20,104],"wc2":"BOW"},{"code":"amd","name":"Matriarchal Spear","tier":"E","cat":"aspe","lvl":45,"str":114,"dex":142,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[79,116],"wc2":"2HT","eth":1},{"code":"ame","name":"Matriarchal Pike","tier":"E","cat":"aspe","lvl":60,"str":132,"dex":149,"wsm":10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[44,185],"wc2":"2HT","eth":1},{"code":"amf","name":"Matriarchal Javelin","tier":"E","cat":"ajav","lvl":48,"str":107,"dex":151,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[38,68],"dt":[44,83],"eth":1}],"cats":[{"key":"axe1","label":"One-handed axes"},{"key":"axe2","label":"Two-handed axes"},{"key":"swd1","label":"One-handed swords"},{"key":"swd2","label":"Two-handed swords"},{"key":"dag","label":"Daggers"},{"key":"club","label":"Clubs"},{"key":"mace","label":"Maces"},{"key":"ham1","label":"One-handed hammers"},{"key":"ham2","label":"Two-handed hammers"},{"key":"scep","label":"Scepters"},{"key":"wand","label":"Wands"},{"key":"staf","label":"Staves"},{"key":"spea","label":"Spears"},{"key":"pole","label":"Polearms"},{"key":"jave","label":"Javelins"},{"key":"taxe","label":"Throwing axes"},{"key":"tkni","label":"Throwing knives"},{"key":"bow","label":"Bows"},{"key":"xbow","label":"Crossbows"},{"key":"claw","label":"Claws (Assassin)"},{"key":"orb","label":"Orbs (Sorceress)"},{"key":"abow","label":"Bows (Amazon)"},{"key":"aspe","label":"Spears (Amazon)"},{"key":"ajav","label":"Javelins (Amazon)"}],"classes":[{"code":"ama","tok":"AM","name":"Amazon","th":5},{"code":"sor","tok":"SO","name":"Sorceress","th":-15},{"code":"nec","tok":"NE","name":"Necromancer","th":-10},{"code":"pal","tok":"PA","name":"Paladin","th":20},{"code":"bar","tok":"BA","name":"Barbarian","th":20},{"code":"dru","tok":"DZ","name":"Druid","th":5},{"code":"ass","tok":"AI","name":"Assassin","th":15}],"anim":{"AMA1HTH":[13,256,8],"AMA11HS":[16,256,10],"AMA11HT":[15,256,9],"AMA12HS":[20,256,12],"AMA12HT":[18,256,11],"AMA1BOW":[14,256,6],"AMA1XBW":[20,294,9],"AMA1STF":[20,256,12],"AMA2HTH":[13,256,8],"AMA21HS":[16,256,10],"AMA21HT":[15,256,9],"AMA22HS":[20,256,12],"AMA22HT":[18,256,11],"AMA2STF":[20,256,12],"AMTHHTH":[16,256,9],"AMTH1HS":[16,256,9],"AMTH1HT":[16,256,9],"AMKKHTH":[12,256,5],"AMKK1HS":[12,256,5],"AMKK1HT":[12,256,5],"AMKK2HS":[12,256,5],"AMKK2HT":[12,256,5],"AMKKBOW":[12,256,5],"AMKKXBW":[12,256,5],"AMKKSTF":[12,256,5],"AMS1HTH":[9,256,2],"AMS11HS":[9,256,-1],"AMS11HT":[9,256,-1],"AMS12HS":[9,256,2],"AMS12HT":[9,256,2],"AMS1BOW":[9,256,2],"AMS1XBW":[9,256,-1],"AMS1STF":[9,256,2],"AMNUHTH":[8,128,-1],"AMNU1HS":[8,128,-1],"AMNU1HT":[8,128,-1],"AMNU2HS":[8,128,-1],"AMNU2HT":[8,128,-1],"AMNUBOW":[8,128,-1],"AMNUXBW":[8,128,-1],"AMNUSTF":[8,128,-1],"SOA1HTH":[16,256,9],"SOA11HS":[20,256,12],"SOA11HT":[19,256,11],"SOA12HS":[24,256,14],"SOA12HT":[23,256,13],"SOA1BOW":[17,256,9],"SOA1XBW":[20,282,11],"SOA1STF":[18,256,11],"SOA2HTH":[16,256,8],"SOA21HS":[20,256,12],"SOA21HT":[19,256,11],"SOA22HS":[24,256,14],"SOA22HT":[23,256,13],"SOA2STF":[18,256,11],"SOTHHTH":[20,256,10],"SOTH1HS":[20,256,10],"SOTH1HT":[20,256,10],"SOKKHTH":[12,256,6],"SOKK1HS":[12,256,6],"SOKK1HT":[12,256,6],"SOKK2HS":[12,256,6],"SOKK2HT":[12,256,6],"SOKKBOW":[12,256,6],"SOKKXBW":[12,256,6],"SOKKSTF":[12,256,6],"SOS1HTH":[14,256,7],"SOS11HS":[14,256,7],"SOS11HT":[14,256,7],"SOS12HS":[14,256,7],"SOS12HT":[14,256,7],"SOS1BOW":[14,256,7],"SOS1XBW":[14,256,7],"SOS1STF":[14,256,7],"SONUHTH":[8,128,-1],"SONU1HS":[8,128,-1],"SONU1HT":[8,128,-1],"SONU2HS":[8,128,-1],"SONU2HT":[8,128,-1],"SONUBOW":[8,128,-1],"SONUXBW":[8,128,-1],"SONUSTF":[8,128,-1],"NEA1HTH":[15,256,8],"NEA11HS":[19,256,9],"NEA11HT":[19,256,9],"NEA12HS":[23,256,11],"NEA12HT":[24,256,10],"NEA1BOW":[18,256,9],"NEA1XBW":[20,282,11],"NEA1STF":[20,256,11],"NEA2HTH":[15,256,8],"NEA21HS":[19,256,9],"NEA21HT":[19,256,9],"NEA22HS":[23,256,11],"NEA22HT":[24,256,10],"NEA2STF":[20,256,11],"NETHHTH":[20,256,10],"NETH1HS":[20,256,10],"NETH1HT":[20,256,10],"NEKKHTH":[12,256,6],"NEKK1HS":[12,256,6],"NEKK1HT":[12,256,6],"NEKK2HS":[12,256,6],"NEKK2HT":[12,256,6],"NEKKBOW":[12,256,6],"NEKKXBW":[12,256,6],"NEKKSTF":[12,256,6],"NES1HTH":[16,256,8],"NES11HS":[16,256,8],"NES11HT":[16,256,8],"NES12HS":[16,256,8],"NES12HT":[16,256,8],"NES1BOW":[16,256,8],"NES1XBW":[16,256,8],"NES1STF":[16,256,8],"NENUHTH":[8,128,-1],"NENU1HS":[8,128,-1],"NENU1HT":[8,128,-1],"NENU2HS":[8,128,-1],"NENU2HT":[8,128,-1],"NENUBOW":[8,128,-1],"NENUXBW":[8,128,-1],"NENUSTF":[8,128,-1],"PAA1HTH":[14,256,7],"PAA11HS":[15,256,7],"PAA11HT":[17,256,8],"PAA12HS":[18,256,8],"PAA12HT":[20,256,8],"PAA1BOW":[16,256,8],"PAA1XBW":[20,282,10],"PAA1STF":[18,256,9],"PAA2HTH":[14,256,7],"PAA21HS":[15,256,7],"PAA21HT":[17,256,8],"PAA22HS":[19,256,8],"PAA22HT":[20,256,9],"PAA2STF":[18,256,9],"PATHHTH":[12,256,6],"PATH1HS":[16,256,8],"PATH1HT":[16,256,8],"PAKKHTH":[12,256,5],"PAKK1HS":[12,256,5],"PAKK1HT":[12,256,5],"PAKK2HS":[12,256,5],"PAKK2HT":[12,256,5],"PAKKBOW":[12,256,5],"PAKKXBW":[12,256,5],"PAKKSTF":[12,256,5],"PAS1HTH":[12,256,7],"PAS11HS":[12,256,7],"PAS11HT":[12,256,7],"PANUHTH":[8,184,-1],"PANU1HS":[8,128,-1],"PANU1HT":[8,184,-1],"PANU2HS":[8,184,-1],"PANU2HT":[8,184,-1],"PANUBOW":[8,184,-1],"PANUXBW":[8,128,-1],"PANUSTF":[8,184,-1],"BAA1HTH":[12,256,6],"BAA11HS":[16,256,7],"BAA11HT":[16,256,7],"BAA12HS":[18,256,8],"BAA12HT":[19,256,9],"BAA1BOW":[15,256,7],"BAA1XBW":[20,294,10],"BAA1STF":[19,256,9],"BAA11JS":[16,256,7],"BAA11JT":[16,256,7],"BAA11SS":[16,256,7],"BAA11ST":[16,256,7],"BAA21HS":[16,256,7],"BAA21HT":[16,256,7],"BAA22HS":[18,256,8],"BAA22HT":[19,256,9],"BAA2STF":[19,256,9],"BAA21JS":[16,256,8],"BAA21JT":[16,256,7],"BAA21SS":[16,256,7],"BAA21ST":[16,256,7],"BATHHTH":[16,256,8],"BATH1HS":[16,256,8],"BATH1HT":[16,256,8],"BATH1JS":[16,256,8],"BATH1JT":[16,256,8],"BATH1SS":[16,256,8],"BATH1ST":[16,256,8],"BAKKHTH":[12,256,4],"BAKK1HS":[12,256,4],"BAKK1HT":[12,256,4],"BAKK2HS":[12,256,4],"BAKK2HT":[12,256,4],"BAKKBOW":[12,256,4],"BAKKXBW":[12,256,4],"BAKKSTF":[12,256,4],"BAKK1JS":[12,256,4],"BAKK1JT":[12,256,4],"BAKK1SS":[12,256,4],"BAKK1ST":[12,256,4],"BAS1HTH":[15,256,-1],"BAS11HS":[15,256,-1],"BAS11HT":[15,256,-1],"BAS12HS":[15,256,-1],"BAS12HT":[15,256,-1],"BAS1BOW":[15,256,-1],"BAS1XBW":[15,256,-1],"BAS1STF":[15,256,-1],"BAS11JS":[15,256,-1],"BAS11JT":[15,256,-1],"BAS11SS":[15,256,-1],"BAS11ST":[15,256,-1],"BAS21HT":[14,256,9],"BAS31JS":[12,256,8],"BAS31JT":[12,256,8],"BAS31SS":[12,256,7],"BAS31ST":[12,256,7],"BAS41JS":[16,256,8],"BAS41JT":[16,256,8],"BAS41SS":[16,256,9],"BAS41ST":[16,256,9],"BANUHTH":[8,96,-1],"BANU1HS":[8,96,-1],"BANU1HT":[8,96,-1],"BANU2HS":[8,96,-1],"BANU2HT":[8,96,-1],"BANUBOW":[8,96,-1],"BANUXBW":[8,96,-1],"BANUSTF":[8,96,-1],"BANU1JS":[8,96,-1],"BANU1JT":[8,96,-1],"BANU1SS":[8,96,-1],"BANU1ST":[8,96,-1],"DZA1HTH":[16,256,8],"DZA11HS":[19,256,9],"DZA11HT":[19,256,8],"DZA12HS":[21,256,10],"DZA12HT":[23,256,9],"DZA1BOW":[16,256,8],"DZA1XBW":[20,282,10],"DZA1STF":[17,256,9],"DZA21HS":[19,256,9],"DZA21HT":[19,256,8],"DZA22HS":[21,256,10],"DZA22HT":[23,256,9],"DZA2STF":[17,256,9],"DZTHHTH":[18,256,9],"DZTH1HS":[18,256,8],"DZTH1HT":[18,256,8],"DZKKHTH":[12,256,5],"DZKK1HS":[12,224,5],"DZKK1HT":[12,256,5],"DZKK2HS":[12,224,5],"DZKK2HT":[12,256,5],"DZKKBOW":[12,256,5],"DZKKXBW":[12,256,5],"DZKKSTF":[12,256,5],"DZS1HTH":[15,256,8],"DZS11HS":[15,256,9],"DZS11HT":[15,256,8],"DZS12HS":[15,208,8],"DZS12HT":[15,208,8],"DZS1BOW":[15,208,8],"DZS1XBW":[15,256,8],"DZS1STF":[15,208,8],"DZNUHTH":[6,120,-1],"DZNU1HS":[6,120,-1],"DZNU1HT":[6,120,-1],"DZNU2HS":[6,120,-1],"DZNU2HT":[6,120,-1],"DZNUBOW":[6,120,-1],"DZNUXBW":[6,120,-1],"DZNUSTF":[6,120,-1],"AIA1HTH":[11,256,6],"AIA11HS":[15,256,7],"AIA11HT":[15,256,7],"AIA12HS":[23,256,11],"AIA12HT":[23,256,10],"AIA1BOW":[16,256,7],"AIA1XBW":[21,294,10],"AIA1STF":[19,256,9],"AIA1HT1":[11,208,6],"AIA1HT2":[11,208,6],"AIA2HTH":[12,256,6],"AIA21HS":[15,256,7],"AIA21HT":[15,256,7],"AIA22HS":[23,256,11],"AIA22HT":[23,256,10],"AIA2STF":[19,256,9],"AIA2HT1":[12,208,6],"AIA2HT2":[12,208,6],"AITH1HS":[16,256,7],"AITH1HT":[16,256,7],"AIKKHTH":[13,256,4],"AIKK1HS":[13,256,4],"AIKK1HT":[13,256,4],"AIKK2HS":[13,256,4],"AIKK2HT":[13,256,4],"AIKKBOW":[13,256,4],"AIKKXBW":[13,256,4],"AIKKSTF":[13,256,4],"AIKKHT1":[13,256,4],"AIKKHT2":[13,256,4],"AIS1HTH":[17,256,10],"AIS11HS":[15,256,10],"AIS11HT":[15,256,10],"AIS12HS":[15,256,10],"AIS12HT":[15,256,10],"AIS1BOW":[15,256,10],"AIS1XBW":[15,256,10],"AIS1STF":[15,256,10],"AIS1HT1":[17,256,10],"AIS1HT2":[15,256,10],"AIS2HTH":[8,128,4],"AIS21HS":[8,128,4],"AIS21HT":[8,128,4],"AIS22HS":[8,128,4],"AIS22HT":[8,128,4],"AIS2BOW":[8,128,4],"AIS2XBW":[8,128,4],"AIS2STF":[8,128,4],"AIS2HT1":[8,128,4],"AIS2HT2":[8,128,4],"AIS3HTH":[10,256,-1],"AIS31HS":[10,256,-1],"AIS31HT":[10,256,-1],"AIS32HS":[10,256,-1],"AIS32HT":[10,256,-1],"AIS3BOW":[10,256,-1],"AIS3XBW":[10,256,-1],"AIS3STF":[10,256,-1],"AIS3HT1":[10,256,-1],"AIS3HT2":[10,256,-1],"AIS4HT1":[12,208,6],"AIS4HT2":[12,208,6],"AINUHTH":[8,128,-1],"AINU1HS":[8,128,-1],"AINU1HT":[8,128,-1],"AINU2HS":[8,128,-1],"AINU2HT":[8,128,-1],"AINUBOW":[8,128,-1],"AINUXBW":[8,128,-1],"AINUSTF":[8,128,-1],"AINUHT1":[8,128,-1],"AINUHT2":[8,128,-1],"40NUHTH":[9,144,-1],"40A1HTH":[13,256,7],"40A2HTH":[13,256,7],"40S3HTH":[10,240,6],"40S4HTH":[7,152,4],"TGNUHTH":[10,136,-1],"TGA1HTH":[12,224,7],"TGA2HTH":[12,224,7],"TGS3HTH":[10,208,6],"TGS4HTH":[7,152,4]},"seq":{"1":{"HTH":[13,1],"1HT":[16,3],"2HT":[18,3]},"2":{"HTH":[14,1],"1HS":[7,1],"2HS":[8,1]},"3":{"HTH":[14,1],"1HS":[16,1]},"4":{"HTH":[15,9],"1HT":[15,9],"2HT":[15,9],"1HS":[15,9],"2HS":[15,9],"STF":[15,9]},"5":{"HTH":[14,1],"1HS":[6,1]},"6":{"HTH":[8,1],"1HT":[8,1],"2HT":[8,1],"1HS":[8,1],"2HS":[8,1],"BOW":[8,1],"XBW":[8,1],"STF":[8,1],"1JS":[8,1],"1JT":[8,1],"1SS":[8,1],"1ST":[8,1],"HT1":[8,1],"HT2":[8,1]},"7":{"HTH":[13,1],"BOW":[13,1],"XBW":[20,1]},"8":{"HTH":[13,1],"1HT":[21,1],"2HT":[24,1]},"9":{"HTH":[13,1],"1HT":[16,1],"2HT":[16,0]},"10":{"HTH":[8,2],"1HT":[8,2],"2HT":[8,2],"1HS":[8,2],"2HS":[8,2],"STF":[8,2],"1JS":[8,2],"1JT":[8,2],"1SS":[8,2],"1ST":[8,2],"HT1":[8,2],"HT2":[8,2]},"11":{"HTH":[17,2],"1HT":[17,2],"2HT":[17,2],"1HS":[17,2],"2HS":[17,2],"BOW":[17,2],"XBW":[17,2],"STF":[17,2],"1JS":[17,2],"1JT":[17,2],"1SS":[17,2],"1ST":[17,2],"HT1":[17,2],"HT2":[17,2]},"12":{"HTH":[19,1],"1HT":[19,1],"2HT":[19,1],"1HS":[19,1],"2HS":[19,1],"BOW":[19,1],"XBW":[19,1],"STF":[19,1],"1JS":[19,1],"1JT":[19,1],"1SS":[19,1],"1ST":[19,1],"HT1":[19,1],"HT2":[19,1]},"13":{"HTH":[15,3],"1HT":[15,3],"2HT":[15,3],"1HS":[15,3],"2HS":[15,3],"BOW":[15,3],"XBW":[15,3],"STF":[15,3],"1JS":[15,3],"1JT":[15,3],"1SS":[15,3],"1ST":[15,3],"HT1":[15,3],"HT2":[15,3]},"14":{"HTH":[22,3],"1HT":[25,3],"2HT":[28,3],"1HS":[25,3],"2HS":[27,3],"STF":[28,3],"1JS":[22,3],"1JT":[22,3],"1SS":[22,3],"1ST":[22,3],"HT1":[22,3],"HT2":[22,3]},"15":{"HTH":[12,2],"1HT":[12,2],"2HT":[12,2],"1HS":[12,2],"2HS":[12,2],"BOW":[12,2],"XBW":[12,2],"STF":[12,2],"1JS":[12,2],"1JT":[12,2],"1SS":[12,2],"1ST":[12,2],"HT1":[12,2],"HT2":[12,2]},"16":{"HTH":[12,1],"HT1":[12,1],"HT2":[16,2]},"17":{"HTH":[19,3],"1HT":[19,3],"2HT":[19,3],"1HS":[19,3],"2HS":[19,3],"BOW":[19,3],"XBW":[19,3],"STF":[19,3],"HT1":[19,3],"HT2":[19,3]},"18":{"HTH":[8,1],"1HT":[8,1],"2HT":[8,1],"1HS":[8,1],"2HS":[8,1],"BOW":[8,1],"XBW":[8,1],"STF":[8,1],"1JS":[8,1],"1JT":[8,1],"1SS":[8,1],"1ST":[8,1],"HT1":[8,1],"HT2":[8,1]},"19":{"HTH":[20,3],"1HT":[20,3],"2HT":[20,3],"1HS":[20,3],"2HS":[20,3],"BOW":[20,3],"XBW":[20,3],"STF":[20,3],"HT1":[20,3],"HT2":[20,3]},"20":{"HTH":[17,4],"1HT":[17,4],"2HT":[17,4],"1HS":[17,4],"2HS":[17,4],"BOW":[17,4],"XBW":[17,4],"HT1":[17,4],"HT2":[17,4]},"21":{"HTH":[23,2],"1HT":[23,2],"2HT":[23,2],"1HS":[23,2],"2HS":[23,2],"BOW":[23,2],"XBW":[23,2],"STF":[23,2],"1JS":[23,2],"1JT":[23,2],"1SS":[23,2],"1ST":[23,2],"HT1":[23,2],"HT2":[23,2]},"22":{"HTH":[16,1],"1HT":[16,1],"2HT":[16,1],"1HS":[16,1],"2HS":[16,1],"BOW":[16,1],"XBW":[16,1],"STF":[16,1],"1JS":[16,1],"1JT":[16,1],"1SS":[16,1],"1ST":[16,1],"HT1":[16,1],"HT2":[16,1]},"23":{"HTH":[11,1],"1HT":[11,1],"2HT":[11,1],"1HS":[11,1],"2HS":[11,1],"BOW":[11,1],"XBW":[11,1],"STF":[11,1],"1JS":[11,1],"1JT":[11,1],"1SS":[11,1],"1ST":[11,1],"HT1":[11,1],"HT2":[11,1]}},"attacks":[{"k":"attack","id":0,"cls":null,"kind":"normal","mode":"A1","label":"Attack","srcdam":128,"desc":1,"itype":"weap","hit":1},{"k":"throw","id":2,"cls":null,"kind":"normal","mode":"TH","dmg":null,"throw":true,"label":"Throw","srcdam":128,"desc":3,"itype":"thro","hit":1},{"k":"jab","id":10,"cls":"ama","kind":"seq","dmg":"calc1","label":"Jab","srcdam":128,"desc":7,"seq":1,"itype":"spea","hit":1},{"k":"fend","id":30,"cls":"ama","kind":"roll","mode":"A1","dmg":"calc2","hits":"calc1","roll":"Param2","label":"Fend","srcdam":128,"desc":7,"itype":"spea","hit":1},{"k":"strafe","id":26,"cls":"ama","kind":"roll","mode":"A1","dmg":"calc2","hits":"calc1","roll":"Param6","missile":true,"label":"Strafe","srcdam":128,"desc":7,"itype":"miss","hit":1},{"k":"multishot","id":12,"cls":"ama","kind":"normal","mode":"A1","dmg":"calc4","missile":true,"label":"Multiple Shot","srcdam":128,"desc":7,"itype":"miss","hit":1},{"k":"guided","id":22,"cls":"ama","kind":"normal","mode":"A1","dmg":"calc1","missile":true,"label":"Guided Arrow","srcdam":64,"desc":7,"itype":"miss","hit":0},{"k":"magicarrow","id":6,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"mconv":[50,0],"label":"Magic Arrow","srcdam":96,"convEl":"mag","mdmg":1,"desc":26,"itype":"miss","hit":1},{"k":"firearrow","id":7,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"mconv":[50,0],"ex":"firearrow","label":"Fire Arrow","srcdam":64,"convEl":"fire","mdmg":1,"desc":26,"itype":"miss","hit":1},{"k":"coldarrow","id":11,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"mconv":[50,0],"label":"Cold Arrow","srcdam":64,"convEl":"cold","mdmg":1,"desc":26,"itype":"miss","hit":1},{"k":"icearrow","id":21,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"label":"Ice Arrow","srcdam":128,"desc":5,"itype":"miss","hit":1},{"k":"explodingarrow","id":16,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"ex":"explodingarrow","label":"Exploding Arrow","srcdam":128,"desc":6,"itype":"miss","hit":1},{"k":"immolationarrow","id":27,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","sel":true,"ex":"immolationarrow","label":"Immolation Arrow","srcdam":128,"desc":6,"itype":"miss","hit":1},{"k":"freezingarrow","id":31,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"missile":true,"syn":"EDmgSymPerCalc","ex":"freezingarrow","label":"Freezing Arrow","srcdam":128,"desc":6,"itype":"miss","hit":1},{"k":"lightningfury","id":35,"cls":"ama","kind":"normal","mode":"TH","dmg":null,"throw":true,"mroll":true,"syn":"EDmgSymPerCalc","sel":true,"ex":"lightningfury","label":"Lightning Fury","srcdam":128,"desc":22,"itype":"jave","hit":0},{"k":"chargedstrike","id":24,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"xpct":"calc1","syn":"EDmgSymPerCalc","sel":true,"ex":"chargedstrike","label":"Charged Strike","srcdam":128,"desc":17,"itype":"spea","hit":1},{"k":"lightningstrike","id":34,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","sel":true,"ex":"lightningstrike","label":"Lightning Strike","srcdam":128,"desc":17,"itype":"spea","hit":1},{"k":"powerstrike","id":14,"cls":"ama","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","sel":true,"ex":"powerstrike","label":"Power Strike","srcdam":128,"desc":5,"itype":"spea","hit":1},{"k":"poisonjav","id":15,"cls":"ama","kind":"normal","mode":"TH","dmg":null,"throw":true,"mroll":true,"syn":"EDmgSymPerCalc","spois":true,"label":"Poison Javelin","srcdam":128,"desc":22,"itype":"jave","hit":1},{"k":"plaguejav","id":25,"cls":"ama","kind":"normal","mode":"TH","dmg":null,"throw":true,"mroll":true,"syn":"EDmgSymPerCalc","spois":true,"ex":"plaguejav","label":"Plague Javelin","srcdam":128,"desc":22,"itype":"jave","hit":1},{"k":"lightningbolt","id":20,"cls":"ama","kind":"normal","mode":"TH","dmg":null,"throw":true,"mroll":true,"syn":"EDmgSymPerCalc","sel":true,"mconv":[100,0],"label":"Lightning Bolt","srcdam":128,"convEl":"ltng","mdmg":12,"desc":21,"itype":"jave","hit":0},{"k":"dragonclaw","id":260,"cls":"ass","kind":"seq","dmg":"calc1","label":"Dragon Claw","srcdam":128,"desc":19,"seq":16,"itype":"h2h","hit":1},{"k":"bladefury","id":266,"cls":"ass","kind":"seq","dmg":null,"missile":true,"syn":"DmgSymPerCalc","sphys":true,"label":"Blade Fury","srcdam":96,"desc":28,"seq":23,"itype":"","hit":1},{"k":"bladedance","id":380,"cls":"ass","kind":"ww","dmg":"calc1","label":"Blade Dance","srcdam":128,"desc":1,"itype":"mele","hit":1},{"k":"dragontalon","id":255,"cls":"ass","kind":"roll","mode":"KK","dmg":"calc2","hits":"calc1","roll":100,"kick":true,"label":"Dragon Talon","srcdam":128,"desc":15,"itype":"","hit":1},{"k":"dragontail","id":270,"cls":"ass","kind":"normal","mode":"KK","dmg":null,"syn":"calc1","kick":true,"ex":"dragontail","label":"Dragon Tail","srcdam":128,"desc":16,"itype":"","hit":1},{"k":"dragonflight","id":275,"cls":"ass","kind":"normal","mode":"KK","dmg":"calc2","kick":true,"flight":true,"label":"Dragon Flight","srcdam":128,"desc":15,"itype":"","hit":1},{"k":"fof","id":259,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","fof":true,"charge":"fof","label":"Fists of Fire","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"boi","id":274,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","charge":"boi","label":"Blades of Ice","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"cot","id":269,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","charge":"cot","label":"Claws of Thunder","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"phx","id":280,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"charge":"phx","synn":["Fists of Fire","Claws of Thunder","Blades of Ice"],"label":"Phoenix Strike","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"cobra","id":265,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"charge":"cobra","synn":["Venom"],"label":"Cobra Strike","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"tiger","id":254,"cls":"ass","kind":"normal","mode":"A1","dmg":null,"charge":"tiger","label":"Tiger Strike","srcdam":128,"desc":25,"itype":"asm","hit":1},{"k":"bash","id":126,"cls":"bar","kind":"normal","mode":"A1","dmg":"calc1","flat":"calc2","label":"Bash","srcdam":128,"desc":7,"itype":"mele","hit":1},{"k":"doubleswing","id":133,"cls":"bar","kind":"seq","dmg":"calc1","rate":"Param5","label":"Double Swing","srcdam":128,"desc":19,"seq":11,"itype":"mele","hit":1},{"k":"frenzy","id":147,"cls":"bar","kind":"seq","dmg":"calc1","label":"Frenzy","srcdam":128,"desc":19,"seq":11,"itype":"mele","hit":1},{"k":"berserk","id":152,"cls":"bar","kind":"seq","dmg":"calc1","label":"Berserk","srcdam":128,"desc":19,"seq":11,"itype":"mele","hit":1},{"k":"whirlwind","id":151,"cls":"bar","kind":"ww","dmg":"calc1","label":"Whirlwind","srcdam":128,"desc":1,"itype":"mele","hit":1},{"k":"concentrate","id":144,"cls":"bar","kind":"normal","mode":"A1","dmg":"calc1","conv":"calc4","label":"Concentrate","srcdam":128,"convEl":"mag","desc":7,"itype":"mele","hit":1},{"k":"doublethrow","id":140,"cls":"bar","kind":"seq","dmg":"calc1","throw":true,"label":"Double Throw","srcdam":128,"desc":13,"seq":15,"itype":"comb","hit":1},{"k":"splitthrow","id":375,"cls":"bar","kind":"normal","mode":"TH","dmg":"calc4","throw":true,"ex":"splitthrow","label":"Split Throw","srcdam":128,"desc":13,"itype":"comb","hit":1},{"k":"stun","id":139,"cls":"bar","kind":"normal","mode":"A1","dmg":null,"label":"Stun","srcdam":32,"desc":7,"itype":"mele","hit":1},{"k":"wolfattack","id":0,"cls":null,"kind":"were","form":"40","mode":"A1","label":"Attack (Werewolf)","srcdam":128,"desc":1,"itype":"weap","hit":1},{"k":"bearattack","id":0,"cls":null,"kind":"were","form":"TG","mode":"A1","label":"Attack (Werebear)","srcdam":128,"desc":1,"itype":"weap","hit":1},{"k":"feralrage","id":232,"cls":"dru","kind":"were","form":"40","mode":"A1","dmg":"calc1","label":"Feral Rage","srcdam":128,"desc":7,"itype":"","hit":1},{"k":"fury","id":248,"cls":"dru","kind":"wereroll","form":"40","mode":"A1","dmg":"calc2","hits":"calc1","roll":"Param2","label":"Fury","srcdam":128,"desc":7,"itype":"","hit":1},{"k":"rabies","id":238,"cls":"dru","kind":"were","form":"40","mode":"S3","dmg":null,"syn":"EDmgSymPerCalc","spois":true,"label":"Rabies","srcdam":128,"desc":23,"itype":"","hit":1},{"k":"fireclaws","id":239,"cls":"dru","kind":"were","form":"40","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","fclaw":true,"label":"Fire Claws (Werewolf)","srcdam":128,"desc":1,"itype":"","hit":1},{"k":"fireclawsbear","id":239,"cls":"dru","kind":"were","form":"TG","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","fclaw":true,"label":"Fire Claws (Werebear)","srcdam":128,"desc":1,"itype":"","hit":1},{"k":"maul","id":233,"cls":null,"kind":"were","form":"TG","mode":"A1","dmg":null,"label":"Maul","srcdam":128,"desc":1,"itype":"","hit":1},{"k":"zeal","id":106,"cls":"pal","kind":"roll","mode":"A1","dmg":"calc2","hits":"calc1","roll":"Param2","label":"Zeal","srcdam":128,"desc":7,"itype":"mele","hit":1},{"k":"vengeance","id":111,"cls":"pal","kind":"normal","mode":"A1","dmg":null,"syn":"calc1","veng":true,"label":"Vengeance","srcdam":128,"desc":11,"itype":"mele","hit":1},{"k":"sacrifice","id":96,"cls":"pal","kind":"normal","mode":"A1","dmg":"calc1","label":"Sacrifice","srcdam":128,"desc":7,"itype":"mele","hit":1},{"k":"charge","id":107,"cls":"pal","kind":"charge","dmg":"calc1","label":"Charge","srcdam":128,"desc":7,"itype":"mele","hit":1},{"k":"joust","id":378,"cls":"pal","kind":"normal","mode":"A1","dmg":"calc1","label":"Joust","srcdam":128,"desc":7,"itype":"","hit":1},{"k":"smite","id":97,"cls":"pal","kind":"normal","mode":"S1","dmg":"calc1","ex":"smite","label":"Smite","srcdam":128,"desc":10,"itype":"shld","hit":0},{"k":"foh","id":121,"cls":"pal","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"foh","label":"Fist of the Heavens","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"holybolt","id":101,"cls":"pal","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"holybolt","label":"Holy Bolt","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"holynova","id":364,"cls":"pal","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"holynova","label":"Holy Nova","srcdam":128,"desc":5,"cd":[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],"itype":"","hit":0},{"k":"holylight","id":371,"cls":"pal","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"holylight","label":"Holy Light","srcdam":128,"desc":0,"itype":"","hit":0},{"k":"lightning","id":49,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Lightning","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"chainlightning","id":53,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Chain Lightning","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"nova","id":48,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Nova","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"firebolt","id":36,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Fire Bolt","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"fireball","id":47,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Fire Ball","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"icebolt","id":39,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Ice Bolt","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"iceblast","id":45,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Ice Blast","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"glacialspike","id":55,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Glacial Spike","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"frostnova","id":44,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Frost Nova","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"frozenorb","id":64,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"frozenorb","label":"Frozen Orb","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"blizzard","id":59,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"blizzard","label":"Blizzard","srcdam":128,"desc":5,"cd":[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],"itype":"","hit":0},{"k":"icebarrage","id":369,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"icebarrage","label":"Ice Barrage","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"chargedbolt","id":38,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"chargedbolt","label":"Charged Bolt","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"meteor","id":56,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"meteor","label":"Meteor","srcdam":128,"desc":5,"cd":[13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],"itype":"","hit":0},{"k":"combustion","id":376,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"combustion","label":"Combustion","srcdam":128,"desc":5,"cd":[63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],"itype":"","hit":0},{"k":"inferno","id":41,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"inferno","tick":"channel","label":"Inferno","srcdam":128,"desc":8,"itype":"","hit":0},{"k":"thunderstorm","id":57,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"tstorm","tick":"period","label":"Thunder Storm","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"hydra","id":62,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"hydra","tick":"summon","pet":true,"label":"Hydra","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"lesserhydra","id":383,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"hydra","tick":"summon","pet":true,"label":"Lesser Hydra","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"firewall","id":51,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"firewall","label":"Fire Wall","srcdam":128,"desc":9,"cd":[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38],"itype":"","hit":0},{"k":"blaze","id":46,"cls":"sor","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"blaze","label":"Blaze","srcdam":128,"desc":9,"cd":[50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50],"itype":"","hit":1},{"k":"teeth","id":67,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"fan1","label":"Teeth","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"bonespear","id":84,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"fan1","label":"Bone Spear","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"bonespirit","id":93,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Bone Spirit","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"poisonnova","id":92,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"pnova","label":"Poison Nova","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"cexpl","id":74,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"cexpl","label":"Corpse Explosion","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"darkpact","id":381,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"dpact","label":"Dark Pact","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"tornado","id":245,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"DmgSymPerCalc","ex":"tornado","label":"Tornado","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"twister","id":240,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"DmgSymPerCalc","ex":"twister","label":"Twister","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"arcticblast","id":230,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"arctic","tick":"channel","label":"Arctic Blast","srcdam":128,"desc":8,"itype":"","hit":0},{"k":"hurricane","id":250,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"hurricane","tick":"aura","label":"Hurricane","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"armageddon","id":249,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"armageddon","tick":"aura","label":"Armageddon","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"moltenboulder","id":229,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"boulder","label":"Molten Boulder","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"volcano","id":244,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"volcano","label":"Volcano","srcdam":128,"desc":5,"cd":[13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],"itype":"","hit":0},{"k":"fissure","id":234,"cls":"dru","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"fissure","label":"Fissure","srcdam":128,"desc":5,"cd":[13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],"itype":"","hit":0},{"k":"desecrate","id":83,"cls":"nec","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"desecrate","label":"Desecrate","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"poisonstrike","id":73,"cls":"nec","kind":"normal","mode":"A1","dmg":null,"syn":"EDmgSymPerCalc","spois":true,"ppierce":true,"label":"Poison Strike","srcdam":128,"desc":5,"itype":"knif","hit":1},{"k":"mindblast","id":273,"cls":"ass","kind":"cast","mode":"SC","dmg":null,"syn":"DmgSymPerCalc","ex":"mindblast","label":"Mind Blast","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"psychichammer","id":253,"cls":"ass","kind":"cast","mode":"SC","dmg":null,"syn":"EDmgSymPerCalc","ex":"spell1","label":"Psychic Hammer","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"lightningsentry","id":366,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"trap","tick":"summon","trap":true,"pet":true,"label":"Lightning Sentry","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"chainlightningsentry","id":271,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"trap","tick":"summon","trap":true,"pet":true,"label":"Chain Lightning Sentry","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"chargedboltsentry","id":261,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"trap","tick":"summon","trap":true,"pet":true,"label":"Charged Bolt Sentry","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"wakeoffire","id":262,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"trap","tick":"summon","trap":true,"pet":true,"label":"Wake of Fire","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"wakeofinferno","id":272,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"trap","tick":"summon","trap":true,"pet":true,"label":"Wake of Inferno","srcdam":128,"desc":8,"itype":"","hit":0},{"k":"deathsentry","id":276,"cls":"ass","kind":"cast","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"dsentry","tick":"summon","trap":true,"pet":true,"label":"Death Sentry","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"fireblast","id":251,"cls":"ass","kind":"normal","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"fireblast","bombs":true,"mroll":true,"label":"Fire Blast","srcdam":128,"desc":5,"itype":"","hit":0},{"k":"shockweb","id":256,"cls":"ass","kind":"normal","mode":"S2","dmg":null,"syn":"EDmgSymPerCalc","ex":"shockweb","bombs":true,"mroll":true,"label":"Shock Web","srcdam":128,"desc":8,"itype":"","hit":0},{"k":"bladesentinel","id":257,"cls":"ass","kind":"normal","mode":"S2","dmg":null,"missile":true,"syn":"DmgSymPerCalc","sphys":true,"sentinel":true,"ex":"sentinel","label":"Blade Sentinel","srcdam":128,"desc":28,"itype":"","hit":1},{"k":"bladeshield","id":277,"cls":"ass","kind":"normal","mode":"SC","dmg":null,"tick":"period","dfill":true,"label":"Blade Shield","srcdam":32,"desc":5,"itype":"","hit":1}],"skills":{"392":{"Id":"392","skill":"Sentry Lightning","HitShift":"8","anim":"SQ","reqlevel":"1","Param1":"12","Param2":"20","Param3":"4","Param8":"7","calc4":"par8","name":"Sentry Lightning"},"383":{"Id":"383","skill":"Lesser Hydra","charclass":"sor","EType":"fire","HitShift":"7","EMin":"7","EMax":"13","EDmgSymPerCalc":"skill('Fire Bolt'.blvl)*par7 + skill('Hydra'.blvl)*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"6","EMinLev2":"14","EMinLev3":"24","EMinLev4":"34","EMinLev5":"34","EMaxLev1":"8","EMaxLev2":"16","EMaxLev3":"26","EMaxLev4":"36","EMaxLev5":"36","Param1":"125","Param2":"0","Param7":"12","Param8":"12","passivestat1":"passive_fire_mastery","passivecalc1":"stat('passive_fire_mastery'.accr)","petmax":"9","name":"Lesser Hydra","tab":8},"62":{"Id":"62","skill":"Hydra","charclass":"sor","EType":"fire","HitShift":"7","EMin":"84","EMax":"117","EDmgSymPerCalc":"(skill('Fire Bolt'.blvl) + skill('Lesser Hydra'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"16","EMinLev2":"23","EMinLev3":"31","EMinLev4":"38","EMinLev5":"44","EMaxLev1":"20","EMaxLev2":"25","EMaxLev3":"35","EMaxLev4":"41","EMaxLev5":"47","Param1":"125","Param2":"0","Param8":"6","passivestat1":"passive_fire_mastery","passivecalc1":"stat('passive_fire_mastery'.accr)","petmax":"\"min(9 + stat('extra_hydra'.accr) * 3, 15)\"","name":"Hydra","tab":8},"36":{"Id":"36","skill":"Fire Bolt","charclass":"sor","EType":"fire","HitShift":"7","EMin":"6","EMax":"12","EDmgSymPerCalc":"(skill('Fire Ball'.blvl)+skill('Combustion'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"4","EMinLev2":"16","EMinLev3":"30","EMinLev4":"46","EMinLev5":"46","EMaxLev1":"6","EMaxLev2":"18","EMaxLev3":"32","EMaxLev4":"48","EMaxLev5":"48","Param8":"18","name":"Fire Bolt","tab":8},"376":{"Id":"376","skill":"Combustion","charclass":"sor","EType":"fire","HitShift":"7","EMin":"24","EMax":"56","EDmgSymPerCalc":"(skill('Fire Bolt'.blvl) + skill('Fire Ball'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"12","EMinLev2":"16","EMinLev3":"20","EMinLev4":"24","EMinLev5":"28","EMaxLev1":"14","EMaxLev2":"18","EMaxLev3":"22","EMaxLev4":"26","EMaxLev5":"30","Param1":"32","Param8":"12","calc2":"par1","name":"Combustion","tab":8},"47":{"Id":"47","skill":"Fire Ball","charclass":"sor","EType":"fire","HitShift":"7","EMin":"12","EMax":"28","EDmgSymPerCalc":"(skill('Fire Bolt'.blvl)+skill('Combustion'.blvl))*par8","aurarangecalc":"4 + blvl / 5","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"13","EMinLev2":"23","EMinLev3":"28","EMinLev4":"33","EMinLev5":"38","EMaxLev1":"15","EMaxLev2":"25","EMaxLev3":"30","EMaxLev4":"35","EMaxLev5":"40","Param8":"15","name":"Fire Ball","tab":8},"381":{"Id":"381","skill":"Dark Pact","charclass":"nec","EType":"mag","HitShift":"8","EMin":"3","EMax":"4","EDmgSymPerCalc":"(skill('CurMas'.blvl)+skill('Iron Maiden'.blvl))*16+(skill('AmpDmg'.blvl)+skill('Decrepify'.blvl)+skill('Confuse'.blvl)+skill('LowRes'.blvl)+skill('Terror'.blvl)+skill('Attract'.blvl)+skill('Dim Vision'.blvl)+skill('Life Tap'.blvl)+skill('Weaken'.blvl))*12","auralencalc":"1","aurarangecalc":"par1 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"2","EMinLev2":"3","EMinLev3":"4","EMinLev4":"6","EMinLev5":"8","EMaxLev1":"3","EMaxLev2":"4","EMaxLev3":"6","EMaxLev4":"8","EMaxLev5":"10","Param1":"6","Param2":"1","Param7":"12","Param8":"16","calc1":"4","name":"Dark Pact","tab":16},"374":{"Id":"374","skill":"CurMas","charclass":"nec","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"1","Param1":"5","Param2":"5","Param3":"1","Param4":"1","passivestat1":"max_curses","passivecalc1":"blvl / 10","name":"Curse Mastery","tab":16},"72":{"Id":"72","skill":"Weaken","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"18","Param1":"12","Param2":"1","Param3":"250","Param4":"35","Param5":"10","Param6":"1","Param7":"10","Param8":"2","aurastat1":"damagepercent","aurastat2":"skill_armor_percent","aurastatcalc1":"-(ln56 + skill('CurMas'.blvl) / 2)","aurastatcalc2":"-ln78","name":"Weaken","tab":16},"82":{"Id":"82","skill":"Life Tap","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"\"min(ln34, 500)\"","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"6","Param2":"1","Param3":"175","Param4":"35","Param5":"8","Param6":"2","calc1":"par5 + par6 * blvl + skill('CurMas'.blvl) / 2","name":"Life Tap","tab":16},"71":{"Id":"71","skill":"Dim Vision","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 ","anim":"SC","maxlvl":"20","reqlevel":"6","Param1":"6","Param2":"1","Param3":"150","Param4":"25","Param5":"40","Param6":"10","Param8":"10","aurastat1":"tohit","aurastatcalc1":"-(ln56 + skill('CurMas'.blvl)*par8)","name":"Dim Vision","tab":16},"86":{"Id":"86","skill":"Attract","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"\"min(ln34, 375)\"","aurarangecalc":"par1 + blvl / 3","anim":"SC","maxlvl":"20","reqlevel":"24","Param1":"4","Param2":"0","Param3":"200","Param4":"5","Param5":"120","Param6":"10","Param8":"5","aurastat1":"armorclass","aurastatcalc1":"-(ln56 + skill('CurMas'.blvl)*par8)","name":"Attract","tab":16},"77":{"Id":"77","skill":"Terror","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"par2","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"9","Param2":"75","Param3":"15","Param4":"2","Param5":"24","Param6":"2","aurastat1":"velocitypercent","aurastatcalc1":"-(par3 + par4 * blvl + skill('CurMas'.blvl))","name":"Terror","tab":16},"91":{"Id":"91","skill":"LowRes","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"9","Param2":"1","Param3":"200","Param4":"25","Param5":"19","Param6":"1","aurastat1":"fireresist","aurastat2":"lightresist","aurastat3":"coldresist","aurastat4":"poisonresist","aurastatcalc1":"-(1 * (par5 + par6*lvl + skill('CurMas'.blvl) / 2))","aurastatcalc2":"-(1 * (par5 + par6*lvl + skill('CurMas'.blvl) / 2))","aurastatcalc3":"-(1 * (par5 + par6*lvl + skill('CurMas'.blvl) / 2))","aurastatcalc4":"-(1 * (par5 + par6*lvl + skill('CurMas'.blvl) / 2))","name":"Lower Resist","tab":16},"81":{"Id":"81","skill":"Confuse","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"18","Param1":"9","Param2":"0","Param3":"500","Param4":"0","Param5":"40","Param6":"10","aurastat1":"attackrate","aurastatcalc1":"par5 + par6 * lvl + skill('CurMas'.blvl) * 5","name":"Confuse","tab":16},"87":{"Id":"87","skill":"Decrepify","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"24","Param1":"12","Param2":"1","Param3":"150","Param4":"10","Param5":"19","Param6":"19","aurastat1":"velocitypercent","aurastat2":"attackrate","aurastat3":"item_fastercastrate","aurastat4":"item_leap_speed","aurastat5":"damageresist","aurastatcalc1":"-\"min(par5 + lvl,60)\"","aurastatcalc2":"-\"min(par6 + lvl + skill('CurMas'.blvl),60)\"","aurastatcalc3":"-\"min(par6 + lvl + skill('CurMas'.blvl),60)\"","aurastatcalc4":"-\"min(par5 + blvl,60)\"","aurastatcalc5":"-(10 + (lvl/2))","name":"Decrepify","tab":16},"66":{"Id":"66","skill":"AmpDmg","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"1","Param1":"9","Param2":"1","Param3":"150","Param4":"5","Param5":"14","Param6":"1","aurastat1":"damageresist","aurastatcalc1":"-(par5 + par6*lvl + (skill('CurMas'.blvl)/2))","name":"Amplify Damage","tab":16},"76":{"Id":"76","skill":"Iron Maiden","charclass":"nec","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1 + blvl / 3 + skill('CurMas'.blvl) / 3","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"12","Param2":"0","Param3":"250","Param4":"30","Param5":"200","Param6":"25","Param8":"6","calc1":"ln56 + skill('CurMas'.blvl) * par8","calc2":"(ln56 + skill('CurMas'.blvl) * par8) / 4","calc3":"(ln56 + skill('CurMas'.blvl) * par8) / 4","name":"Iron Maiden","tab":16},"380":{"Id":"380","skill":"Blade Dance","charclass":"ass","HitShift":"8","ToHit":"200","LevToHit":"15","anim":"SQ","seqnum":"10","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"30","Param1":"30","Param2":"4","Param3":"6","Param5":"20","Param6":"2","calc1":"ln12","aurastat1":"velocitypercent","aurastat2":"item_attackrate","aurastatcalc1":"\"min(ln56, 65)\"","aurastatcalc2":"100","name":"Blade Dance"},"378":{"Id":"378","skill":"Joust","charclass":"pal","HitShift":"8","ToHit":"120","LevToHit":"16","auralencalc":"50","anim":"A1","SrcDam":"128","maxlvl":"20","reqlevel":"24","Param1":"40","Param2":"8","Param3":"10","Param4":"2","calc1":"ln12","calc2":"ln34","aurastat1":"velocitypercent","aurastatcalc1":"\"min(3 + (2 * lvl), 65)\"","name":"Joust","tab":24},"375":{"Id":"375","skill":"Split Throw","charclass":"bar","HitShift":"8","ToHit":"40","LevToHit":"15","anim":"TH","SrcDam":"128","maxlvl":"20","itypea1":"comb","reqlevel":"18","Param1":"3","Param2":"4","Param3":"1","Param4":"10","Param5":"80","Param6":"15","Param8":"12","calc1":"par1+(min(lvl/5,par2))","calc2":"1","calc3":"3","calc4":"ln56 + (skill('Increased Speed'.blvl) + skill('Concentrate'.blvl))*par8","aurastat1":"attackrate","aurastatcalc1":"par4","name":"Split Throw","tab":32},"144":{"Id":"144","skill":"Concentrate","charclass":"bar","EType":"mag","HitShift":"8","ToHit":"40","LevToHit":"20","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"12","Param1":"80","Param2":"25","Param3":"20","Param4":"5","Param7":"25","Param8":"25","calc1":"ln12+skill('Bash'.blvl)*par8+skill('Battle Command'.blvl)*par7","calc4":"30 + 2*blvl ","aurastat1":"skill_armor_percent","aurastat2":"inc_splash_radius","aurastatcalc1":"ln34","aurastatcalc2":"20","name":"Concentrate","tab":32},"155":{"Id":"155","skill":"Battle Command","charclass":"bar","HitShift":"8","auralencalc":"7500","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"125","Param2":"250","Param3":"20","Param4":"3","Param8":"125","aurastat1":"item_allskills","aurastat2":"damagepercent","aurastatcalc1":"1+blvl/10","aurastatcalc2":"ln34","name":"Battle Command","tab":34},"126":{"Id":"126","skill":"Bash","charclass":"bar","HitShift":"8","ToHit":"30","LevToHit":"20","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"1","Param3":"1","Param4":"1","Param5":"50","Param6":"25","Param7":"10","Param8":"20","calc1":"ln56 + (skill('Stun'.blvl) + skill('Concentrate'.blvl)) * par8","calc2":"ln34","name":"Bash","tab":32},"139":{"Id":"139","skill":"Stun","charclass":"bar","EType":"stun","HitShift":"8","ELen":"25","ToHitCalc":"40+lvl*15+skill('Concentrate'.blvl)*par7","aurarangecalc":"5","anim":"A1","SrcDam":"32","maxlvl":"20","itypea1":"mele","reqlevel":"6","MinDam":"2","MaxDam":"4","MinLevDam1":"1","MinLevDam2":"2","MinLevDam3":"3","MinLevDam4":"4","MinLevDam5":"5","MaxLevDam1":"2","MaxLevDam2":"3","MaxLevDam3":"4","MaxLevDam4":"5","MaxLevDam5":"6","ELevLen1":"4","ELevLen2":"4","ELevLen3":"2","Param1":"0","Param2":"0","Param6":"0","Param7":"10","Param8":"8","name":"Stun","tab":32},"148":{"Id":"148","skill":"Increased Speed","charclass":"bar","HitShift":"8","ELen":"2","anim":"SC","maxlvl":"20","reqlevel":"24","ELevLen1":"2","ELevLen2":"2","ELevLen3":"1","Param1":"7","Param2":"50","passivestat1":"velocitypercent","passivestat2":"item_fasterattackrate","passivecalc1":"dm12","passivecalc2":"blvl * 2","name":"Increased Speed","tab":33},"371":{"Id":"371","skill":"Holy Light","charclass":"pal","EType":"mag","HitShift":"8","EMin":"7","EMax":"9","EDmgSymPerCalc":"(skill('Holy Bolt'.blvl)+skill('Fist of the Heavens'.blvl))*par8","aurarangecalc":"6","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"2","EMinLev2":"6","EMinLev3":"13","EMinLev4":"21","EMinLev5":"30","EMaxLev1":"3","EMaxLev2":"8","EMaxLev3":"15","EMaxLev4":"23","EMaxLev5":"36","Param1":"30","Param2":"5","Param3":"50","Param4":"10","Param6":"5","Param7":"10","Param8":"10","name":"Holy Light","tab":24},"121":{"Id":"121","skill":"Fist of the Heavens","charclass":"pal","EType":"ltng","HitShift":"8","EMin":"100","EMax":"150","EDmgSymPerCalc":"(skill('Holy Light'.blvl)+skill('Holy Nova'.blvl)+skill('Holy Bolt'.blvl))*par8","aurarangecalc":"20","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"2","EMinLev2":"5","EMinLev3":"8","EMinLev4":"12","EMinLev5":"17","EMaxLev1":"5","EMaxLev2":"11","EMaxLev3":"17","EMaxLev4":"24","EMaxLev5":"32","Param1":"50","Param2":"0","Param3":"0","Param4":"0","Param5":"0","Param6":"0","Param8":"11","calc1":"0","calc2":"0","calc4":"ln12","name":"Fist of the Heavens","tab":24},"101":{"Id":"101","skill":"Holy Bolt","charclass":"pal","EType":"mag","HitShift":"8","EMin":"3","EMax":"5","ELen":"1","EDmgSymPerCalc":"(skill('Holy Light'.blvl)+skill('Holy Nova'.blvl)+skill('Fist of the Heavens'.blvl))*par8","ELenSymPerCalc":"skill('Prayer'.blvl) * par7","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"5","EMinLev3":"12","EMinLev4":"19","EMinLev5":"27","EMaxLev1":"2","EMaxLev2":"7","EMaxLev3":"14","EMaxLev4":"21","EMaxLev5":"29","ELevLen1":"1","ELevLen2":"1","ELevLen3":"1","Param1":"2","Param2":"1","Param3":"4","Param4":"1","Param7":"5","Param8":"11","calc1":"\"max(1, 1 + ((lvl<15)?0:1) + ((lvl<25)?0:1) + stat('extra_holybolts'.accr))\"","calc3":"100","name":"Holy Bolt","tab":24},"99":{"Id":"99","skill":"Prayer","charclass":"pal","HitShift":"8","EMin":"4","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"1","EMinLev1":"2","EMinLev2":"3","EMinLev3":"4","EMinLev4":"5","EMinLev5":"5","Param1":"20","Param2":"3","aurastat1":"hitpoints","aurastat2":"item_healafterhit","aurastatcalc1":"edns","aurastatcalc2":"1 + lvl / 2","passivestat1":"hpregen","passivecalc1":"blvl","perdelay":"50","name":"Prayer","tab":26},"364":{"Id":"364","skill":"Holy Nova","charclass":"pal","EType":"mag","HitShift":"8","EMin":"8","EMax":"16","EDmgSymPerCalc":"(skill('Fist of the Heavens'.blvl)+skill('Holy Bolt'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"8","EMinLev2":"10","EMinLev3":"13","EMinLev4":"16","EMinLev5":"20","EMaxLev1":"8","EMaxLev2":"11","EMaxLev3":"15","EMaxLev4":"18","EMaxLev5":"23","Param1":"100","Param2":"20","Param6":"8","Param7":"10","Param8":"15","name":"Holy Nova","tab":24},"369":{"Id":"369","skill":"Ice Barrage","charclass":"sor","EType":"cold","HitShift":"7","EMin":"32","EMax":"46","EDmgSymPerCalc":"(skill('Ice Bolt'.blvl)+skill('Glacial Spike'.blvl))*par8","auralencalc":"ln34 * (100 + skill('Blizzard'.blvl) * par7) / 100","aurarangecalc":"ln12","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"5","EMinLev2":"9","EMinLev3":"13","EMinLev4":"17","EMinLev5":"21","EMaxLev1":"6","EMaxLev2":"10","EMaxLev3":"14","EMaxLev4":"18","EMaxLev5":"22","Param1":"7","Param2":"0","Param3":"0","Param4":"3","Param5":"3","Param6":"2","Param7":"0","Param8":"8","calc1":"par5+(min(blvl/3,par6))","calc3":"100","name":"Ice Barrage","tab":10},"59":{"Id":"59","skill":"Blizzard","charclass":"sor","EType":"cold","HitShift":"8","EMin":"17","EMax":"24","ELen":"100","EDmgSymPerCalc":"(skill('Ice Bolt'.blvl)+skill('Ice Blast'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"5","EMinLev2":"6","EMinLev3":"8","EMinLev4":"10","EMinLev5":"14","EMaxLev1":"7","EMaxLev2":"8","EMaxLev3":"11","EMaxLev4":"14","EMaxLev5":"19","Param1":"8","Param3":"2","Param4":"0","Param8":"12","calc1":"par1","calc2":"par3","name":"Blizzard","tab":10},"45":{"Id":"45","skill":"Ice Blast","charclass":"sor","EType":"cold","HitShift":"7","EMin":"10","EMax":"16","ELen":"50","EDmgSymPerCalc":"(skill('Ice Bolt'.blvl)+skill('Glacial Spike'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"12","EMinLev2":"24","EMinLev3":"42","EMinLev4":"56","EMinLev5":"70","EMaxLev1":"14","EMaxLev2":"28","EMaxLev3":"43","EMaxLev4":"57","EMaxLev5":"71","ELevLen1":"2","ELevLen2":"2","ELevLen3":"2","Param1":"50","Param2":"2","Param7":"0","Param8":"6","name":"Ice Blast","tab":10},"55":{"Id":"55","skill":"Glacial Spike","charclass":"sor","EType":"cold","HitShift":"7","EMin":"40","EMax":"56","EDmgSymPerCalc":"(skill('Ice Blast'.blvl)+skill('Ice Bolt'.blvl))*par8","auralencalc":"ln34 * (100 + skill('Blizzard'.blvl) * par7) / 100","aurarangecalc":"ln12","anim":"SC","maxlvl":"20","reqlevel":"18","EMinLev1":"14","EMinLev2":"26","EMinLev3":"28","EMinLev4":"30","EMinLev5":"32","EMaxLev1":"15","EMaxLev2":"27","EMaxLev3":"29","EMaxLev4":"31","EMaxLev5":"33","Param1":"6","Param2":"0","Param3":"50","Param4":"0","Param7":"5","Param8":"8","name":"Glacial Spike","tab":10},"39":{"Id":"39","skill":"Ice Bolt","charclass":"sor","EType":"cold","HitShift":"7","EMin":"6","EMax":"10","ELen":"150","EDmgSymPerCalc":"(skill('Ice Blast'.blvl)+skill('Glacial Spike'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"4","EMinLev2":"11","EMinLev3":"26","EMinLev4":"41","EMinLev5":"56","EMaxLev1":"6","EMaxLev2":"14","EMaxLev3":"35","EMaxLev4":"56","EMaxLev5":"77","ELevLen1":"10","ELevLen2":"10","ELevLen3":"10","Param8":"20","name":"Ice Bolt","tab":10},"366":{"Id":"366","skill":"Lightning Sentry","charclass":"ass","EType":"ltng","HitShift":"8","EMin":"7","EMax":"30","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Charged Bolt Sentry'.blvl) + skill('Chain Lightning Sentry'.blvl))*par8","anim":"S2","maxlvl":"20","reqlevel":"24","EMinLev1":"3","EMinLev2":"4","EMinLev3":"5","EMinLev4":"7","EMinLev5":"8","EMaxLev1":"15","EMaxLev2":"21","EMaxLev3":"27","EMaxLev4":"33","EMaxLev5":"39","Param1":"7","Param8":"16","passivestat1":"passive_ltng_mastery","passivecalc1":"stat('passive_ltng_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Lightning Sentry","tab":48},"271":{"Id":"271","skill":"Chain Lightning Sentry","charclass":"ass","EType":"ltng","HitShift":"8","EMin":"9","EMax":"50","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Charged Bolt Sentry'.blvl) + skill('Lightning Sentry'.blvl))*par8","aurarangecalc":"par1","anim":"S2","maxlvl":"20","reqlevel":"30","EMinLev1":"1","EMinLev2":"2","EMinLev3":"3","EMinLev4":"4","EMinLev5":"5","EMaxLev1":"8","EMaxLev2":"12","EMaxLev3":"18","EMaxLev4":"26","EMaxLev5":"36","Param1":"20","Param8":"13","passivestat1":"passive_ltng_mastery","passivecalc1":"stat('passive_ltng_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Chain Lightning Sentry","tab":48},"261":{"Id":"261","skill":"Charged Bolt Sentry","charclass":"ass","EType":"ltng","HitShift":"7","EMin":"2","EMax":"16","EDmgSymPerCalc":"(skill('Chain Lightning Sentry'.blvl)) * par7 + (skill('Lightning Sentry'.blvl) + skill('Fire Trauma'.blvl)) * par8","anim":"S2","maxlvl":"20","reqlevel":"12","EMinLev1":"0","EMinLev2":"0","EMinLev3":"0","EMinLev4":"0","EMinLev5":"0","EMaxLev1":"10","EMaxLev2":"11","EMaxLev3":"12","EMaxLev4":"13","EMaxLev5":"14","Param1":"5","Param3":"5","Param4":"0","Param7":"8","Param8":"8","calc3":"\"min((4 + blvl/4), 10)\"","calc4":"5","passivestat1":"passive_ltng_mastery","passivecalc1":"stat('passive_ltng_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Charged Bolt Sentry","tab":48},"251":{"Id":"251","skill":"Fire Trauma","charclass":"ass","EType":"fire","HitShift":"7","EMin":"4","EMax":"6","EDmgSymPerCalc":"(skill('Shock Field'.blvl) + skill('Charged Bolt Sentry'.blvl) + skill('Lightning Sentry'.blvl) + skill('Chain Lightning Sentry'.blvl)  + skill('Wake of Fire Sentry'.blvl) + skill('Inferno Sentry'.blvl)) * par8","aurarangecalc":"(par1+blvl/par2)/2+1","anim":"S2","maxlvl":"20","reqlevel":"1","EMinLev1":"2","EMinLev2":"4","EMinLev3":"8","EMinLev4":"18","EMinLev5":"23","EMaxLev1":"3","EMaxLev2":"5","EMaxLev3":"10","EMaxLev4":"20","EMaxLev5":"25","Param1":"1","Param2":"3","Param8":"18","prgcalc1":"\"min(par1+lvl/par2,9)\"","name":"Fire Blast","tab":48},"272":{"Id":"272","skill":"Inferno Sentry","charclass":"ass","EType":"fire","HitShift":"4","EMin":"60","EMax":"100","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Wake of Fire Sentry'.blvl))*par8","anim":"S2","maxlvl":"20","reqlevel":"24","EMinLev1":"34","EMinLev2":"68","EMinLev3":"102","EMinLev4":"136","EMinLev5":"170","EMaxLev1":"40","EMaxLev2":"80","EMaxLev3":"120","EMaxLev4":"160","EMaxLev5":"200","Param1":"10","Param7":"12","Param8":"12","passivestat1":"passive_fire_mastery","passivecalc1":"stat('passive_fire_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Wake of Inferno","tab":48},"262":{"Id":"262","skill":"Wake of Fire Sentry","charclass":"ass","EType":"fire","HitShift":"8","EMin":"2","EMax":"4","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Inferno Sentry'.blvl)) * par8","anim":"S2","maxlvl":"20","reqlevel":"12","EMinLev1":"1","EMinLev2":"4","EMinLev3":"13","EMinLev4":"22","EMinLev5":"22","EMaxLev1":"2","EMaxLev2":"6","EMaxLev3":"16","EMaxLev4":"26","EMaxLev5":"26","Param1":"5","Param8":"8","passivestat1":"passive_fire_mastery","passivecalc1":"stat('passive_fire_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Wake of Fire","tab":48},"256":{"Id":"256","skill":"Shock Field","charclass":"ass","EType":"ltng","HitShift":"4","EMin":"2","EMax":"5","EDmgSymPerCalc":"(skill('Charged Bolt Sentry'.blvl)+skill('Lightning Sentry'.blvl)+skill('Fire Trauma'.blvl)+skill('Chain Lightning Sentry'.blvl)+skill('Wake Of Fire Sentry'.blvl)+skill('Inferno Sentry'.blvl))*par8","aurarangecalc":"(par1+lvl/par2)/3+1","anim":"S2","maxlvl":"20","reqlevel":"6","EMinLev1":"1","EMinLev2":"2","EMinLev3":"3","EMinLev4":"4","EMinLev5":"6","EMaxLev1":"4","EMaxLev2":"10","EMaxLev3":"16","EMaxLev4":"22","EMaxLev5":"28","Param1":"4","Param2":"3","Param8":"17","prgcalc1":"par1+lvl/par2","name":"Shock Web","tab":48},"313":{"Id":"313","skill":"Sentry Chain Lightning","HitShift":"8","aurarangecalc":"par7","anim":"SQ","reqlevel":"1","Param1":"10","Param2":"20","Param3":"4","Param4":"8","Param7":"20","Param8":"7","calc1":"par4","calc4":"par8","name":"Sentry Chain Lightning"},"312":{"Id":"312","skill":"mon death sentry","EType":"fire","HitShift":"8","EMin":"16","EMax":"20","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Inferno Sentry'.blvl)) * par7","aurarangecalc":"ln34","anim":"SQ","reqlevel":"1","EMinLev1":"3","EMinLev2":"5","EMinLev3":"7","EMinLev4":"9","EMinLev5":"11","EMaxLev1":"4","EMaxLev2":"6","EMaxLev3":"8","EMaxLev4":"10","EMaxLev5":"12","MinDam":"16","MaxDam":"20","DmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Inferno Sentry'.blvl)) * par7","MinLevDam1":"3","MinLevDam2":"5","MinLevDam3":"7","MinLevDam4":"9","MinLevDam5":"11","MaxLevDam1":"4","MaxLevDam2":"6","MaxLevDam3":"8","MaxLevDam4":"10","MaxLevDam5":"12","Param1":"3","Param2":"5","Param3":"42","Param4":"0","Param7":"9","Param8":"10","calc1":"par1","calc2":"par2","calc3":"50","calc4":"500","name":"mon death sentry"},"311":{"Id":"311","skill":"mon inferno sentry","HitShift":"8","anim":"SQ","reqlevel":"1","Param1":"5","Param3":"20","Param7":"10","Param8":"5","calc1":"20","calc2":"25","calc3":"3","calc4":"par8","name":"mon inferno sentry"},"306":{"Id":"306","skill":"BoltSentry","HitShift":"8","anim":"SC","reqlevel":"1","Param1":"5","Param2":"0","Param8":"5","calc1":"\"min((4 + blvl/4), 10)\"","calc4":"par8 + skill('Lightning Sentry'.blvl)/4","name":"BoltSentry"},"297":{"Id":"297","skill":"Wolverine Aura","HitShift":"8","aurarangecalc":"ln12","anim":"SQ","reqlevel":"1","Param1":"30","Param2":"2","Param3":"25","Param4":"8","Param5":"25","Param6":"8","aurastat1":"item_tohit_percent","aurastat2":"damagepercent","aurastatcalc1":"ln34","aurastatcalc2":"ln56","name":"Wolverine Aura"},"281":{"Id":"281","skill":"Wake Of Destruction Sentry","HitShift":"8","anim":"SQ","reqlevel":"1","Param1":"6","Param2":"2","Param4":"2","Param8":"5","calc4":"par8","name":"Wake Of Destruction Sentry"},"280":{"Id":"280","skill":"Royal Strike","charclass":"ass","HitShift":"8","ToHit":"160","LevToHit":"10","auralencalc":"7500","aurarangecalc":"par1","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"30","Param1":"8","Param2":"6","Param3":"25","Param5":"24","Param6":"10","Param7":"25","calc1":"par2","aurastat1":"progressive_other","aurastat2":"progressive_tohit","aurastatcalc2":"par7","name":"Phoenix Strike","tab":50},"278":{"Id":"278","skill":"Venom","charclass":"ass","EType":"pois","HitShift":"5","EMin":"24","EMax":"32","ELen":"25","EDmgSymPerCalc":"(skill('Cobra Strike'.blvl)) * par8","auralencalc":"ln12","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"6","EMinLev2":"10","EMinLev3":"14","EMinLev4":"18","EMinLev5":"22","EMaxLev1":"6","EMaxLev2":"10","EMaxLev3":"14","EMaxLev4":"18","EMaxLev5":"22","Param1":"7500","Param2":"125","Param3":"0","Param4":"0","Param5":"0","Param6":"0","Param8":"14","aurastat1":"poisonmindam","aurastat2":"poisonmaxdam","aurastat3":"skill_poison_override_length","aurastatcalc1":"edns","aurastatcalc2":"edxs","aurastatcalc3":"edln","name":"Venom","tab":49},"265":{"Id":"265","skill":"Cobra Strike","charclass":"ass","EType":"pois","HitShift":"8","ELen":"25","ToHit":"60","LevToHit":"14","auralencalc":"par3","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"12","ELevLen1":"0","ELevLen2":"0","ELevLen3":"0","Param1":"16","Param2":"4","Param3":"7500","Param4":"50","Param5":"7","Param6":"60","Param7":"30","calc1":"ln12","calc2":"par6+(lvl*par7)","aurastat1":"progressive_steal","aurastat2":"progressive_tohit","aurastatcalc2":"par4","prgcalc1":"par5","name":"Cobra Strike","tab":50},"277":{"Id":"277","skill":"Blade Shield","charclass":"ass","HitShift":"8","ToHit":"40","LevToHit":"15","auralencalc":"ln12","aurarangecalc":"par4","anim":"SC","SrcDam":"32","maxlvl":"20","reqlevel":"24","MinDam":"1","MaxDam":"30","DmgSymPerCalc":"(skill('Blade Sentinel'.blvl)+skill('Blade Fury'.blvl))*par8","MinLevDam1":"5","MinLevDam2":"7","MinLevDam3":"10","MinLevDam4":"13","MinLevDam5":"16","MaxLevDam1":"5","MaxLevDam2":"7","MaxLevDam3":"10","MaxLevDam4":"13","MaxLevDam5":"16","Param1":"7500","Param2":"125","Param3":"20","Param4":"4","Param8":"10","perdelay":"par3 - (blvl / 2)","prgcalc1":"par4","name":"Blade Shield","tab":48},"266":{"Id":"266","skill":"Blade Fury","charclass":"ass","HitShift":"8","ToHit":"60","LevToHit":"15","anim":"SQ","seqnum":"23","SrcDam":"96","maxlvl":"20","passiveitype":"mele","reqlevel":"18","MinDam":"3","MaxDam":"6","DmgSymPerCalc":"(skill('Blade Sentinel'.blvl)+skill('Blade Shield'.blvl))*par8","MinLevDam1":"1","MinLevDam2":"2","MinLevDam3":"3","MinLevDam4":"4","MinLevDam5":"5","MaxLevDam1":"2","MaxLevDam2":"3","MaxLevDam3":"4","MaxLevDam4":"5","MaxLevDam5":"6","Param1":"0","Param2":"0","Param3":"3","Param4":"4","Param5":"0","Param8":"10","passivestat1":"skill_pierce","passivecalc1":"skill('Blade Fury'.lvl)*par5","prgcalc1":"par4","name":"Blade Fury","tab":48},"257":{"Id":"257","skill":"Blade Sentinel","charclass":"ass","HitShift":"8","ToHit":"40","LevToHit":"15","aurarangecalc":"7","anim":"S2","SrcDam":"128","maxlvl":"20","reqlevel":"6","MinDam":"1","MaxDam":"3","DmgSymPerCalc":"(skill('Blade Fury'.blvl)+skill('Blade Shield'.blvl))*par8","MinLevDam1":"1","MinLevDam2":"1","MinLevDam3":"2","MinLevDam4":"3","MinLevDam5":"4","MaxLevDam1":"1","MaxLevDam2":"1","MaxLevDam3":"2","MaxLevDam4":"3","MaxLevDam5":"4","Param3":"5","Param4":"3","Param8":"12","calc4":"50","passivestat1":"tohit","passivestat2":"passive_phys_pierce","passivecalc1":"lvl*5","passivecalc2":"stat('passive_phys_pierce'.accr) / 2","petmax":"15","name":"Blade Sentinel","tab":48},"276":{"Id":"276","skill":"Death Sentry","charclass":"ass","EType":"fire","HitShift":"8","EMin":"16","EMax":"20","EDmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Inferno Sentry'.blvl)) * par7","anim":"S2","maxlvl":"20","reqlevel":"30","EMinLev1":"5","EMinLev2":"7","EMinLev3":"9","EMinLev4":"11","EMinLev5":"13","EMaxLev1":"6","EMaxLev2":"8","EMaxLev3":"10","EMaxLev4":"12","EMaxLev5":"14","MinDam":"16","MaxDam":"20","DmgSymPerCalc":"(skill('Fire Trauma'.blvl) + skill('Inferno Sentry'.blvl)) * par7","MinLevDam1":"5","MinLevDam2":"7","MinLevDam3":"9","MinLevDam4":"11","MinLevDam5":"13","MaxLevDam1":"6","MaxLevDam2":"8","MaxLevDam3":"10","MaxLevDam4":"12","MaxLevDam5":"14","Param1":"500","Param7":"9","passivestat1":"passive_fire_mastery","passivecalc1":"stat('passive_fire_mastery'.accr)","petmax":"5 - stat('pvp_disable'.accr)","name":"Death Sentry","tab":48},"275":{"Id":"275","skill":"Dragon Flight","charclass":"ass","HitShift":"8","ToHit":"180","LevToHit":"15","aurarangecalc":"par7","anim":"KK","maxlvl":"20","reqlevel":"24","Param1":"100","Param2":"25","Param7":"40","calc2":"ln12","name":"Dragon Flight","tab":50},"274":{"Id":"274","skill":"Blades of Ice","charclass":"ass","EType":"cold","HitShift":"8","EMin":"13","EMax":"30","ELen":"250","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl)) * par8","ToHit":"160","LevToHit":"10","auralencalc":"par3","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"24","EMinLev1":"7","EMinLev2":"10","EMinLev3":"23","EMinLev4":"37","EMinLev5":"49","EMaxLev1":"9","EMaxLev2":"12","EMaxLev3":"25","EMaxLev4":"37","EMaxLev5":"50","Param1":"6","Param2":"6","Param3":"7500","Param4":"50","Param5":"1","Param8":"17","aurastat1":"progressive_cold","aurastat2":"progressive_tohit","aurastatcalc2":"par4","name":"Blades of Ice","tab":50},"254":{"Id":"254","skill":"Tiger Strike","charclass":"ass","HitShift":"8","ToHit":"25","LevToHit":"15","auralencalc":"par3","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"1","Param1":"50","Param2":"25","Param3":"7500","Param4":"50","calc1":"ln12","calc2":"20","aurastat1":"progressive_damage","aurastat2":"progressive_tohit","aurastatcalc2":"par4","name":"Tiger Strike","tab":50},"273":{"Id":"273","skill":"Mind Blast","charclass":"ass","HitShift":"8","ELen":"100","ELenSymPerCalc":"blvl * -50","auralencalc":"20","aurarangecalc":"\"min(par7 + (1 - stat('pvp_disable'.accr))*(blvl / 2), 7)\"","anim":"SC","maxlvl":"20","reqlevel":"18","MinDam":"10","MaxDam":"20","DmgSymPerCalc":"(skill('Cloak of Shadows'.blvl)+skill('Psychic Hammer'.blvl)+skill('Shadow Warrior'.blvl))*par8","MinLevDam1":"3","MinLevDam2":"7","MinLevDam3":"17","MinLevDam4":"34","MinLevDam5":"51","MaxLevDam1":"3","MaxLevDam2":"7","MaxLevDam3":"17","MaxLevDam4":"34","MaxLevDam5":"51","ELevLen1":"0","ELevLen2":"0","ELevLen3":"0","Param1":"50","Param2":"0","Param5":"2","Param6":"3","Param7":"4","Param8":"13","calc1":"par5","calc2":"par6","aurastat1":"progressive_mindblast","aurastatcalc1":"1","name":"Mind Blast","tab":49},"268":{"Id":"268","skill":"Shadow Warrior","charclass":"ass","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"18","Param1":"5","Param2":"40","Param3":"12","Param4":"0","Param5":"20","Param6":"3","Param7":"5","Param8":"90","calc4":"ln56","aurastat1":"tohit","aurastat2":"skill_armor_percent","aurastat3":"strength","aurastat4":"dexterity","aurastatcalc1":"lvl*par2","aurastatcalc2":"lvl*par3","aurastatcalc3":"lvl*10","aurastatcalc4":"lvl*10","passivestat1":"fireresist","passivestat2":"coldresist","passivestat3":"lightresist","passivestat4":"poisonresist","passivecalc1":"dm78","passivecalc2":"dm78","passivecalc3":"dm78","passivecalc4":"dm78","petmax":"1 + stat('extra_shadow'.accr)","name":"Shadow Warrior","tab":49},"253":{"Id":"253","skill":"Psychic Hammer","charclass":"ass","EType":"mag","HitShift":"8","EMin":"4","EMax":"6","EDmgSymPerCalc":"(skill('Cloak of Shadows'.blvl)+skill('Mind Blast'.blvl)+skill('Shadow Warrior'.blvl))*par8","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"3","EMinLev2":"6","EMinLev3":"12","EMinLev4":"24","EMinLev5":"36","EMaxLev1":"4","EMaxLev2":"8","EMaxLev3":"14","EMaxLev4":"26","EMaxLev5":"38","Param1":"8","Param8":"20","calc1":"\"min(2+(lvl/10), 6)\"","calc2":"20","name":"Psychic Hammer","tab":49},"264":{"Id":"264","skill":"Cloak of Shadows","charclass":"ass","HitShift":"8","auralencalc":"ln34","aurarangecalc":"dm12","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"30","Param2":"30","Param3":"125","Param4":"0","Param5":"15","Param6":"1","Param7":"10","Param8":"3","aurastat1":"skill_armor_percent","aurastatcalc1":"\"-min(ln56,95)\"","passivestat1":"item_armor_percent","passivecalc1":"ln78 / 2","name":"Cloak of Shadows","tab":49},"270":{"Id":"270","skill":"Dragon Tail","charclass":"ass","EType":"fire","HitShift":"8","ToHit":"210","LevToHit":"10","aurarangecalc":"par3","anim":"KK","maxlvl":"20","reqlevel":"18","Param1":"40","Param2":"13","Param3":"6","Param4":"-20","Param8":"8","calc1":"ln12 + (skill('Dragon Talon'.blvl)+ skill('Dragon Flight'.blvl))*par8","aurastat1":"attackrate","aurastatcalc1":"par4","name":"Dragon Tail","tab":50},"255":{"Id":"255","skill":"Dragon Talon","charclass":"ass","HitShift":"8","ToHit":"20","LevToHit":"25","anim":"KK","seqnum":"19","maxlvl":"20","reqlevel":"1","Param1":"60","Param2":"30","Param3":"25","Param4":"50","Param5":"25","Param6":"99","Param8":"25","calc1":"\"min(lvl/6+1, 3)\"","calc2":"ln12 + (skill('Dragon Tail'.blvl)+ skill('Dragon Flight'.blvl))*par8","name":"Dragon Talon","tab":50},"269":{"Id":"269","skill":"Claws of Thunder","charclass":"ass","EType":"ltng","HitShift":"8","EMin":"1","EMax":"80","EDmgSymPerCalc":"skill('Dragon Claw'.blvl) * par8","ToHit":"80","LevToHit":"12","auralencalc":"par3","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"18","EMinLev1":"0","EMinLev2":"0","EMinLev3":"0","EMinLev4":"0","EMinLev5":"0","EMaxLev1":"20","EMaxLev2":"40","EMaxLev3":"60","EMaxLev4":"80","EMaxLev5":"100","Param1":"4","Param3":"7500","Param4":"50","Param8":"16","aurastat1":"progressive_lightning","aurastat2":"progressive_tohit","aurastatcalc2":"par4","name":"Claws of Thunder","tab":50},"260":{"Id":"260","skill":"Dragon Claw","charclass":"ass","HitShift":"8","ToHit":"40","LevToHit":"20","anim":"SQ","seqnum":"16","SrcDam":"128","maxlvl":"20","itypea1":"h2h","reqlevel":"6","Param1":"50","Param2":"25","Param7":"20","Param8":"20","calc1":"ln12 + skill('Weapon Block'.blvl) * par8 + skill('Claw Mastery'.lvl) * par7","name":"Dragon Claw","tab":50},"252":{"Id":"252","skill":"Claw Mastery","charclass":"ass","HitShift":"8","anim":"SC","maxlvl":"20","itypea1":"asm","passiveitype":"asm","reqlevel":"1","Param1":"30","Param2":"10","Param3":"40","Param4":"15","Param5":"0","Param6":"30","passivestat1":"passive_mastery_melee_th","passivestat2":"passive_mastery_melee_dmg","passivestat3":"passive_mastery_melee_crit","passivecalc1":"ln12","passivecalc2":"ln34","passivecalc3":"dm56","name":"Claw and Dagger Mastery","tab":49},"263":{"Id":"263","skill":"Weapon Block","charclass":"ass","HitShift":"8","EMin":"15","EMax":"1","anim":"SC","maxlvl":"20","itypea1":"h2h","passiveitype":"h2h","reqlevel":"12","EMinLev1":"2","EMinLev2":"1","EMinLev3":"1","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","Param1":"0","Param2":"55","Param3":"20","Param4":"4","passivestat1":"passive_weaponblock","passivestat2":"item_fasterblockrate","passivecalc1":"dm12 + (stat('toblock'.accr) / 5)","passivecalc2":"lvl","name":"Weapon Block","tab":49},"259":{"Id":"259","skill":"Fists of Fire","charclass":"ass","EType":"fire","HitShift":"8","EMin":"1","EMax":"2","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * par8","ToHit":"35","LevToHit":"15","auralencalc":"par5","aurarangecalc":"par2","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"asm","reqlevel":"6","EMinLev1":"1","EMinLev2":"2","EMinLev3":"10","EMinLev4":"18","EMinLev5":"26","EMaxLev1":"1","EMaxLev2":"3","EMaxLev3":"15","EMaxLev4":"27","EMaxLev5":"39","Param1":"4","Param2":"4","Param3":"25","Param4":"0","Param5":"7500","Param6":"50","Param8":"26","calc1":"lvl*3","aurastat1":"progressive_fire","aurastat2":"progressive_tohit","aurastatcalc2":"par6","name":"Fists of Fire","tab":50},"258":{"Id":"258","skill":"Quickness","charclass":"ass","HitShift":"8","ELen":"20","auralencalc":"ln56","anim":"SC","maxlvl":"20","reqlevel":"6","ELevLen1":"2","ELevLen2":"1","ELevLen3":"1","Param3":"15","Param4":"60","Param5":"7500","Param6":"125","aurastat1":"velocitypercent","aurastat2":"attackrate","aurastatcalc1":"edln","aurastatcalc2":"((110*blvl) * (par4-par3))/(100 * (blvl+6)) + par3","name":"Burst of Speed","tab":49},"250":{"Id":"250","skill":"Hurricane","charclass":"dru","EType":"cold","HitShift":"8","EMin":"25","EMax":"50","ELen":"200","EDmgSymPerCalc":"(skill('Arctic Blast'.blvl)+skill('Tornado'.blvl))*par8","auralencalc":"ln12","aurarangecalc":"par3","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"4","EMinLev2":"8","EMinLev3":"12","EMinLev4":"16","EMinLev5":"20","EMaxLev1":"7","EMaxLev2":"11","EMaxLev3":"15","EMaxLev4":"19","EMaxLev5":"23","Param1":"1500","Param2":"75","Param3":"9","Param4":"20","Param7":"0","Param8":"13","name":"Hurricane","tab":42},"245":{"Id":"245","skill":"Tornado","charclass":"dru","HitShift":"8","aurarangecalc":"par2","anim":"SC","maxlvl":"20","reqlevel":"24","MinDam":"35","MaxDam":"39","DmgSymPerCalc":"(skill('Arctic Blast'.blvl)+skill('Twister'.blvl)+skill('Hurricane'.blvl))*par8","MinLevDam1":"6","MinLevDam2":"14","MinLevDam3":"22","MinLevDam4":"30","MinLevDam5":"38","MaxLevDam1":"8","MaxLevDam2":"16","MaxLevDam3":"24","MaxLevDam4":"32","MaxLevDam5":"40","Param1":"15","Param2":"4","Param6":"13","Param8":"14","calc1":"1","calc4":"par1","name":"Tornado","tab":42},"240":{"Id":"240","skill":"Twister","charclass":"dru","HitShift":"7","anim":"SC","maxlvl":"20","reqlevel":"12","MinDam":"13","MaxDam":"18","DmgSymPerCalc":"(skill('Tornado'.blvl)+skill('Hurricane'.blvl))*par8 + (skill('Arctic Blast'.blvl))*par7","MinLevDam1":"4","MinLevDam2":"8","MinLevDam3":"21","MinLevDam4":"44","MinLevDam5":"68","MaxLevDam1":"7","MaxLevDam2":"10","MaxLevDam3":"23","MaxLevDam4":"46","MaxLevDam5":"70","Param2":"0","Param3":"4","Param4":"1","Param5":"14","Param6":"13","Param7":"24","Param8":"24","calc1":"\"min(ln34 / 2, par5)\"","name":"Twister","tab":42},"230":{"Id":"230","skill":"Arctic Blast","charclass":"dru","EType":"cold","HitShift":"6","EMin":"2","EMax":"3","ELen":"150","EDmgSymPerCalc":"(skill('Tornado'.blvl)+skill('Cyclone Armor'.blvl))*par8+(skill('Hurricane'.blvl))*par7","auralencalc":"10","aurarangecalc":"ln12/4-2","anim":"SQ","seqnum":"18","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"4","EMinLev3":"14","EMinLev4":"24","EMinLev5":"29","EMaxLev1":"2","EMaxLev2":"5","EMaxLev3":"15","EMaxLev4":"25","EMaxLev5":"30","Param1":"24","Param2":"2","Param3":"4","Param4":"32","Param5":"4","Param6":"768","Param7":"16","Param8":"12","calc1":"\"min((ln12/2),24)\"","calc2":"20","calc3":"2","aurastat1":"coldresist","aurastatcalc1":"-\"min(5 + lvl, 100)\"","name":"Arctic Blast","tab":42},"235":{"Id":"235","skill":"Cyclone Armor","charclass":"dru","HitShift":"8","EMax":"15","anim":"SC","maxlvl":"20","reqlevel":"6","EMaxLev1":"16","EMaxLev2":"17","EMaxLev3":"18","EMaxLev4":"19","EMaxLev5":"20","Param1":"0","Param2":"0","Param8":"10","aurastat1":"bonearmor","aurastat2":"bonearmormax","aurastatcalc1":"((stat('energy'.accr)*3) + edmx + ((skill('Twister'.blvl) + skill('Tornado'.blvl)) * par8)) * 256","aurastatcalc2":"((stat('energy'.accr)*3) + edmx + ((skill('Twister'.blvl) + skill('Tornado'.blvl)) * par8)) * 256","name":"Cyclone Armor","tab":42},"249":{"Id":"249","skill":"Armageddon","charclass":"dru","EType":"fire","HitShift":"8","EMin":"15","EMax":"45","EDmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Volcano'.blvl))*par8 + (skill('Fire Claws'.blvl)) * par6","ToHit":"80","LevToHit":"6","auralencalc":"ln12","aurarangecalc":"par3","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"10","EMinLev2":"13","EMinLev3":"17","EMinLev4":"21","EMinLev5":"25","EMaxLev1":"11","EMaxLev2":"15","EMaxLev3":"19","EMaxLev4":"23","EMaxLev5":"27","MinDam":"15","MaxDam":"45","DmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Volcano'.blvl))*par8 + (skill('Fire Claws'.blvl)) * par6","MinLevDam1":"10","MinLevDam2":"13","MinLevDam3":"17","MinLevDam4":"21","MinLevDam5":"25","MaxLevDam1":"11","MaxLevDam2":"15","MaxLevDam3":"19","MaxLevDam4":"23","MaxLevDam5":"27","Param1":"1500","Param2":"75","Param3":"9","Param4":"9","Param6":"5","Param7":"0","Param8":"10","name":"Armageddon","tab":42},"239":{"Id":"239","skill":"Fire Claws","charclass":"dru","EType":"fire","HitShift":"8","EMin":"11","EMax":"17","EDmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Armageddon'.blvl))*par8","ToHit":"60","LevToHit":"10","anim":"A1","maxlvl":"20","reqlevel":"24","EMinLev1":"3","EMinLev2":"5","EMinLev3":"8","EMinLev4":"11","EMinLev5":"13","EMaxLev1":"4","EMaxLev2":"7","EMaxLev3":"9","EMaxLev4":"12","EMaxLev5":"15","Param1":"4","Param2":"1","Param8":"24","calc1":"0","calc2":"par1 + (blvl / 5) * par2","aurastat1":"firemindam","aurastat2":"firemaxdam","aurastatcalc1":"edmn","aurastatcalc2":"edmx","name":"Fire Claws","tab":41},"229":{"Id":"229","skill":"Molten Boulder","charclass":"dru","EType":"fire","HitShift":"8","EMin":"1","EMax":"1","EDmgSymPerCalc":"(skill('Volcano'.blvl)+skill('Eruption'.blvl)+skill('Armageddon'.blvl))*par8","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"1","EMinLev2":"2","EMinLev3":"6","EMinLev4":"10","EMinLev5":"14","EMaxLev1":"1","EMaxLev2":"2","EMaxLev3":"7","EMaxLev4":"13","EMaxLev5":"19","MinDam":"1","MaxDam":"2","DmgSymPerCalc":"(skill('Volcano'.blvl)+skill('Eruption'.blvl)+skill('Armageddon'.blvl))*par8","MinLevDam1":"1","MinLevDam2":"2","MinLevDam3":"5","MinLevDam4":"9","MinLevDam5":"13","MaxLevDam1":"1","MaxLevDam2":"2","MaxLevDam3":"6","MaxLevDam4":"12","MaxLevDam5":"18","Param1":"7","Param8":"12","name":"Molten Boulder","tab":42},"234":{"Id":"234","skill":"Eruption","charclass":"dru","EType":"fire","HitShift":"8","EMin":"15","EMax":"25","EDmgSymPerCalc":"(skill('Firestorm'.blvl)+skill('Molten Boulder'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"4","EMinLev2":"8","EMinLev3":"14","EMinLev4":"22","EMinLev5":"28","EMaxLev1":"6","EMaxLev2":"10","EMaxLev3":"16","EMaxLev4":"24","EMaxLev5":"30","Param1":"7","Param2":"5","Param3":"0","Param8":"14","calc1":"par1","calc2":"par2 - (blvl / 5)","name":"Fissure","tab":42},"225":{"Id":"225","skill":"Firestorm","charclass":"dru","EType":"fire","HitShift":"2","EMin":"2","EMax":"4","EDmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Eruption'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"1","EMinLev3":"2","EMinLev4":"4","EMinLev5":"7","EMaxLev1":"2","EMaxLev2":"2","EMaxLev3":"3","EMaxLev4":"5","EMaxLev5":"8","Param1":"3","Param2":"0","Param3":"0","Param4":"0","Param5":"0","Param6":"0","Param8":"26","calc1":"par1+(blvl/5)","name":"Firestorm","tab":42},"244":{"Id":"244","skill":"Volcano","charclass":"dru","EType":"fire","HitShift":"8","EMin":"7","EMax":"10","EDmgSymPerCalc":"(skill('Eruption'.blvl)+skill('Armageddon'.blvl)+skill('Molten Boulder'.blvl))*par8","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"2","EMinLev2":"4","EMinLev3":"5","EMinLev4":"6","EMinLev5":"7","EMaxLev1":"3","EMaxLev2":"5","EMaxLev3":"7","EMaxLev4":"8","EMaxLev5":"9","MinDam":"7","MaxDam":"10","DmgSymPerCalc":"(skill('Eruption'.blvl)+skill('Armageddon'.blvl)+skill('Molten Boulder'.blvl))*par8","MinLevDam1":"2","MinLevDam2":"4","MinLevDam3":"5","MinLevDam4":"6","MinLevDam5":"7","MaxLevDam1":"3","MaxLevDam2":"5","MaxLevDam3":"7","MaxLevDam4":"8","MaxLevDam5":"9","Param1":"12","Param2":"2","Param7":"8","Param8":"8","calc4":"par2","name":"Volcano","tab":42},"248":{"Id":"248","skill":"Fury","charclass":"dru","HitShift":"8","ToHit":"235","LevToHit":"10","anim":"A1","SrcDam":"128","maxlvl":"20","reqlevel":"30","Param2":"100","Param3":"100","Param4":"8","Param5":"3","Param6":"3","Param8":"4","calc1":"\"min((par5 + lvl -1), par6)\"","calc2":"ln34 + skill('Feral Rage'.blvl)*par8","aurastat1":"inc_splash_radius","aurastatcalc1":"1","name":"Fury","tab":41},"232":{"Id":"232","skill":"Feral Rage","charclass":"dru","HitShift":"8","ToHit":"25","LevToHit":"8","auralencalc":"par1","anim":"A1","SrcDam":"128","maxlvl":"20","reqlevel":"6","Param1":"750","Param2":"1","Param3":"20","Param4":"120","Param5":"50","Param6":"10","Param7":"2","Param8":"3","calc1":"ln56 + skill('Fury'.blvl) * 6","calc2":"lvl/par7 + par8","aurastat1":"velocitypercent","aurastat2":"lifedrainmindam","aurastatcalc1":"dm34","aurastatcalc2":"\"1 + (lvl - 1) * (min(par2 * skill('Feral Rage'.lvl) / 2 + 4,10) - 1) / max(skill('Feral Rage'.clc2) - 1,1)\"","name":"Feral Rage","tab":41},"246":{"Id":"246","skill":"Spirit of Barbs","charclass":"dru","HitShift":"8","EMin":"15","EDmgSymPerCalc":"(skill('Cycle of Life'.blvl)) * par6","anim":"SC","maxlvl":"20","reqlevel":"18","EMinLev1":"8","EMinLev2":"16","EMinLev3":"32","EMinLev4":"48","EMinLev5":"64","Param1":"15","Param2":"0","Param3":"50","Param4":"20","Param6":"7","Param7":"30","Param8":"2","calc1":"(lvl-1)*par1","calc2":"ulvl","passivestat1":"poisonresist","passivestat2":"maxpoisonresist","passivecalc1":"100","passivecalc2":"100","petmax":"1 + stat('extra_spirits'.accr)","name":"Spirit of Barbs","tab":40},"231":{"Id":"231","skill":"Cycle of Life","charclass":"dru","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"10","Param2":"0","Param3":"52","Param4":"20","Param5":"4","Param6":"40","Param7":"4","Param8":"4","calc1":"par3 * (lvl-1)","calc2":"ulvl * 3 / 4 + lvl","calc3":"(par4 + par5*lvl) + (skill('Oak Sage'.blvl)+skill('Vines'.blvl)) * par8 / 2","calc4":"(par6 + par7*lvl) + (skill('Oak Sage'.blvl)+skill('Vines'.blvl)) * par8","petmax":"1","name":"Carrion Vine","tab":40},"241":{"Id":"241","skill":"Vines","charclass":"dru","EType":"pois","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"24","Param1":"3","Param2":"1","Param3":"30","Param4":"15","Param5":"3","Param6":"25","Param7":"3","Param8":"3","calc1":"par3 * (lvl-1)","calc2":"ulvl * 3 / 4 + lvl","calc3":"(par4 + par5*lvl) + (skill('Oak Sage'.blvl)+skill('Cycle of Life'.blvl)) * par8 / 3","calc4":"(par6 + par7*lvl) + (skill('Oak Sage'.blvl)+skill('Cycle of Life'.blvl)) * par8","petmax":"1","name":"Solar Creeper","tab":40},"226":{"Id":"226","skill":"Oak Sage","charclass":"dru","HitShift":"8","EMin":"12","EMax":"50","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"4","EMinLev2":"4","EMinLev3":"5","EMinLev4":"5","EMinLev5":"5","EMaxLev1":"12","EMaxLev2":"14","EMaxLev3":"16","EMaxLev4":"18","EMaxLev5":"20","Param1":"50","Param2":"12","Param3":"250","Param4":"0","Param5":"0","Param6":"0","Param7":"30","Param8":"2","calc1":"(lvl-1)*(par1 + 1)/100","calc2":"ulvl","passivestat1":"poisonresist","passivestat2":"maxpoisonresist","passivecalc1":"100","passivecalc2":"100","petmax":"1 + stat('extra_spirits'.accr)","name":"Oak Sage","tab":40},"242":{"Id":"242","skill":"Hunger","charclass":"dru","HitShift":"8","EMax":"40","EDmgSymPerCalc":"(skill('Maul'.blvl)) * par8","auralencalc":"475+(lvl*25)","anim":"S3","maxlvl":"20","reqlevel":"12","EMaxLev1":"10","EMaxLev2":"16","EMaxLev3":"24","EMaxLev4":"34","EMaxLev5":"46","Param1":"14","Param2":"50","Param3":"3","Param4":"19","Param8":"20","aurastat1":"lifedrainmindam","aurastat2":"velocitypercent","aurastat3":"item_openwounds","aurastat4":"deep_wounds","aurastatcalc1":"par3 + blvl / 4","aurastatcalc2":"par4 + lvl","aurastatcalc3":"dm12 + 5","aurastatcalc4":"edmx","name":"Hunger","tab":41},"233":{"Id":"233","skill":"Maul","charclass":"dru","HitShift":"8","ToHit":"25","LevToHit":"10","auralencalc":"par4","anim":"A1","SrcDam":"128","maxlvl":"20","reqlevel":"6","Param3":"40","Param4":"500","Param5":"30","Param6":"5","Param7":"2","Param8":"3","calc1":"0","calc2":"lvl/par7 + par8","aurastat1":"damagepercent","aurastat2":"stunlength","aurastatcalc1":"lvl*par3","aurastatcalc2":"((par5 + ((blvl - 1) * - par6))<5)?par6:(par5 + ((blvl - 1) * - par6))","name":"Maul","tab":41},"238":{"Id":"238","skill":"Rabies","charclass":"dru","EType":"pois","HitShift":"3","EMin":"4","EMax":"12","ELen":"125","EDmgSymPerCalc":"(skill('Plague Poppy'.blvl)+skill('Feral Rage'.blvl)+skill('Shape Shifting'.blvl))*par8","ToHit":"65","LevToHit":"15","anim":"S3","maxlvl":"20","reqlevel":"18","EMinLev1":"4","EMinLev2":"8","EMinLev3":"15","EMinLev4":"23","EMinLev5":"31","EMaxLev1":"4","EMaxLev2":"8","EMaxLev3":"15","EMaxLev4":"23","EMaxLev5":"31","Param8":"10","name":"Rabies","tab":41},"224":{"Id":"224","skill":"Shape Shifting","charclass":"dru","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"1","Param1":"50","Param2":"12","Param3":"2","Param4":"2","Param5":"0","Param6":"0","name":"Lycanthropy","tab":41},"222":{"Id":"222","skill":"Plague Poppy","charclass":"dru","EType":"pois","HitShift":"2","EMin":"1","EMax":"2","ELen":"100","EDmgSymPerCalc":"(skill('Rabies'.blvl)+skill('Cycle of Life'.blvl)+skill('Vines'.blvl))*par8","auralencalc":"edln","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"2","EMinLev3":"8","EMinLev4":"14","EMinLev5":"20","EMaxLev1":"1","EMaxLev2":"2","EMaxLev3":"8","EMaxLev4":"14","EMaxLev5":"20","Param1":"3","Param2":"1","Param3":"25","Param4":"0","Param5":"5","Param6":"1","Param8":"25","calc1":"par3 * (lvl-1)","calc2":"ulvl * 3 / 4 + lvl","aurastat1":"poisonresist","aurastatcalc1":"-\"min(ln56,40)\"","passivestat1":"passive_pois_mastery","passivecalc1":"(skill('Rabies'.blvl)+skill('Cycle of Life'.blvl)+skill('Vines'.blvl))*par8","petmax":"1 + (blvl / 10)","name":"Poison Creeper","tab":40},"236":{"Id":"236","skill":"Heart of Wolverine","charclass":"dru","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"6","Param1":"5","Param2":"3","Param3":"25","Param4":"8","Param5":"25","Param6":"8","Param7":"30","Param8":"2","calc1":"(lvl-1)*par1","calc2":"ulvl","passivestat1":"poisonresist","passivestat2":"maxpoisonresist","passivecalc1":"100","passivecalc2":"100","petmax":"1 + stat('extra_spirits'.accr)","name":"Heart of Wolverine","tab":40},"228":{"Id":"228","skill":"Wearbear","charclass":"dru","HitShift":"8","auralencalc":"249975","anim":"SC","seqnum":"22","SrcDam":"128","maxlvl":"20","reqlevel":"1","Param1":"55","Param2":"15","Param3":"75","Param4":"10","Param5":"10","Param7":"10","Param8":"1","aurastat1":"damagepercent","aurastat2":"skill_armor_percent","aurastat3":"item_maxhp_percent","aurastat4":"item_tohit_percent","aurastat5":"inc_splash_radius","aurastat6":"skill_concentration","aurastatcalc1":"ln12","aurastatcalc2":"ln34","aurastatcalc3":"par5 + skill('Shape Shifting'.ln34)","aurastatcalc4":"skill('Shape Shifting'.ln12)","aurastatcalc5":"20","aurastatcalc6":"ln78","name":"Werebear","tab":41},"223":{"Id":"223","skill":"Wearwolf","charclass":"dru","HitShift":"8","ToHit":"0","LevToHit":"0","auralencalc":"249975","anim":"SC","seqnum":"22","SrcDam":"128","maxlvl":"20","reqlevel":"1","Param1":"25","Param2":"0","Param3":"10","Param4":"80","Param5":"20","Param6":"4","aurastat1":"attackrate","aurastat2":"item_tohit_percent","aurastat3":"item_maxhp_percent","aurastat4":"damagepercent","aurastat5":"normal_damage_reduction","aurastat6":"magic_damage_reduction","aurastatcalc1":"dm34","aurastatcalc2":"skill('Shape Shifting'.ln12)","aurastatcalc3":"par2+skill('Shape Shifting'.ln34)","aurastatcalc4":"ln56","aurastatcalc5":"1 + lvl / 3","aurastatcalc6":"1 + lvl / 3","name":"Werewolf","tab":41},"152":{"Id":"152","skill":"Berserk","charclass":"bar","HitShift":"8","ToHit":"60","LevToHit":"8","auralencalc":"13","anim":"SQ","seqnum":"11","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"24","Param1":"150","Param2":"20","Param3":"5","Param4":"1","Param5":"5","Param6":"1","Param8":"12","calc1":"ln12+(skill('Combat Reflexes'.blvl) + skill('Taunt'.blvl))*par8","aurastat1":"damageresist","aurastat2":"armor_override_percent","aurastat3":"passive_phys_pierce","aurastat4":"inc_splash_radius","aurastatcalc1":"-\"min(ln34, 10)\"","aurastatcalc2":"-25","aurastatcalc3":"\"min(ln56,45)\"","aurastatcalc4":"20","name":"Berserk","tab":32},"137":{"Id":"137","skill":"Taunt","charclass":"bar","HitShift":"8","auralencalc":"50 + (25*blvl / 4)","aurarangecalc":"16","anim":"SC","maxlvl":"20","reqlevel":"18","Param1":"-5","Param2":"-2","Param3":"-5","Param4":"-2","aurastat1":"item_tohit_percent","aurastat2":"damagepercent","aurastatcalc1":"ln12","aurastatcalc2":"ln34","name":"Taunt","tab":34},"141":{"Id":"141","skill":"Combat Reflexes","charclass":"bar","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"12","Param1":"30","Param2":"15","Param3":"0","Param4":"2","Param5":"20","Param6":"10","passivestat1":"skill_passive_staminapercent","passivestat2":"item_fastergethitrate","passivestat3":"maxhp","passivecalc1":"ln12","passivecalc2":"blvl * 2","passivecalc3":"(par5 + par6*lvl) * 256","name":"Combat Reflexes","tab":33},"151":{"Id":"151","skill":"Whirlwind","charclass":"bar","HitShift":"8","ToHit":"90","LevToHit":"6","anim":"SQ","seqnum":"10","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"30","Param1":"20","Param2":"5","Param3":"6","Param5":"0","Param6":"2","calc1":"ln12","aurastat1":"velocitypercent","aurastat2":"item_attackrate","aurastatcalc1":"\"min(ln56, 65)\"","aurastatcalc2":"100","name":"Whirlwind","tab":32},"150":{"Id":"150","skill":"Grim Ward","charclass":"bar","HitShift":"8","ToHit":"120","LevToHit":"10","aurarangecalc":"ln12","anim":"SC","maxlvl":"20","reqlevel":"24","Param1":"16","Param2":"1","Param3":"1000","Param4":"0","Param5":"50","Param6":"15","calc1":"ln34","aurastat1":"damagepercent","aurastat2":"tohit","aurastatcalc1":"ln56","aurastatcalc2":"toht","name":"Grim Ward","tab":34},"147":{"Id":"147","skill":"Frenzy","charclass":"bar","HitShift":"8","ELen":"32","ToHit":"30","LevToHit":"12","auralencalc":"375 + (25 * (blvl*2))","anim":"SQ","seqnum":"11","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"6","ELevLen1":"2","ELevLen2":"1","ELevLen3":"1","Param1":"25","Param2":"25","Param3":"0","Param4":"45","Param5":"0","Param6":"50","Param7":"375","Param8":"20","calc1":"ln12+(skill('Double Swing'.blvl) + skill('Stun'.blvl))*par8","calc2":"dm34","calc4":"5","aurastat1":"velocitypercent","aurastat2":"attackrate","aurastatcalc1":"edln","aurastatcalc2":"dm56","name":"Frenzy","tab":32},"133":{"Id":"133","skill":"Double Swing","charclass":"bar","HitShift":"8","ToHit":"20","LevToHit":"15","anim":"SQ","seqnum":"11","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"1","Param1":"50","Param3":"30","Param4":"30","Param5":"50","Param8":"20","calc1":"ln34 + (skill('Frenzy'.blvl) + skill('Stun'.blvl)) * par8","aurastat1":"attackrate","aurastatcalc1":"par5","name":"Double Swing","tab":32},"146":{"Id":"146","skill":"Battle Cry","charclass":"bar","HitShift":"8","auralencalc":"ln12 + stat('pvp_cd'.accr)*5 + stat('pvp_lld_cd'.accr)*5","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"300","Param2":"0","Param3":"15","Param4":"1","Param5":"4","aurastat1":"skill_armor_percent","aurastat2":"damageresist","aurastatcalc1":"-\"min(ln34, 30)\"","aurastatcalc2":"-(par5+(lvl<22)?lvl:(22+((lvl-22)/2)))","name":"Battle Cry","tab":34},"140":{"Id":"140","skill":"Double Throw","charclass":"bar","HitShift":"8","ToHit":"35","LevToHit":"15","aurarangecalc":"par3","anim":"SQ","seqnum":"15","SrcDam":"128","maxlvl":"20","itypea1":"comb","reqlevel":"12","Param1":"45","Param2":"8","Param3":"15","Param4":"0","Param5":"3","Param6":"3","Param8":"6","calc1":"ln12 + (skill('Double Swing'.blvl) + skill('Frenzy'.blvl))*par8","calc2":"\"min(par5 + lvl / par6, 8)\"","calc3":"par4","name":"Double Throw","tab":32},"135":{"Id":"135","skill":"Throwing Mastery","charclass":"bar","HitShift":"8","ELen":"15","anim":"SC","maxlvl":"20","passiveitype":"thro","reqlevel":"1","ELevLen1":"2","ELevLen2":"1","ELevLen3":"1","Param1":"30","Param2":"10","Param3":"30","Param4":"5","Param5":"0","Param6":"35","passivestat1":"passive_mastery_throw_th","passivestat2":"passive_mastery_throw_dmg","passivestat3":"passive_mastery_throw_crit","passivestat4":"skill_pierce","passivecalc1":"ln12","passivecalc2":"ln34","passivecalc3":"dm56","passivecalc4":"edln","name":"Throwing Mastery","tab":33},"134":{"Id":"134","skill":"Two Hand Mastery","charclass":"bar","HitShift":"8","ELen":"5","anim":"SC","maxlvl":"20","passiveitype":"2han","reqlevel":"6","ELevLen1":"1","ELevLen2":"1","ELevLen3":"1","Param1":"30","Param2":"10","Param3":"40","Param4":"10","Param5":"0","Param6":"35","passivestat1":"passive_mastery_melee_th","passivestat2":"passive_mastery_melee_dmg","passivestat3":"item_crushingblow","passivestat4":"item_crushingblow_efficiency","passivestat5":"inc_splash_radius","passivecalc1":"ln12","passivecalc2":"ln34","passivecalc3":"dm56","passivecalc4":"\"min(edln, 20)\"","passivecalc5":"\"min((20+lvl), 40)\"","name":"Two Handed Weapon Mastery","tab":33},"128":{"Id":"128","skill":"One Hand Mastery","charclass":"bar","HitShift":"8","ELen":"10","anim":"SC","maxlvl":"20","passiveitype":"1han","reqlevel":"1","ELevLen1":"1","ELevLen2":"1","ELevLen3":"1","Param1":"35","Param2":"12","Param3":"30","Param4":"8","Param5":"0","Param6":"45","passivestat1":"passive_mastery_melee_th","passivestat2":"passive_mastery_melee_dmg","passivestat3":"passive_mastery_melee_crit","passivestat4":"inc_splash_radius","passivecalc1":"ln12","passivecalc2":"ln34","passivecalc3":"dm56","passivecalc4":"\"min(lvl, 20)\"","name":"One Handed Weapon Mastery","tab":33},"123":{"Id":"123","skill":"Conviction","charclass":"pal","HitShift":"8","aurarangecalc":"ln12","anim":"RN","seqnum":"5","maxlvl":"20","itypea1":"weap","reqlevel":"30","Param1":"22","Param2":"1","Param3":"12","Param4":"2","Param5":"10","Param6":"75","aurastat1":"skill_armor_percent","aurastat2":"fireresist","aurastat3":"coldresist","aurastat4":"lightresist","aurastatcalc1":"-dm56","aurastatcalc2":"\"-min(ln34,150)\"","aurastatcalc3":"\"-min(ln34,150)\"","aurastatcalc4":"\"-min(ln34,150)\"","perdelay":"25","name":"Conviction","tab":25},"122":{"Id":"122","skill":"Fanaticism","charclass":"pal","HitShift":"8","ToHit":"40","LevToHit":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"30","Param1":"20","Param2":"3","Param3":"10","Param4":"40","Param5":"50","Param6":"15","aurastat1":"attackrate","aurastat2":"item_tohit_percent","aurastat3":"damagepercent","aurastatcalc1":"dm34","aurastatcalc2":"toht","aurastatcalc3":"ln56/2","passivestat1":"damagepercent","passivecalc1":"ln56","perdelay":"50","name":"Fanaticism","tab":25},"119":{"Id":"119","skill":"Sanctuary","charclass":"pal","EType":"mag","HitShift":"6","EMin":"33","EMax":"53","EDmgSymPerCalc":"(skill('Might'.blvl)+skill('Holy Sword'.blvl)+skill('Blessed Aim'.blvl))*par8","ToHit":"50","LevToHit":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"24","EMinLev1":"11","EMinLev2":"13","EMinLev3":"20","EMinLev4":"31","EMinLev5":"46","EMaxLev1":"11","EMaxLev2":"13","EMaxLev3":"20","EMaxLev4":"31","EMaxLev5":"46","Param1":"18","Param2":"0","Param3":"0","Param4":"0","Param5":"0","Param6":"0","Param7":"3","Param8":"10","aurastat1":"magicresist","aurastatcalc1":"-(5 + lvl/2)","passivestat1":"magicmindam","passivestat2":"magicmaxdam","passivestat3":"item_tohit_percent","passivecalc1":"edns*par7/256","passivecalc2":"edxs*par7/256","passivecalc3":"toht","perdelay":"25","name":"Sanctuary","tab":25},"108":{"Id":"108","skill":"Blessed Aim","charclass":"pal","HitShift":"8","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"12","Param1":"20","Param2":"2","Param3":"60","Param4":"15","Param5":"5","Param6":"1","Param8":"1","aurastat1":"item_tohit_percent","aurastat2":"item_deadlystrike","aurastatcalc1":"ln34","aurastatcalc2":"par5 + (par6 * lvl / 2)","passivestat1":"item_fractionaltargetac","passivecalc1":"blvl","perdelay":"50","name":"Blessed Aim","tab":25},"116":{"Id":"116","skill":"Holy Sword","charclass":"pal","EType":"mag","HitShift":"8","EMin":"10","EMax":"1","ToHit":"50","LevToHit":"10","auralencalc":"ln12","anim":"SC","maxlvl":"20","itypea1":"2hsw","reqlevel":"24","EMinLev1":"2","EMinLev2":"1","EMinLev3":"1","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","Param1":"7500","Param2":"125","Param3":"25","Param4":"7","Param5":"0","Param6":"55","aurastat1":"passive_weaponblock","aurastat2":"item_demondamage_percent","aurastat3":"item_undeaddamage_percent","aurastatcalc1":"dm56 + (stat('toblock'.accr) / 5)","aurastatcalc2":"ln34","aurastatcalc3":"ln34","name":"Holy Sword","tab":24},"98":{"Id":"98","skill":"Might","charclass":"pal","HitShift":"8","EMin":"40","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"1","EMinLev1":"20","EMinLev2":"20","EMinLev3":"20","EMinLev4":"20","EMinLev5":"20","Param1":"20","Param2":"3","aurastat1":"damagepercent","aurastatcalc1":"edmn / 2","passivestat1":"damagepercent","passivecalc1":"edmn","perdelay":"50","name":"Might","tab":25},"118":{"Id":"118","skill":"Holy Shock","charclass":"pal","EType":"ltng","HitShift":"7","EMin":"2","EMax":"27","EDmgSymPerCalc":"(skill('Resist Lightning'.blvl)+skill('Salvation'.blvl)+skill('Blessed Aim'.blvl))*par8","ToHit":"50","LevToHit":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"24","EMaxLev1":"11","EMaxLev2":"15","EMaxLev3":"20","EMaxLev4":"27","EMaxLev5":"35","Param1":"16","Param2":"0","Param5":"6","Param6":"0","Param7":"9","Param8":"9","passivestat1":"lightmindam","passivestat2":"lightmaxdam","passivestat3":"item_tohit_percent","passivecalc1":"edns*par5/256","passivecalc2":"edxs*par5/256","passivecalc3":"toht","perdelay":"25","name":"Holy Shock","tab":25},"125":{"Id":"125","skill":"Salvation","charclass":"pal","HitShift":"8","EMin":"20","EMax":"3","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"30","EMinLev1":"4","EMinLev2":"3","EMinLev3":"2","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","EMaxLev2":"1","EMaxLev3":"1","EMaxLev4":"1","EMaxLev5":"1","Param1":"16","Param2":"2","Param3":"20","Param4":"75","aurastat1":"fireresist","aurastat2":"coldresist","aurastat3":"lightresist","aurastat4":"passive_ltng_mastery","aurastat5":"passive_cold_mastery","aurastat6":"passive_fire_mastery","aurastatcalc1":"\"min(edmn, 75)\"","aurastatcalc2":"\"min(edmn, 75)\"","aurastatcalc3":"\"min(edmn, 75)\"","aurastatcalc4":"edmx / 2","aurastatcalc5":"edmx / 2","aurastatcalc6":"edmx / 2","perdelay":"50","name":"Salvation","tab":26},"110":{"Id":"110","skill":"Resist Lightning","charclass":"pal","EType":"ltng","HitShift":"8","EMin":"25","EMax":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"1","EMinLev1":"4","EMinLev2":"3","EMinLev3":"2","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","EMaxLev2":"1","EMaxLev3":"1","EMaxLev4":"2","EMaxLev5":"2","Param1":"20","Param2":"2","Param3":"25","Param4":"100","Param5":"0","Param6":"0","aurastat1":"lightresist","aurastat2":"passive_ltng_mastery","aurastatcalc1":"\"min(edmn, 100)\"","aurastatcalc2":"edmx","passivestat1":"maxlightresist","passivecalc1":"skill('Resist Lightning'.blvl)/2","perdelay":"50","name":"Resist Lightning","tab":26},"117":{"Id":"117","skill":"Holy Shield","charclass":"pal","EType":"mag","HitShift":"8","auralencalc":"ln12","anim":"SC","maxlvl":"20","itypea1":"shld","reqlevel":"18","MinDam":"3","MaxDam":"6","DmgSymPerCalc":"(skill('Smite'.blvl)+skill('Defiance'.blvl))*par7","MinLevDam1":"1","MinLevDam2":"2","MinLevDam3":"3","MinLevDam4":"4","MinLevDam5":"4","MaxLevDam1":"1","MaxLevDam2":"2","MaxLevDam3":"3","MaxLevDam4":"4","MaxLevDam5":"4","Param1":"7500","Param2":"125","Param3":"25","Param4":"10","Param5":"5","Param6":"40","Param7":"5","Param8":"15","calc1":"ln34+skill('Defiance'.blvl)*par8","aurastat1":"toblock","aurastatcalc1":"dm56","aurastatcalc2":"ln34+skill('Defiance'.blvl)*par8","name":"Holy Shield","tab":24},"104":{"Id":"104","skill":"Defiance","charclass":"pal","HitShift":"8","EMax":"70","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"6","EMaxLev1":"4","EMaxLev2":"6","EMaxLev3":"8","EMaxLev4":"10","EMaxLev5":"12","Param1":"20","Param2":"2","Param3":"70","Param4":"10","Param5":"12","Param6":"400","aurastat1":"skill_armor_percent","aurastat2":"normal_damage_reduction","aurastat3":"damageresist","aurastatcalc1":"edmx","aurastatcalc2":"lvl/2","aurastatcalc3":"lvl/2","perdelay":"50","name":"Defiance","tab":26},"97":{"Id":"97","skill":"Smite","charclass":"pal","HitShift":"8","EMax":"15","anim":"S1","maxlvl":"20","itypea1":"shld","reqlevel":"1","EMaxLev1":"2","EMaxLev2":"1","EMaxLev3":"1","EMaxLev4":"1","EMaxLev5":"1","Param1":"15","Param2":"5","Param3":"75","Param4":"25","Param5":"20","Param8":"10","calc1":"ln34","calc2":"\"min(250,ln12)\"","calc3":"5 + blvl","calc4":"edmx","name":"Smite","tab":24},"115":{"Id":"115","skill":"Vigor","charclass":"pal","HitShift":"8","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"18","Param1":"26","Param2":"3","Param3":"50","Param4":"25","Param5":"7","Param6":"50","aurastat1":"staminarecoverybonus","aurastat2":"skill_staminapercent","aurastat3":"velocitypercent","aurastatcalc1":"ln34","aurastatcalc2":"ln34","aurastatcalc3":"dm56","passivestat1":"item_fastermovevelocity","passivecalc1":"blvl","perdelay":"50","name":"Vigor","tab":26},"114":{"Id":"114","skill":"Holy Freeze","charclass":"pal","EType":"cold","HitShift":"7","EMin":"5","EMax":"7","EDmgSymPerCalc":"(skill('Resist Cold'.blvl)+skill('Salvation'.blvl)+skill('Blessed Aim'.blvl))*par8","ToHit":"50","LevToHit":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"18","EMinLev1":"3","EMinLev2":"4","EMinLev3":"6","EMinLev4":"10","EMinLev5":"15","EMaxLev1":"4","EMaxLev2":"5","EMaxLev3":"7","EMaxLev4":"12","EMaxLev5":"17","Param1":"12","Param2":"0","Param3":"25","Param4":"60","Param5":"4","Param6":"0","Param7":"11","Param8":"11","aurastat1":"velocitypercent","aurastat2":"attackrate","aurastat3":"other_animrate","aurastatcalc1":"-dm34","aurastatcalc2":"-dm34","aurastatcalc3":"-dm34","passivestat1":"coldmindam","passivestat2":"coldmaxdam","passivestat3":"item_tohit_percent","passivecalc1":"edns*par5/256","passivecalc2":"edxs*par5/256","passivecalc3":"toht","perdelay":"25","name":"Holy Freeze","tab":25},"105":{"Id":"105","skill":"Resist Cold","charclass":"pal","EType":"cold","HitShift":"8","EMin":"25","EMax":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"1","EMinLev1":"4","EMinLev2":"3","EMinLev3":"2","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","EMaxLev2":"1","EMaxLev3":"1","EMaxLev4":"2","EMaxLev5":"2","Param1":"20","Param2":"2","Param3":"25","Param4":"100","Param5":"0","Param6":"0","aurastat1":"coldresist","aurastat2":"passive_cold_mastery","aurastatcalc1":"\"min(edmn, 100)\"","aurastatcalc2":"edmx","passivestat1":"maxcoldresist","passivecalc1":"skill('Resist Cold'.blvl)/2","perdelay":"50","name":"Resist Cold","tab":26},"113":{"Id":"113","skill":"Concentration","charclass":"pal","HitShift":"8","ToHit":"50","LevToHit":"10","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"18","Param1":"20","Param2":"3","Param3":"60","Param4":"15","Param5":"15","Param6":"0","aurastat1":"damagepercent","aurastat2":"skill_concentration","aurastat3":"item_tohit_percent","aurastatcalc1":"ln34 / 2","aurastatcalc2":"par5+(lvl / 3)","aurastatcalc3":"toht","passivestat1":"damagepercent","passivecalc1":"ln34","perdelay":"50","name":"Concentration","tab":25},"111":{"Id":"111","skill":"Vengeance","charclass":"pal","HitShift":"8","EMin":"6","EMax":"8","ELen":"80","EDmgSymPerCalc":"(skill('Holy Fire'.blvl)+skill('Holy Freeze'.blvl)+skill('Holy Shock'.blvl)+skill('Conviction'.blvl))*par8","ToHit":"120","LevToHit":"18","aurarangecalc":"7","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"18","EMinLev1":"1","EMinLev2":"3","EMinLev3":"5","EMinLev4":"6","EMinLev5":"7","EMaxLev1":"2","EMaxLev2":"4","EMaxLev3":"6","EMaxLev4":"7","EMaxLev5":"8","Param1":"5","Param2":"2","Param3":"22","Param4":"2","Param5":"4","Param6":"24","Param7":"2","Param8":"2","calc1":"ln12+((skill('Holy Fire'.blvl)+skill('Holy Freeze'.blvl)+skill('Holy Shock'.blvl))*par8+skill('Conviction'.blvl)*par7)","calc2":"ln12+((skill('Holy Fire'.blvl)+skill('Holy Freeze'.blvl)+skill('Holy Shock'.blvl))*par8+skill('Conviction'.blvl)*par7)","calc3":"ln12+((skill('Holy Fire'.blvl)+skill('Holy Freeze'.blvl)+skill('Holy Shock'.blvl))*par8+skill('Conviction'.blvl)*par7)","calc4":"\"min(ln34, 95)\"","name":"Vengeance","tab":24},"102":{"Id":"102","skill":"Holy Fire","charclass":"pal","EType":"fire","HitShift":"6","EMin":"5","EMax":"11","EDmgSymPerCalc":"(skill('Resist Fire'.blvl)+skill('Salvation'.blvl)+skill('Blessed Aim'.blvl))*par8","ToHit":"50","LevToHit":"5","aurarangecalc":"\"min(ln12, 14)\"","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"6","EMinLev1":"1","EMinLev2":"4","EMinLev3":"12","EMinLev4":"22","EMinLev5":"31","EMaxLev1":"2","EMaxLev2":"5","EMaxLev3":"15","EMaxLev4":"26","EMaxLev5":"37","Param1":"6","Param2":"1","Param3":"5","Param5":"4","Param7":"16","Param8":"16","passivestat1":"firemindam","passivestat2":"firemaxdam","passivestat3":"item_tohit_percent","passivecalc1":"edns*par5/256","passivecalc2":"edxs*par5/256","passivecalc3":"toht","perdelay":"25","name":"Holy Fire","tab":25},"100":{"Id":"100","skill":"Resist Fire","charclass":"pal","EType":"fire","HitShift":"8","EMin":"25","EMax":"5","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"1","EMinLev1":"4","EMinLev2":"3","EMinLev3":"2","EMinLev4":"1","EMinLev5":"1","EMaxLev1":"1","EMaxLev2":"1","EMaxLev3":"1","EMaxLev4":"2","EMaxLev5":"2","Param1":"20","Param2":"2","Param3":"25","Param4":"100","aurastat1":"fireresist","aurastat2":"passive_fire_mastery","aurastatcalc1":"\"min(edmn, 100)\"","aurastatcalc2":"edmx","passivestat1":"maxfireresist","passivecalc1":"skill('Resist Fire'.blvl)/2","perdelay":"50","name":"Resist Fire","tab":26},"107":{"Id":"107","skill":"Charge","charclass":"pal","HitShift":"8","ToHit":"75","LevToHit":"15","anim":"SQ","seqnum":"4","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"12","Param1":"150","Param2":"0","Param3":"100","Param4":"20","Param5":"2","Param6":"65","Param8":"15","calc1":"ln34+(skill('Vigor'.blvl)+skill('Might'.blvl))*par8","name":"Charge","tab":24},"106":{"Id":"106","skill":"Zeal","charclass":"pal","HitShift":"8","ToHit":"35","LevToHit":"20","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"1","Param2":"100","Param3":"30","Param4":"25","Param5":"3","Param6":"3","Param8":"20","calc1":"\"min((par5 + lvl -1), par6)\"","calc2":"ln34 +skill('Sacrifice'.blvl)*par8","aurastat1":"inc_splash_radius","aurastatcalc1":"1","name":"Zeal","tab":24},"96":{"Id":"96","skill":"Sacrifice","charclass":"pal","HitShift":"8","ToHit":"20","LevToHit":"16","anim":"A1","seqnum":"2","SrcDam":"128","maxlvl":"20","itypea1":"mele","reqlevel":"6","Param1":"180","Param2":"30","Param3":"3","Param4":"4","Param5":"5","Param6":"125","Param7":"25","Param8":"25","calc1":"ln12+skill('Redemption'.blvl)*par8+skill('Fanaticism'.blvl)*par7","calc2":"par3","calc3":"\"min(par4 + lvl / 3, 10)\"","name":"Sacrifice","tab":24},"124":{"Id":"124","skill":"Redemption","charclass":"pal","HitShift":"8","aurarangecalc":"ln12","anim":"RN","maxlvl":"20","itypea1":"weap","reqlevel":"30","Param1":"16","Param2":"0","Param3":"10","Param4":"100","Param5":"25","Param6":"5","calc1":"dm34","calc2":"5 + (lvl * 2)","calc3":"ln56","perdelay":"50","name":"Redemption","tab":26},"93":{"Id":"93","skill":"Bone Spirit","charclass":"nec","EType":"mag","HitShift":"8","EMin":"20","EMax":"30","EDmgSymPerCalc":"(skill('Teeth'.blvl)+skill('Bone Spear'.blvl))*par8+skill('Bone Armor'.blvl)*par7","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"16","EMinLev2":"17","EMinLev3":"18","EMinLev4":"30","EMinLev5":"60","EMaxLev1":"17","EMaxLev2":"18","EMaxLev3":"19","EMaxLev4":"31","EMaxLev5":"62","Param7":"15","Param8":"15","calc1":"0","name":"Bone Spirit","tab":17},"68":{"Id":"68","skill":"Bone Armor","charclass":"nec","EType":"mag","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"6","EMaxLev1":"10","EMaxLev2":"11","EMaxLev3":"12","EMaxLev4":"13","EMaxLev5":"14","Param1":"0","Param2":"0","Param8":"15","aurastat1":"bonearmor","aurastat2":"bonearmormax","aurastat3":"item_armor_percent","aurastatcalc1":"((stat('energy'.accr)*3) + edmx + ((skill('Bone Wall'.blvl) + skill('Bone Prison'.blvl)) * par8)) * 256","aurastatcalc2":"((stat('energy'.accr)*3) + edmx + ((skill('Bone Wall'.blvl) + skill('Bone Prison'.blvl)) * par8)) * 256","aurastatcalc3":"blvl*10","name":"Bone Armor","tab":17},"88":{"Id":"88","skill":"Bone Prison","charclass":"nec","EType":"mag","HitShift":"8","EMin":"30","EDmgSymPerCalc":"(skill('Bone Armor'.blvl)+skill('Bone Wall'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"10","EMinLev2":"20","EMinLev3":"40","EMinLev4":"60","EMinLev5":"80","Param1":"25","Param2":"600","Param8":"5","calc1":"(par1 * (lvl-1)) + ((skill('Bone Armor'.blvl)+skill('Bone Wall'.blvl))*par8)","passivestat1":"item_attackertakesdamage","passivecalc1":"edmn","name":"Bone Prison","tab":17},"78":{"Id":"78","skill":"Bone Wall","charclass":"nec","EType":"mag","HitShift":"8","EMin":"15","EDmgSymPerCalc":"(skill('Bone Armor'.blvl)+skill('Bone Prison'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"8","EMinLev2":"16","EMinLev3":"32","EMinLev4":"48","EMinLev5":"64","Param1":"25","Param2":"600","Param3":"8","Param4":"0","Param8":"5","calc1":"(par1 * (lvl-1)) + ((skill('Bone Armor'.blvl)+skill('Bone Prison'.blvl))*par8)","calc2":"par34","passivestat1":"item_attackertakesdamage","passivecalc1":"edmn","name":"Bone Wall","tab":17},"84":{"Id":"84","skill":"Bone Spear","charclass":"nec","EType":"mag","HitShift":"8","EMin":"12","EMax":"18","EDmgSymPerCalc":"(skill('Teeth'.blvl)+skill('Bone Spirit'.blvl))*par8+skill('Bone Armor'.blvl)*par7","anim":"SC","maxlvl":"20","reqlevel":"18","EMinLev1":"7","EMinLev2":"9","EMinLev3":"12","EMinLev4":"26","EMinLev5":"46","EMaxLev1":"7","EMaxLev2":"9","EMaxLev3":"13","EMaxLev4":"28","EMaxLev5":"50","Param7":"15","Param8":"15","calc1":"\"max(1, 1 + ((lvl<15)?0:1) + ((lvl<25)?0:1) + stat('extra_bonespears'.accr))\"","calc3":"100","name":"Bone Spear","tab":17},"67":{"Id":"67","skill":"Teeth","charclass":"nec","EType":"mag","HitShift":"7","EMin":"6","EMax":"10","EDmgSymPerCalc":"(skill('Bone Armor'.blvl)+skill('Bone Spear'.blvl)+skill('Bone Spirit'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"2","EMinLev2":"4","EMinLev3":"8","EMinLev4":"15","EMinLev5":"22","EMaxLev1":"4","EMaxLev2":"6","EMaxLev3":"10","EMaxLev4":"17","EMaxLev5":"25","Param1":"3","Param2":"1","Param3":"0","Param8":"24","calc1":"\"min(ln12,24)\"","calc2":"par3","calc3":"100","name":"Teeth","tab":17},"92":{"Id":"92","skill":"Poison Nova","charclass":"nec","EType":"pois","HitShift":"4","EMin":"16","EMax":"29","ELen":"50","EDmgSymPerCalc":"(skill('Poison Dagger'.blvl)+skill('Desecrate'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"30","EMinLev1":"6","EMinLev2":"7","EMinLev3":"8","EMinLev4":"9","EMinLev5":"9","EMaxLev1":"6","EMaxLev2":"7","EMaxLev3":"8","EMaxLev4":"9","EMaxLev5":"9","Param8":"11","name":"Poison Nova","tab":17},"83":{"Id":"83","skill":"Desecrate","charclass":"nec","EType":"pois","HitShift":"4","EMin":"3","EMax":"4","ELen":"75","EDmgSymPerCalc":"(skill('Poison Dagger'.blvl)+skill('Poison Nova'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"1","EMinLev2":"4","EMinLev3":"14","EMinLev4":"19","EMinLev5":"24","EMaxLev1":"1","EMaxLev2":"4","EMaxLev3":"14","EMaxLev4":"19","EMaxLev5":"24","ELevLen1":"0","ELevLen2":"0","ELevLen3":"0","Param1":"10","Param8":"22","calc1":"5","petmax":"50","name":"Desecrate","tab":17},"73":{"Id":"73","skill":"Poison Dagger","charclass":"nec","EType":"pois","HitShift":"4","EMin":"1","EMax":"2","ELen":"50","EDmgSymPerCalc":"(skill('Desecrate'.blvl)+skill('Bone Armor'.blvl))*par8","ToHit":"50","LevToHit":"30","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"knif","reqlevel":"1","EMinLev1":"1","EMinLev2":"4","EMinLev3":"14","EMinLev4":"24","EMinLev5":"34","EMaxLev1":"1","EMaxLev2":"4","EMaxLev3":"14","EMaxLev4":"24","EMaxLev5":"34","Param1":"5","Param2":"1","Param3":"10","Param8":"25","aurastat1":"passive_pois_pierce","aurastat2":"inc_splash_radius","aurastatcalc1":"\"min(ln12, 50)\"","aurastatcalc2":"20","name":"Poison Strike","tab":17},"74":{"Id":"74","skill":"Corpse Explosion","charclass":"nec","EType":"fire","HitShift":"8","EMin":"2","EMax":"5","EDmgSymPerCalc":"(skill('Revive'.blvl)+skill('Desecrate'.blvl)+skill('AmpDmg'.blvl))*par8","aurarangecalc":"((par3+lvl*par4)>32)?32:(par3+lvl*par4) + stat('corpseexplosionradius'.accr)","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"1","EMinLev2":"3","EMinLev3":"6","EMinLev4":"10","EMinLev5":"15","EMaxLev1":"2","EMaxLev2":"5","EMaxLev3":"10","EMaxLev4":"14","EMaxLev5":"18","MinDam":"2","MaxDam":"5","DmgSymPerCalc":"(skill('Revive'.blvl)+skill('Desecrate'.blvl)+skill('AmpDmg'.blvl))*par8","MinLevDam1":"1","MinLevDam2":"3","MinLevDam3":"6","MinLevDam4":"10","MinLevDam5":"15","MaxLevDam1":"2","MaxLevDam2":"5","MaxLevDam3":"10","MaxLevDam4":"14","MaxLevDam5":"18","Param1":"5","Param2":"10","Param3":"14","Param4":"1","Param5":"50","Param8":"10","calc1":"par1","calc2":"par2","calc3":"par5","name":"Corpse Explosion","tab":17},"95":{"Id":"95","skill":"Revive","charclass":"nec","EType":"mag","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"0","Param2":"30","Param3":"7500","Param4":"250","Param5":"50","Param6":"20","Param7":"5","Param8":"20","calc1":"par1","calc2":"ln34","aurastat1":"damagepercent","aurastat2":"passive_ltng_mastery","aurastat3":"passive_fire_mastery","aurastat4":"passive_cold_mastery","aurastat5":"passive_pois_mastery","aurastat6":"item_allskills","aurastatcalc1":"lvl*par2 + (skill('Desecrate'.blvl))*par8","aurastatcalc2":"lvl*par6 + (skill('Desecrate'.blvl))*par8 / 2","aurastatcalc3":"lvl*par6 + (skill('Desecrate'.blvl))*par8 / 2","aurastatcalc4":"lvl*par6 + (skill('Desecrate'.blvl))*par8 / 2","aurastatcalc5":"lvl*par6 + (skill('Desecrate'.blvl))*par8 / 2","aurastatcalc6":"blvl","passivestat1":"velocitypercent","passivecalc1":"par5","petmax":"3 + blvl / 4 + stat('extra_revives'.accr)","name":"Revive","tab":18},"65":{"Id":"65","skill":"Cold Mastery","charclass":"sor","EType":"cold","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"5","Param2":"1","Param3":"10","Param4":"2","passivestat1":"passive_cold_pierce","passivestat2":"passive_cold_mastery","passivecalc1":"\"min(ln12, 45)\"","passivecalc2":"ln34","name":"Cold Mastery","tab":10},"64":{"Id":"64","skill":"Frozen Orb","charclass":"sor","EType":"cold","HitShift":"7","EMin":"80","EMax":"90","ELen":"200","EDmgSymPerCalc":"(skill('Ice Bolt'.blvl)+skill('Frost Nova'.blvl))*par8","anim":"SQ","seqnum":"12","maxlvl":"20","reqlevel":"30","EMinLev1":"3","EMinLev2":"9","EMinLev3":"15","EMinLev4":"21","EMinLev5":"28","EMaxLev1":"5","EMaxLev2":"11","EMaxLev3":"17","EMaxLev4":"23","EMaxLev5":"30","ELevLen1":"5","ELevLen2":"5","ELevLen3":"5","Param8":"4","name":"Frozen Orb","tab":10},"44":{"Id":"44","skill":"Frost Nova","charclass":"sor","EType":"cold","HitShift":"7","EMin":"8","EMax":"10","ELen":"200","EDmgSymPerCalc":"(skill('Ice Bolt'.blvl)+skill('Shiver Armor'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"4","EMinLev2":"14","EMinLev3":"24","EMinLev4":"30","EMinLev5":"35","EMaxLev1":"5","EMaxLev2":"15","EMaxLev3":"25","EMaxLev4":"31","EMaxLev5":"36","ELevLen1":"5","ELevLen2":"5","ELevLen3":"5","Param1":"9","Param2":"3","Param8":"8","name":"Frost Nova","tab":10},"50":{"Id":"50","skill":"Shiver Armor","charclass":"sor","EType":"cold","HitShift":"7","EMin":"16","EMax":"20","ELen":"100","EDmgSymPerCalc":"skill('Frost Nova'.blvl)*par8","auralencalc":"ln34","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"5","EMinLev2":"8","EMinLev3":"11","EMinLev4":"14","EMinLev5":"17","EMaxLev1":"6","EMaxLev2":"9","EMaxLev3":"12","EMaxLev4":"15","EMaxLev5":"18","ELevLen1":"5","ELevLen2":"5","ELevLen3":"5","Param1":"45","Param2":"6","Param3":"4500","Param4":"75","Param7":"0","Param8":"20","aurastat1":"skill_armor_percent","aurastat2":"item_fasterblockrate","aurastatcalc1":"ln12","aurastatcalc2":"10 + (blvl*2) ","name":"Shiver Armor","tab":10},"63":{"Id":"63","skill":"Lightning Mastery","charclass":"sor","EType":"ltng","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"50","Param2":"10","passivestat1":"passive_ltng_mastery","passivecalc1":"ln12","name":"Lightning Mastery","tab":9},"61":{"Id":"61","skill":"Fire Mastery","charclass":"sor","EType":"fire","HitShift":"8","anim":"SC","maxlvl":"20","reqlevel":"30","Param1":"20","Param2":"4","passivestat1":"passive_fire_mastery","passivestat2":"passive_fire_pierce","passivecalc1":"ln12","passivecalc2":"\"min(lvl, 30)\"","name":"Fire Mastery","tab":8},"57":{"Id":"57","skill":"Thunder Storm","charclass":"sor","EType":"ltng","HitShift":"8","EMin":"1","EMax":"100","EDmgSymPerCalc":"(skill('Charged Bolt'.blvl) + skill('Nova'.blvl)) * par8","auralencalc":"ln12","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"2","EMinLev2":"3","EMinLev3":"4","EMinLev4":"5","EMinLev5":"6","EMaxLev1":"4","EMaxLev2":"5","EMaxLev3":"6","EMaxLev4":"7","EMaxLev5":"8","Param1":"800","Param2":"200","Param3":"50","Param4":"1","Param7":"17","Param8":"8","perdelay":"par3 - (blvl * 25 / 20)","name":"Thunder Storm","tab":9},"48":{"Id":"48","skill":"Nova","charclass":"sor","EType":"ltng","HitShift":"8","EMin":"1","EMax":"22","EDmgSymPerCalc":"(skill('Charged Bolt'.blvl)+skill('Telekinesis'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"4","EMinLev2":"5","EMinLev3":"6","EMinLev4":"6","EMinLev5":"4","EMaxLev1":"8","EMaxLev2":"10","EMaxLev3":"11","EMaxLev4":"11","EMaxLev5":"9","Param1":"12","Param2":"4","Param8":"4","name":"Nova","tab":9},"43":{"Id":"43","skill":"Telekinesis","charclass":"sor","EType":"ltng","HitShift":"8","EMin":"2","EMax":"7","EDmgSymPerCalc":"(skill('Charged Bolt'.blvl)+skill('Nova'.blvl))*par8","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"1","EMinLev3":"2","EMinLev4":"2","EMinLev5":"2","EMaxLev1":"3","EMaxLev2":"6","EMaxLev3":"12","EMaxLev4":"12","EMaxLev5":"12","Param1":"25","Param2":"35","Param8":"15","name":"Telekinesis","tab":9},"38":{"Id":"38","skill":"Charged Bolt","charclass":"sor","EType":"ltng","HitShift":"7","EMin":"4","EMax":"8","EDmgSymPerCalc":"(skill('Lightning'.blvl) + skill('Telekinesis'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"1","EMinLev2":"1","EMinLev3":"1","EMinLev4":"2","EMinLev5":"2","EMaxLev1":"1","EMaxLev2":"1","EMaxLev3":"2","EMaxLev4":"3","EMaxLev5":"4","Param1":"3","Param2":"1","Param8":"7","calc1":"\"min(28,ln12)\"","name":"Charged Bolt","tab":9},"49":{"Id":"49","skill":"Lightning","charclass":"sor","EType":"ltng","HitShift":"8","EMin":"8","EMax":"30","EDmgSymPerCalc":"(skill('Chain Lightning'.blvl)+skill('Charged Bolt'.blvl))*par8","anim":"SC","seqnum":"12","maxlvl":"20","reqlevel":"12","EMinLev1":"3","EMinLev2":"3","EMinLev3":"4","EMinLev4":"5","EMinLev5":"6","EMaxLev1":"10","EMaxLev2":"13","EMaxLev3":"16","EMaxLev4":"19","EMaxLev5":"22","Param1":"10","Param2":"20","Param3":"4","Param8":"8","name":"Lightning","tab":9},"53":{"Id":"53","skill":"Chain Lightning","charclass":"sor","EType":"ltng","HitShift":"8","EMin":"8","EMax":"40","EDmgSymPerCalc":"(skill('Charged Bolt'.blvl)+skill('Lightning'.blvl))*par8","aurarangecalc":"par1","anim":"SQ","seqnum":"12","maxlvl":"20","reqlevel":"24","EMinLev1":"2","EMinLev2":"3","EMinLev3":"4","EMinLev4":"4","EMinLev5":"5","EMaxLev1":"13","EMaxLev2":"16","EMaxLev3":"19","EMaxLev4":"22","EMaxLev5":"25","Param1":"20","Param3":"26","Param4":"1","Param5":"4","Param8":"8","calc1":"\"min(ln34 / 4, 14)\"","name":"Chain Lightning","tab":9},"56":{"Id":"56","skill":"Meteor","charclass":"sor","EType":"fire","HitShift":"8","EMin":"25","EMax":"30","EDmgSymPerCalc":"(skill('Fire Ball'.blvl) + skill('Blaze'.blvl) + skill('Inferno'.blvl))*par7","aurarangecalc":"ln12 - (stat('pvp_disable'.accr)*3)","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"7","EMinLev2":"10","EMinLev3":"13","EMinLev4":"15","EMinLev5":"17","EMaxLev1":"9","EMaxLev2":"12","EMaxLev3":"15","EMaxLev4":"18","EMaxLev5":"21","MinDam":"25","MaxDam":"30","DmgSymPerCalc":"((100+(skill('Fire Ball'.blvl) + skill('Blaze'.blvl) + skill('Inferno'.blvl))*par7) * (100+stat('passive_fire_mastery'.accr)) / 100) - 100","MinLevDam1":"7","MinLevDam2":"10","MinLevDam3":"13","MinLevDam4":"15","MinLevDam5":"17","MaxLevDam1":"9","MaxLevDam2":"12","MaxLevDam3":"15","MaxLevDam4":"18","MaxLevDam5":"21","Param1":"10","Param2":"0","Param3":"40","Param4":"0","Param7":"6","Param8":"6","calc1":"ln12 - (stat('pvp_disable'.accr)*3)","name":"Meteor","tab":8},"41":{"Id":"41","skill":"Inferno","charclass":"sor","EType":"fire","HitShift":"5","EMin":"2","EMax":"3","EDmgSymPerCalc":"(skill('Fire Wall'.blvl)+skill('Blaze'.blvl))*par8","auralencalc":"10","aurarangecalc":"ln12/4-2","anim":"SQ","seqnum":"6","maxlvl":"20","reqlevel":"1","EMinLev1":"2","EMinLev2":"3","EMinLev3":"13","EMinLev4":"23","EMinLev5":"23","EMaxLev1":"3","EMaxLev2":"5","EMaxLev3":"15","EMaxLev4":"25","EMaxLev5":"25","Param1":"22","Param2":"2","Param3":"4","Param5":"4","Param8":"20","calc1":"\"min((ln12/2),32)\"","calc2":"20","calc3":"\"min((2+(lvl/4)),5)\"","aurastat1":"fireresist","aurastatcalc1":"\"-min((par5+(lvl<22)?lvl:(22+((lvl-22)/2))), 100)\"","name":"Inferno","tab":8},"46":{"Id":"46","skill":"Blaze","charclass":"sor","EType":"fire","HitShift":"2","EMin":"1","EMax":"2","EDmgSymPerCalc":"(skill('Fire Wall'.blvl))*par8","auralencalc":"\"min(ln12, 250)\"","anim":"SC","maxlvl":"20","reqlevel":"6","EMinLev1":"1","EMinLev2":"1","EMinLev3":"5","EMinLev4":"8","EMinLev5":"8","EMaxLev1":"1","EMaxLev2":"2","EMaxLev3":"6","EMaxLev4":"9","EMaxLev5":"9","Param1":"75","Param2":"5","Param3":"25","Param4":"1","Param5":"60","Param7":"6","Param8":"6","passivestat1":"velocitypercent","passivestat2":"item_cannotbefrozen","passivecalc1":"min(ln34,par5)","passivecalc2":"1","name":"Blaze","tab":8},"51":{"Id":"51","skill":"Fire Wall","charclass":"sor","EType":"fire","HitShift":"3","EMin":"6","EMax":"10","EDmgSymPerCalc":"(skill('Blaze'.blvl))*par8","anim":"SC","maxlvl":"20","reqlevel":"12","EMinLev1":"2","EMinLev2":"6","EMinLev3":"25","EMinLev4":"50","EMinLev5":"50","EMaxLev1":"3","EMaxLev2":"8","EMaxLev3":"28","EMaxLev4":"53","EMaxLev5":"53","Param7":"5","Param8":"5","name":"Fire Wall","tab":8},"52":{"Id":"52","skill":"Enchant","charclass":"sor","EType":"fire","HitShift":"7","EMin":"25","EMax":"35","EDmgSymPerCalc":"(skill('Warmth'.blvl))*par8","ToHit":"20","LevToHit":"5","auralencalc":"ln12","aurarangecalc":"15","anim":"SC","maxlvl":"20","reqlevel":"18","EMinLev1":"8","EMinLev2":"14","EMinLev3":"24","EMinLev4":"36","EMinLev5":"46","EMaxLev1":"10","EMaxLev2":"16","EMaxLev3":"26","EMaxLev4":"38","EMaxLev5":"48","Param1":"7500","Param2":"0","Param3":"33","Param4":"8","Param8":"20","aurastat1":"firemindam","aurastat2":"firemaxdam","aurastat3":"item_tohit_percent","aurastatcalc1":"edmn","aurastatcalc2":"edmx","aurastatcalc3":"toht","name":"Enchant Fire","tab":8},"37":{"Id":"37","skill":"Warmth","charclass":"sor","EType":"fire","HitShift":"8","ToHit":"20","LevToHit":"10","anim":"SC","maxlvl":"20","reqlevel":"1","Param1":"30","Param2":"12","passivestat1":"manarecoverybonus","passivestat2":"tohit","passivecalc1":"ln12","passivecalc2":"toht","name":"Warmth","tab":8},"552":{"Id":"552","skill":"A4 AmpDmg","EType":"mag","HitShift":"8","auralencalc":"ln34","aurarangecalc":"par1","anim":"SC","maxlvl":"20","reqlevel":"1","Param1":"12","Param2":"0","Param3":"150","Param4":"5","Param5":"10","Param6":"1","aurastat1":"damageresist","aurastatcalc1":"-(par5 + par6*lvl)","name":"Amplify Damage"},"40":{"Id":"40","skill":"Cold Enchant","charclass":"sor","EType":"cold","HitShift":"7","EMin":"6","EMax":"8","EDmgSymPerCalc":"(skill('Chilling Armor'.blvl))*par8","ToHit":"20","LevToHit":"10","auralencalc":"\"min(ln12, 7500)\"","aurarangecalc":"15","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"3","EMinLev2":"12","EMinLev3":"23","EMinLev4":"39","EMinLev5":"53","EMaxLev1":"5","EMaxLev2":"14","EMaxLev3":"26","EMaxLev4":"43","EMaxLev5":"59","Param1":"7500","Param2":"0","Param3":"33","Param4":"8","Param8":"26","aurastat1":"coldmindam","aurastat2":"coldmaxdam","aurastat3":"coldlength","aurastat4":"item_tohit_percent","aurastatcalc1":"edmn","aurastatcalc2":"edmx","aurastatcalc3":"25","aurastatcalc4":"toht","name":"Cold Enchant","tab":10},"60":{"Id":"60","skill":"Chilling Armor","charclass":"sor","EType":"cold","HitShift":"7","EMin":"10","EMax":"14","ELen":"100","EDmgSymPerCalc":"skill('Blizzard'.blvl)*par8","auralencalc":"ln34","anim":"SC","maxlvl":"20","reqlevel":"24","EMinLev1":"3","EMinLev2":"6","EMinLev3":"9","EMinLev4":"12","EMinLev5":"15","EMaxLev1":"4","EMaxLev2":"7","EMaxLev3":"10","EMaxLev4":"13","EMaxLev5":"16","ELevLen1":"5","ELevLen2":"5","ELevLen3":"5","Param1":"45","Param2":"5","Param3":"6000","Param4":"75","Param7":"0","Param8":"20","aurastat1":"skill_armor_percent","aurastat2":"toblock","aurastatcalc1":"ln12","aurastatcalc2":"5 + blvl","name":"Chilling Armor","tab":10},"35":{"Id":"35","skill":"Lightning Fury","charclass":"ama","EType":"ltng","HitShift":"8","EMin":"11","EMax":"65","EDmgSymPerCalc":"(skill('Lightning bolt'.blvl)) * par8 + (skill('Power Strike'.blvl)) * par8","aurarangecalc":"par3","anim":"TH","SrcDam":"128","maxlvl":"20","itypea1":"jave","reqlevel":"30","EMinLev1":"1","EMinLev2":"1","EMinLev3":"2","EMinLev4":"2","EMinLev5":"3","EMaxLev1":"8","EMaxLev2":"9","EMaxLev3":"10","EMaxLev4":"11","EMaxLev5":"12","Param1":"10","Param2":"0","Param3":"15","Param7":"3","Param8":"3","calc1":"10 + (lvl / 5)","name":"Lightning Fury","tab":2},"14":{"Id":"14","skill":"Power Strike","charclass":"ama","EType":"ltng","HitShift":"8","EMin":"1","EMax":"1","EDmgSymPerCalc":"(skill('Lightning Bolt'.blvl) + skill('Lightning Strike'.blvl)) * par8","ToHit":"20","LevToHit":"12","aurarangecalc":"par1","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"spea","reqlevel":"6","EMinLev1":"0","EMinLev2":"0","EMinLev3":"0","EMinLev4":"0","EMinLev5":"0","EMaxLev1":"3","EMaxLev2":"5","EMaxLev3":"13","EMaxLev4":"22","EMaxLev5":"32","Param1":"5","Param8":"25","calc1":"10","calc2":"0","name":"Power Strike","tab":2},"34":{"Id":"34","skill":"Lightning Strike","charclass":"ama","EType":"ltng","HitShift":"8","EMin":"6","EMax":"25","EDmgSymPerCalc":"(skill('Charged Strike'.blvl)+skill('Power Strike'.blvl)) * par8","aurarangecalc":"par1","anim":"A1","maxlvl":"20","itypea1":"spea","reqlevel":"30","EMinLev1":"2","EMinLev2":"4","EMinLev3":"7","EMinLev4":"11","EMinLev5":"15","EMaxLev1":"10","EMaxLev2":"20","EMaxLev3":"35","EMaxLev4":"55","EMaxLev5":"75","Param1":"16","Param3":"4","Param4":"1","Param8":"10","calc1":"10","calc2":"\"min(ln34,10)\"","name":"Lightning Strike","tab":2},"24":{"Id":"24","skill":"Charged Strike","charclass":"ama","EType":"ltng","HitShift":"8","EMin":"7","EMax":"40","EDmgSymPerCalc":"(skill('Lightning Strike'.blvl)+skill('Power Strike'.blvl))*par8","anim":"A1","maxlvl":"20","itypea1":"spea","reqlevel":"18","EMinLev1":"2","EMinLev2":"2","EMinLev3":"3","EMinLev4":"4","EMinLev5":"4","EMaxLev1":"12","EMaxLev2":"16","EMaxLev3":"20","EMaxLev4":"24","EMaxLev5":"28","Param1":"3","Param2":"3","Param7":"10","Param8":"10","calc1":"\"min(12,par1+lvl/par2)\"","name":"Charged Strike","tab":2},"20":{"Id":"20","skill":"Lightning Bolt","charclass":"ama","EType":"ltng","HitShift":"8","EMin":"5","EMax":"40","EDmgSymPerCalc":"(skill('Lightning Fury'.blvl) + skill('Power Strike'.blvl)) * par8","anim":"TH","SrcDam":"128","maxlvl":"20","itypea1":"jave","reqlevel":"12","EMinLev1":"1","EMinLev2":"3","EMinLev3":"5","EMinLev4":"8","EMinLev5":"11","EMaxLev1":"12","EMaxLev2":"26","EMaxLev3":"54","EMaxLev4":"82","EMaxLev5":"110","Param8":"15","name":"Lightning Bolt","tab":2},"31":{"Id":"31","skill":"Freezing Arrow","charclass":"ama","EType":"cold","HitShift":"8","EMin":"35","EMax":"55","ELen":"12","EDmgSymPerCalc":"(skill('Ice Arrow'.blvl))*par8 + skill('Cold Arrow'.blvl)*par6","ToHit":"40","LevToHit":"10","aurarangecalc":"par1+(blvl / 4)","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"30","EMinLev1":"8","EMinLev2":"12","EMinLev3":"16","EMinLev4":"20","EMinLev5":"24","EMaxLev1":"10","EMaxLev2":"14","EMaxLev3":"18","EMaxLev4":"22","EMaxLev5":"26","Param1":"4","Param6":"6","Param7":"0","Param8":"6","calc1":"par1+(blvl / 4)","name":"Freezing Arrow","tab":0},"11":{"Id":"11","skill":"Cold Arrow","charclass":"ama","EType":"cold","HitShift":"8","EMin":"14","EMax":"20","ELen":"100","EDmgSymPerCalc":"(skill('Ice Arrow'.blvl))*par7 +(skill('Magic Arrow'.blvl)) * par8","ToHit":"10","LevToHit":"10","anim":"A1","SrcDam":"64","maxlvl":"20","itypea1":"miss","reqlevel":"6","EMinLev1":"4","EMinLev2":"10","EMinLev3":"30","EMinLev4":"60","EMinLev5":"90","EMaxLev1":"8","EMaxLev2":"12","EMaxLev3":"32","EMaxLev4":"64","EMaxLev5":"96","Param2":"4","Param7":"15","Param8":"15","calc1":"\"(min(12,2+(lvl/par2))) + stat('extra_cold_arrows'.accr)\"","calc3":"100","name":"Cold Arrow","tab":0},"6":{"Id":"6","skill":"Magic Arrow","charclass":"ama","EType":"mag","HitShift":"8","EMin":"3","EMax":"5","EDmgSymPerCalc":"(skill('Inner Sight'.blvl)+skill('Slow Movement'.blvl)+skill('Guided Arrow'.blvl))*par8","ToHit":"10","LevToHit":"9","anim":"A1","SrcDam":"96","maxlvl":"20","itypea1":"miss","reqlevel":"1","EMinLev1":"2","EMinLev2":"5","EMinLev3":"15","EMinLev4":"30","EMinLev5":"44","EMaxLev1":"3","EMaxLev2":"7","EMaxLev3":"17","EMaxLev4":"32","EMaxLev5":"47","Param1":"75","Param2":"10","Param8":"20","calc1":"1 + (blvl / 5)","calc3":"100","name":"Magic Arrow","tab":0},"22":{"Id":"22","skill":"Guided Arrow","charclass":"ama","EType":"mag","HitShift":"8","anim":"A1","SrcDam":"64","maxlvl":"20","itypea1":"miss","reqlevel":"18","Param3":"25","Param4":"5","calc1":"ln34","name":"Guided Arrow","tab":0},"17":{"Id":"17","skill":"Slow Movement","charclass":"ama","EType":"mag","HitShift":"8","ELen":"75","auralencalc":"ln34","aurarangecalc":"\"min(ln56,24)\"","anim":"SC","maxlvl":"20","reqlevel":"12","ELevLen1":"-2","ELevLen2":"-2","ELevLen3":"-1","Param1":"75","Param2":"-1","Param3":"250","Param4":"5","Param5":"18","Param6":"1","Param7":"20","Param8":"2","aurastat1":"skill_handofathena","aurastat2":"velocitypercent","aurastatcalc1":"\"max(edln,25)\"","aurastatcalc2":"-\"min(ln78,65)\"","name":"Slow Movement","tab":1},"8":{"Id":"8","skill":"Inner Sight","charclass":"ama","EType":"mag","HitShift":"8","EMin":"40","auralencalc":"ln34","aurarangecalc":"\"min(ln56, 30)\"","anim":"SC","maxlvl":"20","reqlevel":"1","EMinLev1":"25","EMinLev2":"45","EMinLev3":"60","EMinLev4":"80","EMinLev5":"100","Param1":"40","Param2":"25","Param3":"200","Param4":"100","Param5":"10","Param6":"1","Param7":"1","aurastat1":"armorclass","aurastat2":"item_tohit_percent","aurastatcalc1":"-edmn","aurastatcalc2":"-\"min(9+(lvl*par7),40)\"","name":"Inner Sight","tab":1},"21":{"Id":"21","skill":"Ice Arrow","charclass":"ama","EType":"cold","HitShift":"8","EMin":"22","EMax":"36","ELen":"25","EDmgSymPerCalc":"(skill('Cold Arrow'.blvl)+skill('Freezing Arrow'.blvl))*par8 + (skill('Magic Arrow'.blvl))*par6","ELenSymPerCalc":"(skill('Freezing Arrow'.blvl)+skill('Cold Arrow'.blvl)) * par7","ToHit":"20","LevToHit":"10","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"12","EMinLev1":"10","EMinLev2":"14","EMinLev3":"24","EMinLev4":"34","EMinLev5":"44","EMaxLev1":"11","EMaxLev2":"16","EMaxLev3":"26","EMaxLev4":"36","EMaxLev5":"46","Param6":"16","Param7":"5","Param8":"10","name":"Ice Arrow","tab":0},"30":{"Id":"30","skill":"Fend","charclass":"ama","HitShift":"8","ToHit":"80","LevToHit":"6","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"spea","reqlevel":"18","Param1":"0","Param2":"60","Param3":"100","Param4":"25","Param8":"20","calc1":"3","calc2":"ln34 + (skill('Jab'.blvl) * par8)","aurastat1":"inc_splash_radius","aurastatcalc1":"1","name":"Fend","tab":2},"10":{"Id":"10","skill":"Jab","charclass":"ama","HitShift":"8","ToHit":"25","LevToHit":"12","anim":"SQ","seqnum":"1","SrcDam":"128","maxlvl":"20","itypea1":"spea","reqlevel":"1","Param3":"30","Param4":"15","Param8":"12","calc1":"ln34 + (skill('Fend'.blvl) * par8)","name":"Jab","tab":2},"29":{"Id":"29","skill":"Evade","charclass":"ama","HitShift":"8","EMin":"6","EMax":"15","anim":"NU","maxlvl":"20","reqlevel":"6","EMinLev1":"2","EMinLev2":"1","EMinLev3":"1","EMinLev4":"1","EMaxLev1":"2","EMaxLev2":"2","EMaxLev3":"2","EMaxLev4":"2","EMaxLev5":"1","Param1":"0","Param2":"40","Param3":"2","passivestat1":"passive_evade","passivestat2":"velocitypercent","passivecalc1":"\"min(edmn, par2)\"","passivecalc2":"edmx","name":"Evade","tab":1},"27":{"Id":"27","skill":"Immolation Arrow","charclass":"ama","EType":"fire","HitShift":"8","EMin":"10","EMax":"23","EDmgSymPerCalc":"(skill('Exploding Arrow'.blvl)+skill('Fire Arrow'.blvl)+skill('Magic Arrow'.blvl))*par8","ToHit":"30","LevToHit":"9","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"30","EMinLev1":"10","EMinLev2":"18","EMinLev3":"27","EMinLev4":"29","EMinLev5":"30","EMaxLev1":"10","EMaxLev2":"18","EMaxLev3":"27","EMaxLev4":"29","EMaxLev5":"30","Param1":"3","Param2":"4","Param8":"5","calc1":"par1","calc2":"par2","name":"Immolation Arrow","tab":0},"7":{"Id":"7","skill":"Fire Arrow","charclass":"ama","EType":"fire","HitShift":"8","EMin":"17","EMax":"24","EDmgSymPerCalc":"(skill('Immolation Arrow'.blvl)+skill('Magic Arrow'.blvl))*par8","ToHit":"10","LevToHit":"10","anim":"A1","SrcDam":"64","maxlvl":"20","itypea1":"miss","reqlevel":"6","EMinLev1":"7","EMinLev2":"12","EMinLev3":"32","EMinLev4":"64","EMinLev5":"96","EMaxLev1":"9","EMaxLev2":"15","EMaxLev3":"35","EMaxLev4":"70","EMaxLev5":"105","Param2":"3","Param8":"15","calc1":"\"min(14,2+(lvl/par2))\"","calc3":"100","name":"Fire Arrow","tab":0},"16":{"Id":"16","skill":"Exploding Arrow","charclass":"ama","EType":"fire","HitShift":"8","EMin":"2","EMax":"6","EDmgSymPerCalc":"(skill('Immolation Arrow'.blvl)) * par8 + (skill('Magic Arrow'.blvl))*par7","ToHit":"20","LevToHit":"10","aurarangecalc":"par1+(blvl / 4)","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"18","EMinLev1":"5","EMinLev2":"9","EMinLev3":"17","EMinLev4":"27","EMinLev5":"37","EMaxLev1":"6","EMaxLev2":"10","EMaxLev3":"18","EMaxLev4":"28","EMaxLev5":"38","Param1":"3","Param2":"3","Param3":"10","Param4":"25","Param5":"2","Param7":"18","Param8":"18","calc1":"par1+(blvl / 4)","calc2":"\"min((par2+(lvl/5)),8)\"","calc3":"par3","calc4":"par5","name":"Exploding Arrow","tab":0},"26":{"Id":"26","skill":"Strafe","charclass":"ama","HitShift":"8","ToHit":"80","LevToHit":"6","aurarangecalc":"par5","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"24","Param1":"80","Param2":"12","Param3":"2","Param4":"5","Param5":"28","Param6":"50","Param8":"10","calc1":"\"min(par3 + lvl - 1, par4)\"","calc2":"ln12 + (skill('Penetrate'.blvl) * par8)","calc3":"2+lvl/4","name":"Strafe","tab":0},"23":{"Id":"23","skill":"Penetrate","charclass":"ama","HitShift":"8","maxlvl":"20","itypea1":"spea","reqlevel":"24","Param1":"35","Param2":"10","Param3":"5","calc1":"par1+lvl/par2","passivestat1":"item_tohit_percent","passivestat2":"passive_phys_pierce","passivecalc1":"ln12","passivecalc2":"blvl/2","name":"Penetrate","tab":1},"25":{"Id":"25","skill":"Plague Javelin","charclass":"ama","EType":"pois","HitShift":"3","EMin":"10","EMax":"16","ELen":"75","EDmgSymPerCalc":"(skill('Poison Javelin'.blvl) * par8) + (skill('Javelin and Spear Mastery'.blvl) * (par8))","ToHit":"50","LevToHit":"10","anim":"TH","SrcDam":"128","maxlvl":"20","itypea1":"jave","reqlevel":"18","EMinLev1":"6","EMinLev2":"12","EMinLev3":"20","EMinLev4":"40","EMinLev5":"80","EMaxLev1":"6","EMaxLev2":"12","EMaxLev3":"20","EMaxLev4":"40","EMaxLev5":"80","Param8":"12","name":"Plague Javelin","tab":2},"19":{"Id":"19","skill":"Javelin and Spear Mastery","charclass":"ama","HitShift":"8","EMin":"10","anim":"SC","maxlvl":"20","itypea1":"spea","passiveitype":"spea","reqlevel":"6","EMinLev1":"1","EMinLev2":"1","EMinLev3":"1","EMinLev4":"1","EMinLev5":"1","Param1":"40","Param2":"12","Param5":"0","Param6":"35","passivestat1":"passive_mastery_melee_dmg","passivestat2":"item_crit_multiplier","passivestat3":"passive_mastery_throw_dmg","passivecalc1":"ln12","passivecalc2":"edmn","passivecalc3":"ln12","name":"Javelin and Spear Mastery","tab":2},"15":{"Id":"15","skill":"Poison Javelin","charclass":"ama","EType":"pois","EMin":"22","EMax":"54","ELen":"25","EDmgSymPerCalc":"(skill('Plague Javelin'.blvl) * par8) + (skill('Javelin and Spear Mastery'.blvl)) * par8","anim":"TH","SrcDam":"128","maxlvl":"20","itypea1":"jave","reqlevel":"1","EMinLev1":"24","EMinLev2":"72","EMinLev3":"144","EMinLev4":"288","EMinLev5":"576","EMaxLev1":"25","EMaxLev2":"75","EMaxLev3":"150","EMaxLev4":"300","EMaxLev5":"600","ELevLen1":"0","ELevLen2":"0","ELevLen3":"0","Param8":"24","name":"Poison Javelin","tab":2},"12":{"Id":"12","skill":"Multiple Shot","charclass":"ama","HitShift":"8","ToHit":"8","LevToHit":"6","anim":"A1","SrcDam":"128","maxlvl":"20","itypea1":"miss","reqlevel":"6","Param1":"5","Param2":"1","Param3":"1","Param5":"50","Param6":"4","Param8":"8","calc1":"\"min(25,ln12)\"","calc2":"par3","calc3":"3","calc4":"ln56","name":"Multiple Shot","tab":0},"9":{"Id":"9","skill":"Critical Strike","charclass":"ama","HitShift":"8","maxlvl":"20","itypea1":"spea","reqlevel":"1","Param1":"5","Param2":"75","passivestat1":"passive_critical_strike","passivecalc1":"dm12","name":"Critical Strike","tab":1},"2":{"Id":"2","skill":"Throw","HitShift":"8","anim":"TH","SrcDam":"128","itypea1":"thro","reqlevel":"1","name":"Throw"},"0":{"Id":"0","skill":"Attack","HitShift":"8","anim":"A1","SrcDam":"128","itypea1":"weap","reqlevel":"1","name":"Attack"}},"targets":[{"k":"andariel","n":"Andariel","g":"Act bosses","lvl":85,"hp":[90937,90937],"res":66,"el":{"fire":-50,"ltng":66,"cold":66,"pois":66,"mag":0},"def":1816,"type":"demon","kind":"lesser","tier":false,"sz":3,"kb":3},{"k":"duriel","n":"Duriel","g":"Act bosses","lvl":88,"hp":[84524,84524],"res":50,"el":{"fire":75,"ltng":75,"cold":95,"pois":75,"mag":33},"def":2044,"type":"demon","kind":"lesser","tier":false,"sz":3,"kb":3},{"k":"mephisto","n":"Mephisto","g":"Act bosses","lvl":87,"hp":[94320,94320],"res":20,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":2697,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"diablo","n":"Diablo","g":"Act bosses","lvl":94,"hp":[180425,180425],"res":45,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":0},"def":2534,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"baalcrab","n":"Baal","g":"Act bosses","lvl":99,"hp":[493701,493701],"res":50,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":0},"def":2847,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberandariel","n":"Lilith","g":"Pandemonium","lvl":110,"hp":[650000,660000],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":1155,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberduriel","n":"Uber Duriel","g":"Pandemonium","lvl":110,"hp":[650000,660000],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":95,"mag":50},"def":1260,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberizual","n":"Uber Izual","g":"Pandemonium","lvl":110,"hp":[650000,660000],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":95,"mag":50},"def":1260,"type":"","kind":"boss","tier":false,"sz":2,"kb":0},{"k":"ubermephisto","n":"Uber Mephisto","g":"Pandemonium","lvl":120,"hp":[569500,569500],"res":40,"el":{"fire":60,"ltng":60,"cold":60,"pois":60,"mag":40},"def":1260,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberdiablo","n":"Uber Diablo","g":"Pandemonium","lvl":120,"hp":[642700,642700],"res":40,"el":{"fire":60,"ltng":60,"cold":60,"pois":60,"mag":40},"def":1155,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberbaal","n":"Uber Baal","g":"Pandemonium","lvl":120,"hp":[633600,633600],"res":40,"el":{"fire":60,"ltng":60,"cold":60,"pois":60,"mag":40},"def":1176,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"uberancientbarb1","n":"Talic","g":"Uber Ancients","lvl":90,"hp":[510829,510829],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2173,"type":"","kind":"boss","tier":false,"sz":2,"kb":3},{"k":"uberancientbarb2","n":"Madawc","g":"Uber Ancients","lvl":90,"hp":[449340,449340],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2173,"type":"","kind":"boss","tier":false,"sz":2,"kb":3},{"k":"uberancientbarb3","n":"Korlic","g":"Uber Ancients","lvl":90,"hp":[406771,406771],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2173,"type":"","kind":"boss","tier":false,"sz":2,"kb":3},{"k":"uberdiablonew","n":"Diablo Clone","g":"Diablo Clone, Rathma, Lucion","lvl":110,"hp":[1053000,1053000],"res":30,"el":{"fire":30,"ltng":30,"cold":30,"pois":30,"mag":15},"def":2940,"type":"demon","kind":"boss","tier":true,"sz":3,"kb":3,"plr":50},{"k":"rathmaBone","n":"Rathma","g":"Diablo Clone, Rathma, Lucion","lvl":110,"hp":[697500,697500],"res":30,"el":{"fire":75,"ltng":50,"cold":50,"pois":0,"mag":20},"def":1470,"type":"","kind":"boss","tier":true,"sz":2,"kb":3,"plr":30},{"k":"rathmaPoison","n":"Mendeln","g":"Diablo Clone, Rathma, Lucion","lvl":110,"hp":[855000,855000],"res":30,"el":{"fire":65,"ltng":40,"cold":40,"pois":0,"mag":20},"def":1470,"type":"","kind":"boss","tier":true,"sz":2,"kb":0,"plr":30},{"k":"Lucion","n":"Lucion","g":"Diablo Clone, Rathma, Lucion","lvl":110,"hp":[2400000,2400000],"res":30,"el":{"fire":30,"ltng":30,"cold":30,"pois":30,"mag":20},"def":1470,"type":"","kind":"boss","tier":true,"sz":3,"kb":3,"plr":30},{"k":"megademonboss","n":"Lieutenant of Sin","g":"Map bosses: Tier 1","lvl":91,"hp":[377960,377960],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2020,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":0},{"k":"unravelerboss","n":"Karvarousku the Cartographer","g":"Map bosses: Tier 1","lvl":90,"hp":[229738,229738],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2086,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"IceBoss","n":"Nathkill The Numb","g":"Map bosses: Tier 1","lvl":90,"hp":[236495,236495],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1565,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"TombBoss","n":"Toadflax the Tainted","g":"Map bosses: Tier 1","lvl":90,"hp":[354742,354742],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2173,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":0},{"k":"torajanBoss","n":"The Great Worm","g":"Map bosses: Tier 1","lvl":89,"hp":[185976,185976],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1205,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"act2hireTraitorBoss","n":"Waheed The Traitor","g":"Map bosses: Tier 1","lvl":89,"hp":[272322,272322],"res":50,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":2152,"type":"","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"spiderboss","n":"Khalim's Corrupted Body","g":"Map bosses: Tier 1","lvl":89,"hp":[273982,273982],"res":50,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":1635,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"westmarchMapBoss","n":"Urzael Harbringer of Death","g":"Map bosses: Tier 1","lvl":89,"hp":[265680,265680],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1205,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"doomknight3LibraryBoss","n":"The Guardian","g":"Map bosses: Tier 1","lvl":91,"hp":[446680,446680],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2020,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"PoisonedWellBoss","n":"Rotting Horror","g":"Map bosses: Tier 1","lvl":80,"hp":[392490,392490],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1406,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"ArcaneBoss","n":"Deathmaiden Madinsane","g":"Map bosses: Tier 2","lvl":89,"hp":[376601,376601],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1980,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"ThroneBoss","n":"Indio The Insane","g":"Map bosses: Tier 2","lvl":91,"hp":[412320,412320],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1757,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"SewerBoss","n":"The Mad Philosopher","g":"Map bosses: Tier 2","lvl":89,"hp":[252396,252396],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":33,"mag":20},"def":1894,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"archerBoss","n":"Dark Commander Alma","g":"Map bosses: Tier 2","lvl":91,"hp":[309240,309240],"res":50,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":2196,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"CanyonBoss","n":"Shattered Soul","g":"Map bosses: Tier 2","lvl":91,"hp":[329856,329856],"res":50,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":1757,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"AshenBoss","n":"Borq the Consumed","g":"Map bosses: Tier 2","lvl":91,"hp":[398576,398576],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2108,"type":"undead","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"lernaeanhydra2","n":"Ancient Cistern Hydra","g":"Map bosses: Tier 2","lvl":89,"hp":[365310,365310],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1722,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"TortureHallsBoss","n":"Gimli the Summoned One","g":"Map bosses: Tier 2","lvl":89,"hp":[421767,421767],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2410,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"DarkTempleBoss","n":"Son of Rakkis","g":"Map bosses: Tier 2","lvl":84,"hp":[515695,515695],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1143,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"DescentBoss","n":"Tainted Child of Bul-Kathos","g":"Map bosses: Tier 2","lvl":84,"hp":[485360,485360],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1062,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":3},{"k":"baalminionboss","n":"Belial Lord of Lies","g":"Map bosses: Tier 3","lvl":91,"hp":[446680,446680],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2371,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"BastionBoss","n":"Johnathan The Damned","g":"Map bosses: Tier 3","lvl":90,"hp":[405420,405420],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1565,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"CowBoss","n":"The Cow Queen","g":"Map bosses: Tier 3","lvl":91,"hp":[481040,481040],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2284,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"SiegeBoss","n":"Armorsmith of Equality","g":"Map bosses: Tier 3","lvl":89,"hp":[415125,415125],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":0,"mag":20},"def":1722,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":3},{"k":"MarketBoss","n":"Overlord Aerlynn","g":"Map bosses: Tier 3","lvl":91,"hp":[467296,467296],"res":50,"el":{"fire":75,"ltng":75,"cold":75,"pois":75,"mag":50},"def":1405,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"leoricMapBoss","n":"King Leoric","g":"Map bosses: Tier 3","lvl":89,"hp":[448335,448335],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2410,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":3},{"k":"DemonRoadBoss","n":"Thonos the Many-Limbed","g":"Map bosses: Tier 3","lvl":90,"hp":[472990,472990],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1652,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":0},{"k":"SkovosBoss","n":"Incarnation of Akarat","g":"Map bosses: Tier 3","lvl":90,"hp":[462854,462854],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1304,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"KyovoshadBoss","n":"The Tainted Hive","g":"Map bosses: Tier 3","lvl":91,"hp":[549760,549760],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":527,"type":"","kind":"boss","tier":false,"sz":3,"kb":3},{"k":"willowispboss","n":"Canight The Corrupted","g":"Tier 4 dungeons","lvl":92,"hp":[1117920,1117920],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":2040,"type":"undead","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"fingermageboss","n":"The Synthetic One","g":"Tier 4 dungeons","lvl":92,"hp":[838440,838440],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":2128,"type":"undead","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"siegebeastMapBoss","n":"The Stygian Beast","g":"Tier 4 dungeons","lvl":92,"hp":[698700,698700],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":1596,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"KanemithBoss","n":"Naz the Cursed King","g":"Tier 4 dungeons","lvl":92,"hp":[908310,908310],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":1951,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"RadamentBoss","n":"Elmegaard the Unholy","g":"Tier 4 dungeons","lvl":92,"hp":[1152855,1152855],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":2128,"type":"","kind":"mapboss","tier":false,"sz":2,"kb":3},{"k":"SharpToothBoss","n":"Skullsplitter Cyrus","g":"Tier 4 dungeons","lvl":90,"hp":[1013550,1013550],"res":50,"el":{"fire":90,"ltng":90,"cold":90,"pois":90,"mag":50},"def":1565,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"ZharTheMad","n":"Zhar The Mad","g":"Unique maps","lvl":91,"hp":[446680,446680],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1493,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"WarlordOfBlood","n":"Warlord of Blood","g":"Unique maps","lvl":91,"hp":[439808,439808],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":7028,"type":"","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"CityofUrehBoss","n":"Gregus Mazi","g":"Unique maps","lvl":91,"hp":[1030800,1030800],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":3514,"type":"","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"NaKrulBoss","n":"Na-Krul","g":"Unique maps","lvl":91,"hp":[481040,481040],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2635,"type":"demon","kind":"boss","tier":false,"sz":3,"kb":0},{"k":"DjinnDarkBoss","n":"Siren of the Forgotten Vault","g":"Unique maps","lvl":90,"hp":[641915,641915],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1999,"type":"demon","kind":"boss","tier":false,"sz":2,"kb":1},{"k":"DjinnLightBoss","n":"Djinn of a Thousand Blades","g":"Unique maps","lvl":90,"hp":[608130,608130],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1999,"type":"undead","kind":"boss","tier":false,"sz":2,"kb":1},{"k":"ImperialPalaceBoss","n":"Imperial Assassin","g":"Unique maps","lvl":91,"hp":[566940,566940],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1932,"type":"demon","kind":"mapboss","tier":false,"sz":2,"kb":0},{"k":"Iskatu","n":"Iskatu","g":"Unique maps","lvl":90,"hp":[472990,472990],"res":30,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1478,"type":"","kind":"mapboss","tier":false,"sz":2,"kb":3},{"k":"Rakanoth","n":"Rakanoth","g":"Unique maps","lvl":90,"hp":[405420,405420],"res":50,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":2086,"type":"demon","kind":"mapboss","tier":false,"sz":3,"kb":3},{"k":"TombEventBoss","n":"Zoltun Kulle","g":"Map events","lvl":85,"hp":[494560,494560],"res":20,"el":{"fire":50,"ltng":50,"cold":50,"pois":50,"mag":20},"def":1981,"type":"undead","kind":"boss","tier":false,"sz":2,"kb":0}],"maps":{"mons":{"unravelerboss":["Karvarousku the Cartographer",3400,3400,120,0,90,20,50,50,50,50,20,"undead","mapboss",2,0],"unravelerbossskeleton":["Burning Dead",300,300,100,0,0,20,50,50,50,50,20,"undead","monster",2,1],"unravelerbossarcher":["Burning Dead Archer",200,200,100,0,0,20,50,50,50,50,20,"undead","monster",2,1],"cr_lancermap":["Black Lancer",128,148,95,0,0,0,25,75,75,25,35,"demon","monster",2,1],"goatmanmap":["Moon Clan",138,169,60,0,0,50,60,25,50,50,35,"demon","monster",2,1],"cr_archermap":["Dark Ranger",119,139,90,0,0,15,25,25,120,25,20,"demon","monster",2,1],"bigheadmap":["Disfigured",114,147,90,0,0,25,50,50,25,50,0,"demon","monster",3,3],"cantormap":["Heirophant",148,212,75,0,0,10,50,50,75,20,33,"","monster",2,1],"zealotmap":["Zealot",207,227,80,0,0,10,25,80,35,20,0,"","monster",2,1],"unravelermap":["Hollow One",148,189,120,0,0,33,45,45,55,50,50,"undead","monster",2,1],"skeleton2ruins":["Returned",100,140,100,0,0,33,25,35,75,75,25,"undead","monster",2,1],"arachmap":["Spider Magus",199,240,135,0,0,50,50,50,20,75,0,"","monster",3,1],"thornhulkmap":["Thorned Hulk",163,205,140,0,0,115,0,75,45,75,0,"","monster",3,3],"sandleapermap":["Tree Lurker",117,163,130,0,0,25,50,75,50,50,25,"","monster",2,1],"mosquitomap":["Sucker",114,163,95,0,0,0,75,45,25,80,50,"","monster",2,1],"fetishshamanmap":["Fetish Shaman",148,189,100,0,0,25,75,45,45,50,25,"demon","monster",2,2],"fetish2ruins":["Fetish",110,160,125,0,0,0,75,50,50,50,25,"demon","monster",2,2],"fetishblow2ruins":["Fetish",90,150,110,0,0,0,75,50,50,50,25,"demon","monster",2,2],"megademonboss":["Lieutenant of Sin",5500,5500,115,0,91,20,50,50,50,50,20,"demon","mapboss",3,0],"minionmap":["Hell Spawn",154,168,100,0,0,30,50,75,50,75,0,"demon","monster",3,3],"pantherwomanmap":["Hell Cat",126,156,105,0,0,15,25,50,75,25,25,"","monster",2,1],"fallenmap":["Fallen",101,136,70,0,0,15,50,25,40,50,25,"demon","monster",2,2],"slingermap":["Hell Slinger",115,140,95,0,0,10,25,50,25,50,25,"","monster",2,1],"siegebeastmap":["Siege Beast",174,192,90,0,0,50,120,33,50,25,0,"","monster",3,3],"imp1phlegethon":["Demon Imp",110,160,110,0,0,25,75,25,35,75,25,"demon","monster",2,2],"bloodlordmap":["Moon Lord",150,174,130,0,0,50,50,50,50,50,50,"","monster",3,3],"councilmembermap":["Council Member",146,164,110,0,0,30,75,80,45,40,0,"demon","monster",2,1],"reanimatedhordemap":["Unholy Corpse",115,132,70,0,0,50,25,25,75,120,50,"undead","monster",2,1],"fallenshamanmap":["Fallen Shaman",188,220,75,0,0,15,75,75,45,50,25,"demon","monster",2,2],"fetishmap":["Fetish",126,145,125,0,0,25,50,50,50,50,25,"demon","monster",2,2],"doomknight3LibraryBoss":["The Guardian",6500,6500,115,0,91,20,50,50,50,50,20,"undead","mapboss",2,0],"corruptrogue2Library":["Vile Hunter",138,179,95,0,0,20,35,45,65,45,15,"demon","monster",2,1],"cr_archer2Library":["Vile Archer",124,158,90,0,0,15,75,25,40,40,15,"demon","monster",2,1],"cr_lancer2Library":["Vile Lancer",166,199,95,0,0,45,45,120,40,45,105,"demon","monster",2,1],"deathmauler3Library":["Death Slasher",158,227,95,0,0,33,50,25,65,25,25,"","monster",3,1],"willowisp1Library":["Gloam",110,144,115,0,0,60,25,75,25,75,0,"undead","monster",2,1],"vampire1Library":["Ghoul Lord",206,276,100,0,0,30,45,50,75,75,35,"undead","monster",2,1],"bloodlord5Library":["Death Lord",331,414,130,0,0,0,75,50,40,50,25,"","monster",3,3],"torajanBoss":["The Great Worm",2800,2800,70,0,89,20,50,50,50,50,20,"","mapboss",3,3],"torajanBossPoisonEgg":["Blood Maggot Egg",180,180,25,0,89,180,180,180,180,0,180,"","boss",1,0],"foulcrowJungle":["Foul Crow",135,168,120,0,0,0,50,25,45,70,0,"","monster",2,1],"sandleaperJungle":["Tree Lurker",120,157,130,0,0,0,50,50,0,120,25,"","monster",2,1],"quillratJungle":["Quill Rat",123,153,80,0,0,25,75,45,50,45,0,"","monster",2,2],"deathmaulerJungle":["Death Brawler",142,180,95,0,0,35,50,50,50,50,50,"","monster",3,1],"bruteJungle":["Crusher",180,217,85,0,0,50,35,35,120,50,25,"","monster",3,3],"baboonJungle":["Dune Beast",135,172,110,0,0,35,45,75,45,25,25,"","monster",3,1],"scarabJungle":["Death Beetle",127,165,145,0,0,50,25,75,75,0,25,"","monster",3,1],"councilmemberJungle":["Council Member",161,210,110,0,0,25,75,50,35,33,40,"demon","monster",2,1],"spiderboss":["Khalim's Corrupted Body",4125,4125,95,0,89,50,75,75,75,75,50,"demon","mapboss",3,3],"minionSpider":["Enslaved",141,170,100,0,0,25,50,50,25,65,15,"","monster",3,3],"mosquito4Spider":["Blood Wing",109,139,95,0,0,25,15,40,25,45,25,"","monster",2,1],"batdemon6Spider":["Gloombat",99,124,110,0,0,10,50,50,120,0,105,"","monster",2,1],"unraveler3Spider":["Unraveler",149,174,120,0,0,35,35,20,50,80,50,"undead","monster",2,1],"fetishblowSpider":["Flayer",125,165,110,0,0,0,75,80,50,75,25,"demon","monster",2,2],"blunderbore2Spider":["Gorebelly",180,204,80,0,0,55,50,75,65,30,0,"demon","monster",3,3],"arach3Spider":["Poison Spinner",145,169,135,0,0,50,75,35,25,75,0,"","monster",3,1],"IceBoss":["Nathkill The Numb",3500,3500,90,0,90,20,50,50,50,50,20,"demon","mapboss",3,3],"skmage_coldIce":["Bone Mage",120,148,90,0,0,0,50,25,65,50,25,"undead","monster",2,1],"mummyIce":["Preserved Dead",153,181,95,0,0,20,120,50,50,50,50,"undead","monster",2,1],"skeletonIce":["Bone Warrior",137,164,100,0,0,0,50,45,45,50,25,"undead","monster",2,1],"arach5Ice":["Spider Magus",158,186,135,0,0,25,25,30,75,75,0,"","monster",3,1],"megademon2Ice":["Pit Lord",175,203,115,0,0,50,50,120,0,25,0,"demon","monster",3,1],"wraith3Ice":["Specter",120,148,130,0,0,50,75,35,50,75,50,"undead","monster",2,1],"act2hireTraitorBoss":["Waheed The Traitor",4100,4100,125,0,89,50,75,75,75,75,50,"","mapboss",2,0],"zombieCaldeum":["Zombie",163,188,84,0,0,0,50,25,75,45,0,"undead","monster",2,1],"pantherwoman1Caldeum":["Huntress",143,165,113,0,0,20,75,35,65,50,25,"","monster",2,1],"flyingscimitarCaldeum":["Flying Scimitar",157,177,158,0,0,25,50,120,0,75,25,"","monster",1,3],"slinger1Caldeum":["Slinger",139,157,100,0,0,0,75,45,65,25,25,"","monster",2,1],"swarm4Caldeum":["Hell Swarm",114,137,126,0,0,115,25,70,25,80,0,"","monster",2,2],"cantor3Caldeum":["Heirophant",129,151,80,0,0,15,25,33,75,25,105,"","monster",2,1],"westmarchMapBoss":["Urzael Harbringer of Death",4000,4000,70,0,89,20,50,50,50,50,20,"","mapboss",3,3],"minion4Westmarch":["Fire Boar",130,147,100,0,0,25,65,70,25,65,0,"","monster",3,3],"goatmanBastionWestmarch":["Moon Clan",126,158,60,0,0,50,50,45,85,25,25,"demon","monster",2,1],"zombie1Westmarch":["Zombie",140,172,80,0,0,50,50,65,50,75,50,"undead","monster",2,1],"slinger1Westmarch":["Slinger",102,123,95,0,0,10,25,25,75,25,0,"","monster",2,1],"siegebeast1Westmarch":["Siege Beast",243,284,90,0,0,50,25,75,25,40,20,"","monster",3,3],"overseer1Westmarch":["Overseer",165,193,90,0,0,20,120,20,40,40,25,"demon","monster",3,3],"succubus1Westmarch":["Succubus",98,133,115,0,0,0,50,50,50,75,105,"demon","monster",2,1],"TombBoss":["Toadflax the Tainted",5250,5250,125,0,90,20,50,50,50,50,20,"","mapboss",3,0],"scarabTomb":["Scarab",130,163,145,0,0,115,25,75,50,25,25,"","monster",3,1],"painworm1Tomb":["Pain Worm",122,159,85,0,0,0,50,50,75,120,50,"demon","monster",2,2],"quillrat4Tomb":["Razor Spine",104,137,80,0,0,25,75,35,50,25,0,"","monster",2,2],"skmage_ltng5Tomb":["Returned Mage",104,145,90,0,0,25,25,75,45,75,50,"undead","monster",2,1],"baboon1Tomb":["Dune Beast",130,173,110,0,0,0,35,50,75,50,25,"","monster",3,1],"batdemon5Tomb":["Dark Familiar",130,163,110,0,0,15,75,50,25,25,25,"","monster",2,1],"arach1Tomb":["Arach",163,202,135,0,0,50,75,0,50,50,25,"","monster",3,1],"PoisonedWellBoss":["Rotting Horror",7000,7000,90,0,80,20,50,50,50,50,20,"undead","mapboss",2,0],"zombie1PoisonedWell":["Zombie",500,750,80,0,0,20,50,50,50,50,20,"undead","monster",2,1],"goatman1PoisonedWell":["Moon Clan",107,140,60,0,0,60,50,50,75,40,30,"demon","monster",2,1],"fallen3PoisonedWell":["Devilkin",105,130,70,0,0,25,75,50,70,40,30,"demon","monster",2,2],"crownest1PoisonedWell":["Foul Crow Nest",300,350,30,0,0,10,55,65,35,40,0,"","monster",3,3],"foulcrowNoRewardPoisonedWell":["Foul Crow",161,173,120,0,0,10,75,50,30,75,35,"","monster",2,1],"foulcrow1PoisonedWell":["Foul Crow",161,173,120,0,0,10,75,50,30,75,35,"","monster",2,1],"baboon1PoisonedWell":["Dune Beast",96,144,110,0,0,40,40,25,75,65,25,"","monster",3,1],"fallenshaman3PoisonedWell":["Devilkin Shaman",120,156,75,0,0,25,75,50,30,40,50,"demon","monster",2,2],"frogdemon3PoisonedWell":["Bog Creature",180,220,95,0,0,40,50,75,60,70,55,"","monster",2,3],"quillrat4PoisonedWell":["Razor Spine",75,125,80,0,0,50,40,50,75,55,25,"","monster",2,2],"DarkTempleBoss":["Son of Rakkis",8500,8500,70,0,84,20,50,50,50,50,20,"undead","mapboss",2,0],"zealot1DarkTemple":["Zakarumite",156,195,80,0,0,10,60,50,65,65,20,"","monster",2,1],"batdemon1DarkTemple":["Desert Wing",91,143,110,0,0,15,35,20,30,55,45,"","monster",2,1],"siegebeast2DarkTemple":["Crush Beast",336,402,90,0,0,50,75,50,75,35,20,"","monster",3,3],"imp2DarkTemple":["Demon Rascal",117,143,110,0,0,0,70,45,65,45,45,"demon","monster",2,2],"fingermage2DarkTemple":["Strangler",104,143,120,0,0,50,15,75,30,55,20,"undead","monster",3,3],"councilmember1DarkTemple":["Council Member",260,454,110,0,0,50,75,50,65,65,20,"demon","monster",2,1],"doomknight3DarkTemple":["Oblivion Knight",156,195,115,0,0,35,45,75,75,75,45,"undead","monster",2,1],"TortureHallsBoss":["Gimli the Summoned One",6350,6350,140,0,89,20,50,50,50,50,20,"","mapboss",3,3],"sandleaper3TortureHalls":["Tomb Creeper",80,140,130,0,0,30,50,25,20,45,20,"","monster",2,1],"zealot1TortureHalls":["Zakarumite",120,150,80,0,0,10,65,120,45,20,20,"","monster",2,1],"sk_archer2TortureHalls":["Returned Archer",70,100,100,0,0,30,50,25,120,75,30,"undead","monster",2,1],"blunderbore1TortureHalls":["Blunderbore",180,220,80,0,0,20,50,50,50,25,10,"demon","monster",3,3],"vampire3TortureHalls":["Dark Lord",150,200,100,0,0,35,75,45,75,50,30,"undead","monster",2,1],"councilmember3TortureHalls":["Council Member",200,350,110,0,0,20,35,75,33,85,25,"demon","monster",2,1],"regurgitator1TortureHalls":["Corpulent",240,320,95,0,0,50,25,50,45,50,35,"demon","monster",3,3],"DescentBoss":["Tainted Child of Bul-Kathos",8000,8000,65,0,84,20,50,50,50,50,20,"demon","mapboss",2,3],"skeleton4Descent":["Burning Dead",127,182,100,0,0,30,65,55,15,75,40,"undead","monster",2,1],"minion5Descent":["Hell Spawn",182,226,100,0,0,30,75,60,55,55,20,"demon","monster",3,3],"vilemother3Descent":["Grotesque",361,451,80,0,0,60,35,45,75,25,30,"demon","monster",3,3],"megademon1Descent":["Balrog",349,421,115,0,0,45,75,75,65,45,30,"demon","monster",3,1],"skmage_pois3Descent":["Burning Dead Mage",129,144,90,0,0,30,45,45,55,75,55,"undead","monster",2,1],"skmage_cold3Descent":["Death Mage",129,144,90,0,0,30,45,45,55,75,55,"undead","monster",2,1],"skmage_fire3Descent":["Burning Dead Mage",129,144,90,0,0,30,45,45,55,75,55,"undead","monster",2,1],"skmage_ltng3Descent":["Burning Dead Mage",129,144,90,0,0,30,45,45,55,75,55,"undead","monster",2,1],"cantor1Descent":["Sexton",163,235,75,0,0,10,75,55,75,45,30,"","monster",2,1],"succubus3Descent":["Stygian Harlot",108,163,115,0,0,10,45,75,75,55,30,"demon","monster",2,1],"AshenBoss":["Borq the Consumed",5800,5800,120,0,91,20,50,50,50,50,20,"undead","mapboss",3,3],"baboon4Ash":["Doom Ape",182,273,110,0,0,0,50,75,50,25,25,"","monster",3,1],"thornhulk3Ash":["Thrasher",352,433,140,0,0,25,0,40,25,75,0,"","monster",3,3],"pantherwoman6Ash":["Saber Cat",122,202,105,0,0,50,50,50,65,50,25,"","monster",2,1],"foulcrow3Ash":["Black Raptor",134,155,120,0,0,0,65,50,45,65,45,"","monster",2,1],"fetish3Ash":["Flayer",111,162,125,0,0,45,75,33,120,50,15,"demon","monster",2,2],"slinger2Ash":["Spear Cat",111,164,95,0,0,10,25,75,65,25,15,"","monster",2,1],"deathmauler4Ash":["Death Berserker",234,293,95,0,0,50,120,25,30,50,50,"","monster",3,1],"willowisp8Ash":["Burning Soul",91,172,115,0,0,40,45,50,40,60,25,"undead","monster",2,1],"archerBoss":["Dark Commander Alma",4500,4500,125,0,91,50,75,75,75,75,50,"demon","mapboss",2,0],"reanimatedhorde3Pandemonium":["Prowling Dead",177,194,70,0,0,25,50,50,65,75,15,"undead","monster",2,1],"fetish3Pandemonium":["Flayer",114,133,125,0,0,0,75,50,75,50,25,"demon","monster",2,2],"bighead5Pandemonium":["Damned",136,177,90,0,0,25,25,75,0,25,0,"demon","monster",3,3],"succubuswitch3Pandemonium":["Stygian Fury",170,191,115,0,0,50,25,50,50,25,105,"demon","monster",2,1],"baboon5Pandemonium":["Temple Guard",195,228,110,0,0,25,50,75,25,45,20,"","monster",3,1],"siegebeast3Pandemonium":["Blood Bringer",368,412,90,0,0,50,75,20,50,50,0,"","monster",3,3],"vampire3Pandemonium":["Dark Lord",140,177,100,0,0,0,50,25,120,80,50,"undead","monster",2,1],"ArcaneBoss":["Deathmaiden Madinsane",5670,5670,115,0,89,20,50,50,50,50,20,"demon","mapboss",2,0],"flyingscimitarArcane":["Flying Scimitar",142,213,150,0,0,25,50,120,75,75,50,"","monster",1,3],"zealotArcane":["Zakarumite",163,227,80,0,0,10,25,25,35,20,0,"","monster",2,1],"painwormArcane":["Menace Worm",128,185,85,0,0,0,75,75,50,50,25,"demon","monster",2,2],"cantorArcane":["Cantor",142,213,75,0,0,10,45,50,50,45,20,"","monster",2,1],"doomknightArcane":["Oblivion Knight",163,227,115,0,0,33,75,60,25,75,25,"undead","monster",2,1],"doomknight1Arcane":["Doom Knight",162,203,115,0,0,33,75,40,25,65,25,"undead","monster",2,1],"snowyetiArcane":["Frozen Abyss",227,305,85,0,0,115,35,25,75,25,0,"","monster",3,3],"frozenhorrorArcane":["Frozen Scorch",255,327,100,0,0,25,15,40,75,35,25,"","monster",3,3],"wraithArcane":["Ghost",149,192,130,0,0,50,55,65,50,50,50,"undead","monster",2,1],"ThroneBoss":["Indio The Insane",6000,6000,100,0,91,20,50,50,50,50,20,"undead","mapboss",2,0],"corruptrogueThrone":["Flesh Hunter",176,216,95,0,0,25,65,65,75,40,20,"demon","monster",2,1],"cr_archerThrone":["Flesh Archer",124,164,90,0,0,15,40,45,50,25,15,"demon","monster",2,1],"cr_lancerThrone":["Flesh Lancer",188,228,95,0,0,15,40,45,50,40,15,"demon","monster",2,1],"impThrone":["Demon Rascal",148,188,110,0,0,0,50,55,25,50,50,"demon","monster",2,2],"overseerThrone":["Hell Whip",236,276,90,0,0,40,50,75,50,25,25,"demon","monster",3,3],"minion5throne":["Hell Spawn",96,128,100,0,0,35,50,50,45,75,25,"demon","monster",3,3],"megademonThrone":["Balrog",248,288,115,0,0,20,75,25,45,120,20,"demon","monster",3,1],"frogdemonThrone":["Swamp Dweller",208,248,95,0,0,15,75,25,25,120,0,"","monster",2,3],"fingermageThrone":["Doom Caster",184,224,120,0,0,115,25,65,75,75,25,"undead","monster",3,3],"CanyonBoss":["Shattered Soul",4800,4800,100,0,91,50,75,75,75,75,50,"","mapboss",3,3],"snowyeti4Frozen":["Frozen Abyss",205,254,85,0,0,0,0,25,80,50,25,"","monster",3,3],"sandleaper5Frozen":["Cliff Lurker",148,213,130,0,0,25,120,75,40,25,15,"","monster",2,1],"doomknight1Frozen":["Doom Knight",213,246,115,0,0,50,80,65,20,50,25,"undead","monster",2,1],"doomknight3Frozen":["Oblivion Knight",201,226,115,0,0,0,60,75,75,75,25,"undead","monster",2,1],"clawviper5Frozen":["Serpent Magus",193,217,125,0,0,115,45,50,35,60,55,"","monster",3,1],"overseer3Frozen":["Overlord",246,279,90,0,0,0,33,20,60,25,0,"demon","monster",3,3],"fetish4Frozen":["Soul Killer",127,176,125,0,0,0,55,50,45,50,25,"demon","monster",2,2],"fetishblow4Frozen":["Soul Killer",111,160,110,0,0,50,45,40,45,75,25,"demon","monster",2,2],"lernaeanhydra2":["Ancient Cistern Hydra",5500,5500,100,0,89,20,50,50,50,50,20,"","mapboss",3,3],"lernaeanhydra1":["Ancient Cistern Hydra",5000,5000,100,0,89,20,50,50,50,50,20,"","boss",3,3],"blunderbore2Cistern":["Gorebelly",314,388,80,0,0,0,30,50,60,45,25,"demon","monster",3,3],"clawviper3Cistern":["Salamander",138,202,125,0,0,25,55,45,75,65,0,"","monster",3,1],"corruptrogue2Cistern":["Vile Hunter",110,244,95,0,0,20,50,33,0,25,20,"demon","monster",2,1],"mummy1Cistern":["Dried Corpse",184,257,95,0,0,50,25,50,65,120,35,"undead","monster",2,1],"skmage_ltng1Cistern":["Returned Mage",101,160,90,0,0,35,40,75,50,75,25,"undead","monster",2,1],"frogdemon2Cistern":["Bog Creature",210,265,95,0,0,15,75,45,55,50,35,"","monster",2,3],"cr_archer2Cistern":["Vile Archer",101,174,90,0,0,15,75,25,25,25,0,"demon","monster",2,1],"fingermage2Cistern":["Strangler",155,210,120,0,0,60,50,75,75,45,105,"undead","monster",3,3],"SewerBoss":["The Mad Philosopher",3800,3800,110,0,89,20,50,50,50,33,20,"demon","mapboss",2,0],"fetish2Sewer":["Fetish",125,144,125,0,0,25,120,45,20,80,15,"demon","monster",2,2],"minionSewer":["Enslaved",117,181,100,0,0,25,50,35,35,20,35,"","monster",3,3],"vilechildSewer":["Grotesque Wyrm",136,151,70,0,0,25,65,75,65,50,50,"demon","monster",2,2],"fetishblowSewer":["Flayer",102,140,110,0,0,15,0,75,50,45,25,"demon","monster",2,2],"vampireSewer":["Ghoul Lord",170,197,100,0,0,30,75,25,80,50,25,"undead","monster",2,1],"sandmaggotSewer":["Sand Maggot",155,189,115,0,0,66,33,25,75,120,0,"","monster",3,3],"sandraiderSewer":["Marauder",170,212,110,0,0,25,50,75,50,45,15,"","monster",3,1],"mosquitoSewer":["Blood Wing",121,155,95,0,0,10,50,45,25,30,25,"","monster",2,1],"SiegeBoss":["Armorsmith of Equality",6250,6250,100,0,89,20,50,50,50,0,20,"demon","mapboss",2,3],"zombieSiege":["Zombie",244,297,80,0,0,50,15,20,50,75,30,"undead","monster",2,1],"goatmanSiege":["Night Clan",227,279,60,0,0,50,50,65,25,25,0,"demon","monster",2,1],"quillratSiege":["Spike Fiend",187,237,80,0,0,50,50,50,75,40,20,"","monster",2,2],"bigheadSiege":["Afflicted",210,261,90,0,0,25,25,120,30,25,35,"demon","monster",3,3],"reanimatedSiege":["Unholy Corpse",234,279,70,0,0,15,75,33,50,65,30,"undead","monster",2,1],"thornhulkSiege":["Bramble Hulk",284,344,140,0,0,25,75,50,75,45,0,"","monster",3,3],"vultureSiege":["Carrion Bird",197,234,85,0,0,0,35,75,50,120,25,"","monster",2,1],"mosquitoSiege":["Blood Wing",220,274,95,0,0,0,75,33,45,50,105,"","monster",2,1],"SkovosBoss":["Incarnation of Akarat",6850,6850,75,0,90,20,50,50,50,50,20,"undead","mapboss",2,0],"zealot2SkovosBoss":["Faithful",925,1075,80,0,0,20,50,50,50,50,20,"","monster",2,1],"corruptrogue2Skovos":["Vile Hunter",238,308,95,0,0,30,30,45,40,45,20,"demon","monster",2,1],"cr_archer2Skovos":["Vile Archer",214,273,90,0,0,20,45,55,120,35,40,"demon","monster",2,1],"cr_lancer2Skovos":["Vile Lancer",285,343,95,0,0,25,65,40,50,45,15,"demon","monster",2,1],"deathmauler3Skovos":["Death Slasher",248,365,95,0,0,45,75,50,65,65,35,"","monster",3,1],"bighead6Skovos":["Afflicted",135,190,90,0,0,25,50,55,40,15,0,"demon","monster",3,3],"mummy1Skovos":["Dried Corpse",138,193,95,0,0,55,75,30,45,120,40,"undead","monster",2,1],"thornhulk2Skovos":["Bramble Hulk",261,316,140,0,0,0,15,75,35,65,25,"","monster",3,3],"KyovoshadBoss":["The Tainted Hive",8000,8000,30,0,91,20,50,50,50,50,20,"","boss",3,3],"KyovoshadBossMinion":["Tainted Spawn",400,800,135,0,0,20,50,50,50,50,20,"undead","monster",2,2],"wraith4Kyovoshad":["Apparition",190,236,130,0,0,25,30,55,75,75,105,"undead","monster",2,1],"reanimatedhorde5Kyovoshad":["Defiled Warrior",201,247,70,0,0,50,45,40,50,75,50,"undead","monster",2,1],"zealot1Kyovoshad":["Zakarumite",220,275,80,0,0,10,120,65,50,20,0,"","monster",2,1],"bloodlord2Kyovoshad":["Night Lord",276,386,130,0,0,0,35,75,45,45,33,"","monster",3,3],"vilemother3Kyovoshad":["Grotesque",339,430,80,0,0,66,75,55,75,55,20,"demon","monster",3,3],"vilechild3Kyovoshad":["Grotesque Wyrm",146,183,70,0,0,25,60,55,75,25,25,"demon","monster",2,2],"deathmauler4Kyovoshad":["Death Berserker",210,265,95,0,0,25,50,25,25,75,0,"","monster",3,1],"skmage_ltng1Kyovoshad":["Returned Mage",174,220,90,0,0,35,70,120,45,75,25,"undead","monster",2,1],"MarketBoss":["Overlord Aerlynn",6800,6800,80,0,91,50,75,75,75,75,50,"demon","mapboss",3,3],"fallenMarketBoss":["Devilkin Slave",1350,1350,70,0,91,50,75,75,75,75,50,"demon","boss",2,2],"sandraider3Market":["Invader",248,331,110,0,0,0,50,65,20,30,0,"","monster",3,1],"flyingscimitarMarket":["Flying Scimitar",221,276,150,0,0,25,120,50,30,75,35,"","monster",1,3],"corruptrogue2Market":["Vile Hunter",110,184,95,0,0,20,45,33,75,20,20,"demon","monster",2,1],"mosquito2Market":["Feeder",147,221,95,0,0,0,15,75,45,75,10,"","monster",2,1],"firetowerMarket":["Fire Tower",386,460,5,0,0,40,75,50,45,75,50,"","monster",3,0],"vampire1Market":["Ghoul Lord",239,331,100,0,0,115,75,35,60,50,40,"undead","monster",2,1],"cr_archer2Market":["Vile Archer",138,212,90,0,0,15,35,75,75,25,15,"demon","monster",2,1],"unraveler3Market":["Unraveler",248,322,120,0,0,33,35,20,50,50,40,"undead","monster",2,1],"baalminionboss":["Belial Lord of Lies",6500,6500,135,0,91,20,50,50,50,50,20,"demon","mapboss",3,3],"griswoldmap":["Avunaos the Rotten",2800,3000,80,0,89,20,50,50,50,50,20,"undead","boss",2,0],"griswoldgolem":["Blood Golem",1800,2000,80,0,89,20,50,50,50,50,20,"undead","boss",2,0],"doomknightmap":["Doom Knight",201,235,115,0,0,33,75,20,25,50,0,"undead","monster",2,1],"vilemothermap":["Flesh Spawner",197,288,80,0,0,66,45,25,65,20,105,"demon","monster",3,3],"oblivionknightmap":["Oblivion Knight",207,227,115,0,0,33,50,60,75,75,25,"undead","monster",2,1],"deathmaulermap":["Death Mauler",197,227,95,0,0,33,50,120,50,20,0,"","monster",3,1],"sk_archermap":["Skeleton Archer",159,193,100,0,0,40,33,40,33,120,50,"undead","monster",2,1],"regurgitatormap":["Corpulent",332,365,95,0,0,25,25,45,50,75,20,"demon","monster",3,3],"councilmemberBlood":["Council Member",171,192,110,0,0,15,75,80,50,40,35,"demon","monster",2,1],"DemonRoadBoss":["Thonos the Many-Limbed",7000,7000,95,0,90,20,50,50,50,50,20,"","mapboss",3,0],"painworm1DemonRoadBoss":["Pain Worm",550,750,85,0,0,20,50,50,50,50,20,"demon","monster",2,2],"wraith3DemonRoad":["Specter",170,226,130,0,0,20,35,45,60,75,30,"undead","monster",2,1],"goatman3DemonRoad":["Night Clan",223,290,60,0,0,25,50,120,75,25,40,"demon","monster",2,1],"skmage_fire1DemonRoad":["Returned Mage",160,216,90,0,0,30,120,25,40,75,15,"undead","monster",2,1],"succubus4DemonRoad":["Hell Temptress",134,201,115,0,0,0,75,50,50,35,25,"demon","monster",2,1],"blunderbore2DemonRoad":["Gorebelly",352,441,80,0,0,25,50,65,75,20,25,"demon","monster",3,3],"clawviper1DemonRoad":["Tomb Viper",167,246,125,0,0,15,45,35,50,50,20,"","monster",3,1],"unraveler1DemonRoad":["Hollow One",336,425,120,0,0,115,40,65,20,50,20,"undead","monster",2,1],"skeleton2DemonRoad":["Returned",186,242,100,0,0,20,20,30,20,75,25,"undead","monster",2,1],"leoricMapBoss":["King Leoric",6750,6750,140,0,89,20,50,50,50,50,20,"undead","mapboss",2,3],"skeleton3Crypt":["Bone Warrior",197,291,100,0,0,25,30,35,65,65,25,"undead","monster",2,1],"scarab3Crypt":["Scarab",223,299,145,0,0,20,40,80,50,25,0,"","monster",3,1],"batdemon3Crypt":["Gloombat",189,249,110,0,0,50,120,50,25,50,25,"","monster",2,1],"sk_archer3Crypt":["Bone Archer",189,240,100,0,0,35,30,20,45,75,45,"undead","monster",2,1],"bighead1Crypt":["Afflicted",197,291,90,0,0,0,55,75,65,40,30,"demon","monster",3,3],"baboon1Crypt":["Dune Beast",258,336,110,0,0,25,60,45,120,25,0,"","monster",3,1],"clawviper2Crypt":["Claw Viper",206,275,125,0,0,40,45,25,50,40,45,"","monster",3,1],"flyingscimitarCrypt":["Flying Scimitar",258,310,150,0,0,25,50,75,20,75,20,"","monster",1,3],"BastionBoss":["Johnathan The Damned",6000,6000,90,0,90,20,50,50,50,50,20,"undead","mapboss",2,0],"fallenBastion":["Devilkin",133,200,70,0,0,15,50,75,40,50,0,"demon","monster",2,2],"goatmanBastion":["Moon Clan",175,249,60,0,0,25,50,50,120,45,0,"demon","monster",2,1],"sandmaggotBastion":["Giant Lamprey",216,274,115,0,0,0,33,25,35,85,25,"","monster",3,3],"fallenshamanBastion":["Devilkin Shaman",166,233,75,0,0,15,75,75,25,75,50,"demon","monster",2,2],"siegebeastBastion":["Demon Steed",498,598,90,0,0,50,25,33,50,15,105,"","monster",3,3],"imp5bastion":["Demon Sprite",45,65,110,0,0,0,80,25,33,0,25,"demon","monster",2,2],"sandraiderBastion":["Sand Raider",249,308,110,0,0,25,50,50,50,33,25,"","monster",3,1],"batdemonBastion":["Desert Wing",150,216,110,0,0,115,75,25,75,25,25,"","monster",2,1],"succubusBastion":["Hell Temptress",133,200,115,0,0,0,50,65,50,75,0,"demon","monster",2,1],"CowBoss":["The Cow Queen",7000,7000,130,0,91,20,50,50,50,50,20,"","mapboss",3,3],"hellbovineMap":["Hell Bovine",220,270,80,0,0,50,65,65,65,65,33,"","monster",2,1],"willowispboss":["Canight The Corrupted",16000,16000,115,0,92,50,90,90,90,90,50,"undead","mapboss",2,0],"willowispminion":["Madness",8000,8000,115,0,92,50,90,90,90,90,50,"undead","boss",2,0],"willowispminion2":["Hysteria",100,100,115,0,87,20,50,50,50,50,20,"undead","boss",2,0],"fingermageboss":["The Synthetic One",12000,12000,120,0,92,50,90,90,90,90,50,"undead","mapboss",3,3],"reanimatedMaus":["Unholy Corpse",395,455,70,0,0,50,145,60,145,0,25,"undead","monster",2,1],"pantherwomanMaus":["Huntress",385,435,105,0,0,120,20,145,145,75,0,"","monster",2,1],"bloodlordMaus":["Death Lord",525,575,130,0,0,25,145,50,0,75,33,"","monster",3,3],"succubusMaus":["Succubus",400,455,115,0,0,0,50,145,0,145,0,"demon","monster",2,1],"bigheadMaus":["Misshapen",460,510,90,0,0,120,145,0,50,25,25,"demon","monster",3,3],"siegebeast3Maus":["Blood Bringer",500,560,90,0,0,120,50,50,50,50,50,"","monster",3,3],"vampire2Maus":["Night Lord",300,350,100,0,0,35,33,25,145,145,0,"undead","monster",2,1],"putriddefiler1dungeon":["Putrid Defiler",460,490,65,0,0,80,50,145,50,100,0,"demon","monster",2,3],"bonefetish7dungeon":["Undead Soul Killer",410,435,135,0,0,33,75,0,33,75,50,"undead","monster",2,2],"batdemon3dungeon":["Shrieking Terror",380,420,110,0,0,15,145,145,50,0,25,"","monster",2,1],"blunderbore1dungeon":["Blunderbore",425,475,80,0,0,55,25,50,145,0,145,"demon","monster",3,3],"slingerMaus":["Spear Cat",400,445,95,0,0,120,20,145,50,145,0,"","monster",2,1],"SharpToothBoss":["Skullsplitter Cyrus",15000,15000,90,0,90,50,90,90,90,90,50,"","mapboss",3,3],"SharpToothMinion":["Anburian Slayer",1000,1000,100,0,0,20,50,50,50,50,20,"","monster",3,3],"KanemithBoss":["Naz the Cursed King",13000,13000,110,0,92,50,90,90,90,90,50,"","mapboss",3,3],"RadamentBoss":["Elmegaard the Unholy",16500,16500,120,0,92,50,90,90,90,90,50,"","mapboss",2,3],"siegebeastMapBoss":["The Stygian Beast",10000,10000,90,0,92,50,90,90,90,90,50,"demon","mapboss",3,3],"WarlordOfBlood":["Warlord of Blood",6400,6400,400,0,91,20,50,50,50,50,20,"","mapboss",3,3],"WarlordMiniBossShaman":["Cory the Imp",6000,6000,95,0,91,50,80,40,40,80,30,"demon","boss",2,2],"WarlordMiniBossDefiler":["Onion the Accused",6000,6000,85,0,91,20,40,80,80,40,60,"demon","boss",2,3],"bloodlord1Warlord2":["Moon Lord",221,272,130,0,0,25,65,55,30,0,0,"","monster",3,3],"skeleton5Warlord":["Horror",170,196,100,0,0,30,30,50,60,65,50,"undead","monster",2,1],"vilemother3Warlord":["Grotesque",191,234,80,0,0,55,30,50,25,65,20,"demon","monster",3,3],"suicideminion3Warlord":["Consumed Ice Boar",51,85,85,0,0,25,30,15,50,15,0,"","monster",3,3],"imp5Warlord":["Demon Sprite",149,166,110,0,0,40,70,65,40,50,35,"demon","monster",2,2],"deathmauler1Warlord":["Death Mauler",123,234,95,0,0,30,65,50,65,0,0,"","monster",3,1],"doomknight1Warlord2":["Doom Knight",179,204,115,0,0,30,60,20,20,50,25,"undead","monster",2,1],"regurgitator2Warlord2":["Corpse Spitter",221,289,95,0,0,30,25,55,20,75,0,"demon","monster",3,3],"reanimatedhorde1Warlord2":["Rot Walker",153,183,70,0,0,50,40,30,65,40,20,"undead","monster",2,1],"doomknight3Warlord2":["Oblivion Knight",166,191,115,0,0,35,60,60,55,45,25,"undead","monster",2,1],"DjinnLightBoss":["Djinn of a Thousand Blades",9000,9000,115,0,90,20,50,50,50,50,20,"undead","boss",2,1],"DjinnLightBossMinion":["Ancient Scimitar",1200,2000,0,0,0,20,50,50,50,50,20,"","monster",1,3],"DjinnDarkBoss":["Siren of the Forgotten Vault",9500,9500,115,0,90,20,50,50,50,50,20,"demon","boss",2,1],"corruptrogue1DjinnLight":["Dark Hunter",126,210,95,0,0,20,50,50,75,45,20,"demon","monster",2,1],"cr_lancer1DjinnLight":["Dark Spearwoman",168,242,95,0,0,45,35,75,45,55,33,"demon","monster",2,1],"imp1DjinnLight":["Demon Imp",95,137,110,0,0,0,75,25,25,25,25,"demon","monster",2,2],"sandraider3DjinnLight":["Invader",284,378,110,0,0,25,65,50,50,35,0,"","monster",3,1],"fingermage2DjinnLight":["Strangler",168,231,120,0,0,55,45,75,35,50,0,"undead","monster",3,3],"succubuswitch3DjinnLight":["Stygian Fury",126,189,115,0,0,25,25,60,50,25,25,"demon","monster",2,1],"clawviper7DjinnLight":["Pit Viper",147,200,115,0,0,0,75,20,50,75,0,"","monster",3,1],"scarab1DjinnLight":["Dung Soldier",147,231,145,0,0,50,50,65,35,50,0,"","monster",3,1],"scarab1":["Dung Soldier",70,110,145,0,0,50,0,100,0,0,0,"","monster",3,1],"wraith3DjinnLight":["Specter",137,189,130,0,0,0,25,20,70,75,50,"undead","monster",2,1],"flyingscimitarDjinnLight":["Flying Scimitar",221,332,150,0,0,25,50,75,75,75,50,"","monster",1,3],"bloodlord3DjinnDark":["Blood Lord",341,426,130,0,0,0,65,35,33,45,35,"","monster",3,3],"vampire3DjinnDark":["Dark Lord",214,284,100,0,0,40,35,75,75,50,0,"undead","monster",2,1],"imp2DjinnDark":["Demon Rascal",64,92,110,0,0,0,75,75,30,25,25,"demon","monster",2,2],"arach4DjinnDark":["Flame Spider",214,270,135,0,0,50,75,25,45,75,0,"","monster",3,1],"councilmember3DjinnDark":["Council Member",284,498,110,0,0,50,65,75,30,30,25,"demon","monster",2,1],"corruptrogue5DjinnDark":["Flesh Hunter",85,142,95,0,0,35,45,45,55,55,20,"demon","monster",2,1],"clawviper3DjinnDark":["Salamander",107,157,125,0,0,20,35,65,65,45,0,"","monster",3,1],"cr_archer5DjinnDark":["Flesh Archer",78,135,90,0,0,15,45,45,55,55,20,"demon","monster",2,1],"cr_lancer5DjinnDark":["Flesh Lancer",114,164,95,0,0,35,45,45,55,55,20,"demon","monster",2,1],"ZharTheMad":["Zhar The Mad",6500,6500,85,0,91,20,50,50,50,50,20,"","mapboss",3,3],"ZharMiniBossBaboon":["Infernal Alien",7000,7000,110,0,90,20,50,50,50,50,20,"","mapboss",3,1],"ZharMiniBossCantor":["Efreet Sajber",6000,6000,75,0,90,20,50,50,50,50,20,"","mapboss",2,1],"ZharMiniBossBigHead":["Ztaziz the Fragile",6500,6500,90,0,90,20,50,50,50,50,20,"demon","mapboss",3,3],"pantherwoman1Zhar1":["Huntress",114,150,105,0,0,40,65,25,50,80,0,"","monster",2,1],"swarm4Zhar1":["Hell Swarm",102,120,120,0,0,60,50,80,0,65,25,"","monster",2,2],"cantor4Zhar1":["Heirophant",141,177,75,0,0,0,80,25,75,25,35,"","monster",2,1],"slinger2Zhar1":["Spear Cat",108,135,95,0,0,40,25,50,40,80,0,"","monster",2,1],"blunderbore4Zhar1":["Urdar",198,234,80,0,0,35,30,75,80,0,20,"demon","monster",3,3],"fallenshaman2Zhar3":["Carver Shaman",105,126,75,0,0,15,80,50,55,25,30,"demon","monster",2,2],"fallen2Zhar3":["Carver",87,105,70,0,0,15,85,65,45,25,30,"demon","monster",2,2],"vampire2Zhar3":["Night Lord",138,168,100,0,0,35,40,25,85,65,40,"undead","monster",2,1],"reanimatedhorde2Zhar3":["Reanimated Horde",114,129,70,0,0,50,0,75,60,80,0,"undead","monster",2,1],"siegebeast2Zhar3":["Crush Beast",216,252,90,0,0,50,50,45,20,50,0,"","monster",3,3],"baboon3Zhar2":["Jungle Hunter",129,156,110,0,0,30,25,85,45,95,0,"","monster",3,1],"skeleton2Zhar2":["Returned",117,135,100,0,0,40,85,0,20,50,50,"undead","monster",2,1],"unraveler2Zhar2":["Guardian",177,201,120,0,0,15,0,75,80,50,20,"undead","monster",2,1],"frogdemon2Zhar2":["Bog Creature",141,159,95,0,0,65,65,50,50,65,0,"","monster",2,3],"succubus4Zhar2":["Hell Temptress",111,129,115,0,0,15,75,40,55,0,20,"demon","monster",2,1],"Rakanoth":["Rakanoth",6000,6000,120,0,90,50,50,50,50,50,20,"demon","mapboss",3,3],"Iskatu":["Iskatu",7000,7000,85,0,90,30,50,50,50,50,20,"","mapboss",2,3],"IskatuVermin":["Shadow Vermin",500,500,130,0,0,30,50,50,50,50,20,"","monster",2,1],"thornhulk4FallenGardens":["Thrasher",440,541,140,0,0,25,0,40,50,80,0,"","monster",3,3],"mosquito4FallenGardens":["Blood Wing",100,150,95,0,0,0,50,33,0,45,25,"","monster",2,1],"councilmemberFallenGardens":["Bog Creature",161,210,110,0,0,50,45,50,45,35,0,"demon","monster",2,1],"imp5FallenGardens":["Demon Sprite",175,195,110,0,0,65,70,65,40,0,35,"demon","monster",2,2],"reanimatedhorde3FallenGardens":["Prowling Dead",240,264,70,0,0,0,45,50,65,60,0,"undead","monster",2,1],"fingermage2FallenGardens":["Strangler",140,180,120,0,0,60,60,25,75,45,80,"undead","monster",3,3],"CityofUrehBoss":["Gregus Mazi",15000,15000,200,0,91,20,50,50,50,50,20,"","mapboss",2,0],"CityofUrehMiniBoss":["Zayl the Merciful",8500,8500,175,0,91,20,50,50,50,50,20,"","mapboss",3,3],"thornhulk2Ureh":["Bramble Hulk",259,303,140,0,0,0,0,65,35,65,20,"","monster",3,3],"skeleton2Ureh":["Returned",195,225,100,0,0,40,85,0,20,50,50,"undead","monster",2,1],"unraveler2Ureh":["Guardian",295,335,120,0,0,15,50,75,80,50,20,"undead","monster",2,1],"frogdemon2Ureh":["Bog Creature",235,265,95,0,0,65,65,50,50,65,0,"","monster",2,3],"succubus4Ureh":["Hell Temptress",185,215,115,0,0,15,75,40,55,0,20,"demon","monster",2,1],"zealot5Ureh":["Disciple of Rathma",240,270,80,0,0,15,20,100,50,0,0,"","monster",2,1],"cantor2Ureh":["Priest of Rathma",210,250,75,0,0,10,25,50,75,20,0,"","monster",2,1],"sk_archer2Ureh":["Returned Archer",190,210,100,0,0,40,33,0,33,75,0,"undead","monster",2,1],"ImperialPalaceBoss":["Imperial Assassin",8250,8250,110,0,91,20,50,50,50,50,20,"demon","mapboss",2,0],"clawviper3ImperialPalaceBoss":["Writhing Deceiver",1500,1500,125,0,0,20,50,50,50,50,20,"","monster",3,1],"ImperialPalaceBossMinion":["Imperial Advisor",7500,7500,110,0,91,20,50,50,50,50,20,"demon","mapboss",2,0],"ImperialPalaceMiniBoss":["Kamyr the Usurper",7500,7500,75,0,91,20,50,50,50,50,20,"demon","mapboss",2,0],"fallen5ImperialMiniBoss":["Warped One",450,450,70,0,0,25,75,75,75,75,75,"demon","monster",2,2],"baalminion3Imperial":["Minion of Destruction",520,600,135,0,0,10,60,60,60,60,10,"demon","monster",3,3],"fetish3Imperial":["Flayer",116,160,125,0,0,20,35,65,45,50,0,"demon","monster",2,2],"fetishblow3Imperial":["Flayer",100,150,110,0,0,20,40,20,65,50,0,"demon","monster",2,2],"succubus1Imperial":["Succubus",145,200,115,0,0,0,65,50,50,25,20,"demon","monster",2,1],"mummy2Imperial":["Decayed",200,275,95,0,0,0,50,35,25,65,20,"undead","monster",2,1],"fingermage2Imperial":["Strangler",240,320,120,0,0,10,45,45,45,45,10,"undead","monster",3,3],"voidBeastUniqueMap":["Nightmare",210,252,110,0,0,30,30,30,30,30,30,"demon","monster",2,1],"voidWatcherUniqueMap":["Dream Eater",420,444,100,0,0,30,30,30,30,30,30,"","monster",3,3],"voidWatcherLimbUniqueMap":["Dream Eater",384,408,100,0,0,30,30,30,30,30,30,"","monster",3,3],"voidFrogUniqueMap":["Abhorrent",180,180,95,0,0,30,30,30,30,30,30,"","monster",2,3],"voidKnightCorridorUniqueMap":["Void Knight",180,210,115,0,0,50,75,75,50,20,50,"undead","monster",2,1],"voidlingUniqueMap":["Voidling",108,216,110,0,0,30,30,30,30,30,30,"","monster",2,1],"NaKrulBoss":["Na-Krul",7000,7000,150,0,91,20,50,50,50,50,20,"demon","boss",3,0],"fallen1Nakrul":["Devil Kin Brute",115,145,70,0,0,15,65,50,40,75,0,"demon","monster",2,2],"goatman4Nakrul":["Satyr Lord",130,160,60,0,0,50,40,25,65,25,0,"demon","monster",2,1],"batdemon4Nakrul":["Hellbat",140,180,110,0,0,10,55,20,10,60,25,"","monster",2,1],"megademon1Nakrul":["Reaper",210,250,115,0,0,25,75,75,50,35,20,"demon","monster",3,1],"brute3Nakrul":["Crypt Demon",145,210,85,0,0,50,25,75,75,50,35,"","monster",3,3],"regurgitator3Nakrul":["Flesh Thing",240,320,95,0,0,35,30,50,25,75,20,"demon","monster",3,3],"vampire2Nakrul":["Lich",150,200,100,0,0,35,40,25,85,50,50,"undead","monster",2,1],"succubus3Nakrul":["Skullwing",100,130,115,0,0,0,66,80,50,30,20,"demon","monster",2,1]},"maps":[["t34","Ancestral Trial",1,87,[["IceBoss",1],["skmage_coldIce",3],["mummyIce",0],["skeletonIce",0],["arach5Ice",0],["megademon2Ice",0],["wraith3Ice",0]]],["t36","Fall of Caldeum",1,87,[["act2hireTraitorBoss",1],["zombieCaldeum",0],["pantherwoman1Caldeum",0],["flyingscimitarCaldeum",0],["slinger1Caldeum",0],["swarm4Caldeum",0],["cantor3Caldeum",0]]],["t33","Lost Temple",1,87,[["spiderboss",1],["minionSpider",0],["mosquito4Spider",0],["batdemon6Spider",0],["unraveler3Spider",0],["fetishblowSpider",0],["blunderbore2Spider",0],["arach3Spider",0]]],["t21","Phlegethon",1,87,[["megademonboss",1],["minionmap",0],["pantherwomanmap",0],["fallenmap",0],["slingermap",0],["siegebeastmap",0],["imp1phlegethon",0],["bloodlordmap",0],["councilmembermap",0],["reanimatedhordemap",0],["fallenshamanmap",0],["fetishmap",0]]],["t18","Poisoned Well",1,87,[["PoisonedWellBoss",1],["zombie1PoisonedWell",3],["goatman1PoisonedWell",0],["fallen3PoisonedWell",0],["crownest1PoisonedWell",0],["foulcrowNoRewardPoisonedWell",0],["foulcrow1PoisonedWell",0],["baboon1PoisonedWell",0],["fallenshaman3PoisonedWell",0],["frogdemon3PoisonedWell",0],["quillrat4PoisonedWell",0]]],["t11","Ruins of Viz-Jun",1,87,[["unravelerboss",1],["unravelerbossskeleton",3],["unravelerbossarcher",3],["cr_lancermap",0],["goatmanmap",0],["cr_archermap",0],["bigheadmap",0],["cantormap",0],["zealotmap",0],["unravelermap",0],["skeleton2ruins",0],["arachmap",0],["thornhulkmap",0],["sandleapermap",0],["mosquitomap",0],["fetishshamanmap",0],["fetish2ruins",0],["fetishblow2ruins",0]]],["t14","Sanatorium",1,87,[["doomknight3LibraryBoss",1],["corruptrogue2Library",0],["cr_archer2Library",0],["cr_lancer2Library",0],["deathmauler3Library",0],["willowisp1Library",0],["vampire1Library",0],["bloodlord5Library",0]]],["t26","Shadows of Westmarch",1,87,[["westmarchMapBoss",1],["minion4Westmarch",0],["goatmanBastionWestmarch",0],["zombie1Westmarch",0],["slinger1Westmarch",0],["siegebeast1Westmarch",0],["overseer1Westmarch",0],["succubus1Westmarch",0]]],["t24","Tomb of Zoltun Kulle",1,87,[["TombBoss",1],["scarabTomb",0],["painworm1Tomb",0],["quillrat4Tomb",0],["skmage_ltng5Tomb",0],["baboon1Tomb",0],["batdemon5Tomb",0],["arach1Tomb",0]]],["t22","Torajan Jungle",1,87,[["torajanBoss",1],["torajanBossPoisonEgg",3],["foulcrowJungle",0],["sandleaperJungle",0],["quillratJungle",0],["deathmaulerJungle",0],["bruteJungle",0],["baboonJungle",0],["scarabJungle",0],["councilmemberJungle",0]]],["t3a","Ashen Plains",2,88,[["AshenBoss",1],["baboon4Ash",0],["thornhulk3Ash",0],["pantherwoman6Ash",0],["foulcrow3Ash",0],["fetish3Ash",0],["slinger2Ash",0],["deathmauler4Ash",0],["willowisp8Ash",0]]],["t38","Canyon of Sescheron",2,88,[["CanyonBoss",1],["snowyeti4Frozen",0],["sandleaper5Frozen",0],["doomknight1Frozen",0],["doomknight3Frozen",0],["clawviper5Frozen",0],["overseer3Frozen",0],["fetish4Frozen",0],["fetishblow4Frozen",0]]],["t2a","Descent from Mount Arreat",2,88,[["DescentBoss",1],["skeleton4Descent",0],["minion5Descent",0],["vilemother3Descent",0],["megademon1Descent",0],["skmage_pois3Descent",0],["skmage_cold3Descent",0],["skmage_fire3Descent",0],["skmage_ltng3Descent",0],["cantor1Descent",0],["succubus3Descent",0]]],["t29","Fortress of Aranoch",2,88,[["DarkTempleBoss",1],["zealot1DarkTemple",0],["batdemon1DarkTemple",0],["siegebeast2DarkTemple",0],["imp2DarkTemple",0],["fingermage2DarkTemple",0],["councilmember1DarkTemple",0],["doomknight3DarkTemple",0]]],["t17","Halls of Torture",2,88,[["TortureHallsBoss",1],["sandleaper3TortureHalls",0],["zealot1TortureHalls",0],["sk_archer2TortureHalls",0],["blunderbore1TortureHalls",0],["vampire3TortureHalls",0],["councilmember3TortureHalls",0],["regurgitator1TortureHalls",0]]],["t12","Horazon's Memory",2,88,[["ArcaneBoss",1],["flyingscimitarArcane",0],["zealotArcane",0],["painwormArcane",0],["cantorArcane",0],["doomknightArcane",0],["doomknight1Arcane",0],["snowyetiArcane",0],["frozenhorrorArcane",0],["wraithArcane",0]]],["t37","Pandemonium Citadel",2,88,[["archerBoss",1],["reanimatedhorde3Pandemonium",0],["fetish3Pandemonium",0],["bighead5Pandemonium",0],["succubuswitch3Pandemonium",0],["baboon5Pandemonium",0],["siegebeast3Pandemonium",0],["vampire3Pandemonium",0]]],["t16","Ruined Cistern",2,88,[["lernaeanhydra2",1],["lernaeanhydra1",3],["blunderbore2Cistern",0],["clawviper3Cistern",0],["corruptrogue2Cistern",0],["mummy1Cistern",0],["skmage_ltng1Cistern",0],["frogdemon2Cistern",0],["cr_archer2Cistern",0],["fingermage2Cistern",0]]],["t25","Sewers of Harrogath",2,88,[["SewerBoss",1],["fetish2Sewer",0],["minionSewer",0],["vilechildSewer",0],["fetishblowSewer",0],["vampireSewer",0],["sandmaggotSewer",0],["sandraiderSewer",0],["mosquitoSewer",0]]],["t32","Throne of Insanity",2,88,[["ThroneBoss",1],["corruptrogueThrone",0],["cr_archerThrone",0],["cr_lancerThrone",0],["impThrone",0],["overseerThrone",0],["minion5throne",0],["megademonThrone",0],["frogdemonThrone",0],["fingermageThrone",0]]],["t23","Arreat Battlefield",3,89,[["SiegeBoss",1],["zombieSiege",0],["goatmanSiege",0],["quillratSiege",0],["bigheadSiege",0],["reanimatedSiege",0],["thornhulkSiege",0],["vultureSiege",0],["mosquitoSiege",0]]],["t13","Bastion Keep",3,89,[["BastionBoss",1],["fallenBastion",0],["goatmanBastion",0],["sandmaggotBastion",0],["fallenshamanBastion",0],["siegebeastBastion",0],["imp5bastion",0],["sandraiderBastion",0],["batdemonBastion",0],["succubusBastion",0]]],["t35","Blood Moon",3,89,[["CowBoss",1],["hellbovineMap",0]]],["t27","Demon Road",3,89,[["DemonRoadBoss",1],["painworm1DemonRoadBoss",3],["wraith3DemonRoad",0],["goatman3DemonRoad",0],["skmage_fire1DemonRoad",0],["succubus4DemonRoad",0],["blunderbore2DemonRoad",0],["clawviper1DemonRoad",0],["unraveler1DemonRoad",0],["skeleton2DemonRoad",0]]],["t39","Kehjistan Marketplace",3,89,[["MarketBoss",1],["fallenMarketBoss",3],["sandraider3Market",0],["flyingscimitarMarket",0],["corruptrogue2Market",0],["mosquito2Market",0],["firetowerMarket",0],["vampire1Market",0],["cr_archer2Market",0],["unraveler3Market",0]]],["t3b","Kyovashad",3,89,[["KyovoshadBoss",1],["KyovoshadBossMinion",3],["wraith4Kyovoshad",0],["reanimatedhorde5Kyovoshad",0],["zealot1Kyovoshad",0],["bloodlord2Kyovoshad",0],["vilemother3Kyovoshad",0],["vilechild3Kyovoshad",0],["deathmauler4Kyovoshad",0],["skmage_ltng1Kyovoshad",0]]],["t31","River of Blood",3,89,[["baalminionboss",1],["griswoldmap",2],["griswoldgolem",3],["doomknightmap",0],["vilemothermap",0],["zealotmap",0],["oblivionknightmap",0],["deathmaulermap",0],["sk_archermap",0],["regurgitatormap",0],["councilmemberBlood",0]]],["t15","Royal Crypts",3,89,[["leoricMapBoss",1],["skeleton3Crypt",0],["scarab3Crypt",0],["batdemon3Crypt",0],["sk_archer3Crypt",0],["bighead1Crypt",0],["baboon1Crypt",0],["clawviper2Crypt",0],["flyingscimitarCrypt",0]]],["t28","Skovos Stronghold",3,89,[["SkovosBoss",1],["zealot2SkovosBoss",3],["corruptrogue2Skovos",0],["cr_archer2Skovos",0],["cr_lancer2Skovos",0],["deathmauler3Skovos",0],["bighead6Skovos",0],["mummy1Skovos",0],["thornhulk2Skovos",0]]],["t42","Plains of Torment",4,92,[["willowispboss",1],["willowispminion",3],["willowispminion2",3],["fingermageboss",1],["reanimatedMaus",0],["pantherwomanMaus",0],["bloodlordMaus",0],["succubusMaus",0],["bigheadMaus",0],["siegebeast3Maus",0],["vampire2Maus",0],["putriddefiler1dungeon",0],["bonefetish7dungeon",0],["batdemon3dungeon",0],["blunderbore1dungeon",0],["slingerMaus",0]]],["t43","Sanctuary of Sin",4,92,[["RadamentBoss",1],["siegebeastMapBoss",1],["reanimatedMaus",0],["pantherwomanMaus",0],["bloodlordMaus",0],["succubusMaus",0],["bigheadMaus",0],["siegebeast3Maus",0],["vampire2Maus",0],["putriddefiler1dungeon",0],["bonefetish7dungeon",0],["batdemon3dungeon",0],["blunderbore1dungeon",0],["slingerMaus",0]]],["t44","Steppes of Daken-Shar",4,92,[["SharpToothBoss",1],["SharpToothMinion",3],["KanemithBoss",1],["reanimatedMaus",0],["pantherwomanMaus",0],["bloodlordMaus",0],["succubusMaus",0],["bigheadMaus",0],["siegebeast3Maus",0],["vampire2Maus",0],["putriddefiler1dungeon",0],["bonefetish7dungeon",0],["batdemon3dungeon",0],["blunderbore1dungeon",0],["slingerMaus",0]]],["t56","City of Ureh",5,89,[["CityofUrehBoss",1],["CityofUrehMiniBoss",2],["thornhulk2Ureh",0],["skeleton2Ureh",0],["unraveler2Ureh",0],["frogdemon2Ureh",0],["succubus4Ureh",0],["zealot5Ureh",0],["cantor2Ureh",0],["sk_archer2Ureh",0]]],["t57","Djinn's Domain",5,88,[["DjinnLightBoss",1],["DjinnLightBossMinion",3],["DjinnDarkBoss",1],["corruptrogue1DjinnLight",0],["cr_lancer1DjinnLight",0],["imp1DjinnLight",0],["sandraider3DjinnLight",0],["fingermage2DjinnLight",0],["succubuswitch3DjinnLight",0],["clawviper7DjinnLight",0],["scarab1DjinnLight",0],["scarab1",0],["wraith3DjinnLight",0],["flyingscimitarDjinnLight",0],["bloodlord3DjinnDark",0],["vampire3DjinnDark",0],["imp2DjinnDark",0],["arach4DjinnDark",0],["councilmember3DjinnDark",0],["corruptrogue5DjinnDark",0],["clawviper3DjinnDark",0],["cr_archer5DjinnDark",0],["cr_lancer5DjinnDark",0]]],["t53","Fallen Gardens",5,88,[["Rakanoth",1],["Iskatu",1],["IskatuVermin",3],["thornhulk4FallenGardens",0],["mosquito4FallenGardens",0],["councilmemberFallenGardens",0],["imp5FallenGardens",0],["reanimatedhorde3FallenGardens",0],["fingermage2FallenGardens",0]]],["t54","Imperial Palace",5,89,[["ImperialPalaceBoss",1],["clawviper3ImperialPalaceBoss",3],["ImperialPalaceBossMinion",1],["ImperialPalaceMiniBoss",2],["fallen5ImperialMiniBoss",3],["baalminion3Imperial",0],["fetish3Imperial",0],["fetishblow3Imperial",0],["succubus1Imperial",0],["mummy2Imperial",0],["fingermage2Imperial",0]]],["t58","Na-Krul's Abyss",5,87,[["NaKrulBoss",1],["fallen1Nakrul",0],["goatman4Nakrul",0],["batdemon4Nakrul",0],["megademon1Nakrul",0],["brute3Nakrul",0],["regurgitator3Nakrul",0],["vampire2Nakrul",0],["succubus3Nakrul",0]]],["t55","Outer Void",5,89,[["IceBoss",11],["skmage_coldIce",21],["torajanBoss",11],["torajanBossPoisonEgg",21],["TombBoss",11],["act2hireTraitorBoss",11],["megademonboss",11],["westmarchMapBoss",11],["unravelerboss",11],["unravelerbossskeleton",21],["unravelerbossarcher",21],["spiderboss",11],["PoisonedWellBoss",11],["zombie1PoisonedWell",21],["doomknight3LibraryBoss",11],["lernaeanhydra2",12],["lernaeanhydra1",22],["ArcaneBoss",12],["AshenBoss",12],["archerBoss",12],["SewerBoss",12],["CanyonBoss",12],["ThroneBoss",12],["TortureHallsBoss",12],["DarkTempleBoss",12],["DescentBoss",12],["CowBoss",13],["leoricMapBoss",13],["SiegeBoss",13],["BastionBoss",13],["DemonRoadBoss",13],["painworm1DemonRoadBoss",23],["SkovosBoss",13],["zealot2SkovosBoss",23],["baalminionboss",13],["MarketBoss",13],["fallenMarketBoss",23],["voidBeastUniqueMap",0],["voidWatcherUniqueMap",0],["voidWatcherLimbUniqueMap",0],["voidFrogUniqueMap",0],["voidKnightCorridorUniqueMap",0],["voidlingUniqueMap",0]]],["t52","Warlord of Blood",5,88,[["WarlordOfBlood",1],["WarlordMiniBossShaman",2],["WarlordMiniBossDefiler",2],["bloodlord1Warlord2",3],["skeleton5Warlord",0],["vilemother3Warlord",0],["suicideminion3Warlord",0],["imp5Warlord",0],["deathmauler1Warlord",0],["doomknight1Warlord2",0],["regurgitator2Warlord2",0],["reanimatedhorde1Warlord2",0],["doomknight3Warlord2",0]]],["t51","Zhar's Sanctum",5,87,[["ZharTheMad",1],["ZharMiniBossBaboon",2],["ZharMiniBossCantor",2],["ZharMiniBossBigHead",2],["pantherwoman1Zhar1",0],["swarm4Zhar1",0],["cantor4Zhar1",0],["slinger2Zhar1",0],["blunderbore4Zhar1",0],["fallenshaman2Zhar3",0],["fallen2Zhar3",0],["vampire2Zhar3",0],["reanimatedhorde2Zhar3",0],["siegebeast2Zhar3",0],["baboon3Zhar2",0],["skeleton2Zhar2",0],["unraveler2Zhar2",0],["frogdemon2Zhar2",0],["succubus4Zhar2",0]]]],"lvl":{"80":[5607,1563],"84":[6067,1634],"87":[6412,1686],"88":[6527,1704],"89":[6642,1722],"90":[6757,1739],"91":[6872,1757],"92":[6987,1774]}},"boots":[{"code":"lbt","name":"Boots","tier":"N","lvl":0,"k":[3,8],"sb":100,"db":0},{"code":"vbt","name":"Heavy Boots","tier":"N","lvl":0,"k":[4,12],"sb":100,"db":0},{"code":"mbt","name":"Chain Boots","tier":"N","lvl":0,"k":[6,14],"sb":100,"db":0},{"code":"tbt","name":"Light Plated Boots","tier":"N","lvl":0,"k":[8,18],"sb":100,"db":0},{"code":"hbt","name":"Greaves","tier":"N","lvl":0,"k":[10,20],"sb":100,"db":0},{"code":"xlb","name":"Demonhide Boots","tier":"X","lvl":24,"k":[30,64],"sb":100,"db":0},{"code":"xvb","name":"Sharkskin Boots","tier":"X","lvl":25,"k":[32,72],"sb":100,"db":0},{"code":"xmb","name":"Mesh Boots","tier":"X","lvl":25,"k":[35,78],"sb":100,"db":0},{"code":"xtb","name":"Battle Boots","tier":"X","lvl":25,"k":[42,84],"sb":100,"db":0},{"code":"xhb","name":"War Boots","tier":"X","lvl":25,"k":[45,90],"sb":100,"db":0},{"code":"ulb","name":"Wyrmhide Boots","tier":"E","lvl":45,"k":[75,100],"sb":100,"db":0},{"code":"uvb","name":"Scarabshell Boots","tier":"E","lvl":49,"k":[70,110],"sb":100,"db":0},{"code":"umb","name":"Boneweave Boots","tier":"E","lvl":54,"k":[80,125],"sb":100,"db":0},{"code":"utb","name":"Mirrored Boots","tier":"E","lvl":60,"k":[69,147],"sb":100,"db":0},{"code":"uhb","name":"Myrmidon Greaves","tier":"E","lvl":65,"k":[83,155],"sb":100,"db":0}],"shields":[{"code":"buc","name":"Buckler","tier":"N","lvl":0,"d":[1,3],"sb":100},{"code":"sml","name":"Small Shield","tier":"N","lvl":0,"d":[2,3],"sb":100},{"code":"lrg","name":"Large Shield","tier":"N","lvl":0,"d":[3,6],"sb":100},{"code":"kit","name":"Kite Shield","tier":"N","lvl":0,"d":[4,11],"sb":100},{"code":"tow","name":"Tower Shield","tier":"N","lvl":0,"d":[5,23],"sb":100},{"code":"gts","name":"Gothic Shield","tier":"N","lvl":0,"d":[7,20],"sb":100},{"code":"bsh","name":"Bone Shield","tier":"N","lvl":0,"d":[5,10],"sb":100},{"code":"spk","name":"Spiked Shield","tier":"N","lvl":0,"d":[9,16],"sb":100},{"code":"xuc","name":"Defender","tier":"X","lvl":22,"d":[10,15],"sb":100},{"code":"xml","name":"Round Shield","tier":"X","lvl":25,"d":[11,23],"sb":100},{"code":"xrg","name":"Scutum","tier":"X","lvl":25,"d":[16,22],"sb":100},{"code":"xit","name":"Dragon Shield","tier":"X","lvl":25,"d":[17,28],"sb":100},{"code":"xow","name":"Pavise","tier":"X","lvl":25,"d":[24,32],"sb":100},{"code":"xts","name":"Ancient Shield","tier":"X","lvl":25,"d":[18,30],"sb":100},{"code":"xsh","name":"Grim Shield","tier":"X","lvl":25,"d":[19,28],"sb":100},{"code":"xpk","name":"Barbed Shield","tier":"X","lvl":25,"d":[18,35],"sb":100},{"code":"pa1","name":"Targe","tier":"N","lvl":3,"d":[2,6],"sb":100},{"code":"pa2","name":"Rondache","tier":"N","lvl":6,"d":[3,9],"sb":100},{"code":"pa3","name":"Heraldic Shield","tier":"N","lvl":12,"d":[4,12],"sb":100},{"code":"pa4","name":"Aerin Shield","tier":"N","lvl":15,"d":[7,16],"sb":100},{"code":"pa5","name":"Crown Shield","tier":"N","lvl":18,"d":[7,20],"sb":100},{"code":"uuc","name":"Heater","tier":"E","lvl":43,"d":[29,54],"sb":100},{"code":"uml","name":"Luna","tier":"E","lvl":45,"d":[31,53],"sb":100},{"code":"urg","name":"Hyperion","tier":"E","lvl":48,"d":[26,59],"sb":100},{"code":"uit","name":"Monarch","tier":"E","lvl":54,"d":[22,63],"sb":100},{"code":"uow","name":"Aegis","tier":"E","lvl":59,"d":[37,57],"sb":100},{"code":"uts","name":"Ward","tier":"E","lvl":63,"d":[21,68],"sb":100},{"code":"ush","name":"Troll Nest","tier":"E","lvl":57,"d":[35,55],"sb":100},{"code":"upk","name":"Blade Barrier","tier":"E","lvl":51,"d":[40,60],"sb":100},{"code":"pa6","name":"Akaran Targe","tier":"X","lvl":26,"d":[13,17],"sb":100},{"code":"pa7","name":"Akaran Rondache","tier":"X","lvl":30,"d":[17,22],"sb":100},{"code":"pa8","name":"Protector Shield","tier":"X","lvl":34,"d":[20,26],"sb":100},{"code":"pa9","name":"Gilded Shield","tier":"X","lvl":38,"d":[21,30],"sb":100},{"code":"paa","name":"Royal Shield","tier":"X","lvl":41,"d":[25,34],"sb":100},{"code":"pab","name":"Sacred Targe","tier":"E","lvl":47,"d":[22,70],"sb":100},{"code":"pac","name":"Sacred Rondache","tier":"E","lvl":52,"d":[35,58],"sb":100},{"code":"pad","name":"Kurast Shield","tier":"E","lvl":55,"d":[10,82],"sb":100},{"code":"pae","name":"Zakarum Shield","tier":"E","lvl":61,"d":[46,46],"sb":100},{"code":"paf","name":"Vortex Shield","tier":"E","lvl":66,"d":[5,87],"sb":100}],"sock":{"Chipped Amethyst":[[19,40]],"Flawed Amethyst":[[19,60]],"Amethyst":[[19,80]],"Flawless Amethyst":[[19,100]],"Perfect Amethyst":[[19,150]],"Chipped Sapphire":[[54,1],[55,3],[56,25]],"Flawed Sapphire":[[54,3],[55,5],[56,35]],"Sapphire":[[54,4],[55,7],[56,50]],"Flawless Sapphire":[[54,6],[55,10],[56,60]],"Perfect Sapphire":[[54,10],[55,14],[56,75]],"Chipped Emerald":[[57,34],[58,34],[59,75]],"Flawed Emerald":[[57,51],[58,51],[59,100]],"Emerald":[[57,82],[58,82],[59,125]],"Flawless Emerald":[[57,101],[58,101],[59,152]],"Perfect Emerald":[[57,143],[58,143],[59,179]],"Chipped Ruby":[[48,3],[49,4]],"Flawed Ruby":[[48,5],[49,8]],"Ruby":[[48,8],[49,12]],"Flawless Ruby":[[48,10],[49,16]],"Perfect Ruby":[[48,15],[49,20]],"Chipped Diamond":[[122,28]],"Flawed Diamond":[[122,34]],"Diamond":[[122,44]],"Flawless Diamond":[[122,54]],"Perfect Diamond":[[122,68]],"Chipped Topaz":[[50,1],[51,8]],"Flawed Topaz":[[50,1],[51,14]],"Topaz":[[50,1],[51,22]],"Flawless Topaz":[[50,1],[51,30]],"Perfect Topaz":[[50,1],[51,40]],"Chipped Skull":[[62,1],[60,2]],"Flawed Skull":[[62,2],[60,2]],"Skull":[[62,2],[60,3]],"Flawless Skull":[[62,3],[60,3]],"Perfect Skull":[[62,3],[60,4]],"El Rune":[[89,1],[19,50]],"Eld Rune":[[124,50],[122,75]],"Tir Rune":[[138,2]],"Nef Rune":[[81,1]],"Eth Rune":[[116,25]],"Ith Rune":[[22,9],[24,9],[160,9]],"Tal Rune":[[57,154],[58,154],[59,125]],"Ral Rune":[[48,5],[49,30]],"Ort Rune":[[50,1],[51,50]],"Thul Rune":[[54,3],[55,14],[56,75]],"Amn Rune":[[60,7]],"Sol Rune":[[21,9],[23,9],[159,9]],"Shael Rune":[[93,20]],"Dol Rune":[[17,20],[18,20]],"Hel Rune":[[91,-20]],"Io Rune":[[3,10]],"Lum Rune":[[1,10]],"Ko Rune":[[2,10]],"Fal Rune":[[0,10]],"Lem Rune":[[79,75]],"Pul Rune":[[123,100],[121,75]],"Um Rune":[[135,10],[501,120]],"Mal Rune":[[117,1]],"Ist Rune":[[80,30]],"Gul Rune":[[119,50]],"Vex Rune":[[62,7]],"Ohm Rune":[[17,45],[18,45]],"Lo Rune":[[141,20]],"Sur Rune":[[86,4]],"Ber Rune":[[136,20]],"Jah Rune":[[115,1]],"Cham Rune":[[134,3]]},"gear":[["u","Atma's Scarab","amu","amulet",[[119,0,40,60]]],["u","Crescent Moon","amu","amulet",[[93,0,10,10]]],["u","Highlord's Wrath","amu","amulet",[[51,0,300,300],[50,0,1,1],[93,0,20,20],[127,0,1,1],[250,0,2,2]]],["u","Mara's Kaleidoscope","amu","amulet",[[127,0,2,2],[0,0,4,6],[2,0,4,6]]],["u","Metalgrid","amu","amulet",[[19,0,400,450],[97,90,25,25],[97,79,20,20]]],["u","Nokozan Relic","amu","amulet",[[48,0,3,6],[49,0,7,12]]],["u","Saracen's Chance","amu","amulet",[[17,0,30,50],[18,0,30,50],[0,0,12,12],[2,0,12,12]]],["u","Seraph's Hymn","amu","amulet",[[127,0,2,2],[188,26,1,2],[121,0,80,120],[122,0,80,120],[123,0,150,250],[124,0,150,250]]],["s","Tal Rasha's Adjudication","amu","amulet",[[83,1,2,2],[51,0,32,32],[50,0,3,3]]],["s","Tancred's Weird","amu","amulet",[[51,0,45,45],[50,0,1,1]]],["s","Telling of Beads","amu","amulet",[[127,0,1,1]]],["u","The Cat's Eye","amu","amulet",[[93,0,30,30],[2,0,25,35]]],["u","The Eye of Etlich","amu","amulet",[[127,0,1,1],[54,0,4,6],[55,0,12,20]]],["u","The Mahim-Oak Curio","amu","amulet",[[0,0,5,10],[2,0,5,10],[119,0,30,50]]],["u","The Rising Sun","amu","amulet",[[48,0,80,124],[49,0,200,248],[333,0,4,8]]],["u","The Third Eye","ram","amulet",[[127,0,1,1]]],["s","Aldur's Deception","uul","armor",[[188,41,1,2],[0,0,20,20],[2,0,15,15],[188,42,1,2]]],["s","Angelic Mantle","rng","armor",[[122,0,50,80]]],["u","Arkaine's Valor","upl","armor",[[127,0,1,2]]],["u","Atma's Wail","xth","armor",[[2,0,15,15],[127,0,1,1]]],["s","Berserker's Hauberk","spl","armor",[[83,4,1,1]]],["u","Black Hades","xul","armor",[[123,0,400,450],[121,0,185,225]]],["u","Blinkbat's Form","lea","armor",[[48,0,10,10],[49,0,15,15]]],["r","Bone","","armor",[[83,2,2,2]]],["u","Boneflesh","plt","armor",[[19,0,235,235]]],["r","Bramble","","armor",[[332,0,40,50]]],["r","Chains of Honor","","armor",[[121,0,200,200],[122,0,200,200],[127,0,2,2],[0,0,20,20]]],["u","Corpsemourn","xar","armor",[[0,0,8,8],[48,0,120,160],[49,0,300,340],[97,74,30,40]]],["u","Crow Caw","xcl","armor",[[2,0,20,30],[93,0,20,20],[17,0,50,80],[18,0,50,80]]],["u","Dark Abyss","uth","armor",[[127,0,1,1]]],["s","Dark Adherent","uui","armor",[[122,0,200,250]]],["u","Darkglow","rng","armor",[[19,0,60,120]]],["r","Dragon","","armor",[[107,62,4,5],[220,0,3,3]]],["r","Duress","","armor",[[55,0,133,133],[54,0,37,37],[17,0,40,80],[18,0,40,80],[136,0,15,15]]],["u","Duriel's Shell","xrs","armor",[[0,0,15,15]]],["r","Enigma","","armor",[[127,0,2,2],[220,0,4,6]]],["r","Enlightenment","","armor",[[83,1,2,2],[97,37,5,8]]],["r","Finesse","","armor",[[93,0,20,20]]],["r","Fortitude","","armor",[[17,0,250,300],[18,0,250,300]]],["r","Gloom","","armor",[[0,0,10,10]]],["u","Greyform","qui","armor",[[2,0,10,10]]],["s","Griswold's Heart","xar","armor",[[83,3,1,2],[0,0,10,20]]],["u","Guardian Angel","xlt","armor",[[127,0,1,2],[245,0,14,14]]],["s","Haemosu's Adamant","xrs","armor",[[127,0,1,1]]],["u","Hawkmail","scl","armor",[[97,221,2,3]]],["u","Heavenly Garb","ltp","armor",[[122,0,50,50],[124,0,100,100]]],["r","Hustle","","armor",[[93,0,20,20],[2,0,10,10]]],["s","Immortal King's Soul Cage","uar","armor",[[188,32,3,4]]],["r","Innocence","","armor",[[127,0,2,2],[136,0,20,20]]],["u","Leviathan","uld","armor",[[0,0,40,50]]],["r","Lionheart","","armor",[[0,0,0,15],[2,0,10,15],[17,0,80,110],[18,0,80,110],[0,0,10,10]]],["s","M'avina's Embrace","uld","armor",[[83,0,1,2]]],["s","Milabrega's Robe","aar","armor",[[55,0,35,35],[54,0,25,25]]],["r","Myth","","armor",[[83,4,1,2]]],["s","Naj's Light Plate","ult","armor",[[127,0,1,1]]],["s","Natalya's Shadow","ucl","armor",[[188,49,2,3]]],["u","Ormus' Robes","uui","armor",[[329,0,10,15],[331,0,10,15],[330,0,10,15]]],["r","Peace","","armor",[[83,0,1,1],[107,9,2,3]]],["r","Principle","","armor",[[83,3,2,2],[122,0,100,150],[121,0,100,150]]],["u","Que-Hegan's Wisdom","xtp","armor",[[127,0,1,1]]],["r","Rain","","armor",[[83,5,2,2]]],["u","Rattlecage","gth","armor",[[19,0,100,145],[136,0,25,25],[17,0,60,90],[18,0,60,90]]],["u","Rockfleece","fld","armor",[[0,0,10,15]]],["s","Sazabi's Ghost Liberator","upl","armor",[[0,0,25,25],[123,0,300,300],[121,0,100,150]]],["u","Silks of the Victor","aar","armor",[[127,0,1,1]]],["u","Skin of the Flayed One","xla","armor",[[49,0,135,135],[48,0,80,80]]],["u","Skin of the Vipermagi","xea","armor",[[127,0,1,1]]],["u","Skullder's Ire","xpl","armor",[[127,0,1,1]]],["u","Sparking Mail","chn","armor",[[51,0,45,45],[50,0,1,1],[330,0,5,10]]],["u","Spectral Plate","urs","armor",[[127,0,1,1]]],["u","Spirit Forge","xng","armor",[[49,0,65,65],[48,0,20,20],[0,0,15,15]]],["r","Stealth","","armor",[[2,0,6,6]]],["u","Steel Carapace","uul","armor",[[127,0,1,2]]],["r","Stone","","armor",[[127,0,1,1],[0,0,10,16]]],["s","Tancred's Spine","ful","armor",[[0,0,15,15],[17,0,30,45],[18,0,30,45]]],["u","Templar's Might","uar","armor",[[0,0,40,50]]],["u","The Centurion","hla","armor",[[19,0,50,50],[17,0,30,30],[18,0,30,30]]],["u","The Gladiator's Bane","utu","armor",[[258,0,12,16]]],["u","The Spirit Shroud","xui","armor",[[127,0,1,1]]],["u","Toothrow","xld","armor",[[0,0,20,20],[141,0,15,25]]],["s","Trang-Oul's Scales","xul","armor",[[188,18,2,2],[107,367,2,3]]],["r","Treachery","","armor",[[83,6,2,2],[93,0,45,45]]],["u","Twitchthroe","stu","armor",[[93,0,20,40],[2,0,10,10],[0,0,10,10]]],["u","Tyrael's Might","uar","armor",[[122,0,200,250],[121,0,200,250],[0,0,20,30]]],["u","Venom Ward","brs","armor",[[336,0,6,12]]],["s","Vidala's Ambush","lea","armor",[[2,0,15,25]]],["r","Wealth","","armor",[[2,0,10,10]]],["u","Wraithskin","ung","armor",[[93,0,20,20],[210,0,10,10],[17,0,60,100],[18,0,60,100],[257,0,25,25]]],["u","Arachnid Mesh","ulc","belt",[[127,0,1,1]]],["u","Bladebuckle","hbl","belt",[[0,0,5,5],[2,0,10,10]]],["s","Credendum","umc","belt",[[0,0,10,10],[2,0,10,10]]],["u","Goldwrap","tbl","belt",[[93,0,20,20]]],["s","Hwanin's Blessing","mbl","belt",[[51,0,330,330],[50,0,3,3]]],["s","Immortal King's Detail","zhb","belt",[[0,0,20,25]]],["s","Iratha's Cord","tbl","belt",[[21,0,5,5],[23,0,5,5],[159,0,5,5]]],["u","Nosferatu's Coil","uvc","belt",[[0,0,10,15],[93,0,20,20],[141,0,10,10]]],["u","Razortail","zvb","belt",[[2,0,15,20],[22,0,10,20],[24,0,10,20],[160,0,10,20]]],["u","Siggard's Staunch","uhc","belt",[[97,145,4,6],[136,0,20,20]]],["u","Snakecord","vbl","belt",[[332,0,4,6]]],["u","Snowclash","ztb","belt",[[55,0,63,63],[54,0,39,39]]],["s","Tal Rasha's Fine-Spun Cloth","zmb","belt",[[2,0,20,20]]],["u","Thundergod's Vigor","zhb","belt",[[50,0,1,1],[51,0,150,250],[0,0,10,15]]],["s","Cow King's Hooves","vbt","boots",[[2,0,20,20],[49,0,35,35],[48,0,25,25]]],["u","Goblin Toe","tbt","boots",[[136,0,15,25],[17,0,20,30],[18,0,20,30]]],["u","Gore Rider","xhb","boots",[[141,0,15,20],[136,0,15,15]]],["u","Gorefoot","vbt","boots",[[107,132,2,2]]],["u","Hotspur","lbt","boots",[[49,0,6,6],[48,0,3,3]]],["s","Immortal King's Pillar","xhb","boots",[[19,0,90,140]]],["u","Infernostride","xlb","boots",[[49,0,66,66],[48,0,24,24]]],["u","Itherael's Path","utb","boots",[[2,0,10,15]]],["u","Marrowwalk","umb","boots",[[0,0,10,20],[2,0,17,17],[97,69,1,2]]],["u","Merman's Sprocket","ulb","boots",[[54,0,40,40],[55,0,80,80]]],["s","Sander's Riprap","vbt","boots",[[19,0,100,100],[0,0,5,5],[2,0,10,10]]],["u","Sandstorm Trek","uvb","boots",[[0,0,10,15]]],["u","Shadow Dancer","uhb","boots",[[2,0,20,30],[188,49,1,2]]],["s","Tancred's Hobnails","lbt","boots",[[2,0,10,20]]],["u","Tearhaunch","hbt","boots",[[0,0,5,10],[2,0,5,10],[107,115,1,2],[188,26,2,2]]],["u","War Traveler","xtb","boots",[[0,0,10,10],[22,0,25,25],[24,0,25,25],[160,0,25,25],[21,0,15,15],[23,0,15,15],[159,0,15,15]]],["u","Waterwalk","xvb","boots",[[2,0,15,15]]],["s","Arctic Mitts","tgl","gloves",[[93,0,10,10]]],["u","Bloodfist","vgl","gloves",[[22,0,5,10],[24,0,5,10],[160,0,5,10],[93,0,10,10]]],["u","Chance Guards","mgl","gloves",[[19,0,25,25]]],["u","Dracul's Grasp","uvg","gloves",[[0,0,20,30]]],["u","Frostburn","hgl","gloves",[[49,0,28,28],[48,0,14,14],[55,0,22,22],[54,0,6,6],[333,0,5,10],[335,0,5,10]]],["u","Ghoulhide","xmg","gloves",[[246,0,16,16],[244,0,16,16],[93,0,20,20]]],["u","Gravepalm","xvg","gloves",[[0,0,10,10],[122,0,100,200],[124,0,100,200],[141,0,10,15],[188,18,1,1]]],["u","Hellmouth","xhg","gloves",[[49,0,144,144],[48,0,30,30],[333,0,5,10]]],["s","Immortal King's Forge","xhg","gloves",[[0,0,20,20],[2,0,20,20]]],["u","Lava Gout","xtg","gloves",[[93,0,20,20],[49,0,92,92],[48,0,26,26]]],["s","Laying of Hands","ulg","gloves",[[93,0,20,20],[121,0,150,200]]],["s","M'avina's Icy Clutch","xtg","gloves",[[55,0,36,36],[54,0,12,12],[0,0,8,12],[2,0,10,20]]],["u","Magefist","tgl","gloves",[[49,0,36,36],[48,0,6,6]]],["s","Magnus' Skin","xvg","gloves",[[93,0,20,20],[19,0,100,100]]],["s","Sander's Taboo","vgl","gloves",[[93,0,20,20]]],["s","Sigon's Gage","hgl","gloves",[[0,0,10,10],[19,0,20,20]]],["u","Soul Drainer","umg","gloves",[[425,0,3,4]]],["u","Steelrend","uhg","gloves",[[0,0,15,20],[17,0,60,80],[18,0,60,80],[136,0,10,20],[268,0,10,20]]],["u","The Hand of Broc","lgl","gloves",[[17,0,20,30],[18,0,20,30]]],["s","Trang-Oul's Claws","xmg","gloves",[[188,16,2,2],[332,0,10,15]]],["u","Venom Grip","xlg","gloves",[[332,0,10,15],[136,0,5,10]]],["s","Aldur's Stony Gaze","dr8","helm",[[188,40,1,2],[83,5,1,2]]],["u","Andariel's Visage","usk","helm",[[127,0,2,2],[93,0,20,20],[0,0,20,30],[336,0,6,10]]],["u","Arreat's Face","baa","helm",[[83,4,2,2],[188,32,1,2],[119,0,20,20],[0,0,10,20],[2,0,10,20]]],["u","Biggin's Bonnet","cap","helm",[[19,0,30,50],[17,0,30,50],[18,0,30,50]]],["u","Cerebus' Bite","drb","helm",[[188,41,3,4],[119,0,120,180],[107,232,2,2],[141,0,33,33],[107,242,2,2]]],["s","Cow King's Horns","xap","helm",[[127,0,1,1]]],["u","Crown of Thieves","xrn","helm",[[2,0,25,25]]],["u","Cyclopean Roar","ba6","helm",[[188,34,2,3],[136,0,20,20]]],["u","Cyclopean Roar","ba6","helm",[[188,34,2,3],[136,0,20,20]]],["u","Darksight Helm","xhl","helm",[[97,264,1,1]]],["r","Deception","","helm",[[258,0,5,10],[256,0,15,20],[0,0,0,10],[0,0,10,10]]],["r","Delirium","","helm",[[127,0,2,2],[97,482,1,1]]],["u","Demonhorn's Edge","bad","helm",[[83,4,2,3],[107,368,2,2]]],["u","Denmother","drc","helm",[[83,5,2,2],[107,247,2,3],[107,233,2,3]]],["u","Duskdeep","fhl","helm",[[22,0,10,15],[24,0,10,15],[160,0,10,15]]],["u","Fenris","dr6","helm",[[83,5,1,2],[107,227,2,2],[107,236,2,2],[116,0,25,25],[425,0,5,8],[2,0,20,30]]],["r","Ferocity","","helm",[[97,106,18,18]]],["r","Flickering Flame","","helm",[[333,0,5,10]]],["u","Giant Skull","uh9","helm",[[0,0,25,35],[136,0,25,25],[17,0,60,80],[18,0,60,80]]],["u","Griffon's Eye","ci3","helm",[[127,0,1,1],[330,0,10,15],[334,0,15,20]]],["s","Guillaume's Face","xhm","helm",[[136,0,35,35],[141,0,15,15],[0,0,15,15]]],["u","Halaberd's Reign","bae","helm",[[83,4,2,2],[107,149,2,3],[107,146,2,3],[224,0,6,6]]],["u","Harlequin Crest","uap","helm",[[127,0,2,2],[0,0,2,2],[2,0,2,2]]],["u","Howltusk","ghm","helm",[[93,0,20,20]]],["s","Hwanin's Splendor","xrn","helm",[[19,0,200,350]]],["s","Immortal King's Will","ba5","helm",[[188,34,2,2]]],["s","Isenhart's Horns","fhl","helm",[[2,0,6,6],[22,0,4,8],[24,0,4,8],[160,0,4,8]]],["u","Jalal's Mane","dra","helm",[[83,5,2,2],[188,41,1,2],[119,0,20,20],[0,0,15,20]]],["u","Kira's Guardian","ci2","helm",[[334,0,10,15],[335,0,10,15],[333,0,10,15]]],["r","Lore","","helm",[[127,0,1,1]]],["s","M'avina's True Sight","ci3","helm",[[93,0,30,30]]],["s","Milabrega's Diadem","crn","helm",[[55,0,35,35],[54,0,25,25]]],["r","Nadir","","helm",[[0,0,5,5]]],["s","Naj's Circlet","ci0","helm",[[49,0,35,35],[48,0,25,25],[0,0,15,15]]],["s","Natalya's Totem","xh9","helm",[[2,0,25,30],[0,0,15,20]]],["u","Nightwing's Veil","uhm","helm",[[127,0,2,2],[2,0,10,20],[331,0,5,10],[335,0,5,10]]],["s","Ondal's Almighty","uhm","helm",[[0,0,10,15],[2,0,10,20],[127,0,1,2]]],["u","Overlord's Helm","uh9","helm",[[425,0,15,15],[0,0,20,30],[2,0,15,15]]],["u","Peasant Crown","xap","helm",[[127,0,1,1]]],["u","Quetzalcoatl","dr2","helm",[[83,5,1,2]]],["r","Radiance","","helm",[[17,0,20,40],[18,0,20,40]]],["u","Raekor's Virtue","baf","helm",[[83,4,2,2],[107,140,2,3],[107,133,2,3],[2,0,20,30],[17,0,40,60],[18,0,40,60]]],["u","Ravenlore","dre","helm",[[188,42,3,3],[333,0,10,20],[107,221,7,7]]],["s","Sazabi's Mental Sheath","xhl","helm",[[127,0,1,1]]],["u","Spirit Keeper","drd","helm",[[83,5,2,2]]],["u","Stealskull","xlm","helm",[[93,0,20,20]]],["u","Steel Shade","ulm","helm",[[127,0,2,2]]],["s","Tancred's Skull","bhm","helm",[[17,0,20,30],[18,0,20,30],[19,0,80,80]]],["u","Tarnhelm","skp","helm",[[127,0,1,1]]],["u","The Face of Horror","msk","helm",[[0,0,20,20],[122,0,50,50]]],["u","Undead Crown","crn","helm",[[122,0,50,50],[124,0,50,100],[97,69,6,8],[97,70,6,8]]],["u","Ursa's Nightmare","drf","helm",[[188,41,2,4]]],["u","Valkyrie Wing","xhm","helm",[[83,0,1,2],[17,0,40,60],[18,0,40,60],[107,32,2,2]]],["u","Vampire Gaze","xh9","helm",[[55,0,60,60],[54,0,30,30]]],["u","Veil of Steel","uhm","helm",[[0,0,15,15],[17,0,60,90],[18,0,60,90],[127,0,1,1]]],["u","Wildspeaker","ba7","helm",[[83,4,1,2],[107,138,2,3],[107,150,2,3]]],["r","Wisdom","","helm",[[119,0,15,25]]],["u","Wolfhowl","bac","helm",[[188,34,2,3],[0,0,10,15],[2,0,10,15],[97,223,4,6],[97,237,12,15],[97,232,4,6]]],["u","Wormskull","bhm","helm",[[83,2,1,1],[188,17,1,1]]],["u","Abyssal Ward","cqv3","quiver",[[425,0,10,14],[93,0,-20,-20]]],["u","Aetherwing","aqv3","quiver",[[93,0,40,40],[51,0,775,775],[50,0,1,1],[334,0,15,25],[224,0,4,8],[22,0,18,18],[24,0,18,18],[160,0,18,18]]],["r","Ancient's Foresight","","quiver",[[17,0,10,20],[18,0,10,20]]],["r","Ancient's Scripture","","quiver",[[17,0,10,20],[18,0,10,20]]],["u","Anvilguard Strap","cqv2","quiver",[[425,0,4,4]]],["u","Balefire","aqv","quiver",[[333,0,5,8],[48,0,6,6],[49,0,10,10],[22,0,2,2],[24,0,2,2],[160,0,2,2]]],["u","Bannerlord's Call","cqv3","quiver",[[127,0,2,2],[97,17,2,3],[0,0,8,14],[2,0,8,14],[97,8,2,3],[425,0,6,6]]],["u","Basilisk's Quill","aqv3","quiver",[[83,0,2,2],[336,0,20,30],[21,0,30,40],[23,0,30,40],[159,0,30,40],[22,0,0,0],[24,0,0,0],[160,0,0,0]]],["u","Doom's Finger","aqv3","quiver",[[141,0,25,35],[210,0,10,10],[22,0,40,60],[24,0,40,60],[160,0,40,60],[188,1,2,2],[121,0,80,100]]],["r","Echo","","quiver",[[17,0,20,30],[18,0,20,30],[119,0,50,50]]],["u","Frozen Sorrow","cqv3","quiver",[[141,0,15,25],[335,0,6,6]]],["u","Ramfodder","cqv","quiver",[[93,0,10,10],[425,0,2,2]]],["u","Shatterhead","cqv2","quiver",[[136,0,20,30],[17,0,30,40],[18,0,30,40],[188,0,2,2],[0,0,10,20],[268,0,15,25],[425,0,4,4]]],["u","Swiftwind Needle","aqv2","quiver",[[2,0,25,35],[21,0,12,12],[23,0,12,12],[159,0,12,12],[22,0,14,14],[24,0,14,14],[160,0,14,14]]],["u","Tombsong","aqv2","quiver",[[122,0,50,100],[124,0,125,175],[97,89,12,12],[22,0,10,10],[24,0,10,10],[160,0,10,10]]],["s","Bul-Kathos' Death Band","rin","ring",[[17,0,20,30],[18,0,20,30],[19,0,100,100]]],["u","Bul-Kathos' Wedding Band","rin","ring",[[127,0,1,1]]],["u","Constricting Loop","rin","ring",[[0,0,12,18]]],["u","Nagelring","rin","ring",[[19,0,50,75]]],["u","Raven Frost","rin","ring",[[55,0,45,45],[54,0,15,15],[2,0,15,20],[19,0,150,250]]],["u","The Stone of Jordan","rin","ring",[[51,0,120,120],[50,0,1,1],[127,0,1,1]]],["u","Wisp Projector","rin","ring",[[127,0,1,1]]],["u","Alma Negra","pac","shield",[[127,0,2,2],[119,0,100,150],[17,0,160,200],[18,0,160,200]]],["u","Blackoak Shield","uml","shield",[[221,0,4,4],[335,0,10,20]]],["u","Boneflame","nee","shield",[[83,2,2,2]]],["u","Bverrit Keep","tow","shield",[[0,0,5,15]]],["u","Darkforce Spawn","nef","shield",[[188,18,2,3],[188,16,2,3],[188,17,2,3]]],["r","Dragon","","shield",[[107,62,4,5],[220,0,3,3]]],["u","Dragonscale","pae","shield",[[0,0,25,25],[49,0,371,371],[48,0,211,211],[329,0,15,20]]],["u","Ephemeral","pab","shield",[[188,24,3,4],[107,117,2,2],[0,0,12,18],[2,0,12,18]]],["r","Epiphany","","shield",[[0,0,10,15],[2,0,10,15],[51,0,1250,1250],[50,0,1,1]]],["r","Exile","","shield",[[188,25,2,2]]],["u","Gerke's Sanctuary","xow","shield",[[127,0,1,1]]],["s","Griswold's Honor","paf","shield",[[188,26,2,2]]],["u","Herald of Zakarum","pa9","shield",[[127,0,2,2],[188,24,1,2],[0,0,15,25],[119,0,30,30]]],["u","Homunculus","nea","shield",[[83,2,2,2]]],["s","Hsarus' Iron Fist","buc","shield",[[0,0,20,20]]],["u","Kalan's Legacy","ne6","shield",[[83,2,1,1]]],["u","Lance Guard","xpk","shield",[[141,0,25,35],[257,0,25,25],[2,0,12,16]]],["u","Lidless Wall","xsh","shield",[[127,0,1,1]]],["u","Martyrdom","ned","shield",[[83,2,2,3],[107,73,2,2]]],["u","Pelta Lunata","buc","shield",[[0,0,2,2]]],["r","Phoenix","","shield",[[17,0,250,300],[18,0,250,300],[333,0,28,28]]],["u","Sacred Totem","neg","shield",[[83,2,2,3],[107,66,2,2],[107,91,2,2]]],["r","Sanctuary","","shield",[[2,0,10,10],[2,0,10,10]]],["u","Sankekur's Fall","pa3","shield",[[55,0,90,90],[54,0,55,55],[49,0,120,120],[48,0,40,40],[51,0,185,185],[50,0,1,1],[115,0,1,1]]],["r","Shattered Wall","","shield",[[55,0,250,250],[54,0,200,200]]],["s","Sigon's Guard","tow","shield",[[127,0,1,1]]],["u","Skywarden","paf","shield",[[188,25,1,2],[83,3,2,2],[136,0,20,20],[2,0,15,25]]],["u","Spike Thorn","upk","shield",[[22,0,80,80],[24,0,80,80],[160,0,80,80],[21,0,50,50],[23,0,50,50],[159,0,50,50]]],["r","Spirit","","shield",[[127,0,1,1]]],["r","Splendor","","shield",[[127,0,1,1]]],["u","Steelclash","kit","shield",[[127,0,1,1]]],["u","Stormchaser","xrg","shield",[[51,0,270,270],[50,0,1,1],[19,0,150,250]]],["u","Stormguild","lrg","shield",[[51,0,18,18],[50,0,1,1]]],["u","Stormshield","uit","shield",[[0,0,20,30]]],["u","The Ward","gts","shield",[[0,0,10,10]]],["u","Tiamat's Rebuke","xit","shield",[[55,0,80,80],[54,0,40,40],[49,0,142,142],[48,0,53,53],[51,0,180,180],[50,0,1,1]]],["s","Trang-Oul's Wing","ne9","shield",[[0,0,20,28],[2,0,10,18],[188,17,2,2]]],["u","Twilight's Reflection","urg","shield",[[425,0,10,10]]],["u","Umbral Disk","sml","shield",[[2,0,10,10],[22,0,8,8],[24,0,8,8],[160,0,8,8],[21,0,4,4],[23,0,4,4],[159,0,4,4]]],["u","Visceratuant","xuc","shield",[[83,1,1,1],[330,0,5,10]]],["u","Warriv's Warder","uuc","shield",[[97,13,6,8],[136,0,20,20]]]],"gearBases":{"Cap":["cap","helm"],"Skull Cap":["skp","helm"],"Helm":["hlm","helm"],"Full Helm":["fhl","helm"],"Great Helm":["ghm","helm"],"Crown":["crn","helm"],"Mask":["msk","helm"],"Quilted Armor":["qui","armor"],"Leather Armor":["lea","armor"],"Hard Leather Armor":["hla","armor"],"Studded Leather":["stu","armor"],"Ring Mail":["rng","armor"],"Scale Mail":["scl","armor"],"Chain Mail":["chn","armor"],"Breast Plate":["brs","armor"],"Splint Mail":["spl","armor"],"Plate Mail":["plt","armor"],"Field Plate":["fld","armor"],"Gothic Plate":["gth","armor"],"Full Plate Mail":["ful","armor"],"Ancient Armor":["aar","armor"],"Light Plate":["ltp","armor"],"Buckler":["buc","shield"],"Small Shield":["sml","shield"],"Large Shield":["lrg","shield"],"Kite Shield":["kit","shield"],"Tower Shield":["tow","shield"],"Gothic Shield":["gts","shield"],"Leather Gloves":["lgl","gloves"],"Heavy Gloves":["vgl","gloves"],"Chain Gloves":["mgl","gloves"],"Light Gauntlets":["tgl","gloves"],"Gauntlets":["hgl","gloves"],"Boots":["lbt","boots"],"Heavy Boots":["vbt","boots"],"Chain Boots":["mbt","boots"],"Light Plated Boots":["tbt","boots"],"Greaves":["hbt","boots"],"Sash":["lbl","belt"],"Light Belt":["vbl","belt"],"Belt":["mbl","belt"],"Heavy Belt":["tbl","belt"],"Plated Belt":["hbl","belt"],"Bone Helm":["bhm","helm"],"Bone Shield":["bsh","shield"],"Spiked Shield":["spk","shield"],"War Hat":["xap","helm"],"Sallet":["xkp","helm"],"Casque":["xlm","helm"],"Basinet":["xhl","helm"],"Winged Helm":["xhm","helm"],"Grand Crown":["xrn","helm"],"Death Mask":["xsk","helm"],"Ghost Armor":["xui","armor"],"Serpentskin Armor":["xea","armor"],"Demonhide Armor":["xla","armor"],"Trellised Armor":["xtu","armor"],"Linked Mail":["xng","armor"],"Tigulated Mail":["xcl","armor"],"Mesh Armor":["xhn","armor"],"Cuirass":["xrs","armor"],"Russet Armor":["xpl","armor"],"Templar Coat":["xlt","armor"],"Sharktooth Armor":["xld","armor"],"Embossed Plate":["xth","armor"],"Chaos Armor":["xul","armor"],"Ornate Plate":["xar","armor"],"Mage Plate":["xtp","armor"],"Defender":["xuc","shield"],"Round Shield":["xml","shield"],"Scutum":["xrg","shield"],"Dragon Shield":["xit","shield"],"Pavise":["xow","shield"],"Ancient Shield":["xts","shield"],"Demonhide Gloves":["xlg","gloves"],"Sharkskin Gloves":["xvg","gloves"],"Heavy Bracers":["xmg","gloves"],"Battle Gauntlets":["xtg","gloves"],"War Gauntlets":["xhg","gloves"],"Demonhide Boots":["xlb","boots"],"Sharkskin Boots":["xvb","boots"],"Mesh Boots":["xmb","boots"],"Battle Boots":["xtb","boots"],"War Boots":["xhb","boots"],"Demonhide Sash":["zlb","belt"],"Sharkskin Belt":["zvb","belt"],"Mesh Belt":["zmb","belt"],"Battle Belt":["ztb","belt"],"War Belt":["zhb","belt"],"Grim Helm":["xh9","helm"],"Grim Shield":["xsh","shield"],"Barbed Shield":["xpk","shield"],"Wolf Head":["dr1","helm"],"Hawk Helm":["dr2","helm"],"Antlers":["dr3","helm"],"Falcon Mask":["dr4","helm"],"Spirit Mask":["dr5","helm"],"Jawbone Cap":["ba1","helm"],"Fanged Helm":["ba2","helm"],"Horned Helm":["ba3","helm"],"Assault Helmet":["ba4","helm"],"Avenger Guard":["ba5","helm"],"Targe":["pa1","shield"],"Rondache":["pa2","shield"],"Heraldic Shield":["pa3","shield"],"Aerin Shield":["pa4","shield"],"Crown Shield":["pa5","shield"],"Preserved Head":["ne1","shield"],"Zombie Head":["ne2","shield"],"Unraveller Head":["ne3","shield"],"Gargoyle Head":["ne4","shield"],"Demon Head":["ne5","shield"],"Circlet":["ci0","helm"],"Coronet":["ci1","helm"],"Tiara":["ci2","helm"],"Diadem":["ci3","helm"],"Shako":["uap","helm"],"Hydraskull":["ukp","helm"],"Armet":["ulm","helm"],"Giant Conch":["uhl","helm"],"Spired Helm":["uhm","helm"],"Corona":["urn","helm"],"Demonhead":["usk","helm"],"Dusk Shroud":["uui","armor"],"Wyrmhide":["uea","armor"],"Scarab Husk":["ula","armor"],"Wire Fleece":["utu","armor"],"Diamond Mail":["ung","armor"],"Loricated Mail":["ucl","armor"],"Boneweave":["rar","armor"],"Great Hauberk":["urs","armor"],"Balrog Skin":["upl","armor"],"Hellforge Plate":["ult","armor"],"Kraken Shell":["uld","armor"],"Lacquered Plate":["uth","armor"],"Shadow Plate":["uul","armor"],"Sacred Armor":["uar","armor"],"Archon Plate":["utp","armor"],"Heater":["uuc","shield"],"Luna":["uml","shield"],"Hyperion":["urg","shield"],"Monarch":["uit","shield"],"Aegis":["uow","shield"],"Ward":["uts","shield"],"Bramble Mitts":["ulg","gloves"],"Vampirebone Gloves":["uvg","gloves"],"Vambraces":["umg","gloves"],"Crusader Gauntlets":["utg","gloves"],"Ogre Gauntlets":["uhg","gloves"],"Wyrmhide Boots":["ulb","boots"],"Scarabshell Boots":["uvb","boots"],"Boneweave Boots":["umb","boots"],"Mirrored Boots":["utb","boots"],"Myrmidon Greaves":["uhb","boots"],"Spiderweb Sash":["ulc","belt"],"Vampirefang Belt":["uvc","belt"],"Mithril Coil":["umc","belt"],"Troll Belt":["rbe","belt"],"Colossus Girdle":["uhc","belt"],"Bone Visage":["uh9","helm"],"Troll Nest":["ush","shield"],"Blade Barrier":["upk","shield"],"Alpha Helm":["dr6","helm"],"Griffon Headdress":["dr7","helm"],"Hunter's Guise":["dr8","helm"],"Sacred Feathers":["dr9","helm"],"Totemic Mask":["dra","helm"],"Jawbone Visor":["ba6","helm"],"Lion Helm":["ba7","helm"],"Rage Mask":["ba8","helm"],"Savage Helmet":["ba9","helm"],"Slayer Guard":["baa","helm"],"Akaran Targe":["pa6","shield"],"Akaran Rondache":["pa7","shield"],"Protector Shield":["pa8","shield"],"Gilded Shield":["pa9","shield"],"Royal Shield":["paa","shield"],"Mummified Trophy":["ne6","shield"],"Fetish Trophy":["ne7","shield"],"Sexton Trophy":["ne8","shield"],"Cantor Trophy":["ne9","shield"],"Hierophant Trophy":["nea","shield"],"Blood Spirit":["drb","helm"],"Sun Spirit":["drc","helm"],"Earth Spirit":["drd","helm"],"Sky Spirit":["dre","helm"],"Dream Spirit":["drf","helm"],"Carnage Helm":["bab","helm"],"Fury Visor":["bac","helm"],"Destroyer Helm":["bad","helm"],"Conqueror Crown":["bae","helm"],"Guardian Crown":["baf","helm"],"Sacred Targe":["pab","shield"],"Sacred Rondache":["pac","shield"],"Kurast Shield":["pad","shield"],"Zakarum Shield":["pae","shield"],"Vortex Shield":["paf","shield"],"Minion Skull":["neb","shield"],"Hellspawn Skull":["neg","shield"],"Overseer Skull":["ned","shield"],"Succubus Skull":["nee","shield"],"Bloodlord Skull":["nef","shield"],"Amulet":["ram","amulet"],"Top of the Horadric Staff":["vip","amulet"],"Ring":["rin","ring"],"Blunt Arrows":["aqv","quiver"],"Light Bolts":["cqv","quiver"],"Sharp Arrows":["aqv2","quiver"],"Razor Arrows":["aqv3","quiver"],"Heavy Bolts":["cqv2","quiver"],"War Bolts":["cqv3","quiver"]},"sockH":{"Chipped Amethyst":[[0,3]],"Flawed Amethyst":[[0,4]],"Amethyst":[[0,6]],"Flawless Amethyst":[[0,8]],"Perfect Amethyst":[[0,10]],"Chipped Sapphire":[[9,10]],"Flawed Sapphire":[[9,17]],"Sapphire":[[9,24]],"Flawless Sapphire":[[9,31]],"Perfect Sapphire":[[9,38]],"Chipped Emerald":[[2,3]],"Flawed Emerald":[[2,4]],"Emerald":[[2,6]],"Flawless Emerald":[[2,8]],"Perfect Emerald":[[2,10]],"Chipped Ruby":[[7,10]],"Flawed Ruby":[[7,17]],"Ruby":[[7,24]],"Flawless Ruby":[[7,31]],"Perfect Ruby":[[7,38]],"Chipped Diamond":[[19,20]],"Flawed Diamond":[[19,40]],"Diamond":[[19,60]],"Flawless Diamond":[[19,80]],"Perfect Diamond":[[19,100]],"Chipped Topaz":[[80,9]],"Flawed Topaz":[[80,13]],"Topaz":[[80,16]],"Flawless Topaz":[[80,20]],"Perfect Topaz":[[80,24]],"Chipped Skull":[[74,2],[27,8]],"Flawed Skull":[[74,3],[27,8]],"Skull":[[74,3],[27,12]],"Flawless Skull":[[74,4],[27,12]],"Perfect Skull":[[74,5],[27,19]],"El Rune":[[89,1],[31,15]],"Eld Rune":[[154,15]],"Tir Rune":[[138,2]],"Nef Rune":[[32,30]],"Eth Rune":[[27,20]],"Ith Rune":[[114,15]],"Tal Rune":[[45,30]],"Ral Rune":[[39,30]],"Ort Rune":[[41,30]],"Thul Rune":[[43,30]],"Amn Rune":[[78,20]],"Sol Rune":[[34,7]],"Shael Rune":[[99,20]],"Dol Rune":[[74,20]],"Hel Rune":[[91,-15]],"Io Rune":[[3,10]],"Lum Rune":[[1,10]],"Ko Rune":[[2,10]],"Fal Rune":[[0,10]],"Lem Rune":[[79,50]],"Pul Rune":[[16,75]],"Um Rune":[[39,15],[41,15],[43,15],[45,15]],"Mal Rune":[[35,7]],"Ist Rune":[[80,30]],"Gul Rune":[[46,5]],"Vex Rune":[[40,5]],"Ohm Rune":[[44,5]],"Lo Rune":[[42,5]],"Sur Rune":[[77,5]],"Ber Rune":[[36,6]],"Jah Rune":[[76,5]],"Cham Rune":[[153,1]]},"sockS":{"Chipped Amethyst":[[31,8]],"Flawed Amethyst":[[31,12]],"Amethyst":[[31,18]],"Flawless Amethyst":[[31,24]],"Perfect Amethyst":[[31,30]],"Chipped Sapphire":[[43,12]],"Flawed Sapphire":[[43,16]],"Sapphire":[[43,22]],"Flawless Sapphire":[[43,28]],"Perfect Sapphire":[[43,40]],"Chipped Emerald":[[45,12]],"Flawed Emerald":[[45,16]],"Emerald":[[45,22]],"Flawless Emerald":[[45,28]],"Perfect Emerald":[[45,40]],"Chipped Ruby":[[39,12]],"Flawed Ruby":[[39,16]],"Ruby":[[39,22]],"Flawless Ruby":[[39,28]],"Perfect Ruby":[[39,40]],"Chipped Diamond":[[39,6],[41,6],[43,6],[45,6]],"Flawed Diamond":[[39,8],[41,8],[43,8],[45,8]],"Diamond":[[39,11],[41,11],[43,11],[45,11]],"Flawless Diamond":[[39,14],[41,14],[43,14],[45,14]],"Perfect Diamond":[[39,19],[41,19],[43,19],[45,19]],"Chipped Topaz":[[41,12]],"Flawed Topaz":[[41,16]],"Topaz":[[41,22]],"Flawless Topaz":[[41,28]],"Perfect Topaz":[[41,40]],"Chipped Skull":[[78,4]],"Flawed Skull":[[78,8]],"Skull":[[78,12]],"Flawless Skull":[[78,16]],"Perfect Skull":[[78,20]],"El Rune":[[89,1],[31,15]],"Eld Rune":[[20,7]],"Tir Rune":[[138,2]],"Nef Rune":[[32,50]],"Eth Rune":[[27,20]],"Ith Rune":[[114,15]],"Tal Rune":[[45,35]],"Ral Rune":[[39,35]],"Ort Rune":[[41,35]],"Thul Rune":[[43,35]],"Amn Rune":[[78,24]],"Sol Rune":[[34,9]],"Shael Rune":[[102,20]],"Dol Rune":[[74,30]],"Hel Rune":[[91,-15]],"Io Rune":[[3,10]],"Lum Rune":[[1,10]],"Ko Rune":[[2,10]],"Fal Rune":[[0,10]],"Lem Rune":[[79,50]],"Pul Rune":[[16,75]],"Um Rune":[[39,22],[41,22],[43,22],[45,22]],"Mal Rune":[[35,9]],"Ist Rune":[[80,30]],"Gul Rune":[[46,5]],"Vex Rune":[[40,5]],"Ohm Rune":[[44,5]],"Lo Rune":[[42,5]],"Sur Rune":[[9,75]],"Ber Rune":[[36,6]],"Jah Rune":[[7,75]],"Cham Rune":[[153,1]]},"mercs":{"a4":{"lvl":79,"at":28,"per":12,"cm":11},"bc":{"lvl":80,"at":21,"per":0}},"fof":{"flame":{"EType":"fire","EMin":"1","Emax":"2","HitShift":"3","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * 26","ApplyMastery":"1","Range":"64","MinELev1":"1","MinELev2":"2","MinELev3":"3","MinELev4":"4","MinELev5":"5","MaxELev1":"1","MaxELev2":"3","MaxELev3":"4","MaxELev4":"5","MaxELev5":"6","n":"fistsoffirefirewall"},"nova":{"EType":"fire","EMin":"1","Emax":"2","HitShift":"8","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * 26","ApplyMastery":"1","Range":"13","MinELev1":"1","MinELev2":"2","MinELev3":"15","MinELev4":"29","MinELev5":"44","MaxELev1":"1","MaxELev2":"3","MaxELev3":"18","MaxELev4":"34","MaxELev5":"51","n":"fistsoffirenova"},"meteor":{"EType":"fire","EMin":"1","Emax":"2","MinDamage":"1","MaxDamage":"2","HitShift":"8","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * 26","DmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * 26","ApplyMastery":"1","Range":"15","MinELev1":"1","MinELev2":"1","MinELev3":"9","MinELev4":"17","MinELev5":"25","MaxELev1":"1","MaxELev2":"2","MaxELev3":"10","MaxELev4":"18","MaxELev5":"26","MinLevDam1":"1","MinLevDam2":"1","MinLevDam3":"9","MinLevDam4":"18","MinLevDam5":"28","MaxLevDam1":"1","MaxLevDam2":"2","MaxLevDam3":"10","MaxLevDam4":"19","MaxLevDam5":"29","n":"fofmeteor"},"mflame":{"EType":"fire","EMin":"1","Emax":"2","HitShift":"3","EDmgSymPerCalc":"(skill('Tiger Strike'.blvl) + skill('Dragon Flight'.blvl)) * 26","ApplyMastery":"1","Range":"64","MinELev1":"1","MinELev2":"2","MinELev3":"3","MinELev4":"4","MinELev5":"5","MaxELev1":"1","MaxELev2":"3","MaxELev3":"4","MaxELev4":"5","MaxELev5":"6","n":"fistsoffirefirewall"}},"boi":{"wave":{"EType":"cold","EMin":"15","Emax":"35","HitShift":"8","EDmgSymPerCalc":"skill('Tiger Strike'.blvl) * 17","ApplyMastery":"1","Range":"25","MinELev1":"8","MinELev2":"12","MinELev3":"27","MinELev4":"43","MinELev5":"58","MaxELev1":"10","MaxELev2":"14","MaxELev3":"29","MaxELev4":"44","MaxELev5":"59","n":"boiwavemaker"},"trail":{"EType":"cold","EMin":"15","Emax":"35","HitShift":"8","EDmgSymPerCalc":"skill('Tiger Strike'.blvl) * 17","ApplyMastery":"1","Range":"10","MinELev1":"8","MinELev2":"12","MinELev3":"27","MinELev4":"43","MinELev5":"58","MaxELev1":"10","MaxELev2":"14","MaxELev3":"29","MaxELev4":"44","MaxELev5":"59","n":"boiwavetrail"},"ice":{"EType":"cold","EMin":"24","Emax":"32","HitShift":"8","EDmgSymPerCalc":"skill('Tiger Strike'.blvl) * 17","ApplyMastery":"1","Range":"35","MinELev1":"8","MinELev2":"13","MinELev3":"27","MinELev4":"33","MinELev5":"44","MaxELev1":"12","MaxELev2":"17","MaxELev3":"36","MaxELev4":"44","MaxELev5":"59","n":"boichaosice"}},"cobra":{"bolt":{"EType":"pois","EMin":"1","Emax":"4","HitShift":"5","EDmgSymPerCalc":"skill('Venom'.blvl) * 20","ApplyMastery":"1","Range":"28","MinELev1":"2","MinELev2":"6","MinELev3":"10","MinELev4":"25","MinELev5":"50","MaxELev1":"2","MaxELev2":"6","MaxELev3":"10","MaxELev4":"25","MaxELev5":"50","ELen":"25","n":"cobrastrikepoisonbolt"},"cloud":{"EType":"pois","EMin":"2","Emax":"6","HitShift":"5","EDmgSymPerCalc":"skill('Venom'.blvl) * 20","ApplyMastery":"1","Range":"18","MinELev1":"3","MinELev2":"8","MinELev3":"12","MinELev4":"30","MinELev5":"66","MaxELev1":"3","MaxELev2":"8","MaxELev3":"12","MaxELev4":"30","MaxELev5":"66","ELen":"25","n":"cobrastrikepoisoncloud"}},"fclaw":{"maker":"clawfirestormmaker","flame":{"EType":"fire","EMin":"5","Emax":"9","HitShift":"8","EDmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Armageddon'.blvl))*24","ApplyMastery":"1","Range":"12","MinELev1":"1","MinELev2":"3","MinELev3":"4","MinELev4":"5","MinELev5":"7","MaxELev1":"2","MaxELev2":"3","MaxELev3":"5","MaxELev4":"6","MaxELev5":"7","n":"clawfirestorm"}},"cot":{"nova":{"EType":"ltng","EMin":"5","Emax":"30","HitShift":"8","EDmgSymPerCalc":"skill('Dragon Claw'.blvl) * 16","ApplyMastery":"1","Range":"13","MinELev1":"5","MinELev2":"20","MinELev3":"35","MinELev4":"50","MinELev5":"65","MaxELev1":"10","MaxELev2":"30","MaxELev3":"50","MaxELev4":"70","MaxELev5":"90","n":"clawsofthundernova"},"bolt":{"EType":"ltng","EMin":"5","Emax":"20","HitShift":"8","EDmgSymPerCalc":"skill('Dragon Claw'.blvl) * 16","ApplyMastery":"1","Range":"32","MinELev1":"3","MinELev2":"5","MinELev3":"8","MinELev4":"10","MinELev5":"13","MaxELev1":"10","MaxELev2":"20","MaxELev3":"30","MaxELev4":"40","MaxELev5":"50","n":"clawsofthunderbolt"},"storm":{"EType":"ltng","EMin":"5","Emax":"20","HitShift":"8","EDmgSymPerCalc":"skill('Dragon Claw'.blvl) * 16","ApplyMastery":"1","Range":"9","MinELev1":"3","MinELev2":"5","MinELev3":"8","MinELev4":"10","MinELev5":"13","MaxELev1":"10","MaxELev2":"20","MaxELev3":"30","MaxELev4":"40","MaxELev5":"50","n":"cotthunderstorm"}},"phx":{"meteor":{"EType":"fire","EMin":"24","Emax":"48","HitShift":"8","EDmgSymPerCalc":"(skill('Fists of Fire'.blvl)) * 10","ApplyMastery":"1","Range":"15","MinELev1":"12","MinELev2":"23","MinELev3":"35","MinELev4":"46","MinELev5":"55","MaxELev1":"12","MaxELev2":"25","MaxELev3":"40","MaxELev4":"50","MaxELev5":"60","n":"royalstrikemeteor"},"mfire":{"EType":"fire","EMin":"6","Emax":"10","HitShift":"3","EDmgSymPerCalc":"(skill('Fists of Fire'.blvl)) * 10","ApplyMastery":"1","Range":"37","MinELev1":"5","MinELev2":"8","MinELev3":"11","MinELev4":"14","MinELev5":"17","MaxELev1":"6","MaxELev2":"9","MaxELev3":"12","MaxELev4":"15","MaxELev5":"18","n":"royalstrikemeteorfire"},"chain":{"EType":"ltng","EMin":"1","Emax":"60","HitShift":"8","EDmgSymPerCalc":"(skill('Claws of Thunder'.blvl))*10","ApplyMastery":"1","Range":"45","MinELev1":"0","MinELev2":"0","MinELev3":"0","MinELev4":"0","MinELev5":"0","MaxELev1":"40","MaxELev2":"70","MaxELev3":"100","MaxELev4":"130","MaxELev5":"160","n":"royalstrikechainlightning"},"ice":{"EType":"cold","EMin":"32","Emax":"64","HitShift":"8","EDmgSymPerCalc":"(skill('Blades of Ice'.blvl))*10","ApplyMastery":"1","Range":"50","MinELev1":"8","MinELev2":"16","MinELev3":"24","MinELev4":"40","MinELev5":"56","MaxELev1":"8","MaxELev2":"16","MaxELev3":"26","MaxELev4":"42","MaxELev5":"58","n":"royalstrikechaosice"}},"cast":{"cls":{"ama":[20,256,11],"ass":[17,256,9],"bar":[14,256,9],"dru":[15,208,8],"nec":[16,256,8],"pal":[16,256,9],"sor":[14,256,7],"wolf":[11,168,5],"bear":[10,152,5]},"seq":{"53":[19,7],"64":[19,7]},"cap":175,"chill":50},"ex":{"faflame":{"EType":"fire","EMin":"2","Emax":"3","HitShift":"3","EDmgSymPerCalc":"(skill('Immolation Arrow'.blvl)+skill('Magic Arrow'.blvl))*15","ApplyMastery":"1","Range":"50","MinELev1":"1","MinELev2":"3","MinELev3":"7","MinELev4":"14","MinELev5":"21","MaxELev1":"2","MaxELev2":"4","MaxELev3":"8","MaxELev4":"16","MaxELev5":"24","n":"firearrow firewall"},"imfire":{"EType":"fire","EMin":"10","Emax":"10","HitShift":"2","EDmgSymPerCalc":"(skill('Exploding Arrow'.blvl)+skill('Fire Arrow'.blvl)+skill('Magic Arrow'.blvl))*5","Range":"50","MinELev1":"5","MinELev2":"11","MinELev3":"17","MinELev4":"23","MinELev5":"29","MaxELev1":"6","MaxELev2":"12","MaxELev3":"18","MaxELev4":"24","MaxELev5":"30","n":"immolationarrow fire"},"psnova":{"EType":"ltng","EMin":"1","Emax":"3","HitShift":"8","EDmgSymPerCalc":"(skill('Lightning Strike'.blvl)*25) + (skill('Lightning Bolt'.blvl)*25)","ApplyMastery":"1","Range":"15","MinELev1":"0","MinELev2":"0","MinELev3":"0","MinELev4":"0","MinELev5":"0","MaxELev1":"4","MaxELev2":"8","MaxELev3":"28","MaxELev4":"45","MaxELev5":"62","n":"powerstrikenova2"},"fohbolt":{"EType":"mag","EMin":"10","Emax":"12","HitShift":"8","EDmgSymPerCalc":"(skill('Holy Bolt'.blvl) + skill('Holy Nova'.blvl) + skill('Holy Light'.blvl)) * 11","ApplyMastery":"1","Range":"25","MinELev1":"2","MinELev2":"5","MinELev3":"8","MinELev4":"14","MinELev5":"23","MaxELev1":"3","MaxELev2":"6","MaxELev3":"9","MaxELev4":"15","MaxELev5":"24","n":"fistoftheheavensbolt"},"orb":{"frames":45,"every":1,"ring":16,"reach":21.1},"blizz":{"frames":50,"r":4,"fall":9},"meteorfire":{"EType":"fire","EMin":"15","Emax":"20","HitShift":"2","EDmgSymPerCalc":"(skill('Fire Ball'.blvl) + skill('Inferno'.blvl) + skill('Blaze'.blvl))*6","ApplyMastery":"1","Range":"90","MinELev1":"2","MinELev2":"3","MinELev3":"4","MinELev4":"5","MinELev5":"6","MaxELev1":"2","MaxELev2":"3","MaxELev3":"4","MaxELev4":"5","MaxELev5":"6","n":"meteorfire","fall":15},"armfire":{"EType":"fire","EMin":"10","Emax":"14","HitShift":"2","EDmgSymPerCalc":"(skill('Molten Boulder'.blvl)+skill('Volcano'.blvl))*10 + (skill('Fire Claws'.blvl))*5","Range":"37","MinELev1":"6","MinELev2":"7","MinELev3":"8","MinELev4":"9","MinELev5":"10","MaxELev1":"6","MaxELev2":"7","MaxELev3":"8","MaxELev4":"9","MaxELev5":"10","n":"armageddonfire","r":6},"tsnova":{"EType":"ltng","EMin":"1","Emax":"100","HitShift":"8","EDmgSymPerCalc":"(skill('Charged Bolt'.blvl) + skill('Nova'.blvl)) * 8","ApplyMastery":"1","Range":"15","MinELev1":"2","MinELev2":"3","MinELev3":"4","MinELev4":"5","MinELev5":"6","MaxELev1":"4","MaxELev2":"5","MaxELev3":"6","MaxELev4":"7","MaxELev5":"8","n":"thunderstormnova"},"fwall":{"frames":75},"blaze":{"EType":"fire","EMin":"1","Emax":"2","HitShift":"4","EDmgSymPerCalc":"(skill('Fire Wall'.blvl))*6","ApplyMastery":"1","Range":"1","MinELev1":"1","MinELev2":"1","MinELev3":"5","MinELev4":"8","MinELev5":"8","MaxELev1":"1","MaxELev2":"2","MaxELev3":"6","MaxELev4":"9","MaxELev5":"9","n":"blaze2ignite","r":5,"disc":4,"frames":35},"boulder":{"EType":"fire","EMin":"2","Emax":"4","HitShift":"2","EDmgSymPerCalc":"(skill('Volcano'.blvl)+skill('Eruption'.blvl)+skill('Armageddon'.blvl))*12","Range":"37","MinELev1":"1","MinELev2":"2","MinELev3":"6","MinELev4":"10","MinELev5":"12","MaxELev1":"1","MaxELev2":"2","MaxELev3":"6","MaxELev4":"10","MaxELev5":"12","n":"moltenboulderfirepath","frames":85,"lev":-1,"vel":8,"path":37},"volcano":{"frames":150,"lock":7,"lo":2,"hi":128,"fire":18,"flock":5},"fissure":{"frames":55,"crack":84},"fblast":{"r":4},"sweb":{"frames":90},"sent":{"vel":24,"aidel":5,"next":5,"size":3,"life":50,"first":6,"gate":12,"burst":75},"heads":{"62":{"heads":3,"life":125,"petmax":9,"keep":42,"shots":3.237,"swing":12,"aidel":15},"383":{"heads":3,"life":125,"petmax":9,"keep":42,"shots":3.237,"swing":12,"aidel":15}},"traps":{"366":{"mon":392,"petmax":5,"spawn":15,"aidel":13,"swing":15,"flames":0,"range":25},"271":{"mon":313,"petmax":5,"spawn":15,"aidel":14,"swing":15,"flames":0,"range":25},"261":{"mon":306,"petmax":5,"spawn":15,"aidel":15,"swing":15,"flames":0,"range":25},"262":{"mon":281,"petmax":5,"spawn":15,"aidel":15,"swing":2,"flames":0,"range":15},"272":{"mon":311,"petmax":5,"spawn":15,"aidel":15,"swing":41,"flames":7,"range":13},"276":{"mon":312,"petmax":5,"spawn":15,"aidel":15,"swing":15,"flames":0,"range":16}}},"types":{"weap":["1han","2han","2hcs","2hsw","abow","ajav","aspe","axe","blun","bow","club","comb","crys","h2h","h2h2","hamm","jave","knif","mace","mele","mgen","miss","orb","pole","rod","sc9","scep","spea","staf","swor","taxe","thro","tkni","tpot","wand","weap","xbow"],"miss":["abow","bow","miss","xbow"],"thro":["ajav","comb","jave","taxe","thro","tkni","tpot"],"h2h":["h2h","h2h2"],"asm":["asm","assn","cloa","h2h","h2h2","knif","tkni"],"mele":["2hcs","2hsw","ajav","aspe","axe","blun","club","comb","h2h","h2h2","hamm","jave","knif","mace","mele","mgen","pole","rod","sc9","scep","spea","staf","swor","taxe","tkni","wand"]}};
  /* calc-data:end */
  // Attack speed: the IAS Calculator's engine and the part of its data it reads, copied from
  // website/resources/IAS-Calculator.html by tools/ias_data.py --sync (edit the engine there)
  /* ias-data:start */
  const IAS_DATA = {"v":"2026-11-27","cls":[["ama","Amazon","AM"],["sor","Sorceress","SO"],["nec","Necromancer","NE"],["pal","Paladin","PA"],["bar","Barbarian","BA"],["dru","Druid","DZ"],["ass","Assassin","AI"]],"fb":{"ama":{"hth":1,"1hs":2,"1ht":2,"stf":2,"2hs":2,"2ht":2,"bow":0,"xbw":0,"ht1":0},"sor":{"hth":1,"1hs":2,"1ht":2,"stf":2,"2hs":2,"2ht":2,"bow":0,"xbw":0,"ht1":0}},"a":{"40A1HTH":[13,256,[7]],"40A2HTH":[13,256,[7]],"40NUHTH":[9,144,[]],"40RNHTH":[8,104,[]],"40S1HTH":[16,256,[]],"40S3HTH":[10,240,[6]],"40S4HTH":[7,152,[4]],"AIA11HS":[15,256,[7]],"AIA11HT":[15,256,[7]],"AIA12HS":[23,256,[11]],"AIA12HT":[23,256,[10]],"AIA1BOW":[16,256,[7]],"AIA1HT1":[11,208,[6]],"AIA1HT2":[11,208,[6]],"AIA1HTH":[11,256,[6]],"AIA1STF":[19,256,[9]],"AIA1XBW":[21,294,[10]],"AIA21HS":[15,256,[7]],"AIA21HT":[15,256,[7]],"AIA22HS":[23,256,[11]],"AIA22HT":[23,256,[10]],"AIA2HT1":[12,208,[6]],"AIA2HT2":[12,208,[6]],"AIA2HTH":[12,256,[6]],"AIA2STF":[19,256,[9]],"AIKK1HS":[13,256,[4]],"AIKK1HT":[13,256,[4]],"AIKK2HS":[13,256,[4]],"AIKK2HT":[13,256,[4]],"AIKKBOW":[13,256,[4]],"AIKKHT1":[13,256,[4]],"AIKKHT2":[13,256,[4]],"AIKKHTH":[13,256,[4]],"AIKKSTF":[13,256,[4]],"AIKKXBW":[13,256,[4]],"AINU1HS":[8,128,[]],"AINU1HT":[8,128,[]],"AINU2HS":[8,128,[]],"AINU2HT":[8,128,[]],"AINUBOW":[8,128,[]],"AINUHT1":[8,128,[]],"AINUHT2":[8,128,[]],"AINUHTH":[8,128,[]],"AINUSTF":[8,128,[]],"AINUXBW":[8,128,[]],"AIRN1HS":[8,256,[]],"AIRN1HT":[8,256,[]],"AIRN2HS":[8,256,[]],"AIRN2HT":[8,256,[]],"AIRNBOW":[8,256,[]],"AIRNHT1":[8,256,[]],"AIRNHT2":[8,256,[]],"AIRNHTH":[8,256,[]],"AIRNSTF":[8,256,[]],"AIRNXBW":[8,256,[]],"AIS11HS":[15,256,[10]],"AIS11HT":[15,256,[10]],"AIS12HS":[15,256,[10]],"AIS12HT":[15,256,[10]],"AIS1BOW":[15,256,[10]],"AIS1HT1":[17,256,[10]],"AIS1HT2":[15,256,[10]],"AIS1HTH":[17,256,[10]],"AIS1STF":[15,256,[10]],"AIS1XBW":[15,256,[10]],"AIS21HS":[8,128,[4]],"AIS21HT":[8,128,[4]],"AIS22HS":[8,128,[4]],"AIS22HT":[8,128,[4]],"AIS2BOW":[8,128,[4]],"AIS2HT1":[8,128,[4]],"AIS2HT2":[8,128,[4]],"AIS2HTH":[8,128,[4]],"AIS2STF":[8,128,[4]],"AIS2XBW":[8,128,[4]],"AIS31HS":[10,256,[]],"AIS31HT":[10,256,[]],"AIS32HS":[10,256,[]],"AIS32HT":[10,256,[]],"AIS3BOW":[10,256,[]],"AIS3HT1":[10,256,[]],"AIS3HT2":[10,256,[]],"AIS3HTH":[10,256,[]],"AIS3STF":[10,256,[]],"AIS3XBW":[10,256,[]],"AIS4HT1":[12,208,[6]],"AIS4HT2":[12,208,[6]],"AITH1HS":[16,256,[7]],"AITH1HT":[16,256,[7]],"AMA11HS":[16,256,[10]],"AMA11HT":[15,256,[9]],"AMA12HS":[20,256,[12]],"AMA12HT":[18,256,[11]],"AMA1BOW":[14,256,[6]],"AMA1HTH":[13,256,[8]],"AMA1STF":[20,256,[12]],"AMA1XBW":[20,294,[9]],"AMA21HS":[16,256,[10]],"AMA21HT":[15,256,[9]],"AMA22HS":[20,256,[12]],"AMA22HT":[18,256,[11]],"AMA2HTH":[13,256,[8]],"AMA2STF":[20,256,[12]],"AMKK1HS":[12,256,[5]],"AMKK1HT":[12,256,[5]],"AMKK2HS":[12,256,[5]],"AMKK2HT":[12,256,[5]],"AMKKBOW":[12,256,[5]],"AMKKHTH":[12,256,[5]],"AMKKSTF":[12,256,[5]],"AMKKXBW":[12,256,[5]],"AMNU1HS":[8,128,[]],"AMNU1HT":[8,128,[]],"AMNU2HS":[8,128,[]],"AMNU2HT":[8,128,[]],"AMNUBOW":[8,128,[]],"AMNUHTH":[8,128,[]],"AMNUSTF":[8,128,[]],"AMNUXBW":[8,128,[]],"AMRN1HS":[8,256,[]],"AMRN1HT":[8,256,[]],"AMRN2HS":[8,256,[]],"AMRN2HT":[8,256,[]],"AMRNBOW":[8,256,[]],"AMRNHTH":[8,256,[]],"AMRNSTF":[8,256,[]],"AMRNXBW":[8,256,[]],"AMS11HS":[9,256,[]],"AMS11HT":[9,256,[]],"AMS12HS":[9,256,[2]],"AMS12HT":[9,256,[2]],"AMS1BOW":[9,256,[2]],"AMS1HTH":[9,256,[2]],"AMS1STF":[9,256,[2]],"AMS1XBW":[9,256,[]],"AMTH1HS":[16,256,[9]],"AMTH1HT":[16,256,[9]],"AMTHHTH":[16,256,[9]],"BAA11HS":[16,256,[7]],"BAA11HT":[16,256,[7]],"BAA11JS":[16,256,[7]],"BAA11JT":[16,256,[7]],"BAA11SS":[16,256,[7]],"BAA11ST":[16,256,[7]],"BAA12HS":[18,256,[8]],"BAA12HT":[19,256,[9]],"BAA1BOW":[15,256,[7]],"BAA1HTH":[12,256,[6]],"BAA1STF":[19,256,[9]],"BAA1XBW":[20,294,[10]],"BAA21HS":[16,256,[7]],"BAA21HT":[16,256,[7]],"BAA21JS":[16,256,[8]],"BAA21JT":[16,256,[7]],"BAA21SS":[16,256,[7]],"BAA21ST":[16,256,[7]],"BAA22HS":[18,256,[8]],"BAA22HT":[19,256,[9]],"BAA2STF":[19,256,[9]],"BAKK1HS":[12,256,[4]],"BAKK1HT":[12,256,[4]],"BAKK1JS":[12,256,[4]],"BAKK1JT":[12,256,[4]],"BAKK1SS":[12,256,[4]],"BAKK1ST":[12,256,[4]],"BAKK2HS":[12,256,[4]],"BAKK2HT":[12,256,[4]],"BAKKBOW":[12,256,[4]],"BAKKHTH":[12,256,[4]],"BAKKSTF":[12,256,[4]],"BAKKXBW":[12,256,[4]],"BANU1HS":[8,96,[]],"BANU1HT":[8,96,[]],"BANU1JS":[8,96,[]],"BANU1JT":[8,96,[]],"BANU1SS":[8,96,[]],"BANU1ST":[8,96,[]],"BANU2HS":[8,96,[]],"BANU2HT":[8,96,[]],"BANUBOW":[8,96,[]],"BANUHTH":[8,96,[]],"BANUSTF":[8,96,[]],"BANUXBW":[8,96,[]],"BARN1HS":[8,216,[]],"BARN1HT":[8,216,[]],"BARN1JS":[8,216,[]],"BARN1JT":[8,216,[]],"BARN1SS":[8,216,[]],"BARN1ST":[8,216,[]],"BARN2HS":[8,216,[]],"BARN2HT":[8,216,[]],"BARNBOW":[8,256,[]],"BARNHTH":[8,216,[]],"BARNSTF":[8,216,[]],"BARNXBW":[8,216,[]],"BAS11HS":[15,256,[]],"BAS11HT":[15,256,[]],"BAS11JS":[15,256,[]],"BAS11JT":[15,256,[]],"BAS11SS":[15,256,[]],"BAS11ST":[15,256,[]],"BAS12HS":[15,256,[]],"BAS12HT":[15,256,[]],"BAS1BOW":[15,256,[]],"BAS1HTH":[15,256,[]],"BAS1STF":[15,256,[]],"BAS1XBW":[15,256,[]],"BAS21HT":[14,256,[9]],"BAS31JS":[12,256,[8]],"BAS31JT":[12,256,[8]],"BAS31SS":[12,256,[7]],"BAS31ST":[12,256,[7]],"BAS41JS":[16,256,[8]],"BAS41JT":[16,256,[8]],"BAS41SS":[16,256,[9]],"BAS41ST":[16,256,[9]],"BATH1HS":[16,256,[8]],"BATH1HT":[16,256,[8]],"BATH1JS":[16,256,[8]],"BATH1JT":[16,256,[8]],"BATH1SS":[16,256,[8]],"BATH1ST":[16,256,[8]],"BATHHTH":[16,256,[8]],"DZA11HS":[19,256,[9]],"DZA11HT":[19,256,[8]],"DZA12HS":[21,256,[10]],"DZA12HT":[23,256,[9]],"DZA1BOW":[16,256,[8]],"DZA1HTH":[16,256,[8]],"DZA1STF":[17,256,[9]],"DZA1XBW":[20,282,[10]],"DZA21HS":[19,256,[9]],"DZA21HT":[19,256,[8]],"DZA22HS":[21,256,[10]],"DZA22HT":[23,256,[9]],"DZA2STF":[17,256,[9]],"DZKK1HS":[12,224,[5]],"DZKK1HT":[12,256,[5]],"DZKK2HS":[12,224,[5]],"DZKK2HT":[12,256,[5]],"DZKKBOW":[12,256,[5]],"DZKKHTH":[12,256,[5]],"DZKKSTF":[12,256,[5]],"DZKKXBW":[12,256,[5]],"DZNU1HS":[6,120,[]],"DZNU1HT":[6,120,[]],"DZNU2HS":[6,120,[]],"DZNU2HT":[6,120,[]],"DZNUBOW":[6,120,[]],"DZNUHTH":[6,120,[]],"DZNUSTF":[6,120,[]],"DZNUXBW":[6,120,[]],"DZRN1HS":[8,168,[]],"DZRN1HT":[8,168,[]],"DZRN2HS":[8,168,[]],"DZRN2HT":[8,168,[]],"DZRNBOW":[8,168,[]],"DZRNHTH":[8,168,[]],"DZRNSTF":[8,168,[]],"DZRNXBW":[8,168,[]],"DZS11HS":[15,256,[9]],"DZS11HT":[15,256,[8]],"DZS12HS":[15,208,[8]],"DZS12HT":[15,208,[8]],"DZS1BOW":[15,208,[8]],"DZS1HTH":[15,256,[8]],"DZS1STF":[15,208,[8]],"DZS1XBW":[15,256,[8]],"DZTH1HS":[18,256,[8]],"DZTH1HT":[18,256,[8]],"DZTHHTH":[18,256,[9]],"NEA11HS":[19,256,[9]],"NEA11HT":[19,256,[9]],"NEA12HS":[23,256,[11]],"NEA12HT":[24,256,[10]],"NEA1BOW":[18,256,[9]],"NEA1HTH":[15,256,[8]],"NEA1STF":[20,256,[11]],"NEA1XBW":[20,282,[11]],"NEA21HS":[19,256,[9]],"NEA21HT":[19,256,[9]],"NEA22HS":[23,256,[11]],"NEA22HT":[24,256,[10]],"NEA2HTH":[15,256,[8]],"NEA2STF":[20,256,[11]],"NEKK1HS":[12,256,[6]],"NEKK1HT":[12,256,[6]],"NEKK2HS":[12,256,[6]],"NEKK2HT":[12,256,[6]],"NEKKBOW":[12,256,[6]],"NEKKHTH":[12,256,[6]],"NEKKSTF":[12,256,[6]],"NEKKXBW":[12,256,[6]],"NENU1HS":[8,128,[]],"NENU1HT":[8,128,[]],"NENU2HS":[8,128,[]],"NENU2HT":[8,128,[]],"NENUBOW":[8,128,[]],"NENUHTH":[8,128,[]],"NENUSTF":[8,128,[]],"NENUXBW":[8,128,[]],"NERN1HS":[8,256,[]],"NERN1HT":[8,256,[]],"NERN2HS":[8,256,[]],"NERN2HT":[8,256,[]],"NERNBOW":[8,256,[]],"NERNHTH":[8,256,[]],"NERNSTF":[8,256,[]],"NERNXBW":[8,256,[]],"NES11HS":[16,256,[8]],"NES11HT":[16,256,[8]],"NES12HS":[16,256,[8]],"NES12HT":[16,256,[8]],"NES1BOW":[16,256,[8]],"NES1HTH":[16,256,[8]],"NES1STF":[16,256,[8]],"NES1XBW":[16,256,[8]],"NETH1HS":[20,256,[10]],"NETH1HT":[20,256,[10]],"NETHHTH":[20,256,[10]],"PAA11HS":[15,256,[7]],"PAA11HT":[17,256,[8]],"PAA12HS":[18,256,[8]],"PAA12HT":[20,256,[8]],"PAA1BOW":[16,256,[8]],"PAA1HTH":[14,256,[7]],"PAA1STF":[18,256,[9]],"PAA1XBW":[20,282,[10]],"PAA21HS":[15,256,[7]],"PAA21HT":[17,256,[8]],"PAA22HS":[19,256,[8]],"PAA22HT":[20,256,[9]],"PAA2HTH":[14,256,[7]],"PAA2STF":[18,256,[9]],"PAKK1HS":[12,256,[5]],"PAKK1HT":[12,256,[5]],"PAKK2HS":[12,256,[5]],"PAKK2HT":[12,256,[5]],"PAKKBOW":[12,256,[5]],"PAKKHTH":[12,256,[5]],"PAKKSTF":[12,256,[5]],"PAKKXBW":[12,256,[5]],"PANU1HS":[8,128,[]],"PANU1HT":[8,184,[]],"PANU2HS":[8,184,[]],"PANU2HT":[8,184,[]],"PANUBOW":[8,184,[]],"PANUHTH":[8,184,[]],"PANUSTF":[8,184,[]],"PANUXBW":[8,128,[]],"PARN1HS":[8,256,[]],"PARN1HT":[8,256,[]],"PARN2HS":[8,184,[]],"PARN2HT":[8,184,[]],"PARNBOW":[8,184,[]],"PARNHTH":[8,256,[]],"PARNSTF":[8,184,[]],"PARNXBW":[8,256,[]],"PAS11HS":[12,256,[7]],"PAS11HT":[12,256,[7]],"PAS1HTH":[12,256,[7]],"PATH1HS":[16,256,[8]],"PATH1HT":[16,256,[8]],"PATHHTH":[12,256,[6]],"SOA11HS":[20,256,[12]],"SOA11HT":[19,256,[11]],"SOA12HS":[24,256,[14]],"SOA12HT":[23,256,[13]],"SOA1BOW":[17,256,[9]],"SOA1HTH":[16,256,[9]],"SOA1STF":[18,256,[11]],"SOA1XBW":[20,282,[11]],"SOA21HS":[20,256,[12]],"SOA21HT":[19,256,[11]],"SOA22HS":[24,256,[14]],"SOA22HT":[23,256,[13]],"SOA2HTH":[16,256,[8]],"SOA2STF":[18,256,[11]],"SOKK1HS":[12,256,[6]],"SOKK1HT":[12,256,[6]],"SOKK2HS":[12,256,[6]],"SOKK2HT":[12,256,[6]],"SOKKBOW":[12,256,[6]],"SOKKHTH":[12,256,[6]],"SOKKSTF":[12,256,[6]],"SOKKXBW":[12,256,[6]],"SONU1HS":[8,128,[]],"SONU1HT":[8,128,[]],"SONU2HS":[8,128,[]],"SONU2HT":[8,128,[]],"SONUBOW":[8,128,[]],"SONUHTH":[8,128,[]],"SONUSTF":[8,128,[]],"SONUXBW":[8,128,[]],"SORN1HS":[8,256,[]],"SORN1HT":[8,256,[]],"SORN2HS":[8,256,[]],"SORN2HT":[8,256,[]],"SORNBOW":[8,256,[]],"SORNHTH":[8,256,[]],"SORNSTF":[8,256,[]],"SORNXBW":[8,256,[]],"SOS11HS":[14,256,[7]],"SOS11HT":[14,256,[7]],"SOS12HS":[14,256,[7]],"SOS12HT":[14,256,[7]],"SOS1BOW":[14,256,[7]],"SOS1HTH":[14,256,[7]],"SOS1STF":[14,256,[7]],"SOS1XBW":[14,256,[7]],"SOTH1HS":[20,256,[10]],"SOTH1HT":[20,256,[10]],"SOTHHTH":[20,256,[10]],"TGA1HTH":[12,224,[7]],"TGA2HTH":[12,224,[7]],"TGNUHTH":[10,136,[]],"TGRNHTH":[8,120,[]],"TGS1HTH":[16,256,[]],"TGS3HTH":[10,208,[6]],"TGS4HTH":[7,152,[4]],"RGA1HTH":[15,256,[6]],"GUA1HTH":[16,256,[11]],"0AA12HS":[16,256,[5,12]],"0AA22HS":[16,256,[6,12]]},"types":{"shie":["shld"],"shld":["armo","seco"],"seco":[],"armo":[],"2han":["weap"],"weap":[],"2hcs":["2hsw","pala"],"pala":["clas"],"clas":[],"2hsw":["swor","2han"],"swor":["mgen"],"mgen":["mele","gen"],"gen":[],"mele":["weap"],"1han":["weap"],"ajav":["jave","amaz"],"amaz":["clas"],"jave":["comb","spea"],"spea":["mele","pas"],"pas":[],"comb":["mele","thro"],"thro":["weap","rng"],"rng":[],"aspe":["spea","amaz"],"abow":["bow","amaz"],"bow":["miss","rng"],"miss":["weap","rng"],"orb":["weap","sorc"],"sorc":["clas"],"xbow":["miss","rng"],"staf":["rod"],"rod":["blun"],"blun":["mgen"],"sc9":["pole"],"pole":["mele","pas"],"taxe":["comb","axe"],"axe":["mgen"],"tkni":["comb","knif"],"knif":["mgen","asm"],"asm":[],"crys":["1han"],"hamm":["blun"],"mace":["blun"],"club":["blun"],"scep":["rod","gen"],"wand":["rod"],"h2h2":["h2h"],"h2h":["mele","assn"],"assn":["clas","asm"]},"tcls":{"2hcs":"pal","pala":"pal","ajav":"ama","amaz":"ama","aspe":"ama","abow":"ama","orb":"sor","sorc":"sor","asm":"ass","h2h2":"ass","h2h":"ass","assn":"ass"},"b":[{"c":"hax","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"axe","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"2ax","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"mpi","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"wax","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"lax","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"bax","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"btx","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"gax","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"gix","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"wnd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"ywn","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"bwn","w":-20,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"gwn","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"clb","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"scp","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"gsc","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"wsp","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"spc","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"mac","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"mst","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"fla","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"whm","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["hamm","1han"]},{"c":"mau","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"gma","w":20,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"ssd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"scm","w":-20,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"sbr","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"flc","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"crs","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","crys"]},{"c":"bsd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"lsd","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"wsd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"2hs","w":0,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"clm","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"gis","w":0,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"bsw","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"flb","w":-10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"gsd","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"dgr","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"dir","w":0,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"kri","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"bld","w":-10,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"tkf","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"tax","w":10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"bkf","w":-20,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"bal","w":-10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"jav","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"pil","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"ssp","w":10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"glv","w":20,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"tsp","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"spr","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"tri","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"brn","w":-20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"spt","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"pik","w":20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"bar","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"vou","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"scy","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"pax","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"hal","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"wsc","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"sst","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"lst","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"cst","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"bst","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"wst","w":20,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"sbw","w":5,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"hbw","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"lbw","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"cbw","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"sbb","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"lbb","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"swb","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"lwb","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"lxb","w":-10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"mxb","w":0,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"hxb","w":10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"rxb","w":-40,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"g33","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"leg","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"hdm","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["hamm","1han"]},{"c":"hfh","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["hamm","1han"]},{"c":"hst","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"msf","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"9ha","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"9ax","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"92a","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"9mp","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"9wa","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"9la","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"9ba","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"9bt","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"9ga","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"9gi","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"9wn","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"9yw","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"9bw","w":-20,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"9gw","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"9cl","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"9sc","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"9qs","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"9ws","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"9sp","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"9ma","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"9mt","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"9fl","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"9wh","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["hamm","1han"]},{"c":"9m9","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"9gm","w":20,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"9ss","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9sm","w":-30,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9sb","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9fc","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9cr","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","crys"]},{"c":"9bs","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9ls","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"9wd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"92h","w":0,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9cm","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9gs","w":0,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9b9","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9fb","w":-10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9gd","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"9dg","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"9di","w":0,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"9kr","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"9bl","w":-10,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"9tk","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"9ta","w":10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"9bk","w":-20,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"9b8","w":-10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"9ja","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"9pi","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"9s9","w":10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"9gl","w":20,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"9ts","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"9sr","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"9tr","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"9br","w":-20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"9st","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"9p9","w":20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"9b7","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"9vo","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"9s8","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"9pa","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"9h9","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"9wc","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"8ss","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"8ls","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"8cs","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"8bs","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"8ws","w":20,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"8sb","w":5,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8hb","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8lb","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8cb","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8s8","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8l8","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8sw","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8lw","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"8lx","w":-10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"8mx","w":0,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"8hx","w":10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"8rx","w":-60,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"qf1","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"qf2","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"ktr","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"wrb","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"axf","w":10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"ces","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"clw","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"btl","w":-20,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"skr","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"9ar","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"9wb","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"9xf","w":10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h","1han"]},{"c":"9cs","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"9lw","w":-20,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"9tw","w":-30,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"9qr","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7ar","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7wb","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7xf","w":10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7cs","w":-10,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7lw","w":-20,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7tw","w":-30,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7qr","w":0,"wc":"ht1","wc2":"ht1","f":0,"ty":["h2h2","1han"]},{"c":"7ha","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"7ax","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"72a","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"7mp","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"7wa","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["axe","1han"]},{"c":"7la","w":-15,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"7ba","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"7bt","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"7ga","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"7gi","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["axe","2han"]},{"c":"7wn","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"7yw","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"7bw","w":-20,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"7gw","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["wand","1han"]},{"c":"7cl","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"7sc","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"7qs","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"7ws","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["scep","1han"]},{"c":"7sp","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["club","1han"]},{"c":"7ma","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"7mt","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"7fl","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["mace","1han"]},{"c":"7wh","w":20,"wc":"1hs","wc2":"1hs","f":0,"ty":["hamm","1han"]},{"c":"7m7","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"7gm","w":20,"wc":"stf","wc2":"stf","f":2,"ty":["hamm","2han"]},{"c":"7ss","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7sm","w":-20,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7sb","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7fc","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7cr","w":-30,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","crys"]},{"c":"7bs","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7ls","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"7wd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["swor","1han"]},{"c":"72h","w":-15,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7cm","w":-5,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7gs","w":0,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7b7","w":-10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7fb","w":10,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7gd","w":5,"wc":"1hs","wc2":"2hs","f":3,"ty":["swor","2hsw"]},{"c":"7dg","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"7di","w":0,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"7kr","w":-20,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"7bl","w":-10,"wc":"1ht","wc2":"1ht","f":0,"ty":["knif","1han"]},{"c":"7tk","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"7ta","w":10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"7bk","w":-20,"wc":"1ht","wc2":"1ht","f":4,"ty":["tkni","1han"]},{"c":"7b8","w":-10,"wc":"1hs","wc2":"1hs","f":4,"ty":["taxe","1han"]},{"c":"7ja","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"7pi","w":0,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"7s7","w":10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"7gl","w":20,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"7ts","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["jave","1han"]},{"c":"7sr","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"7tr","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"7br","w":-20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"7st","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"7p7","w":20,"wc":"2ht","wc2":"2ht","f":2,"ty":["spea","2han"]},{"c":"7o7","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"7vo","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"7s8","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"7pa","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"7h7","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["pole","2han"]},{"c":"7wc","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["sc9","2han"]},{"c":"6ss","w":-10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"6ls","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"6cs","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"6bs","w":0,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"6ws","w":10,"wc":"stf","wc2":"stf","f":2,"ty":["staf","2han"]},{"c":"6sb","w":5,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6hb","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6lb","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6cb","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6s7","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6l7","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6sw","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6lw","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["bow"]},{"c":"6lx","w":-10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"6mx","w":0,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"6hx","w":10,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"6rx","w":-60,"wc":"xbw","wc2":"xbw","f":2,"ty":["xbow"]},{"c":"ob1","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob2","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob3","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob4","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob5","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"am1","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"am2","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"am3","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"am4","w":0,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"am5","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["ajav","1han"]},{"c":"ob6","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob7","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob8","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"ob9","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"oba","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"am6","w":0,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"am7","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"am8","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"am9","w":10,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"ama","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["ajav","1han"]},{"c":"obb","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"obc","w":-10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"obd","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"obe","w":0,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"obf","w":10,"wc":"1hs","wc2":"1hs","f":0,"ty":["orb"]},{"c":"amb","w":-10,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"amc","w":10,"wc":"bow","wc2":"bow","f":2,"ty":["abow"]},{"c":"amd","w":-10,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"ame","w":10,"wc":"2ht","wc2":"2ht","f":2,"ty":["aspe","2han"]},{"c":"amf","w":-10,"wc":"1ht","wc2":"1ht","f":4,"ty":["ajav","1han"]},{"c":"7cr2","w":-30,"wc":"2hs","wc2":"2hs","f":2,"ty":["2hcs","2han"]}],"sk":[{"id":2,"n":"Throw","c":"","m":"TH","q":0,"ia":["thro"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":6,"n":"Magic Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","magicarrow","",""]},{"id":7,"n":"Fire Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","firearrow","",""]},{"id":10,"n":"Jab","c":"ama","m":"SQ","q":1,"tb":"Javelin and Spear","ia":["spea"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":11,"n":"Cold Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","coldarrow","",""]},{"id":12,"n":"Multiple Shot","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","multipleshotarrow","multipleshotbolt",""],"mc":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25]},{"id":14,"n":"Power Strike","c":"ama","m":"A1","q":0,"tb":"Javelin and Spear","ia":["spea"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":15,"n":"Poison Javelin","c":"ama","m":"TH","q":0,"tb":"Javelin and Spear","ia":["jave"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["poisonjav","","",""]},{"id":16,"n":"Exploding Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["explodingarrow","","",""]},{"id":20,"n":"Lightning Bolt","c":"ama","m":"TH","q":0,"tb":"Javelin and Spear","ia":["jave"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","lightningjavelin","",""]},{"id":21,"n":"Ice Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["icearrow","","",""]},{"id":22,"n":"Guided Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","guidedarrow","guidedarrow","guidedarrow"]},{"id":24,"n":"Charged Strike","c":"ama","m":"A1","q":0,"tb":"Javelin and Spear","ia":["spea"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":25,"n":"Plague Javelin","c":"ama","m":"TH","q":0,"tb":"Javelin and Spear","ia":["jave"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["plaguejavelin","","",""],"cd":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25]},{"id":26,"n":"Strafe","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"rb":50,"hits":[2,3,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],"hmin":[2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],"msl":["","strafearrow","strafebolt",""]},{"id":27,"n":"Immolation Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["immolationarrow","","",""]},{"id":30,"n":"Fend","c":"ama","m":"A1","q":0,"tb":"Javelin and Spear","ia":["spea"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"rb":60,"hits":[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]},{"id":31,"n":"Freezing Arrow","c":"ama","m":"A1","q":0,"tb":"Bow and Crossbow","ia":["miss"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["freezingarrow","","",""]},{"id":34,"n":"Lightning Strike","c":"ama","m":"A1","q":0,"tb":"Javelin and Spear","ia":["spea"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":35,"n":"Lightning Fury","c":"ama","m":"TH","q":0,"tb":"Javelin and Spear","ia":["jave"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","lightningfury","",""]},{"id":73,"n":"Poison Strike","c":"nec","m":"A1","q":0,"tb":"Poison and Bone","ia":["knif","sc9"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":96,"n":"Sacrifice","c":"pal","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":97,"n":"Smite","c":"pal","m":"S1","q":0,"tb":"Combat","ia":["shld"],"ea":[],"ib":[],"eb":[],"ws":4,"fm":["human"]},{"id":106,"n":"Zeal","c":"pal","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"rb":100,"hits":[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]},{"id":107,"n":"Charge","c":"pal","m":"SQ","q":4,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"chg":65},{"id":111,"n":"Vengeance","c":"pal","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":126,"n":"Bash","c":"bar","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":133,"n":"Double Swing","c":"bar","m":"SQ","q":11,"tb":"Combat","ia":["mele"],"ea":[],"ib":["mele"],"eb":[],"ws":3,"fm":["human"],"ar":50},{"id":139,"n":"Stun","c":"bar","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":140,"n":"Double Throw","c":"bar","m":"SQ","q":15,"tb":"Combat","ia":["comb"],"ea":[],"ib":["comb"],"eb":[],"ws":3,"fm":["human"],"msl":["","doublethrowaxe","doublethrowknife","doublethrowjav"]},{"id":144,"n":"Concentrate","c":"bar","m":"A1","q":0,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":147,"n":"Frenzy","c":"bar","m":"SQ","q":11,"tb":"Combat","ia":["mele"],"ea":[],"ib":["mele"],"eb":[],"ws":3,"fm":["human"]},{"id":151,"n":"Whirlwind","c":"bar","m":"SQ","q":10,"tb":"Combat","ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":2,"fm":["human"],"ff":6},{"id":152,"n":"Berserk","c":"bar","m":"SQ","q":11,"tb":"Combat","ia":["mele"],"ea":[],"ib":["mele"],"eb":[],"ws":3,"fm":["human"]},{"id":232,"n":"Feral Rage","c":"dru","m":"A1","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["wolf"],"rh":1},{"id":233,"n":"Maul","c":"dru","m":"A1","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["bear"]},{"id":238,"n":"Rabies","c":"dru","m":"S3","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["wolf"]},{"id":239,"n":"Fire Claws","c":"dru","m":"A1","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["wolf","bear"],"rs":1},{"id":242,"n":"Hunger","c":"dru","m":"S3","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["bear"]},{"id":248,"n":"Fury","c":"dru","m":"A1","q":0,"tb":"Shape Shifting","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["wolf"],"re":1,"rb":100,"hits":[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]},{"id":251,"n":"Fire Blast","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","bomb in air","",""],"bomb":[[1,1],[1,1],[2,2],[2,2],[2,2],[3,2],[3,2],[3,2],[4,3],[4,3],[4,3],[5,3],[5,3],[5,3],[6,4],[6,4],[6,4],[7,4],[7,4],[7,4],[8,4],[8,4],[8,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4],[9,4]],"bh":1},{"id":254,"n":"Tiger Strike","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":3,"fm":["human"]},{"id":255,"n":"Dragon Talon","c":"ass","m":"KK","q":0,"tb":"Martial Arts","ia":[],"ea":[],"ib":[],"eb":[],"ws":4,"fm":["human"],"rb":100,"hits":[1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]},{"id":256,"n":"Shock Web","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","shock field in air","",""],"bomb":[[4,2],[4,2],[5,2],[5,2],[5,2],[6,3],[6,3],[6,3],[7,3],[7,3],[7,3],[8,3],[8,3],[8,3],[9,4],[9,4],[9,4],[10,4],[10,4],[10,4],[11,4],[11,4],[11,4],[12,5],[12,5],[12,5],[13,5],[13,5],[13,5],[14,5],[14,5],[14,5],[15,6],[15,6],[15,6],[16,6],[16,6],[16,6],[17,6],[17,6],[17,6],[18,7],[18,7],[18,7],[19,7],[19,7],[19,7],[20,7],[20,7],[20,7],[21,8],[21,8],[21,8],[22,8],[22,8],[22,8],[23,8],[23,8],[23,8],[24,9]],"cd":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25]},{"id":257,"n":"Blade Sentinel","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":259,"n":"Fists of Fire","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":3,"fm":["human"]},{"id":260,"n":"Dragon Claw","c":"ass","m":"SQ","q":16,"tb":"Martial Arts","ia":["h2h"],"ea":[],"ib":["h2h"],"eb":[],"ws":3,"fm":["human"]},{"id":261,"n":"Charged Bolt Sentry","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":262,"n":"Wake of Fire","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":265,"n":"Cobra Strike","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":266,"n":"Blade Fury","c":"ass","m":"SQ","q":23,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"ch":3,"ct":4},{"id":269,"n":"Claws of Thunder","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":3,"fm":["human"]},{"id":270,"n":"Dragon Tail","c":"ass","m":"KK","q":0,"tb":"Martial Arts","ia":[],"ea":[],"ib":[],"eb":[],"ws":4,"fm":["human"],"ar":-20},{"id":271,"n":"Chain Lightning Sentry","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":272,"n":"Wake of Inferno","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":274,"n":"Blades of Ice","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":3,"fm":["human"]},{"id":275,"n":"Dragon Flight","c":"ass","m":"KK","q":0,"tb":"Martial Arts","ia":[],"ea":[],"ib":[],"eb":[],"ws":4,"fm":["human"],"cd":[50,49,48,47,46,45,44,43,42,41,40,39,38,37,36,35,34,33,32,31,30,29,28,27,26,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25]},{"id":276,"n":"Death Sentry","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":280,"n":"Phoenix Strike","c":"ass","m":"A1","q":0,"tb":"Martial Arts","ia":["asm"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":366,"n":"Lightning Sentry","c":"ass","m":"S2","q":0,"tb":"Traps","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"]},{"id":375,"n":"Split Throw","c":"bar","m":"TH","q":0,"tb":"Combat","ia":["comb"],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"msl":["","splitthrowaxe","splitthrowknife","splitthrowjav"],"ar":10},{"id":378,"n":"Joust","c":"pal","m":"A1","q":0,"tb":"Combat","ia":[],"ea":[],"ib":[],"eb":[],"ws":0,"fm":["human"],"cd":[102,99,97,94,92,89,87,84,82,79,77,74,72,69,67,64,62,59,57,54,52,49,47,44,42,39,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38],"cdr":[["Alma Negra",13,"pal","pac",0,"shield"],["Leoric's Mithril Bane",19,"","7cm",20,"weapon"],["Zerae's Resolve",38,"ama","ame",20,"weapon"]]},{"id":380,"n":"Blade Dance","c":"ass","m":"SQ","q":10,"io":1,"ia":["mele"],"ea":[],"ib":[],"eb":[],"ws":2,"fm":["human"],"ff":6}],"sq":{"1":{"hth":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,0],["A1",7,0],["A1",8,1],["A1",9,0],["A1",10,0],["A1",11,0],["A1",12,0]],"1ht":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,3],["A1",8,0],["A1",9,1],["A1",12,0],["A2",6,3],["A2",8,0],["A2",9,1],["A2",12,0],["A1",6,3],["A1",8,0],["A1",9,1],["A1",10,0],["A1",12,0]],"2ht":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",4,0],["A1",7,3],["A1",9,0],["A1",11,1],["A1",14,0],["A2",6,3],["A2",9,0],["A2",10,1],["A2",14,0],["A1",7,3],["A1",9,0],["A1",11,1],["A1",12,0],["A1",14,0],["A1",16,0]]},"4":{"hth":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]],"1ht":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]],"2ht":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]],"1hs":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]],"2hs":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]],"stf":[["RN",0,1],["RN",1,1],["RN",2,1],["RN",3,1],["RN",4,1],["RN",5,1],["RN",6,1],["RN",7,1],["A1",1,0],["A1",4,0],["A1",5,3],["A1",6,1],["A1",8,0],["A1",10,0],["A1",12,0]]},"10":{"hth":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1ht":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"2ht":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1hs":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"2hs":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"stf":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1js":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1jt":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1ss":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"1st":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"ht1":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]],"ht2":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",3,0],["A1",4,0],["A1",5,0],["A1",6,1]]},"11":{"hth":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1ht":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"2ht":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1hs":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"2hs":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"bow":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"xbw":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"stf":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1js":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1jt":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1ss":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"1st":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"ht1":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]],"ht2":[["A1",1,0],["A1",2,0],["A1",4,0],["A1",6,0],["A1",7,1],["A1",9,0],["A1",11,0],["A1",13,0],["A1",14,0],["S3",2,1],["S3",4,0],["S3",5,0],["S3",6,0],["S3",8,0],["S3",9,0],["S3",10,0],["S3",11,0]]},"15":{"hth":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1ht":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"2ht":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1hs":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"2hs":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"bow":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"xbw":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"stf":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1js":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1jt":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1ss":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"1st":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"ht1":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]],"ht2":[["TH",2,0],["TH",3,0],["TH",4,0],["TH",6,0],["TH",7,0],["TH",8,1],["S3",2,0],["S3",4,0],["S3",5,0],["S3",7,1],["S3",8,0],["S3",10,0]]},"16":{"hth":[["A2",0,0],["A2",1,0],["A2",2,0],["A2",3,0],["A2",4,0],["A2",5,0],["A2",6,1],["A2",7,0],["A2",8,0],["A2",9,0],["A2",10,0],["A2",11,0]],"ht1":[["A2",0,0],["A2",1,0],["A2",2,0],["A2",3,0],["A2",4,0],["A2",5,0],["A2",6,1],["A2",7,0],["A2",8,0],["A2",9,0],["A2",10,0],["A2",11,0]],"ht2":[["A2",0,0],["A2",1,0],["A2",2,0],["A2",3,0],["A2",4,0],["A2",5,0],["A2",6,1],["S4",3,0],["S4",4,0],["S4",5,0],["S4",6,1],["S4",7,0],["S4",8,0],["S4",9,0],["S4",10,0],["S4",11,0]]},"23":{"hth":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1ht":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"2ht":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1hs":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"2hs":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"bow":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"xbw":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"stf":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1js":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1jt":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1ss":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"1st":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"ht1":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]],"ht2":[["SC",4,0],["SC",8,0],["SC",10,0],["SC",10,1],["SC",10,0],["SC",11,0],["SC",12,0],["SC",13,0],["SC",14,0],["SC",15,0],["SC",16,0]]}},"sp":{"fana":[14,18,20,23,25,26,27,28,29,30,31,31,32,33,33,34,34,34,34,35,35,35,36,36,36,36,37,37,37,37,37,37,37,37,37,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,40],"frenzy":[7,13,18,22,25,27,29,31,33,34,35,36,37,38,39,40,40,41,41,42,42,43,43,44,44,44,45,45,45,45,46,46,46,46,46,47,47,47,47,47,47,48,48,48,48,48,48,48,49,49,49,49,49,49,49,49,49,49,49,50],"wolf":[20,28,35,40,45,48,51,53,56,57,59,61,62,63,64,66,66,67,68,68,69,70,70,71,71,72,73,73,73,73,74,74,75,75,75,75,75,76,76,76,76,77,77,77,77,77,77,77,78,78,78,78,78,79,79,79,79,79,79,80],"bos":[22,27,31,34,37,39,41,43,44,45,47,48,48,49,50,51,51,52,52,53,53,53,54,54,54,55,55,55,56,56,56,56,56,57,57,57,57,57,57,58,58,58,58,58,58,58,58,59,59,59,59,59,59,59,59,59,59,59,59,60],"inc":[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120],"hustle":15},"mercs":[{"k":"m1","n":"Rogue Scout","act":1,"tok":"RG","bw":"hth","kinds":["bow","xbow"],"atk":[{"id":385,"n":"Fire Arrow","m":"A1","msl":["mercfirearrow","","",""]},{"id":16,"n":"Exploding Arrow","m":"A1","msl":["explodingarrow","","",""]},{"id":386,"n":"Cold Arrow","m":"A1","msl":["merccoldarrow","","",""]},{"id":31,"n":"Freezing Arrow","m":"A1","msl":["freezingarrow","","",""]},{"id":545,"n":"Magic Arrow","m":"A1","msl":["","magicarrow","",""]},{"id":26,"n":"Strafe","m":"A1","rb":50,"hits":[5,5],"lv":16,"msl":["","strafearrow","strafebolt",""]}],"skip":[],"lk":{"HD":"LIT","TR":"LIT","LG":"LIT","RA":"LIT","LA":"LIT","LH":"SBW","S1":"LIT","S2":"LIT"},"h":3},{"k":"m2","n":"Desert Mercenary","act":2,"tok":"GU","bw":"hth","kinds":["spea","pole"],"atk":[{"id":10,"n":"Jab","m":"SQ","q":"seq_act2guardjab"}],"skip":[],"lk":{"HD":"LIT","TR":"LIT","LG":"LIT","RA":"LIT","LA":"LIT","RH":"SPR","S1":"LIT","S2":"LIT","S3":"LIT"},"h":3},{"k":"m5","n":"Barbarian","act":5,"tok":"0A","bw":"2hs","kinds":["axe","swor","mace","hamm"],"atk":[{"id":144,"n":"Concentrate","m":"A2"},{"id":126,"n":"Bash","m":"A2"},{"id":425,"n":"Whirlwind","m":"SQ","mw":1,"q":"seq_ancientwhirlwind"}],"skip":[],"lk":{"HD":"FHM","TR":"HVY","RH":"BSD","S1":"LIT","S2":"LIT"},"h":3}],"msq":{"seq_act2guardjab":[["A1",2,0],["A1",4,0],["A1",6,0],["A1",8,0],["A1",10,0],["A1",11,1],["A1",10,0],["A1",9,0],["A1",10,0],["A1",11,1],["A1",12,0],["A1",13,0],["A1",14,0],["A1",15,0]],"seq_ancientwhirlwind":[["A1",0,0],["A1",1,0],["A1",2,0],["A1",3,1],["A1",4,0],["A1",5,0],["A1",6,0],["A1",7,1]]},"slow":{"chill":-50,"list":[{"k":"decrep","name":"Decrepify","oa":false,"opts":[{"v":-30,"who":["Oblivion Knight (one curse in four)","Baal (on his throne)","Madness (Canight The Corrupted's minion)","Shadow of Mendeln (one curse in four)","Void Knight (one curse in four)","Thonos the Many-Limbed"]},{"v":-32,"who":["Onion the Accused"]},{"v":-46,"who":["Nathkill The Numb"]}]},{"k":"hfreeze","name":"Holy Freeze","oa":true,"opts":[{"v":-30,"who":["Aura-enchanted unique, monster level 1–13"]},{"v":-34,"who":["Aura-enchanted unique, monster level 14–20"]},{"v":-37,"who":["Aura-enchanted unique, monster level 21–27"]},{"v":-40,"who":["Aura-enchanted unique, monster level 28–34"]},{"v":-42,"who":["Duriel (Normal)","Duriel (Nightmare)","Aura-enchanted unique, monster level 35–41"]},{"v":-44,"who":["Duriel (Hell)","Corrupted Paladin","Aura-enchanted unique, monster level 42–48"]},{"v":-45,"who":["Aura-enchanted unique, monster level 49–55"]},{"v":-46,"who":["Aura-enchanted unique, monster level 56–62"]},{"v":-48,"who":["Shattered Soul","Aura-enchanted unique, monster level 63–76"]},{"v":-49,"who":["Aura-enchanted unique, monster level 77–83"]},{"v":-50,"who":["Aura-enchanted unique, monster level 84–90"]},{"v":-51,"who":["Aura-enchanted unique, monster level 91+"]},{"v":-55,"who":["Uber Duriel"]}]}]}};
  /* ias-data:end */
  /* ias-engine:start */
  const IAS = (function (D) {
    const A = D.a, CLS = {}, BASE = {}, SKILL = {}, MERC = {};
    D.cls.forEach(([key, name, tok]) => { CLS[key] = {key, name, tok}; });
    D.b.forEach(b => { BASE[b.c] = b; });
    D.sk.forEach(s => { SKILL[s.id] = s; });
    (D.mercs || []).forEach(m => { MERC[m.k] = m; });
    const TGT = {};
    (D.targets || []).forEach(x => { TGT[x.k] = x; });
    const tdiv = (a, b) => Math.trunc(a / b);
    const cdiv = (a, b) => Math.floor((a + b - 1) / b);  // ceil for a >= 0, b > 0
    const eias = ias => (ias === -120 ? 0 : tdiv(120 * ias, 120 + ias));
    // the least IAS whose effective IAS reaches e (below 0 too: a corrupted map can take IAS off, and the rounding
    // toward zero then rounds up: eias(ias) >= e from ias > 120 (e - 1) / (121 - e))
    const needIAS = e => (e > 0 ? cdiv(120 * e, 120 - e) : Math.floor(120 * (e - 1) / (121 - e)) + 1);
    const ANC = {};
    D.b.forEach(b => {
      const out = new Set(), todo = b.ty.slice();
      while (todo.length) { const t = todo.pop(); if (!t || out.has(t)) continue; out.add(t); (D.types[t] || []).forEach(p => todo.push(p)); }
      ANC[b.c] = out;
    });
    // a class-only base: its own item type is one class's (Amazon bows, claws, orbs); daggers reach the Assassin's
    // item types only as one of several parents
    const classOf = code => { for (const t of (BASE[code] || {ty: []}).ty) if (D.tcls[t]) return D.tcls[t]; return ""; };
    // a mercenary holds the kinds of weapon its act's mercenaries take, never a class's own
    const canHold = (cls, code) => {
      const c = classOf(code), m = MERC[cls];
      return m ? !c && !!BASE[code] && m.kinds.includes(BASE[code].k) : !c || c === cls;
    };
    const isA = (code, types) => types.some(t => (ANC[code] || new Set()).has(t));
    const twoHanded = (cls, b) => !!b && !!(b.f & 2) && !((b.f & 1) && cls === "bar");
    const dualClass = cls => cls === "bar" || cls === "ass";
    // what a class can hold in its second hand as a weapon
    const canSecond = (cls, b) => !!b && canHold(cls, b.c) && (cls === "ass" ? b.wc === "ht1" :
      cls === "bar" && b.wc !== "ht1" && b.wc !== "bow" && b.wc !== "xbw" && (!(b.f & 2) || (b.f & 1)));
    function dual(s) {
      const w = BASE[s.w], w2 = BASE[s.w2];
      return dualClass(s.cls) && s.oh === "weapon" && !!w && canSecond(s.cls, w2) && canSecond(s.cls, w);
    }
    // the weapon class the human animations use
    function humanWC(s) {
      const w = BASE[s.w];
      if (!w) return "hth";
      if (dual(s)) {
        const w2 = BASE[s.w2];
        if (s.cls === "ass") return "ht2";
        const a = w.wc, b = w2.wc;
        if (a === "1hs") return b === "1ht" ? "1js" : "1ss";
        if (a === "1ht") return b === "1ht" ? "1jt" : b === "1hs" ? "1st" : "1ss";
        return "1ss";
      }
      if (w.f & 2) return (w.f & 1) && s.cls === "bar" && s.oh !== "none" ? w.wc : w.wc2;
      return w.wc;
    }
    // the weapon whose speed modifier and IAS count
    function counted(s, over) {
      const w = BASE[s.w], wi = over && over.wi !== undefined ? over.wi : s.wi;
      if (!w) return {wsm: 0, ias: 0, which: ""};
      if (dual(s)) {
        const w2 = BASE[s.w2], a1 = -w.w + wi, a2 = -w2.w + s.wi2;
        return a1 > a2 ? {wsm: w.w, ias: wi, which: "first"} : {wsm: w2.w, ias: s.wi2, which: "second"};
      }
      return {wsm: w.w, ias: wi, which: "first"};
    }
    const lv = (arr, n) => (n > 0 ? arr[Math.min(n, arr.length) - 1] : 0);
    function anim(tok, mode, wc) {
      const code = tok + mode + wc.toUpperCase(), r = A[code];
      return r ? {code, mode, frames: r[0], speed: r[1], hits: r[2], start: 0} : null;
    }
    // can this setup use this attack? (why not, or "")
    function usable(s, sk) {
      if (!sk) return "";
      const form = s.form || "human";
      if (!sk.fm.includes(form)) return form === "human" ? `${sk.n} is only used in ${sk.fm.map(f => f === "wolf" ? "werewolf" : "werebear").join(" or ")} form.` :
        `${sk.n} can't be used in ${form === "wolf" ? "werewolf" : "werebear"} form.`;
      const w = BASE[s.w], w2 = BASE[s.w2];
      if (sk.ia.includes("shld")) return s.oh === "shield" ? "" : `${sk.n} needs a shield.`;
      if (sk.ia.length && !sk.ia.includes("asm")) {
        if (!w || !isA(w.c, sk.ia)) return `${sk.n} needs a weapon of another kind.`;
      }
      if (sk.ia.includes("asm") && w && !isA(w.c, sk.ia)) return `${sk.n} needs a claw, a dagger, or no weapon.`;
      if (w && sk.ea.length && isA(w.c, sk.ea)) return `${sk.n} can't be used with this weapon.`;
      if (sk.ib.length) {
        if (s.oh !== "weapon" || !w2 || !isA(w2.c, sk.ib) || !dual(s)) return `${sk.n} needs a weapon in each hand.`;
      }
      return "";
    }
    // a mercenary's attack: its own animations (token, mode and the weapon class its monster always shows), the
    // monster sequences of its skills
    function planMerc(s, m) {
      const atk = s.atk ? m.atk.find(x => x.id === s.atk) || null : null;
      const p = {s, merc: m, cl: {key: m.k, name: m.n, tok: m.tok}, sk: atk, form: "human", tok: m.tok, wc: m.bw, wcH: m.bw,
                 why: "", notes: [], dual: false};
      if (s.w && !canHold(s.cls, s.w)) p.why = `The ${m.n} can't use this weapon.`;
      else if (atk && atk.q) {
        const steps = D.msq[atk.q];
        p.seq = {num: atk.q, steps, frames: steps.length, hits: steps.filter(x => x[2] === 1).length};
        if (atk.mw) {
          // The Act 5 mercenary's Whirlwind (traced 2026-11-27, the full audit's DA-01): the game sets its spin to a step
          // a game frame and never speeds it up (no UseAttackRate), and each hit puts it back to its first step, the hit
          // step's event still to come; its timer (1 frame) never holds a hit back. So the first hit comes on the hit
          // step's frame + 1 (4 frames in) and then one every hit-step frames (3), whatever IAS, the weapon or slows.
          const ev = steps.findIndex(x => x[2] === 1);
          Object.assign(p, {fixed: ev, fixedHits: 1, fx: true, mfirst: ev + 1});
        }
      } else {
        p.anims = [anim(m.tok, atk ? atk.m : "A1", m.bw)].filter(Boolean);
        if (!p.anims.length) p.why = "No attack animation.";
        else if (atk && atk.rb) {
          // the Act 1 Rogue's Strafe: its arrows (a Hell Rogue's: 5) and its rollback, as the game makes the player's
          const a = p.anims[0], [lo, hi] = atk.hits;
          p.rollback = {hits: Math.min(hi, Math.max(lo, s.tg || 1)), action: a.hits.length ? a.hits[0] : a.frames - 1, pct: atk.rb, lv: atk.lv};
        }
      }
      return p;
    }
    // everything about a setup that doesn't depend on IAS
    function plan(s) {
      if (MERC[s.cls]) return planMerc(s, MERC[s.cls]);
      const cl = CLS[s.cls], sk = s.atk ? SKILL[s.atk] : null;
      const form = s.form || "human";
      const tok = form === "wolf" ? "40" : form === "bear" ? "TG" : cl.tok;
      const p = {s, cl, sk, form, tok, wcH: humanWC(s), why: usable(s, sk), notes: [], dual: dual(s)};
      p.wc = form === "human" ? p.wcH : "hth";
      const w = BASE[s.w];
      if (p.why) return p;
      if (sk && sk.m === "SQ") {
        const steps = (D.sq[sk.q] || {})[p.wc];
        if (!steps) { p.why = `${sk.n} can't be used with this weapon.`; return p; }
        p.seq = {num: sk.q, steps, frames: steps.length, hits: steps.filter(x => x[2] === 1).length};
        if (sk.chg !== undefined) p.charge = sk.chg;
        // a channel (Blade Fury): held, the game casts it again on reaching step `at`, a blade a loop; with a timer of
        // its own (Blade Fury's 4 frames between blades) a blade every max(loop, timer + 1) frames, as counted in game
        if (sk.ch) p.channel = {at: sk.ch, timer: sk.ct || 0};
        // Whirlwind, Blade Dance: a hit at most every Param3 frames by the game's timer, with each weapon when there
        // are two; their sequence runs at the other animation rate
        if (sk.ff) { p.fixed = sk.ff; p.fixedHits = p.dual ? 2 : 1; p.fx = true; }
      } else {
        // a normal attack: the game draws attack 1 or attack 2, half the time each, but always attack 1 with a bow, a
        // crossbow or no weapon; else by the target's size (MonStats2 Height): small, attack 1; flying, attack 2
        const size = (TGT[s.mon] || {h: 3}).h;
        const modes = sk ? [sk.m] : !w || w.wc === "bow" || w.wc === "xbw" || size === 1 ? ["A1"] : size === 2 ? ["A2"] : ["A1", "A2"];
        p.anims = modes.map(m => anim(tok, m, p.wc)).filter(Boolean);
        if (!sk && modes[0] === "A2") {  // attack 2 drawn, but the game's hit comes at attack 1's hit frame
          p.a1 = anim(tok, "A1", p.wc);
          if (!p.anims.length && p.a1) p.anims = [p.a1];
        }
        if (!p.anims.length) { p.why = sk ? `${sk.n} has no animation with this weapon.` : "No attack animation with this weapon."; return p; }
        if (form === "human" && D.fb[s.cls]) {
          const row = w ? w.wc : "hth";
          p.anims.forEach(a => { if (a.mode === "A1" || a.mode === "A2") a.start = D.fb[s.cls][row] || 0; });
          if (p.a1) p.a1.start = D.fb[s.cls][row] || 0;
        }
        if (sk && sk.rb !== undefined) {
          const n = Math.max(1, Math.min(60, s.lvl || 1));
          let hits = sk.hits[n - 1];
          if (sk.hmin) hits = Math.min(Math.max(s.tg || hits, sk.hmin[n - 1]), hits);
          p.rollback = {pct: sk.rb, hits, action: p.anims[0].hits.length ? p.anims[0].hits[0] : 0};
        }
      }
      if (sk && sk.fx) p.fx = true;  // drawn at the game's other animation rate: IAS, the weapon and skills don't count
      if (form !== "human" && !p.fx) p.formBase = formBase(s, p);
      // a cooldown (Skills.txt delay, game frames: Shock Web and Plague Javelin 25, Dragon Flight and Joust by level),
      // less what an item takes off (s.cdr names it: Joust's Alma Negra, Leoric's Mithril Bane, Zerae's Resolve)
      if (sk && sk.cd) {
        const it = (sk.cdr || []).find(x => x[0] === s.cdr) || null;
        p.cd = Math.max(0, lv(sk.cd, Math.max(1, Math.min(60, s.lvl || 1))) - (it ? it[1] : 0));
        p.cdItem = it;
      }
      return p;
    }
    // a form's base speed, from the weapon (over: another IAS on the weapon). The game works it out as an attack starts
    // from the length of the animation the character was in (held: standing, 9 frames as a werewolf, 10 as a
    // werebear), and again from the attack's own length whenever something works attack speed out during the attack
    // (traced 2026-11-26): `full`. The game's own side always does (its hits come at that rate); your character does
    // as Fire Claws starts (its own speed buff, Skills.txt's cltstfunc 9: `rs`, at: "start", the whole swing) and when
    // Feral Rage hits (the game sends its state again with its movement speed, a stat that works attack speed out
    // again: `rh`, at: "hit", the rest of the swing)
    function formBase(s, p, over) {
      const w = BASE[s.w], wi = over && over.wi !== undefined ? over.wi : s.wi;
      let H, h = null;
      if (!w) H = 19;
      else {
        // the class's own attack 1 with the weapon's one-handed weapon class, however it's held
        h = A[p.cl.tok + "A1" + w.wc.toUpperCase()];
        if (!h) H = 45;
        else {
          const ar = tdiv((100 - w.w + wi) * h[1], 100);
          H = ar > 0 ? tdiv(h[0] * 256, ar) : 0;
        }
      }
      const stand = A[p.tok + "NUHTH"][0], fallback = A[p.tok + (p.anims && p.anims[0] ? p.anims[0].mode : "A1") + "HTH"];
      const len = p.anims && p.anims[0] ? p.anims[0].frames : 0, dflt = fallback ? fallback[1] : 256;
      const base = (H > 0 ? tdiv(stand * 256, H) : 0) || dflt, full = (H > 0 && len ? tdiv(len * 256, H) : 0) || dflt;
      // re (Fury): the game's own, faster copy finishes first, its standing mode ends the skill's temporary state, and
      // your character works its speed out again when told, for the rest of the attack (the audit of 2026-11-26)
      const at = p.sk && p.sk.rs ? "start" : p.sk && p.sk.rh ? "hit" : p.sk && p.sk.re ? "end" : "";
      return {H, stand, len, full, at, base: at === "start" ? full : base, weaponTime: h ? p.cl.tok + "A1" + w.wc.toUpperCase() : "", own: wi};
    }
    // the setup's slows: chill and Holy Freeze take speed off attacks and the other animation rate alike, Decrepify off
    // attacks only; each holds what it takes off (0 for none)
    const SLOW = D.slow || {chill: -50, list: []};
    function slowed(s, fx, add) {
      if (s.chill) add(SLOW.chill, "Chilled");
      SLOW.list.forEach(sl => { if (s[sl.k] && (!fx || sl.oa)) add(s[sl.k], sl.name); });
    }
    // the speed (over: other IAS on the weapon, or from other gear)
    function speed(s, p, over) {
      const c = counted(s, over), gear = over && over.gear !== undefined ? over.gear : s.gear;
      const inc = s.cls === "bar" ? lv(D.sp.inc, s.inc) : 0;
      const map = p.merc ? 0 : s.map || 0;  // a corrupted map's IAS for players: a mercenary gets neither its players' stats nor its monsters' (traced 2026-11-27)
      const ias = Math.max(-119, c.ias + gear + inc + map), e = eias(ias);  // no setup goes below -119 (the boxes)
      let skill = 0;
      const parts = [];
      const add = (v, what) => { if (v) { skill += v; parts.push([what, v]); } };
      if (p.fx) {  // Whirlwind, Blade Dance: their sequence plays a step a game frame, whatever the speed, Frenzy or slows
        // (traced 2026-11-18: nothing writes a sequence's own speed for them; until then the page drew the spin at the
        // other animation rate, with Frenzy's charges and the slows)
        return {wsm: 0, which: "", weaponIAS: c.ias, gear, inc, map, ias, eias: e, skill: 0, parts: [], sq: false, raw: 100, speed: 100, capped: false, hi: 175, fx: true};
      }
      add(lv(D.sp.fana, s.fana), "Fanaticism");
      if (!p.merc) {
        // Frenzy's speed comes with its charges: a fifth of it per charge (up to 5), rounded down
        if (s.cls === "bar") add(tdiv(lv(D.sp.frenzy, s.frenzy) * Math.max(0, Math.min(5, s.fst === undefined ? 5 : s.fst)), 5), "Frenzy");
        const bos = Math.max(s.hustle ? D.sp.hustle : 0, s.cls === "ass" ? lv(D.sp.bos, s.bos) : 0);
        add(bos, "Burst of Speed");
        if (p.form === "wolf") add(lv(D.sp.wolf, s.ww), "Werewolf");
      } else if (s.hustle) add(D.sp.hustle, "Burst of Speed");  // a mercenary wearing Hustle armor gets it too (traced 2026-11-18)
      slowed(s, false, add);
      add(s.other || 0, "Other speed");
      if (p.sk && p.sk.ar) add(p.sk.ar, p.sk.n);
      let raw = 100 + skill - c.wsm + e;
      const sq = !!p.seq && p.charge === undefined && !p.merc;  // a monster's sequence isn't slower
      if (sq) raw -= 30;
      if (p.charge !== undefined) raw += p.charge;
      const hi = p.charge !== undefined ? 256 : 175;
      const v = Math.max(15, Math.min(hi, raw));
      return {wsm: c.wsm, which: c.which, weaponIAS: c.ias, gear, inc, map, ias, eias: e, skill, parts, sq, raw, speed: v, capped: raw >= hi, hi};
    }
    const rateOf = (base, sp) => Math.max(0, Math.min(32767, tdiv(base * sp, 100)));
    const held = (frames, start, rate) => (rate > 0 ? cdiv((frames - start) * 256, rate) - 1 : Infinity);
    // held, a swing that runs at `rate` and at `rate2` from game frame `from` on (Feral Rage once it hits): each frame
    // moves it on by the rate then, and it ends on the first frame where one more step would reach its end (held's
    // look-ahead, by the rate of that frame)
    function sped(frames, start, rate, rate2, from) {
      if (rate <= 0) return Infinity;
      const end = (frames - start) * 256;
      for (let j = 1, pos = 0; ; j++) {
        const r = j < from ? rate : rate2;
        pos += r;
        if (pos + r >= end) return j;
      }
    }
    // the connection a Feral Rage hit's speed-up waits on: 0 single player, 1 online with about 40 ms ping, 2 about
    // 80 ms (each 40 ms or so makes it a game frame later)
    const pingOf = s => Math.max(0, Math.min(2, Math.trunc(Number(s.ping) || 0)));
    // A rollback attack held, frame by frame (the preview's timeline loop and the held end test; at one rate it gives
    // rollback()'s swing lengths exactly), its rate going up to rate2 from frame `from` on: the swing lengths, each
    // hit on its swing's last frame, the last swing running on to the end
    function rollbackSped(hits, action, total, start, rate, rate2, from, pct) {
      if (rate <= 0) return null;
      const act = action * 256, end = total * 256, at = [];
      let pos = start * 256, left = hits, more = false;
      if (left > 0 && pos >= act) { left--; at.push(0); more = left > 0; }
      for (let j = 1; j < 5000; j++) {
        const r = j < from ? rate : rate2;
        pos = more ? tdiv((pos >> 8) * (100 - pct), 100) * 256 + r : pos + r;
        if (left === 0 && pos + r >= end) {
          const out = at.map((h, i) => h - (i ? at[i - 1] : -1));
          out[out.length - 1] += j - 1 - at[at.length - 1];
          return out;
        }
        const hit = left > 0 && pos >= act;
        if (hit) { left--; at.push(j); }
        more = hit && left > 0;
      }
      return null;
    }
    // the game's own copy of an attack ends (its END) after the steps whose position stays short of the end, plus 1;
    // each follow-up swing starts it again from where it went back to (PD2's restart: END at now + n + 1)
    function serverEnd(hits, action, total, start, rate, pct) {
      const end = total * 256;
      const steps = pos0 => { let n = 0; for (let pos = pos0 + rate; pos < end; pos += rate) n++; return Math.max(n, 1) + 1; };
      if (rate <= 0) return Infinity;
      if (hits < 2) return steps(start * 256);
      const g = serverHits(hits, action, total, start, rate, pct), r = g.length === hits ? hits - 1 : g.length;
      if (!r) return steps(start * 256);
      let began = 0, back = start;
      for (let i = 0; i < r; i++) { back = tdiv((g[i] - began) * (100 - pct), 100); began = g[i] - back; }
      return g[r - 1] + steps(back * 256);
    }
    // the swing lengths of an attack that rolls back after each hit
    function rollback(hits, action, total, start, rate, pct) {
      const af = new Array(hits).fill(0), out = new Array(hits).fill(0);
      let base = 0, next = 0;
      af[0] = start * 256 + cdiv((action - start) * 256, rate) * rate;
      for (let i = 1; i < hits; i++) {
        base = tdiv((af[i - 1] >> 8) * (100 - pct), 100);
        next = base * 256 + rate;
        af[i] = base * 256 + cdiv((action - base) * 256, rate) * rate;
        out[i] = 1;
        while (next < af[i]) { next += rate; out[i] += 1; }
      }
      af[hits - 1] = base * 256 + cdiv((total - base) * 256, rate) * rate - rate * 2;
      while (next < af[hits - 1]) { next += rate; out[hits - 1] += 1; }
      out[0] = cdiv(af[0] - start * 256, rate) + 1;
      return out;
    }
    // The hits the game itself makes of an attack that rolls back part of the way (Strafe, Fend; traced 2026-11-18): after
    // each hit it goes back by the game frames the swing has run x (100 - pct)%, not by the animation's frame, and looks
    // for the hit frame from one frame before there. The game frames of its hits from the attack's start; a hit it can't
    // reach before the swing's end is never made. Held, a hit after the next attack starts is lost (the next attack
    // clears it); one on that very frame lands (the request is handled after that frame's hits).
    function serverHits(hits, action, total, start, rate, pct) {
      const end = total * 256, out = [];
      const reach = (from, lo, pos0) => {
        for (let k = 1; ; k++) {
          const pos = pos0 + k * rate;
          if (pos >= end) return -1;
          if (lo <= action && action <= pos >> 8) return from + k;
          lo = Math.max(lo, (pos >> 8) + 1);
        }
      };
      let g = reach(0, start, start * 256), began = 0;
      while (g >= 0) {
        out.push(g);
        if (out.length >= hits) break;
        const back = tdiv((g - began) * (100 - pct), 100);
        began = g - back;
        g = reach(g, back - 1, back * 256);
      }
      return out;
    }
    // the frames of every part of the attack at a speed
    function timing(p, sp, over) {
      const t = {parts: []};
      if (p.merc) return mercTiming(p, sp, t);
      if (p.seq) {
        if (p.fixed) {
          // The game runs the skill's hit check every frame (each check puts the spin back at step 3, whose own event
          // comes the next frame), and its timer lets a hit through Param3 frames after the last one. The rate only
          // sets how fast the spin is drawn.
          const rate = rateOf(256, sp.speed);
          Object.assign(t, {base: 256, rate, len: p.seq.frames});
          t.parts.push({label: "Each hit", frames: p.fixed, hits: p.fixedHits, fixed: true});
          return t;
        }
        if (p.charge !== undefined) {
          // Charge's strike: steps 8-14 of its sequence at a rate the game sets when the charge connects (speed, no
          // base speed, at most 256), the hit at step 11
          const rate = Math.max(1, Math.min(256, sp.speed));
          Object.assign(t, {base: 100, rate, len: 7, hitAt: cdiv(768, rate) - 1});
          t.parts.push({label: "The charge's strike", frames: cdiv(1792, rate), hits: 1});
          return t;
        }
        const base = 256, rate = rateOf(base, sp.speed), len = p.seq.frames;
        t.base = base; t.rate = rate; t.len = len;
        if (p.channel) {
          // held: a loop of steps 0 to `at`, ceil(at x 256 / rate) + 2 frames as counted in game (the author, 2026-11-18:
          // 69 blades in 20 s at speed 70, a loop of 7; the code's order gives + 1 as the least it can be), the timer
          // letting a hit through on the first loop at least `timer` frames after the last one (counted: about every
          // timer + 1 frames once the loop is that short, 95 blades in 20 s at speed 156)
          const at = p.channel.at, loop = cdiv(at * 256, rate) + 2, every = p.channel.timer ? Math.max(loop, p.channel.timer + 1) : loop;
          Object.assign(t, {loop, first: Math.floor(at * 256 / rate) + 1, len: at});
          t.parts.push({label: `Each ${p.sk.n === "Blade Fury" ? "blade" : "hit"}, held`, frames: every, hits: 1, channel: true});
          return t;
        }
        t.parts.push({label: "One " + p.sk.n, frames: held(len, 0, rate), hits: p.seq.hits});
        return t;
      }
      const fb = p.formBase && over && over.wi !== undefined ? formBase(p.s, p, over) : p.formBase;
      p.anims.forEach((a, i) => {
        const base = fb ? fb.base : a.speed, rate = rateOf(base, sp.speed);
        const part = {label: p.anims.length > 1 ? `Attack ${i + 1}` : p.sk ? p.sk.n : a.mode === "A2" ? "Attack 2" : "Attack", anim: a, base, rate,
                      frames: held(a.frames, a.start, rate), hits: 1};
        if (fb) {
          // in a form the game's own side runs the attack at the base from its own length, and makes its hit by that
          part.srate = rateOf(fb.full, sp.speed);
          if (fb.at === "hit" && i === 0 && part.srate > rate) {
            // Feral Rage: the game makes its hit d frames in, sends its state again, and your character works the
            // speed out again on the frame that arrives (single player: frame d; online about a frame later per 40 ms
            // of ping): the rest of the swing at the faster rate. A miss sends nothing.
            const h = a.hits.length ? a.hits[0] : a.frames - 1, d = Math.max(1, cdiv((h - a.start) * 256, part.srate));
            const from = d + pingOf(p.s);
            Object.assign(part, {miss: part.frames, hitAt: d, from, rate2: part.srate, base2: fb.full,
                                 frames: sped(a.frames, a.start, rate, part.srate, from)});
          }
        }
        if (p.rollback && i === 0) {
          part.swings = rollback(p.rollback.hits, p.rollback.action, a.frames, a.start, rate, p.rollback.pct);
          part.frames = part.swings.reduce((x, y) => x + y, 0);
          part.hits = p.rollback.hits;
          if (fb && fb.at === "end" && part.srate > rate) {
            // Fury as a werewolf: the game runs its own Fury at its rate and finishes first; standing again ends the
            // skill's temporary state, and your character works its speed out again when told (single player on the
            // game's finishing frame, online about a frame later per 40 ms of ping): the rest at the faster rate
            const endAt = serverEnd(p.rollback.hits, p.rollback.action, a.frames, a.start, part.srate, p.rollback.pct);
            const from = endAt + pingOf(p.s);
            const sw = rollbackSped(p.rollback.hits, p.rollback.action, a.frames, a.start, rate, part.srate, from, p.rollback.pct);
            if (sw) Object.assign(part, {slow: part.frames, slowSwings: part.swings, endAt, from, rate2: part.srate, base2: fb.full,
                                         swings: sw, frames: sw.reduce((x, y) => x + y, 0)});
          }
          if (p.rollback.pct < 100) {  // Zeal, Fury, Dragon Talon go all the way back on both sides: every hit lands
            part.server = serverHits(p.rollback.hits, p.rollback.action, a.frames, a.start, rate, p.rollback.pct);
            part.landed = part.server.filter(g => g <= part.frames).length;
            part.tie = part.server.includes(part.frames);
          }
        }
        t.parts.push(part);
      });
      t.base = t.parts[0].base; t.rate = t.parts[0].rate; t.len = p.anims[0].frames;
      if (p.a1 && p.anims[0].mode === "A2") {  // against a flying monster: attack 2 lasts, attack 1's hit frame hits
        const q = t.parts[0], h = p.a1.hits.length ? p.a1.hits[0] : p.a1.frames - 1;
        q.lost = q.frames < cdiv((h - p.a1.start) * 256, rateOf(fb ? fb.base : p.a1.speed, sp.speed));
      }
      if (t.parts.length === 2) {
        // A held normal attack lasts as long as the attack the game draws, attack 1 or attack 2, half the time each.
        // The hit always comes at attack 1's hit frame: an attack 2 that ends before it loses that attack's hit.
        const [a1, a2] = t.parts, h = a1.anim.hits.length ? a1.anim.hits[0] : a1.anim.frames - 1;
        const hitAt = cdiv((h - a1.anim.start) * 256, a1.rate);
        a2.lost = a2.frames < hitAt;
        t.avg = {frames: (a1.frames + a2.frames) / 2, hits: (1 + (a2.lost ? 0 : 1)) / 2};
      }
      return t;
    }
    // a mercenary: its attack ends when its animation does, and its AI picks the next one the frame after (a
    // sequence: two frames after)
    function mercTiming(p, sp, t) {
      if (p.fixed) {  // the Act 5 mercenary's Whirlwind: a hit every p.fixed frames while it spins (planMerc)
        Object.assign(t, {base: 256, rate: 256, len: p.seq.frames, first: p.mfirst});
        t.parts.push({label: "Each hit", frames: p.fixed, hits: 1, fixed: true});
        return t;
      }
      if (p.rollback) {
        // the Act 1 Rogue's Strafe: the game alone paces it, arrow by arrow (mercRollback); each arrow ends its length,
        // the last length runs on to the animation's end and the frame its AI acts
        const a = p.anims[0], rate = rateOf(a.speed, sp.speed), m = mercRollback(p.rollback.hits, p.rollback.action, a.frames, rate, p.rollback.pct);
        const cut = m.hits.slice(0, -1), swings = cut.map((g, i) => g - (i ? cut[i - 1] : 0)).concat(m.next - (cut.length ? cut[cut.length - 1] : 0));
        Object.assign(t, {base: a.speed, rate, len: a.frames});
        t.parts.push({label: p.sk.n, anim: a, base: a.speed, rate, frames: m.next, hits: m.hits.length, swings, arrows: m.hits, draw: m.draw});
        return t;
      }
      if (p.seq) {
        const rate = rateOf(256, sp.speed), len = p.seq.frames;
        Object.assign(t, {base: 256, rate, len});
        t.parts.push({label: "One " + p.sk.n, frames: cdiv(len * 256, rate) + 2, hits: p.seq.hits, anim: null});
        return t;
      }
      const a = p.anims[0], rate = rateOf(a.speed, sp.speed);
      Object.assign(t, {base: a.speed, rate, len: a.frames});
      t.parts.push({label: p.sk ? p.sk.n : "Attack", anim: a, base: a.speed, rate, frames: Math.max(2, cdiv(a.frames * 256, rate)) + 1,
                    hits: Math.max(1, a.hits.length)});
      return t;
    }
    // A mercenary's Strafe (traced 2026-11-27, the full audit's DA-01): the game alone paces it, from the animation's
    // frame 0 (no start frame), scheduling a swing frame by frame: its arrow when the animation reaches the arrow's
    // frame, then back by (100 - pct)% of the game frames the swing has run (as the game makes a player's Strafe:
    // serverHits); the last swing runs on to the animation's end (at least 2 frames), and the AI acts the frame after.
    // {hits: each arrow's frame, end, next: the frame of its next action, draw: the animation frame each frame shows}
    function mercRollback(n, action, frames, rate, pct) {
      const L = frames * 256, draw = [];
      const swing = (G, lo, base) => {
        let k = 0, hit = -1;
        const at = [];
        for (let pos = base + rate; pos < L; pos += rate) {
          k++; at.push(pos >> 8);
          const hi = pos >> 8;
          if (hit < 0 && lo <= action && action <= hi) hit = G + k;
          lo = Math.max(lo, hi + 1);
        }
        return {hit, end: k ? G + k + 1 : G + 2, at};
      };
      const hits = [];
      let S = 0, G = 0, sw = swing(0, 0, 0);
      while (sw.hit >= 0) {
        hits.push(sw.hit);
        if (hits.length >= n) break;
        draw.push(...sw.at.slice(0, sw.hit - G));
        const d = tdiv((sw.hit - S) * (100 - pct), 100);
        S = sw.hit - d; G = sw.hit;
        sw = swing(sw.hit, d - 1, d * 256);
      }
      draw.push(...sw.at);
      while (draw.length < sw.end + 1) draw.push(frames - 1);
      return {hits, end: sw.end, next: sw.end + 1, draw};
    }
    function evaluate(s, over) {
      const p = plan(s);
      if (p.why) return {p, why: p.why};
      const sp = speed(s, p, over), t = timing(p, sp, over);
      if (p.cd) cooled(t, p.cd, p.merc ? 0 : pingOf(s));
      return {p, sp, t};
    }
    // A skill with a cooldown, held (traced 2026-11-20): the game starts the cooldown when the skill does what it does
    // (the throw's release, the strike), d game frames after the attack starts, as it schedules a hit:
    // max(1, ceil((event - start) x 256 / rate)); it lasts cd frames, and only when it ends does the game tell your
    // client, which starts the next attack at once while the button is held (PD2's own cooldowns, one per skill). So
    // an attack lasts max(its frames, d + cd): IAS still helps under a cooldown, by bringing the release sooner. Per
    // part: cd, that cycle; release, d; a part that is over sooner keeps its own frames as `own`, stands for `wait`
    // frames and lasts the cycle. t.cd: the first part's cycle. Single player that is exact (the audit of 2026-11-26:
    // the game's word arrives before your next frame, and your request is handled before its next); online the word
    // and your next request each take half the round trip: ping, about a frame per 40 ms, adds to each cycle.
    function cooled(t, cd, ping) {
      t.parts.forEach(q => {
        const a = q.anim;
        if (!a || !q.rate) return;
        const h = a.hits.length ? a.hits[0] : a.frames - 1, d = Math.max(1, cdiv((h - a.start) * 256, q.rate));
        Object.assign(q, {cd: d + cd + (ping || 0), release: d, ping: ping || 0});
        if (q.frames < q.cd) Object.assign(q, {own: q.frames, wait: q.cd - q.frames, frames: q.cd});
      });
      t.cd = t.parts[0].cd;
    }
    // breakpoints over IAS from other gear (the weapon's IAS as set): one row per change in frames, {rows: [{gear, r}],
    // you, spare, r0}. fromNone: in human form (and for a mercenary) all IAS adds up, so the rows start from no IAS at
    // all and a row the weapon alone gets past has gear below 0; in a form the weapon's IAS also sets the base speed,
    // so the rows start at no IAS on other gear either way. spare: the IAS on other gear you could do without and keep
    // your frames (from the weapon too, where it goes below 0).
    // a row per frame count, and per count of hits that land (Fend with a javelin: 14 frames lose a hit at speed 172-174)
    const frameKey = r => r.t.parts.map(x => (x.swings ? x.swings.join("/") + (x.landed < x.hits ? "~" + x.landed : "") : x.frames)).join(",");
    function breakpoints(s, fromNone) {
      const r0 = evaluate(s);
      if (r0.why || (r0.p.seq && r0.p.fixed) || r0.p.fx) return {rows: [], you: 0, spare: 0, r0};
      const rows = [], key = frameKey;
      const own = r0.sp.weaponIAS + r0.sp.inc + (r0.sp.map || 0);  // the IAS that isn't other gear
      const all = !!fromNone && !r0.p.formBase;
      let last = null;
      for (let e = all ? Math.min(0, eias(own)) : eias(own); e < 120; e++) {  // a map can take the total below 0
        const gear = all ? needIAS(e) - own : Math.max(0, needIAS(e) - own);
        const r = evaluate(s, {gear}), k = key(r);
        if (k !== last) { rows.push({gear, r}); last = k; }
        if (r.sp.raw >= r.sp.hi) break;
      }
      let you = 0;  // the setup's own row: the last one its gear reaches
      rows.forEach((row, i) => { if (row.gear <= s.gear) you = i; });
      return {rows, you, spare: rows.length ? s.gear - rows[you].gear : 0, r0};
    }
    // in a form, breakpoints over IAS on the weapon (other gear as set): it also sets the form's base speed, so it has
    // breakpoints of its own and keeps counting once speed is at its cap. One row per change in frames, from no IAS on
    // the weapon up to the most the base can carry (its m) or the setup's own if more, then the first row past that; a
    // row above what the base can carry is `past`. {rows: [{wi, r, past}], you, spare, carry, r0}; null in human form,
    // for a mercenary or with no weapon (the weapon's IAS sets no base speed there).
    function weaponBreakpoints(s) {
      const r0 = evaluate(s), w = BASE[s.w];
      if (r0.why || !r0.p.formBase || !w) return null;
      const carry = w.m || 0, upto = Math.max(carry, s.wi), rows = [];
      let last = null;
      for (let wi = 0; wi <= upto + 300; wi++) {
        const r = evaluate(s, {wi}), k = frameKey(r);
        if (k === last) continue;
        last = k;
        rows.push({wi, r, past: wi > carry});
        if (wi > upto) break;
      }
      let you = 0;
      rows.forEach((row, i) => { if (row.wi <= s.wi) you = i; });
      return {rows, you, spare: s.wi - rows[you].wi, carry, r0};
    }
    // frames over weapon IAS (rows) and other gear's IAS (columns)
    function grid(s, ws, gs) {
      return ws.map(wi => gs.map(g => {
        const r = evaluate(s, {wi, gear: g});
        const p = r.why ? null : r.t.parts[0];
        return r.why ? null : {f: r.t.avg ? r.t.avg.frames : p.frames, sp: r.sp, capped: r.sp.raw >= r.sp.hi,
                               lost: p.landed !== undefined ? p.hits - p.landed : 0, cd: !!p.wait || (!!r.t.cd && p.frames === r.t.cd)};
      }));
    }
    // the fastest held normal attacks of a class in a form (no skill speed): every setup's own fastest frame count,
    // the two fastest of those, and what each setup needs for it (in a form the weapon's own IAS, up to what
    // wmaxOf(base) says the weapon can carry, and the rest from other gear: the least in all); keep(base), if given,
    // picks the bases to try (keep(null): no weapon)
    function fastest(cls, form, wmaxOf, keep) {
      if (MERC[cls]) return [];  // the classes' own normal attacks only
      const groups = new Map();
      const bases = D.b.filter(b => canHold(cls, b.c) && (!keep || keep(b)));
      const setups = !keep || keep(null) ? [{w: "", oh: "none"}] : [];
      bases.forEach(b => {
        setups.push({w: b.c, oh: "none"});
        if (cls === "bar" && (b.f & 2) && (b.f & 1)) setups.push({w: b.c, oh: "shield"});
      });
      if (dualClass(cls) && form === "human") {
        const firsts = bases.filter(b => canSecond(cls, b));
        const byKey = new Map();  // one second weapon per (weapon class, WSM): the pair counts its faster weapon
        firsts.forEach(b => { const k = b.wc + "|" + b.w; if (!byKey.has(k)) byKey.set(k, b); });
        firsts.forEach(b => byKey.forEach(b2 => setups.push({w: b.c, oh: "weapon", w2: b2.c})));
      }
      const empty = {cls, form, atk: 0, lvl: 1, tg: 1, wi: 0, wi2: 0, gear: 0, fana: 0, frenzy: 0, inc: 0, bos: 0, hustle: false, ww: 0, other: 0};
      setups.forEach(su => {
        const s = Object.assign({}, empty, su), p = plan(s);
        if (p.why || !p.anims) return;
        const a = p.anims[0], w = BASE[s.w], two = dual(s);
        const wsm = two ? Math.min(w.w, BASE[s.w2].w) : w ? w.w : 0;  // two weapons at no IAS: the faster one counts
        const cap = form !== "human" && w && wmaxOf ? wmaxOf(s.w) : 0;
        // a form: what decides the frames is the class's own attack with the weapon, its WSM and the weapon's most IAS
        const key = form === "human" ? [a.code, a.start, wsm].join("|") : [p.formBase.weaponTime || "-", wsm, cap].join("|");
        if (!groups.has(key)) groups.set(key, {anim: a, wsm, s, p, cap, names: new Set(), dual: two, weaponTime: p.formBase ? p.formBase.weaponTime : ""});
        const g = groups.get(key);
        g.names.add(two ? `${w.n} + ${BASE[s.w2].n}` : w ? (su.oh === "shield" ? `${w.n} with a shield` : w.n) : "No weapon");
      });
      // each group's way to each frame count it reaches: human, the least IAS; in a form the least IAS on the weapon
      // (the scarce part), then the least on other gear
      const better = (x, y) => !y || x.wi < y.wi || (x.wi === y.wi && x.other < y.other);
      groups.forEach(g => {
        const a = g.anim, ways = new Map();
        const keep = w => { if (better(w, ways.get(w.frames))) ways.set(w.frames, w); };
        if (form === "human") {
          for (let e = 0; e < 120; e++) {
            const v = Math.max(15, Math.min(175, 100 - g.wsm + e));
            keep({frames: held(a.frames, a.start, rateOf(a.speed, v)), wi: 0, other: needIAS(e), speed: v});
            if (100 - g.wsm + e >= 175) break;
          }
        } else {
          for (let wi = 0; wi <= g.cap; wi++) {
            const base = formBase(Object.assign({}, g.s, {wi}), g.p).base;
            for (let e = eias(wi); e < 120; e++) {
              const v = Math.max(15, Math.min(175, 100 - g.wsm + e));
              keep({frames: held(a.frames, 0, rateOf(base, v)), wi, other: Math.max(0, needIAS(e) - wi), speed: v});
              if (100 - g.wsm + e >= 175) break;
            }
          }
        }
        g.ways = ways;
        g.min = Math.min(...ways.keys());
      });
      // the two fastest frame counts some setup can't get past, and every setup that gets to each (or faster)
      const all = [...groups.values()].filter(g => g.ways.size);
      const counts = [...new Set(all.map(g => g.min))].sort((a, b) => a - b).slice(0, 2);
      return counts.map(f => ({frames: f, rows: all.filter(g => g.min <= f).map(g => {
        let w = null;
        g.ways.forEach(x => { if (x.frames <= f && better(x, w)) w = x; });
        return Object.assign({ias: w.wi + w.other, g}, w);
      }).sort((a, b) => a.ias - b.ias || a.wi - b.wi)}));
    }
    return {D, A, CLS, BASE, SKILL, MERC, TGT, eias, needIAS, canHold, canSecond, twoHanded, dualClass, dual, humanWC, counted, plan,
            speed, timing, evaluate, breakpoints, weaponBreakpoints, grid, fastest, rollback, rollbackSped, serverHits, serverEnd, mercRollback, held, sped, pingOf, rateOf, usable};
  })(IAS_DATA);
  /* ias-engine:end */

  const root = document.querySelector(".dmg-map");
  if (!root || !DATA.weapons) return;
  const $ = id => document.getElementById(id);
  const STORE = "erazure-damage-calc";
  const KEYS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
  // each build's own line in the damage profile too: A solid, B dashed, C dotted, D dash-dot (told apart without colour)
  const DASHES = ["none", "8 4", "2 3", "11 3 2 3"];
  const LETTERS = ["A", "B", "C", "D"];
  const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const TIER = { N: "Normal", X: "Exceptional", E: "Elite" };
  const W = Object.fromEntries(DATA.weapons.map(w => [w.code, w]));
  const BOOTS = Object.fromEntries(DATA.boots.map(x => [x.code, x]));  // boots' kick damage and Strength / Dexterity bonus
  const SHIELDS = Object.fromEntries((DATA.shields || []).map(x => [x.code, x]));  // shields' damage (Smite's)
  const SK = DATA.skills;
  /* a skill's name as the game shows it, from the name its formulas use (Skills.txt's: "Plague Poppy" is Poison Creeper,
     "Shape Shifting" Lycanthropy) */
  const SK_TITLE = Object.fromEntries(Object.values(SK).filter(r => r && r.skill).map(r => [r.skill.toLowerCase(), r.name || r.skill]));
  const skillTitle = n => SK_TITLE[String(n).toLowerCase()] || n;   // the game reads the names in any case (Lightning Fury's "Lightning bolt")
  const ATT = Object.fromEntries(DATA.attacks.map(a => [a.k, a]));
  const CLS = Object.fromEntries(DATA.classes.map(c => [c.code, c]));
  const has = (w, t) => !!w && w.it.includes(t);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const tdiv = (a, b) => (b === 0 ? 0 : Math.trunc(a / b));

  // ================================================================== skill formulas (as the game reads them)
  const Calc = (() => {
    const KW = ["ln12", "dm12", "ln34", "dm34", "ln56", "dm56", "ln78", "dm78"];
    // a skill's element (EType) -> the mastery stat enms / exms add (PD2 counts magic mastery too)
    const MASTERY = { fire: "passive_fire_mastery", ltng: "passive_ltng_mastery", cold: "passive_cold_mastery",
      pois: "passive_pois_mastery", mag: "passive_mag_mastery" };
    const BIN = { "<": 15, ">": 15, "<=": 15, ">=": 15, "==": 15, "!=": 15, "+": 17, "-": 17, "*": 19, "/": 19, "^": 20 };
    const TOK = /\s*(?:(\d+)|('[^']*'\s*\.\s*[A-Za-z_]\w*)|([A-Za-z_]\w*)|(<=|>=|==|!=|[-+*/^?:<>(),]))/y;
    const cache = new Map();
    function tokens(text) {
      const out = []; text = text.replace(/"/g, ""); TOK.lastIndex = 0;
      while (TOK.lastIndex < text.length) {
        if (!text.slice(TOK.lastIndex).trim()) break;
        const m = TOK.exec(text);
        if (!m) throw new Error("bad formula " + text);
        if (m[1]) out.push(["n", +m[1]]);
        else if (m[2]) { const mm = /'([^']*)'\s*\.\s*(\w+)/.exec(m[2]); out.push(["link", [mm[1], mm[2]]]); }
        else if (m[3]) out.push(["id", m[3]]);
        else out.push(["op", m[4]]);
      }
      return out;
    }
    function parse(text) {
      if (cache.has(text)) return cache.get(text);
      const t = tokens(text); let i = 0;
      const peek = () => t[i] || [null, null];
      const take = op => { const x = t[i++]; if (op !== undefined && !(x && x[0] === "op" && x[1] === op)) throw new Error("expected " + op); return x; };
      function expr(minbp) {
        let left = unary();
        for (;;) {
          const [k, v] = peek();
          if (k !== "op" || !(v in BIN) || BIN[v] < minbp) return left;
          take(); left = ["bin", v, left, expr(BIN[v] + 1)];
        }
      }
      function unary() {
        const [k, v] = peek();
        if (k === "op" && v === "-") { take(); return ["neg", unary()]; }
        if (k === "op" && v === "+") { take(); return unary(); }
        let node = primary();
        while (peek()[0] === "op" && peek()[1] === "?") { take(); const a = primary(); take(":"); const b = primary(); node = ["tern", node, a, b]; }
        return node;
      }
      function primary() {
        const [k, v] = take();
        if (k === "n") return ["n", v];
        if (k === "op" && v === "(") { const n = expr(0); take(")"); return n; }
        if (k === "id") {
          if (peek()[0] === "op" && peek()[1] === "(") { take("("); const args = [expr(0)]; while (peek()[1] === ",") { take(); args.push(expr(0)); } take(")"); return ["call", v.toLowerCase(), args]; }
          return ["kw", v];
        }
        if (k === "link") return ["link", v];
        throw new Error("unexpected " + v);
      }
      const tree = text.trim() ? expr(0) : ["n", 0];
      cache.set(text, tree);
      return tree;
    }
    const bracket = (lvl, base, per) => {
      if (lvl <= 1) return base;
      const p = per;
      if (lvl > 28) return base + 7 * p[0] + 8 * p[1] + 6 * (p[2] + p[3]) + (lvl - 28) * p[4];
      if (lvl > 22) return base + 7 * p[0] + 8 * p[1] + 6 * p[2] + (lvl - 22) * p[3];
      if (lvl > 16) return base + 7 * p[0] + 8 * p[1] + (lvl - 16) * p[2];
      if (lvl > 8) return base + 7 * p[0] + (lvl - 8) * p[1];
      return base + (lvl - 1) * p[0];
    };
    const len = (lvl, base, p) => lvl <= 0 ? 0 : base + (lvl <= 8 ? p[0] * (lvl - 1) : lvl <= 16 ? 7 * p[0] + (lvl - 8) * p[1] : 7 * p[0] + 8 * p[1] + (lvl - 16) * p[2]);
    const n = x => (x === undefined || x === "" ? 0 : parseInt(x, 10) || 0);
    const byName = {};
    for (const [id, r] of Object.entries(SK)) byName[r.skill.toLowerCase()] = id;
    function kw(r, key, lvl, ctx) {
      const par = i => n(r["Param" + i]);
      const k = KW.indexOf(key);
      if (k >= 0) {
        const a = par(2 * (k >> 1) + 1), b = par(2 * (k >> 1) + 2);
        if (k % 2 === 0) return lvl > 0 ? a + (lvl - 1) * b : 0;
        if (lvl <= 0 && k !== 7) return 0;
        return Math.min(a + tdiv((b - a) * tdiv(110 * lvl, lvl + 6), 100), b);
      }
      if (/^par[1-8]$/.test(key)) return par(+key[3]);
      if (key === "lvl") return lvl;
      if (key === "blvl") return ctx.self_blvl !== undefined ? ctx.self_blvl : lvl;
      if (key === "ulvl") return ctx.ulvl || 90;
      if (/^(edmn|edmx|edns|edxs|enms|exms)$/.test(key)) {
        const side = key === "edmn" || key === "edns" || key === "enms" ? "EMin" : "EMax";
        let d = lvl > 0 ? bracket(lvl, n(r[side]), [1, 2, 3, 4, 5].map(i => n(r[side + "Lev" + i]))) : 0;
        d = d * Math.pow(2, n(r.HitShift));
        // the synergy: the maximum always, the minimum only above one point (256) or with EMinLev1 set (traced,
        // tools/skill_calc.py)
        if (r.EDmgSymPerCalc && (side === "EMax" || d > 256 || n(r.EMinLev1))) {
          const b = ev(parse(r.EDmgSymPerCalc), r, lvl, ctx); if (b) d += tdiv(d * b, 100);
        }
        if (key === "enms" || key === "exms") {  // then the character's mastery of the skill's element
          const m = ((ctx.stat || {})[MASTERY[(r.EType || "").trim()]]) || 0;
          if (m) d += tdiv(d * m, 100);
        }
        return key === "edmn" || key === "edmx" ? Math.floor(d / 256) : d;
      }
      if (key === "edln") {
        let d = len(lvl, n(r.ELen), [1, 2, 3].map(i => n(r["ELevLen" + i])));
        if (r.ELenSymPerCalc) { const b = ev(parse(r.ELenSymPerCalc), r, lvl, ctx); if (b) d += tdiv(d * b, 100); }
        return d;
      }
      if (key === "toht") return r.ToHitCalc ? ev(parse(r.ToHitCalc), r, lvl, ctx) : (lvl > 0 ? n(r.ToHit) + (lvl - 1) * n(r.LevToHit) : 0);
      const m = /^(clc|ast|pst)([1-6])$/.exec(key);
      if (m) return ev(parse(r[{ clc: "calc", ast: "aurastatcalc", pst: "passivecalc" }[m[1]] + m[2]] || ""), r, lvl, ctx);
      if (key === "len") return ev(parse(r.auralencalc || ""), r, lvl, ctx);
      return 0;
    }
    function link([name, key], ctx) {
      const lc = name.toLowerCase();
      const blvl = (ctx.blvl || {})[lc] || 0;
      if (key === "blvl") return blvl;
      const olvl = (ctx.lvl || {})[lc] !== undefined ? ctx.lvl[lc] : blvl;
      if (key === "lvl") return olvl;
      const id = byName[lc];
      return id ? kw(SK[id], key, olvl, Object.assign({}, ctx, { self_blvl: blvl })) : 0;
    }
    function ev(node, r, lvl, ctx) {
      switch (node[0]) {
        case "n": return node[1];
        case "kw": return kw(r, node[1], lvl, ctx);
        case "neg": return -ev(node[1], r, lvl, ctx);
        case "tern": return ev(node[1], r, lvl, ctx) ? ev(node[2], r, lvl, ctx) : ev(node[3], r, lvl, ctx);
        case "bin": {
          const a = ev(node[2], r, lvl, ctx), b = ev(node[3], r, lvl, ctx);
          switch (node[1]) {
            case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return tdiv(a, b);
            case "<": return +(a < b); case ">": return +(a > b); case "<=": return +(a <= b); case ">=": return +(a >= b);
            case "==": return +(a === b); case "!=": return +(a !== b); case "^": return b > 0 ? Math.pow(a, b) : 1;
          }
          return 0;
        }
        case "call": {
          const [, name, args] = node;
          if (name === "min" || name === "max") { const v = args.map(x => ev(x, r, lvl, ctx)); return name === "min" ? Math.min(...v) : Math.max(...v); }
          if (name === "skill" && args[0][0] === "link") return link(args[0][1], ctx);
          if (name === "stat" && args[0][0] === "link") return ((ctx.stat || {})[args[0][1][0].toLowerCase()]) || 0;
          return 0;
        }
        case "link": return link(node[1], ctx);
      }
      return 0;
    }
    function value(id, col, lvl, ctx) {
      const r = SK[id];
      if (!r || !r[col] || lvl <= 0) return 0;
      try { return ev(parse(r[col]), r, lvl, ctx || {}); } catch (e) { return 0; }
    }
    /* the skill names whose base points a formula reads (its synergies) */
    function synergies(id, col) {
      const r = SK[id]; if (!r || !r[col]) return [];
      const out = []; const re = /skill\('([^']+)'\.blvl\)/g; let m;
      while ((m = re.exec(r[col]))) if (!out.includes(m[1])) out.push(m[1]);
      return out;
    }
    /* a skill's own attack rating bonus at a level (toht: ToHit + (lvl - 1) x LevToHit, or ToHitCalc) */
    const tohit = (id, lvl, ctx) => (SK[id] && lvl > 0 ? kw(SK[id], "toht", lvl, ctx || {}) : 0);
    /* a missile's damage in 256ths (2026-11-24, Fists of Fire, traced in the live build): its Missiles.txt row's
       base + the levels' adds (the skills' brackets), its synergy on those whole points before the shift (the game's
       tooltips agree: Fists of Fire's nova maximum 13,527, 13,528 the skills' way), then for elemental damage the
       character's mastery of its element when the row has ApplyMastery. side "Min" / "Max"; phys: the physical columns
       (MinDamage, MinLevDam1-5, DmgSymPerCalc), which take no mastery */
    function missile(r, side, lvl, ctx, phys) {
      if (!r || lvl <= 0) return 0;
      const lo = side === "Min", base = phys ? (lo ? "MinDamage" : "MaxDamage") : (lo ? "EMin" : "Emax");
      const lev = phys ? (lo ? "MinLevDam" : "MaxLevDam") : (lo ? "MinELev" : "MaxELev");
      let d = bracket(lvl, n(r[base]), [1, 2, 3, 4, 5].map(i => n(r[lev + i])));
      const sy = phys ? r.DmgSymPerCalc : r.EDmgSymPerCalc;
      if (sy) { const v = ev(parse(sy), r, lvl, ctx || {}); if (v) d += tdiv(d * v, 100); }
      d = d * Math.pow(2, n(r.HitShift));
      if (!phys && n(r.ApplyMastery)) {
        const m = (((ctx || {}).stat || {})[MASTERY[(r.EType || "").trim()]]) || 0;
        if (m) d += tdiv(d * m, 100);
      }
      return d;
    }
    /* a keyword of a skill at a level (enms / exms: its elemental damage with the character's mastery, in 256ths) */
    const key = (id, k, lvl, ctx) => (SK[id] && lvl > 0 ? kw(SK[id], k, lvl, ctx || {}) : 0);
    return { value, tohit, synergies, missile, key, name: id => (SK[id] ? SK[id].name : "") };
  })();

  // ================================================================== the model
  const ethD = d => Math.floor(d * 5 / 4);
  /* a stat for a hit with weapon x: other gear's and the weapon's own. ItemStatCost marks these stats damagerelated: on
     a weapon they count for that weapon's hits only (as its enhanced damage and IAS), on other gear for every hit */
  const gw = (b, x, k) => (+b.g[k] || 0) + (x ? +x[k] || 0 : 0);
  const MAX_LVL = 60;
  const DUAL = { bar: true, ass: true };
  /* two weapons as the IAS Calculator's engine allows them: an Assassin two claws, a Barbarian two weapons that aren't
     claws, bows or crossbows, each one-handed or a sword made for one or two hands (until 2026-11-13 an Assassin's two
     swords counted as two weapons here while the frames were one weapon's) */
  const dual = b => !!(DUAL[b.cls] && b.o && b.o.on && W[b.o.code] && W[b.w.code]) && IAS.dual({ cls: b.cls, oh: "weapon", w: b.w.code, w2: b.o.code });
  /* why a card's two weapons aren't held together when "A weapon in each hand" is ticked ("" when they are), in the
     IAS engine's rule (2026-11-26, the author: a Barbarian with a Hyperion Spear and a Colossus Blade set to Frenzy:
     "which I believe requires 2 one handed weapons"; the page counted the spear alone and said why nowhere) */
  function holdWhy(b) {
    if (!DUAL[b.cls] || !b.o || !b.o.on || dual(b)) return "";
    const an = n => (/^[aeiou]/i.test(n) ? "an " : "a ") + n;
    const one = code => {
      const w = W[code], x = IAS.BASE[code];
      if (!w || !x || IAS.canSecond(b.cls, x)) return "";
      if (b.cls === "ass") return `${an(w.name)} isn’t a claw (an Assassin holds a claw in each hand)`;
      if (x.wc === "bow" || x.wc === "xbw") return `${an(w.name)} takes both hands`;
      if (x.wc === "ht1") return `${an(w.name)} is an Assassin’s claw`;
      return `${an(w.name)} takes both hands (a Barbarian holds a two-handed sword in one hand, but no other two-handed weapon)`;
    };
    return one(b.w.code) || one(b.o.code) || "";
  }
  /* why an attack can't be made at all (the IAS engine's reason, which leaves it no frames), said for this page: a
     two-weapon attack names the weapon that can't be paired; "" for a spell or when it can */
  function framesWhy(b, attack) {
    if (attack.kind === "cast" || attack.tick === "period") return "";
    const s = iasSetup(b, attack);
    if (s.atk && !IAS.SKILL[s.atk]) return "";
    const why = IAS.evaluate(s).why || "";
    if (!/needs a weapon in each hand\.$/.test(why)) return why;
    const h = holdWhy(b);
    return h ? why.replace(/\.$/, `, and ${h}.`) : !b.o.on ? why.replace(/\.$/, ": tick “A weapon in each hand” under Second weapon and pick one.") : why;
  }
  /* a weapon held in both hands: a two-handed one, but a Barbarian's sword made for one or two hands held in one (with
     a shield, or as one of two weapons). Until 2026-11-13 any class could hold such a sword "in one hand" here, with
     its one-hand damage. */
  const heldInTwo = (b, x) => { const w = W[x.code]; return !!(w && w.d2) && (!w.d1 || b.cls !== "bar" || (x.hand === "d2" && !dual(b))); };
  const isWolf = (b, a) => a && (a.form === "40");
  const isBear = (b, a) => a && (a.form === "TG");

  /* Frames per attack: the IAS Calculator's engine (IAS, above) on a build's setup; gear: other IAS on other gear */
  const FORMS = { "40": "wolf", TG: "bear" };
  function iasSetup(b, attack, gear) {
    const w = IAS.BASE[b.w.code] ? b.w.code : "", two = dual(b), base = IAS.BASE[w];
    // a Barbarian holds a sword made for one or two hands in one hand while the other hand holds something
    // a skill that needs a shield (Smite) holds one beside the weapon
    const needShield = !!(attack && attack.id && IAS.SKILL[attack.id] && (IAS.SKILL[attack.id].ia || []).includes("shld"));
    const oh = two ? "weapon" : needShield || (base && (base.f & 1) && (base.f & 2) && !heldInTwo(b, b.w)) ? "shield" : "none";
    return {
      // one monster in range: Strafe fires its fewest arrows, all at it
      cls: b.cls, form: FORMS[attack.form] || "human", atk: attack.id || 0, lvl: clamp(+b.s.lvl || 1, 1, MAX_LVL), tg: 1,
      w, wi: +b.w.ias || 0, oh, w2: two ? b.o.code : "", wi2: two ? +b.o.ias || 0 : 0,
      gear: gear !== undefined ? gear : +b.g.ias || 0, fana: +b.buf.fana || 0, frenzy: b.cls === "bar" ? +b.buf.frenzy || 0 : 0,
      fst: clamp(b.buf.stacks === undefined ? 5 : +b.buf.stacks, 0, 5),
      inc: b.cls === "bar" ? +b.buf.incHard || 0 : 0, bos: b.cls === "ass" && b.buf.bos > 0 && !b.buf.bosOff ? +b.buf.bosHard || 0 : 0,
      hustle: false, ww: +b.buf.were || 0, other: 0, cdr: b.s.cdr || "",
    };
  }
  /* one round of the attack: { frames, hits, per: each part's frames, alt: attack 1 and attack 2, note, r: the
     engine's result }. A held normal attack lasts attack 1 or attack 2, half the time each: a round is one of each,
     and attack 2 loses its hit when it ends before attack 1's hit frame (the game hits at attack 1's). Where both take
     as long (every weapon but an Assassin's claws and a Paladin's two-handed sword) it is one attack. */
  function roundOf(r) {
    const parts = r.t.parts, p = parts[0];
    if (parts.length > 1 && (parts[1].frames !== p.frames || parts.some(q => q.lost))) return { frames: parts.reduce((x, q) => x + q.frames, 0), hits: parts.reduce((x, q) => x + (q.lost ? 0 : q.hits), 0), per: parts.map(q => q.frames), alt: true, r };
    // a held Strafe or Fend can lose hits at some speeds (the game makes them on its side): hits are the ones that land
    if (p.swings) return { frames: p.frames, hits: p.landed !== undefined ? p.landed : p.hits, made: p.hits, per: p.swings, r };
    return { frames: p.frames, hits: p.hits, per: [p.frames], note: p.fixed ? "fixed" : "", r };
  }
  /* A spell's speed (2026-11-25, the spells plan; the Breakpoints page's rule, tools/breakpoint_data.py): effective FCR
     trunc(120 x FCR / (120 + FCR)); rate = trunc(the class's (or form's) cast animation speed x min(175, 100 + effective)
     / 100); a cast takes ceil(256 x frames / rate) - 1 frames; Chain Lightning and Frozen Orb are cast as a sequence at
     speed 256: ceil(256 x steps / rate) frames. A cooldown (Skills.txt delay) counts from the release: the cast lasts at
     least the release + the cooldown, as the IAS engine counts an attack's. fcr: another FCR than the build's (the
     breakpoints). { frames, hits: 1, per, note: "cast", cast: {fcr, eff, own, rel, cd, seq} } */
  function castFrames(b, attack, fcr) {
    const C = DATA.cast;
    if (!C) return null;
    /* a spell with a pace of its own (2026-11-25, traced in the live build): Inferno held
       breathes once a channel loop, ceil(3 steps x 256 / its rate 256) + 1 = 4 frames, whatever the cast rate (not
       timed in game yet); Thunder Storm strikes every perdelay frames, 50 less 1.25 for each point put in it */
    /* the Assassin's traps (2026-11-25, traced in the live build): laid with the S2 animation at your attack
       speed (the IAS engine); a trap lives its rise, its first think and calc4 shots (each its swing + aidel frames),
       so a new trap every life / petmax frames keeps them all up (laying faster only replaces the oldest) */
    if (attack.trap) {
      const T = ((DATA.ex || {}).traps || {})[attack.id];
      if (!T) return null;
      const r = IAS.SKILL[attack.id] ? IAS.evaluate(iasSetup(b, attack)) : null, lay = r && !r.why ? roundOf(r).frames : 0;
      /* Death Sentry: its traps stay (500 explosions), each exploding a corpse near the monster every swing + aidel
         frames: with corpses enough, an explosion every (swing + aidel) / petmax frames whatever the attack speed */
      if (attack.ex === "dsentry") {
        const cycle = T.swing + T.aidel, n = Math.max(1, Math.ceil(cycle / Math.max(1, T.petmax)));
        return { frames: n, hits: 1, per: [n], note: "cast", cast: { fcr: +b.g.fcr || 0, eff: 0, own: lay, rel: lay, cd: 0, seq: false, tick: "summon", trap: true, dsentry: true, cycle, petmax: T.petmax, keep: n } };
      }
      const shots = trapShots(b, attack), life = T.spawn + T.aidel + shots * (T.swing + T.aidel), keep = Math.ceil(life / Math.max(1, T.petmax));
      const n = Math.max(lay || 1, keep);
      return { frames: n, hits: 1, per: [n], note: "cast", cast: { fcr: +b.g.fcr || 0, eff: 0, own: lay, rel: lay, cd: 0, seq: false, tick: "summon", trap: true, keep, petmax: T.petmax, life, shots, ias: +b.g.ias || 0 } };
    }
    if (attack.tick && attack.tick !== "summon") {
      const v = fcr !== undefined ? fcr : +b.g.fcr || 0, eff = 120 + v === 0 ? 0 : Math.trunc(120 * v / (120 + v));
      const n = attack.tick === "channel" ? Math.ceil(768 / 256) + 1
        : attack.tick === "aura" ? Math.max(1, +(SK[attack.id] || {}).Param4 || 20)
        : Math.max(1, Calc.value(attack.id, "perdelay", +b.s.lvl || 1, Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) })));
      return { frames: n, hits: 1, per: [n], note: "cast", cast: { fcr: v, eff, own: n, rel: n, cd: 0, seq: false, tick: attack.tick, dfill: !!attack.dfill } };
    }
    const key = attack.form === "40" ? "wolf" : attack.form === "TG" ? "bear" : b.cls, A = C.cls[key];
    if (!A) return null;
    const v = fcr !== undefined ? fcr : +b.g.fcr || 0, eff = 120 + v === 0 ? 0 : Math.trunc(120 * v / (120 + v));
    const seq = C.seq[attack.id];
    const rate = Math.trunc((seq ? 256 : A[1]) * Math.min(C.cap, 100 + eff) / 100);
    if (!(rate > 0)) return null;
    const own = seq ? Math.ceil(256 * seq[0] / rate) : Math.ceil(256 * A[0] / rate) - 1;
    const rel = Math.max(1, Math.ceil(256 * (seq ? seq[1] : A[2]) / rate));
    const cd = attack.cd ? +attack.cd[clamp(Math.round(+b.s.lvl || 1), 1, attack.cd.length) - 1] || 0 : 0;
    let n = cd ? Math.max(own, rel + cd) : own;
    /* Dark Pact (2026-11-25): it takes the curses off, so a cycle is your own curses cast again and Dark Pact, each a
       cast */
    if (attack.ex === "dpact") {
      const mine = Math.min(yourCurses(b), (b.deb.curses || []).filter(r => CURSES[r.c] && (r.c === "other" || +r.lvl > 0)).length);
      if (mine > 0) return { frames: n * (1 + mine), hits: 1, per: [n * (1 + mine)], note: "cast", cast: { fcr: v, eff, own, rel, cd, seq: !!seq, cycle: 1 + mine } };
    }
    /* Hydra and Lesser Hydra (2026-11-25): at most petmax heads, 3 a cast, each up for its life: a new cast every life x
       3 / petmax frames keeps them all up (casting faster replaces the oldest) */
    const H = attack.tick === "summon" ? ((DATA.ex || {}).heads || {})[attack.id] : null;
    if (H && H.keep > n) return { frames: H.keep, hits: 1, per: [H.keep], note: "cast", cast: { fcr: v, eff, own, rel, cd, seq: !!seq, tick: "summon", keep: H.keep, petmax: H.petmax } };
    return { frames: n, hits: 1, per: [n], note: "cast", cast: { fcr: v, eff, own, rel, cd, seq: !!seq } };
  }
  // a trap's shots: calc4 of its own skill (the trap's, at the trap skill's level; Charged Bolt Sentry's 5 + your
  // Lightning Sentry's base points / 4)
  const trapShots = (b, attack) => { const T = ((DATA.ex || {}).traps || {})[attack.id]; return T ? Math.max(0, Calc.value(T.mon, "calc4", +b.s.lvl || 1, ctxOf(b, attack)) || 0) : 0; };
  /* the FCR breakpoints of a cast: [{fcr, fr}] from no FCR on, the first FCR of each frame count (up to 300) */
  function castLadder(b, attack) {
    const out = [];
    let last = null;
    for (let v = 0; v <= 300; v++) {
      const f = castFrames(b, attack, v);
      if (f && f.frames !== last) { out.push({ fcr: v, fr: f }); last = f.frames; }
    }
    return out;
  }
  // a spell's damage (no weapon hit): every cast, and Fire Blast's bombs, thrown at attack speed (2026-11-25)
  const isSpell = a => !!a && (a.kind === "cast" || !!a.bombs) && !a.frames_only;
  const frames_ = (b, attack, gear) => frames(b, attack, gear);
  function frames(b, attack, gear) {
    // (Blade Shield: no cast, a strike every perdelay frames while the buff is on)
    if (attack.kind === "cast" || attack.tick === "period") return castFrames(b, attack);
    const s = iasSetup(b, attack, gear);
    if (s.atk && !IAS.SKILL[s.atk]) return null;
    const r = IAS.evaluate(s);
    return r.why ? null : roundOf(r);
  }
  /* the weapons an attack hits with, as the game picks them by the skill's weapon choice: the first weapon (a normal
     attack and most skills), the first then the other (Double Swing, Frenzy, Berserk, Double Throw, Dragon Claw), both
     (Whirlwind, Blade Dance). The first-then-other choice goes by the hit's number in the attack (traced 2026-11-25 in
     the live build: the game's attack events carry the hit's number, 0, 1, ..., which it writes into the unit's
     sequence frame before the hit, and picks the first weapon on an even one, the other on an odd one), so an attack of
     one hit with that choice (Tiger Strike, Fists of Fire, Claws of Thunder, Blades of Ice) always strikes with the first
     weapon (until 2026-11-25 the page took their hits with each weapon in turn) */
  function weaponsFor(b, attack) {
    if (!dual(b)) return [b.w];
    const sk = IAS.SKILL[attack.id], ws = sk ? sk.ws || 0 : 0;
    if (ws === 3 && sk.m !== "SQ") return [b.w];
    return ws === 2 || ws === 3 ? [b.w, b.o] : [b.w];
  }
  /* the frames as the game's breakpoints show them: attack 1 / attack 2 */
  const frLabel = fr => (fr.alt ? fr.per.join(" / ") : String(fr.frames));
  /* the masteries the Skill section asks for, by class; only the build's class's count (a build switched from a
     Barbarian kept One Handed Weapon Mastery's damage, unseen, until 2026-11-13) */
  const MAST = { bar: [128, 134, 135], ass: [252], ama: [19, 9, 23], sor: [61, 63, 65] };
  const MAST_BASE = { 23: true };   // asked as base points (Penetrate: pierce, and Strafe's synergy)
  function mOf(b) {
    const out = {};
    for (const id of MAST[b.cls] || []) if (+(b.m || {})[id] > 0) out[id] = +b.m[id];
    return out;
  }
  /* what a skill formula reads of the build: synergies' base points (blvl), and skills' levels (lvl): a mastery's
     (Dragon Claw's damage reads Claw Mastery's level) and the attack's own */
  function ctxOf(b, attack) {
    const blvl = {}, lvl = {};
    for (const [id, v] of Object.entries(mOf(b))) {
      const k = SK[id] ? SK[id].skill.toLowerCase() : "";
      if (!k) continue;
      lvl[k] = v;
      if (MAST_BASE[id]) blvl[k] = v;
    }
    for (const [k, v] of Object.entries(b.s.syn || {})) blvl[k.toLowerCase()] = +v || 0;
    if (attack && attack.id && SK[attack.id]) lvl[SK[attack.id].skill.toLowerCase()] = +b.s.lvl || 0;
    return { blvl, lvl, self_blvl: b.s.lvl };
  }
  /* the attack skill's hard points (b.s.hard; until a build has it, its level up to 20) and the share of a hit's
     physical damage it turns into its element: Concentrate's calc4, 30 + 2 x hard points (S14), 0-100 */
  const hardOf = b => clamp(Math.round(+b.s.hard || Math.min(+b.s.lvl || 1, 20)), 1, 20);
  /* Magic, Fire and Cold Arrow (mconv, 2026-11-25): their arrow's damage function (Missiles.txt srvdmg 1, the game's)
     turns dParam1 + (level - 1) x dParam2 % (50) of its physical damage into its element after crit and deadly strike,
     as Concentrate's start function does */
  const convPct = (b, attack) => (attack.mconv ? clamp(attack.mconv[0] + ((+b.s.lvl || 1) - 1) * attack.mconv[1], 0, 100)
    : attack.conv ? clamp(Calc.value(attack.id, attack.conv, +b.s.lvl || 1, Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) })), 0, 100) : 0);

  /* one weapon's damage range (whole points) */
  function weaponRange(x, attack, b) {
    const w = W[x.code];
    if (!w) return { min: 1, max: 2 };
    let d = attack.throw && w.dt ? w.dt : heldInTwo(b, x) ? w.d2 : (w.d1 || w.dt);
    if (x.eth && w.eth) d = d.map(ethD);
    const ed = +x.ed || 0;
    // its "+X damage" (dmg: item_normaldamage) goes to both, after enhanced damage, as its + min / + max (the damage
    // fill adds the stat to the minimum and the maximum, traced 2026-11-22)
    const both = +x.dmg || 0;
    return { min: d[0] + Math.trunc(d[0] * ed / 100) + (+x.min || 0) + both, max: d[1] + Math.trunc(d[1] * ed / 100) + (+x.max || 0) + both, base: d };
  }

  /* a kick's hit (Dragon Talon; traced 2026-11-22 in the live build: PD2's own kick damage, the original game's kick
     damage it calls): the weapon's damage isn't used. Minimum = the boots' kick damage + "+X kick damage" + flat minimum
     damage on other gear + the weapon's "+X damage" (its stats are on) + Dexterity / 4; maximum the same with the
     maxima and Dexterity / 3 (in 256ths of a point). Times (100 + the skill's kick damage % + the larger of -90 and
     (Strength x the boots' Strength bonus / 100 + Dexterity x their Dexterity bonus / 100 + the auras' and buffs' %) +
     enhanced damage on other gear + damage against demons / undead) / 100. A kick has no weapon for a mastery; its
     crit, deadly strike and crushing blow are other gear's and the weapon's (its stats are on), its elemental damage
     other gear's (not counted here). x: the weapon whose stats are on (the first) */
  /* Dragon Flight's kick (attack.flight; 2026-11-26, traced 2026-11-25 in the live build): PD2's Dragon Flight calls the
     game's own kick damage, not PD2's kick: the boots' kick damage with "+X kick damage" twice, x (100 + calc2 (100 + 25
     a level after the first) + Strength x the boots' Strength bonus (+ Dexterity x their Dexterity bonus) + the auras'
     and buffs' %, at least -90, + other gear's enhanced damage) / 100. No Dexterity / 4 / 3, no flat damage of other
     gear, no "+X damage", nothing against demons or undead (kickHit's), and no critical or deadly strike (evaluate). */
  function kickHit(b, attack, T, x, sp, aur) {
    const bt = BOOTS[b.k.boots] || DATA.boots[0], kd = +b.k.kd || 0, fl = !!attack.flight, both = fl ? 0 : +x.dmg || 0;
    const str = +b.c.str || 0, dex = fl ? 0 : +b.c.dex || 0;
    const strB = Math.trunc(str * bt.sb / 100), dexB = Math.trunc((+b.c.dex || 0) * bt.db / 100);
    let vs = 0;
    if (T.kind !== "player" && !fl) vs = T.type === "demon" ? gw(b, x, "edd") : T.type === "undead" ? gw(b, x, "edu") : 0;
    // "+X kick damage" counts twice with boots on: the kick function adds it first and again with the boots' damage
    // (traced 2026-11-25; until then once)
    const mn = bt.k[0] + 2 * kd + (fl ? 0 : +b.g.min || 0) + both, mx = bt.k[1] + 2 * kd + (fl ? 0 : +b.g.max || 0) + both, off = +b.g.ed || 0;
    const range = extra => {
      const pct = sp + Math.max(strB + dexB + aur.p, -90);
      const all = 100 + pct + off + extra;
      let lo = mn * 256 + Math.trunc(dex * 256 / 4), hi = mx * 256 + Math.trunc(dex * 256 / 3);
      lo = Math.trunc(lo * all / 100); hi = Math.trunc(hi * all / 100);
      return { pct, lo, hi };
    };
    const r = range(vs);
    const ms = { dmg: 0, crit: 0, cb: 0, cbe: 0, cmult: 0, names: [] };
    /* the character screen (2026-11-25, traced in the live build): Dragon Tail's two lines, the author's
       screenshot exact (874-1645 and 3066-5215, their Assassin at 21 without buffs): the kick in whole points, trunc((the
       boots' kick damage and the rest + Dexterity / 4, / 3 for the maximum, each rounded down) x the % / 100), plus the
       elemental damage the screen adds (screenElem: the gear's and the weapon in hand's); then the explosion, that kick x
       (100 + calc1 + fire skill damage) / 100. Dragon Talon's and Dragon Flight's lines below (traced, not yet checked
       against a screenshot) */
    let screen = null;
    if (attack.k === "dragontail") {
      const all = 100 + sp + Math.max(strB + dexB + aur.p, -90) + off;
      const plo = Math.trunc((mn + Math.trunc(dex / 4)) * all / 100), phi = Math.trunc((mx + Math.trunc(dex / 3)) * all / 100);
      const E = screenElem(b, x), f = 100 + Calc.value(attack.id, "calc1", +b.s.lvl || 0, ctxOf(b, attack)) + (+b.g.fm || 0);
      screen = { lo: plo + E.lo, hi: phi + E.hi, el: E.hi > 0, lo2: Math.trunc(plo * f / 100), hi2: Math.trunc(phi * f / 100) };
    }
    /* Dragon Flight's character screen (the same trace): PD2's kick line (Dragon Talon's), not the kick it deals: the
       boots' kick damage and the rest + Dexterity / 4 on BOTH ends, other gear's flat damage and "+X damage", x (100 +
       calc2 + the boots' % + the auras' % + other gear's enhanced damage) / 100, plus the elemental damage the screen adds
       (screenElem); the maximum at least the minimum + 1. The author's numbers by hand (Dragon Flight 36, Strength 194,
       Dexterity 148, Myrmidon Greaves, Aegis): 2044-3465 */
    // Dragon Talon's (2026-11-26) the same line with its own calc2: its maximum short of the kick's (Dexterity / 4, not / 3)
    if (fl || attack.k === "dragontalon") {
      const d4 = Math.trunc((+b.c.dex || 0) / 4), g = fl ? (+b.g.min || 0) + (+x.dmg || 0) : 0, G = fl ? (+b.g.max || 0) + (+x.dmg || 0) : 0;
      const all = 100 + sp + Math.max(strB + dexB + aur.p, -90) + off, E = screenElem(b, x);
      const lo = Math.trunc((mn + g + d4) * all / 100) + E.lo, hi = Math.trunc((mx + G + d4) * all / 100) + E.hi;
      screen = { lo, hi: Math.max(hi, lo + 1), el: E.hi > 0, flight: true };
    }
    return { wr: { min: mn, max: mx, base: bt.k }, ms, strB, dexB, vs, pct: r.pct, off, mn256: r.lo, mx256: r.hi,
             avg256: r.hi > r.lo ? (r.lo + r.hi - 1) / 2 : r.lo, screen, kick: { boots: bt, kd, both, dex } };
  }
  /* Smite (2026-11-25, traced in the live build; PD2's own start and hit functions, the original game's shape):
     the shield's damage (its Armor.txt row: an ethereal one's isn't raised), + Holy Shield's while it is up (smiteShield),
     + every item's "+X damage", never the weapon's damage; min below 1 is 1, max at or below min is min + 1; x (100 +
     calc1 + the auras' % + Strength x the shield's Strength bonus (100) / 100, at least -90, + other gear's enhanced
     damage, the shield's in it (the weapon's own never counts)) / 100; then a roll of 0 to just under its edmx, as
     physical damage (extrasOf). No crit, deadly strike, elemental or poison damage, nothing against demons or undead,
     no flat + min / + max: its hit skips the melee damage code that adds them. It never misses. The character screen
     (descdam 10, the original game's code): the shield's and Holy Shield's whole points m + trunc((m x P + enhanced
     damage) / 100): its enhanced damage is added, not multiplied, so the line all but leaves it out */
  /* a spell's "hit" (2026-11-25, Fist of the Heavens and Holy Bolt): nothing from the weapon, so the weapon-hit pipeline
     adds nothing (no critical or deadly strike, crushing blow, elemental damage or poison from gear, no roll to hit:
     their missiles have no ToHit) and the spell's damage comes as the extras (extrasOf) */
  const spellHit = () => ({ wr: { min: 0, max: 0, base: null }, ms: { dmg: 0, crit: 0, cb: 0, cbe: 0, cmult: 0, names: [] }, strB: 0, dexB: 0,
    vs: 0, pct: 0, off: 0, mn256: 0, mx256: 0, avg256: 0, screen: null, spell: true });
  /* a skill's own physical damage on its missile (Blade Fury's, Blade Sentinel's; 2026-11-25,
     traced in the live build): PD2's missile damage keeps the game's own minimum and maximum physical damage of a skill: MinDam + its levels' adds, the synergy (DmgSymPerCalc, its base points) on
     those whole points, << HitShift (256ths); with the weapon's x SrcDam / 128, then raised by the % */
  function skillPhys(b, attack) {
    const r0 = SK[attack.id], lvl = +b.s.lvl || 0;
    if (!r0 || !(lvl > 0)) return { lo: 0, hi: 0 };
    const r = Object.assign({}, r0, { MinDamage: r0.MinDam, MaxDamage: r0.MaxDam }), ctx = ctxOf(b, attack);
    return { lo: Calc.missile(r, "Min", lvl, ctx, true), hi: Calc.missile(r, "Max", lvl, ctx, true) };
  }
  function smiteShield(b) {
    const sh = SHIELDS[b.sm && b.sm.shield] || SHIELDS.pab || DATA.shields[0], lvl = +((b.sm || {}).hs) || 0;
    let lo = 0, hi = 0;
    if (lvl > 0 && SK[117]) {
      const r = Object.assign({}, SK[117], { MinDamage: SK[117].MinDam, MaxDamage: SK[117].MaxDam });
      const ctx = { blvl: { smite: hardOf(b), defiance: +((b.sm || {}).def) || 0 } };
      lo = Calc.missile(r, "Min", lvl, ctx, true); hi = Calc.missile(r, "Max", lvl, ctx, true);
    }
    return { sh, hs: { lo, hi, lvl } };
  }
  function smiteHit(b, attack, T, x, sp, aur) {
    const { sh, hs } = smiteShield(b), str = +b.c.str || 0, both = (+x.dmg || 0) + (+b.g.dmg || 0);
    const strB = Math.trunc(str * (sh.sb || 100) / 100), off = +b.g.ed || 0;
    const pct = Math.max(sp + aur.p + strB, -90);
    let lo = (sh.d[0] + both) * 256 + hs.lo, hi = (sh.d[1] + both) * 256 + hs.hi;
    if (lo < 256) lo = 256;
    if (hi <= lo) hi = lo + 256;
    lo += tdiv(lo * (pct + off), 100); hi += tdiv(hi * (pct + off), 100);
    const m = sh.d[0] + Math.floor(hs.lo / 256), M = sh.d[1] + Math.floor(hs.hi / 256), P = sp + aur.p + strB;
    const screen = { lo: m + Math.trunc((m * P + off) / 100), hi: M + Math.trunc((M * P + off) / 100), el: false };
    const ms = { dmg: 0, crit: 0, cb: 0, cbe: 0, cmult: 0, names: [] };
    return { wr: { min: sh.d[0] + both, max: sh.d[1] + both, base: sh.d }, ms, strB, dexB: 0, vs: 0, pct, off, mn256: lo, mx256: hi,
             avg256: hi > lo ? (lo + hi - 1) / 2 : lo, screen, smite: { sh, hs, both } };
  }
  /* the damage bonus of the build's attack skill, auras and buffs (the damagepercent stat and the skill's own %) */
  function skillPct(b, attack) {
    // Charged Strike's bolt count (calc1) is added to its hit's damage % too (xpct: the game's start function 6, which
    // PD2 keeps; its tooltip shows no such line; traced in the live build)
    if (attack.xpct) return Calc.value(attack.id, attack.xpct, b.s.lvl, ctxOf(b, attack));
    if (!attack.dmg) return 0;
    return Calc.value(attack.id, attack.dmg, b.s.lvl, ctxOf(b, attack));
  }
  function auraPct(b, attack) {
    let p = 0; const parts = [];
    const add = (lbl, v) => { if (v) { p += v; parts.push([lbl, v]); } };
    const a = b.aur;
    if (a.might > 0) add("Might", Calc.value(98, a.mightSelf ? "passivecalc1" : "aurastatcalc1", a.might));
    if (a.conc > 0) add("Concentration", Calc.value(113, a.concSelf ? "passivecalc1" : "aurastatcalc1", a.conc));
    if (b.buf.fana > 0) add("Fanaticism", Calc.value(122, b.buf.fanaSelf ? "passivecalc1" : "aurastatcalc3", b.buf.fana));
    if (a.bc > 0) add("Battle Command", Calc.value(155, "aurastatcalc2", a.bc));
    if (a.grim > 0) add("Grim Ward", Calc.value(150, "aurastatcalc1", a.grim));
    if (a.wolv > 0) add("Heart of Wolverine", Calc.value(297, "aurastatcalc2", a.wolv));
    if (isWolf(b, attack) && b.buf.were > 0) add("Werewolf", Calc.value(223, "aurastatcalc4", b.buf.were));
    if (isBear(b, attack) && b.buf.bear > 0) add("Werebear", Calc.value(228, "aurastatcalc1", b.buf.bear));
    if (isBear(b, attack) && b.buf.maul > 0) add("Maul charges", Calc.value(233, "aurastatcalc1", b.buf.maul));
    return { p, parts };
  }
  /* weapon mastery's damage % and its crit / crushing blow / crit multiplier, the way the game picks them */
  function mastery(b, attack, x) {
    const w = W[x.code]; const out = { dmg: 0, crit: 0, cb: 0, cbe: 0, cmult: 0, names: [] };
    if (!w) return out;
    const m = mOf(b);
    const sk = attack.itype || "";
    const types = DATA.types;
    const isA = (t, set) => types[set].includes(t);
    const meleeSkill = !sk || (isA(sk, "weap") && !isA(sk, "miss") && !isA(sk, "thro"));
    const throwing = !!attack.throw;
    // One Handed (1han, or a two-hander a barbarian holds in one hand) / Two Handed (2han held in both hands); until
    // 2026-11-13 a sword held in one hand beside a shield counted as held in both
    const two = heldInTwo(b, x);
    if (m[128] > 0 && !two && (has(w, "1han") || (b.cls === "bar" && has(w, "2han") && has(w, "mele"))) && !attack.missile) {
      if (!throwing) out.dmg += Calc.value(128, "passivecalc2", m[128]);
      if (meleeSkill) out.crit += Calc.value(128, "passivecalc3", m[128]);
      out.names.push("One Handed Weapon Mastery");
    }
    if (m[134] > 0 && has(w, "2han") && two && !attack.missile) {
      if (!throwing) out.dmg += Calc.value(134, "passivecalc2", m[134]);
      out.cb += Calc.value(134, "passivecalc3", m[134]);
      out.cbe += Calc.value(134, "passivecalc4", m[134]);
      out.names.push("Two Handed Weapon Mastery");
    }
    if (m[135] > 0 && has(w, "thro") && throwing) {
      out.dmg += Calc.value(135, "passivecalc2", m[135]);
      if (isA(sk || "thro", "thro")) out.crit += Calc.value(135, "passivecalc3", m[135]);
      out.names.push("Throwing Mastery");
    }
    if (m[252] > 0 && has(w, "asm")) {
      // on Blade Fury's and Blade Sentinel's missiles too: PD2's missile damage asks PD2's weapon mastery, which
      // picks the melee stats for anything but a throwing weapon with a throwing skill
      // (traced 2026-11-25; until then the page left it out of every missile)
      if (!throwing) out.dmg += Calc.value(252, "passivecalc2", m[252]);
      if (types.h2h.some(t => t === sk) || sk === "" || isA("h2h", "weap") && (sk === "weap" || sk === "mele")) out.crit += Calc.value(252, "passivecalc3", m[252]);
      out.names.push("Claw and Dagger Mastery");
    }
    if (m[19] > 0 && has(w, "spea")) {
      out.dmg += Calc.value(19, throwing ? "passivecalc3" : "passivecalc1", m[19]);
      out.cmult += Calc.value(19, "passivecalc2", m[19]);
      out.names.push("Javelin and Spear Mastery");
    }
    return out;
  }

  /* What is on the monster (the curse lists, the author's picks on the review page, 2026-11-24): the curses a build
     puts on it itself (its card's Curses and debuffs: its own skill, charges, a chance to cast on striking), your
     mercenary's (the Act 4 Dark Ascendant's own Amplify Damage) and the party's (the monster's fields), and Battle Cry.
     PD2 S14's curse cap (the patch notes: "a curse cast from a unit with increased max curses will allow other units to
     apply curses up to that limit"): the monster holds as many curses as the most any one cursing it may apply, 1 +
     Curse Mastery's base points / 10 (CurMas' max_curses) + the gear's "you may apply an additional curse"
     (max_curses: Raekor's Virtue, Darkforce Spawn, Ebonbane, Gloom, Last Wish), the Act 4 mercenary 1 + its Curse
     Mastery's level / 10 (Hireling.txt: 11, so 2). The build's own count first, then your mercenary's, then the party's.
     A curse is one state on the monster: the same curse twice counts once, the stronger (the mercenary's Amplify
     Damage is the amplifydamage state too). "Another curse" (Life Tap, Iron Maiden, ...) changes no damage here but
     takes a place. Battle Cry is no curse (it stays beside them): the higher of the build's and the others' counts, the
     others' on a tie. b null: the others' alone. Each curse's values are the stat's change, below 0: v physical
     resistance (Amplify Damage, Decrepify), dv the monster's defense in % (Weaken), df its defense in points (Attract:
     its armorclass, before the %); Lower Resist's is per element (lowResOf). */
  const CURSES = { amp: "Amplify Damage", decrep: "Decrepify", weaken: "Weaken", attract: "Attract", lowres: "Lower Resist", other: "Another curse" };
  const CURSE_PICK = Object.entries(CURSES).map(([k, n]) => ({ value: k, label: k === "other" ? "Another curse (Life Tap, Iron Maiden, …)" : n }));
  // a Paladin's own Holy aura (its attack rating): skill id, name
  const HOLY = { fire: [102, "Holy Fire"], freeze: [114, "Holy Freeze"], shock: [118, "Holy Shock"], sanc: [119, "Sanctuary"] };
  const AURA_AR = ["Fanaticism", "Concentration", "Blessed Aim", "Heart of Wolverine", "Werewolf", "Werebear", "Enchant", "Cold Enchant"];
  // Hell's mercenaries (Hireling.txt): the Act 4 one's Amplify Damage at its level (79-99), its curses; the Act 5 one's
  // Battle Cry
  const MERCS = DATA.mercs;
  const a4Lvl = m => MERCS.a4.at + Math.floor((clamp(+m || 0, MERCS.a4.lvl, 99) - MERCS.a4.lvl) * MERCS.a4.per / 32);
  const MERC_CURSES = 1 + Calc.value(374, "passivecalc1", MERCS.a4.cm);
  function curseValue(kind, lvl, curmas, a4) {
    if (!(lvl > 0)) return 0;
    if (a4) return Calc.value(552, "aurastatcalc1", lvl);
    if (kind === "amp") return Calc.value(66, "aurastatcalc1", lvl, { blvl: { curmas: +curmas || 0 } });
    if (kind === "decrep") return Calc.value(87, "aurastatcalc5", lvl);
    return 0;
  }
  const curseDef = (kind, lvl) => (kind === "weaken" && lvl > 0 ? Calc.value(72, "aurastatcalc2", lvl) : 0);
  const curseFlat = (kind, lvl, curmas) => (kind === "attract" && lvl > 0 ? Calc.value(86, "aurastatcalc1", lvl, { blvl: { curmas: +curmas || 0 } }) : 0);
  const curseOf = (kind, lvl, curmas, src) => ({ kind, lvl, cm: +curmas || 0, src, own: src === "own", a4: src === "merc",
    v: curseValue(kind, lvl, curmas, src === "merc"), dv: curseDef(kind, lvl), df: curseFlat(kind, lvl, curmas) });
  // how strong a curse is against another of its kind (all its changes are below 0)
  const curseStrength = c => -((c.v || 0) + (c.dv || 0) + (c.df || 0) + (c.kind === "lowres" ? lowResOf("fireresist", c) : 0));
  // the curses a build may apply: 1, Curse Mastery's (a Necromancer's base points), the gear's
  const curseName = x => `${CURSES[x.kind]}${x.kind === "other" ? "" : ` ${x.lvl}`}`;
  const curseWho = x => (x.own ? "yours" : x.a4 ? "your mercenary’s" : "the party’s");   // "(yours)"
  const curseOwner = x => (x.own ? "your" : x.a4 ? "your mercenary’s" : "the party’s");  // "your Amplify Damage 20"
  const yourCurses = b => 1 + (+b.deb.extra || 0) + (b.cls === "nec" ? Calc.value(374, "passivecalc1", +b.deb.cm || 0) : 0);
  function onMonster(b, T) {
    const d = b && b.deb, cm = b && b.cls === "nec" ? +d.cm || 0 : 0, mine = [], merc = [], party = [];
    const counts = r => CURSES[r.c] && (r.c === "other" || +r.lvl > 0);
    if (d) for (const r of d.curses || []) if (counts(r)) mine.push(curseOf(r.c, +r.lvl || 0, cm, "own"));
    for (const r of T.others || []) {
      if (r.who === "a4") merc.push(curseOf("amp", a4Lvl(r.mlvl), 0, "merc"));
      else if (counts(r)) party.push(curseOf(r.c, +r.lvl || 0, r.cm, "party"));
    }
    const caps = { you: mine.length ? yourCurses(b) : 0, merc: merc.length ? MERC_CURSES : 0, party: party.length ? clamp(+T.partyMax || 1, 1, 3) : 0 };
    const cap = Math.max(1, caps.you, caps.merc, caps.party), all = mine.concat(merc, party), best = {};
    all.forEach((c, i) => { c.st = c.kind === "other" ? "other" + i : c.kind; if (!best[c.st] || curseStrength(c) > curseStrength(best[c.st])) best[c.st] = c; });
    let n = 0;
    for (const c of all) {
      if (best[c.st] !== c) { c.off = "same"; c.by = best[c.st]; }  // the same curse as another: the stronger counts
      else if (n >= cap) c.off = "cap";      // past what the monster holds
      else n++;
    }
    const bcOf = (lvl, own) => (lvl > 0 ? { lvl, v: Calc.value(146, "aurastatcalc2", lvl), dv: Calc.value(146, "aurastatcalc1", lvl), own } : null);
    const ob = bcOf(+T.bc || 0, false), mb = bcOf(d ? +d.bc || 0 : 0, true);
    const bc = mb && (!ob || mb.lvl > ob.lvl) ? mb : ob;
    return { all, curses: all.filter(c => !c.off), cap, caps, bc, bcLow: bc === mb ? ob : mb };
  }
  /* the monster's physical resistance after its curses and Battle Cry (each counts half against a monster whose own
     resistance is 100% or more): parts [curse, its change] */
  function cursedRes(b, T) {
    const base = +T.res || 0, immune = base >= 100;
    const half = v => (immune ? tdiv(v, 2) : v);
    const on = onMonster(b, T);
    const parts = on.curses.filter(c => c.v).map(c => [c, half(c.v)]);
    const curse = parts.reduce((t, x) => t + x[1], 0), bc = on.bc ? half(on.bc.v) : 0;
    return { base, immune, on, parts, curse, bc, res: base + curse + bc };
  }
  /* the monster's physical resistance against this build, and against crushing blow. Below 100%, pierce lowers it, and
     whatever is then below 0% counts half against a player's hit, pierce or not (Amplify Damage's -34% on a monster with
     none: -17%); at least -100%. Crushing blow takes the resistance with the curses, no pierce and no halving. (Until
     2026-11-21 the page halved it only with pierce.) */
  function resist(b, attack, T) {
    const C = cursedRes(b, T);
    let r = C.res, halved = false;
    const cbRes = r;
    let pierce = (+b.g.pierce || 0);
    if (attack.k === "berserk") pierce += Calc.value(152, "aurastatcalc3", b.s.lvl);
    if (b.cls === "ama" && (b.m[23] || 0) > 0 && attack.missile) pierce += Calc.value(23, "passivecalc2", b.m[23], { self_blvl: b.m[23] });
    /* Blade Sentinel's blade: the sentinel's own pierce, half of yours (Skills.txt passivestat2 passive_phys_pierce
       stat('passive_phys_pierce'.accr) / 2, which the game gives the sentinel when it is summoned; 2026-11-25) */
    if (attack.sentinel) pierce = Math.trunc(pierce / 2);
    if (r < 100) { r -= pierce; if (r < 0) { r = tdiv(r, 2); halved = true; } }
    r = Math.max(r, -100);
    return { res: r, cbRes, C, halved, pierce: cbRes < 100 ? pierce : 0, mult: r >= 100 ? 0 : (100 - r) / 100, cbMult: cbRes >= 100 ? 0 : (100 - cbRes) / 100 };
  }

  /* Elemental damage (2026-11-24, the author: "the need to support elemental damage like Fists of Fire"; traced the same
     day in the live build of 11-04, the game's own melee damage fill and PD2's resistance code):
     - A hit's fire, lightning, cold and magic damage is one roll each over everything the character has of it: the
       weapon's own (on its hits only, as its enhanced damage), other gear's and charms', a Paladin's own Holy Fire /
       Holy Freeze / Holy Shock / Sanctuary (their damage on attacks). The minimum and maximum are each raised by the
       element's +% skill damage ("+12% to Fire Skill Damage": masteries count on attacks, not only skills), then the
       skill's SrcDam / 128 as the physical part. Poison likewise, a frame's damage for its length (several poison
       items: their lengths averaged; Venom's length replaces theirs). No crit, deadly strike, crushing blow or leech,
       and no enhanced damage, skill %, Strength or Dexterity on it.
     - The monster's resistance to it: its own, then Conviction (fire, cold, lightning), Lower Resist (fire, lightning,
       cold, poison) and a Paladin's own Sanctuary (magic: its aurastat on the monsters in range), each counting half
       against a monster whose own resistance is 100% or more (immune); then the gear's -% enemy resistance, only below
       100%, and whatever is then below 0% counts half; at least -100%.
       Absorb (a map's "Monsters absorb X% ..."; poison none): that share of what gets through, at most 40%, is taken
       off and heals the monster, so its life drops by 1 - 2 x absorb of it.
     The same resistance code takes every damage type, by one table of the resistance and pierce stats per type. */
  const ELEMS = [
    { k: "fire", p: "f", n: "fire", N: "Fire", conv: "fireresist", lr: "fireresist" },
    { k: "ltng", p: "l", n: "lightning", N: "Lightning", conv: "lightresist", lr: "lightresist" },
    { k: "cold", p: "c", n: "cold", N: "Cold", conv: "coldresist", lr: "coldresist" },
    { k: "mag", p: "m", n: "magic", N: "Magic" },
    { k: "pois", p: "p", n: "poison", N: "Poison", lr: "poisonresist" },
  ];
  const ELEM = Object.fromEntries(ELEMS.map(e => [e.k, e]));
  /* a skill's value for the stat it names in one of its aurastat / passivestat columns ("fireresist" in Conviction's
     aurastat2: aurastatcalc2), 0 when it names none */
  function statCalc(id, kind, stat, lvl, ctx) {
    const r = SK[id];
    if (!r || !(lvl > 0)) return 0;
    const calc = kind === "aura" ? "aurastatcalc" : "passivecalc";
    for (let i = 1; i <= 6; i++) if (r[kind + "stat" + i] === stat) return Calc.value(id, calc + i, lvl, ctx || {});
    return 0;
  }
  /* the Holy auras on the build (2026-11-27, the author: "add the item auras to the page now"; trace T14): a
     Paladin's own (buf.holy at buf.holyLvl, with + skills) and the ones items give any class (buf.ia: Holy Fire, Holy
     Freeze, Holy Shock, Sanctuary, each the sum of the items' levels: two items with one aura add up). An item's aura
     runs the same server function as the Paladin's at the item's level (+ skills never reach it); one aura from two
     sources is one state, the higher level holding: so each aura's level is max(own, items'). The wearer gets its
     passives in full (its damage on attacks, its attack rating %), with his own base points in its synergies (a
     Paladin's: holySyn for his own aura, buf.iaSyn for an item's; another class none); different auras all count.
     [{k, id, name, lvl, own, item, syn}] */
  const HOLY_ITEMS = { fire: "Hand of Justice 14, Dragon 12, Flamebellow 26–28", freeze: "Doom 16, Ice 18, Shattered Wall 16",
                       shock: "Dream 14 (two Dreams: 28)", sanc: "Asylum 17–20, Azurewrath 10–12, Heavenly Garb 4–6" };
  function holyAuras(b) {
    const ia = b.buf.ia || {}, out = [];
    for (const [k, h] of Object.entries(HOLY)) {
      const own = b.cls === "pal" && b.buf.holy === k ? +b.buf.holyLvl || 0 : 0, item = +ia[k] || 0, lvl = Math.max(own, item);
      if (!(lvl > 0)) continue;
      const syn = b.cls !== "pal" ? 0 : b.buf.holy === k ? +b.buf.holySyn || 0 : +((b.buf.iaSyn || {})[k]) || 0;
      out.push({ k, id: h[0], name: h[1], lvl, own, item, syn });
    }
    return out;
  }
  /* the Holy auras' damage on attacks (their passivestats: Holy Fire's fire, Holy Freeze's cold, Holy Shock's
     lightning, Sanctuary's magic), whole points, with their synergies' points (they add up in its formula): {element:
     {min, max}} */
  const HOLY_ELEM = { fire: "fire", freeze: "cold", shock: "ltng", sanc: "mag" };
  const ELEM_STAT = { fire: "fire", ltng: "light", cold: "cold", mag: "magic", pois: "poison" };
  function holyDamage(b) {
    const out = {};
    for (const A of holyAuras(b)) {
      const e = HOLY_ELEM[A.k], syn = Calc.synergies(A.id, "EDmgSymPerCalc");
      const ctx = { blvl: syn.length ? { [syn[0].toLowerCase()]: A.syn } : {} };
      const s = ELEM_STAT[e], o = out[e] || (out[e] = { min: 0, max: 0 });
      o.min += statCalc(A.id, "passive", s + "mindam", A.lvl, ctx); o.max += statCalc(A.id, "passive", s + "maxdam", A.lvl, ctx);
    }
    return out;
  }
  /* an Assassin's Venom: poison a frame (256ths) on every attack, and its length, which replaces the gear's */
  function venomPoison(b) {
    const lvl = +b.buf.venom || 0;
    if (b.cls !== "ass" || !(lvl > 0)) return null;
    const ctx = { blvl: { "cobra strike": +b.buf.venomSyn || 0 } };
    return { min: statCalc(278, "aura", "poisonmindam", lvl, ctx), max: statCalc(278, "aura", "poisonmaxdam", lvl, ctx),
             len: statCalc(278, "aura", "skill_poison_override_length", lvl, ctx) };
  }
  /* Enchant and Cold Enchant (2026-11-25, the author: "Poison Javelin, Plague Javelin, Lightning Bolt, and Enchant";
     traced in the live build of 11-04). One cast puts the state on the caster and on every allied unit
     within 15 sub-tiles: Enchant fire (firemindam / firemaxdam = edmn / edmx: the table's damage << HitShift 7, Warmth's
     synergy, then whole points, so 25-35 at level 1 is 12-17) and attack rating % (toht), Cold Enchant cold (Chilling
     Armor's synergy), 25 frames of cold length and attack rating %. PD2's own cast gives the caster all of it, other
     players and mercenaries half (each number halved, rounded down), revives a tenth, other summons all. Enchant and
     Cold Enchant are separate states: both can be on. On the unit they are stats like an item's "Adds X-Y fire
     damage": every attack rolls them with the gear's (one roll), raised by that element's skill damage, then x SrcDam
     / 128 on a missile; explosions carry them with the gear's (Exploding and Immolation Arrow's fire, Freezing Arrow's
     cold); a skill's own missiles (Lightning Fury's bolts, a flame's own row) get none; kicks and both weapons get
     them; Vengeance's explosion leaves them out (as a Holy aura's). Missile pct (Param3 33) is read by nothing: no
     third on missiles. The character screen shows them. {fire, cold: {min, max} whole points or null, ar: [[name, %]]} */
  function enchantOf(b) {
    const out = { fire: null, cold: null, ar: [] };
    const one = (id, lvl, syn, self, e, name) => {
      if (!(+lvl > 0)) return;
      const k = Object.keys(syn)[0], ctx = { blvl: { [k]: +syn[k] || 0 } };
      const own = self && b.cls === "sor", cut = v => (own ? v : Math.trunc(v / 2));
      out[e] = { min: cut(statCalc(id, "aura", e + "mindam", +lvl, ctx)), max: cut(statCalc(id, "aura", e + "maxdam", +lvl, ctx)), own, name };
      out.ar.push([name, cut(statCalc(id, "aura", "item_tohit_percent", +lvl, ctx))]);
    };
    one(52, b.buf.ench, { warmth: b.buf.enchSyn }, b.buf.enchSelf, "fire", "Enchant");
    one(40, b.buf.cench, { "chilling armor": b.buf.cenchSyn }, b.buf.cenchSelf, "cold", "Cold Enchant");
    return out;
  }
  /* one weapon's hit's elemental damage, before the monster: {fire: {lo, hi, avg} in 256ths, ..., pois: {lo, hi (a
     frame, 256ths), len (frames), avg (over its length)}}; null for an element it hasn't. x: the hitting weapon (a kick:
     none of the weapon's, other gear's only) */
  function elemHit(b, attack, x) {
    if (attack.k === "smite") return Object.fromEntries(ELEMS.map(e => [e.k, null]));   // Smite: none (smiteHit)
    const src = attack.dfill ? 40 : attack.srcdam || 128, own = attack.kick ? null : x, out = {};   // (Blade Shield: 5/16, dfill)
    const holy = holyDamage(b), fc = attack.fclaw ? fireClawsOf(b, attack) : null, sel = selOf(b, attack), en = enchantOf(b);
    const scale = (lo, hi, m, add) => {
      lo += tdiv(lo * m, 100) + (add ? add.lo : 0); hi += tdiv(hi * m, 100) + (add ? add.hi : 0);
      if (src !== 128) { lo = tdiv(lo * src, 128); hi = tdiv(hi * src, 128); }
      if (lo > hi) lo = hi;
      return [lo, hi];
    };
    for (const e of ELEMS) {
      if (e.k === "pois") continue;
      let mn = gw(b, own, e.p + "min"), mx = gw(b, own, e.p + "max");
      if (holy[e.k]) { mn += holy[e.k].min; mx += holy[e.k].max; }
      if (e.k === "fire" && fc) { mn += fc.min; mx += fc.max; }
      if (en[e.k]) { mn += en[e.k].min; mx += en[e.k].max; }   // Enchant's fire, Cold Enchant's cold
      const add = sel && sel.e === e.k && sel.hi > 0 ? sel : null;   // the skill's own (sel)
      if (!(mx > 0) && !add) { out[e.k] = null; continue; }   // the game: none under one point of maximum
      if (!(mx > 0)) mn = mx = 0;
      const [lo, hi] = scale(mn * 256, mx * 256, +b.g[e.p + "m"] || 0, add);
      out[e.k] = { lo, hi, avg: hi > lo ? (lo + hi - 1) / 2 : lo };
      if (add) out[e.k].sel = add;
    }
    // Fire Claws' flames on the monster: FCLAW.flames hits of a flame's fire (fireClawsOf)
    if (fc && fc.flame.hi > 0) {
      const o = out.fire || { lo: 0, hi: 0 }, n = FCLAW.flames;
      o.lo += n * fc.flame.lo; o.hi += n * fc.flame.hi; o.avg = o.hi > o.lo ? (o.lo + o.hi - 1) / 2 : o.lo;
      o.flames = { n, lo: fc.flame.lo, hi: fc.flame.hi };
      out.fire = o;
    }
    // Vengeance's explosion on the monster: each of fire, cold and lightning (vengeanceOf)
    if (attack.veng) {
      const V = vengeanceOf(b, attack);
      for (const k of ["fire", "cold", "ltng"]) {
        const x = V[k](own);
        if (!(x.hi > 0)) continue;
        const o = out[k] || { lo: 0, hi: 0 };
        o.lo += x.lo; o.hi += x.hi; o.avg = o.hi > o.lo ? (o.lo + o.hi - 1) / 2 : o.lo; o.veng = x;
        out[k] = o;
      }
    }
    // Lightning Bolt (mdmg 12, the game's missile damage function 12): the hit keeps only its element, the skill's and
    // the gear's lightning; the gear's fire, cold, magic, and poison are dropped (traced 2026-11-25)
    if (attack.mdmg === 12) for (const e of ELEMS) if (e.k !== attack.convEl) out[e.k] = null;
    const P = attack.mdmg === 12 ? null : poisonOf(b, own, attack);
    out.pois = null;
    if (P && P.mx > 0 && P.len > 0) {
      const [lo, hi] = scale(P.mn, P.mx, +b.g.pm || 0);
      const avg = hi > lo ? (lo + hi - 1) / 2 : lo;
      // (Blade Shield's two fills each add the poison's length: twice as long)
      const len = attack.dfill ? 2 * P.len : P.len;
      out.pois = { lo, hi, len, avg: avg * len, venom: !!P.ven };
    }
    return out;
  }
  /* a hit's poison before poison skill damage: each source's total over its seconds back to a frame's (256ths), summed;
     its length in frames, the sources' average (Venom's replaces it); lenT that average rounded down, as the character
     screen takes it */
  function poisonOf(b, own, attack) {
    const srcs = [];
    for (const s of [own, b.g]) {
      if (!s || !(+s.pmax > 0) || !(+s.psec > 0)) continue;
      const len = Math.round(+s.psec * 25);
      srcs.push({ min: Math.floor(+s.pmin * 256 / len), max: Math.floor(+s.pmax * 256 / len), len });
    }
    const ven = venomPoison(b), sp = skillPoison(b, attack);
    if (!srcs.length && !ven && !sp) return null;
    const sum = srcs.reduce((t, s) => t + s.len, 0);
    let mn = srcs.reduce((t, s) => t + s.min, 0), mx = srcs.reduce((t, s) => t + s.max, 0);
    let len = srcs.length ? Math.round(sum / srcs.length) : 0, lenT = srcs.length ? Math.trunc(sum / srcs.length) : 0;
    if (ven) { mn += ven.min; mx += ven.max; if (ven.len > 0) len = lenT = ven.len; }
    /* a skill's own poison (Rabies): the game puts it on the hit with the skill's length first, then the melee fill adds
       the gear's poison a frame and to the length Venom's override, else the gear's lengths, that sum over the gear's
       poison count when it is over 1 (traced 2026-11-25: the game's Rabies hit and melee fill) */
    if (sp) {
      mn += sp.min; mx += sp.max;
      len = lenT = ven && ven.len > 0 ? sp.len + ven.len : srcs.length > 1 ? Math.trunc((sp.len + sum) / srcs.length) : sp.len + sum;
    }
    return { mn, mx, len, lenT, ven, skill: sp };
  }
  /* Fire Claws (2026-11-25, traced in the live build; PD2's start function 79 and hit 175): as the swing
     starts, a buff gives you the skill's fire (aurastats firemindam / firemaxdam = edmn / edmx: EMin / EMax with its
     levels and Molten Boulder's and Armageddon's synergy, whole points), which the hit then deals with the gear's
     fire, both raised by fire skill damage. On a landed hit 4 + hard points / 5 firestorm makers (calc2) fly from you
     toward the monster on a winding path, leaving a flame at each step (clawfirestorm: its own row's damage, EMin 5 /
     Emax 9 with its levels and the same synergy, + fire skill damage, about half the skill's fire; 12 frames). A
     monster standing in them takes a flame's hit once in 5 frames (their shared next-hit delay): 3 while one pass of
     flames lasts, more while the firestorms wind around it. FCLAW.flames = 5, as the tooltip's "Firestorm Damage"
     counts them: (enma x 5) / 2, five flames of about half the fire (the missile names no skill: the game deals the
     row's damage) */
  const FCLAW = { flames: 5 };
  function fireClawsOf(b, attack) {
    const lvl = +b.s.lvl || 0, ctx = ctxOf(b, attack);
    const mctx = Object.assign({}, ctx, { stat: { passive_fire_mastery: +b.g.fm || 0 } });
    const fl = DATA.fclaw && DATA.fclaw.flame;
    return { min: lvl > 0 ? Calc.key(attack.id, "edmn", lvl, ctx) : 0, max: lvl > 0 ? Calc.key(attack.id, "edmx", lvl, ctx) : 0,
             flame: { lo: fl ? Calc.missile(fl, "Min", lvl, mctx) : 0, hi: fl ? Calc.missile(fl, "Max", lvl, mctx) : 0 },
             makers: lvl > 0 ? Calc.value(attack.id, "calc2", lvl, Object.assign({}, ctx, { self_blvl: hardOf(b) })) : 0 };
  }
  /* Vengeance (2026-11-25, traced in the live build; PD2's own hit, srvdo 174): a melee hit as a normal
     attack's (the weapon, the gear's elemental damage), then on a landed hit an explosion at the monster that hits it
     and the monsters around it (radius 7) and chains on (calc4's chance): no physical damage; for each of fire, cold
     and lightning the gear's flat damage (the weapon's and other items', not a Holy aura's or Enchant's) and the
     skill's own flat damage (EMin / EMax with its synergies, rolled once for the three), both x (100 + calc1 (cold
     calc2, lightning calc3: the tooltip's "Elemental Damage") + that element's skill damage %) / 100. 256ths per element:
     {fire(x), cold(x), ltng(x)} for the hitting weapon x, pct the calc */
  function vengeanceOf(b, attack) {
    const lvl = +b.s.lvl || 0, ctx = ctxOf(b, attack);
    const pct = lvl > 0 ? Calc.value(attack.id, "calc1", lvl, ctx) : 0;
    const flo = lvl > 0 ? Calc.key(attack.id, "edns", lvl, ctx) : 0, fhi = lvl > 0 ? Calc.key(attack.id, "edxs", lvl, ctx) : 0;
    const one = k => x => {
      const e = ELEM[k], m = pct + (+b.g[e.p + "m"] || 0);
      let lo = gw(b, x, e.p + "min") * 256 + flo, hi = gw(b, x, e.p + "max") * 256 + fhi;
      lo += tdiv(lo * m, 100); hi += tdiv(hi * m, 100);
      return { lo, hi: Math.max(hi, lo), pct: m };
    };
    return { pct, flat: [flo, fhi], fire: one("fire"), cold: one("cold"), ltng: one("ltng") };
  }
  /* the character's skill damage of each element, as the skill formulas read it (enms / exms, a missile row with
     ApplyMastery) */
  function masteryCtx(b, attack) {
    return Object.assign(ctxOf(b, attack), { stat: { passive_fire_mastery: +b.g.fm || 0, passive_ltng_mastery: +b.g.lm || 0,
      passive_cold_mastery: +b.g.cm || 0, passive_mag_mastery: +b.g.mm || 0, passive_pois_mastery: +b.g.pm || 0 } });
  }
  /* an attack skill's own elemental damage on its hit (sel: the arrows, the Amazon's lightning skills; 2026-11-25,
     traced in the live build): {e: its element, lo, hi} in 256ths, EMin /
     EMax with its levels and synergies (the minimum only above one point: Power Strike's stays 1) and its element's skill
     damage. The hit adds the weapon's and the gear's elemental damage to it, then a missile takes SrcDam / 128 of all
     of it (the game's missile damage: Magic Arrow 3/4, Fire and Cold Arrow 1/2, as their tooltips show). lvl: another
     level than the skill's (Exploding Arrow's bombs: its hard points) */
  function selOf(b, attack, lvl) {
    const L = lvl || +b.s.lvl || 0, e = ((SK[attack.id] || {}).EType || "").trim();
    if ((!attack.sel && !lvl) || !(L > 0) || !ELEM[e]) return null;
    const ctx = masteryCtx(b, attack);
    return { e, lo: Calc.key(attack.id, "enms", L, ctx), hi: Calc.key(attack.id, "exms", L, ctx) };
  }
  /* an attack skill's own poison a frame (256ths, its synergies in, before poison skill damage) and length (frames): Rabies'
     EMin / EMax with its levels, HitShift 3, over its ELen */
  /* Poison Strike (2026-11-25, traced in the live build): its "Pierces X% Poison Resistance"
     (aurastat1 passive_pois_pierce, min(5 + level - 1, 50)) is on you while the attack's animation plays (PD2 S14 fixed
     it lasting longer), so it counts as -% enemy poison resistance on the strike's own poison and your gear's (its
     length too), never on your other skills */
  const psPierce = (b, attack) => (attack && attack.ppierce && +b.s.lvl > 0 ? Math.max(0, Calc.value(attack.id, "aurastatcalc1", +b.s.lvl, ctxOf(b, attack)) || 0) : 0);
  function skillPoison(b, attack) {
    if (!attack || !attack.spois || !(+b.s.lvl > 0)) return null;
    const ctx = Object.assign(ctxOf(b, attack), { stat: {} });
    const lvl = +b.s.lvl;
    return { min: Calc.key(attack.id, "edns", lvl, ctx), max: Calc.key(attack.id, "edxs", lvl, ctx), len: +(SK[attack.id] || {}).ELen || 0 };
  }

  /* The character screen's damage line (traced 2026-11-24 in the game client PD2 runs, the line's own code with PD2's
     weapon mastery bonus swapped in). The author's screen agreed to the
     point: 1,461–3,471 for Attack without Battle Command, 1,537–3,658 with it while his charm of 1–2 cold was out.
     Whole points: the weapon's damage (its own enhanced damage in) and the gear's + minimum / + maximum (at least 1 and
     2), times (100 + enhanced damage on other gear + the damage bonus, without "against demons / undead") / 100,
     rounded down; then the weapon's "+X damage" (which the hit adds before the %) and the skill's flat damage (Bash's,
     after the % on the hit too);
     then the elemental damage of your gear, auras and buffs (screenElem); times SrcDam / 128 on line 7 (Guided Arrow,
     Stun). The skill's line is SkillDesc's descdam (DATA's attack.desc): 1, 7 and 19 the melee and missile ones, 3 and
     13 the throws (there PD2's own damage bonus code, so the physical part is the hit's). Fists of Fire's line (25,
     PD2's) is this one plus its charge's (fofApply). Null for a line not traced: a kick's, Smite's, Blade Fury's */
  const SCREEN_LINES = [1, 3, 7, 13, 19];
  function screenLine(b, attack, x, wr, pct, off, flat, thrown) {
    if (attack.kick || !(SCREEN_LINES.includes(attack.desc) || attack.charge)) return null;
    let lo, hi;
    if (attack.desc === 3 || attack.desc === 13) [lo, hi] = [Math.floor(thrown.lo / 256), Math.floor(thrown.hi / 256)];
    else {
      const both = +x.dmg || 0, all = 100 + off + pct;
      const mn = Math.max(wr.min - both + (+b.g.min || 0), 1), mx = Math.max(wr.max - both + (+b.g.max || 0), 2);
      lo = Math.trunc(mn * all / 100) + both + flat;
      hi = Math.trunc(mx * all / 100) + both + flat;
    }
    const E = screenElem(b, x);
    lo += E.lo; hi += E.hi;
    // a skill with its own elemental damage (Fire Claws): the line adds it, with its element's skill damage (the game's
    // skill elemental part of lines 1 and 7)
    if (attack.fclaw && +b.s.lvl > 0) {
      const ctx = Object.assign(ctxOf(b, attack), { stat: { passive_fire_mastery: +b.g.fm || 0 } });
      lo += Math.floor(Calc.key(attack.id, "enms", +b.s.lvl, ctx) / 256); hi += Math.floor(Calc.key(attack.id, "exms", +b.s.lvl, ctx) / 256);
    }
    if (hi > 0) { lo = Math.max(lo, 1); hi = Math.max(hi, lo + 1); }
    const src = attack.srcdam || 128;
    if (attack.desc === 7 && src !== 128) { lo = Math.trunc(lo * src / 128); hi = Math.trunc(hi * src / 128); }
    return { lo, hi, el: E.hi > 0 };
  }
  /* the elemental damage the character screen adds, whole points: fire, lightning and cold, each + its skill damage %
     (rounded down), and magic (no %); poison, a frame's with poison skill damage times its length / 256 */
  function screenElem(b, x) {
    const holy = holyDamage(b), en = enchantOf(b);
    let lo = 0, hi = 0;
    for (const e of ELEMS) {
      if (e.k === "pois") continue;
      let mn = gw(b, x, e.p + "min"), mx = gw(b, x, e.p + "max");
      if (holy[e.k]) { mn += holy[e.k].min; mx += holy[e.k].max; }
      if (en[e.k]) { mn += en[e.k].min; mx += en[e.k].max; }
      const m = e.k === "mag" ? 0 : +b.g[e.p + "m"] || 0;
      if (m) { mn += Math.trunc(mn * m / 100); mx += Math.trunc(mx * m / 100); }
      lo += Math.min(mn, mx); hi += mx;
    }
    const P = poisonOf(b, x);
    if (P && P.mx > 0) {
      const pm = +b.g.pm || 0;
      let mn = P.mn, mx = P.mx;
      if (pm) { mn += Math.trunc(mn * pm / 100); mx += Math.trunc(mx * pm / 100); }
      lo += Math.floor(P.lenT * mn / 256); hi += Math.floor(P.lenT * mx / 256);
    }
    return { lo, hi };
  }
  /* Lower Resist's value for one resistance, at its level with Curse Mastery's points (half of them count) */
  const lowResOf = (stat, c) => (c && c.kind === "lowres" ? statCalc(91, "aura", stat, c.lvl, { blvl: { curmas: c.cm || 0 } }) : 0);
  /* the monster's resistance to element e against this build: {base, immune, conv, lr, res, pierce, abs, mult (what gets
     through), net (what its life loses, absorb's heal taken off)} */
  function elemRes(b, T, e, attack) {
    const base = +((T.el || {})[e.k]) || 0, immune = base >= 100;
    const half = v => (immune ? tdiv(v, 2) : v);
    const conv = e.conv && +T.conv > 0 ? half(statCalc(123, "aura", e.conv, +T.conv)) : 0;
    const lr = e.lr ? half(lowResOf(e.lr, onMonster(b, T).curses.find(c => c.kind === "lowres"))) : 0;
    // a Paladin's own Sanctuary: its aurastat (magicresist) on the monsters in its range
    const sl = (holyAuras(b).find(A => A.k === "sanc") || {}).lvl || 0;   // (yours or an item's: the higher level)
    const sanc = e.k === "mag" && sl > 0 ? half(statCalc(119, "aura", "magicresist", sl)) : 0;
    /* Inferno's debuff (2026-11-25): its flames put -(4 + level)% fire resistance (aurastat1, 22+ half a level) on what
       they hit, for 10 frames, a curse-like state, before that hit's damage */
    const inf = e.k === ({ inferno: "fire", arctic: "cold" })[attack && attack.ex] && +b.s.lvl > 0 ? half(Calc.value(attack.id, "aurastatcalc1", +b.s.lvl, ctxOf(b, attack))) : 0;
    // (between cooldowns: another skill's Inferno or Arctic Blast debuff on this one's damage, weaveSkills' b.dbf)
    const dbf = !inf && b.dbf && b.dbf[e.k] ? half(b.dbf[e.k]) : 0;
    let r = base + conv + lr + sanc + inf + dbf;
    // (a pet's shots: Hydra's heads have your fire skill damage but not your -% enemy resistance, 2026-11-25)
    // (Blade Sentinel's blade: the sentinel hits, without your -% enemy resistance, 2026-11-25)
    const before = r, pierce = e.k === "mag" || (attack && (attack.pet || attack.sentinel)) ? 0 : (+b.g[e.p + "p"] || 0) + (e.k === "pois" ? psPierce(b, attack) : 0);
    let halved = false;
    if (r < 100) { r -= pierce; if (r < 0) { r = tdiv(r, 2); halved = true; } }
    r = Math.max(r, -100);
    const abs = e.k === "pois" ? 0 : clamp(+((T.abs || {})[e.k]) || 0, 0, 40);
    const mult = r >= 100 ? 0 : (100 - r) / 100;
    return { base, immune, conv, lr, sanc, inf, res: r, before, halved, pierce: before < 100 ? pierce : 0, abs, mult, net: mult * (1 - 2 * abs / 100) };
  }

  /* Chance to hit (2026-11-21, the author; PD2's hit check traced in the live build of 11-04 on 2026-11-19 and 11-21).
     Each hit of an attack that rolls (the data's attack.hit) lands with this chance, on its own; crushing blow only on
     a hit. */
  /* a missile's hit (a bow's or crossbow's arrow, a thrown weapon, Blade Fury) */
  const rangedHit = (b, attack) => !!(attack.missile || attack.throw || (!attack.id && !attack.form && has(W[b.w.code], "miss")));
  /* weapon mastery's attack rating % for a hit with weapon x, each mastery's stat counted where its item type (the
     stat's parameter) is the weapon's. A missile's hit: the hit check adds no mastery itself, but the missile brings its
     skill's bonus plus Throwing Mastery's (345), so a thrown hit with a throwing weapon gets it and an arrow none. A
     melee hit: Throwing Mastery's when the weapon and the skill are both throwing ones, else One Handed, Two Handed or
     Claw and Dagger Mastery's (342). The character screen counts it the same way (traced 2026-11-21, live 11-04; until
     then the page gave a thrown hit none, the screen's alone). */
  function masteryTh(b, attack, x) {
    const w = W[x.code], m = mOf(b);
    if (!w) return 0;
    const throwing = m[135] > 0 && has(w, "thro") ? Calc.value(135, "passivecalc1", m[135]) : 0;
    if (rangedHit(b, attack)) return throwing;
    if (has(w, "thro") && attack.itype && DATA.types.thro.includes(attack.itype)) return throwing;
    const two = heldInTwo(b, x);
    let th = 0;
    if (m[128] > 0 && !two && (has(w, "1han") || (b.cls === "bar" && has(w, "2han") && has(w, "mele")))) th += Calc.value(128, "passivecalc1", m[128]);
    if (m[134] > 0 && has(w, "2han") && two) th += Calc.value(134, "passivecalc1", m[134]);
    if (m[252] > 0 && has(w, "asm")) th += Calc.value(252, "passivecalc1", m[252]);
    return th;
  }
  /* which weapon's own attack rating, attack rating %, attack rating against demons / undead, -% target defense and
     Ignore Target's Defense count when a hit rolls to hit (traced 2026-11-22 in the live build: the hit check, the
     damage code, the attack start). A Barbarian's or Assassin's two weapons keep their damagerelated stats (ItemStatCost)
     on the character one at a time. Equipping turns the first weapon's on (the one equipped first, which a normal attack
     uses) and the other's off. Every attack's start updates the attack speed, and PD2's two-weapon speed code leaves the
     RIGHT-hand weapon's on (the weapon slot on the left of the inventory screen), whichever weapon is first; Whirlwind
     and Blade Dance, whose speed isn't attack speed, skip that. The melee damage fill turns the hitting weapon's on
     before it works out a hit's damage, crit, deadly strike and crushing blow, and leaves it on; the skill functions roll
     the hit BEFORE that fill, from the character's stats as they are. So an attack's first hit rolls with the right-hand
     weapon's, each later hit with the weapon of the hit before it, and Whirlwind's hits (alternating) each with the other
     weapon's. The weapon mastery's part goes by the hitting weapon (PD2's hit function picks it itself). A missile
     (arrows, thrown weapons) gets its damage, crit and deadly strike at the throw, with the throwing weapon's on; it
     rolls to hit where it lands, with whatever is on then (that depends on its flight time): each its own here.
     Returns per entry of ws (the weapons the hits use, in turn) the weapons it rolls with and their shares. */
  function rollMix(b, attack, ws, fr) {
    const n = ws.length;
    if (!dual(b) || rangedHit(b, attack)) return ws.map(x => [{ x, w: 1 }]);
    const sk = IAS.SKILL[attack.id], sel = sk ? sk.ws || 0 : 0;
    if (sel === 2 && n === 2) return ws.map((x, k) => [{ x: ws[1 - k], w: 1 }]);
    const right = b.o.main === "l" ? b.o : b.w;
    const hits = Math.max(n, fr ? fr.made || fr.hits || 1 : 1), mix = ws.map(() => new Map());
    for (let i = 0; i < hits; i++) {
      const rw = i === 0 ? right : ws[(i - 1) % n], m = mix[i % n];
      m.set(rw, (m.get(rw) || 0) + 1);
    }
    return mix.map(m => { const t = [...m.values()].reduce((x, y) => x + y, 0); return [...m].map(([x, c]) => ({ x, w: c / t })).sort((u, v) => v.w - u.w); });
  }
  /* the attack rating of a hit with weapon x: (5 x Dexterity - 35 + the class's ToHitFactor + attack rating on gear and
     Grim Ward's) x (100 + attack rating % on gear, auras and buffs, the attack skill's own, the weapon mastery's
     (masteryTh)) / 100, the % part rounded toward zero; parts lists the %s for the page. sx: the weapon whose own
     attack rating stats count (rollMix), x the one that hits (its mastery) */
  function attackRating(b, attack, x, forScreen, T, sx) {
    if (sx === undefined) sx = x;
    const a = b.aur, parts = [];
    const lyc = b.cls === "dru" ? +b.buf.lyc || 0 : 0, lycCtx = { lvl: { "shape shifting": lyc }, blvl: { "shape shifting": lyc } };
    let base = 5 * (+b.c.dex || 0) - 35 + (CLS[b.cls].th || 0) + gw(b, sx, "ar");
    if (a.grim > 0) base += Calc.value(150, "aurastatcalc2", a.grim);
    // attack rating against demons or undead (stats 123 / 124, per-level items' too): flat, only against such a
    // monster (MonStats' demon flag; its low or high undead flag); the character screen leaves it out
    const vs = forScreen || !T ? 0 : T.type === "demon" ? gw(b, sx, "ard") : T.type === "undead" ? gw(b, sx, "aru") : 0;
    base += vs;
    let pct = 0;
    const add = (lbl, v) => { if (v) { pct += v; parts.push([lbl, v]); } };
    add("gear", +b.g.arp || 0);
    add("weapon", sx ? +sx.arp || 0 : 0);
    if (attack.id) add(attack.label, Calc.tohit(attack.id, b.s.lvl, ctxOf(b, attack)));
    if (b.buf.fana > 0) add("Fanaticism", Calc.value(122, "aurastatcalc2", b.buf.fana));
    if (a.conc > 0) add("Concentration", Calc.value(113, "aurastatcalc3", a.conc));
    if (a.ba > 0) add("Blessed Aim", Calc.value(108, "aurastatcalc1", a.ba));
    if (a.wolv > 0) add("Heart of Wolverine", Calc.value(297, "aurastatcalc1", a.wolv));
    if (isWolf(b, attack) && b.buf.were > 0) add("Werewolf", Calc.value(223, "aurastatcalc2", b.buf.were, lycCtx));
    if (isBear(b, attack) && b.buf.bear > 0) add("Werebear", Calc.value(228, "aurastatcalc4", b.buf.bear, lycCtx));
    const pen = mOf(b)[23];
    if (pen) add("Penetrate", Calc.value(23, "passivecalc1", +(b.m || {}).penLvl || pen));
    // the Holy auras, a Paladin's own and the items' (holyAuras): their wearer's attack rating (passivestat3, toht)
    for (const A of holyAuras(b)) add(A.name, Calc.value(A.id, "passivecalc3", A.lvl));
    for (const [name, v] of enchantOf(b).ar) add(name, v);   // Enchant's and Cold Enchant's attack rating %
    const mth = attack.kick ? 0 : masteryTh(b, attack, x);  // a kick has no weapon: no mastery's attack rating
    add("mastery", mth);
    return { ar: base + Math.trunc(base * pct / 100), base, pct, parts, vs, mth };
  }
  /* the monster's defense against this build's hits: its own, lowered by Conviction (the party's, the monster's field),
     Battle Cry and Weaken, which add up, with a Fanatic champion's own -70% (the game's defense: own x (100 + the
     sum) / 100, rounded toward zero; below 0 it adds to the attack rating); then Ignore Target's Defense makes it 0 against a normal monster, champion or minion
     (not a unique, superunique, boss (MonStats' boss flag: every listed monster, kinds mapboss, boss and lesser) or
     player), and -% target defense
     lowers it by that share, halved against a superunique, a boss or a player (rounded toward zero), at most 100%.
     b null: the party's debuffs alone; w: the weapon that hits (its own -% target defense and Ignore Target's Defense) */
  function defenseOf(b, T, w) {
    const on = onMonster(b, T), base = Math.max(0, +T.def || 0);
    const conv = +T.conv > 0 ? { lvl: +T.conv, dv: Calc.value(123, "aurastatcalc1", +T.conv) } : null;
    // Inner Sight (the party's, the monster's field) and Attract lower its armorclass, in points, before the %
    const inner = +T.inner > 0 ? { lvl: +T.inner, df: Calc.value(8, "aurastatcalc1", +T.inner) } : null;
    const flat = (inner ? inner.df : 0) + on.curses.reduce((t, c) => t + (c.df || 0), 0), d0 = base + flat;
    const fan = T.kind === "champion" && T.champ === "fanatic" ? -70 : 0;
    const pct = fan + on.curses.reduce((t, c) => t + (c.dv || 0), 0) + (on.bc ? on.bc.dv : 0) + (conv ? conv.dv : 0);
    let d = d0 > 0 ? d0 + tdiv(d0 * pct, 100) : d0 - tdiv(d0 * pct, 100);
    const cursed = d;
    const plain = T.kind === "monster" || T.kind === "champion" || T.kind === "minion";
    const itdWorks = plain, halved = !(plain || T.kind === "unique");
    const itdOn = !!(b && (b.g.itd || (w && w.itd)));
    const itd = itdOn && itdWorks;
    if (itd) d = 0;
    // -% target defense: gear's and the weapon's, and a Paladin's own Blessed Aim's (its base points, while it runs)
    const ba = b && b.cls === "pal" && b.aur.baSelf && b.aur.ba > 0 ? Calc.value(108, "passivecalc1", +b.aur.ba, { self_blvl: +b.aur.baHard || 0 }) : 0;
    let x = (b ? gw(b, w, "tdef") : 0) + ba;
    if (halved) x = tdiv(x, 2);
    x = x < 1 ? 0 : x > 99 ? 100 : x;
    d -= Math.trunc(d * x / 100);
    return { base, on, conv, inner, flat, fan, pct, cursed, itd, itdOn, itdWorks, halved, ba, x, def: d };
  }
  /* the hit chance in whole %: negative defense adds to the attack rating (negative attack rating to the defense);
     2 x 111 x AR / (AR + defense) x the attacker's level / (both levels), at least 5; above 95 the rest of the 111 part
     counts 90/111; at most 100. Every step rounds toward zero, as the game does. */
  function hitChance(ar, def, alvl, dlvl) {
    const d0 = Math.max(def, 0), a1 = def < 0 ? ar - def : ar, d1 = a1 < 0 ? d0 - a1 : d0;
    const A = Math.max(a1, 0), D = Math.max(d1, 0), S = A + D;
    const factor = S ? tdiv(111 * A, S) : 100, L = alvl + dlvl;
    if (!L) return 5;
    let c = tdiv(2 * factor * alvl, L);
    if (c < 5) return 5;
    if (c > 95 && alvl) {
      let e = factor - tdiv(95 * L, 2 * alvl);
      if (S) e = tdiv(tdiv(e * S, 111) * 90, S);
      c = tdiv(2 * e * alvl, L) + 95;
    }
    return Math.min(c, 100);
  }

  /* Blade Sentinel's attack ratings (2026-11-25, traced in the live build). The blade (its missile, ToHit 1)
     rolls in PD2's missile hit with the sentinel as the attacker, a monster: attack rating =
     its tohit stat + the skill's own attack bonus (ToHit + LevToHit a level) as points, x (100 + its
     item_tohit_percent) / 100, at your level. Its tohit: your attack rating before the % (5 x Dexterity - 35 + the
     class's + gear's and Grim Ward's; PD2's AI adds it when the missile is made) + 5 a level (passivestat1, given when
     it is summoned); its %: your attack rating % (gear, auras, buffs) + the skill's bonus + Claw and Dagger Mastery's
     for the weapon (the AI adds them). A monster's roll has no attack rating against demons / undead, no Ignore
     Target's Defense, no -% target defense. The burst (PD2's splash, as the attacker you) rolls
     your own: attack rating x (100 + the mastery's + your % + (your % + the skill's bonus)) / 100, so your % counts
     twice, against the monster's defense as your hits see it. */
  function sentinelAR(b, attack, x, T) {
    const A = attackRating(b, attack, x, false, T, x), lvl = +b.s.lvl || 1, ctx = ctxOf(b, attack);
    const toht = Calc.tohit(attack.id, lvl, ctx), own = A.pct - toht - A.mth;   // your attack rating % but the skill's
    const w = W[x.code], m = mOf(b), mth = m[252] > 0 && w && has(w, "asm") ? Calc.value(252, "passivecalc1", m[252]) : 0;
    const pas = Calc.value(attack.id, "passivecalc1", lvl, ctx);
    const base = A.base - A.vs + pas + toht, pct = own + toht + mth, bb = A.base, pb = mth + 2 * own + toht;
    return { ar: base + Math.trunc(base * pct / 100), base, pct, parts: A.parts, vs: 0, mth, own, toht, pas, yours: A.base - A.vs,
             burst: { ar: bb + Math.trunc(bb * pb / 100), base: bb, pct: pb, vs: A.vs } };
  }
  /* everything about one build against the monster (opts.kill false: no kill time, for the parity search) */
  /* Battle Command's + all skills (PD2's Skills.txt: item_allskills 1 + blvl / 10, blvl its base points: +1 from a Call
     to Arms, +3 from a Barbarian's 20 points) raise every skill the build has while it is on: the attack's level, the
     masteries' levels (Penetrate's points aside), the class's own buffs, a Paladin's own auras, a Barbarian's own
     Battle Cry and a Necromancer's own curses (the curse lists, 2026-11-24). Battle Command's
     own level is already the one it was cast at (cast twice: the author's game, 2026-11-24, 12 then 13). Only damage
     reads the raised levels; the fields keep what was typed. */
  const bcAll = b => (+b.aur.bc > 0 ? 1 + Math.floor((+b.aur.bcHard || 0) / 10) : 0);
  function withBC(b) {
    const n = bcAll(b), sorM = b.cls === "sor" && [61, 63, 65].some(id => +(b.m || {})[id] > 0);
    if (!n && !sorM) return b;
    const x = JSON.parse(JSON.stringify(b)), up = v => (+v > 0 && n ? +v + n : v);
    if ((ATT[x.s.k] || {}).id) x.s.lvl = up(x.s.lvl);
    for (const k of Object.keys(x.m || {})) if (k !== "23") x.m[k] = up(x.m[k]);   // 23: Penetrate's points
    for (const k of ["frenzy", "venom", "were", "bear", "lyc"]) x.buf[k] = up(x.buf[k]);
    if (x.cls === "pal") {
      if (x.buf.holy) x.buf.holyLvl = up(x.buf.holyLvl);
      if (x.buf.fanaSelf) x.buf.fana = up(x.buf.fana);
      if (x.aur.mightSelf) x.aur.might = up(x.aur.might);
      if (x.aur.concSelf) x.aur.conc = up(x.aur.conc);
      if (x.aur.baSelf) x.aur.ba = up(x.aur.ba);
    }
    if (x.cls === "bar") { x.aur.grim = up(x.aur.grim); x.deb.bc = up(x.deb.bc); }
    if (x.cls === "nec") for (const r of x.deb.curses || []) if (NEC_CURSE[r.c]) r.lvl = up(r.lvl);
    if (x.cls === "dru") x.aur.wolv = up(x.aur.wolv);
    if (x.cls === "sor") { if (x.buf.enchSelf) x.buf.ench = up(x.buf.ench); if (x.buf.cenchSelf) x.buf.cench = up(x.buf.cench); }
    /* the Sorceress's masteries (2026-11-25; PD2's Skills.txt passive stats, at their levels with + skills): Fire Mastery
       passive_fire_mastery ln12 (20 + 4 a level) and passive_fire_pierce min(level, 30), Lightning Mastery
       passive_ltng_mastery ln12 (50 + 10 a level), Cold Mastery passive_cold_pierce min(ln12, 45) (5 + 1 a level) and
       passive_cold_mastery ln34 (10 + 2 a level): the same stats as gear's "+% skill damage" and "-% enemy resistance",
       so they join Other gear's (the evaluation's copy only; the fields keep what was typed) */
    if (sorM) {
      const m = x.m || {}, add = (k, v) => { x.g[k] = (+x.g[k] || 0) + (v || 0); };
      if (+m[61] > 0) { add("fm", Calc.value(61, "passivecalc1", +m[61])); add("fp", Calc.value(61, "passivecalc2", +m[61])); }
      if (+m[63] > 0) add("lm", Calc.value(63, "passivecalc1", +m[63]));
      if (+m[65] > 0) { add("cp", Calc.value(65, "passivecalc1", +m[65])); add("cm", Calc.value(65, "passivecalc2", +m[65])); }
    }
    return x;
  }
  function evaluate(b0, T, opts) {
    const b = withBC(b0);
    const attack = ATT[b.s.k] || ATT.attack;
    const out = { attack, b: b0 };
    // a spell (2026-11-25: Fist of the Heavens, Holy Bolt): no weapon hit (spellHit); its damage is the extras' (extrasOf)
    const spell = isSpell(attack);
    out.spell = spell;
    const weaponsUsed = spell ? [b.w] : weaponsFor(b, attack);
    out.offUnused = dual(b) && weaponsUsed.length === 1;
    const fr = frames(b, attack);
    out.fr = fr;
    out.why = fr ? "" : framesWhy(b, attack);   // (no frames: the build can't make this attack, and why)
    const aur = auraPct(b, attack);
    const sp = skillPct(b, attack);
    const flat = attack.flat ? Calc.value(attack.id, attack.flat, b.s.lvl, ctxOf(b, attack)) : 0;
    out.parts = [];
    // per weapon: damage range after the pool
    const ranged = rangedHit(b, attack);
    const per = weaponsUsed.map(x => {
      if (attack.kick) return kickHit(b, attack, T, x, sp, aur);
      if (spell) return spellHit();
      if (attack.k === "smite") return smiteHit(b, attack, T, x, sp, aur);
      const w = W[x.code];
      const wr = weaponRange(x, attack, b);
      const ms = mastery(b, attack, x);
      const strB = w ? Math.floor((+b.c.str || 0) * w.sb / 100) : 0;
      const dexB = w ? Math.floor((+b.c.dex || 0) * w.db / 100) : 0;
      /* damage against demons or undead (stats 121 / 122, per-level items' too) joins the skill's own % against such a
         monster (never a player): on a melee hit only above 0, and a blunt weapon (maces, hammers, clubs, scepters,
         wands, staves) adds 50 against undead; an arrow's or a thrown weapon's damage takes the stat alone (traced
         2026-11-21: the melee damage fill and the missile setup, both still the base game's) */
      let vs = 0;
      if (T.kind !== "player") {
        if (T.type === "demon") vs = gw(b, x, "edd");
        else if (T.type === "undead") vs = (!ranged && has(w, "blun") ? 50 : 0) + gw(b, x, "edu");
        if (!ranged && vs < 0) vs = 0;
      }
      const off = +b.g.ed || 0;
      /* the skill's flat damage (Bash's calc2) is added after the percentages: its start function puts it on the hit's
         physical damage before the weapon's is rolled, and the roll adds the raised weapon damage to it (traced
         2026-11-24 in the live build: the game's start function 32 and damage roll, PD2 patching neither part; until
         then the page raised it with the rest) */
      let mn = wr.min + (+b.g.min || 0), mx = wr.max + (+b.g.max || 0);
      if (mn < 1) mn = 1;
      if (mx <= mn) mx = mn + 1;
      /* Blade Shield (dfill): PD2's callback works the damage out twice, SrcDam 32 each time: (W / 4 + W') / 4, so 5/16
         of the weapon's (and crit and deadly strike twice: the mean below) */
      const src = attack.dfill ? 40 : attack.srcdam || 128, sph = attack.sphys ? skillPhys(b, attack) : null;
      const range = extra => {
        const pct = Math.max(sp + aur.p + strB + dexB + ms.dmg + extra, -90);
        let lo = mn * 256, hi = mx * 256;
        // Blade Fury, Blade Sentinel: the weapon's x SrcDam / 128 + the skill's own, both raised by the % (skillPhys)
        if (sph) {
          if (src !== 128) { lo = tdiv(lo * src, 128); hi = tdiv(hi * src, 128); }
          lo += sph.lo; hi += sph.hi;
          lo += tdiv(lo * (pct + off), 100); hi += tdiv(hi * (pct + off), 100);
          return { pct, lo, hi };
        }
        lo += tdiv(lo * (pct + off), 100) + flat * 256;
        hi += tdiv(hi * (pct + off), 100) + flat * 256;
        if (src !== 128) { lo = tdiv(lo * src, 128); hi = tdiv(hi * src, 128); }
        return { pct, lo, hi };
      };
      const r = range(vs), scr = vs ? range(0) : r;
      return { wr, ms, strB, dexB, vs, pct: r.pct, off, mn256: r.lo, mx256: r.hi, avg256: r.hi > r.lo ? (r.lo + r.hi - 1) / 2 : r.lo,
               screen: screenLine(b, attack, x, wr, scr.pct, off, flat, scr), wmn: mn, wmx: mx, sph };
    });
    out.per = per;
    out.sp = sp; out.aur = aur; out.flat = flat;
    // crit and deadly strike, per weapon: its own, its mastery's and other gear's (until 2026-11-22 the first weapon's
    // mastery counted for both); the skills' and Blessed Aim's for both
    let critS = 0, dsS = 0;
    if (b.cls === "ama" && (b.m[9] || 0) > 0) critS += Calc.value(9, "passivecalc1", b.m[9]);
    if (attack.k === "joust") critS += Calc.value(378, "calc2", b.s.lvl);
    if (b.aur.ba > 0) dsS += Calc.value(108, "aurastatcalc2", b.aur.ba);
    const dsCap = 75 + (+b.g.maxds || 0);
    per.forEach((p, k) => {
      const x = weaponsUsed[k], ms = p.ms;
      const noCrit = attack.k === "smite" || spell || attack.flight;   // Smite's hit, a spell and Dragon Flight's kick have none
      const crit = noCrit ? 0 : gw(b, x, "crit") + ms.crit + critS, dsCh = noCrit ? 0 : gw(b, x, "ds") + dsS;
      const pc = clamp(crit, 0, 75) / 100, pd = clamp(dsCh, 0, Math.min(dsCap, 100)) / 100;
      const cm = (200 + gw(b, x, "cmult") + ms.cmult) / 100, dm = (150 + gw(b, x, "dsmult")) / 100;
      p.crit = { pc, pd: (1 - pc) * pd, cm, dm, critRaw: crit, dsRaw: dsCh };
      p.mean = 1 + pc * (cm - 1) + (1 - pc) * pd * (dm - 1);
      // Blade Shield's two fills each roll crit and deadly strike: c2 x (c1 W / 16 + W' / 4) = 5/16 W x m (m + 4) / 5
      if (attack.dfill) p.mean = p.mean * (p.mean + 4) / 5;
    });
    const avgOf = f => per.reduce((s, x) => s + f(x), 0) / per.length;
    const sum256 = per.reduce((s, x) => s + x.avg256, 0);
    // the hits' average: each weapon's crit and deadly strike weighed by its damage, so average hit x mean is exact
    out.crit = { pc: avgOf(p => p.crit.pc), pd: avgOf(p => p.crit.pd), cm: avgOf(p => p.crit.cm), dm: avgOf(p => p.crit.dm) };
    out.mean = sum256 > 0 ? per.reduce((s, x) => s + x.avg256 * x.mean, 0) / sum256 : per[0].mean;
    // resistance
    const R = resist(b, attack, T);
    out.R = R;
    // elemental damage (ELEMS): each weapon's hit's, through the monster's resistances (the same for every weapon)
    const ER = Object.fromEntries(ELEMS.map(e => [e.k, elemRes(b, T, e, attack)]));
    out.ER = ER;
    /* a skill that turns a share of the hit's physical damage into an element (Concentrate: magic; traced 2026-11-24 in
       the live build: its start function, the game's 32, sets the share from calc4 and the type from EType, and the
       melee damage fill moves it after crit and deadly strike, before the resistances; PD2 patches neither part).
       Crushing blow is worked out apart, from the monster's life. pm: a point of the hit's physical damage on the
       monster */
    const cv = convPct(b, attack) / 100, cvNet = cv > 0 ? ER[attack.convEl].net : 0;
    out.conv = cv > 0 ? { pct: Math.round(cv * 100), el: attack.convEl } : null;
    out.pm = (1 - cv) * R.mult + cv * cvNet;
    out.hit = sum256 / per.length / 256;        // before crit/DS and resistance
    out.eff = out.hit * out.mean;               // with crit/DS
    out.physFinal = out.eff * (1 - cv) * R.mult;   // after resistance: the physical part of a hit on the monster
    per.forEach((p, k) => {
      p.el = spell ? {} : elemHit(b, attack, weaponsUsed[k]);
      p.elOn = ELEMS.reduce((s, e) => s + (e.k !== "pois" && p.el[e.k] ? p.el[e.k].avg / 256 * ER[e.k].net : 0), 0)
        + p.avg256 / 256 * p.mean * cv * cvNet;
    });
    out.elOn = avgOf(p => p.elOn);              // a hit's fire, lightning, cold and magic on the monster (a converted share in)
    out.final = out.physFinal + out.elOn;       // poison's share joins it below (over time)
    // chance to hit, per weapon (a melee hit's weapon mastery can differ, and each weapon's own attack rating, -% target
    // defense and Ignore Target's Defense); toHit weighs them by their damage, so damage per second = final x hits per
    // second x toHit splits exactly
    out.rolls = !!attack.hit; out.ranged = ranged;
    const mixes = rollMix(b, attack, weaponsUsed, fr);
    per.forEach((p, k) => {
      // the weapon it rolls with most often is the one shown; the chance is the mix's
      p.rolls = mixes[k].map(({ x, w }) => {
        // Blade Sentinel's blade rolls with the sentinel's attack rating, against the monster's defense with its curses
        // (a monster's hit: no Ignore Target's Defense, no -% target defense)
        const D0 = defenseOf(b, T, x), AR = attack.sentinel ? sentinelAR(b, attack, weaponsUsed[k], T) : attackRating(b, attack, weaponsUsed[k], false, T, x);
        const D = attack.sentinel ? Object.assign({}, D0, { def: D0.cursed, itd: false, x: 0, burst: D0.def }) : D0;
        return { x, w, D, AR, p: out.rolls ? hitChance(AR.ar, D.def, +b.c.lvl || 1, +T.lvl || 1) / 100 : 1 };
      });
      p.D = p.rolls[0].D;
      p.AR = p.rolls[0].AR;
      p.rollOther = p.rolls.some(q => q.x !== weaponsUsed[k]);
      p.p = p.rolls.reduce((t, q) => t + q.w * q.p, 0);
    });
    out.D = per[0].D;
    // the character screen's attack rating: what is on in your game; after an attack, the right-hand weapon's
    out.screen = attackRating(b, attack, weaponsUsed[0], true, T, dual(b) && b.o.main === "l" ? b.o : weaponsUsed[0]);
    // weighed by each weapon's damage on the monster (with its crit and deadly strike, and its elemental damage), so
    // final x toHit is exact with two weapons
    // (without elemental damage, physical alone: the same sums as before, to the last digit)
    const wt = x => x.avg256 / 256 * x.mean * (1 - cv) * R.mult + x.elOn;
    const sumW = per.reduce((s, x) => s + wt(x), 0), sumMean = per.reduce((s, x) => s + x.avg256 * x.mean, 0);
    out.toHit = per.some(x => x.elOn > 0) && sumW > 0 ? per.reduce((s, x) => s + wt(x) * x.p, 0) / sumW
      : sumMean > 0 ? per.reduce((s, x) => s + x.avg256 * x.mean * x.p, 0) / sumMean : per[0].p;
    // crushing blow, per weapon (its own, its mastery's, other gear's); the share of the life left one crushing blow
    // takes (a boss's at full life): it doesn't depend on the monster's life
    const lifeFull = Math.max(1, +T.life || 1);
    const div00 = cbDivisor(T, lifeFull, lifeFull, !!(attack.missile || attack.throw));
    per.forEach((p, k) => {
      // (Blade Sentinel: its blade is the sentinel's hit and its burst goes through another code: no crushing blow counted)
      const noCb = spell || attack.sentinel;
      let cbCh = noCb ? 0 : gw(b, weaponsUsed[k], "cb") + p.ms.cb, cbe = noCb ? 0 : (+b.g.cbe || 0) + p.ms.cbe;
      // Smite's crushing blow: 5 + its HARD points (calc3's blvl; until 2026-11-25 its level), efficiency calc4 (edmx)
      if (attack.k === "smite") { cbCh += Calc.value(97, "calc3", b.s.lvl, { self_blvl: hardOf(b) }); cbe += Calc.value(97, "calc4", b.s.lvl); }
      p.cb = { ch: clamp(cbCh, 0, 100) / 100, cbe, share: R.cbMult / (div00 / (1 + cbe / 100)) };
    });
    out.cb = { ch: avgOf(p => p.cb.ch), cbe: per[0].cb.cbe, share: per[0].cb.share };
    // poison: a hit that lands poisons the monster for its length, a frame's damage at a time; a new poison replaces it
    // only when it is at least as strong (poisonRun). Counted as each landing hit's share of the poison a second, so
    // damage per second still splits exactly
    /* the poison's length on the monster (2026-11-25, traced in the live build): its poison
       length reduction (stat 110: only the uber rows, MonProp) less your "-% to Enemy Poison Resistance" (stat 336,
       below 100 only), below 0 halved (a player's), at least -100: length x (100 - that) / 100, rounded down. So on
       every other monster -20% poison resistance makes poison last 10% longer */
    let plr = +T.plr || 0;
    if (plr < 100) plr -= (+b.g.pp || 0) + psPierce(b, attack);
    if (plr < 0) plr = tdiv(plr, 2);
    plr = Math.max(plr, -100);
    const plen = L => Math.trunc(L * (100 - Math.min(plr, 100)) / 100);
    out.plr = plr;
    const pz = per.filter(p => p.el.pois).map(p => Object.assign({}, p.el.pois, { len: plen(p.el.pois.len), pf: p.el.pois.avg / p.el.pois.len })).filter(z => z.len > 0);
    const ring0 = plagueRing(b, attack, T) || novaPoison(b, attack), ring = ring0 ? ring0.map(a => Object.assign({}, a, { len: plen(a.len) })) : null;
    out.pois = null;
    if ((pz.length || ring) && ER.pois.net > 0) {
      let frame = pz.reduce((s, z) => s + z.pf, 0) / per.length / 256;
      const len = pz.length ? pz.reduce((s, z) => s + z.len, 0) / pz.length : ring[0].len;
      const landed = fr ? fr.hits * 25 / fr.frames * out.toHit : 0;
      let cover = landed > 0 ? Math.min(1, len * landed / 25) : 1, perSec = frame * 25 * cover * ER.pois.net;
      if (fr) {
        const apps = per.map(p => (p.el.pois && plen(p.el.pois.len) > 0 ? [{ dt: 0, lo: p.el.pois.lo, hi: p.el.pois.hi, len: plen(p.el.pois.len), n: 1 }] : []).concat(ring || []));
        /* Split Throw's returns (2026-11-27): each that lands poisons it as the throw does, about 47 frames after the
           throw's hit (they pass it 52-54 frames after the throw, its hit about 6 in), hit or miss; the throw's weapon
           that pierces, on a landed throw */
        if (attack.ex === "splitthrow" && apps[0].length && per[0].el.pois) {
          const S = splitCount(b, attack, T), z = apps[0][0];
          if (S.R > 0) apps[0].push(Object.assign({}, z, { dt: 47, n: S.R, always: true, p: per[0].p }));
          if (S.pc > 0) apps[0].push(Object.assign({}, z, { dt: 47, n: 1, p: S.pc * per[0].p }));
        }
        const R = poisonRun(apps, fr.frames / fr.hits, out.toHit);
        cover = R.up; frame = R.up > 0 ? R.avg / R.up / 256 : 0; perSec = R.avg * 25 / 256 * ER.pois.net;
      }
      const perHit = landed > 0 ? perSec / landed : frame * len * ER.pois.net;
      out.pois = { frame, len, cover, perSec, perHit, venom: pz.some(z => z.venom), ring: ring ? ring.reduce((t, a) => t + a.n, 0) : 0,
        // a spell's one poison: its roll a frame and length as the tooltip shows them (before the monster's length change)
        roll: spell && ring0 && ring0.length === 1 ? ring0[0] : null, raw: ER.pois.net > 0 ? perHit / ER.pois.net : 0 };
      out.final += perHit;
    }
    // what else an attack puts on the monster: the arrows' explosions and flames, the lightning skills' bolts (extraApply)
    if (attack.ex) extraApply(out, b, attack, T);
    // Fists of Fire: each hit casts its charge's effect, the three in turn (fofApply)
    if (attack.charge === "fof") fofApply(out, b, attack, T);
    else if (attack.charge === "boi") boiApply(out, b, attack, T);
    else if (attack.charge === "cot" || attack.charge === "phx") cotPhxApply(out, b, attack, T);
    else if (attack.charge === "cobra") cobraApply(out, b, attack, T);
    else if (attack.charge === "tiger") tigerApply(out, b, attack, T);
    // Dragon Claw after every third charge (finApply)
    if (attack.charge && +b0.s.fin > 0) finApply(out, b, attack, T);
    // another skill cast while it waits for its cooldown (weaveApply)
    if (Array.isArray(b0.s.rot) && b0.s.rot.length && weaveMain(attack)) weaveApply(out, attack, T);
    // speed
    if (fr) {
      out.aps = 25 / fr.frames;              // attacks per second
      out.hps = fr.hits * out.aps;           // hits per second
      out.dps = out.final * out.hps * out.toHit;
    }
    // the kill: seeded simulation
    const kill = !(opts && opts.kill === false);
    out.kill = kill && fr && !attack.frames_only ? killTime(out, b, T, false) : null;
    out.killNoCb = out.kill && out.cb.ch > 0 && out.cb.share > 0 ? killTime(out, b, T, true) : null;
    out.kc = kill && out.kill && !out.kill.never ? killChances(out, b, T) : null;
    // a spell kills in casts
    if ((spell || attack.sentinel) && out.kill) out.kill.unit = unitOf(attack);
    if ((spell || attack.sentinel) && out.kc) out.kc.unit = unitOf(attack);
    return out;
  }

  /* Fists of Fire (2026-11-24, the author: "the first elemental skill"; traced in the live
     build). Every hit that lands casts the next charge's effect, 1, 2, 3, then 1 again (the 4th clears the three
     first); a miss gains no charge and casts nothing. A charge held adds +50% attack rating (progressive_tohit, the
     skill's Param6) to the next hit: the three attacks roll with +0, +50 and +100% more. The hit is the weapon's, as a
     normal attack's; charge 1's turns min(level x 3, 100)% of its physical damage into fire (calc1; the moved part
     takes no fire skill damage) and adds the skill's own fire (EMin / EMax, synergies, fire skill damage: the tooltip's
     "Charge 1"), then an explosion of that fire around the monster and 16 tries at ground flames within 4 sub-tiles,
     each burning what stands in it every frame for its 64 frames: about 1.25 / 3.25 / 5.25 under a small / normal /
     big monster (MonStats2 SizeX: the flames' Size 2 against its footprint). Charge 2: a nova of 64 missiles centred on
     the monster, one hit (their next-hit delay). Charge 3: meteors of fire and flat physical damage (a missile's own
     damagepercent, 0: no + % damage reaches them), 2 on a small or normal monster and 3 on a big one (the author's count
     from his game), and the flames of one landing on it (0 / 3 / 5 under it, Param3 + (level - 1) x Param4 = 25
     frames). Crushing blow stays on the hits (the game rolls it from the monster's life when a melee hit lands). The
     meteors fall about 0.9 s after the hit and the flames burn over time: the kill time counts them at the hit.
     out.final and out.toHit become the three charges' average: damage per landed hit and landed hits per attack */
  const FOF = { flames: [0, 1.25, 3.25, 5.25], meteors: [2, 2, 2, 3], mflames: [0, 0, 3, 5] };
  function fofApply(out, b, attack, T) {
    const D = DATA.fof;
    if (!D) return;
    const lvl = +b.s.lvl || 0;
    const ctx = Object.assign(ctxOf(b, attack), { stat: { passive_fire_mastery: +b.g.fm || 0 } });
    const roll = (lo, hi) => ({ lo, hi, avg: hi > lo ? (lo + hi - 1) / 2 : lo });   // 256ths
    const miss = (r, phys) => roll(Calc.missile(r, "Min", lvl, ctx, phys), Calc.missile(r, "Max", lvl, ctx, phys));
    const skill = roll(Calc.key(attack.id, "enms", lvl, ctx), Calc.key(attack.id, "exms", lvl, ctx));
    const nova = miss(D.nova), mFire = miss(D.meteor), mPhys = miss(D.meteor, true), flame = miss(D.flame), mflame = miss(D.mflame);
    const size = clamp(Math.round(+T.size), 0, 3) || 0;
    const fNet = out.ER.fire.net, pMult = out.R.mult, sk = SK[attack.id] || {};
    const conv = clamp(Calc.value(attack.id, "calc1", lvl, ctx), 0, 100) / 100;
    const fFrames = +D.flame.Range || 0, mFrames = (+sk.Param3 || 0) + (lvl - 1) * (+sk.Param4 || 0);
    const hit = out.final;                        // a hit on the monster (charges 2 and 3)
    const moved = out.eff * conv;                 // charge 1's physical damage that becomes fire
    const hit1 = hit - moved * pMult + moved * fNet + skill.avg / 256 * fNet;
    const explosion = skill.avg / 256 * fNet;
    const flames1 = FOF.flames[size] * flame.avg / 256 * fNet * fFrames;
    // the nova's missiles (Size 1) start in the monster's sub-tile and find a small (size 1) monster only there: none
    // hits it (traced 2026-11-25)
    const nNova = size === 1 ? 0 : 1, novaD = nNova * nova.avg / 256 * fNet;
    const nMet = FOF.meteors[size], meteor = mFire.avg / 256 * fNet + mPhys.avg / 256 * pMult;
    const mflames = FOF.mflames[size] * mflame.avg / 256 * fNet * mFrames;
    const stage = [hit1 + explosion + flames1, hit + novaD, hit + nMet * meteor + mflames];
    const P = chargeP(out, b, attack, T), attacks = P.reduce((t, x) => t + 1 / Math.max(x, 0.05), 0);
    out.fof = { kind: "fof", lvl, skill, nova, nNova, mFire, mPhys, flame, mflame, size, conv, nMet, fFrames, mFrames, fNet, pMult, hit, hit1, explosion,
                flames1, novaD, meteor, mflames, stage, P, attacks };
    /* the character screen shows the charge the next hit casts (the author, 2026-11-24): the Attack line (screenLine)
       plus SkillDesc's p1dm / p2dm / p3dm, whole points, the missiles' without fire skill damage: charge 1 the skill's
       fire with it and one ground flame for 50 frames without it (enma + m1eo x 50 / 256), charge 2 the nova (m2en),
       charge 3 one meteor's fire (m3en). His screenshots, thousands rounded: charge 1 11K–17K at level 40 without
       Battle Command, 11K–18K at 41 with it, 12K–18K with Venom 15 too; charge 2 11K–15K at 41, and 12K–16K with
       Venom 14; charge 3 7203–9713 at 41 and 7628–10K with Venom 14 (exact). His Attack line, a finishing move, adds
       the charges held: 11K–18K with one (charge 1's), 11K–15K with two (charge 2's). With two claws the line isn't
       traced */
    const A = out.per.length === 1 ? out.per[0].screen : null;
    const rawCtx = Object.assign(ctxOf(b, attack), { stat: { passive_fire_mastery: 0 } });
    const raw = r => [Calc.missile(r, "Min", lvl, rawCtx), Calc.missile(r, "Max", lvl, rawCtx)];
    const add = (q, k) => [A.lo + Math.floor(q[0] * k / 256), A.hi + Math.floor(q[1] * k / 256)];
    out.fof.scr = null;
    if (A) {
      const c1 = add(raw(D.flame), 50);
      out.fof.scr = [[c1[0] + Math.floor(skill.lo / 256), c1[1] + Math.floor(skill.hi / 256)], add(raw(D.nova), 1), add(raw(D.meteor), 1)];
    }
    out.final = (stage[0] + stage[1] + stage[2]) / 3;
    out.toHit = 3 / attacks;
  }
  /* a charge-up skill's three attacks' chances to hit: the weapons' attack rating with the charges held, +0, +1 and +2 x
     its progressive_tohit (aurastatcalc2: 50 for Fists of Fire and Blades of Ice); attacks: what the three charges take,
     misses in */
  function chargeP(out, b, attack, T) {
    const step = Calc.value(attack.id, "aurastatcalc2", +b.s.lvl || 1, ctxOf(b, attack)) || 0;
    return [0, step, 2 * step].map(x => out.per.reduce((t, q) => {
      const A = q.AR, ar = A.base + Math.trunc(A.base * (A.pct + x) / 100);
      return t + (out.rolls ? hitChance(ar, q.D.def, +b.c.lvl || 1, +T.lvl || 1) / 100 : 1);
    }, 0) / out.per.length);
  }
  /* Blades of Ice (2026-11-25, traced in the live build): PD2's charge-up attack as Fists of Fire's (the same
     srvdo 170): every landed hit casts the next charge, 1-2-3-1, a miss none, +50% attack rating a charge held. Charge
     1 adds the skill's cold (EMin / EMax, Tiger Strike's synergy, cold skill damage: the tooltip's "Charge 1") to the
     hit and moves none of its physical damage (no calc1). Charge 2 (PD2's srvdo 139): one wave maker from you toward
     the monster (Vel 18, slowing a little; it passes through), leaving two trails sideways at each step (the game's
     wave maker code): the monster takes the maker's hit and one trail's, as each kind of missile hits a monster once in
     6 frames and the maker crosses it in fewer (BOI.waves). Charge 3 (PD2's srvdo 143): a ring of 11 ice bolts (64 /
     Param2 6) starting on the monster and curving outward (the game's curving ring): one hits it, as they share a
     4-frame next-hit delay and are gone after it (BOI.bolts). Their chill (ELen) isn't counted */
  const BOI = { waves: 2, bolts: 1 };
  function boiApply(out, b, attack, T) {
    const D = DATA.boi;
    if (!D) return;
    const lvl = +b.s.lvl || 0;
    const ctx = Object.assign(ctxOf(b, attack), { stat: { passive_cold_mastery: +b.g.cm || 0 } });
    const roll = (lo, hi) => ({ lo, hi, avg: hi > lo ? (lo + hi - 1) / 2 : lo });   // 256ths
    const miss = (r, c) => roll(Calc.missile(r, "Min", lvl, c || ctx), Calc.missile(r, "Max", lvl, c || ctx));
    const skill = roll(Calc.key(attack.id, "enms", lvl, ctx), Calc.key(attack.id, "exms", lvl, ctx));
    const wave = miss(D.wave), trail = miss(D.trail), ice = miss(D.ice);
    const cNet = out.ER.cold.net, hit = out.final;
    const stage = [hit + skill.avg / 256 * cNet, hit + (wave.avg + (BOI.waves - 1) * trail.avg) / 256 * cNet,
                   hit + BOI.bolts * ice.avg / 256 * cNet];
    const P = chargeP(out, b, attack, T), attacks = P.reduce((t, x) => t + 1 / Math.max(x, 0.05), 0);
    out.fof = { kind: "boi", lvl, skill, wave, trail, ice, cNet, pMult: out.R.mult, conv: 0, hit, hit1: hit, stage, P, attacks,
                nWave: BOI.waves, nIce: BOI.bolts };
    /* the character screen (as Fists of Fire's): the Attack line + SkillDesc's p1dm (enma: the skill's cold with cold
       skill damage) / p2dm (m2en: the wave maker, descmissile2) / p3dm (m3en: an ice bolt, descmissile3), the missiles
       without cold skill damage. Not checked in game yet */
    const A = out.per.length === 1 ? out.per[0].screen : null;
    const rawCtx = Object.assign(ctxOf(b, attack), { stat: { passive_cold_mastery: 0 } });
    const add = q => [A.lo + Math.floor(q.lo / 256), A.hi + Math.floor(q.hi / 256)];
    out.fof.scr = A ? [add(skill), add(miss(D.wave, rawCtx)), add(miss(D.ice, rawCtx))] : null;
    out.final = (stage[0] + stage[1] + stage[2]) / 3;
    out.toHit = 3 / attacks;
  }
  /* Claws of Thunder and Phoenix Strike (2026-11-25, traced in the live build): the same charge-up attack
     (srvdo 170). Claws of Thunder: charge 1 the skill's lightning on the hit (prgdam 4, no conversion); charge 2 a ring of
     64 novas starting on the monster: 1 hits it (shared 4-frame delay); charge 3 16 charged bolts starting on it: 1
     hits, and the storm its hit leaves (the bolt's damage, Dragon Claw's synergy) hits once in its 9 frames. Phoenix
     Strike (no element of its own, prgdam 3: nothing on the hit): charge 1 a meteor on the monster's spot 0.6 s later
     (radius 6) and its 18 flames for Param3 + (level - 1) x Param4 = 25 frames, hitting every frame, 0 / 3 / 5 under a
     small / normal / big monster; charge 2 7 chain lightnings on curving loops from the monster: 2 hits (the first
     frame, and the one in three that loops back onto it about a second later: 94% of casts); charge 3 24 chaos ice
     starting on it: 1 hit. Its synergies are on its missiles (Fists of Fire the fire, Claws of Thunder the lightning,
     Blades of Ice the cold, +10% a point each). Missiles: their rows, synergy on whole points, + their element's skill
     damage */
  const PHX = { flames: [0, 0, 3, 5], chains: 2 };
  function cotPhxApply(out, b, attack, T) {
    const D = DATA[attack.charge];
    if (!D) return;
    const lvl = +b.s.lvl || 0, size = clamp(Math.round(+T.size), 0, 3) || 0, sk = SK[attack.id] || {};
    const stat = { passive_fire_mastery: +b.g.fm || 0, passive_ltng_mastery: +b.g.lm || 0, passive_cold_mastery: +b.g.cm || 0 };
    const ctx = Object.assign(ctxOf(b, attack), { stat }), rawCtx = Object.assign(ctxOf(b, attack), { stat: {} });
    const roll = (lo, hi) => ({ lo, hi, avg: hi > lo ? (lo + hi - 1) / 2 : lo });   // 256ths
    const miss = (r, c) => roll(Calc.missile(r, "Min", lvl, c || ctx), Calc.missile(r, "Max", lvl, c || ctx));
    const net = r => out.ER[(r.EType || "").trim()].net;
    const hit = out.final;
    let parts, scr;
    if (attack.charge === "cot") {
      const skill = roll(Calc.key(attack.id, "enms", lvl, ctx), Calc.key(attack.id, "exms", lvl, ctx));
      // the nova's missiles (Size 1) start in the monster's sub-tile and find a small monster only there: none hits it
      // (as Fists of Fire's; simulated 2026-11-25; until then the page counted one)
      parts = [[{ k: "skill", q: skill, n: 1, net: out.ER.ltng.net }], [{ k: "nova", q: miss(D.nova), n: size === 1 ? 0 : 1, net: net(D.nova) }],
               [{ k: "bolt", q: miss(D.bolt), n: 1, net: net(D.bolt) }, { k: "storm", q: miss(D.storm), n: 1, net: net(D.storm) }]];
      scr = [skill, miss(D.nova, rawCtx), miss(D.bolt, rawCtx)];
    } else {
      const frames = (+sk.Param3 || 0) + (lvl - 1) * (+sk.Param4 || 0);
      parts = [[{ k: "meteor", q: miss(D.meteor), n: 1, net: net(D.meteor) },
                { k: "mfire", q: miss(D.mfire), n: PHX.flames[size] * frames, net: net(D.mfire), flames: PHX.flames[size], frames }],
               [{ k: "chain", q: miss(D.chain), n: PHX.chains, net: net(D.chain) }], [{ k: "ice", q: miss(D.ice), n: 1, net: net(D.ice) }]];
      scr = [miss(D.meteor, rawCtx), miss(D.chain, rawCtx), miss(D.ice, rawCtx)];
    }
    const stage = parts.map(ps => hit + ps.reduce((t, x) => t + x.n * x.q.avg / 256 * x.net, 0));
    const P = chargeP(out, b, attack, T), attacks = P.reduce((t, x) => t + 1 / Math.max(x, 0.05), 0);
    out.fof = { kind: attack.charge, lvl, size, parts, stage, P, attacks, hit, hit1: hit, conv: 0, pMult: out.R.mult };
    // the character screen: the Attack line + p1dm / p2dm / p3dm (Claws of Thunder: enma, m2en the nova, m3en a bolt;
    // Phoenix Strike: m1en the meteor, m2en a chain lightning, m3en a chaos ice; missiles without skill damage)
    const A = out.per.length === 1 ? out.per[0].screen : null;
    out.fof.scr = A ? scr.map(q => [A.lo + Math.floor(q.lo / 256), A.hi + Math.floor(q.hi / 256)]) : null;
    out.final = (stage[0] + stage[1] + stage[2]) / 3;
    out.toHit = 3 / attacks;
  }
  /* Cobra Strike (2026-11-25, traced in the live build): the same charge-up attack (PD2's srvdo 170), +50%
     attack rating a charge held. Charge 1 (PD2's stage 171): 7 poison bolts in a fan at the monster, charge 3 (172): 64
     poison clouds out of it; each missile carries its row's poison (Venom's points +20% each, your poison skill damage)
     plus the hit's own poison (your gear's and Venom's, one roll a charge) scaled to its 25 frames, and a lone monster
     takes one of each (the bolts' and clouds' 4-frame lock, simulated). Charge 2: PD2 puts
     +calc2% damage (60 + 30 a level) and life and mana steal (calc1) on you for that hit (its own branch of the charge-up code), so
     its weapon damage is raised; the game's leech by charges (prgdam 2) isn't called for it. Poison is one per attacker
     (yours, the missiles' owner): the strongest replaces the one running (poisonRun over the three charges) */
  const COBRA = { bolts: 1, clouds: 1, boltDt: 3, cloudDt: 2 };
  function cobraApply(out, b, attack, T) {
    const D = DATA.cobra;
    if (!D || !out.fr) return;
    const lvl = +b.s.lvl || 0, ctx = Object.assign(ctxOf(b, attack), { stat: { passive_pois_mastery: +b.g.pm || 0 } });
    const roll = (lo, hi) => ({ lo, hi, avg: hi > lo ? (lo + hi - 1) / 2 : lo });   // 256ths a frame
    const miss = r => roll(Calc.missile(r, "Min", lvl, ctx), Calc.missile(r, "Max", lvl, ctx));
    const bolt = miss(D.bolt), cloud = miss(D.cloud);
    const p0 = out.per[0], pool = 100 + p0.pct + p0.off, ed2 = Calc.value(attack.id, "calc2", lvl, ctxOf(b, attack)) || 0;
    const r2 = pool > 0 ? (pool + ed2) / pool : 1;
    const hit = out.final - (out.pois ? out.pois.perHit : 0), hit2 = hit + out.physFinal * (r2 - 1);
    const z = p0.el.pois, plr = out.plr || 0, plen = L => Math.trunc(L * (100 - Math.min(plr, 100)) / 100);
    const ext = z ? roll(Math.trunc(z.lo * z.len / 25), Math.trunc(z.hi * z.len / 25)) : roll(0, 0);
    const own = z && plen(z.len) > 0 ? [{ dt: 0, lo: z.lo, hi: z.hi, len: plen(z.len), n: 1 }] : [];
    const app = (q, r, dt, n) => ({ dt, lo: q.lo + ext.lo, hi: q.hi + ext.hi, len: plen(+r.ELen || 25), n });
    const P = chargeP(out, b, attack, T), attacks = P.reduce((t, x) => t + 1 / Math.max(x, 0.05), 0), share = 3 / attacks;
    let poison = 0, R = null;
    if (out.ER.pois.net > 0) {
      R = poisonRun([own.concat([app(bolt, D.bolt, COBRA.boltDt, COBRA.bolts)]), own, own.concat([app(cloud, D.cloud, COBRA.cloudDt, COBRA.clouds)])],
        out.fr.frames / out.fr.hits, share);
      const perSec = R.avg * 25 / 256 * out.ER.pois.net, landed = out.fr.hits * 25 / out.fr.frames * share;
      poison = landed > 0 ? perSec / landed : 0;
      out.pois = Object.assign({}, out.pois || {}, { perSec, perHit: poison, cover: R.up, frame: R.up > 0 ? R.avg / R.up / 256 : 0,
        len: plen(+D.bolt.ELen || 25), raw: out.ER.pois.net > 0 ? poison / out.ER.pois.net : 0 });
    }
    const stage = [hit + poison, hit2 + poison, hit + poison];
    out.fof = { kind: "cobra", lvl, bolt, cloud, ext, ed2, r2, hit, hit1: hit, stage, P, attacks, conv: 0, pMult: out.R.mult,
                parts: [[], [], []], pmul: [1, r2, 1], poison, cover: R ? R.up : 0, perSec: out.pois ? out.pois.perSec : 0, scr: null };
    out.final = (stage[0] + stage[1] + stage[2]) / 3;
    out.toHit = 3 / attacks;
  }
  /* Tiger Strike (2026-11-25, traced in the live build): the same charge-up attack (PD2's srvdo 170) with no
     stage function, +50% attack rating a charge held. Its charges are damage: before the melee fill the game's
     progressive physical bonus (prgdam 1) adds the charges (this hit's included) x calc1 (50 + 25 a
     level after the first) to the hit's skill damage %: +calc1, +2 x calc1, +3 x calc1 on the 1st, 2nd and 3rd hit of a
     cycle (its tooltip's lines), the 4th clearing them first; the weapon's damage is raised (pmul), nothing else. Charges
     2 and 3 also widen an item's melee splash by 20% / 40% (not counted) */
  function tigerApply(out, b, attack, T) {
    if (!out.fr) return;
    const lvl = +b.s.lvl || 0, c1 = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)) || 0;
    const p0 = out.per[0], pool = 100 + p0.pct + p0.off, hit = out.final;
    const pmul = [1, 2, 3].map(k => (pool > 0 ? (pool + k * c1) / pool : 1));
    const stage = pmul.map(m => hit + out.physFinal * (m - 1));
    const P = chargeP(out, b, attack, T), attacks = P.reduce((t, x) => t + 1 / Math.max(x, 0.05), 0);
    out.fof = { kind: "tiger", lvl, c1, hit, hit1: hit, stage, P, attacks, conv: 0, pMult: out.R.mult, parts: [[], [], []], pmul, scr: null };
    out.final = (stage[0] + stage[1] + stage[2]) / 3;
    out.toHit = 3 / attacks;
  }
  /* Dragon Claw as a charge-up skill's finisher (b.s.fin: its level; 2026-11-25, the author: "proceed with Dragon Claw";
     traced in the live build). The cycle: three landed charge-up hits (charges 1, 2 and 3 as above), then a Dragon Claw.
     Its two hits (PD2's own start of the game's Dragon Claw hit) strike with the first claw, then the other (the hit's
     number, weaponsFor). Each rolls with the skill's attack bonus (ToHit + LevToHit a level) + the charges' attack
     rating (3 x aurastatcalc2: +150%, Phoenix Strike's +75%); on a landed hit every charge held adds its prgdam: Tiger
     Strike its charges x calc1 to the damage %, Fists of Fire, Claws of Thunder and Blades of Ice charge 1's element
     (Fists of Fire also turning calc1% of the physical damage into fire), Cobra Strike leech, Phoenix Strike nothing;
     Dragon Claw's own calc1 (50 + 25 a level, + 20 a Weapon Block base point and a Claw Mastery level) joins the %.
     After each hit, landed or not, PD2 releases every charge-up skill's charges: its stage functions 1 to the charges
     held, each with the charge set (Claws of Thunder: the nova and the charged bolts; Fists of Fire: the explosion and
     its flames, the nova, the meteors; Blades of Ice: the wave, the ice bolts; Phoenix Strike: the meteor and its
     flames, the chain lightning, the chaos ice); after the second hit (an odd hit number) the charges are gone ("Now
     procs all built up charges on both weapon attacks before consuming them"). The second release comes gap frames after
     the first: the sequence's hit steps (6 and 10) at its rate. A missile kind hits a monster once in its lock, so the
     second set lands only as DCF has it (the novas and charged bolts start on the monster and fly off: simulated by
     size; the waves' 6-frame and the ice bolts' 4-frame lock as a rule, the chaos ice's 2 frames always past); the
     explosions, meteors and flames have no lock: both count. Cobra Strike isn't offered: its releases are poison. The
     cycle's damage per second: (the three charges' + the Dragon Claw's) x 25 / (the charge-up attacks with their misses
     x their frames + Dragon Claw's frames); out.final becomes the cycle's per landed charge-up hit, so final x toHit x
     hits a second stays the cycle's.
     Dragon Tail as the finisher (b.s.fk "dt"; 2026-11-26, the author: "proceed with Dragon Tail"; traced 2026-11-25 in
     the live build): its kick rolls with its ToHit (210 + 10 a level) + the charges' attack rating; a landed kick takes
     the charges' prgdam as Dragon Claw's hit does (Tiger Strike's % on the kick's %, charge 1's element on the kick),
     then the game's own release (it needs the landed kick): every charge-up skill's stages 1 to its charges, once, and
     the charges are gone (PD2 removes them for its five finishers: Attack, Dragon Talon, Dragon Claw, Dragon Tail,
     Dragon Flight); then its explosion, a second, fresh kick's roll (no Tiger Strike %, no charges' element) as fire.
     A miss releases nothing and keeps the charges: you kick again, 1 / chance tries a cycle.
     Dragon Flight as the finisher (b.s.fk "df"; 2026-11-26, the author: "proceed with Dragon Flight"): the same as
     Dragon Tail's (its own kick, kickHit's flight, toht 180 + 15 a level + the charges'; a landed kick gets Tiger
     Strike's % on top of calc2 and charge 1's element, then the game's release once, the charges gone; a miss keeps
     them), no explosion, and its cooldown: it starts again only cd frames after its last kick (the IAS engine's
     release + delay), so a cycle lasts at least that, and a miss waits for it (finFrames).
     Dragon Talon as the finisher (b.s.fk "dl"; 2026-11-26, the author: "proceed with Dragon Talon"; traced in the live
     build, the game's own start and do functions): its first kick is made as the attack starts, with the charges'
     attack rating and, landing, Tiger Strike's % and charge 1's element; at its first hit frame the game releases the
     charges if that kick landed (the stages once, then gone), lands it, then makes the next kick, which no longer has
     them. If the first kick misses, the charges stay: the attack's other kicks still roll with them and get their %
     and element, but only an attack's first kick sets them off (by the next hit frame the pending kick has landed), so
     the next Dragon Talon tries again: 1 / chance attacks a cycle */
  const DCF = {
    nova: (g, z) => (g >= 4 ? (z >= 2 ? 1 : 0) : g === 3 && z === 3 ? 1 : 0),
    bolt: (g, z) => (g >= 4 ? 1 : g === 3 ? (z >= 2 ? 1 : 0) : g === 2 && z === 3 ? 0.71 : 0),
    lock: (g, L) => (g >= L ? 1 : 0),
  };
  function finApply(out, b, attack, T) {
    const F = out.fof, lv = clamp(Math.round(+out.b.s.fin || 0), 0, MAX_LVL), kind = ["dt", "df", "dl"].includes(out.b.s.fk) ? out.b.s.fk : "dc";
    const dt = kind !== "dc", attD = ATT[{ dc: "dragonclaw", dt: "dragontail", df: "dragonflight", dl: "dragontalon" }[kind]];
    if (!F || !out.fr || !lv || attack.charge === "cobra" || !attD) return;
    const pts = k => clamp(Math.round(+out.b.s[k] || 0), 0, 20), wb = pts("wb"), tal = pts("tal"), fly = pts("fly"), tail = pts("tail");
    const syn = kind === "dt" ? { "Dragon Talon": tal, "Dragon Flight": fly } : kind === "dl" ? { "Dragon Tail": tail, "Dragon Flight": fly }
      : kind === "dc" ? { "Weapon Block": wb } : {};
    const bD = Object.assign({}, out.b, { s: { k: attD.k, lvl: lv, hard: Math.min(lv, 20), syn, cdr: "", from: "", hits: 0, corpse: 0, fin: 0, fk: "dc", wb: 0, tal: 0, fly: 0, tail: 0, dcl: 0, dtl: 0, dfl: 0, dll: 0 } });
    const E = evaluate(bD, T, { kill: false });
    if (!E.fr || !(E.fr.hits > 0) || !E.per.length) return;
    // its own %: Dragon Claw's damage, Dragon Tail's explosion's fire (calc1), Dragon Flight's kick damage (calc2)
    const bW = withBC(bD), dcPct = Calc.value(attD.id, kind === "df" || kind === "dl" ? "calc2" : "calc1", +bW.s.lvl || 1, ctxOf(bW, attD)) || 0;
    const z = clamp(Math.round(+T.size), 0, 3) || 2, R = E.fr.r, rate = R && R.t ? R.t.rate : 0;
    const at = R && R.p && R.p.seq ? R.p.seq.steps.map((x, i) => (x[2] === 1 ? i : -1)).filter(i => i >= 0) : [];
    const gap = at.length > 1 && rate > 0 ? Math.ceil(at[1] * 256 / rate) - Math.ceil(at[0] * 256 / rate) : 99;
    const step = 3 * (Calc.value(attack.id, "aurastatcalc2", +b.s.lvl || 1, ctxOf(b, attack)) || 0);
    const P = E.per.reduce((t, q) => {
      const A = q.AR, ar = A.base + Math.trunc(A.base * (A.pct + step) / 100);
      return t + (E.rolls ? hitChance(ar, q.D.def, +b.c.lvl || 1, +T.lvl || 1) / 100 : 1);
    }, 0) / E.per.length;
    // (a kick's % holds its damage against demons / undead apart: kickHit's vs)
    const p0 = E.per[0], pool = 100 + p0.pct + p0.off + (kind === "dt" || kind === "dl" ? +p0.vs || 0 : 0), rT = F.kind === "tiger" && pool > 0 ? (pool + 3 * F.c1) / pool : 1;
    const prg = F.kind === "cot" ? F.parts[0][0] : F.kind === "boi" ? { k: "skill", q: F.skill, n: 1, net: F.cNet }
      : F.kind === "fof" ? { k: "skill", q: F.skill, n: 1, net: F.fNet } : null;
    const conv = F.kind === "fof" ? F.conv : 0, fNet = F.kind === "fof" ? F.fNet : 0, moved = E.eff * conv;
    const add = E.physFinal * (rT - 1) + (prg ? prg.q.avg / 256 * prg.net : 0) + moved * (fNet - E.R.mult);
    // the releases: n on the first hit, n2 on the second
    const part = (k, q, n, net, n2, x) => Object.assign({ k, q, n, net, n2 }, x || {});
    const flat = (k, v, net) => part(k, { lo: v, hi: v, avg: v }, 1, net, 1, { flat: true });
    let rel = [];
    if (F.kind === "cot") {
      const nova = F.parts[1][0], bolt = F.parts[2][0], storm = F.parts[2][1], f = DCF.bolt(gap, z);
      rel = [part("nova", nova.q, nova.n, nova.net, nova.n * DCF.nova(gap, z)), part("bolt", bolt.q, bolt.n, bolt.net, bolt.n * f),
             part("storm", storm.q, storm.n, storm.net, storm.n * f)];
    } else if (F.kind === "phx") {
      const met = F.parts[0][0], fire = F.parts[0][1], chain = F.parts[1][0], ice = F.parts[2][0];
      rel = [part("meteor", met.q, met.n, met.net, met.n), part("mfire", fire.q, fire.n, fire.net, fire.n, { flames: fire.flames, frames: fire.frames }),
             part("chain", chain.q, chain.n, chain.net, gap >= 4 ? chain.n : Math.max(0, chain.n - 1)), part("ice", ice.q, ice.n, ice.net, ice.n * DCF.lock(gap, 2))];
    } else if (F.kind === "boi") {
      const w = DCF.lock(gap, 6);
      rel = [part("wave", F.wave, 1, F.cNet, w), part("trail", F.trail, F.nWave - 1, F.cNet, (F.nWave - 1) * w), part("ice", F.ice, F.nIce, F.cNet, F.nIce * DCF.lock(gap, 4))];
    } else if (F.kind === "fof") {
      rel = [part("explosion", F.skill, 1, F.fNet, 1), flat("flames", FOF.flames[F.size] * F.flame.avg * F.fFrames, F.fNet),
             part("nova", F.nova, F.nNova, F.fNet, F.nNova * DCF.nova(gap, z)), part("meteor", F.mFire, F.nMet, F.fNet, F.nMet),
             part("mphys", F.mPhys, F.nMet, F.pMult, F.nMet), flat("mflames", FOF.mflames[F.size] * F.mflame.avg * F.mFrames, F.fNet)];
    }
    // Dragon Claw: its hits each landing with P, both releases come; Dragon Tail: kicks until one lands (tries), then
    // the kick (its explosion in E.final), one release
    if (kind !== "dc") rel.forEach(x => { x.n2 = 0; });   // one release
    const hits = E.fr.hits, relD = rel.reduce((t, x) => t + (x.n + (hits > 1 ? x.n2 : 0)) * x.q.avg / 256 * x.net, 0);
    const tries = dt ? 1 / Math.max(P, 0.05) : 1, P0 = E.toHit;
    // Dragon Talon: the landing attack's first kick with the charges, its other kicks without; each attack before it
    // (its first kick missed) the other kicks with them
    const dc = (kind === "dl" ? E.final + add + (hits - 1) * P0 * E.final + (tries - 1) * (hits - 1) * P * (E.final + add)
      : dt ? E.final + add : hits * P * (E.final + add)) + relD, stages = F.stage[0] + F.stage[1] + F.stage[2];
    const X0 = { kind, tries };
    const cyc = { att: F.attacks + tries, frames: finFrames(X0, F.attacks, out.fr.frames, E.fr), dmg: stages + dc, stages, dc };
    const q0 = E.fr.r && E.fr.r.t ? E.fr.r.t.parts[0] : {};
    F.fin = { kind, P0, own: q0.own || E.fr.frames, cdc: q0.cd || 0, dt, att: attD, lvl: lv, lvBC: +bW.s.lvl || lv, wb, tal, fly, pct: dcPct, bD, E, P, gap, rT, prg, conv, fNet, add, rel, relD, dc, cyc, step, size: z, hits, tries };
    out.final = cyc.dmg * out.fr.frames / (cyc.frames * out.toHit);
  }
  /* a cycle's frames: the charge-up attacks (with their misses) x their frames fc, then the finisher's (fr: its frames
     as roundOf gives them, at the same IAS): Dragon Claw once, Dragon Tail and Dragon Flight 1 / chance kicks; Dragon
     Flight starts again only its cooldown cycle (release + delay) after its last kick: max(the charges + one kick, that
     cycle), and a miss waits a whole cycle */
  function finFrames(X, attacks, fc, fr) {
    if (X.kind === "df") {
      const q = fr.r && fr.r.t ? fr.r.t.parts[0] : {}, own = q.own || fr.frames, cyc = q.cd || fr.frames;
      return Math.max(attacks * fc + own, cyc) + (X.tries - 1) * fr.frames;
    }
    return attacks * fc + X.tries * fr.frames;
  }
  /* Between cooldowns (2026-11-26, the author: "skills with cooldowns will often weave in other skills into their
     casting order. For example, a blizzard sorceress has many frames of downtime in which they can cast ice blast or ice
     bolt for additional damage", "maybe it should be a toggle as to whether they want to weave in other skills or cast
     just the main skill"; then "add channels, cooldown fillers and multi-skill rotations", asking whether Inferno's
     lowered fire resistance counts). A skill with a cooldown (a spell's Skills.txt delay; Shock Web's and Plague
     Javelin's in the IAS engine; not Dragon Flight's or Joust's, part of their own cycles) stands still from the end of
     its cast until its cooldown is over (castFrames, the IAS engine's cooled). Up to 3 other skills of its kind (a
     spell for a spell, a weapon attack for a weapon attack: `s.rot` [{k, lvl}], their synergies' points in `s.wvs`
     where the attack's own fields don't ask them) can be cast then: a channel breath by breath (Inferno, Arctic Blast:
     one every 4 frames, the first 4 frames after it starts), a skill with a cooldown of its own whenever that allows
     (each class skill has its own cooldown in PD2: a flag per skill of the class's list, traced 2026-11-20). The page
     plays it out (`weaveSim`): the skill as soon as its cooldown allows; in its wait the first of the others, in an
     order, that is ready and ends before the skill is ready again, or, for a skill allowed to (`hold`), also one that
     holds it back (one with a cooldown of its own only at the wait's start, as a player casts Fire Wall right after
     Meteor: ready later, it would hold Meteor back nearly its whole cast); every order of the skills picked, each of
     them allowed or not, and the one with the most damage a second is counted (the author's "whichever does more");
     none when the skill alone does more. Inferno's and Arctic Blast's debuff (aurastatcalc1,
     for auralencalc frames after each breath: srvhit 50 puts it on what a flame hits) lowers that element's resistance
     for the other skills' damage that lands while it is on: a cast's at its release (Meteor's when it lands, its fall
     later), a burn's spread over its frames (Meteor's flames, Fire Wall's, Blaze's). */
  const WEAVE_NOT = { dragonflight: true, joust: true };
  const WEAVE_DEBUFF = { inferno: "fire", arctic: "cold" };   // (the attack's ex: the element its breaths lower)
  const weaveMain = a => !!a && !a.tick && !!(a.cd || (a.id && IAS.SKILL[a.id] && IAS.SKILL[a.id].cd && !WEAVE_NOT[a.k]));
  // the skills that can go in its wait: its class's of its kind, a channel and one with a cooldown of its own too; not
  // one with a pace of its own (Thunder Storm, Hurricane, Armageddon, Blade Shield), a summon, a trap, a charge-up, a
  // kick, a form, Dark Pact, Death Sentry or Blade Sentinel
  function fillerKinds(cls, att) {
    const spell = isSpell(att);
    return attacksFor(cls).filter(a => a.k !== att.k && !a.frames_only && !WEAVE_NOT[a.k] && (!a.tick || a.tick === "channel") && !a.trap && !a.pet && !a.charge
      && !a.kick && !a.flight && !a.form && a.kind !== "charge" && a.ex !== "dpact" && a.ex !== "dsentry" && a.ex !== "sentinel" && isSpell(a) === spell);
  }
  // ...and the ones the build can use (a weapon attack that needs another weapon has no frames)
  const fillersFor = (b, att) => fillerKinds(b.cls, att).filter(a => frames(b, a));
  // the skills picked (`s.rot`): ones of its kind, each once, at most 3
  function rotOf(s, cls, att) {
    const ok = new Set(fillerKinds(cls, att).map(a => a.k)), seen = new Set();
    return (Array.isArray(s.rot) ? s.rot : []).filter(x => x && ok.has(x.k) && !seen.has(x.k) && seen.add(x.k)).slice(0, 3);
  }
  /* the skills whose points a skill's damage reads (its synergies), but a class mastery asked as base points elsewhere
     (Penetrate: Strafe's synergy and the Amazon's pierce) */
  function synNames(cls, att) {
    const mastNames = new Set((MAST[cls] || []).filter(id => MAST_BASE[id]).map(id => SK[id] && SK[id].skill)), out = new Set();
    for (const col of [att.dmg, att.hits, att.syn].filter(Boolean)) for (const name of Calc.synergies(att.id, col)) if (!mastNames.has(name)) out.add(name);
    for (const name of att.synn || []) out.add(name);   // synergies on its missiles (Phoenix Strike)
    return out;
  }
  // the skill's wait: its frames n and its own (casting or attacking) frames, when the cooldown holds it back
  function weaveWait(fr, att) {
    if (!fr || fr.alt) return null;
    if (fr.note === "cast") return fr.cast && fr.cast.cd && !fr.cast.tick && !fr.cast.cycle && fr.frames > fr.cast.own ? { n: fr.frames, own: fr.cast.own } : null;
    const q = fr.r && fr.r.t ? fr.r.t.parts[0] : null;
    return q && q.wait && !WEAVE_NOT[att.k] ? { n: fr.frames, own: q.own } : null;
  }
  /* a cast's damage at another pace without the weave (Volcano's volcanoes share one lock on the monster: their hits
     come every lock frames however often you cast); base: the cast's own damage (r.final before the weave) */
  function paceFinal(r, frames, base) {
    const fin = base === undefined ? r.final : base;
    const B = r.ex && r.ex.kind === "volcano" ? r.ex.always.find(p => p.k === "body") : null;
    if (!B || !(fin > 0)) return fin;
    const per = r.ex.always.filter(p => p.k === "body" || p.k === "bodyP").reduce((t, p) => t + p.q.avg / 256 * p.net * (p.mult || 1), 0);
    return fin + per * ((frames < B.life ? frames / B.lock : B.alone) - B.n);
  }
  /* a play's timing from its frames: own (the frames it takes), rel (its release: where its damage starts), cyc (when
     it can be played again from its start: its cooldown's end, or own) */
  function weaveTiming(fr) {
    const cast = fr.note === "cast", chan = cast && fr.cast.tick === "channel", q = !cast && fr.r && fr.r.t ? fr.r.t.parts[0] : null;
    const own = Math.max(1, cast ? (chan ? fr.frames : fr.cast.own || fr.frames) : (q && q.wait && q.own) || fr.frames);
    return { own, rel: cast ? clamp(fr.cast.rel || own, 1, own) : own, cyc: Math.max(own, fr.frames), chan };
  }
  /* each skill's play (the skill first, then the others): its timing, its damage a play on the monster (base: a cast,
     breath or round, every hit of it), the debuff its breaths put on (deb: el, v its -resistance, len frames), and its
     damage's parts of an element another skill's debuff lowers (add: what the debuff adds when it is on all through the
     part, at: frames after the release it lands, frames: a burn's) */
  function weaveSkills(out, use, T) {
    const fall = +(((DATA.ex || {}).meteorfire || {}).fall) || 15;
    const parts = X => (X ? X.land.map(p => [p, X.p]).concat(X.always.map(p => [p, 1])) : []);
    const val = ([p, pr]) => p.n * p.q.avg / 256 * p.net * (p.mult || 1) * pr;
    const one = (E, b, deb) => {
      const hits = E.fr ? E.fr.hits || 1 : 1;
      const d = Object.assign(weaveTiming(E.fr), { att: E.attack, E, hits: Math.max(1, Math.round(hits)), base: E.final * E.toHit * hits, deb, parts: [] });
      const dbf = {};
      for (const o of use) if (o.deb && o.deb !== deb) dbf[o.deb.el] = Math.min(dbf[o.deb.el] || 0, o.deb.v);
      const A = parts(E.ex);
      if (A.some(([p]) => p.el && p.el in dbf)) {
        // its damage with the others' debuffs on (elemRes reads b.dbf), part by part
        const E2 = evaluate(Object.assign({}, b, { dbf, s: Object.assign({}, b.s, { rot: [] }) }), T, { kill: false }), B = parts(E2.ex);
        const at = E.ex.kind === "meteor" ? fall : 0;
        d.parts = A.map((q, i) => ({ el: q[0].el, add: B[i] ? (val(B[i]) - val(q)) * hits : 0, at, frames: +q[0].frames || 0 })).filter(p => p.el in dbf && p.add > 1e-9);
      }
      return d;
    };
    return [one(out, out.b, null)].concat(use.map(o => one(o.E, o.bW, o.deb)));
  }
  /* the rotation played out: the skill (S[0]) whenever its cooldown allows; in its wait the first of the others (order)
     that is ready (its own cooldown) and fits, or, hold[j], that is ready (holding the skill back: one with a cooldown of
     its own only at the wait's start); else standing until one is or the skill is again. stop(mains, t, plays): when to
     end. [{j: the skill's index, t: the frame its play starts}] */
  function weaveSim(S, order, hold, stop) {
    const M = S[0], ready = S.map(() => 0), ev = [], any = j => hold[j] && S[j].cyc <= S[j].own;
    let t = 0, next = 0, mains = 0, ws = 0;
    for (let g = 0; g < 400000 && !stop(mains, t, ev); g++) {
      if (t >= next) { ev.push({ j: 0, t }); mains++; next = t + M.cyc; t += M.own; ws = t; continue; }
      let pick = -1;
      for (const j of order) if (ready[j] <= t && (S[j].own <= next - t || any(j) || (hold[j] && t === ws))) { pick = j; break; }
      if (pick >= 0) { ev.push({ j: pick, t }); ready[pick] = t + S[pick].cyc; t += S[pick].own; continue; }
      let to = next;
      for (const j of order) if (ready[j] > t && ready[j] < to && (S[j].own <= next - ready[j] || any(j))) to = ready[j];
      t = to;
    }
    return ev;
  }
  /* each play's damage on the monster (e.v; e.add: what the debuffs add to it, e.full: what they would if on all the
     time): the skill's at the pace to its next cast (paceFinal: Volcano's), each part with the share of its frames
     under the debuff of its element (each breath of a debuffing skill puts it on from its release for its length,
     merged). e.nm: the frame the skill is cast again after the play */
  function weaveDamage(S, ev, r, base) {
    const win = {};
    for (const e of ev) { const s = S[e.j]; if (s.deb) (win[s.deb.el] = win[s.deb.el] || []).push([e.t + s.rel, e.t + s.rel + s.deb.len]); }
    for (const k of Object.keys(win)) {
      const m = [];
      for (const x of win[k].sort((p, q) => p[0] - q[0])) { if (m.length && x[0] <= m[m.length - 1][1]) m[m.length - 1][1] = Math.max(m[m.length - 1][1], x[1]); else m.push(x.slice()); }
      win[k] = m;
    }
    // the share of frames [a, b) (a hit: its one frame) under element el's debuff
    const cover = (el, a, b) => {
      const w = win[el];
      if (!w || !w.length) return 0;
      const hi = b > a ? b : a + 1;
      let lo = 0, top = w.length;
      while (lo < top) { const mid = (lo + top) >> 1; if (w[mid][1] <= a) lo = mid + 1; else top = mid; }
      let c = 0;
      for (let i = lo; i < w.length && w[i][0] < hi; i++) c += Math.max(0, Math.min(hi, w[i][1]) - Math.max(a, w[i][0]));
      return c / (hi - a);
    };
    let nm;
    for (let i = ev.length - 1; i >= 0; i--) {
      const e = ev[i];
      e.nm = nm !== undefined ? nm : e.t + S[0].cyc;
      if (e.j === 0) { e.gap = e.nm - e.t; nm = e.t; }
    }
    for (const e of ev) {
      const s = S[e.j];
      let add = 0, full = 0;
      for (const p of s.parts) { const a = e.t + s.rel + p.at; add += p.add * cover(p.el, a, a + p.frames); full += p.add; }
      e.v = (e.j === 0 ? paceFinal(r, e.gap, base) * r.toHit * r.fr.hits : s.base) + add; e.add = add; e.full = full;
    }
  }
  /* the pattern the rotation settles into: from the skill's 5th cast (the start, everything ready, aside), the fewest
     of its casts after which the same plays come at the same frames; damage a second over it, each skill's damage and
     plays in it. {dps, dmg, add, full, by, count, casts, frames, i0, i1 (its plays' indices), k (the others' plays)} */
  const WEAVE_K = 30, WEAVE_A = 4;
  function weavePeriod(S, ev) {
    const mi = [];
    ev.forEach((e, i) => { if (e.j === 0) mi.push(i); });
    const K = mi.length - 1, sig = [];
    for (let c = 0; c < K; c++) {
      const t0 = ev[mi[c]].t, ps = [];
      for (let i = mi[c] + 1; i < mi[c + 1]; i++) ps.push(ev[i].j + "@" + (ev[i].t - t0));
      sig.push(ps.join(",") + "|" + (ev[mi[c + 1]].t - t0));
    }
    const A = Math.min(WEAVE_A, K - 1);
    let p = K - A;
    for (let q = 1; q <= 12 && A + 2 * q <= K; q++) {
      let same = true;
      for (let c = A; c + q < K && same; c++) same = sig[c] === sig[c + q];
      if (same) { p = q; break; }
    }
    const i0 = mi[A], i1 = mi[A + p], frames = ev[i1].t - ev[i0].t, by = S.map(() => 0), count = S.map(() => 0);
    let dmg = 0, add = 0, full = 0;
    for (let i = i0; i < i1; i++) { const e = ev[i]; dmg += e.v; add += e.add; full += e.full; by[e.j] += e.v; count[e.j]++; }
    return { dps: frames > 0 ? dmg * 25 / frames : 0, dmg, add, full, by, count, casts: p, frames, i0, i1, k: count.reduce((t, c, j) => t + (j ? c : 0), 0) };
  }
  /* the best rotation: every order of the other skills, each allowed to hold the skill back or not (until: one is;
     other: the best damage a second with none allowed when one is, else with one allowed) */
  function weaveBest(S, r, base) {
    const perms = xs => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => perms(xs.slice(0, i).concat(xs.slice(i + 1))).map(p => [x].concat(p))));
    const other = [0, 0], n = S.length - 1;
    let best = null;
    for (const order of perms(S.slice(1).map((_, i) => i + 1))) for (let mask = 0; mask < 1 << n; mask++) {
      const hold = S.map((_, j) => j > 0 && !!(mask & (1 << (j - 1)))), until = mask > 0;
      const ev = weaveSim(S, order, hold, m => m > WEAVE_K);
      weaveDamage(S, ev, r, base);
      const B = weavePeriod(S, ev);
      other[+until] = Math.max(other[+until], B.dps);
      if (!best || B.dps > best.dps * (1 + 1e-9)) best = Object.assign(B, { order, hold, until, ev });
    }
    best.other = other[best.until ? 0 : 1];
    return best;
  }
  function weaveApply(out, attack, T) {
    const s0 = out.b.s, picks = rotOf(s0, out.b.cls, attack);
    if (!picks.length || !out.fr || !(out.toHit > 0)) return;
    const mine = synNames(out.b.cls, attack), wait = weaveWait(out.fr, attack);
    const rot = picks.map(x => {
      const att = ATT[x.k], lv = clamp(Math.round(+x.lvl || 0), 1, MAX_LVL), syn = {};
      for (const name of synNames(out.b.cls, att)) syn[name] = clamp(Math.round(+((mine.has(name) ? s0.syn : s0.wvs) || {})[name] || 0), 0, 20);
      // its own evaluation: the build before Battle Command (out.b), so withBC raises its level once; Cast from as the
      // skill's (you stand in one place)
      const bW = Object.assign({}, out.b, { s: Object.assign(DEFAULT_BUILD().s, { k: att.k, lvl: lv, hard: 0, syn, from: s0.from || "", rot: [] }) });
      const E = evaluate(bW, T, { kill: false }), bc = withBC(bW), lvBC = +bc.s.lvl || lv, el = WEAVE_DEBUFF[att.ex], c = ctxOf(bc, att);
      const deb = el && E.fr ? { el, v: Calc.value(att.id, "aurastatcalc1", lvBC, c) || 0, len: Math.max(1, Calc.value(att.id, "auralencalc", lvBC, c) || 10) } : null;
      return { att, lvl: lv, lvBC, bW, E, deb, none: !E.fr ? "frames" : !(E.final > 0) ? "damage" : "" };
    });
    const use = rot.filter(o => !o.none), base = out.final;
    const W = out.wv = { rot, use, k: 0, base, mainBase: base * out.toHit * out.fr.hits, wait };
    if (!use.length) { W.none = "use"; return; }
    W.S = weaveSkills(out, use, T);
    W.alone = paceFinal(out, W.S[0].cyc, base) * out.toHit * out.fr.hits * 25 / W.S[0].cyc;
    if (!wait) { W.none = "wait"; return; }
    Object.assign(W, weaveBest(W.S, out, base));
    if (!(W.dps > W.alone * (1 + 1e-9))) { W.none = "pays"; W.k = 0; return; }
    out.final = W.dps * out.fr.frames / (25 * out.toHit * out.fr.hits);
  }
  /* the fights' plays from the fight's start (every skill ready), the pattern repeating once it settles: play i's skill
     j, m its damage over its own a play (the debuffs, Volcano's pace), nm the frame the skill is cast again after it (a
     kill counts the rotation whole to there, as a kill counts an attack whole) */
  function weaveStepper(W) {
    const ev = W.ev, a = W.i0, L = W.i1 - W.i0, P = W.frames;
    const own = j => (j === 0 ? W.mainBase : W.S[j].base);
    return i => {
      const q = i < W.i1 ? 0 : Math.floor((i - a) / L), e = i < W.i1 ? ev[i] : ev[a + (i - a) % L];
      return { j: e.j, m: own(e.j) > 0 ? e.v / own(e.j) : 1, nm: e.nm + q * P, t: e.t + q * P };
    };
  }
  /* the rotation at another speed (the Breakpoints tab, the next breakpoint): every skill's frames at that faster cast
     rate or IAS on other gear, the best rotation there. pre: the builds with Battle Command's levels, made once */
  function weaveAt(r, fcr, gear, pre) {
    const W = r.wv, P = pre || { b: withBC(r.b), w: W.use.map(o => withBC(o.bW)) };
    const at = x => (fcr === undefined ? x : Object.assign({}, x, { g: Object.assign({}, x.g, { fcr }) }));
    const fr = frames_(at(P.b), r.attack, gear), frs = W.use.map((o, i) => frames_(at(P.w[i]), o.att, gear));
    if (!fr || frs.some(f => !f)) return null;
    const key = [fr].concat(frs).map(f => { const x = weaveTiming(f); return `${x.own}.${x.rel}.${x.cyc}`; }).join("/");
    const alone = paceFinal(r, fr.frames, W.base) * r.toHit * fr.hits * 25 / fr.frames, res = { fr, frs, key, alone, k: 0, dps: alone };
    if (!weaveWait(fr, r.attack)) return res;
    const S = W.S.map((s, j) => Object.assign({}, s, weaveTiming(j === 0 ? fr : frs[j - 1]), j === 0 ? {} : { base: s.base * (frs[j - 1].hits || 1) / Math.max(1e-9, s.E.fr.hits || 1) }));
    const B = weaveBest(S, Object.assign({}, r, { fr }), W.base);
    return B.dps > alone * (1 + 1e-9) ? Object.assign(res, B, { S }) : res;
  }
  /* the rotation at every speed where any skill's frames change: faster cast rate 0-300 for a spell, else the IAS on
     other gear of every skill's breakpoints. {rows: [{fcr | gear, fr, frs, k, dps, casts, frames, count}], cur: your
     row, fcr, you} */
  function weaveRows(r) {
    const W = r.wv, pre = { b: withBC(r.b), w: W.use.map(o => withBC(o.bW)) }, rows = [];
    let last = "";
    const put = (key, x) => { if (x && x.key !== last) { rows.push(Object.assign(key, x)); last = x.key; } };
    if (r.fr.note === "cast") {
      // (every skill's frames first, the rotation only where they change)
      let seen = "";
      for (let v = 0; v <= 300; v++) {
        const fv = x => Object.assign({}, x, { g: Object.assign({}, x.g, { fcr: v }) });
        const fs = [frames_(fv(pre.b), r.attack)].concat(W.use.map((o, i) => frames_(fv(pre.w[i]), o.att)));
        const ks = fs.map(f => { if (!f) return "-"; const x = weaveTiming(f); return `${x.own}.${x.rel}.${x.cyc}`; }).join("/");
        if (ks !== seen) { seen = ks; put({ fcr: v }, weaveAt(r, v, undefined, pre)); }
      }
      const you = r.fr.cast.fcr;
      return { rows, cur: rows.reduce((k, x, i) => (x.fcr <= you ? i : k), 0), fcr: true, you };
    }
    const gears = new Set([0]);
    [[pre.b, r.attack]].concat(W.use.map((o, i) => [pre.w[i], o.att])).forEach(([bb, a]) => {
      if (a.kind === "cast" || a.tick) return;   // (a cast keeps its frames at any IAS)
      const s = iasSetup(bb, a);
      if (s.atk && !IAS.SKILL[s.atk]) return;
      IAS.breakpoints(s).rows.forEach(x => gears.add(x.gear));
    });
    [...gears].sort((x, y) => x - y).forEach(g => put({ gear: g }, weaveAt(r, undefined, g, pre)));
    const you = +r.b.g.ias || 0;
    return { rows, cur: rows.reduce((k, x, i) => (x.gear <= you ? i : k), 0), fcr: false, you };
  }
  /* a finisher in a fight (256ths): Dragon Claw's two hits (each with the charges' attack rating, the Tiger Strike raise
     and charge 1's element) and the two releases, landed or not; a Dragon Tail kick: -1 on a miss (the charges stay),
     else the kick, its explosion and one release */
  const rollQ = (q, rnd) => q.lo + (q.hi > q.lo ? Math.floor(rnd() * (q.hi - q.lo)) : 0);
  function finLoss(E, T, rnd, L, life, noCb, ev) {
    const X = E.fof.fin, D = X.E;
    // (ev, the Fight tab's record: ev.hits, each of the finisher's hits, a miss as {miss: true}; ev.parts, the releases)
    const sub = landed => { const o = landed ? {} : { miss: true }; if (ev) (ev.hits || (ev.hits = [])).push(o); return ev ? o : null; };
    // Dragon Talon: its first kick decides; the others roll with the charges only if it missed
    if (X.kind === "dl") {
      const first = X.P >= 1 || rnd() < X.P;
      let t = first ? finHit(X, D, D.per[0], T, rnd, L, life, noCb, true, sub(true)) + relLoss(X, 0, rnd, ev) : (sub(false), 0);
      for (let h = 1; h < X.hits; h++) {
        const P = first ? X.P0 : X.P;
        if (P >= 1 || rnd() < P) t += finHit(X, D, D.per[h % D.per.length], T, rnd, L - t, life, noCb, !first, sub(true));
        else sub(false);
      }
      return [Math.trunc(t), first];
    }
    if (X.dt && X.P < 1 && rnd() >= X.P) { sub(false); return [0, false]; }
    let t = 0;
    for (let h = 0; h < X.hits; h++) {
      const p = D.per[h % D.per.length];
      if (X.dt || X.P >= 1 || rnd() < X.P) t += finHit(X, D, p, T, rnd, L - t, life, noCb, true, sub(true));
      else sub(false);
      t += relLoss(X, h, rnd, ev);
    }
    return [Math.trunc(t), true];
  }
  /* one of the finisher's hits (256ths): with the charges (their % and element) or without; ev its record */
  function finHit(X, D, p, T, rnd, L, life, noCb, charged, ev) {
        let d = p.mn256 + (p.mx256 > p.mn256 ? Math.floor(rnd() * (p.mx256 - p.mn256)) : 0);
        const x = rnd(), C = p.crit;
        if (x < C.pc) { d = Math.trunc(d * C.cm); if (ev) ev.crit = true; }
        else if (rnd() < C.pd / (1 - C.pc || 1)) { d = Math.trunc(d * C.dm); if (ev) ev.ds = true; }
        let cb = 0;
        if (!noCb && p.cb.ch > 0 && D.R.cbMult > 0 && rnd() < p.cb.ch) cb = Math.trunc(L / (cbDivisor(T, L, life, false) / (1 + p.cb.cbe / 100)) * D.R.cbMult);
        let e = 0;
        for (const q of p.elRoll) e += (q[0] + (q[1] > q[0] ? Math.floor(rnd() * (q[1] - q[0])) : 0)) * q[2];
        if (X.prg && charged) { const v = rollQ(X.prg.q, rnd) * X.prg.net; e += v; if (ev) evPart(ev, { k: "charge", el: X.prg.el }).d.push(v); }
        if (D.ex) e += exLoss(D.ex.land, rnd, ev) + exLoss(D.ex.always, rnd, ev);   // Dragon Tail's explosion
        const cv = charged ? Math.trunc(d * X.conv) : 0;
        if (ev) { ev.cb = cb; ev.phys = (d - cv) * D.pm * (charged ? X.rT : 1) + cv * X.fNet; ev.el = e; ev.pois = D.poisHit256; ev.charged = charged; }
        return cb + Math.trunc((d - cv) * D.pm * (charged ? X.rT : 1) + cv * X.fNet + e + D.poisHit256);
  }
  /* the charges' effects released after hit h (Dragon Claw's second release: n2); ev: each one's rolls */
  function relLoss(X, h, rnd, ev) {
    let t = 0;
    for (const x of X.rel) {
      const n = h === 0 ? x.n : x.n2;
      if (x.flat || x.flames !== undefined) { t += n * x.q.avg * x.net; if (ev) Object.assign(evPart(ev, x), { over: n * x.q.avg * x.net, rel: h }); continue; }
      let k = Math.floor(n);
      if (n > k && rnd() < n - k) k++;
      const o = ev ? Object.assign(evPart(ev, x), { rel: h }) : null;
      for (let i = 0; i < k; i++) { const v = rollQ(x.q, rnd) * x.net; t += v; if (o) o.d.push(v); }
    }
    return t;
  }
  /* Poison over time (2026-11-25, traced in the live build of 11-04; until then the page counted the
     average roll whenever hits came at least once a length). PD2 keeps one poison per attacker on a monster: every hit,
     cloud and item of one character's is the same poison. A new one replaces it only when its damage a frame is at
     least as high, and then runs its own length from that moment, even a shorter one; a weaker one is lost. So poisons
     never add up, several at once count their highest roll, and hitting faster than the length can leave gaps (a weaker
     roll dropped while the stronger one runs out). Worked out over 400 attacks (seeded): a hit every period frames,
     landing with chance p; apps[k]: the k-th weapon's applications [{dt (frames after the hit), lo, hi (256ths a frame,
     before the monster's resistance: it scales them all alike), len, n, always (on a miss too)}]. {avg: 256ths a frame
     over the time, up: the share of the time it is poisoned}, the first 150 frames left out */
  function poisonRun(apps, period, p) {
    const rnd = mulberry32(2611), ev = [], N = 400, warm = 150;
    if (!(period > 0)) return { avg: 0, up: 0 };
    for (let k = 0; k < N; k++) {
      const t0 = k * period, hit = p >= 1 || rnd() < p;
      for (const a of apps[k % apps.length]) {
        if (!hit && !a.always) continue;
        // (a.p: each application's own chance to land, Split Throw's returns)
        for (let i = 0; i < a.n; i++) { if (a.p !== undefined && !(rnd() < a.p)) continue; ev.push([t0 + a.dt, a.lo + rnd() * Math.max(0, a.hi - a.lo), a.len]); }
      }
    }
    ev.sort((x, y) => x[0] - y[0]);
    const end = N * period;
    let cur = 0, exp = -1, t = 0, area = 0, up = 0;
    const run = to => {
      const a = Math.max(t, warm), e = Math.min(exp, to);
      if (e > a) { area += cur * (e - a); up += e - a; }
      t = to;
    };
    for (const [te, v, len] of ev) {
      if (te >= end) break;
      run(te);
      if (te >= exp || v >= cur) { cur = v; exp = te + len; }
    }
    run(end);
    const span = Math.max(1, end - warm);
    return { avg: area / span, up: up / span };
  }
  /* Plague Javelin's explosion (2026-11-25, traced in the live build): hit or miss it bursts a ring
     of 23 clouds out of the monster (8 slow, 15 faster), each the skill's poison alone (its synergies and poison skill
     damage, not the gear's) for the skill's length; starting in its sub-tile, they reach it 6 (11 of them), 8 (4), 11
     (4) and 16 (4) frames later, all of them on a normal or big monster, 15-19 on a small one (17 here). Each poisons it
     once. Its trail clouds never touch a monster standing alone. [{dt, lo, hi, len, n, always}] or null */
  const PLAGUE = { ring: [[6, 11], [8, 4], [11, 4], [16, 4]], small: [[6, 11], [8, 4], [11, 2]] };
  /* Poison Nova (2026-11-25): one poison a cast on the monster, the skill's EMin / EMax a frame (HitShift 4, its
     synergies in) with your poison skill damage, over its ELen; a new cast's replaces it only when at least as strong */
  function novaPoison(b, attack) {
    if ((attack.ex !== "pnova" && attack.ex !== "desecrate") || !(+b.s.lvl > 0)) return null;
    const lvl = +b.s.lvl, ctx = Object.assign(ctxOf(b, attack), { stat: {} }), m = +b.g.pm || 0;
    const mn = Calc.key(attack.id, "edns", lvl, ctx), mx = Calc.key(attack.id, "edxs", lvl, ctx), len = +(SK[attack.id] || {}).ELen || 50;
    if (!(mx > 0)) return null;
    const lo = mn + tdiv(mn * m, 100), hi = mx + tdiv(mx * m, 100);
    return [{ dt: 0, n: 1, lo, hi: Math.max(hi, lo), len, always: true }];
  }
  function plagueRing(b, attack, T) {
    if (attack.ex !== "plaguejav" || !(+b.s.lvl > 0)) return null;
    const sp = skillPoison(b, attack), m = +b.g.pm || 0;
    if (!sp || !(sp.max > 0)) return null;
    const lo = sp.min + tdiv(sp.min * m, 100), hi = sp.max + tdiv(sp.max * m, 100);
    const size = clamp(Math.round(+T.size) || 2, 1, 3);
    return (size === 1 ? PLAGUE.small : PLAGUE.ring).map(([dt, n]) => ({ dt, n, lo, hi: Math.max(hi, lo), len: sp.len, always: true }));
  }
  /* What an attack puts on the monster besides its hit (2026-11-25, the author: "the elemental arrows" and "Lightning
     Fury, Charged Strike"; traced in the live build). Parts {k, q: a roll
     {lo, hi, avg} in 256ths, n: how many land on the monster, net: what gets through its resistance; a flame's q is a
     frame's, n its flames x frames}; land: only when the hit lands, always: on a miss too.
     - Fire Arrow: a flame where the arrow hits (its HitSubMissile1, its own row with the synergies and fire skill
       damage), burning the monster every frame for its Range (50 frames). The volley's other arrows reach the monster
       within its 2-frame next-hit delay: one hit, one flame a volley. A miss leaves none.
     - Exploding Arrow: on a hit an explosion (radius 5) of the skill's fire and the gear's (an explosion deals only its
       element), then calc2 bombs (3 + level / 5, at most 8) in a triangle behind the monster, each an explosion of
       radius 3 at the skill's HARD points: about 0.46 / 1.3 / 2.25 / 3.1 of them reach it with 3 / 4-5 / 6-7 / 8
       (EX.bombs; the trace's Monte Carlo of their placement).
     - Immolation Arrow: hit or miss (it always explodes), an explosion (radius 4) of the skill's fire and the gear's, and
       29 flames in a disc of radius 3, each burning the first unit on it every frame for 50 frames, no fire skill
       damage (its row has no ApplyMastery): 1 / 5 / 9 under a small / normal / big monster (EX.disc).
     - Freezing Arrow: its arrow names no skill (the weapon's and the gear's damage only); hit or miss, its explosion of
       the skill's cold and the gear's.
     - Lightning Fury: the javelin never misses; it sends a bolt of the skill's lightning (no weapon or gear damage) to
       each unit within 15 sub-tiles, the monster it hit among them: one on it alone (more in a pack: not counted).
     - Charged Strike: calc1 bolts of the skill's lightning, hit or miss, starting on the monster; one leaving straight
       hits a small or normal monster, a diagonal one doesn't, every one a big monster (EX.csBolts: half and all; open,
       in-game test asked).
     - Lightning Strike: hit or miss, chain lightning of the skill's lightning starts on the monster and hits it once
       (it jumps on to others: not counted).
     - Power Strike: hit or miss, a nova (its row, the synergies, lightning skill damage): one of it hits the monster.
     - The spells (no hit): Fist of the Heavens' lightning on the target alone,
       then a holy bolt from where it strikes at each monster within 20 sub-tiles (up to calc4, 50), one of them on the
       target (the others start on it within its 3-frame next-hit delay); the bolt's own row: magic, its synergies on
       whole points, magic skill damage. Holy Bolt's calc1 bolts (2 from level 15, 3 from 25) aim at the monster and a
       sub-tile to its sides: every one hits a lone monster. Both damage every monster and never miss. */
  const EX = {
    // Split Throw's lines that cross a lone monster of a throw from 5 yards (trace T12), by its Size: at most
    split: [0, 3, 5, 99], bombs: [0, 0, 0, 0.46, 1.3, 1.3, 2.25, 2.25, 3.1], disc: [0, 1, 5, 9], csBolts: [0, 0, 0.5, 1],
    /* the Sorceress's spells of many missiles on one monster standing alone, by its size (index 1-3; 2026-11-25:
       each missile flown through the game's sub-tiles by the rules
       traced in the live build). orb: Frozen Orb's bolts that hit a monster the orb flies through,
       4 to 16 sub-tiles from you (2.0 / 7.3 / 9.8 of its flight's bolts, most while the orb is on the monster, and 0.4
       / 0.75 / 0.9 of its end ring). The fans (srvdo 8: each side missile aimed one sub-tile beside the monster you
       cast it on, so they fan out wider the closer you stand, yet pass the monster one step apart), by how far you
       cast from (Cast from: "" next to it, 2-4 sub-tiles; mid 5 yards, 7-8; far 10 yards, 14-16; the author,
       2026-11-25: "if you are casting holy bolt at point blank range, all three should hit right?"): barrage: Ice
       Barrage's lances that hit, of 3 / 4 / 5; hbolt: Holy Bolt's bolts, of 1 / 2 / 3 (a side bolt can pass a small
       monster from 5 yards on). cbolt: the share of Charged Bolt's bolts that hit from those distances. mflames:
       Meteor's 18 flames under a monster the meteor lands on (the game's fixed offsets; Phoenix Strike's meteor's
       too) */
    /* Frozen Orb by Cast from (2026-11-25, the author: "cast from a certain range on a large size monster, many more
       bolts will hit"): the orb flies through the monster from next to it, 5 or 10 yards; end: from 14 yards its flight
       (always 45 frames, 21 sub-tiles, wherever you click) ends on the monster and its ring of 16 starts there */
    orb: { "": [0, 2.3, 7.5, 9.9], mid: [0, 2.4, 7.9, 10.6], far: [0, 2.5, 8.4, 11.3], end: [0, 2.4, 13.1, 18.4] },
    /* Combustion: the fire balls that explode on a lone monster. All 32 leave together at one speed and reach it
       together; once one hits, PD2's next-hit lock (NextDelay 2, a timer on the monster that runs after the frame's
       missiles) keeps the others off it for that frame and the next 2: a big monster next to you is crossed long enough
       for a second; a small one far off can stand between two balls */
    comb: { "": [0, 1, 1, 1.7], mid: [0, 0.5, 1, 1.3], far: [0, 0.3, 0.9, 1] },
    /* Inferno: the flames of a breath that hit a monster in front of you (a breath every 4 frames; the next-hit lock
       keeps the others off it for 2 frames, so at most 2 a breath): small 1, normal-size 1.4, big 1.8 */
    inf: [0, 1, 1.4, 1.8],
    /* the Druid (2026-11-25, simulated). Arctic Blast: 2 flames a breath, 1 / 1.3 / 1.75 hit. Tornado: its hit
       (once on its wandering way) and its bursts (every 15 frames within 4 sub-tiles of it, the first where you stand)
       on a lone monster, by Cast from. Armageddon: a rock's explosion (radius 6) reaches a monster next to you 0.31 of
       the time (its spot anywhere within 9 sub-tiles of you), its flame lands under it 0.014 / 0.036 / 0.058 */
    arctic: [0, 1, 1.3, 1.75],
    tornadoHit: { "": [0, 0.74, 0.9, 1], mid: [0, 0.46, 0.63, 0.74], far: [0, 0.34, 0.46, 0.56] }, tornadoBurst: { "": 1.84, mid: 1.05, far: 0.81 },
    armRock: 0.31, armFlame: [0, 0.014, 0.036, 0.058],
    /* the Druid's fire (2026-11-25, traced in the live build, simulated). boulder:
       Molten Boulder on a lone monster, [boulder hits, explosion hits, flame frames of its fire path], by what the
       boulder does to the monster (0 rolls through it: no knockback; 1 knocks it back 5 sub-tiles half the time and
       catches up with it; 2 every time, a small one; 3 breaks on it, a large one), Cast from (3 / 8 / 15 sub-tiles), its
       level 20 / 30 / 40 / 50 / 60 (it rolls 85 - level frames) and the monster's Size. fissure: the cracks that reach a
       monster on the spot, by how often they come (a crack every 1-5 frames: 5 - points put in it / 5); a crack never
       opens where another lies */
    boulder: [{ "": [[[2.5, 0, 92], [3.25, 0, 120], [3.75, 0, 139]], [[2.5, 0, 92], [3.25, 0, 120], [3.75, 0, 139]], [[2.5, 0, 92], [3.25, 0, 120], [3.75, 0, 139]], [[2.5, 0, 92], [3.25, 0, 120], [3.75, 0, 139]], [[2.5, 0.25, 92], [3.25, 0.25, 121], [3.75, 0.25, 139]]],
        mid: [[[3, 0, 111], [5, 0, 185], [6.5, 0, 240]], [[3, 0, 111], [5, 0, 185], [6.5, 0, 240]], [[3, 0, 111], [5, 0, 185], [6.5, 0, 240]], [[3, 1, 111], [5, 1, 189], [6.5, 1, 248]], [[3, 1, 121], [5, 1, 208], [6.25, 1, 265]]],
        far: [[[2.75, 0, 102], [4.25, 0, 157], [5.75, 0, 213]], [[2.75, 0.75, 102], [4.25, 0.75, 160], [5.75, 0.75, 217]], [[2.75, 1, 112], [4.25, 1, 177], [5.75, 1, 247]], [[0.75, 1, 36], [1.5, 1, 75], [2.25, 1, 120]], [[0, 1, 3], [0, 1, 10], [0, 1, 17]]] },
      { "": [[[4.6, 0.46, 57], [7.62, 0.8, 71], [7.98, 0.82, 79]], [[4.2, 0.45, 55], [6.61, 0.78, 67], [6.99, 0.83, 73]], [[3.85, 0.6, 47], [5.71, 0.84, 62], [6.05, 0.87, 67]], [[3.42, 0.77, 45], [4.77, 0.89, 54], [5.11, 0.92, 56]], [[2.73, 0.82, 39], [3.42, 0.9, 45], [3.63, 0.95, 54]]],
        mid: [[[5.26, 0.69, 63], [7.3, 0.9, 62], [8.02, 0.97, 63]], [[4.58, 0.75, 53], [6.28, 0.8, 57], [7.02, 0.72, 59]], [[3.97, 0.89, 46], [5.11, 0.97, 47], [5.46, 0.99, 48]], [[3.2, 1, 39], [3.67, 1, 40], [3.78, 1, 44]], [[1.74, 1, 25], [1.93, 1, 35], [2.22, 1, 42]]],
        far: [[[4.04, 0.84, 50], [5.02, 0.94, 52], [5.53, 0.98, 52]], [[3.07, 0.98, 37], [3.61, 0.98, 38], [4.09, 0.99, 47]], [[1.7, 1, 26], [2.36, 0.88, 40], [2.65, 0.88, 44]], [[0.75, 1, 20], [1.25, 1, 29], [1.55, 1, 34]], [[0, 1, 3], [0, 1, 10], [0, 1, 17]]] },
      { "": [[[5, 1, 11], [5, 1, 16], [5, 1, 24]], [[4, 1, 14], [4.25, 1, 19], [4.25, 1, 25]], [[3.25, 1, 10], [3.75, 1, 14], [3.75, 1, 18]], [[3, 1, 4], [3, 1, 12], [3, 1, 14]], [[2, 1, 12], [2, 1, 20], [2, 1, 30]]],
        mid: [[[4.25, 1, 11], [4.25, 1, 20], [4.25, 1, 28]], [[3.25, 1, 11], [3.75, 0.75, 13], [4, 0.5, 12]], [[2.75, 1, 8], [3, 1, 9], [3, 1, 15]], [[2, 1, 9], [2, 1, 18], [2, 1, 26]], [[1, 1, 9], [1, 1, 26], [1.25, 1, 27]]],
        far: [[[3, 1, 6], [3, 1, 14], [3, 1, 18]], [[2, 1, 9], [2, 1, 18], [2.25, 1, 22]], [[1, 1, 10], [1.5, 0.75, 15], [1.75, 0.75, 12]], [[0.75, 1, 4], [1, 1, 4], [1, 1, 8]], [[0, 1, 3], [0, 1, 10], [0, 1, 17]]] },
      { "": [[[0, 1, 44], [0, 1, 56], [0, 1, 74]], [[0, 1, 44], [0, 1, 56], [0, 1, 74]], [[0, 1, 44], [0, 1, 56], [0, 1, 74]], [[0, 1, 44], [0, 1, 56], [0, 1, 74]], [[0, 1, 44], [0, 1, 56], [0, 1, 74]]],
        mid: [[[0, 1, 46], [0, 1, 62], [0, 1, 72]], [[0, 1, 46], [0, 1, 62], [0, 1, 72]], [[0, 1, 46], [0, 1, 62], [0, 1, 72]], [[0, 1, 46], [0, 1, 62], [0, 1, 72]], [[0, 1, 46], [0, 1, 62], [0, 1, 72]]],
        far: [[[0, 1, 46], [0, 1, 60], [0, 1, 72]], [[0, 1, 46], [0, 1, 60], [0, 1, 72]], [[0, 1, 46], [0, 1, 60], [0, 1, 72]], [[0, 1, 36], [0, 1, 60], [0, 1, 72]], [[0, 1, 3], [0, 1, 10], [0, 1, 17]]] }],
    fissure: [null, [0, 1.23, 2.89, 3.41], [0, 0.9, 2.13, 2.51], [0, 0.73, 1.69, 2.02], [0, 0.57, 1.38, 1.63], [0, 0.51, 1.2, 1.44]],
    /* Fire Wall cast on the monster: its flames under it (the wall's line through its spot, over every direction):
       2.2 / 4 / 5.4; Blaze cast next to it (2-3 sub-tiles): the burning ground's flames under it, 5 / 12 / 17 */
    fwall: [0, 2.2, 4, 5.4], blaze: [0, 5, 12, 17],
    /* Wake of Fire (2026-11-25, simulated): a shot's wave on a lone monster: the wave itself once,
       and the flames it sends sideways from each sub-tile (lock 4 frames, their own kind): none on a small monster, about
       1-1.6 on others, by how far the trap stands (3 / 6 / 10 sub-tiles) */
    wake: { "": [0, 1, 1.88, 2.12], mid: [0, 1, 2.25, 2.62], far: [0, 1, 2.25, 2.5] },
    barrage: { "": { 3: [0, 1, 2.8, 3], 4: [0, 1, 2.9, 3.6], 5: [0, 1, 3.1, 4.2] }, mid: { 3: [0, 1, 2.4, 3], 4: [0, 1, 2.4, 3.1], 5: [0, 1, 2.4, 3.3] },
      far: { 3: [0, 1, 2.5, 3], 4: [0, 1, 2.5, 3.1], 5: [0, 1, 2.5, 3.3] } },
    hbolt: { "": { 1: [0, 1, 1, 1], 2: [0, 2, 2, 2], 3: [0, 3, 3, 3] }, mid: { 1: [0, 1, 1, 1], 2: [0, 1.8, 2, 2], 3: [0, 2.6, 3, 3] },
      far: { 1: [0, 1, 1, 1], 2: [0, 1.8, 2, 2], 3: [0, 2.5, 3, 3] } },
    cbolt: { "": [0, 0.2, 0.5, 0.7], mid: [0, 0.13, 0.35, 0.45], far: [0, 0.11, 0.19, 0.32] }, mflames: [0, 0, 3, 5],
    /* Blade Sentinel on a lone monster (2026-11-25, traced in the live build, simulated:
       the game's walk and think timing over 64 directions, cast on the monster, two frame timings averaged, and a frame either way of the pace: sentinels cast
       at half their round trip pass the monster together, a resonance of one exact setup): by Cast
       from (2-4 / 6-9 / 13-17 sub-tiles), by its Size: [bursts a cast that reach it, blade hits of one sentinel alone,
       [blade hits a cast at a cast every 5 ... 40 frames]]. The blades of all your sentinels share one lock on a monster
       (a hit every 6 frames at most), so casting faster adds bursts, not blade hits, once they cover it */
    sent: { "": [null,
      [2.84, 6.28, [0.9, 0.97, 1.13, 1.27, 1.34, 1.4, 1.53, 1.78, 2.01, 2.16, 2.2, 2.24, 2.24, 2.29, 2.3, 2.43, 2.56, 2.85, 3.08, 3.36, 3.53, 3.66, 3.74, 3.74, 3.78, 3.75, 3.73, 3.7, 3.76, 3.86, 3.92, 3.97, 4.01, 4.14, 4.32, 4.42]],
      [2.84, 6.59, [0.91, 1.0, 1.17, 1.33, 1.46, 1.59, 1.76, 1.95, 2.15, 2.28, 2.38, 2.42, 2.51, 2.57, 2.62, 2.73, 2.89, 3.18, 3.45, 3.71, 3.92, 4.09, 4.24, 4.31, 4.37, 4.33, 4.26, 4.16, 4.17, 4.24, 4.22, 4.2, 4.25, 4.49, 4.73, 4.86]],
      [2.84, 7.16, [0.91, 1.0, 1.17, 1.33, 1.47, 1.61, 1.78, 1.97, 2.16, 2.31, 2.44, 2.52, 2.59, 2.7, 2.78, 2.9, 3.04, 3.28, 3.55, 3.81, 4.02, 4.19, 4.3, 4.39, 4.47, 4.53, 4.45, 4.36, 4.33, 4.42, 4.51, 4.64, 4.91, 5.18, 5.38, 5.4]]],
    mid: [null,
      [2.75, 4.5, [0.86, 0.92, 1.04, 1.14, 1.25, 1.32, 1.36, 1.4, 1.52, 1.75, 1.98, 2.14, 2.26, 2.32, 2.35, 2.33, 2.27, 2.2, 2.14, 2.17, 2.26, 2.42, 2.58, 2.78, 2.98, 3.18, 3.36, 3.44, 3.5, 3.51, 3.52, 3.51, 3.46, 3.42, 3.4, 3.4]],
      [2.75, 4.88, [0.92, 0.99, 1.14, 1.29, 1.43, 1.55, 1.6, 1.64, 1.75, 1.97, 2.21, 2.42, 2.62, 2.75, 2.84, 2.81, 2.81, 2.7, 2.65, 2.57, 2.69, 2.79, 3.01, 3.19, 3.5, 3.77, 4.04, 4.09, 4.07, 3.96, 3.89, 3.84, 3.82, 3.82, 3.83, 3.86]],
      [2.75, 4.93, [0.92, 0.99, 1.15, 1.29, 1.44, 1.56, 1.66, 1.75, 1.88, 2.07, 2.27, 2.46, 2.65, 2.77, 2.85, 2.85, 2.88, 2.83, 2.78, 2.75, 2.81, 2.95, 3.13, 3.36, 3.64, 3.94, 4.14, 4.22, 4.19, 4.11, 4.01, 3.95, 3.95, 3.97, 4.01, 4.03]]],
    far: [null,
      [1.36, 2.92, [0.74, 0.8, 0.91, 0.99, 1.08, 1.15, 1.22, 1.32, 1.46, 1.57, 1.64, 1.66, 1.74, 1.88, 2.0, 2.09, 2.14, 2.17, 2.17, 2.14, 2.13, 2.11, 2.07, 1.99, 1.91, 1.83, 1.79, 1.78, 1.79, 1.81, 1.85, 1.92, 2.03, 2.16, 2.28, 2.33]],
      [1.36, 3.51, [0.91, 0.97, 1.12, 1.23, 1.35, 1.41, 1.48, 1.57, 1.77, 1.95, 2.08, 2.13, 2.25, 2.38, 2.48, 2.55, 2.63, 2.68, 2.69, 2.66, 2.65, 2.64, 2.64, 2.61, 2.55, 2.47, 2.43, 2.36, 2.35, 2.33, 2.4, 2.49, 2.64, 2.76, 2.9, 2.95]],
      [1.36, 3.53, [0.91, 0.99, 1.13, 1.25, 1.37, 1.45, 1.54, 1.65, 1.84, 2.01, 2.13, 2.19, 2.3, 2.43, 2.57, 2.69, 2.78, 2.82, 2.81, 2.76, 2.72, 2.68, 2.68, 2.68, 2.64, 2.58, 2.51, 2.46, 2.42, 2.42, 2.48, 2.58, 2.71, 2.85, 2.97, 3.02]]] } };
  // how far a fan or Charged Bolt is cast from (the Skill section's Cast from): "", "mid" or "far"
  // (end: Frozen Orb's 14 yards, the orb ending on the monster; another spell takes it as 10 yards)
  // what a spell's damage comes in: a cast, Inferno's breath, Thunder Storm's strike
  const aUnit = att => `${/^[aeiou]/.test(unitOf(att)) ? "an" : "a"} ${unitOf(att)}`;
  const unitOf = att => (att && att.bombs ? "throw" : att && att.ex === "dsentry" ? "explosion" : att && att.trap ? "trap" : att && att.tick === "channel" ? "breath" : att && att.tick === "period" ? "strike" : att && att.tick === "aura" ? (att.ex === "armageddon" ? "rock" : "gust") : "cast");
  const fromOf = (b, att) => (b.s.from === "end" ? (att && att.ex === "frozenorb" ? "end" : "far") : EX.cbolt[b.s.from] ? b.s.from : "");
  const FROM_WORDS = { "": "you stand next to", mid: "5 yards away", far: "10 yards away", end: "14 yards away" };
  /* what Molten Boulder's boulder does to this monster (2026-11-25): a listed one's own (calc_data monster_kb: 3 a
     large one breaks it, else knocked back only with the knockback mode, 2 a small one always, 1 another half the time,
     0 never); your own monster by its Size and Kind: a big one large, a boss never knocked back, any other half the time */
  const boulderKb = T => {
    const m = monOf(T);
    if (m && m.kb !== undefined) return m.kb;
    return (Math.round(+T.size) || 2) >= 3 ? 3 : ["mapboss", "lesser", "boss"].includes(T.kind) ? 0 : 1;
  };
  // EX.boulder at the boulder's level (between its rows at 20, 30 ... 60)
  function boulderCount(kb, from, lvl, size) {
    const K = EX.boulder[kb] || EX.boulder[1], R = K[from] || K[""], t = clamp((lvl - 20) / 10, 0, R.length - 1);
    const i = Math.floor(t), j = Math.min(i + 1, R.length - 1), f = t - i;
    return R[i][size - 1].map((v, k) => v + (R[j][size - 1][k] - v) * f);
  }
  /* "Bolts that hit" (b.s.hits, the Skill section; 2026-11-25, the author: "have a user select how many bolts they
     want to count"): 0 the worked-out count, else that many, at most the cast's */
  const hitsOf = (b, auto, of) => { const h = Math.round(+b.s.hits || 0); return h > 0 ? { n: Math.min(h, of), auto, set: true } : { n: auto, auto, set: false }; };
  /* Blade Sentinel's blades' poison (2026-11-25, traced in the live build): the blade hits for the sentinel,
     and PD2 keeps a poison per attacker (it looks one up by the attacking unit itself, the sentinel, when a
     player owns it), so each sentinel's runs beside the others'; a new one of the same sentinel replaces its own only
     when at least as strong, running its length from then. The poison frames a cast (summed over the sentinels) by
     Cast from and Size: a, at a cast every SENT_PF frames (rows) and a length of SENT_PL frames (columns), every blade
     landing; h, half of them landing; q the average roll (0 the poison's lowest, 1 its highest) while one runs
     (simulated: the same 64 directions, the sentinels' hits in order of the lock, rolls
     uniform; a frame either way smoothed) */
  const SENT_PF = [6, 8, 10, 12, 14, 17, 20, 25, 30, 40], SENT_PL = [25, 50, 100, 200];
  const SENT_P = { "": [null,
      { a: [[23.6,40.3,61.1,68.3],[25.1,43.2,70.0,85.8],[28.2,48.8,83.6,114.9],[33.7,55.5,96.3,144.1],[38.9,61.0,105.7,168.4],[40.5,62.6,110.2,185.2],[42.0,64.1,112.8,197.2],[46.8,68.4,116.9,209.5],[49.5,70.4,118.8,216.6],[50.0,70.0,118.4,217.9]], h: [[12.9,23.3,36.9,42.4],[14.0,25.5,42.9,54.0],[16.1,29.6,52.5,74.4],[19.6,35.6,64.7,100.1],[23.0,41.0,75.4,124.5],[24.5,43.4,81.1,141.4],[26.6,46.2,86.5,157.2],[30.8,51.6,95.0,177.1],[33.8,55.5,101.0,191.3],[35.2,57.0,103.3,196.9]], q: [0.57, 0.62, 0.65, 0.66] },
      { a: [[22.0,36.2,51.8,56.8],[24.3,41.3,64.5,77.4],[28.6,48.8,81.6,110.0],[33.7,55.2,94.8,140.3],[39.4,61.3,105.3,166.1],[43.1,64.9,112.0,185.3],[45.0,66.5,114.6,197.9],[50.0,71.0,118.5,210.6],[53.6,74.0,121.2,218.9],[53.7,73.3,120.8,220.3]], h: [[12.4,21.7,33.0,37.5],[14.1,25.3,41.5,51.9],[17.1,31.2,54.6,76.7],[20.7,37.4,67.5,103.6],[24.0,42.4,77.6,127.1],[26.2,45.3,84.1,145.0],[28.9,49.0,90.6,162.9],[33.6,55.1,99.7,184.2],[37.2,59.2,105.7,198.4],[38.4,60.2,107.1,202.4]], q: [0.58, 0.63, 0.67, 0.69] },
      { a: [[21.7,36.1,51.4,56.1],[24.1,41.2,64.3,76.7],[27.5,47.7,80.2,107.5],[31.2,53.1,92.0,135.9],[36.8,59.1,102.6,162.2],[40.2,62.5,109.4,182.1],[41.7,63.5,112.2,195.2],[46.5,67.0,116.7,208.3],[51.0,70.7,120.0,217.4],[53.4,72.2,120.5,220.0]], h: [[12.2,21.3,32.1,36.3],[14.1,25.3,41.4,51.4],[17.1,31.4,55.0,76.5],[20.2,37.0,66.9,102.0],[23.2,41.5,76.4,124.8],[25.4,44.8,83.5,144.4],[28.0,48.4,90.7,163.6],[32.5,53.7,99.5,184.5],[36.5,58.3,105.8,199.2],[38.9,60.5,108.4,204.8]], q: [0.6, 0.64, 0.67, 0.69] }],
    mid: [null,
      { a: [[21.7,37.5,57.0,63.7],[22.8,39.2,63.8,78.7],[25.1,43.3,75.3,105.5],[28.8,49.6,88.3,134.7],[34.6,56.0,99.0,158.9],[40.3,60.5,105.4,177.1],[40.7,61.1,107.1,188.6],[38.9,60.2,107.2,195.9],[41.9,61.9,109.4,202.4],[45.8,64.2,111.3,206.0]], h: [[11.9,21.6,34.2,39.3],[12.9,23.6,39.9,50.8],[14.5,26.6,47.7,68.5],[16.4,30.3,55.9,87.4],[19.7,35.4,66.0,109.8],[23.2,40.3,75.4,131.8],[24.4,42.3,79.5,144.8],[25.1,43.5,82.0,154.3],[28.2,47.4,88.3,168.4],[30.8,50.5,92.9,177.9]], q: [0.56, 0.6, 0.63, 0.64] },
      { a: [[22.4,37.9,56.7,63.1],[24.0,40.5,65.0,79.8],[27.6,46.3,79.3,110.1],[32.2,53.6,94.1,142.4],[37.4,59.5,104.2,166.8],[43.2,63.5,109.9,184.3],[45.0,64.8,112.4,197.1],[43.6,64.8,113.9,206.8],[47.0,67.1,116.8,214.8],[51.2,69.3,118.6,218.2]], h: [[12.4,22.2,34.9,40.0],[13.9,25.0,41.9,53.2],[16.2,29.2,51.9,74.2],[18.6,33.8,61.8,96.2],[21.9,39.0,72.1,119.6],[26.0,44.4,82.3,143.5],[27.8,47.0,87.7,159.7],[28.5,48.5,91.0,170.9],[32.0,52.6,97.3,184.9],[34.6,55.4,101.3,193.0]], q: [0.57, 0.62, 0.65, 0.66] },
      { a: [[22.0,37.0,54.6,60.5],[23.8,40.0,63.9,78.3],[28.2,46.8,79.9,110.6],[32.6,54.0,94.4,142.3],[37.0,59.2,103.9,166.3],[43.4,63.9,110.7,185.5],[45.9,65.8,113.7,198.6],[45.1,65.7,114.9,207.7],[48.6,68.1,117.8,215.7],[52.5,70.3,119.5,219.0]], h: [[12.4,21.9,34.2,39.1],[14.0,25.1,41.9,53.1],[16.7,30.1,53.2,75.8],[19.3,35.1,64.0,99.5],[22.4,40.0,74.2,122.9],[26.4,45.1,83.6,145.4],[28.5,47.9,89.0,161.4],[29.7,49.9,92.9,173.9],[33.2,53.9,99.2,187.9],[35.7,56.5,102.9,195.5]], q: [0.57, 0.63, 0.65, 0.67] }],
    far: [null,
      { a: [[20.4,33.9,51.4,57.5],[21.6,36.7,60.0,74.3],[24.3,40.8,70.9,98.8],[28.9,45.6,80.2,121.4],[31.8,49.1,86.6,138.8],[32.5,50.0,89.3,151.4],[36.2,51.9,92.5,163.3],[38.5,53.5,94.7,172.1],[37.9,53.5,94.8,175.8],[39.1,54.1,95.3,177.4]], h: [[10.9,19.5,30.8,35.0],[11.9,21.7,36.7,46.6],[13.7,25.0,44.9,64.5],[16.1,28.7,52.8,82.5],[18.1,32.0,59.8,99.2],[19.5,34.2,64.7,113.2],[21.8,36.6,69.3,126.5],[22.7,37.6,71.1,134.1],[22.5,37.5,71.0,136.8],[23.7,38.7,72.9,141.2]], q: [0.54, 0.6, 0.62, 0.64] },
      { a: [[24.9,40.5,60.9,68.0],[26.8,44.3,71.8,88.5],[29.2,49.0,84.7,117.7],[33.6,54.6,96.0,145.2],[37.8,59.5,104.8,167.9],[39.9,61.0,108.8,184.3],[44.2,63.1,112.3,198.4],[47.0,65.3,115.2,209.1],[47.1,65.7,115.8,213.8],[48.7,65.9,115.9,215.3]], h: [[13.3,23.5,36.9,42.0],[14.8,26.5,44.5,56.3],[16.6,30.1,53.7,76.6],[19.0,34.3,63.1,98.2],[22.0,39.3,73.4,121.7],[24.1,42.5,80.3,140.5],[26.6,44.9,84.9,154.9],[28.2,46.7,88.0,165.6],[28.7,47.5,89.5,171.9],[30.0,48.5,91.3,176.4]], q: [0.55, 0.6, 0.63, 0.64] },
      { a: [[24.8,40.0,59.7,66.5],[27.0,44.2,71.2,87.4],[30.1,49.3,84.8,117.1],[34.6,55.0,96.3,145.1],[38.4,59.5,104.9,168.0],[41.2,61.5,109.4,185.0],[46.1,64.0,113.2,199.3],[48.0,65.8,115.7,209.5],[47.6,66.2,116.1,214.2],[49.2,66.4,116.3,215.7]], h: [[13.4,23.5,36.7,41.8],[15.1,26.7,44.8,56.6],[17.1,30.8,55.0,78.2],[19.7,35.2,64.6,100.4],[22.4,39.8,74.3,123.1],[25.0,43.2,81.7,142.8],[27.8,46.1,86.9,158.5],[28.9,47.5,89.3,168.0],[29.1,48.0,90.3,173.3],[30.4,49.1,92.2,178.0]], q: [0.55, 0.61, 0.63, 0.65] }] };
  function sentPoison(from, size, F, L, p) {
    const R = (SENT_P[from] || SENT_P[""])[clamp(size, 1, 3)];
    // between the rows (the pace) linearly, between the columns (the length) on a log scale
    let i = SENT_PF.findIndex(x => x >= F); if (i < 0) i = SENT_PF.length - 1;
    const i0 = Math.max(0, i - 1), fi = SENT_PF[i] === SENT_PF[i0] ? 0 : clamp((F - SENT_PF[i0]) / (SENT_PF[i] - SENT_PF[i0]), 0, 1);
    const lg = Math.log(clamp(L, SENT_PL[0], SENT_PL[SENT_PL.length - 1]));
    let j = SENT_PL.findIndex(x => Math.log(x) >= lg - 1e-9); if (j <= 0) j = 1;
    const fj = (lg - Math.log(SENT_PL[j - 1])) / (Math.log(SENT_PL[j]) - Math.log(SENT_PL[j - 1]));
    const col = row => row[j - 1] + (row[j] - row[j - 1]) * fj;
    const at = rows => col(rows[i0].map((v, k) => v + (rows[i][k] - v) * fi));
    let a = at(R.a), h = at(R.h);
    // shorter than 25 frames: as many poisons, each shorter
    if (L < SENT_PL[0]) { a *= L / SENT_PL[0]; h *= L / SENT_PL[0]; }
    const k = a > 0 && h > 0 ? Math.log2(a / h) : 1;
    return { frames: p >= 1 ? a : a * Math.pow(clamp(p, 0.01, 1), k), q: col(R.q) };
  }
  // Blade Sentinel's counts at a cast every F frames (EX.sent)
  function sentCount(from, size, F) {
    const R = EX.sent[from] || EX.sent[""], e = R[clamp(size, 1, 3)], hs = e[2];
    const t = clamp(F - 5, 0, hs.length - 1), i = Math.floor(t), j = Math.min(i + 1, hs.length - 1);
    return { burst: e[0], alone: e[1], hits: hs[i] + (hs[j] - hs[i]) * (t - i) };
  }
  const HITS_LABEL = { holybolt: "Bolts that hit", chargedbolt: "Bolts that hit", frozenorb: "Bolts that hit", icebarrage: "Lances that hit",
    blizzard: "Shards that hit", combustion: "Fire balls that hit", inferno: "Flames that hit a breath" };
  /* Split Throw's weapons and the returns that come back over a lone monster (2026-11-27, traces T4 B and T12):
     calc1 weapons (3 + level / 5, at most 7); of a throw from 5 yards EX.split's crossing lines by its Size, the first
     the throw's hit, the others its returns; pc: the chance the throw's weapon pierces it (the gear's "+X% Pierce",
     stat 156, and Throwing Mastery's skill_pierce at its level) and comes back too */
  function splitCount(b, attack, T) {
    const lvl = +b.s.lvl || 0, size = clamp(Math.round(+T.size) || 1, 1, 3);
    const N = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)), cross = Math.min(N, EX.split[size] || N);
    const tm = b.cls === "bar" ? +(b.m || {})[135] || 0 : 0;
    const pc = clamp((+b.g.pc || 0) + (tm > 0 ? Calc.value(135, "passivecalc4", tm) : 0), 0, 100) / 100;
    return { N, cross, R: Math.max(0, cross - 1), pc };
  }
  function extrasOf(out, b, attack, T) {
    const lvl = +b.s.lvl || 0, D = DATA.ex || {};
    if (!(lvl > 0)) return null;
    const ctx = masteryCtx(b, attack), ER = out.ER, x = b.w;
    const roll = (lo, hi) => ({ lo, hi: Math.max(hi, lo), avg: hi > lo ? (lo + hi - 1) / 2 : lo });   // 256ths
    const miss = r => roll(Calc.missile(r, "Min", lvl, ctx), Calc.missile(r, "Max", lvl, ctx));
    // the skill's own (at a level) plus the gear's of the same element (an explosion's), with its skill damage
    const blast = L => {
      const s = selOf(b, attack, L), e = ELEM[s.e], m = +b.g[e.p + "m"] || 0, en = enchantOf(b)[s.e];
      let mn = gw(b, x, e.p + "min") + (en ? en.min : 0), mx = gw(b, x, e.p + "max") + (en ? en.max : 0);
      if (!(mx > 0)) mn = mx = 0;
      mn *= 256; mx *= 256;
      return roll(s.lo + mn + tdiv(mn * m, 100), s.hi + mx + tdiv(mx * m, 100));
    };
    const own = () => { const s = selOf(b, attack, lvl); return roll(s.lo, s.hi); };
    const size = clamp(Math.round(+T.size) || 1, 1, 3), land = [], always = [];
    const fire = ER.fire.net, cold = ER.cold.net, ltng = ER.ltng.net, mag = ER.mag.net;
    switch (attack.ex) {
      case "firearrow": { const f = +D.faflame.Range || 0; land.push({ k: "flame", q: miss(D.faflame), n: f, net: fire, flames: 1, frames: f }); break; }
      case "explodingarrow": {
        const N = Calc.value(attack.id, "calc2", lvl, ctxOf(b, attack)), hard = hardOf(b);
        land.push({ k: "blast", q: blast(lvl), n: 1, net: fire });
        land.push({ k: "bombs", q: blast(hard), n: EX.bombs[clamp(N, 0, 8)] || 0, net: fire, of: N, hard });
        break;
      }
      case "immolationarrow": {
        const f = +D.imfire.Range || 0;
        always.push({ k: "blast", q: blast(lvl), n: 1, net: fire });
        always.push({ k: "flame", q: miss(D.imfire), n: EX.disc[size] * f, net: fire, flames: EX.disc[size], frames: f });
        break;
      }
      case "freezingarrow": always.push({ k: "blast", q: blast(lvl), n: 1, net: cold }); break;
      case "lightningfury": always.push({ k: "bolt", q: own(), n: 1, net: ltng, of: Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)) }); break;
      case "chargedstrike": {
        const N = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack));
        always.push({ k: "bolt", q: own(), n: N * EX.csBolts[size], net: ltng, of: N });
        break;
      }
      case "lightningstrike": always.push({ k: "chain", q: own(), n: 1, net: ltng, of: Calc.value(attack.id, "calc2", lvl, ctxOf(b, attack)) }); break;
      case "powerstrike": always.push({ k: "nova", q: miss(D.psnova), n: size === 1 ? 0 : 1, net: ltng }); break;
      // Smite: a roll of 0 to just under its edmx, physical, raised by nothing
      case "smite": land.push({ k: "roll", q: roll(0, Math.max(0, Calc.key(attack.id, "edxs", lvl, ctx) - 1)), n: 1, net: out.R.mult }); break;
      /* Dragon Tail (2026-11-25, traced in the live build): a landed kick sets off an explosion of a second
         kick's roll (crit and deadly strike its own), all of it fire x (100 + calc1 + fire skill damage) / 100 (calc1: 40
         + 13 a level after the first + 8 for each of Dragon Talon's and Dragon Flight's points), nothing else; radius 6 */
      case "dragontail": {
        const k0 = out.per[0], c1 = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)), f = 100 + c1 + (+b.g.fm || 0);
        land.push({ k: "blast", q: roll(tdiv(k0.mn256 * f, 100), tdiv(k0.mx256 * f, 100)), n: 1, net: fire, mult: k0.mean, pct: c1 });
        break;
      }
      // the spells (el: the part's element, for the card's words)
      case "foh":
        always.push({ k: "strike", el: "ltng", q: own(), n: 1, net: ltng });
        always.push({ k: "fbolt", el: "mag", q: miss(D.fohbolt), n: 1, net: mag, of: Calc.value(attack.id, "calc4", lvl, ctxOf(b, attack)) });
        break;
      case "holybolt": {
        const N = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)), from = fromOf(b, attack), H = EX.hbolt[from][N];
        always.push(Object.assign({ k: "bolt", el: "mag", q: own(), net: mag, of: N, from }, hitsOf(b, H ? H[size] : N, N)));
        break;
      }
      /* Holy Nova (traced 2026-11-25): its ring hits the monster once; its missiles' Holy
         column (undead and demons) makes those monsters' magic resistance count only below 0, with no absorb */
      case "holynova": {
        const R = ER.mag, holy = T.kind !== "player" && (T.type === "undead" || T.type === "demon");
        always.push({ k: "nova", el: "mag", q: own(), n: 1, net: holy ? (R.res > 0 ? 1 : R.mult) : mag, holy });
        break;
      }
      // Holy Light: its magic on the monster it is cast on (full: cast on a monster)
      case "holylight": always.push({ k: "light", el: "mag", q: own(), n: 1, net: mag }); break;
      /* a spell that hits the monster once with its own element (the Sorceress's Lightning, Chain Lightning and Nova;
         traced 2026-11-25) */
      /* Teeth and Bone Spear: calc1 missiles fan out (srvdo 8); after one hits a lone monster the others can't for a
         moment (their next-hit lock): one hit a cast */
      case "fan1": {
        const e = ((SK[attack.id] || {}).EType || "").trim();
        always.push({ k: "hit", el: e, q: own(), n: 1, net: ER[e] ? ER[e].net : 0, of: Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)) });
        break;
      }
      // the Druid's physical spells: the skill's physical (MinDam, its synergies), no skill damage
      case "tornado": case "twister": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam });
        const q = roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), from = fromOf(b, attack);
        if (attack.ex === "tornado") {
          const h = EX.tornadoHit[from][size], u = EX.tornadoBurst[from];
          always.push({ k: "hit", el: "phys", q, n: h + u, net: out.R.mult, hit: h, burst: u, from });
        } else always.push({ k: "hit", el: "phys", q, n: 1, net: out.R.mult, of: Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)) });
        break;
      }
      // Arctic Blast: Inferno's breath with cold (EX.arctic), its debuff lowering cold resistance (elemRes)
      case "arctic": {
        const N = Calc.value(attack.id, "calc3", lvl, ctxOf(b, attack)) || 2;
        always.push(Object.assign({ k: "flame", el: "cold", q: own(), net: cold, of: N, debuff: Calc.value(attack.id, "aurastatcalc1", lvl, ctxOf(b, attack)) }, hitsOf(b, Math.min(EX.arctic[size], N), N)));
        break;
      }
      // Hurricane: a gust of the skill's cold on every monster near you
      case "hurricane": always.push({ k: "gust", el: "cold", q: own(), n: 1, net: cold }); break;
      // Armageddon: a rock's physical and fire (its explosion reaching the monster EX.armRock of the time) and its flame
      case "armageddon": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam });
        const F = D.armfire || {}, f = +F.Range || 37;
        always.push({ k: "rockP", el: "phys", q: roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), n: EX.armRock, net: out.R.mult, r: +F.r || 6 });
        always.push({ k: "rockF", el: "fire", q: own(), n: EX.armRock, net: fire });
        always.push({ k: "flame", el: "fire", q: miss(F), n: EX.armFlame[size] * f, net: fire, flames: EX.armFlame[size], frames: f });
        break;
      }
      /* Corpse Explosion: the corpse's share (calc1-calc2 % of its life, x your level / its level when it is higher;
         calc3 % of it fire, the rest physical) with the skill's own physical and fire. Death Sentry: the same code on its
         trap's own skill (mon death sentry, 312, at the skill's level), the trap's level for yours (its summon level:
         the skill's level + 3/4 of yours, at most yours) */
      case "cexpl": case "dsentry": {
        const ds = attack.ex === "dsentry", sid = ds ? 312 : attack.id, c = ctxOf(b, attack), L = Math.max(0, +b.s.corpse || +T.life || 0) * 256, cl = +T.lvl || 0;
        const clvl = +b.c.lvl || 1, you = ds ? clamp(lvl + Math.floor(3 * clvl / 4), 1, clvl) : clvl;
        let lo = Math.trunc(L * Calc.value(sid, "calc1", lvl, c) / 100), hi = Math.trunc(L * Calc.value(sid, "calc2", lvl, c) / 100) - 1;
        if (cl > you) { lo = Math.trunc(lo * you / cl); hi = Math.trunc(hi * you / cl); }
        const fp = clamp(Calc.value(sid, "calc3", lvl, c), 0, 100), split = v => [Math.trunc(v * fp / 100), v - Math.trunc(v * fp / 100)];
        const [flo, plo] = split(lo), [fhi, phi] = split(Math.max(hi, lo));
        const P = Object.assign({}, SK[sid], { MinDamage: SK[sid].MinDam, MaxDamage: SK[sid].MaxDam });
        const ph = roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true));
        const fs = ds ? selOf(b, Object.assign({}, attack, { id: sid, sel: true }), lvl) : null, fi = ds ? roll(fs ? fs.lo : 0, fs ? fs.hi : 0) : own();
        always.push({ k: "phys", el: "phys", q: roll(ph.lo + plo, ph.hi + phi), n: 1, net: out.R.mult, own: ph, corpse: [plo, phi] });
        always.push({ k: "fire", el: "fire", q: roll(fi.lo + flo, fi.hi + fhi), n: 1, net: fire, own: fi, corpse: [flo, fhi], life: L / 256, pct: [Calc.value(sid, "calc1", lvl, c), Calc.value(sid, "calc2", lvl, c)], fp, scaled: cl > you ? [you, cl] : null,
          r: Math.trunc((Calc.value(sid, "aurarangecalc", lvl, c) + 1) / 2) });
        break;
      }
      /* Dark Pact: on a monster with n curses (those the monster panel puts on it, up to its limit), the skill's magic
         x (1 + 1.1 x (n - 1)); none without a curse */
      case "dpact": {
        const cu = onMonster(b, T).curses.length, m = cu > 0 ? 1 + 1.1 * (cu - 1) : 0, q = own();
        always.push({ k: "blast", el: "mag", q: roll(Math.trunc(q.lo * m), Math.trunc(q.hi * m)), n: cu > 0 ? 1 : 0, net: mag, curses: cu, mult: 1, x: m, per: q });
        break;
      }
      // Poison Nova: its poison is the page's poison model (novaPoison); nothing else
      case "pnova": break;
      /* Desecrate: cast on a corpse, 5 corpses appear around it and its cloud poisons each monster it reaches once
         (novaPoison) */
      case "desecrate": break;
      /* Shock Web: prgcalc1 spikes (4 + level / 3), each to a random sub-tile -R..R-1 from the monster on both axes (R =
         aurarangecalc, (4 + level / 3) / 3 + 1, its level with + skills), each a shock field (Size 2) hitting a monster
         it finds every frame for its 90 frames: the share of the spread's sub-tiles under the monster (the footprint of
         a Size 2 missile on its size) */
      case "shockweb": {
        const c = ctxOf(b, attack), N = Math.max(1, Calc.value(attack.id, "prgcalc1", lvl, c) || 1), R = Calc.value(attack.id, "aurarangecalc", lvl, c) || 1;
        const f = +((D.sweb || {}).frames) || 90, one = N <= 1 || R < 2;
        const under = (dx, dy) => { const m = Math.abs(dx) + Math.abs(dy); return size === 1 ? m <= 1 : size === 2 ? m <= 2 : (Math.abs(dx) <= 2 && Math.abs(dy) <= 1) || (Math.abs(dx) <= 1 && Math.abs(dy) <= 2); };
        let inside = 0;
        if (!one) for (let x = -R; x < R; x++) for (let y = -R; y < R; y++) if (under(x, y)) inside++;
        const fields = one ? 1 : N * inside / (4 * R * R);
        always.push({ k: "field", el: "ltng", q: own(), n: fields * f, net: ltng, flames: fields, frames: f, of: one ? 1 : N, spread: one ? 0 : R, noun: ["shock field", "shock fields"] });
        break;
      }
      /* Fire Blast: prgcalc1 bombs (min(1 + level / 3, 9)), each to a random sub-tile -R..R-1 from the monster on both
         axes (R = aurarangecalc, by HARD points; below 2, one bomb on the monster), exploding for the skill's fire on
         everything within the bomb's radius (4): the share of those sub-tiles within it reaches the monster */
      case "fireblast": {
        const c = Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) }), N = Math.max(1, Calc.value(attack.id, "prgcalc1", lvl, ctxOf(b, attack)) || 1);
        const R = Calc.value(attack.id, "aurarangecalc", lvl, c) || 1, rad = +((D.fblast || {}).r) || 4, one = N <= 1 || R < 2;
        let inside = 0;
        if (!one) for (let x = -R; x < R; x++) for (let y = -R; y < R; y++) if (x * x + y * y <= rad * rad) inside++;
        const share = one ? 1 : inside / (4 * R * R), of = one ? 1 : N;
        always.push({ k: "bomb", el: "fire", q: own(), n: of * share, net: fire, of, spread: one ? 0 : R, r: rad, share });
        break;
      }
      /* the Assassin's traps: a trap's shots x what a shot lands on a lone monster: Lightning Sentry's bolt, Chain
         Lightning Sentry's chain (once on a lone monster), Charged Bolt Sentry's calc1 bolts x the share that reaches it
         (EX.cbolt, by where the trap stands), Wake of Fire's wave and side flames (EX.wake), Wake of Inferno's flames
         (DATA ex traps' flames); each the skill's own damage with your skill damage (the trap gets it), no -% enemy
         resistance */
      case "trap": {
        const T = (D.traps || {})[attack.id] || {}, e = ((SK[attack.id] || {}).EType || "").trim(), from = fromOf(b, attack), shots = trapShots(b, attack);
        let per = 1, of = 1;
        if (attack.k === "chargedboltsentry") { of = Calc.value(T.mon, "calc1", lvl, Object.assign(ctxOf(b, attack), { self_blvl: lvl })) || 1; per = of * EX.cbolt[from][size]; }
        else if (attack.k === "wakeoffire") per = EX.wake[from][size];
        else if (attack.k === "wakeofinferno") { of = T.flames || 7; per = of; }
        always.push({ k: "shot", el: e, q: own(), n: shots * per, net: ER[e] ? ER[e].net : 0, shots, per, of, from, range: T.range || 25 });
        break;
      }
      /* Mind Blast: the skill's physical (MinDam, its synergies) once on the monster it is cast on and every monster
         within aurarangecalc (4 + hard points / 2, at most 7) + calc1 (2) for each stack of its state (1-3: casts less
         than 20 frames apart) */
      case "mindblast": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam }), c = Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) });
        const r0 = Calc.value(attack.id, "aurarangecalc", lvl, c) || 4, per = Calc.value(attack.id, "calc1", lvl, c) || 2, most = Calc.value(attack.id, "calc2", lvl, c) || 3;
        always.push({ k: "hit", el: "phys", q: roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), n: 1, net: out.R.mult, r0, per, most, hard: hardOf(b) });
        break;
      }
      case "spell1": {
        const e = ((SK[attack.id] || {}).EType || "").trim();
        always.push({ k: "hit", el: e, q: own(), n: 1, net: ER[e] ? ER[e].net : 0 });
        break;
      }
      /* the Sorceress's spells of many missiles (2026-11-25, traced in the live build; the counts:
         EX). Frozen Orb: its bolts carry the skill's cold, the orb itself nothing */
      case "frozenorb": {
        const O = D.orb || {}, of = Math.floor((+O.frames || 45) / (+O.every || 1)) + (+O.ring || 16), from = fromOf(b, attack);
        always.push(Object.assign({ k: "bolt", el: "cold", q: own(), net: cold, of, ring: +O.ring || 16, reach: +O.reach || 21, from }, hitsOf(b, EX.orb[from][size], of)));
        break;
      }
      /* Blizzard: a shard every calc2 frames of its centre's life, each on a random sub-tile of the square calc1 - 1
         around the spot (-R to R - 1 both ways), bursting on every monster whose centre is within its radius: the
         share of those sub-tiles within the radius of the spot reach a monster standing on it */
      case "blizzard": {
        const c = ctxOf(b, attack), R = Math.max(1, Calc.value(attack.id, "calc1", lvl, c) - 1), every = Math.max(1, Calc.value(attack.id, "calc2", lvl, c));
        const Z = D.blizz || {}, rad = +Z.r || 4, frames = +Z.frames || 50, of = Math.floor(frames / every);
        let inside = 0;
        for (let x = -R; x < R; x++) for (let y = -R; y < R; y++) if (x * x + y * y <= rad * rad) inside++;
        always.push(Object.assign({ k: "shard", el: "cold", q: own(), net: cold, of, rad, spread: R, secs: frames / 25 }, hitsOf(b, of * inside / (4 * R * R), of)));
        break;
      }
      // Ice Barrage: calc1 lances (3, 4 from 3 points put in it, 5 from 6) side by side, each bursting where it hits
      case "icebarrage": {
        const N = Calc.value(attack.id, "calc1", lvl, Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) })), from = fromOf(b, attack);
        always.push(Object.assign({ k: "lance", el: "cold", q: own(), net: cold, of: N, from }, hitsOf(b, EX.barrage[from][clamp(N, 3, 5)][size], N)));
        break;
      }
      // Charged Bolt: calc1 bolts on a wandering path from you; the share that reaches the monster by how far you stand
      case "chargedbolt": {
        const N = Calc.value(attack.id, "calc1", lvl, ctxOf(b, attack)), from = fromOf(b, attack);
        always.push(Object.assign({ k: "bolt", el: "ltng", q: own(), net: ltng, of: N, from }, hitsOf(b, N * EX.cbolt[from][size], N)));
        break;
      }
      /* Inferno: each breath calc3 flames (2, +1 every 4 levels, at most 5), each the skill's fire on a monster it
         passes; EX.inf of them on the monster (its debuff: elemRes) */
      case "inferno": {
        const N = Calc.value(attack.id, "calc3", lvl, ctxOf(b, attack)) || 5;
        always.push(Object.assign({ k: "flame", el: "fire", q: own(), net: fire, of: N, debuff: Calc.value(attack.id, "aurastatcalc1", lvl, ctxOf(b, attack)) }, hitsOf(b, Math.min(EX.inf[size], N), N)));
        break;
      }
      /* Hydra and Lesser Hydra: 3 heads a cast, each shooting about DATA.ex.heads.shots times in its life: the skill's fire
         (your fire skill damage: the heads get it), every shot on a lone monster */
      case "hydra": {
        const H = (D.heads || {})[attack.id] || { heads: 3, shots: 3.24, life: 125 };
        always.push({ k: "shot", el: "fire", q: own(), n: H.heads * H.shots, net: fire, heads: H.heads, shots: H.shots, life: H.life });
        break;
      }
      // Fire Wall: its flames under the monster, each the skill's fire every frame for their frames
      case "firewall": {
        const f = +((D.fwall || {}).frames) || 75, fl = EX.fwall[size];
        always.push({ k: "flame", el: "fire", q: own(), n: fl * f, net: fire, flames: fl, frames: f });
        break;
      }
      // Blaze: the explosion around you (its own row), then the burning ground's flames under the monster next to you
      case "blaze": {
        const Z = D.blaze || {}, f = +Z.frames || 35, fl = EX.blaze[size];
        always.push({ k: "blast", el: "fire", q: miss(Z), n: 1, net: fire, r: +Z.r || 5 });
        always.push({ k: "flame", el: "fire", q: own(), n: fl * f, net: fire, flames: fl, frames: f, disc: +Z.disc || 4 });
        break;
      }
      // Thunder Storm: a strike's lightning on the monster, and one of the novas from it on a normal-size or big one
      case "tstorm":
        always.push({ k: "bolt", el: "ltng", q: own(), n: 1, net: ltng });
        always.push({ k: "nova", el: "ltng", q: miss(D.tsnova), n: size === 1 ? 0 : 1, net: ltng, lab: "its nova:" });
        break;
      // Combustion: calc2 fire balls in a ring from you, each exploding on the first monster it meets (EX.comb)
      case "combustion": {
        const N = Calc.value(attack.id, "calc2", lvl, ctxOf(b, attack)) || 32, from = fromOf(b, attack);
        always.push(Object.assign({ k: "ball", el: "fire", q: own(), net: fire, of: N, from }, hitsOf(b, EX.comb[from][size], N)));
        break;
      }
      /* Meteor: the skill's fire and its physical damage (MinDam / MaxDam with their levels, its DmgSymPerCalc: the
         synergies and fire skill damage) on everything within its radius, then 18 flames (their own row) for Param3 +
         Param4 a level frames: EX.mflames of them under the monster */
      case "meteor": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam });
        const f = Calc.key(attack.id, "ln34", lvl, ctxOf(b, attack)), fl = EX.mflames[size];
        always.push({ k: "impact", el: "fire", q: own(), n: 1, net: fire });
        always.push({ k: "impactP", el: "phys", q: roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), n: 1, net: out.R.mult });
        always.push({ k: "flame", el: "fire", q: miss(D.meteorfire), n: fl * f, net: fire, flames: fl, frames: f, fall: +(D.meteorfire || {}).fall || 15 });
        break;
      }
      /* the Druid's fire (2026-11-25, traced in the live build). Molten Boulder: the skill's physical
         (MinDam, its synergies) and fire each time the boulder rolls into a new sub-tile reaching the monster (nothing
         keeps it off), knocking it back or breaking on a large one; its explosion (on a large monster, a wall or where
         its roll ends) the same on every monster within aurarangecalc; its fire path's flames (their own row) */
      case "boulder": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam }), B = D.boulder || {};
        const kb = boulderKb(T), from = fromOf(b, attack), c = boulderCount(kb, from, lvl, size), f = +B.path || 37;
        const r = Calc.value(attack.id, "aurarangecalc", lvl, ctxOf(b, attack)) || 7, rolls = Math.max(0, (+B.frames || 85) + (B.lev === undefined ? -1 : +B.lev) * lvl);
        always.push({ k: "hitP", el: "phys", q: roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), n: c[0] + c[1], net: out.R.mult });
        always.push({ k: "hitF", el: "fire", q: own(), n: c[0] + c[1], net: fire, hits: c[0], expl: c[1], kb, from, r, rolls, vel: +B.vel || 8 });
        always.push({ k: "flame", el: "fire", q: miss(B), n: c[2], net: fire, flames: c[2] / f, frames: f });
        break;
      }
      /* Volcano: the volcano on the spot hits what stands in it every `lock` frames while it lasts (PD2's lock, one for
         all your volcanoes), the skill's physical and fire; its debris (every calc4 frames while 2 < frames left < 128,
         each on a random sub-tile within aurarangecalc) each leave a small fire of the same damage that hits once: the
         share under the monster. Cast again every F frames, the volcanoes overlap and a cast adds F / lock hits */
      case "volcano": {
        const P = Object.assign({}, SK[attack.id], { MinDamage: SK[attack.id].MinDam, MaxDamage: SK[attack.id].MaxDam }), V = D.volcano || {}, c = ctxOf(b, attack);
        const lock = +V.lock || 7, life = (+V.frames || 150) - 1, alone = Math.ceil(life / lock);
        const F = out.fr && out.fr.frames > 0 ? out.fr.frames : life, body = F < life ? F / lock : alone;
        const every = Math.max(1, Calc.value(attack.id, "calc4", lvl, c) || 2), spread = Math.max(1, Calc.value(attack.id, "aurarangecalc", lvl, c) || 12);
        let deb = 0;
        for (let t = +V.frames || 150; t >= 1; t--) if (t > (+V.lo || 2) && t < (+V.hi || 128) && t % every === 0) deb++;
        const fires = deb * [0, 5, 13, 21][size] / ((2 * spread + 1) ** 2);
        const qp = roll(Calc.missile(P, "Min", lvl, ctx, true), Calc.missile(P, "Max", lvl, ctx, true)), qf = own();
        always.push({ k: "bodyP", el: "phys", q: qp, n: body, net: out.R.mult, lab: "the volcano:" });
        always.push({ k: "body", el: "fire", q: qf, n: body, net: fire, alone, lock, life, every: F });
        always.push({ k: "debrisP", el: "phys", q: qp, n: fires, net: out.R.mult, lab: "its debris:" });
        always.push({ k: "debris", el: "fire", q: qf, n: fires, net: fire, of: deb, spread, flife: +V.fire || 18 });
        break;
      }
      /* Fissure: a crack every calc2 frames (5 - points put in it / 5) while its centre lasts, each on a random sub-tile
         within calc1 - 1 of the spot but never where another crack lies, each the skill's fire once on a monster it
         reaches: EX.fissure of them on a monster standing on the spot */
      case "fissure": {
        const c = Object.assign(ctxOf(b, attack), { self_blvl: hardOf(b) }), every = Calc.value(attack.id, "calc2", lvl, c), Z = D.fissure || {};
        always.push({ k: "crack", el: "fire", q: own(), n: every > 0 ? EX.fissure[clamp(every, 1, 5)][size] : 0, net: fire, every,
          of: every > 0 ? Math.floor((+Z.frames || 55) / every) : 0, span: (+Z.frames || 55) / 25, spread: Math.max(1, Calc.value(attack.id, "calc1", lvl, c) - 1) });
        break;
      }
      /* Blade Sentinel (2026-11-25, the author: "Blade sentinel and blade fury are quite complicated. Please be thorough
         with these"; traced in the live build): each cast a sentinel flies between you and the monster for
         its life; its blade (the hit above: the skill's own physical + all of the weapon's, raised by the %, your gear's
         elemental) hits what it passes, all sentinels together at most once every NextDelay + 1 frames on a monster,
         each rolling with the sentinel's attack rating (sentinelAR), through half your physical pierce and none of your
         -% enemy resistance; at each turn (at most every 12 frames, the first 6 after it starts) a burst: 75% of a melee
         hit's damage (the skill's own physical, not raised, + the weapon's raised by the melee %: damage against demons
         / undead only above 0, a blunt weapon's 50 against undead; crit and deadly strike; your gear's elemental), on
         everything within aurarangecalc, rolling with your own attack rating, through your pierce and -% enemy
         resistance. Counts: EX.sent */
      case "sentinel": {
        const S = D.sent || {}, p = out.per[0], from = fromOf(b, attack), F = out.fr && out.fr.frames > 0 ? out.fr.frames : 20;
        const cnt = sentCount(from, size, F), pB = p.p, pc = +S.burst || 75;
        always.push({ k: "blade", el: "phys", q: roll(p.mn256, p.mx256), n: cnt.hits * pB, net: out.R.mult, mult: p.mean, of: cnt.hits, p: pB, F, from, alone: cnt.alone });
        for (const e of ELEMS) if (e.k !== "pois" && p.el[e.k] && p.el[e.k].hi > 0) always.push({ k: "bladeE", el: e.k, q: roll(p.el[e.k].lo, p.el[e.k].hi), n: cnt.hits * pB, net: ER[e.k].net });
        let vsM = 0;
        if (T.kind !== "player") {
          if (T.type === "demon") vsM = gw(b, x, "edd");
          else if (T.type === "undead") vsM = (has(W[x.code], "blun") ? 50 : 0) + gw(b, x, "edu");
          if (vsM < 0) vsM = 0;
        }
        const pool = Math.max(out.sp + out.aur.p + p.strB + p.dexB + p.ms.dmg + vsM, -90), raise = v => v + tdiv(v * (pool + p.off), 100);
        const sph = p.sph || { lo: 0, hi: 0 }, lo = tdiv((sph.lo + raise(p.wmn * 256)) * pc, 100), hi = tdiv((sph.hi + raise(p.wmx * 256)) * pc, 100);
        const full = Object.assign({}, attack, { sentinel: false }), Rf = resist(b, full, T);
        const AR = p.AR && p.AR.burst ? p.AR.burst : null, pBu = out.rolls && AR ? hitChance(AR.ar, p.D.burst, +b.c.lvl || 1, +T.lvl || 1) / 100 : 1;
        always.push({ k: "burst", el: "phys", q: roll(lo, hi), n: cnt.burst * pBu, net: Rf.mult, mult: p.mean, of: cnt.burst, p: pBu, pc,
          r: Calc.value(attack.id, "aurarangecalc", lvl, ctxOf(b, attack)) || 7, sph: { lo: tdiv(sph.lo * pc, 100), hi: tdiv(sph.hi * pc, 100) } });
        for (const e of ELEMS) if (e.k !== "pois" && p.el[e.k] && p.el[e.k].hi > 0)
          always.push({ k: "burstE", el: e.k, q: roll(tdiv(p.el[e.k].lo * pc, 100), tdiv(p.el[e.k].hi * pc, 100)), n: cnt.burst * pBu, net: elemRes(b, T, e, full).net });
        /* poison (your gear's and Venom's, as on your hits): the blades' one per sentinel (sentPoison), the bursts' 75% of it
           your own one poison, a burst every F / bursts frames (poisonRun) */
        const z = p.el.pois, plr = out.plr || 0, len = z ? Math.trunc(z.len * (100 - Math.min(plr, 100)) / 100) : 0;
        let poison = null;
        if (z && len > 0 && z.hi > 0) {
          const P = sentPoison(from, size, F, len, pB), per = z.lo + (z.hi - z.lo) * P.q;
          if (ER.pois.net > 0) always.push({ k: "bladeP", el: "pois", q: { lo: z.lo * P.frames, hi: z.hi * P.frames, avg: per * P.frames }, n: 1, net: ER.pois.net, frames: P.frames, len });
          const ERp = elemRes(b, T, ELEM.pois, full), lo2 = tdiv(z.lo * pc, 100), hi2 = tdiv(z.hi * pc, 100);
          const run = cnt.burst > 0 ? poisonRun([[{ dt: 0, lo: lo2, hi: hi2, len, n: 1 }]], F / cnt.burst, pBu) : { avg: 0, up: 0 };
          if (ERp.net > 0 && run.avg > 0) always.push({ k: "burstP", el: "pois", q: { lo: lo2 * run.up * F, hi: hi2 * run.up * F, avg: run.avg * F }, n: 1, net: ERp.net, frames: run.up * F, len });
          poison = { len, stacks: P.frames / F, per, up: run.up };
        }
        return { kind: "sentinel", lvl, size, land, always, sent: { hits: cnt.hits, bursts: cnt.burst, alone: cnt.alone, pB, pBu, F, from, Rf, S, poison } };
      }
      /* Split Throw's returns (2026-11-27, the author: "Count the Split Throw returns on the page"; traces T4 B
         and T12): its calc1 weapons (3 + level / 5, at most 7) fan out a sub-tile apart across the line to the monster,
         all at once; the first to reach it is the throw's hit (the page's hit above), the others pass through it (they
         keep each other off it for 3 frames) and fly to their end, then come back down their own lines and over it again,
         each its own hit as it passes, about 2 seconds after the throw (EX.split: of a throw from 5 yards, 3 lines cross a
         small monster, 5 a normal-size one, every one a big one). A return deals your weapon's damage without Split
         Throw's own % (its table's 38 share isn't read), with crit and deadly strike and your gear's elemental damage,
         rolling to hit as the throw does; it comes whether the throw hit or missed. Not counted: a weapon that pierces
         (its own return), crushing blow and poison on the returns */
      case "splitthrow": {
        const p = out.per[0], S = splitCount(b, attack, T), R = S.R, pR = p.p;
        if (!(R > 0) && !(S.pc > 0)) return null;
        const pool = Math.max(out.aur.p + p.strB + p.dexB + p.ms.dmg + p.vs, -90), raise = v => v + tdiv(v * (pool + p.off), 100);
        const q = roll(raise(p.wmn * 256), raise(p.wmx * 256));
        // (cb: each return that lands rolls crushing blow, as a missile's hit: the fights' hitLoss)
        always.push({ k: "ret", el: "phys", q, n: R * pR, net: out.R.mult, mult: p.mean, of: R, p: pR, N: S.N, cross: S.cross, pct: pool + p.off, pc: S.pc, cb: true });
        for (const e of ELEMS) if (e.k !== "pois" && p.el[e.k] && p.el[e.k].hi > 0) always.push({ k: "retE", el: e.k, q: roll(p.el[e.k].lo, p.el[e.k].hi), n: R * pR, net: ER[e.k].net });
        // the throw's own weapon when it pierces the monster (gear's and Throwing Mastery's pierce chance): on a
        // landed throw, its return too
        if (S.pc > 0) {
          land.push({ k: "retP", el: "phys", q, n: S.pc * pR, net: out.R.mult, mult: p.mean, p: pR, cb: true });
          for (const e of ELEMS) if (e.k !== "pois" && p.el[e.k] && p.el[e.k].hi > 0) land.push({ k: "retPE", el: e.k, q: roll(p.el[e.k].lo, p.el[e.k].hi), n: S.pc * pR, net: ER[e.k].net });
        }
        break;
      }
      default: return null;   // Plague Javelin: its ring is poison (plagueRing)
    }
    return { kind: attack.ex, lvl, size, land, always };
  }
  /* the extras on a build's numbers: out.final becomes what a landed hit and everything after it do, out.toHit the
     share of that an attack lands on average (the parts that come on a miss too count whole), so damage per second
     stays final x hits per second x toHit (as Fists of Fire's charges) */
  function extraApply(out, b, attack, T) {
    const X = extrasOf(out, b, attack, T);
    if (!X) return;
    const sum = ps => ps.reduce((t, x) => t + x.n * x.q.avg / 256 * x.net * (x.mult || 1), 0);
    X.H = out.final; X.p = out.toHit; X.E1 = sum(X.land); X.E2 = sum(X.always);
    // before the monster's resistances (a spell's damage a cast, as its tooltip shows it)
    X.raw = X.land.concat(X.always).reduce((t, x) => t + x.n * x.q.avg / 256 * (x.mult || 1), 0) + (out.spell && out.pois ? out.pois.raw : 0);
    out.ex = X;
    /* Blade Sentinel: a cast is its blade hits and bursts, each part with its own chance to hit in its count; the hit
       above is one blade's (the card's weapon numbers), not counted again */
    if (X.kind === "sentinel") {
      X.blade = X.H; X.H = 0; X.p = 1; X.E1 = 0; out.pois = null;
      out.physFinal = sum(X.always.filter(x => x.el === "phys"));
      out.final = X.E2; out.toHit = 1;
      return;
    }
    // a spell's physical part (Meteor's): the monster's physical resistance counts for it
    if (out.spell) {
      const ph = X.always.filter(x => x.el === "phys");
      out.spellPhys = ph.length > 0;
      out.physFinal = sum(ph);
    }
    out.final = X.H + X.E1 + X.E2;
    if (out.final > 0) out.toHit = (X.p * (X.H + X.E1) + X.E2) / out.final;
  }
  /* the extras' damage in a fight (256ths, through the resistances): each part rolled (a part landing a fraction of the
     time, the bombs' 2.25: its whole ones and the rest by chance), the flames their average */
  function exLoss(ps, rnd, ev, cbf) {
    let t = 0;
    for (const x of ps) {
      // (ev: each part's rolls on the monster, a burning one's average over its frames, for the Fight tab)
      if (x.frames) { t += x.n * x.q.avg * x.net; if (ev) evPart(ev, x).over = x.n * x.q.avg * x.net; continue; }
      let n = Math.floor(x.n);
      if (x.n > n && rnd() < x.n - n) n++;
      const rec = ev ? evPart(ev, x) : null;
      for (let i = 0; i < n; i++) {
        const v = (x.q.lo + (x.q.hi > x.q.lo ? Math.floor(rnd() * (x.q.hi - x.q.lo)) : 0)) * x.net * (x.mult || 1) + (x.cb && cbf ? cbf() : 0);
        t += v;
        if (rec) rec.d.push(v);
      }
    }
    return t;
  }
  /* the Fight tab's record of a part a hit or a cast puts on the monster: {x: the part (its k, el, flames, frames...), d:
     each roll's damage, over: a burning part's damage over its frames} */
  const evPart = (ev, x) => { const r = { x, d: [], over: 0 }; (ev.parts || (ev.parts = [])).push(r); return r; };
  /* a charge-up attack in a fight (Fists of Fire, Blades of Ice, Claws of Thunder, Phoenix Strike): charge s's chance to hit; on a hit what it takes off
     (the hit, crushing blow, its charge's effect: the explosion, nova and meteors, waves and bolts rolled, the flames
     their average), else -1 (no charge) */
  function fofLoss(E, p, s, T, rnd, L, life, ranged, noCb, ev) {
    const F = E.fof;
    if (F.P[s] < 1 && rnd() >= F.P[s]) return -1;
    let d = p.mn256 + (p.mx256 > p.mn256 ? Math.floor(rnd() * (p.mx256 - p.mn256)) : 0);
    const x = rnd(), C = p.crit;
    if (x < C.pc) { d = Math.trunc(d * C.cm); if (ev) ev.crit = true; }
    else if (rnd() < C.pd / (1 - C.pc || 1)) { d = Math.trunc(d * C.dm); if (ev) ev.ds = true; }
    let cb = 0;
    if (!noCb && p.cb.ch > 0 && E.R.cbMult > 0 && rnd() < p.cb.ch) {
      const div = cbDivisor(T, L, life, ranged) / (1 + p.cb.cbe / 100);
      cb = Math.trunc(L / div * E.R.cbMult);
    }
    let e = 0;
    for (const q of p.elRoll) e += (q[0] + (q[1] > q[0] ? Math.floor(rnd() * (q[1] - q[0])) : 0)) * q[2];
    const r = q => q.lo + (q.hi > q.lo ? Math.floor(rnd() * (q.hi - q.lo)) : 0);
    // (ev, the Fight tab's record: each effect of the charge with its rolls, under the k it is drawn by)
    const rec = (k, el) => (ev ? evPart(ev, { k, el }) : null), put = (o, v) => { if (o) o.d.push(v); return v; };
    let phys = d * E.R.mult * (F.pmul ? F.pmul[s] : 1), extra = 0;   // (Cobra Strike's charge 2: its damage % raised)
    if (F.parts) {
      for (const x of F.parts[s]) {
        const o = ev ? evPart(ev, x) : null;
        if (x.flames !== undefined) { extra += x.n * x.q.avg * x.net; if (o) o.over = x.n * x.q.avg * x.net; }   // flames burning: their average
        else for (let i = 0; i < x.n; i++) extra += put(o, r(x.q) * x.net);
      }
    } else if (F.kind === "boi") {
      if (s === 0) extra = put(rec("skill", "cold"), r(F.skill) * F.cNet);
      else if (s === 1) { const w = rec("wave", "cold"), tr = rec("trail", "cold"); extra = put(w, r(F.wave) * F.cNet); for (let i = 1; i < F.nWave; i++) extra += put(tr, r(F.trail) * F.cNet); }
      else { const o = rec("ice", "cold"); for (let i = 0; i < F.nIce; i++) extra += put(o, r(F.ice) * F.cNet); }
    } else if (s === 0) {
      const cv = Math.trunc(d * F.conv);
      phys = (d - cv) * E.R.mult + cv * F.fNet;
      // the skill's fire on the hit, its explosion, and the ground flames' average
      const a = r(F.skill), b = r(F.skill);
      extra = (a + b) * F.fNet + F.flames1 * 256;
      if (ev) { put(rec("fire", "fire"), a * F.fNet); put(rec("explosion", "fire"), b * F.fNet); rec("flames", "fire").over = F.flames1 * 256; }
    } else if (s === 1) extra = F.nNova ? put(rec("nova", "fire"), r(F.nova) * F.fNet) : 0;
    else {
      const o = rec("meteor", "fire");
      for (let i = 0; i < F.nMet; i++) { const v = r(F.mFire) * F.fNet + r(F.mPhys) * F.pMult; extra += v; put(o, v); }
      extra += F.mflames * 256;
      if (ev) rec("flames", "fire").over = F.mflames * 256;
    }
    if (ev) { ev.cb = cb; ev.phys = phys; ev.el = e; ev.pois = E.poisHit256; }
    return cb + Math.trunc(phys + e + E.poisHit256 + extra);
  }
  /* crushing blow's divisor: a player's or a pet's 10; a prime evil's (MonStats primeevil) 30 on the game's map boss
     lists, else 70 + 10 for each 1% of life missing; any other monster's 8, bosses that are no prime evil (kind
     "lesser": Andariel, Duriel, the quest bosses) too (traced 2026-11-21, live 11-04; until then the page gave them 70) */
  function cbDivisor(T, life, maxLife, ranged) {
    let d = 8;
    if (T.kind === "player") d = 10;
    else if (T.kind === "mapboss") d = 30;
    else if (T.kind === "boss") d = 70 + 10 * (100 - Math.floor(100 * life / maxLife));
    if (T.kind !== "player") d += [0, 0, 70, 140, 210, 280, 350, 420, 490][clamp(+T.players || 1, 1, 8)] / 50;
    if (ranged) d *= 1.5;
    return d;
  }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* each weapon's elemental rolls (256ths) with what gets through, and a landed hit's poison: for the fights below */
  function prepFight(E) {
    for (const p of E.per) p.elRoll = ELEMS.filter(e => e.k !== "pois" && p.el[e.k] && E.ER[e.k].net !== 0).map(e => [p.el[e.k].lo, p.el[e.k].hi, E.ER[e.k].net]);
    E.poisHit256 = E.pois ? E.pois.perHit * 256 : 0;
  }
  /* one hit of a fight with weapon p's numbers: what it takes off the monster's life L (256ths, of life at full); a miss
     takes nothing, no crushing blow either. The random draws in the order the kill time always made them. ev (the
     Fight tab's record of the hit, fightRun's onHit): what it did, filled without a draw of its own */
  function hitLoss(E, p, T, rnd, L, life, ranged, noCb, ev) {
    if (E.ex && E.ex.kind === "sentinel") return Math.trunc(exLoss(E.ex.always, rnd, ev));   // a cast: its blades and bursts
    // (a part that rolls crushing blow as its own missile hit: Split Throw's returns)
    const cbf = !noCb && p.cb && p.cb.ch > 0 && E.R.cbMult > 0
      ? () => (rnd() < p.cb.ch ? Math.trunc(L / (cbDivisor(T, L, life, true) / (1 + p.cb.cbe / 100)) * E.R.cbMult) : 0) : null;
    if (p.p < 1 && rnd() >= p.p) { if (ev) ev.miss = true; return E.ex ? Math.trunc(exLoss(E.ex.always, rnd, ev, cbf)) : 0; }
    let d = p.mn256 + (p.mx256 > p.mn256 ? Math.floor(rnd() * (p.mx256 - p.mn256)) : 0);
    const x = rnd(), C = p.crit;
    if (x < C.pc) { d = Math.trunc(d * C.cm); if (ev) ev.crit = true; }
    else if (rnd() < C.pd / (1 - C.pc || 1)) { d = Math.trunc(d * C.dm); if (ev) ev.ds = true; }
    // Blade Shield: the first fill's own crit / deadly strike on its fifth of the damage
    if (E.attack.dfill) { const y = rnd(), c1 = y < C.pc ? C.cm : y < C.pc + C.pd ? C.dm : 1; d = Math.trunc(d * (c1 + 4) / 5); }
    let cb = 0;
    if (!noCb && p.cb.ch > 0 && E.R.cbMult > 0 && rnd() < p.cb.ch) {
      const div = cbDivisor(T, L, life, ranged) / (1 + p.cb.cbe / 100);
      cb = Math.trunc(L / div * E.R.cbMult);
    }
    let e = 0;
    for (const q of p.elRoll) e += (q[0] + (q[1] > q[0] ? Math.floor(rnd() * (q[1] - q[0])) : 0)) * q[2];
    if (ev) { ev.cb = cb; ev.phys = d * E.pm; ev.el = e; ev.pois = E.poisHit256; }
    if (E.ex) e += exLoss(E.ex.land, rnd, ev, cbf) + exLoss(E.ex.always, rnd, ev, cbf);
    return cb + Math.trunc(d * E.pm + e + E.poisHit256);
  }
  /* one play of a rotation in a fight (256ths): the skill's cast, or every hit of another skill's round, each roll x
     the play's m (the debuffs, Volcano's pace); ci: each skill's hits so far (its weapon's turn); ev: the Fight's record */
  function weavePlay(E, W, st, ci, T, rnd, L, life, noCb, ev) {
    const Ej = st.j === 0 ? E : W.use[st.j - 1].E, n = st.j === 0 ? 1 : W.S[st.j].hits, rg = !!(Ej.attack.missile || Ej.attack.throw);
    let l = 0;
    // (the Fight's record: each hit of a round its own, ev.hits, the round's first in ev itself: the Fight's audit,
    // 2026-11-27, MO-09: a filler round's hits had shared one record, shown as one number on its first frame)
    if (ev && n > 1) ev.hits = [];
    for (let h = 0; h < n && L - l > 0; h++) {
      const hv = ev ? (n > 1 ? {} : ev) : null;
      const d = Math.trunc(hitLoss(Ej, Ej.per[ci[st.j]++ % Ej.per.length], T, rnd, L - l, life, rg, noCb, hv) * st.m);
      l += d;
      if (hv && n > 1) { hv.loss = d; ev.hits.push(hv); if (h === 0) Object.assign(ev, hv, { hits: ev.hits, loss: undefined }); }
    }
    return l;
  }
  /* how many hits a run of the kill time may take (3 times the expected, a rotation's plays a rotation more), shared
     with the Fight tab so its fights are the kill time's runs however long */
  function killCap(E, life) {
    const est = life / Math.max(1, E.final * 256 * E.toHit), wv = E.wv && E.wv.k > 0 ? E.wv : null;
    return Math.max(20000, Math.ceil(est * 3 * (wv ? (wv.i1 - wv.i0) / wv.casts : 1)));
  }
  function killTime(E, b, T, noCb) {
    const life = Math.max(1, +T.life || 1) * 256;
    if (!(E.final > 0) && !(E.cb.ch > 0 && E.R.cbMult > 0 && !noCb)) return { never: true };
    const rnd = mulberry32(12345);
    /* fewer runs for a long fight (many hits average out anyway), so a boss with millions of life stays quick */
    // between cooldowns (weaveApply): the rotation's plays in turn (fightRun), its plays a rotation for the cap
    const wv = E.wv && E.wv.k > 0 ? E.wv : null;
    const runs = killRuns(E, life), cap = killCap(E, life);
    const fr = E.fr; let totHits = 0, fail = 0, totT = 0;
    const fin = E.fof && E.fof.fin;
    prepFight(E);
    if (fin) prepFight(fin.E);
    if (wv) wv.use.forEach(o => prepFight(o.E));
    for (let r = 0; r < runs; r++) {
      const f = fightRun(E, T, rnd, life, noCb, cap);
      if (f.hits >= cap) fail++;
      totHits += f.hits; totT += f.t;
    }
    if (fail > runs / 2) return { never: true };
    const hits = totHits / runs;
    const framesPerHit = fr.frames / fr.hits;
    return { hits, secs: fin || wv ? totT / runs / 25 : hits * framesPerHit / 25 };
  }
  // the kill time's runs: fewer for a long fight (each holds many hits)
  function killRuns(E, life) { return clamp(Math.round(150000 / Math.max(1, life / Math.max(1, E.final * 256 * E.toHit))), 4, 400); }
  /* fight:start */
  /* one fight: killTime's runs and killChances' (cap 6) are each one of these, the random draws in the order they
     always made them. Hits until the monster's life L (256ths) is gone or cap hits are made; a charge-up's or a
     finisher's step counts its frames (t; a plain attack's time is its hits x its frames a hit). onHit(ev): the Fight
     tab's record of each hit, after it (i its number, s the charge it casts, t0 the frame its step starts at in t,
     fin a finisher's step with done whether it used the charges, miss, crit, ds, cb, phys, el, pois, parts, hits,
     loss, L: in 256ths of a point of life; see hitLoss, fofLoss and finLoss). from: a rotation's plays before this
     fight (the Fight tab's casts after a kill go on with the rotation where it was, not from its start). {hits, t, L} */
  function fightRun(E, T, rnd, life, noCb, cap, onHit, from) {
    const fr = E.fr, ranged = !!(E.attack.missile || E.attack.throw);
    // a Dragon Claw finisher: the cycle's fourth step, timed by its own frames
    const fin = E.fof && E.fof.fin;
    // between cooldowns (weaveApply): the rotation's plays in turn (weaveStepper), a kill counted to the skill's next
    // cast (a rotation counts whole, as an attack does without it, so a short fight isn't shortened by bookkeeping)
    const wv = E.wv && E.wv.k > 0 ? E.wv : null, step = wv ? weaveStepper(wv) : null, ci = [0, 0, 0, 0];
    let L = life, hits = 0, s = 0, t = 0, tDF = -1e9;
    while (L > 0 && hits < cap) {
      const p = E.per[hits % E.per.length], ev = onHit ? { i: hits, s, t0: t } : null;
      let l = 0;
      if (wv) {
        // (ev.t0: the frame the play starts; ev.wv: whose, 0 the skill, 1-3 the rotation's others; ev.m its multiplier)
        const st = step(hits + (from || 0));
        if (ev) { ev.t0 = st.t; ev.wv = st.j; ev.m = st.m; }
        l = weavePlay(E, wv, st, ci, T, rnd, L, life, noCb, ev);
        t = st.nm;
      }
      else if (fin && s === 3) {
        // Dragon Flight: not before its cooldown cycle after its last kick
        if (fin.kind === "df") { t = Math.max(t, tDF + fin.cdc); tDF = t; if (ev) ev.t0 = t; t += fin.own; } else t += fin.E.fr.frames;
        const [m, done] = finLoss(E, T, rnd, L, life, noCb, ev); l = m; if (done) s = 0;
        if (ev) { ev.fin = true; ev.done = done; }
      }
      else if (E.fof) { const m = fofLoss(E, p, s, T, rnd, L, life, ranged, noCb, ev); if (m >= 0) { l = m; s = fin ? s + 1 : (s + 1) % 3; } else if (ev) ev.miss = true; t += fr.frames; }
      else l = hitLoss(E, p, T, rnd, L, life, ranged, noCb, ev);
      L -= l;
      hits++;
      if (ev) { ev.loss = l; ev.L = L; onHit(ev); }
    }
    return { hits, t, L };
  }
  /* fight:end */
  /* the chance to kill the monster within 1 to 6 hits (2026-11-24, a player: "how to improve consistency to 1 or 2
     shot them"): 4,000 fights of up to 6 hits, a seed of their own (every build the same, so builds compare without
     the noise of different draws), misses, damage rolls, critical and deadly strikes, crushing blow and elemental
     damage as in the kill time. Only for a fight of 6 hits or fewer on average: null otherwise */
  const KC_RUNS = 4000;
  function killChances(E, b, T, runs) {
    if (!(E.final > 0) || !E.fr || E.attack.frames_only) return null;
    const life = Math.max(1, +T.life || 1) * 256, RUNS = runs || KC_RUNS;
    if (life / Math.max(1, E.final * 256 * E.toHit) > 6) return null;
    const rnd = mulberry32(4242), within = [0, 0, 0, 0, 0, 0];
    const fin = E.fof && E.fof.fin, wv = E.wv && E.wv.k > 0 ? E.wv : null;
    prepFight(E);
    if (fin) prepFight(fin.E);
    if (wv) wv.use.forEach(o => prepFight(o.E));
    for (let r = 0; r < RUNS; r++) {
      const f = fightRun(E, T, rnd, life, false, 6);
      if (f.L <= 0) for (let n = f.hits - 1; n < 6; n++) within[n]++;
    }
    return within.map(c => c / RUNS);
  }

  // ================================================================== state
  /* a weapon's own stats that work on its hits (2026-11-22, the author: compare two weapons on one build): deadly
     strike and its multiplier, critical strike and its multiplier, crushing blow, attack rating and attack rating %,
     -% target defense, Ignore Target's Defense, attack rating and damage against demons / undead. Other gear's of the
     same stats count on every hit (gw) */
  const WEAPON_STATS = () => ({ dmg: 0, ds: 0, dsmult: 0, crit: 0, cmult: 0, cb: 0, ar: 0, arp: 0, tdef: 0, itd: false, ard: 0, aru: 0, edd: 0, edu: 0,
    ...ELEM_FLAT() });
  /* elemental damage (2026-11-24): "Adds X-Y" fire (f), lightning (l), cold (c) and magic (m) min / max, poison (p) as
     the game shows it, its damage over psec seconds; on a weapon they count on its hits only (as its enhanced damage),
     on other gear on every hit. Other gear also holds each element's +% skill damage (fm ...) and -% enemy resistance
     (fp ...). See ELEMS. */
  function ELEM_FLAT() { return { fmin: 0, fmax: 0, lmin: 0, lmax: 0, cmin: 0, cmax: 0, mmin: 0, mmax: 0, pmin: 0, pmax: 0, psec: 0 }; }
  const DEFAULT_BUILD = () => ({
    // wname: the weapon's name in Compare weapons ("Weapon B" while empty); name: the build's, there the character's
    name: "", wname: "", cls: "pal",
    // from: the token of the armory load that filled it (Clear character, its weapon sets, its card's "Loaded above")
    from: "",
    // lvl: the character level (chance to hit)
    c: { str: 156, dex: 75, lvl: 90 },
    w: Object.assign({ cat: "swd1", code: "7cr", eth: false, hand: "d1", ed: 300, min: 0, max: 0, ias: 40 }, WEAPON_STATS()),
    // main: the hand of the first weapon (equipped first, the one a normal attack uses), "r" or "l": an attack's first
    // hit rolls to hit with the right-hand weapon's attack rating stats (rollMix)
    o: Object.assign({ on: false, main: "r", cat: "swd1", code: "7cr", eth: false, hand: "d1", ed: 0, min: 0, max: 0, ias: 0 }, WEAPON_STATS()),
    // ar / arp: attack rating and attack rating % on gear; tdef: -% target defense; itd: Ignore Target's Defense; ard /
    // aru: attack rating against demons / undead; edd / edu: damage % against demons / undead
    // fcr: faster cast rate on everything worn (a spell's speed, 2026-11-25)
    g: Object.assign({ ias: 20, fcr: 0, ed: 0, min: 0, max: 0, crit: 0, cmult: 0, ds: 20, maxds: 0, dsmult: 0, cb: 0, cbe: 0, pierce: 0, ar: 0, arp: 0, tdef: 0, itd: false, ard: 0, aru: 0, edd: 0, edu: 0, pc: 0 },
      ELEM_FLAT(), { fm: 0, lm: 0, cm: 0, mm: 0, pm: 0, fp: 0, lp: 0, cp: 0, pp: 0 }),
    // hard: the attack skill's hard points (0: its level up to 20); from: how far Charged Bolt is cast from ("" next
    // to the monster, "mid" 5 yards, "far" 10 yards)
    // hits: how many of a spell's bolts, lances, shards or fire balls you count (0: worked out)
    // corpse: Corpse Explosion's corpse's life (0: one like the monster)
    // a charge-up skill's finisher: fin its level (0: none), fk which ("dc" Dragon Claw, "dt" Dragon Tail), wb Weapon
    // Block's base points (Dragon Claw's synergy), tal / fly Dragon Talon's and Dragon Flight's (Dragon Tail's); dcl / dtl
    // the character's Dragon Claw / Dragon Tail levels from the armory (the field's hint)
    // ("df" Dragon Flight, dfl its level from the armory; "dl" Dragon Talon, dll its level, tail Dragon Tail's base
    // points, its synergy with fly)
    // between cooldowns (weaveApply): rot the skills cast while a skill with a cooldown waits for it, [{k, lvl}] (at
    // most 3; [] none), wvs the points in their synergies the attack's own fields don't ask; wlv / wsy from the armory:
    // the levels of the skills it could cast and their synergies' points (the fields' hints and first values)
    s: { k: "zeal", lvl: 30, syn: { Sacrifice: 20 }, cdr: "", hard: 0, from: "", hits: 0, corpse: 0, fin: 0, fk: "dc", wb: 0, tal: 0, fly: 0, tail: 0, dcl: 0, dtl: 0, dfl: 0, dll: 0,
      rot: [], wvs: {}, wlv: {}, wsy: {} },
    m: {},   // the masteries by skill id; penLvl: Penetrate's level with + skills (its attack rating)
    // baSelf / baHard: Blessed Aim is the Paladin's own, and its base points (its -% target defense); bc / bcHard:
    // Battle Command's level as cast and its base points (0 from a Call to Arms: its + all skills, `bcAll`)
    aur: { might: 0, mightSelf: true, conc: 0, concSelf: true, bc: 0, bcHard: 0, grim: 0, wolv: 0, ba: 0, baSelf: false, baHard: 0 },
    // lyc: Lycanthropy's level (a wereform's attack rating); holy / holyLvl: a Paladin's own Holy aura (HOLY's key),
    // holySyn: the points in its synergies (its damage on attacks); venom / venomSyn: an Assassin's Venom and Cobra
    // Strike's points (its poison on attacks); bosOff: Burst of Speed switched off (Fade kept up instead: one at a time)
    buf: { fana: 25, fanaSelf: true, frenzy: 0, stacks: 5, bos: 0, bosHard: 0, bosOff: false, incHard: 0, were: 0, bear: 0, maul: 0, lyc: 0, holy: "", holyLvl: 0,
      holySyn: 0, venom: 0, venomSyn: 0,
      // the Holy auras items give (2026-11-27): each aura's level, the items' levels added up; a Paladin's base points
      // in its synergies (another class has none)
      ia: { fire: 0, freeze: 0, shock: 0, sanc: 0 }, iaSyn: { fire: 0, freeze: 0, shock: 0, sanc: 0 },
      // a Sorceress's Enchant and Cold Enchant on the build (2026-11-25): their level as cast, their synergy's points
      // (Warmth, Chilling Armor), and whether it is your own (a Sorceress's) or a party member's (half)
      ench: 0, enchSyn: 0, enchSelf: true, cench: 0, cenchSyn: 0, cenchSelf: true },
    // what the build puts on the monster itself (onMonster): its curses ([{c: a CURSES key, lvl}], since 2026-11-24; one
    // curse until then, oldCurse reads it), Curse Mastery's base points, the gear's additional curses, its Battle Cry
    deb: { curses: [], cm: 0, extra: 0, bc: 0 },
    // a kick's: the boots (their kick damage) and "+X kick damage" on gear
    k: { boots: "utb", kd: 0 },
    // Smite's: the shield (its damage), Holy Shield's level as cast and Defiance's points (its synergy)
    sm: { shield: "pab", hs: 0, def: 0 },
  });
  /* the monster: its level, defense and type ("demon", "undead" or "": a preset's from the data; your own monster's
     start as a normal Hell monster of level 85, MonLvl's 1,651 defense), what Kind makes a normal monster (kind, champ:
     a CHAMPS key), its size (MonStats2 SizeX, 1-3: Fists of Fire's flames and meteors), the curses from others (others: [{who: "a4", mlvl: the mercenary's level} or {who: "party", c: a
     CURSES key, lvl, cm: Curse Mastery's base points}], partyMax: the most curses a party member applies; until
     2026-11-24 one curse, targetOf reads it), Battle Cry, Conviction (conv) and Inner Sight (inner); since 2026-11-24 its
     elemental resistances (el, 100 or more: immune), the map's "Monsters absorb X%" (abs) and the map a map monster is
     from (map, a DATA.maps code: the preset "map:<MonStats Id>") */
  // mods: a unique's or superunique's resistance mods in the order it rolled them (UMODS keys); plr: its poison length
  // reduction % (the uber rows')
  const DEFAULT_TARGET = () => ({ preset: "", tier: 0, kind: "monster", champ: "plain", mods: [], type: "", size: 2, lvl: 85, life: 50000, def: 1651, res: 0, plr: 0, others: [], partyMax: 1, bc: 0, conv: 0, inner: 0, players: 1,
    el: { fire: 0, ltng: 0, cold: 0, pois: 0, mag: 0 }, abs: { fire: 0, ltng: 0, cold: 0, mag: 0 }, map: "" });
  let builds = [], target = DEFAULT_TARGET(), shown = 0;
  let undo = null;   // { i, b }: the build a "Start from…" replaced, while its card offers Undo
  // { b, replaced, modeWas, todo, text }: the build that came from the IAS Calculator, while its card says so and offers
  // Undo (CA-04); todo: the fields to fill in (path: the value they start at), marked while they still hold it
  let arrived = null;
  function undoArrival() {
    if (!arrived) return;
    const i = builds.indexOf(arrived.b);
    if (i >= 0) { if (arrived.replaced) builds[i] = arrived.replaced; else builds.splice(i, 1); }
    mode = arrived.modeWas;
    arrived = null; undo = null; shown = 0;
    renderAll();
  }

  function exampleBuilds() {
    const a = DEFAULT_BUILD();
    a.name = "";
    const b = DEFAULT_BUILD();
    Object.assign(b, { name: "", cls: "bar" });
    b.c = { str: 200, dex: 100, lvl: 90 };
    b.w = { cat: "swd2", code: "7gd", eth: false, hand: "d1", ed: 320, min: 0, max: 0, ias: 0 };
    b.o = { on: true, cat: "swd2", code: "7gd", eth: true, hand: "d1", ed: 280, min: 0, max: 0, ias: 0 };
    b.s = { k: "frenzy", lvl: 30, syn: { "Double Swing": 20, Stun: 1 } };
    b.m = { 128: 20 };
    b.buf = Object.assign(b.buf, { fana: 0, frenzy: 30, stacks: 5, incHard: 10 });
    b.aur.bc = 25;
    b.g.ds = 30;
    return [a, b];
  }

  /* builds to start from ("Start from…" on each card), there to be changed to the player's own. Since 2026-11-20 (the
     author: the IAS Calculator's presets "the same way") the most played Season 14 attack builds of characters level
     80-99 whose damage this page works out, softcore and hardcore (pd2.tools' builds data, characters with their gear
     read): each build's most used weapon (the IAS Calculator's pick) with the median of what the characters holding it
     have on it (its own enhanced damage with what is socketed, its flat and per-level damage at their level, its IAS),
     strength and dexterity as the character screen shows them, the median of the rest of their gear and charms
     (enhanced damage, flat damage, IAS; deadly strike, crushing blow and critical strike with the weapons' own added),
     the attack's median level with +skills, its synergies' base points and the masteries, and the auras and buffs
     more than 55% of them have (a Paladin's Fanaticism, a Barbarian's Battle Command, an Act 5 mercenary's Might).
     Since 2026-11-21 (chance to hit) also the median character level, attack rating and attack rating % on gear and
     charms (per-level attack rating at their level), attack rating and damage against demons / undead (Tomb Reaver's,
     Immortal King's Stone Crusher's, arrows'), -% target
     defense, Lycanthropy's and Penetrate's levels with +
     skills (43-115 characters a build; Ignore Target's Defense on 0-14% of them: left off).
     Since 2026-11-22 (the weapons' own stats, the author) the weapon's deadly strike, its multiplier, critical strike,
     its multiplier, crushing blow, attack rating (per level at the character's level), attack rating %, -% target
     defense, attack rating and damage against demons / undead are its own (the median on the holders' weapon, its
     sockets and corruption with it), and other gear's of those stats the median of the rest (equipment but both weapon
     sets, inventory charms): pd2.tools again, the characters holding the build's weapon (both weapons for Frenzy) with
     the attack at base 20, 7+ items equipped, softcore and hardcore, 13-381 a build. Until then the medians had both
     weapons' stats on other gear (counting the second's on every hit) and left the deadly strike multiplier out
     (Death Cleaver's +50%).
     Left out: the attacks this page didn't work out on 2026-11-20 (Vengeance, Rabies, Lightning Fury, Blades of Ice: worked
     out since 2026-11-24 / 25, no presets yet) or only times (Smite), and Dragon Claw (almost never the main attack). */
  function presetBuild(name, cls, set) {
    // unnamed: a build is called after its class (2026-11-22, the author: "Instead of Zealot, Paladin"); name is the
    // attack's, for reading the list
    const b = Object.assign(DEFAULT_BUILD(), { name: "", cls });
    Object.assign(b.g, { ias: 0, ed: 0, min: 0, max: 0, crit: 0, cmult: 0, ds: 0, maxds: 0, dsmult: 0, cb: 0, cbe: 0, pierce: 0 });
    Object.assign(b.buf, { fana: 0, fanaSelf: true });
    b.o.on = false;
    b.m = {};
    for (const [k, v] of Object.entries(set)) Object.assign(b[k], v);
    return b;
  }
  const PRESETS = [
    ["zeal", "Zeal Paladin, Death Cleaver Berserker Axe", () => presetBuild("Zeal", "pal", {
      c: { str: 204, dex: 164, lvl: 91 },
      w: { cat: "axe1", code: "7wa", eth: false, hand: "d1", ed: 435, min: 28, max: 0, ias: 40, ds: 40, dsmult: 50, tdef: 33 },
      g: { ias: 20, ed: 193, min: 1, max: 5, ds: 35, dsmult: 25, cb: 15, ar: 467, arp: 10 },
      s: { k: "zeal", lvl: 27, syn: { Sacrifice: 20 } },
      buf: { fana: 25, fanaSelf: true },
    })],
    ["sacrifice", "Sacrifice Paladin, Schaefer's Hammer Legendary Mallet", () => presetBuild("Sacrifice", "pal", {
      c: { str: 219, dex: 164, lvl: 90 },
      w: { cat: "ham1", code: "7wh", eth: false, hand: "d1", ed: 255, min: 0, max: 182, ias: 55, ar: 736 },
      g: { ias: 20, ed: 278, min: 7, max: 4, ds: 19, cb: 4, ar: 344, arp: 118 },
      s: { k: "sacrifice", lvl: 28, syn: { Fanaticism: 20, Redemption: 20 } },
      buf: { fana: 26, fanaSelf: true },
    })],
    ["frenzy", "Frenzy Barbarian, Doombringer Champion Sword and The Grandfather Colossus Blade", () => presetBuild("Frenzy", "bar", {
      c: { str: 238, dex: 141, lvl: 90 },
      w: { cat: "swd2", code: "7b7", eth: false, hand: "d1", ed: 285, min: 120, max: 150, ias: 0, arp: 40 },
      o: { on: true, cat: "swd2", code: "7gd", eth: false, hand: "d1", ed: 369, min: 0, max: 228, ias: 0, arp: 50 },
      g: { ias: 20, ed: 68, min: 0, max: 4, ds: 22, cb: 15, ar: 358 },
      s: { k: "frenzy", lvl: 27, syn: { "Double Swing": 20, Stun: 20 } },
      m: { 128: 20 },
      aur: { bc: 10 },
      buf: { frenzy: 27, stacks: 5, incHard: 1 },
    })],
    ["dthrow", "Double Throw Barbarian, two Warshrike Winged Knives", () => presetBuild("Double Throw", "bar", {
      c: { str: 200, dex: 194, lvl: 90 },
      w: { cat: "tkni", code: "7bk", eth: false, hand: "d1", ed: 430, min: 0, max: 0, ias: 30, crit: 30, cmult: 31 },
      o: { on: true, cat: "tkni", code: "7bk", eth: false, hand: "d1", ed: 455, min: 0, max: 0, ias: 30, crit: 31, cmult: 30 },
      g: { ias: 30, ed: 212, min: 8, max: 13, cb: 15, ar: 374, arp: 49 },
      s: { k: "doublethrow", lvl: 26, syn: { "Double Swing": 20, Frenzy: 20 } },
      m: { 135: 25 },
      aur: { might: 18, mightSelf: false, bc: 13 },
      buf: { incHard: 1 },
    })],
    ["ww", "Whirlwind Barbarian, Immortal King's Stone Crusher Ogre Maul", () => presetBuild("Whirlwind", "bar", {
      c: { str: 259, dex: 127, lvl: 88 },
      w: { cat: "ham2", code: "7m7", eth: false, hand: "d1", ed: 258, min: 0, max: 0, ias: 45, cb: 26, edd: 178, edu: 149 },
      g: { ias: 20, ed: 127, ar: 450 },
      s: { k: "whirlwind", lvl: 25, syn: {} },
      m: { 134: 20 },
      aur: { might: 18, mightSelf: false, bc: 24 },
      buf: { incHard: 1 },
    })],
    ["fury", "Fury Druid as a werewolf, Tomb Reaver Cryptic Axe", () => presetBuild("Fury", "dru", {
      c: { str: 228, dex: 111, lvl: 89 },
      w: { cat: "pole", code: "7pa", eth: false, hand: "d1", ed: 394, min: 0, max: 0, ias: 155, aru: 299, edu: 189 },
      g: { ias: 10, ed: 130, ds: 39, cb: 15, ar: 400, arp: 121 },
      s: { k: "fury", lvl: 31, syn: { "Feral Rage": 20 } },
      aur: { wolv: 20 },
      buf: { were: 30, lyc: 32 },
    })],
    ["mshot", "Multiple Shot Amazon, Windforce Hydra Bow", () => presetBuild("Multiple Shot", "ama", {
      c: { str: 200, dex: 259, lvl: 91 },
      w: { cat: "bow", code: "6lw", eth: false, hand: "d1", ed: 460, min: 0, max: 188, ias: 40 },
      g: { ias: 50, ed: 261, min: 9, max: 39, ds: 41, cb: 25, ar: 588, edd: 93 },
      s: { k: "multishot", lvl: 24, syn: {} },
      m: { 9: 23, 23: 20, penLvl: 25 },
    })],
    ["strafe", "Strafe Amazon, Demon Machine Demon Crossbow", () => presetBuild("Strafe", "ama", {
      c: { str: 155, dex: 184, lvl: 85 },
      w: { cat: "xbow", code: "6rx", eth: false, hand: "d1", ed: 461, min: 0, max: 2, ias: 0, ar: 528 },
      g: { ias: 20, ed: 73, min: 4, max: 15, cb: 25, ar: 438, arp: 44 },
      s: { k: "strafe", lvl: 25, syn: {} },
      m: { 9: 21, 23: 20, penLvl: 23 },
    })],
    /* 2026-11-22 (kicks worked out): the most played Dragon Talon Assassins, characters level 80-99 with the skill at 20
       hard points and 7+ items equipped (213, softcore and hardcore), 171 of them with Astreon's Iron Ward: its median
       rolls (+116 damage, 40% deadly strike with its corruption, 33% crushing blow, +175% attack rating, 40 IAS), the
       rest of their gear's (15 / 51 flat damage, 15% crushing blow, 11% efficiency, 454 attack rating), Mirrored Boots
       (the base of 106 of them: War Traveler's), Dragon Talon 24 with Dragon Tail and Dragon Flight at 20, Burst of
       Speed 23 (20 hard points). Its enhanced damage (265, the middle of its roll) doesn't count for kicks. */
    ["dtalon", "Dragon Talon Assassin, Astreon's Iron Ward Caduceus", () => presetBuild("Dragon Talon", "ass", {
      c: { str: 224, dex: 156, lvl: 92 },
      w: { cat: "scep", code: "7ws", eth: false, hand: "d1", ed: 265, min: 0, max: 0, ias: 40, dmg: 116, ds: 40, cb: 33, arp: 175 },
      g: { ias: 0, ed: 0, min: 15, max: 51, cb: 15, cbe: 11, ar: 454 },
      s: { k: "dragontalon", lvl: 24, syn: { "Dragon Tail": 20, "Dragon Flight": 20 } },
      k: { boots: "utb", kd: 0 },
      buf: { bos: 23, bosHard: 20 },
    })],
    ["jab", "Jab Amazon, Stoneraven Matriarchal Spear", () => presetBuild("Jab", "ama", {
      c: { str: 162, dex: 177, lvl: 90 },
      w: { cat: "aspe", code: "amd", eth: false, hand: "d1", ed: 437, min: 0, max: 0, ias: 115 },
      g: { ias: 40, ed: 78, ar: 399 },
      s: { k: "jab", lvl: 30, syn: { Fend: 20 } },
      m: { 19: 30, 9: 14, 23: 20, penLvl: 24 },
    })],
    /* 2026-11-25 (the author: "median builds from pd2.tools for the most played new ones"): Season 14 characters level
       80-99 with the skill at 20 hard points and 7+ items equipped, softcore and hardcore (three random pages of 50 of
       each mode on pd2.tools), each read by this page's own armory loader as a load does; of those it loads with that
       attack, the holders of the most used weapon (both hands for the Assassins): Lightning Fury 154 of 207 with
       Thunderstroke, Fists of Fire 28 of 118 with Firelizard's Talons and Jade Talon, Rabies 78 of 229 with Plague
       Bearer, Blades of Ice 52 of 148 with Natalya's Mark and Whispering Mirage, Vengeance 131 of 209 with Lightsabre,
       Immolation Arrow 49 of 143 with Blood Raven's Charge. Each field the median of theirs (a min / max pair and
       poison's seconds from one character, the one at the median maximum, so they stay a pair); an aura or buff only
       when more than half have it. Their elemental damage, skill damage and -% resistances are in. The same day, once
       their damage was worked out: Smite 50 of 145 with Herald of Zakarum (grouped by the shield: its damage is Smite's;
       Astreon's Iron Ward the weapon most of them hold) and Dragon Tail 141 of 161 with Astreon's Iron Ward; Blade
       Sentinel 31 of 92 with Natalya's Mark and Whispering Mirage (90 of the 92 with Venom: 125 more who max Blade Fury
       too load as it; 2026-11-26, Blade Sentinel first: 38 of 217 with them, 177 of the 179 who max Blade Fury loading as
       Blade Sentinel), Blade Fury 20 of 178 with Warshrike (2026-11-25, once theirs were worked out), Cobra Strike
       27 of 139 with Natalya's Mark and Whispering Mirage (Venom 35) */
    ["lightningfury", "Lightning Fury Amazon, Thunderstroke Matriarchal Javelin", () => presetBuild("Lightning Fury", "ama", { c: { dex: 167, lvl: 87, str: 164 }, w: { cat: "ajav", code: "amf", ed: 227, eth: false, hand: "d1", ias: 30, lmax: 511, lmin: 1, max: 0, min: 0 }, g: { ar: 194, cmax: 15, cmin: 6, ias: 25, lm: 15, lmax: 227, lmin: 9, lp: 27, max: 3 }, s: { k: "lightningfury", lvl: 37, syn: { "Lightning bolt": 20, "Power Strike": 20 } }, m: { "19": 5, "23": 1, "9": 7, penLvl: 5 }, buf: { stacks: 5 } })],
    ["fof", "Fists of Fire Assassin, Firelizard's Talons Feral Claws and Jade Talon Wrist Sword", () => presetBuild("Fists of Fire", "ass", { c: { dex: 130, lvl: 89, str: 161 }, w: { cat: "claw", code: "7lw", ed: 259, eth: false, fmax: 480, fmin: 236, hand: "d1", ias: 15, max: 0, min: 0 }, o: { cat: "claw", code: "7wb", ed: 291, eth: false, hand: "d1", ias: 0, main: "r", max: 0, min: 0, on: true }, g: { ar: 231, cmax: 22, cmin: 6, fm: 18, fmax: 66, fmin: 24, fp: 31, ias: 20, max: 1, pmax: 3, pmin: 3, psec: 2, min: 9 }, s: { k: "fof", lvl: 44, syn: { "Dragon Flight": 20, "Tiger Strike": 20 } }, m: { "252": 25 }, buf: { bos: 13, bosHard: 2, stacks: 5 } })],
    ["rabies", "Rabies Druid as a werewolf, Plague Bearer Rune Sword", () => presetBuild("Rabies", "dru", { c: { dex: 179, lvl: 91, str: 186 }, w: { cat: "swd1", code: "9ls", ed: 205, eth: false, hand: "d1", ias: 30, max: 45, min: 10, pmax: 319, pmin: 318, psec: 2.33 }, g: { ar: 145, arp: 20, cmax: 9, cmin: 5, max: 1, pm: 34, pmax: 110, pmin: 110, pp: 20, psec: 2 }, s: { k: "rabies", lvl: 43, syn: { "Feral Rage": 20, "Plague Poppy": 20, "Shape Shifting": 20 } }, aur: { wolv: 8 }, buf: { lyc: 38, stacks: 5, were: 20 } })],
    ["boi", "Blades of Ice Assassin, Natalya's Mark Scissors Suwayyah and Whispering Mirage War Fist", () => presetBuild("Blades of Ice", "ass", { c: { dex: 129, lvl: 88, str: 152 }, w: { cat: "claw", cmax: 226, cmin: 198, code: "7qr", ed: 182, edd: 147, edu: 155, eth: false, fmax: 136, fmin: 96, hand: "d1", ias: 40, max: 0, min: 0 }, o: { cat: "claw", cmax: 114, cmin: 72, code: "7xf", ed: 193, edu: 224, eth: false, hand: "d1", ias: 0, main: "r", max: 0, min: 0, on: true }, g: { ar: 218, cm: 25, cmax: 111, cmin: 54, cp: 23, ias: 20, itd: true }, s: { k: "boi", lvl: 40, syn: { "Tiger Strike": 20 } }, m: { "252": 24 }, buf: { bos: 16, bosHard: 4, stacks: 5 } })],
    ["vengeance", "Vengeance Paladin, Lightsabre Phase Blade", () => presetBuild("Vengeance", "pal", { c: { dex: 148, lvl: 90, str: 169 }, w: { cat: "swd1", code: "7cr", ed: 206, eth: false, hand: "d1", ias: 20, itd: true, lmax: 799, lmin: 2, max: 30, min: 10, mmax: 120, mmin: 60 }, g: { ar: 193, cmax: 105, cmin: 49, cp: 12, ds: 22, fm: 16, fmax: 421, fmin: 240, fp: 13, ias: 25, lm: 12, lmax: 790, lmin: 10, lp: 18, min: 13 }, s: { k: "vengeance", lvl: 27, syn: { Conviction: 20, "Holy Fire": 17, "Holy Freeze": 16, "Holy Shock": 20 } }, buf: { holy: "shock", holyLvl: 27, stacks: 5 } })],
    ["immolationarrow", "Immolation Arrow Amazon, Blood Raven's Charge Matriarchal Bow", () => presetBuild("Immolation Arrow", "ama", { c: { dex: 198, lvl: 91, str: 116 }, w: { arp: 263, cat: "abow", code: "amb", ed: 295, eth: false, fmax: 180, fmin: 68, hand: "d1", ias: 0, max: 0, min: 0 }, g: { ar: 121, cmax: 5, cmin: 2, cp: 12, fm: 35, fmax: 180, fmin: 68, fp: 46, ias: 47, lmax: 5, lmin: 1, lp: 12, max: 18, pmax: 639, pmin: 539, pp: 21, psec: 2 }, s: { k: "immolationarrow", lvl: 43, syn: { "Exploding Arrow": 1, "Fire Arrow": 20, "Magic Arrow": 20 } }, m: { "23": 1, "9": 12, penLvl: 12 }, buf: { stacks: 5 } })],
    ["bladesentinel", "Blade Sentinel Assassin, Natalya's Mark Scissors Suwayyah and Whispering Mirage War Fist", () => presetBuild("Blade Sentinel", "ass", { c: { dex: 138, lvl: 88, str: 161 }, w: { cat: "claw", cmax: 150, cmin: 150, code: "7qr", ed: 178, edd: 139, edu: 155, eth: false, fmax: 136, fmin: 96, hand: "d1", ias: 40, max: 0, min: 0 }, o: { cat: "claw", code: "7xf", ed: 194, edu: 226, eth: false, hand: "d1", ias: 0, main: "r", max: 0, min: 0, on: true }, g: { ar: 165, cb: 7, cmax: 11, cmin: 5, fcr: 10, itd: true, lmax: 7, lmin: 1, max: 1, pm: 16, pmax: 3, pmin: 3, psec: 2, min: 10 }, s: { k: "bladesentinel", lvl: 28, syn: { "Blade Fury": 1, "Blade Shield": 1 } }, m: { "252": 28 }, buf: { bos: 16, bosHard: 1, stacks: 5, venom: 34, venomSyn: 20 }, sm: { shield: "pab" }, k: { boots: "xmb", kd: 30 } })],
    ["bladefury", "Blade Fury Assassin, Warshrike Winged Knife", () => presetBuild("Blade Fury", "ass", { c: { dex: 208, lvl: 93, str: 180 }, w: { cat: "tkni", cmult: 31, code: "7bk", crit: 30, ed: 464, eth: false, hand: "d1", ias: 30, max: 0, min: 0 }, g: { ar: 143, cb: 25, cmax: 3, cmin: 1, ed: 260, max: 25, min: 15, pierce: 14 }, s: { k: "bladefury", lvl: 33, syn: { "Blade Sentinel": 20, "Blade Shield": 20 } }, m: { "252": 25 }, buf: { bos: 13, bosHard: 8, stacks: 5 } })],
    ["cobra", "Cobra Strike Assassin, Natalya's Mark Scissors Suwayyah and Whispering Mirage War Fist", () => presetBuild("Cobra Strike", "ass", { c: { dex: 134, lvl: 87, str: 155 }, w: { cat: "claw", cmax: 150, cmin: 150, code: "7qr", ed: 179, edd: 164, edu: 138, eth: false, fmax: 136, fmin: 96, hand: "d1", ias: 40, max: 0, min: 0 }, o: { cat: "claw", code: "7xf", ed: 183, edu: 226, eth: false, hand: "d1", ias: 0, main: "r", max: 0, min: 0, on: true }, g: { ar: 185, cb: 6, cmax: 20, cmin: 11, fcr: 10, itd: true, pm: 20, pmax: 12, pmin: 12, pp: 8, psec: 2, min: 12 }, s: { k: "cobra", lvl: 28, syn: { Venom: 20 } }, m: { "252": 31 }, buf: { bos: 18, bosHard: 1, stacks: 5, venom: 35, venomSyn: 20 } })],
    ["smite", "Smite Paladin, Herald of Zakarum Zakarum Shield", () => presetBuild("Smite", "pal", { c: { dex: 126, lvl: 88, str: 193 }, w: { arp: 162, cat: "scep", cb: 33, code: "7ws", dmg: 104, ed: 271, eth: false, hand: "d1", ias: 40, max: 0, min: 0, mmax: 480, mmin: 160 }, g: { ar: 218, arp: 30, cb: 24, cmax: 45, cmin: 15, ed: 32, ias: 15, lmax: 4, lmin: 1, max: 2 }, s: { k: "smite", lvl: 35, syn: {} }, buf: { fana: 26, stacks: 5 }, sm: { def: 20, hs: 35, shield: "pae" } })],
    ["dragontail", "Dragon Tail Assassin, Astreon's Iron Ward Caduceus", () => presetBuild("Dragon Tail", "ass", { c: { dex: 163, lvl: 92, str: 225 }, w: { arp: 174, cat: "scep", cb: 33, code: "7ws", dmg: 116, ds: 60, ed: 271, eth: false, hand: "d1", ias: 40, max: 0, min: 0, mmax: 480, mmin: 160 }, g: { ar: 498, cb: 15, cbe: 11, cmax: 5, cmin: 2, ed: 717, fmax: 5, fmin: 2, fp: 38, max: 63, min: 15 }, s: { k: "dragontail", lvl: 26, syn: { "Dragon Flight": 20, "Dragon Talon": 20 } }, m: { "252": 5 }, aur: { bc: 8 }, buf: { bos: 23, bosHard: 20, stacks: 5 }, k: { boots: "utb" } })],
    // Fist of the Heavens (2026-11-25): the median of 246 FoH Paladins (pd2.tools, level 80-99, the skill at base 20, 7+
    // items worn, softcore 125 and hardcore 121): level 33 with + skills, 20 points in each synergy, 118% faster cast rate,
    // +4% magic skill damage (no lightning skill damage or -% enemy lightning resistance at the median); a spell uses
    // no weapon (their most held: Hand of Blessed Light 58, Heart of the Oak 42, Griswold's Redemption 38)
    ["foh", "Fist of the Heavens Paladin", () => presetBuild("Fist of the Heavens", "pal", { c: { dex: 115, lvl: 89, str: 137 }, g: { fcr: 118, mm: 4 }, s: { k: "foh", lvl: 33, syn: { "Holy Bolt": 20, "Holy Light": 20, "Holy Nova": 20 } } })],
    /* the Sorceress's spells (2026-11-25): the medians of the Sorceresses loaded as each skill through this page's own
       armory fill (pd2.tools, level 80-99, the skill at base 20, 7+ items worn, softcore and hardcore sampled alike):
       the skill's level with + skills, its synergies' points, faster cast rate, the skill damage and -% enemy
       resistance of its element, and the element's mastery at its level. Frozen Orb 228 of them (most held: Death's
       Fathom 78, Tal Rasha's Lidless Eye 43, The Oculus 31), Chain Lightning 245 (Skyfall 58, Tal Rasha's Lidless Eye
       43, Eschuta's Temper 36), Fire Ball 92 (Eschuta's Temper 32, Embersworn 13), Meteor 238 (Brimstone Rain 74, Tal
       Rasha's Lidless Eye 47), Blizzard 161 (Death's Fathom 45, Tal Rasha's Lidless Eye 33) */
    ["frozenorb", "Frozen Orb Sorceress", () => presetBuild("Frozen Orb", "sor", { c: { dex: 55, lvl: 88, str: 145 }, g: { fcr: 119, cm: 18, cp: 6 }, s: { k: "frozenorb", lvl: 35, syn: { "Frost Nova": 20, "Ice Bolt": 20 } }, m: { 65: 34 } })],
    ["chainlightning", "Chain Lightning Sorceress", () => presetBuild("Chain Lightning", "sor", { c: { dex: 52, lvl: 87, str: 130 }, g: { fcr: 125, lm: 15, lp: 19 }, s: { k: "chainlightning", lvl: 36, syn: { "Charged Bolt": 20, Lightning: 20 } }, m: { 63: 36 } })],
    ["fireball", "Fire Ball Sorceress", () => presetBuild("Fire Ball", "sor", { c: { dex: 38, lvl: 89, str: 122 }, g: { fcr: 120, fm: 26, fp: 15 }, s: { k: "fireball", lvl: 39, syn: { Combustion: 20, "Fire Bolt": 20 } }, m: { 61: 39 } })],
    ["meteor", "Meteor Sorceress", () => presetBuild("Meteor", "sor", { c: { dex: 49, lvl: 89, str: 124 }, g: { fcr: 115, fm: 6 }, s: { k: "meteor", lvl: 37, syn: { Blaze: 20, "Fire Ball": 20, Inferno: 20 } }, m: { 61: 36 } })],
    ["blizzard", "Blizzard Sorceress", () => presetBuild("Blizzard", "sor", { c: { dex: 51, lvl: 87, str: 138 }, g: { fcr: 106, cm: 15 }, s: { k: "blizzard", lvl: 32, syn: { "Ice Blast": 20, "Ice Bolt": 20 } }, m: { 65: 33 } })],
    // Hydra (2026-11-25): the median of 152 Hydra Sorceresses (most held: Eschuta's Temper 47, Embersworn 29)
    ["hydra", "Hydra Sorceress", () => presetBuild("Hydra", "sor", { c: { dex: 45, lvl: 86, str: 122 }, g: { fcr: 100, fm: 10 }, s: { k: "hydra", lvl: 34, syn: { "Fire Bolt": 20, "Lesser Hydra": 20 } }, m: { 61: 33 } })],
    /* the Necromancer (2026-11-25): Poison Nova, the median of 150 (most held: Death's Web 97), Poison Strike and
       Desecrate at 20; Teeth, the median of 227 bone Necromancers (Teeth, Bone Spear and Bone Spirit maxed: they load as
       Teeth, the author's pick; most held: Boneshade), its level with + skills */
    ["poisonnova", "Poison Nova Necromancer", () => presetBuild("Poison Nova", "nec", { c: { dex: 49, lvl: 86, str: 125 }, g: { fcr: 75, pm: 25, pp: 41 }, s: { k: "poisonnova", lvl: 36, syn: { Desecrate: 20, "Poison Dagger": 20 } } })],
    ["teeth", "Teeth Necromancer", () => presetBuild("Teeth", "nec", { c: { dex: 45, lvl: 90, str: 112 }, g: { fcr: 125, mm: 26 }, s: { k: "teeth", lvl: 42, syn: { "Bone Armor": 20, "Bone Spear": 20, "Bone Spirit": 20 } } })],
    // Dark Pact (2026-11-25): the median of 112 Dark Pact Necromancers, Curse Mastery and Iron Maiden at 20, their three
    // strongest curses at their median levels with + skills (Decrepify 33, Amplify Damage 26, Lower Resist 23)
    ["darkpact", "Dark Pact Necromancer", () => presetBuild("Dark Pact", "nec", { c: { dex: 41, lvl: 90, str: 124 }, g: { fcr: 125, mm: 11 }, s: { k: "darkpact", lvl: 44, syn: { CurMas: 20, "Iron Maiden": 20, Decrepify: 13 } },
      deb: { curses: [{ c: "decrep", lvl: 33 }, { c: "amp", lvl: 26 }, { c: "lowres", lvl: 23 }], cm: 20 } })],
    // Poison Strike (2026-11-25): the median of the 40 Blackbog's Sharp holders among 104 dagger Necromancers loaded as
    // Poison Strike (Poison Strike, Desecrate and Bone Armor maxed)
    // Mind Blast (2026-11-25): the median of 263 Mind Blast Assassins (Psychic Hammer, Cloak of Shadows and Shadow Warrior
    // maxed; most held: Whispering Mirage 172, Shadow Killer 49)
    ["mindblast", "Mind Blast Assassin", () => presetBuild("Mind Blast", "ass", { c: { dex: 122, lvl: 90, str: 158 }, g: { fcr: 105 }, s: { k: "mindblast", lvl: 41, syn: { "Cloak of Shadows": 20, "Psychic Hammer": 20, "Shadow Warrior": 20 } } })],
    /* the traps: Chain Lightning Sentry and Wake of Fire, what trappers play (the author, 2026-11-26: "Trappers generally
       play Wake of Fire or chain lightning sentry. They use fire blast and shockwave as secondary skills"): the median of
       the 148 of 160 lightning trappers (Lightning Sentry, Chain Lightning Sentry, Charged Bolt Sentry and Fire Blast
       maxed) and the 207 of 217 fire trappers (Wake of Inferno, Wake of Fire and Fire Blast maxed; most held: Ghostflame
       103) who load as them; until 2026-11-26 Lightning Sentry and Wake of Inferno, the same characters */
    ["chainlightningsentry", "Chain Lightning Sentry Assassin", () => presetBuild("Chain Lightning Sentry", "ass", { c: { dex: 86, lvl: 85, str: 117 }, g: { ias: 20, fcr: 16, lm: 2 }, s: { k: "chainlightningsentry", lvl: 32, syn: { "Charged Bolt Sentry": 20, "Fire Trauma": 20, "Lightning Sentry": 20 } } })],
    ["wakeoffire", "Wake of Fire Assassin", () => presetBuild("Wake of Fire", "ass", { c: { dex: 125, lvl: 91, str: 139 }, g: { fcr: 20, fm: 31 }, s: { k: "wakeoffire", lvl: 40, syn: { "Fire Trauma": 20, "Inferno Sentry": 20 } } })],
    ["poisonstrike", "Poison Strike Necromancer, Blackbog's Sharp Cinquedeas", () => presetBuild("Poison Strike", "nec", { c: { dex: 98, lvl: 88, str: 116 }, w: { cat: "dag", code: "9kr", ds: 20, ed: 0, eth: false, hand: "d1", ias: 30, max: 45, min: 15, pmax: 100, pmin: 100, psec: 2 }, g: { ar: 132, fcr: 50, ias: 5, max: 3, pm: 17, pmax: 13, pmin: 13, pp: 25, psec: 2, min: 6 }, s: { k: "poisonstrike", lvl: 37, syn: { "Bone Armor": 20, Desecrate: 20 } }, buf: { stacks: 5 } })],
    // Tornado (2026-11-25): the median of 234 wind Druids (Tornado, Hurricane, Twister and Arctic Blast maxed; most held:
    // Horizon's Tornado 113)
    ["tornado", "Tornado Druid", () => presetBuild("Tornado", "dru", { c: { dex: 91, lvl: 89, str: 157 }, g: { fcr: 104 }, s: { k: "tornado", lvl: 37, syn: { "Arctic Blast": 20, Hurricane: 20, Twister: 20 } } })],
    // Volcano (2026-11-25, the author: "use volcano" for fire Druids, who max Molten Boulder, Volcano, Fissure and
    // Armageddon): the median of 176 loaded as Volcano (most held: Mang Song's Lesson 64, Earthshaker 47)
    ["volcano", "Volcano Druid", () => presetBuild("Volcano", "dru", { c: { dex: 42, lvl: 88, str: 169 }, g: { fcr: 102, fm: 8, fp: 28 }, s: { k: "volcano", lvl: 41, syn: { Armageddon: 20, Eruption: 20, "Molten Boulder": 20 } } })],
  ];

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ builds, target, mode, gear })); } catch (e) { /* storage blocked */ }
  }
  /* a share link holds only what differs from the defaults (2026-11-22, audit CALC-05: the whole builds made links of
     2,000-3,700 characters, longer than a Discord message): each build against DEFAULT_BUILD, the monster against
     DEFAULT_TARGET, as JSON in base64url after #b=; an object that lost a key is written whole, {"~": ...}; in Compare
     weapons the builds after A keep only their weapons (syncWeapons gives them A's character). #v= links (the whole
     builds, until then) still open. */
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  function diffOf(base, x) {
    const out = {};
    for (const k of Object.keys(x)) {
      const a = base ? base[k] : undefined, v = x[k];
      if (isObj(a) && isObj(v)) {
        if (Object.keys(a).some(q => !(q in v))) out[k] = { "~": v };
        else { const d = diffOf(a, v); if (Object.keys(d).length) out[k] = d; }
      } else if (JSON.stringify(a) !== JSON.stringify(v)) out[k] = v;
    }
    return out;
  }
  function withDiff(base, d) {
    const out = JSON.parse(JSON.stringify(base || {}));
    for (const [k, v] of Object.entries(d || {})) {
      if (isObj(v) && Object.keys(v).length === 1 && "~" in v) out[k] = v["~"];
      else if (isObj(v) && isObj(out[k])) out[k] = withDiff(out[k], v);
      else out[k] = v;
    }
    return out;
  }
  const b64u = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = t => decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/"))));
  function packState() {
    // Compare gear (o.m 2): build A and the items (o.g), the columns' builds are worked out from them
    const bs = mode === "gear" ? builds.slice(0, 1) : builds;
    const o = { b: bs.map((b, i) => diffOf(DEFAULT_BUILD(), mode === "weapons" && i ? Object.fromEntries(WEAPON_PARTS.map(k => [k, b[k]])) : Object.assign({}, b, { from: "" }))) };
    const t = diffOf(DEFAULT_TARGET(), target);
    if (Object.keys(t).length) o.t = t;
    if (mode === "weapons") o.m = 1;
    if (mode === "gear") { o.m = 2; o.g = { slot: gear.slot, items: gear.items.map(x => diffOf(GEAR_ITEM(), x)) }; }
    return b64u(JSON.stringify(o));
  }
  function unpackState(t) {
    const o = JSON.parse(unb64u(t)), ds = Array.isArray(o.b) ? o.b : [];
    const A = withDiff(DEFAULT_BUILD(), ds[0]), d = DEFAULT_BUILD();
    const base = i => (o.m === 1 && i ? Object.assign(JSON.parse(JSON.stringify(A)), Object.fromEntries(WEAPON_PARTS.map(k => [k, d[k]]))) : DEFAULT_BUILD());
    return { builds: ds.map((x, i) => withDiff(base(i), x)), target: withDiff(DEFAULT_TARGET(), o.t), mode: o.m === 2 ? "gear" : o.m ? "weapons" : "builds",
             gear: o.m === 2 && isObj(o.g) ? { slot: o.g.slot, items: (o.g.items || []).map(x => withDiff(GEAR_ITEM(), x)) } : null };
  }
  /* the tab a shared link opens ("&tab=fight" after its builds: the Fight's audit of 2026-11-27, CO-15, a link could
     share builds but not "watch my fight"), read with the builds and opened by tabFromHash */
  let linkTab = "", fightFromLink = false;
  function load() {
    const short = /[#&]b=([^&]+)/.exec(location.hash || "");
    const lt = /[#&]tab=(\w+)/.exec(location.hash || "");
    if (lt) linkTab = lt[1];
    if (short) {
      try {
        const v = unpackState(short[1]);
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* no history */ }
        return v;
      } catch (e) { /* a broken link */ }
    }
    const fromHash = /[#&]v=([^&]+)/.exec(location.hash || "");
    if (fromHash) {
      try {
        const v = JSON.parse(decodeURIComponent(escape(atob(fromHash[1]))));
        /* from here on the builds are kept in this browser, so the link's builds leave the address: a reload keeps
           the changes made since (until 2026-11-13 every reload went back to the link's builds) */
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* no history */ }
        return v;
      } catch (e) { /* a broken link */ }
    }
    try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; }
  }
  /* a build or monster kept before the curse lists (2026-11-24): its one curse becomes the list's row (a build's deb
     {curse, lvl, curmas, bc}; the monster's party curse T.curse at level T[T.curse], T.curmas) */
  function oldCurse(x) {
    // (a link's build is merged into today's defaults first, so an empty list beside an old curse is the old curse's)
    if (!isObj(x) || !isObj(x.deb) || !("curse" in x.deb) || (Array.isArray(x.deb.curses) && x.deb.curses.length)) return x;
    const d = x.deb, deb = { curses: CURSES[d.curse] && d.curse !== "other" && +d.lvl > 0 ? [{ c: d.curse, lvl: +d.lvl }] : [], cm: +d.curmas || 0, extra: 0, bc: +d.bc || 0 };
    return Object.assign({}, x, { deb });
  }
  function targetOf(x) {
    const t = Object.assign(DEFAULT_TARGET(), x || {});
    if (x && "curse" in x && !(Array.isArray(x.others) && x.others.length)) t.others = CURSES[x.curse] && x.curse !== "other" && +x[x.curse] > 0 ? [{ who: "party", c: x.curse, lvl: +x[x.curse], cm: +x.curmas || 0 }] : [];
    for (const k of ["curse", "amp", "decrep", "weaken", "attract", "lowres", "curmas"]) delete t[k];
    t.others = (Array.isArray(t.others) ? t.others : []).filter(isObj).slice(0, 3).map(r => (r.who === "a4" ? { who: "a4", mlvl: clamp(Math.round(+r.mlvl) || 98, MERCS.a4.lvl, 99) }
      : { who: "party", c: CURSES[r.c] ? r.c : "amp", lvl: num(r.lvl, 0, MAX_LVL), cm: num(r.cm, 0, 20) }));
    t.partyMax = clamp(Math.round(+t.partyMax) || 1, 1, 3);
    t.size = clamp(Math.round(+t.size), 0, 3) || 0;
    t.mods = (Array.isArray(t.mods) ? t.mods : []).filter((k, i, a) => UMODS.some(u => u[0] === k) && a.indexOf(k) === i).slice(0, 5);
    t.plr = num(t.plr, 0, 100);
    return t;
  }
  /* the names the examples and presets gave builds until 2026-11-22: a kept build with one is called after its class */
  const OLD_NAMES = ["Zealot", "Frenzy", "Zeal", "Sacrifice", "Double Throw", "Whirlwind", "Fury", "Multiple Shot", "Strafe", "Jab", "Dragon Talon"];
  function sanitize(x) {
    const d = DEFAULT_BUILD();
    const merge = (base, over) => { const o = Object.assign({}, base); for (const k of Object.keys(base)) if (over && over[k] !== undefined) o[k] = (base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) ? merge(base[k], over[k]) : over[k]; return o; };
    const b = merge(d, oldCurse(x) || {});
    b.m = Object.assign({}, (x && x.m) || {});
    b.s.syn = Object.assign({}, (x && x.s && x.s.syn) || {});
    for (const k of ["wvs", "wlv", "wsy"]) b.s[k] = Object.assign({}, (x && x.s && isObj(x.s[k]) && x.s[k]) || {});
    // Penetrate's base points are one field, the Amazon's (Strafe asked them twice, as a synergy too)
    if (b.s.syn.Penetrate !== undefined) { if (!(+b.m[23] > 0)) b.m[23] = +b.s.syn.Penetrate || 0; delete b.s.syn.Penetrate; }
    if (!CLS[b.cls]) b.cls = "pal";
    if (OLD_NAMES.includes(b.name)) b.name = "";
    if (!W[b.w.code]) b.w.code = "7cr";
    if (!W[b.o.code]) b.o.code = "7cr";
    if (!ATT[b.s.k]) b.s.k = "attack";
    // between cooldowns: the skills picked; a build kept before the rotations (one skill: s.wv, s.wvl) reads as one
    const rot0 = x && x.s ? (Array.isArray(x.s.rot) ? x.s.rot : x.s.wv ? [{ k: x.s.wv, lvl: x.s.wvl }] : []) : [];
    b.s.rot = rot0.filter(r => isObj(r) && ATT[r.k]).slice(0, 3).map(r => ({ k: r.k, lvl: num(r.lvl === undefined ? 20 : r.lvl, 1, MAX_LVL) }));
    b.deb.curses = (Array.isArray(b.deb.curses) ? b.deb.curses : []).filter(r => isObj(r) && CURSES[r.c]).slice(0, 3)
      .map(r => ({ c: r.c, lvl: num(r.lvl, 0, MAX_LVL) }));
    for (const k of ["cm", "extra", "bc"]) b.deb[k] = num(b.deb[k], 0, k === "cm" ? 20 : k === "extra" ? 3 : MAX_LVL);
    return b;
  }

  // ================================================================== building the inputs
  const num = (v, lo, hi) => { const n = Math.round(+v); return Number.isFinite(n) ? clamp(n, lo, hi) : lo; };
  function el(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  /* a field is a label, its input and a hint (empty or not): three rows of its line's grid, so a line's inputs stay
     level whatever their labels wrap to */
  let uid = 0;
  function numField(parent, label, get, set, lo, hi, opts) {
    const f = el("div", { class: "field" + (opts && opts.wide ? " wide" : ""), "data-path": opts && opts.path }, parent);
    const id = "dm-f" + (++uid);
    el("label", { for: id }, f, label);
    const i = el("input", { type: "number", id, min: lo, max: hi, step: 1 }, f);
    i.value = get();
    /* an empty or unreadable box keeps the last value, and on change the box shows the value used, kept within its
       field's range (2026-11-22, audit CALC-08: an empty monster life counted as 1, 9999 stayed in a box that used 100) */
    i.addEventListener("input", () => { if (i.value.trim() === "" || !Number.isFinite(+i.value)) return; set(num(i.value, lo, hi)); update(); });
    i.addEventListener("change", () => { if (String(get()) !== i.value) i.value = get(); });
    el("small", {}, f, (opts && opts.hint) || "");
    return i;
  }
  function selField(parent, label, options, get, set, opts) {
    const f = el("div", { class: "field" + (opts && opts.wide ? " wide" : "") + (opts && opts.full ? " full" : ""), "data-path": opts && opts.path }, parent);
    const id = "dm-f" + (++uid);
    el("label", { for: id }, f, label);
    const s = el("select", { id }, f);
    for (const o of options) {
      if (o.group) { const g = el("optgroup", { label: o.group }, s); for (const x of o.items) el("option", { value: x.value }, g, x.label); }
      else el("option", { value: o.value }, s, o.label);
    }
    s.value = get();
    s.addEventListener("change", () => { set(s.value); update(true); });
    el("small", {}, f, (opts && opts.hint) || "");
    return s;
  }
  /* a button in a field's place (the curse lists' ✕ and + Add), lined up with the boxes beside it: no label above it,
     its hint under it */
  function btnField(parent, text, aria, fn, opts) {
    const f = el("div", { class: "field" + (opts && opts.wide ? " wide" : "") }, parent);
    el("span", { class: "lab", "aria-hidden": "true" }, f, "");
    const b = el("button", { type: "button", class: opts && opts.cls, "aria-label": aria || undefined, "data-focus": opts && opts.focus }, f, text);
    b.addEventListener("click", fn);
    el("small", {}, f, (opts && opts.hint) || "");
    return b;
  }
  function checkField(parent, label, get, set, opts) {
    const f = el("div", { class: "field" + (opts && opts.wide ? " wide" : ""), "data-path": opts && opts.path }, parent);
    const title = (opts && opts.title) || "";
    el("span", { class: "lab", "aria-hidden": "true" }, f, title);
    const l = el("label", { class: "check" }, f);
    const off = !!(opts && opts.disabled);
    const c = el("input", { type: "checkbox", disabled: off, "aria-label": title ? `${title}: ${label}` : undefined }, l);
    c.checked = !off && !!get();
    l.append(" " + label);
    c.addEventListener("change", () => { set(c.checked); update(true); });
    el("small", {}, f, (opts && opts.hint) || "");
    return c;
  }
  /* a base's damage in its list: one range, or both where it is held in one hand or two ("31–81, two hands 73–144";
     2026-11-22, audit CALC-18: Ohm vs Jewel showed a Colossus Blade's two-handed range, this page its one-handed) */
  function baseDamage(w) {
    const r = d => `${d[0]}–${d[1]}`;
    if (w.d1 && w.d2) return `${r(w.d1)}, two hands ${r(w.d2)}`;
    return r(w.d1 || w.d2 || w.dt);
  }
  function weaponOptions(cat) {
    const out = [];
    for (const t of ["N", "X", "E"]) {
      const ws = DATA.weapons.filter(w => w.cat === cat && w.tier === t);
      if (ws.length) out.push({ group: TIER[t], items: ws.map(w => ({ value: w.code, label: `${w.name} (${baseDamage(w)})` })) });
    }
    return out;
  }
  function catOptions(cls) {
    return DATA.cats.filter(c => DATA.weapons.some(w => w.cat === c.key)).map(c => ({ value: c.key, label: c.label }));
  }
  function attacksFor(cls) {
    return DATA.attacks.filter(a => !a.cls || a.cls === cls);
  }
  const SECTIONS_OPEN = { char: true, weapon: true, off: false, gear: false, skill: true, aura: false, deb: false, wmore: false, omore: false,
    wel: false, oel: false, gel: false };

  /* "Paste a weapon from the game" (2026-11-23, the author: "Ctrl + C in game and paste the result into a field to
     'import' the stats of the weapon quickly"). Ctrl+C on an item in game puts it on the clipboard as JSON: its base
     ("type"), isEthereal, quality, name / runeword, what is socketed ("socketed", each by its name) and its stats, each
     with its ItemStatCost number (stat_id; Strength's, 0, is left out) and its stored value (a per-level stat's too:
     Schaefer's Hammer's 16 is 2 maximum damage a level). Read from the author's three copies (a rare, a superior
     Infinity, a unique):
     - a property of two or more stats is listed without a number, at the item's whole value ("% Enhanced Damage"
       beside stats 17 / 18): on a unique both are its 252; on a superior Infinity the line is 281 and stats 17 / 18
       are 17, the superior base's part of it (the author, 2026-11-23: its tooltip reads +281% and 163-861, an
       ethereal Ogre Axe's 43-226 at 281%). So a stat listed twice counts once, at its larger value (the whole);
     - what is socketed is never in the item's stats: a jewel comes with its own (the rare Hyperion Spear: 284 on the
       spear, 29 on its jewel; its tooltip +313% and 227-768), a rune or gem without them (the Infinity's two Ber, 40%
       crushing blow, are on no line), so its weapon stats come from DATA.sock (calc_data.py). */
  // the weapon field a stat fills, and a per-level stat's shift: it counts value x character level / 2^shift,
  // rounded down (ItemStatCost's op 2 and 4 with their op param)
  const ITEM_STAT = { 93: ["ias"], 111: ["dmg"], 141: ["ds"], 250: ["ds", 3], 257: ["dsmult"], 258: ["crit"], 256: ["cmult"],
    136: ["cb"], 247: ["cb", 3], 19: ["ar"], 224: ["ar", 1], 119: ["arp"], 225: ["arp", 1], 116: ["tdef"], 115: ["itd"],
    123: ["ard"], 245: ["ard", 1], 124: ["aru"], 246: ["aru", 1], 121: ["edd"], 243: ["edd", 3], 122: ["edu"], 244: ["edu", 3],
    218: ["max", 3] };
  // minimum / maximum damage: one-hand, two-hand and throw (the same "+X to Minimum Damage" sets all three)
  const MIN_IDS = [21, 23, 159], MAX_IDS = [22, 24, 160];
  // the weapon fields' ranges, as their boxes
  const WEAPON_MAX = { fmin: 100000, fmax: 100000, lmin: 100000, lmax: 100000, cmin: 100000, cmax: 100000, mmin: 100000, mmax: 100000,
    pmin: 100000, pmax: 100000,
    ed: 2000, min: 999, max: 999, ias: 200, dmg: 999, ds: 200, dsmult: 500, crit: 100, cmult: 500, cb: 100,
    ar: 50000, arp: 5000, tdef: 200, ard: 50000, aru: 50000, edd: 5000, edu: 5000 };
  const SOCK = Object.fromEntries(Object.entries(DATA.sock || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const BASE_BY_NAME = Object.fromEntries(DATA.weapons.map(w => [w.name.toLowerCase(), w]));
  // the last paste: { b, part ("w" or "o"), was, wname, text } (its note and Undo under the paste box) or { b, part, err }
  let pasted = null;
  const noColor = t => String(t || "").replace(/(?:Ã¿|ÿ)c./g, "").trim();
  /* a weapon's fields from its stats by ItemStatCost id (sum): enhanced damage, flat damage, IAS and its own stats
     (WEAPON_STATS), each clamped to its box; a per-level stat at level lvl. The game's copy (per-level stats raw, by
     their own ids) and the armory's (javascripts/armory.js: per-level stats already worked out into the stats they
     add to, sockets already in) go through it alike */
  function weaponFieldsOf(sum, lvl) {
    const f = Object.assign({ ed: 0, min: 0, max: 0, ias: 0 }, WEAPON_STATS());
    let perLvl = false;
    const per = (v, sh) => Math.floor(v * lvl / (1 << sh));
    f.ed = Math.min(sum[17] || 0, sum[18] || 0);
    f.min = Math.max(0, ...MIN_IDS.map(i => sum[i] || 0));
    f.max = Math.max(0, ...MAX_IDS.map(i => sum[i] || 0));
    for (const [id, [k, sh]] of Object.entries(ITEM_STAT)) {
      const v = sum[id];
      if (!v) continue;
      if (k === "itd") f.itd = true;
      else if (sh) { f[k] += per(v, sh); perLvl = true; }
      else f[k] += k === "tdef" ? Math.abs(v) : v;
    }
    Object.assign(f, elemFieldsOf(sum));
    for (const k of Object.keys(WEAPON_MAX)) f[k] = clamp(Math.round(f[k]) || 0, 0, WEAPON_MAX[k]);
    return { f, perLvl };
  }
  /* elemental damage fields from stats as the game holds them (2026-11-24): fire 48 / 49, lightning 50 / 51, magic 52 /
     53, cold 54 / 55 min / max; poison 57 / 58 a frame's in 256ths for 59 frames, several poison sources' lengths
     averaged (326, poison_count, as the game's damage fill divides it): the fields hold its damage over its length */
  function elemFieldsOf(sum) {
    const f = ELEM_FLAT();
    for (const [k, lo, hi] of [["f", 48, 49], ["l", 50, 51], ["c", 54, 55], ["m", 52, 53]]) { f[k + "min"] = sum[lo] || 0; f[k + "max"] = sum[hi] || 0; }
    const len = (sum[59] || 0) / Math.max(1, sum[326] || 1);
    if (len > 0 && (sum[58] || 0) > 0) {
      f.pmin = Math.floor((sum[57] || 0) * len / 256); f.pmax = Math.floor(sum[58] * len / 256); f.psec = Math.round(len / 25 * 100) / 100;
    }
    return f;
  }
  /* Other gear's fields from the stats of everything but the weapons (the armory's: armor, jewelry, shield, charms,
     set bonuses; per-level stats already at the character's level): their enhanced damage is the off-weapon kind */
  const GEAR_STAT = { 93: "ias", 258: "crit", 256: "cmult", 141: "ds", 210: "maxds", 257: "dsmult", 136: "cb", 268: "cbe",
    425: "pierce", 19: "ar", 119: "arp", 116: "tdef", 123: "ard", 124: "aru", 121: "edd", 122: "edu", 156: "pc" };
  const GEAR_MAX = { ias: 400, ed: 2000, min: 999, max: 999, crit: 100, cmult: 500, ds: 200, maxds: 50, dsmult: 500, cb: 100,
    cbe: 500, pierce: 100, ar: 50000, arp: 5000, tdef: 200, ard: 50000, aru: 50000, edd: 5000, edu: 5000, pc: 100 };
  function gearFieldsOf(st) {
    const g = { itd: !!st[115], ed: Math.min(st[17] || 0, st[18] || 0) };
    g.min = Math.max(0, ...MIN_IDS.map(i => st[i] || 0));
    g.max = Math.max(0, ...MAX_IDS.map(i => st[i] || 0));
    for (const [id, k] of Object.entries(GEAR_STAT)) g[k] = k === "tdef" || k === "pierce" ? Math.abs(st[id] || 0) : st[id] || 0;
    for (const k of Object.keys(GEAR_MAX)) g[k] = clamp(Math.round(g[k]) || 0, 0, GEAR_MAX[k]);
    return Object.assign(g, elemFieldsOf(st));
  }
  /* an item copied in game, read: its base, ethereal, the weapon fields it fills, and what it has that they don't (or
     { err }); lvl: the character's level (per-level stats), atk: the attack's name (a single skill's + counts for it) */
  function readItem(text, lvl, atk) {
    let it = null;
    try { it = JSON.parse(String(text).trim()); } catch (e) { /* not an item */ }
    if (!isObj(it) || typeof it.type !== "string") return { err: "That isn’t an item copied in game: hover over the weapon in game, press Ctrl+C, then paste it here." };
    const w = BASE_BY_NAME[noColor(it.type).toLowerCase()];
    if (!w) return { err: `${noColor(it.type)} isn’t a weapon this calculator has.` };
    const sum = {}, add = (id, v) => { sum[id] = (sum[id] || 0) + v; };
    // the item's own stats: one value each, the larger where a stat is listed twice (its whole and a part of it)
    const mine = {}, put = (id, v) => { if (!(id in mine) || Math.abs(v) > Math.abs(mine[id])) mine[id] = v; };
    const own = (Array.isArray(it.stats) ? it.stats : []).filter(isObj);
    const lines = [];   // lines without a stat number: chance to cast, auras, skills
    for (const s of own) {
      const v = Math.trunc(+s.value) || 0, name = noColor(s.name);
      if (Number.isInteger(s.stat_id)) { put(s.stat_id, v); if ([83, 107, 127, 188].includes(s.stat_id)) lines.push(s); continue; }
      const elem = /fire|cold|lightning|poison|magic/i.test(name);
      if (/^\+?\d*\s*to strength$/i.test(name)) put(0, v);   // stat 0 comes without its number
      else if (/enhanced damage/i.test(name) && !/maximum|minimum/i.test(name)) { put(17, v); put(18, v); }
      else if (!elem && /minimum damage/i.test(name)) MIN_IDS.forEach(id => put(id, v));
      else if (!elem && /maximum damage/i.test(name)) MAX_IDS.forEach(id => put(id, v));
      else lines.push(s);
    }
    for (const [id, v] of Object.entries(mine)) add(+id, v);
    if (mine[59] > 0) add(326, 1);   // a poison source (the game averages their lengths)
    // what is socketed in it
    const socks = [], off = [];
    for (const s of (Array.isArray(it.socketed) ? it.socketed : []).filter(isObj)) {
      const name = noColor(s.type || s.name) || "?";
      socks.push(SOCK[name.toLowerCase()] ? name : noColor(s.name) || name);   // a jewel by its own name
      const st = (Array.isArray(s.stats) ? s.stats : []).filter(x => isObj(x) && Number.isInteger(x.stat_id));
      const got = st.length ? st.map(x => [x.stat_id, Math.trunc(+x.value) || 0]) : SOCK[name.toLowerCase()] || null;
      if (got) { got.forEach(([id, v]) => add(id, v)); if (got.some(([id, v]) => id === 59 && v > 0)) add(326, 1); }
      else off.push(`what the ${name} in it adds`);
    }
    const { f, perLvl } = weaponFieldsOf(sum, lvl);
    const per = (v, sh) => Math.floor(v * lvl / (1 << sh));
    // what the game counts that the weapon's fields don't hold, with where it goes when there is a field for it
    const n = v => nf0.format(v);
    const str = (sum[0] || 0) + per(sum[220] || 0, 3), dex = (sum[2] || 0) + per(sum[221] || 0, 3);
    if (str) off.push(`+${n(str)} to Strength (your character’s Strength)`);
    if (dex) off.push(`+${n(dex)} to Dexterity (your character’s Dexterity)`);
    for (const [m, e] of [[329, "fire"], [330, "lightning"], [331, "cold"], [332, "poison"], [357, "magic"]]) if (sum[m]) off.push(`+${n(sum[m])}% to ${e} skill damage (Other gear)`);
    for (const [m, e] of [[333, "fire"], [334, "lightning"], [335, "cold"], [336, "poison"]]) if (sum[m]) off.push(`−${n(Math.abs(sum[m]))}% to enemy ${e} resistance (Other gear)`);
    if ((sum[17] || 0) > f.ed) off.push(`+${n(sum[17] - f.ed)}% enhanced maximum damage`);
    if ((sum[18] || 0) > f.ed) off.push(`+${n(sum[18] - f.ed)}% enhanced minimum damage`);
    if (sum[219]) off.push("enhanced maximum damage per level");
    if (sum[135] || sum[248]) off.push(`${n((sum[135] || 0) + per(sum[248] || 0, 3))}% chance of open wounds`);
    if (sum[210]) off.push(`+${n(sum[210])}% maximum deadly strike (Other gear)`);
    if (sum[268]) off.push(`+${n(sum[268])}% crushing blow efficiency (Other gear)`);
    if (sum[425]) off.push(`−${n(Math.abs(sum[425]))}% to enemy physical resistance (Other gear)`);
    for (const s of lines) {
      const name = noColor(s.name), v = Math.trunc(+s.value) || 0;
      const text = /^[+\-\d]/.test(name) ? name : `${v >= 0 ? "+" : "−"}${n(Math.abs(v))} ${name}`;
      if (s.chance !== undefined || /chance to cast/i.test(name)) off.push(name.replace(/ Chance to cast /i, " chance to cast "));
      else if (/aura when equipped/i.test(name)) {
        const m = /level (\d+) (.+?) aura/i.exec(name), aura = m ? m[2] : "";
        const where = /conviction/i.test(aura) ? " (the monster’s Conviction)" : /^(might|concentration|fanaticism)$/i.test(aura) ? " (Auras and buffs)" : "";
        off.push(m ? `level ${m[1]} ${aura} aura${where}` : name);
      } else if (s.stat_id !== undefined && s.stat_id !== 107) off.push(`${text} (the attack’s skill level)`);
      else if (s.skill !== undefined || s.stat_id === 107) { if (atk && String(s.skill || name).toLowerCase().includes(atk.toLowerCase())) off.push(`${text} (the attack’s skill level)`); }
    }
    const label = noColor((it.isRuneword && it.runeword) || it.name) || w.name;
    return { w, eth: !!it.isEthereal && !!w.eth, f, perLvl, socks, off, label };
  }
  /* what a paste filled in, and what the weapon has that the calculator counts elsewhere or not at all */
  function pasteText(r, lvl) {
    const f = r.f, got = [];
    if (f.ed) got.push(`${nf0.format(f.ed)}% enhanced damage`);
    if (f.min) got.push(`+${nf0.format(f.min)} minimum damage`);
    if (f.max) got.push(`+${nf0.format(f.max)} maximum damage`);
    if (f.ias) got.push(`+${f.ias}% IAS`);
    const more = weaponStatsText(f);
    if (more) got.push(more);
    const elx = elemFieldsText(f, false);
    if (elx) got.push(elx);
    const base = `${r.eth ? "ethereal " : ""}${r.w.name}${r.socks.length ? ` with ${andList(r.socks)}` : ""}`;
    const head = r.label !== r.w.name ? `${r.label} (${base})` : base.charAt(0).toUpperCase() + base.slice(1);
    let t = `Pasted ${head}: ${got.length ? got.join(", ") : "nothing this calculator counts on the weapon"}${r.perLvl ? `, per-level stats at level ${lvl}` : ""}.`;
    if (r.off.length) t += ` Not counted on the weapon: ${andList(r.off)}.`;
    return t;
  }
  function pasteItem(b, part, text) {
    const me = mode === "weapons" ? builds[0] : b, lvl = clamp(+me.c.lvl || 1, 1, 99);
    const att = ATT[me.s.k];
    const r = readItem(text, lvl, att && att.id ? att.label : "");
    if (r.err) { pasted = { b, part, err: r.err }; renderBuilds(); return; }
    const x = b[part], was = JSON.parse(JSON.stringify(x)), wname = b.wname;
    Object.assign(x, { cat: r.w.cat, code: r.w.code, eth: r.eth, hand: r.w.d1 && r.w.d2 ? x.hand : "d1" }, r.f);
    if (part === "w") b.wname = r.label.slice(0, 30);   // the weapon's name, in Compare weapons its column's
    // its own deadly strike, crushing blow, attack rating...: their fold opens (on every card) to show them
    if (Object.keys(WEAPON_STATS()).some(k => k !== "dmg" && r.f[k])) SECTIONS_OPEN[part === "o" ? "omore" : "wmore"] = true;
    pasted = { b, part, was, wname, text: pasteText(r, lvl) };
    renderBuilds();
  }
  /* the paste box at the top of a weapon's fields, and under it what the last paste into it did, with Undo */
  function pasteField(body, b, isOff) {
    const part = isOff ? "o" : "w";
    const f = el("div", { class: "field full", "data-focus": "paste-" + part }, line(body));
    const id = "dm-f" + (++uid);
    el("label", { for: id }, f, isOff ? "Paste the second weapon from the game" : "Paste a weapon from the game");
    const i = el("input", { type: "text", id, placeholder: "Ctrl+V here", autocomplete: "off", spellcheck: "false" }, f);
    el("small", {}, f, "Hover over it in game and press Ctrl+C: its base, sockets, and stats fill the fields below.");
    i.addEventListener("paste", e => {
      const t = e.clipboardData && e.clipboardData.getData("text");
      if (!t) return;   // the browser's own paste: read on change
      e.preventDefault();
      pasteItem(b, part, t);
    });
    // dropped or typed in: read once it is a whole item, or on Enter / leaving the box
    i.addEventListener("input", () => { if (/^\s*\{[\s\S]*\}\s*$/.test(i.value)) pasteItem(b, part, i.value); });
    i.addEventListener("change", () => { if (i.value.trim()) pasteItem(b, part, i.value); });
    if (pasted && pasted.b === b && pasted.part === part) {
      const p = el("p", { class: "note paste-note", role: "status" }, body, pasted.err ? `⚠ ${pasted.err}` : pasted.text);
      if (!pasted.err) {
        const u = el("button", { type: "button", "data-focus": "paste-undo-" + part, "aria-label": `Undo the pasted ${isOff ? "second weapon" : "weapon"}` }, p, "Undo");
        u.addEventListener("click", () => { b[part] = pasted.was; b.wname = pasted.wname; pasted = null; renderBuilds(); });
      }
    }
  }
  /* a weapon's fields, in the same lines on every card: what it is; ethereal and the hands; what is on it */
  function weaponFields(body, b, x, isOff, refs) {
    const p = isOff ? "o." : "w.";
    pasteField(body, b, isOff);
    const l1 = line(body);
    const unpaste = () => { if (pasted && pasted.b === b && pasted.part === (isOff ? "o" : "w")) pasted = null; };
    selField(l1, "Kind", catOptions(b.cls), () => x.cat, v => { x.cat = v; const first = DATA.weapons.filter(w => w.cat === v && w.tier === "E")[0] || DATA.weapons.find(w => w.cat === v); x.code = first.code; x.hand = "d1"; unpaste(); renderBuilds(); }, { wide: true, path: p + "cat" });
    selField(l1, "Base", weaponOptions(x.cat), () => x.code, v => { x.code = v; unpaste(); renderBuilds(); }, { wide: true, path: p + "code" });
    const w = W[x.code];
    const l2 = line(body);
    checkField(l2, w && w.eth ? "5/4 base damage" : "Can’t be ethereal", () => x.eth, v => { x.eth = v; }, { title: "Ethereal", path: p + "eth", disabled: !(w && w.eth) });
    if (w && w.d1 && w.d2 && !isOff && b.cls === "bar") selField(l2, "Held in", [{ value: "d1", label: `One hand ${w.d1[0]}–${w.d1[1]}` }, { value: "d2", label: `Two hands ${w.d2[0]}–${w.d2[1]}` }], () => x.hand, v => { x.hand = v; }, { path: p + "hand", wide: true });
    const l3 = line(body);
    numField(l3, "Enhanced damage %", () => x.ed, v => { x.ed = v; }, 0, 2000, { hint: "Its own, superior, sockets", path: p + "ed" });
    numField(l3, "+ Min damage", () => x.min, v => { x.min = v; }, 0, 999, { path: p + "min" });
    numField(l3, "+ Max damage", () => x.max, v => { x.max = v; }, 0, 999, { path: p + "max" });
    numField(l3, "IAS on it", () => x.ias, v => { x.ias = v; }, 0, 200, { path: p + "ias" });
    numField(l3, "+ Damage", () => x.dmg, v => { x.dmg = v; }, 0, 999, { hint: "“+X Damage”: min and max; kicks too", path: p + "dmg" });
    const facts = [];
    if (w && w.wsm) facts.push(`Weapon speed ${w.wsm > 0 ? "+" + w.wsm : "\u2212" + -w.wsm}`);
    if (w && w.sb) facts.push(`Strength bonus ${w.sb / 100} per point`);
    if (w && w.db) facts.push(`Dexterity bonus ${w.db / 100} per point`);
    if (facts.length) el("p", { class: "note" }, body, facts.join(", "));
    // the weapon's own stats that work on its hits, folded (open or closed on every card at once)
    const mb = fold(body, isOff ? "omore" : "wmore", "Its deadly strike, crushing blow, attack rating…", refs);
    const m1 = line(mb);
    numField(m1, "Deadly strike %", () => x.ds, v => { x.ds = v; }, 0, 200, { path: p + "ds" });
    numField(m1, "DS multiplier %", () => x.dsmult, v => { x.dsmult = v; }, 0, 500, { hint: "“Deadly Strike Multiplier”", path: p + "dsmult" });
    numField(m1, "Critical strike %", () => x.crit, v => { x.crit = v; }, 0, 100, { path: p + "crit" });
    numField(m1, "Crit multiplier %", () => x.cmult, v => { x.cmult = v; }, 0, 500, { hint: "“Critical Strike Multiplier”", path: p + "cmult" });
    const m2 = line(mb);
    numField(m2, "Crushing blow %", () => x.cb, v => { x.cb = v; }, 0, 100, { path: p + "cb" });
    numField(m2, "Attack rating", () => x.ar, v => { x.ar = v; }, 0, 50000, { hint: "Per-level at your level too", path: p + "ar" });
    numField(m2, "Attack rating %", () => x.arp, v => { x.arp = v; }, 0, 5000, { hint: "“Bonus to Attack Rating”", path: p + "arp" });
    numField(m2, "−% Target defense", () => x.tdef, v => { x.tdef = v; }, 0, 200, { path: p + "tdef" });
    checkField(m2, "Has it", () => x.itd, v => { x.itd = v; }, { title: "Ignore Target’s Defense", path: p + "itd" });
    const m3 = line(mb);
    numField(m3, "Attack rating vs demons", () => x.ard, v => { x.ard = v; }, 0, 50000, { path: p + "ard" });
    numField(m3, "Attack rating vs undead", () => x.aru, v => { x.aru = v; }, 0, 50000, { path: p + "aru" });
    numField(m3, "Damage vs demons %", () => x.edd, v => { x.edd = v; }, 0, 5000, { path: p + "edd" });
    numField(m3, "Damage vs undead %", () => x.edu, v => { x.edu = v; }, 0, 5000, { path: p + "edu" });
    el("p", { class: "note" }, mb, isOff
      ? "They count on this weapon’s hits only, added to other gear’s. Its attack rating stats count when the hit before was this weapon’s, or it is in the right hand on an attack’s first hit: the game rolls a hit before it switches weapons (How It’s Worked Out)."
      : "They count on this weapon’s hits only, added to other gear’s.");
    // its elemental damage (2026-11-24), folded: on its hits only, as its enhanced damage
    const eb = fold(body, isOff ? "oel" : "wel", "Its elemental damage", refs);
    elemFields(eb, x, p, false);
    el("p", { class: "note" }, eb, "On this weapon’s hits only, added to other gear’s; with what is socketed in it. Its +% skill damage and −% enemy resistance count on every hit: they go in Other gear.");
  }
  /* the elemental damage fields of a weapon (x, path prefix p) or of other gear (with each element's +% skill damage and
     -% enemy resistance): a line per element */
  function elemFields(body, x, p, gear) {
    for (const e of ELEMS) {
      const l = line(body), k = e.p;
      if (e.k === "pois") {
        numField(l, "Poison damage", () => x.pmax, v => { x.pmin = v; x.pmax = v; }, 0, 100000, { hint: "“+X poison damage over Y seconds”", path: p + "pmax" });
        numField(l, "Over seconds", () => x.psec, v => { x.psec = v; }, 0, 60, { path: p + "psec" });
      } else {
        numField(l, `${e.N} min`, () => x[k + "min"], v => { x[k + "min"] = v; }, 0, 100000, { hint: `“Adds X-Y ${e.n} damage”`, path: p + k + "min" });
        numField(l, `${e.N} max`, () => x[k + "max"], v => { x[k + "max"] = v; }, 0, 100000, { path: p + k + "max" });
      }
      if (gear) {
        numField(l, `+% ${e.n} skill damage`, () => x[k + "m"], v => { x[k + "m"] = v; }, 0, 1000, { hint: e.k === "fire" ? "Facets, charms: on attacks too" : "", path: p + k + "m" });
        if (e.k !== "mag") numField(l, `−% enemy ${e.n} res`, () => x[k + "p"], v => { x[k + "p"] = v; }, 0, 200, { hint: e.k === "fire" ? "“to Enemy Fire Resistance”" : "", path: p + k + "p" });
      }
    }
  }
  /* what a weapon's or other gear's elemental damage is, in a few words (a fold's summary) */
  function elemFieldsText(x, gear) {
    const s = [];
    for (const e of ELEMS) {
      const k = e.p;
      if (e.k === "pois") { if (+x.pmax > 0) s.push(`${x.pmax} poison over ${x.psec || 0} s`); }
      else if (+x[k + "max"] > 0) s.push(`${x[k + "min"]}–${x[k + "max"]} ${e.n}`);
      if (gear && +x[k + "m"]) s.push(`+${x[k + "m"]}% ${e.n}`);
      if (gear && +x[k + "p"]) s.push(`−${x[k + "p"]}% ${e.n} res`);
    }
    return s.join(", ");
  }
  /* what a weapon's own stats are, in a few words (its fold's summary) */
  function weaponStatsText(x) {
    const p = [];
    if (x.dmg) p.push(`+${x.dmg} damage`);
    if (x.ds) p.push(`${x.ds}% DS`);
    if (x.dsmult) p.push(`+${x.dsmult}% DS multiplier`);
    if (x.crit) p.push(`${x.crit}% crit`);
    if (x.cmult) p.push(`+${x.cmult}% crit multiplier`);
    if (x.cb) p.push(`${x.cb}% CB`);
    if (x.ar) p.push(`+${nf0.format(x.ar)} AR`);
    if (x.arp) p.push(`+${x.arp}% AR`);
    if (x.tdef) p.push(`−${x.tdef}% target defense`);
    if (x.itd) p.push("Ignore Target’s Defense");
    if (x.ard) p.push(`+${nf0.format(x.ard)} AR vs demons`);
    if (x.aru) p.push(`+${nf0.format(x.aru)} AR vs undead`);
    if (x.edd) p.push(`+${x.edd}% vs demons`);
    if (x.edu) p.push(`+${x.edu}% vs undead`);
    return p.join(", ");
  }
  /* a fold inside a section, open or closed on every card at once (as the sections), so the cards' lines stay level */
  function fold(body, key, title, refs) {
    const d = el("details", { class: "fold", "data-fold": key }, body);
    d.open = !!SECTIONS_OPEN[key];
    d.addEventListener("toggle", () => {
      SECTIONS_OPEN[key] = d.open;
      $("dm-builds").querySelectorAll(`details.fold[data-fold="${key}"]`).forEach(x => { if (x.open !== d.open) x.open = d.open; });
    });
    const s = el("summary", {}, d);
    el("span", { class: "ttl" }, s, title);
    refs.sum[key] = el("span", { class: "sum" }, s);
    refs.sec[key] = d;
    return el("div", { class: "fold-body" }, d);
  }
  /* a card's section: its summary line (the inputs, then what they make) and its body; refs keeps both for fillCards.
     Opening or closing it does the same in every card, so the cards' rows stay level. */
  function section(card, key, title, refs) {
    const d = el("details", { class: "sec", "data-sec": key }, card);
    d.open = SECTIONS_OPEN[key];
    d.addEventListener("toggle", () => {
      SECTIONS_OPEN[key] = d.open;
      $("dm-builds").querySelectorAll(`details.sec[data-sec="${key}"]`).forEach(x => { if (x.open !== d.open) x.open = d.open; });
      sectionButtons();
    });
    const s = el("summary", {}, d);
    el("span", { class: "ttl" }, s, title);
    refs.sum[key] = el("span", { class: "sum" }, s);
    refs.sec[key] = d;
    return el("div", { class: "sec-body" }, d);
  }
  /* a line of fields: a new line starts a new row on every card */
  const line = body => el("div", { class: "fields" }, body);
  /* the line under a section's fields that says what they make (the sheet's "Weapon damage" under the weapon) */
  const subtotal = (body, refs, key) => { refs.sub[key] = el("p", { class: "subtotal", "aria-live": "polite" }, body); };

  /* the control that had the focus before the cards are drawn again (a select that changes a card's fields), to
     give it back */
  function focusKey() {
    const a = document.activeElement, box = $("dm-builds");
    if (!a || !box.contains(a)) return null;
    const card = a.closest(".build"), host = a.closest("[data-path], [data-focus]");
    if (!card || !host) return null;
    const sel = host.dataset.path !== undefined ? `[data-path="${CSS.escape(host.dataset.path)}"]` : `[data-focus="${host.dataset.focus}"]`;
    return { i: [...box.querySelectorAll(".build")].indexOf(card), sel };
  }
  // after the cards are drawn again, the control with this data-focus key in build i's card
  const focusLater = (key, i) => requestAnimationFrame(() => {
    const card = $("dm-builds").querySelectorAll(".build")[i === undefined ? shown : i];
    const c = card && card.querySelector(`[data-focus="${key}"]`);
    if (c) c.focus();
  });
  function refocus(k) {
    if (!k) return;
    const card = $("dm-builds").querySelectorAll(".build")[k.i];
    const host = card && (card.querySelector(k.sel) || card.querySelector('[data-focus="start"]'));
    const c = host && (host.matches("input, select, button") ? host : host.querySelector("input, select, button"));
    if (c) c.focus();
  }

  let cardRefs = [];
  /* what the page compares: "builds" (cards side by side) or "weapons" (build A's character once, the builds' weapons as
     columns; every other build keeps only its own weapons and takes the rest from build A, syncWeapons) */
  let mode = "builds", modeUndo = null;
  const WEAPON_PARTS = ["wname", "w", "o"];
  /* a weapon's name in weapons mode, and the character's (build A's name) */
  const wlabel = i => (builds[i] && builds[i].wname) || `Weapon ${LETTERS[i]}`;
  const charName = () => builds[0].name || className(builds[0]);
  function syncWeapons() {
    if (mode !== "weapons" || !builds.length) return;
    const A = builds[0];
    for (const b of builds.slice(1)) for (const k of Object.keys(A)) if (!WEAPON_PARTS.includes(k)) b[k] = JSON.parse(JSON.stringify(A[k]));
  }
  function addWeapon() {
    const c = JSON.parse(JSON.stringify(builds[0]));
    c.wname = "";
    builds.push(c); shown = builds.length - 1; undo = null;
    SECTIONS_OPEN.weapon = SECTIONS_OPEN.wmore = true;
    if (DUAL[c.cls] && c.o.on) SECTIONS_OPEN.off = SECTIONS_OPEN.omore = true;
  }
  function focusWeapon(i) {
    const col = $("dm-builds").querySelectorAll(".wcol")[i], s = col && col.querySelector('[data-path="w.code"] select');
    if (s) { col.scrollIntoView({ block: "nearest", behavior: "smooth" }); s.focus({ preventScroll: true }); }
  }
  /* switching to weapons gives every build build A's character, skill, gear, buffs and curses (Undo brings them back);
     a lone build gets a second weapon to compare with */
  function setMode(m) {
    if (m === mode) return;
    const before = JSON.parse(JSON.stringify(builds)), A = builds[0];
    modeUndo = null;
    if (mode === "gear") {
      // leaving Compare gear: each column's build becomes a build of its own, named after its item
      syncGear();
      const c = builds[0].name || className(builds[0]);
      builds.forEach((b, i) => { if (i) b.name = `${c} · ${gearLabel(i)}`.slice(0, 30); });
      mode = "builds";
      if (m === "builds") { undo = null; renderAll(); return; }
    }
    if (m === "gear") {
      // build A alone, with its item columns; other builds put aside (Undo brings them back)
      const others = builds.slice(1).filter(b => !sameBuild(b, A)).length;
      mode = "gear";
      builds = [A];
      if (others) modeUndo = { builds: before, n: others, gear: true };
      if (!gear.items[0].src && gear.worn) gear.items[0] = wornItem(gear.slot);
      undo = null; shown = 0;
      renderAll();
      return;
    }
    if (m === "weapons") {
      const replaced = builds.slice(1).filter(b => !weaponOnly(b, A) && !sameBuild(b, A)).length;
      mode = m;
      const tail = ` · ${wlabel(0)}`;
      if (A.name && A.name.endsWith(tail)) A.name = A.name.slice(0, -tail.length);
      syncWeapons();
      if (replaced) modeUndo = { builds: before, n: replaced };
      if (builds.length === 1) addWeapon();
    } else {
      if (builds.length > 1) { const c = charName(); builds.forEach((b, i) => { b.name = `${c} · ${wlabel(i)}`.slice(0, 30); }); }
      mode = m;
    }
    undo = null;
    renderAll();
    if (m === "weapons" && !modeUndo && builds.length === 2 && !before[1]) focusWeapon(1);
  }
  function renderModeBar() {
    const wm = mode === "weapons", gm = mode === "gear";
    $("dm-mode-builds").setAttribute("aria-pressed", String(!wm && !gm));
    $("dm-mode-weapons").setAttribute("aria-pressed", String(wm));
    $("dm-mode-gear").setAttribute("aria-pressed", String(gm));
    $("dm-builds-h").textContent = wm ? "Weapons" : gm ? "Gear" : "Builds";
    $("dm-intro-builds").hidden = wm || gm;
    $("dm-intro-weapons").hidden = !wm;
    $("dm-intro-gear").hidden = !gm;
    $("dm-tabs").hidden = wm || gm;
    $("dm-diff-a").textContent = wm ? "weapon A" : "build A (on builds of A’s class)";
    $("dm-mode-note").hidden = !modeUndo;
    if (modeUndo) $("dm-mode-note-text").textContent = modeUndo.gear
      ? `${modeUndo.n === 1 ? "The other build is" : `The other ${modeUndo.n} builds are`} put aside: Compare gear tries items on build A.`
      : `${modeUndo.n === 1 ? "The other build now uses" : `The other ${modeUndo.n} builds now use`} build A’s character, skill, gear, and buffs, with their own weapons.`;
  }
  // ================================================================== Compare gear
  /* Compare gear (2026-11-24, a player: "between travs gore or goblin toe for boots ... razortail (20max, 20dex) vs
     siggard (20cb) vs nosf (10ds) for belt ... its all a nightmare to navigate"; the author picked a mode of its own):
     build A once, wearing what it wears; a slot; the item worn in it now (Now, which comes off) and up to three others.
     Column i is build A with Now taken off and item i put on (syncGear): its gear fields, Strength and Dexterity, the
     levels its + skills raise, a pair of boots' kick damage. An item comes from the game's uniques, set items and
     runewords of that slot (DATA.gear: each counted stat's roll range, the best roll to start), a paste of the item
     copied in game (Ctrl+C), a character loaded from the armory (what it wears), or typed stats. Set bonuses aren't
     recounted; an item's auras and chance to cast aren't counted, as on the rest of the page. */
  const MODES = ["builds", "weapons", "gear"];
  const GEAR_SLOTS = [["helm", "Helm", "Helm"], ["armor", "Armor", "Armor"], ["shield", "Shield", null], ["gloves", "Gloves", "Gloves"],
    ["belt", "Belt", "Belt"], ["boots", "Boots", "Boots"], ["amulet", "Amulet", "Amulet"], ["ring", "Ring (right)", "Right Ring"],
    ["ring2", "Ring (left)", "Left Ring"], ["quiver", "Quiver", null]];   // key, name, the armory's slot word
  const SLOT_NAME = Object.fromEntries(GEAR_SLOTS.map(s => [s[0], s[1]]));
  const listSlot = s => (s === "ring2" ? "ring" : s);   // both rings pick from the rings
  const GEAR = (DATA.gear || []).map(x => ({ kind: x[0], name: x[1], code: x[2], slot: x[3], st: x[4], key: `${x[0]}:${x[1]}` }));
  const GEAR_BY_KEY = Object.fromEntries(GEAR.map(x => [x.key + "@" + x.slot, x]));
  const GEAR_KIND = { u: "Unique", s: "Set", r: "Runeword" };
  const GEAR_BASES = Object.fromEntries(Object.entries(DATA.gearBases || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const SOCK_H = Object.fromEntries(Object.entries(DATA.sockH || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const SOCK_S = Object.fromEntries(Object.entries(DATA.sockS || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const CLS_ID = { ama: 0, sor: 1, nec: 2, pal: 3, bar: 4, dru: 5, ass: 6 };
  const PARAM_STATS = [83, 97, 107, 188];   // a stat with a parameter: a class, a skill, a skill tab
  // per-level stats (their raw value, as the tables and the game's copy hold them) into the stats they add to, at level
  // L: floor(value x L / 2^shift) (ITEM_STAT's shifts; the armory's are worked out already)
  const PER_GEAR = { 218: [[22, 24, 160], 3], 220: [[0], 3], 221: [[2], 3], 224: [[19], 1], 225: [[119], 1], 243: [[121], 3],
    244: [[122], 3], 245: [[123], 1], 246: [[124], 1], 247: [[136], 3], 250: [[141], 3] };
  // one roll for a stat the game sets with another (enhanced damage's 17 / 18, flat damage's three each)
  const ROLL_LEAD = { 18: 17, 23: 21, 159: 21, 24: 22, 160: 22 };
  const ELEM_SKILL = { 362: "cold", 363: "fire", 364: "ltng", 365: "pois", 366: "mag" };
  const GEAR_ITEM = () => ({ src: "", key: "", roll: {}, st: null, sp: null, per: true, f: null, name: "", code: "" });
  const GEAR_DEFAULT = () => ({ slot: "belt", items: [GEAR_ITEM(), GEAR_ITEM()], worn: null });
  let gear = GEAR_DEFAULT();
  // a kept or linked gear state, made safe
  function gearOf(v) {
    const g = GEAR_DEFAULT();
    if (!isObj(v)) return g;
    if (SLOT_NAME[v.slot]) g.slot = v.slot;
    if (Array.isArray(v.items) && v.items.length >= 2) g.items = v.items.slice(0, 4).map(x => Object.assign(GEAR_ITEM(), isObj(x) ? x : {}));
    if (isObj(v.worn)) g.worn = v.worn;
    return g;
  }
  const gearCatalog = it => (it && it.src === "list" ? GEAR_BY_KEY[it.key + "@" + (it.slot || listSlot(gear.slot))] || null : null);
  /* an item's stats: {st: {stat id: value}, sp: {stat id: {param: value}}, per: per-level ones still raw}. A list item at
     its rolls (the best one where none is set: the larger, or the more negative for a negative stat) */
  function gearStats(it) {
    if (!it || !it.src || it.src === "type") return null;
    if (it.src !== "list") return { st: it.st || {}, sp: it.sp || {}, per: it.per !== false };
    const c = gearCatalog(it);
    if (!c) return null;
    const st = {}, sp = {};
    for (const [sid, par, lo, hi] of c.st) {
      const lead = ROLL_LEAD[sid] || sid, k = `${lead}:${par}`;
      const best = Math.abs(hi) >= Math.abs(lo) ? hi : lo;
      const v = it.roll && it.roll[k] !== undefined ? +it.roll[k] : best;
      if (PARAM_STATS.includes(sid)) { (sp[sid] = sp[sid] || {})[par] = (sp[sid][par] || 0) + v; }
      else st[sid] = (st[sid] || 0) + v;
    }
    return { st, sp, per: true };
  }
  /* what an item does for build b: {g: Other gear's fields, str, dex, sk: {all, cls, tab, one, el}, kd, boots} */
  const TYPED = [["ed", "Enhanced damage %", 2000], ["min", "+ Min damage", 999], ["max", "+ Max damage", 999], ["str", "Strength", 500],
    ["dex", "Dexterity", 500], ["ias", "IAS", 400], ["crit", "Critical strike %", 100], ["ds", "Deadly strike %", 200], ["cb", "Crushing blow %", 100],
    ["ar", "Attack rating", 50000], ["arp", "Attack rating %", 5000], ["tdef", "−% Target defense", 200], ["allsk", "+ All skills", 20]];
  function gearEffect(it, b) {
    const E = { g: {}, str: 0, dex: 0, sk: { all: 0, cls: {}, tab: {}, one: {}, el: {} }, kd: 0, boots: "" };
    if (!it || !it.src) return E;
    if (it.src === "type") {
      const f = it.f || {};
      for (const [k] of TYPED) if (+f[k] && !["str", "dex", "allsk"].includes(k)) E.g[k] = +f[k];
      E.str = +f.str || 0; E.dex = +f.dex || 0; E.sk.all = +f.allsk || 0;
      return E;
    }
    const s = gearStats(it);
    if (!s) return E;
    const st = Object.assign({}, s.st), lvl = clamp(+b.c.lvl || 1, 1, 99);
    if (s.per) for (const [id, [to, sh]] of Object.entries(PER_GEAR)) {
      if (!st[id]) continue;
      const v = Math.floor(st[id] * lvl / (1 << sh));
      for (const t of to) st[t] = (st[t] || 0) + v;
      delete st[id];
    }
    E.g = gearFieldsOf(st);
    delete E.g.itd; if (st[115]) E.g.itd = true;
    for (const [k, m, pz] of [["f", 329, 333], ["l", 330, 334], ["c", 331, 335], ["m", 357, 0], ["p", 332, 336]]) {
      if (st[m]) E.g[k + "m"] = st[m];
      if (pz && st[pz]) E.g[k + "p"] = Math.abs(st[pz]);
    }
    for (const k of Object.keys(E.g)) if (!E.g[k]) delete E.g[k];
    E.str = st[0] || 0; E.dex = st[2] || 0;
    E.sk.all = st[127] || 0;
    E.sk.cls = Object.assign({}, s.sp[83] || {});
    E.sk.tab = Object.assign({}, s.sp[188] || {});
    E.sk.one = {};
    for (const id of [107, 97]) for (const [p, v] of Object.entries(s.sp[id] || {})) E.sk.one[p] = (E.sk.one[p] || 0) + v;
    for (const [id, e] of Object.entries(ELEM_SKILL)) {
      const v = (st[id] || 0) + Object.values(s.sp[id] || {}).reduce((a, x) => a + x, 0);
      if (v) E.sk.el[e] = v;
    }
    delete E.g.pmin; delete E.g.pmax; delete E.g.psec;   // poison on gear: its length doesn't add up; not counted here
    E.kd = st[137] || 0;
    const code = it.code || (gearCatalog(it) || {}).code;
    if (code && DATA.boots.some(x => x.code === code)) E.boots = code;
    return E;
  }
  /* the skill levels a build's fields hold, which + skills raise: the attack, the masteries, the class's own auras and
     buffs (an item's aura or a party member's gets none), the build's own curses and Battle Cry. A field at 0 (a skill
     the build doesn't use) stays 0 */
  const NEC_CURSE = { amp: 66, decrep: 87, weaken: 72, attract: 86, lowres: 91 };
  function levelFields(b) {
    const out = [], att = ATT[b.s.k], c = b.cls;
    const add = (path, id, on) => { if (id && on && +getPath(b, path) > 0) out.push({ path, id }); };
    if (att && att.id) add("s.lvl", att.id, true);
    (b.s.rot || []).forEach((x, i) => { if (x && ATT[x.k] && ATT[x.k].id) add(`s.rot.${i}.lvl`, ATT[x.k].id, true); });   // the skills cast between cooldowns
    for (const id of MAST[c] || []) if (+id !== 23) add("m." + id, +id, true);
    add("m.penLvl", 23, c === "ama");
    add("buf.fana", 122, c === "pal" && b.buf.fanaSelf);
    add("aur.might", 98, c === "pal" && b.aur.mightSelf);
    add("aur.conc", 113, c === "pal" && b.aur.concSelf);
    add("aur.ba", 108, c === "pal" && b.aur.baSelf);
    if (c === "pal" && HOLY[b.buf.holy]) add("buf.holyLvl", HOLY[b.buf.holy][0], true);
    add("aur.bc", 155, c === "bar"); add("buf.frenzy", 147, c === "bar"); add("deb.bc", 146, c === "bar");
    add("buf.bos", 258, c === "ass"); add("buf.venom", 278, c === "ass");
    // a form from an item (another class's: Beast's Werebear, Wolfhowl's Werewolf) takes + all skills too (skillPlus)
    add("buf.were", 223, true); add("buf.bear", 228, true); add("buf.lyc", 224, c === "dru"); add("aur.wolv", 236, c === "dru");
    add("buf.ench", 52, c === "sor" && b.buf.enchSelf); add("buf.cench", 40, c === "sor" && b.buf.cenchSelf);
    b.deb.curses.forEach((r, i) => add(`deb.curses.${i}.lvl`, NEC_CURSE[r.c], c === "nec"));
    return out;
  }
  // the levels an item's + skills give skill id on build b: all skills, the class's, its tab's and its element's
  // (own-class skills), the skill itself and oskills
  function skillPlus(E, id, b) {
    const r = SK[id];
    if (!r) return 0;
    let n = E.sk.one[id] || 0;
    if (r.charclass === b.cls) n += E.sk.all + (E.sk.cls[CLS_ID[b.cls]] || 0) + (r.tab !== undefined ? E.sk.tab[r.tab] || 0 : 0) + (E.sk.el[r.EType] || 0);
    else n += E.sk.all;   // another class's skill from an item: + all skills reach it (the author's game, 2026-11-24)
    return n;
  }
  const setPath = (o, p, v) => { const ks = p.split("."), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };
  /* build A with Now's effect taken off and item it's put on */
  function applyGear(A, eNow, eNew) {
    const b = JSON.parse(JSON.stringify(A));
    for (const k of new Set(Object.keys(eNow.g).concat(Object.keys(eNew.g)))) {
      if (k === "itd") { b.g.itd = (!!A.g.itd && !eNow.g.itd) || !!eNew.g.itd; continue; }
      b.g[k] = clamp((+A.g[k] || 0) - (+eNow.g[k] || 0) + (+eNew.g[k] || 0), 0, GEAR_MAX[k] !== undefined ? GEAR_MAX[k] : 100000);
    }
    b.c.str = clamp(Math.round(A.c.str - eNow.str + eNew.str), 0, 2000);
    b.c.dex = clamp(Math.round(A.c.dex - eNow.dex + eNew.dex), 0, 2000);
    for (const f of levelFields(A)) {
      const d = skillPlus(eNew, f.id, A) - skillPlus(eNow, f.id, A);
      if (d) setPath(b, f.path, clamp((+getPath(A, f.path) || 0) + d, 1, MAX_LVL));
    }
    if (eNew.boots) b.k.boots = eNew.boots;
    b.k.kd = clamp((+A.k.kd || 0) - eNow.kd + eNew.kd, 0, 999);
    return b;
  }
  /* an item's name in a column: Now's with "Now", a picked one's own, else "Item B" */
  const gearName = it => (!it || !it.src ? "" : it.src === "list" ? (gearCatalog(it) || {}).name || "" : it.src === "type" ? "Your item" : it.name || "Your item");
  const gearLabel = i => (i === 0 ? (gearName(gear.items[0]) ? `Now: ${gearName(gear.items[0])}` : "Now") : gearName(gear.items[i]) || `Item ${LETTERS[i]}`);
  /* what an item adds that this page counts, in a few words: "+20% crushing blow, +15 Dexterity, +1 to all skills" */
  function gearWords(it, b) {
    if (!it || !it.src) return "nothing counted";
    const E = gearEffect(it, b), p = [], n = v => nf0.format(v);
    const G = { ed: ["% enhanced damage"], min: [" minimum damage"], max: [" maximum damage"], ias: ["% IAS"], crit: ["% critical strike"],
      cmult: ["% critical strike multiplier"], ds: ["% deadly strike"], maxds: ["% maximum deadly strike"], dsmult: ["% deadly strike multiplier"],
      cb: ["% crushing blow"], cbe: ["% crushing blow efficiency"], pierce: ["% physical pierce"], ar: [" attack rating"], arp: ["% attack rating"],
      tdef: ["% target defense", "−"], ard: [" attack rating against demons"], aru: [" attack rating against undead"],
      edd: ["% damage against demons"], edu: ["% damage against undead"] };
    for (const [k, [w, sign]] of Object.entries(G)) if (E.g[k]) p.push(`${sign || "+"}${n(E.g[k])}${w}`);
    if (E.g.itd) p.push("Ignore Target’s Defense");
    for (const e of ELEMS) if (e.k !== "pois" && E.g[e.p + "max"]) p.push(`${n(E.g[e.p + "min"] || 0)}–${n(E.g[e.p + "max"])} ${e.n}`);
    for (const e of ELEMS) if (E.g[e.p + "m"]) p.push(`+${n(E.g[e.p + "m"])}% ${e.n} skill damage`);
    for (const e of ELEMS) if (E.g[e.p + "p"]) p.push(`−${n(E.g[e.p + "p"])}% enemy ${e.n} resistance`);
    if (E.str) p.push(`+${n(E.str)} Strength`);
    if (E.dex) p.push(`+${n(E.dex)} Dexterity`);
    if (E.sk.all) p.push(`+${E.sk.all} to all skills`);
    const att = ATT[b.s.k], up = att && att.id ? skillPlus(E, att.id, b) - E.sk.all : 0;
    if (up > 0) p.push(`+${up} to ${att.label}`);
    if (E.kd) p.push(`+${n(E.kd)} kick damage`);
    return p.length ? p.join(", ") : "nothing this page counts";
  }
  /* every column's build: A, then A with Now off and item i on */
  function syncGear() {
    if (mode !== "gear" || !builds.length) return;
    const A = builds[0], eNow = gearEffect(gear.items[0], A);
    builds.length = 1;
    for (let i = 1; i < gear.items.length; i++) {
      const b = applyGear(A, eNow, gearEffect(gear.items[i], A));
      b.name = gearLabel(i).slice(0, 30);
      builds.push(b);
    }
  }
  /* the item a character loaded from the armory wears in a slot (its stats as the armory gives them: per-level ones and
     sockets already in) */
  function wornItem(slot) {
    const w = gear.worn && gear.worn[slot];
    return w ? Object.assign(GEAR_ITEM(), { src: "armory", name: w.name, code: w.code, st: w.st, sp: w.sp, per: false }) : GEAR_ITEM();
  }
  /* an item copied in game (Ctrl+C) for a gear slot: its base's slot, its own stats (one value each, the larger where a
     stat is listed twice, as readItem), what is socketed in it (a helm's or armor's mods, a shield's), + skills: all,
     the class's (a line naming build A's class), one skill by name. {name, code, slot, st, sp} or {err} */
  function readGear(text, b) {
    let it = null;
    try { it = JSON.parse(String(text).trim()); } catch (e) { /* not an item */ }
    if (!isObj(it) || typeof it.type !== "string") return { err: "That isn’t an item copied in game: hover over the item in game, press Ctrl+C, then paste it here." };
    const tn = noColor(it.type), base = GEAR_BASES[tn.toLowerCase()];
    if (!base) return { err: BASE_BY_NAME[tn.toLowerCase()] ? `${tn} is a weapon: compare weapons in Compare weapons.` : `${tn} isn’t a helm, armor, shield, gloves, belt, boots, amulet, ring, or quiver.` };
    const mine = {}, sp = {}, put = (id, v) => { if (!(id in mine) || Math.abs(v) > Math.abs(mine[id])) mine[id] = v; };
    const skId = name => { const n = String(name || "").toLowerCase(); const id = Object.keys(SK).find(k => (SK[k].name || SK[k].skill || "").toLowerCase() === n); return id ? +id : null; };
    const clsName = (CLS[b.cls] || {}).name || "";
    for (const s of (Array.isArray(it.stats) ? it.stats : []).filter(isObj)) {
      const v = Math.trunc(+s.value) || 0, name = noColor(s.name);
      if (s.stat_id === 83) { if (clsName && name.toLowerCase().includes(clsName.toLowerCase())) (sp[83] = sp[83] || {})[CLS_ID[b.cls]] = v; continue; }
      if (s.stat_id === 107 || s.stat_id === 97) { const id = skId(s.skill || name.replace(/^\+?\d+\s+to\s+/i, "").replace(/\s*\(.*\)\s*$/, "")); if (id) (sp[s.stat_id] = sp[s.stat_id] || {})[id] = v; continue; }
      if (s.stat_id === 188) continue;   // a skill tab by its name: not read
      if (Number.isInteger(s.stat_id)) { put(s.stat_id, v); continue; }
      if (/^\+?\d*\s*to strength$/i.test(name)) put(0, v);
      else if (/enhanced damage/i.test(name) && !/maximum|minimum/i.test(name)) { put(17, v); put(18, v); }
    }
    const st = Object.assign({}, mine), add = (id, v) => { st[id] = (st[id] || 0) + v; };
    const socks = base[1] === "shield" ? SOCK_S : SOCK_H;
    for (const s of (Array.isArray(it.socketed) ? it.socketed : []).filter(isObj)) {
      const name = noColor(s.type || s.name).toLowerCase();
      const own = (Array.isArray(s.stats) ? s.stats : []).filter(x => isObj(x) && Number.isInteger(x.stat_id));
      (own.length ? own.map(x => [x.stat_id, Math.trunc(+x.value) || 0]) : socks[name] || []).forEach(([id, v]) => add(id, v));
    }
    const label = noColor((it.isRuneword && it.runeword) || it.name) || tn;
    return { name: label.slice(0, 40), code: base[0], slot: base[1], st, sp };
  }
  // the last paste into a column: {i, text} or {i, err}
  let gearPasted = null;
  /* the slot, the columns (Now and the items to try), and under them the table */
  function renderGearPanel(host, A) {
    const top = el("div", { class: "fields gtop" }, host);
    selField(line(top), "Slot", GEAR_SLOTS.map(([k, n]) => ({ value: k, label: n })), () => gear.slot, v => {
      gear.slot = v;
      gear.items = gear.items.map((x, i) => (i === 0 ? wornItem(v) : GEAR_ITEM()));
      gearPasted = null;
      renderBuilds();
    }, { wide: true, hint: "Every column wears its item here; everything else is build A’s" });
    const cols = el("div", { class: "wcols gcols" }, host);
    gear.items.forEach((it, i) => gearColumn(cols, it, i, A));
    if (gear.items.length < 4) {
      const add = el("button", { type: "button", class: "wadd" }, cols, "+ Add an item");
      add.addEventListener("click", () => { gear.items.push(GEAR_ITEM()); renderBuilds(); });
    }
    el("div", { class: "wres", id: "dm-wres", "aria-live": "polite" }, host);
  }
  function gearColumn(cols, it, i, A) {
    const card = el("article", { class: "build wcol gcol", "aria-label": i ? `Item ${LETTERS[i]}` : "What you wear now" }, cols);
    card.style.setProperty("--key", KEYS[i]);
    const head = el("div", { class: "build-head" }, card);
    const h = el("h3", {}, head);
    el("span", { class: "key", "aria-hidden": "true" }, h, LETTERS[i]);
    el("span", { class: "gname" }, h, i ? gearName(it) || `Item ${LETTERS[i]}` : "Now");
    if (i > 0 && gear.items.length > 2) {
      const rm = el("button", { type: "button", "aria-label": `Remove item ${LETTERS[i]}` }, head, "Remove");
      rm.addEventListener("click", () => { gear.items.splice(i, 1); gearPasted = null; renderBuilds(); });
    }
    const body = el("div", { class: "fields gbody" }, card);
    const slotItems = GEAR.filter(x => x.slot === listSlot(gear.slot));
    const groups = ["u", "s", "r"].map(k => ({ group: GEAR_KIND[k], items: slotItems.filter(x => x.kind === k).map(x => ({ value: "list:" + x.key, label: x.name })) })).filter(g => g.items.length);
    const opts = [{ value: "", label: i ? "Pick an item" : "Nothing (or not in Other gear)" }]
      .concat(it.src === "armory" ? [{ value: "armory", label: `${it.name} (from the armory)` }] : [])
      .concat(it.src === "paste" ? [{ value: "paste", label: `${it.name} (pasted)` }] : [])
      .concat(groups, [{ value: "type", label: "A rare, magic, or crafted one: type its stats" }]);
    selField(line(body), i ? "Item" : "What you wear there now", opts, () => (it.src === "list" ? "list:" + it.key : it.src), v => {
      const x = gear.items[i] = GEAR_ITEM();
      if (v.startsWith("list:")) { x.src = "list"; x.key = v.slice(5); x.slot = listSlot(gear.slot); }
      else if (v === "type") { x.src = "type"; x.f = {}; }
      else if (v === "armory" || v === "paste") Object.assign(x, it);
      renderBuilds();
    }, { wide: true, hint: i ? "" : "It comes off for the other columns: its stats are in your Other gear" });
    const c = gearCatalog(it);
    if (c) {
      // a roll box for each stat that rolls (one for the stats one property sets together)
      const seen = new Set(), l = line(body);
      // + skills only where they reach a skill the build uses (Siggard's Staunch's Iron Skin oskill: no box)
      const used = levelFields(A).map(f => f.id);
      const counts = (sid, par) => (sid === 107 || sid === 97 ? used.includes(+par) : sid === 83 ? +par === CLS_ID[A.cls]
        : sid === 188 ? used.some(id => SK[id] && SK[id].tab === +par) : true);
      for (const [sid, par, lo, hi] of c.st) {
        const lead = ROLL_LEAD[sid] || sid, k = `${lead}:${par}`;
        if (seen.has(k) || lo === hi || !counts(sid, par)) continue;
        seen.add(k);
        const a = Math.min(lo, hi), z = Math.max(lo, hi), best = Math.abs(hi) >= Math.abs(lo) ? hi : lo;
        numField(l, statWord(lead, par), () => (it.roll[k] !== undefined ? it.roll[k] : best), v => { it.roll[k] = v; }, a, z,
          { hint: `${nf0.format(a)}–${nf0.format(z)}${PER_GEAR[lead] ? " a level, in 1/" + (1 << PER_GEAR[lead][1]) + "ths" : ""}` });
      }
    }
    if (it.src === "type") {
      const l = line(body);
      for (const [k, label, max] of TYPED) numField(l, label, () => (it.f && it.f[k]) || 0, v => { it.f = it.f || {}; it.f[k] = v; }, 0, max);
    }
    // a paste from the game
    const f = el("div", { class: "field full" }, line(body));
    const id = "dm-f" + (++uid);
    el("label", { for: id }, f, "Paste it from the game");
    const inp = el("input", { type: "text", id, placeholder: "Ctrl+V here", autocomplete: "off", spellcheck: "false" }, f);
    el("small", {}, f, "Hover over it in game and press Ctrl+C");
    const take = t => {
      const r = readGear(t, A);
      if (r.err) { gearPasted = { i, err: r.err }; renderBuilds(); return; }
      if (r.slot !== listSlot(gear.slot)) { gearPasted = { i, err: `That’s ${/^[aeiou]/i.test(SLOT_NAME[r.slot]) ? "an" : "a"} ${SLOT_NAME[r.slot].toLowerCase()}: pick its slot above first.` }; renderBuilds(); return; }
      gear.items[i] = Object.assign(GEAR_ITEM(), { src: "paste", name: r.name, code: r.code, st: r.st, sp: r.sp, per: true });
      gearPasted = { i, text: `Pasted ${r.name}: ${gearWords(gear.items[i], A)}.` };
      renderBuilds();
    };
    inp.addEventListener("paste", e => { const t = e.clipboardData && e.clipboardData.getData("text"); if (!t) return; e.preventDefault(); take(t); });
    inp.addEventListener("input", () => { if (/^\s*\{[\s\S]*\}\s*$/.test(inp.value)) take(inp.value); });
    inp.addEventListener("change", () => { if (inp.value.trim()) take(inp.value); });
    if (gearPasted && gearPasted.i === i) el("p", { class: "note paste-note", role: "status" }, body, gearPasted.err ? `⚠ ${gearPasted.err}` : gearPasted.text);
    el("p", { class: "note gsum" }, card, `${i ? "Adds" : "Has"}: ${gearWords(it, A)}.`);
  }
  // a stat's name on a roll box
  function statWord(sid, par) {
    const W = { 0: "Strength", 2: "Dexterity", 17: "Enhanced damage %", 21: "+ Min damage", 22: "+ Max damage", 19: "Attack rating",
      93: "IAS", 116: "−% Target defense", 119: "Attack rating %", 121: "Damage vs demons %", 122: "Damage vs undead %",
      123: "Attack rating vs demons", 124: "Attack rating vs undead", 127: "+ All skills", 136: "Crushing blow %", 137: "+ Kick damage",
      141: "Deadly strike %", 210: "Max deadly strike %", 256: "Crit multiplier %", 257: "DS multiplier %", 258: "Critical strike %",
      268: "CB efficiency %", 425: "Physical pierce %", 218: "+ Max damage per level", 220: "Strength per level", 221: "Dexterity per level",
      224: "Attack rating per level", 225: "Attack rating % per level", 247: "Crushing blow per level", 250: "Deadly strike per level",
      48: "Fire min", 49: "Fire max", 50: "Lightning min", 51: "Lightning max", 52: "Magic min", 53: "Magic max", 54: "Cold min", 55: "Cold max",
      329: "+% Fire skill damage", 330: "+% Lightning skill damage", 331: "+% Cold skill damage", 332: "+% Poison skill damage", 357: "+% Magic skill damage",
      333: "−% Enemy fire res", 334: "−% Enemy lightning res", 335: "−% Enemy cold res", 336: "−% Enemy poison res" };
    if (sid === 107 || sid === 97) return `+ ${Calc.name(par) || "a skill"}`;
    if (sid === 83) return "+ Class skills";
    if (sid === 188) return "+ Skill tab";
    return W[sid] || `Stat ${sid}`;
  }

  /* "Start from…" for build i, and its Undo */
  function startFrom(head, i, b) {
    const start = el("select", { class: "start", "aria-label": `Start build ${LETTERS[i]} from an example`, "data-focus": "start" }, head);
    el("option", { value: "" }, start, "Start from…");
    // a character from the PD2 armory into this build (the author's pick, 2026-11-24): its name box opens in the card
    const armOk = mode === "builds";
    if (armOk) el("option", { value: "armory" }, start, "A character from the PD2 armory…");
    for (const [k, label] of PRESETS) el("option", { value: k }, start, label);
    start.addEventListener("change", () => {
      if (start.value === "armory") { cardArm = { i, name: "", busy: false, err: "" }; renderBuilds(); focusLater(`arm-name-${i}`, i); return; }
      const p = PRESETS.find(x => x[0] === start.value);
      if (!p) return;
      undo = { i, b: JSON.parse(JSON.stringify(b)) };
      builds[i] = sanitize(p[2]());
      renderBuilds();
    });
    if (undo && undo.i === i) {
      const u = el("button", { type: "button", "data-focus": "undo", title: "Back to this build as it was before Start from" }, head, "Undo");
      u.addEventListener("click", () => { builds[i] = undo.b; undo = null; renderBuilds(); });
    }
  }
  // the end of a card's head in Compare builds: its own armory name box when open, and "✓ Loaded above" for a build an
  // armory load filled (its status is in the card above, with the others: the author's pick, 2026-11-24)
  function armHead(head, i, b) {
    if (cardArm && cardArm.i === i) armCardBox(head, i);
    if (armLoaded(b.from)) el("p", { class: "arm-mark" }, head, "✓ Loaded above");
  }
  // the card's own name box: Load puts that character into this build through the card above (window.ezCharacter)
  function armCardBox(head, i) {
    const box = el("div", { class: "arm-card" }, head);
    const id = `dm-arm-name-${i}`;
    el("label", { for: id, class: "sr-only" }, box, `Build ${LETTERS[i]}: a character's name on the PD2 armory`);
    const inp = el("input", { type: "text", id, placeholder: "Character name", maxlength: 15, autocomplete: "off", spellcheck: "false", "data-focus": `arm-name-${i}` }, box);
    inp.value = cardArm.name;
    inp.addEventListener("input", () => { cardArm.name = inp.value; });
    const go = () => {
      if (cardArm.busy) return;
      if (!(window.ezCharacter && window.ezCharacter.load)) { cardArm.err = "Loading from the PD2 armory works on the website's page."; renderBuilds(); return; }
      cardArm.busy = true; cardArm.err = ""; renderBuilds(); focusLater(`arm-load-${i}`, i);
      window.ezCharacter.load(inp.value, String(i)).then(r => {
        if (!cardArm || cardArm.i !== i) return;
        if (r && r.ok) cardArm = null; else { cardArm.busy = false; cardArm.err = (r && r.error) || "That didn't load."; }
        renderBuilds();
      });
    };
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    const ld = el("button", { type: "button", "data-focus": `arm-load-${i}` }, box, cardArm.busy ? "Loading…" : "Load");
    ld.disabled = cardArm.busy;
    ld.addEventListener("click", go);
    const x = el("button", { type: "button", "aria-label": "Close the name box" }, box, "✕");
    x.addEventListener("click", () => { cardArm = null; renderBuilds(); });
    if (cardArm.err) el("p", { class: "arm-err", role: "status" }, box, "⚠ " + cardArm.err);
  }
  /* a stand-in for the summaries and subtotals a layout doesn't draw (weapons mode draws the character once): fillCards
     writes into it and nothing shows */
  const sink = () => new Proxy({}, { get: (t, k) => (typeof k !== "string" || k in t ? t[k] : (t[k] = document.createElement("span"))) });
  function renderBuilds() {
    const box = $("dm-builds"), fk = focusKey(), wm = mode === "weapons", gm = mode === "gear";
    if (arrived && (wm || gm || !builds.includes(arrived.b))) arrived = null;  // its build gone or replaced: nothing to say
    if (wm) syncWeapons();
    if (gm) syncGear();
    box.innerHTML = "";
    box.classList.toggle("wmode", wm);
    box.classList.toggle("gmode", gm);
    cardRefs = [];
    root.style.setProperty("--n", gm ? 1 : builds.length);
    root.dataset.n = gm ? 1 : builds.length;  // the cards go two a row where n cards would be too narrow (the CSS container queries)
    renderModeBar();
    const anyDual = gm ? DUAL[builds[0].cls] : builds.some(x => DUAL[x.cls]);
    let charHost = null, cols = null, right = null, gleft = null;
    if (gm) {
      gleft = el("div", { class: "gleft" }, box);
      right = el("div", { class: "wright gright" }, box);
    }
    if (wm) {
      charHost = el("article", { class: "build wchar", "aria-label": "Your character" }, box);
      charHost.style.setProperty("--key", KEYS[0]);
      const ch = el("div", { class: "build-head" }, charHost);
      const chh = el("h3", {}, ch);
      const cn = el("input", { type: "text", class: "bname", "aria-label": "Name of your character", maxlength: 30, "data-focus": "name", placeholder: "Your character" }, chh);
      cn.value = charName();
      cn.addEventListener("input", () => { const v = cn.value.trim(); builds[0].name = !v || v === className(builds[0]) ? "" : cn.value; update(); });
      startFrom(ch, 0, builds[0]);
      right = el("div", { class: "wright" }, box);
      cols = el("div", { class: "wcols" }, right);
    }
    builds.forEach((b, i) => {
      // Compare gear: build A is the one card; the columns' builds are worked out from it (syncGear), not drawn
      if (gm && i > 0) { cardRefs.push({ sum: sink(), sub: sink(), sec: {}, card: document.createElement("article"), foot: document.createElement("div") }); return; }
      const refs = { sum: wm ? sink() : {}, sub: wm ? sink() : {}, sec: {} };
      cardRefs.push(refs);
      const what = wm ? "weapon" : "build";
      const card = el("article", { class: "build" + (wm ? " wcol" : "") + (i === shown || gm ? " shown" : ""), "aria-label": gm ? "Your build" : `${wm ? "Weapon" : "Build"} ${LETTERS[i]}` }, wm ? cols : gm ? gleft : box);
      card.style.setProperty("--key", KEYS[i]);
      refs.card = card;
      // where a part of the build goes: the card, or in weapons mode the character card (build A's only)
      const host = () => (!wm ? card : i === 0 ? charHost : null);
      const head = el("div", { class: "build-head" }, card);
      const h = el("h3", {}, head);
      el("span", { class: "key", "aria-hidden": "true" }, h, LETTERS[i]);
      const nm = el("input", { type: "text", class: "bname", "aria-label": gm ? "Name of your character" : `Name of ${what} ${LETTERS[i]}`, maxlength: 30, "data-focus": "name" }, h);
      nm.value = wm ? wlabel(i) : gm ? b.name || className(b) : badgeName(i);
      nm.addEventListener("input", () => {
        const v = nm.value.trim();
        if (wm) b.wname = !v || v === `Weapon ${LETTERS[i]}` ? "" : nm.value;
        else b.name = !v || v === autoName(i) || v === className(b) ? "" : nm.value;  // the class's name: it follows the class
        update();
      });
      if (wm) {
        if (builds.length > 1) {
          const rm = el("button", { type: "button", "aria-label": `Remove weapon ${LETTERS[i]}` }, head, "Remove");
          rm.addEventListener("click", () => { builds.splice(i, 1); shown = Math.min(shown, builds.length - 1); undo = null; modeUndo = null; renderAll(); });
        }
      } else if (gm) {
        startFrom(head, i, b);
      } else {
      startFrom(head, i, b);
      const copy = el("select", { class: "copy", "aria-label": "Copy this build", "data-focus": "copy" }, head);
      el("option", { value: "" }, copy, "Copy to…");
      builds.forEach((x, j) => { if (j !== i) el("option", { value: j }, copy, `${LETTERS[j]}: ${badgeName(j)}`); });
      if (builds.length < 4) el("option", { value: "new" }, copy, "A new build");
      copy.addEventListener("change", () => {
        const c = JSON.parse(JSON.stringify(b));
        if (copy.value === "new") { c.name = ""; builds.push(c); shown = builds.length - 1; }
        else if (copy.value !== "") { c.name = builds[+copy.value].name; builds[+copy.value] = c; }
        undo = null;
        renderAll();
      });
      if (builds.length > 1) {
        const rm = el("button", { type: "button", "aria-label": `Remove build ${LETTERS[i]}` }, head, "Remove");
        rm.addEventListener("click", () => { builds.splice(i, 1); shown = Math.min(shown, builds.length - 1); undo = null; renderAll(); });
      }
      armHead(head, i, b);
      // the build that came from the IAS Calculator: what came over and what to put in, with Undo (CA-04)
      if (arrived && arrived.b === b) {
        const p = el("p", { class: "arrive-note" }, head, `Build ${LETTERS[i]}${arrived.text} `);
        const u = el("button", { type: "button", "data-focus": "arrive-undo", "aria-label": `Undo: build ${LETTERS[i]} from the IAS Calculator` }, p, "Undo");
        u.addEventListener("click", undoArrival);
      }
      }
      // character
      if (host()) {
      const cb = section(host(), "char", "Character", refs);
      const c1 = line(cb);
      selField(c1, "Class", DATA.classes.map(x => ({ value: x.code, label: x.name })), () => b.cls, v => { b.cls = v; if (!attacksFor(v).some(a => a.k === b.s.k)) b.s.k = "attack"; renderBuilds(); }, { wide: true, path: "cls" });
      numField(c1, "Strength", () => b.c.str, v => { b.c.str = v; }, 0, 2000, { path: "c.str" });
      numField(c1, "Dexterity", () => b.c.dex, v => { b.c.dex = v; }, 0, 2000, { path: "c.dex" });
      numField(c1, "Level", () => b.c.lvl, v => { b.c.lvl = v; }, 1, 99, { hint: "Character level: chance to hit", path: "c.lvl" });
      subtotal(cb, refs, "char");
      }
      // weapon (a spell's card: none of its fields counts, so none is shown; the section's line says what does, 2026-11-25)
      const wb = section(card, "weapon", "Weapon", refs);
      const spellCard = isSpell(ATT[b.s.k]);
      if (!spellCard) weaponFields(wb, b, b.w, false, refs);
      subtotal(wb, refs, "weapon");
      // second weapon: a row on every card while any build's class can hold two, so the rows stay level
      if (DUAL[b.cls]) {
        const ob = section(card, "off", "Second weapon", refs);
        const o1 = line(ob);
        checkField(o1, "A weapon in each hand", () => b.o.on, v => { b.o.on = v; renderBuilds(); }, { title: "Dual wield", wide: true, path: "o.on" });
        if (b.o.on) selField(o1, "First weapon in", [{ value: "r", label: "Right hand" }, { value: "l", label: "Left hand" }], () => b.o.main || "r", v => { b.o.main = v; },
          { wide: true, path: "o.main", hint: "Right hand: the slot on the left of your inventory" });
        if (b.o.on) weaponFields(ob, b, b.o, true, refs);
        subtotal(ob, refs, "off");
      } else if (anyDual) {
        const ph = el("div", { class: "sec-none" }, card);
        el("span", {}, ph, "Second weapon");
        el("span", { class: "sum" }, ph, "Barbarians and Assassins only");
      } else el("div", { class: "sec-gap", "aria-hidden": "true" }, card);
      // other gear
      if (host()) {
      const gb = section(host(), "gear", "Other gear", refs);
      const g1 = line(gb);
      numField(g1, "IAS", () => b.g.ias, v => { b.g.ias = v; }, 0, 400, { hint: "Items’ “Increased Attack Speed”, off the weapon", path: "g.ias" });
      // a spell's speed: faster cast rate on everything worn, the weapon's too (2026-11-25)
      // (a trap is laid at attack speed: no FCR for it)
      if ((ATT[b.s.k] || {}).kind === "cast" && !(ATT[b.s.k] || {}).trap) numField(g1, "Faster cast rate", () => b.g.fcr, v => { b.g.fcr = v; }, 0, 400, { hint: "All of it, the weapon’s too", path: "g.fcr" });
      numField(g1, "Enhanced damage %", () => b.g.ed, v => { b.g.ed = v; }, 0, 2000, { hint: "Off the weapon", path: "g.ed" });
      numField(g1, "+ Min damage", () => b.g.min, v => { b.g.min = v; }, 0, 999, { hint: "Rings, charms, jewels in armor", path: "g.min" });
      numField(g1, "+ Max damage", () => b.g.max, v => { b.g.max = v; }, 0, 999, { path: "g.max" });
      const g2 = line(gb);
      numField(g2, "Critical strike %", () => b.g.crit, v => { b.g.crit = v; }, 0, 100, { path: "g.crit" });
      numField(g2, "Crit multiplier %", () => b.g.cmult, v => { b.g.cmult = v; }, 0, 500, { hint: "“Critical Strike Multiplier”", path: "g.cmult" });
      numField(g2, "Deadly strike %", () => b.g.ds, v => { b.g.ds = v; }, 0, 200, { path: "g.ds" });
      numField(g2, "Max deadly strike %", () => b.g.maxds, v => { b.g.maxds = v; }, 0, 50, { hint: "“Maximum Deadly Strike”", path: "g.maxds" });
      numField(g2, "DS multiplier %", () => b.g.dsmult, v => { b.g.dsmult = v; }, 0, 500, { hint: "“Deadly Strike Multiplier”", path: "g.dsmult" });
      const g3 = line(gb);
      numField(g3, "Crushing blow %", () => b.g.cb, v => { b.g.cb = v; }, 0, 100, { path: "g.cb" });
      numField(g3, "CB efficiency %", () => b.g.cbe, v => { b.g.cbe = v; }, 0, 500, { hint: "“Crushing Blow Efficiency”", path: "g.cbe" });
      numField(g3, "Physical pierce %", () => b.g.pierce, v => { b.g.pierce = v; }, 0, 100, { hint: "“to Enemy Physical Resistance”", path: "g.pierce" });
      const g4 = line(gb);
      numField(g4, "Attack rating", () => b.g.ar, v => { b.g.ar = v; }, 0, 50000, { hint: "Armor, jewelry, charms; per-level at your level", path: "g.ar" });
      numField(g4, "Attack rating %", () => b.g.arp, v => { b.g.arp = v; }, 0, 5000, { hint: "“Bonus to Attack Rating”", path: "g.arp" });
      numField(g4, "−% Target defense", () => b.g.tdef, v => { b.g.tdef = v; }, 0, 200, { hint: "Half against bosses, superuniques, players", path: "g.tdef" });
      checkField(g4, "Has it", () => b.g.itd, v => { b.g.itd = v; }, { title: "Ignore Target’s Defense", hint: "Not against uniques, bosses, players", path: "g.itd" });
      const g5 = line(gb);
      numField(g5, "Attack rating vs demons", () => b.g.ard, v => { b.g.ard = v; }, 0, 50000, { hint: "Per-level items at your level too", path: "g.ard" });
      numField(g5, "Attack rating vs undead", () => b.g.aru, v => { b.g.aru = v; }, 0, 50000, { path: "g.aru" });
      numField(g5, "Damage vs demons %", () => b.g.edd, v => { b.g.edd = v; }, 0, 5000, { hint: "When the monster is one", path: "g.edd" });
      numField(g5, "Damage vs undead %", () => b.g.edu, v => { b.g.edu = v; }, 0, 5000, { hint: "Blunt weapons add 50 in melee", path: "g.edu" });
      el("p", { class: "note" }, gb, "Everything but the weapons: their own deadly strike, crushing blow, critical strike, and attack rating go in their sections, as they count on their hits only.");
      const ge = fold(gb, "gel", "Elemental damage, +% skill damage, −% enemy resistance", refs);
      elemFields(ge, b.g, "g.", true);
      el("p", { class: "note" }, ge, "Rings, amulets, charms, jewels, a shield’s: on every hit. +% skill damage (Rainbow Facets, charms) raises that element’s damage on your attacks too; −% enemy resistance counts only while the monster’s resistance is below 100%.");
      subtotal(gb, refs, "gear");
      }
      // skill
      if (host()) {
      const att = ATT[b.s.k] || ATT.attack;
      const sb = section(host(), "skill", "Skill", refs);
      const s1 = line(sb);
      selField(s1, "Attack", attacksFor(b.cls).map(a => ({ value: a.k, label: a.label + (a.frames_only ? " (speed only)" : "") })), () => b.s.k, v => { b.s.k = v; b.s.hits = 0; renderBuilds(); }, { wide: true, path: "s.k" });
      if (att.id && (att.dmg || att.hits || att.k === "berserk" || att.charge || att.spois || att.veng || att.fclaw || att.sel || att.ex)) numField(s1, "Skill level", () => b.s.lvl, v => { b.s.lvl = v; }, 1, MAX_LVL, { hint: "With + skills", path: "s.lvl" });
      // the share it turns into an element counts its hard points (Concentrate: 30% + 2% a point); so do Exploding
      // Arrow's bombs
      if (att.conv) numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: `Without + skills: 30% + 2% a point of the hit’s physical damage becomes ${ELEM[att.convEl].n}`, path: "s.hard" });
      if (att.ex === "explodingarrow") numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Without + skills: its bombs’ level", path: "s.hard" });
      if (att.ex === "icebarrage") numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Without + skills: 3 lances, 4 from 3 points, 5 from 6", path: "s.hard" });
      if (att.ex === "tstorm" || att.dfill) numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Without + skills: its strikes come faster", path: "s.hard" });
      if (att.ex === "cexpl" || att.ex === "dsentry") numField(s1, "Corpse’s life", () => +b.s.corpse || 0, v => { b.s.corpse = v; }, 0, 9999999, { hint: "0: a corpse like the monster", path: "s.corpse" });
      if (att.ex === "fireblast") numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Without + skills: more points spread its bombs wider", path: "s.hard" });
      if (att.ex === "fissure") numField(s1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Without + skills: its cracks come faster, one a frame at 20", path: "s.hard" });
      if (["chargedbolt", "holybolt", "icebarrage", "frozenorb", "combustion", "tornado", "boulder", "sentinel"].includes(att.ex) || att.k === "chargedboltsentry" || att.k === "wakeoffire") selField(s1, att.trap ? "Trap laid" : "Cast from",
        [{ value: "", label: "Next to the monster" }, { value: "mid", label: "5 yards away" }, { value: "far", label: "10 yards away" }]
          .concat(att.ex === "frozenorb" ? [{ value: "end", label: "14 yards: the orb ends on it" }] : []),
        () => fromOf(b, att), v => { b.s.from = v; },
        { path: "s.from", hint: att.ex === "frozenorb" ? "Aimed through the monster" : att.ex === "chargedbolt" ? "The closer, the more bolts hit" : att.ex === "combustion" ? "How many explode on it" : att.ex === "boulder" ? "Rolled at the monster" : att.ex === "sentinel" ? "Cast on the monster" : att.trap ? "How far from the monster it stands" : "Cast on the monster: the closer, the more hit" });
      if (HITS_LABEL[att.ex]) numField(s1, HITS_LABEL[att.ex], () => +b.s.hits || 0, v => { b.s.hits = v; }, 0, 64, { hint: "0: worked out", path: "s.hits" });
      // its synergies, but a class mastery asked below (Penetrate: Strafe's synergy and the Amazon's pierce)
      // (a mastery asked as its level, Javelin and Spear Mastery, is asked again as a synergy's base points: Poison and
      // Plague Javelin's)
      const mast = MAST[b.cls] || [], syns = synNames(b.cls, att);
      for (const name of syns) numField(s1, `${skillTitle(name)} (synergy)`, () => b.s.syn[name] || 0, v => { b.s.syn[name] = v; }, 0, 20, { hint: "Base points", path: "s.syn." + name });
      // a finisher after every third charge (finApply): Dragon Claw or Dragon Tail, its level and its synergies' points
      const finKick = att.charge && +b.s.fin > 0 && ["dt", "df", "dl"].includes(b.s.fk);
      if (att.charge && att.charge !== "cobra" && ATT.dragonclaw && ATT.dragontail) {
        const f1 = line(sb), fk = () => (+b.s.fin > 0 ? (["dt", "df", "dl"].includes(b.s.fk) ? b.s.fk : "dc") : "");
        selField(f1, "Finisher", [{ value: "", label: "None" }, { value: "dc", label: "Dragon Claw" }, { value: "dl", label: "Dragon Talon" }, { value: "dt", label: "Dragon Tail" }, { value: "df", label: "Dragon Flight" }], fk,
          v => { if (!v) b.s.fin = 0; else { if (v !== fk()) b.s.fin = +b.s[v + "l"] || 20; b.s.fk = v; } renderBuilds(); },
          { path: "s.fk", hint: "After every third charge" });
        if (+b.s.fin > 0) {
          const dt = b.s.fk === "dt", fk1 = fk(), own = +b.s[fk1 + "l"] || 0;
          numField(f1, `${{ dc: "Dragon Claw", dt: "Dragon Tail", df: "Dragon Flight", dl: "Dragon Talon" }[fk1]} level`, () => +b.s.fin || 0, v => { b.s.fin = v; renderBuilds(); }, 1, MAX_LVL,
            { hint: `${own > 0 ? `Yours: ${own}. ` : ""}With + skills`, path: "s.fin" });
          if (dt) {
            numField(f1, "Dragon Talon (synergy)", () => +b.s.tal || 0, v => { b.s.tal = v; }, 0, 20, { hint: "Base points", path: "s.tal" });
            numField(f1, "Dragon Flight (synergy)", () => +b.s.fly || 0, v => { b.s.fly = v; }, 0, 20, { hint: "Base points", path: "s.fly" });
          } else if (fk1 === "dl") {
            numField(f1, "Dragon Tail (synergy)", () => +b.s.tail || 0, v => { b.s.tail = v; }, 0, 20, { hint: "Base points", path: "s.tail" });
            numField(f1, "Dragon Flight (synergy)", () => +b.s.fly || 0, v => { b.s.fly = v; }, 0, 20, { hint: "Base points", path: "s.fly" });
          } else if (fk1 === "dc") numField(f1, "Weapon Block (synergy)", () => +b.s.wb || 0, v => { b.s.wb = v; }, 0, 20, { hint: "Base points", path: "s.wb" });
        }
      }
      // between cooldowns (weaveApply): up to 3 other skills cast while this one waits, each its level, and the
      // synergies the attack's own fields don't ask (one field a skill, under the first that reads it)
      if (weaveMain(att)) {
        const fl = fillersFor(b, att), okK = new Set(fl.map(a => a.k)), mine = SK[att.id] ? String(SK[att.id].skill).toLowerCase() : "";
        b.s.rot = (Array.isArray(b.s.rot) ? b.s.rot : []).filter((x, i, A) => x && okK.has(x.k) && A.findIndex(y => y && y.k === x.k) === i).slice(0, 3);
        if (!isObj(b.s.wvs)) b.s.wvs = {};
        const asked = new Set(syns);
        for (let i = 0; i <= b.s.rot.length && i < 3; i++) {
          const x = b.s.rot[i], first = i === 0, w1 = line(sb), taken = new Set(b.s.rot.filter((y, j) => j !== i).map(y => y.k));
          selField(w1, first ? "Between cooldowns" : "Also in the wait",
            [{ value: "", label: first ? `Nothing: ${att.label} only` : "Nothing more" }].concat(fl.filter(a => !taken.has(a.k)).map(a => ({ value: a.k, label: a.label }))),
            () => (x ? x.k : ""),
            v => {
              if (!v) { if (first) b.s.rot = []; else b.s.rot.splice(i, 1); }
              else if (!x || v !== x.k) {
                // its level and synergies as the armory read them; this skill's own points for a synergy it is
                const aw = ATT[v], wsy = b.s.wsy || {};
                b.s.rot[i] = { k: v, lvl: +(b.s.wlv || {})[v] || 20 };
                for (const name of synNames(b.cls, aw)) if (!syns.has(name) && b.s.wvs[name] === undefined) b.s.wvs[name] = wsy[name] !== undefined ? +wsy[name] : String(name).toLowerCase() === mine ? hardOf(b) : 0;
              }
              renderBuilds();
            }, { wide: true, path: `s.rot.${i}.k`, hint: first ? `Cast while ${att.label} waits for its cooldown` : "The page tries every order" });
          if (!x) break;
          const aw = ATT[x.k], own = +(b.s.wlv || {})[aw.k] || 0;
          numField(w1, `${aw.label} level`, () => +x.lvl || 0, v => { x.lvl = v; }, 1, MAX_LVL, { hint: `${own > 0 ? `Yours: ${own}. ` : ""}With + skills`, path: `s.rot.${i}.lvl` });
          for (const name of synNames(b.cls, aw)) {
            if (asked.has(name)) continue;
            asked.add(name);
            numField(w1, `${skillTitle(name)} (${aw.label}’s synergy)`, () => +(b.s.wvs || {})[name] || 0, v => { b.s.wvs[name] = v; }, 0, 20, { hint: "Base points", path: "s.wvs." + name });
          }
        }
      }
      // a skill with a cooldown items shorten (Joust: Alma Negra, Leoric's Mithril Bane, Zerae's Resolve), the ones this
      // class can use (the IAS Calculator's engine counts the cooldown, from the attack's release)
      const csk = att.id ? IAS.SKILL[att.id] : null, cdIt = csk && csk.cdr ? csk.cdr.filter(x => !x[2] || x[2] === b.cls) : [];
      if (cdIt.length) {
        if (b.s.cdr && !cdIt.some(x => x[0] === b.s.cdr)) b.s.cdr = "";
        selField(s1, "Cooldown shortened by", [{ value: "", label: "Nothing" }].concat(cdIt.map(x => ({ value: x[0], label: `${x[0]} (${x[1]} frames less)` }))),
          () => b.s.cdr || "", v => { b.s.cdr = v; }, { wide: true, path: "s.cdr", hint: "An item you hold or wear" });
      }
      if (mast.length) {
        const s2 = line(sb);
        for (const id of mast) {
          const hint = id === 23 ? (att.k === "strafe" ? "Base points: pierce, Strafe’s synergy" : "Base points (pierce)") : "Level";
          numField(s2, Calc.name(id), () => b.m[id] || 0, v => { b.m[id] = v; }, 0, MAX_LVL, { hint, path: "m." + id });
          if (id === 23) numField(s2, "Penetrate level", () => b.m.penLvl || 0, v => { b.m.penLvl = v; }, 0, MAX_LVL, { hint: "With + skills: its attack rating", path: "m.penLvl" });
        }
      }
      if (att.kick || finKick) {
        const k1 = line(sb), tiers = ["N", "X", "E"];
        selField(k1, "Boots", tiers.map(t => ({ group: TIER[t], items: DATA.boots.filter(x => x.tier === t).map(x => ({ value: x.code, label: `${x.name} (${x.k[0]}–${x.k[1]})` })) })),
          () => b.k.boots, v => { b.k.boots = v; }, { wide: true, path: "k.boots", hint: "Their kick damage" });
        numField(k1, "+ Kick damage", () => b.k.kd, v => { b.k.kd = v; }, 0, 999, { hint: "On gear", path: "k.kd" });
        el("p", { class: "note" }, sb, att.flight || (finKick && b.s.fk === "df")
          ? "Dragon Flight’s kick doesn’t use your weapon’s damage: it takes your boots’ kick damage and Strength × their Strength bonus, raised by its Kick Damage %, your auras’ and buffs’ damage %, and enhanced damage on gear that isn’t a weapon; not your Dexterity, flat damage, “+X Damage”, critical strike, or deadly strike."
          : "Kicks don’t use your weapon’s damage: they take your boots’ kick damage, Strength × their Strength bonus, flat damage on other gear, the weapon’s “+X Damage”, and part of your Dexterity.");
      }
      if (att.frames_only) el("p", { class: "note" }, sb, "Its frames per attack are shown; its damage isn’t worked out yet.");
      if (isSpell(att)) el("p", { class: "note" }, sb, "A spell: its own damage, raised by its synergies (the points above) and your skill damage of its element (Other gear), through the monster’s resistance of that element (Conviction, Lower Resist, and your −% enemy resistance lower it). Your weapon’s damage, enhanced damage, the auras’ damage, critical and deadly strike, and crushing blow don’t count. Faster cast rate sets its speed.");
      if (att.k === "smite") {
        const k1 = line(sb), tiers = ["N", "X", "E"];
        selField(k1, "Shield", tiers.map(t => ({ group: TIER[t], items: DATA.shields.filter(x => x.tier === t).map(x => ({ value: x.code, label: `${x.name} (${x.d[0]}–${x.d[1]})` })) })),
          () => b.sm.shield, v => { b.sm.shield = v; }, { wide: true, path: "sm.shield", hint: "Its damage is Smite’s" });
        numField(k1, "Points put in it", () => hardOf(b), v => { b.s.hard = v; }, 1, 20, { hint: "Crushing blow 5% + 1% a point; Holy Shield’s +5% a point", path: "s.hard" });
        numField(k1, "Holy Shield", () => b.sm.hs, v => { b.sm.hs = v; }, 0, MAX_LVL, { hint: "Level as cast; 0: not up", path: "sm.hs" });
        numField(k1, "Defiance points", () => b.sm.def, v => { b.sm.def = v; }, 0, 20, { hint: "Holy Shield’s +5% a point", path: "sm.def" });
        el("p", { class: "note" }, sb, "Smite hits with your shield’s damage, never misses, and has no critical or deadly strike, elemental damage, or damage against demons or undead. Other gear’s enhanced damage counts (the shield’s too), your weapon’s own doesn’t.");
      }
      if (att.k === "charge") el("p", { class: "note" }, sb, "Damage per second and kill time count Charge’s strikes back to back: the run before each strike isn’t counted.");
      if (att.k === "splitthrow") {   // (the throw's weapon that pierces the monster comes back over it too, 2026-11-27)
        const k1 = line(sb);
        numField(k1, "Pierce chance on gear", () => +b.g.pc || 0, v => { b.g.pc = v; }, 0, 100,
          { hint: "“+X% Pierce”; with Throwing Mastery’s, the throw’s own weapon comes back too", path: "g.pc" });
      }
      subtotal(sb, refs, "skill");
      }
      // auras and buffs
      if (host()) {
      const ab = section(host(), "aura", "Auras and buffs", refs);
      const a1 = line(ab);
      numField(a1, "Might", () => b.aur.might, v => { b.aur.might = v; }, 0, MAX_LVL, { path: "aur.might" });
      checkField(a1, "Your own", () => b.aur.mightSelf, v => { b.aur.mightSelf = v; }, { title: "Might from", path: "aur.mightSelf" });
      numField(a1, "Concentration", () => b.aur.conc, v => { b.aur.conc = v; }, 0, MAX_LVL, { path: "aur.conc" });
      checkField(a1, "Your own", () => b.aur.concSelf, v => { b.aur.concSelf = v; }, { title: "Concentration from", path: "aur.concSelf" });
      numField(a1, "Fanaticism", () => b.buf.fana, v => { b.buf.fana = v; }, 0, MAX_LVL, { hint: "Also its attack speed", path: "buf.fana" });
      checkField(a1, "Your own", () => b.buf.fanaSelf, v => { b.buf.fanaSelf = v; }, { title: "Fanaticism from", path: "buf.fanaSelf" });
      const a2 = line(ab);
      numField(a2, "Blessed Aim", () => b.aur.ba, v => { b.aur.ba = v; }, 0, MAX_LVL, { hint: "Deadly strike", path: "aur.ba" });
      numField(a2, "Battle Command", () => b.aur.bc, v => { b.aur.bc = v; }, 0, MAX_LVL, { hint: "Level as cast; +1 to all your skills", path: "aur.bc" });
      numField(a2, "Grim Ward", () => b.aur.grim, v => { b.aur.grim = v; }, 0, MAX_LVL, { path: "aur.grim" });
      numField(a2, "Heart of Wolverine", () => b.aur.wolv, v => { b.aur.wolv = v; }, 0, MAX_LVL, { path: "aur.wolv" });
      if (b.cls === "pal") {
        const a3 = line(ab);
        checkField(a3, "Your own", () => b.aur.baSelf, v => { b.aur.baSelf = v; renderBuilds(); }, { title: "Blessed Aim from", path: "aur.baSelf" });
        if (b.aur.baSelf) numField(a3, "Its base points", () => b.aur.baHard, v => { b.aur.baHard = v; }, 0, 20, { hint: "Yours: −% target defense", path: "aur.baHard" });
        selField(a3, "Holy aura", [{ value: "", label: "None" }].concat(Object.entries(HOLY).map(([k, h]) => ({ value: k, label: h[1] }))), () => b.buf.holy || "", v => { b.buf.holy = v; renderBuilds(); }, { path: "buf.holy", hint: "Your own: its attack rating" });
        if (HOLY[b.buf.holy]) {
          numField(a3, "Its level", () => b.buf.holyLvl, v => { b.buf.holyLvl = v; }, 0, MAX_LVL, { path: "buf.holyLvl" });
          const syn = Calc.synergies(HOLY[b.buf.holy][0], "EDmgSymPerCalc").map(n => Calc.name(+Object.keys(SK).find(id => SK[id].skill === n)) || n);
          numField(a3, "Its synergies’ points", () => b.buf.holySyn, v => { b.buf.holySyn = v; }, 0, 60, { hint: `${andList(syn)}, added up: its damage on your attacks`, path: "buf.holySyn" });
        }
      }
      // the Holy auras items give, for every class (2026-11-27): each its level, the items' added up
      {
        const ai = line(ab);
        for (const [k, h] of Object.entries(HOLY)) {
          numField(ai, `${h[1]} from items`, () => +(b.buf.ia || {})[k] || 0, v => { b.buf.ia[k] = v; renderBuilds(); }, 0, MAX_LVL,
            { hint: HOLY_ITEMS[k], path: "buf.ia." + k });
          if (b.cls === "pal" && +(b.buf.ia || {})[k] > 0 && b.buf.holy !== k) {
            const syn = Calc.synergies(h[0], "EDmgSymPerCalc").map(n => Calc.name(+Object.keys(SK).find(id => SK[id].skill === n)) || n);
            numField(ai, `${h[1]}’s synergies’ points`, () => +(b.buf.iaSyn || {})[k] || 0, v => { b.buf.iaSyn[k] = v; }, 0, 60,
              { hint: `${andList(syn)}, added up`, path: "buf.iaSyn." + k });
          }
        }
        el("p", { class: "note" }, ab, "An item’s aura works at its own level (+ skills don’t raise it); the same aura from your own skill and an item counts once, at the higher level. Its damage and attack rating are yours in full, whatever your class.");
      }
      if (b.cls === "bar" || b.cls === "ass" || b.cls === "dru") {
        const a3 = line(ab);
        if (b.cls === "bar") {
          numField(a3, "Frenzy (its buff)", () => b.buf.frenzy, v => { b.buf.frenzy = v; }, 0, MAX_LVL, { hint: "Attack speed while it lasts", path: "buf.frenzy" });
          numField(a3, "Frenzy stacks", () => b.buf.stacks, v => { b.buf.stacks = v; }, 0, 5, { path: "buf.stacks" });
          numField(a3, "Increased Speed", () => b.buf.incHard, v => { b.buf.incHard = v; }, 0, 20, { hint: "Base points: +2% IAS each", path: "buf.incHard" });
          numField(a3, "Battle Command points", () => b.aur.bcHard, v => { b.aur.bcHard = v; }, 0, 20, { hint: "Its + all skills: +1, and +1 for every 10", path: "aur.bcHard" });
        }
        if (b.cls === "ass") {
          numField(a3, "Burst of Speed", () => b.buf.bos, v => { b.buf.bos = v; }, 0, MAX_LVL, { path: "buf.bos" });
          numField(a3, "Its base points", () => b.buf.bosHard, v => { b.buf.bosHard = v; }, 0, 20, { hint: "Its attack speed comes from these", path: "buf.bosHard" });
          // Burst of Speed and Fade can't both be on (PD2's States.txt: one group); a load picks the one with more points,
          // a tie Burst of Speed (the author, 2026-11-24), and this box switches it off
          checkField(a3, "Fade instead", () => !!b.buf.bosOff, v => { b.buf.bosOff = v; }, { title: "Burst of Speed off", path: "buf.bosOff" });
          numField(a3, "Venom", () => b.buf.venom, v => { b.buf.venom = v; }, 0, MAX_LVL, { hint: "Level: poison on your attacks", path: "buf.venom" });
          if (b.buf.venom > 0) numField(a3, "Cobra Strike points", () => b.buf.venomSyn, v => { b.buf.venomSyn = v; }, 0, 20, { hint: "Venom’s synergy", path: "buf.venomSyn" });
        }
        if (b.cls === "dru") {
          numField(a3, "Werewolf", () => b.buf.were, v => { b.buf.were = v; }, 0, MAX_LVL, { hint: "Wolf attacks", path: "buf.were" });
          numField(a3, "Werebear", () => b.buf.bear, v => { b.buf.bear = v; }, 0, MAX_LVL, { hint: "Bear attacks", path: "buf.bear" });
          numField(a3, "Maul charges", () => b.buf.maul, v => { b.buf.maul = v; }, 0, 20, { hint: "Bear attacks", path: "buf.maul" });
          numField(a3, "Lycanthropy", () => b.buf.lyc, v => { b.buf.lyc = v; }, 0, MAX_LVL, { hint: "A wereform’s attack rating", path: "buf.lyc" });
        }
      }
      // another class in a form from an item (2026-11-25, the author: Enchant Sorceresses play as werebears): the form's
      // level, the skill an item gives (Beast: Werebear and Maul, Wolfhowl: Werewolf), with your + all skills
      const fa = ATT[b.s.k] || ATT.attack;
      if (b.cls !== "dru" && fa.form) {
        const a5 = line(ab), bear = fa.form === "TG";
        if (bear) {
          numField(a5, "Werebear", () => b.buf.bear, v => { b.buf.bear = v; }, 0, MAX_LVL, { hint: "Level as cast: Beast’s, on swap too, with + all skills", path: "buf.bear" });
          numField(a5, "Maul charges", () => b.buf.maul, v => { b.buf.maul = v; }, 0, 20, { hint: "Bear attacks", path: "buf.maul" });
        } else numField(a5, "Werewolf", () => b.buf.were, v => { b.buf.were = v; }, 0, MAX_LVL, { hint: "Level as cast: Wolfhowl’s, with + all skills", path: "buf.were" });
      }
      // a Sorceress's Enchant and Cold Enchant on any build: your own (a Sorceress's) or a party member's, half (enchantOf)
      {
        const a4 = line(ab), sor = b.cls === "sor";
        const from = self => (sor && self ? "Yours: all of it" : "A party Sorceress’s: half");
        numField(a4, "Enchant", () => b.buf.ench, v => { b.buf.ench = v; renderBuilds(); }, 0, MAX_LVL, { hint: `Level as cast. ${from(b.buf.enchSelf)}`, path: "buf.ench" });
        if (b.buf.ench > 0) {
          numField(a4, "Warmth points", () => b.buf.enchSyn, v => { b.buf.enchSyn = v; }, 0, 20, { hint: "Enchant’s synergy", path: "buf.enchSyn" });
          if (sor) checkField(a4, "Your own", () => b.buf.enchSelf, v => { b.buf.enchSelf = v; renderBuilds(); }, { title: "Enchant from", path: "buf.enchSelf" });
        }
        numField(a4, "Cold Enchant", () => b.buf.cench, v => { b.buf.cench = v; renderBuilds(); }, 0, MAX_LVL, { hint: `Level as cast. ${from(b.buf.cenchSelf)}`, path: "buf.cench" });
        if (b.buf.cench > 0) {
          numField(a4, "Chilling Armor points", () => b.buf.cenchSyn, v => { b.buf.cenchSyn = v; }, 0, 20, { hint: "Cold Enchant’s synergy", path: "buf.cenchSyn" });
          if (sor) checkField(a4, "Your own", () => b.buf.cenchSelf, v => { b.buf.cenchSelf = v; renderBuilds(); }, { title: "Cold Enchant from", path: "buf.cenchSelf" });
        }
      }
      subtotal(ab, refs, "aura");
      }
      // curses and debuffs: what the build itself puts on the monster (onMonster: its own first, then your mercenary's
      // and the party's from the monster's fields, as many as the monster holds), so a Barbarian's Battle Cry no longer
      // counts for the Paladin beside him (the curse lists, 2026-11-24: a row per curse, up to what the build may apply)
      if (host()) {
      const db = section(host(), "deb", "Curses and debuffs", refs);
      const cardAt = x => [...$("dm-builds").querySelectorAll(".build")].indexOf(x.closest(".build"));
      b.deb.curses.forEach((r, i) => {
        const d1 = line(db);
        d1.setAttribute("role", "group");
        d1.setAttribute("aria-label", `Your curse ${i + 1}`);
        selField(d1, "Your curse", CURSE_PICK, () => r.c, v => { r.c = v; renderBuilds(); }, { wide: true, path: `deb.curses.${i}.c`, hint: i ? "" : "Your own, charges, or on striking" });
        if (r.c !== "other") numField(d1, "Curse level", () => r.lvl, v => { r.lvl = v; }, 0, MAX_LVL, { path: `deb.curses.${i}.lvl` });
        btnField(d1, "✕", `Remove your curse ${i + 1}`, e => { const k = cardAt(e.currentTarget); b.deb.curses.splice(i, 1); renderBuilds(); update(true); focusLater("cm-add", k); }, { cls: "cm-x" });
      });
      const d2 = line(db), canAdd = () => b.deb.curses.length < Math.min(3, yourCurses(b));
      const addHint = () => { const m = yourCurses(b); return `You can apply ${m} curse${m > 1 ? "s" : ""}`; };
      const add = btnField(d2, "+ Add a curse", "", e => {
        const k = cardAt(e.currentTarget), used = new Set(b.deb.curses.map(x => x.c));
        b.deb.curses.push({ c: ["amp", "decrep", "lowres", "weaken", "attract"].find(c => !used.has(c)) || "other", lvl: 15 });
        renderBuilds(); update(true);
        requestAnimationFrame(() => { const c = $("dm-builds").querySelectorAll(".build")[k], f = c && c.querySelector(`[data-path="deb.curses.${b.deb.curses.length - 1}.c"] select`); if (f) f.focus(); });
      }, { wide: true, cls: "cm-add", focus: "cm-add", hint: addHint() });
      add.disabled = !canAdd();
      // Curse Mastery's and the gear's extra curses change how many rows it may have
      const sync = () => { add.disabled = !canAdd(); add.parentNode.querySelector("small").textContent = addHint(); };
      if (b.cls === "nec") numField(d2, "Curse Mastery", () => b.deb.cm, v => { b.deb.cm = v; sync(); }, 0, 20, { hint: "Base points: +1 curse at 10 and 20", path: "deb.cm" });
      numField(d2, "Additional curses", () => b.deb.extra, v => { b.deb.extra = v; sync(); }, 0, 3, { wide: true, hint: "+1 each: Raekor’s Virtue, Darkforce Spawn, Ebonbane, Gloom, Last Wish", path: "deb.extra" });
      numField(d2, "Battle Cry", () => b.deb.bc, v => { b.deb.bc = v; }, 0, MAX_LVL, { hint: "Level: Call to Arms +1–3, Cyclopean Roar 6", path: "deb.bc" });
      subtotal(db, refs, "deb");
      }
      // the card's totals: what everything above makes (weapons mode: the table under the weapons)
      refs.foot = el("div", { class: "build-foot", "aria-live": "polite" }, wm ? document.createElement("div") : card);
    });
    if (wm) {
      if (builds.length < 4) {
        const add = el("button", { type: "button", class: "wadd" }, cols, "+ Add a weapon");
        add.addEventListener("click", () => { addWeapon(); renderAll(); focusWeapon(builds.length - 1); });
      }
      el("div", { class: "wres", id: "dm-wres", "aria-live": "polite" }, right);
    }
    // + Add a build: only as a tile among the cards (the author's pick, 2026-11-24); it takes a column of its own
    const tile = !wm && !gm && builds.length < 4;
    if (tile) el("button", { type: "button", class: "wadd badd" }, box, "+ Add a build").addEventListener("click", addBuild);
    if (!wm && !gm) { box.style.setProperty("--cols", builds.length + (tile ? 1 : 0)); box.dataset.cols = builds.length + (tile ? 1 : 0); }
    else { box.style.removeProperty("--cols"); delete box.dataset.cols; }
    if (gm) renderGearPanel(right, builds[0]);
    const tabs = $("dm-tabs");
    tabs.innerHTML = "";
    // the phone tabs: each build's letter badge in its color, then its name (the additions audit, CA-14: the names alone
    // couldn't be matched with the strip's A and B)
    builds.forEach((b, i) => {
      const t = el("button", { type: "button", "aria-pressed": String(i === shown), "aria-label": `Build ${LETTERS[i]}: ${badgeName(i)}` }, tabs);
      t.style.setProperty("--key", KEYS[i]);
      el("span", { class: "key", "aria-hidden": "true" }, t, LETTERS[i]);
      el("span", { class: "tname" }, t, badgeName(i));
      t.addEventListener("click", () => { shown = i; renderBuilds(); });
    });
    sectionButtons();
    refocus(fk);
    update(true);
  }
  function auraSummary(b) {
    const p = [];
    if (b.aur.might) p.push(`Might ${b.aur.might}`);
    if (b.aur.conc) p.push(`Concentration ${b.aur.conc}`);
    if (b.buf.fana) p.push(`Fanaticism ${b.buf.fana}`);
    if (b.aur.bc) p.push(`BC ${b.aur.bc}`);
    if (b.buf.frenzy) p.push(`Frenzy ${b.buf.frenzy}`);
    if (b.buf.bos && !b.buf.bosOff) p.push(`BoS ${b.buf.bos}`);
    if (b.buf.ench) p.push(`Enchant ${b.buf.ench}`);
    if (b.buf.cench) p.push(`Cold Enchant ${b.buf.cench}`);
    return p.join(", ") || "None";
  }

  // ================================================================== the monster
  /* a monster's life in Hell: its table life, +70% for each player after the first (at most 8,388,607); Diablo Clone,
     Rathma, Mendeln and Lucion: 3/2 of that at tier 0, 4 x (1 + tier / 5) at tiers 1 and 2 */
  const MON = Object.fromEntries((DATA.targets || []).map(m => [m.k, m]));
  /* map monsters (2026-11-24, the author: elemental damage against map monsters with their real Hell resistances): the
     map's own (T1-T4 and unique maps, its bosses, minibosses and their minions too), at the map's level (a boss at its
     own), life and defense from MonLvl at that level; the kind for crushing blow a boss's as the boss list's */
  const MAPS = Object.fromEntries(((DATA.maps || {}).maps || []).map(m => [m[0], m]));
  const MAP_KIND = { 0: "", 1: "boss", 2: "miniboss", 3: "a boss’s minion", 11: "a random T1 map boss", 12: "a random T2 map boss",
    13: "a random T3 map boss", 21: "a random boss’s minion", 22: "a random boss’s minion", 23: "a random boss’s minion" };
  function mapMonster(T) {
    if (!String(T.preset || "").startsWith("map:")) return null;
    const id = T.preset.slice(4), mp = MAPS[T.map], x = ((DATA.maps || {}).mons || {})[id];
    if (!mp || !x || !mp[4].some(r => r[0] === id)) return null;
    const lvl = x[5] || mp[3], L = (DATA.maps.lvl || {})[lvl] || [100, 100];
    const at = (v, i) => (x[4] ? v : Math.floor(v * L[i] / 100));
    return { k: T.preset, n: x[0], g: mp[1], lvl, hp: [at(x[1], 0), at(x[2], 0)], def: at(x[3], 1), res: x[6],
             el: { fire: x[7], ltng: x[8], cold: x[9], pois: x[10], mag: x[11] }, type: x[12], kind: x[13], sz: x[14], kb: x[15], tier: false, map: mp };
  }
  const monOf = T => MON[T.preset] || mapMonster(T);
  const HP_PLAYERS = [0, 0, 70, 140, 210, 280, 350, 420, 490];
  const MAX_LIFE = 8388607;
  /* the Kind split (the author, 2026-11-24): a normal monster's row as a champion, a unique's minion or a unique, in
     Hell (the game's monster mods, PD2 unpatched there: traced 2026-10-14 / 2026-11-14 and, for the champion types,
     2026-11-24; memory pd2-map-monster-hp and pd2-monster-and-item-level). Life: +100% for a champion (Possessed twice
     that again; Berserker then -75%, half a normal one's), +50% for a minion, +100% for a unique, rolled at the area
     level. Level: +3 for every one of them, a champion's mod takes 1 back (Plain, Fanatic, Ghostly, Possessed: +2) but
     Berserker's doesn't (+3); it counts in the chance to hit only, the life and defense staying the area level's.
     Ghostly sets physical resistance to 80; Fanatic's -70% defense (item_armor_percent) adds to the curses' in
     defenseOf. CHAMPS: [key, name, life x, levels] */
  const CHAMPS = [["plain", "Plain", 2, 2], ["fanatic", "Fanatic", 2, 2], ["berserker", "Berserker", 0.5, 3], ["possessed", "Possessed", 4, 2], ["ghostly", "Ghostly", 2, 2]];
  const champOf = T => CHAMPS.find(c => c[0] === T.champ) || CHAMPS[0];
  const eliteOf = T => (T.kind === "champion" ? { life: champOf(T)[2], lvl: champOf(T)[3] } : T.kind === "minion" ? { life: 1.5, lvl: 3 } : T.kind === "unique" || T.kind === "superunique" ? { life: 2, lvl: 3 } : null);
  /* A unique's and a superunique's resistance mods in Hell (2026-11-25, traced in the live build:
     the game's code, which PD2 doesn't change; the same in every difficulty). A unique rolls 3 random mods of
     the 12-13 it can take, all equally likely (each about 1 in 4); a superunique its own, then 2 random ones. Each is
     applied in the order rolled, and none of these changes anything on a monster that already has 2 immunities (fire,
     lightning, cold, poison, physical or magic at 100% or more) when its turn comes, but Stone Skin's defense, which
     always doubles. Minions take their boss's mods for damage, not resistance; champions none (Ghostly sets physical
     80). No cap after them: Fire Enchanted on a 120 one makes 195. The monster's base resistance is the one after the
     mods, so curses count half on an immunity a mod made. UMODS: [key, name, apply(el, T, imm)] */
  const UMODS = [
    ["mr", "Magic Resistant", (el, T, imm) => { for (const k of ["cold", "fire", "ltng"]) { if (imm() >= 2) return; if (el[k] < 100) el[k] += 40; } }],
    ["fe", "Fire Enchanted", el => { el.fire += 75; }],
    ["le", "Lightning Enchanted", el => { el.ltng += 75; }],
    ["ce", "Cold Enchanted", el => { el.cold += 75; }],
    ["mb", "Mana Burn", el => { el.mag += 20; }],
    ["sh", "Spectral Hit", (el, T, imm) => { for (const k of ["cold", "fire", "ltng"]) { if (imm() >= 2) return; if (el[k] < 75) el[k] += 20; } }],
    ["ss", "Stone Skin", (el, T) => { T.res += 50; }],
  ];
  function applyMods(T) {
    const imm = () => ["fire", "ltng", "cold", "pois", "mag"].filter(k => T.el[k] >= 100).length + (T.res >= 100 ? 1 : 0);
    for (const k of T.mods || []) {
      const u = UMODS.find(x => x[0] === k);
      if (!u) continue;
      if (k === "ss") T.def *= 2;            // always
      if (imm() >= 2) continue;              // two immunities already: nothing more
      u[2](T.el, T, imm);
    }
  }
  // what a normal monster's row is made ("a Fanatic champion"), or ""
  const eliteName = (T, m) => (m && m.kind === "monster" && eliteOf(T) ? (T.kind === "champion" ? `a ${champOf(T)[0] === "plain" ? "" : champOf(T)[1] + " "}champion` : T.kind === "minion" ? "a unique’s minion" : T.kind === "superunique" ? "a superunique" : "a unique") + ((T.kind === "unique" || T.kind === "superunique") && (T.mods || []).length ? ` (${andList(T.mods.map(k => UMODS.find(u => u[0] === k)[1]))})` : "") : "");
  function presetLife(m, T) {
    let base = Math.round((m.hp[0] + m.hp[1]) / 2);
    const e = m.kind === "monster" ? eliteOf(T) : null;
    if (e) base = Math.floor(base * e.life);
    let life = Math.min(base + Math.floor(base * HP_PLAYERS[clamp(+T.players || 1, 1, 8)] / 100), MAX_LIFE);
    if (m.tier) {
      const t = clamp(+T.tier || 0, 0, 2);
      life = t === 0 ? Math.floor(life * 3 / 2) : life * 4 + Math.floor(life * 4 / 5) * t;
    }
    return Math.min(life, MAX_LIFE);
  }
  function presetOn(T, m) {
    // a normal monster's row keeps the kind picked for it (champion, minion, unique); any other row is what it is
    const e = m.kind === "monster" ? eliteOf(T) : null;
    if (!e) T.kind = m.kind;
    T.res = e && T.kind === "champion" && T.champ === "ghostly" ? 80 : m.res; T.life = presetLife(m, T);
    T.lvl = m.lvl + (e ? e.lvl : 0); T.def = m.def; T.type = m.type || ""; T.size = m.sz === undefined ? 2 : m.sz;
    T.el = Object.assign({ fire: 0, ltng: 0, cold: 0, pois: 0, mag: 0 }, m.el || {});
    T.plr = m.plr || 0;
    if (e && (T.kind === "unique" || T.kind === "superunique")) applyMods(T);
  }
  function applyPreset() {
    const m = monOf(target);
    if (m) presetOn(target, m);
  }
  /* the map's monster that takes build A longest to kill (2026-11-24, a player: "automatically prefills the mob with
     highest EHP"; the author: the toughest for build A): each monster that spawns through the map (its bosses and
     minibosses aside), set on a copy of the monster as applyPreset sets it (the curses from others, Conviction, players and Kind
     kept): its life / (build A's hit on it x the chance to hit), crushing blow left out */
  function toughest(T, A = builds[0]) {
    const mp = MAPS[T.map];
    if (!mp || !A) return null;
    let best = null;
    for (const [id, kind] of mp[4]) {
      if (kind !== 0) continue;
      const t = JSON.parse(JSON.stringify(T));
      t.preset = "map:" + id;
      const m = mapMonster(t);
      if (!m) continue;
      presetOn(t, m);
      const r = evaluate(A, t, { kill: false }), per = r.final * r.toHit;
      const hits = per > 0 ? t.life / per : Infinity;
      if (!best || hits > best.hits) best = { id, hits, name: m.n };
    }
    return best;
  }
  /* under the monster: the map's toughest for build A, with Pick it when another monster is picked (build A changed, or
     the player picked another) */
  let toughCache = { key: "", best: null };   // worked out again only when build A or the monster changed
  function toughNote() {
    const p = $("dm-tough"), T = target;
    const key = MAPS[T.map] && builds.length ? JSON.stringify([builds[0], Object.assign({}, T, { preset: "" })]) : "";
    if (key !== toughCache.key) toughCache = { key, best: key ? toughest(T) : null };
    const best = toughCache.best;
    p.innerHTML = "";
    p.hidden = !best;
    if (!best) return;
    p.textContent = `Toughest for ${mode === "gear" ? "your build" : "build A"} here: ${best.name}, ${Number.isFinite(best.hits) ? `about ${nf1.format(best.hits)} hits on average` : "it can’t be hurt"}. `;
    if (T.preset !== "map:" + best.id) {
      const b = el("button", { type: "button" }, p, "Pick it");
      b.addEventListener("click", () => { target.preset = "map:" + best.id; applyPreset(); renderTarget(); update(); });
    }
  }
  function renderTarget() {
    const box = $("dm-target"), a = document.activeElement;
    // the field that had the focus (a select that redraws the fields), by its label
    // (fields of one label: the curse lists' rows, so which of them too)
    const keyOf = f => { const l = f.querySelector("label"); return l ? l.textContent : ""; };
    const wasF = a && box.contains(a) && a.closest(".field"), wasK = wasF ? keyOf(wasF) : "";
    const was = wasK ? { k: wasK, n: [...box.querySelectorAll(".field")].filter(x => keyOf(x) === wasK).indexOf(wasF) } : null;
    box.innerHTML = "";
    const T = target, m = monOf(T);
    const groups = [];
    for (const t of DATA.targets || []) {
      let g = groups.find(x => x.group === t.g);
      if (!g) groups.push(g = { group: t.g, items: [] });
      g.items.push({ value: t.k, label: t.n });
    }
    // a map first (its monsters join the list), then the monster
    const tiers = { 1: "T1 maps", 2: "T2 maps", 3: "T3 maps", 4: "T4 dungeons", 5: "Unique maps" };
    const mapGroups = [];
    for (const mp of (DATA.maps || {}).maps || []) {
      const gname = tiers[mp[2]] || "Maps";
      let g = mapGroups.find(x => x.group === gname);
      if (!g) mapGroups.push(g = { group: gname, items: [] });
      g.items.push({ value: mp[0], label: mp[1] });
    }
    selField(box, "Map", [{ value: "", label: "No map: a boss, or your own numbers" }].concat(mapGroups), () => T.map || "", v => {
      T.map = v;
      const mp = MAPS[v];
      // the monster that takes build A longest to kill (2026-11-24), else the map's first that spawns through it
      if (mp) {
        const tough = toughest(T), first = mp[4].find(r => r[1] === 0) || mp[4][0];
        T.preset = "map:" + (tough ? tough.id : first[0]);
        applyPreset();
      } else if (String(T.preset).startsWith("map:")) T.preset = "";
      renderTarget();
    }, { wide: true, hint: "Starts on its toughest monster for build A" });
    const mp = MAPS[T.map];
    if (mp) {
      const items = mp[4].map(([id, kind]) => {
        const x = DATA.maps.mons[id], imm = ELEMS.filter((e, i) => x[7 + ["fire", "ltng", "cold", "pois", "mag"].indexOf(e.k)] >= 100).map(e => e.n);
        return { value: "map:" + id, label: `${x[0]}${MAP_KIND[kind] ? ` (${MAP_KIND[kind]})` : ""}${imm.length ? ` · immune to ${andList(imm)}` : ""}` };
      });
      groups.unshift({ group: `In ${mp[1]}`, items });
    }
    const pick = selField(box, "Monster", [{ value: "", label: "Your own numbers" }].concat(groups), () => (m ? T.preset : ""), v => { T.preset = v; applyPreset(); renderTarget(); }, { wide: true });
    let tierField = null;
    if (m && m.tier) tierField = selField(box, "Tier", [0, 1, 2].map(t => ({ value: String(t), label: `Tier ${t}` })), () => String(T.tier || 0), v => { T.tier = +v; applyPreset(); renderTarget(); });
    /* typing a monster's own life or resistance makes it "your own numbers" (without redrawing the field being typed in) */
    const own = () => { if (T.preset) { T.preset = ""; pick.value = ""; if (tierField) tierField.closest(".field").hidden = true; } };
    // kinds: crushing blow's share (a unique's, a superunique's and a boss's that is no prime evil, Andariel's, Duriel's
    // and the quest bosses', as a monster's) and, for the hit check, Ignore Target's Defense (a normal monster, champion
    // or minion only) and -% target defense (halved against a superunique, a boss, a player). A champion, a minion or a
    // unique on a normal monster's row takes its life and level (the Kind split, eliteOf)
    const eliteOk = m => m && m.kind === "monster", e = eliteOk(m) ? eliteOf(T) : null;
    const kindTo = v => { T.kind = v; if (eliteOk(monOf(T)) && (eliteOf(T) || v === "monster")) applyPreset(); else own(); renderTarget(); };
    selField(box, "Kind", [{ value: "monster", label: "Normal monster" }, { value: "champion", label: "Champion" }, { value: "minion", label: "Minion of a unique" }, { value: "unique", label: "Unique monster" }, { value: "superunique", label: "Superunique" }, { value: "mapboss", label: "Map boss" }, { value: "lesser", label: "Andariel, Duriel, or a quest boss" }, { value: "boss", label: "Other boss (Mephisto, Diablo, Baal, ubers)" }, { value: "player", label: "Player" }], () => T.kind, kindTo, { wide: true,
      hint: e ? `A normal one’s life ×${nfd.format(e.life)}, level +${e.lvl}${T.kind === "minion" ? "; its boss’s mods don’t change its resistances" : ""}` : "" });
    // its type: on a normal monster's row its life, level and resistance; on your own numbers Ghostly's resistance
    if (T.kind === "champion") selField(box, "Champion type", CHAMPS.map(c => ({ value: c[0], label: c[1] })), () => champOf(T)[0], v => {
      T.champ = v;
      if (eliteOk(monOf(T))) applyPreset(); else if (v === "ghostly") T.res = 80;
      renderTarget();
    }, { hint: T.champ === "fanatic" ? "Its defense −70%, added to curses" : T.champ === "ghostly" ? "Physical resistance 80% (an immune one loses it)" : "" });
    // a unique's or superunique's resistance mods (2026-11-25, UMODS): on a normal monster's row, in the order ticked
    // (the order the game rolled them); a minion takes none of its boss's resistances
    if ((T.kind === "unique" || T.kind === "superunique") && eliteOk(m)) {
      const mb = el("div", { class: "fields", role: "group", "aria-label": "Its mods" }, box);
      UMODS.forEach(([k, name], i) => checkField(mb, name, () => (T.mods || []).includes(k), v => {
        T.mods = (T.mods || []).filter(x => x !== k).concat(v ? [k] : []);
        applyPreset(); renderTarget();
      }, { title: i === 0 ? "Its mods (each about 1 in 4 on a Hell unique; applied in the order ticked)" : "Its mods" }));
    }
    // the additions audit, CA-13: "Neither" alone needed decoding
    selField(box, "Type", [{ value: "demon", label: "Demon" }, { value: "undead", label: "Undead" }, { value: "", label: "Neither (not a demon or undead)" }], () => T.type || "", v => { T.type = v; own(); }, { wide: true, hint: "Attack rating vs demons / undead" });
    // its size (the game's monster table): how many of Fists of Fire's ground flames lie under it, how many meteors reach it
    selField(box, "Size", [{ value: "1", label: "Small" }, { value: "2", label: "Normal" }, { value: "3", label: "Big" }], () => String(clamp(+T.size || 1, 1, 3)), v => { T.size = +v; }, { hint: "Flames, meteors, and bolts that reach it" });
    numField(box, "Level", () => T.lvl, v => { T.lvl = v; own(); }, 1, 120, { hint: "Chance to hit" });
    const lifeIn = numField(box, "Life", () => T.life, v => { T.life = v; own(); }, 1, 100000000);
    numField(box, "Defense", () => T.def, v => { T.def = v; own(); }, 0, 1000000);
    numField(box, "Physical resistance %", () => T.res, v => { T.res = v; own(); }, -100, 1000);
    // its elemental resistances (100 or more: immune) and the map's absorb (2026-11-24)
    T.el = Object.assign({ fire: 0, ltng: 0, cold: 0, pois: 0, mag: 0 }, T.el || {});
    T.abs = Object.assign({ fire: 0, ltng: 0, cold: 0, mag: 0 }, T.abs || {});
    for (const e of ELEMS) numField(box, `${e.N} resistance %`, () => T.el[e.k], v => { T.el[e.k] = v; own(); }, -100, 1000, { hint: e.k === "fire" ? "100% or more: immune" : "" });
    // the uber rows' poison length reduction (MonProp: Diablo Clone 50, Rathma and Lucion 30)
    if (+T.plr > 0) numField(box, "Poison length reduction %", () => T.plr, v => { T.plr = v; own(); }, 0, 100, { hint: "Its poison lasts this much less" });
    for (const e of ELEMS) if (e.k !== "pois") numField(box, `Absorbs ${e.n} %`, () => T.abs[e.k], v => { T.abs[e.k] = v; }, 0, 100, { hint: e.k === "fire" ? "A map’s “Monsters absorb …”" : "" });
    // curses from others (the curse lists, 2026-11-24): your mercenary's and the party's, up to 3, on every build after
    // its own (Curses and debuffs, on its card), as many as the monster holds; the most curses a party member applies;
    // the others' Battle Cry (the higher of it and a build's own counts)
    T.others = Array.isArray(T.others) ? T.others : [];
    const cb = el("div", { class: "cm-block", role: "group", "aria-labelledby": "dm-cm-h" }, box);
    el("p", { class: "cm-h", id: "dm-cm-h" }, cb, "Curses from others");
    T.others.forEach((r, i) => {
      const row = el("div", { class: "fields cm-row", role: "group", "aria-label": `Curse from others ${i + 1}` }, cb);
      const from = selField(row, "From", [{ value: "a4", label: "Your mercenary (Act 4, Dark Ascendant)" }, { value: "party", label: "The party" }], () => r.who,
        v => { T.others[i] = v === "a4" ? { who: "a4", mlvl: 98 } : { who: "party", c: "amp", lvl: 20, cm: 0 }; renderTarget(); }, { wide: true });
      // one mercenary
      from.querySelector('option[value="a4"]').disabled = r.who !== "a4" && T.others.some(x => x.who === "a4");
      if (r.who === "a4") {
        const hint = () => `Amplify Damage ${a4Lvl(r.mlvl)}; it applies ${MERC_CURSES} curses`;
        const mi = numField(row, "Mercenary level", () => r.mlvl, v => { r.mlvl = v; mi.parentNode.querySelector("small").textContent = hint(); }, MERCS.a4.lvl, 99, { wide: true, hint: hint() });
      } else {
        selField(row, "Curse", CURSE_PICK, () => r.c, v => { r.c = v; renderTarget(); }, { wide: true });
        if (r.c !== "other") numField(row, "Level", () => r.lvl, v => { r.lvl = v; }, 0, MAX_LVL);
        if (r.c === "amp" || r.c === "attract" || r.c === "lowres") numField(row, "Curse Mastery", () => r.cm, v => { r.cm = v; }, 0, 20, { hint: "Base points" });
      }
      btnField(row, "✕", `Remove curse from others ${i + 1}`, () => { T.others.splice(i, 1); targetFocus = ".cm-add"; renderTarget(); update(true); }, { cls: "cm-x" });
    });
    const cf = el("div", { class: "fields cm-row cm-foot" }, cb);
    if (T.others.length < 3) btnField(cf, "+ Add a curse from others", "", () => { T.others.push({ who: "party", c: "amp", lvl: 20, cm: 0 }); targetFocus = ".cm-row:nth-last-child(2) select"; renderTarget(); update(true); },
      { wide: true, cls: "cm-add", hint: "Your mercenary’s, the party’s" });
    if (T.others.some(x => x.who === "party")) numField(cf, "Most curses a party member applies", () => T.partyMax, v => { T.partyMax = v; }, 1, 3, { wide: true, hint: "A Necromancer with Curse Mastery 10: 2; 20: 3" });
    numField(cf, "Battle Cry", () => T.bc, v => { T.bc = v; }, 0, MAX_LVL, { hint: `Level: Call to Arms +1–3, an Act 5 mercenary ${MERCS.bc.at}; the higher of it and a build’s own counts`, wide: true });
    numField(box, "Conviction", () => T.conv, v => { T.conv = v; }, 0, MAX_LVL, { hint: "Level: a Paladin’s, Infinity on a mercenary; its defense and fire, cold, lightning resistance" });
    numField(box, "Inner Sight", () => T.inner, v => { T.inner = v; }, 0, MAX_LVL, { hint: "Level: an Amazon’s" });
    numField(box, "Players in the game", () => T.players, v => { T.players = v; if (monOf(T)) { T.life = presetLife(monOf(T), T); lifeIn.value = T.life; } }, 1, 8, { hint: "Its life and crushing blow" });
    const goTo = targetFocus && box.querySelector(targetFocus);
    targetFocus = "";
    if (goTo) goTo.focus();
    else if (was) {
      const f = [...box.querySelectorAll(".field")].filter(x => keyOf(x) === was.k)[Math.max(was.n, 0)];
      const c = f && f.querySelector("input, select");
      if (c) c.focus();
    }
  }
  let targetFocus = "";  // a control to focus after the monster's fields are drawn again (a curse row added or removed)
  const nfd = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  function targetNote() {
    const T = target, m = monOf(T), out = [];
    if (m) {
      const e = m.kind === "monster" ? eliteOf(T) : null, as = eliteName(T, m);
      const els = ELEMS.map(x => `${x.n} ${resPct(+((e ? T.el : m.el) || {})[x.k] || 0)}`);
      out.push(`${m.n}${m.map ? ` in ${m.map[1]}` : ""}${as ? ` as ${as}` : ""}: level ${e ? T.lvl : m.lvl}, ${nf0.format(T.life)} life in Hell with ${T.players} player${+T.players > 1 ? "s" : ""}${m.tier ? ` at tier ${T.tier || 0}` : ""}, physical resistance ${e ? T.res : m.res}%, ${andList(els)} resistance, defense ${nf0.format(m.def)}${m.type ? `, ${m.type === "demon" ? "a demon" : "undead"}` : ""}.`);
      const mods = !e ? "A normal monster: Kind makes it a champion, a unique’s minion, or a unique."
        : T.kind === "minion" ? "A unique’s minion: its boss’s mods don’t change its resistances."
        : T.kind !== "champion" ? `${(T.mods || []).length ? "Its resistances and defense with its mods, in the order ticked." : "Tick its mods to count them."} In Hell a unique has 3 random mods of about 12, each about 1 in 4; a superunique its own, then 2 random ones. A monster with two immunities gets none of their resistance.`
        : T.champ === "fanatic" ? "A Fanatic’s own −70% defense adds to curses’ in the chance to hit." : "";
      if (m.map && mods) out.push(mods);
      // the crushing blow share with the players in the game (each after the first adds 1.4 to the divisor)
      const div = cbDivisor(T, 1, 1, false), ranged = `a ranged attack’s 1/${nfd.format(div * 1.5)}`;
      out.push(m.kind === "boss" ? `A crushing blow takes 1/${nfd.format(div)} of its life left at full life (${ranged}), less as it loses life.` : `A crushing blow takes 1/${nfd.format(div)} of its life left (${ranged})${m.kind === "lesser" ? ", as from a monster" : ""}.`);
      if (m.tier) out.push("Its phases, immunity, healing, and helpers aren’t counted.");
    }
    const P = cursedRes(null, T), Dp = defenseOf(null, T), on = P.on;
    // the others' curses, each with whose it is, then Battle Cry, Conviction and Inner Sight
    const what = on.curses.map(x => `${curseOwner(x)} ${curseName(x)}`).concat(on.bc ? [`Battle Cry ${on.bc.lvl}`] : [], Dp.conv ? [`Conviction ${Dp.conv.lvl}`] : [], Dp.inner ? [`Inner Sight ${Dp.inner.lvl}`] : []);
    const left = on.all.filter(x => x.off).length;
    // (the additions audit, CA-13: the note read like shorthand; SW-02: the Oxford comma)
    out.push(what.length ? `After ${andList(what)}${left ? ` (it holds only ${on.cap} curse${on.cap > 1 ? "s" : ""}: ${left} more left out)` : ""}: physical resistance ${resPct(P.res)}${P.immune ? " (immune: curses and Battle Cry count half)" : P.res < 0 ? ` (${resPct(Math.max(tdiv(P.res, 2), -100))} against your hits: below 0% it counts half)` : ""}, defense ${numTxt(Dp.def)}. A build’s own curses and Battle Cry (Curses and debuffs, on its card) count first. A build’s pierce and −% target defense lower them further for that build.`
      : "A build’s own curses and Battle Cry are on its card (Curses and debuffs). A build’s pierce and −% target defense lower this monster’s physical resistance and defense for that build.");
    return out.join(" ");
  }
  /* the monster in a line, for the strip at the bottom: its physical resistance and defense with the others' curses,
     Battle Cry and Conviction (each build's own are on its card) */
  function targetShort() {
    const T = target, m = monOf(T);
    const as = eliteName(T, m);
    const who = m ? `<b>${esc(m.n)}</b>${m.tier ? ` (tier ${T.tier || 0})` : ""}${as ? ` (${as})` : ""}` : "<b>your monster</b>";
    const bits = [`${nf0.format(T.life)} life`, `${resPct(cursedRes(null, T).res)} physical resistance`, `${numTxt(defenseOf(null, T).def)} defense`];
    if (+T.players > 1) bits.push(`${T.players} players`);
    return `Against ${who}: ${bits.join(", ")}`;
  }

  // ================================================================== output
  let results = [];
  let updTimer = 0;
  function update(now) {
    clearTimeout(updTimer);
    updTimer = setTimeout(renderResults, now ? 0 : 60);
  }
  const fmt = (v, nf) => (v === undefined || v === null || !Number.isFinite(v) ? "—" : (nf || nf0).format(v));
  // a list in words, with the Oxford comma from three on: "a and b", "a, b, and c" (the additions audit, SW-02)
  const andList = (a, word = "and") => (a.length < 3 ? a.join(` ${word} `) : `${a.slice(0, -1).join(", ")}, ${word} ${a[a.length - 1]}`);
  /* a build's name: the one typed, else its class's (2026-11-22, the author: "naming the builds after the class"),
     with its letter where another unnamed build has the same class ("Paladin A", "Paladin B") */
  const className = b => (CLS[b.cls] ? CLS[b.cls].name : "Build");
  const autoName = i => (builds.some((x, j) => j !== i && !x.name && x.cls === builds[i].cls) ? `${className(builds[i])} ${LETTERS[i]}` : className(builds[i]));
  const bname = i => (mode === "weapons" ? wlabel(i) : mode === "gear" ? gearLabel(i) : builds[i].name || autoName(i));
  /* beside its letter badge (the card's head, the strip, the Copy to list, the phone tabs) a build's name without its
     own letter: "[B] Barbarian", while sentences say "Barbarian B" (the additions audit, CA-14) */
  const badgeName = i => (mode === "weapons" ? wlabel(i) : mode === "gear" ? gearLabel(i) : builds[i].name || className(builds[i]));
  function renderResults() {
    syncWeapons();  // weapons mode: every weapon's build takes build A's character as it is typed
    syncGear();     // gear mode: every item's build is build A wearing it
    results = builds.map(b => evaluate(b, target));
    results.forEach(r => { r.next = nextBreakpoint(r); });
    renderDock();
    dockSoon();
    renderVerdict();
    fillCards();
    if (mode !== "builds") renderWeaponTable();
    $("dm-target-note").textContent = targetNote();
    $("dm-target-sum-text").innerHTML = targetShort();  // on phones the monster in a line (CA-12)
    toughNote();
    renderTab(currentTab);
    save();
    histPush();
    resetButton();
  }
  /* the tab on show; the others are drawn when they show */
  function renderTab(tab) {
    if (tab === "side") renderSide();
    else if (tab === "bp") renderBreakpoints();
    else if (tab === "par") renderParity();
    else if (tab === "prof") drawProfile();
    else if (tab === "fight") fightTab();   // fight:start fight:end
  }
  /* fight:start */
  /* The Fight (2026-11-26, the author: "a fight to the kill", a lane for each build): its code and pictures lie in the
     folder beside the page and load the first time the tab opens (a script tag, so the page opened as a file works
     too); then the page hands it what it needs (FIGHT_API) and redraws it whenever the results change */
  const FIGHT_BASE = SCRIPT_SRC ? new URL("../../resources/Damage-Calculator-Fight/", SCRIPT_SRC).href : "Damage-Calculator-Fight/";
  /* the Fight's files' version: the site's build writes a checksum of them here (website/hooks.py), asked for with
     each file, so a browser never mixes an old file with a new one after a publish (the audit of 2026-11-27, PE-06);
     opened as a file it stays as it is and nothing is asked for with it */
  const FIGHT_V = "c1d1d408", FIGHT_Q = /^__/.test(FIGHT_V) ? "" : "?v=" + FIGHT_V;
  let fightState = "";   // "" not loaded, "loading", "ready", "failed"
  function fightTab() {
    const box = $("dm-fight");
    if (fightState === "ready") { window.ezFight.render(); return; }
    if (fightState) return;
    fightState = "loading";
    // (its two other files asked for at once, not after fight.js has come: the audit's PE-02)
    ["Damage-Calculator-Fight/stage.js", "Fight-Sprites/index.js"].forEach(f => {
      const l = document.createElement("link");
      l.rel = "preload"; l.as = "script"; l.href = FIGHT_BASE + "../" + f + FIGHT_Q;
      document.head.appendChild(l);
    });
    const s = document.createElement("script");
    s.src = FIGHT_BASE + "fight.js" + FIGHT_Q;
    const fail = () => { fightState = "failed"; box.innerHTML = '<p class="note">The fight couldn&rsquo;t load. Reload the page to try again.</p>'; };
    s.onload = () => {
      if (!window.ezFight || !window.ezFight.init(FIGHT_API, box, FIGHT_BASE, FIGHT_V)) { fail(); return; }
      fightState = "ready";
      if (currentTab === "fight") window.ezFight.render();
    };
    s.onerror = fail;
    document.head.appendChild(s);
  }
  /* what the Fight tab gets from the page (fight.js refuses another version): each lane's build, its evaluation and
     the monster; the fight itself (fightRun, run k of killTime's own stream: mulberry32(12345)); the engines and data */
  const FIGHT_API = {
    v: 1,
    lanes: () => results.map((E, i) => ({ i, letter: LETTERS[i], key: KEYS[i], name: badgeName(i), b: builds[i], E, T: target })),
    // the monster picked (a boss's or a map monster's row: its name n, MonStats id, size...), null for your own numbers
    monster: () => monOf(target) || null,
    // a build's attack speed setup as the IAS engine takes it (its weapons, what the other hand holds)
    iasSetup: (b, attack) => iasSetup(withBC(b), attack),
    // what the build and the others put on the monster: the curses that hold, its Battle Cry
    onMonster: (b, T) => onMonster(b, T),
    killSeed: 12345, fightRun, prepFight, mulberry32, killTime, killCap, killRuns,
    // what the lanes are ("builds", "weapons", "gear": a lane's name then is its weapon's or item's), and whether a link
    // opened the tab (it lands on it once the lanes are laid out)
    mode: () => mode, fromLink: () => fightFromLink,
    // the Holy auras on a build, a Paladin's own and the items', each at its level (2026-11-27)
    holyAuras: b => holyAuras(b),
    evaluate: (b, T, opts) => evaluate(b, T, opts),
    IAS, DATA, EX, ATT, SK, W, Calc, unitOf, fmt, andList, esc: s => esc(s),
    // what a skill formula reads of a build (its synergies' points, its masteries), and the attack's hard points
    ctxOf: (b, attack) => ctxOf(b, attack), hardOf: b => hardOf(b),
    reducedMotion: () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches),
  };
  /* fight:end */
  /* every number behind each build's damage per second; the best of a row green, bold and marked with a diamond */
  function renderSide() {
    const tb = $("dm-results");
    // each build's letter badge over its column: on phones the lines under a row name their build by it (CA-06)
    const kb = i => `<span class="kb" style="--key:${KEYS[i]}" aria-hidden="true">${LETTERS[i]}</span>`;
    let h = "<thead><tr><th></th>" + results.map((r, i) => `<th>${kb(i)}${esc(badgeName(i))}</th>`).join("") + "</tr></thead><tbody>";
    const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    /* on phones a row's small lines go under it across the table, each after its build's letter, so the builds' numbers
       fit side by side (the additions audit, CA-06: a column was ~240 px wide for "skill 1,155, Fanaticism 410, ..."
       and the second build was off the screen); hidden from screen readers, who hear them in their cells */
    const subRow = cells => {
      const subs = cells.map(c => { const k = c.indexOf("<small>"); return k < 0 ? "" : c.slice(k + 7).replace(/<\/small>$/, ""); });
      if (!subs.some(Boolean)) return "";
      return `<tr class="subs" aria-hidden="true"><td colspan="${results.length + 1}"><div class="sbw">` +
        subs.map((s, k) => (s ? `<span class="sb">${kb(k)}<span>${s}</span></span>` : "")).join("") + "</div></td></tr>";
    };
    const row = (label, f, cls, best) => {
      let top = null;
      if (best && results.length > 1) {
        const vals = results.map(r => { const v = best.v(r); return v === null || v === undefined || !Number.isFinite(v) ? null : v; });
        const ok = vals.filter(v => v !== null);
        if (ok.length > 1) {
          const t = best.low ? Math.min(...ok) : Math.max(...ok), u = best.low ? Math.max(...ok) : Math.min(...ok);
          if (!near(t, u)) top = vals.map(v => v !== null && near(v, t));
        }
      }
      // a value of two weapons ("130–340 / 144–383") may wrap between them on a phone, never inside one (CA-06)
      const nw = c => { const k = c.indexOf("<small>"), main = k < 0 ? c : c.slice(0, k);
        return main.replace(/ (\/|·) /g, " $1\u0001").split("\u0001").map(x => `<span class="nw">${x}</span>`).join(" ") + (k < 0 ? "" : c.slice(k)); };
      const cells = results.map(r => nw(f(r))), subs = subRow(cells);
      h += `<tr class="${[cls || "", subs ? "has-subs" : ""].join(" ").trim()}"><td>${label}</td>` + cells.map((c, k) => (top && top[k] ? `<td class="best">${c}<span class="sr-only"> (best)</span></td>` : `<td>${c}</td>`)).join("") + "</tr>" + subs;
    };
    const group = label => { h += `<tr class="group"><td colspan="${results.length + 1}">${label}</td></tr>`; };
    // (no best mark for a build that can't make its attack)
    const dmg = get => r => (r.attack.frames_only || (!r.fr && r.why) ? null : get(r));
    const secs = k => (k && !k.never ? k.secs : null);
    group("Damage");
    row("Weapon damage", r => (r.spell ? "—<small>a spell</small>" : r.per.map(p => `${p.wr.min}–${p.wr.max}`).join(" / ")));
    row("Damage bonus", r => (r.spell ? "—" : `+${nf0.format(r.per[0].pct + r.per[0].off)}%<small>${pctParts(r)}</small>`));
    row("Damage per hit", r => {
      if (r.spell) return `${spellText(r) || "—"}<small>${aUnit(r.attack)}, before resistances</small>`;
      const shown = r.per.map(p => `${fmt(p.mn256 / 256)}–${fmt(p.mx256 / 256)}`).join(" / "), scr = screenText(r);
      const why = [vsWord(r), scr && scr !== shown ? `character screen ${scr}` : ""].filter(Boolean).join("; ");
      return shown + `<small>${why || (scr ? "character screen, before crit" : "before crit")}</small>`;
    });
    row("Critical / deadly strike", r => r.spell ? "—<small>none on a spell</small>" : `${byWeapon(r, p => `${fmt(p.crit.pc * 100, nf1)}% / ${fmt(p.crit.pd * 100, nf1)}%`)}<small>${byWeapon(r, p => `&times;${nf2.format(p.crit.cm)} / &times;${nf2.format(p.crit.dm)}`)}, +${fmt((r.mean - 1) * 100, nf1)}% on average</small>`);
    row("Average hit", r => fmt(r.spell ? (r.ex ? r.ex.raw : 0) : r.eff), "", { v: dmg(r => (r.spell ? (r.ex ? r.ex.raw : 0) : r.eff)) });
    row("Monster&rsquo;s physical resistance", r => r.spell && !r.spellPhys ? "—" : `${resPct(r.R.res)}${resWords(r.R) ? `<small>${resWords(r.R)}</small>` : ""}`);
    if (results.some(r => elemText(r))) {
      row("Elemental per hit", r => elemText(r) || "—");
      row("Monster&rsquo;s elemental resistances", r => (elemText(r) ? elemResText(r) : "—"));
      row("Elemental on the monster", r => (hasElem(r) ? `${fmt(r.final - r.physFinal)}<small>${wvOn(r) ? `with ${wvNames(r.wv)} between casts` : r.spell ? aUnit(r.attack) : "a hit"}${r.pois ? `, poison included: ${fmt(r.pois.perSec)} a second` : ""}</small>` : "—"), "", { v: r => r.final - r.physFinal });
    }
    row("Average hit on the monster", r => fmt(r.final) + (wvOn(r) ? `<small>with ${wvNames(r.wv)} between casts</small>` : ""), "strong", { v: dmg(r => r.final) });
    row("Crushing blow", r => r.cb.ch ? `${byWeapon(r, p => `${fmt(p.cb.ch * 100)}%`)} of hits<small>${r.cb.share > 0 ? `each takes ${byWeapon(r, p => pct(p.cb.share))} of the life left${target.kind === "boss" ? " (at full life)" : ""}` : "none: immune"}${r.cb.cbe ? `, efficiency +${byWeapon(r, p => `${p.cb.cbe}%`)}` : ""}</small>` : "—");
    group("Hitting");
    row("Attack rating", r => (r.attack.frames_only ? "—" : r.rolls ? `${arText(r)}<small>character screen${r.screen.ar !== r.per[0].AR.ar ? `: ${nf0.format(r.screen.ar)}` : ""}</small>` : "—<small>never misses</small>"));
    row("Monster&rsquo;s defense", r => r.spell ? "—" : `${byWeapon(r, p => numTxt(p.D.def))}${defWords(r) ? `<small>${defWords(r)}</small>` : ""}`);
    row("Chance to hit", r => (r.attack.frames_only ? "—" : r.rolls ? hitText(r) : "100%"), "", { v: dmg(r => r.toHit) });
    group("Speed");
    row("Frames per attack", r => r.fr ? `${frLabel(r.fr)}${r.fr.alt ? "<small>attack 1 / attack 2</small>" : madeOf(r.fr) > 1 ? `<small>${hitsWord(r.fr, ":")}</small>` : ""}` : r.why ? "—<small>can’t attack this way</small>" : "N/A");
    if (results.some(r => r.wv && r.wv.rot.length)) row("Between cooldowns", r => (wvOn(r) ? `${wvNames(r.wv)}<small>${rotCounts(r.wv, esc(r.attack.label), r.wv.S, false)}: a ${nf0.format(r.wv.frames)}-frame rotation</small>`
      : r.wv && r.wv.rot.length ? `—<small>${andList(r.wv.rot.map(o => esc(o.att.label)))} not counted</small>` : "—"));
    row("Total attack speed", r => tasCell(r));
    row("Next breakpoint", r => (!r.next ? "—" : r.next.capped ? `—<small>more ${spdWord(r.next)} makes it no faster</small>` : `+${r.next.add}% ${spdWord(r.next)}<small>${r.next.fcr ? "" : "on other gear: "}${frLabel(r.next.fr)} frames${wvNext(r.next)}, ${signed(r.next.gain)} damage per second</small>`));
    row("Hits per second", r => r.fr ? `${fmt(r.hps, nf2)}${r.spell || r.attack.sentinel ? `<small>${unitOf(r.attack)}s</small>` : ""}` : "—", "", { v: r => (r.fr ? r.hps : null) });
    group("Result");
    row("Damage per second", r => r.fr && !r.attack.frames_only ? fmt(r.dps) : "—", "strong", { v: dmg(r => (r.fr ? r.dps : null)) });
    const killCell = k => (k ? (k.never ? "Never" : `${nf1.format(k.secs)} s<small>${nf1.format(k.hits)} ${k.unit || "hit"}s</small>`) : "—");
    row("Kill time", r => killCell(r.kill), "strong", { v: r => secs(r.kill), low: true });
    if (results.some(r => kcText(r.kc))) row("Kills within", r => kcText(r.kc) || "—", "", { v: r => (r.kc ? r.kc[Math.max(0, results[0].kc ? results[0].kc.findIndex(p => p >= 0.5) : 1)] : null) });
    if (results.some(r => r.killNoCb)) row("Without crushing blow", r => (r.killNoCb ? killCell(r.killNoCb) : r.kill ? "the same" : "—"), "", { v: r => secs(r.killNoCb || r.kill), low: true });
    if (results.length > 1) row(`Damage per second against ${esc(bname(0))}`, r => (r === results[0] ? "—" : r.dps && results[0].dps ? signed(r.dps / results[0].dps - 1) : "—"));
    h += "</tbody>";
    tb.innerHTML = h;
  }
  /* the strip at the bottom of the screen while the builds are being edited: the monster, then each build's damage
     per second, kill time and why it differs from build A */
  function renderDock() {
    const dock = $("dm-dock");
    dock.innerHTML = "";
    const A = results[0];
    const head = el("div", { class: "dk-head" }, dock);
    el("span", { html: targetShort() }, head);
    const ch = el("button", { type: "button", "aria-label": "Change the monster" }, head, "Change");
    ch.addEventListener("click", () => {
      targetOpen(true);  // on phones its fields open (CA-12)
      $("dm-target-panel").scrollIntoView({ block: "start", behavior: "smooth" });
      const s = $("dm-target").querySelector("select");
      if (s) s.focus({ preventScroll: true });
    });
    // Undo, Redo and Copy a link, at hand while the cards are on screen (the author's pick, 2026-11-24)
    const acts = el("span", { class: "dk-acts" }, head);
    el("button", { type: "button", class: "ez-quiet", id: "dm-dk-undo", "aria-label": "Undo", title: "Undo your last change (Ctrl+Z)", html: '<span aria-hidden="true">&#8630;</span> Undo' }, acts).addEventListener("click", () => histGo(-1));
    el("button", { type: "button", class: "ez-quiet", id: "dm-dk-redo", "aria-label": "Redo", title: "Redo what you undid (Ctrl+Y)", html: '<span aria-hidden="true">&#8631;</span> Redo' }, acts).addEventListener("click", () => histGo(1));
    const cp = el("button", { type: "button", class: "ez-quiet", id: "dm-dk-share" }, acts, "Copy a link");
    cp.addEventListener("click", () => copyLink(ok => { cp.textContent = ok ? "Link copied" : "Copy a link"; if (!ok) $("dm-share").click(); setTimeout(() => { if (cp.isConnected) cp.textContent = "Copy a link"; }, 2000); }));
    histButtons();
    results.forEach((r, i) => {
      const t = el("div", { class: "dk" }, dock);
      t.style.setProperty("--key", KEYS[i]);
      el("span", { class: "dk-name" }, t, mode === "builds" ? `${LETTERS[i]} · ${badgeName(i)}` : bname(i));
      const v = el("span", { class: "dk-val" }, t);
      if (r.attack.frames_only || !r.fr) v.textContent = r.fr ? `${frLabel(r.fr)} frames` : "—";
      else v.innerHTML = `${nf0.format(r.dps)}<small> per second</small>`;
      const sub = [];
      if (!r.fr && r.why && !r.attack.frames_only) sub.push("can’t attack this way");
      if (r.kill) sub.push(r.kill.never ? "can’t kill it" : `kills in ${nf1.format(r.kill.secs)} s${r.attack.k === "charge" ? " (strikes only)" : ""}`);
      if (kcShort(r.kc)) sub.push(kcShort(r.kc));
      if (i > 0 && r.dps && A.dps) {
        const x = r.dps / A.dps - 1;
        sub.push(`<span class="${x < -0.0005 ? "bad" : x > 0.0005 ? "good" : ""}">${signed(x)} vs ${esc(bname(0))}</span>`);
      }
      el("span", { class: "dk-sub", html: sub.join(" · ") }, t);
      if (i > 0 && r.dps && A.dps && !r.attack.frames_only && !A.attack.frames_only) {
        const f = factors(r, A, true);
        if (f.length) el("span", { class: "dk-why" }, t, f.join(" · "));
      }
    });
  }
  /* the strip at the bottom shows while it would sit over the cards being edited: the cards on screen (their top above
     the middle of the window) and no card's totals above the strip; at its own place under the cards, and where it
     doesn't stick (short windows), always */
  function dockShown() {
    dockRaf = 0;
    const dock = $("dm-dock");
    if (getComputedStyle(dock).position !== "sticky") { dock.classList.remove("off"); return; }
    const vh = innerHeight, dh = dock.offsetHeight, top = 64;
    const at = $("dm-dock-at").getBoundingClientRect().top;
    if (at + dh <= vh) { dock.classList.remove("off"); return; }   // at its own place: not over anything
    const bx = $("dm-builds").getBoundingClientRect();
    const feet = [...root.querySelectorAll("#dm-builds .build-foot")].concat(mode !== "builds" && $("dm-wres") ? [$("dm-wres")] : []);
    const seen = feet.some(f => { const q = f.getBoundingClientRect(); return q.height > 0 && q.top < vh - dh && q.bottom > top; });
    dock.classList.toggle("off", !(bx.top < vh / 2 && bx.bottom > top && !seen));
  }
  let dockRaf = 0;
  const dockSoon = () => { if (!dockRaf) dockRaf = requestAnimationFrame(dockShown); };
  addEventListener("scroll", dockSoon, { passive: true });
  addEventListener("resize", dockSoon);
  /* damage per second = average hit x critical and deadly strikes x the monster's resistance x hits per second x the
     chance to hit, so a build's difference from build A splits exactly into those five */
  const FACTORS = [
    [r => r.hit, "more per hit", "less per hit", "per hit"],
    [r => r.mean, "more from critical and deadly strikes", "less from critical and deadly strikes", "crit and deadly strike"],
    [r => r.pm, "more through the monster’s resistance", "less through the monster’s resistance", "through resistance"],
    [r => r.toHit, "more of its hits land", "fewer of its hits land", "hits landing"],
    [r => r.hps, "more hits per second", "fewer hits per second", "hits per second"],
  ];
  /* with elemental damage (or poison) on either build the hit on the monster is physical + elemental, so the split is
     the hit on the monster (its physical and elemental parts named), the chance to hit and hits per second */
  const FACTORS_EL = [
    [r => r.final, "more per hit on the monster", "less per hit on the monster", "per hit"],
    FACTORS[3], FACTORS[4],
  ];
  const hasElem = r => r.final - r.physFinal > 1e-9;
  function factors(r, A, short) {
    const out = [], el = hasElem(r) || hasElem(A);
    for (const [get, more, less, word] of el ? FACTORS_EL : FACTORS) {
      const y = get(r) / get(A) - 1;
      if (!Number.isFinite(y) || Math.abs(y) < 0.0005) continue;
      let s = short ? `${signed(y)} ${word}` : `${nf1.format(Math.abs(y) * 100)}% ${y > 0 ? more : less}`;
      if (el && !short && get === FACTORS_EL[0][0]) {
        s += ` (physical ${fmt(A.physFinal)} → ${fmt(r.physFinal)}, elemental ${fmt(A.final - A.physFinal)} → ${fmt(r.final - r.physFinal)})`;
      }
      out.push(s);
    }
    return out;
  }
  /* the chance to kill within n hits in words (killChances): "1 hit 12%, 2 hits 87%, 3 hits 100%", from the first that
     happens at least 1% of the time up to the first sure one ("" when none does); a chance that rounds to 0 or 100
     without being it says so */
  const kcPct = p => (p >= 1 ? "100%" : p > 0.995 ? "over 99%" : p <= 0 ? "0%" : p < 0.005 ? "under 1%" : `${Math.round(p * 100)}%`);
  function kcText(kc) {
    if (!kc) return "";
    const out = [];
    for (let n = 0; n < kc.length; n++) {
      if (kc[n] < 0.005) continue;
      out.push(`${n + 1} ${kc.unit || "hit"}${n ? "s" : ""} ${kcPct(kc[n])}`);
      if (kc[n] >= 1) break;
    }
    return out.join(", ");
  }
  /* the strip's short form: the fewest hits that kill at least half the time, "2-hit kills 87%" */
  function kcShort(kc) {
    const n = kc ? kc.findIndex(p => p >= 0.5) : -1;
    return n < 0 ? "" : `${n + 1}-${kc.unit || "hit"} kills ${kcPct(kc[n])}`;
  }
  /* a hit's elemental damage in words: "fire 355–762, cold 1–2, poison 75 over 5 s" (two weapons: each, by " / "); the
     range in whole points as the game shows it (the fraction dropped: the BH stats screen's "355-762" for 287-615 fire
     with +24% fire skill damage, the author's, 2026-11-24) */
  function elemText(r) {
    if (r.spell) return spellText(r);
    const one = p => ELEMS.filter(e => p.el && p.el[e.k]).map(e => e.k === "pois"
      ? `poison ${fmt(p.el.pois.avg / 256)} over ${nf1.format(p.el.pois.len / 25)} s`
      : `${e.n} ${fmt(Math.floor(p.el[e.k].lo / 256))}–${fmt(Math.floor(p.el[e.k].hi / 256))}`).join(", ");
    const parts = r.per.map(one);
    return parts.some(Boolean) ? parts.map(x => x || "none").join(" / ") : "";
  }
  /* a spell's damage a cast in words (2026-11-25): "lightning 1,413–2,591, magic 729–889", Holy Bolt's "2 × magic
     744–995": whole points before the monster's resistances, as its tooltip shows them */
  /* (a count that isn't whole: "about 8.8 × cold 302–365"; Meteor's "fire 947–1,145, physical 947–1,145, 3 flames of
     fire 123–132 a second for 1.6 s") */
  const elName = e => (e === "phys" ? "physical" : ELEM[e].n);
  function spellText(r) {
    if (!r.ex) return "";
    if (r.pois && r.pois.roll) {
      const z = r.pois.roll;
      return `poison ${fmt(Math.floor(z.lo * z.len / 256))}–${fmt(Math.floor(z.hi * z.len / 256))} over ${nfd.format(z.len / 25)} s`;
    }
    const w = (q, f) => `${fmt(Math.floor(q.lo * (f || 1) / 256))}–${fmt(Math.floor(q.hi * (f || 1) / 256))}`;
    return r.ex.always.filter(x => x.n > 0).map(x => (x.frames
      ? `${x.flames < 1 ? `a ${(x.noun || ["flame"])[0]} 1 time in ${nf0.format(1 / x.flames)}` : `${nf0.format(x.flames)} ${(x.noun || ["flame", "flames"])[x.flames === 1 ? 0 : 1]}`} of ${elName(x.el)} ${w(x.q, 25)} a second for ${nfd.format(x.frames / 25)} s`
      : `${x.lab ? `${x.lab} ` : ""}${x.n === 1 ? "" : `${Number.isInteger(x.n) ? nf0.format(x.n) : `about ${nf1.format(x.n)}`} × `}${elName(x.el)} ${w(x.q)}`)).join(", ");
  }
  /* a spell's elements' resistances in a few words: "lightning 40%, magic 0%" */
  const spellRes = r => (r.ex ? [...new Set(r.ex.always.map(x => x.el).concat(r.pois ? ["pois"] : []))].map(e => (e === "phys" ? `physical ${resPct(r.R.res)}` : `${ELEM[e].n} ${resPct(r.ER[e].res)}`)).join(", ") : "");
  /* the monster's resistance to each element this build deals: "fire 120% → 103% (immune: Conviction counts half)" */
  function elemResText(r, all) {
    const out = [];
    if (r.spellPhys) out.push(`physical ${resPct(r.R.res)}`);
    for (const e of ELEMS) {
      if (!all && !(r.spell ? (!!r.ex && r.ex.always.some(x => x.el === e.k)) || (e.k === "pois" && !!r.pois) : r.per.some(p => p.el && p.el[e.k]))) continue;
      const R = r.ER[e.k];
      const mods = [R.conv ? `Conviction ${signedInt(R.conv)}` : "", R.lr ? `Lower Resist ${signedInt(R.lr)}` : "", R.sanc ? `your Sanctuary ${signedInt(R.sanc)}` : "", R.inf ? `${r.attack.label} ${signedInt(R.inf)}` : "", R.pierce ? `your −${R.pierce}%` : ""].filter(Boolean);
      let s = `${e.n} ${resPct(R.res)}`;
      if (mods.length) s += ` (its own ${resPct(R.base)}: ${andList(mods)}${R.immune && (R.conv || R.lr || R.sanc || R.inf) ? ", half: it is immune" : ""}${R.halved ? "; below 0% it counts half" : ""})`;
      else if (R.res >= 100) s += " (immune)";
      if (R.abs) s += `, absorbs ${R.abs}%`;
      out.push(s);
    }
    return out.join("; ");
  }
  /* two builds alike but for their weapons (Compare weapons, 2026-11-22): the answer is about the weapons */
  const canon = v => (v && typeof v === "object" ? (Array.isArray(v) ? v.map(canon) : Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]))) : blank(v));
  const weaponOnly = (b, a) => {
    const rest = x => JSON.stringify(canon(Object.assign({}, x, { name: "", wname: "", w: null, o: null })));
    const hands = x => JSON.stringify(canon({ w: x.w, o: DUAL[x.cls] && x.o.on ? x.o : null }));
    return rest(b) === rest(a) && hands(b) !== hands(a);
  };
  const sameBuild = (b, a) => JSON.stringify(canon(Object.assign({}, b, { name: "", wname: "" }))) === JSON.stringify(canon(Object.assign({}, a, { name: "", wname: "" })));
  /* a build's weapons in a few words: "Eth Berserker Axe (435% ED)", two as "A + B" */
  function weaponWords(b) {
    // a kick takes the weapon's "+X damage", never its enhanced damage
    const kick = (ATT[b.s.k] || {}).kick;
    const one = x => { const w = W[x.code]; return !w ? "no weapon" : `${x.eth && w.eth ? "Eth " : ""}${esc(w.name)}${kick ? (x.dmg ? ` (+${x.dmg} damage)` : "") : ` (${x.ed}% ED)`}`; };
    return dual(b) ? `${one(b.w)} + ${one(b.o)}` : one(b.w);
  }
  function weaponVerdict(r, A, i, bn, an, x) {
    const head = Math.abs(x) < 0.0005 ? "the same damage per second as" : `<b>${nf1.format(Math.abs(x) * 100)}% ${x > 0 ? "more" : "less"}</b> damage per second than`;
    const ch = (a, b) => { const y = b / a - 1; return !Number.isFinite(y) || Math.abs(y) < 0.0005 ? "" : ` (<b>${signed(y)}</b>)`; };
    // "a → b", or "the same, a" where both read alike
    const to = (a, b) => (a === b ? `the same, ${a}` : `${a} → ${b}`);
    const parts = [];
    parts.push(`Damage per hit: ${to(fmt(A.hit), fmt(r.hit))} on average, before critical and deadly strikes${ch(A.hit, r.hit)}`);
    if (r.fr && A.fr) {
      const fa = `${frLabel(A.fr)} frames`, fb = `${frLabel(r.fr)} frames`;
      const hits = madeOf(r.fr) > 1 && madeOf(r.fr) === madeOf(A.fr) ? ` for ${hitsWord(r.fr, "")}` : "";
      const nb = r.next && !r.next.capped ? `; the next breakpoint is <b>+${r.next.add}% ${spdWord(r.next)}</b>${r.next.fcr ? "" : " on other gear"} (${frLabel(r.next.fr)} frames)` : r.next && r.next.capped ? `; more ${spdWord(r.next)} makes it no faster` : "";
      parts.push(`Attack speed: ${to(fa, fb)}${hits}${ch(A.hps, r.hps) ? `, hits per second${ch(A.hps, r.hps)}` : ""}${nb}`);
    }
    const cs = q => byWeapon(q, p => `${fmt(p.crit.pc * 100, nf1)}% / ${fmt(p.crit.pd * 100, nf1)}%`);
    parts.push(`Critical / deadly strike: ${to(cs(A), cs(r))}, ${to(`×${nf2.format(A.mean)}`, `×${nf2.format(r.mean)}`)} on average${ch(A.mean, r.mean)}`);
    const cbs = q => (q.cb.ch ? `${byWeapon(q, p => `${fmt(p.cb.ch * 100)}%`)} of hits` : "none");
    const kills = r.kill && A.kill && !r.kill.never && !A.kill.never ? `kill time ${to(`${nf1.format(A.kill.secs)} s`, `${nf1.format(r.kill.secs)} s`)}` : "";
    if (r.cb.ch || A.cb.ch) parts.push(`Crushing blow: ${to(cbs(A), cbs(r))}${kills ? `; ${kills}` : ""}`);
    else if (kills) parts.push(kills[0].toUpperCase() + kills.slice(1));
    if (r.rolls || A.rolls) parts.push(`Chance to hit: ${to(A.rolls ? hitText(A) : "100%", r.rolls ? hitText(r) : "100%")}${ch(A.toHit, r.toHit)}`);
    if (ch(A.pm, r.pm)) parts.push(`Through the monster’s resistance${ch(A.pm, r.pm)}`);
    const lead = mode === "weapons" ? `${bn} on ${esc(charName())}: <b>${weaponWords(r.b)}</b> does ${head} ${an}, ${weaponWords(A.b)}.`
      : `${bn}, the same build with another weapon: <b>${weaponWords(r.b)}</b> does ${head} ${an}’s ${weaponWords(A.b)}.`;
    return `<div class="wv"><p>${lead}</p><ul>${parts.map(t => `<li>${t}</li>`).join("")}</ul></div>`;
  }
  /* why a build with more or less IAS than build A is no faster (2026-11-22, audit CALC-16: "kills the monster in
     2.2 s instead of 2.2 s", the reason only in Breakpoints) */
  function sameWhy(r, A) {
    const ias = b => b.g.ias + b.w.ias + (dual(b) ? b.o.ias : 0);
    if (ias(r.b) === ias(A.b) || !r.fr || !A.fr || Math.abs(r.hps / A.hps - 1) > 0.0005) return "";
    if (r.fr.note === "fixed") return `IAS doesn’t change how fast ${esc(r.attack.label)} hits: it keeps its own pace.`;
    if (r.next && r.next.capped && A.next && A.next.capped) return "Both are at the fastest this attack gets: more IAS makes it no faster.";
    return `Both reach the same breakpoint, ${frLabel(r.fr)} frames: the IAS between them changes nothing.`;
  }
  function renderVerdict() {
    const box = $("dm-verdict"), A = results[0], an = esc(bname(0));
    if (results.length < 2) {
      box.innerHTML = `<p>Press <b>+ Add a build</b> to put a copy of ${an} beside it, then change one thing: this says how much more or less damage the other builds do than ${an}, and why. <b>Copy to…</b> on a card copies that build. To weigh weapons for one character, switch to <b>Compare weapons</b>.</p>`;
      return;
    }
    // a build that can't make its attack says so, and why (build A's once: nothing compares with it until it can)
    const cant = (r, who) => `<p>⚠ ${who} can’t attack this way: ${esc(r.why)} There’s nothing to compare until it can.</p>`;
    if (!A.fr && A.why && !A.attack.frames_only) { box.innerHTML = cant(A, `<b><span class="key" style="background:${KEYS[0]}"></span>${an}</b>`); return; }
    box.innerHTML = results.slice(1).map((r, k) => {
      const i = k + 1, bn = `<b><span class="key" style="background:${KEYS[i]}"></span>${esc(bname(i))}</b>`;
      if (!r.fr && r.why && !r.attack.frames_only) return cant(r, bn);
      if (r.attack.frames_only || A.attack.frames_only || !r.dps || !A.dps) {
        const fo = r.attack.frames_only ? r : A.attack.frames_only ? A : null;
        return `<p>${bn}: ${fo ? `the damage of ${esc(fo.attack.label)} isn’t worked out yet` : "no damage per second to compare"}.</p>`;
      }
      const x = r.dps / A.dps - 1;
      if (weaponOnly(r.b, A.b)) return weaponVerdict(r, A, i, bn, an, x);
      if (mode === "gear" && !gear.items[i].src) return `<p>Pick an item in column ${LETTERS[i]}, or paste one from the game.</p>`;
      if (mode === "gear" && sameBuild(r.b, A.b)) return `<p>${bn} changes nothing this page counts, against ${an}.</p>`;
      if (sameBuild(r.b, A.b)) return `<p>${bn} is a copy of ${an} so far: change its weapon, or anything else, to see what it is worth.</p>`;
      const head = Math.abs(x) < 0.0005 ? `does the same damage per second as ${an}` : `does <b>${nf1.format(Math.abs(x) * 100)}% ${x > 0 ? "more" : "less"}</b> damage per second than ${an}`;
      const f = factors(r, A, false);
      let s = `<p>${bn} ${head}${f.length ? ": " + f.join(", ") : ""}.`;
      if (r.kill && A.kill && !r.kill.never && !A.kill.never) {
        const cbx = q => (q.cb.ch ? `${byWeapon(q, p => `${fmt(p.cb.ch * 100)}%`)} of hits${q.cb.cbe ? ` (+${byWeapon(q, p => `${p.cb.cbe}%`)} efficiency)` : ""}` : "none");
        const cbDiff = cbx(r) !== cbx(A);
        const ks = nf1.format(r.kill.secs), ka = nf1.format(A.kill.secs);
        s += ` ${cbDiff ? `With crushing blow on ${cbx(r)} (${an}: ${cbx(A)}), it kills` : "It kills"} the monster in <b>${ks}&nbsp;s</b>${ks === ka ? `, as ${an} does` : ` instead of ${ka}&nbsp;s`}.`;
      }
      // the kill chances (a fight of a few hits): within the hits that kill at least half the time for build A
      const kn = r.kc && A.kc ? A.kc.findIndex(p => p >= 0.5) : -1;
      if (kn >= 0) {
        const a = kcPct(A.kc[kn]), q = kcPct(r.kc[kn]);
        s += ` Within ${kn + 1} hit${kn ? "s" : ""} it kills ${q === a ? `as often as ${an}: ${q}` : `<b>${q}</b> of the time (${an}: ${a})`}.`;
      }
      const why = Math.abs(x) < 0.0005 ? sameWhy(r, A) : "";
      return s + (why ? " " + why : "") + "</p>";
    }).join("");
  }
  /* weapons mode: what each weapon does, a column under each, the best of a row marked (Side by Side's rows, shorter) */
  function renderWeaponTable() {
    const box = $("dm-wres");
    if (!box || !results.length) return;
    const A = results[0], near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)), gm = mode === "gear";
    // Compare gear: each column's item and what it adds (Now: what it has)
    const words = (r, i) => (gm ? esc(gearWords(gear.items[i], builds[0])) : weaponWords(r.b));
    let h = `<table class="dm-table"><thead><tr><th scope="col"><span class="sr-only">${gm ? "Wearing each item" : "With each weapon"}</span></th>` +
      results.map((r, i) => `<th scope="col"><span class="key" style="background:${KEYS[i]}"></span>${esc(bname(i))}<small>${words(r, i)}</small></th>`).join("") + "</tr></thead><tbody>";
    const row = (label, f, best, cls) => {
      let top = null;
      if (best && results.length > 1) {
        const vals = results.map(r => { const v = best.v(r); return v === null || v === undefined || !Number.isFinite(v) ? null : v; });
        const ok = vals.filter(v => v !== null);
        if (ok.length > 1) {
          const t = best.low ? Math.min(...ok) : Math.max(...ok), u = best.low ? Math.max(...ok) : Math.min(...ok);
          if (!near(t, u)) top = vals.map(v => v !== null && near(v, t));
        }
      }
      h += `<tr class="${cls || ""}"><th scope="row">${label}</th>` + results.map((r, k) => `<td class="${top && top[k] ? "best" : ""}">${f(r, k)}${top && top[k] ? '<span class="sr-only"> (best)</span>' : ""}</td>`).join("") + "</tr>";
    };
    const live = r => !r.attack.frames_only && r.fr;
    row("Damage per second", (r, k) => (live(r) ? `${fmt(r.dps)}${k && A.dps ? `<small>${signed(r.dps / A.dps - 1)} vs ${esc(bname(0))}</small>` : ""}` : "—"), { v: r => (live(r) ? r.dps : null) }, "strong");
    row("Kill time", r => (r.kill ? (r.kill.never ? "Never" : `${nf1.format(r.kill.secs)} s<small>${nf1.format(r.kill.hits)} hits</small>`) : "—"), { v: r => (r.kill && !r.kill.never ? r.kill.secs : null), low: true });
    if (results.some(r => kcText(r.kc))) {
      const n0 = Math.max(0, A.kc ? A.kc.findIndex(p => p >= 0.5) : 1);
      row("Kills within", r => kcText(r.kc) || "—", { v: r => (r.kc ? r.kc[n0] : null) });
    }
    row("Damage per hit", r => `${fmt(r.hit)}<small>${r.per.map(p => `${fmt(p.mn256 / 256)}–${fmt(p.mx256 / 256)}`).join(" / ")}, before crit</small>`, { v: r => r.hit });
    row("Critical / deadly strike", r => r.spell ? "—<small>none on a spell</small>" : `${byWeapon(r, p => `${fmt(p.crit.pc * 100, nf1)}% / ${fmt(p.crit.pd * 100, nf1)}%`)}<small>×${nf2.format(r.mean)} on average</small>`, { v: r => r.mean });
    row("Frames per attack", r => (r.fr ? `${frLabel(r.fr)}${madeOf(r.fr) > 1 ? `<small>${hitsWord(r.fr, "")}</small>` : ""}${r.next ? `<small>${r.next.capped ? `more ${spdWord(r.next)} makes it no faster` : `next: +${r.next.add}% ${spdWord(r.next)}${r.next.fcr ? "" : " on other gear"}`}</small>` : ""}` : "—"), { v: r => (r.fr ? r.hps : null) });
    row("Crushing blow", r => (r.cb.ch ? `${byWeapon(r, p => `${fmt(p.cb.ch * 100)}%`)} of hits` : "—"), { v: r => r.cb.ch });
    row("Chance to hit", r => (r.rolls ? hitText(r) : "100%"), { v: r => r.toHit });
    row("Attack rating", r => (r.rolls ? arText(r) : "—"));
    if (gm) {
      // what an item changes on the character: Strength and Dexterity, the attack's level
      const dif = f => results.some(r => f(r) !== f(A));
      if (dif(r => `${r.b.c.str}/${r.b.c.dex}`)) row("Strength / Dexterity", r => `${nf0.format(r.b.c.str)} / ${nf0.format(r.b.c.dex)}`);
      if (dif(r => r.b.s.lvl)) row(`${esc(A.attack.label)} level`, r => nf0.format(r.b.s.lvl), { v: r => r.b.s.lvl });
    }
    box.innerHTML = `<div class="scroll">${h}</tbody></table></div>`;
  }
  /* each card's summaries, subtotals, totals, and the fields that differ from build A */
  const getPath = (o, p) => p.split(".").reduce((x, k) => (x === undefined || x === null ? undefined : x[k]), o);
  const blank = v => (v === undefined || v === null || v === 0 || v === "" || v === false ? null : v);
  const same = (a, b) => JSON.stringify(blank(a)) === JSON.stringify(blank(b));
  // the hits of a round: "5 hits: 4 + 4 + 4 + 4 + 7", and where some don't land "5 hits: ..., 1 lands"
  function madeOf(fr) { return fr.made || fr.hits; }
  // each hit's frames as the IAS Calculator writes them, "5/4/7" (2026-11-22, audit CALC-18; "5 + 4 + 7" until then)
  function hitsWord(fr, form) {  // form ":" "5 hits: 4/4/...", "(" "5 hits (4/4/...)", "" the count alone
    const n = madeOf(fr), sw = fr.per.length === n ? fr.per.join("/") : "";
    const per = !sw || !form ? "" : form === "(" ? ` (${sw})` : `: ${sw}`;
    return `${n} hits${per}${fr.hits < n ? `, ${fr.hits} land${fr.hits === 1 ? "s" : ""}` : ""}`;
  }
  function framesText(fr) {
    if (fr.note === "cast" && fr.cast.cycle) return `${fr.frames} frames a cycle at ${fr.cast.fcr}% faster cast rate: your ${fr.cast.cycle - 1} ${fr.cast.cycle > 2 ? "curses" : "curse"} cast again and Dark Pact, ${fr.cast.own} frames each`;
    if (fr.note === "cast" && fr.cast.dsentry) return `An explosion every ${fr.frames} frames: ${fr.cast.petmax} Death Sentries, each exploding a corpse every ${fr.cast.cycle} frames while there are corpses (they stay; attack speed only lays them faster)`;
    if (fr.note === "cast" && fr.cast.trap) return `A trap every ${fr.frames} frames keeps ${fr.cast.petmax} up: each fires ${fr.cast.shots} times over ${nfd.format(fr.cast.life / 25)} s${fr.cast.own ? ` (${fr.cast.own} frames to lay one at your attack speed; laying faster only replaces the oldest)` : ""}`;
    if (fr.note === "cast" && fr.cast.tick === "summon") return `A cast every ${fr.frames} frames keeps ${fr.cast.petmax} heads up (${fr.cast.own} frames to cast at ${fr.cast.fcr}% faster cast rate; casting faster only replaces the oldest)`;
    if (fr.note === "cast" && fr.cast.tick === "aura") return `${fr.frames === 9 ? "A rock" : "A gust"} every ${fr.frames} frames (${nf2.format(25 / fr.frames)} a second) while it lasts; faster cast rate doesn’t change it`;
    if (fr.note === "cast" && fr.cast.tick) return fr.cast.tick === "channel"
      ? `A breath every ${fr.frames} frames while you hold it (${nf2.format(25 / fr.frames)} a second); faster cast rate doesn’t change it`
      : fr.cast.dfill ? `A strike every ${fr.frames} frames (${nf2.format(25 / fr.frames)} a second) while it is on; attack speed and faster cast rate don’t change it`
      : `A strike every ${fr.frames} frames (${nf2.format(25 / fr.frames)} a second) while the storm is up; faster cast rate doesn’t change it`;
    if (fr.note === "cast") {
      const c = fr.cast;
      return `${fr.frames} frames a cast at ${c.fcr}% faster cast rate${c.seq ? " (cast as a sequence)" : ""}${c.cd && fr.frames > c.own ? `: ${c.own} casting, then its ${c.cd}-frame cooldown from the release` : ""}`;
    }
    if (fr.alt) return `${frLabel(fr)} frames (attack 1 / attack 2)`;
    const q = fr.r.t.parts[0];
    // a cooldown that holds the attack back: it runs from the release, and the next attack waits for it
    if (q.wait) return `${fr.frames} frames an attack: ${q.own} attacking, ${q.wait} waiting for its ${fr.r.p.cd}-frame cooldown`;
    return `${fr.frames} frames${madeOf(fr) > 1 ? ` for ${hitsWord(fr, "(")}` : " an attack"}`;
  }
  /* (#40, 2026-11-22) this attack in the IAS Calculator: iasSetup in the IAS page's short address keys, every one
     written (its defaults differ: one target here) */
  const IAS_KEYS = { cls: "c", form: "f", atk: "a", lvl: "l", tg: "t", w: "w", wi: "wi", oh: "o", w2: "w2", wi2: "wj", gear: "g", fana: "fa",
    frenzy: "fr", fst: "fs", inc: "in", bos: "bs", hustle: "hu", ww: "ww", cdr: "cr" };
  const siteRoot = () => (typeof __md_scope !== "undefined" ? __md_scope.href : "https://filtersby-erazure.github.io/PD2-Loot-Filter/");
  function iasLink(b, attack) {
    const s = iasSetup(withBC(b), attack);
    // from=dmg: the IAS Calculator says where the setup came from and keeps yours for Back to my setup (CA-09)
    return siteRoot() + "resources/ias-calculator/#tab-calc&" + Object.entries(IAS_KEYS).filter(([k]) => s[k] !== undefined)
      .map(([k, c]) => `${c}=${typeof s[k] === "boolean" ? (s[k] ? 1 : 0) : encodeURIComponent(s[k])}`).join("&") + "&from=dmg";
  }
  // the other skills' frames at a rotation's next breakpoint (one of theirs can be the one)
  const wvNext = nb => (nb && nb.wv ? `, ${nb.wv.map(([n, f]) => `${esc(n)} ${f}`).join(", ")}` : "");
  const timesWord = k => (k === 0 ? "never" : k === 1 ? "once" : k === 2 ? "twice" : `${nf0.format(k)} times`);
  // a rotation that is counted (another skill cast in the wait), the skills in it, and its pattern in words
  const wvOn = r => !!(r.wv && r.wv.k > 0);
  const wvNames = W => andList(W.use.map(o => esc(o.att.label)));
  function rotCounts(W, a, S, dmg) {
    const c = W.casts, head = c === 1 ? `Each cast of ${a}` : `Every ${nf0.format(c)} casts of ${a}`;
    const parts = S.map((s, j) => (j === 0 || !W.count[j] ? null : `${esc(s.att.label)} ${timesWord(W.count[j])}${dmg ? ` (${fmt(W.by[j])})` : ""}`)).filter(Boolean);
    return `${head}${dmg ? ` (${fmt(W.by[0])})` : ""}: ${andList(parts)}`;
  }
  const wvFoot = r => `<div><span>A rotation on the monster</span><b>${fmt(r.wv.dmg)}</b><small>${rotCounts(r.wv, esc(r.attack.label), r.wv.S, true)}, in ${nf0.format(r.wv.frames)} frames</small></div>`;
  /* between cooldowns, in words: the skills and their frames, the rotation counted and its damage, the debuff, and the
     other way */
  function weaveLines(r) {
    const W = r.wv, a = esc(r.attack.label), out = [];
    for (const o of W.rot) if (o.none) out.push(`Between cooldowns: ${esc(o.att.label)} ${o.none === "frames" ? "can’t be used with this weapon" : "does no damage to this monster"}, so it isn’t counted`);
    if (!W.use.length) return out;
    const many = W.use.length > 1, names = wvNames(W);
    if (W.none === "wait") { out.push(`Between cooldowns: at this speed ${a} has no wait for its cooldown, so ${names} ${many ? "aren’t" : "isn’t"} cast`); return out; }
    const S = W.S, M = S[0], nm = j => esc(S[j].att.label);
    const each = W.use.map((o, i) => {
      const s = S[i + 1], lvl = `level ${o.lvBC}${o.lvBC !== o.lvl ? " with Battle Command" : ""}`;
      return `${esc(o.att.label)} (${lvl}: ${s.own} frames${s.chan ? " a breath" : ""}${s.cyc > s.own ? `, again ${s.cyc} frames after it starts at the soonest` : ""})`;
    });
    out.push(`Between cooldowns: ${a} takes ${M.own} frames, then waits ${M.cyc - M.own} for its cooldown. In the wait: ${andList(each)}`);
    if (!W.k) {
      out.push(`Casting ${many ? "them" : "it"} there does <b>${fmt(W.dps)}</b> a second at best, against <b>${fmt(W.alone)}</b> with ${a} alone, so ${many ? "they aren’t" : "it isn’t"} counted`);
      return out;
    }
    // the order, and whether each may hold the skill back (said once when they all go by the same rule)
    const cdj = j => S[j].cyc > S[j].own, rule = j => (!W.hold[j] ? 0 : cdj(j) ? 1 : 2), rules = W.order.map(rule), same = rules.every(x => x === rules[0]);
    const who = j => `${nm(j)}${cdj(j) ? " whenever its cooldown allows" : ""}`;
    const RULE = [[` as long as it ends before ${a} is ready again`, `, each only when it ends before ${a} is ready again`, ` only when it ends before ${a} is ready again`],
      [`, even holding ${a} back when cast at the start of a wait`, `, each even holding ${a} back when cast at the start of a wait`, `, even holding ${a} back when cast at the start of a wait`],
      [` until ${a} is ready, the last one holding it back`, `, until ${a} is ready, the last one holding it back`, `, even holding ${a} back`]];
    const ord = same ? `${W.order.map(who).join(", then ")}${RULE[rules[0]][many ? 1 : 0]}` : W.order.map(j => `${who(j)}${RULE[rule(j)][2]}`).join("; then ");
    const sec = f => `${nf0.format(f)} frames, ${nfd.format(f / 25)} s`;
    const never = W.order.filter(j => !W.count[j]).map(nm);
    out.push(`The most damage, in each wait: ${ord}. ${rotCounts(W, a, S, false)} (${sec(W.frames)})${never.length ? `; ${andList(never)} never ${never.length > 1 ? "get" : "gets"} a turn` : ""}`);
    const per = W.by.map(v => v * 25 / W.frames);
    out.push(`A second on the monster: <b>${fmt(W.dps)}</b> in all (${andList(S.map((s, j) => `${nm(j)} ${fmt(per[j])}`))}), against <b>${fmt(W.alone)}</b> with ${a} alone`);
    // the debuff: how much of what it lowers it is on for
    const D = W.use.find(o => o.deb && o.deb.v < 0);
    if (D && W.full > 0) {
      const el = ELEM[D.deb.el].n, hit = S.filter(s => s.parts.length).map(s => esc(s.att.label));
      out.push(`${esc(D.att.label)}’s −${nf0.format(Math.abs(D.deb.v))}% ${el} resistance lasts ${D.deb.len} frames after each breath: it is on for ${nf0.format(100 * W.add / W.full)}% of the ${el} damage of ${andList(hit)}, <b>+${fmt(W.add * 25 / W.frames)}</b> a second (<b>+${fmt(W.full * 25 / W.frames)}</b> if it were on all the time)`);
    }
    if (W.other > 0 && W.other < W.dps * (1 - 1e-9)) out.push(`${W.until ? `Casting only what ends before ${a} is ready again` : `Letting ${many ? "one" : "it"} hold ${a} back until it ends`}: at best <b>${fmt(W.other)}</b> a second. The page counts the way that does more`);
    return out;
  }
  function nextText(nb) {
    if (!nb) return "";
    if (nb.capped) return nb.fcr ? "More faster cast rate makes this spell no faster" : "More IAS makes this attack no faster";
    return `Next breakpoint: <b>+${nb.add}% ${spdWord(nb)}</b>${nb.fcr ? "" : " on other gear"} → ${frLabel(nb.fr)} frames${wvNext(nb)} (${signed(nb.gain)} damage per second)`;
  }
  function fillCards() {
    const A = builds[0];
    results.forEach((r, i) => {
      const refs = cardRefs[i];
      if (!refs) return;
      const b = r.b, att = r.attack, p0 = r.per[0], w = W[b.w.code], S = refs.sum, U = refs.sub;
      const wname = w ? esc(w.name) : "this weapon";
      S.char.textContent = `Level ${b.c.lvl} ${CLS[b.cls].name}, ${b.c.str} Str, ${b.c.dex} Dex`;
      const swith = p0.kick ? `on kicks (${esc(p0.kick.boots.name)})` : `with ${wname}`;
      U.char.innerHTML = r.spell ? "Strength and Dexterity don’t raise a spell’s damage" : p0.strB || p0.dexB ? `Strength <b>+${p0.strB}%</b>, Dexterity <b>+${p0.dexB}%</b> damage ${swith}` : `No damage from Strength or Dexterity ${swith}`;
      S.weapon.textContent = r.spell ? "Not used by a spell" : !w ? "" : p0.kick ? `${b.w.eth && w.eth ? "Eth " : ""}${w.name}${p0.kick.both ? `, +${p0.kick.both} damage` : ""}` : `${b.w.eth && w.eth ? "Eth " : ""}${w.name}, ${b.w.ed}% → ${p0.wr.min}–${p0.wr.max}`;
      U.weapon.innerHTML = r.spell && att.bombs ? `${esc(att.label)} doesn’t use its damage; its attack speed throws faster, and + skills, skill damage, and −% enemy resistance count (put them in Other gear)` : r.spell && att.trap ? `${esc(att.label)} doesn’t use its damage; its attack speed lays the traps faster, and + skills, skill damage, and −% enemy resistance count (put them in Other gear; the traps get your skill damage, not your −% enemy resistance)` : r.spell ? `${esc(att.label)} doesn’t use its damage; its faster cast rate, + skills, skill damage, and −% enemy resistance count (put them in Other gear)` : p0.kick ? `Kicks don’t use its damage${p0.kick.both ? `; its <b>+${p0.kick.both}</b> damage counts` : ""}`
        : `Weapon damage <b>${p0.wr.min}–${p0.wr.max}</b>${att.throw ? " thrown" : ""}`;
      if (S.wmore) S.wmore.textContent = weaponStatsText(b.w) || "None";
      if (S.wel) S.wel.textContent = elemFieldsText(b.w, false) || "None";
      if (S.oel) S.oel.textContent = elemFieldsText(b.o, false) || "None";
      if (S.gel) S.gel.textContent = elemFieldsText(b.g, true) || "None";
      if (S.omore) S.omore.textContent = weaponStatsText(b.o) || "None";
      if (S.off) {
        const o = W[b.o.code], p1 = r.per[1];
        const hw = holdWhy(b);
        S.off.textContent = b.o.on && o ? `${o.name}${p1 ? ` → ${p1.wr.min}–${p1.wr.max}` : hw ? " (not held)" : ""}` : "None";
        U.off.innerHTML = !b.o.on ? "One weapon" : p1 ? `Weapon damage <b>${p1.wr.min}–${p1.wr.max}</b>` :
          r.offUnused ? `Not used: ${esc(att.label)} hits with the first weapon only` : hw ? `⚠ Not held: ${esc(hw)}` : "Not counted: dual wielding needs two weapons with one-hand damage";
      }
      S.gear.textContent = r.spell ? (att.trap || att.bombs ? `${+b.g.ias || 0}% IAS` : `${+b.g.fcr || 0}% FCR`) : `${b.g.ias}% IAS, ${b.g.ed}% ED, ${b.g.ds}% DS${att.frames_only ? "" : ` → ×${nf2.format(r.mean)}`}`;
      const gl = [];
      if (!att.frames_only && !r.spell) gl.push(`Critical strike <b>${byWeapon(r, p => `${fmt(p.crit.pc * 100, nf1)}%`)}</b>, deadly strike <b>${byWeapon(r, p => `${fmt(p.crit.pd * 100, nf1)}%`)}</b>: <b>×${nf2.format(r.mean)}</b> on average`);
      if (r.cb.ch) gl.push(r.cb.share > 0 ? `Crushing blow on <b>${byWeapon(r, p => `${fmt(p.cb.ch * 100)}%`)}</b> of hits, each <b>${byWeapon(r, p => pct(p.cb.share))}</b> of the life left` : "Crushing blow: none, the monster is immune");
      if (r.fr && r.fr.note === "cast" && r.fr.cast.trap) gl.push(`Attack speed <b>${+b.g.ias || 0}%</b> IAS lays a trap${r.fr.cast.own ? ` in ${r.fr.cast.own} frames` : ""}; the traps fire at their own pace`);
      else if (r.fr && r.fr.note === "cast" && att.dfill) gl.push(`IAS <b>${+b.g.ias || 0}%</b> (${esc(att.label)} keeps its own pace: neither attack speed nor faster cast rate changes it)`);
      else if (r.fr && r.fr.note === "cast") gl.push(`Faster cast rate <b>${r.fr.cast.fcr}%</b>, ${r.fr.cast.eff} after diminishing returns${r.fr.cast.tick ? ` (${esc(att.label)} keeps its own pace)` : ""}`);
      else if (r.fr && r.fr.note !== "fixed") { const sp = r.fr.r.sp; gl.push(`Attack speed <b>${spSign(sp.raw - 100)}</b>${speedCounts(sp) ? ", " + speedCounts(sp) : ""}`); }
      if (r.next) gl.push(nextText(r.next));
      if (r.fr && r.fr.note !== "fixed" && r.fr.note !== "cast" && !att.frames_only) gl.push(`<a href="${iasLink(b, att)}">See this attack frame by frame in the IAS Calculator</a>`);
      if (vsWord(r)) gl.push(`Damage <b>${vsWord(r)}</b>`);
      // the weapons' own -% target defense and Ignore Target's Defense count with other gear's (per weapon)
      const itdW = r.per.filter(p => p.D.itdOn), tdW = r.per.filter(p => !p.D.itd && p.D.x);
      const onW = list => (r.per.length > 1 && list.length < r.per.length ? ` (${r.per.indexOf(list[0]) ? "second" : "first"} weapon)` : "");
      if (itdW.length && r.rolls) gl.push(r.D.itdWorks ? `Ignore Target’s Defense${onW(itdW)}: the monster’s defense <b>0</b>` : "Ignore Target’s Defense: <b>none</b> against this monster");
      if (tdW.length && r.rolls) gl.push(`Target defense <b>−${byWeapon(r, p => `${p.D.x}%`)}</b>${r.D.ba ? ` (with your Blessed Aim’s ${r.D.ba})` : ""}${r.D.halved && tdW.some(p => p.D.x < 100) ? ", half against this monster" : ""}`);
      U.gear.innerHTML = gl.join("<br>");
      S.skill.textContent = `${att.label}${att.dmg || att.charge || att.spois || att.veng || att.fclaw || att.sel || att.ex ? ` ${b.s.lvl}` : ""}${r.fr ? ` → ${frLabel(r.fr)} frames` : r.why ? " → can’t attack" : ""}`;
      const sl = [];
      const bonus = [r.sp ? `skill <b>+${nf0.format(r.sp)}%</b>` : "", p0.ms.dmg ? `mastery <b>+${nf0.format(p0.ms.dmg)}%</b>` : "", r.flat ? `<b>+${nf0.format(r.flat)}</b> flat` : ""].filter(Boolean);
      if (bonus.length && !att.frames_only) sl.push(`Damage: ${bonus.join(", ")}`);
      sl.push(r.fr ? framesText(r.fr) : r.why ? `⚠ <b>Can’t attack:</b> ${esc(r.why)}` : "No animation for this weapon");
      if (r.wv) sl.push(...weaveLines(r));
      if (r.fof) sl.push(...fofLines(r.fof, +b.s.lvl));
      if (r.fof && r.fof.fin) sl.push(...finLines(r.fof));
      else if (r.fof && att.charge !== "cobra" && +b.s.fin > 0 && b.s.fk !== "dt") sl.push("Dragon Claw finisher: it needs a claw in each hand, so it isn’t counted");
      if (att.sel || att.ex || r.conv) sl.push(...exLines(r, b, att));
      /* Blade Shield (2026-11-25): its strikes, the damage worked out twice, the skill's own not dealt */
      if (att.dfill && r.fr && r.fr.cast) {
        const q = r.per[0];
        sl.push(`While it is on, every <b>${nf0.format(r.fr.frames)}</b> frames (${nfd.format(r.fr.frames / 25)} s: 20 less half the points put in it), whatever your attack speed, it strikes every monster within ${nfd.format((Calc.value(att.id, "aurarangecalc", +b.s.lvl || 1, ctxOf(b, att)) || 4) * 2 / 3)} yards of you, rolling to hit with your attack rating: <b>${nf0.format(Math.floor(q.mn256 / 256))}–${nf0.format(Math.floor(q.mx256 / 256))}</b> physical with your gear’s elemental damage. Its tooltip says 25% of your weapon’s damage; the game works it out twice (25%, then 25% of that plus another 25%): 31% of your weapon’s damage raised by your percentages, crit and deadly strike rolled each time, poison twice as long`);
        sl.push("The tooltip’s Damage line (the skill’s own damage, Blade Sentinel’s and Blade Fury’s points) isn’t dealt: the strike starts from nothing");
      }
      /* Blade Fury's and Blade Sentinel's own damage (the tooltip's Damage line), added to the weapon's share and
         raised with it (2026-11-25) */
      if (att.sphys && r.per[0] && r.per[0].sph && r.per[0].sph.hi > 0) {
        const q = r.per[0].sph, src = att.srcdam || 128;
        sl.push(`Its own damage: <b>${nf0.format(Math.floor(q.lo / 256))}–${nf0.format(Math.floor(q.hi / 256))}</b> physical with its synergies (the tooltip’s Damage line), added to ${src === 128 ? "all" : src === 96 ? "3/4" : `${src}/128`} of your weapon’s damage, and your percentages raise both`);
      }
      if (att.fclaw) {
        const F = fireClawsOf(b, att), f = r.per[0].el.fire, w = (lo, hi) => `${nf0.format(Math.floor(lo / 256))}–${nf0.format(Math.floor(hi / 256))}`;
        sl.push(`Fire on the hit: <b>${nf0.format(F.min)}–${nf0.format(F.max)}</b> before fire skill damage`);
        if (f && f.flames) sl.push(`${nf0.format(F.makers)} firestorms; a flame’s fire <b>${w(f.flames.lo, f.flames.hi)}</b>, counted ${f.flames.n} times on the monster, as the tooltip’s Firestorm Damage (one flame hit in 5 frames while it stands in them)`);
      }
      if (att.veng) {
        const V = vengeanceOf(b, att), x = r.per[0].el, w = q => (q && q.veng ? `${nf0.format(Math.floor(q.veng.lo / 256))}–${nf0.format(Math.floor(q.veng.hi / 256))}` : "none");
        sl.push(`Elemental damage <b>+${nf0.format(V.pct)}%</b>, its own <b>${nf0.format(Math.floor(V.flat[0] / 256))}–${nf0.format(Math.floor(V.flat[1] / 256))}</b> of each element`);
        sl.push(`Its explosion on the monster: fire <b>${w(x.fire)}</b>, cold <b>${w(x.cold)}</b>, lightning <b>${w(x.ltng)}</b> (your gear’s and its own, raised by the % and each element’s skill damage)`);
      }
      if (att.spois) {
        const sp = skillPoison(b, att), m = +b.g.pm || 0, t = v => Math.floor((v + tdiv(v * m, 100)) * sp.len / 256);
        const pr = sp ? `<b>${nf0.format(t(sp.min))}–${nf0.format(t(sp.max))}</b> over ${nfd.format(sp.len / 25)} s` : "";
        if (sp && att.k === "rabies") sl.push(`Its poison: ${pr} on each hit`);
        else if (sp && att.k === "poisonstrike") {
          sl.push(`Its poison: ${pr} on each hit with a dagger or a scythe, with your gear’s poison`);
          sl.push(`While you strike, it pierces <b>${nf0.format(psPierce(withBC(b), att))}%</b> of the monster’s poison resistance (5% + 1% a level, at most 50%): on its own poison and your gear’s, never on your other skills; it makes the poison last longer too, as −% enemy poison resistance does`);
        }
        else if (sp) {
          sl.push(`Its poison on the javelin: ${pr}, with your gear’s poison${att.ex === "plaguejav" ? "" : "; the clouds it leaves behind never reach a monster standing alone"}`);
          if (att.ex === "plaguejav" && r.pois) sl.push(`Hit or miss, a ring of ${r.pois.ring} poison clouds bursts out of the monster, each ${pr} (the skill’s alone, not your gear’s); the strongest roll counts`);
        }
        if (r.pois && r.fr) sl.push(`A new poison replaces the one running only when it is at least as strong: the monster is poisoned ${fmt(r.pois.cover * 100, nf0)}% of the time, ${fmt(r.pois.perSec)} a second on average`);
      }
      const around = areaLine(r, b, att);
      if (around) sl.push(around);
      U.skill.innerHTML = sl.join("<br>");
      // the "… that hit" field's hint: the count worked out for this monster and distance
      const hx = HITS_LABEL[att.ex] && r.ex ? r.ex.always.find(x => x.auto !== undefined) : null, hh = hx && (U.skill.closest("details") || document).querySelector('[data-path="s.hits"] small');
      if (hh) hh.textContent = `0: worked out, about ${Number.isInteger(hx.auto) ? nf0.format(hx.auto) : nf1.format(hx.auto)} of ${nf0.format(hx.of)}`;
      S.aura.textContent = auraSummary(b) + (r.aur.p && !r.spell ? ` → +${nf0.format(r.aur.p)}%` : "");
      // the buffs' attack speed (the engine's skill speed but the attack's own)
      const sIAS = r.fr && r.fr.r ? r.fr.r.sp.parts.filter(([what]) => !(r.fr.r.p.sk && what === r.fr.r.p.sk.n)).reduce((x, [, v]) => x + v, 0) : 0, al = [];
      al.push(r.spell ? "Their damage bonus doesn’t reach a spell (Battle Command’s + skills do)" : r.aur.p ? `Damage <b>+${nf0.format(r.aur.p)}%</b> (${r.aur.parts.map(x => `${x[0]} ${nf0.format(x[1])}`).join(", ")})` : "No damage bonus");
      if (sIAS) al.push(`Attack speed <b>+${sIAS}</b>`);
      // the auras' and buffs' attack rating % (the gear's, the skill's and the mastery's are other sections')
      const arParts = p0.AR.parts.filter(([l]) => AURA_AR.includes(l) || holyAuras(b).some(A => A.name === l));
      if (arParts.length && !att.frames_only) al.push(`Attack rating <b>+${nf0.format(arParts.reduce((s, x) => s + x[1], 0))}%</b> (${arParts.map(x => `${x[0]} ${nf0.format(x[1])}`).join(", ")})`);
      const en = enchantOf(withBC(b));
      for (const e of ["fire", "cold"]) if (en[e] && !r.spell) al.push(`${en[e].name}: <b>${nf0.format(en[e].min)}–${nf0.format(en[e].max)}</b> ${e} on every attack${en[e].own ? "" : " (a party Sorceress’s: half)"}, with your gear’s and your ${e} skill damage`);
      U.aura.innerHTML = al.join("<br>");
      // curses and debuffs (the curse lists): how many curses the monster holds, each curse on it (✓) or not (✕, and
      // why), Battle Cry, then its physical resistance, defense and elemental resistances for this build
      const C = r.R.C, on = C.on, half = v => (C.immune ? tdiv(v, 2) : v);
      const mine = on.curses.filter(x => x.own).map(x => (x.kind === "other" ? "Another curse" : `${CURSE_SHORT[x.kind]} ${x.lvl}`)).concat(on.bc && on.bc.own ? [`Battle Cry ${on.bc.lvl}`] : []);
      S.deb.textContent = on.curses.length || on.bc || r.D.conv || r.D.fan ? `${mine.join(", ") || "From others"} → ${r.spell ? spellRes(r) : `${resPct(r.R.cbRes)} resistance, ${numTxt(r.D.cursed)} defense`}` : "None";
      const dl = [];
      if (on.all.length) {
        const caps = [on.caps.you ? `you (${on.caps.you})` : "", on.caps.merc ? `your mercenary (${on.caps.merc})` : "", on.caps.party ? `the party (${on.caps.party})` : ""].filter(Boolean);
        dl.push(`It holds <b>${on.cap} curse${on.cap > 1 ? "s" : ""}</b>${caps.length > 1 ? `: the most of ${andList(caps)}` : ""}.${on.caps.you && caps.length > 1 ? " Yours count first." : ""}`);
        const effect = x => {
          const e = [];
          if (x.v) e.push(`${signedInt(half(x.v))}% physical resistance`);
          if (x.dv) e.push(`${signedInt(x.dv)}% defense`);
          if (x.df) e.push(`${signedInt(x.df)} defense`);
          if (x.kind === "lowres") e.push(`${signedInt(lowResOf("fireresist", x))}% fire, lightning, cold, and poison resistance`);
          return e.length ? e.join(", ") : "no change to your damage, but it takes a place";
        };
        for (const x of on.all) dl.push(!x.off ? `✓ <b>${curseName(x)}</b> (${curseWho(x)}): ${effect(x)}`
          : `<span class="cm-off">✕ <s>${curseName(x)}</s> (${curseWho(x)}): ${x.off === "same" ? `${curseOwner(x.by)} ${curseName(x.by)} counts instead` : `it holds only ${on.cap} curse${on.cap > 1 ? "s" : ""}`}</span>`);
      }
      if (on.bc) dl.push(`✓ <b>Battle Cry ${on.bc.lvl}</b> (${on.bc.own ? "yours" : "from others"}${on.bcLow ? ", the higher" : ""}): ${signedInt(C.bc)}% physical resistance, ${signedInt(on.bc.dv)}% defense`);
      if (on.bcLow) dl.push(`<span class="cm-off">✕ <s>Battle Cry ${on.bcLow.lvl}</s> (${on.bcLow.own ? "yours" : "from others"}): the higher counts</span>`);
      const parts = C.parts.map(([x, v]) => `${curseName(x)} (${curseWho(x)}) <b>${signedInt(v)}</b>`);
      if (on.bc) parts.push(`Battle Cry ${on.bc.lvl} <b>${signedInt(C.bc)}</b>`);
      if (!r.spell || r.spellPhys) dl.push(`Physical resistance <b>${resPct(r.R.cbRes)}</b>${parts.length ? `: its own ${resPct(C.base)}, ${parts.join(", ")}${C.immune ? " (half: it is immune)" : ""}` : ", its own"}`);
      if ((!r.spell || r.spellPhys) && r.R.res !== r.R.cbRes) dl.push(`${r.R.pierce ? `With your ${r.R.pierce}% pierce` : "Against your hits"}: <b>${resPct(r.R.res)}</b>${r.R.halved ? " (below 0% it counts half)" : ""}`);
      // its defense: Weaken, Battle Cry and the party's Conviction add up
      const D = r.D, dparts = [];
      if (D.fan) dparts.push(`Fanatic (its own) <b>${signedInt(D.fan)}%</b>`);
      for (const x of on.curses) if (x.dv) dparts.push(`${curseName(x)} (${curseWho(x)}) <b>${signedInt(x.dv)}%</b>`);
      if (on.bc && on.bc.dv) dparts.push(`Battle Cry ${on.bc.lvl} <b>${signedInt(on.bc.dv)}%</b>`);
      if (D.conv) dparts.push(`Conviction ${D.conv.lvl} (the party’s) <b>${signedInt(D.conv.dv)}%</b>`);
      for (const x of on.curses) if (x.df) dparts.unshift(`${curseName(x)} (${curseWho(x)}) <b>${signedInt(x.df)}</b>`);
      if (D.inner) dparts.unshift(`Inner Sight ${D.inner.lvl} (the party’s) <b>${signedInt(D.inner.df)}</b>`);
      if (!r.spell) dl.push(`Defense <b>${numTxt(D.cursed)}</b>${dparts.length ? `: its own ${nf0.format(D.base)}, ${dparts.join(", ")}` : ", its own"}${D.cursed < 0 ? " (below 0 it adds to your attack rating)" : ""}`);
      if (elemText(r)) dl.push(`Elemental resistances: ${elemResText(r)}`);
      U.deb.innerHTML = dl.join("<br>");
      // the card's totals; damage per hit as the character screen shows it, to check the numbers put in
      const ft = [];
      if (att.frames_only) ft.push(`<div class="big"><span>${esc(att.label)}</span><b>${r.fr ? `${frLabel(r.fr)} frames` : "—"}</b><small>its damage isn’t worked out yet</small></div>`);
      else if (r.spell) {
        ft.push(`<div><span>Damage per ${unitOf(att)}</span><b>${spellText(r) || "—"}</b><small>Before the monster’s resistances, as the tooltip shows it</small></div>`);
        ft.push(`<div><span>On the monster</span><b>${fmt(wvOn(r) ? r.wv.base : r.final)}</b><small>${aUnit(att).replace(/^a/, "A")} on average; the monster: ${elemResText(r) || "—"}</small></div>`);
        if (wvOn(r)) ft.push(wvFoot(r));
        ft.push(`<div><span>Chance to hit</span><b>100%</b><small>${esc(att.label)} never misses</small></div>`);
        ft.push(`<div class="big"><span>Damage per second</span><b>${r.fr ? fmt(r.dps) : "—"}</b>${!r.fr && r.why ? "<small>Can’t attack: Skill says why</small>" : ""}${r.kill ? `<small>${r.kill.never ? "can’t kill it" : `kills in ${nf1.format(r.kill.secs)} s`}</small>` : ""}${kcText(r.kc) ? `<small>Kills within ${kcText(r.kc)}</small>` : ""}</div>`);
      }
      else if (r.ex && r.ex.kind === "sentinel") {
        // Blade Sentinel: a blade hit (the weapon's numbers), a burst, and a cast's worth on the monster
        const s = r.ex.sent, bu = r.ex.always.find(x => x.k === "burst"), q0 = r.per[0], et = elemText(r);
        ft.push(`<div><span>A blade hit</span><b>${fmt(q0.mn256 / 256)}–${fmt(q0.mx256 / 256)}</b><small>Physical, before crit and deadly strike: ${fmt(r.eff)} on average with them</small></div>`);
        if (bu) ft.push(`<div><span>A burst</span><b>${fmt(bu.q.lo / 256)}–${fmt(bu.q.hi / 256)}</b><small>Physical, before crit and deadly strike</small></div>`);
        if (et) ft.push(`<div><span>Elemental per blade hit</span><b>${et}</b><small>A burst: ${nf0.format(bu ? bu.pc : 75)}% of it; no crit or deadly strike on it</small></div>`);
        ft.push(`<div><span>On the monster</span><b>${fmt(r.final)}</b><small>A cast on average: about ${nf1.format(s.hits)} blade hits and ${nf1.format(s.bursts)} bursts, each with its chance to hit${elemResText(r) ? `; the monster: ${elemResText(r)}` : ""}</small></div>`);
        ft.push(`<div><span>Attack rating</span><b>${nf0.format(q0.AR.ar)}</b><small>The sentinel’s, for its blades; yours for the bursts: ${nf0.format(q0.AR.burst.ar)}</small></div>`);
        ft.push(`<div><span>Chance to hit</span><b>${nf0.format(s.pB * 100)}%</b><small>A blade, against defense ${numTxt(q0.D.def)} at level ${target.lvl}; a burst ${nf0.format(s.pBu * 100)}%, against ${numTxt(q0.D.burst)}</small></div>`);
        ft.push(`<div class="big"><span>Damage per second</span><b>${r.fr ? fmt(r.dps) : "—"}</b>${!r.fr && r.why ? "<small>Can’t attack: Skill says why</small>" : ""}${r.kill ? `<small>${r.kill.never ? "can’t kill it" : `kills in ${nf1.format(r.kill.secs)} s`}</small>` : ""}${kcText(r.kc) ? `<small>Kills within ${kcText(r.kc)}</small>` : ""}</div>`);
      }
      else {
        const note = screenNote(r, att), screen = note ? `<small>${note}</small>` : "";
        ft.push(`<div><span>Damage per hit</span><b>${r.per.map(p => `${fmt(p.mn256 / 256)}–${fmt(p.mx256 / 256)}`).join(" / ")}</b>${screen}</div>`);
        ft.push(`<div><span>Average hit, with crit and deadly strike</span><b>${fmt(r.eff)}</b></div>`);
        const et = elemText(r);
        if (et) ft.push(`<div><span>Elemental per hit</span><b>${et}</b><small>No crit or deadly strike on it; the monster: ${elemResText(r)}</small></div>`);
        if (r.R.mult !== 1 || hasElem(r)) {
          const hits = r.fof ? (r.fof.hit1 + 2 * r.fof.hit) / 3 : 0;   // the weapon's hits, Fists of Fire's charge 1 with its fire
          const X = r.ex, conv = r.conv ? `; ${esc(att.label)} turns ${r.conv.pct}% of the ${exWhat(att)}’s physical damage into ${ELEM[r.conv.el].n} (${ELEM[r.conv.el].n} resistance: ${resPct(r.ER[r.conv.el].res)})` : "";
          const split = r.fof ? `<small>A hit, its three charges on average: the hit ${fmt(hits)} + the charges’ ${fmt(r.final - hits)}</small>`
            : X ? `<small>The ${exWhat(att)} ${fmt(X.H)}${X.H - r.physFinal > 1e-9 ? ` (physical ${fmt(r.physFinal)} + elemental ${fmt(X.H - r.physFinal)})` : ""} + ${EX_NOUN[X.kind]} ${fmt(X.E1 + X.E2)}${conv}</small>`
            : hasElem(r) ? `<small>Physical ${fmt(r.physFinal)} + elemental ${fmt(r.final - r.physFinal)}${r.pois ? ` (poison ${fmt(r.pois.perHit)} of it, ${fmt(r.pois.perSec)} a second while you keep hitting)` : ""}${conv}</small>` : "";
          if (!(r.fof && r.fof.fin)) ft.push(`<div><span>On the monster</span><b>${fmt(wvOn(r) ? r.wv.base : r.final)}</b>${split}</div>`);
        }
        if (wvOn(r)) ft.push(wvFoot(r));
        // a Dragon Claw finisher: the cycle's damage (its per hit share is only bookkeeping)
        if (r.fof && r.fof.fin) {
          const c = r.fof.fin.cyc;
          const fn = { dc: "Dragon Claw", dt: "Dragon Tail", df: "Dragon Flight", dl: "Dragon Talon" }[r.fof.fin.kind];
          ft.push(`<div><span>A cycle on the monster</span><b>${fmt(c.dmg)}</b><small>Three charges and a ${fn}: the charges ${fmt(c.stages)}, the ${fn} ${fmt(c.dc)}, in ${nf0.format(c.frames)} frames with misses</small></div>`);
        }
        if (r.rolls) {
          const why = [p0.AR.vs ? `without your attack rating against ${target.type === "demon" ? "demons" : "undead"}` : ""].filter(Boolean);
          ft.push(`<div><span>Attack rating</span><b>${arText(r)}</b><small>Your character screen shows ${r.screen.ar === p0.AR.ar ? "this" : `${nf0.format(r.screen.ar)} (${why.join("; ")})`} with ${esc(att.label)} on a mouse button</small></div>`);
          const onMiss = r.ex && r.ex.E2 > 0 ? `; ${EX_NOUN[r.ex.kind]} ${r.ex.kind === "immolationarrow" || r.ex.kind === "chargedstrike" ? "come" : "comes"} on a miss too` : "";
          ft.push(`<div><span>Chance to hit</span><b>${hitText(r)}</b><small>against defense ${byWeapon(r, p => numTxt(p.D.def))} at level ${target.lvl}${onMiss}</small></div>`);
        } else ft.push(`<div><span>Chance to hit</span><b>100%</b><small>${esc(att.label)} never misses</small></div>`);
        ft.push(`<div class="big"><span>Damage per second</span><b>${r.fr ? fmt(r.dps) : "—"}</b>${!r.fr && r.why ? "<small>Can’t attack: Skill says why</small>" : ""}${r.kill ? `<small>${r.kill.never ? "can’t kill it" : `kills in ${nf1.format(r.kill.secs)} s${att.k === "charge" ? " (strikes only)" : ""}`}</small>` : ""}${kcText(r.kc) ? `<small>Kills within ${kcText(r.kc)}</small>` : ""}</div>`);
      }
      refs.foot.innerHTML = ft.join("");
      // what differs from build A, on a build of A's class (across classes nearly every field would)
      const mark = i > 0 && b.cls === A.cls;
      refs.card.querySelectorAll(".field[data-path]").forEach(f => { f.classList.toggle("diff", mark && !same(getPath(A, f.dataset.path), getPath(b, f.dataset.path))); });
      // a build from the IAS Calculator with no example of its class: the fields to fill in, marked ✎ while they still
      // hold what they came with (CA-04)
      const todo = arrived && arrived.b === builds[i] ? arrived.todo : null;
      refs.card.querySelectorAll(".field[data-path]").forEach(f => {
        f.classList.toggle("todo", !!todo && f.dataset.path in todo && getPath(builds[i], f.dataset.path) === todo[f.dataset.path]);
      });
      for (const d of Object.values(refs.sec)) d.classList.toggle("diff", mark && !!d.querySelector(".field.diff"));
      const tab = $("dm-tabs").children[i], tn = tab && tab.querySelector(".tname");
      if (tn) { tn.textContent = badgeName(i); tab.setAttribute("aria-label", `Build ${LETTERS[i]}: ${badgeName(i)}`); }
    });
    $("dm-diff-note").hidden = !builds.some((x, k) => k > 0 && x.cls === builds[0].cls);
  }
  /* the IAS on other gear a build still needs for fewer frames, and what that is worth */
  // the speed stat a next breakpoint asks for: faster cast rate for a spell, else IAS
  const spdWord = nb => (nb && nb.fcr ? "faster cast rate" : "IAS");
  /* a cast's damage at another pace (the Breakpoints tab, the next breakpoint): Volcano's volcanoes share one lock on
     the monster, so their hits come every lock frames however often you cast; any other spell's cast is the same */
  function finalAt(r, frames, gear) {
    // a finisher: the cycle at that speed, the finisher's frames at the same IAS on other gear
    const X = r.fof && r.fof.fin;
    if (X && r.toHit > 0) {
      let dFr = X.E.fr;
      if (gear !== undefined) { const f = frames_(withBC(X.bD), X.att, gear); if (f) dFr = f; }
      return X.cyc.dmg * frames / (finFrames(X, r.fof.attacks, frames, dFr) * r.toHit);
    }
    // Blade Sentinel: its blades share one lock on the monster, so a faster cast adds fewer of them (EX.sent)
    if (r.ex && r.ex.kind === "sentinel" && r.ex.sent && r.final > 0) {
      const s = r.ex.sent, one = r.ex.always.filter(p => p.k === "blade" || p.k === "bladeE").reduce((t, p) => t + p.q.avg / 256 * p.net * (p.mult || 1), 0);
      return r.final + one * s.pB * (sentCount(s.from, r.ex.size, frames).hits - s.hits);
    }
    return paceFinal(r, frames);
  }
  function nextBreakpoint(r) {
    if (!r.fr || r.fr.note === "fixed" || (r.fr.cast && r.fr.cast.tick)) return null;
    // between cooldowns: the next speed at which the cycle does more damage a second (either skill's breakpoint)
    if (r.wv && r.wv.S) {
      const R = weaveRows(r), cur = R.rows[R.cur], nx = cur ? R.rows.slice(R.cur + 1).find(x => x.dps > cur.dps * (1 + 1e-9)) : null;
      if (!nx) return { capped: true, fcr: R.fcr };
      return { add: (R.fcr ? nx.fcr : nx.gear) - R.you, fr: nx.fr, fcr: R.fcr, gain: r.dps > 0 ? nx.dps / r.dps - 1 : 0, wv: r.wv.use.map((o, i) => [o.att.label, nx.frs[i].frames]) };
    }
    if (r.fr.note === "cast") {
      const L = castLadder(withBC(r.b), r.attack), v = r.fr.cast.fcr, nx = L.find(x => x.fcr > v);
      if (!nx) return { capped: true, fcr: true };
      return { add: nx.fcr - v, fr: nx.fr, fcr: true, gain: (finalAt(r, nx.fr.frames) / nx.fr.frames) / (r.final / r.fr.frames) - 1 };
    }
    const s = iasSetup(withBC(r.b), r.attack), row = IAS.breakpoints(s).rows.find(x => x.gear > s.gear);
    if (!row) return { capped: true };
    const f = roundOf(row.r);
    return { add: row.gear - s.gear, fr: f, gain: (finalAt(r, f.frames, row.gear) * f.hits / f.frames) / (r.final * r.fr.hits / r.fr.frames) - 1 };
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const signed = x => `${x >= 0 ? "+" : "−"}${nf1.format(Math.abs(x * 100))}%`;
  const signedInt = v => `${v >= 0 ? "+" : "−"}${nf0.format(Math.abs(v))}`;
  const resPct = v => `${v < 0 ? "−" : ""}${nf0.format(Math.abs(v))}%`;   // a resistance, with a minus sign below 0
  const numTxt = v => `${v < 0 ? "−" : ""}${nf0.format(Math.abs(v))}`;     // a defense, with a minus sign below 0
  const CURSE_SHORT = { amp: "Amp", decrep: "Decrep", weaken: "Weaken", attract: "Attract", lowres: "Lower Resist", other: "Another curse" };
  /* Fists of Fire's charges in words, as its tooltip gives them (before the monster's resistances): each charge's
     effect, and the flames and meteors counted on this monster */
  /* "Around it": what an attack's area parts do to the other monsters (2026-11-24, the author's plan: "area parts
     counted on the chosen monster, with a line for what they do to each other monster"). Only the chosen monster's
     share counts in the numbers. The sizes are the traced ones: area damage reaches a
     monster whose centre lies within the radius (in sub-tiles, 2/3 of a yard each) */
  function areaLine(r, b, att) {
    const yd = sub => `${nfd.format(sub * 2 / 3)} yards`, lvl = +b.s.lvl || 0, ctx = ctxOf(b, att);
    if (!(lvl > 0) && att.id) return "";
    const n = v => nf0.format(v);
    const text = {
      fof: `Charge 1’s explosion hits every monster within ${yd(4)} of it, and its flames burn the ones standing in them; charge 2’s nova hits each monster it reaches once; charge 3’s meteors hit every monster within ${yd(7)} of where each lands, and their flames burn the ones standing in them`,
      boi: "Charge 2’s wave and its trails hit the monsters along the way; charge 3’s other ice bolts fly on to the monsters around it",
      cot: "Charge 2’s nova hits each monster it reaches once; charge 3’s other charged bolts fly on to the monsters around it, each leaving a storm where it hits",
      phx: `Charge 1’s meteor hits every monster within ${yd(6)}, and its flames burn the ones standing in them; charge 2’s chain lightning hits the monsters around it as it loops; charge 3’s other chaos ice fly on to them`,
      vengeance: `Every monster within ${yd(7)} takes the explosion too, and it can chain on from there to another monster`,
      fireclaws: "The firestorms’ flames burn the monsters between you and it",
      rabies: "Its poison spreads to the monsters near the one bitten",
      explodingarrow: `The explosion hits every monster within ${yd(5)} of where the arrow hits, each bomb every monster within ${yd(3)} of where it lands`,
      immolationarrow: `The explosion hits every monster within ${yd(4)}, and the flames burn the ones standing within ${yd(3)} of where it lands`,
      freezingarrow: `The explosion hits every monster within ${yd(Calc.value(att.id, "calc1", lvl, Object.assign({}, ctx, { self_blvl: hardOf(b) })))}`,
      lightningfury: `A bolt goes to each monster within ${yd(15)} of the javelin, up to ${n(Calc.value(att.id, "calc1", lvl, ctx))}`,
      chargedstrike: "The other charged bolts wander out and hit the monsters near it",
      lightningstrike: `The chain lightning jumps on to monsters within ${yd(16)}, up to ${n(Calc.value(att.id, "calc2", lvl, ctx))} hits in all`,
      powerstrike: "The nova hits each monster it reaches once",
      foh: `The lightning hits this monster alone; a holy bolt flies from it at each monster within ${yd(+(SK[att.id] || {}).aurarangecalc || 20)}, up to ${n(Calc.value(att.id, "calc4", lvl, ctx))}, and hits the ones on its way too (a monster once in 3 frames)`,
      holybolt: "Its bolts fly on through the monsters they hit and hit the ones behind, each once",
      holynova: `The nova hits every monster within ${yd(27)} of you once`,
      lightning: "The bolt flies on through the monsters it hits and hits every one on its line once",
      chainlightning: `The lightning jumps on to monsters within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 20)} of the last one hit, ${n(Calc.value(att.id, "calc1", lvl, ctx))} times`,
      nova: "The nova hits every monster it reaches around you once",
      frostnova: "The nova hits every monster it reaches around you once",
      combustion: `A ring of ${n(Calc.value(att.id, "calc2", lvl, ctx))} fire balls flies out from you; each explodes on the first monster it meets, on everything within ${yd(4)}: a monster in a pack also takes the explosions on the ones beside it`,
      frozenorb: "Its other bolts fly out all around the orb’s path, each to the first monster it meets",
      inferno: "Its flames burn every monster they pass in front of you, each once a breath and at most every 2 frames",
      teeth: "The other teeth fly on to the monsters around it, each hitting the first it meets",
      bonespear: "Each spear flies on through the monsters it hits and hits every one on its line once",
      bonespirit: "It flies to the monster you cast it on (or the nearest one) and hits it alone",
      poisonnova: "The ring poisons every monster it reaches around you once",
      lightningsentry: "Each bolt flies on through the monsters in its line, hitting each once",
      chainlightningsentry: `The lightning jumps on to the monsters around it, ${n(Calc.value(313, "calc1", lvl, ctx) || 8)} hits in all`,
      chargedboltsentry: "The other bolts wander on to the monsters around it",
      wakeoffire: "The wave burns every monster in its way and its flames spread sideways through the pack",
      wakeofinferno: "Its flames burn every monster in their way",
      deathsentry: `Each explosion hits every monster within ${yd(Math.trunc(((Calc.value(312, "aurarangecalc", lvl, ctx) || 42) + 1) / 2))} of the corpse`,
      shockweb: "Its shock fields cover the ground around the monster and burn every monster standing in them",
      fireblast: `Each bomb’s explosion hits every monster within ${yd(+(((DATA.ex || {}).fblast) || {}).r || 4)} of where it lands, so a pack takes many of them`,
      mindblast: `The blast hits every monster within ${yd((Calc.value(att.id, "aurarangecalc", lvl, Object.assign({}, ctx, { self_blvl: hardOf(b) })) || 4) + 2)} of the one you cast it on, ${yd((Calc.value(att.id, "aurarangecalc", lvl, Object.assign({}, ctx, { self_blvl: hardOf(b) })) || 4) + 6)} with quick casts`,
      desecrate: "Its cloud poisons every monster it reaches around the corpse (about 4 yards), each once; the corpses it leaves feed Corpse Explosion and the like",
      poisonstrike: `A cloud rises where it hits and poisons the monsters around (${yd(4)}), and a monster that dies poisoned by it releases another, whoever kills it; with an item’s “Melee Attacks Deal Splash Damage”, its hits splash 20% wider`,
      cexpl: `The explosion hits every monster within ${yd(Math.trunc((Calc.value(att.id, "aurarangecalc", lvl, ctx) + 1) / 2))} of the corpse`,
      tornado: "It wanders on through the monsters around it, bursting on each one near it",
      twister: "The twisters wander out around it, each hitting and stunning the monsters it passes",
      arcticblast: "Its streams freeze every monster they pass in front of you, each at most every 2 frames",
      hurricane: "Every monster near you takes every gust",
      armageddon: "The rocks fall anywhere around you, on whatever stands where they land",
      boulder: `It rolls on through the monsters in its way, hitting each as it goes, and its explosion hits every monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 7)} of where it stops`,
      volcano: `The volcano hits every monster standing in it, and its debris falls anywhere within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 12)} of it`,
      fissure: `Its cracks open anywhere within ${yd(Math.max(1, Calc.value(att.id, "calc1", lvl, ctx) - 1))} of the spot, each burning every monster it reaches once`,
      darkpact: `It curses every monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 6)} of you; each cursed one explodes on everything within ${yd(Calc.value(att.id, "calc1", lvl, ctx) || 4)}, 1 sub-tile more for each curse past its first`,
      tstorm: "Each strike falls on one monster near you, so in a pack the strikes are shared; the novas hit the monsters around it",
      hydra: att.k === "hydra" ? `Each head shoots at a monster within 16.7 yards, so in a pack the shots are shared; each fire ball explodes on everything within ${yd(3)} of where it hits` : "Each head shoots at a monster within 16.7 yards, so in a pack the shots are shared",
      firewall: `The wall burns every monster standing in it, up to ${yd(Math.round((7 + 2 * lvl) * 0.5625))} to each side of its middle`,
      blaze: `The explosion hits every monster within ${yd(+(((DATA.ex || {}).blaze) || {}).r || 5)} of you and the burning ground every monster standing in it; and as you run, you leave more burning ground behind`,
      blizzard: `Its shards land anywhere within ${yd(Math.max(1, Calc.value(att.id, "calc1", lvl, ctx) - 1))} of the spot, and each bursts on every monster within ${yd(+((DATA.ex || {}).blizz || {}).r || 4)} of where it lands`,
      icebarrage: `Each lance bursts on the first monster it meets, on everything within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 7)}: a monster in a pack takes the bursts beside it too`,
      chargedbolt: "The other bolts wander on to the monsters beside and behind it; a bolt hits each monster on its way once",
      meteor: `The meteor hits every monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 10)} of where it lands, and its flames burn the ones standing in them`,
      firebolt: `It bursts on what it hits: every monster within ${yd(3)} takes it`,
      icebolt: `It bursts on what it hits: every monster within ${yd(3)} takes it`,
      fireball: `It explodes where it hits: every monster within ${yd(5)} takes it`,
      glacialspike: `It bursts where it hits: every monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 6)} takes it`,
      iceblast: "It flies on through the monsters it hits and hits every one on its line once",
      holylight: `It hits every monster within ${yd(+(SK[att.id] || {}).aurarangecalc || 6)} of the one you cast it on and heals your party there (cast on a party member, it heals in full and deals half)`,
      dragontail: `The explosion hits every monster within ${yd(6)} of the one kicked`,
      smite: "With an item’s “Melee Attacks Deal Splash Damage”, its damage splashes onto the monsters around (Smite makes the splash 20% wider)",
      plaguejav: "The ring of clouds spreads out and poisons the monsters around it; the clouds along the javelin’s path poison the ones it passed",
      poisonjav: "The clouds along the javelin’s path poison the monsters it passed",
      bladeshield: "Every strike hits every monster within 2.7 yards of you",
      cobra: "Charge 1’s other poison bolts fly on in their fan, and charge 3’s clouds spread out and poison the monsters around it",
      tiger: "With an item’s “Melee Attacks Deal Splash Damage”, its hits splash onto the monsters around, charges 2 and 3 20% and 40% wider",
      psychichammer: (() => {
        // PD2's damage function 15: each bounce calc2 (20)% of the first hit's damage less than the one before
        const hits = Calc.value(att.id, "calc1", lvl, ctx) || 2, cut = Calc.value(att.id, "calc2", lvl, ctx) || 20;
        const pcts = Array.from({ length: hits - 1 }, (_, k) => Math.max(0, 100 - (k + 1) * cut));
        return `The hammer bounces on to another monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 8)} of the one it hits, ${n(hits)} hits in all; the bounces deal ${pcts.map(v => `${n(v)}%`).join(", ").replace(/, ([^,]*)$/, pcts.length > 2 ? ", and $1" : " and $1")} of the first hit’s damage (a monster it just hit isn’t hit again in a row)`;
      })(),
      sentinel: `Each sentinel’s blade hits every monster it flies over (a monster at most once every 6 frames, all your sentinels together), and each burst every monster within ${yd(Calc.value(att.id, "aurarangecalc", lvl, ctx) || 7)} of the sentinel`,
    };
    const arrows = { magicarrow: "; every arrow passes through the monsters it hits and flies on", firearrow: ", each leaving a flame where it hits", coldarrow: "" };
    let t = text[att.charge === "fof" ? "fof" : att.charge || att.ex || att.k] || text[att.k] || (att.fclaw ? text.fireclaws : "");
    if (att.k in arrows) {
      const more = Calc.value(att.id, "calc1", lvl, ctx) - 1;
      t = more > 0 ? `${more > 1 ? `Its other ${n(more)} arrows fly` : "Its other arrow flies"} beside this one and can hit the monsters next to it${arrows[att.k]}` : "";
    }
    return t ? `Around it: ${t[0].toLowerCase() + t.slice(1)} (not counted here)` : "";
  }
  /* what the card calls an attack's hit and its extras */
  const exWhat = att => (att.sentinel || att.k === "bladefury" ? "blade" : att.kind === "cast" ? "cast" : att.bombs ? "throw" : att.throw ? "javelin" : att.missile ? "arrow" : "hit");
  const EX_NOUN = { smite: "its extra roll", dragontail: "the explosion", firearrow: "its flame", explodingarrow: "the explosion and bombs", immolationarrow: "the explosion and flames",
    freezingarrow: "the explosion", lightningfury: "the bolt", chargedstrike: "the bolts", lightningstrike: "the chain lightning", powerstrike: "the nova",
    foh: "the lightning and its holy bolt", holybolt: "the bolts", holynova: "the nova", holylight: "the light", spell1: "the spell",
    frozenorb: "its bolts", blizzard: "its shards", icebarrage: "its lances", chargedbolt: "its bolts", meteor: "the meteor and its flames",
    combustion: "the fire balls", inferno: "its flames", arctic: "its flames", tornado: "the tornado", twister: "the twisters", hurricane: "its gusts", armageddon: "its rocks", fan1: "the spell", pnova: "its poison", cexpl: "the explosion", dpact: "the explosion", tstorm: "the strike and its nova", hydra: "the heads’ shots", firewall: "its flames",
    blaze: "the explosion and its burning ground", desecrate: "its poison", mindblast: "the blast", trap: "its shots", dsentry: "the explosion", fireblast: "its bombs", shockweb: "its shock fields", sentinel: "its blades and bursts", boulder: "the boulder and its burning ground", volcano: "the volcano and its debris", fissure: "its cracks" };
  // a count put in the "… that hit" field: said after the worked-out one
  const countLine = x => `You count <b>${nf0.format(x.n)}</b> of ${nf0.format(x.of)} (worked out: about ${Number.isInteger(x.auto) ? nf0.format(x.auto) : nf1.format(x.auto)})`;
  /* the Skill section's lines of the arrows and the Amazon's lightning skills (extrasOf): whole points, before the
     monster's resistances */
  /* the fans (Holy Bolt, Ice Barrage): counted cast on the monster; the ground clicked beyond it or short of it
     (simulated: 5 lances on a normal-size monster 5.3 yards away, 2.5 cast on it, 4.5 clicking 1.5-2 times as
     far, 1.2 clicking halfway) */
  const FAN_AIM = "Counted cast on the monster. Clicking the ground beyond it instead narrows the fan where it stands, so more of them hit; clicking short of it spreads them wider, so fewer do (not counted)";
  function exLines(r, b, att) {
    const w = (q, f) => `${nf0.format(Math.floor(q.lo * (f || 1) / 256))}–${nf0.format(Math.floor(q.hi * (f || 1) / 256))}`;
    const out = [], X = r.ex, part = k => (X ? X.land.concat(X.always).find(x => x.k === k) : null);
    const sel = selOf(b, att), src = att.srcdam || 128, E = sel ? ELEM[sel.e] : null;
    const share = src === 128 ? "" : ` (the arrow deals ${src === 96 ? "3/4" : src === 64 ? "half" : `${src}/128`} of it, as of your weapon’s damage)`;
    const what = exWhat(att);
    if (sel && sel.hi > 0) out.push(`Its ${E.n} on the ${what}: <b>${w(sel)}</b> with your ${E.n} skill damage${share}`);
    else if (att.ex === "freezingarrow") out.push(`The arrow: your weapon’s damage and your gear’s elemental damage; the skill’s cold is in its explosion`);
    if (r.conv && att.mconv) out.push(`${r.conv.pct === 100 ? "All" : `${r.conv.pct}%`} of the ${what}’s physical damage becomes ${ELEM[r.conv.el].n}, after crit and deadly strike${att.mdmg === 12 ? `; your gear’s other elemental damage and poison don’t come with it` : ""}`);
    const sz = ["", "small", "normal-size", "big"][X ? X.size : 1];
    const n = v => nf0.format(v), n1 = v => (Number.isInteger(v) ? nf0.format(v) : nf1.format(v));
    const yd = sub => `${nfd.format(sub * 2 / 3)} yards`, about = v => (Number.isInteger(v) ? nf0.format(v) : `about ${nf1.format(v)}`);
    if (!X) return out;
    let x;
    switch (X.kind) {
      case "splitthrow": x = part("ret");
        out.push(`${n(x.N)} weapons fan out a step apart and ${n(x.cross)} of them cross a lone ${sz} monster: the first to reach it is the throw’s hit, the others pass through it and come back over it about 2 seconds later, so ${n(x.of)} returns, each a hit of <b>${w(x.q)}</b> (your weapon’s damage with ${x.pct >= 0 ? "+" : "−"}${n(Math.abs(x.pct))}%, not Split Throw’s own), with your crit, deadly strike, crushing blow, gear’s elemental damage and poison, rolling to hit as the throw does (${nf0.format(Math.round(x.p * 100))}%: about ${n1(x.n)} land a throw), whether the throw hit or not${x.pc > 0 ? `. The throw’s own weapon pierces it ${nf0.format(Math.round(x.pc * 100))}% of the time (your pierce chance) and then comes back too` : ""}`);
        break;
      case "frozenorb": x = part("bolt");
        out.push(`The orb lets go ${n(x.of)} bolts of <b>${w(x.q)}</b> cold, ${n(x.of - x.ring)} as it flies and a ring of ${n(x.ring)} where it ends; the orb itself deals nothing. It always flies ${yd(x.reach)}, wherever you click. The tooltip’s numbers, with your cold skill damage. It never misses`);
        out.push(x.from === "end" ? `Cast from ${yd(x.reach)}, its flight ends on the monster and the ring starts there: about ${n1(x.auto)} of them hit a ${sz} monster`
          : `Aimed through a ${sz} monster ${FROM_WORDS[x.from]}: about ${n1(x.auto)} of them hit it, most while the orb is on it. From ${yd(x.reach)}, where its flight ends on the monster and the ring starts there, about ${n1(EX.orb.end[X.size])}`);
        if (x.set) out.push(countLine(x));
        break;
      case "blizzard": x = part("shard");
        out.push(`${n(x.of)} shards fall over ${nfd.format(x.secs)} s around the spot you cast it on; each bursts for <b>${w(x.q)}</b> cold on every monster within ${yd(x.rad)} of where it lands: about ${n1(x.auto)} of them reach a monster standing on that spot. The tooltip’s numbers, with your cold skill damage. It never misses`);
        if (x.set) out.push(countLine(x));
        break;
      case "icebarrage": x = part("lance");
        out.push(`${n(x.of)} ice lances of <b>${w(x.q)}</b> cold fan out from you: ${about(x.auto)} of them ${x.auto === 1 ? "hits" : "hit"} a lone ${sz} monster ${FROM_WORDS[x.from]}. The tooltip’s numbers, with your cold skill damage. It never misses${x.of < 5 ? `; ${x.of < 4 ? "4 lances from 3 points put in it, 5 from 6" : "5 lances from 6 points put in it"}` : ""}`);
        out.push(FAN_AIM);
        if (x.set) out.push(countLine(x));
        break;
      case "chargedbolt": x = part("bolt");
        out.push(`${n(x.of)} bolts of <b>${w(x.q)}</b> lightning wander out from you and spread as they go: about ${n1(x.auto)} of them hit a ${sz} monster ${FROM_WORDS[x.from]}. The tooltip’s numbers, with your lightning skill damage. It never misses`);
        if (x.set) out.push(countLine(x));
        break;
      case "inferno": x = part("flame");
        out.push(`Each breath, ${n(x.of)} flames of <b>${w(x.q)}</b> fire fan out toward the monster: ${about(x.auto)} of them ${x.auto === 1 ? "hits" : "hit"} a ${sz} one (after a flame hits it, the others can’t for 2 frames). The tooltip’s numbers, with your fire skill damage, a hit at a time. It never misses`);
        out.push(`Each flame that hits lowers the monster’s fire resistance by <b>${nf0.format(Math.abs(x.debuff))}%</b> for 0.4 seconds, before its damage (half on a fire-immune monster)`);
        if (x.set) out.push(countLine(x));
        break;
      case "hydra": x = part("shot");
        out.push(`Each cast puts up ${n(x.heads)} heads for ${nfd.format(x.life / 25)} seconds; each shoots a ${att.k === "hydra" ? "fire ball" : "fire bolt"} of <b>${w(x.q)}</b> fire at a monster within 16.7 yards about ${n1(x.shots)} times in that time (it waits after each shot and now and then idles): about ${n1(x.n)} shots a cast, every one on the monster. The tooltip’s numbers, with your fire skill damage`);
        out.push("The heads have your fire skill damage but not your −% enemy fire resistance: the monster’s whole fire resistance counts against them");
        break;
      case "firewall": x = part("flame");
        out.push(`A wall of flames across the monster’s spot: about ${n1(x.flames)} of them under a ${sz} monster standing in it, each <b>${w(x.q, 25)}</b> fire a second for ${nfd.format(x.frames / 25)} s. The tooltip’s numbers, with your fire skill damage. It never misses`);
        break;
      case "blaze": {
        const y = part("flame");
        x = part("blast");
        out.push(`Cast next to the monster: an explosion of <b>${w(x.q)}</b> fire around you, then burning ground: about ${n(y.flames)} flames under a ${sz} monster, each <b>${w(y.q, 25)}</b> fire a second for ${nfd.format(y.frames / 25)} s. The tooltip’s numbers, with your fire skill damage. It never misses`);
        break;
      }
      case "tstorm": {
        const y = part("nova");
        x = part("bolt");
        out.push(`Each strike, lightning of <b>${w(x.q)}</b> on the monster, then a ring of novas of <b>${w(y.q)}</b> from it: ${y.n ? "one of them hits it" : "none hits a small monster"}. The tooltip’s numbers, with your lightning skill damage. It never misses`);
        out.push(`Cast it once: while it lasts (${nfd.format(Calc.value(att.id, "auralencalc", X.lvl, ctxOf(b, att)) / 25)} s) it strikes a monster within ${yd(Calc.value(att.id, "par7", X.lvl, ctxOf(b, att)) || 17)} on its own, while you cast other spells: their damage per second adds to its own (not combined here)`);
        break;
      }
      case "combustion": x = part("ball");
        out.push(`A ring of ${n(x.of)} fire balls of <b>${w(x.q)}</b> fire flies out from you; each explodes on the first monster it meets. They reach a lone monster together, and once one has hit it the others can’t for the next 2 frames: ${about(x.auto)} ${x.auto === 1 ? "explodes" : "explode"} on a ${sz} monster ${FROM_WORDS[x.from]}. The tooltip’s numbers, with your fire skill damage. It never misses`);
        if (x.set) out.push(countLine(x));
        break;
      case "meteor": {
        const p = part("impactP"), f = part("flame");
        x = part("impact");
        out.push(`The meteor lands ${nfd.format(f.fall / 25)} s after the cast: <b>${w(p.q)}</b> physical and <b>${w(x.q)}</b> fire on the monster, the tooltip’s numbers, both with your fire skill damage. It never misses`);
        out.push(f.flames ? `Then its flames burn: about ${n(f.flames)} under a ${sz} monster, each <b>${w(f.q, 25)}</b> fire a second for ${nfd.format(f.frames / 25)} s` : "Its flames land around a small monster, none under it");
        break;
      }
      case "firearrow": x = part("flame");
        out.push(`On a hit it leaves a flame under the monster: <b>${w(x.q, 25)}</b> fire a second for ${nfd.format(x.frames / 25)} s (one flame a volley: the other arrows reach the monster while it can’t be hit again)`);
        break;
      case "explodingarrow": x = part("blast");
        out.push(`On a hit an explosion of <b>${w(x.q)}</b> fire (yours and your gear’s)`);
        x = part("bombs");
        out.push(`Then ${n(x.of)} bombs land behind the monster, each an explosion of <b>${w(x.q)}</b> fire at your ${n(x.hard)} points put in it; about ${n1(x.n)} of them reach the monster`);
        break;
      case "immolationarrow": x = part("blast");
        out.push(`Hit or miss, an explosion of <b>${w(x.q)}</b> fire (yours and your gear’s)`);
        x = part("flame");
        out.push(`Then a disc of flames: about ${n(x.flames)} under a ${sz} monster, each <b>${w(x.q, 25)}</b> fire a second for ${nfd.format(x.frames / 25)} s, without fire skill damage`);
        break;
      case "freezingarrow": x = part("blast");
        out.push(`Hit or miss, an explosion of <b>${w(x.q)}</b> cold on the monster (the skill’s and your gear’s)`);
        break;
      case "lightningfury": x = part("bolt");
        out.push(`The javelin never misses. Then a bolt of <b>${w(x.q)}</b> lightning hits this monster (in a pack it may take more: not counted)`);
        break;
      case "chargedstrike": x = part("bolt");
        out.push(`Hit or miss, ${n(x.of)} charged bolts of <b>${w(x.q)}</b> lightning start on the monster: about ${n1(x.n)} hit it (${X.size === 3 ? "all of them on a big monster" : X.size === 1 ? "none on a small monster" : `half of them on a ${sz} monster`})`);
        break;
      case "lightningstrike": x = part("chain");
        out.push(`Hit or miss, chain lightning of <b>${w(x.q)}</b> starts on the monster and hits it once`);
        break;
      case "smite": x = part("roll");
        out.push(`Then <b>0–${nf0.format(Math.floor((x.q.hi + 1) / 256))}</b> more physical damage, raised by nothing`);
        if (r.per[0].smite && r.per[0].smite.hs.lvl > 0) out.push(`Holy Shield ${r.per[0].smite.hs.lvl} adds <b>${w(r.per[0].smite.hs)}</b> to your shield’s ${r.per[0].smite.sh.d[0]}–${r.per[0].smite.sh.d[1]}`);
        break;
      case "dragontail": x = part("blast");
        out.push(`A kick that lands sets off an explosion: a second kick’s damage, its own critical and deadly strike, all of it fire, +${nf0.format(x.pct)}% and your fire skill damage: <b>${w(x.q)}</b> before critical and deadly strike`);
        break;
      case "foh": {
        const y = part("fbolt");
        x = part("strike");
        out.push(`Lightning of <b>${w(x.q)}</b> on the monster, then a holy bolt of <b>${w(y.q)}</b> magic: the tooltip’s numbers, with your lightning and magic skill damage. It never misses`);
        break;
      }
      case "fan1": {
        x = part("hit");
        const what = att.k === "teeth" ? ["teeth", "tooth"] : ["bone spears", "spear"];
        out.push(`${x.of > 1 ? `${n(x.of)} ${what[0]} fan out toward the monster` : `One ${what[1]} flies at the monster`}: ${ELEM[x.el].n} of <b>${w(x.q)}</b>, the tooltip’s numbers with your ${ELEM[x.el].n} skill damage. ${x.of > 1 ? `One of them hits a monster standing alone: once one has, the others can’t hit it for a moment and fly on` : "It hits the monster once"}. It never misses${att.k === "bonespear" && X.lvl < 25 ? `; ${X.lvl < 15 ? "2 spears from level 15, 3 from 25" : "3 spears from level 25"}` : ""}`);
        break;
      }
      case "tornado": x = part("hit");
        out.push(`A tornado of <b>${w(x.q)}</b> physical wanders out from you: on its way it hits a ${sz} monster ${FROM_WORDS[x.from]} ${x.hit >= 1 ? "once" : `about ${nf0.format(Math.round(x.hit * 10))} times in 10`}, and every 0.6 s it bursts on every monster within ${yd(4)} of it, about ${n1(x.burst)} times on this one (the first where you stand). The tooltip’s numbers. It never misses`);
        break;
      case "twister": x = part("hit");
        out.push(`${n(x.of)} twisters of <b>${w(x.q)}</b> physical wander out from you; after one has hit a monster the others can’t for 0.4 s, so a monster standing alone takes one a cast. The tooltip’s numbers. Each hit stuns it. It never misses`);
        break;
      case "arctic": x = part("flame");
        out.push(`Each breath, ${n(x.of)} streams of <b>${w(x.q)}</b> cold go out toward the monster: ${about(x.auto)} of them ${x.auto === 1 ? "hits" : "hit"} a ${sz} one (after one hits it, the other can’t for 2 frames). The tooltip’s numbers, with your cold skill damage. It never misses`);
        out.push(`Each hit lowers the monster’s cold resistance by <b>${nf0.format(Math.abs(x.debuff))}%</b> for 0.4 seconds, before its damage (half on a cold-immune monster)`);
        if (x.set) out.push(countLine(x));
        break;
      case "boulder": {
        const y = part("hitF"), z = part("flame");
        x = part("hitP");
        out.push(`A boulder rolls from you for ${yd(y.rolls * 0.75 * y.vel / 16)} (${nfd.format(y.rolls / 25)} s: a little less each level), each time it rolls onto a monster <b>${w(x.q)}</b> physical and <b>${w(y.q)}</b> fire: nothing keeps it from hitting the same one again. The tooltip’s numbers, the fire with your fire skill damage. It never misses`);
        out.push(y.kb === 3
          ? `This monster is a large one: the boulder breaks on it at once and explodes, the same damage on every monster within ${yd(y.r)}`
          : `${y.kb === 0 ? "It can’t knock this monster back, so it rolls through it" : y.kb === 2 ? "It knocks this monster (a small one) back with every hit, then catches up with it" : "It knocks this monster back half the time, then catches up with it"}: about ${n1(y.hits)} hits on a ${sz} monster ${FROM_WORDS[y.from]}. It explodes where it stops (a wall, a large monster, or the end of its roll), the same damage on every monster within ${yd(y.r)}${y.expl >= 0.95 ? ": this one too" : y.expl > 0.05 ? `: this one about ${nf0.format(y.expl * 10)} times in 10` : ": not this one"}`);
        out.push(`It leaves burning ground on its way: <b>${w(z.q, 25)}</b> fire a second a flame for ${nfd.format(z.frames / 25)} s, no fire skill damage; about ${n1(z.flames)} flames’ worth under this monster`);
        break;
      }
      case "volcano": {
        const y = part("body"), z = part("debris");
        x = part("bodyP");
        out.push(`A volcano rises on the monster’s spot for ${nfd.format((y.life + 1) / 25)} s: every ${n(y.lock)} frames it deals <b>${w(x.q)}</b> physical and <b>${w(y.q)}</b> fire to what stands in it, the tooltip’s numbers, the fire with your fire skill damage. It never misses`);
        out.push(y.every < y.life
          ? `Cast every ${n(y.every)} frames, your volcanoes overlap, but they share one timer on the monster: one hit every ${n(y.lock)} frames however many stand there, about ${n1(y.n)} a cast (${n(y.alone)} from a volcano alone)`
          : `A volcano alone hits ${n(y.alone)} times`);
        out.push(`Its debris: ${n(z.of)} rocks a volcano land anywhere within ${yd(z.spread)} of it, each leaving a small fire of the same damage that hits once: about ${n1(z.n)} under a ${sz} monster`);
        break;
      }
      case "fissure": x = part("crack");
        out.push(x.every > 0
          ? `Cracks open around the monster’s spot for ${nfd.format(x.span)} s, ${x.every === 1 ? "one every frame" : `one every ${n(x.every)} frames`}${x.every > 1 ? " (faster with more points put in it)" : ""}, anywhere within ${yd(x.spread)} of it but never where another crack lies: each burns <b>${w(x.q)}</b> fire once on every monster it reaches, about ${n1(x.n)} of them on a ${sz} monster standing on the spot. The tooltip’s numbers, with your fire skill damage. It never misses`
          : "No cracks at these points");
        break;
      case "hurricane": x = part("gust");
        out.push(`Cast it once: while it lasts, every 0.8 s it deals <b>${w(x.q)}</b> cold to every monster within ${yd(Calc.value(att.id, "aurarangecalc", X.lvl, ctxOf(b, att)) || 9)} of you, the tooltip’s numbers with your cold skill damage. It runs beside your other skills: add its damage per second to theirs`);
        break;
      case "armageddon": {
        const y = part("rockF"), z = part("flame");
        x = part("rockP");
        out.push(`Cast it once: while it lasts, every 9 frames a rock falls on a random spot within ${yd(Calc.value(att.id, "aurarangecalc", X.lvl, ctxOf(b, att)) || 9)} of you and explodes for <b>${w(x.q)}</b> physical and <b>${w(y.q)}</b> fire on every monster within ${yd(x.r)}: about ${nf0.format(x.n * 100)}% of the rocks reach a monster next to you. Each leaves a flame (<b>${w(z.q, 25)}</b> fire a second, no fire skill damage), under a ${sz} monster about 1 rock in ${nf0.format(1 / Math.max(z.flames, 0.001))}. The tooltip’s numbers. It runs beside your other skills`);
        break;
      }
      case "dsentry": {
        const f = part("fire"), fr = r.fr && r.fr.cast;
        x = part("phys");
        out.push(`Each Death Sentry explodes a corpse within ${yd(f.r)} of the monster${fr ? ` every ${n(fr.cycle)} frames` : ""}: ${n(f.pct[0])}–${n(f.pct[1])}% of the corpse’s ${nf0.format(f.life)} life${f.scaled ? ` (× ${f.scaled[0]} / ${f.scaled[1]}: it is above the trap’s level)` : ""}, ${n(f.fp)}% of it fire and the rest physical, with the trap’s own <b>${w(x.own)}</b> physical and <b>${w(f.own)}</b> fire: <b>${w(x.q)}</b> physical and <b>${w(f.q)}</b> fire on every monster within ${yd(f.r)} of the corpse. The tooltip’s numbers, with your fire skill damage on its own fire. It never misses`);
        if (fr) out.push(`Death Sentries stay until you lay more than ${n(fr.petmax)}: with ${n(fr.petmax)} out and a corpse for each, an explosion every ${n(r.fr.frames)} frames (counted here). Each explosion uses a corpse up; with no corpse near the monster they do nothing`);
        out.push(+b.s.corpse > 0 ? `The corpse’s life: ${nf0.format(+b.s.corpse)} (Corpse’s life)` : "The corpse: one like the monster, with its life (put another in Corpse’s life, such as a normal monster’s beside a boss)");
        break;
      }
      case "cexpl": {
        const f = part("fire");
        x = part("phys");
        out.push(`The corpse explodes: ${n(f.pct[0])}–${n(f.pct[1])}% of its ${nf0.format(f.life)} life${f.scaled ? ` (× ${f.scaled[0]} / ${f.scaled[1]}: it is above your level)` : ""}, ${n(f.fp)}% of it fire and the rest physical, with the skill’s own <b>${w(x.own)}</b> physical and <b>${w(f.own)}</b> fire: <b>${w(x.q)}</b> physical and <b>${w(f.q)}</b> fire on the monster. The tooltip’s numbers, with your fire skill damage on its own fire. It never misses`);
        out.push(+b.s.corpse > 0 ? `The corpse’s life: ${nf0.format(+b.s.corpse)} (Corpse’s life)` : "The corpse: one like the monster, with its life (put another in Corpse’s life, such as a normal monster’s beside a boss)");
        break;
      }
      case "dpact":
        x = part("blast");
        out.push(x.curses > 0
          ? `The monster has ${n(x.curses)} ${x.curses > 1 ? "curses" : "curse"}: an explosion of <b>${w(x.q)}</b> magic, the tooltip’s ${w(x.per)} per curse${x.curses > 1 ? ` × ${nf1.format(x.x)} (1, then +1.1 for each curse past the first)` : ""}, with your magic skill damage. It never misses`
          : "The monster has no curse, so Dark Pact does nothing: put curses on it in the monster’s Curses (yours, your mercenary’s or the party’s)");
        if (x.curses > 0) out.push(`It takes the monster’s other curses off${r.fr && r.fr.cast && r.fr.cast.cycle ? ", so each cycle casts yours again before it" : ""} (at the monster’s curse limit all of them; below it the oldest stays)`);
        break;
      case "desecrate":
        if (r.pois && r.pois.roll) {
          const z = r.pois.roll;
          out.push(`Cast on a corpse: ${n(Calc.value(att.id, "calc1", X.lvl, ctxOf(b, att)) || 5)} corpses appear around it and a cloud of poison rises, poisoning each monster it reaches once: <b>${nf0.format(Math.floor(z.lo * z.len / 256))}–${nf0.format(Math.floor(z.hi * z.len / 256))}</b> over ${nfd.format(z.len / 25)} s, the tooltip’s numbers with your poison skill damage${r.pois.len !== z.len ? `; on this monster it lasts ${nfd.format(r.pois.len / 25)} s` : ""}. Counted with a corpse next to the monster. It never misses`);
          out.push(`A new cast’s poison replaces the one running only when it is at least as strong: the monster is poisoned ${fmt(r.pois.cover * 100, nf0)}% of the time, ${fmt(r.pois.perSec)} a second on average`);
        }
        break;
      case "trap": {
        x = part("shot");
        const E = ELEM[x.el] || { n: x.el }, fr = r.fr && r.fr.cast;
        const shot = att.k === "chargedboltsentry" ? `${n(x.of)} charged bolts of <b>${w(x.q)}</b> lightning that wander out; about ${n1(x.per)} of them reach a ${sz} monster ${({ "": "next to it", mid: "5 yards away", far: "10 yards away" })[x.from]}`
          : att.k === "wakeoffire" ? `a wave of fire of <b>${w(x.q)}</b> that sends flames out sideways as it goes: ${about(x.per)} ${x.per === 1 ? "hit" : "hits"} on a ${sz} monster ${({ "": "next to it", mid: "5 yards away", far: "10 yards away" })[x.from]}`
          : att.k === "wakeofinferno" ? `a burst of flame for 0.6 s, ${n(x.of)} flames of <b>${w(x.q)}</b> fire, each hitting the monster once`
          : att.k === "chainlightningsentry" ? `chain lightning of <b>${w(x.q)}</b> that hits the monster once (it jumps on to others in a pack)`
          : `a lightning bolt of <b>${w(x.q)}</b> that hits the monster and flies on through`;
        out.push(`Each trap fires ${n(x.shots)} times at a monster within ${yd(x.range)}, then disappears: each time ${shot}. The tooltip’s numbers, with your ${E.n} skill damage (the traps get it). They never miss`);
        if (fr) out.push(`You can have ${n(fr.petmax)} traps out; each lasts ${nfd.format(fr.life / 25)} s, so laying one every ${n(fr.keep)} frames keeps all ${n(fr.petmax)} firing (counted here: ${n(x.n === 0 ? 0 : fr.petmax)} traps at once). Your −% enemy ${E.n} resistance doesn’t reach them: the monster’s whole resistance counts`);
        break;
      }
      case "sentinel": {
        const bl = part("blade"), bu = part("burst"), s = X.sent, S = s.S || {};
        const life = nfd.format(((+S.life || 50) + 5) / 25), at = s.F ? ` at a cast every ${n(s.F)} frames` : "";
        out.push(`Each cast sends a sentinel flying from you through the monster and back for about ${life} s. Its blade hits what it passes: all of your sentinels together hit a monster at most once every ${n((+S.next || 5) + 1)} frames, so about ${n1(s.hits)} blade hits a cast reach a ${sz} monster ${FROM_WORDS[s.from]}${at} (one sentinel alone: ${n1(s.alone)})`);
        out.push(`A blade: <b>${w(bl.q)}</b> physical, all of your weapon’s damage and the skill’s own, raised by your enhanced damage, Claw and Dagger Mastery, Strength, Dexterity, and auras, with your gear’s elemental damage. It rolls to hit with the sentinel’s attack rating (${nf0.format(s.pB * 100)}% chance to hit); it pierces half your physical pierce and none of your −% enemy resistance`);
        out.push(`Each time it turns round, at most once every ${n(+S.gate || 12)} frames, it bursts on everything within ${yd(bu.r)}: about ${n1(s.bursts)} bursts a cast reach the monster, each <b>${w(bu.q)}</b> physical (${n(bu.pc)}% of your weapon’s damage, raised by the same, and ${n(bu.pc)}% of the skill’s own, <b>${w(bu.sph)}</b>, not raised) with ${n(bu.pc)}% of your gear’s elemental damage. A burst rolls to hit with your own attack rating (${nf0.format(s.pBu * 100)}% chance to hit), and your −% enemy resistance and physical pierce count on it`);
        if (s.poison) {
          const zp = s.poison;
          out.push(`Poison (your gear’s and Venom’s) comes with every blade: each sentinel keeps its own poison on the monster, so about ${n1(zp.stacks)} of them run at once here, each <b>${nf0.format(Math.floor(zp.per * 25 / 256))}</b> a second on average over ${nfd.format(zp.len / 25)} s (a sentinel’s weaker roll doesn’t replace its stronger one). The bursts carry ${n(bu.pc)}% of it as your own poison, running ${nf0.format(zp.up * 100)}% of the time`);
        }
        out.push("Your tooltip’s Damage line is the skill’s own physical damage");
        break;
      }
      case "shockweb": x = part("field");
        out.push(`You throw ${n(x.of)} spikes${x.spread ? `; each lands on a random spot within ${yd(x.spread)} of the monster` : " on the monster"} and leaves a shock field for ${nfd.format(x.frames / 25)} s, each <b>${w(x.q, 25)}</b> lightning a second on a monster standing in it: about ${n1(x.flames)} of them under a ${sz} monster. The tooltip’s numbers, with your lightning skill damage. It never misses; more levels throw more spikes and spread them wider. Fields from your next throws add to them`);
        break;
      case "fireblast": x = part("bomb");
        out.push(x.spread
          ? `You throw ${n(x.of)} bombs; each lands on a random spot within ${yd(x.spread)} of the monster and explodes for <b>${w(x.q)}</b> fire on everything within ${yd(x.r)}: about ${n1(x.n)} of them reach the monster (${nf0.format(x.share * 100)}%). The tooltip’s numbers, with your fire skill damage. It never misses; more points put in it spread the bombs wider (fewer reach a monster), more levels throw more (at most 9)`
          : `You throw one bomb on the monster: <b>${w(x.q)}</b> fire on everything within ${yd(x.r)}. The tooltip’s numbers, with your fire skill damage. It never misses (with fewer than 3 points put in it, its bombs don’t spread, so only one is thrown)`);
        break;
      case "mindblast": x = part("hit");
        out.push(`A blast of <b>${w(x.q)}</b> physical on the monster you cast it on and every monster within ${yd(x.r0 + x.per)} of it, ${yd(x.r0 + x.per * x.most)} when you cast it again within 0.8 s (each quick cast widens it, up to ${n(x.most)} times). The tooltip’s numbers. It never misses${x.hard < 2 ? `; with ${x.hard ? "1 point" : "no point"} put in it, it stuns them too` : ""}`);
        break;
      case "pnova":
        if (r.pois && r.pois.roll) {
          const z = r.pois.roll;
          out.push(`A ring of poison from you hits the monster once: <b>${nf0.format(Math.floor(z.lo * z.len / 256))}–${nf0.format(Math.floor(z.hi * z.len / 256))}</b> over ${nfd.format(z.len / 25)} s, the tooltip’s numbers with your poison skill damage${r.pois.len !== z.len ? `; on this monster it lasts ${nfd.format(r.pois.len / 25)} s` : ""}. It never misses`);
          out.push(`A new cast’s poison replaces the one running only when it is at least as strong: the monster is poisoned ${fmt(r.pois.cover * 100, nf0)}% of the time, ${fmt(r.pois.perSec)} a second on average`);
        }
        break;
      case "spell1": x = part("hit");
        out.push(`${ELEM[x.el].N} of <b>${w(x.q)}</b> on the monster, once a cast: the tooltip’s numbers, with your ${ELEM[x.el].n} skill damage. It never misses`);
        break;
      case "holynova": x = part("nova");
        out.push(`A nova of <b>${w(x.q)}</b> magic from you hits the monster once: the tooltip’s numbers, with your magic skill damage. It never misses${x.holy ? "; this monster’s magic resistance doesn’t count against it (undead and demons: Holy Nova goes through it)" : "; undead’s and demons’ magic resistance doesn’t count against it"}`);
        break;
      case "holylight": x = part("light");
        out.push(`Holy light of <b>${w(x.q)}</b> magic on the monster you cast it on: the tooltip’s numbers, with your magic skill damage. It never misses`);
        break;
      case "holybolt": x = part("bolt");
        out.push(`${x.of === 1 ? "A bolt" : `${n(x.of)} bolts`} of <b>${w(x.q)}</b> magic${x.of > 1 ? (x.auto < x.of ? ` each, fanning out from you: about ${n1(x.auto)} of them hit a lone small monster ${FROM_WORDS[x.from]} (a bolt beside it can pass by; from next to it all of them hit)` : ` each, fanning out from you: all of them hit a lone ${sz} monster ${FROM_WORDS[x.from]}`) : ""}. The tooltip’s numbers, with your magic skill damage. It never misses${X.lvl < 25 ? `; ${X.lvl < 15 ? "2 bolts from level 15, 3 from 25" : "3 bolts from level 25"}` : ""}`);
        if (x.of > 1) out.push(FAN_AIM);
        if (x.set) out.push(countLine(x));
        break;
      case "powerstrike": x = part("nova");
        out.push(`Hit or miss, a nova of <b>${w(x.q)}</b> lightning bursts out of the monster: ${x.n ? "one of its bolts hits it" : "none of it hits a small monster"}`);
        break;
    }
    return out;
  }
  /* Dragon Claw as the finisher, in words */
  function finLines(F) {
    const X = F.fin, q = x => `${nf0.format(Math.floor(x.q.lo / 256))}–${nf0.format(Math.floor(x.q.hi / 256))}`, c = X.cyc;
    const pc = x => `${nf0.format(x * 100)}%`;
    const NAME = { nova: "nova", bolt: "charged bolt", storm: "storm", meteor: "meteor", mfire: "meteor’s flames", chain: "chain lightning", ice: F.kind === "boi" ? "ice bolt" : "chaos ice",
                   wave: "wave", trail: "wave’s trail", explosion: "explosion", flames: "flames", mphys: "", mflames: "meteor’s flames" };
    const said = X.rel.filter(x => NAME[x.k] && x.k !== "mflames");
    const an = w => (/^[aeiou]/.test(w) ? "an " : "a ") + w;
    const first = said.filter(x => x.n > 0).map(x => (x.flat || x.flames !== undefined ? `its ${NAME[x.k]}` : `${x.n >= 2 ? `${nf0.format(x.n)} ${NAME[x.k]}s` : an(NAME[x.k])} of <b>${q(x)}</b>`));
    const short = X.hits > 1 ? said.filter(x => x.n2 < x.n - 1e-9) : [];
    const el = { cot: "lightning", boi: "cold", fof: "fire" }[F.kind];
    const on = X.prg ? `, charge 1’s <b>${q(X.prg)}</b> ${el} on it${X.conv > 0 ? ` (${X.conv >= 1 ? "all" : pc(X.conv)} of its physical damage turned to fire)` : ""}` : "";
    if (X.kind === "dl") return [
      `Dragon Talon after every third charge, level ${X.lvBC}: ${X.hits === 1 ? "a kick" : `${X.hits} kicks`}, each <b>+${nf0.format(X.pct)}%</b> kick damage. Its first kick rolls with attack rating +${nf0.format(X.step)}% from the charges${F.kind === "tiger" ? ` and gets Tiger Strike’s <b>+${nf0.format(3 * F.c1)}%</b> (three charges)` : ""}${on}: <b>${pc(X.P)}</b> chance to hit`,
      `When it lands, the three charges go off once${first.length ? `: ${first.join(", ")}` : " (Tiger Strike’s have no effect of their own)"}, and the other kicks get none of them (${pc(X.P0)} chance to hit). When it misses, the other kicks still roll and hit with the charges, but don’t set them off: the next Dragon Talon tries again`,
      `Then the charges are used up. A cycle: ${nf1.format(c.att)} attacks with misses, ${nf0.format(c.frames)} frames (${nfd.format(c.frames / 25)} s), <b>${fmt(c.dmg)}</b> on the monster: <b>${fmt(c.stages)}</b> from the three charges, <b>${fmt(c.dc)}</b> from Dragon Talon`,
    ];
    if (X.kind === "df") return [
      `Dragon Flight after every third charge, level ${X.lvBC}: it teleports to the monster and kicks, <b>+${nf0.format(X.pct)}%</b> kick damage${F.kind === "tiger" ? ` and Tiger Strike’s <b>+${nf0.format(3 * F.c1)}%</b> (three charges)` : ""}${on}, attack rating +${nf0.format(X.step)}% from the charges: <b>${pc(X.P)}</b> chance to hit; a miss keeps the charges, and you kick again once its cooldown is over`,
      `When it lands, the three charges go off once${first.length ? `: ${first.join(", ")}` : " (Tiger Strike’s have no effect of their own)"}`,
      `Then the charges are used up. Its cooldown: ${nf0.format(X.cdc)} frames from one Dragon Flight to the next at the soonest. A cycle: ${nf1.format(c.att)} attacks with misses, ${nf0.format(c.frames)} frames (${nfd.format(c.frames / 25)} s), <b>${fmt(c.dmg)}</b> on the monster: <b>${fmt(c.stages)}</b> from the three charges, <b>${fmt(c.dc)}</b> from Dragon Flight`,
    ];
    if (X.kind === "dt") return [
      `Dragon Tail after every third charge, level ${X.lvBC}: a kick with attack rating +${nf0.format(X.step)}% from the charges${F.kind === "tiger" ? ` and Tiger Strike’s <b>+${nf0.format(3 * F.c1)}%</b> damage (three charges)` : ""}${on}: <b>${pc(X.P)}</b> chance to hit; a miss keeps the charges, and you kick again`,
      `When it lands, the three charges go off once${first.length ? `: ${first.join(", ")}` : " (Tiger Strike’s have no effect of their own)"}; then Dragon Tail’s own explosion, a second kick’s damage as fire, <b>+${nf0.format(X.pct)}%</b>`,
      `Then the charges are used up. A cycle: ${nf1.format(c.att)} attacks with misses, ${nf0.format(c.frames)} frames (${nfd.format(c.frames / 25)} s), <b>${fmt(c.dmg)}</b> on the monster: <b>${fmt(c.stages)}</b> from the three charges, <b>${fmt(c.dc)}</b> from Dragon Tail`,
    ];
    return [
      `Dragon Claw after every third charge, level ${X.lvBC}: two hits, your first claw then the other, each <b>+${nf0.format(X.pct)}%</b> damage${F.kind === "tiger" ? ` and Tiger Strike’s <b>+${nf0.format(3 * F.c1)}%</b> (three charges)` : ""}${X.prg ? `, charge 1’s <b>${q(X.prg)}</b> ${el} on the hit${X.conv > 0 ? ` (${X.conv >= 1 ? "all" : pc(X.conv)} of its physical damage turned to fire)` : ""}` : ""}, attack rating +${nf0.format(X.step)}% from the charges: <b>${pc(X.P)}</b> chance to hit`,
      first.length ? `Each of its hits, landed or not, sets off the three charges again: ${first.join(", ")}${short.length ? `; the second hit comes ${X.gap} frames after the first, so its ${short.map(x => `${NAME[x.k]} ${x.n2 > 0 ? `lands ${pc(x.n2 / x.n)} of the time` : "misses"}`).join(", ")} (each kind of missile hits a monster once in a few frames)` : ""}` : "",
      `Then the charges are used up. A cycle: ${nf1.format(c.att)} attacks with misses, ${nf0.format(c.frames)} frames (${nfd.format(c.frames / 25)} s), <b>${fmt(c.dmg)}</b> on the monster: <b>${fmt(c.stages)}</b> from the three charges, <b>${fmt(c.dc)}</b> from Dragon Claw`,
    ].filter(Boolean);
  }
  function fofLines(F, typed) {
    const r = (q, f) => `${nf0.format(Math.floor(q.lo * (f || 1) / 256))}–${nf0.format(Math.floor(q.hi * (f || 1) / 256))}`;
    if (F.kind === "tiger") return [
      F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
      `Charge 1: <b>+${nf0.format(F.c1)}%</b> damage on the hit`,
      `Charge 2: <b>+${nf0.format(2 * F.c1)}%</b> damage (and +20% melee splash radius)`,
      `Charge 3: <b>+${nf0.format(3 * F.c1)}%</b> damage (and +40% melee splash radius); the next hit starts again at charge 1`,
      "Attack rating +50% for each charge held",
    ].filter(Boolean);
    if (F.kind === "cobra") return [
      F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
      `Charge 1: 7 poison bolts in a fan at the monster, each <b>${r(F.bolt, 25)}</b> poison a second for 1 s${F.ext.hi > 0 ? `, plus your hit’s poison (gear and Venom), <b>${r(F.ext, 25)}</b> a second` : ""}; one of them reaches a monster standing alone`,
      `Charge 2: <b>+${nf0.format(F.ed2)}%</b> damage on the hit, and it steals life and mana`,
      `Charge 3: 64 poison clouds out of the monster, each <b>${r(F.cloud, 25)}</b> poison a second for 1 s${F.ext.hi > 0 ? `, plus your hit’s poison, <b>${r(F.ext, 25)}</b> a second` : ""}; one of them reaches it`,
      "Attack rating +50% for each charge held",
      F.perSec > 0 ? `Your poisons don’t add up: the strongest one runs, so the monster is poisoned ${nf0.format(F.cover * 100)}% of the time, <b>${nf0.format(F.perSec)}</b> a second on average` : "",
    ].filter(Boolean);
    if (F.parts) {
      const q = x => r(x.q), t = F.parts;
      return F.kind === "cot" ? [
        F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
        `Charge 1: <b>${q(t[0][0])}</b> lightning on the hit`,
        `Charge 2: a nova of <b>${q(t[1][0])}</b> lightning${t[1][0].n ? "; it hits the monster once" : " (none of it hits a small monster)"}`,
        `Charge 3: a charged bolt of <b>${q(t[2][0])}</b> and the storm it leaves, <b>${q(t[2][1])}</b> lightning, once each on the monster`,
        "Attack rating +50% for each charge held",
      ].filter(Boolean) : [
        F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
        `Charge 1: a meteor of <b>${q(t[0][0])}</b> fire on the monster${t[0][1].flames ? `, and about ${t[0][1].flames} of its flames under it, <b>${r(t[0][1].q, 25)}</b> a second each for ${nfd.format(t[0][1].frames / 25)} s` : " (no flames under a small monster)"}`,
        `Charge 2: chain lightning of <b>${q(t[1][0])}</b>; it hits the monster ${PHX.chains === 2 ? "twice (one loops back onto it)" : `${PHX.chains} times`}`,
        `Charge 3: chaos ice of <b>${q(t[2][0])}</b> cold; it hits the monster once`,
        "Attack rating +25% for each charge held",
      ].filter(Boolean);
    }
    if (F.kind === "boi") return [
      F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
      `Charge 1: <b>${r(F.skill)}</b> cold on the hit`,
      `Charge 2: a wave of <b>${r(F.wave)}</b> cold; it hits the monster ${F.nWave === 2 ? "twice (the wave and one trail it leaves)" : `${F.nWave} times`}`,
      `Charge 3: ${F.nIce === 1 ? "one ice bolt" : `${F.nIce} ice bolts`} of <b>${r(F.ice)}</b> cold on the monster (the others fly off to the monsters around it)`,
      "Attack rating +50% for each charge held",
    ].filter(Boolean);
    const sz = ["", "small", "normal-size", "big"][F.size] || "small", fl = FOF.flames[F.size], mf = FOF.mflames[F.size];
    const flames = n => (Math.round(n) === 1 ? "1 flame" : `${nf0.format(Math.round(n))} flames`);   // the average, rounded
    return [
      F.lvl !== typed ? `At level ${F.lvl}, with Battle Command’s + skills:` : "",
      `Charge 1: <b>${r(F.skill)}</b> fire on the hit${F.conv > 0 ? `, ${F.conv >= 1 ? "all" : `${nf0.format(F.conv * 100)}%`} of its physical damage turned to fire` : ""}; an explosion of <b>${r(F.skill)}</b>; ${fl ? `about ${flames(fl)} under a ${sz} monster, <b>${r(F.flame, 25)}</b> a second each for ${nfd.format(F.fFrames / 25)} s` : "no flames under a small monster"}`,
      `Charge 2: a nova of <b>${r(F.nova)}</b> fire${F.nNova ? "" : " (none of it hits a small monster)"}`,
      `Charge 3: ${F.nMet} meteors, each <b>${r(F.mFire)}</b> fire and <b>${r(F.mPhys)}</b> physical${mf ? `; about ${flames(mf)} of one under it for ${nfd.format(F.mFrames / 25)} s` : ""}`,
      "Attack rating +50% for each charge held",
    ].filter(Boolean);
  }
  /* a build's attack rating and chance to hit, per weapon where they differ ("87% / 85%") */
  const perWeapon = (r, f) => { const v = r.per.map(f); return v.every(x => x === v[0]) ? v[0] : v.join(" / "); };
  /* the same for a text that has a slash of its own ("30% / 10%"): the weapons' joined with a dot */
  const byWeapon = (r, f) => { const v = r.per.map(f); return v.every(x => x === v[0]) ? v[0] : v.join(" · "); };
  const arText = r => perWeapon(r, p => nf0.format(p.AR.ar));
  /* "+176% against demons" when the build's damage against the monster's type counts (per weapon where it differs) */
  const vsWord = r => (r.per.some(p => p.vs) ? `${perWeapon(r, p => `+${nf0.format(p.vs)}%`)} against ${target.type === "demon" ? "demons" : "undead"}` : "");
  /* the character screen's damage line as the game prints it (screenLine), "" where it isn't worked out (with two
     weapons it prints a range for each, in an order not traced): from 10,000 on a number is shown in thousands,
     rounded (11,500 is 12K), Fists of Fire's line (PD2's own) too */
  const screenK = v => (v >= 10000 ? `${Math.trunc((v + 500) / 1000)}K` : nf0.format(v));
  const screenRange = s => `${screenK(s[0])}–${screenK(Math.max(s[1], s[0] + 1))}`;
  const screenText = r => (r.per.length === 1 && r.per[0].screen ? screenRange([r.per[0].screen.lo, r.per[0].screen.hi])
    + (r.per[0].screen.lo2 !== undefined ? ` and ${screenRange([r.per[0].screen.lo2, r.per[0].screen.hi2])} for its explosion` : "") : "");
  /* the card's line under Damage per hit: what your character screen shows */
  function screenNote(r, att) {
    const vsW = vsWord(r), scr = screenText(r), on = `with ${esc(att.label)} on a mouse button`;
    const shown = r.per.map(p => `${fmt(p.mn256 / 256)}–${fmt(p.mx256 / 256)}`).join(" / ");
    if (att.charge) {
      const S = r.fof && r.fof.scr;
      const what = { boi: "one wave and one ice bolt without your cold skill damage", cot: "the nova and one charged bolt without your lightning skill damage",
                     phx: "one meteor, chain lightning, or chaos ice without your skill damage" }[att.charge] || "the flames, the nova, and one meteor without your fire skill damage";
      return S ? `Your weapon’s hit. Your character screen shows the charge you’re on instead: ${screenRange(S[0])} on charge 1, ${screenRange(S[1])} on charge 2, ${screenRange(S[2])} on charge 3 (it counts ${what})`
        : "Your weapon’s hit; your character screen shows the charge you’re on instead (each charge is under Skill)";
    }
    if (!scr) return vsW ? `With ${vsW}` : "";
    // Dragon Flight: the screen shows PD2's kick, which its own kick isn't
    const wEl = r.per.some(p => p.screen.el) ? ", and your weapon’s elemental damage, which a kick doesn’t get" : "";
    if (att.flight) return `Your character screen shows ${scr} ${on}: it counts your Dexterity and flat damage${wEl ? " and your weapon’s elemental damage" : ""}, which its kick doesn’t get`;
    if (att.k === "dragontalon") return `Your character screen shows ${scr} ${on} for a kick: it counts a quarter of your Dexterity in the maximum too, where the kick counts a third${wEl}`;
    const el = r.per.some(p => p.screen.el) ? ": the physical damage plus your elemental damage" : "";
    if (vsW) return `With ${vsW}; your character screen shows ${scr} ${on}${el}`;
    return scr === shown ? `Your character screen shows this ${on}` : `Your character screen shows ${scr} ${on}${el}`;
  }
  const hitText = r => perWeapon(r, p => `${Math.round(p.p * 100)}%`);
  /* what lowers the monster's defense for a build, in a few words (Side by Side's defense row) */
  function defWords(r) {
    const D = r.D, on = D.on, p = [];
    if (D.conv) p.push(`Conviction ${D.conv.lvl}`);
    if (D.inner) p.push(`Inner Sight ${D.inner.lvl}`);
    for (const x of on.curses) if (x.dv || x.df) p.push(`${curseName(x)}${x.own ? " (yours)" : ""}`);
    if (on.bc && on.bc.dv) p.push(`Battle Cry ${on.bc.lvl}${on.bc.own ? " (yours)" : ""}`);
    if (r.per.some(q => q.D.itd)) p.push("Ignore Target’s Defense");
    if (r.per.some(q => !q.D.itd && q.D.x)) p.push(`−${byWeapon(r, q => `${q.D.x}%`)} target defense`);
    return p.join(", ");
  }
  /* what is on the monster for a build, in a few words (Side by Side's resistance row) */
  function resWords(R) {
    const on = R.C.on, p = [];
    for (const x of on.curses) if (x.v) p.push(`${curseName(x)}${x.own ? " (yours)" : ""}`);
    if (on.bc) p.push(`Battle Cry ${on.bc.lvl}${on.bc.own ? " (yours)" : ""}`);
    if (R.pierce && R.res !== R.cbRes) p.push(`pierce ${R.pierce}%`);
    if (R.halved) p.push("below 0% counts half");
    return p.join(", ");
  }
  function pctParts(r) {
    const p = [];
    const x = r.per[0];
    if (r.sp) p.push(`skill ${nf0.format(r.sp)}`);
    for (const [l, v] of r.aur.parts) p.push(`${l} ${nf0.format(v)}`);
    if (x.strB) p.push(`Str ${x.strB}`);
    if (x.dexB) p.push(`Dex ${x.dexB}`);
    if (x.ms.dmg) p.push(`mastery ${x.ms.dmg}`);
    if (x.vs) p.push(`vs ${target.type === "demon" ? "demons" : "undead"} ${x.vs}`);
    if (x.off) p.push(`gear ${x.off}`);
    return keepPairs(p.join(", "));
  }
  /* a name and its number stay on one line where a line under a number wraps ("Dex 56", "Fanaticism +36") */
  const keepPairs = t => t.replace(/ (?=[+−-]?\d)/g, "\u00a0");
  const pct = v => `${(v * 100 < 10 ? nf2 : nf1).format(v * 100)}%`;
  /* the attack speed the game counts (the IAS Calculator's engine): items' IAS (diminished), the skills', the weapon's
     speed, the attack's own; at most 75 (a sequence counts 30 less first; Charge goes to 156) */
  /* the part of it the game counts, where speed is at its cap (or its floor): "of which 75 counts (the most an attack
     gets)"; the additions audit, CA-13: "(75 counted)" needed decoding */
  const spSign = v => (v < 0 ? `−${-v}` : `+${v}`);
  const speedCounts = sp => (sp.speed === sp.raw ? "" : `of which ${numTxt(sp.speed - 100)} counts (the ${sp.speed < sp.raw ? "most" : "least"} an attack gets)`);
  function tasCell(r) {
    if (!r.fr) return "—";
    if (r.fr.note === "fixed") return `—<small>fixed frames</small>`;
    if (r.fr.note === "cast" && r.fr.cast.trap) return `${+r.b.g.ias || 0}% IAS<small>lays the traps; they fire at their own pace</small>`;
    if (r.fr.note === "cast" && r.fr.cast.tick) return `—<small>its own pace</small>`;
    if (r.fr.note === "cast") return `${r.fr.cast.fcr}% FCR<small>${r.fr.cast.eff} after diminishing returns</small>`;
    const sp = r.fr.r.sp, sg = spSign;
    const parts = [`items ${sp.eias}${sp.ias !== sp.eias ? ` (${numTxt(sp.ias)}% IAS after diminishing returns)` : ""}`];
    sp.parts.forEach(([what, v]) => parts.push(`${what} ${sg(v)}`));
    if (sp.wsm) parts.push(`weapon speed ${sg(-sp.wsm)}`);
    if (sp.sq) parts.push("sequence −30");
    if (r.fr.r.p.charge !== undefined) parts.push(`${r.attack.label} ${sg(r.fr.r.p.charge)}`);
    return `${sg(sp.raw - 100)}<small>${[speedCounts(sp), keepPairs(parts.join(", "))].filter(Boolean).join(" · ")}</small>`;
  }

  // ---------- damage profile chart
  function mk(tag, attrs, parent) { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); if (parent) parent.appendChild(e); return e; }
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || mag * 10;
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v);
    return out;
  }
  /* a hit's damage at quantile q (0..1), on the monster */
  function quantiles(r) {
    // with elemental damage: hits sampled (a fixed seed), each weapon's physical roll with its crit and deadly strike
    // plus every element's own roll through its resistance and a landed hit's poison
    if (r.ex && r.ex.kind === "sentinel") {   // Blade Sentinel: a cast's blades and bursts
      const rnd = mulberry32(777), n = 4000, xs = [];
      for (let i = 0; i < n; i++) xs.push(exLoss(r.ex.always, rnd) / 256);
      xs.sort((a, b) => a - b);
      return Array.from({ length: 201 }, (_, i) => [i / 2, xs[Math.min(n - 1, Math.floor(i / 200 * (n - 1)))]]);
    }
    if (hasElem(r)) {
      const rnd = mulberry32(777), n = 4000, xs = [];
      const pois = r.pois ? r.pois.perHit : 0;
      for (let i = 0; i < n; i++) {
        const p = r.per[i % r.per.length], c = p.crit, x = rnd();
        let d = (p.mn256 + rnd() * Math.max(0, p.mx256 - p.mn256)) / 256 * (x < c.pc ? c.cm : x < c.pc + c.pd ? c.dm : 1) * r.pm;
        for (const e of ELEMS) if (e.k !== "pois" && p.el[e.k]) d += (p.el[e.k].lo + rnd() * (p.el[e.k].hi - p.el[e.k].lo)) / 256 * r.ER[e.k].net;
        if (r.ex) d += (exLoss(r.ex.land, rnd) + exLoss(r.ex.always, rnd)) / 256;   // a landed hit's extras
        xs.push(d + pois);
      }
      xs.sort((a, b) => a - b);
      return Array.from({ length: 201 }, (_, i) => [i / 2, xs[Math.min(n - 1, Math.floor(i / 200 * (n - 1)))]]);
    }
    const segs = [];
    // each weapon's hits with its own crit and deadly strike
    for (const p of r.per) {
      const c = p.crit, n = r.per.length, add = (w, mult) => segs.push({ w: w / n, lo: p.mn256 / 256 * mult * r.pm, hi: p.mx256 / 256 * mult * r.pm });
      const pn = 1 - c.pc - c.pd;
      if (pn > 0) add(pn, 1);
      if (c.pd > 0) add(c.pd, c.dm);
      if (c.pc > 0) add(c.pc, c.cm);
    }
    const F = x => segs.reduce((s, g) => s + g.w * (x <= g.lo ? 0 : x >= g.hi ? 1 : (x - g.lo) / (g.hi - g.lo || 1)), 0);
    const lo = Math.min(...segs.map(g => g.lo)), hi = Math.max(...segs.map(g => g.hi));
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const q = i / 200;
      let a = lo, z = hi;
      for (let k = 0; k < 40; k++) { const m = (a + z) / 2; if (F(m) < q) a = m; else z = m; }
      pts.push([q * 100, (a + z) / 2]);
    }
    return pts;
  }
  function drawProfile() {
    const box = $("dm-plot");
    if ($("dm-p-prof").hidden) return;   // drawn when its tab shows
    const width = Math.max(300, box.clientWidth || 800), narrow = width < 560, height = narrow ? 200 : 230;
    // (a build that can't make its attack has no hits: left out, said in the legend)
    const series = results.map((r, i) => (r.attack.frames_only || (!r.fr && r.why) ? null : { i, pts: quantiles(r) })).filter(Boolean);
    box.innerHTML = "";
    const leg = $("dm-legend"); leg.innerHTML = "";
    results.forEach((r, i) => { if (!r.fr && r.why && !r.attack.frames_only) el("li", {}, leg, `${bname(i)}: not drawn, it can’t attack this way (its Skill section says why)`); });
    if (!series.length) return;
    series.forEach(s => {
      const li = el("li", {}, leg), k = mk("svg", { class: "key", viewBox: "0 0 26 8", "aria-hidden": "true" }, li);
      mk("line", { x1: 1, x2: 25, y1: 4, y2: 4, stroke: KEYS[s.i], "stroke-width": 2.5, "stroke-dasharray": DASHES[s.i] }, k);
      // (between cooldowns: the attack's own hits only)
      const r = results[s.i];
      li.append(bname(s.i) + (wvOn(r) ? ` (${r.attack.label}’s casts; ${andList(r.wv.use.map(o => o.att.label))} between casts ${r.wv.use.length > 1 ? "aren’t" : "isn’t"} in it)` : ""));
    });
    // each line named at its right end too (wide enough only), so no build is told apart by its colour alone
    const short = t => (t.length > 12 ? t.slice(0, 11) + "…" : t);
    const ends = narrow || series.length < 2 ? [] : series.map(s => ({ s, t: short(bname(s.i)) }));
    const M = { l: narrow ? 60 : 76, r: ends.length ? 16 + 7 * Math.max(...ends.map(e => e.t.length)) : 12, t: 10, b: 36 };
    const ymax = Math.max(...series.flatMap(s => s.pts.map(p => p[1]))) * 1.05 || 1;
    const svg = mk("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Damage per hit, sorted from weakest to strongest" }, box);
    const x = v => M.l + (width - M.l - M.r) * v / 100, y = v => height - M.b - (height - M.t - M.b) * v / ymax;
    for (const t of niceTicks(0, ymax, narrow ? 4 : 5)) {
      mk("line", { x1: M.l, x2: width - M.r, y1: y(t), y2: y(t), stroke: "var(--grid)" }, svg);
      const tx = mk("text", { x: M.l - 6, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = nf0.format(t);
    }
    for (const t of [0, 25, 50, 75, 100]) { const tx = mk("text", { x: x(t), y: height - M.b + 16, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = t + "%"; }
    const at = mk("text", { x: (M.l + width - M.r) / 2, y: height - 4, "text-anchor": "middle", class: "axis-title" }, svg); at.textContent = "Share of hits, weakest to strongest";
    const yt = mk("text", { transform: `translate(13 ${(M.t + height - M.b) / 2}) rotate(-90)`, "text-anchor": "middle", class: "axis-title" }, svg); yt.textContent = "Damage per hit";
    mk("line", { x1: M.l, x2: M.l, y1: M.t, y2: height - M.b, stroke: "var(--axis)" }, svg);
    for (const s of series) {
      const d = s.pts.map((p, k) => `${k ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
      mk("path", { d, fill: "none", stroke: KEYS[s.i], "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-dasharray": DASHES[s.i] }, svg);
    }
    if (ends.length) {   // labels at the lines' ends, pushed apart where the ends meet
      ends.forEach(e => { e.y = y(e.s.pts[e.s.pts.length - 1][1]) + 4; });
      ends.sort((a, b) => a.y - b.y);
      for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 13);
      for (let k = ends.length - 1; k >= 0; k--) ends[k].y = Math.min(ends[k].y, k < ends.length - 1 ? ends[k + 1].y - 13 : height - M.b + 4);
      for (const e of ends) { const t = mk("text", { x: width - M.r + 6, y: e.y, class: "end-label" }, svg); t.textContent = e.t; }
    }
    // hover
    const tip = el("div", { class: "tip", hidden: true }, box);
    const cross = mk("line", { y1: M.t, y2: height - M.b, stroke: "var(--axis)", "stroke-dasharray": "3 3", visibility: "hidden" }, svg);
    svg.addEventListener("pointermove", e => {
      const rect = svg.getBoundingClientRect(); const px = (e.clientX - rect.left) * width / rect.width;
      const q = clamp((px - M.l) / (width - M.l - M.r) * 100, 0, 100);
      cross.setAttribute("x1", x(q)); cross.setAttribute("x2", x(q)); cross.setAttribute("visibility", "visible");
      tip.hidden = false;
      tip.innerHTML = `<div>${nf0.format(q)}% of hits do less than</div>` + series.map(s => `<div><span style="color:${KEYS[s.i]}">&#9632;</span> ${esc(bname(s.i))}: <b>${nf0.format(s.pts[Math.round(q * 2)][1])}</b></div>`).join("");
      tip.style.left = Math.min(rect.width - 190, (e.clientX - rect.left) + 12) + "px"; tip.style.top = "8px";
    });
    svg.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
  }

  // ---------- breakpoints: a ladder per build (its own frame counts; until 2026-11-13 one column mixed every build's
  // frame counts, sorted by frames per hit but labelled by frames per round: 13, 12, 11, 16, 10, 9)
  /* between cooldowns: a ladder of every skill's breakpoints, each row the rotation the page counts at that speed */
  function weaveTable(r) {
    const R = weaveRows(r), W = r.wv, a = esc(r.attack.label), word = R.fcr ? "faster cast rate" : "IAS";
    let t = `<table class="dm-table wv"><thead><tr><th>Frames</th><th>${R.fcr ? "Faster cast rate" : "IAS on other gear"}</th><th>Damage per second</th></tr></thead><tbody>`;
    R.rows.forEach((x, k) => {
      const gain = k > R.cur && r.dps ? `<small>${signed(x.dps / r.dps - 1)}</small>` : "";
      const own = R.fcr && x.fr.cast ? `casting ${x.fr.cast.own}; ` : "";
      const fl = W.use.map((o, i) => `${esc(o.att.label)} ${x.frs[i].frames}`).join(", ");
      const cyc = `<small>${own}${fl}${x.k > 0 ? `. ${rotCounts(x, a, x.S, false)}` : ": not cast"}</small>`;
      t += `<tr class="${k === R.cur ? "cur" : k < R.cur ? "past" : ""}"><td>${frLabel(x.fr)}${cyc}</td><td>${R.fcr ? x.fcr : x.gear}%${k === R.cur ? `<small>you: ${R.you}%</small>` : ""}</td><td>${nf0.format(x.dps)}${gain}</td></tr>`;
    });
    const nb = r.next;
    return t + "</tbody></table>" + (nb ? `<p class="note">${nb.capped ? `More ${word} makes the rotation no faster.` : `Next: <b>+${nb.add}% ${R.fcr ? "FCR" : "IAS"}</b>${R.fcr ? "" : " on other gear"} (${signed(nb.gain)} damage per second).`}</p>` : "");
  }
  function renderBreakpoints() {
    $("dm-bp").innerHTML = results.map((r, i) => {
      const b = r.b, own = +b.g.ias || 0, att = esc(r.attack.label);
      let body;
      if (!r.fr) body = `<p class="note">${r.why ? `⚠ ${esc(r.why)}` : `${att} has no animation with this weapon.`}</p>`;
      else if (r.fr.note === "fixed") body = `<p class="note">${att} hits every ${r.fr.frames} frames whatever the attack speed: it has no breakpoints.</p>`;
      else if (r.fr.note === "cast" && r.fr.cast.dsentry) body = `<p class="note">${att}: ${r.fr.cast.petmax} Death Sentries explode a corpse every ${r.fr.frames} frames between them, whatever the attack speed: it has no breakpoints.</p>`;
      else if (r.fr.note === "cast" && r.fr.cast.trap) body = `<p class="note">${att}: a trap every ${r.fr.frames} frames keeps ${r.fr.cast.petmax} up${r.fr.cast.own && r.fr.cast.own < r.fr.cast.keep ? `, longer than laying one takes at your attack speed (${r.fr.cast.own} frames): more attack speed changes nothing` : ""}.</p>`;
      else if (r.fr.note === "cast" && r.fr.cast.tick === "summon") body = `<p class="note">${att}: a cast every ${r.fr.frames} frames keeps ${r.fr.cast.petmax} heads up, longer than any cast at ${r.fr.cast.fcr}% faster cast rate (${r.fr.cast.own} frames): more faster cast rate changes nothing.</p>`;
      else if (r.fr.note === "cast" && r.fr.cast.tick) body = `<p class="note">${att} ${r.fr.cast.tick === "channel" ? "breathes" : r.fr.cast.tick === "aura" ? "deals its damage" : "strikes"} every ${r.fr.frames} frames whatever your ${r.attack.dfill ? "attack speed" : "faster cast rate"}: it has no breakpoints.</p>`;
      else if (r.wv && r.wv.S) body = weaveTable(r);
      else if (r.fr.note === "cast") {
        const L = castLadder(withBC(b), r.attack), v = r.fr.cast.fcr, dmg = !r.attack.frames_only && r.final > 0;
        const cur = L.reduce((k, x, i) => (x.fcr <= v ? i : k), 0);
        let t = `<table class="dm-table"><thead><tr><th>Frames</th><th>Faster cast rate</th>${dmg ? "<th>Damage per second</th>" : ""}</tr></thead><tbody>`;
        L.forEach((x, k) => {
          const dps = dmg ? finalAt(r, x.fr.frames) * 25 / x.fr.frames * r.toHit : 0, gain = dmg && k > cur && r.dps ? `<small>${signed(dps / r.dps - 1)}</small>` : "";
          t += `<tr class="${k === cur ? "cur" : k < cur ? "past" : ""}"><td>${x.fr.frames}</td><td>${x.fcr}%${k === cur ? `<small>you: ${v}%</small>` : ""}</td>${dmg ? `<td>${nf0.format(dps)}${gain}</td>` : ""}</tr>`;
        });
        const nb = r.next;
        body = t + "</tbody></table>" + (nb ? `<p class="note">${nb.capped ? "More faster cast rate makes this spell no faster." : `Next: <b>+${nb.add}% FCR</b> for ${nb.fr.frames} frames.`}</p>` : "");
      }
      else {
        // the engine's rows from no IAS on other gear, your row, and the IAS on other gear you could do without
        const bp = IAS.breakpoints(iasSetup(withBC(b), r.attack)), rows = bp.rows, cur = rows.length ? bp.you : -1, spare = bp.spare;
        const dmg = !r.attack.frames_only && r.final > 0;
        let t = `<table class="dm-table"><thead><tr><th>Frames</th><th>IAS on other gear</th>${dmg ? "<th>Damage per second</th>" : ""}</tr></thead><tbody>`;
        rows.forEach((row, k) => {
          const f = roundOf(row.r), dps = dmg ? finalAt(r, f.frames, row.gear) * 25 * f.hits / f.frames * r.toHit : 0;
          const hits = !f.alt && madeOf(f) > 1 ? `<small>${hitsWord(f, "")}</small>` : f.alt ? "<small>attack 1 / attack 2</small>" : "";
          const you = k === cur ? `<small>you: ${own}%${spare > 0 ? `, ${spare} to spare` : ""}</small>` : "";
          const gain = dmg && k > cur && r.dps ? `<small>${signed(dps / r.dps - 1)}</small>` : "";
          t += `<tr class="${k === cur ? "cur" : k < cur ? "past" : ""}"><td>${frLabel(f)}${hits}</td><td>${row.gear}%${you}</td>${dmg ? `<td>${nf0.format(dps)}${gain}</td>` : ""}</tr>`;
        });
        t += "</tbody></table>";
        const nb = r.next;
        // as the IAS Calculator's answer says it: what you could do without, then what more gives
        const keep = spare > 0 && cur >= 0 ? `You could do with <b>${spare}% IAS less</b> on other gear and keep ${frLabel(roundOf(rows[cur].r))} frames.` : "";
        const next = !nb ? "" : nb.capped ? "More IAS makes this attack no faster." : `Next: <b>+${nb.add}% IAS</b> on other gear for ${frLabel(nb.fr)} frames (${signed(nb.gain)} damage per second).`;
        const foot = [keep, next].filter(Boolean).join(" ");
        body = t + (foot ? `<p class="note">${foot}</p>` : "");
      }
      return `<div class="bp-card" style="--key:${KEYS[i]}"><h3>${esc(bname(i))}<small>${att}, ${r.fr && r.fr.note === "cast" && !r.attack.dfill ? `${r.fr.cast.fcr}% faster cast rate` : `${own}% IAS on other gear`}</small></h3>${body}</div>`;
    }).join("");
  }

  // ---------- stat trade-offs
  const PARITY = [
    { k: "offed", label: "Enhanced damage off the weapon", unit: "%", get: b => b.g.ed, set: (b, v) => { b.g.ed = v; }, max: 3000 },
    { k: "oned", label: "Enhanced damage on the weapon", unit: "%", get: b => b.w.ed, set: (b, v) => { b.w.ed = v; }, max: 5000 },
    { k: "flat", label: "Flat damage (+min and +max)", unit: "", get: b => b.g.min, set: (b, v, b0) => { b.g.min = b0.g.min + (v - b0.g.min); b.g.max = b0.g.max + (v - b0.g.min); }, max: 5000 },
    { k: "max", label: "Maximum damage alone", unit: "", get: b => b.g.max, set: (b, v) => { b.g.max = v; }, max: 5000 },
    { k: "str", label: "Strength", unit: "", get: b => b.c.str, set: (b, v) => { b.c.str = v; }, max: 5000 },
    { k: "dex", label: "Dexterity", unit: "", get: b => b.c.dex, set: (b, v) => { b.c.dex = v; }, max: 5000 },
    { k: "ds", label: "Deadly strike", unit: "%", get: b => b.g.ds, set: (b, v) => { b.g.ds = v; }, max: 200 },
    { k: "dsmult", label: "Deadly strike multiplier", unit: "%", get: b => b.g.dsmult, set: (b, v) => { b.g.dsmult = v; }, max: 2000 },
    { k: "crit", label: "Critical strike", unit: "%", get: b => b.g.crit, set: (b, v) => { b.g.crit = v; }, max: 100 },
    { k: "cmult", label: "Critical strike multiplier", unit: "%", get: b => b.g.cmult, set: (b, v) => { b.g.cmult = v; }, max: 2000 },
    { k: "ar", label: "Attack rating", unit: "", get: b => b.g.ar, set: (b, v) => { b.g.ar = v; }, max: 50000 },
    { k: "arp", label: "Attack rating %", unit: "%", get: b => b.g.arp, set: (b, v) => { b.g.arp = v; }, max: 5000 },
    { k: "edd", label: "Damage vs demons", unit: "%", get: b => b.g.edd, set: (b, v) => { b.g.edd = v; }, max: 5000 },
    { k: "edu", label: "Damage vs undead", unit: "%", get: b => b.g.edu, set: (b, v) => { b.g.edu = v; }, max: 5000 },
    // elemental damage (2026-11-24): flat on other gear (min and max), +% skill damage, -% enemy resistance
    ...["f", "l", "c", "m"].flatMap(k => {
      const e = ELEMS.find(x => x.p === k);
      return [
        { k: k + "flat", label: `${e.N} damage (+min and +max)`, unit: "", get: b => b.g[k + "max"], set: (b, v, b0) => { b.g[k + "min"] = b0.g[k + "min"] + (v - b0.g[k + "max"]); b.g[k + "max"] = v; }, max: 50000 },
        { k: k + "m", label: `+% to ${e.N} Skill Damage`, unit: "%", get: b => b.g[k + "m"], set: (b, v) => { b.g[k + "m"] = v; }, max: 1000 },
      ].concat(k === "m" ? [] : [{ k: k + "p", label: `−% to Enemy ${e.N} Resistance`, unit: "%", get: b => b.g[k + "p"], set: (b, v) => { b.g[k + "p"] = v; }, max: 200 }]);
    }),
  ];
  /* what a row of Stat Trade-offs matches: the average hit on the monster, a miss counting 0 (so attack rating and
     Dexterity's share of it count) */
  const parityValue = r => r.final * r.toHit;
  function renderParity() {
    const sel = $("dm-par-stat");
    if (!sel.options.length) {
      for (const p of PARITY) el("option", { value: p.k }, sel, p.label);
      sel.value = "offed";
      sel.addEventListener("change", renderParity);
      $("dm-par-amt").addEventListener("input", renderParity);
    }
    const ref = PARITY.find(p => p.k === sel.value) || PARITY[0];
    $("dm-par-unit").textContent = ref.unit;
    const amt = num($("dm-par-amt").value, 1, 5000);
    const tb = $("dm-parity");
    let h = "<thead><tr><th>Stat</th>" + results.map((r, i) => `<th><span class="key" style="background:${KEYS[i]}"></span>${esc(bname(i))}</th>`).join("") + "</tr></thead><tbody>";
    const goals = builds.map((b, i) => {
      if (results[i].attack.frames_only) return null;
      const c = JSON.parse(JSON.stringify(b));
      ref.set(c, ref.get(b) + amt, b);
      const r = evaluate(c, target, { kill: false });
      return { base: parityValue(results[i]), goal: parityValue(r) };
    });
    h += `<tr class="strong"><td>Average hit on the monster, a miss as 0</td>` + goals.map(g => g ? `<td>${nf0.format(g.base)} &rarr; ${nf0.format(g.goal)}<small>${signed(g.goal / g.base - 1)}</small></td>` : "<td>—</td>").join("") + "</tr>";
    for (const p of PARITY) {
      h += `<tr><td>${p.label}${p.k === ref.k ? " <small>(picked above)</small>" : ""}</td>` + builds.map((b, i) => {
        const g = goals[i];
        if (!g || g.goal <= g.base) return "<td>—</td>";
        const at = v => { const c = JSON.parse(JSON.stringify(b)); p.set(c, p.get(b) + v, b); return parityValue(evaluate(c, target, { kill: false })); };
        if (at(p.max) < g.goal) return "<td>—</td>";
        let lo = 0, hi = p.max;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at(m) >= g.goal) hi = m; else lo = m; }
        return `<td class="${p.k === ref.k ? "cur" : ""}">+${hi}${p.unit}</td>`;
      }).join("") + "</tr>";
    }
    h += "</tbody>";
    tb.innerHTML = h;
    renderKcTrade();
  }
  /* One- and two-hit kills (2026-11-24, a player: "how to improve consistency to 1 or 2 shot them"; the author: what
     raises them, ranked): an item-sized step of each stat, and each build's chance to kill within the hits that kill
     build A at least half the time, and within one hit fewer; ranked by build A's gain. Only while a build's fight
     takes a few hits (killChances) */
  const KC_STEPS = [
    ["+20% enhanced damage", b => { b.g.ed += 20; }],
    ["+10 maximum damage", b => { b.g.max += 10; }],
    ["+5 minimum and maximum damage", b => { b.g.min += 5; b.g.max += 5; }],
    ["+20 Strength", b => { b.c.str += 20; }],
    ["+20 Dexterity", b => { b.c.dex += 20; }],
    ["+10% deadly strike", b => { b.g.ds += 10; }],
    ["+5% critical strike", b => { b.g.crit += 5; }],
    ["+10% crushing blow", b => { b.g.cb += 10; }],
    ["+10% physical pierce", b => { b.g.pierce += 10; }],
    ["+500 attack rating", b => { b.g.ar += 500; }],
    ["+50% attack rating", b => { b.g.arp += 50; }],
    ["+1 to all skills", b => { const E = gearEffect(null, b), U = gearEffect(null, b); U.sk.all = 1; return applyGear(b, E, U); }],
  ];
  function renderKcTrade() {
    const box = $("dm-kc-trade");
    const A = results[0];
    if (!A.kc || A.kc[A.kc.length - 1] < 0.005) { box.innerHTML = ""; box.hidden = true; return; }
    box.hidden = false;
    // the hits that kill build A at least half the time (else 6) and one fewer
    const n0 = A.kc.findIndex(p => p >= 0.5), n = n0 < 0 ? A.kc.length - 1 : n0, ns = n ? [n - 1, n] : [0, 1];
    const steps = KC_STEPS.slice();
    // the elements a build deals: +25% skill damage, -10% enemy resistance
    for (const e of ELEMS) if (e.k !== "pois" && A.per.some(p => p.el && p.el[e.k])) {
      steps.push([`+25% to ${e.N} Skill Damage`, b => { b.g[e.p + "m"] = (+b.g[e.p + "m"] || 0) + 25; }]);
      if (e.k !== "mag") steps.push([`−10% to Enemy ${e.N} Resistance`, b => { b.g[e.p + "p"] = (+b.g[e.p + "p"] || 0) + 10; }]);
    }
    // the same 2,000 fights for a build with and without the step (one seed), so a difference is the step's
    const RUNS = 2000, base = results.map((r, i) => (r.kc ? killChances(r, builds[i], target, RUNS) : null));
    const rows = steps.map(([label, f]) => ({ label, kc: builds.map((b, i) => {
      if (!base[i]) return null;
      let c = JSON.parse(JSON.stringify(b));
      c = f(c) || c;
      return killChances(evaluate(c, target, { kill: false }), c, target, RUNS);
    }) }));
    const gain = row => ns.map(k => (row.kc[0] ? row.kc[0][k] : 0) - base[0][k]);
    rows.sort((x, y) => { const a = gain(x), b = gain(y); return b[1] - a[1] || b[0] - a[0]; });
    const hw = k => `${k + 1} hit${k ? "s" : ""}`;
    let h = `<table class="dm-table"><thead><tr><th>With one more item’s worth of</th>` + results.map((r, i) => `<th><span class="key" style="background:${KEYS[i]}"></span>${esc(bname(i))}<small>now: ${ns.map(k => `${hw(k)} ${base[i] ? kcPct(base[i][k]) : "—"}`).join(", ")}</small></th>`).join("") + "</tr></thead><tbody>";
    for (const row of rows) {
      h += `<tr><td>${row.label}</td>` + row.kc.map((kc, i) => {
        if (!kc || !base[i]) return "<td>—</td>";
        return `<td>${ns.map(k => { const d = kc[k] - base[i][k]; return `${hw(k)} ${kcPct(kc[k])}${Math.abs(d) >= 0.005 ? ` <small class="${d > 0 ? "good" : "bad"}">${d > 0 ? "+" : "−"}${Math.round(Math.abs(d) * 100)}</small>` : ""}`; }).join("<br>")}</td>`;
      }).join("") + "</tr>";
    }
    box.innerHTML = `<h3 class="kc-h">Kills within ${hw(ns[0])} or ${hw(ns[1])}</h3><p class="sub">Each build&rsquo;s chance to kill the monster within ${hw(ns[0])} and within ${hw(ns[1])}, after one more item&rsquo;s worth of each stat; the stats that raise ${esc(bname(0))}&rsquo;s chance within ${hw(ns[1])} most come first (in points: +6 is 6% more of the time).</p><div class="scroll">${h}</tbody></table></div>`;
  }

  // ================================================================== the details' tabs (the ARIA tab pattern)
  const TABS = [...root.querySelectorAll(".dm-tabbar [role=tab]")];
  let currentTab = "side";
  function showTab(tab, focus) {
    currentTab = tab;
    TABS.forEach(t => {
      const on = t.dataset.tab === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    if (results.length) renderTab(tab);
  }
  TABS.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
  root.querySelector(".dm-tabbar").addEventListener("keydown", e => {
    const k = TABS.indexOf(document.activeElement), to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (k < 0 || to === undefined) return;
    e.preventDefault();
    showTab(TABS[(to + TABS.length) % TABS.length].dataset.tab, true);
  });
  /* #tab-<name>, or a link to a heading inside a tab (the website's search), opens that tab */
  function tabFromHash() {
    const h = decodeURIComponent((location.hash || "").slice(1));
    // (a shared link's builds with its open tab, "#b=...&tab=fight": load() took the builds and kept the tab)
    if (linkTab) {
      const tab = linkTab;
      linkTab = "";
      if (TABS.some(t => t.dataset.tab === tab)) {
        showTab(tab);
        if (tab === "fight") fightFromLink = true;   // fight:start fight:end
        requestAnimationFrame(() => root.querySelector(".dm-tabbar").scrollIntoView({ block: "start" }));
      }
      return;
    }
    if (!h || h.includes("=")) return;
    let tab = /^tab-(\w+)$/.exec(h) ? h.slice(4) : null;
    if (!tab) { const e = document.getElementById(h), p = e && e.closest(".dm-tabpanel"); if (p) tab = (TABS.find(t => t.getAttribute("aria-controls") === p.id) || {}).dataset.tab; }
    if (!tab || !TABS.some(t => t.dataset.tab === tab)) return;
    if (tab === "fight") fightFromLink = true;   // fight:start fight:end
    showTab(tab);
    /* 2026-11-22, audit CALC-17: the tabs sit far down, so a shared link left the visitor at the monster */
    const to = /^tab-/.test(h) ? root.querySelector(".dm-tabbar") : document.getElementById(h);
    if (to) requestAnimationFrame(() => to.scrollIntoView({ block: "start" }));
  }
  addEventListener("hashchange", tabFromHash);

  // ================================================================== start
  function renderAll() { renderBuilds(); renderTarget(); }
  const saved = load();
  if (saved && Array.isArray(saved.builds) && saved.builds.length) {
    builds = saved.builds.slice(0, 4).map(sanitize);
    target = targetOf(saved.target);
    mode = MODES.includes(saved.mode) ? saved.mode : "builds";
    gear = gearOf(saved.gear);
    if (monOf(target)) applyPreset();  // a boss's or map monster's numbers as the game data has them now
  } else {
    builds = exampleBuilds().map(sanitize);  // every field a build has, as a kept one gets them (the Frenzy example had no level)
  }
  /* a setup from the IAS Calculator (#40, 2026-11-22: its "use this setup in the Damage Calculator", #ias= base64url
     JSON): iasSetup's mapping run back as a new build (the fourth replaced when there are four); the address drops it
     once read. Its character and gear (which the IAS Calculator doesn't have): build A's when it is of the same class,
     else that class's own attack example (the one with the same attack, else its first), else (a Necromancer: no
     example; a Sorceress: only spells') Strength and Dexterity 0, marked to fill in. The page scrolls to the card, which says what came over
     and what to put in, with Undo (the additions audit, CA-04, 2026-11-23: a Barbarian arrived on the Paladin
     example's numbers, "96.7% less damage", unannounced, far below) */
  {
    const m = /[#&]ias=([^&]+)/.exec(location.hash || "");
    if (m) {
      try {
        const s = JSON.parse(unb64u(m[1]));
        if (!CLS[s.cls]) throw new Error("not a class");
        const form = s.form || "human";
        const a = DATA.attacks.find(x => x.id === +s.atk && (!x.cls || x.cls === s.cls) && (FORMS[x.form] || "human") === form)
          || DATA.attacks.find(x => x.id === +s.atk && (!x.cls || x.cls === s.cls));
        const k = a ? a.k : "attack";
        const same = !!builds[0] && builds[0].cls === s.cls;
        // (a spell's example has no attack's character or gear: a Sorceress's are all spells, 2026-11-25)
        const ex = same ? null : PRESETS.map(p => [p, p[2]()]).filter(([, x]) => x.cls === s.cls && (ATT[x.s.k] || {}).kind !== "cast");
        const pre = ex ? ex.find(([, x]) => x.s.k === k) || ex[0] || null : null;
        const b = sanitize(same ? JSON.parse(JSON.stringify(builds[0])) : pre ? pre[1]
          : presetBuild("", s.cls, { c: { str: 0, dex: 0 }, w: { ed: 0 }, s: { syn: {} } }));
        b.name = ""; b.wname = "";
        const w = W[s.w], w2 = W[s.w2];
        if (w) { b.w.code = s.w; b.w.cat = w.cat; b.w.hand = s.oh === "none" && w.d1 && w.d2 ? "d2" : "d1"; }
        b.w.ias = +s.wi || 0;
        if (s.oh === "weapon" && w2) Object.assign(b.o, { on: true, code: s.w2, cat: w2.cat, ias: +s.wi2 || 0 });
        else b.o.on = false;
        b.g.ias = +s.gear || 0;
        b.s.k = k;
        if (+s.lvl > 0) b.s.lvl = +s.lvl;
        b.s.cdr = s.cdr || "";
        Object.assign(b.buf, { fana: +s.fana || 0, frenzy: +s.frenzy || 0, stacks: s.fst === undefined ? 5 : +s.fst, incHard: +s.inc || 0,
          bosHard: +s.bos || 0, bos: +s.bos > 0 ? Math.max(+b.buf.bos || 0, +s.bos) : 0, bosOff: false, were: +s.ww || 0 });
        const modeWas = mode;
        mode = "builds";  // in Compare weapons every build would take build A's character and gear
        let replaced = null;
        if (builds.length < 4) { builds.push(b); shown = builds.length - 1; }
        else { replaced = builds[3]; builds[3] = b; shown = 3; }
        const todo = same || pre ? null : { "c.str": 0, "c.dex": 0, "c.lvl": b.c.lvl };
        const rest = same ? " The rest is build A’s." : pre ? ` The rest comes from the example ${pre[0][1].split(",")[0]}.` : "";
        // an attack this page doesn't work out (Poison Javelin, Lightning Bolt...): said, the build attacks normally
        const missed = +s.atk && !a && IAS.SKILL[+s.atk] ? ` ${IAS.SKILL[+s.atk].n} isn’t worked out here yet: this build attacks normally.` : "";
        arrived = { b, replaced, modeWas, todo,  // its words after "Build C" (its letter when it is drawn)
          text: `${replaced ? ", in place of the build that was there" : ""}: your attack, weapons, IAS, and speed buffs from the IAS Calculator.${rest} ` +
            `Put in your level, Strength, Dexterity${todo ? " (marked ✎)" : ""}, and gear: the IAS Calculator doesn’t have them.${missed}` +
            (modeWas === "weapons" ? " Compare builds is on, so it keeps its own class." : "") };
      } catch (e) { /* a broken link */ }
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* no history */ }
    }
  }
  // + Add a build (the tile after the cards, 2026-11-24: the author's pick, only as a tile): a copy of the last build
  function addBuild() {
    if (builds.length >= 4) return;
    const c = JSON.parse(JSON.stringify(builds[builds.length - 1])); c.name = "";
    builds.push(c); shown = builds.length - 1; undo = null; renderAll();
  }
  /* the monster's fields on phones: behind Change the monster, opened in place (CA-12) */
  function targetOpen(open) {
    $("dm-target-panel").classList.toggle("open", open);
    const b = $("dm-target-open");
    b.setAttribute("aria-expanded", String(open));
    b.textContent = open ? "Done" : "Change the monster";
  }
  $("dm-target-open").addEventListener("click", () => {
    const open = !$("dm-target-panel").classList.contains("open");
    targetOpen(open);
    if (open) { const s = $("dm-target").querySelector("select"); if (s) s.focus({ preventScroll: true }); }
  });
  $("dm-mode-builds").addEventListener("click", () => setMode("builds"));
  $("dm-mode-weapons").addEventListener("click", () => setMode("weapons"));
  $("dm-mode-gear").addEventListener("click", () => setMode("gear"));
  $("dm-mode-undo").addEventListener("click", () => {
    if (!modeUndo) return;
    builds = modeUndo.builds.map(sanitize); mode = "builds"; modeUndo = null; undo = null; shown = 0;
    renderAll();
  });
  /* your character, shared with the site's other tools: the .ez-char box (javascripts/erazure.js; the website ideas' #11):
     build A's (in Compare weapons, the character's) */
  const charFit = (c) => {
    if (c.lvl !== undefined) c.lvl = clamp(Math.round(+c.lvl) || 1, 1, 99);
    for (const k of ["str", "dex"]) if (c[k] !== undefined) c[k] = clamp(Math.round(+c[k]) || 0, 0, 2000);
    if (c.ias !== undefined) c.ias = clamp(Math.round(+c.ias) || 0, 0, 400);
    return c;
  };
  /* the engine for tools/damage_selftest.py: a build and a monster of the test's own, filled in as a kept build and the
     monster's defaults are; the skill formulas; the presets' builds */
  window.ezDamage = {
    evaluate: (b, T) => evaluate(sanitize(b), targetOf(T), { kill: false }),
    // a cast's damage at another pace (Volcano's shared lock)
    finalAt: (r, frames) => finalAt(r, frames),
    // with the kill time and the kill chances
    fight: (b, T) => { const r = evaluate(sanitize(b), targetOf(T)); return { kill: r.kill, kc: r.kc, toHit: r.toHit, final: r.final }; },
    // Compare gear: an item of the list ({src: "list", key, slot}), what an item does, a column's build
    gearItem: (name, slot) => { const c = GEAR.find(x => x.name === name && x.slot === listSlot(slot)); return c ? Object.assign(GEAR_ITEM(), { src: "list", key: c.key, slot: c.slot }) : null; },
    gearEffect: (it, b) => gearEffect(it, sanitize(b)),
    applyGear: (A, now, it) => { const a = sanitize(A); return applyGear(a, gearEffect(now, a), gearEffect(it, a)); },
    // a map's toughest monster for a build: {id, hits, name}, and each of its monsters' expected hits
    toughest: (b, T) => toughest(targetOf(T), sanitize(b)),
    mapHits: (b, T) => {
      const a = sanitize(b), t0 = targetOf(T), mp = MAPS[t0.map];
      return mp ? mp[4].filter(r => r[1] === 0).map(([id]) => { const t = JSON.parse(JSON.stringify(t0)); t.preset = "map:" + id; const m = mapMonster(t); if (!m) return null; presetOn(t, m); const r = evaluate(a, t, { kill: false }); return [id, r.final * r.toHit > 0 ? t.life / (r.final * r.toHit) : Infinity]; }).filter(Boolean) : [];
    },
    maps: () => Object.keys(MAPS),
    // a monster as its list sets it (the Kind split's life, level and resistance)
    preset: T => { const t = targetOf(T), m = monOf(t); if (m) presetOn(t, m); return t; },
    calc: (id, col, lvl, ctx) => Calc.value(id, col, lvl, ctx || {}),
    // a spell's frames for any class or form: castFrames on a build of that class (its cast animation, FCR, a sequence)
    cast: (cls, fcr, id, form) => castFrames(sanitize({ cls, g: { fcr } }), { id: id || 0, form: form || "", kind: "cast" }),
    // a build as the page holds it now (a copy): after an armory load, its fields
    build: (i = 0) => JSON.parse(JSON.stringify(builds[i] || null)),
    // a unique's resistance mods on a monster's own numbers (applyMods, in the order of T.mods)
    mods: T => { const t = targetOf(T); applyMods(t); return t; },
    // poison over time, the replacement rule (poisonRun): apps per hit, a hit every period frames, the chance to hit
    poisonRun: (apps, period, p) => poisonRun(apps, period, p),
    presets: () => PRESETS.map(p => [p[0], p[2]()]),
    // the levels damage reads while Battle Command is on (its + all skills)
    withBC: b => withBC(sanitize(b)),
    // Fists of Fire's charges against a monster (fofApply's numbers, null for another attack)
    fof: (b, T) => evaluate(sanitize(b), targetOf(T), { kill: false }).fof || null,
    // the Fight tab's view of the page (tools/fight_selftest.py), and a build and monster as the page fills them in
    fightApi: FIGHT_API, sanitize: b => sanitize(b), target: T => targetOf(T),   // fight:start fight:end
    // between cooldowns: the skills a build could cast in its wait, and a build's rotation with its rows by speed
    fillers: b => { const a = sanitize(b); return fillersFor(a, ATT[a.s.k] || ATT.attack).map(x => x.k); },
    weave: (b, T) => {
      const r = evaluate(sanitize(b), targetOf(T), { kill: false }), W = r.wv;
      const wv = W ? { k: W.k, none: W.none || "", dps: W.dps, alone: W.alone, base: W.base, mainBase: W.mainBase, wait: W.wait, order: W.order, until: W.until, hold: W.hold, other: W.other,
        casts: W.casts, frames: W.frames, dmg: W.dmg, count: W.count, by: W.by, add: W.add, full: W.full, i0: W.i0, i1: W.i1,
        S: W.S ? W.S.map(s => ({ k: s.att.k, own: s.own, rel: s.rel, cyc: s.cyc, chan: s.chan, base: s.base, hits: s.hits, deb: s.deb, parts: s.parts })) : null,
        rot: W.rot.map(o => ({ k: o.att.k, lvl: o.lvl, lvBC: o.lvBC, none: o.none, final: o.E.final, toHit: o.E.toHit, frames: o.E.fr ? o.E.fr.frames : 0, deb: o.deb })),
        plays: W.ev ? W.ev.slice(0, W.i1 + 1).map(e => ({ j: e.j, t: e.t, v: e.v, add: e.add, nm: e.nm })) : null } : null;
      return { wv, dps: r.dps, final: r.final, toHit: r.toHit, fr: { frames: r.fr && r.fr.frames, hits: r.fr && r.fr.hits, cast: r.fr && r.fr.cast }, next: W && W.S ? nextBreakpoint(r) : null,
               rows: W && W.S ? weaveRows(r).rows.map(x => ({ fcr: x.fcr, gear: x.gear, frames: x.fr.frames, frs: x.frs.map(f => f.frames), k: x.k, casts: x.casts, period: x.frames, count: x.count, dps: x.dps })) : null };
    },
  };
  window.ezCharPage = {fields: ["cls", "lvl", "str", "dex", "ias"], fit: charFit, saveText: "Save build A as my character",  // it saves build A's (CA-10)
    read: () => { const b = builds[0]; return b ? {cls: b.cls, lvl: b.c.lvl, str: b.c.str, dex: b.c.dex, ias: b.g.ias} : {}; },
    use(c0) {
      const b = builds[0], c = charFit(Object.assign({}, c0));
      if (!b) return;
      if (c.cls && CLS[c.cls] && b.cls !== c.cls) { b.cls = c.cls; if (!attacksFor(c.cls).some(a => a.k === b.s.k)) b.s.k = "attack"; }
      for (const k of ["lvl", "str", "dex"]) if (c[k] !== undefined) b.c[k] = c[k];
      if (c.ias !== undefined) b.g.ias = c.ias;
      undo = null;
      renderAll();
    },
    /* a character from the PD2 armory (erazure.js's box, javascripts/armory.js; the author, 2026-11-24) becomes build
       A, named after the character: level, Strength and Dexterity as the character screen shows them, the weapon set
       picked (each weapon's own stats with what is socketed: weaponFieldsOf, as the paste), Other gear from everything
       else (charms and set bonuses in), the attack with the most points put in (ties: its level with + skills; none,
       or a main attack skill this page doesn't work out: the form's normal attack), its level, its synergies' points and the masteries, and the class's own auras and
       buffs (a Paladin's aura with the most points, an item's Might / Concentration / Fanaticism aura, a Barbarian's
       Battle Command (else a Call to Arms', either set), Increased Speed, Frenzy, Burst of Speed, Venom, the Druid's
       forms, Lycanthropy, Heart of Wolverine). A shield's enhanced damage is Other gear's, off-weapon (the author,
       2026-11-24: it counts on a non-Paladin's weapon attacks too). Build A's curses and the monster stay; in Compare
       weapons the other weapons stay. Undo puts everything back. */
    // the builds a load can go into, in Compare builds only (the author's pick, 2026-11-24: "into" beside Load and a
    // card's own Start from...); A new build while there are fewer than four
    targets: () => (mode === "builds" ? builds.map((x, i) => ({ value: String(i), label: `Build ${LETTERS[i]}`, letter: LETTERS[i] }))
      .concat([{ value: "new", label: "A new build", letter: LETTERS[builds.length] || "", disabled: builds.length >= 4 }]) : null),
    loaded: key => builds.some(x => x.from && "key:" + x.from === key),
    keyColor: L => KEYS[LETTERS.indexOf(L)] || "",
    armory(V, target) {
      if (!CLS[V.cls]) return null;
      // which build: A (no target: Compare weapons and gear, as before), one by its index, a new one, or the one a
      // load filled before (its key: the other weapon set picked)
      const tok = typeof target === "string" && target.startsWith("key:") ? target.slice(4) : "";
      let i = 0;
      if (tok) { i = builds.findIndex(x => x.from === tok); if (i < 0) return null; }
      else if (target === "new") { if (builds.length >= 4) return null; i = builds.length; }
      else if (target !== undefined && /^\d$/.test(String(target))) i = Math.min(+target, builds.length - 1);
      const token = tok || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const was = stateText(), wasShown = shown, A = builds[i] || builds[0];
      // what Clear character puts back: the build before the first load into it (none: a new build, removed), and for
      // build A what it wore (Compare gear's Now)
      if (!armBefore[token]) armBefore[token] = { before: builds[i] ? JSON.parse(JSON.stringify(builds[i])) : null, a: i === 0, worn: i === 0 && gear.worn ? JSON.parse(JSON.stringify(gear.worn)) : null };
      const lvl = id => V.skill(id).total, pts = id => V.skill(id).base, lv = n => clamp(Math.round(n || 0), 0, MAX_LVL);
      const b = presetBuild("", V.cls, {});
      b.name = V.name.slice(0, 30);
      b.from = token;
      b.c = { str: clamp(V.attr.str, 0, 2000), dex: clamp(V.attr.dex, 0, 2000), lvl: clamp(V.lvl, 1, 99) };
      if (A) b.deb = JSON.parse(JSON.stringify(A.deb));
      const left = ["the monster", "your curse", "Battle Cry"], filled = ["Gear, Charms", "Strength, Dexterity"];
      let warn = "";
      // a weapon from the armory: its base, ethereal, the hand (a Barbarian's sword for one or two hands in both when
      // the other hand is empty), its fields
      const fill = (x, I, otherHand) => {
        const w = W[I.code];
        if (!w) return false;
        Object.assign(x, { cat: w.cat, code: I.code, eth: !!I.eth && !!w.eth, hand: w.d1 && w.d2 && !otherHand ? "d2" : "d1" },
          weaponFieldsOf(I.st, b.c.lvl).f);
        return true;
      };
      const [I1, I2] = V.weapons;
      if (I1 && fill(b.w, I1, !!(I2 || V.shield || V.quiver))) b.wname = I1.name.slice(0, 30);
      else {
        if (A) b.w = JSON.parse(JSON.stringify(A.w));
        left.push(I1 ? `the weapon (${I1.name}'s base isn’t one this calculator has)` : "the weapon (none in that weapon set)");
      }
      if (I2 && DUAL[V.cls] && fill(b.o, I2, true)) { b.o.on = true; b.o.main = "r"; }
      Object.assign(b.g, gearFieldsOf(V.other));
      b.g.fcr = clamp(Math.round(V.st[105] || 0), 0, 400);   // faster cast rate on everything worn (a spell's speed)
      // each element's +% skill damage and -% enemy resistance count on every hit, the weapons' too (not tied to a
      // weapon's hits): from everything worn
      for (const [k, m, pz] of [["f", 329, 333], ["l", 330, 334], ["c", 331, 335], ["m", 357, 0], ["p", 332, 336]]) {
        b.g[k + "m"] = clamp(Math.round(V.st[m] || 0), 0, 1000);
        if (pz) b.g[k + "p"] = clamp(Math.round(V.st[pz] || 0), 0, 200);
      }
      b.k.kd = clamp(Math.round(V.other[137] || 0), 0, 999);
      if (V.boots && BOOTS[V.boots.code]) b.k.boots = V.boots.code;
      // the attack
      // the attack with the most points the weapons can do (Dragon Claw needs two claws). The character's main attack
      // skill is ranked among all of the class's skills that attack (the IAS data's attack, throw, kick and sequence
      // modes) with this page's attacks: when it is one this page doesn't work out (Fists of Fire), the normal attack,
      // and the note names it (the author, 2026-11-24: a Fists of Fire Assassin came in as Dragon Talon, its 1 point)
      const usable = a => { const t = Object.assign({}, b, { s: { k: a.k, lvl: 1, syn: {}, cdr: "" } }); return !!frames(sanitize(t), a); };
      // (Thunder Storm strikes beside the main spell, as a buff: never the main skill, 2026-11-25; a Nova Sorceress maxes
      // it, and Nova, one of its synergies, would lose the tie to it)
      // (Hurricane and Armageddon likewise: they run beside the main skill)
      const ids = attacksFor(V.cls).filter(a => a.id && a.tick !== "period" && a.tick !== "aura" && a.id !== 275).map(a => a.id);
      const attackModes = new Set(["A1", "A2", "TH", "KK", "SQ"]);
      // Dragon Flight is a kick after a teleport, on a cooldown: never the main attack (kick Assassins max it beside
      // Dragon Talon and Dragon Tail, and its higher required level won the tie; 2026-11-25)
      const main = V.pick([...new Set(ids.concat(Object.values(IAS.SKILL).filter(x => x.c === V.cls && attackModes.has(x.m) && x.id !== 275).map(x => x.id)))]);
      const notHere = main && !ids.includes(main) ? main : null;
      // a skill offered in both forms (Fire Claws) is taken in the form the character was saved in
      const inForm = id => { const all = attacksFor(V.cls).filter(a => a.id === id); return all.find(a => !a.form || a.form === (V.form === "bear" ? "TG" : "40")) || all[0]; };
      /* another class in a form an item gives (2026-11-25, the author: "sorceresses that use enchant as a build often
         change into a wereform such as werebear"; Beast's Werebear, Wolfhowl's Werewolf), from either weapon set: "the
         sorceress uses Beast on weapon swap ... to cast Werebear then switches weapon to something like a 6 socket 6
         Shael'd weapon" (the form stays, timed from the weapon in hand). With no attack skill of its own put to use here,
         it starts in the form with the higher level, as cast with that set, a tie the werebear */
      const formLvl = id => Math.max(lvl(id), V.swapSkill(id).total);
      const itemForm = V.cls !== "dru" && !notHere && (formLvl(228) > 0 || formLvl(223) > 0) ? (formLvl(228) >= formLvl(223) ? "bear" : "wolf") : "";
      const form = itemForm || V.form;
      /* the bone skills tied on points: Teeth, then Bone Spear, then Bone Spirit (the author, 2026-11-25: "teeth > bone
         spear > bone spirit"; bone Necromancers max all three); Poison Strike before Desecrate, its synergy (2026-11-25:
         dagger Necromancers max both and came in as Desecrate, its higher required level; one without a dagger or a
         scythe still does, as Poison Strike can't be used); a fire Druid's Volcano, then Molten Boulder, then Fissure
         (the author, 2026-11-25: "use volcano"; fire casters max all three); a lightning trapper's Chain Lightning Sentry,
         then Lightning Sentry, then Charged Bolt Sentry, and a fire trapper's Wake of Fire, then Wake of Inferno (the
         author, 2026-11-26: "Trappers generally play Wake of Fire or chain lightning sentry. They use fire blast and
         shockwave as secondary skills"; they max them all; from 2026-11-25 to 26 Lightning Sentry and Wake of Inferno
         came first), Death Sentry last (it runs beside them on corpses; its higher required level won) */
      /* (Venom Blade Sentinel Assassins max Cobra Strike as Venom's synergy: Blade Sentinel, then Blade Fury, then Cobra
         Strike (the author, 2026-11-26: "it could be either blade sentinel or blade fury. I'd say blade sentinel is more
         common"; pd2.tools keeps only the points, and the two are each other's synergy); until Cobra Strike was worked
         out the pick left it out, as they came in as a normal attack; until 2026-11-26 Blade Fury came first) */
      const TIES = [{ 67: 0, 84: 1, 93: 2 }, { 73: 0, 83: 1 }, { 244: 0, 229: 1, 234: 2 }, { 271: 0, 366: 1, 261: 2, 276: 3 }, { 262: 0, 272: 1, 276: 2 }, { 257: 0, 266: 1, 265: 2 }], ranked = V.rank(ids);
      const tie = (a, c) => { const t = TIES.find(m => a in m && c in m); return t ? t[a] - t[c] : 0; };
      ranked.sort((a, c) => (V.skill(c).base - V.skill(a).base) || tie(a, c));
      const att = (notHere ? null : ranked.map(inForm).find(usable))
        || ATT[form === "wolf" ? "wolfattack" : form === "bear" ? "bearattack" : "attack"] || ATT.attack;
      b.s = { k: att.k, lvl: att.id ? clamp(lvl(att.id), 1, MAX_LVL) : 1, syn: {}, cdr: "", hard: att.id ? clamp(pts(att.id), 0, 20) : 0 };
      // Smite: the shield worn, Holy Shield at its level when it has points (as cast with this set's + skills), Defiance's
      if (att.k === "smite") b.sm = { shield: V.shield && SHIELDS[V.shield.code] ? V.shield.code : "pab", hs: pts(117) > 0 ? lv(lvl(117)) : 0, def: Math.min(20, pts(104)) };
      // the skills by the names their formulas use, in any case (Lightning Fury's "Lightning bolt")
      const skIds = {}, skId = new Proxy(skIds, { get: (t, n) => t[String(n).toLowerCase()] });
      for (const [id, r] of Object.entries(SK)) if (r && r.skill && !(r.skill.toLowerCase() in skIds)) skIds[r.skill.toLowerCase()] = +id;
      const mastNames = new Set((MAST[V.cls] || []).filter(id => MAST_BASE[id]).map(id => SK[id] && SK[id].skill));
      for (const col of [att.dmg, att.hits, att.syn].filter(Boolean)) {
        for (const name of Calc.synergies(att.id, col)) if (!mastNames.has(name) && skId[name] !== undefined) b.s.syn[name] = Math.min(20, pts(skId[name]));
      }
      for (const name of att.synn || []) if (skId[name] !== undefined) b.s.syn[name] = Math.min(20, pts(skId[name]));
      // a charge-up skill: the character's Dragon Claw level for the finisher field's hint, Weapon Block's points for
      // its damage; the finisher stays off (Claws of Thunder Assassins max Dragon Claw as its synergy, 2026-11-25)
      if (att.charge && att.charge !== "cobra") {
        const bp = name => (skId[name] !== undefined ? Math.min(20, pts(skId[name])) : 0);
        Object.assign(b.s, { fin: 0, fk: "dc", dcl: lv(lvl(260)), dtl: lv(lvl(270)), dfl: lv(lvl(275)), dll: lv(lvl(255)), wb: bp("weapon block"), tal: bp("dragon talon"),
          fly: bp("dragon flight"), tail: bp("dragon tail") });
      }
      // a skill with a cooldown: the levels of the skills it could cast in the wait (with + skills) and their synergies'
      // base points, for the Between cooldowns field's hint and first values; the weave stays off
      if (weaveMain(att)) {
        const wl = {}, ws = {};
        for (const a of fillerKinds(V.cls, att)) {
          if (!a.id || !(lvl(a.id) > 0)) continue;
          wl[a.k] = lv(lvl(a.id));
          for (const name of synNames(V.cls, a)) if (skId[name] !== undefined) ws[name] = Math.min(20, pts(skId[name]));
        }
        Object.assign(b.s, { rot: [], wvs: {}, wlv: wl, wsy: ws });
      }
      const csk = att.id ? IAS.SKILL[att.id] : null, cdr = csk && csk.cdr ? csk.cdr.find(x => V.items.some(I => I.name === x[0])) : null;
      if (cdr) b.s.cdr = cdr[0];
      // its main skill this page doesn't work out: a ⚠ line outside the fold (the author, 2026-11-24)
      if (notHere) warn = `${(IAS.SKILL[notHere] || {}).n || Calc.name(notHere) || "Its main skill"}, its main skill (${pts(notHere)} points), isn’t worked out here yet: the normal attack stands in for it.`;
      b.m = {};
      for (const id of MAST[V.cls] || []) b.m[id] = id === 23 ? Math.min(20, pts(23)) : lv(lvl(id));
      if (V.cls === "ama") b.m.penLvl = lv(lvl(23));
      filled.push((MAST[V.cls] || []).length ? "Skills, Masteries" : "Skills");
      /* Dark Pact (2026-11-25): it needs curses on the monster, so a Dark Pact Necromancer brings its own: Curse
         Mastery's points, the gear's extra curses (stat 368), and its curses at their levels with + skills, the highest
         first, as many as it may put on (pd2.tools' 112: Decrepify, Amplify Damage, Lower Resist, Weaken) */
      if (att.k === "darkpact") {
        const CUR = [[87, "decrep"], [66, "amp"], [91, "lowres"], [72, "weaken"], [86, "attract"], [76, "other"], [82, "other"], [77, "other"], [81, "other"], [71, "other"]];
        b.deb.cm = Math.min(20, pts(374));
        b.deb.extra = clamp(Math.round(+(V.st || {})[368] || 0), 0, 3);
        b.deb.curses = CUR.filter(([id]) => lvl(id) > 0).map(([id, c]) => ({ c, lvl: lv(lvl(id)) })).sort((x, y) => y.lvl - x.lvl).slice(0, Math.min(3, yourCurses(b)));
        if (left.includes("your curse")) left.splice(left.indexOf("your curse"), 1);
        filled.push("Curses");
      }
      // auras and buffs: the class's own, and an item's aura
      const auras = [], buffs = [];
      if (V.cls === "pal") {
        const own = [["fana", 122], ["might", 98], ["conc", 113], ["ba", 108]].concat(Object.entries(HOLY).map(([k, h]) => ["holy:" + k, h[0]]))
          .filter(([, id]) => pts(id) > 0).sort((x, y) => pts(y[1]) - pts(x[1]) || lvl(y[1]) - lvl(x[1]))[0];
        if (own) {
          const [k, id] = own, n = lv(lvl(id));
          if (k === "fana") { b.buf.fana = n; b.buf.fanaSelf = true; }
          else if (k === "might") { b.aur.might = n; b.aur.mightSelf = true; }
          else if (k === "conc") { b.aur.conc = n; b.aur.concSelf = true; }
          else if (k === "ba") { b.aur.ba = n; b.aur.baSelf = true; b.aur.baHard = Math.min(20, pts(id)); }
          else {
            b.buf.holy = k.slice(5); b.buf.holyLvl = n;
            // its synergies' points (its damage on attacks), added up as its formula adds them
            b.buf.holySyn = Math.min(60, Calc.synergies(id, "EDmgSymPerCalc").reduce((s, nm) => s + (skId[nm] !== undefined ? pts(skId[nm]) : 0), 0));
          }
          auras.push(Calc.name(id) || "your aura");
        }
      }
      // the Holy auras its items give (2026-11-27, trace T14): each aura's level, two items' added up; a Paladin's base
      // points in its synergies
      for (const [k, h] of Object.entries(HOLY)) {
        const n = lv(V.aura(h[0]));
        b.buf.ia[k] = n; b.buf.iaSyn[k] = 0;
        if (n > 0) {
          if (V.cls === "pal") b.buf.iaSyn[k] = Math.min(60, Calc.synergies(h[0], "EDmgSymPerCalc").reduce((s, nm) => s + (skId[nm] !== undefined ? pts(skId[nm]) : 0), 0));
          auras.push(`${h[1]} ${n} (from items)`);
        }
      }
      for (const [k, id, self] of [["fana", 122, "fanaSelf"], ["might", 98, "mightSelf"], ["conc", 113, "concSelf"]]) {
        const n = lv(V.aura(id)), box = k === "fana" ? b.buf : b.aur;
        if (n > (+box[k] || 0)) { box[k] = n; box[self] = true; auras.push(`${Calc.name(id)} (an item’s aura)`); }
      }
      // Battle Command, precast from either weapon set (a Call to Arms' on the swap: another class's skill gets the
      // set's + all skills, armory.js) and cast twice, so its own + all skills (1 + base points / 10) raise it too:
      // the author's game, 2026-11-24, a Call to Arms' +4 on an Assassin read 12, then 13 (+56% damage)
      const bcCast = Math.max(lvl(155), V.swapSkill(155).total);
      if (bcCast > 0) {
        b.aur.bcHard = V.cls === "bar" ? Math.min(20, pts(155)) : 0;
        b.aur.bc = lv(bcCast + 1 + Math.floor(b.aur.bcHard / 10));
        buffs.push(`Battle Command ${b.aur.bc}`);
      }
      if (V.cls === "bar") {
        b.buf.incHard = Math.min(20, pts(148));
        b.buf.frenzy = att.k === "frenzy" ? lv(lvl(147)) : 0;
        buffs.push("Increased Speed");
        if (b.buf.frenzy) buffs.push("Frenzy");
      }
      if (V.cls === "ass") {
        // Burst of Speed or Fade, one at a time (PD2's States.txt puts both in group 2): the one with more points, a tie
        // Burst of Speed (the author, 2026-11-24); its Fade instead box switches it off
        const bp = pts(258), fp = pts(267);
        b.buf.bos = lv(lvl(258)); b.buf.bosHard = Math.min(20, bp); b.buf.bosOff = fp > bp;
        if (b.buf.bos) buffs.push(b.buf.bosOff ? "Burst of Speed off (Fade has more points; only one can be on)"
          : fp > 0 ? "Burst of Speed (not Fade: only one can be on)" : "Burst of Speed");
        // Venom whenever the character has it, at its level with + skills (the author, 2026-11-24: "total skill level
        // including +skills"; a point put in, or an item that gives it)
        if (lvl(278) > 0) { b.buf.venom = lv(lvl(278)); b.buf.venomSyn = Math.min(20, pts(265)); buffs.push("Venom"); }
      }
      if (V.cls !== "dru" && att.form) {
        // the form an item gives, at its level with + all skills (another class's skill: the item's + all skills)
        const sw = id => (lvl(id) > 0 ? "" : " on your other weapon set");
        if (att.form === "TG") { b.buf.bear = lv(formLvl(228)); buffs.push(`Werebear (from an item${sw(228)}: you fight as a werebear)`); }
        else { b.buf.were = lv(formLvl(223)); buffs.push(`Werewolf (from an item${sw(223)}: you fight as a werewolf)`); }
      }
      if (V.cls === "sor") {
        // Enchant and Cold Enchant, your own (all of it), when you have points in them; their synergies' base points
        if (pts(52) > 0) { b.buf.ench = lv(lvl(52)); b.buf.enchSyn = Math.min(20, pts(37)); b.buf.enchSelf = true; buffs.push("Enchant"); }
        if (pts(40) > 0) { b.buf.cench = lv(lvl(40)); b.buf.cenchSyn = Math.min(20, pts(60)); b.buf.cenchSelf = true; buffs.push("Cold Enchant"); }
      }
      if (V.cls === "dru") {
        b.buf.were = lv(lvl(223)); b.buf.bear = lv(lvl(228)); b.buf.lyc = lv(lvl(224));
        b.aur.wolv = pts(236) > 0 ? lv(lvl(236)) : 0;
        buffs.push("Werewolf", "Werebear", "Lycanthropy");
        if (b.aur.wolv) auras.push("Heart of Wolverine");
      }
      const ab = [auras.length ? `Auras (${andList(auras)})` : "", buffs.length ? `Buffs (${andList(buffs)})` : ""].filter(Boolean);
      if (ab.length) filled.push(ab.join(", "));
      // what it wears in each gear slot: Compare gear's Now (the armory's stats, per-level ones and sockets in)
      if (i === 0) {
        gear.worn = {};
        for (const [k, , word] of GEAR_SLOTS) {
          const I = k === "shield" ? V.shield : k === "quiver" ? V.quiver : word ? V.items.find(x => x.slot === word) : null;
          if (I) gear.worn[k] = { name: I.name, code: I.code, st: I.st, sp: I.sp };
        }
        if (mode === "gear") { gear.items[0] = wornItem(gear.slot); gearPasted = null; }
      }
      if (i >= builds.length) builds.push(sanitize(b)); else builds[i] = sanitize(b);
      shown = i; undo = null; pasted = null; arrived = null; modeUndo = null; resetUndo = null; cardArm = null;
      syncWeapons();
      const after = stateText();
      renderAll();
      // what to fill in by hand, a sentence of its own (the author, 2026-11-24, twice: clearer words than "auras from a
      // mercenary or the party (with Your own unticked)")
      return { filled, left, add: ["auras from your mercenary or party aren’t loaded: add them under Auras and buffs, and untick Your own next to each"],
        warn, key: "key:" + token, letter: LETTERS[i],
        // Clear character: that build as it was before the load (a new one goes), whatever changed since
        clear() {
          const keep = armBefore[token], j = builds.findIndex(x => x.from === token);
          delete armBefore[token];
          if (j < 0) return;
          const how = keep && keep.before ? "restored" : "removed";
          if (how === "restored") builds[j] = sanitize(keep.before); else builds.splice(j, 1);
          if (j === 0 && keep && keep.a) gear.worn = keep.worn;
          shown = Math.min(shown, builds.length - 1); undo = null;
          renderAll();
          return how;
        },
        undoable: () => stateText() === after,
        undo() {
          if (stateText() !== after) return false;
          const v = JSON.parse(was);
          builds = v.builds.map(sanitize); target = targetOf(v.target); mode = MODES.includes(v.mode) ? v.mode : "builds";
          gear = gearOf(v.gear);
          shown = wasShown; undo = null;
          renderAll();
          return true;
        } };
    }};
  // the armory loads: what each build was before its first load, by its token (Clear character; a card's mark)
  const armBefore = {};
  const armLoaded = token => !!token && Object.prototype.hasOwnProperty.call(armBefore, token);
  // a card's own Start from...: A character from the PD2 armory (its name box and what it says)
  let cardArm = null;  // {i, name, busy, err}
  // (with the Fight tab open, the link opens it too)
  const shareLink = () => location.href.split("#")[0] + "#b=" + packState() + (currentTab === "fight" ? "&tab=fight" : "");
  /* Reset to the defaults, then Undo reset until the next change (2026-11-22, audit CALC-09, as the other calculators):
     the example builds and monster; greyed out while those are what's here */
  let resetUndo = null;
  const stateText = () => JSON.stringify({ builds, target, mode, gear });
  const defaultText = () => JSON.stringify({ builds: exampleBuilds().map(sanitize), target: DEFAULT_TARGET(), mode: "builds", gear: GEAR_DEFAULT() });
  function resetButton() {
    const btn = $("dm-reset");
    if (resetUndo && resetUndo.after === null) resetUndo.after = stateText();
    else if (resetUndo && stateText() !== resetUndo.after) resetUndo = null;
    btn.textContent = resetUndo ? "Undo reset" : "Reset to the defaults";
    btn.disabled = !resetUndo && stateText() === defaultText();
  }
  /* Undo / Redo (2026-11-24, a player: "Is there an undo button somewhere?"): every state the page saves is a step,
     changes within 0.8 s of the last one join it (typing a number is one step); a change after an undo drops what
     could be redone. Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z work outside a text or number box (a box keeps the browser's
     own). The contextual Undo buttons (Start from, a paste, the IAS Calculator's build, Compare weapons, Reset) stay */
  const HIST = { list: [], at: -1, t: 0, quiet: false };
  function histPush() {
    if (HIST.quiet) return;
    const s = stateText(), now = Date.now();
    if (HIST.at >= 0 && HIST.list[HIST.at] === s) return;
    HIST.list.length = HIST.at + 1;
    if (HIST.at > 0 && now - HIST.t < 800) HIST.list[HIST.at] = s;
    else {
      HIST.list.push(s);
      if (HIST.list.length > 60) HIST.list.shift();
      HIST.at = HIST.list.length - 1;
    }
    HIST.t = now;
    histButtons();
  }
  function histButtons() {
    // the bar's and the strip's
    for (const id of ["dm-undo", "dm-dk-undo"]) if ($(id)) $(id).disabled = HIST.at <= 0;
    for (const id of ["dm-redo", "dm-dk-redo"]) if ($(id)) $(id).disabled = HIST.at >= HIST.list.length - 1;
  }
  function histGo(d) {
    const j = HIST.at + d;
    if (j < 0 || j >= HIST.list.length) return;
    HIST.at = j;
    HIST.t = 0;   // the next change is a step of its own
    HIST.quiet = true;
    restoreState(JSON.parse(HIST.list[j]));
    HIST.quiet = false;
    histButtons();
  }
  /* a saved state back on the page: the builds, the monster, the mode (and Compare gear's items) */
  function restoreState(v) {
    builds = (v.builds || []).map(sanitize);
    target = targetOf(v.target);
    mode = MODES.includes(v.mode) ? v.mode : "builds";
    gear = gearOf(v.gear);
    shown = 0; undo = null; modeUndo = null; pasted = null; arrived = null; resetUndo = null; gearPasted = null;
    renderAll();
  }
  $("dm-undo").addEventListener("click", () => histGo(-1));
  $("dm-redo").addEventListener("click", () => histGo(1));
  /* Open all sections / Close all sections (the section looks review, 2026-11-27, the author's pick): every card's
     sections at once (the folds inside stay as they are); greyed out while every section already is, the focus then
     going to the other one */
  function sectionButtons() {
    const ds = [...$("dm-builds").querySelectorAll("details.sec")], op = $("dm-open-all"), cl = $("dm-close-all");
    op.disabled = !ds.length || ds.every(d => d.open);
    cl.disabled = !ds.length || ds.every(d => !d.open);
    if (document.activeElement === op && op.disabled && !cl.disabled) cl.focus();
    else if (document.activeElement === cl && cl.disabled && !op.disabled) op.focus();
  }
  function openSections(want) {
    for (const d of $("dm-builds").querySelectorAll("details.sec")) { SECTIONS_OPEN[d.dataset.sec] = want; d.open = want; }
    sectionButtons();
  }
  $("dm-open-all").addEventListener("click", () => openSections(true));
  $("dm-close-all").addEventListener("click", () => openSections(false));
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase(), t = e.target;
    if (k !== "z" && k !== "y") return;
    if (t && t.closest && (t.closest("input, textarea, [contenteditable]") || !(root.contains(t) || t === document.body))) return;
    e.preventDefault();
    histGo(k === "y" || e.shiftKey ? 1 : -1);
  });
  $("dm-reset").addEventListener("click", () => {
    if (resetUndo) {
      const v = JSON.parse(resetUndo.before);
      builds = v.builds.map(sanitize); target = targetOf(v.target); mode = MODES.includes(v.mode) ? v.mode : "builds";
      gear = gearOf(v.gear);
      resetUndo = null;
    } else {
      resetUndo = { before: stateText(), after: null };
      builds = exampleBuilds().map(sanitize); target = DEFAULT_TARGET(); mode = "builds"; gear = GEAR_DEFAULT();
    }
    shown = 0; undo = null; modeUndo = null; $("dm-share-note").textContent = "";
    renderAll();
  });
  // the website's Feedback button (javascripts/erazure.js) passes these builds on to the Feedback page (2026-11-21)
  window.erazureFeedback = () => ({ link: shareLink() });
  function copyLink(after) {
    const link = shareLink();
    const done = ok => { $("dm-share-note").textContent = ok ? "Link copied." : "Copy this link: " + link; if (after) after(ok); };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => done(true), () => done(false)); else done(false);
  }
  $("dm-share").addEventListener("click", () => copyLink());
  let lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = $("dm-plot").clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; requestAnimationFrame(drawProfile); } }).observe($("dm-plot"));
  /* links to the site's other pages: from the site's root on the website (its own copy of this page sits elsewhere),
     the live site opened from a file */
  const SITE = typeof __md_scope !== "undefined" ? __md_scope.href : "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
  root.querySelectorAll("a[data-site-path]").forEach(a => { a.href = SITE + a.dataset.sitePath; });
  renderAll();
  tabFromHash();
  // a build from the IAS Calculator: its card in view (CA-04: the page opened at its top, the new card far below); on
  // phones the build tabs over it
  if (arrived) requestAnimationFrame(() => {
    const i = builds.indexOf(arrived.b), tabs = $("dm-tabs"), card = i >= 0 ? $("dm-builds").querySelectorAll(".build")[i] : null;
    const to = tabs.offsetParent && !tabs.hidden ? tabs : card;
    if (to) to.scrollIntoView({ block: "start" });
  });
})();
