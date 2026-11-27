
(function () {
  "use strict";
  /* calc-data:start */
  const DATA = {"weapons":[{"code":"hax","name":"Hand Axe","tier":"N","cat":"axe1","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[3,6],"eth":1,"ms":2},{"code":"axe","name":"Axe","tier":"N","cat":"axe1","lvl":0,"str":32,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[4,11],"eth":1,"ms":4},{"code":"2ax","name":"Double Axe","tier":"N","cat":"axe1","lvl":0,"str":43,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[5,13],"eth":1,"ms":5},{"code":"mpi","name":"Military Pick","tier":"N","cat":"axe1","lvl":0,"str":49,"dex":33,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[7,11],"eth":1,"ms":6},{"code":"wax","name":"War Axe","tier":"N","cat":"axe1","lvl":0,"str":67,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[12,20],"eth":1,"ms":6},{"code":"lax","name":"Large Axe","tier":"N","cat":"axe2","lvl":0,"str":35,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[6,13],"wc2":"STF","eth":1,"ms":4},{"code":"bax","name":"Broad Axe","tier":"N","cat":"axe2","lvl":0,"str":48,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[10,18],"wc2":"STF","eth":1,"ms":5},{"code":"btx","name":"Battle Axe","tier":"N","cat":"axe2","lvl":0,"str":54,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[12,32],"wc2":"STF","eth":1,"ms":5},{"code":"gax","name":"Great Axe","tier":"N","cat":"axe2","lvl":0,"str":63,"dex":39,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[9,30],"wc2":"STF","eth":1,"ms":6},{"code":"gix","name":"Giant Axe","tier":"N","cat":"axe2","lvl":0,"str":70,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[22,45],"wc2":"STF","eth":1,"ms":6},{"code":"wnd","name":"Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[2,4],"eth":1,"ms":1},{"code":"ywn","name":"Yew Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[2,8],"eth":1,"ms":1},{"code":"bwn","name":"Bone Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[3,7],"eth":1,"ms":2},{"code":"gwn","name":"Grim Wand","tier":"N","cat":"wand","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[5,11],"eth":1,"ms":2},{"code":"clb","name":"Club","tier":"N","cat":"club","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[1,6],"eth":1,"ms":2},{"code":"scp","name":"Scepter","tier":"N","cat":"scep","lvl":0,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[6,11],"eth":1,"ms":2},{"code":"gsc","name":"Grand Scepter","tier":"N","cat":"scep","lvl":0,"str":37,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[8,18],"eth":1,"ms":3},{"code":"wsp","name":"War Scepter","tier":"N","cat":"scep","lvl":0,"str":55,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[12,19],"eth":1,"ms":5},{"code":"spc","name":"Spiked Club","tier":"N","cat":"club","lvl":0,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[5,8],"eth":1,"ms":2},{"code":"mac","name":"Mace","tier":"N","cat":"mace","lvl":0,"str":27,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[3,10],"eth":1,"ms":2},{"code":"mst","name":"Morning Star","tier":"N","cat":"mace","lvl":0,"str":36,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[7,16],"eth":1,"ms":3},{"code":"fla","name":"Flail","tier":"N","cat":"mace","lvl":0,"str":41,"dex":35,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[1,24],"eth":1,"ms":5},{"code":"whm","name":"War Hammer","tier":"N","cat":"ham1","lvl":0,"str":53,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[22,32],"eth":1,"ms":4},{"code":"mau","name":"Maul","tier":"N","cat":"ham2","lvl":0,"str":69,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[30,43],"wc2":"STF","eth":1,"ms":6},{"code":"gma","name":"Great Maul","tier":"N","cat":"ham2","lvl":0,"str":99,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[38,58],"wc2":"STF","eth":1,"ms":6},{"code":"ssd","name":"Short Sword","tier":"N","cat":"swd1","lvl":0,"str":0,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[2,7],"eth":1,"ms":2},{"code":"scm","name":"Scimitar","tier":"N","cat":"swd1","lvl":0,"str":0,"dex":21,"wsm":-20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[2,6],"eth":1,"ms":2},{"code":"sbr","name":"Sabre","tier":"N","cat":"swd1","lvl":0,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[3,8],"eth":1,"ms":2},{"code":"flc","name":"Falchion","tier":"N","cat":"swd1","lvl":0,"str":33,"dex":0,"wsm":20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[9,17],"eth":1,"ms":2},{"code":"crs","name":"Crystal Sword","tier":"N","cat":"swd1","lvl":0,"str":43,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[5,15],"eth":1,"ms":6},{"code":"bsd","name":"Broad Sword","tier":"N","cat":"swd1","lvl":0,"str":48,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[7,14],"eth":1,"ms":4},{"code":"lsd","name":"Long Sword","tier":"N","cat":"swd1","lvl":0,"str":55,"dex":39,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[3,19],"eth":1,"ms":4},{"code":"wsd","name":"War Sword","tier":"N","cat":"swd1","lvl":0,"str":71,"dex":45,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[8,20],"eth":1,"ms":3},{"code":"2hs","name":"Two-Handed Sword","tier":"N","cat":"swd2","lvl":0,"str":35,"dex":27,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[2,9],"d2":[8,17],"wc2":"2HS","eth":1,"ms":3},{"code":"clm","name":"Claymore","tier":"N","cat":"swd2","lvl":0,"str":47,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[5,12],"d2":[13,30],"wc2":"2HS","eth":1,"ms":4},{"code":"gis","name":"Giant Sword","tier":"N","cat":"swd2","lvl":0,"str":56,"dex":34,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[3,16],"d2":[9,28],"wc2":"2HS","eth":1,"ms":4},{"code":"bsw","name":"Bastard Sword","tier":"N","cat":"swd2","lvl":0,"str":62,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[7,19],"d2":[20,28],"wc2":"2HS","eth":1,"ms":4},{"code":"flb","name":"Flamberge","tier":"N","cat":"swd2","lvl":0,"str":70,"dex":49,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[9,15],"d2":[13,26],"wc2":"2HS","eth":1,"ms":5},{"code":"gsd","name":"Great Sword","tier":"N","cat":"swd2","lvl":0,"str":100,"dex":60,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[12,20],"d2":[25,42],"wc2":"2HS","eth":1,"ms":6},{"code":"dgr","name":"Dagger","tier":"N","cat":"dag","lvl":0,"str":0,"dex":0,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[1,4],"eth":1,"ms":1},{"code":"dir","name":"Dirk","tier":"N","cat":"dag","lvl":0,"str":0,"dex":25,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[3,9],"eth":1,"ms":1},{"code":"kri","name":"Kris","tier":"N","cat":"dag","lvl":0,"str":0,"dex":45,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[2,11],"eth":1,"ms":3},{"code":"bld","name":"Blade","tier":"N","cat":"dag","lvl":0,"str":35,"dex":51,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[4,15],"eth":1,"ms":2},{"code":"tkf","name":"Throwing Knife","tier":"N","cat":"tkni","lvl":0,"str":0,"dex":21,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[2,3],"dt":[4,5],"eth":1,"ms":1},{"code":"tax","name":"Throwing Axe","tier":"N","cat":"taxe","lvl":0,"str":0,"dex":40,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[4,7],"dt":[7,8],"eth":1,"ms":1},{"code":"bkf","name":"Balanced Knife","tier":"N","cat":"tkni","lvl":0,"str":0,"dex":51,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[1,8],"dt":[6,11],"eth":1,"ms":2},{"code":"bal","name":"Balanced Axe","tier":"N","cat":"taxe","lvl":0,"str":0,"dex":57,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[5,10],"dt":[12,15],"eth":1,"ms":3},{"code":"jav","name":"Javelin","tier":"N","cat":"jave","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[1,5],"dt":[6,10],"eth":1,"ms":1},{"code":"pil","name":"Pilum","tier":"N","cat":"jave","lvl":0,"str":0,"dex":45,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[4,9],"dt":[7,20],"eth":1,"ms":2},{"code":"ssp","name":"Short Spear","tier":"N","cat":"jave","lvl":0,"str":40,"dex":40,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[2,13],"dt":[10,22],"eth":1,"ms":2},{"code":"glv","name":"Glaive","tier":"N","cat":"jave","lvl":0,"str":52,"dex":35,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[5,17],"dt":[16,22],"eth":1,"ms":3},{"code":"tsp","name":"Throwing Spear","tier":"N","cat":"jave","lvl":0,"str":0,"dex":65,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[5,15],"dt":[12,30],"eth":1,"ms":3},{"code":"spr","name":"Spear","tier":"N","cat":"spea","lvl":0,"str":0,"dex":20,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[3,15],"wc2":"2HT","eth":1,"ms":3},{"code":"tri","name":"Trident","tier":"N","cat":"spea","lvl":0,"str":38,"dex":24,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[9,15],"wc2":"2HT","eth":1,"ms":4},{"code":"brn","name":"Brandistock","tier":"N","cat":"spea","lvl":0,"str":40,"dex":50,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[7,17],"wc2":"2HT","eth":1,"ms":5},{"code":"spt","name":"Spetum","tier":"N","cat":"spea","lvl":0,"str":54,"dex":35,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[15,23],"wc2":"2HT","eth":1,"ms":6},{"code":"pik","name":"Pike","tier":"N","cat":"spea","lvl":0,"str":60,"dex":45,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[14,63],"wc2":"2HT","eth":1,"ms":6},{"code":"bar","name":"Bardiche","tier":"N","cat":"pole","lvl":0,"str":40,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[1,27],"wc2":"STF","eth":1,"ms":3},{"code":"vou","name":"Voulge","tier":"N","cat":"pole","lvl":0,"str":50,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[6,21],"wc2":"STF","eth":1,"ms":4},{"code":"scy","name":"Scythe","tier":"N","cat":"pole","lvl":0,"str":41,"dex":41,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[8,20],"wc2":"STF","eth":1,"ms":5},{"code":"pax","name":"Poleaxe","tier":"N","cat":"pole","lvl":0,"str":62,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[18,39],"wc2":"STF","eth":1,"ms":5},{"code":"hal","name":"Halberd","tier":"N","cat":"pole","lvl":0,"str":75,"dex":47,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[12,45],"wc2":"STF","eth":1,"ms":6},{"code":"wsc","name":"War Scythe","tier":"N","cat":"pole","lvl":0,"str":80,"dex":80,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[15,36],"wc2":"STF","eth":1,"ms":6},{"code":"sst","name":"Short Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[1,5],"wc2":"STF","eth":1,"ms":2},{"code":"lst","name":"Long Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[2,8],"wc2":"STF","eth":1,"ms":3},{"code":"cst","name":"Gnarled Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[4,12],"wc2":"STF","eth":1,"ms":4},{"code":"bst","name":"Battle Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[6,13],"wc2":"STF","eth":1,"ms":4},{"code":"wst","name":"War Staff","tier":"N","cat":"staf","lvl":0,"str":0,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[12,28],"wc2":"STF","eth":1,"ms":6},{"code":"sbw","name":"Short Bow","tier":"N","cat":"bow","lvl":0,"str":0,"dex":15,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[1,4],"wc2":"BOW","ms":3},{"code":"hbw","name":"Hunter's Bow","tier":"N","cat":"bow","lvl":0,"str":0,"dex":28,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[2,6],"wc2":"BOW","ms":4},{"code":"lbw","name":"Long Bow","tier":"N","cat":"bow","lvl":0,"str":22,"dex":19,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[5,10],"wc2":"BOW","ms":5},{"code":"cbw","name":"Composite Bow","tier":"N","cat":"bow","lvl":0,"str":25,"dex":35,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[5,9],"wc2":"BOW","ms":4},{"code":"sbb","name":"Short Battle Bow","tier":"N","cat":"bow","lvl":0,"str":30,"dex":40,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[6,12],"wc2":"BOW","ms":5},{"code":"lbb","name":"Long Battle Bow","tier":"N","cat":"bow","lvl":0,"str":40,"dex":50,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[7,18],"wc2":"BOW","ms":6},{"code":"swb","name":"Short War Bow","tier":"N","cat":"bow","lvl":0,"str":35,"dex":55,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[6,14],"wc2":"BOW","ms":5},{"code":"lwb","name":"Long War Bow","tier":"N","cat":"bow","lvl":0,"str":50,"dex":65,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[3,23],"wc2":"BOW","ms":6},{"code":"lxb","name":"Light Crossbow","tier":"N","cat":"xbow","lvl":0,"str":21,"dex":27,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[8,11],"wc2":"XBW","ms":3},{"code":"mxb","name":"Crossbow","tier":"N","cat":"xbow","lvl":0,"str":40,"dex":33,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[11,19],"wc2":"XBW","ms":4},{"code":"hxb","name":"Heavy Crossbow","tier":"N","cat":"xbow","lvl":0,"str":60,"dex":40,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[20,33],"wc2":"XBW","ms":6},{"code":"rxb","name":"Repeating Crossbow","tier":"N","cat":"xbow","lvl":0,"str":40,"dex":50,"wsm":-40,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[9,18],"wc2":"XBW","ms":5},{"code":"9ha","name":"Hatchet","tier":"X","cat":"axe1","lvl":19,"str":25,"dex":25,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[15,30],"eth":1,"ms":3},{"code":"9ax","name":"Cleaver","tier":"X","cat":"axe1","lvl":22,"str":68,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[14,47],"eth":1,"ms":4},{"code":"92a","name":"Twin Axe","tier":"X","cat":"axe1","lvl":25,"str":85,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[18,54],"eth":1,"ms":5},{"code":"9mp","name":"Crowbill","tier":"X","cat":"axe1","lvl":25,"str":94,"dex":70,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[21,48],"eth":1,"ms":6},{"code":"9wa","name":"Naga","tier":"X","cat":"axe1","lvl":25,"str":121,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[23,64],"eth":1,"ms":6},{"code":"9la","name":"Military Axe","tier":"X","cat":"axe2","lvl":22,"str":73,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[21,61],"wc2":"STF","eth":1,"ms":5},{"code":"9ba","name":"Bearded Axe","tier":"X","cat":"axe2","lvl":25,"str":92,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[30,70],"wc2":"STF","eth":1,"ms":5},{"code":"9bt","name":"Tabar","tier":"X","cat":"axe2","lvl":25,"str":101,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[35,99],"wc2":"STF","eth":1,"ms":5},{"code":"9ga","name":"Gothic Axe","tier":"X","cat":"axe2","lvl":25,"str":115,"dex":79,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[23,100],"wc2":"STF","eth":1,"ms":6},{"code":"9gi","name":"Ancient Axe","tier":"X","cat":"axe2","lvl":25,"str":125,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[62,122],"wc2":"STF","eth":1,"ms":6},{"code":"9wn","name":"Burnt Wand","tier":"X","cat":"wand","lvl":19,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[8,18],"eth":1,"ms":1},{"code":"9yw","name":"Petrified Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[8,24],"eth":1,"ms":2},{"code":"9bw","name":"Tomb Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[10,22],"eth":1,"ms":2},{"code":"9gw","name":"Grave Wand","tier":"X","cat":"wand","lvl":25,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[13,29],"eth":1,"ms":2},{"code":"9cl","name":"Cudgel","tier":"X","cat":"club","lvl":18,"str":25,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[10,30],"eth":1,"ms":3},{"code":"9sc","name":"Rune Scepter","tier":"X","cat":"scep","lvl":19,"str":58,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[18,35],"eth":1,"ms":3},{"code":"9qs","name":"Holy Water Sprinkler","tier":"X","cat":"scep","lvl":25,"str":76,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[20,52],"eth":1,"ms":3},{"code":"9ws","name":"Divine Scepter","tier":"X","cat":"scep","lvl":25,"str":103,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[24,46],"eth":1,"ms":5},{"code":"9sp","name":"Barbed Club","tier":"X","cat":"club","lvl":20,"str":30,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[18,36],"eth":1,"ms":3},{"code":"9ma","name":"Flanged Mace","tier":"X","cat":"mace","lvl":23,"str":61,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[22,33],"eth":1,"ms":3},{"code":"9mt","name":"Jagged Star","tier":"X","cat":"mace","lvl":25,"str":74,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[29,45],"eth":1,"ms":3},{"code":"9fl","name":"Knout","tier":"X","cat":"mace","lvl":25,"str":82,"dex":73,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[18,50],"eth":1,"ms":5},{"code":"9wh","name":"Battle Hammer","tier":"X","cat":"ham1","lvl":25,"str":100,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[39,60],"eth":1,"ms":4},{"code":"9m9","name":"War Club","tier":"X","cat":"ham2","lvl":25,"str":124,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[69,113],"wc2":"STF","eth":1,"ms":6},{"code":"9gm","name":"Martel de Fer","tier":"X","cat":"ham2","lvl":25,"str":169,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[76,131],"wc2":"STF","eth":1,"ms":6},{"code":"9ss","name":"Gladius","tier":"X","cat":"swd1","lvl":18,"str":25,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[12,32],"eth":1,"ms":3},{"code":"9sm","name":"Cutlass","tier":"X","cat":"swd1","lvl":25,"str":25,"dex":52,"wsm":-30,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[12,30],"eth":1,"ms":3},{"code":"9sb","name":"Shamshir","tier":"X","cat":"swd1","lvl":23,"str":58,"dex":58,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[14,35],"eth":1,"ms":3},{"code":"9fc","name":"Tulwar","tier":"X","cat":"swd1","lvl":25,"str":70,"dex":42,"wsm":20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[23,50],"eth":1,"ms":3},{"code":"9cr","name":"Dimensional Blade","tier":"X","cat":"swd1","lvl":25,"str":85,"dex":60,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[18,51],"eth":1,"ms":6},{"code":"9bs","name":"Battle Sword","tier":"X","cat":"swd1","lvl":25,"str":92,"dex":43,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[23,48],"eth":1,"ms":4},{"code":"9ls","name":"Rune Sword","tier":"X","cat":"swd1","lvl":25,"str":103,"dex":79,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[14,60],"eth":1,"ms":5},{"code":"9wd","name":"Ancient Sword","tier":"X","cat":"swd1","lvl":25,"str":127,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[25,55],"eth":1,"ms":3},{"code":"92h","name":"Espandon","tier":"X","cat":"swd2","lvl":25,"str":73,"dex":61,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[12,37],"d2":[32,58],"wc2":"2HS","eth":1,"ms":3},{"code":"9cm","name":"Dacian Falx","tier":"X","cat":"swd2","lvl":25,"str":91,"dex":20,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[18,43],"d2":[38,87],"wc2":"2HS","eth":1,"ms":4},{"code":"9gs","name":"Tusk Sword","tier":"X","cat":"swd2","lvl":25,"str":104,"dex":71,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[14,53],"d2":[28,83],"wc2":"2HS","eth":1,"ms":4},{"code":"9b9","name":"Gothic Sword","tier":"X","cat":"swd2","lvl":25,"str":113,"dex":20,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[22,58],"d2":[58,86],"wc2":"2HS","eth":1,"ms":4},{"code":"9fb","name":"Zweihander","tier":"X","cat":"swd2","lvl":25,"str":125,"dex":94,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,51],"d2":[41,77],"wc2":"2HS","eth":1,"ms":5},{"code":"9gd","name":"Executioner Sword","tier":"X","cat":"swd2","lvl":25,"str":170,"dex":110,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,58],"d2":[68,115],"wc2":"2HS","eth":1,"ms":6},{"code":"9dg","name":"Poignard","tier":"X","cat":"dag","lvl":19,"str":25,"dex":0,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[9,26],"eth":1,"ms":2},{"code":"9di","name":"Rondel","tier":"X","cat":"dag","lvl":24,"str":25,"dex":58,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[14,38],"eth":1,"ms":2},{"code":"9kr","name":"Cinquedeas","tier":"X","cat":"dag","lvl":25,"str":25,"dex":88,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[17,45],"eth":1,"ms":3},{"code":"9bl","name":"Stiletto","tier":"X","cat":"dag","lvl":25,"str":47,"dex":97,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[28,52],"eth":1,"ms":2},{"code":"9tk","name":"Battle Dart","tier":"X","cat":"tkni","lvl":19,"str":25,"dex":52,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[12,20],"dt":[14,30],"eth":1,"ms":2},{"code":"9ta","name":"Francisca","tier":"X","cat":"taxe","lvl":22,"str":25,"dex":80,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[13,27],"dt":[22,41],"eth":1,"ms":2},{"code":"9bk","name":"War Dart","tier":"X","cat":"tkni","lvl":25,"str":25,"dex":97,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[8,30],"dt":[17,34],"eth":1,"ms":2},{"code":"9b8","name":"Hurlbat","tier":"X","cat":"taxe","lvl":25,"str":25,"dex":106,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[19,34],"dt":[24,34],"eth":1,"ms":3},{"code":"9ja","name":"War Javelin","tier":"X","cat":"jave","lvl":18,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[7,24],"dt":[18,40],"eth":1,"ms":2},{"code":"9pi","name":"Great Pilum","tier":"X","cat":"jave","lvl":25,"str":25,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[13,33],"dt":[17,52],"eth":1,"ms":2},{"code":"9s9","name":"Simbilan","tier":"X","cat":"jave","lvl":25,"str":80,"dex":80,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[10,40],"dt":[34,58],"eth":1,"ms":2},{"code":"9gl","name":"Spiculum","tier":"X","cat":"jave","lvl":25,"str":98,"dex":73,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[16,48],"dt":[32,65],"eth":1,"ms":3},{"code":"9ts","name":"Harpoon","tier":"X","cat":"jave","lvl":25,"str":25,"dex":118,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[16,44],"dt":[23,59],"eth":1,"ms":3},{"code":"9sr","name":"War Spear","tier":"X","cat":"spea","lvl":21,"str":25,"dex":25,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[15,54],"wc2":"2HT","eth":1,"ms":4},{"code":"9tr","name":"Fuscina","tier":"X","cat":"spea","lvl":24,"str":77,"dex":25,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[24,53],"wc2":"2HT","eth":1,"ms":4},{"code":"9br","name":"War Fork","tier":"X","cat":"spea","lvl":25,"str":80,"dex":95,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[23,58],"wc2":"2HT","eth":1,"ms":5},{"code":"9st","name":"Yari","tier":"X","cat":"spea","lvl":25,"str":101,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[41,85],"wc2":"2HT","eth":1,"ms":6},{"code":"9p9","name":"Lance","tier":"X","cat":"spea","lvl":25,"str":110,"dex":88,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[33,163],"wc2":"2HT","eth":1,"ms":6},{"code":"9b7","name":"Lochaber Axe","tier":"X","cat":"pole","lvl":21,"str":80,"dex":0,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[9,83],"wc2":"STF","eth":1,"ms":4},{"code":"9vo","name":"Bill","tier":"X","cat":"pole","lvl":25,"str":95,"dex":0,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[20,76],"wc2":"STF","eth":1,"ms":4},{"code":"9s8","name":"Battle Scythe","tier":"X","cat":"pole","lvl":25,"str":82,"dex":82,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[25,64],"wc2":"STF","eth":1,"ms":5},{"code":"9pa","name":"Partizan","tier":"X","cat":"pole","lvl":23,"str":113,"dex":67,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[49,108],"wc2":"STF","eth":1,"ms":5},{"code":"9h9","name":"Bec-de-Corbin","tier":"X","cat":"pole","lvl":25,"str":133,"dex":91,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[18,122],"wc2":"STF","eth":1,"ms":6},{"code":"9wc","name":"Grim Scythe","tier":"X","cat":"pole","lvl":25,"str":140,"dex":140,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[44,100],"wc2":"STF","eth":1,"ms":6},{"code":"8ss","name":"Jo Staff","tier":"X","cat":"staf","lvl":18,"str":25,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[9,30],"wc2":"STF","eth":1,"ms":3},{"code":"8ls","name":"Quarterstaff","tier":"X","cat":"staf","lvl":23,"str":25,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[12,38],"wc2":"STF","eth":1,"ms":3},{"code":"8cs","name":"Cedar Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[15,46],"wc2":"STF","eth":1,"ms":4},{"code":"8bs","name":"Gothic Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[21,48],"wc2":"STF","eth":1,"ms":4},{"code":"8ws","name":"Rune Staff","tier":"X","cat":"staf","lvl":25,"str":25,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[35,84],"wc2":"STF","eth":1,"ms":6},{"code":"8sb","name":"Edge Bow","tier":"X","cat":"bow","lvl":18,"str":25,"dex":43,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[8,25],"wc2":"BOW","ms":4},{"code":"8hb","name":"Razor Bow","tier":"X","cat":"bow","lvl":21,"str":25,"dex":62,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[11,29],"wc2":"BOW","ms":4},{"code":"8lb","name":"Cedar Bow","tier":"X","cat":"bow","lvl":23,"str":53,"dex":49,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[13,38],"wc2":"BOW","ms":5},{"code":"8cb","name":"Double Bow","tier":"X","cat":"bow","lvl":25,"str":58,"dex":73,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[14,35],"wc2":"BOW","ms":4},{"code":"8s8","name":"Short Siege Bow","tier":"X","cat":"bow","lvl":25,"str":65,"dex":80,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[17,40],"wc2":"BOW","ms":5},{"code":"8l8","name":"Large Siege Bow","tier":"X","cat":"bow","lvl":25,"str":80,"dex":95,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[13,56],"wc2":"BOW","ms":6},{"code":"8sw","name":"Rune Bow","tier":"X","cat":"bow","lvl":25,"str":73,"dex":103,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[19,46],"wc2":"BOW","ms":5},{"code":"8lw","name":"Gothic Bow","tier":"X","cat":"bow","lvl":25,"str":95,"dex":118,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[8,63],"wc2":"BOW","ms":6},{"code":"8lx","name":"Arbalest","tier":"X","cat":"xbow","lvl":22,"str":52,"dex":61,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[20,38],"wc2":"XBW","ms":4},{"code":"8mx","name":"Siege Crossbow","tier":"X","cat":"xbow","lvl":25,"str":80,"dex":70,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[28,60],"wc2":"XBW","ms":4},{"code":"8hx","name":"Ballista","tier":"X","cat":"xbow","lvl":25,"str":110,"dex":80,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[47,78],"wc2":"XBW","ms":6},{"code":"8rx","name":"Chu-Ko-Nu","tier":"X","cat":"xbow","lvl":25,"str":80,"dex":95,"wsm":-60,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[22,50],"wc2":"XBW","ms":5},{"code":"ktr","name":"Katar","tier":"N","cat":"claw","lvl":0,"str":20,"dex":20,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[5,8],"eth":1,"ms":2},{"code":"wrb","name":"Wrist Blade","tier":"N","cat":"claw","lvl":0,"str":33,"dex":33,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[6,10],"eth":1,"ms":2},{"code":"axf","name":"Hatchet Hands","tier":"N","cat":"claw","lvl":0,"str":37,"dex":37,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[3,17],"eth":1,"ms":2},{"code":"ces","name":"Cestus","tier":"N","cat":"claw","lvl":0,"str":42,"dex":42,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[8,17],"eth":1,"ms":2},{"code":"clw","name":"Claws","tier":"N","cat":"claw","lvl":0,"str":46,"dex":46,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[9,16],"eth":1,"ms":3},{"code":"btl","name":"Blade Talons","tier":"N","cat":"claw","lvl":0,"str":50,"dex":50,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[11,15],"eth":1,"ms":3},{"code":"skr","name":"Scissors Katar","tier":"N","cat":"claw","lvl":0,"str":55,"dex":55,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[10,19],"eth":1,"ms":3},{"code":"9ar","name":"Quhab","tier":"X","cat":"claw","lvl":21,"str":57,"dex":57,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[15,35],"eth":1,"ms":3},{"code":"9wb","name":"Wrist Spike","tier":"X","cat":"claw","lvl":24,"str":66,"dex":66,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[20,46],"eth":1,"ms":3},{"code":"9xf","name":"Fascia","tier":"X","cat":"claw","lvl":27,"str":69,"dex":69,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[12,53],"eth":1,"ms":3},{"code":"9cs","name":"Hand Scythe","tier":"X","cat":"claw","lvl":30,"str":73,"dex":73,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[23,46],"eth":1,"ms":3},{"code":"9lw","name":"Greater Claws","tier":"X","cat":"claw","lvl":33,"str":76,"dex":76,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[23,53],"eth":1,"ms":3},{"code":"9tw","name":"Greater Talons","tier":"X","cat":"claw","lvl":37,"str":79,"dex":79,"wsm":-30,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[25,45],"eth":1,"ms":3},{"code":"9qr","name":"Scissors Quhab","tier":"X","cat":"claw","lvl":40,"str":82,"dex":82,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[28,58],"eth":1,"ms":3},{"code":"7ar","name":"Suwayyah","tier":"E","cat":"claw","lvl":44,"str":99,"dex":99,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[54,71],"eth":1,"ms":3},{"code":"7wb","name":"Wrist Sword","tier":"E","cat":"claw","lvl":46,"str":105,"dex":105,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[46,63],"eth":1,"ms":3},{"code":"7xf","name":"War Fist","tier":"E","cat":"claw","lvl":51,"str":108,"dex":108,"wsm":10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[60,73],"eth":1,"ms":3},{"code":"7cs","name":"Battle Cestus","tier":"E","cat":"claw","lvl":54,"str":110,"dex":110,"wsm":-10,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[45,53],"eth":1,"ms":3},{"code":"7lw","name":"Feral Claws","tier":"E","cat":"claw","lvl":58,"str":113,"dex":113,"wsm":-20,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[30,73],"eth":1,"ms":3},{"code":"7tw","name":"Runic Talons","tier":"E","cat":"claw","lvl":60,"str":115,"dex":115,"wsm":-30,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[33,60],"eth":1,"ms":3},{"code":"7qr","name":"Scissors Suwayyah","tier":"E","cat":"claw","lvl":64,"str":118,"dex":118,"wsm":0,"sb":75,"db":75,"wc":"HT1","it":["1han","asm","h2h","mele"],"d1":[55,70],"eth":1,"ms":3},{"code":"7ha","name":"Tomahawk","tier":"E","cat":"axe1","lvl":40,"str":125,"dex":67,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[44,75],"eth":1,"ms":3},{"code":"7ax","name":"Small Crescent","tier":"E","cat":"axe1","lvl":45,"str":115,"dex":83,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[47,75],"eth":1,"ms":4},{"code":"72a","name":"Ettin Axe","tier":"E","cat":"axe1","lvl":52,"str":145,"dex":45,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[41,83],"eth":1,"ms":5},{"code":"7mp","name":"War Spike","tier":"E","cat":"axe1","lvl":59,"str":133,"dex":54,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[38,60],"eth":1,"ms":6},{"code":"7wa","name":"Berserker Axe","tier":"E","cat":"axe1","lvl":64,"str":138,"dex":59,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","axe","mele"],"d1":[30,89],"eth":1,"ms":6},{"code":"7la","name":"Feral Axe","tier":"E","cat":"axe2","lvl":42,"str":196,"dex":0,"wsm":-15,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[31,154],"wc2":"STF","eth":1,"ms":5},{"code":"7ba","name":"Silver-edged Axe","tier":"E","cat":"axe2","lvl":48,"str":166,"dex":65,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[78,138],"wc2":"STF","eth":1,"ms":5},{"code":"7bt","name":"Decapitator","tier":"E","cat":"axe2","lvl":54,"str":189,"dex":33,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[61,171],"wc2":"STF","eth":1,"ms":5},{"code":"7ga","name":"Champion Axe","tier":"E","cat":"axe2","lvl":61,"str":167,"dex":59,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[74,118],"wc2":"STF","eth":1,"ms":6},{"code":"7gi","name":"Glorious Axe","tier":"E","cat":"axe2","lvl":66,"str":164,"dex":55,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","axe","mele"],"d2":[75,155],"wc2":"STF","eth":1,"ms":6},{"code":"7wn","name":"Polished Wand","tier":"E","cat":"wand","lvl":41,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[18,33],"eth":1,"ms":2},{"code":"7yw","name":"Ghost Wand","tier":"E","cat":"wand","lvl":48,"str":25,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[20,40],"eth":1,"ms":2},{"code":"7bw","name":"Lich Wand","tier":"E","cat":"wand","lvl":56,"str":25,"dex":0,"wsm":-20,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[10,31],"eth":1,"ms":2},{"code":"7gw","name":"Unearthed Wand","tier":"E","cat":"wand","lvl":64,"str":25,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","wand","rod"],"d1":[22,28],"eth":1,"ms":2},{"code":"7cl","name":"Truncheon","tier":"E","cat":"club","lvl":39,"str":88,"dex":43,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[44,54],"eth":1,"ms":3},{"code":"7sc","name":"Mighty Scepter","tier":"E","cat":"scep","lvl":46,"str":125,"dex":65,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[50,65],"eth":1,"ms":3},{"code":"7qs","name":"Seraph Rod","tier":"E","cat":"scep","lvl":57,"str":108,"dex":69,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[56,68],"eth":1,"ms":3},{"code":"7ws","name":"Caduceus","tier":"E","cat":"scep","lvl":66,"str":97,"dex":70,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","scep","rod"],"d1":[46,54],"eth":1,"ms":5},{"code":"7sp","name":"Tyrant Club","tier":"E","cat":"club","lvl":42,"str":133,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","club"],"d1":[43,75],"eth":1,"ms":3},{"code":"7ma","name":"Reinforced Mace","tier":"E","cat":"mace","lvl":47,"str":145,"dex":46,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[56,66],"eth":1,"ms":3},{"code":"7mt","name":"Devil Star","tier":"E","cat":"mace","lvl":52,"str":153,"dex":44,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[56,69],"eth":1,"ms":3},{"code":"7fl","name":"Scourge","tier":"E","cat":"mace","lvl":57,"str":125,"dex":77,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["1han","blun","mele","mace"],"d1":[14,100],"eth":1,"ms":5},{"code":"7wh","name":"Legendary Mallet","tier":"E","cat":"ham1","lvl":61,"str":189,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"1HS","it":["1han","blun","mele","hamm"],"d1":[63,76],"eth":1,"ms":4},{"code":"7m7","name":"Ogre Maul","tier":"E","cat":"ham2","lvl":51,"str":225,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[96,132],"wc2":"STF","eth":1,"ms":6},{"code":"7gm","name":"Thunder Maul","tier":"E","cat":"ham2","lvl":65,"str":253,"dex":0,"wsm":20,"sb":110,"db":0,"wc":"STF","it":["2han","blun","mele","hamm"],"d2":[41,225],"wc2":"STF","eth":1,"ms":6},{"code":"7ss","name":"Falcata","tier":"E","cat":"swd1","lvl":42,"str":150,"dex":88,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[39,74],"eth":1,"ms":3},{"code":"7sm","name":"Ataghan","tier":"E","cat":"swd1","lvl":45,"str":138,"dex":95,"wsm":-20,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[33,58],"eth":1,"ms":3},{"code":"7sb","name":"Elegant Blade","tier":"E","cat":"swd1","lvl":47,"str":109,"dex":122,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[41,56],"eth":1,"ms":3},{"code":"7fc","name":"Hydra Edge","tier":"E","cat":"swd1","lvl":51,"str":142,"dex":105,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[35,85],"eth":1,"ms":3},{"code":"7cr","name":"Phase Blade","tier":"E","cat":"swd1","lvl":54,"str":25,"dex":136,"wsm":-30,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[39,44],"ms":6},{"code":"7bs","name":"Conquest Sword","tier":"E","cat":"swd1","lvl":58,"str":142,"dex":112,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[46,66],"eth":1,"ms":4},{"code":"7ls","name":"Cryptic Sword","tier":"E","cat":"swd1","lvl":61,"str":99,"dex":109,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[6,96],"eth":1,"ms":5},{"code":"7wd","name":"Mythical Sword","tier":"E","cat":"swd1","lvl":66,"str":147,"dex":124,"wsm":0,"sb":75,"db":75,"wc":"1HS","it":["1han","swor","mele"],"d1":[50,63],"eth":1,"ms":3},{"code":"72h","name":"Legend Sword","tier":"E","cat":"swd2","lvl":44,"str":175,"dex":100,"wsm":-15,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,70],"d2":[63,118],"wc2":"2HS","eth":1,"ms":3},{"code":"7cm","name":"Highland Blade","tier":"E","cat":"swd2","lvl":49,"str":171,"dex":104,"wsm":-5,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[28,78],"d2":[84,120],"wc2":"2HS","eth":1,"ms":4},{"code":"7gs","name":"Balrog Blade","tier":"E","cat":"swd2","lvl":53,"str":185,"dex":87,"wsm":0,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[19,94],"d2":[69,149],"wc2":"2HS","eth":1,"ms":4},{"code":"7b7","name":"Champion Sword","tier":"E","cat":"swd2","lvl":57,"str":163,"dex":103,"wsm":-10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[30,68],"d2":[89,104],"wc2":"2HS","eth":1,"ms":4},{"code":"7fb","name":"Colossus Sword","tier":"E","cat":"swd2","lvl":60,"str":182,"dex":95,"wsm":10,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[33,88],"d2":[76,151],"wc2":"2HS","eth":1,"ms":5},{"code":"7gd","name":"Colossus Blade","tier":"E","cat":"swd2","lvl":63,"str":189,"dex":110,"wsm":5,"sb":110,"db":0,"wc":"1HS","it":["2han","swor","mele","2hsw"],"d1":[31,81],"d2":[73,144],"wc2":"2HS","eth":1,"ms":6},{"code":"7dg","name":"Bone Knife","tier":"E","cat":"dag","lvl":43,"str":38,"dex":75,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[28,56],"eth":1,"ms":2},{"code":"7di","name":"Mithril Point","tier":"E","cat":"dag","lvl":52,"str":55,"dex":98,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[43,61],"eth":1,"ms":2},{"code":"7kr","name":"Fanged Knife","tier":"E","cat":"dag","lvl":62,"str":42,"dex":86,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[19,65],"eth":1,"ms":3},{"code":"7bl","name":"Legend Spike","tier":"E","cat":"dag","lvl":66,"str":65,"dex":67,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","asm","knif","mele"],"d1":[36,64],"eth":1,"ms":2},{"code":"7tk","name":"Flying Knife","tier":"E","cat":"tkni","lvl":48,"str":48,"dex":141,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[23,54],"dt":[23,54],"eth":1,"ms":2},{"code":"7ta","name":"Flying Axe","tier":"E","cat":"taxe","lvl":42,"str":88,"dex":108,"wsm":10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[17,65],"dt":[15,66],"eth":1,"ms":2},{"code":"7bk","name":"Winged Knife","tier":"E","cat":"tkni","lvl":57,"str":45,"dex":142,"wsm":-20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","asm","knif","mele","tkni"],"d1":[27,35],"dt":[23,39],"eth":1,"ms":2},{"code":"7b8","name":"Winged Axe","tier":"E","cat":"taxe","lvl":60,"str":96,"dex":122,"wsm":-10,"sb":75,"db":75,"wc":"1HS","it":["1han","thro","axe","mele","taxe"],"d1":[11,56],"dt":[7,60],"eth":1,"ms":3},{"code":"7ja","name":"Hyperion Javelin","tier":"E","cat":"jave","lvl":40,"str":98,"dex":123,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[21,57],"dt":[28,55],"eth":1,"ms":2},{"code":"7pi","name":"Stygian Pilum","tier":"E","cat":"jave","lvl":46,"str":118,"dex":112,"wsm":0,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[14,64],"dt":[21,75],"eth":1,"ms":2},{"code":"7s7","name":"Balrog Spear","tier":"E","cat":"jave","lvl":53,"str":127,"dex":95,"wsm":10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[33,63],"dt":[40,62],"eth":1,"ms":2},{"code":"7gl","name":"Ghost Glaive","tier":"E","cat":"jave","lvl":59,"str":89,"dex":137,"wsm":20,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[19,60],"dt":[30,78],"eth":1,"ms":3},{"code":"7ts","name":"Winged Harpoon","tier":"E","cat":"jave","lvl":65,"str":76,"dex":145,"wsm":-10,"sb":75,"db":75,"wc":"1HT","it":["1han","thro","spea","jave","mele"],"d1":[27,35],"dt":[11,77],"eth":1,"ms":3},{"code":"7sr","name":"Hyperion Spear","tier":"E","cat":"spea","lvl":43,"str":155,"dex":120,"wsm":-10,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[44,149],"wc2":"2HT","eth":1,"ms":6},{"code":"7tr","name":"Stygian Pike","tier":"E","cat":"spea","lvl":49,"str":168,"dex":97,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[36,180],"wc2":"2HT","eth":1,"ms":4},{"code":"7br","name":"Mancatcher","tier":"E","cat":"spea","lvl":55,"str":132,"dex":134,"wsm":-20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[52,115],"wc2":"2HT","eth":1,"ms":5},{"code":"7st","name":"Ghost Spear","tier":"E","cat":"spea","lvl":62,"str":122,"dex":163,"wsm":0,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[23,194],"wc2":"2HT","eth":1,"ms":6},{"code":"7p7","name":"War Pike","tier":"E","cat":"spea","lvl":66,"str":165,"dex":106,"wsm":20,"sb":75,"db":75,"wc":"2HT","it":["2han","spea","mele"],"d2":[41,223],"wc2":"2HT","eth":1,"ms":6},{"code":"7o7","name":"Ogre Axe","tier":"E","cat":"pole","lvl":45,"str":195,"dex":75,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[35,181],"wc2":"STF","eth":1,"ms":4},{"code":"7vo","name":"Colossus Voulge","tier":"E","cat":"pole","lvl":48,"str":210,"dex":55,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[21,206],"wc2":"STF","eth":1,"ms":4},{"code":"7s8","name":"Thresher","tier":"E","cat":"pole","lvl":53,"str":152,"dex":118,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[15,176],"wc2":"STF","eth":1,"ms":5},{"code":"7pa","name":"Cryptic Axe","tier":"E","cat":"pole","lvl":59,"str":165,"dex":103,"wsm":10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[41,188],"wc2":"STF","eth":1,"ms":5},{"code":"7h7","name":"Great Poleaxe","tier":"E","cat":"pole","lvl":63,"str":179,"dex":99,"wsm":0,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[58,159],"wc2":"STF","eth":1,"ms":6},{"code":"7wc","name":"Giant Thresher","tier":"E","cat":"pole","lvl":66,"str":188,"dex":140,"wsm":-10,"sb":75,"db":75,"wc":"STF","it":["2han","pole","mele"],"d2":[50,142],"wc2":"STF","eth":1,"ms":6},{"code":"6ss","name":"Walking Stick","tier":"E","cat":"staf","lvl":43,"str":25,"dex":0,"wsm":-10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[86,106],"wc2":"STF","eth":1,"ms":3},{"code":"6ls","name":"Stalagmite","tier":"E","cat":"staf","lvl":49,"str":63,"dex":35,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[94,134],"wc2":"STF","eth":1,"ms":4},{"code":"6cs","name":"Elder Staff","tier":"E","cat":"staf","lvl":55,"str":44,"dex":37,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[100,116],"wc2":"STF","eth":1,"ms":4},{"code":"6bs","name":"Shillelagh","tier":"E","cat":"staf","lvl":62,"str":52,"dex":27,"wsm":0,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[81,135],"wc2":"STF","eth":1,"ms":4},{"code":"6ws","name":"Archon Staff","tier":"E","cat":"staf","lvl":66,"str":34,"dex":0,"wsm":10,"sb":110,"db":0,"wc":"STF","it":["2han","blun","staf","mele","rod"],"d2":[104,124],"wc2":"STF","eth":1,"ms":6},{"code":"6sb","name":"Spider Bow","tier":"E","cat":"bow","lvl":41,"str":64,"dex":143,"wsm":5,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[34,73],"wc2":"BOW","ms":4},{"code":"6hb","name":"Blade Bow","tier":"E","cat":"bow","lvl":45,"str":76,"dex":119,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[30,60],"wc2":"BOW","ms":4},{"code":"6lb","name":"Shadow Bow","tier":"E","cat":"bow","lvl":47,"str":52,"dex":188,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[22,86],"wc2":"BOW","ms":6},{"code":"6cb","name":"Great Bow","tier":"E","cat":"bow","lvl":51,"str":121,"dex":107,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[17,76],"wc2":"BOW","ms":4},{"code":"6s7","name":"Diamond Bow","tier":"E","cat":"bow","lvl":54,"str":89,"dex":132,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[48,58],"wc2":"BOW","ms":5},{"code":"6l7","name":"Crusader Bow","tier":"E","cat":"bow","lvl":57,"str":97,"dex":121,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[23,91],"wc2":"BOW","ms":6},{"code":"6sw","name":"Ward Bow","tier":"E","cat":"bow","lvl":60,"str":72,"dex":146,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[29,77],"wc2":"BOW","ms":5},{"code":"6lw","name":"Hydra Bow","tier":"E","cat":"bow","lvl":63,"str":134,"dex":167,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow"],"d2":[14,100],"wc2":"BOW","ms":6},{"code":"6lx","name":"Pellet Bow","tier":"E","cat":"xbow","lvl":42,"str":83,"dex":155,"wsm":-10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[40,99],"wc2":"XBW","ms":4},{"code":"6mx","name":"Gorgon Crossbow","tier":"E","cat":"xbow","lvl":50,"str":117,"dex":105,"wsm":0,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[39,120],"wc2":"XBW","ms":4},{"code":"6hx","name":"Colossus Crossbow","tier":"E","cat":"xbow","lvl":56,"str":163,"dex":77,"wsm":10,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[47,125],"wc2":"XBW","ms":6},{"code":"6rx","name":"Demon Crossbow","tier":"E","cat":"xbow","lvl":63,"str":141,"dex":98,"wsm":-60,"sb":0,"db":50,"wc":"XBW","it":["miss","xbow"],"d2":[43,66],"wc2":"XBW","ms":5},{"code":"ob1","name":"Eagle Orb","tier":"N","cat":"orb","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[2,5],"eth":1,"ms":2},{"code":"ob2","name":"Sacred Globe","tier":"N","cat":"orb","lvl":0,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[3,8],"eth":1,"ms":2},{"code":"ob3","name":"Smoked Sphere","tier":"N","cat":"orb","lvl":8,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[4,10],"eth":1,"ms":2},{"code":"ob4","name":"Clasped Orb","tier":"N","cat":"orb","lvl":13,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[5,12],"eth":1,"ms":2},{"code":"ob5","name":"Jared's Stone","tier":"N","cat":"orb","lvl":18,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[8,18],"eth":1,"ms":3},{"code":"am1","name":"Stag Bow","tier":"N","cat":"abow","lvl":14,"str":30,"dex":45,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[8,14],"wc2":"BOW","ms":5},{"code":"am2","name":"Reflex Bow","tier":"N","cat":"abow","lvl":20,"str":35,"dex":60,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[10,21],"wc2":"BOW","ms":5},{"code":"am3","name":"Maiden Spear","tier":"N","cat":"aspe","lvl":14,"str":54,"dex":40,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[20,26],"wc2":"2HT","eth":1,"ms":6},{"code":"am4","name":"Maiden Pike","tier":"N","cat":"aspe","lvl":20,"str":63,"dex":52,"wsm":0,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[25,60],"wc2":"2HT","eth":1,"ms":6},{"code":"am5","name":"Maiden Javelin","tier":"N","cat":"ajav","lvl":17,"str":33,"dex":47,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[8,14],"dt":[6,22],"eth":1,"ms":2},{"code":"ob6","name":"Glowing Orb","tier":"X","cat":"orb","lvl":24,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[8,21],"eth":1,"ms":2},{"code":"ob7","name":"Crystalline Globe","tier":"X","cat":"orb","lvl":27,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[10,26],"eth":1,"ms":2},{"code":"ob8","name":"Cloudy Sphere","tier":"X","cat":"orb","lvl":30,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[11,29],"eth":1,"ms":2},{"code":"ob9","name":"Sparkling Ball","tier":"X","cat":"orb","lvl":34,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[13,32],"eth":1,"ms":2},{"code":"oba","name":"Swirling Crystal","tier":"X","cat":"orb","lvl":37,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[18,42],"eth":1,"ms":3},{"code":"am6","name":"Ashwood Bow","tier":"X","cat":"abow","lvl":29,"str":56,"dex":77,"wsm":0,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[19,38],"wc2":"BOW","ms":5},{"code":"am7","name":"Ceremonial Bow","tier":"X","cat":"abow","lvl":35,"str":73,"dex":110,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[22,53],"wc2":"BOW","ms":5},{"code":"am8","name":"Ceremonial Spear","tier":"X","cat":"aspe","lvl":32,"str":101,"dex":80,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[49,74],"wc2":"2HT","eth":1,"ms":6},{"code":"am9","name":"Ceremonial Pike","tier":"X","cat":"aspe","lvl":38,"str":115,"dex":98,"wsm":10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[60,140],"wc2":"2HT","eth":1,"ms":6},{"code":"ama","name":"Ceremonial Javelin","tier":"X","cat":"ajav","lvl":26,"str":25,"dex":109,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[26,51],"dt":[25,69],"eth":1,"ms":2},{"code":"obb","name":"Heavenly Stone","tier":"E","cat":"orb","lvl":44,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[21,46],"eth":1,"ms":2},{"code":"obc","name":"Eldritch Orb","tier":"E","cat":"orb","lvl":50,"str":0,"dex":0,"wsm":-10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[18,50],"eth":1,"ms":2},{"code":"obd","name":"Demon Heart","tier":"E","cat":"orb","lvl":56,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[23,55],"eth":1,"ms":2},{"code":"obe","name":"Vortex Orb","tier":"E","cat":"orb","lvl":63,"str":0,"dex":0,"wsm":0,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[12,66],"eth":1,"ms":2},{"code":"obf","name":"Dimensional Shard","tier":"E","cat":"orb","lvl":66,"str":0,"dex":0,"wsm":10,"sb":100,"db":0,"wc":"1HS","it":["orb"],"d1":[30,53],"eth":1,"ms":3},{"code":"amb","name":"Matriarchal Bow","tier":"E","cat":"abow","lvl":39,"str":87,"dex":187,"wsm":-10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[31,74],"wc2":"BOW","ms":5},{"code":"amc","name":"Grand Matron Bow","tier":"E","cat":"abow","lvl":58,"str":108,"dex":152,"wsm":10,"sb":0,"db":50,"wc":"BOW","it":["miss","bow","abow"],"d2":[20,104],"wc2":"BOW","ms":5},{"code":"amd","name":"Matriarchal Spear","tier":"E","cat":"aspe","lvl":45,"str":114,"dex":142,"wsm":-10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[79,116],"wc2":"2HT","eth":1,"ms":6},{"code":"ame","name":"Matriarchal Pike","tier":"E","cat":"aspe","lvl":60,"str":132,"dex":149,"wsm":10,"sb":80,"db":50,"wc":"2HT","it":["2han","spea","mele","aspe"],"d2":[44,185],"wc2":"2HT","eth":1,"ms":6},{"code":"amf","name":"Matriarchal Javelin","tier":"E","cat":"ajav","lvl":48,"str":107,"dex":151,"wsm":-10,"sb":80,"db":50,"wc":"1HT","it":["1han","thro","spea","jave","mele","ajav"],"d1":[38,68],"dt":[44,83],"eth":1,"ms":3}],"cats":[{"key":"axe1","label":"One-handed axes"},{"key":"axe2","label":"Two-handed axes"},{"key":"swd1","label":"One-handed swords"},{"key":"swd2","label":"Two-handed swords"},{"key":"dag","label":"Daggers"},{"key":"club","label":"Clubs"},{"key":"mace","label":"Maces"},{"key":"ham1","label":"One-handed hammers"},{"key":"ham2","label":"Two-handed hammers"},{"key":"scep","label":"Scepters"},{"key":"wand","label":"Wands"},{"key":"staf","label":"Staves"},{"key":"spea","label":"Spears"},{"key":"pole","label":"Polearms"},{"key":"jave","label":"Javelins"},{"key":"taxe","label":"Throwing axes"},{"key":"tkni","label":"Throwing knives"},{"key":"bow","label":"Bows"},{"key":"xbow","label":"Crossbows"},{"key":"claw","label":"Claws (Assassin)"},{"key":"orb","label":"Orbs (Sorceress)"},{"key":"abow","label":"Bows (Amazon)"},{"key":"aspe","label":"Spears (Amazon)"},{"key":"ajav","label":"Javelins (Amazon)"}],"jewels":[{"name":"Cinnabar","side":"prefix","group":105,"stat":"ed","lo":5,"hi":10,"alvl":1,"req":1,"rare":true},{"name":"Rusty","side":"prefix","group":105,"stat":"ed","lo":11,"hi":20,"alvl":13,"req":9,"rare":true},{"name":"Realgar","side":"prefix","group":105,"stat":"ed","lo":21,"hi":30,"alvl":45,"req":37,"rare":true},{"name":"Ruby","side":"prefix","group":105,"stat":"ed","lo":31,"hi":40,"alvl":66,"req":58,"rare":true},{"name":"Carbuncle","side":"prefix","group":104,"stat":"max","lo":1,"hi":5,"alvl":12,"req":9,"rare":true},{"name":"Carmine","side":"prefix","group":104,"stat":"max","lo":6,"hi":9,"alvl":35,"req":27,"rare":true},{"name":"Vermilion","side":"prefix","group":104,"stat":"max","lo":11,"hi":15,"alvl":58,"req":50,"rare":true},{"name":"Scarlet","side":"prefix","group":103,"stat":"min","lo":1,"hi":4,"alvl":8,"req":6,"rare":true},{"name":"Crimson","side":"prefix","group":103,"stat":"min","lo":5,"hi":8,"alvl":38,"req":30,"rare":true},{"name":"Cardinal","side":"prefix","group":103,"stat":"min","lo":10,"hi":14,"alvl":38,"req":30,"rare":true},{"name":"of Fervor","side":"suffix","group":7,"stat":"ias","lo":15,"hi":15,"alvl":39,"req":31,"rare":false},{"name":"of Ire","side":"suffix","group":14,"stat":"max","lo":2,"hi":5,"alvl":4,"req":3,"rare":true},{"name":"of Wrath","side":"suffix","group":14,"stat":"max","lo":6,"hi":9,"alvl":11,"req":8,"rare":true},{"name":"of Carnage","side":"suffix","group":14,"stat":"max","lo":11,"hi":15,"alvl":25,"req":18,"rare":true},{"name":"of Joyfulness","side":"suffix","group":15,"stat":"min","lo":1,"hi":4,"alvl":5,"req":3,"rare":true},{"name":"of Bliss","side":"suffix","group":15,"stat":"min","lo":5,"hi":10,"alvl":43,"req":37,"rare":true}],"ohm":{"name":"Ohm Rune","ed":45}};
  /* calc-data:end */

  const root = document.querySelector(".ohm-map");
  if (!root || !DATA.weapons) return;
  const $ = id => document.getElementById(id);
  const STORE = "erazure-ohm-vs-jewel";
  const OHM = DATA.ohm.ed;
  const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const TIER = { N: "Normal", X: "Exceptional", E: "Elite" };
  const HANDS = { d1: "One hand", d2: "Two hands", dt: "Thrown" };
  // the kinds only one class can hold: the IAS Calculator opens them on that class
  const CLASS_ONLY = { claw: "ass", orb: "sor", abow: "ama", aspe: "ama", ajav: "ama" };
  const JED_MAX = Math.max(...DATA.jewels.filter(a => a.stat === "ed").map(a => a.hi));
  const STEPS = [40, 35, 30, 25, 20, 15, 10, 0].filter(e => e <= JED_MAX);
  const el = {
    cat: $("oj-cat"), base: $("oj-base"), baseNote: $("oj-base-note"), eth: $("oj-eth"), ethWrap: $("oj-eth-wrap"),
    ethNo: $("oj-eth-no"), hand: $("oj-hand"), handField: $("oj-hand-field"), ed: $("oj-ed"), fmin: $("oj-fmin"),
    fmax: $("oj-fmax"), n: $("oj-n"), nInfo: $("oj-n-info"), pick: $("oj-pick"), jed: $("oj-jed"), jmin: $("oj-jmin"),
    jmax: $("oj-jmax"), jias: $("oj-jias"), handNote: $("oj-hand-note"), dock: $("oj-dock"),
  };
  let hand = "d2";
  let wantN = 1; // the sockets asked for; a base with fewer shows its most, the next base the asked number again

  /* a small element builder (text always as text) */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "style") e.style.cssText = v;
      else if (k in e) e[k] = v;
      else e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : String(c));
    return e;
  }

  // ------------------------------------------------------------------ the model
  const ethD = d => Math.floor(d * 5 / 4);
  function base(w, h, eth) {
    const d = w[h] || w.d1 || w.d2 || w.dt;
    return eth && w.eth ? d.map(ethD) : d.slice();
  }
  /* the weapon's damage: base + base x ED / 100 (rounded down) + its flat damage; the attack's minimum is at least 1
     and its maximum above its minimum */
  function weapon(b, ed, fmin, fmax) {
    let mn = b[0] + Math.trunc(b[0] * ed / 100) + fmin, mx = b[1] + Math.trunc(b[1] * ed / 100) + fmax;
    if (mn < 1) mn = 1;
    if (mx <= mn) mx = mn + 1;
    return { min: mn, max: mx, avg: (mn + mx) / 2 };
  }
  const num = (input, lo, hi) => {
    const v = Math.round(+input.value);
    return input.value !== "" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;
  };
  /* a number box's value kept within its own min and max: what the page counts is what the box shows (the clamped value
     is written back when the box is left, as on the IAS Calculator: audit CALC-08) */
  const fnum = input => num(input, +input.min, +input.max);
  const cur = () => DATA.weapons.find(x => x.code === el.base.value) || DATA.weapons[0];
  function state() {
    const w = cur();
    return {
      w, h: w[hand] ? hand : (w.d2 ? "d2" : w.d1 ? "d1" : "dt"), eth: el.eth.checked && !!w.eth,
      ed: fnum(el.ed), fmin: fnum(el.fmin), fmax: fnum(el.fmax), n: num(el.n, 1, w.ms || 6),
      jed: fnum(el.jed), jmin: fnum(el.jmin), jmax: fnum(el.jmax), jias: fnum(el.jias),
    };
  }
  function compare(S, jed, jmin, jmax) {
    const b = base(S.w, S.h, S.eth);
    const ohm = weapon(b, S.ed + OHM * S.n, S.fmin, S.fmax);
    const jew = weapon(b, S.ed + jed * S.n, S.fmin + jmin * S.n, S.fmax + jmax * S.n);
    return { b, ohm, jew, diff: jew.avg / ohm.avg - 1 };
  }
  /* the flat damage n jewels of jed% need in all, from the weapon's own rounding (never below 0) */
  function need(S, jed) {
    const b = base(S.w, S.h, S.eth);
    const o = [0, 1].map(i => Math.trunc(b[i] * (S.ed + OHM * S.n) / 100));
    const j = [0, 1].map(i => Math.trunc(b[i] * (S.ed + jed * S.n) / 100));
    const dmin = Math.max(0, o[0] - j[0]), dmax = Math.max(0, o[1] - j[1]);
    return { min: Math.ceil(dmin / S.n), max: Math.ceil(dmax / S.n), sum: Math.max(0, Math.ceil((o[0] + o[1] - j[0] - j[1]) / S.n)) };
  }

  // ------------------------------------------------------------------ the jewels that can roll
  const best = (stat, side) => DATA.jewels.filter(a => a.stat === stat && a.side === side)
    .reduce((m, a) => (!m || a.hi > m.hi ? a : m), null);
  const AFF = { ed: best("ed", "prefix"), minP: best("min", "prefix"), maxP: best("max", "prefix"),
                minS: best("min", "suffix"), maxS: best("max", "suffix"), ias: best("ias", "suffix") };
  const IAS_MAX = AFF.ias ? AFF.ias.hi : 0;
  const JEWELS = (() => {
    const out = [];
    const pre = ["ed", "minP", "maxP"].filter(k => AFF[k]), suf = ["minS", "maxS"].filter(k => AFF[k]);
    const add = (q, keys) => {
      const a = keys.map(k => AFF[k]);
      const sum = (stat, f) => a.filter(x => x.stat === stat).reduce((s, x) => s + x[f], 0);
      out.push({ q, keys, affs: a, id: `${q}:${keys.join("+")}`, name: a.map(x => x.name).join(" + "),
                 lo: { ed: sum("ed", "lo"), min: sum("min", "lo"), max: sum("max", "lo"), ias: sum("ias", "lo") },
                 hi: { ed: sum("ed", "hi"), min: sum("min", "hi"), max: sum("max", "hi"), ias: sum("ias", "hi") },
                 req: Math.max(...a.map(x => x.req)), alvl: Math.max(...a.map(x => x.alvl)) });
    };
    for (const p of pre) for (const s of suf) add("Magic", [p, s]);
    // the classic enhanced damage and attack speed jewel (of Fervor rolls on magic jewels only)
    if (AFF.ed && AFF.ias && !AFF.ias.rare) add("Magic", ["ed", "ias"]);
    // a rare's 4 affixes: every set of four of the five (at most 3 of a side, so always possible)
    const all = [...pre, ...suf];
    if (all.length === 5) for (const leave of all) add("Rare", all.filter(k => k !== leave));
    return out;
  })();
  const GROUPS = [["Magic", "Magic jewels", "one prefix and one suffix"], ["Rare", "Rare jewels", "four affixes, three of a side at most"]];
  const roll = r => [r.ed ? `${r.ed}%` : "", r.min ? `+${r.min} min` : "", r.max ? `+${r.max} max` : "",
    r.ias ? `${r.ias}% IAS` : ""].filter(Boolean).join(", ");
  const sameTop = (j, jed, jmin, jmax, jias) => j.hi.ed === jed && j.hi.min === jmin && j.hi.max === jmax && j.hi.ias === jias;

  // ------------------------------------------------------------------ inputs
  function fillCats() {
    el.cat.innerHTML = "";
    for (const c of DATA.cats) {
      if (!DATA.weapons.some(w => w.cat === c.key)) continue;
      el.cat.appendChild(new Option(c.label, c.key));
    }
  }
  function fillBases(keep) {
    el.base.innerHTML = "";
    for (const t of ["N", "X", "E"]) {
      const ws = DATA.weapons.filter(w => w.cat === el.cat.value && w.tier === t);
      if (!ws.length) continue;
      const g = h("optgroup", { label: TIER[t] });
      for (const w of ws) {
        const d = w.d2 || w.d1 || w.dt;
        g.appendChild(new Option(`${w.name} (${d[0]}–${d[1]})`, w.code));
      }
      el.base.appendChild(g);
    }
    if (keep && [...el.base.options].some(o => o.value === keep)) el.base.value = keep;
    else {
      const elite = DATA.weapons.filter(w => w.cat === el.cat.value && w.tier === "E");
      if (elite.length) el.base.value = elite[0].code;
    }
  }
  function fillHands() {
    const w = cur();
    const hs = ["d1", "d2", "dt"].filter(k => w[k]);
    if (!w[hand]) hand = w.d2 ? "d2" : hs[0];
    el.hand.innerHTML = "";
    const eth = el.eth.checked && !!w.eth;  // an ethereal weapon's own numbers on the buttons (audit CALC-15)
    for (const k of hs) {
      const d = base(w, k, eth);
      const b = h("button", { type: "button", "aria-pressed": String(k === hand) }, `${HANDS[k]} ${d[0]}–${d[1]}`);
      b.addEventListener("click", () => { hand = k; fillHands(); render(); });
      el.hand.appendChild(b);
    }
    el.handField.hidden = hs.length < 2;
    el.handNote.textContent = w.d1 && w.d2 ? "A Barbarian can hold this two-handed sword in one hand." : "";
    el.ethWrap.hidden = !w.eth;
    el.ethNo.hidden = !!w.eth;
    const req = [w.lvl ? `level ${w.lvl}` : "", w.str ? `${w.str} Strength` : "", w.dex ? `${w.dex} Dexterity` : ""].filter(Boolean);
    el.baseNote.textContent = req.length ? `Requires ${req.join(", ")}` : "No requirements";
  }
  function fillSockets() {
    const most = cur().ms || 6;
    el.n.innerHTML = "";
    for (let i = 1; i <= most; i++) el.n.appendChild(new Option(String(i), String(i)));
    el.n.value = String(Math.min(most, Math.max(1, wantN)));
    el.nInfo.dataset.tip = `Ohm in each, or the same jewel in each. This base has ${most === 1 ? "1 socket" : `up to ${most} sockets`}.`;
  }
  function fillPick() {
    el.pick.innerHTML = "";
    el.pick.appendChild(new Option("Your own rolls", ""));
    for (const [q, label] of GROUPS) {
      const g = h("optgroup", { label: `${label} (top rolls)` });
      for (const j of JEWELS.filter(x => x.q === q)) g.appendChild(new Option(`${j.name}: ${roll(j.hi)}`, j.id));
      el.pick.appendChild(g);
    }
  }
  /* the picker names the jewel whose top rolls the inputs hold (the one picked, while it still does) */
  function syncPick() {
    const v = [fnum(el.jed), fnum(el.jmin), fnum(el.jmax), fnum(el.jias)];
    const now = JEWELS.find(j => j.id === el.pick.value);
    if (now && sameTop(now, ...v)) return;
    const m = JEWELS.find(j => sameTop(j, ...v));
    el.pick.value = m ? m.id : "";
  }
  function useJewel(j) {
    el.jed.value = j.hi.ed; el.jmin.value = j.hi.min; el.jmax.value = j.hi.max; el.jias.value = j.hi.ias;
    el.pick.value = j.id;
    render();
    el.dock.classList.add("flash");
    setTimeout(() => el.dock.classList.remove("flash"), 450);
  }

  // ------------------------------------------------------------------ the (i) texts and the bars' details
  const tip = h("div", { class: "oj-tip", id: "oj-tip", role: "tooltip", hidden: true });
  root.appendChild(tip);
  let tipOn = null;
  function showTip(t) {
    if (!t.dataset.tip) return;
    if (tipOn && tipOn !== t) tipOn.removeAttribute("aria-describedby");
    tipOn = t;
    tip.textContent = t.dataset.tip;
    tip.hidden = false;
    if (t.matches("button")) t.setAttribute("aria-describedby", "oj-tip");
    const r = t.getBoundingClientRect(), R = root.getBoundingClientRect();
    const w = tip.offsetWidth, vw = document.documentElement.clientWidth;
    const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), vw - w - 8);
    tip.style.left = `${x - R.left}px`;
    tip.style.top = `${r.bottom - R.top + 8}px`;
  }
  function hideTip() {
    if (tipOn) tipOn.removeAttribute("aria-describedby");
    tipOn = null;
    tip.hidden = true;
  }
  root.addEventListener("pointerover", e => {
    if (e.pointerType !== "mouse") return;
    const t = e.target.closest("[data-tip]");
    if (t && t !== tipOn) showTip(t);
  });
  root.addEventListener("pointerout", e => {
    if (e.pointerType === "mouse" && tipOn && !tipOn.contains(e.relatedTarget)) hideTip();
  });
  root.addEventListener("focusin", e => { const t = e.target.closest("button.info"); if (t) showTip(t); });
  root.addEventListener("focusout", e => { if (tipOn && e.target === tipOn) hideTip(); });
  root.addEventListener("click", e => { const t = e.target.closest("button.info"); if (t) showTip(t); });
  document.addEventListener("click", e => { if (tipOn && !e.target.closest("[data-tip]")) hideTip(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && tipOn) hideTip(); });
  window.addEventListener("scroll", () => { if (tipOn) hideTip(); }, { passive: true });

  // ------------------------------------------------------------------ output
  const range = r => `${nf0.format(r.min)}–${nf0.format(r.max)}`;
  const pct = x => `${x >= 0 ? "+" : "−"}${nf1.format(Math.abs(x * 100))}%`;
  const cls = x => (x > 1e-9 ? "good" : x < -1e-9 ? "bad" : "");
  const sgn = v => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /* the answer in words: who wins, for 1 or n sockets */
  function words(S, d) {
    const ohms = S.n === 1 ? "Ohm" : `${S.n} Ohms`, jews = S.n === 1 ? "your jewel" : `your ${S.n} jewels`;
    const v = S.n === 1 ? "s" : "";
    if (Math.abs(d) < 1e-9) return `${cap(jews)} match${S.n === 1 ? "es" : ""} ${ohms}`;
    return d > 0 ? `${cap(jews)} beat${v} ${ohms}` : `${ohms} beat${v} ${jews}`;
  }
  /* a scale from 0 with 2-5 round steps */
  function scale(m) {
    const raw = Math.max(m, 1) / 4, p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(f => f * p).find(s => s >= raw);
    return { top: Math.ceil(m / step) * step, step };
  }
  function setRange(k, r, top, name, sub) {
    $(`oj-${k}-name`).textContent = name;
    const v = $(`oj-${k}-val`);
    v.textContent = range(r);
    v.appendChild(h("span", null, `avg ${nf1.format(r.avg)}`));
    $(`oj-${k}-sub`).textContent = sub;
    const t = $(`oj-${k}-track`), at = x => `${(x / top * 100).toFixed(3)}%`;
    t.querySelector(".bar").style.cssText = `left:${at(r.min)};width:${at(r.max - r.min)}`;
    t.querySelector(".avg").style.left = at(r.avg);
    t.dataset.tip = `${name}: ${nf0.format(r.min)} to ${nf0.format(r.max)} damage, ${nf1.format(r.avg)} on average`;
  }
  function render() {
    const S = state();
    const c = compare(S, S.jed, S.jmin, S.jmax);
    const ohms = S.n === 1 ? "Ohm" : `${S.n} Ohms`;
    const eq = Math.abs(c.diff) < 1e-9;
    // the answer
    $("oj-v-label").textContent = `Average hit against ${ohms}`;
    const vn = $("oj-v-num");
    vn.textContent = eq ? "±0%" : pct(c.diff);
    vn.className = "v-num " + cls(c.diff);
    $("oj-v-words").textContent = words(S, c.diff);
    $("oj-v-sub").textContent = `${nf1.format(c.jew.avg)} against ${nf1.format(c.ohm.avg)}; minimum ${sgn(c.jew.min - c.ohm.min)}, maximum ${sgn(c.jew.max - c.ohm.max)}`;
    // the jewels' attack speed, which a hit's damage leaves out (audit CALC-04): where to weigh it. The IAS Calculator
    // opens on the visitor's own setup with this weapon, a class-only weapon on its class, and says where it came from
    // (the additions audit, CA-05: a Suwayyah opened on a Barbarian, who can't hold one)
    const iasLine = $("oj-ias");
    iasLine.hidden = !S.jias;
    if (S.jias) {
      const ias = S.jias * S.n, only = CLASS_ONLY[S.w.cat];
      const url = new URL("resources/ias-calculator/", SITE);
      url.hash = `tab-calc${only ? `&c=${only}` : ""}&w=${encodeURIComponent(S.w.code)}&wi=${ias}&from=ohm`;
      iasLine.replaceChildren(`${S.n === 1 ? "Your jewel adds" : `Your ${S.n} jewels add`} ${ias}% increased attack speed, which this answer leaves out. If it reaches an attack speed breakpoint, it can be worth more than the damage: `,
        h("a", { href: url.href }, `see ${S.w.name} with ${ias}% IAS in the IAS Calculator`), ".");
    }
    const sc = scale(Math.max(c.ohm.max, c.jew.max));
    setRange("ohm", c.ohm, sc.top, `With ${ohms}`,
      `Base ${c.b[0]}–${c.b[1]}${S.eth ? " (ethereal)" : ""}, ${S.ed + OHM * S.n}% enhanced damage`);
    setRange("jew", c.jew, sc.top, S.n === 1 ? "With your jewel" : `With ${S.n} jewels`,
      `${S.n === 1 ? "The jewel" : S.n + " jewels"}: +${S.jed * S.n}%, +${S.jmin * S.n} min, +${S.jmax * S.n} max`);
    const ax = $("oj-axis");
    ax.innerHTML = "";
    for (let x = 0; x <= sc.top + 1e-9; x += sc.step) ax.appendChild(h("span", { style: `left:${(x / sc.top * 100).toFixed(3)}%` }, nf0.format(x)));
    // the strip
    const dn = $("oj-d-num");
    dn.textContent = eq ? "±0%" : pct(c.diff);
    dn.className = "d-num " + cls(c.diff);
    $("oj-d-words").textContent = words(S, c.diff);
    $("oj-d-more").textContent = `Average hit ${nf1.format(c.jew.avg)} against ${nf1.format(c.ohm.avg)} (${range(c.jew)} against ${range(c.ohm)})`;
    renderNeed(S);
    renderRolls(S);
    for (const s of root.querySelectorAll(".ohm-ed")) s.textContent = OHM;
    save();
  }
  function renderNeed(S) {
    const per = S.n === 1 ? "" : " per jewel";
    const b = base(S.w, S.h, S.eth);
    $("oj-need-sub").textContent = `In ${S.w.name}${S.eth ? " (ethereal)" : ""}, ${HANDS[S.h].toLowerCase()} damage ${b.join("–")}, with ${S.ed}% other enhanced damage${S.n > 1 ? `, ${S.n} sockets` : ""}: the flat damage a jewel needs${per} to match ${S.n === 1 ? "Ohm" : S.n + " Ohms"} (+${OHM}% each). The same average hit as Ohm takes the last row; the first two match Ohm's minimum and its maximum each, so a ✗ there alone doesn't mean your jewel loses. Your jewel's column has a ✓ where it has enough and a ✗ where it falls short.`;
    const cols = STEPS.includes(S.jed) ? STEPS.slice() : [...STEPS, S.jed].sort((x, y) => y - x);
    const t = $("oj-need");
    t.innerHTML = "";
    t.appendChild(h("thead", null, h("tr", null,
      h("th", { scope: "col" }, "Jewel’s enhanced damage"),
      // Yours over your jewel's number, so the number is level with the others (the author, 2026-11-20)
      cols.map(ed => h("th", { scope: "col", class: ed === S.jed ? "you" : null }, ed === S.jed ? h("small", null, "Yours") : null, `${ed}%`)))));
    const have = { min: S.jmin, max: S.jmax, sum: S.jmin + S.jmax };
    const nd = new Map(cols.map(ed => [ed, need(S, ed)]));
    const tb = h("tbody");
    const rows = [
      ["min", h("span", null, "+ Min needed")],
      ["max", h("span", null, "+ Max needed")],
      ["sum", h("span", { class: "lab" }, "Min + max (same avg)",
        h("button", { type: "button", class: "info", "aria-label": "About min + max (same average)",
          "data-tip": "What the jewel’s minimum and maximum damage must add up to for the same average hit as Ohm: a jewel with only maximum damage needs that much maximum damage. The two rows above match Ohm’s minimum and its maximum damage each." }, "i"))],
    ];
    for (const [k, head] of rows) {
      tb.appendChild(h("tr", null, h("th", { scope: "row" }, head), cols.map(ed => {
        const v = nd.get(ed)[k];
        if (ed !== S.jed) return h("td", null, nf0.format(v));
        const ok = have[k] >= v;
        return h("td", { class: "you" }, nf0.format(v),
          h("span", { class: `mark ${ok ? "good" : "bad"}`, role: "img", "aria-label": ok ? "your jewel has enough" : "your jewel falls short" }, ok ? "✓" : "✗"));
      })));
    }
    t.appendChild(tb);
  }
  function renderRolls(S) {
    const rows = JEWELS.map(j => ({ j, lo: compare(S, j.lo.ed, j.lo.min, j.lo.max).diff, hi: compare(S, j.hi.ed, j.hi.min, j.hi.max).diff }));
    // one scale for every bar, in 5% steps, Ohm (0) on it
    const lo = Math.floor(Math.min(0, ...rows.map(r => r.lo)) * 20) / 20, hi = Math.ceil(Math.max(0, ...rows.map(r => r.hi)) * 20) / 20;
    const span = hi - lo || 0.05;
    const at = v => (v - lo) / span * 100;
    const z = at(0);
    const t = $("oj-rolls");
    t.innerHTML = "";
    const axis = h("span", { class: "vs-axis" });
    if (lo < 0 && z >= 16) axis.appendChild(h("span", { class: "l", style: "left:0" }, `${pct(lo).replace(".0%", "%")}`));
    axis.appendChild(h("span", { class: "z" + (z < 8 ? " l" : z > 92 ? " r" : ""), style: `left:${z.toFixed(3)}%` }, "Ohm"));
    if (hi > 0 && z <= 84) axis.appendChild(h("span", { class: "r", style: "left:100%" }, `${pct(hi).replace(".0%", "%")}`));
    t.appendChild(h("thead", null, h("tr", null,
      h("th", { scope: "col" }, "Jewel"), h("th", { scope: "col" }, "Lowest rolls"), h("th", { scope: "col" }, "Top rolls"),
      // the column's name over its numbers, level with the other names and the bars' scale (the author, 2026-11-20)
      h("th", { scope: "col", class: "vs-h" }, h("div", { class: "vs" }, h("span", { class: "vs-txt" }, "Against Ohm"), axis)),
      h("th", { scope: "col" }, "Required level"), h("th"))));
    for (const [q, label, what] of GROUPS) {
      const tb = h("tbody");
      tb.appendChild(h("tr", { class: "grp" }, h("th", { colSpan: 6, scope: "colgroup" }, label, h("small", null, what))));
      for (const r of rows.filter(x => x.j.q === q).sort((a, b) => b.hi - a.hi || b.lo - a.lo)) {
        const j = r.j, inUse = el.pick.value === j.id;
        const bar = h("span", { class: "vs-bar", "data-tip": `${j.name}: ${pct(r.lo)} at the lowest rolls, ${pct(r.hi)} at the top rolls, against Ohm` },
          h("span", { class: "zero", style: `left:${z.toFixed(3)}%` }));
        const seg = (k, a, b, sq) => bar.appendChild(h("span", { class: `seg ${k}${sq ? " " + sq : ""}`,
          style: `left:calc(${at(a).toFixed(3)}% + ${a === 0 ? 2 : 0}px);width:max(3px, calc(${(at(b) - at(a)).toFixed(3)}% - ${a === 0 ? 2 : b === 0 ? 1 : 0}px))` }));
        if (r.lo < 0) seg("neg", r.lo, Math.min(r.hi, 0), r.hi >= 0 ? "sq-r" : "");
        if (r.hi > 0) seg("pos", Math.max(r.lo, 0), r.hi, r.lo <= 0 ? "sq-l" : "");
        const use = h("button", { type: "button", class: "use", "aria-label": `Use the top rolls of the ${q.toLowerCase()} jewel ${j.name}` },
          inUse ? "In use" : [h("span", { class: "long" }, "Use top rolls"), h("span", { class: "short" }, "Use")]);
        use.addEventListener("click", () => useJewel(j));
        tb.appendChild(h("tr", { class: "j" + (inUse ? " cur" : "") },
          h("td", { class: "name" }, j.name),
          h("td", { class: "lo", "data-l": "Lowest rolls" }, roll(j.lo)),
          h("td", { class: "hi", "data-l": "Top rolls" }, roll(j.hi)),
          h("td", { class: "vsc" }, h("div", { class: "vs" }, h("span", { class: "vs-txt" }, `${pct(r.lo)} to ${pct(r.hi)}`), bar)),
          h("td", { class: "lvl", "data-l": "Required level" }, j.req),
          h("td", { class: "act" }, use)));
      }
      t.appendChild(tb);
    }
  }

  // ------------------------------------------------------------------ the setup: in this browser and in the address
  /* the defaults, and the address's short keys: only what differs from them goes in a link (audit CALC-09, as the IAS
     Calculator's) */
  const DEFAULT = { cat: "xbow", base: "6hx", eth: false, hand: "d2", ed: 0, fmin: 0, fmax: 0, n: 1, jed: 40, jmin: 0, jmax: 15, jias: 0 };
  const KEYS = { cat: "c", base: "w", eth: "e", hand: "h", ed: "ed", fmin: "fn", fmax: "fx", n: "n", jed: "j", jmin: "jn", jmax: "jx", jias: "ji" };
  const SITE = typeof __md_scope !== "undefined" ? __md_scope.href : "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
  function settings() {
    return { cat: el.cat.value, base: el.base.value, eth: el.eth.checked, hand, ed: fnum(el.ed), fmin: fnum(el.fmin),
             fmax: fnum(el.fmax), n: wantN, jed: fnum(el.jed), jmin: fnum(el.jmin), jmax: fnum(el.jmax), jias: fnum(el.jias) };
  }
  const isDefault = o => Object.keys(DEFAULT).every(k => o[k] === DEFAULT[k]);
  function hashText(o) {
    return Object.keys(KEYS).filter(k => o[k] !== DEFAULT[k])
      .map(k => `${KEYS[k]}=${typeof o[k] === "boolean" ? (o[k] ? 1 : 0) : encodeURIComponent(o[k])}`).join("&");
  }
  function fromHash() {
    const h = location.hash.slice(1);
    if (!/(^|&)[a-z]+=/.test(h)) return null;
    const out = {};
    for (const kv of h.split("&")) {
      const [k, v] = kv.split("=");
      const key = Object.keys(KEYS).find(x => KEYS[x] === k);
      if (!key || v === undefined) continue;
      const d = DEFAULT[key];
      out[key] = typeof d === "number" ? Number(v) || 0 : typeof d === "boolean" ? v === "1" : decodeURIComponent(v);
    }
    return out;
  }
  function save() {
    const o = settings();
    try { localStorage.setItem(STORE, JSON.stringify(Object.assign({ pick: el.pick.value }, o))); }
    catch (e) { /* storage blocked: nothing kept */ }
    const q = hashText(o);
    try { history.replaceState(null, "", q ? "#" + q : location.pathname + location.search); } catch (e) { /* file: */ }
    resetBtn();
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; }
  }
  /* put a setup into the form (the address's, the browser's or the defaults) */
  function apply(o) {
    el.cat.value = DEFAULT.cat;
    if (o.cat && [...el.cat.options].some(x => x.value === o.cat)) el.cat.value = o.cat;
    fillBases(o.base || DEFAULT.base);
    hand = o.hand || DEFAULT.hand;
    el.eth.checked = !!o.eth;
    for (const k of ["ed", "fmin", "fmax", "jed", "jmin", "jmax", "jias"]) el[k].value = o[k] != null ? o[k] : DEFAULT[k];
    wantN = Math.max(1, Math.round(+o.n) || 1);
    el.pick.value = o.pick && JEWELS.some(j => j.id === o.pick) ? o.pick : "";
    fillHands();
    fillSockets();
    syncPick();
  }
  // Reset to the defaults, then Undo reset until the next change (as Run Speed's)
  let undo = null;
  const resetEl = $("oj-reset");
  function resetBtn() {
    resetEl.textContent = undo ? "Undo reset" : "Reset to the defaults";
    resetEl.disabled = !undo && isDefault(settings());
  }
  resetEl.addEventListener("click", () => {
    if (undo) { const o = undo; undo = null; apply(o); render(); return; }
    const was = Object.assign({ pick: el.pick.value }, settings());
    apply(DEFAULT);
    render();
    undo = was;
    resetBtn();
  });
  $("oj-copy").addEventListener("click", () => {
    save();
    const note = $("oj-copy-note"), link = location.href;
    const done = ok => { note.textContent = ok ? "Copied." : link; setTimeout(() => { if (ok) note.textContent = ""; }, 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => done(true), () => done(false));
    else done(false);
  });

  // ------------------------------------------------------------------ start
  fillCats();
  fillPick();
  $("oj-jed-info").dataset.tip = `Jewels roll up to ${JED_MAX}% enhanced damage.`;
  $("oj-affixes").textContent = "Their affixes: " + [AFF.ed, AFF.minP, AFF.maxP, AFF.minS, AFF.maxS].filter(Boolean)
    .map(a => `${a.name} ${a.stat === "ed" ? `${a.lo}–${a.hi}% enhanced damage` : `+${a.lo}–${a.hi} ${a.stat === "min" ? "minimum" : "maximum"} damage`}`)
    .join(" · ") + ".";
  el.jias.max = String(IAS_MAX);
  // a link's setup first, else this browser's, else the defaults
  const linked = fromHash();
  apply(linked ? Object.assign({}, DEFAULT, linked) : Object.assign({}, DEFAULT, load() || {}));
  // any change ends the reset's Undo
  root.querySelector("#oj-setup").addEventListener("input", () => { undo = null; }, true);
  root.querySelector("#oj-setup").addEventListener("change", () => { undo = null; }, true);
  el.hand.addEventListener("click", () => { undo = null; }, true);
  el.cat.addEventListener("change", () => { fillBases(); fillHands(); fillSockets(); render(); });
  el.base.addEventListener("change", () => { fillHands(); fillSockets(); render(); });
  el.eth.addEventListener("change", () => { fillHands(); render(); });
  for (const k of ["ed", "fmin", "fmax"]) el[k].addEventListener("input", render);
  for (const k of ["jed", "jmin", "jmax", "jias"]) el[k].addEventListener("input", () => { syncPick(); render(); });
  // leaving a number box writes back the value the page counts (an empty box its lowest, too much its most)
  for (const k of ["ed", "fmin", "fmax", "jed", "jmin", "jmax", "jias"]) {
    el[k].addEventListener("change", () => { const v = fnum(el[k]); if (String(v) !== el[k].value) { el[k].value = v; syncPick(); render(); } });
  }
  el.n.addEventListener("change", () => { wantN = +el.n.value || 1; render(); });
  el.pick.addEventListener("change", () => {
    const j = JEWELS.find(x => x.id === el.pick.value);
    if (j) useJewel(j); else render();
  });
  // the strip shows while the answer's number is off screen (under the website's bar counts as off)
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { for (const e of es) el.dock.classList.toggle("on", !e.isIntersecting); },
      { rootMargin: "-64px 0px 0px 0px" }).observe($("oj-v-head"));
  }
  render();
})();
