import React,{useMemo,useState} from 'react';
import {ArrowLeft,RefreshCw,Sparkles} from 'lucide-react';
import {ding} from './chime.js';
import ShelfBackdrop3D from './three-fx/ShelfBackdrop3D.jsx';
import Confetti3D from './three-fx/Confetti3D.jsx';
import {speakFriendly} from './speech.js';

const GAMES=[
 ['area','Area Climber','🧗','Find the area of a rectangle'],['basketball','Basketball','🏀','Shoot the answer'],['bingo','Math Bingo','🎯','Complete a row of facts'],['calculator','Broken Calculator','🧮','Make the target with keys'],['climber','Number Climber','⛰️','Choose the next number'],['combo','Combo Builder','🧩','Mix operations to unlock'],['jewel','Jewel Diver','💎','Collect equal groups'],['mine','Math Mine','⛏️','Multiply or divide safely'],['divisor','Missing Divisor','➗','Find the missing divisor'],['multiplier','Missing Multiplier','✖️','Find the missing factor'],['mission','Mission Multiply','🚀','Power up with facts'],['race','Multiply Race','🏎️','Race through a table'],['perimeter','Perimeter Climber','📐','Measure around'],['pinball','Math Pinball','🎰','Bounce to the right answer'],['popcorn','Popcorn Fractions','🍿','Share equal parts'],['quarterback','Quarterback','🏈','Pass the correct play'],['rain','Rain Drops','🌧️','Catch the matching value'],['touchdown','Touchdown','🏆','Score with division']
];
const pick=(a)=>a[Math.floor(Math.random()*a.length)];
function challenge(id){
 const a=2+Math.floor(Math.random()*9),b=2+Math.floor(Math.random()*9);
 if(id==='area')return {prompt:`A garden is ${a} squares long and ${b} squares wide. What is its area?`,answer:a*b,art:'▦',choices:[a*b,a+b,a*b+a,a*b-b]};
 if(id==='perimeter')return {prompt:`A rectangle is ${a} cm by ${b} cm. What is the perimeter?`,answer:2*(a+b),art:'▭',choices:[2*(a+b),a*b,a+b,2*a+b]};
 if(['divisor','touchdown'].includes(id))return {prompt:`${a*b} ÷ ? = ${a}`,answer:b,art:'🏈',choices:[b,a,a+1,b+1]};
 if(['multiplier','mission','race'].includes(id))return {prompt:`? × ${a} = ${a*b}`,answer:b,art:'🚀',choices:[b,a,a+1,b+2]};
 if(['mine','combo'].includes(id)){const divide=Math.random()>.5;return divide?{prompt:`${a*b} ÷ ${b} = ?`,answer:a,art:'⛏️',choices:[a,b,a+1,b+1]}:{prompt:`${a} × ${b} = ?`,answer:a*b,art:'🧩',choices:[a*b,a+b,a*b+1,a*b-b]};}
 if(id==='popcorn')return {prompt:`${b} equal shares have ${a*b} pieces. How many in each share?`,answer:a,art:'🍿',choices:[a,b,a+1,b+1]};
 if(id==='calculator')return {prompt:`Which expression makes ${a*b}?`,answer:`${a} × ${b}`,art:'🧮',choices:[`${a} × ${b}`,`${a}+${b}`,`${a*b}+1`,`${a} × ${b+1}`]};
 if(['basketball','pinball','quarterback','rain'].includes(id))return {prompt:`Choose the value of ${a} × ${b}.`,answer:a*b,art:id==='basketball'?'🏀':id==='quarterback'?'🏈':'⭐',choices:[a*b,a+b,a*b+2,a*b-b]};
 if(id==='bingo')return {prompt:`Bingo square: ${a} × ${b}`,answer:a*b,art:'🎯',choices:[a*b,a+b,a*b+1,a*b-b]};
 if(id==='jewel')return {prompt:`${a} groups of ${b} jewels make how many?`,answer:a*b,art:'💎',choices:[a*b,a+b,a*b-b,a*b+1]};
 if(id==='climber')return {prompt:`What comes next? ${a}, ${a+2}, ${a+4}, ?`,answer:a+6,art:'⛰️',choices:[a+6,a+5,a+8,a+4]};
 return {prompt:`Choose the product of ${a} and ${b}.`,answer:a*b,art:'⭐',choices:[a*b,a+b,a*b+1,a*b-b]};
}
function ArcadeHome({onHome,onChoose,playerName}){return <section className="pranav-arcade"><ShelfBackdrop3D/><button className="text-button" onClick={onHome}><ArrowLeft/> Back to adventures</button><div className="pranav-arcade-hero"><span>🎮</span><div><div className="eyebrow">{playerName.toUpperCase()} · MATH ARCADE</div><h1>Pick a world to play</h1><p>18 kinds of math play. Every round changes, so there is always a fresh mission.</p></div></div><div className="pranav-arcade-grid">{GAMES.map(([id,name,icon,tag])=><button key={id} onClick={()=>onChoose(id)}><span>{icon}</span><div><b>{name}</b><small>{tag}</small></div><i>PLAY ▶</i></button>)}</div></section>}
export function PranavMathArcade({onHome,voiceName,playerName='Pranav',onSave}){const[id,setId]=useState(null),[q,setQ]=useState(null),[message,setMessage]=useState(''),[wins,setWins]=useState(0),[round,setRound]=useState(0);const start=game=>{setId(game);setQ(challenge(game));setMessage('');setRound(n=>n+1)};const answer=value=>{if(String(value)===String(q.answer)){ding(true);speakFriendly('Great thinking!',{voiceName});setMessage('Great thinking! You found it.');setWins(n=>n+1);onSave?.({mode:id,round});}else{ding(false);setMessage('Good try. Look at the story and try again.')}};if(!id)return <ArcadeHome playerName={playerName} onHome={onHome} onChoose={start}/>;return <section className="pranav-arcade-play"><Confetti3D fireKey={wins}/><button className="text-button" onClick={()=>setId(null)}><ArrowLeft/> All arcade games</button><div className="arcade-play-top"><span>{GAMES.find(x=>x[0]===id)?.[2]}</span><div><div className="eyebrow">{playerName.toUpperCase()} · ROUND {round}</div><h1>{GAMES.find(x=>x[0]===id)?.[1]}</h1></div><button className="secondary" onClick={()=>start(id)}><RefreshCw/> New challenge</button></div><article className="arcade-question"><div className="arcade-art">{q.art}</div><h2>{q.prompt}</h2><div className="arcade-choices">{[...new Set(q.choices)].map(x=><button key={x} onClick={()=>answer(x)}>{x}</button>)}</div><p className={message.includes('Great')?'arcade-good':''} aria-live="polite">{message||'Tap an answer to play.'}</p>{message.includes('Great')&&<button className="primary jumbo" onClick={()=>start(id)}>Next challenge <Sparkles/></button>}</article></section>}
