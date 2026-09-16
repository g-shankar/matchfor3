import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineSecret} from 'firebase-functions/params';
import {parentReport,reportEmail} from './report.js';
import labels from './labels.json' with {type:'json'};
initializeApp();const db=getFirestore();
const apiKey=defineSecret('RESEND_API_KEY'),recipient=defineSecret('PARENT_EMAIL'),sender=defineSecret('EMAIL_FROM'),profile=defineSecret('PARENT_PROFILE_UID');
const settingsRef=uid=>db.doc(`players/${uid}/parentEmail/preferences`);
export const parentEmailSettings=onCall({region:'us-east1',secrets:[recipient,profile],maxInstances:2},async request=>{
 if(!request.auth||request.auth.uid!==profile.value())throw new HttpsError('permission-denied','Email settings are available in the configured parent browser profile.');
 const data=request.data||{};if(Object.keys(data).some(k=>!['enabled','supportAlerts'].includes(k)))throw new HttpsError('invalid-argument','Invalid email settings.');
 if(Object.keys(data).length){if(typeof data.enabled!=='boolean'||typeof data.supportAlerts!=='boolean')throw new HttpsError('invalid-argument','Choose both preferences.');await settingsRef(request.auth.uid).set({enabled:data.enabled,supportAlerts:data.supportAlerts,updatedAt:FieldValue.serverTimestamp()},{merge:true});}
 const s=(await settingsRef(request.auth.uid).get()).data()||{};const email=recipient.value(),at=email.indexOf('@');return {configured:true,recipient:`${email.slice(0,1)}…${email.slice(at)}`,enabled:s.enabled===true,supportAlerts:s.supportAlerts!==false};
});
async function readProgress(uid){return db.runTransaction(async tx=>{const manifest=await tx.get(db.doc(`players/${uid}`));if(!manifest.exists())return {attempts:[],sessions:[]};const count=manifest.data().chunkCount;if(!Number.isInteger(count)||count<1||count>450)throw Error('Invalid practice backup');const refs=Array.from({length:count},(_,i)=>db.doc(`players/${uid}/progressChunks/${String(i).padStart(4,'0')}`));const chunks=await tx.getAll(...refs);if(chunks.some(c=>!c.exists))throw Error('Incomplete practice backup');return JSON.parse(chunks.map(c=>c.data().data).join(''));});}
export const deliverParentDigests=onSchedule({schedule:'0 13 * * *',timeZone:'UTC',region:'us-east1',secrets:[apiKey,recipient,sender,profile],maxInstances:1,retryCount:5,minBackoffSeconds:60,maxBackoffSeconds:600},async event=>{
 const uid=profile.value(),prefs=(await settingsRef(uid).get()).data();if(!prefs?.enabled)return;
 const now=Date.parse(event.scheduleTime),day=new Date(now).toISOString().slice(0,10),report=parentReport(await readProgress(uid),now,labels);
 const weekly=new Date(now).getUTCDay()===1,lastSupport=prefs.lastSupportAt?.toMillis?.()||0,support=prefs.supportAlerts!==false&&report.concerns.length&&now-lastSupport>=7*86400000;
 if(!weekly&&!support)return;const kind=weekly?'weekly':'support',ref=db.doc(`players/${uid}/emailDeliveries/${day}`),email=reportEmail(report,kind);
 const claimed=await db.runTransaction(async tx=>{const old=(await tx.get(ref)).data();if(old?.status==='sent'||(old?.leaseUntil||0)>Date.now())return false;if(old?.createdAt&&Date.now()-old.createdAt>23*3600000)throw Error('Delivery retry window expired; inspect before resending');tx.set(ref,{status:'sending',createdAt:old?.createdAt||Date.now(),leaseUntil:Date.now()+60000,kind,payload:old?.payload||email},{merge:true});return true;});
 if(!claimed)return;try{const payload=(await ref.get()).data().payload;const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey.value()}`,'Content-Type':'application/json','Idempotency-Key':`mathquest/${uid}/${day}`},body:JSON.stringify({from:sender.value(),to:[recipient.value()],...payload}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Email provider rejected delivery');const sent=await response.json();await db.runTransaction(async tx=>{tx.set(ref,{status:'sent',sentAt:FieldValue.serverTimestamp(),providerId:sent.id,leaseUntil:0},{merge:true});if(report.concerns.length)tx.set(settingsRef(uid),{lastSupportAt:FieldValue.serverTimestamp()},{merge:true});});}
 catch(error){await ref.set({status:'failed',leaseUntil:0},{merge:true});throw error;}
});
