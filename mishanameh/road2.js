/* MISHANAMEH — THE ROYAL ROAD (راه شاهی)

   The Haft Khān is myth. This is the other road: the one that runs out of
   legend into history and back again, from a blacksmith's apron to the Lie
   itself.

   Two things braid together here, and they are not a conceit — they are the
   same period of the same history.

   The Persian thread is deliberately pre-Islamic: Zoroastrian cosmology
   (Ahura Mazda and Angra Mainyu, the Amesha Spentas, the Chinvat Bridge, the
   Frashokereti), the Achaemenids (Cyrus, Persepolis, Susa, the Royal Road that
   Herodotus measured), and the Shāhnāmeh's own oldest layer — Zahhāk the
   serpent-shouldered tyrant, and Kāveh the smith who raised his leather apron
   on a spear and started the rising that pulled him down.

   The Jewish thread is not decoration either. Cyrus took Babylon in 539 BCE
   and let the exiles go home and paid for the Temple, and Isaiah 45 calls him
   מָשִׁיחַ — *mashiach*, anointed — the only non-Jew in the Hebrew Bible ever
   given that word. Esther is a Jewish queen in Susa. Daniel reads the writing
   on a wall in the Persian orbit. And the demon Ashmedai, king of demons in
   the Talmud, is almost certainly Aēšma-daēva — a Zoroastrian demon of wrath
   who walked out of the Avesta and into Jewish literature during exactly these
   centuries. The two traditions were not neighbours. They were entangled.

   The through-line of the whole road is one idea, and it is the idea Ferdowsī
   spent thirty years on: a culture refusing to be erased. Kāveh's apron —
   the Derafsh-e Kāviāni — stayed the banner of Iran for a thousand years,
   until an invading army captured it and cut it up for the jewels.          */

/* ═══════════════  HEROES  ═══════════════ */

HEROES.kaveh = {
  id:'kaveh', name:'KĀVEH', fa:'کاوه', art:'🔨',
  epithet:'The Blacksmith Who Would Not Give Up His Last Son',
  hp:82, energy:3, hue:'var(--pom)',
  blurb:'Zahhāk had two serpents growing from his shoulders and they had to be fed the brains of two young people a day. Kāveh, an ordinary smith, had lost seventeen children to them. When they came for the eighteenth he tore off his leather apron, put it on a spear, and walked into the street with it. Enough people followed him that the tyrant fell.',
  keyword:'Forge. You sharpen your cards mid‑fight and hand the banner to whoever is next.',
  invoke:{ name:'THE APRON ON THE SPEAR', fa:'درفش کاویانی',
    text:'Sharpen a card in your hand permanently. Gain 4 Strength, 20 Block, and 2 Energy.',
    fx:(G)=>{ G.buffP('str',4); G.blk(20,{raw:true}); G.energy(2); G.upgradeInHand(); } } };

HEROES.esther = {
  id:'esther', name:'ESTHER', fa:'אֶסְתֵּר · استر', art:'👑',
  epithet:'Hadassah — Queen in Shushan, and Not Only That',
  hp:74, energy:3, hue:'var(--turq)',
  blurb:'She was taken into the palace at Susa and told to say nothing about who she was, and she said nothing for years. Then a man at court arranged a date for the killing of every Jew in the empire, and her cousin sent word: perhaps you were made queen for exactly this. Going to the king unsummoned was a capital offence. She went anyway.',
  keyword:'Concealed cards. Play them face down for cheap — then reveal everything at once.',
  locked:true, unlockHint:'Unlocked by reaching Trial III on the Royal Road.',
  invoke:{ name:'IF I PERISH, I PERISH', fa:'וְכַאֲשֶׁר אָבַדְתִּי אָבָדְתִּי',
    text:'Reveal: deal 11 damage to ALL enemies for each Concealed you hold (minimum 2, max 5). Draw 3.',
    fx:(G)=>{ const n=Math.min(5, G.p.buffs.concealed||0); G.dmgAll(11*Math.max(2,n),{raw:true}); G.draw(3); G.buffP('concealed', -(G.p.buffs.concealed||0)); } } };

STARTERS.kaveh  = ['k_hammer','k_hammer','k_hammer','k_hammer','k_apron','k_apron','k_apron','k_anvil','k_quench','k_banner'];
STARTERS.esther = ['e_dagger','e_dagger','e_dagger','e_dagger','e_veil','e_veil','e_veil','e_veil','e_lots','e_favour'];

BUFF_INFO.concealed = {n:'Concealed', i:'🎭', d:'Cards played face down this fight. Revealing spends them all.'};
BUFF_INFO.gate      = {n:'At the Gate', i:'🚪', d:'A Concealed card at the start of every turn.'};
BUFF_INFO.mithra    = {n:'Contract', i:'🤝', d:'Farr and Block whenever an enemy dies.'};
BUFF_INFO.megillah  = {n:'The Scroll', i:'📖', d:'The first fall this fight is refused.'};
BUFF_INFO.banner    = BUFF_INFO.banner || {n:'Banner', i:'🚩', d:'Farr and Block at the start of your turn.'};

/* ═══════════════  CARDS  ═══════════════ */

/* ── Kāveh: the forge ── */
C({ id:'k_hammer', name:'Pot‑Hammer', fa:'پتک', hero:'kaveh', type:'attack', cost:1, rarity:'basic',
  targeted:true, t:u=>`Deal ${u?10:7} damage.`, flavor:'It was not made for this.',
  fx:(G,c)=>G.dmg(c.target, c.up?10:7) });
C({ id:'k_apron', name:'Leather Apron', fa:'چرم', hero:'kaveh', type:'skill', cost:1, rarity:'basic',
  t:u=>`Gain ${u?8:5} Block.`, flavor:'Scorched through in eleven places.',
  fx:(G,c)=>G.blk(c.up?8:5) });
C({ id:'k_anvil', name:'On the Anvil', fa:'سندان', hero:'kaveh', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?10:7} Block. Gain 1 Strength.`,
  fx:(G,c)=>{ G.blk(c.up?10:7); G.buffP('str',1); } });
C({ id:'k_quench', name:'Quench', fa:'آبدیده', hero:'kaveh', type:'skill', cost:0, rarity:'common',
  t:u=>`Gain ${u?6:4} Block. Draw 1.`,
  fx:(G,c)=>{ G.blk(c.up?6:4); G.draw(1); } });
C({ id:'k_banner', name:'Raise the Apron', fa:'درفش', hero:'kaveh', type:'power', cost:2, rarity:'uncommon',
  t:u=>`At the start of your turn gain ${u?3:2} Farr and ${u?6:4} Block.`,
  flavor:'It stayed the flag of Iran for a thousand years.',
  fx:(G,c)=>G.buffP('banner', c.up?3:2) });
C({ id:'k_strike', name:'Strike While Hot', fa:'ضربه', hero:'kaveh', type:'attack', cost:2, rarity:'common',
  targeted:true, t:u=>`Deal ${u?18:13} damage. Gain 1 Strength.`,
  fx:(G,c)=>{ G.dmg(c.target, c.up?18:13); G.buffP('str',1); } });
C({ id:'k_sparks', name:'Sparks', fa:'جرقه', hero:'kaveh', type:'attack', cost:1, rarity:'common',
  t:u=>`Deal ${u?7:5} damage to ALL enemies.`, fx:(G,c)=>G.dmgAll(c.up?7:5) });
C({ id:'k_temper', name:'Temper', fa:'کوره', hero:'kaveh', type:'skill', cost:1, rarity:'uncommon',
  exhaust:true, t:u=>`Sharpen a card in your hand for the rest of the fight.${u?' Draw 1.':''}`,
  fx:(G,c)=>{ G.upgradeInHand(); if(c.up) G.draw(1); } });
C({ id:'k_seventeen', name:'Seventeen Children', fa:'هفده فرزند', hero:'kaveh', type:'attack', cost:2, rarity:'rare',
  targeted:true, t:u=>`Deal ${u?8:6} damage for each card you have played this turn.`,
  flavor:'He counted them out loud in the king’s own court.',
  fx:(G,c)=>G.dmg(c.target, (c.up?8:6)*Math.max(1,G.playedThisTurn)) });
C({ id:'k_enough', name:'ENOUGH', fa:'بس است', hero:'kaveh', type:'skill', cost:1, rarity:'rare',
  exhaust:true, t:u=>`Gain 3 Farr. Gain ${u?3:2} Strength. All enemies get 2 Weak.`,
  fx:(G,c)=>{ G.farr(3); G.buffP('str', c.up?3:2); G.buffAll('weak',2); } });
C({ id:'k_crowd', name:'They Followed Him', fa:'مردم', hero:'kaveh', type:'power', cost:2, rarity:'rare',
  t:u=>`Whenever you gain Farr, gain ${u?4:3} Block.`,
  flavor:'That is the whole mechanism of every uprising there has ever been.',
  fx:(G,c)=>G.buffP('farrguard', c.up?4:3) });
C({ id:'k_smith', name:'A Working Man’s Hands', fa:'دست‌های آهنگر', hero:'kaveh', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Gain ${u?4:3} Block for each Strength you have.`,
  fx:(G,c)=>G.blk((c.up?4:3)*Math.max(1,(G.p.buffs.str||0))) });
C({ id:'k_nail', name:'Nail It Down', fa:'میخ', hero:'kaveh', type:'attack', cost:1, rarity:'uncommon',
  targeted:true, t:u=>`Deal ${u?9:6} damage. Apply 2 Vulnerable.`,
  fx:(G,c)=>{ G.dmg(c.target, c.up?9:6); G.buffF(c.target,'vuln',2); } });

/* ── Esther: concealment and revelation ── */
C({ id:'e_dagger', name:'Quiet Word', fa:'سخن آرام', hero:'esther', type:'attack', cost:1, rarity:'basic',
  targeted:true, t:u=>`Deal ${u?11:8} damage.`, fx:(G,c)=>G.dmg(c.target, c.up?11:8) });
C({ id:'e_veil', name:'Say Nothing', fa:'خاموشی', hero:'esther', type:'skill', cost:1, rarity:'basic',
  t:u=>`Gain ${u?9:6} Block.`, flavor:'For years. To everyone.',
  fx:(G,c)=>G.blk(c.up?9:6) });
C({ id:'e_lots', name:'The Lots', fa:'פּוּר', hero:'esther', type:'skill', cost:0, rarity:'common',
  t:u=>`Gain 1 Concealed. Draw ${u?2:1}.`,
  flavor:'“Pur” is a Persian loanword. The festival is named after a dice throw.',
  fx:(G,c)=>{ G.buffP('concealed',1); G.draw(c.up?2:1); } });
C({ id:'e_favour', name:'She Found Favour', fa:'חֵן', hero:'esther', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?4:3} Block and 2 Farr.`, fx:(G,c)=>{ G.blk(c.up?4:3); G.farr(2); } });
C({ id:'e_sceptre', name:'The Golden Sceptre', fa:'שַׁרְבִיט', hero:'esther', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Gain 1 Concealed. Gain ${u?9:6} Block. Gain 1 Energy.`,
  flavor:'He held it out. That was the whole difference between living and not.',
  fx:(G,c)=>{ G.buffP('concealed',1); G.blk(c.up?9:6); G.energy(1); } });
C({ id:'e_banquet', name:'Two Banquets', fa:'מִשְׁתֶּה', hero:'esther', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Gain 2 Concealed. Draw ${u?3:2}. Discard 1.`,
  flavor:'She invited him twice before she said anything. The delay was the plan.',
  fx:(G,c)=>{ G.buffP('concealed',2); G.draw(c.up?3:2); G.discardChoose(1); } });
C({ id:'e_reveal', name:'I Am Hadassah', fa:'הֲדַסָּה', hero:'esther', type:'attack', cost:2, rarity:'rare',
  targeted:true, exhaust:true,
  t:u=>`Deal ${u?13:10} damage for each Concealed, then lose all Concealed.`,
  flavor:'The whole court found out in one sentence.',
  fx:(G,c)=>{ const n=Math.max(1,G.p.buffs.concealed||0); G.dmg(c.target,(c.up?13:10)*n);
              G.buffP('concealed', -(G.p.buffs.concealed||0)); } });
C({ id:'e_gallows', name:'His Own Gallows', fa:'עֵץ', hero:'esther', type:'attack', cost:2, rarity:'rare',
  targeted:true, t:u=>`Deal damage equal to ${u?'120%':'100%'} of this enemy's Strength ×5, plus ${u?14:10}.`,
  flavor:'He built it fifty cubits high for somebody else.',
  fx:(G,c)=>{ const s=(c.target&&c.target.buffs.str)||0; G.dmg(c.target, (c.up?14:10)+Math.round(s*5*(c.up?1.2:1))); } });
C({ id:'e_night', name:'The King Could Not Sleep', fa:'נָדְדָה שְׁנַת', hero:'esther', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`All enemies get ${u?3:2} Weak. Draw 1.`,
  flavor:'So he had the chronicles read to him, and the plot came apart.',
  fx:(G,c)=>{ G.buffAll('weak', c.up?3:2); G.draw(1); } });
C({ id:'e_mordechai', name:'Mordechai at the Gate', fa:'מָרְדֳּכַי', hero:'esther', type:'power', cost:1, rarity:'uncommon',
  t:u=>`At the start of your turn, gain 1 Concealed${u?' and 1 Block per Concealed':''}.`,
  fx:(G,c)=>G.buffP('gate', c.up?2:1) });
C({ id:'e_fast', name:'Three Days', fa:'צוֹם', hero:'esther', type:'skill', cost:1, rarity:'common',
  exhaust:true, t:u=>`Lose ${u?3:5} HP. Gain 3 Concealed and 3 Farr.`,
  flavor:'Neither eat nor drink, she said, and I will do the same.',
  fx:(G,c)=>{ G.loseHp(c.up?3:5); G.buffP('concealed',3); G.farr(3); } });
C({ id:'e_such', name:'For Such a Time', fa:'לְעֵת כָּזֹאת', hero:'esther', type:'power', cost:2, rarity:'rare',
  t:u=>`Gain ${u?2:1} Farr at the start of your turn.`,
  flavor:'Who knows whether you have come to the kingdom for such a time as this.',
  fx:(G,c)=>G.buffP('whitehair', c.up?2:1) });
C({ id:'e_shushan', name:'Shushan the Citadel', fa:'שׁוּשַׁן', hero:'esther', type:'skill', cost:2, rarity:'common',
  t:u=>`Gain ${u?16:12} Block. Gain 1 Concealed.`,
  fx:(G,c)=>{ G.blk(c.up?16:12); G.buffP('concealed',1); } });

/* neutral additions, open to everybody */
C({ id:'n_arash', name:'Ārash’s Shot', fa:'آرش کمانگیر', hero:'any', type:'attack', cost:3, rarity:'rare',
  targeted:true, exhaust:true,
  t:u=>`Lose ${u?8:12} HP. Deal ${u?60:45} damage.`,
  flavor:'He put his whole life into one arrow and it flew from dawn until noon. They found the bow. They never found him.',
  fx:(G,c)=>{ G.loseHp(c.up?8:12); G.dmg(c.target, c.up?60:45,{raw:true}); } });
C({ id:'n_atar', name:'Ātar', fa:'آتر', hero:'any', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Apply ${u?5:3} Ember to ALL enemies.`,
  flavor:'Fire is not worshipped. It is faced — the direction you pray toward, because it is the one clean thing.',
  fx:(G,c)=>G.buffAll('ember', c.up?5:3) });
C({ id:'n_anahita', name:'Anāhitā’s Water', fa:'آناهیتا', hero:'any', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Heal ${u?9:6}. Gain ${u?7:5} Block. Gain 1 Farr.`,
  flavor:'Lady of the Waters, of fertility and of war, and the only Zoroastrian divinity the Greeks bothered to build temples for.',
  fx:(G,c)=>{ G.heal(c.up?9:6); G.blk(c.up?7:5); G.farr(1); } });
C({ id:'n_mithra', name:'Mithra’s Contract', fa:'میترا', hero:'any', type:'power', cost:1, rarity:'rare',
  t:u=>`Whenever an enemy dies, gain ${u?2:1} Farr and ${u?6:4} Block.`,
  flavor:'The god of the sworn word, who sees everything and forgives no broken oath.',
  fx:(G,c)=>G.buffP('mithra', c.up?2:1) });
C({ id:'n_golem', name:'A Thing of Clay', fa:'גֹּלֶם', hero:'any', type:'skill', cost:2, rarity:'rare',
  exhaust:true, t:u=>`Gain ${u?9:7} Companion.`,
  flavor:'You write אמת — truth — on its forehead and it walks. Rub out the first letter and you are left with מת, and it does not.',
  fx:(G,c)=>G.buffP('companion', c.up?9:7) });
C({ id:'n_immortals', name:'The Ten Thousand', fa:'انوشیه', hero:'any', type:'skill', cost:2, rarity:'uncommon',
  t:u=>`Gain ${u?18:13} Block. Gain 1 Agility.`,
  flavor:'The Immortals were always exactly ten thousand. The moment one fell, one stepped in, so the number never changed and neither, from a distance, did anything else.',
  fx:(G,c)=>{ G.blk(c.up?18:13); G.buffP('agi',1); } });

/* ═══════════════  THE BESTIARY OF THE ROYAL ROAD  ═══════════════ */

F({ id:'taxman', name:'Tax‑Taker of Zahhāk', fa:'باجگیر', tier:'RA', hp:[20,25],
  moves:[ {k:'attack',n:'The List',dmg:7}, {k:'special',n:'Levy',txt:'Steals 12 dirhams',fx:(G)=>G.gold(-12)},
          {k:'block',n:'Writ',blk:8} ],
  ai:(s)=> s.turn%3 });
F({ id:'liar', name:'A Small Lie', fa:'دروغ خرد', tier:'RA', hp:[16,20],
  moves:[ {k:'attack',n:'Whisper',dmg:5,fx:(G)=>G.addCard('c_doubt','discard',1)},
          {k:'attack',n:'Repeat It',dmg:8} ],
  ai:(s)=> s.turn%2 });
F({ id:'lamassu', name:'Broken Lamassu', fa:'شیردال', tier:'RA', hp:[24,29],
  moves:[ {k:'block',n:'Stand Guard',blk:10}, {k:'attack',n:'Stone Wing',dmg:8},
          {k:'attack',n:'Five Legs',dmg:4,hits:3} ],
  ai:(s)=> s.turn%3 });
F({ id:'karapan', name:'Karapan Priest', fa:'کرپن', tier:'RB', hp:[34,40],
  intro:'The karapans are the mumbling priests of the old cult that Zoroaster argued with — the ones who sacrifice cattle and get the words wrong on purpose.',
  moves:[ {k:'debuff',n:'Mumbled Rite',txt:'2 Weak, 2 Frail',fx:(G)=>{G.debuffP('weak',2);G.debuffP('frail',2);}},
          {k:'attack',n:'Bad Blessing',dmg:12}, {k:'buff',n:'Drink the Cup',txt:'+3 Strength',fx:(G,s)=>G.buffF(s,'str',3)} ],
  ai:(s)=> s.turn%3 });
F({ id:'nasu', name:'Nasu', fa:'نسو', tier:'RB', hp:[38,45],
  intro:'The corpse‑fly demon of pollution. Zoroastrian law is obsessive about her, which is why the dead are exposed on towers rather than buried in clean earth.',
  moves:[ {k:'attack',n:'Alight',dmg:9,fx:(G)=>G.venomP(4)},
          {k:'special',n:'Spread',txt:'Heal 9',fx:(G,s)=>G.healF(s,9)},
          {k:'attack',n:'Swarm',dmg:5,hits:3} ],
  ai:(s)=> s.hp<s.maxHp*0.5 ? 1 : s.turn%3===2 ? 2 : 0 });
F({ id:'satrap', name:'A Bought Satrap', fa:'ساتراپ', tier:'RB', hp:[40,47],
  moves:[ {k:'attack',n:'Decree',dmg:14}, {k:'block',n:'Guardsmen',blk:15},
          {k:'buff',n:'Bribe the Court',txt:'+3 Strength, 8 Block',fx:(G,s)=>{G.buffF(s,'str',3);G.blkF(s,8);}} ],
  ai:(s)=> s.turn%3 });
F({ id:'aeshma', name:'Aēshma', fa:'ائشمه', tier:'RC', hp:[48,56],
  intro:'The demon of Wrath, who carries a bloody club. His name went east into Hebrew as Ashmedai and turns up in the Talmud as the king of the demons — one of the clearest fingerprints of Persian religion on Jewish literature there is.',
  moves:[ {k:'attack',n:'Bloody Club',dmg:17},
          {k:'buff',n:'Fury',txt:'+4 Strength',fx:(G,s)=>G.buffF(s,'str',4)},
          {k:'attack',n:'Unreasoning',dmg:8,hits:3} ],
  ai:(s)=> s.turn===0?1:(s.turn%3===2?2:0) });
F({ id:'jahi', name:'Jahī', fa:'جهی', tier:'RC', hp:[44,52],
  intro:'The demoness whom Ahriman kisses to wake him from three thousand years of stupor. She is, frankly, one of the more misogynist corners of the tradition, and she is in here fighting for the wrong side because that is where the text put her.',
  moves:[ {k:'debuff',n:'Rouse',txt:'All enemies +3 Strength',fx:(G)=>G.foes.forEach(f=>{if(f.hp>0)G.buffF(f,'str',3);})},
          {k:'attack',n:'Corruption',dmg:15,fx:(G)=>G.venomP(4)},
          {k:'attack',n:'Waste',dmg:9,hits:2} ],
  ai:(s)=> s.turn%3 });
F({ id:'sleepless', name:'Sleepless Guard', fa:'نگهبان بیدار', tier:'RC', hp:[52,60],
  moves:[ {k:'block',n:'The Watch',blk:20}, {k:'attack',n:'Halberd',dmg:18},
          {k:'attack',n:'Relieve the Line',dmg:10,hits:2,fx:(G)=>G.debuffP('frail',2)} ],
  ai:(s)=> s.turn%3 });

/* elites */
F({ id:'senmurv', name:'Senmurv', fa:'سیمرغ سنگی', tier:'elite', hp:[70,80],
  intro:'The dog‑headed, lion‑pawed, peacock‑tailed bird of Sasanian silver and silk — an older, wilder shape of the Simurgh, woven into so many textiles that it ended up on vestments in medieval European churches.',
  moves:[ {k:'attack',n:'Stoop',dmg:18}, {k:'special',n:'Mantle',txt:'22 Block, +2 Strength',fx:(G,s)=>{G.blkF(s,22);G.buffF(s,'str',2);}},
          {k:'attack',n:'Rake',dmg:7,hits:3} ],
  ai:(s)=> s.turn%3 });
F({ id:'gaokerena', name:'The White Haoma', fa:'گوکرن', tier:'elite', hp:[64,74],
  intro:'The white haoma, the tree of all seeds at the bottom of the sea, whose fruit gives immortality at the end of the world. Ahriman set a lizard in the water to gnaw at it. This is the lizard.',
  moves:[ {k:'attack',n:'Gnaw',dmg:8,hits:2,fx:(G)=>G.venomP(4)},
          {k:'special',n:'Root‑Rot',txt:'Heal 14, +2 Strength',fx:(G,s)=>{G.healF(s,14);G.buffF(s,'str',2);}},
          {k:'debuff',n:'Brackish',txt:'3 Frail, 3 Weak',fx:(G)=>{G.debuffP('frail',3);G.debuffP('weak',3);}} ],
  ai:(s)=> s.turn%3 });

/* ── the seven of the Royal Road ── */
F({ id:'hatchling', name:'Shoulder‑Serpent (young)', fa:'مار نوزاد', tier:'minion', hp:[17,17],
  moves:[ {k:'attack',n:'Nip',dmg:5,fx:(G)=>G.venomP(2)}, {k:'attack',n:'Coil',dmg:8} ],
  ai:(s)=> s.turn%2 });

F({ id:'herald', name:'THE HERALD OF THE SERPENT', fa:'پیک ضحاک', tier:'boss', hp:[68,68],
  intro:'He arrives with a scroll and two soldiers and reads out the quota in a bored voice: two young people, today, for the king’s shoulders. He has done this in a hundred streets. He has never once been interrupted.',
  mech:'THE QUOTA — every third turn he takes what he came for whether you like it or not.',
  minions:['taxman'],
  moves:[ {k:'attack',n:'Read the List',dmg:11},
          {k:'special',n:'THE QUOTA',txt:'Lose 6 HP directly',fx:(G)=>G.loseHp(6)},
          {k:'block',n:'Soldiers Close Up',blk:14} ],
  ai:(s)=> s.turn%3===2 ? 1 : (s.turn%3===1 ? 2 : 0) });

F({ id:'zahhak', name:'ZAHHĀK', fa:'ضحاک', tier:'boss', hp:[92,92],
  intro:'Aži Dahāka — in the oldest Zoroastrian texts a three‑headed serpent, and by Ferdowsī’s time a man with two serpents growing out of his shoulders where Ahriman kissed him. They must be fed the brains of two young people every day. He has ruled for a thousand years and the land has gone grey under him.',
  mech:'THE SHOULDERS — the serpents act on their own. Kill them and they come back; the man is the problem.',
  minions:['hatchling'],
  moves:[ {k:'attack',n:'The King’s Hand',dmg:10},
          {k:'special',n:'FEED THEM',txt:'Summon a Shoulder‑Serpent; heal 18',fx:(G,s)=>{G.summon('hatchling');G.healF(s,8);}},
          {k:'debuff',n:'A Thousand Years',txt:'2 Weak, 2 Frail',
            fx:(G)=>{G.debuffP('weak',2);G.debuffP('frail',2);}},
          {k:'attack',n:'Both Mouths',dmg:5,hits:2,fx:(G)=>G.venomP(3)} ],
  ai:(s)=>{ const alive=s._G? s._G.foes.filter(f=>f.hp>0).length:1;
            if(s.turn>0 && s.turn%4===1 && alive<3) return 1; return [0,3,2,0][s.turn%4]; } });

F({ id:'chinvat', name:'THE BRIDGE OF THE SEPARATOR', fa:'پل چینوت', tier:'boss', hp:[126,126],
  intro:'Every soul crosses it on the fourth day. For the just it is broad as nine spears laid end to end and a beautiful woman meets them halfway — she is their own conscience, grown into a shape. For the unjust it turns edge‑on, thin as a razor, and what meets them is also their own conscience, and it is not beautiful.',
  mech:'IT WIDENS AND NARROWS — it mirrors you. The more Block you carry, the harder it is to cross.',
  moves:[ {k:'special',n:'Turn Edge‑On',txt:'Halve your Block; gain 26 Block',fx:(G,s)=>{G.halveBlockP();G.blkF(s,26);}},
          {k:'attack',n:'The Razor',dmg:20},
          {k:'special',n:'Your Own Face',txt:'You lose HP equal to a quarter of your Block',
            fx:(G)=>{ const n=Math.max(4,Math.floor(G.p.block/4)); G.loseHp(n); }},
          {k:'attack',n:'Nine Spears Wide',dmg:8,hits:3} ],
  ai:(s)=> [0,1,2,3,1,0][s.turn%6] });

F({ id:'haman', name:'HAMAN THE AGAGITE', fa:'הָמָן', tier:'boss', hp:[108,108],
  intro:'Grand vizier at Susa. A man at the gate would not bow to him, so he decided — this is in the text, and it is the part that people forget — not to punish the man, but to have every single one of his people killed on one day, and he cast lots to pick which day. The lot fell on the thirteenth of Adar. Purim is named after that throw of the dice.',
  mech:'THE LOT — he escalates on a schedule he set in advance and will not be talked out of.',
  minions:['satrap'],
  moves:[ {k:'attack',n:'Decree',dmg:15},
          {k:'special',n:'CAST THE LOT',txt:'+4 Strength; the next one is worse',
            fx:(G,s)=>{ G.buffF(s,'str',4); s.esc=(s.esc||0)+1; }},
          {k:'debuff',n:'Fifty Cubits',txt:'3 Vulnerable',fx:(G)=>G.debuffP('vuln',3)},
          {k:'attack',n:'On One Day',dmg:10,hits:2} ],
  ai:(s)=> s.turn%4===1 ? 1 : [0,1,3,2][s.turn%4] });

F({ id:'wall', name:'THE WRITING ON THE WALL', fa:'מְנֵא מְנֵא תְּקֵל וּפַרְסִין', tier:'boss', hp:[100,100],
  intro:'Belshazzar is drinking out of the looted Temple vessels when the fingers of a human hand appear and write four words on the plaster, and the king’s face changes and his knees knock together. Nobody in the room can read it. Daniel can: *numbered, numbered, weighed, divided.* You have been weighed in the balances and found wanting.',
  mech:'NUMBERED, WEIGHED, DIVIDED — three phases, and it is counting.',
  moves:[ {k:'attack',n:'MENĒ — numbered',dmg:16},
          {k:'special',n:'TEQĒL — weighed',txt:'You lose HP equal to your hand size ×3',
            fx:(G)=>G.loseHp(Math.max(3, G.hand.length*3))},
          {k:'special',n:'PERĒS — divided',txt:'Discard your hand; it gains 30 Block',
            fx:(G,s)=>{ G.discardHand(); G.blkF(s,30); }},
          {k:'attack',n:'The Fingers',dmg:7,hits:3},
          {k:'buff',n:'The Lamp Gutters',txt:'+5 Strength',fx:(G,s)=>G.buffF(s,'str',5)} ],
  ai:(s)=> [0,1,3,2,0,4][s.turn%6] });

F({ id:'druj', name:'DRUJ — THE LIE', fa:'دروغ', tier:'boss', hp:[168,168],
  intro:'Zoroastrianism does not have sin at its centre. It has *drug* — the Lie — against *asha*, the Truth, the right order of things. Darius carved it on the rock at Bīsotūn: the country had been shaken by the Lie, and he put it down. Every royal inscription after him prays for the same thing: protect this land from enemy armies, from famine, and from the Lie.',
  mech:'IT WEARS YOUR FACE — it copies whatever you did last turn and does it back to you.',
  moves:[ {k:'attack',n:'What You Said',dmg:19},
          {k:'debuff',n:'What You Meant',txt:'Add 2 Doubt to your draw pile',fx:(G)=>G.addCard('c_doubt','draw',2)},
          {k:'special',n:'What You Did',txt:'Gains Block equal to yours; +3 Strength',
            fx:(G,s)=>{ G.blkF(s, Math.max(12,G.p.block)); G.buffF(s,'str',3); }},
          {k:'attack',n:'Repeated Often Enough',dmg:9,hits:3},
          {k:'special',n:'Nothing Was Ever True',txt:'Heal 26; cleanse',
            fx:(G,s)=>{ G.healF(s,26); s.buffs.weak=0; s.buffs.vuln=0; s.buffs.venom=0; }} ],
  ai:(s)=>{ if(s.hp<s.maxHp*0.3 && s.turn%5===4) return 4; return [0,2,1,3,0][s.turn%5]; } });

F({ id:'ahriman', name:'ANGRA MAINYU', fa:'اهریمن', tier:'boss', hp:[236,236],
  intro:'The Destructive Spirit. Not a fallen angel and not a rebel — a separate, uncreated, co‑eternal will that chose destruction knowingly, at the beginning, before there was anything to destroy. Ahura Mazda offered peace once and was refused. The whole of history is the twelve thousand years it takes to grind him down, and the Zoroastrian position — this is the startling part — is that it ends in his defeat and the remaking of everything, and even the damned come out.',
  mech:'THREE THOUSAND YEARS — he is stunned, he wakes, he mixes himself into the world. Endure the middle age and you get to the end of it.',
  moves:[ {k:'special',n:'STUPEFIED',txt:'He lies senseless. 34 Block.',fx:(G,s)=>G.blkF(s,34)},
          {k:'attack',n:'The Assault',dmg:22},
          {k:'debuff',n:'Mixture',txt:'2 of everything, and 4 Ember',
            fx:(G)=>{G.debuffP('weak',2);G.debuffP('frail',2);G.debuffP('vuln',2);G.emberP(4);}},
          {k:'special',n:'HE WAKES',txt:'+6 Strength, heal 30, cleanse',
            fx:(G,s)=>{ G.buffF(s,'str',6); G.healF(s,30); s.buffs.weak=0; s.buffs.vuln=0; s.buffs.venom=0; }},
          {k:'attack',n:'Counter‑Creation',dmg:11,hits:3},
          {k:'attack',n:'THE LAST ASSAULT',dmg:32} ],
  ai:(s)=>{ if(s.phase===undefined) s.phase=0;
    if(s.phase===0 && s.hp<=s.maxHp*0.70){ s.phase=1; return 3; }
    if(s.phase===1 && s.hp<=s.maxHp*0.32){ s.phase=2; return 3; }
    if(s.phase===2) return [4,5,1,4][s.turn%4];
    if(s.phase===1) return [1,4,2,1][s.turn%4];
    return [0,1,2,1][s.turn%4]; } });

/* ═══════════════  ENCOUNTER TABLES  ═══════════════ */
ENCOUNTERS.RA = [ ['taxman','liar'], ['lamassu'], ['liar','liar'], ['taxman'],
                  ['lamassu','liar'], ['taxman','taxman'] ];
ENCOUNTERS.RB = [ ['karapan'], ['nasu'], ['satrap'], ['karapan','liar'],
                  ['nasu','lamassu'], ['satrap','taxman'] ];
ENCOUNTERS.RC = [ ['aeshma'], ['jahi'], ['sleepless','liar'], ['aeshma','karapan'],
                  ['jahi','nasu'], ['sleepless'] ];
ENCOUNTERS.elite.RA = ['senmurv','nasnas'];
ENCOUNTERS.elite.RB = ['senmurv','gaokerena','karkadann'];
ENCOUNTERS.elite.RC = ['gaokerena','golem','manticore'];

/* ═══════════════  THE SEVEN STAGES  ═══════════════ */
const ROYAL_TRIALS = [
  { n:1, roman:'I', name:'THE APRON', fa:'چرم', tier:'RA', boss:'herald',
    sub:'in which an ordinary man has had enough',
    text:'A smith in the street outside the palace has lost seventeen children to the king’s shoulders and they have come for the eighteenth. In the story he tears off his leather apron, ties it to a spear, and holds it up. It is the least kingly object imaginable and it becomes the royal standard of Iran for a thousand years.' },
  { n:2, roman:'II', name:'THE SERPENT KING', fa:'ضحاک', tier:'RA', boss:'zahhak',
    sub:'in which the tyrant is a thousand years old',
    text:'Zahhāk took the throne by killing his own father and let Ahriman kiss him on both shoulders, and two serpents grew there that must be fed. The people are not conquered so much as *farmed*. Ferdowsī spends a great deal of care on how ordinary the horror becomes.' },
  { n:3, roman:'III', name:'THE BRIDGE', fa:'چینوت', tier:'RB', boss:'chinvat',
    sub:'in which you meet yourself coming the other way',
    text:'The Chinvat Bridge, the Bridge of the Separator, which every soul crosses on the fourth day after death. Halfway across you meet your own daēnā — your conscience and your deeds, in the shape of a woman. Whether she is beautiful is not up to her.' },
  { n:4, roman:'IV', name:'THE LOTS OF SHUSHAN', fa:'שׁוּשַׁן', tier:'RB', boss:'haman',
    sub:'in which a queen has to say who she is',
    text:'Susa — Shushan — the Achaemenid winter capital. A Jewish girl has been queen here for years without telling anyone what she is, and the king’s vizier has just cast lots for the date on which every one of her people will be killed.' },
  { n:5, roman:'V', name:'THE WRITING', fa:'מְנֵא', tier:'RB', boss:'wall',
    sub:'in which the arithmetic is done',
    text:'A king drinking out of looted temple vessels, and a hand that writes four words on the plaster in a language nobody at the feast can read. It is the origin of the phrase — the writing is on the wall — and the words are an accountant’s: numbered, numbered, weighed, divided.' },
  { n:6, roman:'VI', name:'THE LIE', fa:'دروغ', tier:'RC', boss:'druj',
    sub:'in which the enemy is not an army',
    text:'Darius put it on the rock at Bīsotūn, sixty metres up, in three languages: the country was shaken by the Lie, and he put the Lie down. Every king after him prays to be defended from three things — an enemy army, a bad harvest, and the Lie. They ranked it with famine.' },
  { n:7, roman:'VII', name:'ANGRA MAINYU', fa:'اهریمن', tier:'RC', boss:'ahriman',
    sub:'in which it is not, in the end, a draw',
    text:'The Destructive Spirit himself, at the far end of the Royal Road. Zoroastrianism is dualist but it is not pessimistic: the two spirits are matched for twelve thousand years and then they are not, and the world is made wonderful again — *Frashokereti* — and the wicked are purified rather than kept.' },
];
const ROYAL_SECRET = { n:8, roman:'VIII', name:'THE GREY ROAD', fa:'راه خاکستری', tier:'RC', boss:'watcher',
  sub:'a road that is not on either map',
  text:'The hilt has gone warm again. It seems this door opens from both sides.' };

const ROADS = {
  haft:  { id:'haft',  name:'THE HAFT KHĀN', fa:'هفت خان',
           sub:'The Seven Trials of Rostam — myth, monsters, and a horse who was right all along.',
           trials:TRIALS, secret:SECRET_TRIAL, mood:i=>'t'+Math.min(8,i+1) },
  royal: { id:'royal', name:'THE ROYAL ROAD', fa:'راه شاهی',
           sub:'From a blacksmith’s apron to the Lie itself. Zoroastrian cosmology, the Achaemenid court, and the oldest tyrant in the book.',
           trials:ROYAL_TRIALS, secret:ROYAL_SECRET, mood:i=>['t2','t3','t7','t4','t6','t8','t7','t8'][Math.min(7,i)] },
};

/* the one function the rest of the engine asks about which trial it is on */
trialDef = function(i){
  const road = ROADS[(R && R.road) || 'haft'];
  return i < road.trials.length ? road.trials[i] : road.secret;
};

/* ═══════════════  TALISMANS — the Amesha Spentas  ═══════════════
   The six Bounteous Immortals: not gods, but aspects of Ahura Mazda, each of
   which also *is* a piece of the physical world you are standing in. */
T({ id:'vohu', name:'Vohu Manah', fa:'وهومن', art:'🐄', rarity:'uncommon',
  text:'The Good Mind. Draw 1 more card each turn.', mods:{drawPlus:1} });
T({ id:'asha', name:'Asha Vahishta', fa:'اردیبهشت', art:'🔥', rarity:'rare',
  text:'Best Truth. The first attack you play each turn deals 4 more damage.',
  combatStart:(G)=>G.buffP('whet',4) });
T({ id:'khshathra', name:'Khshathra Vairya', fa:'شهریور', art:'👑', rarity:'rare',
  text:'Desirable Dominion. Start each fight with 2 extra Energy.',
  combatStart:(G)=>{ G.p.firstTurnEnergy = (G.p.firstTurnEnergy||0)+2; } });
T({ id:'armaiti', name:'Spenta Armaiti', fa:'اسفند', art:'🌍', rarity:'uncommon',
  text:'Holy Devotion, who is the earth itself. Start each fight with 9 Block.',
  combatStart:(G)=>G.blk(9,{raw:true}) });
T({ id:'haurvatat', name:'Haurvatāt', fa:'خرداد', art:'💧', rarity:'uncommon',
  text:'Wholeness, who is the waters. Heal 5 after every fight.',
  combatEnd:(R_)=>{ R_.hp = Math.min(R_.maxHp, R_.hp+5); } });
T({ id:'ameretat', name:'Ameretāt', fa:'امرداد', art:'🌿', rarity:'rare',
  text:'Immortality, who is the plants. Gain 8 max HP now, and 3 after each trial.',
  pickup:(R_)=>{ R_.maxHp+=8; R_.hp+=8; },
  trialEnd:(A)=>{ A.addMaxHp(3); } });

T({ id:'cylinder', name:'The Cyrus Cylinder', fa:'استوانهٔ کوروش', art:'📜', rarity:'boss',
  text:'Enemies you would have killed this turn are freed instead: gain 3 Farr and 8 Block per kill.',
  kill:(G)=>{ G.farr(3); G.blk(8,{raw:true}); } });
T({ id:'apron', name:'The Derafsh‑e Kāviāni', fa:'درفش کاویانی', art:'🚩', rarity:'boss',
  text:'Start every fight with 3 Farr and 2 Strength.',
  combatStart:(G)=>{ G.farr(3); G.buffP('str',2); } });
T({ id:'megillah', name:'The Scroll of Esther', fa:'מְגִלַּת אֶסְתֵּר', art:'📖', rarity:'boss',
  text:'The first time you would fall in each fight, survive at 1 HP instead and draw 3.',
  combatStart:(G)=>{ G.p.buffs.megillah = 1; } });
T({ id:'hamadan', name:'A Stone from Hamadān', fa:'همدان', art:'🕯️', rarity:'rare',
  text:'Rest at camps heals 14 more. Nothing is ever really gone.', mods:{restBonus:14} });
T({ id:'faravahar', name:'The Winged Disc', fa:'فروهر', art:'🕊️', rarity:'rare',
  text:'Your Farr meter needs 2 less to fill.', mods:{maxFarr:-2} });
T({ id:'nowruz', name:'A Sprouted Dish', fa:'سبزه', art:'🌱', rarity:'common',
  text:'Heal 4 at the start of every fight. It is always the new year somewhere.',
  combatStart:(G)=>G.heal(4) });

BOSS_TALISMANS.push('cylinder','apron','megillah');

/* ═══════════════  OMENS  ═══════════════ */
EVENTS.push(
{ id:'nowruz', name:'NOWRŪZ', fa:'نوروز', art:'🌱', minTrial:2,
  text:'A family has set a cloth on the ground by the road with seven things on it, each beginning with the letter *sīn*: sprouted wheat, garlic, apples, sumac, vinegar, a sweet paste, an oleaster berry. It is the spring equinox. They are keeping a new year that is at least three thousand years old and was, for a long stretch of that, illegal.\n\nThey wave you over.',
  choices:[
    { label:'SIT DOWN AND EAT', sub:'Heal a great deal',
      fx:(R_)=>{ R_.heal(30); return 'You eat, and they ask where you are going, and when you tell them the grandmother laughs at you for a full minute and then packs you food.\n\n+30 HP.'; } },
    { label:'JUMP THE FIRE', sub:'Lose a little HP, gain a lot else',
      fx:(R_)=>{ R_.damage(6); R_.gold(40);
        return 'Chahārshanbe Sūri: you leap the bonfire and shout the old line — *my yellow is yours, your red is mine* — give the fire your sickliness and take its health. You singe your leg. Somebody presses coins on you for luck.\n\n−6 HP, +40 dirhams.'; } },
    { label:'LEAVE THEM TO IT', sub:'Take a talisman instead',
      fx:(R_)=>{ const n=R_.giveTalisman('common'); return `You do not stop. Further on you find something dropped in the road: ${n}.`; } },
  ]},

{ id:'yalda', name:'THE LONGEST NIGHT', fa:'شب یلدا', art:'🍉', minTrial:3,
  text:'Shab‑e Yaldā: the winter solstice, the longest and darkest night of the year, which Iranians deal with by refusing to sleep through it. There is a fire, a watermelon kept since summer, pomegranates, and an old woman with a book of Hāfez.\n\n*Open it anywhere,* she says. *Ask it something first.*',
  choices:[
    { label:'ASK THE BOOK', sub:'Fāl‑e Hāfez — it decides',
      fx:(R_)=>{ const r=R_.rng();
        if(r<0.34){ const n=R_.giveTalisman('rare'); return `The line she reads is about arriving. She presses something into your hand: ${n}.`; }
        if(r<0.7){ R_.heal(22); return 'The line is about patience, and the pomegranate seeds are the colour of a heart, and you sleep for four hours by the fire.\n\n+22 HP.'; }
        R_.damage(9); return 'The line is about a road that does not end where you thought. Nobody translates it for you. You lie awake.\n\n−9 HP.'; } },
    { label:'STAY UP UNTIL DAWN', sub:'Heal 14 · sharpen a card',
      fx:(R_)=>{ R_.heal(14); R_.upgradeChoose(); return 'You sit through the whole of it. Somewhere near the end you understand a thing about your own equipment.\n\n+14 HP, and one card sharpened.'; } },
  ]},

{ id:'cyrusomen', name:'THE CLAY BARREL', fa:'استوانه', art:'📜', once:true, minTrial:3,
  text:'A dig in the foundations of a wall has turned up a barrel of clay covered in cuneiform. A scribe reads it to the crowd: a Persian king took Babylon without a battle, sent the deported peoples home with their gods, and paid to rebuild their temples out of his own treasury.\n\n*He is called the anointed one in their scripture,* the scribe says, nodding at the Judean stonemasons in the crowd. *In their language, mashiach. They gave that word to a foreigner exactly once.*',
  choices:[
    { label:'TAKE THE CYLINDER', sub:'A boss talisman',
      req:(R_)=>true,
      fx:(R_)=>{ const n=R_.giveTalismanById('cylinder'); return `You carry it out wrapped in your coat. Twenty‑five centuries later it is in a glass case in Bloomsbury and there is still an argument going on about how to read it.\n\nGained: ${n}.`; } },
    { label:'LET IT STAY IN THE WALL', sub:'+70 dirhams, heal 12',
      fx:(R_)=>{ R_.gold(70); R_.heal(12); return 'You leave it. The stonemasons buy you dinner.\n\n+70 dirhams, +12 HP.'; } },
  ]},

{ id:'hamadan', name:'THE TOMB AT HAMADĀN', fa:'آرامگاه', art:'🕯️', once:true, minTrial:4,
  text:'A low brick dome in Hamadān — old Ecbatana, the Median capital. Inside, under a stone door you have to stoop to get through, are two wooden boxes said to hold Esther and Mordechai.\n\nJews have been in Iran for two and a half thousand years, since before there was a Persian empire to be in. The caretaker is used to visitors and does not ask what you are.',
  choices:[
    { label:'LIGHT A CANDLE', sub:'A rare talisman',
      fx:(R_)=>{ const n=R_.giveTalismanById('hamadan'); return `You leave a light burning. The caretaker gives you a chip of the old brick.\n\nGained: ${n}.`; } },
    { label:'ASK HIM WHAT HE HAS SEEN', sub:'Heal 18 · +50 dirhams',
      fx:(R_)=>{ R_.heal(18); R_.gold(50); return 'He talks for an hour. Most of it is about his knees. The rest of it you will think about for years.\n\n+18 HP, +50 dirhams.'; } },
  ]},

{ id:'amesha', name:'SIX AT THE FIRE', fa:'امشاسپندان', art:'🔥', once:true, minTrial:3,
  text:'A fire‑temple keeper is feeding sandalwood to a flame he says has not gone out in four hundred years. He names the six who stand around Ahura Mazda: Good Mind, Best Truth, Desirable Dominion, Holy Devotion, Wholeness, Immortality.\n\n*They are not gods,* he says. *Each of them is also a real thing you can put your hand on. Devotion is the ground. Wholeness is water. Immortality is the plants. Choose carefully — you are choosing what to be.*',
  choices:[
    { label:'THE GOOD MIND', sub:'Draw one more card every turn',
      fx:(R_)=>{ const n=R_.giveTalismanById('vohu'); return `${n}. He seems pleased and slightly unsurprised.`; } },
    { label:'BEST TRUTH', sub:'Your first attack each turn hits harder',
      fx:(R_)=>{ const n=R_.giveTalismanById('asha'); return `${n}. *Asha,* he says. *The order things have when nobody is lying about them.*`; } },
    { label:'HOLY DEVOTION', sub:'Start every fight with Block',
      fx:(R_)=>{ const n=R_.giveTalismanById('armaiti'); return `${n}. He touches the floor with his palm.`; } },
  ]},

{ id:'clay', name:'A THING OF CLAY', fa:'גֹּלֶם', art:'🗿', once:true, minTrial:4,
  text:'In the courtyard of a house in the Jewish quarter, a figure of river clay the size of a man is lying on a board. A woman is arguing with her brother about whether it is permitted.\n\n*You write emet on its forehead,* she says. *Truth. And it gets up.* Her brother says that is exactly the problem: rub out the first letter and you have met — dead — and it stops, and you have to be willing to do that.',
  choices:[
    { label:'WRITE THE WORD', sub:'Gain the card A Thing of Clay',
      fx:(R_)=>{ const n=R_.addCard('n_golem'); return `The clay sits up. It is patient and enormously strong and does not speak.\n\n${n} joins your deck.`; } },
    { label:'ARGUE THE BROTHER’S SIDE', sub:'Sharpen a card · +40 dirhams',
      fx:(R_)=>{ R_.gold(40); R_.upgradeChoose(); return 'You point out that the story always ends the same way. They both look at you. Then the brother buys you a drink.\n\n+40 dirhams, and one card sharpened.'; } },
  ]},

{ id:'arrow', name:'THE ARCHER', fa:'آرش کمانگیر', art:'🏹', once:true, minTrial:3,
  text:'A boundary stone, and a man beside it who tells you what it marks.\n\nAfter a long war the two sides agreed the border would be set wherever a single arrow fell. Ārash climbed Mount Damāvand, put every ounce of strength he had into one shot — his whole life, the story says, literally: the strength went out of his body into the bow — and the arrow flew from dawn until noon and landed here.\n\nThey found the bow on the mountain. They never found him.',
  choices:[
    { label:'TAKE THE SHOT', sub:'Gain the card Ārash’s Shot',
      fx:(R_)=>{ const n=R_.addCard('n_arash'); return `You will only be able to do it once, and it will cost you.\n\n${n} joins your deck.`; } },
    { label:'SIT WITH THE STONE A WHILE', sub:'Heal 20 · +2 max HP',
      fx:(R_)=>{ R_.heal(20); R_.addMaxHp(2); return 'Tīrgān is still kept for him, in the middle of summer, with water thrown over everybody.\n\n+20 HP, +2 max HP.'; } },
  ]},

{ id:'apronomen', name:'THE SMITH’S SHOP', fa:'دکان آهنگر', art:'🔨', once:true, minTrial:2,
  text:'The forge is cold and the door is open and the man inside is not working. There is a leather apron on the bench, scorched through in a dozen places.\n\n*Seventeen,* he says, when you ask. He does not say seventeen what. He does not need to.',
  choices:[
    { label:'HELP HIM CARRY IT OUT', sub:'A boss talisman',
      fx:(R_)=>{ const n=R_.giveTalismanById('apron'); return `You find a spear shaft. He ties it on. By the end of the street there are forty people behind you and by the end of the week there is an army.\n\nGained: ${n}.`; } },
    { label:'BUY THE FORGE OFF HIM', sub:'Costs 90 · sharpen two cards',
      req:(R_)=>R_.gold_>=90,
      fx:(R_)=>{ R_.gold(-90); R_.upgradeChoose(); R_.upgradeChoose();
        return 'He takes the money without counting it and walks out into the street with the apron anyway.\n\n−90 dirhams, two cards sharpened.'; } },
  ]},
);

/* ═══════════════  LORE  ═══════════════ */
Object.assign(LORE.foes, {
  zahhak:'Aži Dahāka in the Avesta — a three‑headed, six‑eyed dragon made by Angra Mainyu to ruin the world. By the Shāhnāmeh he has become a man: an Arab prince, Zahhāk, who murders his father on the Devil’s advice and is then kissed on both shoulders by the same Devil disguised as a cook. Two black serpents grow where the lips touched. They can only be fed human brains. He rules for a thousand years, and Ferdowsī’s real subject is not the monster but the bureaucracy that grows up around him — the quotas, the lists, the officials who deliver two young people a day and go home to dinner.',
  herald:'The two cooks who fed the serpents were called Armāyel and Garmāyel, and every day they secretly substituted a sheep’s brain for one of the two victims and smuggled that person out into the mountains. The Kurds, Ferdowsī says, are descended from the ones who got away. It is a small mercy hidden inside a horror story and it is very characteristic of him.',
  chinvat:'The Chinvat Bridge — *činwad puhl*, the Bridge of the Separator. Every soul crosses on the fourth day after death. Halfway over it meets its own daēnā: for the just, a fifteen‑year‑old girl of astonishing beauty who says *I am your own good thoughts, words and deeds*; for the unjust, a hag who says the same sentence. The bridge widens or narrows to a razor accordingly. Judgement here is not a sentence handed down. It is a meeting.',
  haman:'Haman the Agagite, in the Book of Esther, vizier at Susa under Ahasuerus — almost certainly Xerxes I. He casts *pur*, a lot, to fix the date. Pur is not a Hebrew word; it is a Persian one, and the book pauses to explain it, which is how the festival of Purim ends up named after a piece of borrowed Persian vocabulary embedded in a Jewish story set in an Iranian palace.',
  wall:'Daniel 5. Belshazzar drinks from the vessels looted out of the Temple in Jerusalem and a disembodied hand writes on the plaster: MENĒ MENĒ TEQĒL UPHARSIN. They are Aramaic weights — a mina, a mina, a shekel and half‑shekels — so the message is at once a bank statement and a death sentence: numbered, numbered, weighed, divided. Daniel reads it. That night Babylon falls, and Cyrus the Persian walks in.',
  druj:'*Drug* (later *durūgh*, and yes, it is still the ordinary modern Persian word for a lie) is the central evil of Zoroastrianism — not sin, not disobedience, but falsehood set against *asha*, the true order of things. Darius the Great carved his account of taking the throne on a cliff at Bīsotūn and used the word constantly: the provinces revolted because the Lie had grown strong in them. Later kings pray to be protected from three things — a hostile army, a bad harvest, and the Lie.',
  ahriman:'Angra Mainyu, the Destructive Spirit; Ahriman in Middle Persian. Not created evil and not a rebel angel — an independent will that chose destruction at the start, when Ahura Mazda offered peace and was refused. The cosmos is a twelve‑thousand‑year trap: creation is bait, Ahriman rushes in, and the mixture is history. What is genuinely unusual is the ending. Zoroastrian eschatology is not a stalemate and not an eternal hell. Time ends in *Frashokereti* — the Making Wonderful — the dead rise, a river of molten metal purifies everyone, and even the damned come through it and are healed.',
  aeshma:'Aēshma, the demon of Wrath, carrying the bloody club. His name appears to have travelled: Ashmedai, king of the demons in the Talmud and Asmodeus in the Book of Tobit, is very widely thought to be Aēshma‑daēva with a Semitic ending on it. Whatever else the Babylonian exile and the Persian centuries did, they left Jewish angelology and demonology looking markedly more Iranian on the way out than on the way in.',
  senmurv:'The Senmurv of Sasanian art: dog’s head, lion’s paws, peacock’s tail, and a bird’s wings — an older and stranger form of the Simurgh. It was woven into so much Persian silk that the cloth travelled the whole trade route, and Senmurvs ended up embroidered on the vestments of medieval European bishops who had no idea what they were wearing.',
  gaokerena:'The white haoma, the tree of all seeds, which grows at the bottom of the sea Vourukasha and whose fruit gives immortality at the renovation of the world. Ahriman created a lizard to gnaw at its roots, and ten fish circle it forever, watching the lizard. Everything in this cosmology is somebody’s job.',
  karapan:'The karapans and the kavis are the priests and princes of the older Iranian religion whom Zoroaster attacks by name in the Gāthās — the oldest part of the Avesta, and the part he almost certainly wrote himself. They are, in other words, real opponents in a real argument, preserved by the winning side.',
  nasu:'Nasu, the corpse‑fly, the demon of pollution who rushes into a body at the moment of death. Zoroastrian purity law is built around keeping her away from earth, water and fire, which is why the dead were exposed on towers rather than buried or burned — not from disrespect for the body but from respect for the ground.',
  lamassu:'The human‑headed winged bull that stood at Assyrian and Persian gateways, carved with five legs so that it stands still from the front and walks from the side. Several are in museums. Several more were destroyed with power tools in Mosul in 2015 and filmed for the internet.',
});

LORE.heroes = Object.assign(LORE.heroes||{}, {
  kaveh:'Kāveh the Blacksmith is the most quietly radical thing in the Shāhnāmeh. He is not royal, not descended from anyone, and has no destiny. He is a working man who has been taxed in children, and when he has had enough he tears off his apron, ties it to a spear and holds it up in the street, and the rising that follows is what actually removes Zahhāk — Ferēdūn only finishes the job. The apron becomes the Derafsh‑e Kāviāni, the royal standard of Iran, encrusted with jewels over the centuries, carried in front of the Sasanian armies. It was captured at the battle of al‑Qādisiyyah and cut up for the stones.',
  esther:'Esther — Hadassah — is queen at Susa, and the Book of Esther is the only book of the Hebrew Bible that never once mentions God. Everything in it turns on human timing and human nerve: a woman who has spent years not saying what she is, who is told *who knows whether you have come to the kingdom for such a time as this*, and who walks into the throne room without being summoned knowing the penalty. Iranian Jews have lived there continuously for around 2,700 years, since the deportations that Cyrus later ended — one of the oldest Jewish communities anywhere, and the reason a shrine to Esther and Mordechai stands in Hamadān today.',
});

Object.assign(LORE.essays, {
  royal:`**THE ROYAL ROAD.** Herodotus measured it: 1,677 miles from Sardis to Susa, 111 posting stations, ninety days on foot and about seven for the king's couriers, who rode in relays. He wrote the line about them that ended up carved on a New York post office — that neither snow nor rain nor heat nor gloom of night stays these couriers. He was describing Persians.\n\nThe road in this game runs from a blacksmith's street to the Destructive Spirit, and it deliberately braids two histories that were never actually separate. Cyrus took Babylon in 539 BCE and let the deported peoples go home; the Hebrew Bible calls him God's anointed, *mashiach*, in Isaiah 45 — the only foreigner ever given that word. Esther is queen in Susa. Daniel reads the writing on a Babylonian wall and Persia walks in that night. And the demon Aēshma seems to walk the other way, out of the Avesta and into Jewish literature as Ashmedai.\n\nThis is not a crossover. It is one region, a few centuries, and two peoples who spent them in the same rooms.`,

  erasure:`**ON NOT BEING ERASED.** The Shāhnāmeh is a book about monsters and kings, and it is also a deliberate act of cultural preservation carried out under occupation.\n\nFerdowsī wrote it around 977–1010 CE, three centuries after the Arab conquest of the Sasanian empire, in a period Iranians have long called *do qarn-e sokut* — the two centuries of silence. He wrote in Persian, and he worked hard to keep the Arabic loanwords out, which is why a Persian speaker today can read a thousand-year-old poem more easily than an English speaker can read Chaucer. He took the pre-Islamic material — Zoroastrian cosmology, Zahhāk, Kāveh, the whole Kayanid line — and set it down whole.\n\nAnd he knew what he was doing. The closing couplet is not modest:\n\n*بسی رنج بردم در این سال سی · عجم زنده کردم بدین پارسی*\n\n"I have laboured hard these thirty years — I gave the Persians new life with this Persian." He is claiming, correctly, to have kept a civilisation alive by writing it down.\n\nThat impulse did not stop. The Derafsh-e Kāviāni — a labourer's apron on a spear — was the standard of Iran for a thousand years. Nowrūz has been kept for three thousand and has been discouraged, taxed and banned by more than one authority in that time, and is still kept. This game has a boss called the Lie because Darius put it on a cliff at Bīsotūn: what threatens a country is an army, a famine, and being lied to.`,

  girih:`**A NOTE ON THE PATTERNS.** The tiling behind everything in this game is a real 8-fold *khatam* girih — the star-and-cross construction of Persian architectural ornament, generated here from the {8/3} star polygon rather than copied from anywhere.\n\nIt is usually filed under "Islamic geometric art," and that label is doing something worth naming. The mathematics, the tilework and most of the surviving masterpieces are Persian — made in Isfahan, Kashan, Herat, by craftsmen working in Persian, in a tradition with deep pre-Islamic roots in Sasanian stucco and brick. Much of what gets called the Islamic Golden Age looks like that on inspection: al-Khwārizmī of Khwarazm, whose name is the word algorithm; Ibn Sīnā of Bukhara; Omar Khayyām, who solved cubics and wrote the quatrains.\n\nSo the girih stays, and it is here as Persian work. Alongside it you will find the older languages the same country was using before: the Achaemenid winged disc, the pearl roundels of Sasanian silver, the Persepolis relief with its strict profiles and its square beards, and Old Persian cuneiform along the bottom of every hero's panel. They belong on the same screen because they were made by the same people.`,
});

/* ═══════════════  UNLOCKS  ═══════════════ */
SAVE.unlocked = SAVE.unlocked || {};
if(SAVE.unlocked.kaveh === undefined) SAVE.unlocked.kaveh = true;   // the smith is for everyone

/* ═══════════════  ENGINE HOOKS  ═══════════════
   Three new behaviours. Each wraps an existing function rather than editing
   the combat core, so the tested paths stay exactly as tested. */

/* Mordechai at the gate: a Concealed card every turn */
const _playerTurnStart_road2 = playerTurnStart;
playerTurnStart = function(first){
  _playerTurnStart_road2(first);
  if(G && !G.over && G.p.buffs.gate){
    G.api.buffP('concealed', 1);
    if(G.p.buffs.gate>=2) G.api.blk(G.p.buffs.concealed||0, {raw:true});
  }
};

/* Mithra's contract: the sworn word pays out when somebody breaks it */
const _onFoeDeath_road2 = onFoeDeath;
onFoeDeath = function(foe){
  _onFoeDeath_road2(foe);
  if(G && !G.over && G.p.buffs.mithra){
    G.api.farr(G.p.buffs.mithra);
    G.api.blk(G.p.buffs.mithra*3, {raw:true});
  }
};

/* The scroll of Esther: one refusal to die, per fight */
const _checkDeath_road2 = checkDeath;
checkDeath = function(){
  if(G && G.p.hp<=0 && G.p.buffs.megillah){
    delete G.p.buffs.megillah;
    G.p.hp = 1;
    G.api.draw(3);
    G.msg.push('“If I perish, I perish.” Not today.');
    G.anims.push({t:'feather'});
    return false;
  }
  return _checkDeath_road2();
};

/* ═══════════════  ART  ═══════════════ */
Object.assign(PLATE.CREATURES, {
  taxman:   {form:'humanoid', hue:'ash',   beard:true, weapon:'spear'},
  liar:     {form:'amorph',   hue:'void',  lobes:10, eyes:2},
  lamassu:  {form:'quad',     hue:'sand',  head:'human', wings:'feather', build:1.1, tail:'tuft'},
  karapan:  {form:'humanoid', hue:'ivy',   robe:true, beard:true, armOut:true},
  nasu:     {form:'insect',   hue:'ivy',   segs:3, sting:true},
  satrap:   {form:'humanoid', hue:'lapis', robe:true, beard:true, crown:true},
  aeshma:   {form:'humanoid', hue:'blood', head:'horned', horn:'ram', weapon:'mace', extraArms:true},
  jahi:     {form:'humanoid', hue:'rose',  hair:'long', veil:true, robe:true},
  sleepless:{form:'humanoid', hue:'night', weapon:'spear', shield:true, helm:true},
  senmurv:  {form:'bird',     hue:'gilt',  crest:true},
  gaokerena:{form:'serpent',  hue:'verdi', horn:'spike'},

  herald:   {form:'humanoid', hue:'ash',   robe:true, beard:true, crown:true, boss:true},
  zahhak:   {form:'humanoid', hue:'void',  head:'human', crown:true, beard:true, weapon:'sword', boss:true, serpents:true},
  chinvat:  {form:'amorph',   hue:'silver',lobes:16, eyes:1, boss:true},
  haman:    {form:'humanoid', hue:'blood', robe:true, beard:true, crown:true, boss:true},
  wall:     {form:'stone',    hue:'gilt',  eyes:false, boss:true},
  druj:     {form:'amorph',   hue:'night', lobes:13, eyes:3, boss:true},
  ahriman:  {form:'humanoid', hue:'void',  head:'horned', horn:'curl', extraArms:true, wings:'bat', boss:true},
});
Object.assign(PLATE.HEROES_ART, {
  kaveh:  {hue:'flame',  weapon:'mace', beard:true, hair:'long'},
  esther: {hue:'rose',   robe:true, veil:true, hair:'long', crown:true},
});

/* each new rider sets out with something of their own */
STARTING_TALISMAN.kaveh  = 'armaiti';    // the ground under a working man
STARTING_TALISMAN.esther = 'vohu';       // the Good Mind, which is her whole method

Object.assign(LORE.tals, {
  vohu:'Vohu Manah — the Good Mind, or Good Purpose. The first of the Amesha Spentas, and the one who meets the soul of the righteous at the Chinvat Bridge and shows them to their seat. In the Gāthās, Zoroaster describes his own revelation as Vohu Manah taking him by the hand.',
  asha:'Asha Vahishta — Best Truth, or Best Order. Asha is the single most important word in Zoroastrianism: the right pattern of things, cosmic and moral at once, the opposite of the Lie. Its physical form is fire, which is why the fire in a Zoroastrian temple is not worshipped but faced.',
  khshathra:'Khshathra Vairya — Desirable Dominion. Power as it *ought* to be exercised, whose physical form is metal and stone. The molten river that purifies the world at the end of time is his.',
  armaiti:'Spenta Armaiti — Holy Devotion, and the earth itself. Ploughing well and treating the ground properly is not a metaphor for piety in this religion; it is the thing itself. Working the land is an act of worship.',
  haurvatat:'Haurvatāt — Wholeness or Health, whose physical form is water. She is almost always named alongside Ameretāt, and the pair of them are why water and plants are treated as things you can pollute morally as well as physically.',
  ameretat:'Ameretāt — Immortality, whose physical form is the plants. At the Frashokereti, when the world is made wonderful again, it is Haurvatāt and Ameretāt who make the resurrected bodies whole.',
  cylinder:'A barrel of clay in the British Museum, inscribed in Akkadian after Cyrus took Babylon in 539 BCE. It records him restoring temples and returning deported peoples and their gods to their homes. In 1971 the Shah’s government called it the first charter of human rights and the UN was given a replica — a twentieth-century reading that most Assyriologists think is too generous, since the form is a standard Mesopotamian building inscription. What is not in doubt is the policy: the exiles went home, and Ezra records Cyrus paying for the Second Temple, and Isaiah 45 calls him *mashiach*, anointed — a word the Hebrew Bible gives to no other foreigner.',
  apron:'The Derafsh-e Kāviāni: a blacksmith’s leather apron tied to a spear. It became the royal standard of Iran and stayed so for something like a thousand years, growing jewels and gold with each dynasty, carried before the Sasanian armies. It was taken at the battle of al-Qādisiyyah in 636 CE and broken up for the stones. A working man’s apron, and then the flag of an empire, and then loot.',
  megillah:'The Megillah — the scroll of Esther, read aloud at Purim while the congregation makes as much noise as possible every time Haman is named, to blot the name out. It is the only book in the Hebrew Bible that never mentions God, and one of only two named for a woman.',
  hamadan:'Hamadān, ancient Ecbatana, capital of the Medes. A small brick-domed shrine there is held to be the tomb of Esther and Mordechai and has been a pilgrimage site for centuries. Iran has had a continuous Jewish community for roughly 2,700 years — one of the oldest anywhere — and it is still, though much reduced, there.',
  faravahar:'The winged disc above every Achaemenid king at Persepolis and Naqsh-e Rostam. What it depicts has been argued about for 2,500 years: Ahura Mazda himself, or the royal *khvarenah* — the divine glory, the Farr this game is built on — or a *fravashi*, the pre-existing guardian soul each person has. It is now the commonest secular emblem of Iranian identity worldwide, worn by people of every religion and none.',
  nowruz:'Nowrūz — "new day" — the spring equinox, kept for at least three thousand years and older than every religion currently practised in Iran. The *haft-sīn* is a cloth laid with seven things beginning with the Persian letter sīn, one of which is *sabzeh*, a dish of sprouted wheat you grow for the occasion and then throw into running water on the thirteenth day.',
});

Object.assign(LORE.foes, {
  taxman:'Not a demon: a man with a list. Ferdowsī is unusually interested in the administration of Zahhāk’s horror — the quota, the officials, the daily normality of it — and considerably less interested in the serpents themselves.',
  liar:'*Drug* in miniature. Zoroastrian ethics runs on good thoughts, good words, good deeds, in that order, and the small lie is where the order starts to come apart.',
  satrap:'A satrap was the governor of an Achaemenid province — from Old Persian *xšaçapāvan*, "protector of the realm." The empire ran on about twenty of them and on a road system fast enough that the king found out what they had done.',
  sleepless:'The palace guard at Susa. The Immortals were the royal ten thousand; these are the ordinary night watch, who are simply awake, in the dark, doing their job, which on the whole is worse.',
  jahi:'Jahī, the demoness whose kiss wakes Ahriman from the three thousand years of stupor into which Ahura Mazda’s prayer threw him. The Bundahišn’s treatment of her is one of the more openly misogynist passages in the tradition, and it is included here as it stands rather than tidied up.',
});
Object.assign(PLATE.CREATURES, { hatchling:{form:'serpent', hue:'ivy'} });
LORE.foes.hatchling = 'Ferdowsī is specific and horrible about the serpents: cut one off and two grow back, so Zahhāk’s physicians give up and the Devil — disguised as a doctor — helpfully suggests the only diet that soothes them.';
