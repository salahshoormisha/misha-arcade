/* MISHANAMEH — ask the naqqāl.
   ────────────────────────────────────────────────────────────────────────
   A button in every fight that hands the *entire current board* to Claude and
   lets you ask it anything: what does Frail actually do, why is this card
   greyed out, what should I play, what is a karapan, is this run dead.

   This site is static — it lives on GitHub Pages and there is no server to
   keep a secret in. So the key is yours: you paste your own Anthropic API key
   once, it is stored in this browser's localStorage and never leaves it except
   in the request to Anthropic. If you would rather not, the button simply
   doesn't appear until you set one up.

   (If you ever want it keyless for Baba, the upgrade is a ten-line Vercel
   function holding the key — set ASK.proxy to its URL and the key field goes
   away. Everything else here stays the same.)                              */

const ASK = (function(){

let proxy = null;                       // set this to a serverless endpoint to go keyless
const KEY  = 'mishanameh.askkey';
const MODEL = 'claude-sonnet-4-5';

function key(){ try{ return localStorage.getItem(KEY) || ''; }catch(e){ return ''; } }
function setKey(k){ try{ k ? localStorage.setItem(KEY,k) : localStorage.removeItem(KEY); }catch(e){} }
function ready(){ return !!proxy || !!key(); }

/* ═══════════ 1. WHAT THE MODEL IS TOLD ═══════════
   The whole board, in plain text. If the answer is wrong it should be because
   the model was wrong, never because it could not see something. */

function boardState(){
  if(!R) return 'The player is on the title screen — no run in progress.';
  const L = [];
  const road = ROADS[(R.road)||'haft'];
  L.push(`SCREEN: ${UI.screen}`);
  L.push(`CAMPAIGN: ${road ? road.name : 'Haft Khān'} — Trial ${R.trial+1}, step ${R.step+1}, Khān ${R.khan} (difficulty)`);
  L.push(`HERO: ${HEROES[R.hero].name} — ${HEROES[R.hero].epithet}. ${HEROES[R.hero].keyword}`);
  L.push(`INVOKE (at full Farr): ${HEROES[R.hero].invoke.name} — ${HEROES[R.hero].invoke.text}`);
  L.push(`RUN HP: ${R.hp}/${R.maxHp}   GOLD: ${R.gold}`);
  if(R.talismans && R.talismans.length)
    L.push(`TALISMANS (permanent, always active):\n` + R.talismans.map(t=>{
      const d = TALISMANS[t.id||t]; return d ? `  · ${d.name} — ${d.text}` : `  · ${t}`; }).join('\n'));
  if(R.erased && R.erased.length)
    L.push(`ERASED FROM THE DECK (can be written back after a boss): ${R.erased.map(e=>CARDS[e.id]?CARDS[e.id].name:e.id).join(', ')}`);

  if(G && !G.over && UI.screen==='combat'){
    L.push('');
    L.push(`── IN COMBAT, turn ${G.turn} ──`);
    L.push(`YOU: ${G.p.hp}/${G.p.maxHp} HP · ${G.p.block} Block · ${G.p.energy} Energy · Farr ${G.p.farr}/${maxFarr()}${G.p.farr>=maxFarr()?' (INVOKE IS AVAILABLE)':''}`);
    const pb = Object.entries(G.p.buffs).filter(([k,v])=>v && k!=='whetN' && k!=='firstTurnEnergy');
    L.push(`YOUR STATUSES: ${pb.length ? pb.map(([k,v])=>`${(BUFF_INFO[k]||{}).n||k} ${v}`).join(', ') : 'none'}`);
    L.push('');
    L.push('ENEMIES:');
    G.foes.forEach((f,i)=>{
      if(f.hp<=0){ L.push(`  ${i+1}. ${f.name} — DEAD`); return; }
      const it = intentOf(f);
      const words = (typeof TEACH!=='undefined') ? TEACH.intentWords(f).txt : it.n;
      const fb = Object.entries(f.buffs).filter(([k,v])=>v);
      L.push(`  ${i+1}. ${f.name} — ${f.hp}/${f.maxHp} HP${f.block?`, ${f.block} Block`:''}`);
      L.push(`     NEXT MOVE: ${words}${it.n?`  (called "${it.n}")`:''}`);
      if(fb.length) L.push(`     statuses: ${fb.map(([k,v])=>`${(BUFF_INFO[k]||{}).n||k} ${v}`).join(', ')}`);
    });
    L.push(`TOTAL INCOMING NEXT TURN: ${incomingTotal()} (your ${G.p.block} Block absorbs ${Math.min(incomingTotal(),G.p.block)} of it)`);
    L.push('');
    L.push('YOUR HAND (cost — name — what it does — playable right now?):');
    G.hand.forEach((c,i)=>{
      const d = CARDS[c.id];
      L.push(`  [${i+1}] ${cardCost(c)}⚡ ${cardName(c)} (${d.type}) — ${cardText(c)}${canPlay(c)?'':'   ← CANNOT PLAY RIGHT NOW'}`);
    });
    L.push(`PILES: ${G.draw.length} in draw, ${G.discard.length} in discard, ${G.exhaust.length} exhausted`);
  }
  L.push('');
  L.push(`FULL DECK (${R.deck.length} cards): ` + R.deck.map(c=>cardName(c)).sort().join(', '));
  return L.join('\n');
}

const RULES = `MISHANAMEH is a deck-building roguelike in the Slay the Spire tradition, set in Persian myth and Achaemenid history.

CORE RULES
· Each turn you draw 5 cards and get your Energy back in full (3 for most heroes). Cards cost Energy.
· Anything left in your hand at end of turn is discarded. Unspent Energy is NOT saved. There is no reason to hold anything back.
· Block absorbs damage and then VANISHES at the start of your next turn. It is meant to be spent, never hoarded.
· Every enemy shows exactly what it will do next turn, already adjusted for all modifiers. You are never ambushed.
· When your draw pile runs out, the discard pile is shuffled back in.
· Exhausted cards leave the fight entirely and will not come round again.
· FARR (فرّ, divine glory) is the gold meter. Playing cards fills it. At full you may INVOKE your hero's signature effect; the meter empties and can be refilled in the same fight.
· Dying ends the run. You keep unlocks. Losing runs is the genre, not failure.

STATUSES
· Strength: +damage on every attack, permanent for the fight.
· Agility: +Block on every Block card, permanent for the fight.
· Weak: you deal 25% less attack damage. Ticks down 1/turn.
· Frail: you gain 25% less Block. Ticks down 1/turn.
· Vulnerable: takes 50% MORE attack damage. Ticks down 1/turn.
· Venom: loses that much HP at the start of its turn, then drops by 1. Ignores Block.
· Ember: loses that much HP at the end of its turn. Does not fade.
· Regen: heals that much at the start of its turn, then drops by 1.
· Ward: eats one incoming debuff per point.
· Stun: it does nothing on its next turn.

THE TWO ROADS
· The Haft Khān — Rostam's Seven Trials from the Shāhnāmeh. Heroes: Rostam, Gordāfarid, Zāl.
· The Royal Road — Kāveh the blacksmith to Ahriman, via Zahhāk, the Chinvat Bridge, Haman at Susa, and the writing on the wall. Heroes: Kāveh, Esther.
· On the Royal Road some enemies ERASE a card from your deck permanently instead of damaging you. After each boss you may WRITE ONE BACK, upgraded. This is the theme of the game: resistance to cultural erasure, specifically the Arab conquest's replacement of Persian language, religion and names, and Ferdowsī writing the Shāhnāmeh to hold the language open.

MAP SYMBOLS: ⚔ fight · ☠ elite (harder, guaranteed talisman) · ✦ omen (a choice) · ⛺ camp (heal or upgrade a card) · ⚖ bazaar (buy cards/talismans, or pay to remove a card).

DECK-BUILDING PRINCIPLE: a small deck is a strong deck. Every card you add is a card you might draw instead of the one you wanted. Removing your weakest starting cards at the bazaar is usually the best money you can spend.`;

const SYSTEM = `You are the naqqāl — the storyteller who performs the Shāhnāmeh — acting as a friendly, extremely clear rules coach for two people learning MISHANAMEH. They are intelligent adults who are new to deck-building roguelikes. They have said the game feels confusing, so your job is to make it stop being confusing.

${RULES}

HOW TO ANSWER
· Be short. Two to five sentences unless they ask for depth. Never pad.
· Answer the actual question first, in plain English, then give the reason.
· When they ask "what should I do", give ONE concrete recommended line of play, naming the cards in order, with the resulting numbers. Then one sentence on why. Do not list every option.
· Use the real numbers from the board state you have been given. Never invent a card, an enemy or a rule that is not in the state or the rules above.
· If something genuinely depends on the draw, say so in half a sentence and still commit to a recommendation.
· You may add at most one short sentence of Persian-historical colour, and only when it actually illuminates something. No purple prose. They have complained about writing that is poetic but incomprehensible.
· Never use markdown headers. Short paragraphs or a tight list at most.`;

/* ═══════════ 2. THE CALL ═══════════ */
async function ask(question){
  const body = {
    model: MODEL,
    max_tokens: 700,
    system: SYSTEM,
    messages: [{ role:'user', content:
      `Here is the exact board right now:\n\n${boardState()}\n\n────────\n\nMy question: ${question}` }],
  };
  const url = proxy || 'https://api.anthropic.com/v1/messages';
  const headers = { 'content-type':'application/json' };
  if(!proxy){
    headers['x-api-key'] = key();
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }
  const res = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
  if(!res.ok){
    const t = await res.text().catch(()=> '');
    if(res.status===401) throw new Error('That key was refused. Check it in Settings → Ask the Naqqāl.');
    throw new Error(`The naqqāl could not be reached (${res.status}). ${t.slice(0,180)}`);
  }
  const j = await res.json();
  return (j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n').trim() || '(no answer)';
}

/* ═══════════ 3. THE PANEL ═══════════ */
const SUGGEST_COMBAT = [
  'What should I play this turn, and in what order?',
  'Why can’t I play that card?',
  'Am I about to die? What are my outs?',
  'What does this enemy actually do?',
];
const SUGGEST_ELSE = [
  'Which of these should I take, and why?',
  'Is my deck any good? What is it missing?',
  'Explain what I am looking at.',
  'What should I spend gold on?',
];

function panel(){
  if(!ready()) return setup();
  const wrap = el('div',{class:'lore-modal askbox'});
  wrap.appendChild(el('h2',{text:'ASK THE NAQQĀL'}));
  const log = el('div',{class:'asklog'});
  wrap.appendChild(log);

  const sugg = el('div',{class:'asksugg'});
  (UI.screen==='combat' ? SUGGEST_COMBAT : SUGGEST_ELSE).forEach(q=>{
    sugg.appendChild(el('button',{class:'btn tiny', onclick:()=>send(q)}, q));
  });
  wrap.appendChild(sugg);

  const row = el('div',{class:'askrow'});
  const input = el('input',{class:'askinput', type:'text', placeholder:'or ask anything about this game…'});
  input.addEventListener('keydown', e=>{ if(e.key==='Enter' && input.value.trim()) send(input.value.trim()); });
  const go = el('button',{class:'btn gold sm', onclick:()=>{ if(input.value.trim()) send(input.value.trim()); }},'ASK');
  row.appendChild(input); row.appendChild(go);
  wrap.appendChild(row);

  wrap.appendChild(el('div',{class:'askfoot'},[
    el('button',{class:'btn sm', onclick:()=>{ closeModal(); }},'← back'),
    el('button',{class:'btn sm ghost', onclick:()=>{ closeModal(); setup(); }},'key'),
  ]));

  async function send(q){
    input.value='';
    log.appendChild(el('div',{class:'askq', text:q}));
    const a = el('div',{class:'aska thinking', text:'…'});
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
    try{
      const out = await ask(q);
      a.classList.remove('thinking');
      a.innerHTML = out.split('\n').filter(Boolean).map(p=>`<p>${markup(p)}</p>`).join('');
    }catch(e){
      a.classList.remove('thinking');
      a.classList.add('askerr');
      a.textContent = e.message;
    }
    log.scrollTop = log.scrollHeight;
  }

  modal(wrap);
  setTimeout(()=>input.focus(), 120);
}

function setup(){
  const wrap = el('div',{class:'lore-modal askbox'});
  wrap.appendChild(el('h2',{text:'ASK THE NAQQĀL'}));
  wrap.appendChild(el('p',{html:
    'A button in every fight that hands the <b>whole board</b> to Claude and lets you ask it anything — what a status does, why a card is greyed out, what to play this turn, whether the run is dead.'}));
  wrap.appendChild(el('p',{class:'dim small', html:
    'This game is a static page with no server, so it has nowhere to keep a secret. Paste your own Anthropic API key below and it is stored in <b>this browser only</b> — it is never sent anywhere except to Anthropic. Get one at <b>console.anthropic.com</b>.'}));
  const input = el('input',{class:'askinput', type:'password', placeholder:'sk-ant-…', value:key()});
  wrap.appendChild(input);
  wrap.appendChild(el('div',{class:'askfoot'},[
    el('button',{class:'btn gold sm', onclick:()=>{ setKey(input.value.trim()); closeModal();
      toast(input.value.trim()?'The naqqāl is listening.':'Key cleared.'); if(UI.screen==='combat') renderCombat(); }},'SAVE'),
    el('button',{class:'btn sm', onclick:()=>{ setKey(''); input.value=''; toast('Key cleared.'); }},'clear'),
    el('button',{class:'btn sm', onclick:closeModal},'← back'),
  ]));
  modal(wrap);
}

return { panel, setup, ask, boardState, ready, setKey,
         set proxy(u){ proxy = u; }, get proxy(){ return proxy; } };
})();

/* ═══════════ 4. THE BUTTON ═══════════ */
const _runBar_ask = runBar;
runBar = function(){
  const b = _runBar_ask();
  const btn = el('button',{class:'askbtn', title:'Ask the naqqāl about this exact board',
    onclick:()=>ASK.panel(), html:'✦'});
  const help = b.querySelector('.helpbtn');
  if(help) b.insertBefore(btn, help); else b.appendChild(btn);
  return b;
};

/* and a way in from the pause menu, so it can be set up before a fight */
const _menuModal_ask = menuModal;
menuModal = function(){
  _menuModal_ask();
  const box = document.querySelector('#modal .lore-modal');
  if(!box) return;
  const anchor = [...box.children].find(n=>/Codex/.test(n.textContent||''));
  box.insertBefore(el('button',{class:'btn', onclick:()=>{ closeModal(); ASK.ready() ? ASK.panel() : ASK.setup(); }},
    '✦ Ask the Naqqāl' + (ASK.ready()?'':' — set up')), anchor || null);
};
