const modes={
 decimals:{name:'Decimal Dash',icon:'🔢',start:'🚀',goal:'🏁'},
 geometry:{name:'Perimeter Park',icon:'📐',start:'🧭',goal:'🏡'},
 times:{name:'Times-Table Garden',icon:'🌼',start:'🐛',goal:'🦋'},
 fractions:{name:'Fraction Flower Trail',icon:'🌸',start:'🐞',goal:'🌻'},
 money:{name:'Coin Treasure Path',icon:'🪙',start:'🏴‍☠️',goal:'🧰'},
 time:{name:'Clock Rain Rescue',icon:'🌧️',start:'☂️',goal:'🌈'},
};
export const trailModes=modes;
const pick=(r,a)=>a[Math.floor(r()*a.length)],shuffle=(r,a)=>[...a].sort(()=>r()-.5);
function pathCells(size,length,random){for(let attempt=0;attempt<100;attempt++){const path=[[Math.floor(random()*size),Math.floor(random()*size)]],seen=new Set([path[0].join(',')]);while(path.length<length){const [r,c]=path.at(-1),choices=shuffle(random,[[1,0],[-1,0],[0,1],[0,-1]]).map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>nr>=0&&nr<size&&nc>=0&&nc<size&&!seen.has(`${nr},${nc}`));if(!choices.length)break;const next=choices[0];path.push(next);seen.add(next.join(','));}if(path.length===length)return path;}return Array.from({length},(_,i)=>[Math.floor(i/size),i%size]);}
function values(mode,difficulty,random){
 if(mode==='decimals'){
  // integer-unit arithmetic (tenths / hundredths ints) so values/labels never carry float dust
  const fmt1=t=>`${Math.floor(t/10)}.${t%10}`,fmt2=h=>`${Math.floor(h/100)}.${String(h%100).padStart(2,'0')}`;
  if(difficulty==='hard'){const start=100+Math.floor(random()*400);return Array.from({length:8},(_,i)=>{const h=start+i,value=h/100,label=fmt2(h),prev=fmt2(h-1);return {label,value,ask:`${prev} → ?`,question:`What comes after ${prev}?`};});}
  const start=difficulty==='medium'?10+Math.floor(random()*20):1+Math.floor(random()*8);
  return Array.from({length:8},(_,i)=>{const t=start+i,value=t/10,label=fmt1(t),prev=fmt1(t-1);return {label,value,ask:`${prev} → ?`,question:`What comes after ${prev}?`};});
 }
 if(mode==='geometry'){
  // perimeters stay even so every rectangle has integer sides; sides [a,b] satisfy 2(a+b)===P
  const perim=(start,step)=>Array.from({length:8},(_,i)=>{const P=start+i*step,k=Math.max(2,Math.round(P/4)-1),a=k,b=P/2-k;return {label:`${P} cm`,value:P,sides:[a,b],question:'How far is it all the way around?'};});
  if(difficulty==='medium')return perim(20+Math.floor(random()*10)*4,4);
  if(difficulty==='hard')return perim(40+Math.floor(random()*11)*10,10);
  return perim(12+Math.floor(random()*6)*2,2);
 }
 if(mode==='times'){const timesItem=(table,i)=>({question:`${table}×${i+1}`,label:String(table*(i+1)),value:table*(i+1),table,mult:i+1});if(difficulty==='medium'){const table=pick(random,[4,5,6,7,8,9]);return Array.from({length:8},(_,i)=>timesItem(table,i));}if(difficulty==='hard'){const table=pick(random,[6,7,8,9,10,11,12]);return Array.from({length:8},(_,i)=>timesItem(table,i));}const table=pick(random,[2,3,4,5,6,7,8,9]);return Array.from({length:8},(_,i)=>timesItem(table,i));}
 if(mode==='fractions'){const d=pick(random,difficulty==='medium'?[6,9,14]:difficulty==='hard'?[7,11,13]:[8,10,12]);return Array.from({length:8},(_,i)=>{let label,value;if(i<7){label=`${i+1}/${d}`;value=(i+1)/d;}else if(d<=7){label=`8/${d}`;value=8/d;}else{label=`${d}/${d}`;value=1;}const prev=i===0?`0/${d}`:i===7?`7/${d}`:`${i}/${d}`;return {label,value,ask:`${prev} → ?`,question:`What comes after ${prev} on the way to one whole?`};});}
 if(mode==='money'){
  const coins=cents=>{const out=[];let c=cents;for(const dnm of [100,25,10,5,1]){while(c>=dnm){out.push(dnm);c-=dnm;}}return out;};
  const q='How much money is this? Count the coins.';
  if(difficulty==='medium'){const cents=pick(random,[[25,50,75,100,125,150,175,200],[10,20,30,40,50,60,70,80]]);return cents.map(x=>({label:`${x}¢`,value:x,coins:coins(x),question:q}));}
  if(difficulty==='hard'){const dollars=pick(random,[[1.25,1.50,1.75,2.00,2.25,2.50,2.75,3.00],[0.50,0.75,1.00,1.25,1.50,1.75,2.00,2.25]]);return dollars.map(x=>({label:`$${x.toFixed(2)}`,value:x,coins:coins(Math.round(x*100)),question:q}));}
  const cents=pick(random,[[5,10,15,25,30,35,40,50],[5,10,15,20,25,30,35,40]]);return cents.map(x=>({label:`${x}¢`,value:x,coins:coins(x),question:q}));
 }
 if(difficulty==='medium'){const hour=1+Math.floor(random()*12);return Array.from({length:8},(_,i)=>{const total=hour*60+i*10,h=Math.floor(total/60),m=total%60;return {label:`${h}:${String(m).padStart(2,'0')}`,value:total,h,m,question:'What time is it on the clock?'};});}
 if(difficulty==='hard'){const hour=1+Math.floor(random()*12);return Array.from({length:8},(_,i)=>{const total=hour*60+i*5,h=Math.floor(total/60),m=total%60;return {label:`${h}:${String(m).padStart(2,'0')}`,value:total,h,m,question:'What time is it on the clock?'};});}
 const hour=1+Math.floor(random()*6);return Array.from({length:8},(_,i)=>{const total=hour*60+i*15,h=Math.floor(total/60),m=total%60;return {label:`${h}:${String(m).padStart(2,'0')}`,value:total,h,m,question:'What time is it on the clock?'};});
}
function nearMiss(mode,difficulty,sequence,random){
 const s=sequence[Math.floor(random()*sequence.length)];
 if(mode==='decimals'){const hard=difficulty==='hard',off=pick(random,hard?[0.01,-0.01,0.02,-0.02]:[0.1,-0.1,0.2,-0.2]);let v=s.value+off;v=hard?Math.max(0.01,Math.round(v*100)/100):Math.max(0.1,Math.round(v*10)/10);return {label:hard?v.toFixed(2):v.toFixed(1),value:v};}
 if(mode==='geometry'){
  // 25% of the time plant the classic area-misconception decoy (a*b instead of 2(a+b))
  if(random()<0.25){const it=sequence[Math.floor(random()*sequence.length)],[a,b]=it.sides;return {label:`${a*b} cm`,value:a*b};}
  const step=difficulty==='hard'?10:4,v=Math.max(step,s.value+pick(random,[step,-step,2*step,-2*step]));return {label:`${v} cm`,value:v};
 }
 if(mode==='times'){const table=s.table,v=Math.max(1,s.value+pick(random,[table,-table,1,-1,2,-2]));return {label:String(v),value:v};}
 if(mode==='fractions'){const d=+sequence[0].label.split('/')[1],n=1+Math.floor(random()*d);return {label:`${n}/${d}`,value:n/d};}
 if(mode==='money'&&difficulty==='medium'){const v=Math.max(5,s.value+pick(random,[5,-5,10,-10,15,-15,20,-20]));return {label:`${v}¢`,value:v};}
 if(mode==='money'){let v=s.value+pick(random,[0.05,-0.05,0.1,-0.1,0.25,-0.25,0.5,-0.5]);v=Math.max(0.25,Math.round(v*100)/100);return {label:`$${v.toFixed(2)}`,value:v};}
 const step=difficulty==='hard'?5:10,total=Math.max(60,s.value+pick(random,[step,-step,2*step,-2*step])),h=Math.floor(total/60),m=total%60;return {label:`${h}:${String(m).padStart(2,'0')}`,value:total};
}
export function makeMathTrail(mode='decimals',difficulty='simple',random=Math.random){if(typeof difficulty==='function'){random=difficulty;difficulty='simple';}if(!['simple','medium','hard'].includes(difficulty))difficulty='simple';const size=6,sequence=values(mode,difficulty,random),path=pathCells(size,sequence.length,random),route=new Map(path.map((cell,i)=>[cell.join(','),sequence[i]])),used=new Set(sequence.map(x=>x.label)),cells=[];
 if(difficulty==='simple'){for(let r=0;r<size;r++)for(let c=0;c<size;c++){const onRoute=route.get(`${r},${c}`);if(onRoute){cells.push({r,c,...onRoute,routeIndex:sequence.indexOf(onRoute)});continue;}let value=0,label='';for(let attempt=0;attempt<300&&(!label||used.has(label));attempt++){value=Math.floor(random()*96)+1;label=String(value);if(mode==='times'){const t=2+Math.floor(random()*11),m=1+Math.floor(random()*12);value=t*m;label=String(value);}if(mode==='decimals')label=(Math.floor(random()*999)/100).toFixed(2);if(mode==='geometry')label=`${4+Math.floor(random()*96)} cm`;if(mode==='fractions')label=`${1+Math.floor(random()*11)}/${3+Math.floor(random()*10)}`;if(mode==='money')label=`${value}¢`;if(mode==='time'){const h=1+Math.floor(random()*11),m=pick(random,[0,15,30,45]);label=`${h}:${String(m).padStart(2,'0')}`;}}used.add(label);cells.push({r,c,label,value,routeIndex:-1});}}
 else{for(let r=0;r<size;r++)for(let c=0;c<size;c++){const onRoute=route.get(`${r},${c}`);if(onRoute){cells.push({r,c,...onRoute,routeIndex:sequence.indexOf(onRoute)});continue;}let value=0,label='';for(let attempt=0;attempt<300&&(!label||used.has(label));attempt++){if(random()<0.4){const nm=nearMiss(mode,difficulty,sequence,random);value=nm.value;label=nm.label;}else{value=Math.floor(random()*96)+1;label=String(value);if(mode==='times'){const t=2+Math.floor(random()*11),m=1+Math.floor(random()*12);value=t*m;label=String(value);}if(mode==='decimals'&&difficulty==='medium')label=((10+Math.floor(random()*290))/10).toFixed(1);if(mode==='decimals'&&difficulty==='hard')label=(Math.floor(random()*999)/100).toFixed(2);if(mode==='geometry'&&difficulty==='medium')label=`${20+Math.floor(random()*180)} cm`;if(mode==='geometry'&&difficulty==='hard')label=`${40+Math.floor(random()*200)} cm`;if(mode==='fractions')label=`${1+Math.floor(random()*11)}/${3+Math.floor(random()*10)}`;if(mode==='money'&&difficulty==='medium'){value=25+Math.floor(random()*200);label=`${value}¢`;}if(mode==='money'&&difficulty==='hard'){value=(25+Math.floor(random()*475))/100;label=`$${value.toFixed(2)}`;}if(mode==='time'&&difficulty==='medium'){const h=1+Math.floor(random()*12),m=pick(random,[0,10,20,30,40,50]);value=h*60+m;label=`${h}:${String(m).padStart(2,'0')}`;}if(mode==='time'&&difficulty==='hard'){const h=1+Math.floor(random()*12),m=Math.floor(random()*12)*5;value=h*60+m;label=`${h}:${String(m).padStart(2,'0')}`;}}}used.add(label);cells.push({r,c,label,value,routeIndex:-1});}}
 return {mode,size,name:modes[mode].name,...modes[mode],sequence,path,cells,difficulty};}
