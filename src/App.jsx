import { useState, useRef, useEffect, useCallback } from "react";

const FIPS={
  "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California",
  "08":"Colorado","09":"Connecticut","10":"Delaware","12":"Florida","13":"Georgia",
  "15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas",
  "21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts",
  "26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana",
  "31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico",
  "36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma",
  "41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina",
  "46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont",
  "51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"
};
const ABBR={
  "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
  "Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA",
  "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS",
  "Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA",
  "Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT",
  "Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM",
  "New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK",
  "Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC",
  "South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT",
  "Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"
};
const NUDGE={
  "Florida":[30,-25],"Louisiana":[10,-10],"Michigan":[20,20],"Hawaii":[0,0],
  "Alaska":[0,0],"Maryland":[2,6],"Massachusetts":[-10,2],"Connecticut":[-2,0],
  "Rhode Island":[0,0],"New Jersey":[-2,2],"Delaware":[-2,0],"Vermont":[0,2],
  "New Hampshire":[0,2],"Idaho":[0,5],"Virginia":[-8,6],"West Virginia":[2,2],
  "Kentucky":[-5,2],"Tennessee":[-5,0],"North Carolina":[-5,4],
  "Oklahoma":[-8,0],"New York":[-5,5],"Pennsylvania":[-5,2]
};
const CAPITALS={
  "Alabama":"Montgomery","Alaska":"Juneau","Arizona":"Phoenix","Arkansas":"Little Rock",
  "California":"Sacramento","Colorado":"Denver","Connecticut":"Hartford","Delaware":"Dover",
  "Florida":"Tallahassee","Georgia":"Atlanta","Hawaii":"Honolulu","Idaho":"Boise",
  "Illinois":"Springfield","Indiana":"Indianapolis","Iowa":"Des Moines","Kansas":"Topeka",
  "Kentucky":"Frankfort","Louisiana":"Baton Rouge","Maine":"Augusta","Maryland":"Annapolis",
  "Massachusetts":"Boston","Michigan":"Lansing","Minnesota":"Saint Paul","Mississippi":"Jackson",
  "Missouri":"Jefferson City","Montana":"Helena","Nebraska":"Lincoln","Nevada":"Carson City",
  "New Hampshire":"Concord","New Jersey":"Trenton","New Mexico":"Santa Fe","New York":"Albany",
  "North Carolina":"Raleigh","North Dakota":"Bismarck","Ohio":"Columbus","Oklahoma":"Oklahoma City",
  "Oregon":"Salem","Pennsylvania":"Harrisburg","Rhode Island":"Providence","South Carolina":"Columbia",
  "South Dakota":"Pierre","Tennessee":"Nashville","Texas":"Austin","Utah":"Salt Lake City",
  "Vermont":"Montpelier","Virginia":"Richmond","Washington":"Olympia","West Virginia":"Charleston",
  "Wisconsin":"Madison","Wyoming":"Cheyenne"
};
const ALL_CAPS=Object.values(CAPITALS);
const ALL_STATES=Object.values(FIPS).sort();

function topoFeature(topo,name){
  const obj=topo.objects[name],tf=topo.transform;
  const decoded=topo.arcs.map(arc=>{let x=0,y=0;return arc.map(([dx,dy])=>{x+=dx;y+=dy;return tf?[x*tf.scale[0]+tf.translate[0],y*tf.scale[1]+tf.translate[1]]:[x,y];});});
  const dArc=i=>i>=0?decoded[i]:decoded[~i].slice().reverse();
  const dRing=arcs=>{let c=[];arcs.forEach(i=>{const a=dArc(i);c=c.concat(a.slice(c.length?1:0));});return c;};
  const dGeom=g=>{if(g.type==='Polygon')return{type:'Polygon',coordinates:g.arcs.map(dRing)};if(g.type==='MultiPolygon')return{type:'MultiPolygon',coordinates:g.arcs.map(p=>p.map(dRing))};return g;};
  return{type:'FeatureCollection',features:obj.geometries.map(g=>({type:'Feature',id:g.id,properties:g.properties||{},geometry:dGeom(g)}))};
}
function pathStr(geom){
  const ring=coords=>{if(!coords||!coords.length)return'';return coords.map((p,i)=>`${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')+'Z';};
  if(geom.type==='Polygon')return geom.coordinates.map(ring).join('');
  if(geom.type==='MultiPolygon')return geom.coordinates.map(poly=>poly.map(ring).join('')).join('');return'';
}
function centroid(geom,name){
  let coords=[];if(geom.type==='Polygon')coords=geom.coordinates[0];
  else if(geom.type==='MultiPolygon'){let best=[];geom.coordinates.forEach(p=>{if(p[0].length>best.length)best=p[0];});coords=best;}
  if(!coords.length)return[0,0];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  coords.forEach(p=>{if(p[0]<minX)minX=p[0];if(p[0]>maxX)maxX=p[0];if(p[1]<minY)minY=p[1];if(p[1]>maxY)maxY=p[1];});
  let cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const n=NUDGE[name];if(n){cx+=n[0];cy+=n[1];}
  return[cx,cy];
}
const hsl=(i,n)=>`hsl(${(i*360/n)%360},${60+((i*5)%15)}%,${50+((i*3)%12)}%)`;

let audioUnlocked=false;
const acRef={current:null};
function ac(){
  if(!acRef.current)acRef.current=new(window.AudioContext||window.webkitAudioContext)();
  if(acRef.current.state==='suspended')acRef.current.resume().catch(()=>{});
  return acRef.current;
}
function unlockAudio(){
  if(audioUnlocked)return;
  try{
    const ctx=ac();
    const buf=ctx.createBuffer(1,1,22050);const src=ctx.createBufferSource();
    src.buffer=buf;src.connect(ctx.destination);src.start(0);
    const a=new Audio();a.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    a.play().then(()=>a.pause()).catch(()=>{});
    audioUnlocked=true;
  }catch(e){}
}

const ELEVEN_KEY='sk_48c0b41e89d95d9b9d0bfa159cc77c4856e33fd88dbaa233';
const ELEVEN_VOICE='onwK4e9ZLuTAKqWW03F9';
const ttsCache={};
let currentTTS=null;

function playTick(){
  try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
  o.type='sine';o.frequency.value=1800+Math.random()*800;g.gain.setValueAtTime(0.12,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.04);o.start(c.currentTime);o.stop(c.currentTime+0.04);}catch(e){}
}
function playDrumRoll(){
  try{const c=ac(),dur=1.5,t=c.currentTime,m=c.createGain();
  m.gain.setValueAtTime(0.05,t);m.gain.linearRampToValueAtTime(0.35,t+dur*0.8);m.gain.exponentialRampToValueAtTime(0.001,t+dur);m.connect(c.destination);
  for(let i=0;i<40;i++){const ht=t+(i/40)*dur,hd=0.03,hb=c.createBuffer(1,Math.floor(c.sampleRate*hd),c.sampleRate),hD=hb.getChannelData(0);
  for(let j=0;j<hD.length;j++)hD[j]=(Math.random()*2-1)*Math.pow(1-j/hD.length,3);
  const hs=c.createBufferSource();hs.buffer=hb;const hg=c.createGain();hg.gain.value=0.4+Math.random()*0.2;
  const hp=c.createBiquadFilter();hp.type='bandpass';hp.frequency.value=200+Math.random()*100;hp.Q.value=1;
  hs.connect(hp);hp.connect(hg);hg.connect(m);hs.start(ht+(Math.random()-0.5)*0.01);hs.stop(ht+hd+0.01);}}catch(e){}
}
function playImpact(){
  try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
  o.type='sine';o.frequency.setValueAtTime(150,c.currentTime);o.frequency.exponentialRampToValueAtTime(30,c.currentTime+0.3);
  g.gain.setValueAtTime(0.6,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);
  o.start(c.currentTime);o.stop(c.currentTime+0.4);
  const b=c.createBuffer(1,c.sampleRate*0.06,c.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const s=c.createBufferSource();s.buffer=b;const g2=c.createGain();g2.gain.setValueAtTime(0.5,c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08);s.connect(g2);g2.connect(c.destination);
  s.start(c.currentTime);s.stop(c.currentTime+0.08);}catch(e){}
}
function playWhoosh(){
  try{const c=ac(),bs=c.sampleRate*0.4,b=c.createBuffer(1,bs,c.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<bs;i++)d[i]=(Math.random()*2-1);const s=c.createBufferSource();s.buffer=b;
  const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.setValueAtTime(800,c.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3000,c.currentTime+0.15);bp.frequency.exponentialRampToValueAtTime(200,c.currentTime+0.35);bp.Q.value=2;
  const g=c.createGain();g.gain.setValueAtTime(0.4,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);
  s.connect(bp);bp.connect(g);g.connect(c.destination);s.start(c.currentTime);s.stop(c.currentTime+0.4);}catch(e){}
}
function playCountdownBeep(high){
  try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
  o.type='square';o.frequency.value=high?880:440;g.gain.setValueAtTime(0.2,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+(high?0.3:0.15));
  o.start(c.currentTime);o.stop(c.currentTime+(high?0.3:0.15));}catch(e){}
}
function playDing(){
  try{const c=ac(),t=c.currentTime;
  [880,1108,1320].forEach((f,i)=>{
    const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
    o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*0.08);g.gain.linearRampToValueAtTime(0.25,t+i*0.08+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,t+i*0.08+0.6);
    o.start(t+i*0.08);o.stop(t+i*0.08+0.6);
  });}catch(e){}
}
function playBuzzer(){
  try{const c=ac(),t=c.currentTime;
  const o1=c.createOscillator(),o2=c.createOscillator(),g=c.createGain();
  o1.connect(g);o2.connect(g);g.connect(c.destination);
  o1.type='sawtooth';o1.frequency.value=120;
  o2.type='square';o2.frequency.value=123;
  g.gain.setValueAtTime(0.35,t);g.gain.setValueAtTime(0.35,t+0.35);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o1.start(t);o1.stop(t+0.5);o2.start(t);o2.stop(t+0.5);}catch(e){}
}
function playApplause(big){
  try{const c=ac(),dur=big?5:3.5,t=c.currentTime,m=c.createGain();
  m.gain.setValueAtTime(0.001,t);m.gain.linearRampToValueAtTime(big?0.5:0.35,t+0.4);
  m.gain.setValueAtTime(big?0.5:0.35,t+dur*0.55);m.gain.linearRampToValueAtTime(big?0.25:0.15,t+dur*0.8);
  m.gain.exponentialRampToValueAtTime(0.001,t+dur);m.connect(c.destination);
  const bands=big?[500,1000,1800,3200]:[800,1400,2800];
  bands.forEach((f,i)=>{const bs=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,bs,c.sampleRate),d=b.getChannelData(0);
  for(let j=0;j<bs;j++)d[j]=(Math.random()*2-1);const s=c.createBufferSource();s.buffer=b;
  const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=0.4+i*0.15;
  const g=c.createGain();g.gain.value=0.22-i*0.04;s.connect(bp);bp.connect(g);g.connect(m);s.start(t);s.stop(t+dur);});
  const cc=big?120:60;
  for(let i=0;i<cc;i++){const ct=t+0.1+Math.random()*(dur-0.5),cd=0.015+Math.random()*0.02;
  const cb=c.createBuffer(1,Math.floor(c.sampleRate*cd),c.sampleRate),cD=cb.getChannelData(0);
  for(let j=0;j<cD.length;j++)cD[j]=(Math.random()*2-1)*Math.pow(1-j/cD.length,1.5);
  const cs=c.createBufferSource();cs.buffer=cb;const hp=c.createBiquadFilter();hp.type='highpass';
  hp.frequency.value=1200+Math.random()*2000;const cg=c.createGain();cg.gain.value=0.06+Math.random()*0.1;
  cs.connect(hp);hp.connect(cg);cg.connect(m);cs.start(ct);cs.stop(ct+cd);}
  const gc=big?20:12;
  for(let i=0;i<gc;i++){const gt=t+0.2+i*0.22+(Math.random()-0.5)*0.06;
  for(let s=0;s<(big?6:4);s++){const st=gt+Math.random()*0.04,sd=0.012+Math.random()*0.015;
  const sb=c.createBuffer(1,Math.floor(c.sampleRate*sd),c.sampleRate),sD=sb.getChannelData(0);
  for(let j=0;j<sD.length;j++)sD[j]=(Math.random()*2-1)*Math.pow(1-j/sD.length,2);
  const ss=c.createBufferSource();ss.buffer=sb;const sbp=c.createBiquadFilter();sbp.type='bandpass';
  sbp.frequency.value=1500+Math.random()*2500;sbp.Q.value=0.5;const sg=c.createGain();sg.gain.value=0.08+Math.random()*0.06;
  ss.connect(sbp);sbp.connect(sg);sg.connect(m);ss.start(st);ss.stop(st+sd);}}}catch(e){}
}

// iOS requires Audio elements to be "primed" during user gesture.
// We keep a pool of pre-created Audio elements ready to play.
const audioPool=[];
function getPooledAudio(){
  let a=audioPool.find(x=>x.paused&&!x._inUse);
  if(!a){a=new Audio();audioPool.push(a);}
  a._inUse=true;
  a.onended=()=>{a._inUse=false;};
  a.onerror=()=>{a._inUse=false;};
  return a;
}
// Prime audio pool on user gestures for iOS
function primeAudioPool(){
  if(audioPool.length<3){
    for(let i=audioPool.length;i<3;i++){
      const a=new Audio();a.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      a.play().then(()=>{a.pause();a.currentTime=0;a.src='';}).catch(()=>{});
      audioPool.push(a);
    }
  }
}

async function speak(text,opts={}){
  if(currentTTS){currentTTS.pause();currentTTS.currentTime=0;currentTTS._inUse=false;currentTTS=null;}
  window.speechSynthesis?.cancel();
  // Ensure AudioContext is active (iOS suspends it)
  ac();
  const key=text.toLowerCase().trim();
  if(ttsCache[key]){const a=getPooledAudio();a.src=ttsCache[key];currentTTS=a;a.play().catch(()=>{a._inUse=false;});return;}
  try{
    const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`,{
      method:'POST',headers:{'xi-api-key':ELEVEN_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({text,model_id:'eleven_multilingual_v2',
        voice_settings:{stability:0.35,similarity_boost:0.75,style:0.7,use_speaker_boost:true}})});
    if(!r.ok)throw new Error('ElevenLabs API error');
    const b=await r.blob(),u=URL.createObjectURL(b);
    ttsCache[key]=u;const a=getPooledAudio();a.src=u;currentTTS=a;a.play().catch(()=>{a._inUse=false;});
  }catch(e){
    if(!window.speechSynthesis)return;
    const u=new SpeechSynthesisUtterance(text);u.rate=opts.rate||0.95;u.pitch=opts.pitch||1.05;
    u.volume=opts.volume||1;window.speechSynthesis.speak(u);
  }
}

const BYE_LINES=[
  "Bye bye {state}!","You're outta here, {state}!","See ya later, {state}!",
  "So long, {state}!","Hit the road, {state}!","Adios, {state}!",
  "Peace out, {state}!","Better luck next time, {state}!",
  "{state}, you've been eliminated!","Goodbye, {state}!",
];

function getQuizChoices(stateName){
  const correct=CAPITALS[stateName];
  const others=ALL_CAPS.filter(c=>c!==correct);
  const shuffled=[...others].sort(()=>Math.random()-0.5);
  const choices=[correct,shuffled[0],shuffled[1]].sort(()=>Math.random()-0.5);
  return{correct,choices};
}

function Confetti({active,duration=3000}){
  const canvasRef=useRef(null);const animRef=useRef(null);const particles=useRef([]);const startRef=useRef(0);
  useEffect(()=>{
    if(!active){cancelAnimationFrame(animRef.current);return;}
    const cv=canvasRef.current;if(!cv)return;const ctx=cv.getContext('2d');
    cv.width=cv.parentElement.offsetWidth;cv.height=cv.parentElement.offsetHeight;
    const colors=['#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899','#a855f7','#14b8a6','#f97316'];
    const shapes=['rect','circle','star'];particles.current=[];
    for(let i=0;i<120;i++){particles.current.push({
      x:cv.width*0.3+Math.random()*cv.width*0.4,y:cv.height*0.2+Math.random()*cv.height*0.1,
      vx:(Math.random()-0.5)*12,vy:-8-Math.random()*12,size:4+Math.random()*8,
      color:colors[Math.floor(Math.random()*colors.length)],rotation:Math.random()*360,
      rotSpeed:(Math.random()-0.5)*15,shape:shapes[Math.floor(Math.random()*shapes.length)],
      gravity:0.15+Math.random()*0.1,drag:0.98+Math.random()*0.015,
      wobble:Math.random()*Math.PI*2,wobbleSpeed:0.05+Math.random()*0.05});}
    startRef.current=Date.now();
    const draw=()=>{const el=Date.now()-startRef.current;
      if(el>duration){ctx.clearRect(0,0,cv.width,cv.height);return;}
      ctx.clearRect(0,0,cv.width,cv.height);const fade=el>duration-800?1-(el-(duration-800))/800:1;
      particles.current.forEach(p=>{p.vy+=p.gravity;p.vx*=p.drag;p.x+=p.vx;p.y+=p.vy;
        p.rotation+=p.rotSpeed;p.wobble+=p.wobbleSpeed;const wx=Math.sin(p.wobble)*2;
        ctx.save();ctx.globalAlpha=fade*0.9;ctx.translate(p.x+wx,p.y);ctx.rotate(p.rotation*Math.PI/180);ctx.fillStyle=p.color;
        if(p.shape==='rect'){ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);}
        else if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
        else{const s=p.size/2;ctx.beginPath();for(let i=0;i<5;i++){const a=(i*72-90)*Math.PI/180;const a2=((i*72)+36-90)*Math.PI/180;
        ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);ctx.lineTo(Math.cos(a2)*s*0.4,Math.sin(a2)*s*0.4);}ctx.closePath();ctx.fill();}
        ctx.restore();});animRef.current=requestAnimationFrame(draw);};
    draw();return()=>cancelAnimationFrame(animRef.current);
  },[active,duration]);
  return <canvas ref={canvasRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:100}}/>;
}

function drawWheel(ctx,size,items){
  const cx=size/2,cy=size/2,r=size/2-6;ctx.clearRect(0,0,size,size);if(!items.length)return;
  const sl=2*Math.PI/items.length;
  items.forEach((it,i)=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,i*sl-Math.PI/2,(i+1)*sl-Math.PI/2);ctx.closePath();
  ctx.fillStyle=hsl(i,items.length);ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(i*sl+sl/2-Math.PI/2);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  const fs=Math.max(7,Math.min(13,Math.floor(440/items.length)));ctx.font=`600 ${fs}px system-ui,sans-serif`;
  ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=3;ctx.fillText(ABBR[it]||it.slice(0,2),r*0.82,0);ctx.restore();});
  ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);
  const grad=ctx.createRadialGradient(cx,cy,2,cx,cy,16);grad.addColorStop(0,'#fbbf24');grad.addColorStop(1,'#b45309');
  ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
}

function Wheel({items,size,rotation,transitioning,onEnd,duration=4.5}){
  const canvasRef=useRef(null);const lastRot=useRef(rotation);
  useEffect(()=>{const c=canvasRef.current;if(c)drawWheel(c.getContext('2d'),size,items);},[items,size]);
  useEffect(()=>{
    if(!transitioning)return;let running=true;const total=items.length;if(!total)return;
    const sl=360/total;let prev=Math.floor(lastRot.current/sl);
    const iv=setInterval(()=>{if(!running)return;const el=canvasRef.current?.parentElement;if(!el)return;
    const st=getComputedStyle(el.querySelector('canvas'));const tr=st.transform;
    if(tr&&tr!=='none'){const m=tr.match(/matrix\((.+)\)/);if(m){const vals=m[1].split(',').map(Number);
    const angle=Math.atan2(vals[1],vals[0])*180/Math.PI;const cur=Math.floor(((angle%360)+360)%360/sl);
    if(cur!==prev){playTick();prev=cur;}}}},50);
    return()=>{running=false;clearInterval(iv);};
  },[transitioning,items.length]);
  useEffect(()=>{lastRot.current=rotation;},[rotation]);
  return(
    <div style={{textAlign:'center',marginBottom:6}}>
      <div style={{position:'relative',width:size,height:size,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={size} height={size}
          style={{borderRadius:'50%',transform:`rotate(${rotation}deg)`,
            transition:transitioning?`transform ${duration}s cubic-bezier(0.12,0.6,0.08,1)`:'none',
            boxShadow:'0 0 20px rgba(251,191,36,0.3),0 0 40px rgba(251,191,36,0.1)',
            border:'3px solid rgba(251,191,36,0.4)'}}
          onTransitionEnd={onEnd}/>
        <div style={{position:'absolute',top:'50%',right:-14,transform:'translateY(-50%)',
          fontSize:28,color:'#ef4444',filter:'drop-shadow(0 2px 6px rgba(239,68,68,0.8))',zIndex:5,lineHeight:1}}>◀</div>
      </div>
    </div>
  );
}

function FighterCard({name,color,emoji}){
  return(
    <div style={{textAlign:'center',flex:1}}>
      <div style={{background:`linear-gradient(145deg,${color},${color}99)`,borderRadius:16,padding:'12px 8px',
        border:`3px solid ${color}`,boxShadow:`0 4px 24px ${color}55`,animation:'bounceIn 0.5s ease-out'}}>
        <div style={{fontSize:14,marginBottom:2}}>{emoji}</div>
        <div style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:2}}>{ABBR[name]}</div>
        <div style={{fontSize:11,color:'#fff',opacity:0.9,fontWeight:600}}>{name}</div>
      </div>
    </div>
  );
}

function ProgressBar({total,remaining,eliminated}){
  const pct=((total-remaining)/total)*100;
  return(
    <div style={{margin:'8px 0',padding:'8px 12px',background:'rgba(0,0,0,0.3)',borderRadius:10,border:'1px solid rgba(251,191,36,0.1)'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginBottom:4,fontWeight:600}}>
        <span>🗺️ {remaining} states left</span><span>🏆 {eliminated} eliminated</span>
      </div>
      <div style={{height:10,background:'rgba(100,116,139,0.2)',borderRadius:5,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#f59e0b,#ef4444,#ec4899)',
          borderRadius:5,transition:'width 0.6s ease',boxShadow:'0 0 8px rgba(245,158,11,0.5)'}}/></div>
    </div>
  );
}

function USMap({features,active,eliminated,fighter1,fighter2,winner,loser,hoveredState,setHoveredState}){
  if(!features.length)return <div style={{color:'#64748b',textAlign:'center',padding:40,fontSize:16}}>🗺️ Loading map...</div>;
  return(
    <div style={{position:'relative',background:'rgba(15,23,42,0.5)',borderRadius:16,border:'2px solid rgba(251,191,36,0.12)',overflow:'hidden'}}>
      <svg viewBox="0 0 975 610" style={{width:'100%',height:'auto',display:'block'}}>
        {features.map(f=>{
          const name=f.name;if(!name)return null;
          const isElim=eliminated.includes(name),isF1=fighter1===name,isF2=fighter2===name;
          const isWin=winner===name,isLose=loser===name,isHov=hoveredState===name;
          let fill='#1e3a5f',stroke='#334155',sw=0.8,op=1,filt='';
          if(isElim){fill='url(#elimPattern)';stroke='#4a3040';sw=1;op=0.85;}
          else if(isWin){fill='#16a34a';stroke='#4ade80';sw=2.5;filt='url(#glowG)';}
          else if(isLose){fill='#dc2626';stroke='#f87171';sw=2.5;filt='url(#glowR)';}
          else if(isF1){fill='#1d4ed8';stroke='#60a5fa';sw=2.5;filt='url(#glowB)';}
          else if(isF2){fill='#b91c1c';stroke='#f87171';sw=2.5;filt='url(#glowR)';}
          else if(isHov){fill='#2563eb';stroke='#93c5fd';sw=1.5;}
          else if(active.includes(name)){fill='#1e3a5f';stroke='#475569';}
          const c=f.centroid;
          const showLabel=isF1||isF2||isWin||isLose||isHov;
          return(<g key={name} onMouseEnter={()=>setHoveredState(name)} onMouseLeave={()=>setHoveredState(null)} style={{cursor:'default'}}>
            <path d={f.path} fill={fill} stroke={stroke} strokeWidth={sw} opacity={op} filter={filt}
              style={{transition:'fill 0.5s,stroke 0.5s,opacity 0.5s'}}/>
            {showLabel&&c&&(
              <text x={c[0]} y={c[1]} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={isWin||isLose?15:12} fontWeight="bold"
                style={{pointerEvents:'none',textShadow:'0 0 6px rgba(0,0,0,0.9)',
                  transition:'opacity 0.3s',opacity:1}}>{ABBR[name]}</text>)}
          </g>);
        })}
        <defs>
          <pattern id="elimPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#2d2035"/>
            <line x1="0" y1="0" x2="0" y2="8" stroke="#6b2039" strokeWidth="3" opacity="0.6"/>
          </pattern>
          <filter id="glowB"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.8"/></filter>
          <filter id="glowR"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.8"/></filter>
          <filter id="glowG"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22c55e" floodOpacity="0.8"/></filter>
        </defs>
      </svg>
      {hoveredState&&(<div style={{position:'absolute',top:8,right:12,background:'rgba(0,0,0,0.75)',color:'#e2e8f0',
        padding:'6px 12px',borderRadius:8,fontSize:13,fontWeight:700,pointerEvents:'none'}}>
        {hoveredState} {eliminated.includes(hoveredState)?'(Out!)':''}</div>)}
    </div>
  );
}

function FlashOverlay({text,color,visible,emoji,sub}){
  if(!visible)return null;
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',flexDirection:'column',
    alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.65)',zIndex:1000,
    animation:'flashIn 1.2s ease-out forwards',pointerEvents:'none'}}>
    {emoji&&<div style={{fontSize:72,marginBottom:8,animation:'bounceEmoji 0.6s ease-out'}}>{emoji}</div>}
    <div style={{fontSize:60,fontWeight:900,color,letterSpacing:4,textTransform:'uppercase',
      textShadow:`0 0 40px ${color},0 0 80px ${color}44`,animation:'scaleIn 0.4s ease-out'}}>{text}</div>
    {sub&&<div style={{fontSize:36,fontWeight:800,color:'#f87171',letterSpacing:3,marginTop:10,
      textShadow:'0 0 30px rgba(239,68,68,0.6),0 0 60px rgba(239,68,68,0.3)',
      animation:'scaleIn 0.5s ease-out 0.15s both'}}>{sub}</div>}
  </div>);
}

function CountdownOverlay({number}){
  if(number===null||number===undefined)return null;
  const colors={3:'#3b82f6',2:'#f59e0b',1:'#ef4444',0:'#22c55e'};
  const labels={3:'3',2:'2',1:'1',0:'GO!'};
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',
    background:'rgba(0,0,0,0.5)',zIndex:1001,pointerEvents:'none'}}>
    <div key={number} style={{fontSize:number===0?80:120,fontWeight:900,color:colors[number]||'#fff',
      textShadow:`0 0 60px ${colors[number]}`,animation:'countPop 0.7s ease-out'}}>{labels[number]}</div>
  </div>);
}

function QuizOverlay({stateName,onComplete}){
  const [quiz]=useState(()=>getQuizChoices(stateName));
  const [selected,setSelected]=useState(null);
  const [shake,setShake]=useState(null);
  const [correct,setCorrect]=useState(false);
  const hasSpoken=useRef(false);

  useEffect(()=>{
    if(hasSpoken.current)return;hasSpoken.current=true;
    const q=`What is the capital of ${stateName}? Is it ${quiz.choices[0]}, ${quiz.choices[1]}, or ${quiz.choices[2]}?`;
    setTimeout(()=>speak(q),600);
  },[stateName,quiz.choices]);

  const handleChoice=(choice)=>{
    if(correct)return;
    if(choice===quiz.correct){
      setSelected(choice);setCorrect(true);playDing();
      setTimeout(()=>speak(`Correct! ${quiz.correct} is the capital of ${stateName}!`),300);
      setTimeout(()=>onComplete(),3000);
    }else{
      setShake(choice);playBuzzer();
      speak("Try again!");
      setTimeout(()=>setShake(null),600);
    }
  };

  const btnStyle=(choice)=>{
    const isCorrectChoice=choice===quiz.correct;
    const isShaking=shake===choice;
    let bg='linear-gradient(135deg,#334155,#1e293b)';
    let border='2px solid #475569';
    let shadow='0 4px 12px rgba(0,0,0,0.3)';
    let anim='';
    if(correct&&isCorrectChoice){bg='linear-gradient(135deg,#16a34a,#15803d)';border='2px solid #4ade80';shadow='0 4px 20px rgba(74,222,128,0.4)';}
    if(isShaking){bg='linear-gradient(135deg,#dc2626,#b91c1c)';border='2px solid #f87171';anim='quizShake 0.4s ease-in-out';shadow='0 4px 20px rgba(248,113,113,0.4)';}
    return{padding:'16px 24px',fontSize:18,fontWeight:700,color:'#fff',background:bg,border,borderRadius:14,
      cursor:correct?'default':'pointer',boxShadow:shadow,animation:anim,transition:'all 0.2s',width:'100%',textAlign:'center'};
  };

  return(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',
      background:'rgba(0,0,0,0.75)',zIndex:1002}} onClick={e=>e.stopPropagation()}>
      <div style={{background:'linear-gradient(150deg,#1e293b,#0f172a)',borderRadius:24,padding:'32px 36px',
        maxWidth:420,width:'90%',border:'3px solid rgba(251,191,36,0.3)',
        boxShadow:'0 0 60px rgba(251,191,36,0.15)',animation:'scaleIn 0.3s ease-out'}}>
        <div style={{textAlign:'center',marginBottom:6}}>
          <div style={{fontSize:42,marginBottom:4}}>🧠</div>
          <div style={{fontSize:14,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:2}}>Capital Quiz</div>
        </div>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:22,fontWeight:800,color:'#fbbf24',lineHeight:1.3}}>
            What is the capital of
          </div>
          <div style={{fontSize:30,fontWeight:900,color:'#fff',marginTop:4,letterSpacing:1}}>
            {stateName}?
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {quiz.choices.map((c,i)=>(
            <button key={c} onClick={()=>handleChoice(c)} style={btnStyle(c)}
              onMouseEnter={e=>{if(!correct&&shake!==c)e.target.style.transform='scale(1.03)';}}
              onMouseLeave={e=>{e.target.style.transform='scale(1)';}}>
              <span style={{marginRight:8,color:'#94a3b8',fontSize:14}}>{String.fromCharCode(65+i)}.</span>{c}
              {correct&&c===quiz.correct&&<span style={{marginLeft:8}}>✅</span>}
            </button>
          ))}
        </div>
        {correct&&(
          <div style={{textAlign:'center',marginTop:16,animation:'scaleIn 0.3s ease-out'}}>
            <div style={{fontSize:16,fontWeight:700,color:'#4ade80'}}>
              🎉 {quiz.correct} is correct!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(){
  const [features,setFeatures]=useState([]);
  const [active,setActive]=useState(ALL_STATES);
  const [eliminated,setEliminated]=useState([]);
  const [phase,setPhase]=useState('idle');
  const [pendingF1,setPendingF1]=useState(null);
  const [pendingF2,setPendingF2]=useState(null);
  const [mapF1,setMapF1]=useState(null);
  const [mapF2,setMapF2]=useState(null);
  const [f1,setF1]=useState(null);
  const [f2,setF2]=useState(null);
  const [winner,setWinner]=useState(null);
  const [loser,setLoser]=useState(null);
  const [champion,setChampion]=useState(null);
  const [round,setRound]=useState(0);
  const [log,setLog]=useState([]);
  const [hoveredState,setHoveredState]=useState(null);
  const [flashText,setFlashText]=useState('');
  const [flashColor,setFlashColor]=useState('#fff');
  const [flashEmoji,setFlashEmoji]=useState('');
  const [flashSub,setFlashSub]=useState('');
  const [flashVisible,setFlashVisible]=useState(false);
  const [countdown,setCountdown]=useState(null);
  const [confettiActive,setConfettiActive]=useState(false);
  const [rot1,setRot1]=useState(0);
  const [rot2,setRot2]=useState(0);
  const [rotB,setRotB]=useState(0);
  const [trans1,setTrans1]=useState(false);
  const [trans2,setTrans2]=useState(false);
  const [transB,setTransB]=useState(false);
  const [showQuiz,setShowQuiz]=useState(false);
  const [quizScore,setQuizScore]=useState({correct:0,total:0});

  const showBattle=phase==='battleReady'||phase==='countdown'||phase==='battling'||phase==='result'||phase==='quiz';

  const showFlash=(text,color,emoji,duration=1200,sub='')=>{
    setFlashText(text);setFlashColor(color);setFlashEmoji(emoji||'');setFlashSub(sub);setFlashVisible(true);
    setTimeout(()=>setFlashVisible(false),duration);
  };

  useEffect(()=>{window.speechSynthesis?.getVoices();
    const h=()=>window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged',h);
    return()=>window.speechSynthesis?.removeEventListener?.('voiceschanged',h);},[]);

  useEffect(()=>{
    const handler=()=>{unlockAudio();primeAudioPool();document.removeEventListener('touchstart',handler);document.removeEventListener('click',handler);};
    document.addEventListener('touchstart',handler,{once:true});
    document.addEventListener('click',handler,{once:true});
    return()=>{document.removeEventListener('touchstart',handler);document.removeEventListener('click',handler);};
  },[]);

  useEffect(()=>{
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
      .then(r=>r.json()).then(topo=>{
        const fc=topoFeature(topo,'states');
        setFeatures(fc.features.filter(f=>FIPS[String(f.id).padStart(2,'0')]&&f.id!=="11")
          .map(f=>{const name=FIPS[String(f.id).padStart(2,'0')];
          return{name,path:pathStr(f.geometry),centroid:centroid(f.geometry,name)};}));
      }).catch(()=>{});},[]);

  const calcRot=(cur,idx,tot)=>{const sl=360/tot;const tg=(360-(idx+0.5)*sl+90+360)%360;
    const df=(tg-cur%360+360)%360;return cur+360*(5+Math.floor(Math.random()*3))+df+(Math.random()-0.5)*sl*0.3;};

  const getFighters=useCallback(()=>{
    if(active.length<2)return;unlockAudio();setWinner(null);setLoser(null);setMapF1(null);setMapF2(null);setF1(null);setF2(null);
    const items=[...active];const i1=Math.floor(Math.random()*items.length);
    let i2=Math.floor(Math.random()*(items.length-1));if(i2>=i1)i2++;
    setPendingF1(items[i1]);setPendingF2(items[i2]);
    setRound(r=>r+1);playDrumRoll();
    const nr=calcRot(rot1,i1,items.length);
    setTimeout(()=>{setTrans1(true);setRot1(nr);},50);
    setPhase('spinning1');window._pF2={state:items[i2],items};
  },[active,rot1]);

  const onW1End=()=>{setTrans1(false);playImpact();
    setMapF1(pendingF1);setF1(pendingF1);
    showFlash(pendingF1,'#60a5fa','🔵');speak(pendingF1);
    setTimeout(()=>{const{state:s2,items}=window._pF2;
    const nr=calcRot(rot2,items.indexOf(s2),items.length);
    setTimeout(()=>{setTrans2(true);setRot2(nr);},50);setPhase('spinning2');},1800);};

  const onW2End=()=>{setTrans2(false);playImpact();
    setMapF2(pendingF2);setF2(pendingF2);
    showFlash('VS','#fbbf24','⚔️',1400,pendingF2);
    setTimeout(()=>speak('versus '+pendingF2),200);setTimeout(()=>setPhase('battleReady'),1600);};

  const doBattle=()=>{
    unlockAudio();const w=Math.random()<0.5?0:1;window._bw=w;setPhase('countdown');
    setCountdown(3);playCountdownBeep(false);
    setTimeout(()=>{setCountdown(2);playCountdownBeep(false);},700);
    setTimeout(()=>{setCountdown(1);playCountdownBeep(false);},1400);
    setTimeout(()=>{setCountdown(0);playCountdownBeep(true);},2100);
    setTimeout(()=>{setCountdown(null);playWhoosh();
      const sl=360/2;const tg=(360-(w+0.5)*sl+90+360)%360;
      const df=(tg-rotB%360+360)%360;
      const nr=rotB+360*(10+Math.floor(Math.random()*4))+df+(Math.random()-0.5)*sl*0.3;
      setPhase('battling');
      setTimeout(()=>{setTransB(true);setRotB(nr);},50);},2600);
  };

  const onBEnd=()=>{setTransB(false);const w=window._bw;
    const wn=w===0?f1:f2,ln=w===0?f2:f1;
    setWinner(wn);setLoser(ln);setConfettiActive(true);
    setTimeout(()=>setConfettiActive(false),3500);
    const calls=["wins!","takes it!","moves on!","is the winner!","dominates!","gets a huge victory!"];
    showFlash(wn+' Wins!','#4ade80','🎉',2500);
    setTimeout(()=>speak(wn+" "+calls[Math.floor(Math.random()*calls.length)]),1800);
    setLog(l=>[{round,f1,f2,winner:wn},...l]);setPhase('result');};

  const startQuiz=()=>{setShowQuiz(true);setPhase('quiz');};

  const onQuizComplete=()=>{
    setShowQuiz(false);setQuizScore(s=>({correct:s.correct+1,total:s.total+1}));
    proceedToNext();
  };

  const proceedToNext=()=>{
    const bye=BYE_LINES[Math.floor(Math.random()*BYE_LINES.length)].replace('{state}',loser);
    speak(bye,{rate:1.1,pitch:1.1});
    const na=active.filter(n=>n!==loser),ne=[...eliminated,loser];
    setActive(na);setEliminated(ne);
    setMapF1(null);setMapF2(null);setPendingF1(null);setPendingF2(null);
    if(na.length===1){setChampion(na[0]);playApplause(true);setConfettiActive(true);
      setTimeout(()=>setConfettiActive(false),6000);
      showFlash('CHAMPION!','#fbbf24','👑',3000);
      setTimeout(()=>speak(na[0]+" is the Grand Champion! Incredible!",{rate:0.85}),500);
      setPhase('champion');
    }else{setF1(null);setF2(null);setWinner(null);setLoser(null);setPhase('idle');}
  };

  const resetGame=()=>{setActive(ALL_STATES);setEliminated([]);setPhase('idle');
    setF1(null);setF2(null);setPendingF1(null);setPendingF2(null);setMapF1(null);setMapF2(null);
    setWinner(null);setLoser(null);setChampion(null);setShowQuiz(false);
    setRound(0);setLog([]);setRot1(0);setRot2(0);setRotB(0);setQuizScore({correct:0,total:0});};

  const battleItems=f1&&f2?[f1,f2]:[];
  const W=220;

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(150deg,#0f172a 0%,#1e1b4b 40%,#172554 100%)',
      color:'#e2e8f0',fontFamily:'system-ui,-apple-system,sans-serif',padding:12,boxSizing:'border-box',position:'relative',overflow:'hidden'}}
      onClick={()=>{unlockAudio();primeAudioPool();}}>
      <Confetti active={confettiActive} duration={phase==='champion'?6000:3500}/>
      <FlashOverlay text={flashText} color={flashColor} emoji={flashEmoji} visible={flashVisible} sub={flashSub}/>
      <CountdownOverlay number={countdown}/>
      {showQuiz&&winner&&<QuizOverlay stateName={winner} onComplete={onQuizComplete}/>}

      <div style={{textAlign:'center',marginBottom:8}}>
        <h1 style={{margin:0,fontSize:28,fontWeight:900,
          background:'linear-gradient(90deg,#fbbf24,#f97316,#ef4444,#f97316,#fbbf24)',backgroundSize:'200% 100%',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          letterSpacing:2,animation:'shimmer 3s linear infinite'}}>
          🏆 Tristan's State vs State Battle 🏆
        </h1>
        <div style={{fontSize:13,color:'#94a3b8',marginTop:2,fontWeight:600}}>
          {champion?'🎉 We have a Grand Champion! 🎉':`Round ${round} · ${active.length} states remaining`}
          {quizScore.total>0&&!champion&&<span style={{marginLeft:8}}>🧠 Quiz: {quizScore.correct}/{quizScore.total}</span>}
        </div>
      </div>

      <div style={{display:'flex',gap:14,alignItems:'flex-start',maxWidth:1200,margin:'0 auto'}}>
        <div style={{flex:'0 0 auto',width:W+24,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>

          <div style={{width:'100%',height:60,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {phase==='idle'&&!champion&&(
              <button onClick={getFighters} disabled={active.length<2}
                style={{padding:'14px 32px',fontSize:17,fontWeight:800,
                  background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',
                  border:'none',borderRadius:14,cursor:'pointer',
                  boxShadow:'0 6px 25px rgba(245,158,11,0.4)',letterSpacing:1,
                  transition:'transform 0.2s,box-shadow 0.2s',
                  animation:'gentlePulse 2s ease-in-out infinite'}}
                onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
                onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                🎲 Get Fighters!
              </button>
            )}
            {phase==='battleReady'&&(
              <button onClick={doBattle}
                style={{padding:'14px 44px',fontSize:18,fontWeight:800,
                  background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',
                  border:'3px solid #fbbf24',borderRadius:14,cursor:'pointer',
                  boxShadow:'0 6px 30px rgba(220,38,38,0.5)',
                  animation:'battlePulse 1s infinite',letterSpacing:1}}>
                ⚔️ Battle!
              </button>
            )}
            {phase==='result'&&(
              <button onClick={startQuiz}
                style={{padding:'14px 28px',fontSize:16,fontWeight:700,
                  background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',
                  border:'none',borderRadius:14,cursor:'pointer',
                  boxShadow:'0 6px 22px rgba(124,58,237,0.4)',
                  animation:'gentlePulse 2s ease-in-out infinite',letterSpacing:1}}
                onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
                onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                🧠 Capital Quiz!
              </button>
            )}
          </div>

          {!showBattle&&(
            <>
              <Wheel items={active} size={W} rotation={rot1} transitioning={trans1} onEnd={onW1End}/>
              <Wheel items={active} size={W} rotation={rot2} transitioning={trans2} onEnd={onW2End}/>
            </>
          )}

          {showBattle&&f1&&f2&&(
            <div style={{width:'100%',background:'rgba(0,0,0,0.35)',borderRadius:16,padding:12,
              border:'2px solid rgba(251,191,36,0.15)',animation:'slideUp 0.4s ease-out'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <FighterCard name={f1} color="#2563eb" emoji="🔵"/>
                <div style={{fontSize:26,fontWeight:900,color:'#fbbf24',textShadow:'0 0 20px #fbbf2455',
                  animation:'vsWiggle 1s ease-in-out infinite'}}>⚔️</div>
                <FighterCard name={f2} color="#dc2626" emoji="🔴"/>
              </div>

              <Wheel items={battleItems} size={W} rotation={rotB} transitioning={transB} onEnd={onBEnd} duration={7}/>

              {(phase==='result'||phase==='quiz')&&(
                <div style={{textAlign:'center',marginTop:10}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#4ade80',marginBottom:4,
                    textShadow:'0 0 15px #4ade8044'}}>🏆 {winner} Wins!</div>
                  <div style={{fontSize:13,color:'#f87171',marginBottom:4,fontWeight:600}}>👋 Bye bye, {loser}!</div>
                </div>
              )}
            </div>
          )}

          {phase==='champion'&&champion&&(
            <div style={{marginTop:12,textAlign:'center',padding:24,
              background:'linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))',
              borderRadius:20,border:'3px solid #fbbf24',
              boxShadow:'0 0 50px rgba(251,191,36,0.25)',animation:'champGlow 2s ease-in-out infinite'}}>
              <div style={{fontSize:64,marginBottom:4,animation:'champBounce 1s ease-in-out infinite'}}>👑</div>
              <div style={{fontSize:28,fontWeight:900,color:'#fbbf24',letterSpacing:3}}>{champion}</div>
              <div style={{fontSize:16,color:'#f59e0b',margin:'8px 0',fontWeight:700}}>🏆 Grand Champion! 🏆</div>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>Won {round} battles! · Quiz: {quizScore.correct}/{quizScore.total}</div>
              <button onClick={resetGame}
                style={{marginTop:16,padding:'12px 24px',fontSize:14,fontWeight:700,
                  background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',
                  border:'none',borderRadius:12,cursor:'pointer',
                  boxShadow:'0 4px 18px rgba(124,58,237,0.35)'}}>
                🔄 Play Again!
              </button>
            </div>
          )}
        </div>

        <div style={{flex:1,minWidth:0}}>
          <USMap features={features} active={active} eliminated={eliminated}
            fighter1={mapF1} fighter2={mapF2} winner={winner} loser={loser}
            hoveredState={hoveredState} setHoveredState={setHoveredState}/>
          <ProgressBar total={50} remaining={active.length} eliminated={eliminated.length}/>
          <div style={{display:'flex',gap:14,justifyContent:'center',fontSize:11,color:'#94a3b8',flexWrap:'wrap',fontWeight:600}}>
            <span>🔵 Fighter 1</span><span>🔴 Fighter 2</span><span>🟢 Winner</span><span>⬛ Eliminated</span>
          </div>
          {log.length>0&&(
            <div style={{marginTop:10,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:10,maxHeight:170,overflowY:'auto',
              border:'1px solid rgba(100,116,139,0.15)'}}>
              <div style={{fontSize:13,color:'#fbbf24',fontWeight:800,marginBottom:6}}>📋 Battle Log</div>
              {log.map((l,i)=>(
                <div key={i} style={{fontSize:11,color:'#94a3b8',padding:'3px 0',borderBottom:'1px solid rgba(100,116,139,0.08)',
                  display:'flex',gap:6,alignItems:'center',fontWeight:600}}>
                  <span style={{color:'#64748b',minWidth:28}}>R{l.round}</span>
                  <span style={{color:l.winner===l.f1?'#4ade80':'#f87171'}}>{l.f1}</span>
                  <span style={{color:'#fbbf24'}}>vs</span>
                  <span style={{color:l.winner===l.f2?'#4ade80':'#f87171'}}>{l.f2}</span>
                  <span style={{color:'#fbbf24'}}>→ 🏆 {l.winner}</span>
                </div>))}
            </div>
          )}
          {!champion&&(
            <div style={{marginTop:8,textAlign:'right'}}>
              <button onClick={resetGame}
                style={{padding:'6px 16px',fontSize:12,background:'transparent',color:'#64748b',
                  border:'1px solid #334155',borderRadius:8,cursor:'pointer',fontWeight:600}}>
                🔄 Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes gentlePulse{0%,100%{transform:scale(1);box-shadow:0 6px 25px rgba(245,158,11,0.4)}50%{transform:scale(1.04);box-shadow:0 8px 35px rgba(245,158,11,0.55)}}
        @keyframes battlePulse{0%,100%{transform:scale(1);box-shadow:0 6px 30px rgba(220,38,38,0.5)}50%{transform:scale(1.06);box-shadow:0 8px 40px rgba(220,38,38,0.7)}}
        @keyframes flashIn{0%{opacity:0}8%{opacity:1}75%{opacity:1}100%{opacity:0}}
        @keyframes scaleIn{0%{transform:scale(3);opacity:0}50%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes bounceEmoji{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(1) rotate(0deg)}}
        @keyframes bounceIn{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes countPop{0%{transform:scale(3);opacity:0}30%{transform:scale(0.8);opacity:1}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:0.7}}
        @keyframes slideUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes vsWiggle{0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(5deg) scale(1.15)}}
        @keyframes champBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes champGlow{0%,100%{box-shadow:0 0 50px rgba(251,191,36,0.25)}50%{box-shadow:0 0 80px rgba(251,191,36,0.45)}}
        @keyframes quizShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}
      `}</style>
    </div>
  );
}