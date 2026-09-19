import React,{useMemo,useRef,useState} from 'react';
import {ArrowLeft,RefreshCw,Volume2} from 'lucide-react';
import {speakFriendly} from './speech.js';

const scenes=[
 ['Dinosaurs','/puzzles/dinosaurs.jpg'],['Ocean friends','/puzzles/ocean.jpg'],
 ['Rocket adventure','/puzzles/space.jpg'],['Happy farm','/puzzles/farm.jpg'],
 ['Jungle safari','/puzzles/safari.jpg'],['Birthday party','/puzzles/birthday.jpg'],
 ['Rainbow castle','/puzzles/castle.jpg'],['Construction crew','/puzzles/construction.jpg'],
 ['Forest picnic','/puzzles/picnic.jpg'],['Playful penguins','/puzzles/penguins.jpg'],
 ['Teddy’s toy room','/puzzles/toys.jpg'],['Hot-air balloons','/puzzles/balloons.jpg'],
];
const shuffle=list=>[...list].sort(()=>Math.random()-.5);
const shapes=[
 'polygon(0 0,88% 0,88% 18%,100% 25%,88% 34%,88% 100%,0 100%,0 65%,10% 55%,0 45%)',
 'polygon(0 0,100% 0,100% 42%,88% 50%,100% 60%,100% 100%,12% 100%,12% 80%,0 72%,12% 62%,12% 30%,0 22%,12% 14%)',
 'polygon(0 0,90% 0,90% 38%,100% 48%,90% 58%,90% 100%,0 100%,0 66%,12% 56%,0 46%)',
 'polygon(10% 0,100% 0,100% 45%,88% 54%,100% 64%,100% 100%,10% 100%,10% 70%,0 60%,10% 50%,10% 26%,0 18%,10% 10%)',
 'polygon(0 0,88% 0,88% 20%,100% 30%,88% 40%,88% 100%,0 100%,0 62%,12% 52%,0 42%)',
 'polygon(10% 0,100% 0,100% 100%,10% 100%,10% 78%,0 68%,10% 58%,10% 34%,0 24%,10% 14%)',
];
function layout(count){return count===4?{cols:2,rows:2}:count===9?{cols:3,rows:3}:{cols:3,rows:2};}
function position(slot,cols,rows){const col=slot%cols,row=Math.floor(slot/cols);return `${cols===1?0:col/(cols-1)*100}% ${rows===1?0:row/(rows-1)*100}%`;}

export function ImageJigsaw({voiceName,onRecord,onHome,onMaze}){
 const order=useMemo(()=>shuffle(scenes),[]),session=useMemo(()=>Date.now()+Math.floor(Math.random()*10000),[]),boardRef=useRef(null);
 const [sceneIndex,setSceneIndex]=useState(0),[count,setCount]=useState(6),[placed,setPlaced]=useState([]),[selected,setSelected]=useState(null),[drag,setDrag]=useState(null),[message,setMessage]=useState('Pick a picture piece!');
 const scene=order[sceneIndex%order.length],[name,image]=scene,{cols,rows}=layout(count),pieces=useMemo(()=>shuffle(Array.from({length:count},(_,slot)=>({slot,id:`${sceneIndex}-${count}-${slot}`}))),[sceneIndex,count]);
 const styleFor=piece=>({'--piece-image':`url(${image})`,'--piece-size':`${cols*100}% ${rows*100}%`,'--piece-position':position(piece.slot,cols,rows),clipPath:shapes[piece.slot%shapes.length]});
 const finish=next=>{if(next.length!==count)return;setMessage('You made the whole picture!');speakFriendly('You made the whole picture!',{voiceName});onRecord({skill:'completePicture',worldId:'puzzle',seed:session+sceneIndex,fingerprint:`image-jigsaw-${session}-${sceneIndex}-${count}`,prompt:`Build ${name}`,spoken:'Build the picture.',answer:'complete',choices:[]});};
 const place=(piece,target)=>{if(!piece||placed.includes(piece.slot))return;if(piece.slot!==target){setMessage('That piece has another home.');speakFriendly('Try another spot.',{voiceName});return;}const next=[...placed,piece.slot];setPlaced(next);setSelected(null);setMessage(next.length===count?'You made the whole picture!':'Nice fit! Pick another piece.');finish(next);};
 const startDrag=(e,piece)=>{e.preventDefault();setSelected(piece);setDrag({piece,x:e.clientX,y:e.clientY,moved:false});e.currentTarget.setPointerCapture?.(e.pointerId);};
 const moveDrag=e=>{if(!drag)return;setDrag({...drag,x:e.clientX,y:e.clientY,moved:drag.moved||Math.abs(e.clientX-drag.x)>5||Math.abs(e.clientY-drag.y)>5});};
 const endDrag=e=>{if(!drag)return;const rect=boardRef.current?.getBoundingClientRect();if(rect&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){const col=Math.min(cols-1,Math.floor((e.clientX-rect.left)/(rect.width/cols))),row=Math.min(rows-1,Math.floor((e.clientY-rect.top)/(rect.height/rows)));place(drag.piece,row*cols+col);}setDrag(null);};
 const reset=()=>{setPlaced([]);setSelected(null);setDrag(null);setMessage('Pick a picture piece!');};
 const nextPicture=()=>{setSceneIndex(n=>(n+1)%order.length);reset();};
 const changeCount=n=>{setCount(n);setPlaced([]);setSelected(null);setMessage('Pick a picture piece!');};
 return <section className="image-jigsaw-page"><header className="image-jigsaw-top"><button className="text-button" onClick={onHome}><ArrowLeft/> Playroom</button><div className="jigsaw-mode-tabs"><button className="active">🧩 Jigsaws</button><button onClick={onMaze}>🗺️ Mazes</button></div><button className="listen-button" onClick={()=>speakFriendly('Pick up a piece and move it to the picture.',{voiceName})}><Volume2/> Hear</button></header><div className="image-jigsaw-heading"><div><span className="eyebrow">PICTURE {sceneIndex+1} OF {order.length}</span><h1>{name}</h1></div><div className="jigsaw-levels" aria-label="Number of puzzle pieces">{[4,6,9].map(n=><button key={n} className={count===n?'active':''} onClick={()=>changeCount(n)}>{n}<small>pieces</small></button>)}</div></div><div className="image-jigsaw-workspace"><aside className="image-piece-tray"><div className="jigsaw-preview" style={{backgroundImage:`url(${image})`}}/><div className="loose-pieces" style={{'--tray-cols':count===9?3:2}}>{pieces.map(piece=><button key={piece.id} aria-label={`Picture piece ${piece.slot+1}`} disabled={placed.includes(piece.slot)} className={`${selected?.id===piece.id?'selected':''} ${placed.includes(piece.slot)?'used':''}`} style={styleFor(piece)} onPointerDown={e=>startDrag(e,piece)} onPointerMove={moveDrag} onPointerUp={endDrag} onClick={()=>setSelected(piece)}/>)}</div></aside><div className="image-puzzle-side"><div ref={boardRef} className="image-jigsaw-board" style={{'--board-cols':cols,'--board-rows':rows,'--guide-image':`url(${image})`}}>{Array.from({length:count},(_,slot)=><button key={slot} aria-label={`Puzzle space ${slot+1}`} className={placed.includes(slot)?'filled':''} style={placed.includes(slot)?styleFor({slot}):undefined} onClick={()=>place(selected,slot)}>{!placed.includes(slot)&&<span>{slot+1}</span>}</button>)}</div><p className="jigsaw-status" aria-live="polite">{message}</p><div className="jigsaw-bottom-actions"><button className="secondary" onClick={reset}><RefreshCw/> Mix again</button>{placed.length===count&&<button className="primary" onClick={nextPicture}>Next picture →</button>}</div></div></div>{drag&&<div className="jigsaw-drag-ghost" style={{...styleFor(drag.piece),left:drag.x,top:drag.y}}/>}</section>;
}
