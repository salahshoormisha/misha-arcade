/* MISHANAMEH — the writing, reorganised.
   ────────────────────────────────────────────────────────────────────────
   Misha: "lots of the writing is just plain confusing… lots is incomprehensible."

   Reading it back, the sentences are mostly fine. The problem is *order*. A
   boss walks on and the game hands you seventy-five words about Achaemenid
   court politics before it tells you the thing has 108 HP and summons. You are
   trying to decide whether to spend your Farr, and you are being handed an
   essay.

   So nothing here is deleted. It is re-stacked:

     1. what this is, in one plain line
     2. what it does to you, as mechanics, generated from its own moves
     3. the history — still all of it — behind "the story", opt-in

   Which also fixes the other half of the problem: once the history is a thing
   you choose to open, it stops being noise and starts being the reward it was
   meant to be.                                                              */

/* ═══════════ 1. WHAT A CREATURE DOES, FROM ITS OWN MOVES ═══════════ */
function moveWords(f, mv){
  if(mv.k==='attack'){
    const total = mv.dmg*(mv.hits||1);
    return mv.hits>1 ? `hits you ${mv.hits}× for ${mv.dmg} (${total})` : `hits you for ${mv.dmg}`;
  }
  if(mv.k==='block')  return `braces for ${mv.blk} Block`;
  if(mv.k==='buff')   return mv.txt ? mv.txt.toLowerCase() : 'strengthens itself';
  if(mv.k==='debuff') return mv.txt ? mv.txt.toLowerCase() : 'weakens you';
  return mv.txt || mv.n || 'does something else';
}

function dossier(id){
  const f = FOES[id]; if(!f) return null;
  const hp = Array.isArray(f.hp)
    ? (f.hp[0]===f.hp[1] ? String(f.hp[0]) : `${f.hp[0]}–${f.hp[1]}`)
    : String(f.hp);
  const rows = (f.moves||[]).map(mv=>({ n: mv.n, w: moveWords(f, mv) }));
  return { hp, rows, mech: f.mech };
}

function dossierEl(id){
  const d = dossier(id); if(!d) return null;
  const box = el('div',{class:'dossier'});
  box.appendChild(el('div',{class:'dosslab', text:'WHAT IT DOES'}));
  const hp = el('div',{class:'dosshp'});
  hp.appendChild(el('b',{text:d.hp}));
  hp.appendChild(el('span',{text:'health'}));
  box.appendChild(hp);
  const list = el('div',{class:'dosslist'});
  d.rows.forEach(r=>{
    const row = el('div',{class:'dossrow'});
    row.appendChild(el('b',{text:r.n}));
    row.appendChild(el('span',{html:markup(r.w)}));
    list.appendChild(row);
  });
  box.appendChild(list);
  if(d.mech) box.appendChild(el('div',{class:'dossmech', html:markup(d.mech)}));
  box.appendChild(el('div',{class:'dossnote', html:
    'It always shows which of these it is about to do, in words, under its name.'}));
  return box;
}

/* ═══════════ 2. ONE PLAIN LINE PER SET-PIECE ═══════════
   Written by hand, because the point is that it is the sentence you would say
   to somebody sitting next to you, and no rule generates that. */
const GIST = {
  /* Haft Khān */
  lion:      'Rakhsh kills it while Rostam is asleep. Rostam is annoyed about it.',
  thirst:    'Not a monster — a desert with no water in it.',
  dragon:    'It disappears every time Rostam looks. The horse can see it.',
  witch:     'A beautiful woman at a laid table, until somebody says the name of God.',
  ulad:      'A man, not a monster. Beat him and he becomes your guide.',
  arzhang:   'The White Demon’s lieutenant. Rostam walks in and shouts his own name.',
  sepid:     'The White Demon, asleep in a cave, who has already blinded a king and his army.',
  watcher:   'Not in the book. Somebody added a tower and put something awake at the top of it.',

  /* Royal Road */
  herald:    'A clerk with a quota: two young people today, for the king’s shoulders.',
  zahhak:    'A tyrant a thousand years old with two serpents growing out of his shoulders. They have to be fed.',
  chinvat:   'The bridge every soul crosses. It widens for the honest and turns edge-on for the rest.',
  haman:     'A vizier who was not bowed to, and decided to kill an entire people over it.',
  wall:      'A hand writes four words on the plaster and nobody at the feast can read them.',
  druj:      'The Lie itself. In this religion that is not a sin — it is the enemy.',
  ahriman:   'Not a devil and not a rebel. A separate will that chose destruction before there was anything to destroy.',

  /* the censors */
  burner:    'He does not fight you. He takes a card out of your deck and it is gone.',
  renamer:   'He files your cards under a different alphabet. Pārs becomes Fārs.',
  jizya:     'The tax you paid to go on being Zoroastrian. It takes your gold, not your blood.',

  /* elites worth a line */
  senmurv:   'The dog-headed, peacock-tailed bird off a thousand Sasanian silks.',
  gaokerena: 'The lizard Ahriman put in the sea to gnaw the tree of all seeds.',
  aeshma:    'The demon of Wrath. His name went east and became Ashmedai in the Talmud.',
  jahi:      'The demoness who wakes Ahriman from three thousand years of stupor.',
  nasu:      'The corpse-fly. The reason Zoroastrians expose their dead rather than bury them.',
  karapan:   'A priest of the old cult who gets the words wrong on purpose.',
};

/* ═══════════ 3. THE BOSS DOOR ═══════════ */
function creatureModal(id, opts){
  const f = FOES[id]; if(!f) return null;
  const o = opts||{};
  const box = el('div',{class:'lore-modal creature '+(o.boss?'boss':'')});

  box.appendChild(PLATE.node(id, o.boss?168:132, 'foe'));
  box.appendChild(el('h2',{text:f.name}));
  if(f.fa) box.appendChild(el('div',{class:'bfa', text:f.fa}));

  const g = GIST[id];
  if(g) box.appendChild(el('p',{class:'gist', text:g}));

  const dos = dossierEl(id);
  if(dos) box.appendChild(dos);

  if(f.intro){
    const tell = el('div',{class:'storyfold'});
    const btn = el('button',{class:'storybtn', html:'the story <i>&#9662;</i>'});
    const body = el('p',{class:'storybody', text:f.intro});
    btn.addEventListener('click', ()=>{
      const open = tell.classList.toggle('open');
      btn.innerHTML = open ? 'the story <i>&#9652;</i>' : 'the story <i>&#9662;</i>';
      if(open && typeof NAQQAL!=='undefined' && g) NAQQAL.tell(g, {hold:2600});
    });
    tell.appendChild(btn); tell.appendChild(body);
    box.appendChild(tell);
  }

  box.appendChild(el('button',{class:'btn gold', onclick:closeModal}, o.label || 'FACE IT'));
  return box;
}

bossIntro = function(t){
  const box = creatureModal(t.boss, {boss:true, label:'FACE IT'});
  if(!box) return;
  modal(box,{sticky:true}); sfx('boss');
  if(typeof NAQQAL!=='undefined'){
    const f = FOES[t.boss];
    NAQQAL.tell(f.name + '.', {fa:f.fa||'', hold:1500});
    if(GIST[t.boss]) NAQQAL.tell(GIST[t.boss], {hold:3200});
  }
};

eliteIntro = function(d){
  const id = d.id || d;
  const box = creatureModal(id, {label:'GOOD'});
  if(!box) return;
  modal(box);
};

/* ═══════════ 4. THE MARGIN, SHORTENED ═══════════
   The first-sight note used to drop the whole Codex paragraph on you mid-fight
   for eleven seconds. Lead with the gist; the paragraph stays in the Codex. */
if(typeof marginalia === 'function'){
  const _marginalia_prose = marginalia;
  marginalia = function(name, fa, text, kind, id){
    const g = (kind==='foes' && GIST[id]) ? GIST[id] : null;
    let t = String(text||'');
    if(g){ t = g + '\n\n' + t; }
    // cut mid-fight notes down to something you can read between turns
    if(UI.screen==='combat' && t.length > 260){
      const cut = t.slice(0, 230);
      t = cut.slice(0, cut.lastIndexOf(' ')) + '…  <i>(the rest is in the Codex)</i>';
    }
    return _marginalia_prose(name, fa, t, kind, id);
  };
}

/* ═══════════ 5. OMENS: THE CHOICE FIRST ═══════════
   An omen is a decision. It was printing eighty words of setting above the two
   buttons. Same words, folded. */
const _screenOmen_prose = (typeof screenOmen==='function') ? screenOmen : null;
if(_screenOmen_prose){
  screenOmen = function(){
    _screenOmen_prose();
    const wrap = document.querySelector('#app > .scr');
    if(!wrap) return;
    const body = wrap.querySelector('.etext, .otext, .ndesc, p');
    if(!body || body.textContent.length < 210) return;
    const full = body.textContent;
    const first = full.split(/(?<=[.!?])\s+/)[0];
    if(first.length > 190 || first.length === full.length) return;
    body.textContent = first;
    const more = el('button',{class:'ttmore', text:'the rest of it', onclick:()=>{
      body.textContent = full; more.remove();
    }});
    body.parentNode.insertBefore(more, body.nextSibling);
  };
}

/* ═══════════ 6. THE CODEX GETS THE GISTS TOO ═══════════ */
if(typeof LORE !== 'undefined' && LORE.foes){
  Object.keys(GIST).forEach(id=>{
    if(LORE.foes[id] && LORE.foes[id].indexOf(GIST[id]) < 0)
      LORE.foes[id] = '<b>' + GIST[id] + '</b>\n\n' + LORE.foes[id];
  });
}
