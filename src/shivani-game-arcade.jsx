import React,{useMemo,useState} from 'react';
import {ArrowLeft,RefreshCw,Sparkles,Shuffle} from 'lucide-react';
import {ding} from './chime.js';
import {makeMathTrail,trailModes} from './math-trails-engine.js';
import {DifficultyPicker,useDifficulty} from './difficulty-picker.jsx';
import {NumberLineVoyage} from './number-line-voyage.jsx';

const descriptions={decimals:'Order tenths and explain which decimal is greater.',geometry:'Follow perimeter totals and reason about the distance around.',times:'Answer each times-table question to grow the garden.',fractions:'Move from smaller parts toward one whole.',money:'Count the coins and find each total in order.',time:'Read each clock and find the matching time.'};
const prizes={decimals:['🔢','Decimal Dash Champion'],geometry:['📐','Perimeter Pathfinder'],times:['🦋','Pattern Garden Genius'],fractions:['🌺','Fraction Flower'],money:['💰','Treasure Finder'],time:['🌈','Rainbow Rescuer']};
const cheers=['Nice move!','Great spotting!','Path power!','You found it!','Brilliant!','Keep going!'];
const randomMode=except=>{const ids=Object.keys(descriptions).filter(x=>x!==except);return ids[Math.floor(Math.random()*ids.length)];};

function ArcadeMenu({onChoose,onHome,onRunner,difficulty,onDifficultyChange}){const visibleModes=Object.entries(trailModes).filter(([id])=>descriptions[id]);return <section className="arcade-page"><button className="text-button" onClick={onHome}><ArrowLeft/> Adventures</button><div className="arcade-hero"><span>🎪</span><div><div className="eyebrow">SHIVANI’S MATH GAMES</div><h1>Pick a playful trail</h1><p>Every board changes. Follow the hidden math path from one friend to another.</p></div><div className="arcade-hero-actions"><button className="primary" onClick={()=>onChoose(randomMode())}><Shuffle/> Surprise me!</button><button className="secondary" onClick={onRunner}>🦊 Maze Runner</button></div></div><div className="arcade-difficulty"><DifficultyPicker value={difficulty} onChange={onDifficultyChange}/></div><div className="arcade-grid">{visibleModes.map(([id,x],i)=><button key={id} className={`arcade-card game-${i+1}`} onClick={()=>onChoose(id)}><span>{x.start}</span><i>{x.icon}</i><div><h2>{x.name}</h2><p>{descriptions[id]}</p><b>PLAY ▶</b></div><em>{x.goal}</em></button>)}<button key="voyage" className="arcade-card game-7" onClick={()=>onChoose('voyage')}><span>🌊</span><i>⛵</i><div><h2>Number Line Voyage</h2><p>Sail eight islands and master number-line strategies, one smart jump at a time.</p><b>PLAY ▶</b></div><em>🧭</em></button></div><div className="arcade-note"><Sparkles/><p>Seven age-8 games with endless fresh boards. There are no timers and mistakes never remove points.</p></div></section>}

function QuestionCard({mode,item}){
 const card={background:'rgba(255,255,255,0.92)',borderRadius:16,padding:'12px 10px 6px',margin:'10px 0 2px',textAlign:'center',boxShadow:'0 2px 10px rgba(20,40,80,0.12)'};
 const q={margin:'8px 4px 10px',fontSize:17,fontWeight:700,color:'#1a365d'};
 if(mode==='geometry'){const[a,b]=item.sides;return <div className="trail-question" style={card}>
  <svg width="230" height="150" viewBox="0 0 230 150" role="img" aria-label={`rectangle with sides ${a} centimeters and ${b} centimeters`}>
   <rect x="35" y="30" width="160" height="90" fill="#eef4ff" stroke="#2b6cb0" strokeWidth="4" rx="4"/>
   <text x="115" y="21" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1a365d">{a} cm</text>
   <text x="115" y="141" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1a365d">{a} cm</text>
   <text x="19" y="78" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1a365d" transform="rotate(-90 19 78)">{b} cm</text>
   <text x="211" y="78" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1a365d" transform="rotate(-90 211 78)">{b} cm</text>
  </svg><p style={q}>{item.question}</p></div>;}
 if(mode==='money'){
  const meta={100:{t:'$1',bg:'#f6c445',fg:'#5b3a00'},25:{t:'25¢',bg:'#d9dee6',fg:'#334155'},10:{t:'10¢',bg:'#d9dee6',fg:'#334155'},5:{t:'5¢',bg:'#d9dee6',fg:'#334155'},1:{t:'1¢',bg:'#e2a075',fg:'#5b2d0e'}};
  return <div className="trail-question" style={card}><div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',padding:'6px 2px',alignItems:'center'}}>
   {item.coins.map((d,i)=>{const m=meta[d],sz=d===100?58:d===25?54:d===10?42:48;return <span key={i} style={{width:sz,height:sz,borderRadius:'50%',background:m.bg,color:m.fg,border:'3px solid rgba(0,0,0,0.28)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:d===100?15:14,boxShadow:'inset 0 -3px 6px rgba(0,0,0,0.22)'}}>{m.t}</span>;})}
  </div><p style={q}>{item.question}</p></div>;}
 if(mode==='time'){
  const{h,m}=item,cx=110,cy=85,r=62;
  const pt=(deg,len)=>{const rad=(deg-90)*Math.PI/180;return [cx+len*Math.cos(rad),cy+len*Math.sin(rad)];};
  const[hx,hy]=pt((h%12+m/60)*30,32),[mx,my]=pt(m*6,48);
  const ticks=Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return <line key={i} x1={cx+(r-9)*Math.sin(a)} y1={cy-(r-9)*Math.cos(a)} x2={cx+r*Math.sin(a)} y2={cy-r*Math.cos(a)} stroke="#334155" strokeWidth={i%3===0?4:2}/>});
  const num=(n,deg)=>{const a=deg*Math.PI/180;return <text key={'n'+n} x={cx+(r-24)*Math.sin(a)} y={cy-(r-24)*Math.cos(a)} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="800" fill="#1e293b">{n}</text>;};
  return <div className="trail-question" style={card}>
   <svg width="220" height="170" viewBox="0 0 220 170" role="img" aria-label={`analog clock showing ${h}:${String(m).padStart(2,'0')}`}>
    <circle cx={cx} cy={cy} r={r+8} fill="#ffffff" stroke="#1e293b" strokeWidth="5"/>
    {ticks}{num(12,0)}{num(3,90)}{num(6,180)}{num(9,270)}
    <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#1e293b" strokeWidth="7" strokeLinecap="round"/>
    <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
    <circle cx={cx} cy={cy} r="6" fill="#1e293b"/>
   </svg><p style={q}>{item.question}</p></div>;}
 return null;
}

function TrailGame({mode,difficulty,onDifficultyChange,onBack,onSave,onDifferent}){
 const[round,setRound]=useState(1),[game,setGame]=useState(()=>makeMathTrail(mode,difficulty)),[step,setStep]=useState(0),[wrong,setWrong]=useState(null),[done,setDone]=useState(false),[tries,setTries]=useState(0),[pop,setPop]=useState(null),[cheer,setCheer]=useState('Find the first step!'),started=useMemo(()=>Date.now(),[round]);
 const completed=new Set(game.path.slice(0,step).map(x=>x.join(','))),nextCell=game.path[step]?.join(','),runnerCell=step?game.path[step-1]?.join(','):null,[prizeIcon,prizeName]=prizes[mode];
 const choose=cell=>{if(done)return;const k=`${cell.r},${cell.c}`;if(k!==nextCell){setWrong(k);setTries(n=>n+1);setCheer('That is a side path—look nearby!');setTimeout(()=>setWrong(null),450);return;}const next=step+1;setStep(next);setWrong(null);setPop({cell:k,icon:['✨','⭐','💫','🌟'][next%4]});setCheer(cheers[next%cheers.length]);ding(next===game.sequence.length);setTimeout(()=>setPop(null),650);if(next===game.sequence.length){setDone(true);onSave({mode,round,duration:Date.now()-started,tries,skillId:`${mode}:${difficulty}`});}};
 const fresh=()=>{setRound(n=>n+1);setGame(makeMathTrail(mode,difficulty));setStep(0);setWrong(null);setDone(false);setTries(0);setPop(null);setCheer('Find the first step!');};
 return <section className={`trail-game trail-${mode}`}><div className="trail-game-top"><button className="text-button" onClick={onBack}><ArrowLeft/> All games</button><div><span>{game.start}</span><b>{game.name}</b><span>{game.goal}</span></div><button className="secondary" onClick={fresh}><RefreshCw/> New board</button><div className="trail-difficulty-row"><DifficultyPicker value={difficulty} onChange={onDifficultyChange}/></div></div><div className="worksheet"><div className="worksheet-title"><div><span className="eyebrow">FRESH BOARD {round}</span><h1>{descriptions[mode]}</h1></div><div className="trail-score"><b>{step}</b><small>of 8 found</small>{step>=2&&!done&&<em>🔥 {step} streak</em>}</div></div>{(mode==='geometry'||mode==='money'||mode==='time')&&!done&&step<game.sequence.length&&<QuestionCard mode={mode} item={game.sequence[step]}/>}<div className="worksheet-board" style={{'--trail-size':game.size}}>{game.cells.map(cell=>{const k=`${cell.r},${cell.c}`,isDone=completed.has(k),isNext=k===nextCell,isStart=cell.routeIndex===0,isGoal=cell.routeIndex===game.sequence.length-1;return <button key={k} onClick={()=>choose(cell)} className={`${isDone?'found':''} ${wrong===k?'wrong':''} ${isNext&&step===0?'first':''}`} aria-label={`${cell.label}${isStart?' start':''}${isGoal?' finish':''}`}><span>{cell.label}</span>{isStart&&step===0&&<i>{game.start}</i>}{isGoal&&<i>{game.goal}</i>}{runnerCell===k&&!done&&<i className="trail-runner">{game.start}</i>}{pop?.cell===k&&<strong className="trail-pop">{pop.icon}</strong>}</button>})}</div><div className="trail-strip"><span>{game.start}</span>{game.sequence.map((x,i)=><i key={x.label} className={i<step?'done':i===step?'now':''}>{i<step?'✓':(mode==='times'?x.question:((mode==='decimals'||mode==='fractions')&&i===step?x.ask:'?'))}</i>)}<span>{game.goal}</span></div>{!done&&<p className="trail-coach">{step===0?'👆 Start beside '+game.start:mode==='times'?`What is ${game.sequence[step]?.question.replace('×',' × ')}?`:`${cheer} ${game.sequence[step]?.question}`}</p>}{done&&<div className="trail-win"><div className="mini-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}>★</i>)}</div><span>{prizeIcon}</span><div><small>NEW ROUND BADGE</small><h2>{prizeName}!</h2><p>Eight discoveries. One complete trail.</p></div><div className="trail-win-actions"><button className="primary" onClick={fresh}>Another board</button><button className="secondary" onClick={onDifferent}><Shuffle/> Surprise game</button></div></div>}</div></section>;
}

export function ShivaniGameArcade({onHome,onRunner,onSave}){const[mode,setMode]=useState(null);const[difficulty,setDifficulty]=useDifficulty();if(mode==='voyage')return <NumberLineVoyage onBack={()=>setMode(null)} onSave={onSave} difficulty={difficulty} onDifficultyChange={setDifficulty}/>;return mode?<TrailGame key={mode+':'+difficulty} mode={mode} difficulty={difficulty} onDifficultyChange={setDifficulty} onBack={()=>setMode(null)} onSave={onSave} onDifferent={()=>setMode(randomMode(mode))}/>:<ArcadeMenu onChoose={setMode} onHome={onHome} onRunner={onRunner} difficulty={difficulty} onDifficultyChange={setDifficulty}/>;}
