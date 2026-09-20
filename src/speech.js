import {naturalVoiceClips} from './natural-voice-clips.js';

const bad=/compact|espeak|festival|fred|whisper|zarvox|trinoids|cellos|bells/i;
export function voiceScore(v){const name=v.name||'',lang=(v.lang||'').toLowerCase();if(!lang.startsWith('en')||bad.test(name))return-1000;let score=0;if(/premium|enhanced|natural|neural|online/i.test(name))score+=100;if(/flo|sandy|shelley|eddy|reed|rocko|ava|samantha|allison|susan|karen|moira|serena|aria|jenny|sonia|libby/i.test(name))score+=55;if(lang==='en-us')score+=25;else if(lang==='en-gb'||lang==='en-au'||lang==='en-ie')score+=18;if(v.localService)score+=8;if(v.default)score+=3;return score;}
export function englishVoices(synth=window.speechSynthesis){return synth?.getVoices?.().filter(v=>voiceScore(v)>-1000).sort((a,b)=>voiceScore(b)-voiceScore(a))||[];}
export function preferredVoice(voices=englishVoices(),saved=localStorage.getItem('mathquest-voice')){return voices.find(v=>v.name===saved)||voices[0]||null;}

/* Neural/online voice selection for the First 100 library.
 * speechSynthesis defaults to local legacy voices (e.g. Microsoft David / Zira)
 * which sound robotic and metallic. These helpers prefer remote neural voices
 * (localService === false, or names hinting Natural/Neural/Google/Online) and
 * handle Chrome's asynchronous voice loading so the first tap never gets an
 * empty voice list. */
const neuralHint=/natural|neural|online|google/i;
export function neuralVoiceScore(v){const name=v.name||'',lang=(v.lang||'').toLowerCase();if(!lang.startsWith('en')||bad.test(name))return-1000;let score=0;if(v.localService===false)score+=200;if(neuralHint.test(name))score+=100;if(lang==='en-us')score+=25;else if(/^en-(gb|au|ie|ca|nz)$/.test(lang))score+=18;if(v.default)score+=3;return score;}
export function bestNeuralVoice(voices=[]){return voices.filter(v=>neuralVoiceScore(v)>-1000).sort((a,b)=>neuralVoiceScore(b)-neuralVoiceScore(a))[0]||null;}
export function getVoicesAsync(synth=(typeof window!=='undefined'?window.speechSynthesis:undefined)){return new Promise((resolve)=>{const read=()=>{try{return synth.getVoices()||[];}catch{return[];}};if(!synth||typeof synth.getVoices!=='function'){resolve([]);return;}const have=read();if(have.length){resolve(have);return;}let settled=false;const done=()=>{if(!settled){settled=true;resolve(read());}};if(typeof synth.addEventListener==='function')synth.addEventListener('voiceschanged',done,{once:true});else synth.onvoiceschanged=done;setTimeout(done,2000);});}
export async function speakNeural(text,{synth,rate=1,pitch=1,lang='en-US',Utterance}={}){const engine=synth||(typeof window!=='undefined'?window.speechSynthesis:undefined);if(!engine||typeof engine.speak!=='function')return false;const Ctor=Utterance||(typeof SpeechSynthesisUtterance!=='undefined'?SpeechSynthesisUtterance:undefined);if(!Ctor)return false;const voice=bestNeuralVoice(await getVoicesAsync(engine));try{engine.cancel();}catch{}const u=new Ctor(String(text));if(voice){u.voice=voice;u.lang=voice.lang||lang;}else u.lang=lang;u.rate=rate;u.pitch=pitch;try{engine.speak(u);}catch{return false;}return true;}
let activeAudio=null;
function speakDevice(text,{voiceName,rate}){if(!('speechSynthesis'in window))return;const synth=window.speechSynthesis;synth.cancel();const u=new SpeechSynthesisUtterance(text),voice=preferredVoice(englishVoices(synth),voiceName);if(voice){u.voice=voice;u.lang=voice.lang;}else u.lang='en-US';u.rate=rate;u.pitch=1;synth.speak(u);}
export function speakFriendly(text,{voiceName='off',rate=.9}={}){window.speechSynthesis?.cancel();if(activeAudio){activeAudio.pause();activeAudio=null}if(voiceName==='off')return;const clip=voiceName==='recorded:flo'&&naturalVoiceClips[text];if(clip&&typeof Audio!=='undefined'){const audio=new Audio(clip);activeAudio=audio;audio.addEventListener('ended',()=>{if(activeAudio===audio)activeAudio=null},{once:true});audio.play().catch(()=>{});return audio}if(voiceName!=='recorded:flo')speakDevice(text,{voiceName,rate});}
