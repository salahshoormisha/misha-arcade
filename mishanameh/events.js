/* MISHANAMEH — Omens (فال). Choose‑your‑own encounters on the road.
   choices[].fx(R) returns the text shown after choosing. R = run API (engine.js). */

const EVENTS = [

{ id:'ram_spring', name:'THE RAM AT THE SPRING', fa:'قوچ و چشمه', art:'🐏',
  text:`The waste has no water in it and you have stopped sweating, which is the bad sign. Then a ram walks out of the heat — unhurried, entirely ordinary — looks at you, and walks off. In the book, Rostam followed one exactly like this and found a spring. The book does not explain the ram. It never does.`,
  choices:[
    { label:'Follow it', sub:'Heal 30% of your maximum HP',
      fx:(R)=>{ const n=Math.round(R.maxHp*0.30); R.heal(n); return `The spring is where the ram said it was. You drink until your hands stop shaking. (+${n} HP)`; } },
    { label:'Follow it much further', sub:'Lose 10 HP · gain a talisman',
      fx:(R)=>{ R.damage(10); const t=R.giveTalisman('uncommon'); return `Hours past the spring, past sense, the ram stops at a cairn and will not go on. You dig. (−10 HP, gained ${t})`; } },
    { label:'Let it go and press on', sub:'Gain 90 dirhams',
      fx:(R)=>{ R.gold(90); return `You are not a man who follows sheep. Two miles on you find a caravan’s spilled strongbox, which is its own kind of mercy. (+90 dirhams)`; } },
  ]},

{ id:'davoud', name:'A FAMILIAR FACE BY THE FIRE', fa:'چهره‌ای آشنا', art:'🔥', once:true, minTrial:2,
  text:`Somebody has already made the fire and is sitting at it as though he expected you an hour ago. He does not ask your name. He shifts over, hands you the better half of the bread, and says the road is worse further on, but the company improves.\n\nHe says his name is Dāvūd.`,
  choices:[
    { label:'Take him up on the gamble', sub:"Add 2 × Davoud's Gambit to your deck",
      fx:(R)=>{ R.addCard('n_davoud'); R.addCard('n_davoud'); return `“Open with something reckless,” he says. “It mostly works.” It mostly does.`; } },
    { label:'Let him carry something for you', sub:'Remove a card from your deck',
      fx:(R)=>{ R.removeCard(); return `He takes the weight off you without making it a whole thing, which is the entire trick of him.`; } },
    { label:'Just eat, and talk', sub:'Heal 25 HP · gain 60 dirhams',
      fx:(R)=>{ R.heal(25); R.gold(60); return `You talk about nothing for three hours. You have not felt this steady since Zābol. He pays for the bread, insists, loses the argument, pays anyway.`; } },
  ]},

{ id:'poet', name:'THE POET AT THE CROSSROADS', fa:'شاعر بر سر دوراهی', art:'✒️',
  text:`An old man sits where the roads split, writing. He has been at it, he says, for thirty years, and has spent his entire fortune on it, and expects to be paid in nothing at all.\n\n“I am putting the kings back,” he says. “The language was going. Someone had to hold the door.” He looks up. “You. Are you anybody?”`,
  choices:[
    { label:'“Write me in.”', sub:'Upgrade 2 random cards',
      fx:(R)=>{ const a=R.upgradeRandom(), b=R.upgradeRandom(); return `He writes for an hour without looking up. What he reads back to you is better than what you did. (${a} and ${b} upgraded)`; } },
    { label:'Pay him properly', sub:'Spend 140 dirhams · gain a rare card',
      req:(R)=>R.gold_>=140,
      fx:(R)=>{ R.gold(-140); const c=R.addRareCard(); return `He takes it, embarrassed, and gives you a verse in exchange — which turns out to be worth more. (Gained ${c})`; } },
    { label:'“Everyone dies in your book.”', sub:'Remove a card · take 6 HP of truth',
      fx:(R)=>{ R.removeCard(); R.damage(6); return `“Yes,” he says, pleased you noticed. “That is what makes it true.” Something you were carrying gets lighter and worse. (−6 HP)`; } },
  ]},

{ id:'forge', name:"KĀVEH'S FORGE", fa:'کورهٔ کاوه', art:'🔨',
  text:`A blacksmith’s forge, still hot, nobody in it. On the wall hangs a leather apron on a spear‑shaft — the one Kāveh raised when the tyrant took his last son, the flag that started the revolt. Somebody has kept the fire in.`,
  choices:[
    { label:'Temper a blade', sub:'Upgrade a card of your choice',
      fx:(R)=>{ R.upgradeChoose(); return `You work it until it rings differently.`; } },
    { label:'Melt something down', sub:'Remove a card · gain 130 dirhams',
      fx:(R)=>{ R.removeCard(); R.gold(130); return `It goes into the crucible and comes out as money, which is a sadder shape but a more useful one. (+130 dirhams)`; } },
    { label:'Temper yourself', sub:'Take 11 damage · gain 16 maximum HP',
      fx:(R)=>{ R.damage(11); R.addMaxHp(16); return `You hold your forearm in the heat longer than is sensible. It is a stupid thing to do and it works. (+16 max HP)`; } },
  ]},

{ id:'peri', name:"THE PERĪ'S BARGAIN", fa:'سودای پری', art:'🧚',
  text:`She is standing in the road in a way that road‑standing people do not, and the light around her is coming from slightly the wrong direction. Perīs are not demons — the old books were very firm about that — but they are not on your side either. She has an offer. She always has an offer.`,
  choices:[
    { label:'Take the gift', sub:'Gain a rare card · add a Doubt',
      fx:(R)=>{ const c=R.addRareCard(); R.addCardToDeck('c_doubt'); return `You get exactly what she promised and something else you did not ask for, riding underneath it. (Gained ${c} and a Doubt)`; } },
    { label:'Take the healing', sub:'Heal fully · lose 14 maximum HP',
      fx:(R)=>{ R.hp_ = R.maxHp; R.addMaxHp(-14); return `Every wound closes. You are, permanently, slightly less than you were. (Full heal, −14 max HP)`; } },
    { label:'Say no and keep walking', sub:'Gain 80 dirhams',
      fx:(R)=>{ R.gold(80); return `“Oh,” she says, genuinely delighted. “Good.” She drops a purse in the dust behind you as a kind of applause. (+80 dirhams)`; } },
  ]},

{ id:'zahhak', name:"ZAHHĀK'S CHAINS", fa:'بند ضحاک', art:'⛓️', minTrial:3,
  text:`Bolted into the rock of Mount Damāvand: chains the thickness of your thigh. Zahhāk is at the other end of them — the tyrant with two serpents growing from his shoulders, who ate two young men a day for a thousand years, and whom Fereydūn would not kill, only bind, because the world was not finished with him yet.\n\nHe is still down there. He is still hungry. He can hear you.`,
  choices:[
    { label:'Test the links', sub:'Take 16 damage · gain a rare talisman',
      fx:(R)=>{ R.damage(16); const t=R.giveTalisman('rare'); return `Something enormous pulls back. You keep your footing, barely, and a link the size of a shield snaps off in your hand. (−16 HP, gained ${t})`; } },
    { label:'Listen to what he offers', sub:'Gain a rare card · add 2 Doubt',
      fx:(R)=>{ const c=R.addRareCard(); R.addCardToDeck('c_doubt'); R.addCardToDeck('c_doubt'); return `He is very good at this. He has had a thousand years and nothing else to practise on. (Gained ${c} and 2 Doubt)`; } },
    { label:'Leave him where the hero left him', sub:'Gain 40 dirhams · heal 12',
      fx:(R)=>{ R.gold(40); R.heal(12); return `Fereydūn had his reasons. You sleep well for the first time in a week. (+12 HP, +40 dirhams)`; } },
  ]},

{ id:'cypress', name:'THE CYPRESS OF KASHMAR', fa:'سرو کاشمر', art:'🌲',
  text:`The tree Zoroaster is said to have planted with his own hands, grown so wide that a caravan can shelter in its shade. Centuries from now a caliph will hear about it, want it, and have it cut down and carried to his capital in pieces — and he will be murdered the night before it arrives.\n\nRight now it is simply a very large tree, and the shade is extremely good.`,
  choices:[
    { label:'Sleep in the shade', sub:'Heal 35% of maximum HP',
      fx:(R)=>{ const n=Math.round(R.maxHp*0.35); R.heal(n); return `You sleep like something that is allowed to. (+${n} HP)`; } },
    { label:'Take a seed', sub:'Gain the Cypress Seed talisman',
      fx:(R)=>{ R.giveTalismanById('cypressseed'); return `You put it in your shirt pocket. It is the size of a thumbnail and it outlives everyone in this story.`; } },
    { label:'Take the wood', sub:'Gain 260 dirhams · add a Doubt',
      fx:(R)=>{ R.gold(260); R.addCardToDeck('c_doubt'); return `It is worth an obscene amount and you will think about it later, at night, for years. (+260 dirhams, +1 Doubt)`; } },
  ]},

{ id:'rakhsh', name:'RAKHSH WANDERS OFF', fa:'رخش گم شد', art:'🐎',
  text:`He is gone. Rakhsh — rose‑coloured, chose Rostam rather than the other way round, has personally killed a lion while his rider slept through it — has decided the grazing is better somewhere else and left without discussion. There are hoofprints going three ways, which is not possible.`,
  choices:[
    { label:'Track him all night', sub:'Remove a card from your deck',
      fx:(R)=>{ R.removeCard(); return `You find him at dawn, unbothered. Somewhere in those hours you put something down and did not pick it back up.`; } },
    { label:'Whistle and wait', sub:'Heal 22 HP',
      fx:(R)=>{ R.heal(22); return `He comes back when he is ready, which is his entire policy. You sleep against his flank. (+22 HP)`; } },
    { label:'Sell the spare saddle out of spite', sub:'Gain 110 dirhams',
      fx:(R)=>{ R.gold(110); return `He returns within the hour and looks at the empty saddle‑rack, then at you, for a long time. (+110 dirhams)`; } },
  ]},

{ id:'merchant', name:'THE SALT MERCHANT', fa:'نمک‌فروش', art:'🧂',
  text:`His cart is salt to the top and his sleeves are full of other things. He does not sell you the salt. He would like to sell you something he will not describe, wrapped in cloth, which he swears on his mother he has not opened.`,
  choices:[
    { label:'Buy the wrapped thing', sub:'Spend 160 dirhams · gain a random talisman',
      req:(R)=>R.gold_>=160,
      fx:(R)=>{ R.gold(-160); const t=R.giveTalisman(Math.random()<0.35?'rare':'uncommon'); return `He is already three dunes away by the time you get the cloth off. (Gained ${t})`; } },
    { label:'Sell him your blood', sub:'Lose 14 HP · gain 190 dirhams',
      fx:(R)=>{ R.damage(14); R.gold(190); return `He does not say what it is for. He counts the coins out twice, honestly, which somehow makes it worse. (−14 HP, +190 dirhams)`; } },
    { label:'Buy salt, like a normal person', sub:'Heal 15 HP',
      fx:(R)=>{ R.heal(15); return `Salt, water, bread. You eat properly for the first time in days. (+15 HP)`; } },
  ]},

{ id:'blindking', name:'THE BLIND KING', fa:'شاه نابینا', art:'🕯️', minTrial:4,
  text:`Kay Kāvus — the king whose whole personality is bad ideas — sits in the dark with his army, all of them blinded by the White Demon, all of them waiting for someone else to fix it. This is, in fact, why you are on this road. He does not apologise. He asks for more.`,
  choices:[
    { label:'Swear to finish it', sub:'Add 2 Blinded to your deck · gain a rare talisman',
      fx:(R)=>{ R.addCardToDeck('s_blind'); R.addCardToDeck('s_blind'); const t=R.giveTalisman('rare'); return `You take some of the dark off him and carry it yourself, which is what the oath actually means. (Gained ${t}, +2 Blinded)`; } },
    { label:'Take payment first', sub:'Gain 170 dirhams',
      fx:(R)=>{ R.gold(170); return `The treasury is right there and the king is in no position to audit. (+170 dirhams)`; } },
    { label:'Tell him exactly whose fault this is', sub:'Heal 20 HP · gain 40 dirhams',
      fx:(R)=>{ R.heal(20); R.gold(40); return `You say it plainly, at length, in front of the court. You feel enormously better. (+20 HP, +40 dirhams)`; } },
  ]},

{ id:'hilt', name:'A CAIRN OF GREY STONES', fa:'سنگچین خاکستری', art:'🗿', once:true, minTrial:3,
  text:`This is not a Persian cairn. The stonework is wrong, the stacking is wrong, and the marks cut into the capstone are an alphabet you have never seen and can somehow nearly read. Underneath it, wrapped in cloth that has not rotted, is the hilt of a sword with about a hand’s length of blade left on it.\n\nIt was broken a very long way from here, in a story that is not yours, and somebody clearly expected it to be needed again.`,
  choices:[
    { label:'Take it', sub:'Gain A Broken Hilt — it opens a road that is not on the map',
      fx:(R)=>{ R.giveTalismanById('hilt'); return `You have no use for a broken sword. You take it anyway. Carry it to the end of Trial VII and see what opens.`; } },
    { label:'Rebuild the cairn and walk on', sub:'Heal 18 · gain 100 dirhams',
      fx:(R)=>{ R.heal(18); R.gold(100); return `You put every stone back where it was. Whoever built it left grave‑goods, and would rather you had them than the weather did. (+18 HP, +100 dirhams)`; } },
  ]},

{ id:'nightingale', name:'THE NIGHTINGALE AND THE ROSE', fa:'بلبل و گل', art:'🌹',
  text:`A nightingale is singing at a rose, and has been all night, and will be all night tomorrow. Every Persian poet for a thousand years has used this exact pair to mean the same thing: the lover who sings, the beloved who does not answer, and the fact that the singing is the point.`,
  choices:[
    { label:'Sit and listen until dawn', sub:'Upgrade a random card · heal 12',
      fx:(R)=>{ const c=R.upgradeRandom(); R.heal(12); return `You do not do anything useful for six hours and come out of it sharper. (${c} upgraded, +12 HP)`; } },
    { label:'Take the song with you', sub:'Add 2 × Nightingale to your deck',
      fx:(R)=>{ R.addCard('n_nightingale'); R.addCard('n_nightingale'); return `You catch nothing, obviously. But you have the tune now and it turns out that was the transferable part.`; } },
    { label:'Cut the rose', sub:'Gain 120 dirhams · the singing stops',
      fx:(R)=>{ R.gold(120); return `It is worth good money in the next town. The silence follows you for two days. (+120 dirhams)`; } },
  ]},

{ id:'door', name:'A DOOR UNDER THE MOUNTAIN', fa:'در زیر کوه', art:'🚪', minTrial:4,
  text:`Grey stone, no handle, no hinge, invisible until the moon hit it. There is an inscription across the lintel in that same not‑quite‑readable alphabet from the cairn. As best you can make it out, it says: *speak, friend, and enter* — which is either a riddle or, if you think about it for one more second, not a riddle at all.`,
  choices:[
    { label:'Say the word', sub:'Gain a rare card and 70 dirhams',
      fx:(R)=>{ const c=R.addRareCard(); R.gold(70); return `You say “friend,” feeling ridiculous. The door opens without a sound. The people who built this were not trying to keep anyone out. (Gained ${c}, +70 dirhams)`; } },
    { label:'Break it down', sub:'Take 14 damage · gain 230 dirhams',
      fx:(R)=>{ R.damage(14); R.gold(230); return `It takes two hours and your shoulder is never quite right again. There is a great deal of gold inside and something further in that does not like the light. (−14 HP, +230 dirhams)`; } },
    { label:'Leave it shut', sub:'Heal 16 HP',
      fx:(R)=>{ R.heal(16); return `Some doors are shut from the inside for a reason. You sleep against the warm rock and dream of deep places. (+16 HP)`; } },
  ]},

{ id:'chest', name:'THE CHEST WITH NO LOCK', fa:'صندوق بی‌قفل', art:'🎁',
  text:`In the middle of the road, in the middle of nowhere, a chest with no lock, no dust on it, and no tracks around it in any direction.`,
  choices:[
    { label:'Open it', sub:'Two thirds: a talisman. One third: two Doubts.',
      fx:(R)=>{ if(R.rng()<0.66){ const t=R.giveTalisman(Math.random()<0.3?'rare':'uncommon'); return `It is exactly as good as it looks. (Gained ${t})`; }
                R.addCardToDeck('c_doubt'); R.addCardToDeck('c_doubt'); return `It is empty, and lined with mirrors, and you look at yourself for slightly too long. (+2 Doubt)`; } },
    { label:'Burn it unopened', sub:'Gain 60 dirhams from the fittings',
      fx:(R)=>{ R.gold(60); return `The brass survives. Whatever was inside makes a noise while it burns, once, and then does not. (+60 dirhams)`; } },
  ]},

{ id:'ford', name:'THE COMPANY AT THE FORD', fa:'همراهان', art:'🤝', minTrial:5,
  text:`Ulād is waiting at the crossing with a dozen of his marches‑men, and for one long moment you both remember exactly how you met. Then he shrugs, and gets down, and holds your horse while you cross — because you beat him honestly and then, unaccountably, did not kill him.`,
  choices:[
    { label:'Take him with you', sub:'Add 2 × Ulād, Bound to your deck',
      fx:(R)=>{ R.addCard('n_ulad'); R.addCard('n_ulad'); return `He is tied to your saddle by agreement now rather than by rope, and he knows every stone of this country.`; } },
    { label:'Let his men patch you up', sub:'Heal 34 HP',
      fx:(R)=>{ R.heal(34); return `Their field surgeon is better than the king’s. (+34 HP)`; } },
    { label:'Ask what is actually in the cave', sub:'Gain a talisman · take 8 HP of dread',
      fx:(R)=>{ R.damage(8); const t=R.giveTalisman('uncommon'); return `He tells you. All of it. Then he gives you something of his own and will not explain it. (−8 HP, gained ${t})`; } },
  ]},

{ id:'landslide', name:'THE MOUNTAIN GIVES WAY', fa:'رانش کوه', art:'⛰️',
  text:`The pass ahead has come down in the night — a hundred feet of scree where the road used to be. There is a way over it, and there is a way around it, and the way around it is four days.`,
  choices:[
    { label:'Go over', sub:'Take 12 damage · gain a rare card',
      fx:(R)=>{ R.damage(12); const c=R.addRareCard(); return `You come down the far side torn up and holding something you found wedged in the rock. (−12 HP, gained ${c})`; } },
    { label:'Go around', sub:'Lose 70 dirhams on the long road · heal 20',
      fx:(R)=>{ R.gold(-70); R.heal(20); return `Four days of ordinary walking, ordinary food, ordinary sleep. It is the best thing that has happened to you in weeks. (+20 HP, −70 dirhams)`; } },
  ]},

];
