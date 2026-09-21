/* Typing games engine — pure logic, no React.
 * Four kid-simple modes: find the letter, ABC order, first letter, big & small.
 * Rounds never repeat a target letter; keyboard mapping accepts the right case
 * per mode; unknown modes fall back to 'find'. */

export const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MODES=['find','order','first','bigsmall'];

export const MODE_INFO={
  find:{label:'Find the Letter',icon:'🔍',blurb:'Hear a letter, then tap it!'},
  order:{label:'ABC Order',icon:'🔤',blurb:'Tap the letters in A-B-C order!'},
  first:{label:'First Letter',icon:'🍎',blurb:'What letter does the word start with?'},
  bigsmall:{label:'Big & Small',icon:'🔠',blurb:'Match little a with BIG A!'},
};

/* Phonics prompts, "B! buh as in ball" style. letterWord(letter) returns the
 * spoken prompt for a letter. */
export const PHONICS={
  A:'A! ah as in apple',B:'B! buh as in ball',C:'C! kuh as in cat',
  D:'D! duh as in dog',E:'E! eh as in egg',F:'F! fff as in fish',
  G:'G! guh as in grapes',H:'H! huh as in hat',I:'I! ih as in ice cream',
  J:'J! juh as in juice',K:'K! kuh as in kite',L:'L! lll as in lion',
  M:'M! mmm as in moon',N:'N! nnn as in nose',O:'O! oh as in owl',
  P:'P! puh as in pig',Q:'Q! kwuh as in queen',R:'R! rrr as in rabbit',
  S:'S! sss as in sun',T:'T! tuh as in tiger',U:'U! uh as in umbrella',
  V:'V! vvv as in van',W:'W! wuh as in whale',X:'X! ks as in x-ray',
  Y:'Y! yuh as in yo-yo',Z:'Z! zzz as in zebra',
};

export function letterWord(letter){
  const L=String(letter||'').toUpperCase();
  return PHONICS[L]||`${L}!`;
}

/* First-letter game data: letter -> {word, emoji}. Widely-supported emoji;
 * X shows the word as text too because 🩻 is newer. */
export const FIRST_WORDS={
  A:{word:'apple',emoji:'🍎'},B:{word:'ball',emoji:'⚽'},
  C:{word:'cat',emoji:'🐱'},D:{word:'dog',emoji:'🐶'},
  E:{word:'egg',emoji:'🥚'},F:{word:'fish',emoji:'🐟'},
  G:{word:'grapes',emoji:'🍇'},H:{word:'hat',emoji:'🎩'},
  I:{word:'ice cream',emoji:'🍦'},J:{word:'juice',emoji:'🧃'},
  K:{word:'kite',emoji:'🪁'},L:{word:'lion',emoji:'🦁'},
  M:{word:'moon',emoji:'🌙'},N:{word:'nose',emoji:'👃'},
  O:{word:'owl',emoji:'🦉'},P:{word:'pig',emoji:'🐷'},
  Q:{word:'queen',emoji:'👸'},R:{word:'rabbit',emoji:'🐰'},
  S:{word:'sun',emoji:'☀️'},T:{word:'tiger',emoji:'🐯'},
  U:{word:'umbrella',emoji:'☂️'},V:{word:'van',emoji:'🚐'},
  W:{word:'whale',emoji:'🐳'},X:{word:'x-ray',emoji:'🩻',textFallback:true},
  Y:{word:'yo-yo',emoji:'🪀'},Z:{word:'zebra',emoji:'🦓'},
};

export const ROUND_LEN=8;

function normMode(mode){return MODES.includes(mode)?mode:'find';}

function shuffled(rng){
  const arr=[...LETTERS];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

/* ABC-order questions are consecutive letter windows: A–C, D–F, … V–X.
 * A round walks the whole alphabet in order — that IS the lesson. */
export const ORDER_STARTS=['A','D','G','J','M','P','S','V'];

function nextOf(L){
  const i=LETTERS.indexOf(L);
  return LETTERS[i+1];
}

function orderQuestion(start){
  const sequence=[start,nextOf(start),nextOf(nextOf(start))];
  return {
    mode:'order',
    start,
    sequence,
    spoken:`Tap ${sequence.join(', ')} in ABC order!`,
  };
}

function findQuestion(target){
  return {mode:'find',target,spoken:letterWord(target)};
}

function firstQuestion(target){
  const {word,emoji,textFallback}=FIRST_WORDS[target];
  return {
    mode:'first',
    letter:target,
    word,
    emoji,
    textFallback:!!textFallback,
    spoken:`${word}! What letter does ${word} start with?`,
  };
}

function bigsmallQuestion(target,flip){
  // Alternates direction: see "a" tap "A", then see "B" tap "b".
  const given=flip?target.toLowerCase():target;
  const answer=flip?target:target.toLowerCase();
  return {
    mode:'bigsmall',
    letter:target,
    given,
    answer,
    spoken:flip
      ?`Little ${given}! Find BIG ${answer}!`
      :`BIG ${given}! Find little ${answer}!`,
  };
}

export function nextTypingQuestion(mode,rng=Math.random){
  const m=normMode(mode);
  if(m==='order'){
    return orderQuestion(ORDER_STARTS[Math.floor(rng()*ORDER_STARTS.length)]);
  }
  const target=shuffled(rng)[0];
  if(m==='first')return firstQuestion(target);
  if(m==='bigsmall')return bigsmallQuestion(target,rng()<.5);
  return findQuestion(target);
}

/* Build a fresh round of ROUND_LEN questions. Guarantees: no repeated target
 * letter within a round. `avoid` (optional) keeps the first target from matching
 * the previous round's first target so consecutive rounds feel fresh. */
export function makeTypingRound(mode,rng=Math.random,avoid=null){
  const m=normMode(mode);
  if(m==='order'){
    return ORDER_STARTS.map(orderQuestion);
  }
  let targets=shuffled(rng).slice(0,ROUND_LEN);
  if(avoid&&targets[0]===String(avoid).toUpperCase()){
    const swapAt=targets.findIndex(t=>t!==String(avoid).toUpperCase());
    if(swapAt>0)[targets[0],targets[swapAt]]=[targets[swapAt],targets[0]];
  }
  return targets.map((t,i)=>{
    if(m==='first')return firstQuestion(t);
    if(m==='bigsmall')return bigsmallQuestion(t,rng()<.5);
    return findQuestion(t);
  });
}

/* Keyboard input mapping. Accepts upper/lowercase appropriately per mode:
 * find/order/first accept either case; bigsmall needs the exact case.
 * Unknown mode falls back to find. For order, pass the letters already picked
 * in the current question. */
export function checkAnswer(mode,question,key,picked=[]){
  const m=normMode(mode),k=String(key||'');
  if(!question)return false;
  switch(m){
    case 'order':{
      const expected=question.sequence?.[picked.length];
      return !!expected&&k.toUpperCase()===expected;
    }
    case 'first':
      return k.toUpperCase()===question.letter;
    case 'bigsmall':
      return k===question.answer;
    case 'find':
    default:
      return k.toUpperCase()===question.target;
  }
}

/* Spoken prompt for a question (used by the UI, and repeated on "Hear it"). */
export function promptSpoken(question){
  return question?.spoken||'';
}
