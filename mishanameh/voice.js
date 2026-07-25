/* MISHANAMEH — the naqqāl.

   Naqqāli is the Persian art of telling the Shāhnāmeh out loud: one performer,
   standing in a coffee-house, doing all the voices, for hours, from memory,
   with a painted cloth behind them for illustrations. UNESCO put it on the
   list of intangible heritage in danger in 2011, because the last generation
   of professional naqqāls is old and there are very few of them left.

   This is a browser speech synthesiser, which is not that. But the game should
   at least be *spoken*, because that is how this story has always travelled,
   and every word it says is also on the screen for anyone who would rather
   read — or who has it switched off, which takes one tap.                    */

const VOICE = (()=>{

let ok = typeof speechSynthesis !== 'undefined';
let picked = null, warmed = false;
let on = true;

/* Preference order: a warm, unhurried English voice. Different machines have
   wildly different lists, so we score rather than demand. */
const GOOD = ['daniel','serena','oliver','arthur','moira','karen','samantha','alex','fiona','tessa','google uk english male','google uk english female'];

function choose(){
  if(!ok) return null;
  const vs = speechSynthesis.getVoices();
  if(!vs || !vs.length) return null;
  let best=null, bestScore=-1;
  for(const v of vs){
    const n = (v.name||'').toLowerCase();
    let s = 0;
    const gi = GOOD.findIndex(g=>n.includes(g));
    if(gi>=0) s += 50 - gi;
    if(/^en(-|_)?(gb|au|ie)/i.test(v.lang)) s += 12;
    else if(/^en/i.test(v.lang)) s += 8;
    else s -= 20;
    if(/premium|enhanced|natural|neural/.test(n)) s += 14;
    if(/compact|novelty|whisper|bad news|bells|zarvox|trinoids|albert/.test(n)) s -= 40;
    if(v.localService) s += 3;
    if(s>bestScore){ bestScore=s; best=v; }
  }
  return best;
}

function warm(){
  if(!ok || warmed) return;
  picked = choose();
  if(picked) warmed = true;
}
if(ok){
  try{ speechSynthesis.onvoiceschanged = ()=>{ picked = choose() || picked; warmed = !!picked; }; }catch(e){}
  setTimeout(warm, 300);
  setTimeout(warm, 1400);
}

/* Persian names come out mangled by an English synthesiser, so we hand it a
   rough phonetic spelling instead. It is not a transliteration scheme — it is
   just what makes the machine stop saying "Roast-am". */
const SAY_AS = [
  [/Rostam/gi,'Rostum'], [/Ferdows[īi]/gi,'Ferdowsee'], [/Sh[āa]hn[āa]meh/gi,'Shah-nah-meh'],
  [/Sim[uū]rgh/gi,'Simorgh'], [/Z[āa]l\b/gi,'Zaal'], [/Gord[āa]farid/gi,'Gordah-fareed'],
  [/D[īi]v-?e Sep[īi]d/gi,'Deev-e Sepeed'], [/Azhdah[āa]/gi,'Azh-dahaa'],
  [/M[āa]zandar[āa]n/gi,'Mazandaraan'], [/Zahh[āa]k/gi,'Zahaak'], [/Kh[āa]n\b/gi,'Khaan'],
  [/Haft Kh[āa]n/gi,'Haft Khaan'], [/Farr\b/gi,'Far'], [/Arzhang/gi,'Arzhang'],
  [/K[āa]veh/gi,'Kaave'], [/Fer[ēe]d[uū]n/gi,'Fereydoon'], [/Ahriman/gi,'Ah-riman'],
  [/Ahura Mazda/gi,'Ahoora Mazda'], [/Chinvat/gi,'Chinvat'], [/[Ā]rash|Arash/g,'Aarash'],
  [/Esther/gi,'Esther'], [/Ul[āa]d/gi,'Oolaad'], [/Rakhsh/gi,'Raksh'],
  [/Bīsot[uū]n|Bisotun/gi,'Bee-sotoon'], [/Naqq[āa]l/gi,'Nagh-ghaal'],
];
function speakable(s){
  let t = String(s).replace(/<[^>]+>/g,' ').replace(/[*_]/g,'').replace(/\s+/g,' ').trim();
  SAY_AS.forEach(([re,to])=>{ t = t.replace(re,to); });
  return t;
}

function say(text, opt={}){
  if(!ok || !on || !text) return;
  try{
    if(!warmed) warm();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    if(picked) u.voice = picked;
    u.rate  = opt.rate  != null ? opt.rate  : 0.88;   // a storyteller is unhurried
    u.pitch = opt.pitch != null ? opt.pitch : 0.92;
    u.volume= opt.volume!= null ? opt.volume: 0.95;
    u.onstart = ()=>{ if(typeof MUSIC!=='undefined') MUSIC.duck(1200); };
    speechSynthesis.speak(u);
  }catch(e){}
}
function shush(){ if(ok){ try{ speechSynthesis.cancel(); }catch(e){} } }
function setEnabled(v){ on = !!v; if(!on) shush(); }

return { say, shush, setEnabled, get on(){ return on; }, get available(){ return ok; },
         get voiceName(){ return picked ? picked.name : null; } };
})();
