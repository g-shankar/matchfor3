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
   assert.ok(hard.sequence.slice(1).every((x,i)=>x.value-hard.sequence[i].value===5));
   assert.ok(med.sequence[0].value>=20&&med.sequence[0].value<=56);
   assert.ok(hard.sequence[0].value>=40&&hard.sequence[0].value<=95);
  }else if(mode==='times'){
   assert.ok(ml.every(l=>{const t=+l.split('×')[0];return t>=4&&t<=9;}),`medium times labels: ${ml}`);
   assert.ok(hl.every(l=>{const t=+l.split('×')[0];return t>=6&&t<=12;}),`hard times labels: ${hl}`);
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
 for(let s=1000;s<1100;s++)if(makeMathTrail('times','hard',seeded(s)).sequence.some(x=>+x.label.split('×')[0]>=10))sawBigTable=true;
 for(let s=1;s<=40;s++)if(makeMathTrail('money','medium',seeded(s)).sequence.some(x=>x.value>=100))sawBigCent=true;
 assert.ok(sawBigTable,'hard times never dealt a table >=10 in 100 seeds');
 assert.ok(sawBigCent,'medium money never dealt >=100c in 40 seeds');
});
test('medium and hard differ from simple in the expected ways',()=>{
 for(let s=1;s<=40;s++){
  assert.ok(makeMathTrail('times','simple',seeded(s)).sequence.every(x=>{const t=+x.label.split('×')[0];return t>=2&&t<=9;}));
  assert.ok(makeMathTrail('money','hard',seeded(s)).sequence.every(x=>x.label.startsWith('$')));
  assert.ok(makeMathTrail('money','simple',seeded(s)).sequence.every(x=>!x.label.startsWith('$')));
 }
 let sawBig=false;
 for(let s=1000;s<1100;s++)if(makeMathTrail('times','hard',seeded(s)).sequence.some(x=>+x.label.split('×')[0]>9))sawBig=true;
 assert.ok(sawBig,'hard times never exceeded table 9 in 100 seeds');
});
test('medium and hard keep 36 unique cell labels',()=>{for(const mode of Object.keys(trailModes))for(const d of ['medium','hard'])for(let s=1;s<=20;s++){const g=makeMathTrail(mode,d,seeded(s));assert.equal(new Set(g.cells.map(x=>x.label)).size,36,`${mode}/${d}/seed ${s}`);}});
