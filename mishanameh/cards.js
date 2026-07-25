/* MISHANAMEH — card definitions
   Every card: { id, name, fa, hero, type, cost, rarity, t(up)->text, fx(G,c), ... }
   G = combat API (see engine.js). c = { up, target }
   hero: 'rostam' | 'gord' | 'zal' | 'any' | 'status'
   type: 'attack' | 'skill' | 'power' | 'status' | 'curse'
*/

const CARDS = {};
function C(def) { CARDS[def.id] = def; return def; }

/* ─────────────────────────────  ROSTAM — the Champion  ─────────────────────────────
   Strength, punishment, standing in the road and refusing to move. */

C({ id:'r_strike', name:'Shamshir', fa:'شمشیر', hero:'rostam', type:'attack', cost:1, rarity:'basic',
  targeted:true, t:u=>`Deal ${u?11:7} damage.`, fx:(G,c)=>G.dmg(c.target, c.up?11:7) });

C({ id:'r_guard', name:'Sipar', fa:'سپر', hero:'rostam', type:'skill', cost:1, rarity:'basic',
  t:u=>`Gain ${u?8:5} Block.`, fx:(G,c)=>G.blk(c.up?8:5) });

C({ id:'r_gorz', name:'Gorz‑e Gāvsar', fa:'گرز گاوسر', hero:'rostam', type:'attack', cost:2, rarity:'uncommon',
  targeted:true, flavor:'The ox‑headed mace of Sām. It has never been put down gently.',
  t:u=>`Deal ${u?25:19} damage. Lose 3 HP.`, fx:(G,c)=>{ G.dmg(c.target, c.up?25:19); G.loseHp(3); } });

C({ id:'r_sam', name:"Sām's Legacy", fa:'میراث سام', hero:'rostam', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?10:7} damage. If this kills, gain 2 Strength.`,
  fx:(G,c)=>{ const k=G.dmg(c.target, c.up?10:7); if(k) G.buffP('str',2); } });

C({ id:'r_roar', name:'Roar of Zābol', fa:'غرش زابل', hero:'rostam', type:'skill', cost:1, rarity:'common',
  targeted:true, t:u=>`Apply ${u?3:2} Vulnerable.`, fx:(G,c)=>G.buffF(c.target,'vuln',c.up?3:2) });

C({ id:'r_charge', name:"Rakhsh's Charge", fa:'تاخت رخش', hero:'rostam', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?7:5} damage twice.`,
  fx:(G,c)=>{ const n=c.up?7:5; G.dmg(c.target,n); G.dmg(c.target,n); } });

C({ id:'r_bear', name:'Bear the Blow', fa:'تاب آوردن', hero:'rostam', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?14:10} Block. Gain ${u?2:1} Farr.`, fx:(G,c)=>{ G.blk(c.up?14:10); G.farr(c.up?2:1); } });

C({ id:'r_blood', name:'Blood of Sām', fa:'خون سام', hero:'rostam', type:'skill', cost:0, rarity:'uncommon',
  flavor:'His grandfather bled for less.',
  t:u=>`Lose ${u?2:4} HP. Gain 2 Strength.`, fx:(G,c)=>{ G.loseHp(c.up?2:4); G.buffP('str',2); } });

C({ id:'r_unyield', name:'Unyielding', fa:'ناشکیب', hero:'rostam', type:'power', cost:2, rarity:'rare',
  flavor:'The mountain does not clear the road. The road goes around.',
  t:u=>u?`At the end of your turn, keep all your Block.`:`At the end of your turn, keep half your Block.`,
  fx:(G,c)=>G.buffP(c.up?'barricade':'halfguard',1) });

C({ id:'r_haft', name:'Haft Khān', fa:'هفت خوان', hero:'rostam', type:'attack', cost:2, rarity:'rare',
  targeted:true, flavor:'Every trial you survive sharpens the next blow.',
  t:u=>`Deal ${u?8:6} damage. Hits once more for each Trial you have cleared this run.`,
  fx:(G,c)=>{ const n=c.up?8:6, hits=1+G.trialsCleared(); for(let i=0;i<hits;i++) G.dmg(c.target,n); } });

C({ id:'r_split', name:'Div‑Splitter', fa:'دیوشکاف', hero:'rostam', type:'attack', cost:2, rarity:'uncommon',
  targeted:true, t:u=>`Deal ${u?19:14} damage. If this kills, gain 2 Strength and 1 Energy.`,
  fx:(G,c)=>{ const k=G.dmg(c.target,c.up?19:14); if(k){ G.buffP('str',2); G.energy(1);} } });

C({ id:'r_bind', name:'Bind the Demon', fa:'بند دیو', hero:'rostam', type:'skill', cost:1, rarity:'uncommon',
  targeted:true, exhaust:true, t:u=>`Apply ${u?4:3} Weak and ${u?4:3} Vulnerable. Exhaust.`,
  fx:(G,c)=>{ const n=c.up?4:3; G.buffF(c.target,'weak',n); G.buffF(c.target,'vuln',n); } });

C({ id:'r_kaveh', name:"Kaveh's Fury", fa:'خشم کاوه', hero:'rostam', type:'attack', cost:2, rarity:'rare',
  targeted:true, flavor:'A blacksmith raised his apron on a spear and an empire fell.',
  t:u=>`Deal damage equal to 5 plus ${u?6:4} × your Strength.`,
  fx:(G,c)=>G.dmg(c.target, 5 + (c.up?6:4)*Math.max(0,G.p.buffs.str||0), {raw:true}) });

C({ id:'r_rears', name:'Rakhsh Rears', fa:'رخش برخاست', hero:'rostam', type:'attack', cost:2, rarity:'common',
  targeted:true, t:u=>`Gain ${u?13:9} Block. Deal ${u?13:9} damage.`,
  fx:(G,c)=>{ G.blk(c.up?13:9); G.dmg(c.target,c.up?13:9); } });

C({ id:'r_lungs', name:'Iron Lungs', fa:'شش آهنین', hero:'rostam', type:'power', cost:1, rarity:'uncommon',
  t:u=>`Whenever you lose HP from a card, gain ${u?2:1} Strength.`, fx:(G,c)=>G.buffP('ironlungs',c.up?2:1) });

C({ id:'r_taham', name:'Tahamtan', fa:'تهمتن', hero:'rostam', type:'power', cost:2, rarity:'rare',
  flavor:'“The mighty‑bodied.” It is not a compliment. It is a warning.',
  t:u=>`Gain ${u?3:2} Strength. Whenever you gain Farr, gain that much Block.`,
  fx:(G,c)=>{ G.buffP('str',c.up?3:2); G.buffP('farrguard',1); } });

C({ id:'r_sleep', name:'Sleep of Rostam', fa:'خواب رستم', hero:'rostam', type:'skill', cost:1, rarity:'uncommon',
  flavor:'He slept through the lion. Rakhsh handled it.',
  t:u=>`Gain ${u?29:22} Block. Next turn, draw 2 fewer cards.`,
  fx:(G,c)=>{ G.blk(c.up?29:22); G.buffP('drowsy',2); } });

C({ id:'r_banner', name:'Derafsh‑e Kāviāni', fa:'درفش کاویانی', hero:'rostam', type:'power', cost:2, rarity:'rare',
  flavor:'The apron of a blacksmith, hung with jewels, carried into every war since.',
  t:u=>`At the start of your turn, gain ${u?2:1} Farr and ${u?5:4} Block.`,
  fx:(G,c)=>{ G.buffP('banner',c.up?2:1); } });

C({ id:'r_alborz', name:'Weight of Alborz', fa:'گرانی البرز', hero:'rostam', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Gain ${u?5:4} Block for each card in your hand.`,
  fx:(G,c)=>G.blk((c.up?5:4)*G.hand.length) });

C({ id:'r_ranks', name:'Break the Ranks', fa:'شکستن صف', hero:'rostam', type:'attack', cost:1, rarity:'common',
  t:u=>`Deal ${u?10:7} damage to ALL enemies.`, fx:(G,c)=>G.dmgAll(c.up?10:7) });

/* ─────────────────────────────  GORDĀFARID — the Warrior‑Maiden  ─────────────────────────────
   Guile, venom, tempo. She beat Sohrab with a lie and a fast horse. */

C({ id:'g_strike', name:'Tir', fa:'تیر', hero:'gord', type:'attack', cost:1, rarity:'basic',
  targeted:true, t:u=>`Deal ${u?9:6} damage.`, fx:(G,c)=>G.dmg(c.target, c.up?9:6) });

C({ id:'g_guard', name:'Parry', fa:'دفاع', hero:'gord', type:'skill', cost:1, rarity:'basic',
  t:u=>`Gain ${u?8:5} Block.`, fx:(G,c)=>G.blk(c.up?8:5) });

C({ id:'g_feint', name:'Feint', fa:'فریب', hero:'gord', type:'attack', cost:0, rarity:'common',
  targeted:true, t:u=>`Deal ${u?6:4} damage. Draw 1 card.`,
  fx:(G,c)=>{ G.dmg(c.target,c.up?6:4); G.draw(1); } });

C({ id:'g_veiled', name:'Veiled Blade', fa:'تیغ پنهان', hero:'gord', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?7:5} damage. Apply ${u?4:3} Venom.`,
  fx:(G,c)=>{ G.dmg(c.target,c.up?7:5); G.buffF(c.target,'venom',c.up?4:3); } });

C({ id:'g_wind', name:'Ride Like the Wind', fa:'چون باد', hero:'gord', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?10:7} Block. Gain 1 Agility.`, fx:(G,c)=>{ G.blk(c.up?10:7); G.buffP('agi',1); } });

C({ id:'g_unhorse', name:'Unhorse', fa:'از زین انداختن', hero:'gord', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?12:9} damage. Apply ${u?3:2} Weak.`,
  fx:(G,c)=>{ G.dmg(c.target,c.up?12:9); G.buffF(c.target,'weak',c.up?3:2); } });

C({ id:'g_dust', name:'Dust Cloud', fa:'گرد و خاک', hero:'gord', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Apply ${u?3:2} Weak to ALL enemies.`, fx:(G,c)=>G.buffAll('weak',c.up?3:2) });

C({ id:'g_serpent', name:"Serpent's Kiss", fa:'بوسهٔ مار', hero:'gord', type:'skill', cost:1, rarity:'uncommon',
  targeted:true, t:u=>`Apply ${u?10:7} Venom.`, fx:(G,c)=>G.buffF(c.target,'venom',c.up?10:7) });

C({ id:'g_sohrab', name:"Sohrab's Blush", fa:'شرم سهراب', hero:'gord', type:'skill', rarity:'rare',
  cost:2, upCost:1, targeted:true, exhaust:true,
  flavor:'She took off her helmet. He forgot, entirely, what he had come to do.',
  t:u=>`Stun target: it does nothing on its next turn. Exhaust.`,
  fx:(G,c)=>G.buffF(c.target,'stun',1) });

C({ id:'g_quiver', name:'Quiver', fa:'ترکش', hero:'gord', type:'power', cost:1, rarity:'rare',
  t:u=>`Each turn, when you play your 3rd card, deal ${u?9:7} damage to a random enemy.`,
  fx:(G,c)=>G.buffP('quiver',c.up?9:7) });

C({ id:'g_braid', name:'Braid Unbound', fa:'گیسو گشوده', hero:'gord', type:'skill', cost:0, rarity:'uncommon',
  t:u=>`Draw ${u?4:3} cards. Discard 1 card.`, fx:(G,c)=>{ G.draw(c.up?4:3); G.discardChoose(1); } });

C({ id:'g_whet', name:'Whetstone', fa:'سنگ تیزکن', hero:'gord', type:'skill', cost:0, rarity:'common', exhaust:true,
  t:u=>`Your next 2 attacks deal ${u?6:4} more damage. Exhaust.`,
  fx:(G,c)=>{ G.buffP('whet',c.up?6:4); G.buffP('whetN',2); } });

C({ id:'g_vanish', name:'Vanish', fa:'ناپدید', hero:'gord', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?15:11} Block. Discard 1 card.`, fx:(G,c)=>{ G.blk(c.up?15:11); G.discardChoose(1); } });

C({ id:'g_well', name:'Poisoned Well', fa:'چاه زهرآلود', hero:'gord', type:'skill', cost:2, rarity:'uncommon',
  t:u=>`Apply ${u?6:4} Venom to ALL enemies.`, fx:(G,c)=>G.buffAll('venom',c.up?6:4) });

C({ id:'g_turn', name:'Turn the Charge', fa:'برگرداندن حمله', hero:'gord', type:'attack', cost:1, rarity:'uncommon',
  targeted:true, t:u=>`Deal damage equal to ${u?'1½×':''} your Block.`,
  fx:(G,c)=>G.dmg(c.target, Math.floor(G.p.block*(c.up?1.5:1)), {raw:true}) });

C({ id:'g_night', name:'Nightfall', fa:'شبانگاه', hero:'gord', type:'power', cost:1, rarity:'uncommon',
  t:u=>`At the end of your turn, if your hand is empty, draw ${u?2:1} and gain 1 Farr.`,
  fx:(G,c)=>G.buffP('nightfall',c.up?2:1) });

C({ id:'g_reins', name:'Split the Reins', fa:'دو افسار', hero:'gord', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?5:4} damage three times.`,
  fx:(G,c)=>{ const n=c.up?5:4; for(let i=0;i<3;i++) G.dmg(c.target,n); } });

C({ id:'g_gate', name:'Castle Gate', fa:'دروازهٔ دژ', hero:'gord', type:'skill', cost:2, rarity:'uncommon',
  flavor:'She rode in, barred it behind her, and laughed at him from the wall.',
  t:u=>u?`Gain 24 Block.`:`Gain 22 Block. Gain 1 Frail.`,
  fx:(G,c)=>{ G.blk(c.up?24:22); if(!c.up) G.buffP('frail',1); } });

C({ id:'g_silk', name:'Dagger Through Silk', fa:'خنجر در ابریشم', hero:'gord', type:'attack', cost:1, rarity:'rare',
  targeted:true, t:u=>`Deal ${u?5:4} damage, plus ${u?4:3} for each Venom on the target.`,
  fx:(G,c)=>G.dmg(c.target,(c.up?5:4)+(c.up?4:3)*(c.target.buffs.venom||0)) });

C({ id:'g_wager', name:"Gordāfarid's Wager", fa:'شرط گردآفرید', hero:'gord', type:'attack', cost:2, rarity:'rare',
  targeted:true, t:u=>`Deal ${u?32:25} damage. If the enemy survives, lose 8 HP.`,
  fx:(G,c)=>{ const k=G.dmg(c.target,c.up?32:25); if(!k) G.loseHp(8); } });

/* ─────────────────────────────  ZĀL — Raised by the Simurgh  ─────────────────────────────
   Farr, feathers, patience. Born white‑haired and left on a mountain; a bird raised him better. */

C({ id:'z_strike', name:'Rod of Alborz', fa:'چوب البرز', hero:'zal', type:'attack', cost:1, rarity:'basic',
  targeted:true, t:u=>`Deal ${u?9:6} damage.`, fx:(G,c)=>G.dmg(c.target, c.up?9:6) });

C({ id:'z_guard', name:'Mantle', fa:'ردا', hero:'zal', type:'skill', cost:1, rarity:'basic',
  t:u=>`Gain ${u?8:5} Block.`, fx:(G,c)=>G.blk(c.up?8:5) });

C({ id:'z_down', name:"Simurgh's Down", fa:'پر سیمرغ', hero:'zal', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?11:8} Block. Gain ${u?2:1} Farr.`, fx:(G,c)=>{ G.blk(c.up?11:8); G.farr(c.up?2:1); } });

C({ id:'z_white', name:'White Hair', fa:'موی سپید', hero:'zal', type:'power', cost:1, rarity:'uncommon',
  flavor:'They left him on the mountain for it. The mountain disagreed.',
  t:u=>`At the start of your turn, gain ${u?2:1} Farr.`, fx:(G,c)=>G.buffP('whitehair',c.up?2:1) });

C({ id:'z_call', name:'Feather Call', fa:'خواندن پر', hero:'zal', type:'skill', cost:1, rarity:'common',
  t:u=>`Draw ${u?3:2} cards. If you have 5 or more Farr, draw ${u?2:1} more.`,
  fx:(G,c)=>{ G.draw(c.up?3:2); if(G.p.farr>=5) G.draw(c.up?2:1); } });

C({ id:'z_light', name:'Light of Alborz', fa:'فروغ البرز', hero:'zal', type:'attack', cost:1, rarity:'uncommon',
  targeted:true, t:u=>`Deal damage equal to ${u?4:3} × your Farr.`,
  fx:(G,c)=>G.dmg(c.target,(c.up?4:3)*G.p.farr) });

C({ id:'z_burn', name:'Burn the Feather', fa:'سوزاندن پر', hero:'zal', type:'attack', cost:1, rarity:'rare',
  targeted:true, exhaust:true, flavor:'She said: burn it, and I will come. She meant it.',
  t:u=>`Lose 5 Farr. Deal ${u?42:32} damage. Exhaust.`,
  fx:(G,c)=>{ if(G.p.farr<5){ G.say('Not enough Farr.'); return false; } G.farr(-5); G.dmg(c.target,c.up?42:32); },
  playable:(G)=>G.p.farr>=5 });

C({ id:'z_nest', name:'Nest on the Peak', fa:'آشیانه', hero:'zal', type:'power', cost:1, rarity:'rare',
  t:u=>`Whenever you Invoke the Simurgh, heal ${u?12:8} and draw 2.`,
  fx:(G,c)=>G.buffP('nest',c.up?12:8) });

C({ id:'z_chant', name:'Chant of Mehr', fa:'سرود مهر', hero:'zal', type:'skill', cost:1, rarity:'common',
  t:u=>`Apply ${u?3:2} Weak to ALL enemies. Gain 2 Farr.`,
  fx:(G,c)=>{ G.buffAll('weak',c.up?3:2); G.farr(2); } });

C({ id:'z_wisdom', name:'Wisdom of the Bird', fa:'دانش مرغ', hero:'zal', type:'skill', cost:0, rarity:'uncommon',
  t:u=>`Upgrade a card in your hand for the rest of combat.${u?'':' Exhaust.'}`,
  exhaust:true, upNoExhaust:true, fx:(G,c)=>G.upgradeInHand() });

C({ id:'z_riddle', name:'The Three Riddles', fa:'سه چیستان', hero:'zal', type:'skill', cost:0, rarity:'rare',
  flavor:'The priests asked him three. He answered them in verse, because of course he did.',
  t:u=>`Gain 1 Energy. Draw 1. Gain 1 Farr.${u?'':' Exhaust.'}`,
  exhaust:true, upNoExhaust:true, fx:(G,c)=>{ G.energy(1); G.draw(1); G.farr(1); } });

C({ id:'z_fire', name:'Mehregān Fire', fa:'آتش مهرگان', hero:'zal', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Apply ${u?6:4} Ember to ALL enemies.`, fx:(G,c)=>G.buffAll('ember',c.up?6:4) });

C({ id:'z_ward', name:'Sky‑Ward', fa:'سپر آسمان', hero:'zal', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Gain ${u?8:6} Block and Ward ${u?3:2}.`, fx:(G,c)=>{ G.blk(c.up?8:6); G.buffP('ward',c.up?3:2); } });

C({ id:'z_rakhsh', name:'Rise, Rakhsh', fa:'برخیز رخش', hero:'zal', type:'skill', cost:2, rarity:'uncommon',
  t:u=>`Gain Companion ${u?9:6}. It strikes a random enemy at the end of your turn.`,
  fx:(G,c)=>G.buffP('companion',c.up?9:6) });

C({ id:'z_lament', name:"Zāl's Lament", fa:'زاری زال', hero:'zal', type:'skill', cost:1, rarity:'common',
  t:u=>`Heal ${u?10:7} HP. Gain 2 Farr.`, fx:(G,c)=>{ G.heal(c.up?10:7); G.farr(2); } });

C({ id:'z_const', name:'Constellation', fa:'صورت فلکی', hero:'zal', type:'power', cost:2, rarity:'rare',
  t:u=>`At the start of your turn, gain Block equal to ${u?'3 + ':''}your Farr.`,
  fx:(G,c)=>G.buffP('constellation',c.up?3:0.0001) });

C({ id:'z_descent', name:'Descent of the Simurgh', fa:'فرود سیمرغ', hero:'zal', type:'skill', rarity:'rare',
  cost:3, upCost:2, exhaust:true, flavor:'The sky darkens. It is not a cloud.',
  t:u=>`Set your Farr to 10. Exhaust.`, fx:(G,c)=>G.farr(10-G.p.farr) });

C({ id:'z_mount', name:'Mount of Stars', fa:'کوه ستارگان', hero:'zal', type:'attack', cost:1, rarity:'common',
  t:u=>`Deal ${u?9:6} damage to ALL enemies. Gain 1 Farr.`,
  fx:(G,c)=>{ G.dmgAll(c.up?9:6); G.farr(1); } });

C({ id:'z_veil', name:'Veil of Feathers', fa:'پردهٔ پر', hero:'zal', type:'skill', cost:2, rarity:'uncommon',
  t:u=>`Gain ${u?19:14} Block. Apply ${u?3:2} Weak to ALL enemies.`,
  fx:(G,c)=>{ G.blk(c.up?19:14); G.buffAll('weak',c.up?3:2); } });

C({ id:'z_name', name:'Say Her Name', fa:'نامش را بگو', hero:'zal', type:'skill', cost:0, rarity:'common', exhaust:true,
  flavor:'Thirty birds went looking for her. She was the thirty birds. (سی مرغ)',
  t:u=>`Gain ${u?4:3} Farr. Exhaust.`, fx:(G,c)=>G.farr(c.up?4:3) });

/* ─────────────────────────────  NEUTRAL — found on the road  ───────────────────────────── */

C({ id:'n_cypress', name:'Cypress of Kashmar', fa:'سرو کاشمر', hero:'any', type:'skill', cost:1, rarity:'common',
  flavor:'Zoroaster planted it. A caliph cut it down. It is still in the poems.',
  t:u=>`Gain ${u?13:10} Block. If you have 5 or more Farr, gain ${u?7:5} more.`,
  fx:(G,c)=>{ G.blk(c.up?13:10); if(G.p.farr>=5) G.blk(c.up?7:5); } });

C({ id:'n_nightingale', name:'Nightingale', fa:'بلبل', hero:'any', type:'skill', cost:0, rarity:'common', exhaust:true,
  t:u=>`Draw ${u?2:1}. Gain 1 Farr. Exhaust.`, fx:(G,c)=>{ G.draw(c.up?2:1); G.farr(1); } });

C({ id:'n_saffron', name:'Saffron Draught', fa:'شربت زعفران', hero:'any', type:'skill', cost:0, rarity:'common', exhaust:true,
  t:u=>`Heal ${u?10:6} HP. Exhaust.`, fx:(G,c)=>G.heal(c.up?10:6) });

C({ id:'n_pom', name:'Pomegranate', fa:'انار', hero:'any', type:'skill', cost:0, rarity:'common', exhaust:true,
  t:u=>`Heal ${u?7:4} HP. Draw 1. Exhaust.`, fx:(G,c)=>{ G.heal(c.up?7:4); G.draw(1); } });

C({ id:'n_bazaar', name:'Bazaar Blade', fa:'تیغ بازار', hero:'any', type:'attack', cost:1, rarity:'common',
  targeted:true, t:u=>`Deal ${u?11:8} damage. If this kills, gain 12 dirhams.`,
  fx:(G,c)=>{ const k=G.dmg(c.target,c.up?11:8); if(k) G.gold(12); } });

C({ id:'n_caravan', name:'Caravan Guard', fa:'نگهبان کاروان', hero:'any', type:'skill', cost:1, rarity:'common',
  t:u=>`Gain ${u?12:9} Block. Gain 1 Farr.`, fx:(G,c)=>{ G.blk(c.up?12:9); G.farr(1); } });

C({ id:'n_salt', name:'Salt Wind', fa:'باد شور', hero:'any', type:'skill', cost:1, rarity:'uncommon',
  t:u=>`Apply ${u?3:2} Weak and ${u?3:2} Frail to ALL enemies.`,
  fx:(G,c)=>{ G.buffAll('weak',c.up?3:2); G.buffAll('frail',c.up?3:2); } });

C({ id:'n_davoud', name:"Davoud's Gambit", fa:'قمار داوود', hero:'any', type:'skill', cost:0, rarity:'uncommon',
  flavor:'He always opens with something reckless. It usually works.',
  t:u=>`Draw ${u?3:2}. If this is the first card you played this turn, gain 1 Energy.`,
  fx:(G,c)=>{ G.draw(c.up?3:2); if(G.playedThisTurn===1) G.energy(1); } });

C({ id:'n_moon', name:'Moon over Zagros', fa:'ماه زاگرس', hero:'any', type:'power', cost:2, rarity:'uncommon',
  t:u=>`Whenever you Invoke the Simurgh, gain ${u?3:2} Energy.`, fx:(G,c)=>G.buffP('moon',c.up?3:2) });

C({ id:'n_pilgrim', name:'The Grey Pilgrim', fa:'زائر خاکستری', hero:'any', type:'skill', cost:1, rarity:'uncommon', exhaust:true,
  flavor:'He arrives precisely when he means to. Not one hour of it is for your convenience.',
  t:u=>`Draw ${u?3:2}. Gain 1 Energy. Exhaust.`, fx:(G,c)=>{ G.draw(c.up?3:2); G.energy(1); } });

C({ id:'n_reforged', name:'The Blade Reforged', fa:'تیغ دوباره', hero:'any', type:'attack', cost:1, rarity:'uncommon',
  targeted:true, flavor:'Broken once, at the worst possible moment. Mended once, at the best.',
  t:u=>`Deal ${u?7:5} damage. Each time you play this in a combat, it deals ${u?4:3} more.`,
  fx:(G,c)=>{ const bonus = (G.reforged||0); G.dmg(c.target,(c.up?7:5)+bonus); G.reforged = bonus + (c.up?4:3); } });

C({ id:'n_eagles', name:'When the Eagles Come', fa:'آمدن عقابان', hero:'any', type:'attack', cost:3, rarity:'rare',
  exhaust:true, flavor:'Always at the last moment. That is, apparently, the only moment they have.',
  t:u=>`Deal ${u?16:12} damage to ALL enemies. Gain ${u?16:12} Block. Heal ${u?9:6}. Exhaust.`,
  fx:(G,c)=>{ G.dmgAll(c.up?16:12); G.blk(c.up?16:12); G.heal(c.up?9:6); } });

C({ id:'n_road', name:'The Long Road', fa:'راه دراز', hero:'any', type:'power', cost:1, rarity:'uncommon',
  flavor:'Roads do not end. They only hand you to the next one.',
  t:u=>`Whenever you play a card that costs 0, gain ${u?2:1} Farr.`, fx:(G,c)=>G.buffP('longroad',c.up?2:1) });

C({ id:'n_sun', name:'Shield of the Sun', fa:'سپر خورشید', hero:'any', type:'skill', cost:2, rarity:'common',
  t:u=>`Gain ${u?21:16} Block. Gain 2 Farr.`, fx:(G,c)=>{ G.blk(c.up?21:16); G.farr(2); } });

C({ id:'n_breath', name:'Catch Your Breath', fa:'نفس تازه', hero:'any', type:'skill', cost:0, rarity:'uncommon', exhaust:true,
  t:u=>`Gain 2 Energy. Draw 1. Lose ${u?1:3} HP. Exhaust.`,
  fx:(G,c)=>{ G.energy(2); G.draw(1); G.loseHp(c.up?1:3); } });

C({ id:'n_jam', name:"Jamshid's Cup", fa:'جام جم', hero:'any', type:'skill', cost:1, rarity:'rare',
  flavor:'Look into it and see the whole world. Mostly it shows you what is about to hit you.',
  t:u=>`Draw ${u?3:2}. Enemies lose ${u?4:3} Strength for this turn.`,
  fx:(G,c)=>{ G.draw(c.up?3:2); G.foes.forEach(f=>{ if(f.hp>0) G.buffF(f,'tempstr',-(c.up?4:3)); }); } });

C({ id:'n_ulad', name:'Ulād, Bound', fa:'اولاد', hero:'any', type:'skill', cost:1, rarity:'rare', unlisted:true,
  flavor:'Beaten, tied to a horse, and — after a while — genuinely helpful.',
  t:u=>`Gain ${u?12:9} Block, 1 Farr, and draw 1.`,
  fx:(G,c)=>{ G.blk(c.up?12:9); G.farr(1); G.draw(1); } });

/* ─────────────────────────────  STATUSES & CURSES  ───────────────────────────── */

C({ id:'s_thirst', name:'Thirst', fa:'تشنگی', hero:'status', type:'status', cost:-1, rarity:'basic', unplayable:true,
  t:()=>`Unplayable. At the end of your turn, lose 3 HP.`, endTurn:(G)=>G.loseHp(3) });

C({ id:'s_blind', name:'Blinded', fa:'کوری', hero:'status', type:'status', cost:-1, rarity:'basic',
  unplayable:true, retain:true,
  flavor:'The White Demon blinded a king and his whole army. Only one thing burned it off.',
  t:()=>`Unplayable. Stays in your hand. You draw 1 fewer card while you hold it. Invoking the Simurgh destroys it.` });

C({ id:'c_doubt', name:'Doubt', fa:'دودلی', hero:'status', type:'curse', cost:-1, rarity:'basic', unplayable:true, retain:true,
  flavor:'Not every wound is a wound.',
  t:()=>`Unplayable. Retained. At the end of your turn, lose 2 HP.`, endTurn:(G)=>G.loseHp(2) });

C({ id:'c_shackle', name:"Zahhāk's Shackle", fa:'بند ضحاک', hero:'status', type:'curse', cost:-1, rarity:'basic', unplayable:true,
  flavor:'A thousand years chained under a mountain, and still exporting misery.',
  t:()=>`Unplayable. While in hand, you gain no Farr.` });

/* Cards a hero starts with */
const STARTERS = {
  rostam: ['r_strike','r_strike','r_strike','r_strike','r_guard','r_guard','r_guard','r_guard','r_bear','r_roar'],
  gord:   ['g_strike','g_strike','g_strike','g_strike','g_guard','g_guard','g_guard','g_guard','g_veiled','g_feint'],
  zal:    ['z_strike','z_strike','z_strike','z_strike','z_guard','z_guard','z_guard','z_guard','z_down','z_chant'],
};

/* Pools for rewards / shops (no basics, no statuses, no unlisted) */
function poolFor(hero) {
  return Object.values(CARDS).filter(c =>
    (c.hero === hero || c.hero === 'any') &&
    c.rarity !== 'basic' && !c.unlisted && c.type !== 'status' && c.type !== 'curse');
}
