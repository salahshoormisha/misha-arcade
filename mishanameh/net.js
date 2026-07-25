/* MISHANAMEH — NET.
   Two people on two different machines, in two different cities, playing the
   same fight.

   The whole arcade is a static site on GitHub Pages: no server, no database,
   nowhere to run a game loop. So the transport is a public MQTT broker over
   secure WebSocket. Those exist, they are free, they need no account, and they
   are the only piece of infrastructure in this game that I did not write.
   We race three of them and use whichever answers first; if one dies mid-game
   we fail over to another and the players see a "reconnecting" pip and nothing
   else. Everything below the room layer is a hand-rolled MQTT 3.1.1 client,
   because pulling in a library would have meant a build step.

   Trust model: a room code is a shared secret and nothing more. Anybody who
   guessed your four letters could watch your card game. This is a card game.  */

const NET = (()=>{

const BROKERS = [
  'wss://test.mosquitto.org:8081/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
];
const TOPIC = c => 'mishanameh/v2/' + c;
const KEEPALIVE = 30;

/* ═══════════  MQTT 3.1.1, the four packets we actually need  ═══════════ */
function enc(bytes){ return new Uint8Array(bytes); }
function varlen(n){ const o=[]; do{ let d=n%128; n=Math.floor(n/128); if(n>0) d|=128; o.push(d); }while(n>0); return o; }
function str(s){ const b=new TextEncoder().encode(s); return [b.length>>8, b.length&255, ...b]; }
function packet(type, flags, body){ return enc([ (type<<4)|flags, ...varlen(body.length), ...body ]); }

class Mqtt {
  constructor(url, onMessage, onDown){
    this.url=url; this.onMessage=onMessage; this.onDown=onDown;
    this.pid=1; this.buf=new Uint8Array(0); this.up=false; this.dead=false;
  }
  open(){
    return new Promise((res,rej)=>{
      let ws;
      try{ ws = new WebSocket(this.url, 'mqtt'); }catch(e){ return rej(e); }
      ws.binaryType='arraybuffer';
      this.ws=ws;
      const fail=(e)=>{ if(!this.up) rej(e||new Error('closed')); else this.down(); };
      const timer = setTimeout(()=>{ if(!this.up){ try{ws.close();}catch(_){} rej(new Error('timeout')); } }, 6000);
      ws.onopen = ()=>{
        const cid = 'mn'+Math.random().toString(36).slice(2,12);
        ws.send(packet(1,0,[ ...str('MQTT'), 4, 0x02, KEEPALIVE>>8, KEEPALIVE&255, ...str(cid) ]));
      };
      ws.onmessage = (ev)=>{
        this.feed(new Uint8Array(ev.data), ()=>{ clearTimeout(timer); this.up=true; res(this); });
      };
      ws.onerror = fail;
      ws.onclose = fail;
      this.ping = setInterval(()=>{ if(this.up && ws.readyState===1) ws.send(packet(12,0,[])); }, KEEPALIVE*400);
    });
  }
  feed(chunk, onConnack){
    const merged = new Uint8Array(this.buf.length+chunk.length);
    merged.set(this.buf); merged.set(chunk, this.buf.length); this.buf = merged;
    for(;;){
      if(this.buf.length<2) return;
      let mult=1, len=0, i=1, d;
      do{
        if(i>=this.buf.length) return;             // length field incomplete
        d=this.buf[i++]; len += (d&127)*mult; mult*=128;
        if(mult>128*128*128) return;
      }while(d&128);
      if(this.buf.length < i+len) return;          // body incomplete
      const type=this.buf[0]>>4, body=this.buf.slice(i,i+len);
      this.buf = this.buf.slice(i+len);
      if(type===2) onConnack && onConnack();
      else if(type===3){
        const tl=(body[0]<<8)|body[1];
        const payload = body.slice(2+tl);          // QoS 0: no packet id
        try{ this.onMessage(JSON.parse(new TextDecoder().decode(payload))); }catch(e){}
      }
    }
  }
  sub(topic){ const id=this.pid++; this.ws.send(packet(8,2,[id>>8,id&255, ...str(topic), 0])); }
  pub(topic,obj){
    if(!this.ws || this.ws.readyState!==1) return false;
    const b=new TextEncoder().encode(JSON.stringify(obj));
    this.ws.send(packet(3,0,[ ...str(topic), ...b ]));
    return true;
  }
  down(){ if(this.dead) return; this.dead=true; clearInterval(this.ping); this.onDown && this.onDown(); }
  close(){ this.dead=true; clearInterval(this.ping); try{ this.ws && this.ws.close(); }catch(e){} }
}

/* ═══════════  ROOM CODES  ═══════════
   Four characters, no O/0/I/1/S/5, because these get read aloud over the
   phone to a father in Houston. */
const ALPHA='ABCDEFGHJKLMNPQRTUVWXYZ2346789';
function newCode(){ let s=''; for(let i=0;i<4;i++) s+=ALPHA[Math.floor(Math.random()*ALPHA.length)]; return s; }
function cleanCode(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'')
  .replace(/O/g,'Q').replace(/0/g,'Q').replace(/I/g,'J').replace(/1/g,'J').replace(/S/g,'Z').replace(/5/g,'Z').slice(0,4); }

/* ═══════════  ROOM  ═══════════ */
const R_ = {
  code:null, me:null, host:false, mqtt:null, brokerIx:0,
  peers:{},           // id → {id, name, hero, seat, seen}
  on:{},              // event → handler
  status:'offline',   // offline | connecting | live | reconnecting
  seq:0,
};

function emit(ev, ...a){ (R_.on[ev]||[]).forEach(f=>{ try{ f(...a); }catch(e){ console.warn('net handler',ev,e); } }); }
function on(ev, fn){ (R_.on[ev]=R_.on[ev]||[]).push(fn); }
function off(ev){ delete R_.on[ev]; }

function setStatus(s){ if(R_.status!==s){ R_.status=s; emit('status', s); } }

async function connect(){
  setStatus(R_.mqtt ? 'reconnecting' : 'connecting');
  // race the brokers, keep the first that answers
  const tries = BROKERS.map(u => new Mqtt(u, handle, onBrokerDown).open().catch(e=>null));
  const results = await Promise.all(tries);
  const live = results.filter(Boolean);
  if(!live.length){ setStatus('offline'); emit('error','Could not reach any relay. Check the connection?'); return false; }
  live.slice(1).forEach(m=>m.close());
  R_.mqtt = live[0];
  R_.mqtt.sub(TOPIC(R_.code));
  setStatus('live');
  say({t:'hello', name:R_.me.name, hero:R_.me.hero, host:R_.host});
  return true;
}

let downTimer=null;
function onBrokerDown(){
  if(!R_.code) return;
  setStatus('reconnecting');
  clearTimeout(downTimer);
  downTimer = setTimeout(()=>{ if(R_.code) connect(); }, 1200);
}

function say(msg){
  if(!R_.code) return false;
  msg.from = R_.me.id; msg.n = ++R_.seq;
  if(!R_.mqtt || !R_.mqtt.pub(TOPIC(R_.code), msg)){ onBrokerDown(); return false; }
  return true;
}

function handle(msg){
  if(!msg || msg.from===R_.me.id) return;          // our own echo
  const now = Date.now();
  if(msg.t==='hello'){
    const fresh = !R_.peers[msg.from];
    R_.peers[msg.from] = {id:msg.from, name:msg.name, hero:msg.hero, host:msg.host, seen:now};
    if(fresh) emit('join', R_.peers[msg.from]);
    // answer so the newcomer learns about us too
    if(fresh) say({t:'hi', name:R_.me.name, hero:R_.me.hero, host:R_.host});
    emit('peers', peers());
  } else if(msg.t==='hi'){
    const fresh = !R_.peers[msg.from];
    R_.peers[msg.from] = {id:msg.from, name:msg.name, hero:msg.hero, host:msg.host, seen:now};
    if(fresh) emit('join', R_.peers[msg.from]);
    emit('peers', peers());
  } else if(msg.t==='bye'){
    const p=R_.peers[msg.from]; delete R_.peers[msg.from];
    if(p) emit('leave', p); emit('peers', peers());
  } else if(msg.t==='beat'){
    if(R_.peers[msg.from]) R_.peers[msg.from].seen = now;
    else { R_.peers[msg.from]={id:msg.from,name:msg.name,hero:msg.hero,host:msg.host,seen:now}; emit('peers',peers()); }
  } else {
    if(R_.peers[msg.from]) R_.peers[msg.from].seen = now;
    emit(msg.t, msg);
  }
}

/* presence: a beat every 4s, drop a peer after 16s of silence */
let beat=null;
function startBeat(){
  clearInterval(beat);
  beat = setInterval(()=>{
    if(!R_.code) return;
    say({t:'beat', name:R_.me.name, hero:R_.me.hero, host:R_.host});
    const cut = Date.now()-16000; let changed=false;
    for(const id in R_.peers) if(R_.peers[id].seen < cut){ const p=R_.peers[id]; delete R_.peers[id]; emit('leave',p); changed=true; }
    if(changed) emit('peers', peers());
  }, 4000);
}

function peers(){ return Object.values(R_.peers).sort((a,b)=>a.id<b.id?-1:1); }

/* ═══════════  PUBLIC  ═══════════ */
async function open(code, name, hero, asHost){
  close();
  R_.code = cleanCode(code) || newCode();
  R_.me = { id: Math.random().toString(36).slice(2,10), name: name||'Rider', hero };
  R_.host = !!asHost;
  R_.peers = {}; R_.seq = 0;
  const ok = await connect();
  if(ok) startBeat();
  return ok ? R_.code : null;
}

function close(){
  if(R_.code) say({t:'bye'});
  clearInterval(beat); clearTimeout(downTimer);
  if(R_.mqtt) R_.mqtt.close();
  R_.mqtt=null; R_.code=null; R_.peers={};
  setStatus('offline');
}

function supported(){ return typeof WebSocket!=='undefined'; }

return {
  open, close, say, on, off, peers, newCode, cleanCode, supported,
  get code(){ return R_.code; },
  get me(){ return R_.me; },
  get isHost(){ return R_.host; },
  get status(){ return R_.status; },
  get online(){ return !!R_.code; },
  /* the host is whoever holds the run; if they vanish, nobody is host */
  hostPeer(){ return peers().find(p=>p.host); },
};
})();
