import test from 'node:test';import assert from 'node:assert/strict';
import {checkGateEntry,makeRunnerLevel,runnerQuestion,runnerLevels,shuffled} from '../src/maze-runner-engine.js';
const seeded=seed=>{let s=Math.imul(seed^0x9E3779B9,2654435761)>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);};
test('Shivani maze levels scale routes and put math gates on the solution',()=>{for(const level of Object.keys(runnerLevels))for(let seed=1;seed<=40;seed++){const run=makeRunnerLevel(level,seeded(seed));assert.equal(run.size,runnerLevels[level].size);assert.equal(run.gates.length,runnerLevels[level].gates);const route=new Set(run.solution.map(x=>x.join(',')));assert.ok(run.gates.every(g=>route.has(g.cell)));assert.ok(run.gems.every(g=>run.open.has(g)));}});
test('maze runner questions are constructed-response: no choices, integer answers',()=>{for(const level of Object.keys(runnerLevels))for(let seed=1;seed<=200;seed++){const q=runnerQuestion(level,seeded(seed));assert.ok(!('choices' in q),'choices must be gone');assert.equal(Number.isInteger(q.answer),true);assert.ok(q.answer>=0,'answers never negative');assert.ok(q.answer<=144,'answers bounded ≤144');assert.equal(typeof q.prompt,'string');assert.ok(q.prompt.length>0);}});
test('answer domain per level; divisions are always exact',()=>{for(let seed=1;seed<=300;seed++){
 const e=runnerQuestion('easy',seeded(seed));assert.ok(e.answer>=0&&e.answer<=40,`easy out of domain: ${e.prompt}=${e.answer}`);
 const m=runnerQuestion('medium',seeded(seed*7+1));assert.ok(m.answer>=2&&m.answer<=100,`medium out of domain: ${m.prompt}=${m.answer}`);
 if(m.prompt.includes('÷')){const[t,,d]=m.prompt.split(' ');assert.equal(Number(t)%Number(d),0,`division not exact: ${m.prompt}`);assert.equal(Number(t)/Number(d),m.answer,`division answer wrong: ${m.prompt}`);}
 const h=runnerQuestion('hard',seeded(seed*13+2));assert.ok(h.answer>=1&&h.answer<=144,`hard out of domain: ${h.prompt}=${h.answer}`);}});
test('shuffled is a Fisher-Yates permutation without positional bias',()=>{const src=[0,1,2,3,4,5,6,7,8,9];
 for(let seed=1;seed<=50;seed++){const out=shuffled(src,seeded(seed));assert.deepEqual([...out].sort((x,y)=>x-y),src,'must be a permutation');assert.deepEqual(src,[0,1,2,3,4,5,6,7,8,9],'must not mutate input');}
 // The old sort(()=>random()-.5) parked values at the ends ~66% of the time; each of the 10
 // positions should now receive value 0 about 1/10 of the time (expected 200 over 2000 draws).
 const counts=new Array(10).fill(0);for(let seed=1;seed<=2000;seed++)counts[shuffled(src,seeded(seed)).indexOf(0)]++;
 for(const c of counts)assert.ok(c>120&&c<300,`positional bias detected: ${counts}`);});
test('checkGateEntry accepts exact numeric entry (incl. multi-digit), rejects wrong without side effects',()=>{
 assert.ok(checkGateEntry('7',7),'single digit');
 assert.ok(checkGateEntry('144',144),'multi-digit');
 assert.ok(checkGateEntry('0',0),'zero answer');
 assert.ok(checkGateEntry('012',12),'leading zeros harmless');
 assert.ok(!checkGateEntry('8',7),'wrong single digit');
 assert.ok(!checkGateEntry('143',144),'wrong multi-digit');
 assert.ok(!checkGateEntry('',0),'empty entry never opens, even for answer 0');
 assert.ok(!checkGateEntry('',7),'empty entry rejected');
 assert.ok(!checkGateEntry('abc',7),'non-numeric rejected');
 assert.ok(!checkGateEntry('7 ',7),'whitespace-padded rejected');
 assert.ok(!checkGateEntry('-7',-7),'negative form rejected (domain is non-negative)');
 // purity: no side effects on the engine — repeated calls are identical and touch nothing
 const q=runnerQuestion('hard',seeded(42)),before=JSON.stringify(q);
 for(let i=0;i<100;i++)checkGateEntry('12',q.answer);
 assert.equal(JSON.stringify(q),before,'checkGateEntry must not mutate anything');});
