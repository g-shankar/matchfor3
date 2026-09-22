import test from 'node:test';import assert from 'node:assert/strict';
import {makeMathTrail,trailModes} from '../src/math-trails-engine.js';
const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
test('every math trail has an adjacent eight-step route with unique labels',()=>{for(const mode of Object.keys(trailModes))for(let seed=1;seed<=60;seed++){const game=makeMathTrail(mode,seeded(seed));assert.equal(game.sequence.length,8);assert.equal(game.path.length,8);assert.equal(new Set(game.cells.map(x=>x.label)).size,36);for(let i=1;i<game.path.length;i++)assert.equal(Math.abs(game.path[i][0]-game.path[i-1][0])+Math.abs(game.path[i][1]-game.path[i-1][1]),1);}});

test('simple difficulty is identical to the legacy two-argument call',()=>{for(const mode of Object.keys(trailModes))for(let s=1;s<=30;s++){assert.deepEqual(makeMathTrail(mode,'simple',seeded(s)),makeMathTrail(mode,seeded(s)));}});
test('unknown difficulty falls back to simple',()=>{for(const mode of Object.keys(trailModes))for(let s=1;s<=10;s++){const g=makeMathTrail(mode,'extreme',seeded(s));assert.equal(g.difficulty,'simple');assert.deepEqual(g,makeMathTrail(mode,'simple',seeded(s)));}});
test('medium and hard sequences match the difficulty spec',()=>{
 for(const mode of Object.keys(trailModes))for(let s=1;s<=40;s++){
  const med=makeMathTrail(mode,'medium',seeded(s)),hard=makeMathTrail(mode,'hard',seeded(s));
  assert.equal(med.difficulty,'medium');assert.equal(hard.difficulty,'hard');
  const ml=med.sequence.map(x=>x.label),hl=hard.sequence.map(x=>x.label);
  if(mode==='decimals'){
   assert.ok(ml.every(l=>/^\d+\.\d$/.test(l)),`medium decimals labels: ${ml}`);
   assert.ok(hl.every(l=>/^\d+\.\d\d$/.test(l)),`hard decimals labels: ${hl}`);
   assert.ok(med.sequence.every(x=>x.value>=1&&x.value<=3.6));
   assert.ok(hard.sequence.every(x=>x.value>=1&&x.value<5.1));
  }else if(mode==='geometry'){
   assert.ok(med.sequence.slice(1).every((x,i)=>x.value-med.sequence[i].value===4));
   assert.ok(hard.sequence.slice(1).every((x,i)=>x.value-hard.sequence[i].value===10),`hard geometry step: ${hl}`);
   assert.ok(med.sequence[0].value>=20&&med.sequence[0].value<=56);
   assert.ok(hard.sequence[0].value>=40&&hard.sequence[0].value<=140);
   assert.ok(hard.sequence.every(x=>x.value%2===0),`hard geometry perimeter not even: ${hl}`);
  }else if(mode==='times'){
   const timesShape=g=>g.sequence.every((x,i)=>x.mult===i+1&&x.question===`${x.table}×${i+1}`&&x.label===String(x.table*(i+1))&&x.value===x.table*(i+1));
   assert.ok(med.sequence.every(x=>x.table>=4&&x.table<=9),`medium times tables: ${ml}`);
   assert.ok(hard.sequence.every(x=>x.table>=6&&x.table<=12),`hard times tables: ${hl}`);
   assert.ok(timesShape(med)&&timesShape(hard),'times route items carry question/product/table/mult');
  }else if(mode==='fractions'){
   assert.ok(ml.every(l=>['6','9','14'].includes(l.split('/')[1])),`medium fractions labels: ${ml}`);
   assert.ok(hl.every(l=>['7','11','13'].includes(l.split('/')[1])),`hard fractions labels: ${hl}`);
  }else if(mode==='money'){
   assert.ok(ml.every(l=>l.endsWith('¢')),`medium money labels: ${ml}`);
   assert.ok(hl.every(l=>l.startsWith('$')),`hard money labels: ${hl}`);
  }else if(mode==='time'){
   assert.ok(ml.every(l=>[0,10,20,30,40,50].includes(+l.split(':')[1])),`medium time labels: ${ml}`);
   assert.ok(hl.every(l=>+l.split(':')[1]%5===0),`hard time labels: ${hl}`);
  }
 }
 let sawBigTable=false,sawBigCent=false;
 for(let s=1000;s<1100;s++)if(makeMathTrail('times','hard',seeded(s)).sequence.some(x=>x.table>=10))sawBigTable=true;
 for(let s=1;s<=40;s++)if(makeMathTrail('money','medium',seeded(s)).sequence.some(x=>x.value>=100))sawBigCent=true;
 assert.ok(sawBigTable,'hard times never dealt a table >=10 in 100 seeds');
 assert.ok(sawBigCent,'medium money never dealt >=100c in 40 seeds');
});
test('medium and hard differ from simple in the expected ways',()=>{
 for(let s=1;s<=40;s++){
  assert.ok(makeMathTrail('times','simple',seeded(s)).sequence.every(x=>x.table>=2&&x.table<=9));
  assert.ok(makeMathTrail('money','hard',seeded(s)).sequence.every(x=>x.label.startsWith('$')));
  assert.ok(makeMathTrail('money','simple',seeded(s)).sequence.every(x=>!x.label.startsWith('$')));
 }
 let sawBig=false;
 for(let s=1000;s<1100;s++)if(makeMathTrail('times','hard',seeded(s)).sequence.some(x=>x.table>9))sawBig=true;
 assert.ok(sawBig,'hard times never exceeded table 9 in 100 seeds');
});
test('medium and hard keep 36 unique cell labels',()=>{for(const mode of Object.keys(trailModes))for(const d of ['medium','hard'])for(let s=1;s<=20;s++){const g=makeMathTrail(mode,d,seeded(s));assert.equal(new Set(g.cells.map(x=>x.label)).size,36,`${mode}/${d}/seed ${s}`);}});
test('times boards show products only — no × anywhere, all cells numeric',()=>{for(const d of ['simple','medium','hard'])for(let s=1;s<=40;s++){const g=makeMathTrail('times',d,seeded(s));assert.ok(g.cells.every(c=>!c.label.includes('×')),`× on a times/${d}/seed ${s} board`);assert.ok(g.cells.every(c=>/^\d+$/.test(c.label)&&c.value===+c.label),`non-numeric times cell on ${d}/seed ${s}`);}});
test('times decoys include near-miss products of route values',()=>{const seen=new Set();for(const d of ['medium','hard'])for(let s=1;s<=60;s++){const g=makeMathTrail('times',d,seeded(s)),decoys=g.cells.filter(c=>c.routeIndex<0).map(c=>+c.label),table=g.sequence[0].table,nmSpace=new Set();for(const x of g.sequence)for(const off of [table,-table,1,-1,2,-2]){const c=x.value+off;if(c>=1)nmSpace.add(c);}if(decoys.some(l=>nmSpace.has(l)))seen.add(d);}assert.ok(seen.has('medium')&&seen.has('hard'),'near-miss decoys never appeared on medium/hard times boards');});
test('times keeps 36 unique labels on every difficulty',()=>{for(const d of ['simple','medium','hard'])for(let s=1;s<=100;s++){const g=makeMathTrail('times',d,seeded(s));assert.equal(new Set(g.cells.map(x=>x.label)).size,36,`times/${d}/seed ${s}`);}});

test('decimals ask chain is correct and never leaks the answer',()=>{
 for(const d of ['simple','medium','hard'])for(let s=1;s<=40;s++){
  const g=makeMathTrail('decimals',d,seeded(s));
  g.sequence.forEach((x,i)=>{
   const prev=i===0?x.ask.split(' → ')[0]:g.sequence[i-1].label;
   assert.equal(x.ask.split(' → ')[0],prev,`decimals/${d}/seed ${s} item ${i}: ask prev mismatch`);
   if(i>0)assert.equal(x.ask.split(' → ')[0],g.sequence[i-1].label);
   assert.ok(!x.ask.includes(x.label),`decimals/${d}/seed ${s}: ask contains answer label ${x.label}`);
   assert.ok(!x.question.includes(x.label),`decimals/${d}/seed ${s}: question contains answer label ${x.label}`);
   assert.ok(/^What comes after .+\?$/.test(x.question));
  });
  // integer-unit arithmetic: labels re-derive exactly from the value, no float dust
  for(const x of g.sequence){
   const again=d==='hard'?+(Math.round(x.value*100)/100).toFixed(2):+(Math.round(x.value*10)/10).toFixed(1);
   assert.equal(x.label,d==='hard'?again.toFixed(2):again.toFixed(1));
  }
 }
});
test('fractions ask chain is correct and never leaks the answer',()=>{
 for(const d of ['simple','medium','hard'])for(let s=1;s<=40;s++){
  const g=makeMathTrail('fractions',d,seeded(s)),dd=g.sequence[0].label.split('/')[1];
  g.sequence.forEach((x,i)=>{
   const prev=x.ask.split(' → ')[0];
   if(i===0)assert.equal(prev,`0/${dd}`,`fractions/${d}/seed ${s}: first ask should start from 0/${dd}`);
   else assert.equal(prev,g.sequence[i-1].label,`fractions/${d}/seed ${s} item ${i}: ask prev mismatch`);
   assert.ok(!x.ask.includes(x.label),`fractions/${d}/seed ${s}: ask contains answer label ${x.label}`);
   assert.ok(!x.question.includes(x.label),`fractions/${d}/seed ${s}: question contains answer label ${x.label}`);
   assert.ok(x.question.endsWith('on the way to one whole?'));
  });
 }
});
test('geometry: hard perimeters even, integer sides satisfy 2(a+b)===P, area decoy appears',()=>{
 for(let s=1;s<=200;s++){
  const g=makeMathTrail('geometry','hard',seeded(s));
  for(const x of g.sequence){
   assert.ok(x.value%2===0,`geometry/hard/seed ${s}: perimeter ${x.value} not even`);
   const[a,b]=x.sides;
   assert.ok(Number.isInteger(a)&&Number.isInteger(b)&&a>=2&&b>=2,`geometry/hard/seed ${s}: bad sides ${a},${b}`);
   assert.equal(2*(a+b),x.value,`geometry/hard/seed ${s}: 2(${a}+${b})!==${x.value}`);
  }
 }
 // simple/medium unchanged: ranges and steps from the original spec
 for(let s=1;s<=40;s++){
  const sm=makeMathTrail('geometry','simple',seeded(s)),md=makeMathTrail('geometry','medium',seeded(s));
  assert.ok(sm.sequence[0].value>=12&&sm.sequence[0].value<=22);
  assert.ok(sm.sequence.slice(1).every((x,i)=>x.value-sm.sequence[i].value===2));
  assert.ok(md.sequence.slice(1).every((x,i)=>x.value-md.sequence[i].value===4));
  for(const x of[...sm.sequence,...md.sequence]){const[a,b]=x.sides;assert.equal(2*(a+b),x.value);}
 }
 // area-misconception decoy (a*b cm) shows up on medium/hard boards
 const seen=new Set();
 for(const d of ['medium','hard'])for(let s=1;s<=80;s++){
  const g=makeMathTrail('geometry',d,seeded(s));
  const areas=new Set(g.sequence.map(x=>{const[a,b]=x.sides;return `${a*b} cm`;}));
  if(g.cells.some(c=>c.routeIndex<0&&areas.has(c.label)&&c.value===+c.label.replace(' cm','')))seen.add(d);
 }
 assert.ok(seen.has('medium')&&seen.has('hard'),'area decoy never appeared on medium/hard geometry boards');
});
test('money: coins sum to value cents and every tier is a multiple of 5c',()=>{
 for(const d of ['simple','medium','hard'])for(let s=1;s<=60;s++){
  const g=makeMathTrail('money',d,seeded(s));
  for(const x of g.sequence){
   const cents=d==='hard'?Math.round(x.value*100):x.value; // simple/medium values are already cents
   assert.equal(cents%5,0,`money/${d}/seed ${s}: ${x.label} not a multiple of 5c`);
   assert.equal(x.coins.reduce((a,b)=>a+b,0),cents,`money/${d}/seed ${s}: coins ${x.coins} do not sum to ${cents}c`);
   assert.ok(x.coins.every(c=>[100,25,10,5,1].includes(c)),`money/${d}/seed ${s}: bad denom in ${x.coins}`);
   assert.equal(x.question,'How much money is this? Count the coins.');
  }
 }
});
test('time: h/m decode matches label and hand angles are sane',()=>{
 for(const d of ['simple','medium','hard'])for(let s=1;s<=60;s++){
  const g=makeMathTrail('time',d,seeded(s));
  for(const x of g.sequence){
   const[h,m]=x.label.split(':').map(Number);
   assert.equal(x.h,h,`time/${d}/seed ${s}: h ${x.h} != label ${x.label}`);
   assert.equal(x.m,m,`time/${d}/seed ${s}: m ${x.m} != label ${x.label}`);
   assert.equal(x.value,x.h*60+x.m);
   const minAngle=x.m*6,hourAngle=(x.h%12+x.m/60)*30;
   assert.ok(minAngle>=0&&minAngle<360&&minAngle%6===0,`time/${d}/seed ${s}: bad minute angle ${minAngle}`);
   assert.ok(hourAngle>=0&&hourAngle<360,`time/${d}/seed ${s}: bad hour angle ${hourAngle}`);
   assert.equal(x.question,'What time is it on the clock?');
  }
 }
});
test('regression: strip/coach text cannot identify the target cell — the old text-match bot fails',()=>{
 const tokenHit=(text,label)=>{const esc=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(^|[^0-9A-Za-z])${esc}([^0-9A-Za-z]|$)`).test(text);};
 const cheers=['Nice move!','Great spotting!','Path power!','You found it!','Brilliant!','Keep going!']; // mirrors TrailGame
 for(const mode of ['decimals','geometry','fractions','money','time'])for(const d of ['simple','medium','hard'])for(let s=1;s<=40;s++){
  const g=makeMathTrail(mode,d,seeded(s));
  for(let step=0;step<8;step++){
   // visible texts at this step, mirroring TrailGame's strip + coach composition
   const texts=g.sequence.map((x,i)=>i<step?'✓':i===step?(mode==='decimals'||mode==='fractions'?x.ask:'?'):'?');
   const q=g.sequence[step].question;
   for(const cheer of cheers)texts.push(`${cheer} ${q}`);
   // no upcoming route label (incl. the target) may appear as a token in any visible text
   for(let j=step;j<8;j++){
    const lab=g.sequence[j].label;
    for(const t of texts)assert.ok(!tokenHit(t,lab),`${mode}/${d}/seed ${s} step ${step}: upcoming label "${lab}" visible in "${t}"`);
   }
   // bot simulation: it may only read strip/coach text and text-match labels — it must not find the target cell
   const matched=g.cells.filter(c=>texts.some(t=>tokenHit(t,c.label)));
   assert.ok(!matched.some(c=>c.routeIndex===step),`${mode}/${d}/seed ${s} step ${step}: text-match bot identified the target cell`);
  }
 }
});
