import {makeTraceMaze} from './maze-engine.js';

export const runnerLevels={
 easy:{label:'Easy',size:9,icon:'🦊',tag:'Friendly paths',gates:2},
 medium:{label:'Medium',size:11,icon:'🐺',tag:'Twisty trails',gates:3},
 hard:{label:'Hard',size:13,icon:'🐲',tag:'Epic challenge',gates:4},
};
const rand=(random,min,max)=>Math.floor(random()*(max-min+1))+min;
// Fisher–Yates shuffle. The old [...items].sort(()=>random()-.5) was biased
// (the answer landed in choice positions 0/3 ~66% of the time); still used for gem placement.
export const shuffled=(items,random)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

// Constructed-response gate check: entry is the digit string typed on the number pad.
// Empty entries never open a gate (Number('')===0 would be a false pass on 0-answers);
// leading zeros are harmless since Number normalizes them. Pure — no side effects.
export function checkGateEntry(entry,answer){return typeof entry==='string'&&entry.length>0&&/^\d+$/.test(entry)&&Number(entry)===answer;}

export function runnerQuestion(level='easy',random=Math.random){
 let a,b,answer,prompt;
 if(level==='easy'){a=rand(random,4,20);b=rand(random,2,a);answer=random()<.5?a+b:a-b;prompt=answer>a?`${a} + ${b}`:`${a} − ${b}`;}
 else if(level==='medium'){a=rand(random,2,10);b=rand(random,2,10);if(random()<.7){answer=a*b;prompt=`${a} × ${b}`;}else{answer=a;prompt=`${a*b} ÷ ${b}`;}}
 else{const kind=rand(random,0,2);if(kind===0){a=rand(random,20,79);b=rand(random,11,40);answer=a+b;prompt=`${a} + ${b}`;}else if(kind===1){a=rand(random,30,99);b=rand(random,10,a-1);answer=a-b;prompt=`${a} − ${b}`;}else{a=rand(random,4,12);b=rand(random,3,12);answer=a*b;prompt=`${a} × ${b}`;}}
 return {prompt,answer};
}

export function makeRunnerLevel(level='easy',random=Math.random){
 const config=runnerLevels[level]||runnerLevels.easy,maze=makeTraceMaze(config.size,random),path=maze.solution,gates=[];
 for(let i=1;i<=config.gates;i++){const at=path[Math.floor(path.length*i/(config.gates+1))];gates.push({cell:`${at[0]},${at[1]}`,question:runnerQuestion(level,random)});}
 const blocked=new Set([`${maze.start[0]},${maze.start[1]}`,`${maze.goal[0]},${maze.goal[1]}`,...gates.map(g=>g.cell)]),gems=shuffled([...maze.open].filter(x=>!blocked.has(x)),random).slice(0,Math.min(8,config.gates+4));
 return {...maze,level,gates,gems};
}
