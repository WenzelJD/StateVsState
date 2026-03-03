import { useState, useRef, useEffect, useCallback } from "react";

const FIPS={
  "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California",
  "08":"Colorado","09":"Connecticut","10":"Delaware","11":"Washington DC","12":"Florida","13":"Georgia",
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
  "Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY",
  "Washington DC":"DC","Puerto Rico":"PR"
};
const NUDGE={
  "Florida":[30,-25],"Louisiana":[10,-10],"Michigan":[20,20],"Hawaii":[0,0],
  "Alaska":[0,0],"Maryland":[2,6],"Massachusetts":[-10,2],"Connecticut":[-2,0],
  "Rhode Island":[0,0],"New Jersey":[-2,2],"Delaware":[-2,0],"Vermont":[0,2],
  "New Hampshire":[0,2],"Idaho":[0,5],"Virginia":[-8,6],"West Virginia":[2,2],
  "Kentucky":[-5,2],"Tennessee":[-5,0],"North Carolina":[-5,4],
  "Oklahoma":[-8,0],"New York":[-5,5],"Pennsylvania":[-5,2],
  "Washington DC":[10,0],"Puerto Rico":[0,0]
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
const NO_QUIZ=["Washington DC","Puerto Rico"];
const ISLANDS=["Alaska","Hawaii","Puerto Rico"];
const ADJ={
  "Alabama":["Mississippi","Tennessee","Georgia","Florida"],
  "Alaska":[],"Arizona":["California","Nevada","Utah","Colorado","New Mexico"],
  "Arkansas":["Missouri","Tennessee","Mississippi","Louisiana","Texas","Oklahoma"],
  "California":["Oregon","Nevada","Arizona"],
  "Colorado":["Wyoming","Nebraska","Kansas","Oklahoma","New Mexico","Arizona","Utah"],
  "Connecticut":["New York","Massachusetts","Rhode Island"],
  "Delaware":["Maryland","Pennsylvania","New Jersey"],
  "Florida":["Alabama","Georgia"],
  "Georgia":["Florida","Alabama","Tennessee","North Carolina","South Carolina"],
  "Hawaii":[],"Idaho":["Montana","Wyoming","Utah","Nevada","Oregon","Washington"],
  "Illinois":["Indiana","Kentucky","Missouri","Iowa","Wisconsin"],
  "Indiana":["Illinois","Kentucky","Ohio","Michigan"],
  "Iowa":["Minnesota","Wisconsin","Illinois","Missouri","Nebraska","South Dakota"],
  "Kansas":["Nebraska","Missouri","Oklahoma","Colorado"],
  "Kentucky":["Indiana","Ohio","West Virginia","Virginia","Tennessee","Missouri","Illinois"],
  "Louisiana":["Texas","Arkansas","Mississippi"],
  "Maine":["New Hampshire"],
  "Maryland":["Virginia","West Virginia","Pennsylvania","Delaware","Washington DC"],
  "Massachusetts":["Rhode Island","Connecticut","New York","Vermont","New Hampshire"],
  "Michigan":["Ohio","Indiana","Wisconsin"],
  "Minnesota":["Wisconsin","Iowa","South Dakota","North Dakota"],
  "Mississippi":["Louisiana","Arkansas","Tennessee","Alabama"],
  "Missouri":["Iowa","Illinois","Kentucky","Tennessee","Arkansas","Oklahoma","Kansas","Nebraska"],
  "Montana":["North Dakota","South Dakota","Wyoming","Idaho"],
  "Nebraska":["South Dakota","Iowa","Missouri","Kansas","Colorado","Wyoming"],
  "Nevada":["Oregon","Idaho","Utah","Arizona","California"],
  "New Hampshire":["Vermont","Maine","Massachusetts"],
  "New Jersey":["Delaware","Pennsylvania","New York"],
  "New Mexico":["Arizona","Utah","Colorado","Oklahoma","Texas"],
  "New York":["New Jersey","Pennsylvania","Connecticut","Massachusetts","Vermont"],
  "North Carolina":["Virginia","Tennessee","Georgia","South Carolina"],
  "North Dakota":["Montana","South Dakota","Minnesota"],
  "Ohio":["Michigan","Indiana","Kentucky","West Virginia","Pennsylvania"],
  "Oklahoma":["Kansas","Missouri","Arkansas","Texas","New Mexico","Colorado"],
  "Oregon":["Washington","Idaho","Nevada","California"],
  "Pennsylvania":["New York","New Jersey","Delaware","Maryland","West Virginia","Ohio"],
  "Rhode Island":["Connecticut","Massachusetts"],
  "South Carolina":["Georgia","North Carolina"],
  "South Dakota":["North Dakota","Minnesota","Iowa","Nebraska","Wyoming","Montana"],
  "Tennessee":["Kentucky","Virginia","North Carolina","Georgia","Alabama","Mississippi","Arkansas","Missouri"],
  "Texas":["New Mexico","Oklahoma","Arkansas","Louisiana"],
  "Utah":["Idaho","Wyoming","Colorado","New Mexico","Arizona","Nevada"],
  "Vermont":["New Hampshire","Massachusetts","New York"],
  "Virginia":["Maryland","West Virginia","Kentucky","Tennessee","North Carolina","Washington DC"],
  "Washington":["Oregon","Idaho"],
  "West Virginia":["Ohio","Pennsylvania","Maryland","Virginia","Kentucky"],
  "Wisconsin":["Michigan","Minnesota","Iowa","Illinois"],
  "Wyoming":["Montana","South Dakota","Nebraska","Colorado","Utah","Idaho"],
  "Washington DC":["Maryland","Virginia"],"Puerto Rico":[]
};
const ALL_CAPS=Object.values(CAPITALS);
const ALL_ENTITIES=[...Object.values(FIPS).sort(),"Puerto Rico"];
const STATE_COLORS={};
const COLOR_LIST=[
  "#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#2980b9",
  "#27ae60","#c0392b","#8e44ad","#16a085","#d35400","#2c3e95","#f1c40f","#7f8c8d",
  "#e84393","#00b894","#6c5ce7","#fdcb6e","#e17055","#00cec9","#a29bfe","#fab1a0",
  "#55efc4","#74b9ff","#ff7675","#fd79a8","#636e72","#b2bec3","#dfe6e9","#0984e3",
  "#d63031","#e056a0","#5f27cd","#01a3a4","#f78fb3","#3dc1d3","#e77f67","#778beb",
  "#cf6a87","#58B19F","#EAB543","#a55eea","#4b7bec","#fc5c65","#26de81","#fd9644",
  "#45aaf2","#2bcbba","#eb3b5a","#8854d0"
];
ALL_ENTITIES.forEach((s,i)=>{STATE_COLORS[s]=COLOR_LIST[i%COLOR_LIST.length];});

function getValidTargets(fighter,territories,active){
  const owned=Object.entries(territories).filter(([_,o])=>o===fighter).map(([t])=>t);
  const wildIslands=ISLANDS.filter(isl=>territories[isl]===isl);
  const targetOwners=new Set();
  owned.forEach(t=>{
    const isWild=ISLANDS.includes(t)&&territories[t]===t;
    const neighbors=isWild?ALL_ENTITIES.filter(x=>x!==t):(ADJ[t]||[]);
    neighbors.forEach(n=>{const owner=territories[n];if(owner&&owner!==fighter&&active.includes(owner))targetOwners.add(owner);});
    if(!ISLANDS.includes(t)){wildIslands.forEach(isl=>{const owner=territories[isl];if(owner&&owner!==fighter&&active.includes(owner))targetOwners.add(owner);});}
  });
  if(targetOwners.size===0)active.filter(s=>s!==fighter).forEach(s=>targetOwners.add(s));
  return[...targetOwners];
}

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
  let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
  coords.forEach(p=>{if(p[0]<mnX)mnX=p[0];if(p[0]>mxX)mxX=p[0];if(p[1]<mnY)mnY=p[1];if(p[1]>mxY)mxY=p[1];});
  let cx=(mnX+mxX)/2,cy=(mnY+mxY)/2;const n=NUDGE[name];if(n){cx+=n[0];cy+=n[1];}return[cx,cy];
}

let audioUnlocked=false;const acRef={current:null};
function ac(){if(!acRef.current)acRef.current=new(window.AudioContext||window.webkitAudioContext)();if(acRef.current.state==='suspended')acRef.current.resume().catch(()=>{});return acRef.current;}
function unlockAudio(){if(audioUnlocked)return;try{const ctx=ac();const buf=ctx.createBuffer(1,1,22050);const src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start(0);audioUnlocked=true;preloadVictory();}catch(e){}}

const ELEVEN_KEY='sk_d5ce23d4b1755f5d3efb6d7c4e28e8a750d0384c410fd943';
const ELEVEN_VOICE='onwK4e9ZLuTAKqWW03F9';
const ttsCache={};let curTTS=null;

function playTick(){try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=1800+Math.random()*800;g.gain.setValueAtTime(0.12,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.04);o.start(c.currentTime);o.stop(c.currentTime+0.04);}catch(e){}}
function playDrumRoll(){try{const c=ac(),dur=1.5,t=c.currentTime,m=c.createGain();m.gain.setValueAtTime(0.05,t);m.gain.linearRampToValueAtTime(0.35,t+dur*0.8);m.gain.exponentialRampToValueAtTime(0.001,t+dur);m.connect(c.destination);for(let i=0;i<40;i++){const ht=t+(i/40)*dur,hd=0.03,hb=c.createBuffer(1,Math.floor(c.sampleRate*hd),c.sampleRate),hD=hb.getChannelData(0);for(let j=0;j<hD.length;j++)hD[j]=(Math.random()*2-1)*Math.pow(1-j/hD.length,3);const hs=c.createBufferSource();hs.buffer=hb;const hg=c.createGain();hg.gain.value=0.4+Math.random()*0.2;const hp=c.createBiquadFilter();hp.type='bandpass';hp.frequency.value=200+Math.random()*100;hp.Q.value=1;hs.connect(hp);hp.connect(hg);hg.connect(m);hs.start(ht+(Math.random()-0.5)*0.01);hs.stop(ht+hd+0.01);}}catch(e){}}
function playImpact(){try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(150,c.currentTime);o.frequency.exponentialRampToValueAtTime(30,c.currentTime+0.3);g.gain.setValueAtTime(0.6,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.start(c.currentTime);o.stop(c.currentTime+0.4);const b=c.createBuffer(1,c.sampleRate*0.06,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const s=c.createBufferSource();s.buffer=b;const g2=c.createGain();g2.gain.setValueAtTime(0.5,c.currentTime);g2.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08);s.connect(g2);g2.connect(c.destination);s.start(c.currentTime);s.stop(c.currentTime+0.08);}catch(e){}}
function playWhoosh(){try{const c=ac(),bs=c.sampleRate*0.4,b=c.createBuffer(1,bs,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<bs;i++)d[i]=(Math.random()*2-1);const s=c.createBufferSource();s.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.setValueAtTime(800,c.currentTime);bp.frequency.exponentialRampToValueAtTime(3000,c.currentTime+0.15);bp.frequency.exponentialRampToValueAtTime(200,c.currentTime+0.35);bp.Q.value=2;const g=c.createGain();g.gain.setValueAtTime(0.4,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);s.connect(bp);bp.connect(g);g.connect(c.destination);s.start(c.currentTime);s.stop(c.currentTime+0.4);}catch(e){}}
function playCountdownBeep(high){try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='square';o.frequency.value=high?880:440;g.gain.setValueAtTime(0.2,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+(high?0.3:0.15));o.start(c.currentTime);o.stop(c.currentTime+(high?0.3:0.15));}catch(e){}}
function playDing(){try{const c=ac(),t=c.currentTime;[880,1108,1320].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*0.08);g.gain.linearRampToValueAtTime(0.25,t+i*0.08+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.08+0.6);o.start(t+i*0.08);o.stop(t+i*0.08+0.6);});}catch(e){}}
function playBuzzer(){try{const c=ac(),t=c.currentTime;const o1=c.createOscillator(),o2=c.createOscillator(),g=c.createGain();o1.connect(g);o2.connect(g);g.connect(c.destination);o1.type='sawtooth';o1.frequency.value=120;o2.type='square';o2.frequency.value=123;g.gain.setValueAtTime(0.35,t);g.gain.setValueAtTime(0.35,t+0.35);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o1.start(t);o1.stop(t+0.5);o2.start(t);o2.stop(t+0.5);}catch(e){}}
let victoryBuffer=null;
function preloadVictory(){fetch('/Victory.mp3').then(r=>{if(r.ok)return r.arrayBuffer();throw 0;}).then(ab=>ac().decodeAudioData(ab)).then(buf=>{victoryBuffer=buf;}).catch(()=>{});}
function playFanfareSynth(){try{const c=ac(),t=c.currentTime,m=c.createGain();m.gain.setValueAtTime(0.3,t);m.gain.setValueAtTime(0.3,t+1.8);m.gain.exponentialRampToValueAtTime(0.001,t+2.5);m.connect(c.destination);[{f:523,s:0,d:0.15},{f:659,s:0.15,d:0.15},{f:784,s:0.3,d:0.15},{f:1047,s:0.5,d:0.4},{f:784,s:1.0,d:0.12},{f:880,s:1.12,d:0.12},{f:1047,s:1.3,d:0.6}].forEach(n=>{[1,2,3,4].forEach((h,hi)=>{const o=c.createOscillator(),g=c.createGain();o.type=hi===0?'sawtooth':'sine';o.frequency.value=n.f*h;const vol=0.25/(h*h);g.gain.setValueAtTime(0,t+n.s);g.gain.linearRampToValueAtTime(vol,t+n.s+0.02);g.gain.setValueAtTime(vol,t+n.s+n.d*0.7);g.gain.exponentialRampToValueAtTime(0.001,t+n.s+n.d+0.1);o.connect(g);g.connect(m);o.start(t+n.s);o.stop(t+n.s+n.d+0.15);});});}catch(e){}}
function playFanfare(){if(victoryBuffer){try{const c=ac(),src=c.createBufferSource();src.buffer=victoryBuffer;src.connect(c.destination);src.start(0);return;}catch(e){}}playFanfareSynth();}
function playApplause(big){try{const c=ac(),dur=big?5:3.5,t=c.currentTime,m=c.createGain();m.gain.setValueAtTime(0.001,t);m.gain.linearRampToValueAtTime(big?0.5:0.35,t+0.4);m.gain.setValueAtTime(big?0.5:0.35,t+dur*0.55);m.gain.linearRampToValueAtTime(big?0.25:0.15,t+dur*0.8);m.gain.exponentialRampToValueAtTime(0.001,t+dur);m.connect(c.destination);(big?[500,1000,1800,3200]:[800,1400,2800]).forEach((f,i)=>{const bs=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,bs,c.sampleRate),d=b.getChannelData(0);for(let j=0;j<bs;j++)d[j]=(Math.random()*2-1);const s=c.createBufferSource();s.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=0.4+i*0.15;const g=c.createGain();g.gain.value=0.22-i*0.04;s.connect(bp);bp.connect(g);g.connect(m);s.start(t);s.stop(t+dur);});}catch(e){}}
function stopTTS(){try{if(curTTS){curTTS.stop();}}catch(e){}curTTS=null;window.speechSynthesis?.cancel();}
async function speak(text,opts={}){
  stopTTS();const ctx=ac();const key=text.toLowerCase().trim();
  const play=(ab)=>ctx.decodeAudioData(ab.slice(0)).then(d=>{const src=ctx.createBufferSource();src.buffer=d;src.connect(ctx.destination);src.start(0);curTTS=src;return new Promise(r=>{src.onended=r;});});
  if(ttsCache[key]){play(ttsCache[key]).catch(()=>{});return;}
  try{const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`,{method:'POST',headers:{'xi-api-key':ELEVEN_KEY,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.35,similarity_boost:0.75,style:0.7,use_speaker_boost:true}})});if(!r.ok)throw 0;const ab=await r.arrayBuffer();ttsCache[key]=ab;play(ab).catch(()=>{});}catch(e){if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.rate=opts.rate||0.95;u.pitch=opts.pitch||1.05;window.speechSynthesis.speak(u);}
}

const BYE=["Bye bye {s}!","You're outta here, {s}!","See ya, {s}!","So long, {s}!","Hit the road, {s}!","Adios, {s}!","Peace out, {s}!","{s} has been conquered!","{s} has fallen!"];

function getQuizChoices(st){const c=CAPITALS[st];const o=ALL_CAPS.filter(x=>x!==c).sort(()=>Math.random()-0.5);return{correct:c,choices:[c,o[0],o[1]].sort(()=>Math.random()-0.5)};}

function Confetti({active,duration=3000}){
  const ref=useRef(null);const anim=useRef(null);const parts=useRef([]);const t0=useRef(0);
  useEffect(()=>{if(!active){cancelAnimationFrame(anim.current);return;}const cv=ref.current;if(!cv)return;const ctx=cv.getContext('2d');cv.width=cv.parentElement.offsetWidth;cv.height=cv.parentElement.offsetHeight;const cols=['#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899','#a855f7','#14b8a6'];parts.current=[];for(let i=0;i<120;i++)parts.current.push({x:cv.width*0.3+Math.random()*cv.width*0.4,y:cv.height*0.2+Math.random()*cv.height*0.1,vx:(Math.random()-0.5)*12,vy:-8-Math.random()*12,sz:4+Math.random()*8,c:cols[i%cols.length],r:Math.random()*360,rs:(Math.random()-0.5)*15,g:0.15+Math.random()*0.1,d:0.98+Math.random()*0.015,w:Math.random()*6.28,ws:0.05+Math.random()*0.05});t0.current=Date.now();const draw=()=>{const el=Date.now()-t0.current;if(el>duration){ctx.clearRect(0,0,cv.width,cv.height);return;}ctx.clearRect(0,0,cv.width,cv.height);const fade=el>duration-800?1-(el-(duration-800))/800:1;parts.current.forEach(p=>{p.vy+=p.g;p.vx*=p.d;p.x+=p.vx;p.y+=p.vy;p.r+=p.rs;p.w+=p.ws;ctx.save();ctx.globalAlpha=fade*0.9;ctx.translate(p.x+Math.sin(p.w)*2,p.y);ctx.rotate(p.r*Math.PI/180);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(0,0,p.sz/2,0,Math.PI*2);ctx.fill();ctx.restore();});anim.current=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(anim.current);},[active,duration]);
  return <canvas ref={ref} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:100}}/>;
}

function drawWheel(ctx,sz,items,colors){
  const cx=sz/2,cy=sz/2,r=sz/2-6;ctx.clearRect(0,0,sz,sz);if(!items.length)return;
  const sl=2*Math.PI/items.length;
  items.forEach((it,i)=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,i*sl-Math.PI/2,(i+1)*sl-Math.PI/2);ctx.closePath();ctx.fillStyle=colors?.[it]||`hsl(${(i*137)%360},60%,50%)`;ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1.5;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(i*sl+sl/2-Math.PI/2);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';const fs=Math.max(7,Math.min(14,Math.floor(440/items.length)));ctx.font=`700 ${fs}px system-ui,sans-serif`;ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=3;ctx.fillText(ABBR[it]||it.slice(0,2),r*0.72,0);ctx.restore();});
  ctx.beginPath();ctx.arc(cx,cy,14,0,2*Math.PI);const gd=ctx.createRadialGradient(cx,cy,2,cx,cy,14);gd.addColorStop(0,'#fbbf24');gd.addColorStop(1,'#b45309');ctx.fillStyle=gd;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
}

function drawBattleWheel(ctx,sz,items,weights,bCols){
  const cx=sz/2,cy=sz/2,r=sz/2-6;ctx.clearRect(0,0,sz,sz);if(!items.length)return;
  const total=weights[0]+weights[1];let sa=-Math.PI/2;
  items.forEach((it,i)=>{const sw=(weights[i]/total)*2*Math.PI;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,sa,sa+sw);ctx.closePath();ctx.fillStyle=bCols[i];ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(sa+sw/2);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 16px system-ui,sans-serif';ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=4;ctx.fillText(ABBR[it]||it.slice(0,2),r*0.55,0);ctx.font='600 11px system-ui,sans-serif';ctx.fillText(`Pop ${weights[i]}`,r*0.55,16);ctx.restore();sa+=sw;});
  ctx.beginPath();ctx.arc(cx,cy,14,0,2*Math.PI);const gd=ctx.createRadialGradient(cx,cy,2,cx,cy,14);gd.addColorStop(0,'#fbbf24');gd.addColorStop(1,'#b45309');ctx.fillStyle=gd;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
}

function Wheel({items,size,rotation,transitioning,onEnd,duration=4.5,colors}){
  const ref=useRef(null);const lr=useRef(rotation);
  useEffect(()=>{const c=ref.current;if(c)drawWheel(c.getContext('2d'),size,items,colors);},[items,size,colors]);
  useEffect(()=>{if(!transitioning)return;let ok=true;const n=items.length;if(!n)return;const sl=360/n;let prev=Math.floor(lr.current/sl);const iv=setInterval(()=>{if(!ok)return;const el=ref.current?.parentElement;if(!el)return;const st=getComputedStyle(el.querySelector('canvas'));const tr=st.transform;if(tr&&tr!=='none'){const m=tr.match(/matrix\((.+)\)/);if(m){const v=m[1].split(',').map(Number);const a=Math.atan2(v[1],v[0])*180/Math.PI;const cur=Math.floor(((a%360)+360)%360/sl);if(cur!==prev){playTick();prev=cur;}}}},50);return()=>{ok=false;clearInterval(iv);};},[transitioning,items.length]);
  useEffect(()=>{lr.current=rotation;},[rotation]);
  return(<div style={{textAlign:'center',marginBottom:6}}><div style={{position:'relative',width:size,height:size,margin:'0 auto'}}><canvas ref={ref} width={size} height={size} style={{borderRadius:'50%',transform:`rotate(${rotation}deg)`,transition:transitioning?`transform ${duration}s cubic-bezier(0.12,0.6,0.08,1)`:'none',boxShadow:'0 0 20px rgba(251,191,36,0.3)',border:'3px solid rgba(251,191,36,0.4)'}} onTransitionEnd={onEnd}/><div style={{position:'absolute',top:'50%',right:-14,transform:'translateY(-50%)',fontSize:28,color:'#ef4444',filter:'drop-shadow(0 2px 6px rgba(239,68,68,0.8))',zIndex:5,lineHeight:1}}>◀</div></div></div>);
}

function BattleWheel({items,weights,size,rotation,transitioning,onEnd,duration=7,bColors}){
  const ref=useRef(null);const lr=useRef(rotation);
  useEffect(()=>{const c=ref.current;if(c)drawBattleWheel(c.getContext('2d'),size,items,weights,bColors);},[items,size,weights,bColors]);
  useEffect(()=>{lr.current=rotation;},[rotation]);
  return(<div style={{textAlign:'center',marginBottom:6}}><div style={{position:'relative',width:size,height:size,margin:'0 auto'}}><canvas ref={ref} width={size} height={size} style={{borderRadius:'50%',transform:`rotate(${rotation}deg)`,transition:transitioning?`transform ${duration}s cubic-bezier(0.12,0.6,0.08,1)`:'none',boxShadow:'0 0 20px rgba(251,191,36,0.3)',border:'3px solid rgba(251,191,36,0.4)'}} onTransitionEnd={onEnd}/><div style={{position:'absolute',top:'50%',right:-14,transform:'translateY(-50%)',fontSize:28,color:'#ef4444',filter:'drop-shadow(0 2px 6px rgba(239,68,68,0.8))',zIndex:5,lineHeight:1}}>◀</div></div></div>);
}

function MysteryWheel({size}){
  const ref=useRef(null);
  useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d');const cx=size/2,cy=size/2,r=size/2-6;ctx.clearRect(0,0,size,size);
    const labels=['❓','⚔️','🎯','❓'];const cols=['#2d3748','#1a2332','#2d3748','#1a2332'];
    const sl=Math.PI/2;
    labels.forEach((lb,i)=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,i*sl-Math.PI/2,(i+1)*sl-Math.PI/2);ctx.closePath();ctx.fillStyle=cols[i];ctx.fill();ctx.strokeStyle='rgba(100,116,139,0.3)';ctx.lineWidth=1.5;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(i*sl+sl/2-Math.PI/2);ctx.font='20px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lb,r*0.6,0);ctx.restore();});
    ctx.beginPath();ctx.arc(cx,cy,14,0,2*Math.PI);const gd=ctx.createRadialGradient(cx,cy,2,cx,cy,14);gd.addColorStop(0,'#64748b');gd.addColorStop(1,'#334155');ctx.fillStyle=gd;ctx.fill();ctx.strokeStyle='#475569';ctx.lineWidth=2;ctx.stroke();
  },[size]);
  return(<div style={{textAlign:'center',marginBottom:6,opacity:0.5}}><div style={{position:'relative',width:size,height:size,margin:'0 auto'}}><canvas ref={ref} width={size} height={size} style={{borderRadius:'50%',border:'3px solid rgba(100,116,139,0.3)'}}/><div style={{position:'absolute',top:'50%',right:-14,transform:'translateY(-50%)',fontSize:28,color:'#64748b',zIndex:5,lineHeight:1}}>◀</div></div></div>);
}

function FighterCard({name,color,pop,pct}){
  return(<div style={{textAlign:'center',flex:1}}><div style={{background:`linear-gradient(145deg,${color},${color}99)`,borderRadius:16,padding:'10px 8px',border:`3px solid ${color}`,boxShadow:`0 4px 24px ${color}55`,animation:'bounceIn 0.5s ease-out'}}><div style={{fontSize:26,fontWeight:900,color:'#fff',letterSpacing:2}}>{ABBR[name]}</div><div style={{fontSize:10,color:'#fff',opacity:0.9,fontWeight:600}}>{name}</div><div style={{fontSize:12,color:'#fbbf24',fontWeight:800,marginTop:2}}>👥 {pop}</div>{pct!==undefined&&<div style={{fontSize:10,color:'#fff',opacity:0.8,fontWeight:600}}>{pct}% chance</div>}</div></div>);
}

function USMap({features,territories,populations,active,fighter1,fighter2,winner,loser,hoveredState,setHoveredState,validTargets,battleMode}){
  if(!features.length)return <div style={{color:'#64748b',textAlign:'center',padding:40}}>🗺️ Loading map...</div>;
  const hasTargets=validTargets&&validTargets.length>0&&!battleMode;
  const hovOwner=hoveredState?territories[hoveredState]||hoveredState:null;
  const hovTerritories=hovOwner?Object.entries(territories).filter(([_,o])=>o===hovOwner).map(([t])=>t):[];
  const hovCount=hovTerritories.length;
  return(<div style={{position:'relative',background:'rgba(15,23,42,0.5)',borderRadius:16,border:'2px solid rgba(251,191,36,0.12)',overflow:'hidden'}}>
    <svg viewBox="0 0 975 610" style={{width:'100%',height:'auto',display:'block'}}>
      {features.map(f=>{const name=f.name;if(!name)return null;const owner=territories[name]||name;const col=STATE_COLORS[owner]||'#1e3a5f';const isF1=owner===fighter1||name===fighter1;const isF2=owner===fighter2||name===fighter2;const isW=owner===winner;const isL=loser&&owner===loser;const isHovEmpire=hovOwner&&owner===hovOwner;const isTarget=hasTargets&&validTargets.includes(owner);const isOwned=hasTargets&&owner===fighter1;const dimTarget=hasTargets&&!isTarget&&!isOwned&&!isF1&&!isF2&&!isW&&!isL;const isFighter=isF1||isF2||isW||isL;const dimBattle=battleMode&&!isFighter;const dimmed=dimTarget||dimBattle;const dimHover=!dimmed&&hovOwner&&owner!==hovOwner&&!isFighter;let fill=(dimmed||dimHover)?'#1a1a2e':col;let stroke='rgba(255,255,255,0.15)',sw=0.8,filt='',op=dimmed?0.3:dimHover?0.25:1;if(isW){stroke='#4ade80';sw=2.5;filt='url(#glowG)';}else if(isL){stroke='#f87171';sw=2.5;filt='url(#glowR)';}else if(isF1){stroke='#60a5fa';sw=2.5;filt='url(#glowB)';}else if(isF2){stroke='#f87171';sw=2;filt='url(#glowR)';}else if(isHovEmpire&&!dimmed){stroke=STATE_COLORS[hovOwner]||'#fff';sw=2.5;filt='url(#glowHov)';fill=col;}else if(isTarget){stroke='#fbbf24';sw=1.5;}const c=f.centroid;const show=isF1||isF2||isW||isL||(isHovEmpire&&!dimmed)||(isTarget&&!dimmed);return(<g key={name} onMouseEnter={()=>setHoveredState(name)} onMouseLeave={()=>setHoveredState(null)} style={{cursor:'default'}}><path d={f.path} fill={fill} stroke={stroke} strokeWidth={sw} filter={filt} opacity={op} style={{transition:'fill 0.8s,stroke 0.5s,opacity 0.5s'}}/>{show&&c&&<text x={c[0]} y={c[1]} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={isHovEmpire&&hovCount>1?10:12} fontWeight="bold" style={{pointerEvents:'none',textShadow:'0 0 6px rgba(0,0,0,0.95)'}}>{ABBR[owner]}</text>}</g>);})}
      <defs><filter id="glowB"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.8"/></filter><filter id="glowR"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.8"/></filter><filter id="glowG"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22c55e" floodOpacity="0.8"/></filter><filter id="glowHov"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fff" floodOpacity="0.6"/></filter></defs>
    </svg>
    {hoveredState&&hovOwner&&<div style={{position:'absolute',top:8,right:12,background:'rgba(0,0,0,0.85)',color:'#e2e8f0',padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,pointerEvents:'none',border:`2px solid ${STATE_COLORS[hovOwner]}`,minWidth:140}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:'50%',background:STATE_COLORS[hovOwner]}}/><span style={{fontSize:14}}>{hovOwner}</span></div>
      {hovOwner!==hoveredState&&<div style={{fontSize:11,color:'#94a3b8',marginBottom:2}}>📍 {hoveredState} (territory)</div>}
      <div style={{fontSize:12,color:'#fbbf24',fontWeight:800}}>👥 Population: {populations[hovOwner]||0}</div>
      <div style={{fontSize:11,color:'#94a3b8'}}>🗺️ {hovCount} territor{hovCount===1?'y':'ies'}: {hovTerritories.map(t=>ABBR[t]).join(', ')}</div>
    </div>}
  </div>);
}

function FlashOverlay({text,color,visible,emoji,sub}){if(!visible)return null;return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.65)',zIndex:1000,animation:'flashIn 1.2s ease-out forwards',pointerEvents:'none'}}>{emoji&&<div style={{fontSize:72,marginBottom:8,animation:'bounceEmoji 0.6s ease-out'}}>{emoji}</div>}<div style={{fontSize:52,fontWeight:900,color,letterSpacing:4,textTransform:'uppercase',textShadow:`0 0 40px ${color}`,animation:'scaleIn 0.4s ease-out',textAlign:'center',padding:'0 20px'}}>{text}</div>{sub&&<div style={{fontSize:30,fontWeight:800,color:'#f87171',letterSpacing:3,marginTop:10,textShadow:'0 0 30px rgba(239,68,68,0.6)',animation:'scaleIn 0.5s ease-out 0.15s both'}}>{sub}</div>}</div>);}
function CountdownOverlay({number}){if(number===null||number===undefined)return null;const c={3:'#3b82f6',2:'#f59e0b',1:'#ef4444',0:'#22c55e'};const l={3:'3',2:'2',1:'1',0:'GO!'};return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',zIndex:1001,pointerEvents:'none'}}><div key={number} style={{fontSize:number===0?80:120,fontWeight:900,color:c[number],textShadow:`0 0 60px ${c[number]}`,animation:'countPop 0.7s ease-out'}}>{l[number]}</div></div>);}

function QuizOverlay({stateName,onComplete}){
  const [quiz]=useState(()=>getQuizChoices(stateName));const [shake,setShake]=useState(null);const [correct,setCorrect]=useState(false);const spoke=useRef(false);
  useEffect(()=>{if(spoke.current)return;spoke.current=true;setTimeout(()=>speak(`What is the capital of ${stateName}? Is it ${quiz.choices[0]}, ${quiz.choices[1]}, or ${quiz.choices[2]}?`),600);},[stateName,quiz.choices]);
  const pick=(c)=>{if(correct)return;if(c===quiz.correct){setCorrect(true);playDing();setTimeout(()=>speak(`Correct! ${quiz.correct}!`),300);setTimeout(()=>onComplete(),4500);}else{setShake(c);playBuzzer();speak("Try again!");setTimeout(()=>setShake(null),600);}};
  const bs=(c)=>{const isC=c===quiz.correct,isS=shake===c;let bg='linear-gradient(135deg,#334155,#1e293b)',bd='2px solid #475569',sh='0 4px 12px rgba(0,0,0,0.3)',an='';if(correct&&isC){bg='linear-gradient(135deg,#16a34a,#15803d)';bd='2px solid #4ade80';}if(isS){bg='linear-gradient(135deg,#dc2626,#b91c1c)';bd='2px solid #f87171';an='quizShake 0.4s ease-in-out';}return{padding:'16px 24px',fontSize:18,fontWeight:700,color:'#fff',background:bg,border:bd,borderRadius:14,cursor:correct?'default':'pointer',boxShadow:sh,animation:an,width:'100%',textAlign:'center'};};
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.75)',zIndex:1002}} onClick={e=>e.stopPropagation()}><div style={{background:'linear-gradient(150deg,#1e293b,#0f172a)',borderRadius:24,padding:'32px 36px',maxWidth:420,width:'90%',border:'3px solid rgba(251,191,36,0.3)',boxShadow:'0 0 60px rgba(251,191,36,0.15)',animation:'scaleIn 0.3s ease-out'}}><div style={{textAlign:'center',marginBottom:6}}><div style={{fontSize:42,marginBottom:4}}>🧠</div><div style={{fontSize:14,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:2}}>Capital Quiz</div></div><div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:22,fontWeight:800,color:'#fbbf24'}}>What is the capital of</div><div style={{fontSize:30,fontWeight:900,color:'#fff',marginTop:4}}>{stateName}?</div></div><div style={{display:'flex',flexDirection:'column',gap:10}}>{quiz.choices.map((c,i)=>(<button key={c} onClick={()=>pick(c)} style={bs(c)}><span style={{marginRight:8,color:'#94a3b8',fontSize:14}}>{String.fromCharCode(65+i)}.</span>{c}{correct&&c===quiz.correct&&' ✅'}</button>))}</div>{correct&&<div style={{textAlign:'center',marginTop:16,animation:'scaleIn 0.3s ease-out'}}><div style={{fontSize:16,fontWeight:700,color:'#4ade80'}}>🎉 {quiz.correct} is correct!</div></div>}</div></div>);
}

export default function App(){
  const [features,setFeatures]=useState([]);
  const init=()=>({t:Object.fromEntries(ALL_ENTITIES.map(s=>[s,s])),p:Object.fromEntries(ALL_ENTITIES.map(s=>[s,5]))});
  const [territories,setTerritories]=useState(()=>init().t);
  const [populations,setPopulations]=useState(()=>init().p);
  const [active,setActive]=useState(ALL_ENTITIES);
  const [phase,setPhase]=useState('idle');
  const [pF1,setPF1]=useState(null);const [pF2,setPF2]=useState(null);
  const [mF1,setMF1]=useState(null);const [mF2,setMF2]=useState(null);
  const [f1,setF1]=useState(null);const [f2,setF2]=useState(null);
  const [winner,setWinner]=useState(null);const [loser,setLoser]=useState(null);
  const [champion,setChampion]=useState(null);const [round,setRound]=useState(0);
  const [log,setLog]=useState([]);const [hov,setHov]=useState(null);
  const [fT,setFT]=useState('');const [fC,setFC]=useState('#fff');const [fE,setFE]=useState('');const [fS,setFS]=useState('');const [fV,setFV]=useState(false);
  const [cd,setCd]=useState(null);const [confetti,setConfetti]=useState(false);
  const [r1,setR1]=useState(0);const [r2,setR2]=useState(0);const [rB,setRB]=useState(0);
  const [t1,setT1]=useState(false);const [t2,setT2]=useState(false);const [tB,setTB]=useState(false);
  const [showQ,setShowQ]=useState(false);const [qE,setQE]=useState(true);const [qS,setQS]=useState({c:0,t:0});
  const [w2,setW2]=useState([]);

  const battle=phase==='battleReady'||phase==='countdown'||phase==='battling'||phase==='result'||phase==='quiz';
  const flash=(t,c,e,d=1200,s='')=>{setFT(t);setFC(c);setFE(e||'');setFS(s);setFV(true);setTimeout(()=>setFV(false),d);};

  useEffect(()=>{window.speechSynthesis?.getVoices();},[]);
  useEffect(()=>{const h=()=>{unlockAudio();document.removeEventListener('touchstart',h);document.removeEventListener('click',h);};document.addEventListener('touchstart',h,{once:true});document.addEventListener('click',h,{once:true});return()=>{document.removeEventListener('touchstart',h);document.removeEventListener('click',h);};},[]);

  useEffect(()=>{
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json').then(r=>r.json()).then(topo=>{
      const fc=topoFeature(topo,'states');
      const feats=fc.features.filter(f=>FIPS[String(f.id).padStart(2,'0')]).map(f=>{const name=FIPS[String(f.id).padStart(2,'0')];return{name,path:pathStr(f.geometry),centroid:centroid(f.geometry,name)};});
      feats.push({name:"Puerto Rico",path:"M840,530 L845,526 L855,524 L868,524 L878,526 L885,530 L888,535 L886,540 L878,544 L865,545 L852,544 L843,540 L840,535 Z",centroid:[864,535]});
      setFeatures(feats);
    }).catch(()=>{});},[]);

  const calcR=(cur,idx,tot)=>{const sl=360/tot;const tg=(360-(idx+0.5)*sl+90+360)%360;const df=(tg-cur%360+360)%360;return cur+360*(5+Math.floor(Math.random()*3))+df+(Math.random()-0.5)*sl*0.3;};

  const go=useCallback(()=>{
    if(active.length<2)return;unlockAudio();setWinner(null);setLoser(null);setMF1(null);setMF2(null);setF1(null);setF2(null);setW2([]);
    const items=[...active];const i1=Math.floor(Math.random()*items.length);
    setPF1(items[i1]);setRound(r=>r+1);playDrumRoll();
    const nr=calcR(r1,i1,items.length);setTimeout(()=>{setT1(true);setR1(nr);},50);setPhase('spinning1');
  },[active,r1]);

  const onW1=()=>{setT1(false);playImpact();setMF1(pF1);setF1(pF1);flash(pF1,'#60a5fa','⚔️');speak(pF1);
    const tgts=getValidTargets(pF1,territories,active);setW2(tgts);
    const i2=Math.floor(Math.random()*tgts.length);setPF2(tgts[i2]);
    setTimeout(()=>{if(tgts.length===1){setMF2(tgts[0]);setF2(tgts[0]);flash('VS','#fbbf24','⚔️',1400,tgts[0]);setTimeout(()=>speak('versus '+tgts[0]),200);setTimeout(()=>setPhase('battleReady'),1600);}else{const nr=calcR(r2,i2,tgts.length);setTimeout(()=>{setT2(true);setR2(nr);},50);setPhase('spinning2');}},1800);};

  const onW2=()=>{setT2(false);playImpact();setMF2(pF2);setF2(pF2);flash('VS','#fbbf24','⚔️',1400,pF2);setTimeout(()=>speak('versus '+pF2),200);setTimeout(()=>setPhase('battleReady'),1600);};

  const fight=()=>{
    unlockAudio();const p1=populations[f1]||5,p2=populations[f2]||5;const prob=p1/(p1+p2);
    const w=Math.random()<prob?0:1;window._bw=w;window._bp=[p1,p2];
    setPhase('countdown');setCd(3);playCountdownBeep(false);
    setTimeout(()=>{setCd(2);playCountdownBeep(false);},700);
    setTimeout(()=>{setCd(1);playCountdownBeep(false);},1400);
    setTimeout(()=>{setCd(0);playCountdownBeep(true);},2100);
    setTimeout(()=>{setCd(null);playWhoosh();const tot=p1+p2;const a1=(p1/tot)*360;const segS=w===0?0:a1;const segSz=w===0?a1:(p2/tot)*360;const ta=segS+segSz*(0.3+Math.random()*0.4);const tg=(360-ta+90+360)%360;const df=(tg-rB%360+360)%360;const nr=rB+360*(10+Math.floor(Math.random()*4))+df;setPhase('battling');setTimeout(()=>{setTB(true);setRB(nr);},50);},2600);
  };

  const onBE=()=>{setTB(false);const w=window._bw;const wn=w===0?f1:f2,ln=w===0?f2:f1;
    setWinner(wn);setLoser(ln);playFanfare();setConfetti(true);setTimeout(()=>setConfetti(false),3500);
    const calls=["conquers!","takes it!","claims victory!","dominates!","crushes!"];
    const lp=populations[ln]||5;const gained=Math.ceil(lp/2);
    flash(wn+' Wins!','#4ade80','🎉',2500,`+${gained} Population`);setTimeout(()=>speak(wn+" "+calls[Math.floor(Math.random()*calls.length)]),1800);
    setTerritories(prev=>{const n={...prev};Object.keys(n).forEach(k=>{if(n[k]===ln)n[k]=wn;});return n;});
    setPopulations(prev=>({...prev,[wn]:(prev[wn]||5)+gained,[ln]:0}));
    setActive(prev=>prev.filter(s=>s!==ln));
    setLog(l=>[{round,f1,f2,winner:wn,gained},...l]);
    if(active.length<=2){setTimeout(()=>{setChampion(wn);playApplause(true);setConfetti(true);setTimeout(()=>setConfetti(false),6000);flash('CHAMPION!','#fbbf24','👑',3000);setTimeout(()=>speak(wn+" is the Grand Champion!",{rate:0.85}),500);setPhase('champion');},3000);}else{setPhase('result');}
  };

  const next=()=>{const bye=BYE[Math.floor(Math.random()*BYE.length)].replace('{s}',loser);setTimeout(()=>speak(bye,{rate:1.1,pitch:1.1}),400);setMF1(null);setMF2(null);setPF1(null);setPF2(null);setF1(null);setF2(null);setWinner(null);setLoser(null);setW2([]);setPhase('idle');};
  const startQ=()=>{setShowQ(true);setPhase('quiz');};
  const onQC=()=>{setShowQ(false);setQS(s=>({c:s.c+1,t:s.t+1}));next();};

  const reset=()=>{const{t,p}=init();setActive(ALL_ENTITIES);setTerritories(t);setPopulations(p);setPhase('idle');setF1(null);setF2(null);setPF1(null);setPF2(null);setMF1(null);setMF2(null);setWinner(null);setLoser(null);setChampion(null);setShowQ(false);setRound(0);setLog([]);setR1(0);setR2(0);setRB(0);setQS({c:0,t:0});setW2([]);};

  const bi=f1&&f2?[f1,f2]:[];const bw=f1&&f2?[populations[f1]||5,populations[f2]||5]:[1,1];const bc=f1&&f2?[STATE_COLORS[f1],STATE_COLORS[f2]]:['#2563eb','#dc2626'];
  const W=220;const p1=f1?populations[f1]||5:5;const p2=f2?populations[f2]||5:5;const pc1=f1&&f2?Math.round(p1/(p1+p2)*100):50;const pc2=100-pc1;
  const canQ=winner&&!NO_QUIZ.includes(winner)&&qE;

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(150deg,#0f172a 0%,#1e1b4b 40%,#172554 100%)',color:'#e2e8f0',fontFamily:'system-ui,-apple-system,sans-serif',padding:12,boxSizing:'border-box',position:'relative',overflow:'hidden'}} onClick={unlockAudio}>
      <Confetti active={confetti} duration={phase==='champion'?6000:3500}/>
      <FlashOverlay text={fT} color={fC} emoji={fE} visible={fV} sub={fS}/>
      <CountdownOverlay number={cd}/>
      {showQ&&winner&&<QuizOverlay stateName={winner} onComplete={onQC}/>}

      <div style={{textAlign:'center',marginBottom:8}}>
        <h1 style={{margin:0,fontSize:26,fontWeight:900,background:'linear-gradient(90deg,#fbbf24,#f97316,#ef4444,#f97316,#fbbf24)',backgroundSize:'200% 100%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:2,animation:'shimmer 3s linear infinite'}}>🏆 Tristan's State Conquest 🏆</h1>
        <div style={{fontSize:12,color:'#94a3b8',marginTop:2,fontWeight:600}}>
          {champion?'🎉 Grand Champion! 🎉':`Round ${round} · ${active.length} states`}
          {qS.t>0&&!champion&&<span style={{marginLeft:8}}>🧠 {qS.c}/{qS.t}</span>}
        </div>
      </div>

      <div style={{display:'flex',gap:14,alignItems:'flex-start',maxWidth:1200,margin:'0 auto'}}>
        <div style={{flex:'0 0 auto',width:W+24,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <div style={{width:'100%',height:56,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {phase==='idle'&&!champion&&<button onClick={go} disabled={active.length<2} style={{padding:'12px 28px',fontSize:16,fontWeight:800,background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',border:'none',borderRadius:14,cursor:'pointer',boxShadow:'0 6px 25px rgba(245,158,11,0.4)',letterSpacing:1,animation:'gentlePulse 2s ease-in-out infinite'}} onMouseEnter={e=>e.target.style.transform='scale(1.08)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>⚔️ Next Battle!</button>}
            {phase==='battleReady'&&<button onClick={fight} style={{padding:'12px 36px',fontSize:17,fontWeight:800,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'3px solid #fbbf24',borderRadius:14,cursor:'pointer',boxShadow:'0 6px 30px rgba(220,38,38,0.5)',animation:'battlePulse 1s infinite',letterSpacing:1}}>⚔️ Battle!</button>}
            {phase==='result'&&canQ&&<button onClick={startQ} style={{padding:'12px 24px',fontSize:15,fontWeight:700,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none',borderRadius:14,cursor:'pointer',animation:'gentlePulse 2s ease-in-out infinite'}}>🧠 Capital Quiz!</button>}
            {phase==='result'&&!canQ&&<button onClick={next} style={{padding:'12px 24px',fontSize:15,fontWeight:700,background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff',border:'none',borderRadius:14,cursor:'pointer',animation:'gentlePulse 2s ease-in-out infinite'}}>➡️ Next Round!</button>}
          </div>

          {!battle&&<><div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>⚔️ Attacker</div>
            <Wheel items={active} size={W} rotation={r1} transitioning={t1} onEnd={onW1} colors={STATE_COLORS}/>
            <div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>🎯 Defender{w2.length>0?` (${w2.length})`:''}</div>
            {w2.length>0?<Wheel items={w2} size={W} rotation={r2} transitioning={t2} onEnd={onW2} colors={STATE_COLORS}/>:<MysteryWheel size={W}/>}</>}

          {battle&&f1&&f2&&<div style={{width:'100%',background:'rgba(0,0,0,0.35)',borderRadius:16,padding:12,border:'2px solid rgba(251,191,36,0.15)',animation:'slideUp 0.4s ease-out'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
              <FighterCard name={f1} color={STATE_COLORS[f1]} pop={p1} pct={pc1}/>
              <div style={{fontSize:24,fontWeight:900,color:'#fbbf24',textShadow:'0 0 20px #fbbf2455',animation:'vsWiggle 1s ease-in-out infinite'}}>VS</div>
              <FighterCard name={f2} color={STATE_COLORS[f2]} pop={p2} pct={pc2}/>
            </div>
            {p1!==p2&&<div style={{textAlign:'center',fontSize:11,color:'#fbbf24',fontWeight:700,marginBottom:6,padding:'3px 8px',background:'rgba(251,191,36,0.1)',borderRadius:8}}>{p1>p2?`${ABBR[f1]} has ${(pc1/pc2).toFixed(1)}x advantage!`:`${ABBR[f2]} has ${(pc2/pc1).toFixed(1)}x advantage!`}</div>}
            <BattleWheel items={bi} weights={bw} size={W} rotation={rB} transitioning={tB} onEnd={onBE} duration={7} bColors={bc}/>
            {(phase==='result'||phase==='quiz')&&<div style={{textAlign:'center',marginTop:8}}><div style={{fontSize:18,fontWeight:800,color:'#4ade80'}}>🏆 {winner} Wins!</div><div style={{fontSize:12,color:'#f87171',fontWeight:600}}>👋 {loser} has fallen!</div></div>}
          </div>}

          {phase==='champion'&&champion&&<div style={{marginTop:12,textAlign:'center',padding:24,background:`linear-gradient(135deg,${STATE_COLORS[champion]}22,${STATE_COLORS[champion]}11)`,borderRadius:20,border:`3px solid ${STATE_COLORS[champion]}`,boxShadow:`0 0 50px ${STATE_COLORS[champion]}44`,animation:'champGlow 2s ease-in-out infinite'}}>
            <div style={{fontSize:64,marginBottom:4,animation:'champBounce 1s ease-in-out infinite'}}>👑</div>
            <div style={{fontSize:28,fontWeight:900,color:STATE_COLORS[champion],letterSpacing:3}}>{champion}</div>
            <div style={{fontSize:16,color:'#fbbf24',margin:'8px 0',fontWeight:700}}>🏆 Grand Champion! 🏆</div>
            <div style={{fontSize:13,color:'#e2e8f0',fontWeight:700}}>Pop: {populations[champion]} · {round} battles</div>
            <button onClick={reset} style={{marginTop:16,padding:'12px 24px',fontSize:14,fontWeight:700,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer'}}>🔄 Play Again!</button>
          </div>}
        </div>

        <div style={{flex:1,minWidth:0}}>
          <USMap features={features} territories={territories} populations={populations} active={active} fighter1={mF1} fighter2={mF2} winner={winner} loser={loser} hoveredState={hov} setHoveredState={setHov} validTargets={w2} battleMode={battle&&!!f2}/>
          <div style={{margin:'8px 0',padding:'8px 12px',background:'rgba(0,0,0,0.3)',borderRadius:10,border:'1px solid rgba(251,191,36,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginBottom:4,fontWeight:600}}><span>🏰 {active.length} states</span><span>🗺️ {52-active.length} conquered</span></div>
            <div style={{height:10,background:'rgba(100,116,139,0.2)',borderRadius:5,overflow:'hidden'}}><div style={{height:'100%',width:`${((52-active.length)/52)*100}%`,background:'linear-gradient(90deg,#f59e0b,#ef4444,#ec4899)',borderRadius:5,transition:'width 0.6s ease'}}/></div>
          </div>
          {active.length<52&&active.length>1&&<div style={{margin:'6px 0',display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>{[...active].sort((a,b)=>(populations[b]||5)-(populations[a]||5)).slice(0,8).map(s=><div key={s} style={{background:STATE_COLORS[s]+'33',border:`1px solid ${STATE_COLORS[s]}`,borderRadius:8,padding:'3px 8px',fontSize:11,fontWeight:700,color:STATE_COLORS[s]}}>{ABBR[s]} 👥{populations[s]||5}</div>)}</div>}
          {log.length>0&&<div style={{marginTop:8,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:10,maxHeight:160,overflowY:'auto',border:'1px solid rgba(100,116,139,0.15)'}}>
            <div style={{fontSize:12,color:'#fbbf24',fontWeight:800,marginBottom:4}}>📋 Conquest Log</div>
            {log.map((l,i)=><div key={i} style={{fontSize:11,color:'#94a3b8',padding:'2px 0',borderBottom:'1px solid rgba(100,116,139,0.08)',display:'flex',gap:5,alignItems:'center',fontWeight:600}}>
              <span style={{color:'#64748b',minWidth:24}}>R{l.round}</span>
              <span style={{width:8,height:8,borderRadius:'50%',background:STATE_COLORS[l.f1],flexShrink:0}}/>
              <span style={{color:l.winner===l.f1?'#4ade80':'#f87171'}}>{ABBR[l.f1]}</span>
              <span style={{color:'#fbbf24'}}>vs</span>
              <span style={{width:8,height:8,borderRadius:'50%',background:STATE_COLORS[l.f2],flexShrink:0}}/>
              <span style={{color:l.winner===l.f2?'#4ade80':'#f87171'}}>{ABBR[l.f2]}</span>
              <span style={{color:'#fbbf24'}}>→ 🏆{ABBR[l.winner]} +{l.gained}👥</span>
            </div>)}
          </div>}
          {!champion&&<div style={{marginTop:6,display:'flex',justifyContent:'flex-end',alignItems:'center',gap:12}}>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#94a3b8',fontWeight:600,userSelect:'none'}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={qE} onChange={e=>setQE(e.target.checked)} style={{width:16,height:16,accentColor:'#7c3aed',cursor:'pointer'}}/>🧠 Quizzes</label>
            <button onClick={reset} style={{padding:'5px 14px',fontSize:11,background:'transparent',color:'#64748b',border:'1px solid #334155',borderRadius:8,cursor:'pointer',fontWeight:600}}>🔄 Reset</button>
          </div>}
        </div>
      </div>

      <style>{`
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes gentlePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes battlePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes flashIn{0%{opacity:0}8%{opacity:1}75%{opacity:1}100%{opacity:0}}
        @keyframes scaleIn{0%{transform:scale(3);opacity:0}50%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes bounceEmoji{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(1) rotate(0)}}
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