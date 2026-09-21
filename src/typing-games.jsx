import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Volume2} from 'lucide-react';
import {speakFriendly} from './speech.js';
import {makeTypingRound,checkAnswer,letterWord,promptSpoken,MODE_INFO,LETTERS} from './typing-engine.js';
import './pranav-fun.css';

const GOOD_TRY=['Try again! You can do it!','Good try! Look again!','Almost! One more try!'];

export function TypingGames({voiceName,onExit,onSave}){
  const [mode,setMode]=useState(null);
  const [round,setRound]=useState([]);
  const [qi,setQi]=useState(0);
  const [picked,setPicked]=useState([]);
  const [wiggle,setWiggle]=useState(null);
  const [done,setDone]=useState(false);
  const [stars,setStars]=useState(0);
  const [message,setMessage]=useState('');
  const stats=useRef({lettersTyped:0,rounds:0,best:0});
  const saved=useRef(false);
  const wrongThisQ=useRef(false);
  const lastStart=useRef(null);
  const question=round[qi];

  // Same save timing as BalloonKeepy: explicit finish() + unmount cleanup.
  const saveNow=()=>{saved.current=true;if(stats.current.lettersTyped||stats.current.rounds)onSave({...stats.current});};
  useEffect(()=>()=>{if(!saved.current&&(stats.current.lettersTyped||stats.current.rounds))onSave({...stats.current})},[]);
  const finish=()=>{saveNow();onExit();};

  const announce=q=>{if(q)speakFriendly(promptSpoken(q),{voiceName});};

  const startRound=freshMode=>{
    const avoid=lastStart.current;
    const r=makeTypingRound(freshMode,Math.random,avoid);
    lastStart.current=modeKey(r[0]);
    setRound(r);setQi(0);setPicked([]);setDone(false);
    setStars(0);setMessage('');wrongThisQ.current=false;
    announce(r[0]);
  };
  const chooseMode=m=>{setMode(m);startRound(m);};

  const wrong=key=>{
    wrongThisQ.current=true;
    setWiggle(key);
    setTimeout(()=>setWiggle(w=>w===key?null:w),550);
    setMessage('Good try! Look again 👀');
    speakFriendly(GOOD_TRY[Math.floor(Math.random()*GOOD_TRY.length)],{voiceName});
  };

  const finishQuestion=firstTry=>{
    if(firstTry)setStars(s=>s+1);
    const last=qi+1>=round.length;
    if(last){
      const rounds=stats.current.rounds+1;
      const best=Math.max(stats.current.best,stars+(firstTry?1:0));
      stats.current={...stats.current,rounds,best};
      setDone(true);
      setMessage('You finished all the letters! 🌟');
      speakFriendly(`Amazing! You finished all the letters! You earned ${stars+(firstTry?1:0)} stars!`,{voiceName});
    }else{
      const nq=round[qi+1];
      setQi(qi+1);setPicked([]);wrongThisQ.current=false;
      setMessage('');
      announce(nq);
    }
  };

  const cheer=q=>{
    // After a correct tap, the voice guides the next step.
    if(mode==='order'){
      const next=q.sequence[picked.length+1];
      if(next)speakFriendly(`Nice! Now find ${next}!`,{voiceName});
    }else if(mode==='find'||mode==='first'){
      speakFriendly(`${letterWord(mode==='find'?q.target:q.letter)} Yes!`,{voiceName});
    }else{
      speakFriendly('Yes! You matched them!',{voiceName});
    }
  };

  const press=rawKey=>{
    const q=round[qi];
    if(!q||done||!mode)return;
    const key=String(rawKey);
    if(mode==='order'){
      if(checkAnswer(mode,q,key,picked)){
        const np=[...picked,q.sequence[picked.length]];
        stats.current={...stats.current,lettersTyped:stats.current.lettersTyped+1};
        const firstTry=!wrongThisQ.current;
        if(np.length>=q.sequence.length)finishQuestion(firstTry);
        else{setPicked(np);cheer(q);}
      }else wrong(key.toUpperCase());
    }else if(checkAnswer(mode,q,key)){
      stats.current={...stats.current,lettersTyped:stats.current.lettersTyped+1};
      cheer(q);
      finishQuestion(!wrongThisQ.current);
    }else{
      wrong(key);
    }
  };
  const pressRef=useRef(press);
  pressRef.current=press;
  useEffect(()=>{
    const onKey=e=>{
      if(!mode)return;
      if(e.key&&e.key.length===1&&/^[a-zA-Z]$/.test(e.key)){
        e.preventDefault();
        pressRef.current?.(e.key);
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[mode]);

  // On-screen keyboard shows the case of the expected answer; bigsmall flips.
  const keyCase=()=>{
    if(mode==='bigsmall'&&question)return question.answer===question.answer.toUpperCase()?'upper':'lower';
    return 'upper';
  };
  const keyLabel=l=>keyCase()==='lower'?l.toLowerCase():l;
  const isExpected=l=>mode==='order'&&question?l===question.sequence[picked.length]:false;

  const renderPrompt=()=>{
    if(!question)return null;
    if(mode==='order'){
      return <div className="typing-prompt"><div className="typing-seq">{question.sequence.map((l,i)=><span key={l} className={i<picked.length?'got':i===picked.length?'next':''}>{l}</span>)}</div><small>Tap them in A-B-C order!</small></div>;
    }
    if(mode==='first'){
      return <div className="typing-prompt"><div className="typing-word"><span className="typing-emoji">{question.emoji}</span><b>{question.word}</b>{question.textFallback&&<small>🩻 x-ray</small>}</div><small>What letter does it start with?</small></div>;
    }
    if(mode==='bigsmall'){
      return <div className="typing-prompt"><div className="typing-giant">{question.given}</div><small>Find {question.answer===question.answer.toUpperCase()?'BIG':'little'} {question.answer.toUpperCase()}!</small></div>;
    }
    return <div className="typing-prompt"><div className="typing-giant">{question.target}</div><small>Find the letter {question.target}!</small></div>;
  };

  if(!mode){
    return <section className="typing-page">
      <button className="text-button typing-back" onClick={finish}><ArrowLeft size={18}/> Back to play</button>
      <div className="typing-head"><div className="eyebrow">TAP · HEAR · PLAY</div><h1>Type ABC</h1><p>Pick a letter game, then tap the big keys!</p></div>
      <div className="typing-picker">{Object.entries(MODE_INFO).map(([id,m])=><button key={id} className="mode-card" onClick={()=>chooseMode(id)}><span>{m.icon}</span><b>{m.label}</b><small>{m.blurb}</small></button>)}</div>
    </section>;
  }

  if(done){
    return <section className="typing-page">
      <div className="typing-celebrate" role="status">
        <h1>🎉 Hooray!</h1>
        <p>You finished all {round.length} letter games!</p>
        <div className="stars-flourish">{Array.from({length:round.length},(_,i)=><span key={i} style={{animationDelay:`${i*.12}s`}}>⭐</span>)}</div>
        <p className="typing-score-line"><b>{stats.current.best}</b> best stars · <b>{stats.current.lettersTyped}</b> letters tapped</p>
        <div className="typing-actions">
          <button className="primary jumbo" onClick={()=>startRound(mode)}>Play again 🔁</button>
          <button className="secondary" onClick={()=>setMode(null)}>Pick another game</button>
          <button className="text-button" onClick={finish}>All done</button>
        </div>
      </div>
    </section>;
  }

  return <section className="typing-page">
    <button className="text-button typing-back" onClick={finish}><ArrowLeft size={18}/> All done</button>
    <div className="typing-head"><div className="eyebrow">{MODE_INFO[mode].icon} {MODE_INFO[mode].label.toUpperCase()}</div>
      <div className="typing-progress"><b>Game {qi+1} of {round.length}</b><span>⭐ {stats.current.lettersTyped} letters</span><button className="listen-button" aria-label="Hear it again" onClick={()=>announce(question)}><Volume2 size={16}/> Hear it</button></div>
    </div>
    {renderPrompt()}
    <div className="typing-keyboard" aria-label="Letter keyboard">
      {LETTERS.map(l=><button key={l} className={`type-key${wiggle===keyLabel(l)?' wiggle':''}${isExpected(l)?' next':''}`} onClick={()=>press(keyLabel(l))} style={{touchAction:'manipulation'}} aria-label={`Letter ${l}`}>{keyLabel(l)}</button>)}
    </div>
    <p className="typing-message" aria-live="polite">{message}</p>
  </section>;
}

function modeKey(q){
  if(!q)return null;
  if(q.mode==='order')return q.start;
  if(q.mode==='first')return q.letter;
  if(q.mode==='bigsmall')return q.letter;
  return q.target;
}
