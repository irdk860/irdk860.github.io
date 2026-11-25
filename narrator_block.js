/* ---------- narrator: natural human-sounding voices (Kokoro model), run on this device ---------- */
const NARR_OK=!/claudeusercontent|claude\.ai|anthropic/.test(location.hostname)&&typeof Worker!=='undefined'&&!!(window.AudioContext||window.webkitAudioContext);
const VOICES=[['af_heart','Heart','US, female'],['af_bella','Bella','US, female'],['af_nicole','Nicole','US, female, soft'],['am_michael','Michael','US, male'],['am_fenrir','Fenrir','US, male'],['bf_emma','Emma','UK, female'],['bf_isabella','Isabella','UK, female'],['bm_george','George','UK, male'],['bm_fable','Fable','UK, male']];
const RATES=[0.75,0.9,1,1.15,1.3,1.5,1.75,2];
/* "gpu" runs on the graphics chip (WebGPU, fastest, ~310 MB); "cpu" runs on the processor (~90 MB) */
const MODES={gpu:{device:'webgpu',dtype:'fp32',mb:310},cpu:{device:'wasm',dtype:'q8',mb:90}};
const AHEAD=4; /* sentences prepared in advance, so there are no gaps while reading */
let sv=lsGet(LS+'voice');sv=typeof sv==='string'?sv.replace(/^k:/,''):'';
const tts={on:false,playing:false,started:false,i:0,si:0,sents:null,token:0,fails:0,rate:+(lsGet(LS+'rate')||1),voice:VOICES.some(v=>v[0]===sv)?sv:'af_heart',lock:null,ac:null,src:null};

/* The engine lives in a worker. It keeps a queue, trims silence from each sentence, and can drop stale work
   at once, so turning a page or changing speed never waits behind sentences nobody needs any more. */
const WORKER=`import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
let k=null,q=[],busy=false;
const trim=(x,sr)=>{const th=0.01,keep=Math.round(sr*0.05);let s=0,e=x.length-1;while(s<e&&Math.abs(x[s])<th)s++;while(e>s&&Math.abs(x[e])<th)e--;return x.slice(Math.max(0,s-keep),Math.min(x.length,e+keep*2))};
async function pump(){if(busy)return;busy=true;
  while(q.length){const j=q.shift();
    try{const a=await k.generate(j.text,{voice:j.voice,speed:j.speed});const t=trim(a.audio,a.sampling_rate);self.postMessage({type:'audio',id:j.id,audio:t,sr:a.sampling_rate},[t.buffer])}
    catch(err){self.postMessage({type:'genError',id:j.id,msg:String(err&&err.message||err)})}}
  busy=false}
self.onmessage=async e=>{const m=e.data;
  if(m.type==='load'){try{const files={};
    k=await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",{dtype:m.dtype,device:m.device,progress_callback:p=>{
      if(p&&p.status==='progress'&&p.file){files[p.file]=[p.loaded||0,p.total||0];let a=0,b=0;for(const f in files){a+=files[f][0];b+=files[f][1]}self.postMessage({type:'progress',loaded:a,total:b})}}});
    /* first download: fetch and warm every voice now, so switching voice later is instant and works offline */
    const list=m.first?m.voices:[m.voice];let n=0;
    for(const v of list){await k.generate("Warming up the narrator.",{voice:v});n++;if(m.first)self.postMessage({type:'prep',n:n,of:list.length})}
    await k.generate("This longer sentence gets the whole engine ready, so the first line of your book starts without a pause.",{voice:m.voice});
    self.postMessage({type:'ready'})}catch(err){self.postMessage({type:'error',msg:String(err&&err.message||err)})}}
  else if(m.type==='gen'){q.push(m);pump()}
  else if(m.type==='clear'){self.postMessage({type:'dropped',ids:q.map(j=>j.id)});q=[]}
};`;

const eng={state:'idle',mode:null,w:null,seq:0,wait:{},ready:null,pct:0,mb:0,stage:'',prompt:false,offer:'cpu'};
const savedMode=()=>{const v=lsGet(LS+'neural');return v==='gpu'?'gpu':v?'cpu':null};
let gpuP=null;
const hasGPU=()=>gpuP||(gpuP=(async()=>{try{return !!(navigator.gpu&&await navigator.gpu.requestAdapter())}catch(e){return false}})());
const audio=new Map(),sc=new Map();let scKey=null;

function dropEngine(){
  try{eng.w&&eng.w.terminate()}catch(e){}eng.w=null;eng.ready=null;
  for(const k in eng.wait){eng.wait[k].rej(new Error('stopped'));delete eng.wait[k]}
  audio.clear();
}
function loadEngine(mode){
  mode=mode||savedMode()||'cpu';
  if(eng.ready&&eng.mode===mode)return eng.ready;
  if(eng.ready)dropEngine();
  const first=!lsGet(LS+'allvoices');
  if(!savedMode()||first){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
  Object.assign(eng,{mode,state:'loading',pct:0,mb:0,stage:''});ui();
  const p=eng.ready=new Promise((res,rej)=>{
    let w;
    try{w=new Worker(URL.createObjectURL(new Blob([WORKER],{type:'text/javascript'})),{type:'module'})}
    catch(e){eng.state='error';ui();rej(e);return}
    eng.w=w;
    const fail=()=>{eng.state=mode==='gpu'?'gpufail':'error';ui()};
    w.onmessage=e=>{const m=e.data;
      if(m.type==='progress'){eng.pct=m.total?m.loaded/m.total:0;eng.mb=m.total/1048576;ui()}
      else if(m.type==='prep'){eng.pct=1;eng.stage='Preparing voices '+m.n+' of '+m.of+'…';ui()}
      else if(m.type==='ready'){eng.state='ready';lsSet(LS+'neural',mode);lsSet(LS+'allvoices',1);ui();res()}
      else if(m.type==='error'){fail();rej(new Error(m.msg))}
      else if(m.type==='dropped'){m.ids.forEach(id=>{const q=eng.wait[id];delete eng.wait[id];if(q)q.rej(new Error('dropped'))})}
      else{const q=eng.wait[m.id];delete eng.wait[m.id];if(q)m.type==='audio'?q.res(m):q.rej(new Error(m.msg))}};
    w.onerror=e=>{fail();rej(new Error((e&&e.message)||'engine failed'))};
    w.postMessage({type:'load',device:MODES[mode].device,dtype:MODES[mode].dtype,voice:tts.voice,voices:VOICES.map(v=>v[0]),first});
  });
  p.catch(()=>{if(eng.ready===p)dropEngine()});
  return p;
}
/* load the narrator in the background as soon as the app opens, so pressing play starts at once */
function preloadVoice(){if(!NARR_OK||!savedMode()||eng.state==='ready'||eng.state==='loading')return;loadEngine(savedMode()).catch(()=>{})}
function askDownload(){hasGPU().then(g=>{eng.offer=g?'gpu':'cpu';eng.prompt=true;ui()})}
function loadThenRead(mode){unlock();eng.prompt=false;if(tts.playing)pause();loadEngine(mode).then(()=>{ui();if(tts.on){tts.playing=true;playUI();keepAwake(true);speak()}}).catch(()=>{})}
function declineNarrator(){eng.prompt=false;if(eng.state==='error'||eng.state==='gpufail')eng.state='idle';ui();closePlayer()}
function ui(){
  const box=$('#nbox');if(!box)return;
  const st=eng.state,show=eng.prompt||st==='loading'||st==='error'||st==='gpufail';
  box.hidden=!show;if(!show)return;
  const t=$('#ntext'),bar=$('#nbar'),go=$('#ngo'),no=$('#nno');
  const set=(text,a,fa,b,fb)=>{t.textContent=text;go.textContent=a;no.textContent=b;go.onclick=fa;no.onclick=fb;go.hidden=no.hidden=false;bar.hidden=true};
  if(st==='loading'){
    t.textContent=eng.stage||(savedMode()===eng.mode?'Getting the narrator ready…':`Downloading narrator voices… ${Math.round(eng.pct*100)}%${eng.mb?` of ${Math.round(eng.mb)} MB`:''}`);
    bar.hidden=false;bar.firstElementChild.style.width=Math.round(eng.pct*100)+'%';go.hidden=no.hidden=true;
  }else if(st==='gpufail')set('Fast mode didn’t work on this device, so the standard narrator can be used instead.',`Use standard mode (${MODES.cpu.mb} MB)`,()=>loadThenRead('cpu'),'Not now',declineNarrator);
  else if(st==='error')set('Couldn’t load the narrator. Check your internet connection and try again.','Try again',()=>loadThenRead(eng.mode||'cpu'),'Not now',declineNarrator);
  else set(`Natural, human-sounding narrators are a one-time download of about ${MODES[eng.offer].mb} MB${eng.offer==='gpu'?' and run on your graphics chip for smooth reading':''}. After that they’re free, private, work offline and start straight away.`,'Download narrators',()=>loadThenRead(eng.offer),'Not now',declineNarrator);
}

/* sentences, and audio prepared ahead of time */
function sentences(s){
  const out=[],re=/[^.!?…]*[.!?…]+["'”’)\]]*(\s+|$)|[^.!?…]+$/g;let m;
  while((m=re.exec(s))&&m[0]){
    let t=m[0],st=m.index;
    while(t.length>120){let cut=t.lastIndexOf(', ',110);if(cut<30)cut=t.lastIndexOf('; ',110);if(cut<30)cut=t.lastIndexOf(' ',110);if(cut<1)cut=110;out.push({o:st,t:t.slice(0,cut+1)});st+=cut+1;t=t.slice(cut+1)}
    if(t.trim())out.push({o:st,t});
  }
  return out.length?out:[{o:0,t:s}];
}
function sentsOf(i){
  if(scKey!==book.key){sc.clear();scKey=book.key}
  const b=book.blocks[i];if(!b||b.t==='b'||!b.s)return null;
  if(!sc.has(i))sc.set(i,sentences(b.s));return sc.get(i);
}
function nextPos(i,si){si++;while(i<book.blocks.length){const s=sentsOf(i);if(s&&si<s.length)return [i,si];i++;si=0}return null}
function gen(i,si){
  const k=[book.key,tts.voice,tts.rate,i,si].join('|');let e=audio.get(k);
  if(!e){
    const id=++eng.seq;
    e={done:false,p:new Promise((res,rej)=>{eng.wait[id]={res,rej};eng.w.postMessage({type:'gen',id,text:sentsOf(i)[si].t,voice:tts.voice,speed:tts.rate})})};
    e.p.then(()=>{e.done=true},()=>{if(audio.get(k)===e)audio.delete(k)});
    audio.set(k,e);while(audio.size>16)audio.delete(audio.keys().next().value);
  }
  return e.p;
}
function clearQueue(){if(eng.w)eng.w.postMessage({type:'clear'});for(const [k,e] of audio)if(!e.done)audio.delete(k)}

function actx(){
  if(!tts.ac){const C=window.AudioContext||window.webkitAudioContext;if(C){try{tts.ac=new C({sampleRate:24000})}catch(e){tts.ac=new C()}}}
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){} /* play even with the iPhone's silent switch on */
  if(tts.ac&&tts.ac.state!=='running')tts.ac.resume().catch(()=>{});
  return tts.ac;
}
function unlock(){const ac=actx();if(!ac)return;try{const s=ac.createBufferSource();s.buffer=ac.createBuffer(1,1,22050);s.connect(ac.destination);s.start(0)}catch(e){}}
function hush(clear){
  tts.token++;
  if(tts.src){try{tts.src.onended=null;tts.src.stop()}catch(e){}tts.src=null}
  const st=$('#tstat');if(st)st.textContent='';
  if(clear)clearQueue();
}

/* highlighting and page turning */
function pageOf(i,o){
  const p=pages.findIndex(q=>q.parts&&q.parts.some(r=>r.i===i&&o>=r.from&&o<=r.from+r.len));
  return p<0?pages.findIndex(q=>q.a<=i&&i<=q.z):p;
}
function markReading(){
  for(const e of flow.querySelectorAll('.reading'))e.classList.remove('reading');
  if(tts.on)for(const e of flow.querySelectorAll(`[data-i="${tts.i}"]`))e.classList.add('reading');
}
function showReading(){
  const k=chapterAt(tts.i);if(k!==ch)renderChapter(k);
  const s=tts.sents&&tts.sents[tts.si],o=s?s.o:0;
  const pA=pageOf(tts.i,o),pB=s?pageOf(tts.i,o+s.t.trimEnd().length-1):pA;
  /* a sentence can run from the bottom of one page onto the next: stay if either page is showing */
  const shown=q=>q>=0&&Math.floor(q/cols)===view;
  if(flow.firstChild&&(shown(pA)||shown(pB)))markReading();else go(Math.floor(Math.max(0,pA)/cols),true);
}

/* reading */
function speak(){
  if(!tts.playing)return;
  while(tts.i<book.blocks.length){const s=sentsOf(tts.i);if(s&&tts.si<s.length)break;tts.i++;tts.si=0}
  if(tts.i>=book.blocks.length){pause();toast('That’s the end of the book');return}
  tts.sents=sentsOf(tts.i);showReading();
  if(eng.state!=='ready'){
    if(eng.state==='loading'||savedMode()){const my=++tts.token;loadEngine(eng.state==='loading'?eng.mode:savedMode()).then(()=>{if(my===tts.token&&tts.playing)speak()},()=>{if(my===tts.token)pause()})}
    else{pause();askDownload()}
    return;
  }
  const my=++tts.token,i=tts.i,si=tts.si,p=gen(i,si);
  let n=[i,si];for(let k=0;k<AHEAD&&n;k++){n=nextPos(n[0],n[1]);if(n)gen(n[0],n[1])}
  const wait=setTimeout(()=>{if(my===tts.token)$('#tstat').textContent='Preparing…'},300);
  p.then(a=>{
    clearTimeout(wait);if(my!==tts.token||!tts.playing)return;$('#tstat').textContent='';
    const ac=actx(),buf=ac.createBuffer(1,a.audio.length,a.sr);
    if(buf.copyToChannel)buf.copyToChannel(a.audio,0);else buf.getChannelData(0).set(a.audio);
    const src=ac.createBufferSource();src.buffer=buf;src.connect(ac.destination);
    src.onended=()=>{if(my!==tts.token||!tts.playing)return;tts.fails=0;tts.si++;speak()};
    tts.src=src;src.start();
  }).catch(()=>{
    clearTimeout(wait);if(my!==tts.token||!tts.playing)return;
    if(++tts.fails>=3){tts.fails=0;pause();toast('The narrator had a problem. Press play to try again.');return}
    tts.si++;speak();
  });
}
function startAt(i,o){
  hush(true);tts.i=i;tts.si=0;tts.sents=sentsOf(i);
  if(tts.sents){let k=tts.sents.findIndex(s=>s.o>=o-1);if(k<0)k=tts.sents.length-1;tts.si=Math.max(0,k)}
}
function fromPage(){
  const ps=pages.slice(view*cols,view*cols+cols).filter(Boolean);
  const first=ps[0]&&ps[0].parts&&ps[0].parts[0];
  if(first)startAt(first.i,first.from);else startAt(visible()[2],0);
}
async function keepAwake(on){
  try{if(on&&'wakeLock' in navigator&&!tts.lock){tts.lock=await navigator.wakeLock.request('screen');tts.lock.addEventListener('release',()=>{tts.lock=null})}
      else if(!on&&tts.lock){await tts.lock.release();tts.lock=null}}catch(e){}
}
function play(){unlock();tts.started=true;tts.playing=true;playUI();keepAwake(true);speak()}
function pause(){tts.playing=false;hush(false);playUI();keepAwake(false)}
function playUI(){
  const b=$('#tplay');b.innerHTML=tts.playing?'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>':'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  b.setAttribute('aria-label',tts.playing?'Pause':'Play');$('#listen').classList.toggle('on',tts.on);
}
function fillVoices(){const sel=$('#voice');sel.innerHTML=VOICES.map(([id,n,d])=>`<option value="${id}">${n} — ${d}</option>`).join('');sel.value=tts.voice}
function openPlayer(){
  if(!NARR_OK){toast('Narration isn’t available in this browser');return}
  tts.on=true;$('#player').hidden=false;fillVoices();$('#trate').textContent=tts.rate+'×';
  fromPage();play();requestAnimationFrame(relayout);
}
function closePlayer(){eng.prompt=false;ui();pause();hush(true);tts.on=false;tts.started=false;$('#player').hidden=true;markReading();playUI();requestAnimationFrame(relayout)}
function skip(d){
  if(!book)return;let i=tts.i+d;
  while(i>0&&i<book.blocks.length&&book.blocks[i].t==='b')i+=d;
  i=Math.max(0,Math.min(book.blocks.length-1,i));
  const was=tts.playing;startAt(i,0);if(was){tts.playing=true;speak()}else showReading();
}
/* the reader turned the page themselves: keep listening from the new page */
function afterNav(){if(tts.on&&tts.playing){fromPage();tts.playing=true;speak()}else if(tts.on){fromPage();markReading()}}

if(!NARR_OK)$('#listen').hidden=true;
$('#listen').onclick=()=>tts.on?closePlayer():openPlayer();
$('#tplay').onclick=()=>tts.playing?pause():play();
$('#tback').onclick=()=>skip(-1);$('#tfwd').onclick=()=>skip(1);
$('#tclose').onclick=closePlayer;
$('#trate').onclick=()=>{tts.rate=RATES[(RATES.indexOf(tts.rate)+1)%RATES.length];$('#trate').textContent=tts.rate+'×';lsSet(LS+'rate',tts.rate);if(tts.playing){hush(true);speak()}};
$('#voice').onchange=e=>{tts.voice=e.target.value;lsSet(LS+'voice',tts.voice);if(tts.playing){hush(true);speak()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&tts.playing&&/iPhone|iPad|iPod/.test(navigator.userAgent))pause();else if(!document.hidden&&tts.playing)keepAwake(true)});
document.addEventListener('click',()=>{if(NARR_OK&&!tts.ac)unlock()},{once:true}); /* have the audio output open before the first play */
if(NARR_OK)setTimeout(preloadVoice,1000);
