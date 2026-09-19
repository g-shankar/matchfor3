import test from 'node:test';import assert from 'node:assert/strict';import {makeChime} from '../src/chime.js';

function fakeAudio(constructions){
 return class{
  constructor(){constructions.count++;this.state='running';this.currentTime=0;this.destination={};}
  resume(){this.resumed=true;this.state='running';return Promise.resolve();}
  createOscillator(){const events=[];return{type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){events.push('start');},stop(){events.push('stop');},events};}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
 };
}

test('ding reuses one audio context across many correct answers',()=>{
 const constructions={count:0};
 const {ding}=makeChime({Ctor:fakeAudio(constructions)});
 for(let i=0;i<20;i++)assert.equal(ding(),true);
 assert.equal(constructions.count,1);
});

test('ding resumes a suspended context instead of creating a new one',()=>{
 const constructions={count:0};let instance;
 const Audio=fakeAudio(constructions);
 const withCapture=class extends Audio{constructor(){super();instance=this;this.state='suspended';}};
 const {ding}=makeChime({Ctor:withCapture});
 assert.equal(ding(),true);
 assert.equal(constructions.count,1);
 assert.equal(instance.resumed,true);
 assert.equal(ding(),true);
 assert.equal(constructions.count,1);
});

test('ding returns false without an audio engine and never throws',()=>{
 const {ding}=makeChime({});
 assert.equal(ding(),false);
 assert.equal(ding(true),false);
 const throwing=makeChime({Ctor:class{constructor(){throw new Error('no audio');}}});
 assert.equal(throwing.ding(),false);
});
