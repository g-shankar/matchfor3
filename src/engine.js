export const worlds = [
 {id:'shapes',name:'Shape Harbor',tag:'A little shape detective work',color:'#c1dce8',ink:'#366d88',icon:'⛵',skills:['sides','properties','families'],activity:'Find shapes around your home. Which have four sides? Which have right angles?'},
 {id:'area',name:'Garden Island',tag:'Build, measure, and grow',color:'#e8dfac',ink:'#827127',icon:'🌻',skills:['area','perimeter','missingSide'],activity:'Draw two different rectangles with 24 grid squares. Compare their boundaries.'},
 {id:'fractions',name:'Fraction Forest',tag:'Small pieces, big discoveries',color:'#c9dfc0',ink:'#537c49',icon:'🌳',skills:['parts','numberLine','compare','fractionSum'],activity:'Fold paper into equal parts. Compare one half with two quarters.'},
 {id:'multiply',name:'Mountain Makers',tag:'Find another way to multiply',color:'#ddd3ed',ink:'#786291',icon:'⛰️',skills:['array','split','missingFactor'],activity:'Use buttons to make an array. Split it into two smaller arrays and add their totals.'}
];
export const labels={sides:'Counting sides',properties:'Shape properties',families:'Shape families',area:'Area in squares',perimeter:'Around the boundary',missingSide:'Missing side lengths',parts:'Equal parts',numberLine:'Fractions on a line',compare:'Comparing fractions',fractionSum:'Adding equal parts',array:'Equal groups',split:'Breaking apart products',missingFactor:'Missing factors'};
export function initialProgress(){return {version:1,skills:{},seen:[],attempts:[],sessions:[],seeds:0};}
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
const int=(r,a,b)=>Math.floor(r()*(b-a+1))+a;
const shuffle=(r,arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=int(r,0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function generate(skill,level,seed){
 const r=rng(seed), a=int(r,2,level===1?5:level===2?8:12),b=int(r,2,level===1?5:9),context=pick(r,['Milo','Pip','Luna','Fern','Nori','Coco']),mode=int(r,0,2);
 let q={skill,level,context,mode,a,b,type:'choice',visual:'grid'};
 const make=(prompt,answer,hint,explain,choices)=>Object.assign(q,{prompt,answer:String(answer),hint,explain,choices:choices?.map(String)});
 switch(skill){
 case 'sides': {const shape=pick(r,['triangle','rectangle','pentagon','hexagon']);q.shape=shape;q.visual='shape';make(`How many sides does this ${shape} have?`,{triangle:3,rectangle:4,pentagon:5,hexagon:6}[shape],'Trace the outline. Count each straight edge once.','A side is one straight edge of a shape.',[3,4,5,6]);break;}
 case 'properties': {q.shape=pick(r,['square','rectangle','rhombus','parallelogram','trapezoid']);q.visual='shape';const right=['square','rectangle'].includes(q.shape);make(mode===0?'Does this shape have four right angles?':'Are both pairs of opposite sides parallel?',mode===0?(right?'Yes':'No'):(q.shape==='trapezoid'?'No':'Yes'),mode===0?'A right angle looks like the corner of a book.':'Parallel sides run in the same direction and never meet.',mode===0?(right?'Each corner is a right angle, even if the shape is turned.':'Its slanted corners are not right angles.'):(q.shape==='trapezoid'?'This trapezoid has one pair of parallel sides. The other pair would meet if extended.':'Both pairs of opposite sides are parallel.'), ['Yes','No']);break;}
 case 'families': q.shape='square';q.visual='shape';make(pick(r,['Is a square also a rectangle?','Is a square also a quadrilateral?','Is a square also a rhombus?']),'Yes','Look at the properties, not just the name. A shape can belong to more than one family.','A square has four sides, four right angles, and four equal sides. It belongs to all three families!',['Yes','No']);break;
 case 'area': make(mode===0?`How many square tiles cover ${context}’s garden?`:`A garden is ${a} tiles long and ${b} tiles wide. What is its area?`,a*b,`There are ${b} rows with ${a} tiles in each. Count inside the garden.`,`Area counts the squares inside: ${b} groups of ${a} = ${a*b} square tiles.`);if(mode===2){q.type='build';make(`Build a rectangular garden with an area of ${a*b} tiles.`,a*b,'Change the width and height. Multiply them to count the tiles inside.',`Every rectangle with width × height = ${a*b} has this area.`);}break;
 case 'perimeter': q.visual='boundary';make(`A fence goes around this ${a}-by-${b} garden. How many units of fence are needed?`,2*(a+b),`Walk around all four edges: ${a} + ${b} + ${a} + ${b}.`,`Perimeter counts the boundary: ${a} + ${b} + ${a} + ${b} = ${2*(a+b)} units.`);break;
 case 'missingSide': q.visual='missing';make(`This garden covers ${a*b} tiles. Its width is ${a}. How many rows does it have?`,b,`How many groups of ${a} make ${a*b}?`,`There are ${b} rows because ${a} × ${b} = ${a*b}.`);break;
 case 'parts': q.d=pick(r,[3,4,5,6,8]);q.n=int(r,1,q.d-1);q.visual=mode===0?'fractionCircle':'fractionBar';make(`What fraction of this ${mode===0?'sun wheel':'trail bar'} is colored?`,`${q.n}/${q.d}`,`There are ${q.d} equal parts altogether. ${q.n} are colored.`,`The denominator ${q.d} counts all equal parts. The numerator ${q.n} counts the colored parts.`,[`${q.n}/${q.d}`,`${q.d-q.n}/${q.d}`,`${q.n}/${q.d+1}`,`${q.d}/${q.n}`]);break;
 case 'numberLine': q.d=pick(r,[3,4,6,8]);q.n=int(r,1,q.d-1);q.visual='line';make('What fraction is marked on the number line?',`${q.n}/${q.d}`,`Between 0 and 1 there are ${q.d} equal jumps. Count to the dot.`,`The dot is ${q.n} of ${q.d} equal jumps from 0.`,[`${q.n}/${q.d}`,`${q.n+1}/${q.d}`,`${q.n}/${q.d+1}`,'1']);break;
 case 'compare': q.d=pick(r,[4,5,6,8,10]);q.n=int(r,1,q.d-2);q.m=int(r,q.n+1,q.d-1);q.visual='compare';make(`Which is greater: ${q.n}/${q.d} or ${q.m}/${q.d}?`,`${q.m}/${q.d}`,'The pieces are the same size. Which fraction has more pieces?',`${q.m} equal pieces are more than ${q.n} of the same pieces.`,[`${q.n}/${q.d}`,`${q.m}/${q.d}`,'They are equal']);break;
 case 'fractionSum': q.d=pick(r,[4,5,6,8,10]);q.n=int(r,1,q.d-2);q.m=int(r,1,q.d-q.n);q.visual='sum';make(`${context} colors ${q.n}/${q.d} of a trail bar, then ${q.m}/${q.d} more. How much is colored?`,`${q.n+q.m}/${q.d}`,'Add the number of pieces. Their size stays the same.',`${q.n} + ${q.m} = ${q.n+q.m} pieces. Each is still one ${q.d}th.`,[`${q.n+q.m}/${q.d}`,`${q.n+q.m}/${q.d*2}`,`${q.n}/${q.d}`]);break;
 case 'array': make(mode===0?`There are ${b} rows of ${a} crystals. How many crystals altogether?`:`What is ${b} × ${a}? Show it with this array.`,a*b,`Count ${b} groups of ${a}. You can also split the array.`,`${b} × ${a} = ${a*b}. Each row is one equal group.`);break;
 case 'split': q.visual='split';q.cut=Math.floor(a/2);make(`Break ${b} × ${a} into ${b} × ${q.cut} and ${b} × ${a-q.cut}. What is the total?`,a*b,`${b} × ${q.cut} = ${b*q.cut}. ${b} × ${a-q.cut} = ${b*(a-q.cut)}. Add the two parts.`,`${b*q.cut} + ${b*(a-q.cut)} = ${a*b}. Breaking apart changes the steps, not the total.`);break;
 case 'missingFactor': q.visual='missing';make(`${context} has ${a*b} crystals in groups of ${a}. How many groups?`,b,`Try skip-counting by ${a} until you reach ${a*b}.`,`${b} groups of ${a} make ${a*b}: ${a} × ${b} = ${a*b}.`);break;
 default: throw Error(`Unknown skill ${skill}`);
 }
 if(!q.choices&&q.type==='choice'){const ans=Number(q.answer);q.choices=shuffle(r,[...new Set([ans,ans+int(r,1,3),Math.max(0,ans-int(r,1,3)),ans+int(r,4,7)])]).map(String);}else if(q.choices)q.choices=shuffle(r,[...new Set(q.choices)]);
 q.rotation=pick(r,[0,0,15,-15,30]);
 q.fingerprint=JSON.stringify([skill,q.prompt,q.visual,...(q.visual==='shape'?[q.shape,q.rotation]:['fractionCircle','fractionBar','line','compare','sum'].includes(q.visual)?[q.n,q.d,q.m]:[q.type==='build'?null:q.a,q.type==='build'?null:q.b,q.cut])]);
 return q;
}
export function nextQuestion(progress,worldId,sessionSkills=[]){
 const candidates=worlds.filter(w=>!worldId||w.id===worldId).flatMap(w=>w.skills);
 const ranked=candidates.map(skill=>{const s=progress.skills[skill]||{independent:0,total:0,last:0}; const mastery=s.total?s.independent/s.total:0;return {skill,priority:(1-mastery)*3+(s.total?0:1)+(Date.now()-s.last>3*86400000?0.5:0)-(sessionSkills.slice(-2).includes(skill)?3:0)};}).sort((a,b)=>b.priority-a.priority);
 const seen=new Set(progress.seen);let seed=progress.seeds||0;
 for(let i=0;i<4000;i++){seed++;const skill=ranked[i%ranked.length].skill,s=progress.skills[skill];const level=s&&s.independent>=8&&s.independent/s.total>.8?3:s&&s.independent>=3&&s.independent/s.total>.65?2:1;const q=generate(skill,level,seed);if(!seen.has(q.fingerprint))return {...q,seed};}
 throw Error('All current variations explored. Try another island.');
}
export function record(progress,q,{hinted=false,retries=0,skipped=false,duration=0}){
 const old=progress.skills[q.skill]||{total:0,independent:0,supported:0,last:0}; const independent=!hinted&&!retries&&!skipped;
 return {...progress,seeds:q.seed,seen:[...progress.seen,q.fingerprint],skills:{...progress.skills,[q.skill]:{total:old.total+1,independent:old.independent+(independent?1:0),supported:old.supported+(!skipped&&!independent?1:0),last:Date.now()}},attempts:[...progress.attempts,{skill:q.skill,level:q.level,fingerprint:q.fingerprint,representation:q.visual,independent,hinted,retries,skipped,duration,date:Date.now()}].slice(-3000)};
}
export function loadProgress(){try{const p=JSON.parse(localStorage.getItem('mathquest-v1'));if(p?.version===1&&p.skills&&Array.isArray(p.seen)&&Array.isArray(p.attempts)&&Array.isArray(p.sessions))return p;}catch{}return initialProgress();}
