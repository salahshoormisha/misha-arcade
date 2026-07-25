/* MISHANAMEH — Talismans (طلسم). Relics you carry for the whole run.
   mods: passive numbers the engine reads.
   Hooks: pickup(R) combatStart(G) turnStart(G) turnEnd(G) play(G,card)
          hurt(G,n) kill(G,foe) invoke(G) combatEnd(R) trialEnd(R) rest(R) */

const TALISMANS = {};
function T(d){ TALISMANS[d.id]=d; return d; }

/* ── COMMON ── */
T({ id:'bridle', name:"Rakhsh's Bridle", fa:'لگام رخش', art:'🐎', rarity:'common',
  text:'On the first turn of each combat, gain 1 Energy.',
  combatStart:(G)=>{ G.p.firstTurnEnergy = (G.p.firstTurnEnergy||0)+1; } });

T({ id:'saffron_vial', name:'Vial of Saffron', fa:'شیشهٔ زعفران', art:'🧪', rarity:'common',
  text:'After each combat, heal 6 HP.', combatEnd:(R,G)=>G.healRun(6) });

T({ id:'nightfeather', name:"Nightingale's Feather", fa:'پر بلبل', art:'🪶', rarity:'common',
  text:'Start each combat with 2 Farr.', combatStart:(G)=>G.farr(2) });

T({ id:'turquoise', name:'Turquoise of Nishāpur', fa:'فیروزهٔ نیشابور', art:'💎', rarity:'common',
  text:'At the start of each turn, gain 3 Block.', turnStart:(G)=>G.blk(3,{raw:true}) });

T({ id:'silksash', name:'Silk Sash', fa:'شال ابریشم', art:'🎀', rarity:'common',
  text:'The first time you take damage each combat, gain 9 Block.',
  hurt:(G,n,self)=>{ if(!self._used){ self._used=true; G.blk(9,{raw:true}); } },
  combatStart:(G,self)=>{ self._used=false; } });

T({ id:'ramshorn', name:"Ram's Horn", fa:'شاخ قوچ', art:'🐏', rarity:'common',
  text:'Start each combat with 6 Block.', combatStart:(G)=>G.blk(6,{raw:true}) });

T({ id:'whetstone_t', name:'Old Whetstone', fa:'سنگ فسان', art:'🪨', rarity:'common',
  text:'Your first attack each combat deals 6 more damage.',
  combatStart:(G)=>{ G.p.buffs.whet=6; G.p.buffs.whetN=1; } });

T({ id:'purse', name:'A Heavy Purse', fa:'کیسهٔ زر', art:'💰', rarity:'common',
  text:'Gain 100 dirhams when you find it.', pickup:(R)=>{ R.gold += 100; } });

T({ id:'reed', name:"Ferdowsī's Reed", fa:'قلم فردوسی', art:'🖋️', rarity:'common',
  text:'Card rewards offer one extra choice.', mods:{ rewardCards:1 } });

T({ id:'kettle', name:'Copper Kettle', fa:'کتری مسی', art:'🫖', rarity:'common',
  text:'Camps heal 12 more HP.', mods:{ restBonus:12 } });

/* ── UNCOMMON ── */
T({ id:'feather', name:'Simurgh Feather', fa:'پر سیمرغ', art:'🪶', rarity:'uncommon',
  text:'Once per run: when you would die, heal to 45% of your maximum HP instead.',
  glow:true });

T({ id:'jamcup', name:"Jamshid's Cup", fa:'جام جم', art:'🏆', rarity:'uncommon',
  text:'You can see each enemy’s move after the one they are telegraphing.', mods:{ foresight:1 } });

T({ id:'banner_t', name:'Kāviānī Banner', fa:'درفش کاویانی', art:'🚩', rarity:'uncommon',
  text:'Start each combat with 2 Strength.', combatStart:(G)=>G.buffP('str',2) });

T({ id:'brokenchain', name:'The Broken Chain', fa:'زنجیر گسسته', art:'⛓️', rarity:'uncommon',
  text:'Enemies start each combat with 2 Weak.', combatStart:(G)=>G.buffAll('weak',2) });

T({ id:'locket', name:"Tahmineh's Locket", fa:'مدال تهمینه', art:'📿', rarity:'uncommon',
  text:'Whenever you Invoke the Simurgh, heal 10 HP.', invoke:(G)=>G.heal(10) });

T({ id:'ram', name:'The Ram of the Spring', fa:'قوچ چشمه', art:'🐐', rarity:'uncommon',
  text:'Once per combat, the first time you fall below 25% HP, gain 22 Block and heal 12.',
  combatStart:(G,self)=>{ self._used=false; },
  hurt:(G,n,self)=>{ if(!self._used && G.p.hp>0 && G.p.hp < G.p.maxHp*0.25){ self._used=true; G.blk(22,{raw:true}); G.heal(12); G.say('The ram appears.'); } } });

T({ id:'rope', name:"Ulād's Rope", fa:'کمند اولاد', art:'🪢', rarity:'uncommon',
  text:'Elites and minions start each combat with 25% less HP.', mods:{ eliteCut:0.25 } });

T({ id:'cypressseed', name:'Cypress Seed', fa:'تخم سرو', art:'🌱', rarity:'uncommon',
  text:'Start each combat with 2 Agility.', combatStart:(G)=>G.buffP('agi',2) });

T({ id:'saltkavir', name:'Salt of the Kavīr', fa:'نمک کویر', art:'🧂', rarity:'uncommon',
  text:'Whenever you apply Venom, apply 2 more.', mods:{ venomPlus:2 } });

T({ id:'mirror', name:"Iskandar's Mirror", fa:'آینهٔ اسکندر', art:'🪞', rarity:'uncommon',
  text:'Start each combat with Ward 1 — it eats the first debuff thrown at you.',
  combatStart:(G)=>G.buffP('ward',1) });

T({ id:'lantern', name:'Bazaar Lantern', fa:'فانوس بازار', art:'🏮', rarity:'uncommon',
  text:'Everything in the Bazaar costs 25% less, and there is one more of it.',
  mods:{ shopDiscount:0.25, shopExtra:1 } });

/* ── RARE ── */
T({ id:'crown', name:'Crown of the Kayanids', fa:'تاج کیانی', art:'👑', rarity:'rare',
  text:'You Invoke the Simurgh at 7 Farr instead of 10.', mods:{ maxFarr:-3 }, glow:true });

T({ id:'cradle', name:"Rostam's Cradle", fa:'گهوارهٔ رستم', art:'🛏️', rarity:'rare',
  text:'Gain 22 maximum HP when you find it. (He was a very large baby.)',
  pickup:(R)=>{ R.maxHp += 22; R.hp += 22; } });

T({ id:'armlet', name:"Sohrab's Armlet", fa:'بازوبند سهراب', art:'💫', rarity:'rare',
  text:'Whenever an enemy dies, heal 7 HP.', kill:(G)=>G.heal(7) });

T({ id:'apron', name:"The Blacksmith's Apron", fa:'پیشبند آهنگر', art:'🔨', rarity:'rare',
  text:'Cards that hit ALL enemies deal 5 more damage.', mods:{ aoePlus:5 } });

T({ id:'neststone', name:'Nest‑Warm Stone', fa:'سنگ آشیانه', art:'🥚', rarity:'rare',
  text:'Whenever you Invoke the Simurgh, gain 2 Energy and draw 2.',
  invoke:(G)=>{ G.energy(2); G.draw(2); } });

T({ id:'thread', name:"Shahrzād's Thread", fa:'نخ شهرزاد', art:'🧵', rarity:'rare',
  text:'Draw 1 extra card each turn. Lose 1 HP at the start of each turn.',
  mods:{ drawPlus:1 }, turnStart:(G)=>G.loseHp(1) });

T({ id:'pen', name:"Ferdowsī's Pen", fa:'خامهٔ فردوسی', art:'✒️', rarity:'rare',
  text:'When you clear a Trial, add a random rare card of your class to your deck.',
  trialEnd:(R)=>R.grantRandomRare() });

/* ── BOSS TALISMANS (Trial rewards) ── */
T({ id:'pelt', name:"Lion's Pelt", fa:'پوست شیر', art:'🦁', rarity:'boss',
  text:'Gain 25 maximum HP. Enemies start each combat with 1 Strength.',
  pickup:(R)=>{ R.maxHp+=25; R.hp+=25; }, combatStart:(G)=>G.buffAll('str',1) });

T({ id:'waterskin', name:'Waterskin of the Ram', fa:'مشک آب', art:'🫗', rarity:'boss',
  text:'Heal 18 HP after every combat. Start each combat with 1 less Energy on turn one.',
  combatEnd:(R,G)=>G.healRun(18), combatStart:(G)=>{ G.p.firstTurnEnergy=(G.p.firstTurnEnergy||0)-1; } });

T({ id:'dragoneye', name:"Dragon's Eye", fa:'چشم اژدها', art:'👁️', rarity:'boss',
  text:'Gain 1 Energy at the start of each turn. Draw 1 fewer card each turn.',
  mods:{ energyPlus:1, drawPlus:-1 }, glow:true });

T({ id:'witchring', name:"The Enchantress's Ring", fa:'انگشتر جادو', art:'💍', rarity:'boss',
  text:'At the start of each combat, add a random rare card to your hand. It exhausts.',
  combatStart:(G)=>G.addRandomRareToHand() });

T({ id:'oath', name:"Ulād's Oath", fa:'سوگند اولاد', art:'🤝', rarity:'boss',
  text:'Start each combat with Companion 8 — it strikes for you at the end of every turn.',
  combatStart:(G)=>G.buffP('companion',8) });

T({ id:'horn', name:"Arzhang's Horn", fa:'شاخ ارژنگ', art:'📯', rarity:'boss',
  text:'Start each combat with 4 Strength and 3 Frail.',
  combatStart:(G)=>{ G.buffP('str',4); G.buffP('frail',3); } });

T({ id:'palehand', name:'The Pale Hand', fa:'دست سپید', art:'🤍', rarity:'boss',
  text:'Your attacks deal 40% more damage to enemies at full health.', mods:{ openerPlus:0.4 }, glow:true });

/* ── SECRET ── */
T({ id:'hilt', name:'A Broken Hilt', fa:'دستهٔ شکسته', art:'🗡️', rarity:'secret',
  text:'Rusted, snapped, and older than the road. Carry it past Trial VII and a gate you were not told about will be open.',
  glow:true });

T({ id:'eighthring', name:'The Eighth Ring', fa:'انگشتر هشتم', art:'💍', rarity:'secret',
  text:'Gain 2 Energy at the start of each turn. After every combat, a Doubt joins your deck. It is not a fair trade and you will take it anyway.',
  mods:{ energyPlus:2 }, combatEnd:(R)=>R.addCardToDeck('c_doubt'), glow:true });

/* Pools */
function talismanPool(rarity){ return Object.values(TALISMANS).filter(t=>t.rarity===rarity); }
const BOSS_TALISMANS = ['pelt','waterskin','dragoneye','witchring','oath','horn','palehand'];
