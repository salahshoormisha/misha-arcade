/* MISHANAMEH — a voice worth listening to.
   ────────────────────────────────────────────────────────────────────────
   speechSynthesis is a lift announcement. ElevenLabs is a person. So if a key
   is present the naqqāl speaks through ElevenLabs, and if it is not, the
   pardeh carries the performance alone and nothing sounds bad.

   Every line is cached in IndexedDB under a hash of (voice, text), so a line
   is generated once, ever, and after the first run the whole game is speaking
   from local cache with no network and no further cost. The narration script
   is finite — a few dozen lines plus the boss and trial intros — so the whole
   thing settles at a few megabytes and then stops costing anything.

   Same shape as the Claude advisor: your key, your browser, or point PROXY at
   a serverless function and the key field disappears.                       */

const ELEVEN = (function(){

const KEY   = 'mishanameh.11key';
const VOICE_KEY = 'mishanameh.11voice';
/* Default is one of ElevenLabs' standard voices — a warm, unhurried
   storyteller. Overridable in settings for anyone who wants a different one. */
const DEFAULT_VOICE = 'onwK4e9ZLuTAKqWW03F9';    // "Daniel" — deep, measured, British
const MODEL = 'eleven_turbo_v2_5';               // fast and cheap; quality is plenty for narration
let PROXY = null;

function key(){ try{ return localStorage.getItem(KEY)||''; }catch(e){ return ''; } }
function setKey(k){ try{ k?localStorage.setItem(KEY,k):localStorage.removeItem(KEY); }catch(e){} }
function voiceId(){ try{ return localStorage.getItem(VOICE_KEY)||DEFAULT_VOICE; }catch(e){ return DEFAULT_VOICE; } }
function setVoice(v){ try{ v?localStorage.setItem(VOICE_KEY,v):localStorage.removeItem(VOICE_KEY); }catch(e){} }
function ready(){ return !!PROXY || !!key(); }

/* ── the cache ────────────────────────────────────────────────────────── */
let db = null;
function open(){
  if(db) return Promise.resolve(db);
  return new Promise((res,rej)=>{
    const r = indexedDB.open('mishanameh-voice', 1);
    r.onupgradeneeded = ()=>{ r.result.createObjectStore('lines'); };
    r.onsuccess = ()=>{ db = r.result; res(db); };
    r.onerror = ()=>rej(r.error);
  });
}
function hash(s){
  let h = 2166136261>>>0;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; }
  return h.toString(36);
}
async function cached(k){
  try{
    const d = await open();
    return await new Promise((res)=>{
      const t = d.transaction('lines','readonly').objectStore('lines').get(k);
      t.onsuccess = ()=>res(t.result||null); t.onerror = ()=>res(null);
    });
  }catch(e){ return null; }
}
async function store(k, buf){
  try{
    const d = await open();
    d.transaction('lines','readwrite').objectStore('lines').put(buf, k);
  }catch(e){}
}

/* ── speaking ─────────────────────────────────────────────────────────── */
let audio = null, inflight = null;

async function fetchLine(text){
  const url = PROXY || `https://api.elevenlabs.io/v1/text-to-speech/${voiceId()}?output_format=mp3_44100_128`;
  const headers = { 'content-type':'application/json' };
  if(!PROXY) headers['xi-api-key'] = key();
  const res = await fetch(url, { method:'POST', headers, body: JSON.stringify({
    text,
    model_id: MODEL,
    voice_settings: { stability:0.42, similarity_boost:0.78, style:0.28, use_speaker_boost:true },
  })});
  if(!res.ok) throw new Error('ElevenLabs '+res.status);
  return await res.arrayBuffer();
}

async function say(text){
  if(!ready() || !text) return false;
  const clean = String(text).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(!clean) return false;
  const k = voiceId()+':'+hash(clean);
  try{
    let buf = await cached(k);
    if(!buf){ buf = await fetchLine(clean); store(k, buf); }
    stop();
    const blob = new Blob([buf], {type:'audio/mpeg'});
    audio = new Audio(URL.createObjectURL(blob));
    audio.volume = 0.92;
    audio.onplay = ()=>{ if(typeof MUSIC!=='undefined' && MUSIC.duck) MUSIC.duck(1400); };
    audio.onended = ()=>{ try{ URL.revokeObjectURL(audio.src); }catch(e){} };
    await audio.play().catch(()=>{});
    return true;
  }catch(e){
    console.warn('[naqqāl]', e.message);
    return false;
  }
}
function stop(){ if(audio){ try{ audio.pause(); }catch(e){} audio = null; } }

/* ── warming the cache ────────────────────────────────────────────────────
   Everything the game will ever say, generated once in the background so the
   first play of a line is not a two-second wait. Cheap: it is a fixed list. */
function scriptLines(){
  const out = new Set();
  const add = s=>{ if(s && String(s).trim()) out.add(String(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()); };
  add('Around the year 1000, a poet spent thirty years and every coin he had writing the old stories down in Persian.');
  add('It is the reason there is still a Persian language. This is a small piece of it.');
  add('The road ends here. It does not end for good — that is the point of a road.');
  add('“I have suffered much these thirty years — I revived the Persians with this Persian.”');
  add('Every soul crosses on the fourth day after death.');
  add('Halfway over you meet your own conscience, walking the other way, in the shape of a woman.');
  add('Whether she is beautiful is not up to her.');
  add('The war is lost. The peace is that the border goes wherever one arrow lands.');
  add('Written back — and sharper than it was.');
  if(typeof RESIST_LINES!=='undefined') Object.values(RESIST_LINES).forEach(add);
  if(typeof ROADS!=='undefined') Object.values(ROADS).forEach(r=>{
    (r.trials||[]).forEach(t=>{ add(`Trial ${t.roman} — ${t.name}.`); if(t.sub) add(t.sub.replace(/^in which /,'In which ')+'.'); });
    if(r.secret){ add(`Trial ${r.secret.roman} — ${r.secret.name}.`); }
  });
  if(typeof FOES!=='undefined') Object.values(FOES).forEach(f=>{ if(f.tier==='boss'||f.intro) add(f.name+'.'); });
  return [...out];
}

async function warm(onProgress){
  if(!ready()) return {done:0, total:0};
  const lines = scriptLines();
  let done = 0, made = 0;
  for(const line of lines){
    const k = voiceId()+':'+hash(line);
    if(!(await cached(k))){
      try{ const buf = await fetchLine(line); await store(k, buf); made++; }
      catch(e){ /* keep going; a missed line just falls back to silence */ }
      await new Promise(r=>setTimeout(r, 120));       // be polite to the rate limit
    }
    done++;
    onProgress && onProgress(done, lines.length, made);
  }
  return {done, total:lines.length, made};
}

async function clearCache(){
  try{ const d = await open(); d.transaction('lines','readwrite').objectStore('lines').clear(); }catch(e){}
}

return { say, stop, warm, ready, setKey, setVoice, clearCache, scriptLines,
         get voiceId(){ return voiceId(); }, get hasKey(){ return !!key(); },
         set proxy(u){ PROXY = u; } };
})();

/* ═══════════ the naqqāl prefers the good voice ═══════════ */
(function(){
  if(typeof NAQQAL === 'undefined') return;
  // NAQQAL.tell already calls VOICE.say; intercept at the VOICE layer so both
  // paths (pardeh narration and any direct call) get the better voice.
  const _voiceSay = VOICE.say;
  VOICE.say = function(text, opt){
    if(ELEVEN.ready()){ ELEVEN.say(text); return; }
    _voiceSay.call(VOICE, text, opt);
  };
  const _voiceShush = VOICE.shush;
  VOICE.shush = function(){ ELEVEN.stop(); _voiceShush.call(VOICE); };
})();

/* ═══════════ settings ═══════════ */
function elevenSettings(){
  const wrap = el('div',{class:'lore-modal askbox'});
  wrap.appendChild(el('h2',{text:'THE NAQQĀL’S VOICE'}));
  wrap.appendChild(el('p',{html:
    'The browser’s built-in voice is a lift announcement. With an <b>ElevenLabs</b> key the narration is spoken by an actual voice, and every line is cached in this browser after the first time — so it is generated once and then costs nothing.'}));
  wrap.appendChild(el('p',{class:'dim small', html:
    'Your key is stored in <b>this browser only</b>. Get one at <b>elevenlabs.io</b> — the free tier covers a lot of narration. Leave it blank and the pardeh carries the story on its own, which is also fine.'}));
  const kin = el('input',{class:'askinput', type:'password', placeholder:'ElevenLabs API key', value: ELEVEN.hasKey ? '••••••••••••' : ''});
  wrap.appendChild(kin);
  const vin = el('input',{class:'askinput', type:'text', placeholder:'voice id (optional)', value: ELEVEN.voiceId});
  wrap.appendChild(vin);
  const prog = el('div',{class:'dim small', text:''});
  wrap.appendChild(prog);
  wrap.appendChild(el('div',{class:'askfoot'},[
    el('button',{class:'btn gold sm', onclick:()=>{
      if(kin.value && !/^•+$/.test(kin.value)) ELEVEN.setKey(kin.value.trim());
      ELEVEN.setVoice(vin.value.trim());
      if(typeof SAVE!=='undefined'){ SAVE.voice = true; persist(); }
      if(typeof VOICE!=='undefined') VOICE.setEnabled(true);
      toast(ELEVEN.ready()?'The naqqāl has a voice.':'Voice cleared.');
      closeModal();
    }},'SAVE'),
    el('button',{class:'btn sm', onclick:async(e)=>{
      if(!ELEVEN.ready()){ toast('Set a key first.'); return; }
      e.target.disabled = true;
      await ELEVEN.warm((d,t,m)=>{ prog.textContent = `preparing the performance… ${d}/${t}${m?` (${m} new)`:''}`; });
      prog.textContent = 'Ready. Every line is now local.';
      e.target.disabled = false;
    }},'pre-record everything'),
    el('button',{class:'btn sm', onclick:()=>{ ELEVEN.setKey(''); ELEVEN.clearCache(); kin.value=''; toast('Cleared.'); }},'clear'),
    el('button',{class:'btn sm', onclick:closeModal},'← back'),
  ]));
  modal(wrap);
}

const _menuModal_11 = menuModal;
menuModal = function(){
  _menuModal_11();
  const box = document.querySelector('#modal .lore-modal');
  if(!box) return;
  const anchor = [...box.children].find(n=>/Codex/.test(n.textContent||''));
  box.insertBefore(el('button',{class:'btn', onclick:()=>{ closeModal(); elevenSettings(); }},
    '🎙 The naqqāl’s voice' + (ELEVEN.ready()?'':' — set up')), anchor || null);
};
