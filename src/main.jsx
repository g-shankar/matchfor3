import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  Heart,
  Leaf,
  Map,
  BarChart3,
  Volume2,
  Lightbulb,
  Check,
  Sparkles,
  Flag,
  Download,
  Gamepad2,
  Dices,
  Mic,
} from "lucide-react";
import {
  worlds,
  labels,
  loadProgress,
  nextQuestion,
  markPresented,
  record,
} from "./engine.js";
import "./style.css";
import {skillInfo,skillCount,skillStage,stickerCollection} from './curriculum.js';
import {answerMatches,misconceptionHint} from './math-utils.js';
import {ActivityInput} from './activities.jsx';
import {Visual} from "./visuals.jsx";
import {SkillTrail,Workshop,Collection,ParentInsights,representationNames} from './learning-pages.jsx';
import {
  reflectionSchedule,
  reflectionPrompt,
  hasThought,
  saveReflection,
} from "./reflection.js";
import {companions,newKeepsakes,rewardWallet} from "./rewards.js";
import {Celebration,BuddyBadge} from "./rewards-ui.jsx";
import {EmailPreferences} from "./email-preferences.jsx";
import {BirthdatePrompt} from "./birthdate-prompt.jsx";
import {validBirthDate} from "./child-profile.js";
import {ThemePicker,validTheme} from "./theme-picker.jsx";
import {speakFriendly} from "./speech.js";
import {PreschoolApp,ProfileChooser} from "./preschool-app.jsx";
import {initialPreschool} from "./preschool-engine.js";
import { useCloudProgress } from "./use-cloud-progress.js";
import {ShivaniMazeRunner} from './shivani-maze-runner.jsx';
import {ShivaniGameArcade} from './shivani-game-arcade.jsx';
const Icon = ({ name, ...props }) => {
  const I = { map: Map, heart: Heart, leaf: Leaf }[name] || Sparkles;
  return <I {...props} />;
};
function Island({ world, large = false }) {
  if(['numbers','measure'].includes(world.id))return <svg className="island" viewBox="0 0 340 205" aria-hidden="true"><ellipse cx="170" cy="172" rx="128" ry="18" fill={world.color} opacity=".5"/><path d="M45 132Q80 92 132 108Q179 84 228 105Q285 108 300 137L270 160Q162 183 70 154Z" fill={world.color}/>{world.id==='numbers'?<><path d="M125 144L158 91L190 143" stroke="#9b795c" strokeWidth="8" fill="none"/><path d="M157 94L235 58" stroke="#9b795c" strokeWidth="20"/><path d="M229 53L242 73" stroke="#c5a27b" strokeWidth="24"/><path d="M115 114V68H146V112" fill="#e9c795"/><path d="M110 68L130 41L151 68Z" fill="#9e9078"/><g fill="#c9a77c"><path d="M247 32l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><circle cx="86" cy="62" r="4"/></g><text x="204" y="145" fill="#95765b" fontSize="18">123</text></>:<><path d="M86 135Q137 104 173 138Q214 166 275 125" stroke="#79b6b3" strokeWidth="19" fill="none"/><path d="M93 135L108 103L130 132" fill="#85aa82"/><path d="M221 131V88M248 124V77" stroke="#7d966d" strokeWidth="7"/><circle cx="222" cy="76" r="24" fill="#a5be8e"/><circle cx="248" cy="69" r="20" fill="#8eac79"/><ellipse cx="161" cy="122" rx="24" ry="14" fill="#a58268"/><circle cx="147" cy="106" r="15" fill="#b18e74"/><circle cx="142" cy="103" r="2" fill="#405343"/><path d="M163 121Q184 117 190 137" stroke="#a58268" strokeWidth="9" fill="none"/></>}</svg>;
  return (
    <svg
      viewBox="0 0 340 205"
      className={`island ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      <ellipse
        cx="170"
        cy="170"
        rx="133"
        ry="19"
        fill={world.color}
        opacity=".3"
      />
      <path
        d="M43 131Q61 84 130 99Q171 72 224 101Q289 97 303 132L283 163Q167 195 65 156Z"
        fill={world.ink}
        opacity=".45"
      />
      <path
        d="M43 131Q61 84 130 99Q171 72 224 101Q289 97 303 132Q178 169 43 131Z"
        fill={world.color}
      />
      {world.id === "shapes" ? (
        <>
          <path d="M131 119L166 138L206 121L200 143L155 151Z" fill="#faf5e4" />
          <path d="M167 121V39L210 108H167Z" fill="#fff9e8" />
          <path d="M160 106H126L160 55Z" fill="#db9076" />
          <path d="M83 112V72H108V113" fill="#718e9b" />
          <path d="M79 72L96 48L113 72Z" fill="#eef3ed" />
          <rect x="90" y="82" width="9" height="13" rx="3" fill="#faf5e4" />
          <path d="M225 128L233 102L248 128" fill="#77949a" />
          <path
            d="M51 169Q71 162 90 170M233 177Q256 169 281 175"
            stroke="#70a6b4"
            strokeWidth="3"
            fill="none"
          />
        </>
      ) : world.id === "area" ? (
        <>
          <path d="M121 119L165 86L221 109L176 145Z" fill="#8cab68" />
          <path
            d="M131 118L174 91M146 127L190 97M160 135L205 104M143 103L199 128M155 95L214 118"
            stroke="#f4eac1"
            strokeWidth="3"
          />
          <path d="M86 120V68M247 126V83" stroke="#677e50" strokeWidth="5" />
          {[
            [86, 65],
            [247, 80],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="20" fill="#e8ae53" />
              <circle cx={x} cy={y} r="9" fill="#8c6837" />
              <path
                d={`M${x} ${y + 44}q-24-20-24-4q5 13 24 9`}
                fill="#8eaa6c"
              />
            </g>
          ))}
          <path d="M231 134L251 132L249 147L235 149Z" fill="#d78662" />
        </>
      ) : world.id === "fractions" ? (
        <>
          {[
            [93, 112, 1],
            [174, 96, 1.3],
            [242, 126, 0.85],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x},${y}) scale(${s})`}>
              <path d="M0 10V-37" stroke="#8a7355" strokeWidth="9" />
              <path d="M-35-20L0-85L35-20Z" fill="#83aa72" />
              <path d="M-29-42L0-97L29-42Z" fill="#a0bd85" />
            </g>
          ))}
          <path
            d="M148 150Q110 129 146 121Q182 118 190 104"
            stroke="#f8efc9"
            strokeWidth="12"
            fill="none"
          />
          <circle cx="215" cy="137" r="8" fill="#d79b81" />
          <circle cx="72" cy="132" r="6" fill="#e1b460" />
        </>
      ) : (
        <>
          <path d="M82 127L140 34L201 126Z" fill="#a799bf" />
          <path d="M140 34L117 72L138 65L156 80L165 72Z" fill="#fff9ed" />
          <path d="M166 135L215 59L270 132Z" fill="#b6a8ca" />
          <path d="M215 59L199 84L219 80L232 94L237 89Z" fill="#faf5ef" />
          <path d="M121 148L136 121L154 147Z" fill="#83759c" />
          <path d="M186 146L198 130L212 147Z" fill="#e2a983" />
        </>
      )}
      <g fill="#fff9ed" opacity=".9">
        <path d="M282 65l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <circle cx="57" cy="87" r="3" />
      </g>
    </svg>
  );
}
function Mascot() {
  return (
    <svg viewBox="0 0 160 170" aria-hidden="true" className="mascot">
      <path
        d="M31 118Q12 76 46 49L37 12Q64 7 80 43Q99 14 125 17L120 55Q150 90 123 129Z"
        fill="#c8d6b2"
        stroke="#687a53"
        strokeWidth="3"
      />
      <ellipse cx="79" cy="106" rx="40" ry="32" fill="#f5eed8" />
      <circle cx="57" cy="80" r="5" fill="#405243" />
      <circle cx="103" cy="80" r="5" fill="#405243" />
      <path
        d="M72 99Q80 109 89 99"
        fill="none"
        stroke="#405243"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="95" rx="9" ry="5" fill="#e5a58e" />
      <ellipse cx="115" cy="95" rx="9" ry="5" fill="#e5a58e" />
      <path
        d="M46 139L38 159M112 139L122 159"
        stroke="#687a53"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M25 122Q8 139 16 145M132 121Q154 132 146 143"
        stroke="#687a53"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M51 128L80 140L108 127L105 140L80 152L53 140Z" fill="#d89b71" />
    </svg>
  );
}
function App() {
  const [progress, setProgress] = useState(loadProgress),
    [activeChild,setActiveChild]=useState(()=>localStorage.getItem("mathquest-active-child")||"shivani"),
    [birthdayDismissed,setBirthdayDismissed]=useState(false),
    [celebration,setCelebration]=useState(null),
    [page, setPage] = useState("home"),
    [q, setQ] = useState(null),
    [worldId, setWorldId] = useState(null),
    [trailWorld,setTrailWorld]=useState('shapes'),
    [practiceSkill,setPracticeSkill]=useState(null),
    [placementMode,setPlacementMode]=useState(false),
    [journeyLength,setJourneyLength]=useState(8),
    [sessionGoal,setSessionGoal]=useState(8),
    [typed,setTyped]=useState(''),
    [chosen,setChosen]=useState([]),
    [painted,setPainted]=useState([]),
    [point,setPoint]=useState(null),
    [answerHint,setAnswerHint]=useState(''),
    [count, setCount] = useState(0),
    [sessionSkills, setSessionSkills] = useState([]),
    [hint, setHint] = useState(false),
    [retries, setRetries] = useState(0),
    [feedback, setFeedback] = useState(""),
    [solved, setSolved] = useState(false),
    [selected, setSelected] = useState(""),
    [thought, setThought] = useState(""),
    [thoughtShared, setThoughtShared] = useState(false),
    [listening,setListening]=useState(false),
    [buddyBoost,setBuddyBoost]=useState(true),
    [bw, setBw] = useState(3),
    [bh, setBh] = useState(3),
    [storageError, setStorageError] = useState(false),
    [error, setError] = useState("");
  const questionStart = useRef(Date.now()),
    sessionStart = useRef(Date.now()),
    reflectionStops = useRef([]);
  const needsThought =
    solved && (reflectionStops.current.includes(count) || retries >= 2);
  const waitingForThought = needsThought && !thoughtShared;
  const { status: cloudStatus, retryCloud } = useCloudProgress(
    progress,
    setProgress,
  );
  useEffect(() => {
    try {
      localStorage.setItem("mathquest-v1", JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(()=>{if(activeChild==="shivani")document.documentElement.dataset.theme=validTheme(progress.rewards?.theme);},[activeChild,progress.rewards?.theme]);
  useEffect(()=>{if(!celebration)return;const timer=setTimeout(()=>setCelebration(null),7000);return()=>clearTimeout(timer);},[celebration]);
  useEffect(()=>{window.scrollTo({top:0,behavior:"instant"});},[page,q?.fingerprint]);
  const switchChild=id=>{window.speechSynthesis?.cancel();localStorage.setItem("mathquest-active-child",id);setBirthdayDismissed(false);setActiveChild(id);setPage("home");};
  const setPreschool=update=>setProgress(p=>({...p,preschool:typeof update==="function"?update(p.preschool||initialPreschool()):update}));
  if(activeChild==="pranav")return <PreschoolApp value={progress.preschool} onChange={setPreschool} onSwitch={switchChild} cloudStatus={cloudStatus}/>;
  const reset = (q) => {
    window.speechSynthesis?.cancel();
    setCelebration(null);
    setQ(q);
    setProgress((p)=>markPresented(p,q));
    setHint(false);
    setRetries(0);
    setFeedback("");
    setSolved(false);
    setSelected("");
    setThought("");
    setThoughtShared(false);
    setTyped('');setChosen([]);setPainted([]);setPoint(null);setAnswerHint('');
    setBw(3);
    setBh(3);
    questionStart.current = Date.now();
  };
  const start = (id,skillId=null,placement=false) => {
    if (cloudStatus === "connecting") return;
    try {
      const goal=placement?5:journeyLength;
      setWorldId(id);setPracticeSkill(skillId);setPlacementMode(placement);setSessionGoal(goal);
      reflectionStops.current = placement?[]:reflectionSchedule(Math.random,goal);
      setCount(0);
      setSessionSkills([]);
      setBuddyBoost(true);
      sessionStart.current = Date.now();
      reset(nextQuestion(progress, id,[],{skillId,placement,forceLevel:placement?1:undefined}));
      setPage("play");
    } catch (e) {
      if(e.code==='EXHAUSTED')setCelebration({icon:'🏆',title:'You completed this whole trail!',text:'That is a huge math achievement. Choose another trail while Milo prepares new discoveries.'});
      else setError(e.message);
    }
  };
  const saveAttempt = (skipped) => {
    const p = record(progress, q, {
      hinted: hint,
      retries,
      skipped,
      duration: Date.now() - questionStart.current,
    });
    setProgress(p);
    return p;
  };
  const check = (value) => {
    setSelected(value);
    const differentGarden=!q.requireDifferent||!([bw,bh].sort((a,b)=>a-b).join(',')===[...q.original].sort((a,b)=>a-b).join(','));
    if (answerMatches(q,value)&&differentGarden) {
      if(solved)return;
      const after=saveAttempt(false),keepsakes=newKeepsakes(progress,after);
      setCelebration(keepsakes.length?{icon:keepsakes[0].icon,title:`New keepsake: ${keepsakes[0].name}`,text:"A little celebration for your discoveries. +6 sparkles!"}:{icon:"🌟",title:retries||hint?"You kept exploring!":"Discovery celebration!",text:"+6 sparkles for your companion collection."});
      setSolved(true);
      setFeedback(
        retries || hint
          ? "You figured it out! Taking time and using help is how we learn."
          : "Lovely thinking! You made a discovery.",
      );
    } else {
      setRetries((n) => n + 1);
      setAnswerHint(!differentGarden?'This is the reference garden, perhaps turned around. Try a new pair of side lengths with the same area.':misconceptionHint(q,value));
      setHint(true);
      setFeedback(
        "Let’s explore it together. Try using the picture and this clue.",
      );
    }
  };
  const finish = (p, n) => {
    window.speechSynthesis?.cancel();
    let saved=p;
    if(placementMode){
      const evidence=p.attempts.filter(a=>a.date>=sessionStart.current&&a.worldId===worldId),rate=evidence.length?evidence.filter(a=>a.independent).length/evidence.length:0,level=rate>=.8?3:rate>=.4?2:1;
      saved={...p,placements:{...(p.placements||{}),[worldId]:{level,score:evidence.filter(a=>a.independent).length,total:evidence.length,date:Date.now()}}};
    }
    setProgress({
      ...saved,
      sessions: [
        ...saved.sessions,
        {
          date: Date.now(),
          duration: Date.now() - sessionStart.current,
          count: n,
          worldId,skillId:practiceSkill,goal:sessionGoal,completed:n>=sessionGoal,placement:placementMode,
        },
      ].slice(-365),
    });
    const placed=saved.placements?.[worldId]?.level;
    setCelebration(placementMode?{icon:"🧭",title:`Your starting point is ${['','Explore','Connect','Stretch'][placed]}`,text:'Milo will use this to choose questions that feel interesting without being overwhelming.'}:{icon:"🎉",title:"An adventure to remember!",text:`You explored ${n} discoveries. Your collected friends are waiting in My keepsakes.`});
    setPage("done");
  };
  const advance = (skip = false) => {
    if (!skip && waitingForThought) return;
    const p = skip ? saveAttempt(true) : progress;
    const n = count + 1,
      skills = [...sessionSkills, q.skill];
    setCount(n);
    setSessionSkills(skills);
    if (n >= sessionGoal) {
      finish(p, n);
      return;
    }
    try {
      const placementLevels=[1,2,2,3,3];
      reset(nextQuestion(p, worldId, skills,{skillId:practiceSkill,placement:placementMode,forceLevel:placementMode?placementLevels[n]:undefined}));
    } catch (e) {
      finish(p, n);
      if(e.code==='EXHAUSTED')setCelebration({icon:'🏆',title:'Every challenge explored!',text:'You finished this trail. Your next adventure can begin on any other island.'});
      else setError(e.message);
    }
  };
  const useBuddyBoost=()=>{
    if(!buddyBoost||solved)return;
    try{
      const placementLevels=[1,2,2,3,3];
      const next=nextQuestion(progress,worldId,sessionSkills,{skillId:practiceSkill,placement:placementMode,forceLevel:placementMode?placementLevels[count]:undefined});
      setBuddyBoost(false);
      reset(next);
      setFeedback('Your buddy found a fresh way to practice this idea!');
    }catch(e){
      if(e.code==='EXHAUSTED')setCelebration({icon:'🏆',title:'This trail is complete!',text:'You explored every challenge here.'});
      else setError(e.message);
    }
  };
  const dictateThought=()=>{
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setError('Voice notes are not available in this browser. You can still type a few words.');return;}
    const recognition=new Recognition();
    recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>setListening(true);
    recognition.onend=()=>setListening(false);
    recognition.onerror=()=>{setListening(false);setError('I could not hear that. Tap the microphone and try once more.');};
    recognition.onresult=(event)=>setThought(t=>`${t}${t?' ':''}${event.results[0][0].transcript}`.slice(0,500));
    recognition.start();
  };
  const leave = () => {
    window.speechSynthesis?.cancel();
    if (solved) setSessionSkills((s) => [...s, q.skill]);
    if (count || solved) finish(progress, count + (solved ? 1 : 0));
    else setPage("home");
  };
  const navigate=(target)=>{if(page==="play")leave();window.speechSynthesis?.cancel();setPage(target);};
  const read = () => {
    if ("speechSynthesis" in window) {
      speakFriendly(q.prompt);
    }
  };
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mathquest-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const total = Object.values(progress.skills).reduce((n,s)=>n+s.total,0),
    minutes = Math.round(
      progress.sessions.reduce((s, x) => s + x.duration, 0) / 60000,
    );
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={()=>navigate("home")}
        >
          <span className="brand-icon">
            <Compass size={26} />
          </span>
          mathquest<span className="brand-dot">✦</span>
        </button>
        <nav>
          <button
            className={["home","trail"].includes(page) ? "active" : ""}
            onClick={()=>navigate("home")}
          >
            <Map size={17} /> My adventures
          </button>
          <button className={page==='workshop'?'active':''} onClick={()=>{navigate('workshop');}}><Lightbulb size={17}/> Workshop</button>
          <button className={page==='runner'?'active':''} onClick={()=>navigate('runner')}><Gamepad2 size={17}/> Maze Runner</button>
          <button className={page==='games'?'active':''} onClick={()=>navigate('games')}><Dices size={17}/> Math Games</button>
          <button className={page==='collection'?'active':''} onClick={()=>{navigate('collection');}}><Sparkles size={17}/> My keepsakes</button>
          <button
            className={page === "parent" ? "active" : ""}
            onClick={() => {
              navigate("parent");
            }}
          >
            <BarChart3 size={17} /> Parent corner
          </button>
        </nav>
        <ProfileChooser active="shivani" birthDate={progress.profile?.birthDate} onSwitch={switchChild}/>
      </header>
      {activeChild==="shivani"&&cloudStatus!=="connecting"&&!validBirthDate(progress.profile?.birthDate)&&!birthdayDismissed&&<BirthdatePrompt onLater={()=>setBirthdayDismissed(true)} onSave={birthDate=>setProgress(p=>({...p,profile:{birthDate,updatedAt:Date.now()}}))}/>} 
      <Celebration event={celebration} quiet={progress.rewards?.quiet===true} onClose={()=>setCelebration(null)}/>
      <main>
        {cloudStatus === "connecting" && (
          <div className="cloud-notice">
            Getting your saved discoveries… You can play in a moment.
          </div>
        )}
        {storageError && (
          <div className="notice">
            Your browser cannot save progress right now. You can keep playing;
            export your discoveries in Parent corner before closing.
          </div>
        )}
        {error && (
          <div className="notice">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        {page==='trail'&&<SkillTrail worldId={trailWorld} progress={progress} onStart={start} onHome={()=>setPage('home')}/>}
        {page==='workshop'&&<Workshop onHome={()=>setPage('home')} onStart={start}/>}
        {page==='runner'&&<ShivaniMazeRunner onHome={()=>setPage('home')} onGames={()=>setPage('games')} onCelebrate={setCelebration} onSave={result=>setProgress(p=>({...p,sessions:[...p.sessions,{date:Date.now(),duration:result.duration,count:result.gates,worldId:'mazeRunner',skillId:result.level,goal:result.gates,completed:true}].slice(-365)}))}/>}
        {page==='games'&&<ShivaniGameArcade onHome={()=>setPage('home')} onRunner={()=>setPage('runner')} onSave={result=>setProgress(p=>({...p,sessions:[...p.sessions,{date:Date.now(),duration:result.duration,count:8,worldId:'mathGames',skillId:result.mode,goal:8,completed:true}].slice(-365)}))}/>} 
        {page==='collection'&&<Collection progress={progress} onChange={setProgress} onHome={()=>setPage('home')}/>}
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">
                  <span /> YOUR LITTLE WORLD OF MATH
                </div>
                <h1>
                  A little adventure.
                  <br />A big <em>“I get it!”</em>
                </h1>
                <p>
                  Build a garden. Share a sunbeam. Find a new way.
                  <br />
                  There’s something wonderful waiting to make sense.
                </p>
                <button
                  className="primary"
                  disabled={cloudStatus === "connecting"}
                  onClick={() => start(null)}
                >
                  Let’s explore <ArrowRight size={19} />
                </button>
                <BuddyBadge progress={progress}/>
                <div className="gentle">
                  <Heart size={15} /> No timers. No lost lives. Just
                  discoveries.
                </div>
                <label className="journey-picker">Questions per adventure <select value={journeyLength} onChange={e=>setJourneyLength(+e.target.value)}><option value={4}>4 questions · a little visit</option><option value={8}>8 questions · a gentle journey</option></select></label>
                <ThemePicker compact value={progress.rewards?.theme} onChange={theme=>setProgress(p=>({...p,rewards:{...p.rewards,theme,updatedAt:Date.now()}}))}/>
              </div>
              <div className="hero-art">
                <div className="orbit">
                  ✦<span>1/2</span>
                  <span>×</span>
                  <span>4 + 4</span>
                </div>
                <Island world={worlds[2]} large />
                <Mascot />
                <div className="speech">
                  “What shall we discover today?”
                  <span>YOUR ADVENTURE BUDDY, MILO</span>
                </div>
              </div>
            </section>
            <section className="world-section">
              <div className="section-title">
                <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
                <h2>Pick a place to play</h2>
                <p>
                  Six worlds with 50 math skills. Pick a world, then play a 4- or 8-question adventure.
                </p>
              </div>
              <span className="session-note">
                <Leaf size={17} /> Each adventure: {journeyLength} questions · go at your pace
              </span>
              <div className="worlds">
                {worlds.map((w, i) => {
                  const practiced = w.skills.filter(
                    (s) => progress.skills[s]?.total,
                  ).length;
                  return (
                    <button
                      className="world-card"
                      disabled={cloudStatus === "connecting"}
                      key={w.id}
                      onClick={() => {setTrailWorld(w.id);setPage("trail");}}
                      style={{ "--world-color": w.color, "--world-ink": w.ink }}
                    >
                      <div className="card-top">
                        <span className="world-number">0{i + 1}</span>
                        {i === 0 && total === 0 ? (
                          <span className="pill">A lovely place to start</span>
                        ) : (
                          <span className="mini-stars">✧ ✧ ✧</span>
                        )}
                      </div>
                      <Island world={w} />
                      <h3>{w.name}</h3>
                      <p>{w.tag}</p>
                      <div className="card-footer">
                        <span>
                          {practiced
                            ? `${practiced} of ${w.skills.length} skills explored`
                            : `${w.skills.length} math skills inside`}
                        </span>
                        <span className="round-arrow">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="home-extras"><button className="runner-home-card" onClick={()=>setPage('runner')}><span>🦊</span><div><h3>Maze Runner</h3><p>Explore endless mazes, collect gems, and unlock math gates.</p></div><ArrowRight size={19}/></button><button className="arcade-home-card" onClick={()=>setPage('games')}><span>🎪</span><div><h3>Math Games Arcade</h3><p>Counting clouds, lily-pad hops, fraction flowers, coins, clocks, and more.</p></div><ArrowRight size={19}/></button><button onClick={()=>setPage('workshop')}><span>🛠️</span><div><h3>Make a discovery of your own</h3><p>Build a garden, paint equal parts, split an array, or move a clock.</p></div><ArrowRight size={19}/></button><button onClick={()=>setPage('collection')}><span>📔</span><div><h3>Your little wonder collection</h3><p>{stickerCollection(progress).filter(s=>s.earned).length} keepsakes from ideas you explored. Take a peek.</p></div><ArrowRight size={19}/></button></section>
            <section className="bottom-note">
              <span className="note-flower">✿</span>
              <div>
                <b>Small steps are wonderful steps.</b>
                <p>
                  A hint is a helping hand. A mistake is a chance to discover.
                  You can stop whenever you like.
                </p>
              </div>
              <span className="little-stamp">
                MADE FOR
                <br />
                <b>curious minds</b>
              </span>
            </section>
          </>
        )}
        {page === "play" && q && (
          <section className="play">
            <div className="play-top">
              <button className="text-button" onClick={leave}>
                <ArrowLeft size={17} /> Finish for now
              </button>
              <span>
                {placementMode?'Starting-point check':practiceSkill?labels[practiceSkill]:worlds.find((w) => w.id === worldId)?.name || "A little of everything"}
              </span>
              <span>Question {count + 1} of {sessionGoal}</span>
            </div>
            <div className="progress-dots">
              {Array.from({ length: sessionGoal }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < count ? "complete" : i === count ? "current" : ""
                  }
                />
              ))}
            </div>
            <BuddyBadge progress={progress}/>
            {progress.rewards?.selected&&buddyBoost&&!solved&&<button className="buddy-boost" onClick={useBuddyBoost}><span>{companions.find(c=>c.id===progress.rewards.selected)?.icon||'✨'}</span><span><b>Buddy boost</b><small>Swap this question once</small></span></button>}
            <div className="question-card">
              <div className="eyebrow">
                {q.isWarmup?"NUMBER-POWER WARM-UP":labels[q.skill]} ·{" "}
                {q.level === 1
                  ? "EXPLORE"
                  : q.level === 2
                    ? "CONNECT"
                    : "STRETCH"}
              </div>
              <div className="question-heading">
                <h2>{q.prompt}</h2>
                <button
                  className="audio"
                  aria-label="Read question aloud"
                  onClick={read}
                >
                  <Volume2 size={22} />
                </button>
              </div>
              <Visual q={q} bw={bw} bh={bh} />
              {q.type === "build" && (
                <div className="builder">
                  <label>
                    Width{" "}
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={bw}
                      disabled={solved}
                      onChange={(e) => setBw(+e.target.value)}
                    />
                    <b>{bw}</b>
                  </label>
                  <label>
                    Height{" "}
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={bh}
                      disabled={solved}
                      onChange={(e) => setBh(+e.target.value)}
                    />
                    <b>{bh}</b>
                  </label>
                  <button
                    className="primary"
                    disabled={solved}
                    onClick={() => check(bw * bh)}
                  >
                    Check my garden <Check size={18} />
                  </button>
                </div>
              )}
              <ActivityInput q={q} solved={solved} typed={typed} setTyped={setTyped} chosen={chosen} setChosen={setChosen} painted={painted} setPainted={setPainted} point={point} setPoint={setPoint} check={check}/>
              {q.type === "choice" && (
                <div className="answers">
                  {q.choices.map((c) => (
                    <button
                      key={c}
                      className={
                        selected === c ? (solved ? "correct" : "chosen") : ""
                      }
                      disabled={solved}
                      onClick={() => check(c)}
                    >
                      {c}
                      {solved && selected === c && <Check size={20} />}
                    </button>
                  ))}
                </div>
              )}
              <div aria-live="polite">
                {feedback && (
                  <p className={`feedback ${solved ? "success" : ""}`}>
                    {solved ? <Sparkles size={18} /> : <Leaf size={18} />}{" "}
                    {feedback}
                  </p>
                )}
                {hint && !solved && (
                  <div className="hint">
                    <Lightbulb size={19} />
                    <p>{answerHint||q.hint}</p>
                  </div>
                )}
                {solved && !waitingForThought && (
                  <div className="explanation">{q.explain}</div>
                )}
              </div>
              {needsThought && (
                <section
                  className="reflection-box"
                  aria-labelledby="thought-heading"
                >
                  <div className="eyebrow">
                    <Lightbulb size={16} /> MILO IS CURIOUS
                  </div>
                  <h3 id="thought-heading">How did you figure it out?</h3>
                  <label htmlFor="thought-text">
                    {reflectionPrompt(q.skill)}
                  </label>
                  <p id="thought-help">
                    A few words or a math sentence is plenty. Spelling doesn’t
                    matter. You can say “I guessed” and tell us what you’ll try
                    next.
                  </p>
                  <textarea
                    id="thought-text"
                    aria-describedby="thought-help"
                    maxLength={500}
                    rows={3}
                    value={thought}
                    disabled={thoughtShared}
                    onChange={(e) => setThought(e.target.value)}
                    placeholder="I noticed… / I counted… / I broke it into…"
                  />
                  {!thoughtShared&&<button type="button" className={`voice-thought ${listening?'listening':''}`} onClick={dictateThought} disabled={listening}><Mic size={18}/>{listening?'Listening…':'Tell Milo with my voice'}</button>}
                  {thoughtShared ? (
                    <p className="thought-thanks" role="status">
                      Thanks for sharing your thinking! There’s more than one
                      way to discover.
                    </p>
                  ) : (
                    <button
                      className="primary"
                      disabled={!hasThought(thought)}
                      onClick={() => {
                        if (!hasThought(thought)) return;
                        setProgress((p) => saveReflection(p, q, thought));
                        setThoughtShared(true);
                        setCelebration({icon:"💬",title:"Your thinking is worth celebrating",text:"Thanks for telling Milo how you worked it out!"});
                      }}
                    >
                      Share my thinking <Check size={17} />
                    </button>
                  )}
                </section>
              )}
              <div className="question-actions">
                {solved ? (
                  <button
                    className="primary"
                    disabled={waitingForThought}
                    onClick={() => advance()}
                  >
                    {count === sessionGoal-1 ? "See my discoveries" : "Next discovery"}{" "}
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button
                      className="text-button"
                      onClick={() => setHint(true)}
                    >
                      <Lightbulb size={17} /> Give me a clue
                    </button>
                    <button
                      className="text-button"
                      onClick={() => advance(true)}
                    >
                      Let’s try something else <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="under-question">
              <Heart size={15} /> Thinking takes time. There’s no hurry here.
            </p>
          </section>
        )}
        {page === "done" && (
          <section className="done">
            <div className="eyebrow">A GOOD PLACE TO PAUSE</div>
            <Mascot />
            <h1>Look what you explored!</h1>
            <p>
              {count} {count === 1 ? "discovery" : "discoveries"}. New ideas.
              And a little more confidence.
              <br />
              Milo will be here whenever you feel like another adventure.
            </p>
            <div className="discovery-tags">
              {[...new Set(sessionSkills)].map((s) => (
                <span key={s}>
                  <Sparkles size={15} />
                  {labels[s]}
                </span>
              ))}
            </div>
            <div className="done-actions">
              <button className="primary" onClick={() => setPage("home")}>
                Back to my islands <Map size={18} />
              </button>
              <button className="secondary" onClick={() => start(worldId,practiceSkill)}>
                I’d like to explore more
              </button>
            </div>
            <p className="offline">
              Try something off screen:{" "}
              {worlds.find((w) => w.id === worldId)?.activity ||
                "Find a rectangle nearby. How could you measure its inside and its boundary?"}
            </p>
          </section>
        )}
        {page === "parent" && (
          <section className="parent">
            <div className="eyebrow">FOR THE GROWN-UPS</div>
            <h1>Little steps, made visible.</h1>
            <p>Notice how she thinks. Celebrate the ideas that click.</p>
            <div className="stats">
              <div>
                <span>Discoveries explored</span>
                <strong>{total}</strong>
              </div>
              <div>
                <span>Skills encountered</span>
                <strong>
                  {Object.keys(progress.skills).length}
                  <small> / {skillCount}</small>
                </strong>
              </div>
              <div>
                <span>Completed adventures</span>
                <strong>{progress.sessions.filter(s=>s.completed===true||(s.completed===undefined&&s.count>=8)).length}</strong>
              </div>
              <div>
                <span>Adventure time</span>
                <strong>
                  {minutes}
                  <small> min</small>
                </strong>
              </div>
            </div>
            <div className="parent-note">
              <Leaf size={22} />
              <p>
                Practice observations, not test scores. “Independent” means
                solved without a clue or retry. Supported answers count as
                learning too. A few answers are too little evidence to judge
                understanding.
              </p>
            </div>
            <EmailPreferences progress={progress}/>
            <label className="quiet-setting"><input type="checkbox" checked={progress.rewards?.quiet===true} onChange={e=>setProgress(p=>({...p,rewards:{...p.rewards,quiet:e.target.checked,updatedAt:Date.now()}}))}/> Gentle celebrations (without confetti)</label>
            <ParentInsights progress={progress} onPractice={start}/>
            <div className="parent-grid">
              {worlds.map((w) => (
                <article key={w.id}>
                  <h2>
                    {w.icon} {w.name}
                  </h2>
                  {w.skills.map((skill) => {
                    const s = progress.skills[skill];
                    return (
                      <div className="skill-row" key={skill}>
                        <div>
                          <b>{labels[skill]}</b>
                          <span>
                            {s
                              ? `${s.independent} independent · ${s.supported} with help · ${s.total} explored`
                              : "Waiting to be explored"}
                          </span>
                        </div>
                        <div className="skill-meter">
                          <span
                            style={{
                              width: `${s ? (s.independent / s.total) * 100 : 0}%`,
                              background: w.ink,
                            }}
                          />
                        </div>
                        {s?.representations&&<details className="representation-details"><summary>{Object.keys(s.representations).length} models explored</summary>{Object.entries(s.representations).map(([rep,stat])=><div key={rep}><span>{representationNames[rep]||rep}</span><span>{stat.independent} independent / {stat.total} explored</span></div>)}</details>}
                        {s && s.total < 5 && (
                          <small>Still getting to know this skill</small>
                        )}
                      </div>
                    );
                  })}
                  <div className="offline-tip">
                    <b>An off-screen idea</b>
                    <p>{w.activity}</p>
                  </div>
                </article>
              ))}
            </div>
            <section className="parent-reflections">
              <h2>In her own words</h2>
              <p>
                Her latest explanations. These are conversation starters, not
                graded writing.
              </p>
              {progress.attempts.some((a) => a.reflection) ? (
                progress.attempts
                  .filter((a) => a.reflection)
                  .slice(-6)
                  .reverse()
                  .map((a) => (
                    <article key={`${a.date}-${a.fingerprint}`}>
                      <div className="eyebrow">{labels[a.skill]}</div>
                      <h3>{a.reflection.question}</h3>
                      <p>{a.reflection.prompt}</p>
                      <blockquote>{a.reflection.text}</blockquote>
                    </article>
                  ))
              ) : (
                <p>
                  Occasional “How did you figure it out?” moments will appear
                  here after she shares her thinking.
                </p>
              )}
            </section>
            <div className="cloud-panel">
              <div>
                <b>
                  {cloudStatus === "saved"
                    ? "Discoveries backed up to Firebase"
                    : cloudStatus === "saving"
                      ? "Saving your discoveries…"
                      : cloudStatus === "connecting"
                        ? "Connecting to cloud backup…"
                        : "Saved in this browser · cloud backup unavailable"}
                </b>
                <p>
                  Practice history is saved to your private browser profile in
                  Firestore. School reports and assessment scores are never
                  uploaded. This anonymous profile does not sync to another
                  device or survive clearing your sign-in data.
                </p>
              </div>
              {cloudStatus === "local" && (
                <button className="secondary" onClick={retryCloud}>
                  Retry cloud saving
                </button>
              )}
            </div>
            <div className="data-note">
              <p>
                Browser saving keeps play available if the cloud connection
                fails. Export a copy to keep a backup you control.
              </p>
              <button className="secondary" onClick={exportData}>
                <Download size={17} /> Export progress
              </button>
            </div>
          </section>
        )}
      </main>
      <footer>
        <span>
          <Compass size={15} /> mathquest
        </span>
        <p>Made for discovery. A little at a time.</p>
        <span>With room to wonder ✦</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
