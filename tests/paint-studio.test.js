import test from 'node:test';import assert from 'node:assert/strict';
import {colors,colorNames,brushes,stamps,shapes,papers,PROMPTS,mixMap,mixResult,nextPrompt} from '../src/paint-studio-logic.js';

test('mixResult covers the classic color pairs',()=>{
  assert.equal(mixResult('#ef6b67','#f1bd46'),'orange');
  assert.equal(mixResult('#4e9dcc','#f1bd46'),'green');
  assert.equal(mixResult('#4e9dcc','#ef6b67'),'purple');
});

test('mixResult is order independent',()=>{
  assert.equal(mixResult('#f1bd46','#ef6b67'),'orange');
  assert.equal(mixResult('#ffffff','#2b2b2b'),'gray');
  assert.equal(mixResult('#f47ac2','#4e9dcc'),'violet');
});

test('mixResult covers the new color pairs',()=>{
  assert.equal(mixResult('#ef6b67','#ffffff'),'pink');
  assert.equal(mixResult('#2b2b2b','#ffffff'),'gray');
  assert.equal(mixResult('#f1bd46','#f28c38'),'golden yellow');
  assert.equal(mixResult('#f47ac2','#ffffff'),'baby pink');
  assert.equal(mixResult('#4e9dcc','#62a96b'),'teal');
  assert.equal(mixResult('#2b2b2b','#ef6b67'),'maroon');
});

test('mixResult falls back to a new color for unknown pairs',()=>{
  assert.equal(mixResult('#ef6b67','#123456'),'a new color');
  assert.equal(mixResult('#000000','#111111'),'a new color');
});

test('every mixMap key is stored with sorted colors',()=>{
  for(const k of Object.keys(mixMap)){
    const parts=k.split('|');
    assert.deepEqual([...parts].sort(),parts,`unsorted key ${k}`);
  }
});

test('nextPrompt never repeats immediately and cycles through all prompts',()=>{
  assert.ok(PROMPTS.length>=8,`expected at least 8 prompts, got ${PROMPTS.length}`);
  let i=0;
  const seen=new Set();
  for(let n=0;n<PROMPTS.length;n++){
    const prev=i;
    i=nextPrompt(i);
    assert.notEqual(i,prev,'immediate repeat');
    seen.add(i);
  }
  assert.equal(seen.size,PROMPTS.length,'did not visit every prompt');
  assert.equal(i,0,'should wrap back to the start');
  assert.equal(nextPrompt(PROMPTS.length-1),0);
});

test('all 10 colors have friendly names',()=>{
  assert.equal(colors.length,10);
  for(const c of colors)assert.ok(colorNames[c],`missing name for ${c}`);
});

test('stamp, shape, brush, and paper collections are complete',()=>{
  assert.ok(stamps.length>=12,`expected 12+ stamps, got ${stamps.length}`);
  for(const s of ['🐶','🐱','🦁','🐘','🦋','🐟'])assert.ok(stamps.includes(s),`missing animal stamp ${s}`);
  for(const s of ['🚗','🚀','✈️','🚂'])assert.ok(stamps.includes(s),`missing vehicle stamp ${s}`);
  for(const s of ['🍎','🍦','🍕','🌮'])assert.ok(stamps.includes(s),`missing food stamp ${s}`);
  for(const s of ['●','■','▲','♥','★','⬟','🔷','🌙','☀'])assert.ok(shapes.includes(s),`missing shape ${s}`);
  assert.deepEqual(brushes.map(b=>b.id),['classic','neon','rainbow','spray']);
  assert.deepEqual(papers.map(p=>p.id),['white','night','sky']);
});

test('stamp marks store the mirror flag so Mirror magic applies to stamps',async()=>{
  const {readFileSync}=await import('node:fs');
  const {fileURLToPath}=await import('node:url');
  const {dirname,join}=await import('node:path');
  const src=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..','src','paint-studio.jsx'),'utf8');
  const stampMark=src.match(/\{type:'stamp'[^}]*\}/);
  assert.ok(stampMark,`no stamp mark creation found`);
  assert.ok(/mirror/.test(stampMark[0]),`stamp mark does not store the mirror flag: ${stampMark[0]}`);
});
