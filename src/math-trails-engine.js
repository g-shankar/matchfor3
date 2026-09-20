const modes={
 count:{name:'Counting Clouds',icon:'☁️',start:'🐝',goal:'🌷'},
 skip:{name:'Lily-Pad Hops',icon:'🪷',start:'🐸',goal:'🏝️'},
 times:{name:'Times-Table Garden',icon:'🌼',start:'🐛',goal:'🦋'},
 fractions:{name:'Fraction Flower Trail',icon:'🌸',start:'🐞',goal:'🌻'},
 money:{name:'Coin Treasure Path',icon:'🪙',start:'🏴‍☠️',goal:'🧰'},
 time:{name:'Clock Rain Rescue',icon:'🌧️',start:'☂️',goal:'🌈'},
};
export const trailModes=modes;
const pick=(r,a)=>a[Math.floor(r()*a.length)],shuffle=(r,a)=>[...a].sort(()=>r()-.5);
function pathCells(size,length,random){for(let attempt=0;attempt<100;attempt++){const path=[[Math.floor(random()*size),Math.floor(random()*size)]],seen=new Set([path[0].join(',')]);while(path.length<length){const [r,c]=path.at(-1),choices=shuffle(random,[[1,0],[-1,0],[0,1],[0,-1]]).map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>nr>=0&&nr<size&&nc>=0&&nc<size&&!seen.has(`${nr},${nc}`));if(!choices.length)break;const next=choices[0];path.push(next);seen.add(next.join(','));}if(path.length===length)return path;}return Array.from({length},(_,i)=>[Math.floor(i/size),i%size]);}
function values(mode,random){
 if(mode==='count'){const start=2+Math.floor(random()*13);return Array.from({length:8},(_,i)=>({label:String(start+i),value:start+i}));}
 if(mode==='skip'){const step=pick(random,[2,3,5,10]),start=step;return Array.from({length:8},(_,i)=>({label:String(start+i*step),value:start+i*step}));}
 if(mode==='times'){const table=pick(random,[2,3,4,5,6,7,8,9]);return Array.from({length:8},(_,i)=>({label:`${table}×${i+1}`,value:table*(i+1)}));}
 if(mode==='fractions'){const d=pick(random,[8,10,12]);return Array.from({length:8},(_,i)=>({label:i<7?`${i+1}/${d}`:`${d}/${d}`,value:i<7?(i+1)/d:1}));}
 if(mode==='money'){const cents=pick(random,[[1,5,10,25,30,35,40,50],[5,10,15,20,25,30,35,40]]);return cents.map(x=>({label:`${x}¢`,value:x}));}
 const hour=1+Math.floor(random()*6);return Array.from({length:8},(_,i)=>{const total=hour*60+i*15,h=Math.floor(total/60),m=total%60;return {label:`${h}:${String(m).padStart(2,'0')}`,value:total};});
}
export function makeMathTrail(mode='count',random=Math.random){const size=6,sequence=values(mode,random),path=pathCells(size,sequence.length,random),route=new Map(path.map((cell,i)=>[cell.join(','),sequence[i]])),used=new Set(sequence.map(x=>x.label)),cells=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++){const onRoute=route.get(`${r},${c}`);if(onRoute){cells.push({r,c,...onRoute,routeIndex:sequence.indexOf(onRoute)});continue;}let value=0,label='';for(let attempt=0;attempt<300&&(!label||used.has(label));attempt++){value=Math.floor(random()*96)+1;label=String(value);if(mode==='times')label=`${2+Math.floor(random()*11)}×${1+Math.floor(random()*10)}`;if(mode==='fractions')label=`${1+Math.floor(random()*11)}/${3+Math.floor(random()*10)}`;if(mode==='money')label=`${value}¢`;if(mode==='time'){const h=1+Math.floor(random()*11),m=pick(random,[0,15,30,45]);label=`${h}:${String(m).padStart(2,'0')}`;}}used.add(label);cells.push({r,c,label,value,routeIndex:-1});}
 return {mode,size,name:modes[mode].name,...modes[mode],sequence,path,cells};}
