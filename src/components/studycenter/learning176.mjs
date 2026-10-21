// StudyLab 17.6-17.7 — pure functions, no network or storage writes.
// Due suggestions for mistakes are lightweight heuristics; flashcards continue using FSRS-5.
import { SUBJECTS, TOPICS, FLASHCARDS, topicLabel } from './bank.js';
const DAY = 86400000;
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const number = x=>Number.isFinite(Number(x))?Number(x):0;
const allAttempts = db=>Array.isArray(db?.attempts)?db.attempts:[];
const idOf=a=>`${a.subject||''}:${a.topic||''}:${a.id||''}`;
export const isoDate = (d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shiftDate(iso,days){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const d=new Date(`${iso}T12:00:00Z`);
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==iso)return '';
 d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
export function daysBetween(a,b){
 if(!shiftDate(a,0)||!shiftDate(b,0))return null;
 return Math.round((Date.parse(`${b}T12:00:00Z`)-Date.parse(`${a}T12:00:00Z`))/DAY);
}
export function mistakesForReview(db,now=Date.now(),subject='all'){
 const grouped=new Map();
 for(const a of allAttempts(db)){
  if(!a?.id||!a?.subject||!a?.topic||(subject!=='all'&&a.subject!==subject))continue;
  const key=idOf(a);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(a);
 }
 return [...grouped].map(([key,attempts])=>{
  const history=attempts.sort((a,b)=>number(a.date)-number(b.date));
  const failed=history.filter(a=>!a.ok);
  if(!failed.length)return null;
  const last=history.at(-1),lastFailure=failed.at(-1);
  const trailingCorrect=[...history].reverse().findIndex(a=>!a.ok);
  const recovered=last.ok && trailingCorrect>=2;
  // Wrong answers: repeat as soon as the learner is ready; recent successes: revisit later.
  const dueAt=!last.ok?number(last.date):number(last.date)+(recovered?7:3)*DAY;
  const severity=failed.length+(!last.ok?2:0);
  return {key,id:last.id,subject:last.subject,topic:last.topic,
   title:topicLabel(last.subject,last.topic),question:lastFailure.question||last.question,
   given:lastFailure.given||'Brak odpowiedzi',answer:lastFailure.answer||'',why:lastFailure.why||'',lesson:lastFailure.lesson||'',
   failures:failed.length,attempts:history.length,correctStreak:Math.max(0,trailingCorrect),
   dueAt,recovered,due:dueAt<=now,lastDate:number(last.date),lastWrongDate:number(lastFailure.date),severity,
   hintsUsed:history.some(x=>number(x.hints)>0)};
 }).filter(Boolean).sort((a,b)=>Number(b.due)-Number(a.due)||b.severity-a.severity||a.dueAt-b.dueAt).slice(0,200);
}
export function topicSignals(db,subject='all'){
 const subjects=SUBJECTS.filter(s=>subject==='all'||s.id===subject);
 const attempts=allAttempts(db);
 return subjects.flatMap(s=>(TOPICS[s.id]||[]).map(([id,name])=>{
  const items=attempts.filter(a=>a.subject===s.id&&a.topic===id).sort((a,b)=>number(b.date)-number(a.date));
  const recent=items.slice(0,8),passed=recent.filter(a=>a.ok).length;
  const accuracy=recent.length?Math.round(100*passed/recent.length):null;
  const lastWrong=recent.length&&!recent[0].ok;
  const priority=recent.length===0?65:clamp(100-accuracy+(lastWrong?18:0)+(recent.length<3?15:0),0,120);
  return {key:`${s.id}:${id}`,subject:s.id,subjectName:s.name,topic:id,title:name,
   attempts:items.length,recent:recent.length,accuracy,priority,lastWrong:!!lastWrong,
   reason:recent.length===0?'Brak prób — sprawdź podstawy':lastWrong?'Ostatnia odpowiedź była błędna':
     recent.length<3?'Za mało prób, aby ocenić utrwalenie':accuracy<70?'Błędy w ostatnich próbach':'Ćwicz, aby utrzymać wiedzę'};
 })).sort((a,b)=>b.priority-a.priority||a.key.localeCompare(b.key));
}
export function makeLearningPlan(db,{subject='all',examDate='',minutes=25,horizon=14}={},today=isoDate()){
 const dailyMinutes=clamp(Math.round(number(minutes)||25),10,180);
 const diff=daysBetween(today,examDate);
 const until=diff!==null&&diff>=0?diff:null;
 const length=until===null?clamp(horizon,1,30):clamp(until+1,1,30);
 const topics=topicSignals(db,subject);
 const plan=[];
 for(let n=0;n<length;n++){
  const date=shiftDate(today,n);
  const intensity=until!==null && n===until?'Powtórka przed kolokwium':n%5===4?'Powtórka mieszana':n%3===0?'Utrwalanie i ćwiczenia':'Nauka i praktyka';
  // Prioritize weak/unseen areas, but cycle through the selected syllabus instead of repeating one task.
  const base=topics.length?Math.floor(n/2)%topics.length:0;
  const selected=topics.length?[topics[base],topics[(base+1)%topics.length]].filter((t,i,a)=>a.findIndex(x=>x.key===t.key)===i):[];
  const reviewMinutes=Math.max(2,Math.round(dailyMinutes*0.2));
  const reflectMinutes=Math.max(2,Math.round(dailyMinutes*0.1));
  const practiceMinutes=Math.max(1,dailyMinutes-reviewMinutes-reflectMinutes);
  const count=allAttempts(db).filter(a=>isoDate(new Date(number(a.date)))===date&&
     (subject==='all'||a.subject===subject)).length;
  const cardSubject=new Map([...FLASHCARDS,...(db?.customCards||[])].map(c=>[c.id,c.subject]));
  const reviews=(db?.reviews||[]).filter(a=>isoDate(new Date(number(a.date)))===date &&
     (subject==='all'||cardSubject.get(a.cardId)===subject)).length;
  plan.push({date,day:n+1,intensity,topics:selected,reviewMinutes,practiceMinutes,reflectMinutes,
   totalMinutes:dailyMinutes,attemptsRecorded:count,reviewsRecorded:reviews,activityRecorded:count+reviews>0});
 }
 return {plan,until,dailyMinutes,subject,topicsCount:topics.length,hasAttempts:allAttempts(db).length>0};
}
