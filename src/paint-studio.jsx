import React,{useRef,useState} from 'react';
import {ArrowLeft,Paintbrush,Undo2,Trash2,Sparkles} from 'lucide-react';
import './pranav-fun.css';
import {colors,colorNames,brushes,stamps,shapes,papers,PROMPTS,mixMap,mixResult,nextPrompt} from './paint-studio-logic.js';
export {mixMap,mixResult,nextPrompt};

export function PaintStudio({onHome}){
  const [color,setColor]=useState(colors[0]);
  const [size,setSize]=useState(10);
  const [brush,setBrush]=useState('classic');
  const [tool,setTool]=useState('brush');
  const [mirror,setMirror]=useState(false);
  const [paper,setPaper]=useState('white');
  const [promptIdx,setPromptIdx]=useState(0);
  const [marks,setMarks]=useState([]);
  const [mix,setMix]=useState([]);
  const drawing=useRef(false);
  const rainbowHue=useRef(0);
  const paperDef=papers.find(p=>p.id===paper)||papers[0];

  const point=e=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*400/r.height}};

  // Scatter n dots around p, sized by the brush-size slider.
  const sprayDots=(p,n)=>{const dots=[];for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.random()*size*2.2;dots.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:1+Math.random()*2.4})}return dots};

  const down=e=>{
    e.currentTarget.setPointerCapture(e.pointerId);
    const p=point(e);
    if(tool==='brush'){
      drawing.current=true;
      if(brush==='spray'){
        setMarks(m=>[...m,{type:'spray',color,size,dots:sprayDots(p,10),mirror}]);
      }else{
        const startHue=brush==='rainbow'?Math.floor(Math.random()*360):0;
        rainbowHue.current=startHue;
        setMarks(m=>[...m,{type:'line',brush,color,size,points:[p],hues:brush==='rainbow'?[startHue]:[],mirror}]);
      }
    }else{
      setMarks(m=>[...m,{type:'stamp',value:tool,x:p.x,y:p.y,size:36+size}]);
    }
  };

  const move=e=>{
    if(!drawing.current||tool!=='brush')return;
    const p=point(e);
    if(brush==='spray'){
      const dots=sprayDots(p,8);
      setMarks(m=>m.map((x,i)=>i===m.length-1?{...x,dots:[...x.dots,...dots]}:x));
    }else{
      const hue=brush==='rainbow'?(rainbowHue.current=(rainbowHue.current+14)%360):null;
      setMarks(m=>m.map((x,i)=>i===m.length-1?{...x,points:[...x.points,p],hues:hue==null?x.hues:[...x.hues,hue]}:x));
    }
  };

  const path=pts=>pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const up=()=>{drawing.current=false};

  // The visible guts of one mark; mirror is applied by the caller via transform.
  const markInner=m=>{
    if(m.type==='stamp'){
      return <g className="paint-stamp-pop"><text x={m.x} y={m.y} fontSize={m.size} textAnchor="middle">{m.value}</text></g>;
    }
    if(m.type==='spray'){
      return <g>{m.dots.map((d,j)=><circle key={j} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(1)} fill={m.color} opacity={0.5}/>)}</g>;
    }
    const d=path(m.points),round={fill:'none',strokeLinecap:'round',strokeLinejoin:'round'};
    if(m.brush==='neon'){
      return <g>
        <path d={d} {...round} stroke={m.color} strokeWidth={m.size*1.6} opacity={0.85} filter="url(#paint-neon-glow)"/>
        <path d={d} {...round} stroke={m.color} strokeWidth={m.size}/>
        <path d={d} {...round} stroke="#ffffff" strokeWidth={Math.max(1.5,m.size*0.32)} opacity={0.85}/>
      </g>;
    }
    if(m.brush==='rainbow'){
      const segs=[];
      for(let i=0;i<m.points.length-1;i+=3){
        const chunk=m.points.slice(i,i+4);
        if(chunk.length<2)continue;
        segs.push(<path key={i} d={path(chunk)} {...round} stroke={`hsl(${m.hues[i]??0} 95% 55%)`} strokeWidth={m.size}/>);
      }
      return <g>{segs}</g>;
    }
    return <path d={d} {...round} stroke={m.color} strokeWidth={m.size}/>;
  };

  const mixed=mix.length===2?mixResult(mix[0],mix[1]):'';

  return <section className="paint-page">
    <button className="text-button" onClick={onHome}><ArrowLeft size={17}/> Back to play places</button>
    <div className="eyebrow">PRANAV’S CREATIVE STUDIO</div>
    <h1>Paint, stamp, and wonder</h1>
    <p>There is no right answer here. Make marks, try colors, and tell a story about the picture.</p>
    <div className="paint-layout">
      <aside>
        <h2><Paintbrush/> My art tools</h2>
        <div className="paint-colors" role="group" aria-label="Paint colors">
          {colors.map(c=><button key={c} aria-label={`Choose ${colorNames[c]}`} aria-pressed={color===c&&tool==='brush'} style={{background:c}} onClick={()=>{setColor(c);setTool('brush')}}/>)}
        </div>
        <h3>Brushes</h3>
        <div className="paint-brushes" role="group" aria-label="Brushes">
          {brushes.map(b=><button key={b.id} aria-label={`Use ${b.label} brush`} aria-pressed={brush===b.id&&tool==='brush'} onClick={()=>{setBrush(b.id);setTool('brush')}}><span aria-hidden="true">{b.emoji}</span><small>{b.label}</small></button>)}
        </div>
        <label>Brush size <input type="range" min="3" max="28" value={size} onChange={e=>setSize(+e.target.value)}/></label>
        <label><input type="checkbox" checked={mirror} onChange={e=>setMirror(e.target.checked)}/> Mirror magic</label>
        <h3>Stamps</h3>
        <div className="paint-stamps" role="group" aria-label="Stamps">
          {stamps.map(x=><button key={x} aria-pressed={tool===x} onClick={()=>setTool(x)}>{x}</button>)}
        </div>
        <h3>Shape collage</h3>
        <div className="paint-stamps" role="group" aria-label="Shapes">
          {shapes.map(x=><button key={x} aria-pressed={tool===x} onClick={()=>setTool(x)}>{x}</button>)}
        </div>
        <div className="paint-actions">
          <button className="secondary" disabled={!marks.length} onClick={()=>setMarks(m=>m.slice(0,-1))}><Undo2/> Undo</button>
          <button className="secondary" disabled={!marks.length} onClick={()=>setMarks([])}><Trash2/> New page</button>
        </div>
      </aside>
      <div>
        <div className="paint-paper" role="group" aria-label="Paper choices">
          {papers.map(p=><button key={p.id} aria-pressed={paper===p.id} onClick={()=>setPaper(p.id)} style={{background:p.fill,color:p.ink}} aria-label={`Paint on ${p.label}`}><span aria-hidden="true">{p.id==='night'?'🌙':p.id==='sky'?'☁️':'🤍'}</span>{p.label}</button>)}
        </div>
        <svg className="paint-canvas" viewBox="0 0 600 400" aria-label="Painting canvas"
          onPointerDown={e=>{e.preventDefault();down(e)}}
          onPointerMove={e=>{e.preventDefault();move(e)}}
          onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
          <defs>
            <filter id="paint-neon-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7"/>
            </filter>
          </defs>
          <rect className="paint-paper-bg" x="0" y="0" width="600" height="400" rx="24" fill={paperDef.fill}/>
          {marks.map((m,i)=><g key={i}>{markInner(m)}{m.mirror&&<g transform="translate(600 0) scale(-1 1)">{markInner(m)}</g>}</g>)}
        </svg>
        <div className="art-prompt">
          <Sparkles/>
          <span>{PROMPTS[promptIdx]}</span>
          <button className="paint-dice" onClick={()=>setPromptIdx(nextPrompt(promptIdx))} aria-label="Surprise me with a new art idea">🎲 Surprise me</button>
        </div>
      </div>
    </div>
    <section className="color-lab">
      <h2>Color mixing lab</h2>
      <p>Pick two colors and make a prediction.</p>
      <div className="paint-mix-row">
        {colors.map(c=><button key={c} aria-label={`Mix ${colorNames[c]}`} aria-pressed={mix.includes(c)} style={{background:c}} onClick={()=>setMix(x=>x.includes(c)?x.filter(y=>y!==c):x.length<2?[...x,c]:[x[1],c])}/>)}
      </div>
      <strong>{mix.length<2?'Choose two colors':`Together they can make ${mixed}!`}</strong>
    </section>
  </section>;
}
