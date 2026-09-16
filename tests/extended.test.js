import test from 'node:test';
import assert from 'node:assert/strict';
import {worlds,generate,initialProgress,nextQuestion,record} from '../src/engine.js';
import {skillInfo,skillCount,availableSkills,practiceLevel,stickerCollection} from '../src/curriculum.js';
import {answerMatches,misconceptionHint} from '../src/math-utils.js';
import {reflectionSchedule} from '../src/reflection.js';
test('all 50 skills have valid metadata and reachable prerequisites',()=>{assert.equal(skillCount,50);const ids=worlds.flatMap(w=>w.skills);assert.equal(new Set(ids).size,50);for(const id of ids){assert.ok(skillInfo[id]);for(const p of skillInfo[id].prerequisites)assert.ok(ids.includes(p));}});
test('new challenges independently satisfy arithmetic, fraction, and measurement invariants',()=>{
 for(const skill of worlds.flatMap(w=>w.skills))for(let level=1;level<=3;level++)for(let seed=1;seed<=160;seed++){
 const q=generate(skill,level,seed),m=q.model||{};assert.ok(!q.prompt.includes('undefined')&&!q.explain.includes('NaN'),skill);assert.ok(answerMatches(q,q.type==='selectMany'||q.type==='order'?JSON.parse(q.answer):q.answer),skill);
 if(skill==='compositeArea')assert.equal(+q.answer,m.w1*m.h1+m.w2*m.h2);
 if(skill==='sameArea'){assert.equal(+q.answer,m.a*m.b);assert.ok(Array.from({length:24},(_,i)=>i+1).some(w=>+q.answer%w===0&&+q.answer/w<=24&&[w,+q.answer/w].sort((a,b)=>a-b).join(',')!==q.original.sort((a,b)=>a-b).join(',')),'Different garden exists within builder bounds');}
 if(skill==='missingPerimeter')assert.equal(+q.answer,(m.perimeter-2*m.width)/2);
 if(skill==='equivalent'){const [n,d]=q.answer.split('/').map(Number);assert.equal(n*m.d,m.n*d);}
 if(skill==='compareNumerator'){const [n,d]=q.answer.split('/').map(Number);assert.ok(n/d>m.n/m.e);}
 if(skill==='fractionDifference')assert.equal(q.answer,`${q.n-q.m}/${q.d}`);
 if(skill==='fractionWhole')assert.equal(q.answer,`${q.d-q.n}/${q.d}`);
 if(skill==='divideShare')assert.equal(+q.answer,q.a);
 if(skill==='divideGroup')assert.equal(+q.answer,q.b);
 if(skill==='money')assert.equal(+q.answer,m.coins.reduce((s,c)=>s+c,0));
 if(skill==='length')assert.equal(+q.answer,m.end-m.start);
 if(['placeValue','expanded'].includes(skill))assert.ok(Number.isInteger(+q.answer));
 if(skill==='elapsed'){const [h,minute]=m.start.split(':').map(Number),[eh,em]=q.answer.split(':').map(Number);assert.equal((eh*60+em-(h*60+minute)+720)%720,m.duration);}
 }
});
test('adaptive recommendations respect foundations while direct exploration stays open',()=>{const p=initialProgress();assert.ok(!availableSkills(p,'area').includes('missingSide'));assert.equal(nextQuestion(p,'area',[],{skillId:'compositeArea'}).skill,'compositeArea');p.skills.area={total:4,independent:3,supported:1,last:Date.now()};assert.ok(availableSkills(p,'area').includes('missingSide'));});
test('recent struggles lower difficulty even after a strong early history',()=>{const p=initialProgress();p.skills.area={total:30,independent:27,supported:3,last:Date.now()};p.attempts=Array.from({length:8},()=>({skill:'area',independent:false}));assert.equal(practiceLevel(p,'area'),1);});
test('mixed journeys include strong-skill warmups and preserve focus practice',()=>{const p=initialProgress();assert.equal(skillInfo[nextQuestion(p,null,[]).skill].world,'numbers');assert.ok(worlds.find(w=>w.id===skillInfo[nextQuestion(p,null,['placeValue']).skill].world).focus);assert.equal(skillInfo[nextQuestion(p,null,Array(6).fill('area')).skill].world,'measure');});
test('representation evidence survives recording and assistance never earns independent evidence',()=>{let p=initialProgress(),q=nextQuestion(p,'fractions',[],{skillId:'shadeFraction'});p=record(p,q,{hinted:true});assert.equal(p.skills.shadeFraction.representations.paint.total,1);assert.equal(p.skills.shadeFraction.representations.paint.independent,0);});
test('answer checking accepts equal fractions and numeric strings but rejects malformed numbers',()=>{assert.equal(answerMatches({type:'input',answer:'2/4'},'1 / 2'),true);assert.equal(answerMatches({type:'input',answer:'12'},'12 shells'),false);assert.equal(answerMatches({type:'input',answer:'1/2'},'1/0'),false);assert.equal(answerMatches({type:'selectMany',answer:'["a","b"]'},['b','a']),true);assert.equal(answerMatches({type:'order',answer:'["a","b"]'},['b','a']),false);});
test('hints distinguish area from perimeter and four-question reflection stops stay in bounds',()=>{assert.ok(misconceptionHint({skill:'area',a:3,b:4,type:'choice',hint:'fallback'},14).includes('inside'));assert.ok(misconceptionHint({skill:'perimeter',a:3,b:4,hint:'fallback'},12).includes('four edges'));for(let i=0;i<100;i++){const stops=reflectionSchedule(Math.random,4);assert.ok(stops[0]<2&&stops[1]>=2&&stops[1]<4);}});
