/* MISHANAMEH — the thing the game is actually about.
   ────────────────────────────────────────────────────────────────────────
   Ferdowsī spent thirty years and his whole fortune writing the Shāhnāmeh
   during the century when Persian was being replaced. The Arab conquest had
   taken the throne, the fire temples, the calendar and the script; the court
   language of Iran was Arabic and the educated wrote in it. He wrote sixty
   thousand couplets of Persian and refused to use Arabic words where a Persian
   one existed. The language survived. That is not a metaphor — it is a
   documented, deliberate act of cultural defence, and it is the reason there is
   still a Persian language to write this game in.

   So the game should be about it, in the rules and not only in the margins:

     ERASURE   — certain enemies do not damage you. They take a card out of
                 your deck, permanently, and you watch the deck get smaller.
     THE VERSE — every boss you put down, you write one line back. What was
                 erased returns, sharpened.

   You lose things you cannot get back except by writing them down again. */

/* ═══════════════  1. ERASURE  ═══════════════ */

/* pull a real card out of the run — not a copy, the card */
function eraseCard(reason){
  if(!R) return null;
  const pool = R.deck.filter(c=>{
    const d = CARDS[c.id];
    return d && d.type!=='curse' && d.type!=='status';
  });
  if(pool.length <= 4) return null;                 // never erase a run into unplayability
  // take something that matters: prefer non-basic, prefer upgraded
  pool.sort((a,b)=>{
    const da=CARDS[a.id], db=CARDS[b.id];
    const sa=(da.rarity==='basic'?0:2)+(a.up?1:0), sb=(db.rarity==='basic'?0:2)+(b.up?1:0);
    return sb-sa;
  });
  const take = pool[Math.min(pool.length-1, Math.floor(rnd()*Math.min(3,pool.length)))];
  const ix = R.deck.indexOf(take);
  if(ix<0) return null;
  R.deck.splice(ix,1);
  R.erased = R.erased || [];
  R.erased.push({ id:take.id, up:take.up, why:reason || 'burnt' });
  // and out of the live piles too, or it will still be drawn this fight
  if(G){
    ['draw','hand','discard'].forEach(k=>{
      const j = G[k].findIndex(c=>c.uid===take.uid);
      if(j>=0) G[k].splice(j,1);
    });
  }
  return take;
}

/* the move an eraser makes */
function doErase(G_api, reason, msg){
  const gone = eraseCard(reason);
  if(gone){
    const nm = cardName(gone);
    G_api.say('◆ ' + (msg || 'ERASED') + ' — ' + nm + ' is gone from your deck.');
    if(typeof GFX!=='undefined') GFX.shake(9, 420);
    if(typeof toast!=='undefined') setTimeout(()=>toast(nm.toUpperCase()+' HAS BEEN ERASED', 'big'), 240);
  } else {
    G_api.say('The censor finds nothing left worth taking.');
    G_api.dmg ? null : null;
  }
}

/* ═══════════════  2. THE CENSORS  ═══════════════
   Three enemies whose whole point is that they take what is written. They are
   not demons. They are administrators, which is the more accurate horror. */

F({ id:'burner', name:'The Burner of Books', fa:'کتاب‌سوز', tier:'RB', hp:[42,50],
  intro:'He is not a soldier. He is a clerk with a mandate, and he has a list. In 651 the libraries of Ctesiphon and Gondishapur went the way of every library that belongs to a defeated people: some burned, most simply stopped being copied, which is slower and works better. What survives of Sasanian Persian literature would fit on one shelf.',
  moves:[
    { k:'special', n:'To the Fire', txt:'ERASES a card from your deck, permanently',
      fx:(G)=>doErase(G,'burnt','TO THE FIRE') },
    { k:'attack', n:'Confiscation', dmg:13 },
    { k:'debuff', n:'Index of Forbidden Things', txt:'2 Weak, 2 Frail',
      fx:(G)=>{ G.debuffP('weak',2); G.debuffP('frail',2); } },
  ],
  ai:(s)=> s.turn===0 ? 1 : (s.turn%3===1 ? 0 : s.turn%3===2 ? 2 : 1) });

F({ id:'renamer', name:'The Renamer', fa:'نام‌گردان', tier:'RB', hp:[36,43],
  intro:'Every conquest renames things: Pārs becomes Fārs because the incoming language has no p. Ahvāz, Esfahān, half the map — filed under a new alphabet, in a new tongue, with the old sounds sanded off. A name is not a small thing to lose. It is the handle you pick a thing up by.',
  moves:[
    { k:'debuff', n:'A New Alphabet', txt:'You draw 2 fewer cards next turn',
      fx:(G)=>{ G.debuffP('drowsy',2); } },
    { k:'attack', n:'Struck From the Record', dmg:9, hits:2 },
    { k:'special', n:'Filed Under Another Language', txt:'ERASES a card from your deck',
      fx:(G)=>doErase(G,'renamed','FILED AWAY') },
  ],
  ai:(s)=> s.turn%3 });

F({ id:'jizya', name:'The Tax on Fire', fa:'جزیه', tier:'RA', hp:[30,36],
  intro:'The jizya — the tax a non-Muslim paid to go on being one. For Zoroastrians in their own country it was the price of keeping a fire lit, and it was set high enough to be an argument. Most conversion is not at swordpoint. Most conversion is arithmetic.',
  moves:[
    { k:'special', n:'Assessment', txt:'Takes 25 gold', fx:(G)=>{ const t=Math.min(R.gold,25); R.gold-=t; G.say('The assessor takes '+t+' gold.'); } },
    { k:'attack', n:'Arrears', dmg:11 },
    { k:'buff', n:'Compound Interest', txt:'+3 Strength', fx:(G,s)=>G.buffF(s,'str',3) },
  ],
  ai:(s)=> s.turn%3 });

/* put them on the road */
ENCOUNTERS.RA.push(['jizya'], ['jizya','liar'], ['taxman','jizya']);
ENCOUNTERS.RB.push(['burner'], ['renamer'], ['burner','liar'], ['renamer','karapan']);
ENCOUNTERS.RC.push(['burner','renamer'], ['burner','aeshma']);

/* ═══════════════  3. WRITING IT BACK  ═══════════════
   Every boss you put down, you get a line of the book. A line buys back one
   thing they took — and it comes back better, because that is what happens to
   a story that someone tried to destroy. */

function versesEarned(){ return (R && R.cleared) || 0; }

function writeItBack(after){
  if(!R || !R.erased || !R.erased.length) return after && after();
  const wrap = el('div',{class:'scr node-scr verse'});
  wrap.appendChild(el('h2',{class:'sh', text:'WRITE IT BACK'}));
  wrap.appendChild(el('p',{class:'dim center',
    html:'They took these out of your deck. A poet’s answer to a burnt book is to write it again from memory, and what comes back is never quite what was lost — it is sharper, because now it is deliberate.<br><b>Choose one. It returns upgraded.</b>'}));
  const row = el('div',{class:'cardrow'});
  R.erased.slice(0,4).forEach((e,i)=>{
    const ghost = inst(e.id, true);
    const c = cardEl(ghost);
    c.classList.add('restorable');
    c.addEventListener('click', ()=>{
      R.deck.push(inst(e.id, true));
      R.erased.splice(R.erased.indexOf(e),1);
      R.verses = (R.verses||0)+1;
      if(typeof GFX!=='undefined'){ GFX.invoke(); }
      if(typeof NAQQAL!=='undefined') NAQQAL.tell('Written back — and sharper than it was.', {hold:2400});
      toast('WRITTEN BACK — '+cardName(ghost).toUpperCase()+', upgraded','big');
      setTimeout(()=>{ after && after(); }, 900);
    });
    const tag = el('div',{class:'whytag', text: e.why==='burnt' ? 'burnt' : e.why==='renamed' ? 'renamed' : 'taken'});
    const holder = el('div',{class:'restwrap'},[c, tag]);
    row.appendChild(holder);
  });
  wrap.appendChild(row);
  wrap.appendChild(el('button',{class:'btn', onclick:()=>{ after && after(); }},'Leave it lost'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

/* hook it onto the end of every boss */
const _afterReward_resist = afterReward;
afterReward = function(isBoss){
  if(isBoss && R && R.erased && R.erased.length){
    return writeItBack(()=>_afterReward_resist(isBoss));
  }
  _afterReward_resist(isBoss);
};

/* ═══════════════  4. SAYING IT OUT LOUD  ═══════════════
   Misha's note, and she is right: the politics were in the Codex, which is to
   say nowhere. Put it where you cannot miss it. */

const ROAD_FRAME = {
  royal: {
    open:`This road is about a specific thing, so here it is plainly.

In 651 the Sasanian empire fell to the Arab conquest, and what followed was not
only a change of rulers. It was the replacement of a language, a script, a
calendar, a religion and a name. Zoroastrians paid a tax to stay Zoroastrian.
Fire temples became mosques. Persian was written in someone else's alphabet.
Pārs became Fārs, because the new language had no <i>p</i>.

It did not take. Around the year 1000 a landowner named Ferdowsī sat down and
spent thirty years writing sixty thousand couplets of the old stories in
deliberate, stubborn Persian, and the language came back up through the paving.
Everything you fight on this road is a thing that tried to hold it down.

<b>Some enemies here do not hurt you. They take a card out of your deck and it
does not come back.</b> Kill the thing that runs the trial and you get to write
one of them back — improved, because a story someone tried to burn comes back
harder than it went in.`,
    close:`اهریمن رفت — Ahriman is put down, which in this cosmology is not a
metaphor and not permanent. Frashokereti: the world is made fresh, the
metal runs like a river and everyone walks through it, and it is warm milk to
the ones who told the truth.

You wrote {verses} lines of it back.`
  },
  haft: {
    open:`Rostam's Seven Trials, from the Shāhnāmeh — the book Ferdowsī wrote to
keep Persian alive in the century when it was being replaced. These are the
oldest stories in the language, told by naqqāls in coffee houses for a thousand
years, and the reason you can still hear them is that one man refused to write
in the language of the people who had won.`,
    close:`The Dīv‑e Sepīd is down and Kay Kāvus can see again. Rostam does not
become king; he never does. He goes home to Zābol, which is the point of him.`
  }
};

/* ═══════════════  5. THE NAQQĀL, WHERE IT MATTERS  ═══════════════ */
const RESIST_LINES = {
  burner:  'A clerk with a list. He is more dangerous than the demon was.',
  renamer: 'Pārs becomes Fārs. They had no letter for the sound of us.',
  jizya:   'The price of keeping your own fire lit.',
  zahhak:  'A thousand years of it. Ferdowsī spends his best writing on how ordinary the horror becomes.',
  druj:    'Druj. The Lie. In this religion it is not a sin — it is the enemy.',
  ahriman: 'Angra Mainyu. Not a devil. The hostile spirit — the will to unmake.',
  haman:   'He cast lots for the day. Pur, in Akkadian, which is why the feast is called Purim.',
  wall:    'MENĒ MENĒ TEQĒL UPHARSIN. Numbered, numbered, weighed, divided.',
};

/* Codex entry, written the way she asked for it */
LORE.essays = LORE.essays || {};

LORE.essays.erasure2 = { title:'WHAT THIS IS ABOUT', body:`
<h3>Said plainly, because it should be</h3>
<p>The Arab conquest of Iran in the seventh century was a colonisation. That word gets argued about, largely because the colonisers won and stayed, and history filed by the winners tends to record the whole thing as a religious enlightenment rather than an occupation. But the mechanics are the ordinary mechanics of empire: a new ruling language, a tax on the old religion, the systematic non‑copying of a literature until it is simply gone, and the renaming of the map. Pārs became Fārs because the incoming language had no <i>p</i>.</p>
<p>What survives of Middle Persian literature would fit on one shelf. That is not an accident and it is not attrition. It is a policy with a long tail.</p>
<h3>Two things to hold at once</h3>
<p>The first: a great deal of what is sold as the <b>Islamic Golden Age</b> is Persian, made by Persians, in a period when writing in Arabic was the price of being read at all. Al‑Khwārizmī, whose name gives us <i>algorithm</i>, was from Khwārazm. Ibn Sīnā was from Bukhārā. The <i>girih</i> tilings and the muqarnas vaults filed under "Islamic geometry" are Persian craft traditions that acquired a new patron. Refusing to admire them because of the label is doing the coloniser's filing for him. They are ours. Say so, and keep the tilework — it is all over this game on purpose.</p>
<p>The second: resistance to erasure is not a historical subject in Iran. It is the current one. The Islamic Republic bans the music, polices what women wear on their own heads, and administers Zoroastrian, Bahá'í and Jewish Iranians as a problem. The Jewish community of Iran is <b>2,700 years old</b>. It begins with Cyrus, who let the exiles go home, and whom Isaiah 45 calls <i>mashiach</i> — anointed — the only non‑Jew in the Hebrew Bible given that word. It is now a few thousand people.</p>
<p class="big-quote"><b>زن، زندگی، آزادی</b><br>Zan, Zendegī, Āzādī — Woman, Life, Freedom.</p>
<h3>Which is why the rules are the rules</h3>
<p>On the Royal Road some enemies do not hurt you. They take a card out of your deck and it does not come back. They are not demons; they are a clerk with a mandate, an assessor with a ledger, and a man who files your name under a different alphabet — which is the more accurate horror.</p>
<p>Then you kill the thing running the trial, and you <b>write one line back</b>. What returns is upgraded, because a story somebody tried to burn comes back harder than it went in.</p>
<p>That is the whole mechanic and it is the whole history.</p>
`};

LORE.essays.ferdowsi2 = { title:'THIRTY YEARS', body:`
<h3>The most consequential act of stubbornness in Persian history</h3>
<p>Abu'l‑Qāsem Ferdowsī began the Shāhnāmeh around 977 and finished about 1010. He was a <i>dehqān</i> — landed gentry, the class that carried Sasanian culture after the Sasanians had stopped existing — and he spent his own fortune on it until there was none, on the understanding that Sultan Maḥmūd of Ghazna would settle up at the end. Maḥmūd sent a fraction. The story is that Ferdowsī handed it to a bathhouse keeper and a beer seller on the spot, and there is a fair chance he did.</p>
<p>Sixty thousand couplets, depending on the manuscript. He used Arabic loanwords at a small fraction of the rate of the prose being written around him, and where a Persian word existed he reached for it. The book is not nostalgic — it is full of bad kings, lost causes and men who kill their own sons — but it is written in a language that was supposed to have finished being a literary one, and it is now that language's foundation.</p>
<p><i>Basī ranj bordam dar īn sāl sī / ‘ajam zende kardam bedīn Pārsī</i> — "I have suffered much in these thirty years; I revived the Persians with this Persian." He was right, which is a rare thing for a poet to be about his own work.</p>
<h3>The naqqāl</h3>
<p>Naqqāls performed it in coffee houses for a thousand years, from memory, with a stick and a painted curtain — <i>pardeh‑dārī</i>. No book in the room. That is what the voice in this game is meant to be, and it is why the narration is spoken over a santur rather than printed in a box.</p>
`};

LORE.essays.zan = { title:'ZAN, ZENDEGĪ, ĀZĀDĪ', body:`
<h3>Woman, Life, Freedom</h3>
<p>زن، زندگی، آزادی. Chanted in the streets from September 2022, after Mahsā Jinā Amīnī died in the custody of the morality police at twenty‑two, over the way she was wearing a scarf. The slogan is older — it comes through Kurdish, <i>Jin, Jiyan, Azadî</i> — and it travelled.</p>
<h3>Why the hair is in the game</h3>
<p>There is a status effect in this deck called <b>White Hair</b>. In the Shāhnāmeh, Zāl is born with white hair and his father Sām leaves him on a mountainside to die of it, because it is read as a mark of the demonic. The Simurgh raises him. He grows up to father Rostam, and Sām spends the rest of the poem being quietly ashamed. The point of the story is that the thing you were told to be ashamed of is the thing you were chosen for — which is a fairly direct line to draw to a modern Iranian street.</p>
<h3>Gordāfarid</h3>
<p><b>گردآفرید</b>. In the Shāhnāmeh she rides out to fight Sohrāb because the men of the White Fortress will not. Mid‑duel her helmet comes off and her hair falls down, and Ferdowsī — writing in the eleventh century — has Sohrāb realise he has been losing to a woman and be embarrassed for himself rather than for her. She then talks her way back inside the gates and shuts them in his face.</p>
<p>She is a playable character in this game for a reason.</p>
`};

/* register the new reading */
if(typeof CX_TABS !== 'undefined'){
  CX_TABS.splice(1, 0, {id:'erasure2', label:'What This Is About'});
  CX_TABS.splice(2, 0, {id:'ferdowsi2', label:'Thirty Years'});
  CX_TABS.splice(3, 0, {id:'zan', label:'Zan · Zendegī · Āzādī'});
}

/* ═══════════════  6. LORE (the audit insists, and it is right to)  ═══════════════ */
LORE.foes.burner = `A clerk with a mandate and a list. When Ctesiphon and Gondīshāpūr fell, the libraries went the way libraries always go when they belong to a defeated people — a few burned, most simply stopped being copied, which is slower and works better. Ibn Khaldūn passes on the line attributed to Caliph ʿUmar about Persian books: "if they agree with the Qur'ān they are superfluous, if they disagree they are pernicious." The story is probably apocryphal. The shelf is not: what survives of Middle Persian secular literature is a few dozen texts.`;

LORE.foes.renamer = `<i>Pārs</i> became <i>Fārs</i>, because Arabic has no <b>p</b>. So did the language: <i>Pārsī</i> → <i>Fārsī</i>, which is why the world calls it Farsi and Iranians writing in English are still arguing about whether to say Persian. Half the map went through the same sieve. A name is not a small thing to lose — it is the handle you pick a thing up by.`;

LORE.foes.jizya = `The <i>jizya</i> — the poll tax a non‑Muslim paid in order to go on being one. For Zoroastrians in Iran it was the standing price of keeping a fire lit, collected under conditions designed to be humiliating as well as expensive. Most conversion in history is not at swordpoint. Most conversion is arithmetic, applied patiently, for two hundred years.`;

/* ═══════════════  7. FRAMING, WHERE YOU CANNOT MISS IT  ═══════════════ */
function roadFrame(){
  const road = (R && R.road) || 'haft';
  const f = ROAD_FRAME[road]; if(!f) return;
  const key = 'framed_'+road;
  if(SAVE[key]) return;
  SAVE[key] = true; persist();
  const box = el('div',{class:'lore-modal frame'},[
    el('div',{class:'framelab', text: road==='royal' ? 'BEFORE THE ROYAL ROAD' : 'BEFORE THE SEVEN TRIALS'}),
    el('div',{class:'frametext', html: f.open.split('\n\n').map(p=>'<p>'+p.replace(/\n/g,' ')+'</p>').join('')}),
    el('button',{class:'btn gold', onclick:closeModal}, road==='royal' ? 'RIDE' : 'RIDE'),
  ]);
  modal(box,{sticky:true});
}
const _screenMap_resist = screenMap;
screenMap = function(){
  _screenMap_resist();
  if(R && R.trial===0 && R.step===0) setTimeout(roadFrame, 340);
};

/* the naqqāl says the sharp thing when the sharp thing shows up */
const _firstSight_resist = (typeof firstSight!=='undefined') ? firstSight : null;
if(_firstSight_resist){
  firstSight = function(kind, id, name, fa, node){
    const fresh = !(SAVE.codexSeen && SAVE.codexSeen[kind+':'+id]);
    _firstSight_resist(kind, id, name, fa, node);
    if(fresh && kind==='foes' && RESIST_LINES[id] && typeof NAQQAL!=='undefined')
      setTimeout(()=>NAQQAL.tell(RESIST_LINES[id], {hold:2800}), 900);
  };
}

/* and the last word, with the count of what you got back */
const _victory_resist = victory;
victory = function(){
  _victory_resist();
  const road = (R && R.road) || 'haft';
  const f = ROAD_FRAME[road]; if(!f) return;
  const host = document.querySelector('.scr') || APP();
  const v = (R && R.verses) || 0;
  const p = el('div',{class:'closeframe', html:
    f.close.replace('{verses}', v).split('\n\n').map(s=>'<p>'+s.replace(/\n/g,' ')+'</p>').join('') +
    (v ? `<p class="verseline">${v} line${v===1?'':'s'} written back.</p>` : '')});
  host.appendChild(p);
};
