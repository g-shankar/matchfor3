import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LETTERS,MODES,PHONICS,FIRST_WORDS,ORDER_STARTS,ROUND_LEN,
  letterWord,makeTypingRound,nextTypingQuestion,checkAnswer,promptSpoken,
} from '../src/typing-engine.js';

test('PHONICS covers every letter in "B! buh as in ball" style',()=>{
  assert.deepEqual([...LETTERS].sort(),Object.keys(PHONICS).sort());
  assert.equal(letterWord('B'),'B! buh as in ball');
  assert.ok(letterWord('A').startsWith('A!'));
  assert.ok(letterWord('Z').includes('zebra'));
});

test('FIRST_WORDS covers every letter, X has a text fallback',()=>{
  assert.deepEqual([...LETTERS].sort(),Object.keys(FIRST_WORDS).sort());
  for(const L of LETTERS){
    const e=FIRST_WORDS[L];
    assert.ok(e.word&&e.emoji,`missing word/emoji for ${L}`);
  }
  assert.equal(FIRST_WORDS.X.word,'x-ray');
  assert.ok(FIRST_WORDS.X.textFallback);
});

test('question shapes per mode',()=>{
  const find=nextTypingQuestion('find');
  assert.equal(find.mode,'find');
  assert.ok(LETTERS.includes(find.target));
  assert.ok(find.spoken.includes(find.target));

  const order=nextTypingQuestion('order');
  assert.equal(order.mode,'order');
  assert.equal(order.sequence.length,3);
  const i=LETTERS.indexOf(order.sequence[0]);
  assert.deepEqual(order.sequence,[LETTERS[i],LETTERS[i+1],LETTERS[i+2]]);

  const first=nextTypingQuestion('first');
  assert.equal(first.mode,'first');
  assert.equal(first.word,FIRST_WORDS[first.letter].word);
  assert.ok(first.spoken.includes(first.word));

  const bs=nextTypingQuestion('bigsmall');
  assert.equal(bs.mode,'bigsmall');
  assert.ok(bs.given===bs.letter||bs.given===bs.letter.toLowerCase());
  assert.ok(bs.answer===bs.letter||bs.answer===bs.letter.toLowerCase());
  assert.notEqual(bs.given,bs.answer);
  assert.ok(bs.spoken.length>0);
});

test('makeTypingRound makes full rounds with no repeated target letter',()=>{
  for(const mode of ['find','first','bigsmall']){
    for(let s=0;s<20;s++){
      const round=makeTypingRound(mode,seeded(s));
      assert.equal(round.length,ROUND_LEN);
      const targets=round.map(q=>q.target??q.letter);
      assert.equal(new Set(targets).size,ROUND_LEN,`repeat in ${mode} seed ${s}`);
      assert.ok(round.every(q=>q.mode===mode));
      assert.ok(round.every(q=>promptSpoken(q).length>0));
    }
  }
  const orderRound=makeTypingRound('order');
  assert.equal(orderRound.length,8);
  const letters=orderRound.flatMap(q=>q.sequence);
  assert.equal(new Set(letters).size,24); // no letter appears twice
  assert.ok(orderRound.every(q=>q.mode==='order'));
});

test('makeTypingRound avoids an immediate-repeat first target',()=>{
  const r1=makeTypingRound('find',seeded(3));
  const first1=r1[0].target;
  for(let s=0;s<50;s++){
    const r2=makeTypingRound('find',seeded(s),first1);
    assert.notEqual(r2[0].target,first1,`seed ${s} repeated ${first1}`);
  }
});

test('keyboard mapping accepts upper/lowercase appropriately per mode',()=>{
  const fq={mode:'find',target:'B'};
  assert.ok(checkAnswer('find',fq,'b'));
  assert.ok(checkAnswer('find',fq,'B'));
  assert.ok(!checkAnswer('find',fq,'c'));

  const firstq={mode:'first',letter:'D'};
  assert.ok(checkAnswer('first',firstq,'d'));
  assert.ok(checkAnswer('first',firstq,'D'));
  assert.ok(!checkAnswer('first',firstq,'e'));

  // bigsmall needs the EXACT case
  const low={mode:'bigsmall',letter:'A',given:'a',answer:'A'};
  assert.ok(checkAnswer('bigsmall',low,'A'));
  assert.ok(!checkAnswer('bigsmall',low,'a'));
  const high={mode:'bigsmall',letter:'B',given:'B',answer:'b'};
  assert.ok(checkAnswer('bigsmall',high,'b'));
  assert.ok(!checkAnswer('bigsmall',high,'B'));

  // order: next expected letter, either case
  const oq={mode:'order',sequence:['E','F','G']};
  assert.ok(checkAnswer('order',oq,'e',[]));
  assert.ok(checkAnswer('order',oq,'E',[]));
  assert.ok(!checkAnswer('order',oq,'F',[]));
  assert.ok(checkAnswer('order',oq,'f',['E']));
  assert.ok(!checkAnswer('order',oq,'g',['E']));
  assert.ok(!checkAnswer('order',oq,'F',['E','F','G'])); // finished sequence
});

test('unknown mode falls back to find',()=>{
  const round=makeTypingRound('banana',seeded(7));
  assert.ok(round.every(q=>q.mode==='find'));
  const q=nextTypingQuestion('banana',seeded(7));
  assert.equal(q.mode,'find');
  assert.ok(checkAnswer('banana',{target:'K'},'k'));
  assert.ok(!checkAnswer('banana',{target:'K'},'m'));
});

test('promptSpoken is safe on empty input',()=>{
  assert.equal(promptSpoken(undefined),'');
  assert.equal(promptSpoken(null),'');
});

/* Deterministic rng for repeatable tests (mulberry32). */
function seeded(seed){
  let a=seed>>>0;
  return function(){
    a|=0;a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return((t^(t>>>14))>>>0)/4294967296;
  };
}
