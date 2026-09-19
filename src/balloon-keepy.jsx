import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Pause,Play,Volume2} from 'lucide-react';
import {speakFriendly} from './speech.js';

const balloons=[['#ff6f91','#d94e73'],['#55bde5','#238bb7'],['#ffd35b','#dfa926'],['#8bd17c','#55a84f'],['#a98bea','#7a60bd']];

export function BalloonKeepy({voiceName,onSave,onExit}){
  const arena=useRef(null),motion=useRef({x:180,y:100,vx:35,vy:30,last:0}),raf=useRef(0),stats=useRef({hits:0,best:0,drops:0}),saved=useRef(false),[position,setPosition]=useState({x:180,y:100}),[running,setRunning]=useState(false),[hits,setHits]=useState(0),[streak,setStreak]=useState(0),[best,setBest]=useState(0),[drops,setDrops]=useState(0),[color,setColor]=useState(0),[message,setMessage]=useState('Tap the balloon to keep it in the air!');
  useEffect(()=>()=>{if(!saved.current&&(stats.current.hits||stats.current.drops))onSave(stats.current)},[]);
  useEffect(()=>{if(!running)return;const tick=time=>{const box=arena.current?.getBoundingClientRect();if(!box)return;const m=motion.current,dt=m.last?Math.min(.034,(time-m.last)/1000):.016;m.last=time;m.vy+=115*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;const maxX=Math.max(20,box.width-92),floor=Math.max(90,box.height-118);if(m.x<8){m.x=8;m.vx=Math.abs(m.vx)}if(m.x>maxX){m.x=maxX;m.vx=-Math.abs(m.vx)}if(m.y<8){m.y=8;m.vy=Math.abs(m.vy)*.6}if(m.y>floor){m.x=Math.max(20,box.width/2-42);m.y=Math.max(25,box.height*.22);m.vx=(Math.random()-.5)*90;m.vy=35;setDrops(n=>{const next=n+1;stats.current={...stats.current,drops:next};return next});setStreak(0);setMessage('Boing! The balloon is back. Keep going!')}setPosition({x:m.x,y:m.y});raf.current=requestAnimationFrame(tick)};raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current)},[running]);
  const start=()=>{motion.current.last=0;setRunning(true);setMessage('Tap it before it floats down!');speakFriendly('Tap the balloon to keep it up!',{voiceName})};
  const bump=e=>{e.stopPropagation();if(!running){start();return}const next=hits+1,nextStreak=streak+1,nextBest=Math.max(best,nextStreak);motion.current.vy=-285;motion.current.vx+=(Math.random()-.5)*75;stats.current={...stats.current,hits:next,best:nextBest};setHits(next);setStreak(nextStreak);setBest(nextBest);if(next%5===0){setColor(c=>(c+1)%balloons.length);setMessage(`${next} taps! Amazing balloon keeping!`);speakFriendly(`${next} taps!`,{voiceName})}else setMessage(`${next}! Keep it up!`)};
  const finish=()=>{saved.current=true;if(stats.current.hits||stats.current.drops)onSave(stats.current);onExit()};
  const colors=balloons[color];
  return <section className="balloon-page">
    <button className="text-button balloon-back" onClick={finish}><ArrowLeft size={18}/> All done</button>
    <div className="balloon-heading"><div><div className="eyebrow">MOVE · COUNT · PLAY</div><h1>Balloon Keepy-Uppy</h1><p>Tap the balloon before it reaches the floor. Every tap counts, and the balloon always comes back.</p></div><div className="balloon-score"><span>🎈 Taps <b>{hits}</b></span><span>✨ Best run <b>{best}</b></span></div></div>
    <div className="balloon-arena" ref={arena} aria-label="Balloon keepy-uppy play area">
      <div className="balloon-cloud cloud-one">☁️</div><div className="balloon-cloud cloud-two">☁️</div>
      <button className="play-balloon" aria-label="Tap the balloon" onClick={bump} style={{transform:`translate(${position.x}px, ${position.y}px)`,'--balloon':colors[0],'--balloon-shadow':colors[1]}}><span>▲</span></button>
      {!running&&<button className="balloon-start" onClick={start}><Play fill="currentColor"/> Start bouncing</button>}
      <div className="balloon-floor">🌼　🌱　🌼　🌱　🌼　🌱</div>
    </div>
    <div className="balloon-controls"><button className="secondary" onClick={()=>{setRunning(r=>!r);motion.current.last=0}}>{running?<><Pause/> Pause</>:<><Play/> Keep playing</>}</button><button className="secondary" onClick={()=>speakFriendly(message,{voiceName})}><Volume2/> Hear it</button><p aria-live="polite"><b>{message}</b>{drops>0&&<small>{drops} funny floor {drops===1?'bounce':'bounces'} — no lives lost!</small>}</p></div>
  </section>;
}
