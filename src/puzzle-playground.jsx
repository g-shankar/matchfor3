import React,{useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Sparkles,RefreshCw} from 'lucide-react';
import {speakFriendly} from './speech.js';

const puzzles=[
 {name:'Garden',tiles:['🌞','🌳','🌷','🐝']},
 {name:'Ocean',tiles:['🐳','🌊','🐚','🐠']},
 {name:'Space',tiles:['🚀','🌙','⭐','🪐']},
 {name:'Farm',tiles:['🐮','🌾','🚜','🌻']},
 {name:'Safari',tiles:['🦁','🌴','🦒','🦋']},
 {name:'Birthday',tiles:['🎂','🎈','🎁','🎉']},
];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
function makePieces(puzzle){return shuffle(puzzle.tiles.map((emoji,slot)=>({id:`${slot}-${Math.random()}`,emoji,slot})));}

export function PuzzlePlayground({voiceName,onRecord,onHome}){
 const session=useMemo(()=>Date.now()+Math.floor(Math.random()*10000),[]),[round,setRound]=useState(0),puzzle=puzzles[round%puzzles.length];
 const [pieces,setPieces]=useState(()=>makePieces(puzzle)),[selected,setSelected]=useState(null),[placed,setPlaced]=useState({}),[mistakes,setMistakes]=useState(0),[solved,setSolved]=useState(false),[message,setMessage]=useState('Pick a piece!');
 const resetPuzzle=()=>{setPieces(makePieces(puzzle));setSelected(null);setPlaced({});setMistakes(0);setSolved(false);setMessage('Pick a piece!');};
 const choosePiece=piece=>{if(solved||placed[piece.slot])return;setSelected(piece);setMessage('Now tap its empty spot.');speakFriendly('Now find its spot.',{voiceName});};
 const chooseSlot=slot=>{if(solved||placed[slot])return;if(!selected){setMessage('Pick a piece first.');return;}if(selected.slot!==slot){setMistakes(n=>n+1);setSelected(null);setMessage('That piece goes somewhere else. Try again.');speakFriendly('Try another spot.',{voiceName});return;}const next={...placed,[slot]:selected.emoji};setPlaced(next);setSelected(null);if(Object.keys(next).length===puzzle.tiles.length){setSolved(true);setMessage('You built the picture!');onRecord({skill:'completePicture',worldId:'puzzle',seed:session+round,fingerprint:`jigsaw-${session}-${round}`,prompt:`Build the ${puzzle.name} picture`,spoken:'Pick a piece, then find its spot.',answer:'complete',choices:puzzle.tiles});speakFriendly('You built the picture!',{voiceName});}else{setMessage('Nice fit! Find another piece.');speakFriendly('Nice fit!',{voiceName});}};
 const next=()=>{if(round>=4){onHome();return;}setRound(n=>n+1);setPieces(makePieces(puzzles[(round+1)%puzzles.length]));setSelected(null);setPlaced({});setMistakes(0);setSolved(false);setMessage('Pick a piece!');};
 return <section className="puzzle-page"><button className="text-button" onClick={onHome}><ArrowLeft size={18}/> Back to play places</button><div className="puzzle-hero"><div><div className="eyebrow">🧩 PUZZLE PLAYGROUND</div><h1>Build the picture!</h1><p>Pick a piece. Find its spot. Make it whole.</p></div><div className="puzzle-progress">{Array.from({length:5},(_,i)=><i key={i} className={i<round?'done':i===round?'now':''}>✦</i>)}</div></div><article className="jigsaw-card"><div className="puzzle-voice"><span className="coach-hand" aria-hidden="true">👆</span><button className="listen-button" onClick={()=>speakFriendly('Pick a piece, then find its spot.',{voiceName})}>Hear how to play</button></div><div className="jigsaw-title"><span>{puzzle.name}</span><small>{Object.keys(placed).length} / {puzzle.tiles.length} pieces</small></div><div className="jigsaw-board" aria-label={`${puzzle.name} picture puzzle`}>{puzzle.tiles.map((_,slot)=><button key={slot} className={`jigsaw-slot ${placed[slot]?'filled':''}`} onClick={()=>chooseSlot(slot)} aria-label={placed[slot]?`Piece ${slot+1} placed`:`Empty puzzle spot ${slot+1}`}>{placed[slot]||'?'}</button>)}</div><div className="jigsaw-pieces">{pieces.map(piece=><button key={piece.id} className={`jigsaw-piece ${selected?.id===piece.id?'selected':''} ${placed[piece.slot]?'used':''}`} disabled={!!placed[piece.slot]||solved} onClick={()=>choosePiece(piece)} aria-label="Puzzle piece">{piece.emoji}</button>)}</div><div className="jigsaw-actions"><button className="secondary" onClick={resetPuzzle} disabled={solved}><RefreshCw size={17}/> Mix pieces</button><span className="jigsaw-hint">{mistakes?'Keep looking — every piece has a home.':'👆 Tap a piece, then tap a spot.'}</span></div><p className="puzzle-message" aria-live="polite"><Sparkles size={17}/>{message}</p>{solved&&<button className="primary jumbo" onClick={next}>{round>=4?'All done':'Next puzzle'} <ArrowRight/></button>}</article></section>;
}
