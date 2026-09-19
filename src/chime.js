/* Shared WebAudio chime for the Shivani games.
 * The old inline version created a brand-new AudioContext on every call.
 * Browsers cap how many contexts a page may create (about six in Chrome),
 * so the chime died after a few correct answers and never came back.
 * On iOS a fresh context also starts suspended outside a resumed gesture.
 * This module keeps ONE lazy context, resumes it when needed, and reuses it. */

export function makeChime({Ctor}={}){
 let ctx=null;
 function getCtor(){
  if(Ctor)return Ctor;
  if(typeof window==='undefined')return null;
  return window.AudioContext||window.webkitAudioContext||null;
 }
 function context(){
  const Audio=getCtor();
  if(!Audio)return null;
  try{
   if(!ctx)ctx=new Audio();
   if(ctx.state==='suspended'&&typeof ctx.resume==='function')ctx.resume().catch(()=>{});
  }catch{return null;}
  return ctx;
 }
 function ding(big=false){
  try{
   const c=context();
   if(!c||typeof c.createOscillator!=='function')return false;
   const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
   o.type='sine';
   o.frequency.setValueAtTime(big?523:440,t);
   o.frequency.exponentialRampToValueAtTime(big?1046:660,t+.16);
   g.gain.setValueAtTime(.055,t);
   g.gain.exponentialRampToValueAtTime(.001,t+.22);
   o.connect(g);g.connect(c.destination);o.start();o.stop(t+.23);
  }catch{return false;}
  return true;
 }
 return {ding,reset:()=>{ctx=null;}};
}

export const ding=makeChime().ding;
