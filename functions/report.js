const DAY=86400000;
export function parentReport(progress,now=Date.now(),labels={}){
 const attempts=progress.attempts||[],current=attempts.filter(a=>a.date>now-7*DAY&&a.date<=now),previous=attempts.filter(a=>a.date>now-14*DAY&&a.date<=now-7*DAY);
 const grouped=rows=>rows.reduce((groups,a)=>{(groups[a.skill]||=[]).push(a);return groups;},{});
 const before=grouped(previous),skills=Object.entries(grouped(current)).map(([id,rows])=>{const prior=before[id]||[],solved=rows.filter(a=>!a.skipped),priorSolved=prior.filter(a=>!a.skipped),independent=solved.filter(a=>a.independent).length,rate=solved.length?independent/solved.length:0,priorRate=priorSolved.length?priorSolved.filter(a=>a.independent).length/priorSolved.length:0;
 return {id,label:labels[id]||id,total:rows.length,solved:solved.length,independent,supported:solved.length-independent,skipped:rows.length-solved.length,trend:solved.length>=6&&priorSolved.length>=6?(rate-priorRate>=.2?'growing':rate<.5&&rate<=priorRate?'needsSupport':'steady'):'moreEvidence',repeatedHelp:solved.length>=6&&independent<=1&&new Set(solved.map(a=>Math.floor(a.date/DAY))).size>=2};});
 const concerns=skills.filter(s=>s.trend==='needsSupport'||s.repeatedHelp),growth=skills.filter(s=>s.trend==='growing');
 const preschoolAttempts=(progress.preschool?.attempts||[]).filter(a=>a.date>now-7*DAY&&a.date<=now),preschoolSessions=(progress.preschool?.sessions||[]).filter(s=>s.date>now-7*DAY&&s.date<=now);
 const preschool={attempts:preschoolAttempts.length,solved:preschoolAttempts.filter(a=>!a.skipped).length,independent:preschoolAttempts.filter(a=>a.independent&&!a.skipped).length,skills:new Set(preschoolAttempts.map(a=>a.skill)).size,sessions:preschoolSessions.length};
 const sessions=(progress.sessions||[]).filter(s=>s.date>now-7*DAY&&s.date<=now),completed=sessions.filter(s=>s.completed===true||(s.completed===undefined&&s.count>=8)).length;
 return {preschool,attempts:current.length,solved:current.filter(a=>!a.skipped).length,independent:current.filter(a=>a.independent&&!a.skipped).length,reflections:current.filter(a=>a.reflection).length,completed,skills,concerns,growth,noPractice:current.length===0};
}
export function reportEmail(report,kind='weekly'){
 const subject=kind==='support'?'MathQuest: an idea to explore together':'Your weekly MathQuest discoveries';
 const preschoolLine=report.preschool?.attempts?`Pranav’s preschool profile: ${report.preschool.solved} playful activities, ${report.preschool.independent} independently, across ${report.preschool.skills} early-learning skills.`:'Pranav’s preschool profile: no play was recorded this week.';
 const opening=report.noPractice?'Shivani’s profile: no practice was recorded this week. That does not tell us whether learning has stopped.':`Shivani’s profile: ${report.solved} discoveries solved, ${report.independent} independently, ${report.reflections} thinking explanations, and ${report.completed} completed adventures this week.`;
 const lines=[preschoolLine,...report.skills.map(s=>`${s.label}: ${s.independent} independent, ${s.supported} with help, ${s.skipped} skipped.${s.trend==='growing'?' More independent answers than last week.':s.trend==='needsSupport'?' Continued support needed across two weeks of practice.':s.repeatedHelp?' Help was used repeatedly across at least two days.':' More practice will help us understand this pattern.'}`)];
 const suggestion=report.concerns.length?`Try a short, shared adventure with ${report.concerns.map(s=>s.label).join(', ')}. Ask her to show a picture or explain one step; clues are welcome.`:'Celebrate an idea she can explain. A short, playful session is plenty.';
 return {subject,text:[opening,...lines,suggestion,'These are practice observations, not grades or a diagnosis. Different difficulty and representations can change answer patterns.','Open Parent corner for details or to stop emails: https://mathfor3-53583.web.app/'].join('\n\n')};
}
