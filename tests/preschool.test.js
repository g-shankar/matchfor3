import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {littleWorlds,littleLabels,initialPreschool,generateLittle,nextLittle,recordLittle,mergePreschool,countTap,copyMatches,mirrorCompletes} from '../src/preschool-engine.js';
import {naturalVoiceClips} from '../src/natural-voice-clips.js';
test('preschool curriculum has 40 labeled skills in eight play places',()=>{assert.equal(littleWorlds.length,8);const skills=littleWorlds.flatMap(w=>w.skills);assert.equal(skills.length,40);assert.equal(new Set(skills).size,40);assert.ok(skills.every(s=>littleLabels[s]));});
test('every preschool activity has one reachable answer and age-sized choices',()=>{for(const skill of littleWorlds.flatMap(w=>w.skills))for(let seed=1;seed<120;seed++){const q=generateLittle(skill,seed%2+1,seed);assert.ok(q.prompt&&q.art&&q.fingerprint);if(q.type==='copySequence'){assert.equal(q.pattern.length,4);assert.ok(q.pattern.every(p=>q.choices.includes(p)),`${skill} seed ${seed}`);continue;}assert.ok(q.choices.includes(q.answer),`${skill} seed ${seed}`);assert.equal(q.choices.filter(x=>x===q.answer).length,1);assert.ok(q.choices.length>=2&&q.choices.length<=4);}});
test('every preschool prompt has a bundled warm voice recording',()=>{for(const skill of littleWorlds.flatMap(w=>w.skills))for(const level of [1,2])for(let seed=1;seed<500;seed++){const text=generateLittle(skill,level,seed).spoken;assert.ok(naturalVoiceClips[text],`missing recording: ${text}`);}});
test('counting activities require touching each object instead of guessing a choice',()=>{for(const skill of ['count5','count10','artCount'])for(let seed=1;seed<40;seed++){const q=generateLittle(skill,1,seed);assert.equal(q.type,'tapCount');assert.equal(String(q.target),q.answer);assert.ok(q.target>=1);}});
test('counting advances only on distinct object taps and the renderer shows no on-screen count',()=>{
 const src=readFileSync(new URL('../src/preschool-app.jsx',import.meta.url),'utf8');
 assert.ok(!src.includes('tap-count-total'),'tap-count-total markup must be gone from the counting renderer');
 assert.ok(src.includes('countTap(tappedRef.current'),'tapObject must go through the distinct-tap helper');
 for(const skill of ['count5','count10','artCount'])for(let seed=1;seed<40;seed++){
  const q=generateLittle(skill,1,seed);let tapped=[];
  const first=countTap(tapped,0,q.target);assert.ok(first.advanced);assert.deepEqual(first.tapped,[0]);
  const repeat=countTap(first.tapped,0,q.target);assert.ok(!repeat.advanced,'re-tapping the same object must not advance');assert.deepEqual(repeat.tapped,[0]);
  let s=[],last=null;for(let i=0;i<q.target;i++){const r=countTap(s,i,q.target);assert.ok(r.advanced);assert.equal(r.done,i===q.target-1);s=r.tapped;last=r;}
  assert.ok(last.done&&s.length===q.target,'tapping every distinct object completes the count');
  const afterDone=countTap(s,0,q.target);assert.ok(!afterDone.advanced,'re-taps stay dead after completion');
 }});
test('firstLast requires constructing an order',()=>{for(let seed=1;seed<40;seed++){const q=generateLittle('firstLast',1,seed);assert.equal(q.type,'tapOrder');assert.deepEqual([...q.order].sort(),[...q.choices].sort());assert.ok(q.order.length>=2);}});
test('beforeAfter and dailyOrder hide exactly one event and ask for it with picture buttons',()=>{for(const skill of ['beforeAfter','dailyOrder'])for(let seed=1;seed<80;seed++){
 const q=generateLittle(skill,1,seed);assert.equal(q.type,'choice');assert.ok(q.picturesOnly,'buttons must be pictures, never text-labeled');
 assert.ok(['What came first?','What came next?'].includes(q.prompt),`unexpected prompt: ${q.prompt}`);
 assert.equal((q.art.match(/❔/g)||[]).length,1,'exactly one hidden element');
 assert.equal(q.choices.length,2);assert.ok(q.choices.every(c=>q.optionArt[c]));
 assert.ok(!q.art.includes(q.optionArt[q.answer]),'the answer picture must be the hidden one');
 assert.ok(q.choices.filter(c=>c!==q.answer).every(c=>q.art.includes(q.optionArt[c])),'the visible picture must be shown');
}});
test('sorting activities require collecting the whole matching group',()=>{for(const skill of ['sortKind','groups','belongs'])for(let seed=1;seed<40;seed++){const q=generateLittle(skill,1,seed);assert.equal(q.type,'pickAll');assert.equal(q.targets.length,3);assert.equal(q.choices.length,4);assert.ok(q.targets.every(x=>q.choices.includes(x)));assert.equal(q.choices.filter(x=>!q.targets.includes(x)).length,1);}});
test('preschool questions do not repeat and help is counted separately',()=>{let p=initialPreschool();for(let i=0;i<120;i++){const q=nextLittle(p,null);assert.ok(!p.seen.includes(q.fingerprint));p=recordLittle(p,q,{retries:i%2});}assert.equal(p.attempts.length,120);assert.equal(Object.values(p.skills).reduce((n,s)=>n+s.independent,0),60);assert.equal(Object.values(p.skills).reduce((n,s)=>n+s.supported,0),60);});
test('preschool profiles merge without touching either branch or duplicating attempts',()=>{let a=initialPreschool(),b=initialPreschool();const qa=nextLittle(a,'count');a=recordLittle(a,qa,{});const qb=nextLittle(b,'shape');b=recordLittle(b,qb,{retries:1});b.rewards={owned:['frog'],selected:'frog',theme:'ocean',updatedAt:2};b.balloon={best:9,totalTaps:14,drops:1,plays:2,updatedAt:3};b.snake={best:23,totalPickups:5,snips:1,plays:1,updatedAt:4};const m=mergePreschool(a,b);assert.equal(m.attempts.length,2);assert.deepEqual(m.rewards.owned,['frog']);assert.equal(m.rewards.theme,'ocean');assert.equal(m.balloon.best,9);assert.equal(m.balloon.totalTaps,14);assert.equal(m.snake.best,23);assert.equal(m.snake.totalPickups,5);assert.equal(mergePreschool(m,b).attempts.length,2);});
test('First 100 progress merges across browser and Firebase copies',()=>{const a=initialPreschool(),b=initialPreschool();a.first100={seen:['animals:dog'],correct:{'animals:dog':2},missed:{},attempts:[{at:1,shelf:'animals',word:'dog',correct:true}],updatedAt:1};b.first100={seen:['food:apple'],correct:{},missed:{'food:apple':1},attempts:[{at:2,shelf:'food',word:'apple',correct:false}],updatedAt:2};const merged=mergePreschool(a,b);assert.deepEqual(new Set(merged.first100.seen),new Set(['animals:dog','food:apple']));assert.equal(merged.first100.correct['animals:dog'],2);assert.equal(merged.first100.missed['food:apple'],1);assert.equal(merged.first100.attempts.length,2);assert.equal(mergePreschool(merged,b).first100.attempts.length,2);});
test('positions and insideOutside prompts never contain the answer word',()=>{for(const skill of ['positions','insideOutside'])for(let seed=1;seed<80;seed++){
 const q=generateLittle(skill,1,seed);assert.ok(!q.prompt.toLowerCase().includes(q.answer),`${skill} seed ${seed}: prompt leaks the answer`);}});
test('symmetryArt requires picking the true mirror half',()=>{for(let seed=1;seed<80;seed++){
 const q=generateLittle('symmetryArt',1,seed);assert.equal(q.prompt,'Which half finishes the picture?');assert.ok(q.picturesOnly);
 assert.equal(q.choices.length,2);assert.ok(q.choices.includes(q.mirror.wrong));
 assert.ok(mirrorCompletes(q,q.answer),'the true mirror must complete the picture');
 assert.ok(!mirrorCompletes(q,q.mirror.wrong),'the non-mirror half must be rejected');
 assert.ok(q.art.includes(q.mirror.left)&&q.art.includes('┃'),'half-image shown beside a mirror line');}});
test('copyPattern requires reproducing the 4-tile sequence in order',()=>{for(let seed=1;seed<80;seed++){
 const q=generateLittle('copyPattern',1,seed);assert.equal(q.type,'copySequence');assert.equal(q.prompt,'Copy the pattern.');
 assert.equal(q.pattern.length,4);assert.equal(q.choices.length,3);assert.ok(q.picturesOnly);
 assert.ok(q.pattern.every(p=>q.choices.includes(p)),'every pattern tile must be in the tray');
 assert.ok(copyMatches(q.pattern,[...q.pattern]),'the exact sequence is accepted');
 const i=q.pattern.findIndex((x,idx)=>idx>0&&x!==q.pattern[0]),swapped=[...q.pattern];[swapped[0],swapped[i]]=[swapped[i],swapped[0]];
 assert.ok(!copyMatches(q.pattern,swapped),'a wrong order is rejected');
 const distractor=q.choices.find(c=>!q.pattern.includes(c)),withWrong=[...q.pattern.slice(0,3),distractor];
 assert.ok(!copyMatches(q.pattern,withWrong),'a wrong tile is rejected');
 assert.ok(!copyMatches(q.pattern,q.pattern.slice(0,3)),'a short sequence is rejected');}});
test('matchHome never pre-pairs the animal with its home',()=>{for(let seed=1;seed<80;seed++){
 const q=generateLittle('matchHome',1,seed);assert.match(q.prompt,/^Where does the (bird|rabbit|fish) live\?$/);
 assert.ok(!q.art.includes('➜'),'animal must be shown alone, never pre-paired');
 assert.ok(q.picturesOnly,'habitat options must be picture buttons');
 assert.equal(q.choices.length,3);assert.ok(q.choices.every(c=>q.optionArt[c]));
 assert.ok(!Object.values(q.optionArt).some(e=>q.art.includes(e)),'no habitat art may leak into the prompt art');}});
