import test from 'node:test';
import assert from 'node:assert/strict';
import {worlds,generate,initialProgress,nextQuestion,record} from '../src/engine.js';
test('every generated challenge has valid arithmetic and one correct choice',()=>{
 for(const skill of worlds.flatMap(w=>w.skills))for(let level=1;level<=3;level++)for(let seed=1;seed<=300;seed++){
  const q=generate(skill,level,seed);assert.ok(q.prompt&&q.hint&&q.explain);
  if(q.type==='choice'){assert.ok(q.choices.includes(q.answer),`${skill} missing answer`);assert.equal(new Set(q.choices).size,q.choices.length);}
  if(['area','array','split'].includes(skill))assert.equal(+q.answer,q.a*q.b);
  if(skill==='perimeter')assert.equal(+q.answer,2*(q.a+q.b));
  if(['missingSide','missingFactor'].includes(skill))assert.equal(+q.answer,q.b);
  if(skill==='fractionSum'){assert.ok(q.n+q.m<=q.d);assert.equal(q.answer,`${q.n+q.m}/${q.d}`);}
  if(skill==='compare')assert.ok(q.n<q.m&&q.m<q.d);
 }
});
test('fresh challenges are never repeated across saved sessions',()=>{
 let p=initialProgress();let session=[];let fingerprints=new Set();
 for(let i=0;i<1200;i++){let q=nextQuestion(p,null,session);assert.ok(!fingerprints.has(q.fingerprint));fingerprints.add(q.fingerprint);p=record(p,q,{hinted:i%3===0});session.push(q.skill);if(i%8===7)session=[];}
 assert.equal(p.seen.length,1200);
});
test('hints, retries and skips do not count as independent understanding',()=>{
 for(const opts of [{hinted:true},{retries:1},{skipped:true}]){const p=initialProgress();const q=nextQuestion(p,'area');const result=record(p,q,opts);assert.equal(result.skills[q.skill].independent,0);assert.equal(result.skills[q.skill].supported,opts.skipped?0:1);}
});
test('difficulty grows after independent evidence, not supported answers',()=>{
 let p=initialProgress();for(const s of worlds[1].skills)p.skills[s]={total:10,independent:9,supported:1,last:Date.now()};assert.equal(nextQuestion(p,'area').level,3);
 for(const s of worlds[1].skills)p.skills[s].independent=0;assert.equal(nextQuestion(p,'area').level,1);
});
