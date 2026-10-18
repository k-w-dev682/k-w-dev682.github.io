/** StudyLab 7.2: deterministic, offline learning recommendations; no AI or hidden API. */
export const NOTE_KEY='studylab.notes72.v1';
export const TOPIC_ORDER={
 cpp:['basic','data','flow','strings'],
 math1:['logic','sets','functions'],
 math2:['sets','sequences','combinatorics'],
 ask:['bases','signed','cpu'],
 physics:['motion','forces','momentum'],
 electronics:['charge','potential','cap']
};
export function evaluateTopic(attempts,subject,topic){
 const a=(attempts||[]).filter(x=>x.subject===subject&&x.topic===topic).slice(-15);
 if(!a.length)return {count:0,accuracy:null,mastery:0,status:'Niećwiczony'};
 const weighted=a.reduce((sum,x,i)=>sum+(x.ok?1:0)*(1+i/a.length),0);
 const weight=a.reduce((sum,_,i)=>sum+1+i/a.length,0);
 const score=Math.round(100*(weighted/weight)*Math.min(1,a.length/6));
 return {count:a.length,accuracy:Math.round(100*a.filter(x=>x.ok).length/a.length),mastery:score,status:score>=80?'Utrwalony':score>=50?'W trakcie':'Wymaga pracy'};
}
export function buildMap(attempts,subject,topics){
 const order=TOPIC_ORDER[subject]||topics.map(x=>x[0]);
 return topics.map(([id,name])=>({id,name,requires:order.includes(id)&&order.indexOf(id)>0?[order[order.indexOf(id)-1]]:[],...evaluateTopic(attempts,subject,id)}));
}
export function reviewQueue(db,subjects,topics,now=Date.now(),catalog=[]){
 const results=[];
 const pending=(db.reviews||[]).length;
 const cards=catalog.length?catalog.filter(x=>!db.cards?.[x.id]||Number(db.cards[x.id]?.due)<=now).length:Object.values(db.cards||{}).filter(x=>Number(x?.due)<=now).length;
 for(const subject of subjects){for(const [id,label] of topics[subject.id]||[]){
  const m=evaluateTopic(db.attempts,subject.id,id);
  const recentErrors=(db.attempts||[]).filter(x=>x.subject===subject.id&&x.topic===id&&!x.ok&&now-x.date<14*86400000).slice(-8).length;
  if(m.count===0&&!recentErrors)continue;
  const score=Math.round((100-m.mastery)+Math.min(35,recentErrors*9));
  results.push({subject:subject.id,subjectLabel:subject.short,topic:id,label,score,incorrect:recentErrors,mastery:m.mastery,count:m.count});
 }}
 return {items:results.sort((a,b)=>b.score-a.score||a.subject.localeCompare(b.subject)),dueCardCount:cards,reviewsRecorded:pending};
}
export function summarizeProgress(db,subject,topics,now=Date.now()){
 const attempts=(db.attempts||[]).filter(a=>subject==='all'||a.subject===subject);
 const reviews=(db.reviews||[]);
 const recentDays=Array.from({length:28},(_,i)=>{
  const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-(27-i));
  const end=d.getTime()+86400000, start=d.getTime();
  return {day:d.toLocaleDateString('sv-SE'),attempts:attempts.filter(a=>a.date>=start&&a.date<end).length,reviews:reviews.filter(a=>a.date>=start&&a.date<end).length};
 });
 const correct=attempts.filter(a=>a.ok).length;
 const mastery=Object.entries(topics).filter(([s])=>subject==='all'||s===subject).flatMap(([s,list])=>list.map(([id,name])=>({subject:s,topic:id,name,...evaluateTopic(attempts,s,id)})));
 return {attempts:attempts.length,accuracy:attempts.length?Math.round(100*correct/attempts.length):null,days:recentDays,topics:mastery,reviewedCards:reviews.length};
}
export function validateNotesFile(input){
 if(!input||input.version!==1||!Array.isArray(input.notes))throw new Error('Niepoprawna kopia notatek StudyLab 7.2');
 return {version:1,notes:input.notes.slice(0,150).filter(n=>n&&typeof n==='object').map(n=>({
  id:String(n.id||'').slice(0,100),title:String(n.title||'').slice(0,130),subject:String(n.subject||'math1').slice(0,30),
  body:String(n.body||'').slice(0,60000),updated:Number(n.updated)||Date.now()
 })).filter(n=>n.id&&n.title)};
}
export function serializeNotes(notes){return validateNotesFile({version:1,notes});}
export function quickQuestions(questions,subject,topic,limit=3){return questions.filter(q=>q.subject===subject&&q.topic===topic).slice(0,limit);}
