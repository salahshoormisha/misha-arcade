/* MISHANAMEH — heroes, bestiary, encounters, the Seven Trials */

/* ═══════════════  HEROES  ═══════════════ */
const HEROES = {
  rostam: {
    id:'rostam', name:'ROSTAM', fa:'رستم', art:'🦁',
    epithet:'Tahamtan — the Mighty‑Bodied',
    hp:88, energy:3, hue:'var(--pom)',
    blurb:'Seven hundred years old, unkillable by ordinary means, and constitutionally unable to walk around a problem. Strength, punishment, and standing in the road.',
    keyword:'Strength & self‑punishment. Hits harder the longer you survive.',
    invoke:{ name:'THE MACE FALLS', fa:'گرز فرود آمد',
      text:'Deal 32 damage to ALL enemies. Gain 3 Strength.',
      fx:(G)=>{ G.dmgAll(32,{raw:true}); G.buffP('str',3); } } },
  gord: {
    id:'gord', name:'GORDĀFARID', fa:'گردآفرید', art:'🏹',
    epithet:'The Warrior‑Maiden of the White Fortress',
    hp:70, energy:3, hue:'var(--turq)',
    blurb:'When every man in the fortress was too afraid, she put on armour, tucked her hair into a helmet, and rode out to fight Sohrab — the strongest young man alive. She did not win by strength.',
    keyword:'Venom, tempo, and lying convincingly.',
    invoke:{ name:'THE HELMET FALLS', fa:'کلاهخود افتاد',
      text:'Apply 14 Venom and 3 Weak to ALL enemies. Draw 3. Gain 2 Energy.',
      fx:(G)=>{ G.buffAll('venom',14); G.buffAll('weak',3); G.draw(3); G.energy(2); } } },
  zal: {
    id:'zal', name:'ZĀL', fa:'زال', art:'🕊️',
    epithet:'The White‑Haired, Raised on the Peak',
    hp:64, energy:3, hue:'var(--lapis-l)',
    blurb:'Born with white hair and abandoned on Mount Alborz as a bad omen. The Simurgh — an enormous, ancient, benevolent bird — carried him to her nest and raised him. He grew up fluent in wisdom and owed nothing to anyone.',
    keyword:'Farr. Fills the halo faster than anyone and calls the bird again and again.',
    locked:true, unlockHint:'Unlocked by clearing Trial V with any hero.',
    invoke:{ name:'THE SIMURGH DESCENDS', fa:'سیمرغ فرود آمد',
      text:'Heal 15. Gain 25 Block. Gain 2 Strength, 2 Agility. Draw 2.',
      fx:(G)=>{ G.heal(15); G.blk(25,{raw:true}); G.buffP('str',2); G.buffP('agi',2); G.draw(2); } } },
};

/* ═══════════════  BESTIARY  ═══════════════
   moves: intent kinds — attack | block | buff | debuff | special | sleep
   ai(self, G) → index into moves                                        */

const FOES = {};
function F(d){ FOES[d.id]=d; return d; }

/* ── Tier A: the road out of Zābol ── */
F({ id:'jackal', name:'Jackal', fa:'شغال', art:'🐺', tier:'A', hp:[17,21],
  moves:[ {k:'attack',n:'Snap',dmg:6}, {k:'attack',n:'Harry',dmg:3,hits:2},
          {k:'buff',n:'Yip',txt:'+2 Strength',fx:(G,s)=>G.buffF(s,'str',2)} ],
  ai:(s)=> s.turn%3===2 ? 2 : (s.turn%2 ? 1 : 0) });

F({ id:'wasp', name:'Desert Wasp', fa:'زنبور', art:'🐝', tier:'A', hp:[14,17],
  moves:[ {k:'attack',n:'Sting',dmg:4,fx:(G,s)=>G.venomP(2)}, {k:'attack',n:'Dive',dmg:7} ],
  ai:(s)=> s.turn%2 });

F({ id:'bandit', name:'Bandit of the Marches', fa:'راهزن', art:'🗡️', tier:'A', hp:[24,29],
  moves:[ {k:'attack',n:'Cutpurse',dmg:8}, {k:'block',n:'Crouch',blk:7},
          {k:'debuff',n:'Sand in the Eyes',txt:'2 Weak',fx:(G)=>G.debuffP('weak',2)} ],
  ai:(s)=> s.turn===0 ? 2 : (s.turn%3===2 ? 1 : 0) });

F({ id:'saltwraith', name:'Salt Wraith', fa:'روح نمک', art:'👻', tier:'A', hp:[21,25],
  moves:[ {k:'attack',n:'Desiccate',dmg:7,fx:(G)=>G.addCard('s_thirst','discard',1)},
          {k:'debuff',n:'Parch',txt:'2 Frail',fx:(G)=>G.debuffP('frail',2)} ],
  ai:(s)=> s.turn%2 });

F({ id:'scorpion', name:'Black Scorpion', fa:'کژدم', art:'🦂', tier:'A', hp:[19,23],
  moves:[ {k:'attack',n:'Tail',dmg:5,fx:(G,s)=>G.venomP(3)}, {k:'block',n:'Burrow',blk:7},
          {k:'attack',n:'Pincer',dmg:9} ],
  ai:(s)=> s.turn%3 });

/* ── Tier B: the dragon country ── */
F({ id:'firesnake', name:'Fire‑Snake', fa:'مار آتشین', art:'🐍', tier:'B', hp:[33,39],
  moves:[ {k:'attack',n:'Lash',dmg:12}, {k:'debuff',n:'Scald',txt:'4 Ember',fx:(G)=>G.emberP(4)},
          {k:'attack',n:'Coil',dmg:6,hits:2} ],
  ai:(s)=> s.turn%3 });

F({ id:'ghoul', name:'Ghūl', fa:'غول', art:'🧟', tier:'B', hp:[40,47],
  moves:[ {k:'attack',n:'Maul',dmg:14}, {k:'special',n:'Feed',txt:'Heal 10',fx:(G,s)=>G.healF(s,10)},
          {k:'debuff',n:'Wail',txt:'2 Weak, 2 Frail',fx:(G)=>{G.debuffP('weak',2);G.debuffP('frail',2);}} ],
  ai:(s)=> s.hp < s.maxHp*0.4 ? 1 : (s.turn%3===2 ? 2 : 0) });

F({ id:'peri', name:'Perī', fa:'پری', art:'🧚', tier:'B', hp:[30,35],
  moves:[ {k:'debuff',n:'Glamour',txt:'Add a Doubt to your discard',fx:(G)=>G.addCard('c_doubt','discard',1)},
          {k:'attack',n:'Silver Thread',dmg:10}, {k:'buff',n:'Shimmer',txt:'+12 Block',fx:(G,s)=>G.blkF(s,12)} ],
  ai:(s)=> s.turn===0?0:(s.turn%3===0?2:1) });

F({ id:'marchguard', name:'March Guard', fa:'مرزبان', art:'🛡️', tier:'B', hp:[37,44],
  moves:[ {k:'attack',n:'Spear',dmg:13}, {k:'block',n:'Shield Wall',blk:14},
          {k:'attack',n:'Shield Bash',dmg:8,fx:(G)=>G.debuffP('vuln',2)} ],
  ai:(s)=> s.turn%3 });

F({ id:'mirage', name:'Mirage', fa:'سراب', art:'🌫️', tier:'B', hp:[27,31],
  moves:[ {k:'special',n:'Waver',txt:'Gain 20 Block',fx:(G,s)=>G.blkF(s,20)},
          {k:'attack',n:'Nothing There',dmg:14} ],
  ai:(s)=> s.turn%2 });

/* ── Tier C: the demon marches ── */
F({ id:'divwhelp', name:'Div Whelp', fa:'دیوبچه', art:'👹', tier:'C', hp:[42,48],
  moves:[ {k:'attack',n:'Claw',dmg:9,hits:2}, {k:'buff',n:'Swell',txt:'+3 Strength',fx:(G,s)=>G.buffF(s,'str',3)},
          {k:'attack',n:'Hurl Stone',dmg:18} ],
  ai:(s)=> s.turn===1 ? 1 : (s.turn%3===2 ? 2 : 0) });

F({ id:'shadow', name:'Shadow of Zahhāk', fa:'سایهٔ ضحاک', art:'🌑', tier:'C', hp:[50,58],
  moves:[ {k:'attack',n:'Grasp',dmg:17}, {k:'debuff',n:'Chain',txt:"Add Zahhāk's Shackle to hand",fx:(G)=>G.addCard('c_shackle','hand',1)},
          {k:'special',n:'Lengthen',txt:'+16 Block, +2 Strength',fx:(G,s)=>{G.blkF(s,16);G.buffF(s,'str',2);}} ],
  ai:(s)=> s.turn%3===1 ? 1 : (s.turn%3===2 ? 2 : 0) });

F({ id:'serpent', name:'Shoulder‑Serpent', fa:'مار دوش', art:'🐉', tier:'C', hp:[38,44],
  moves:[ {k:'attack',n:'Fang',dmg:8,fx:(G,s)=>G.venomP(6)}, {k:'attack',n:'Strangle',dmg:20} ],
  ai:(s)=> s.turn%2 });

F({ id:'sorcerer', name:'Sorcerer of Māzandarān', fa:'جادوگر مازندران', art:'🔮', tier:'C', hp:[46,54],
  moves:[ {k:'debuff',n:'Fog the Eye',txt:'Add 2 Blinded to draw pile',fx:(G)=>G.addCard('s_blind','draw',2)},
          {k:'attack',n:'Hex Bolt',dmg:16}, {k:'buff',n:'Ritual',txt:'+4 Strength',fx:(G,s)=>G.buffF(s,'str',4)} ],
  ai:(s)=> s.turn===0?0:(s.turn%3===0?2:1) });

/* ── Elites ── */
F({ id:'karkadann', name:'Karkadann', fa:'کرگدن', art:'🦏', tier:'elite', hp:[64,72],
  intro:'The Persian unicorn: a horned beast so bad‑tempered that, the bestiaries say, only the ring‑dove can calm it.',
  moves:[ {k:'attack',n:'Gore',dmg:16}, {k:'buff',n:'Paw the Ground',txt:'+3 Strength, 8 Block',fx:(G,s)=>{G.buffF(s,'str',3);G.blkF(s,8);}},
          {k:'attack',n:'Trample',dmg:7,hits:3} ],
  ai:(s)=> s.turn===0?1:(s.turn%3===0?1:(s.turn%3===1?0:2)) });

F({ id:'manticore', name:'Mardkhora', fa:'مردخوار', art:'🦂', tier:'elite', hp:[74,84],
  intro:'“Man‑eater.” A lion’s body, a human face, and a tail that fires spines. The Greeks heard about it from Persia and never quite recovered.',
  moves:[ {k:'attack',n:'Spine Volley',dmg:6,hits:3,fx:(G,s)=>G.venomP(3)},
          {k:'attack',n:'Devour',dmg:19,fx:(G,s)=>G.healF(s,8)},
          {k:'debuff',n:'Human Voice',txt:'3 Weak, 3 Frail',fx:(G)=>{G.debuffP('weak',3);G.debuffP('frail',3);}} ],
  ai:(s)=> s.turn%3 });

F({ id:'nasnas', name:'Nasnās', fa:'نسناس', art:'🫥', tier:'elite', hp:[62,70],
  intro:'Half of a man — one arm, one leg, half a face — that hops and is faster than you.',
  moves:[ {k:'attack',n:'Half a Blow',dmg:10,hits:2},
          {k:'special',n:'Split',txt:'Halve your Block, gain 18 Block',fx:(G,s)=>{G.halveBlockP();G.blkF(s,18);}},
          {k:'attack',n:'Hop',dmg:16} ],
  ai:(s)=> s.turn%3 });

F({ id:'golem', name:'Stone of Bīsotūn', fa:'بیستون', art:'🗿', tier:'elite', hp:[104,116],
  intro:'Farhād the stonecutter was told he could marry Shirin if he cut a road through Mount Bīsotūn. He very nearly did.',
  moves:[ {k:'block',n:'Set',blk:22}, {k:'attack',n:'Sheer Face',dmg:24},
          {k:'attack',n:'Rockfall',dmg:9,hits:2,fx:(G)=>G.debuffP('frail',2)} ],
  ai:(s)=> s.turn%3===0?0:(s.turn%3===1?2:1) });

/* ── The Seven Trial bosses ── */
F({ id:'lion', name:'THE LION IN THE REEDS', fa:'شیر', art:'🦁', tier:'boss', hp:[66,66],
  intro:'Rostam lay down to sleep in the reeds. A lion came. Rakhsh — his horse — killed it without waking him, and Rostam woke up annoyed that nobody had asked permission.',
  moves:[ {k:'attack',n:'Pounce',dmg:9}, {k:'buff',n:'Roar',txt:'+2 Strength',fx:(G,s)=>G.buffF(s,'str',2)},
          {k:'attack',n:'Rend',dmg:5,hits:2,fx:(G)=>G.debuffP('vuln',2)},
          {k:'attack',n:'Jaws',dmg:17} ],
  ai:(s)=> s.turn===0?1:[0,2,0,3][ (s.turn-1)%4 ] });

F({ id:'thirst', name:'THE WASTE', fa:'بیابان', art:'🏜️', tier:'boss', hp:[80,80],
  intro:'The second trial is not a monster. It is a desert with no water in it, and it kills you slowly while you are still deciding what to do.',
  mech:'THIRST — every turn the desert takes more than it did last turn. It has no mercy and no pattern to read. Win fast.',
  moves:[ {k:'special',n:'Thirst',txt:'Escalating unblockable damage',
            fx:(G,s)=>{ s.esc=(s.esc||3); G.loseHp(s.esc); s.esc+=2; }},
          {k:'special',n:'Heat Haze',txt:'Gain 24 Block; add Thirst to discard',
            fx:(G,s)=>{ G.blkF(s,14); G.addCard('s_thirst','discard',1); }} ],
  ai:(s)=> s.turn%3===2 ? 1 : 0,
  intentOverride:(s)=>({k:'special',n:'Thirst',txt:`Lose ${(s.esc||3)} HP — and it grows`}) });

F({ id:'dragon', name:'AZHDAHĀ', fa:'اژدها', art:'🐲', tier:'boss', hp:[124,124],
  intro:'The third trial. A dragon that appeared, and vanished when Rostam looked, twice — until Rakhsh, who had been trying to tell him, finally got through.',
  mech:'HIDDEN — every third turn it vanishes and takes almost nothing. Save your big turns for when you can see it.',
  moves:[ {k:'attack',n:'Bite',dmg:15},
          {k:'special',n:'Vanish',txt:'Gain 30 Block',fx:(G,s)=>{ G.blkF(s,30); s.hidden=true; }},
          {k:'attack',n:'Tail Sweep',dmg:8,hits:2,fx:(G)=>G.debuffP('weak',2)},
          {k:'attack',n:'Furnace',dmg:22,fx:(G)=>G.emberP(4)} ],
  ai:(s)=> s.turn%3===2 ? 1 : (s.turn%6===5 ? 3 : (s.turn%2 ? 2 : 0)) });

F({ id:'witch', name:'THE ENCHANTRESS', fa:'زن جادو', art:'🌹', tier:'boss', hp:[118,118],
  intro:'The fourth trial: a table laid in the wilderness, wine poured, and a beautiful woman singing. Rostam thanked God for the meal. At the name of God her face slipped, and what was underneath was not a woman.',
  mech:'TWO FACES — at half health she drops the glamour and fights very differently.',
  moves:[ {k:'debuff',n:'Sweet Song',txt:'Add a Doubt to your hand',fx:(G)=>G.addCard('c_doubt','hand',1)},
          {k:'attack',n:'Poured Wine',dmg:10,fx:(G)=>G.debuffP('weak',2)},
          {k:'special',n:'The Face Slips',txt:'TRUE FORM: +4 Strength',fx:(G,s)=>{ G.buffF(s,'str',4); s.art='🕸️'; s.name='HER TRUE FACE'; }},
          {k:'attack',n:'Talons',dmg:9,hits:2},
          {k:'attack',n:'Old Hunger',dmg:21,fx:(G,s)=>G.healF(s,10)} ],
  ai:(s)=>{ if(!s.flip && s.hp <= s.maxHp/2){ s.flip=true; return 2; }
            return s.flip ? (s.turn%2?4:3) : (s.turn%2?1:0); } });

F({ id:'ulad', name:'ULĀD', fa:'اولاد', art:'⚔️', tier:'boss', hp:[94,94],
  intro:'The fifth trial is a man, not a monster — the captain of the marches. Rostam beats him, ties him to a saddle, and makes him a guide. Ulād, to his credit, turns out to be excellent at it.',
  mech:'HE BROUGHT FRIENDS. Kill the guards or he keeps getting stronger.',
  minions:['guard','guard'],
  moves:[ {k:'attack',n:'Captain’s Blade',dmg:13},
          {k:'buff',n:'Rally',txt:'All enemies +2 Strength, 6 Block',
            fx:(G,s)=>G.foes.forEach(f=>{ if(f.hp>0){G.buffF(f,'str',2);G.blkF(f,6);} })},
          {k:'attack',n:'Cut the Line',dmg:6,hits:3} ],
  ai:(s)=> s.turn%3===1 ? 1 : (s.turn%3===2 ? 2 : 0) });

F({ id:'guard', name:'Marches Guard', fa:'نگهبان', art:'🪖', tier:'minion', hp:[22,22],
  moves:[ {k:'attack',n:'Jab',dmg:7}, {k:'block',n:'Cover the Captain',blk:9} ],
  ai:(s)=> s.turn%2 });

F({ id:'arzhang', name:'ARZHANG DIV', fa:'ارژنگ دیو', art:'👹', tier:'boss', hp:[162,162],
  intro:'The sixth trial: the White Demon’s lieutenant, who commands the demon host of Māzandarān. Rostam walks into his camp and calls his name, loudly, on purpose.',
  mech:'THE HOST — he calls up lesser divs. Deal with them or drown in them.',
  moves:[ {k:'attack',n:'Demon Maul',dmg:18},
          {k:'special',n:'Call the Host',txt:'Summon a Div Whelp',fx:(G,s)=>G.summon('lesserdiv')},
          {k:'debuff',n:'Warcry',txt:'2 Weak, 2 Frail, 2 Vulnerable',
            fx:(G)=>{G.debuffP('weak',2);G.debuffP('frail',2);G.debuffP('vuln',2);}},
          {k:'attack',n:'Sunder',dmg:10,hits:2} ],
  ai:(s)=>{ const alive=s._G? s._G.foes.filter(f=>f.hp>0).length:1;
            if(s.turn%4===1 && alive<3) return 1; return [0,3,2,0][s.turn%4]; } });

F({ id:'lesserdiv', name:'Lesser Div', fa:'دیو کهتر', art:'😈', tier:'minion', hp:[26,26],
  moves:[ {k:'attack',n:'Rake',dmg:8}, {k:'buff',n:'Gibber',txt:'+2 Strength',fx:(G,s)=>G.buffF(s,'str',2)} ],
  ai:(s)=> s.turn%2 });

F({ id:'sepid', name:'DĪV‑E SEPĪD', fa:'دیو سپید', art:'👹', tier:'boss', hp:[228,228],
  intro:'The seventh and last trial. The White Demon sleeps in a cave in Māzandarān, having already blinded a king and an army. Rostam goes in alone, in the dark, and wakes him up.',
  mech:'THREE BREATHS — at 66% and 33% health he changes entirely. The dark he throws is real: Blinded cards go in your deck.',
  moves:[ {k:'attack',n:'White Fist',dmg:20},
          {k:'debuff',n:'The Dark He Keeps',txt:'Add 2 Blinded to draw pile',fx:(G)=>G.addCard('s_blind','draw',2)},
          {k:'special',n:'SECOND BREATH',txt:'+4 Strength, 30 Block, cleanse',
            fx:(G,s)=>{ G.buffF(s,'str',4); G.blkF(s,30); s.buffs.weak=0; s.buffs.vuln=0; }},
          {k:'attack',n:'Cave‑Dark',dmg:9,hits:3},
          {k:'special',n:'THIRD BREATH',txt:'+6 Strength, heal 30, cleanse',
            fx:(G,s)=>{ G.buffF(s,'str',6); G.healF(s,30); s.buffs.weak=0; s.buffs.vuln=0; s.buffs.venom=0; }},
          {k:'attack',n:'The Last Thing You See',dmg:30} ],
  ai:(s)=>{ if(s.phase===undefined) s.phase=0;
    if(s.phase===0 && s.hp<=s.maxHp*0.66){ s.phase=1; return 2; }
    if(s.phase===1 && s.hp<=s.maxHp*0.33){ s.phase=2; return 4; }
    if(s.phase===2) return [3,5,0,3][s.turn%4];
    if(s.phase===1) return [0,3,1,0][s.turn%4];
    return [0,1,3,0][s.turn%4]; } });

/* ── The eighth road (secret) ── */
F({ id:'watcher', name:'THE SLEEPLESS EYE', fa:'چشم بیدار', art:'👁️', tier:'boss', hp:[268,268],
  intro:'There is no eighth trial in the book. Somebody added one anyway: a tower on a plain of ash, and a lidless watchfulness at the top of it that has been awake for a very long time and would like you to stop moving.',
  mech:'IT SEES YOU COMING. It reads your intent one beat before you have it. Every third turn it simply knows.',
  moves:[ {k:'attack',n:'Its Whole Attention',dmg:23},
          {k:'debuff',n:'Nothing Is Hidden',txt:'Add 2 Doubt to draw pile',fx:(G)=>G.addCard('c_doubt','draw',2)},
          {k:'special',n:'It Sees You',txt:'Discard your hand. It gains 45 Block.',
            fx:(G,s)=>{ G.discardHand(); G.blkF(s,34); }},
          {k:'attack',n:'The Long Look',dmg:8,hits:4},
          {k:'special',n:'Kindle',txt:'+5 Strength, 6 Ember on you',fx:(G,s)=>{G.buffF(s,'str',5);G.emberP(6);}} ],
  ai:(s)=> s.turn%3===2 ? 2 : [0,3,4,1,0,3][s.turn%6] });

/* ═══════════════  ENCOUNTER TABLES  ═══════════════ */
const ENCOUNTERS = {
  A:[ ['jackal','jackal'], ['bandit'], ['wasp','jackal'], ['scorpion','wasp'],
      ['saltwraith'], ['bandit','jackal'], ['wasp','wasp'] ],
  B:[ ['firesnake'], ['ghoul'], ['peri','wasp'], ['marchguard'], ['mirage','mirage'],
      ['firesnake','scorpion'], ['ghoul','jackal'] ],
  C:[ ['divwhelp','divwhelp'], ['shadow'], ['sorcerer','serpent'], ['serpent','serpent'],
      ['shadow','divwhelp'], ['sorcerer'] ],
  elite:{ A:['karkadann','nasnas'], B:['manticore','karkadann','nasnas'], C:['golem','manticore','karkadann'] },
};

/* ═══════════════  THE SEVEN TRIALS  ═══════════════ */
const TRIALS = [
  { n:1, roman:'I',   name:'THE LION',        fa:'شیر',        tier:'A', boss:'lion',
    sub:'in which the horse does the work',
    text:'Rostam rides out toward Māzandarān to free a king who did not listen to him. He is tired. He lies down in the reeds to sleep and leaves Rakhsh to graze.' },
  { n:2, roman:'II',  name:'THE DESERT',      fa:'بیابان',     tier:'A', boss:'thirst',
    sub:'in which there is no water',
    text:'The road becomes a waterless waste. Man and horse begin to die of thirst. In the story, a ram appears and leads him to a spring — a small, unexplained mercy in the middle of an epic about strength.' },
  { n:3, roman:'III', name:'THE DRAGON',      fa:'اژدها',      tier:'B', boss:'dragon',
    sub:'in which nobody believes the horse',
    text:'A dragon comes in the night. Rakhsh wakes Rostam; the dragon vanishes; Rostam threatens to kill the horse for waking him. This happens twice. The third time Rostam finally sees it.' },
  { n:4, roman:'IV',  name:'THE ENCHANTRESS', fa:'زن جادو',    tier:'B', boss:'witch',
    sub:'in which a good meal is a trap',
    text:'A table appears in the wilderness, laid with food and wine, and a beautiful singer beside it. Rostam picks up a cup and gives thanks to God — and at the name, her face slips.' },
  { n:5, roman:'V',   name:'ULĀD',            fa:'اولاد',      tier:'B', boss:'ulad',
    sub:'in which an enemy becomes a guide',
    text:'The captain of the marches rides against him with a company. Rostam defeats him and — instead of killing him — ties him to a saddle and promises him a kingdom if he leads the way. Ulād agrees, and then does it honestly.' },
  { n:6, roman:'VI',  name:'ARZHANG DIV',     fa:'ارژنگ دیو',  tier:'C', boss:'arzhang',
    sub:'in which he announces himself',
    text:'Ulād guides him to the demon host. Rostam walks up to the camp of Arzhang, the White Demon’s lieutenant, and shouts his own name until somebody comes out.' },
  { n:7, roman:'VII', name:'DĪV‑E SEPĪD',     fa:'دیو سپید',   tier:'C', boss:'sepid',
    sub:'in which he goes into the cave alone',
    text:'The last trial. The White Demon sleeps in a cavern, huge and pale, and Rostam — who has been told plainly that this one is different — goes in anyway, in the dark, by himself.' },
];

const SECRET_TRIAL = { n:8, roman:'VIII', name:'THE GREY ROAD', fa:'راه خاکستری', tier:'C', boss:'watcher',
  sub:'a trial that is not in the book',
  text:'Ferdowsi wrote seven. But every epic worth the name has a road that goes further than the map, and a story further east that rhymes with this one: a ring, a mountain, a company, and eagles arriving late and enormous. Somebody has been walking that road, and left the gate open.' };
