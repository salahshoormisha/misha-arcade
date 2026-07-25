/* MISHANAMEH — headless fuzz harness. Dev only; not loaded by index.html.
   Load in the console:  var s=document.createElement('script');s.src='_fuzz.js';document.head.appendChild(s)
   Then:  __fuzz(400)  /  __fuzzRun(60) */

window.__fuzz = function(iters){
  const errs = [], stats = {turns:0, wins:0, losses:0, stalls:0, invokes:0};
  const allFoes = Object.keys(FOES);
  const heroes = ['rostam','gord','zal'];
  const allCards = Object.values(CARDS).filter(c=>c.type!=='status'&&c.type!=='curse'&&!c.unlisted);
  const tids = Object.keys(TALISMANS);
  for(let it=0; it<iters; it++){
    try{
      newRun(heroes[it%3], 1+(it%7));
      for(let i=0;i<18;i++){ const c=allCards[(Math.random()*allCards.length)|0]; R.deck.push(inst(c.id, Math.random()<0.5)); }
      ['s_blind','c_doubt','s_thirst','c_shackle'].forEach(id=>R.deck.push(inst(id)));
      for(let i=0;i<4;i++){ const id=tids[(Math.random()*tids.length)|0];
        if(!R.talismans.includes(id)){ R.talismans.push(id); if(TALISMANS[id].pickup) TALISMANS[id].pickup(R); } }
      R.cleared = it%8;
      const n = 1+((Math.random()*3)|0), ids=[];
      for(let i=0;i<n;i++) ids.push(allFoes[(Math.random()*allFoes.length)|0]);
      startCombat(Math.random()<0.2?'boss':'battle', ids);
      let guard=0;
      while(!G.over && guard++<80){
        let played=0;
        while(played++<14 && !G.over){
          const opts = G.hand.filter(c=>canPlay(c));
          if(!opts.length) break;
          const alive = G.foes.filter(f=>f.hp>0); if(!alive.length) break;
          playCard(opts[(Math.random()*opts.length)|0], alive[(Math.random()*alive.length)|0]);
          if(G.pending){
            const p=G.pending;
            if(p.kind==='discard'){ for(let k=0;k<p.n && G.hand.length;k++) G.discard.push(G.hand.pop()); }
            if(p.kind==='upgradeCombat'){ const t=G.hand.find(x=>!x.up && CARDS[x.id].cost>=0); if(t) t.up=true; }
            G.pending=null;
          }
        }
        if(!G.over && G.p.farr>=maxFarr() && Math.random()<0.75){ invoke(); stats.invokes++; }
        if(!G.over) endTurn();
        // invariants
        if(G.p.block<0) errs.push('it'+it+' NEGATIVE BLOCK');
        if(G.hand.length>10) errs.push('it'+it+' HAND OVERFLOW '+G.hand.length);
        if(G.foes.some(f=>f.hp>f.maxHp)) errs.push('it'+it+' FOE OVERHEAL');
        if(G.p.hp>G.p.maxHp) errs.push('it'+it+' PLAYER OVERHEAL '+G.p.hp+'/'+G.p.maxHp);
        if(G.p.farr>maxFarr()) errs.push('it'+it+' FARR OVERFLOW');
      }
      stats.turns += guard;
      if(guard>=80){ stats.stalls++; errs.push('it'+it+' STALLED foes='+ids.join(',')); }
      else if(G.won) stats.wins++; else stats.losses++;
      saveRun(true);
      const raw = JSON.stringify(SAVE.run);
      if(!raw || raw.length<50) errs.push('it'+it+' BAD SAVE');
      // restore round-trip
      const before = G.foes.map(f=>f.hp).join(',');
      if(!G.over){ restoreRun(); const after = G.foes.map(f=>f.hp).join(',');
        if(before!==after) errs.push('it'+it+' RESTORE MISMATCH'); }
    }catch(e){ errs.push('it'+it+': '+(e&&e.stack? e.stack.split('\n').slice(0,3).join(' § ') : e)); }
  }
  return {errors:errs.length, stats, sample:[...new Set(errs)].slice(0,10)};
};

/* full-run fuzz: whole 7-trial road, every node type, rewards, shops, events */
window.__fuzzRun = function(runs){
  const errs=[]; const stats={completed:0, died:0, secret:0, nodes:0};
  for(let r=0;r<runs;r++){
    try{
      const hero = ['rostam','gord','zal'][r%3];
      newRun(hero, 1+(r%3));
      let guard=0;
      while(R.trial<7 && guard++<300){
        // pick a random node type
        const types = R.step>=2 ? ['boss'] : ['battle','elite','camp','bazaar','omen'];
        const type = types[(Math.random()*types.length)|0];
        stats.nodes++;
        if(type==='camp'){ RunAPI.heal(20); const c=R.deck.find(x=>!x.up&&CARDS[x.id].cost>=0); if(c)c.up=true; R.step++; }
        else if(type==='bazaar'){ RunAPI.gold(-50); const p=poolFor(R.hero); R.deck.push(inst(p[(Math.random()*p.length)|0].id));
          if(R.deck.length>10) R.deck.splice((Math.random()*R.deck.length)|0,1); R.step++; }
        else if(type==='omen'){
          const pool = EVENTS.filter(e=>(!e.minTrial || R.trial+1>=e.minTrial));
          const ev = pool[(Math.random()*pool.length)|0];
          const ok = ev.choices.filter(c=>!c.req || c.req(RunAPI));
          const ch = (ok.length?ok:ev.choices)[(Math.random()*(ok.length||ev.choices.length))|0];
          const out = ch.fx(RunAPI);
          if(typeof out !== 'string') errs.push('r'+r+' EVENT '+ev.id+' returned non-string');
          UI.choiceQ = [];
          R.step++;
        } else {
          const t = trialDef(R.trial);
          let foes = type==='boss' ? [t.boss].concat(FOES[t.boss].minions||[])
                   : type==='elite' ? [ENCOUNTERS.elite[t.tier][(Math.random()*ENCOUNTERS.elite[t.tier].length)|0]]
                   : ENCOUNTERS[t.tier][(Math.random()*ENCOUNTERS[t.tier].length)|0].slice();
          startCombat(type, foes);
          let g2=0;
          while(!G.over && g2++<80){
            let p=0;
            while(p++<14 && !G.over){
              const opts=G.hand.filter(c=>canPlay(c)); if(!opts.length) break;
              const alive=G.foes.filter(f=>f.hp>0); if(!alive.length) break;
              playCard(opts[(Math.random()*opts.length)|0], alive[(Math.random()*alive.length)|0]);
              if(G.pending){ const pd=G.pending;
                if(pd.kind==='discard'){ for(let k=0;k<pd.n&&G.hand.length;k++) G.discard.push(G.hand.pop()); }
                if(pd.kind==='upgradeCombat'){ const t2=G.hand.find(x=>!x.up&&CARDS[x.id].cost>=0); if(t2)t2.up=true; }
                G.pending=null; }
            }
            if(!G.over && G.p.farr>=maxFarr()) invoke();
            if(!G.over) endTurn();
          }
          if(g2>=80){ errs.push('r'+r+' COMBAT STALL '+foes.join(',')); break; }
          if(!G.won){ stats.died++; break; }
          finishCombat();
          // rewards
          const rw = cardRewards(3, type); if(rw.length!==3) errs.push('r'+r+' reward count '+rw.length);
          R.deck.push(rw[0]);
          if(type==='elite') grantTalisman(Math.random()<0.3?'rare':'uncommon');
          if(type==='boss'){
            R.cleared++;
            const avail = BOSS_TALISMANS.filter(id=>!R.talismans.includes(id));
            if(avail.length) grantTalismanById(avail[0]);
            talHook('trialEnd', RunAPI);
            R.trial++; if(R.trial<7){ buildTrialMap(); }
          } else R.step++;
        }
        if(R.hp<=0){ stats.died++; break; }
      }
      if(guard>=300) errs.push('r'+r+' RUN STALL');
      if(R.trial>=7) stats.completed++;
    }catch(e){ errs.push('r'+r+': '+(e&&e.stack? e.stack.split('\n').slice(0,3).join(' § ') : e)); }
  }
  return {errors:errs.length, stats, sample:[...new Set(errs)].slice(0,10)};
};

/* static audit: every card/foe/talisman/event is well-formed */
window.__audit = function(){
  const p=[];
  Object.values(CARDS).forEach(c=>{
    ['id','name','fa','hero','type','cost','rarity'].forEach(k=>{ if(c[k]===undefined) p.push(`CARD ${c.id} missing ${k}`); });
    if(typeof c.t!=='function') p.push(`CARD ${c.id} no t()`);
    else { try{ if(!c.t(false)||!c.t(true)) p.push(`CARD ${c.id} empty text`); }catch(e){ p.push(`CARD ${c.id} t() threw: ${e}`); } }
    if(!c.unplayable && typeof c.fx!=='function') p.push(`CARD ${c.id} no fx()`);
    if(c.hero!=='status' && !['rostam','gord','zal','any'].includes(c.hero)) p.push(`CARD ${c.id} bad hero`);
  });
  Object.values(FOES).forEach(f=>{
    if(!f.moves||!f.moves.length) p.push(`FOE ${f.id} no moves`);
    if(typeof f.ai!=='function') p.push(`FOE ${f.id} no ai`);
    f.moves.forEach((m,i)=>{ if(m.k==='attack'&&typeof m.dmg!=='number') p.push(`FOE ${f.id} move ${i} no dmg`);
      if(m.k==='block'&&typeof m.blk!=='number') p.push(`FOE ${f.id} move ${i} no blk`);
      if(!m.n) p.push(`FOE ${f.id} move ${i} no name`); });
    // ai must return a valid index for many turn values
    for(let t=0;t<24;t++){ try{ const i=f.ai({...f,turn:t,hp:f.hp[0],maxHp:f.hp[1],buffs:{},_G:{foes:[]}} ,{foes:[]});
      if(typeof i!=='number'||isNaN(i)) p.push(`FOE ${f.id} ai returned ${i} at turn ${t}`); }catch(e){ p.push(`FOE ${f.id} ai threw at turn ${t}: ${e}`);} }
  });
  Object.values(TALISMANS).forEach(t=>{ if(!t.text) p.push(`TAL ${t.id} no text`); if(!t.art) p.push(`TAL ${t.id} no art`);
    if(!LORE.tals[t.id]) p.push(`TAL ${t.id} no lore`); });
  EVENTS.forEach(e=>{ if(!e.choices||e.choices.length<2) p.push(`EVENT ${e.id} too few choices`);
    e.choices.forEach((c,i)=>{ if(!c.label||!c.sub) p.push(`EVENT ${e.id} choice ${i} incomplete`);
      if(typeof c.fx!=='function') p.push(`EVENT ${e.id} choice ${i} no fx`); }); });
  Object.values(FOES).forEach(f=>{ if(!LORE.foes[f.id]) p.push(`FOE ${f.id} no lore`); });
  TRIALS.concat([SECRET_TRIAL]).forEach(t=>{ if(!FOES[t.boss]) p.push(`TRIAL ${t.n} boss ${t.boss} missing`); });
  Object.values(ENCOUNTERS).forEach(v=>{ if(Array.isArray(v)) v.forEach(g=>g.forEach(id=>{ if(!FOES[id]) p.push(`ENC unknown foe ${id}`); }));
    else Object.values(v).forEach(g=>g.forEach(id=>{ if(!FOES[id]) p.push(`ENC unknown elite ${id}`); })); });
  ['rostam','gord','zal'].forEach(h=>{ STARTERS[h].forEach(id=>{ if(!CARDS[id]) p.push(`STARTER ${h} unknown card ${id}`); });
    ['common','uncommon','rare'].forEach(r=>{ if(!poolFor(h).filter(c=>c.rarity===r).length) p.push(`POOL ${h} has no ${r}`); }); });
  return {problems:p.length, list:p};
};

/* ── a competent-ish bot, for balance measurement ── */
window.__bot = function(){
  let guard=0;
  while(!G.over && guard++<90){
    let acted=true;
    while(acted && !G.over){
      acted=false;
      const incoming = G.foes.filter(f=>f.hp>0).reduce((s,f)=>{ const i=intentOf(f); return s+(i.k==='attack'? i.dmg*(i.hits||1):0); },0);
      const need = Math.max(0, incoming - G.p.block);
      const opts = G.hand.filter(c=>canPlay(c)); if(!opts.length) break;
      const alive = G.foes.filter(f=>f.hp>0); if(!alive.length) break;
      const score = (c)=>{ const d=CARDS[c.id]; let s=0; const txt=d.t(c.up);
        if(d.type==='power') s+=90-G.turn*6;
        if(cardCost(c)===0) s+=45;
        if(/[Dd]raw/.test(txt)) s+=22;
        if(d.type==='skill' && /Block/.test(txt)) s += need>0 ? 60+Math.min(60,need*1.7) : 4;
        if(d.type==='attack'){ s+=40; const w=alive.reduce((a,b)=>a.hp<b.hp?a:b);
          if(w.hp<=14) s+=35; if(need>28 && G.p.block<need*0.5) s-=26; }
        if(/Farr/.test(txt)) s += (maxFarr()-G.p.farr)<=3 ? 34 : 12;
        if(/Weak|Vulnerable/.test(txt)) s+=26;
        if(/Venom/.test(txt) && R.hero==='gord') s+=30;
        if(/[Ll]ose \d+ HP/.test(txt) && G.p.hp < G.p.maxHp*0.35) s-=55;
        return s+Math.random()*6; };
      opts.sort((a,b)=>score(b)-score(a));
      const target = alive.reduce((a,b)=>{ const ia=intentOf(a), ib=intentOf(b);
        if(a.hp<=14 && b.hp>14) return a; if(b.hp<=14 && a.hp>14) return b;
        return ((ia.dmg||0)*(ia.hits||1)) >= ((ib.dmg||0)*(ib.hits||1)) ? a : b; });
      playCard(opts[0], target);
      if(G.pending){ const pd=G.pending;
        if(pd.kind==='discard'){ for(let k=0;k<pd.n&&G.hand.length;k++){
            const worst=G.hand.reduce((a,b)=> CARDS[a.id].unplayable?a: CARDS[b.id].unplayable?b: (cardCost(a)>cardCost(b)?a:b));
            G.discard.push(G.hand.splice(G.hand.indexOf(worst),1)[0]); } }
        if(pd.kind==='upgradeCombat'){ const t=G.hand.find(x=>!x.up&&CARDS[x.id].cost>=0); if(t)t.up=true; }
        G.pending=null; }
      acted=true;
    }
    if(!G.over && G.p.farr>=maxFarr()) invoke();
    if(!G.over) endTurn();
  }
  return guard;
};

window.__balance = function(runs, khan, heroOnly){
  const res={wins:0, dead:{}, deaths:0, avgDeck:0, avgTrial:0, ft:[], errs:[], perHero:{}};
  for(let r=0;r<runs;r++){
   try{
    const hero = heroOnly || ['rostam','gord','zal'][r%3];
    newRun(hero, khan||1);
    res.perHero[hero]=res.perHero[hero]||{n:0,w:0};
    res.perHero[hero].n++;
    let alive=true, guard=0;
    while(alive && R.trial<7 && guard++<250){
      const t=trialDef(R.trial);
      if(R.step < R.map.length-1){
        const roll=Math.random();
        const type = roll<0.42?'battle': roll<0.54?'elite': roll<0.74?'camp': roll<0.87?'bazaar':'omen';
        if(type==='camp'){ RunAPI.heal(Math.round(R.maxHp*0.32)+mod('restBonus'));
          const c=R.deck.find(x=>!x.up&&CARDS[x.id].cost>=0); if(c)c.up=true; }
        else if(type==='bazaar'){ if(R.gold>=85 && R.deck.length>10){ R.gold-=85;
            const i=R.deck.findIndex(x=>x.id.endsWith('_strike')||x.id.endsWith('_guard')); if(i>=0) R.deck.splice(i,1); }
          if(R.gold>=140){ R.gold-=140; const p=poolFor(R.hero).filter(c=>c.rarity!=='common');
            R.deck.push(inst(p[(Math.random()*p.length)|0].id)); } }
        else if(type==='omen'){ const pool=EVENTS.filter(e=>!e.minTrial||R.trial+1>=e.minTrial);
          const ev=pool[(Math.random()*pool.length)|0]; const ok=ev.choices.filter(c=>!c.req||c.req(RunAPI));
          (ok.length?ok:ev.choices)[0].fx(RunAPI); UI.choiceQ=[]; }
        else { const foes = type==='elite'? [ENCOUNTERS.elite[t.tier][(Math.random()*ENCOUNTERS.elite[t.tier].length)|0]]
                     : ENCOUNTERS[t.tier][(Math.random()*ENCOUNTERS[t.tier].length)|0].slice();
          startCombat(type,foes); res.ft.push(__bot());
          if(!G.won){ alive=false; const k=t.roman+' '+foes.join('+'); res.dead[k]=(res.dead[k]||0)+1; break; }
          finishCombat(); R.gold += type==='elite'?70:35;
          const rw=cardRewards(3,type); if(Math.random()<0.75) R.deck.push(rw[0]);
          if(type==='elite') grantTalisman('uncommon'); }
        R.step++;
      } else {
        startCombat('boss',[t.boss].concat(FOES[t.boss].minions||[])); res.ft.push(__bot());
        if(!G.won){ alive=false; const k='BOSS '+t.roman+' '+t.name; res.dead[k]=(res.dead[k]||0)+1; break; }
        finishCombat(); R.cleared++; R.gold+=110;
        const av=BOSS_TALISMANS.filter(id=>!R.talismans.includes(id)); if(av.length) grantTalismanById(av[(Math.random()*av.length)|0]);
        talHook('trialEnd', RunAPI);
        R.deck.push(cardRewards(3,'boss')[0]);
        R.hp=Math.min(R.maxHp, R.hp+Math.round(R.maxHp*0.12));
        R.trial++; if(R.trial<7) buildTrialMap();
      }
    }
    res.avgTrial+=R.trial; res.avgDeck+=R.deck.length;
    if(R.trial>=7){ res.wins++; res.perHero[hero].w++; } else res.deaths++;
   }catch(e){ res.errs.push(e.stack?e.stack.split('\n').slice(0,2).join(' § '):String(e)); }
  }
  res.avgTrial=(res.avgTrial/runs).toFixed(2); res.avgDeck=(res.avgDeck/runs).toFixed(1);
  res.avgFightTurns=(res.ft.reduce((a,b)=>a+b,0)/res.ft.length).toFixed(1); delete res.ft;
  res.winRate=(res.wins/runs*100).toFixed(0)+'%';
  Object.keys(res.perHero).forEach(h=>res.perHero[h].rate=(res.perHero[h].w/res.perHero[h].n*100).toFixed(0)+'%');
  res.dead=Object.fromEntries(Object.entries(res.dead).sort((a,b)=>b[1]-a[1]).slice(0,8));
  return res;
};

/* ── drives the REAL UI: clicks cards, targets, end-turn, rewards, shops, events ── */
window.__uiplay = async function(maxNodes){
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const clickSel=async(sel,i=0)=>{ const els=[...document.querySelectorAll(sel)]; if(!els[i]) return false; els[i].click(); await sleep(80); return true; };
  const log=[], errs=[];
  for(let node=0; node<maxNodes; node++){
    await sleep(120);
    if(document.querySelector('.mback')){ await clickSel('.mback .btn'); await sleep(140); }
    if(document.querySelector('.end')){ log.push('END SCREEN at node '+node); break; }
    if(document.querySelector('.combat')){
      let turns=0;
      while(document.querySelector('.combat') && turns++<60){
        if(document.querySelector('.mback')){ await clickSel('.mback .btn'); await sleep(110); continue; }
        const inv=document.querySelector('.invoke.lit'); if(inv && Math.random()<0.6){ inv.click(); await sleep(480); continue; }
        const playable=[...document.querySelectorAll('.hand .card.playable')];
        if(playable.length && Math.random()<0.93){
          playable[(Math.random()*playable.length)|0].click(); await sleep(100);
          const tgts=[...document.querySelectorAll('.foe.targetable')];
          if(tgts.length){ tgts[(Math.random()*tgts.length)|0].click(); await sleep(100); }
          const choosable=[...document.querySelectorAll('.hand .card.choosable')];
          if(UI.choiceMode && choosable.length){ choosable[0].click(); await sleep(100); }
          continue;
        }
        const et=document.querySelector('#endTurn'); if(et && !et.disabled){ et.click(); await sleep(340); } else await sleep(130);
      }
      if(turns>=60) errs.push('UI combat did not terminate');
      await sleep(460);
    }
    if(document.querySelector('.rewardzone')){
      let g=0;
      while(document.querySelector('.rewardzone') && g++<8){
        if(await clickSel('.talcard.pick')){ await sleep(110); continue; }
        if(await clickSel('.rewardzone .cardrow .card')){ await sleep(110); continue; }
        if(await clickSel('.rewardzone .btn')){ await sleep(200); continue; }
        break;
      }
    } else if(document.querySelector('.node-scr')){
      if(document.querySelector('.shoprow')) await clickSel('.scr .btn.big');
      else { await clickSel('.choices .node', (Math.random()*2)|0); await sleep(200);
             if(document.querySelector('.mback')) await clickSel('.mback .btn');
             if(document.querySelector('.deckgrid')) await clickSel('.deckgrid .card'); }
    } else if(document.querySelector('.map')){
      await clickSel('.nodes .node', (Math.random()*2)|0);
    }
  }
  return {errs, log, screen:UI.screen, trial:R?R.trial:'-', hp:R?R.hp:'-', deck:R?R.deck.length:'-'};
};
