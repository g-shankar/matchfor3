export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export const pick=(r,a)=>a[Math.floor(r()*a.length)];
export const int=(r,a,b)=>Math.floor(r()*(b-a+1))+a;
export const shuffle=(r,list)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=int(r,0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function answerMatches(q,value){
 if(q.type==='selectMany')return Array.isArray(value)&&JSON.stringify([...value].sort())===q.answer;
 if(q.type==='order')return Array.isArray(value)&&JSON.stringify(value)===q.answer;
 const given=String(value).trim(),expected=String(q.answer).trim();
 if(/^\d+\/\d+$/.test(expected)&&/^\d+\s*\/\s*\d+$/.test(given)){const [a,b]=given.split('/').map(Number),[n,d]=expected.split('/').map(Number);return b>0&&a*d===n*b;}
 if(/^-?\d+(\.\d+)?$/.test(expected))return /^-?\d+(\.\d+)?$/.test(given)&&Number(given)===Number(expected);
 return given.toLowerCase()===expected.toLowerCase();
}
export function misconceptionHint(q,value){const n=Number(value);if(q.skill==='area'&&q.type!=='build'&&n===2*(q.a+q.b))return 'That counts around the edge. Area counts all the squares inside. Try counting one row, then all the rows.';if(q.skill==='perimeter'&&n===q.a*q.b)return 'That counts the tiles inside. For a fence, walk around the four edges and add their lengths.';if(q.skill==='fractionSum'&&String(value)===`${q.n+q.m}/${q.d*2}`)return 'The pieces keep the same size when you put them together. Add the pieces you have, and keep the denominator the same.';return q.hint;}
