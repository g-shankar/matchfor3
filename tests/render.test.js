import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build} from 'esbuild';
import {worlds,generate} from '../src/engine.js';
const require=createRequire(import.meta.url);
const result=await build({stdin:{contents:'export {Visual} from "./src/visuals.jsx"; export {ActivityInput} from "./src/activities.jsx";',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'shared-react',setup(b){b.onResolve({filter:/^(react|lucide-react)$/},args=>({path:pathToFileURL(require.resolve(args.path)).href,external:true}));}}]});
let Visual,ActivityInput;try{({Visual,ActivityInput}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`));}catch(e){throw Error(e.message);}
test('every skill and response template renders an actual model or activity',()=>{
 const noop=()=>{};
 for(const skill of worlds.flatMap(w=>w.skills))for(let level=1;level<=3;level++)for(let seed=1;seed<=16;seed++){
  const q=generate(skill,level,seed);
  const visual=renderToStaticMarkup(React.createElement(Visual,{q,bw:3,bh:4}));
  const input=renderToStaticMarkup(React.createElement(ActivityInput,{q,solved:false,typed:'',setTyped:noop,chosen:[],setChosen:noop,painted:[],setPainted:noop,point:null,setPoint:noop,check:noop}));
  assert.ok((visual+input).length>0,`${skill} ${q.visual} has no visible activity`);
  assert.ok(!(visual+input).includes('NaN'),`${skill} invalid geometry`);
  if(q.type==='shade')assert.equal((input.match(/aria-label="Piece /g)||[]).length,q.d);
  if(q.type==='point')assert.equal((input.match(/aria-label="Tick /g)||[]).length,q.d+1);
 }
});
