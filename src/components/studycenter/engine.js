import { QUESTIONS, FLASHCARDS, SUBJECTS, topicLabel } from './bank.js';
export const STORAGE_KEY = 'studylab.learning-center.v1';
export const DEFAULT_DB = () => ({version:1,attempts:[],reviews:[],cards:{},customCards:[],notes:[],bookmarks:[],sessions:[],planner:{examDate:'',subject:'all',minutes:25},exams:[],settings:{goal:15,retention:0.9},syncDeleted:{customCards:{},notes:{},exams:{},bookmarks:{}},syncAdded:{bookmarks:{},customCards:{},notes:{},exams:{}},syncModified:{planner:0,settings:0,customCards:0,notes:0,exams:0}});
export function safeRead(){
 if(typeof window==='undefined') return DEFAULT_DB();
 try { const raw=window.localStorage.getItem(STORAGE_KEY);return raw?validate(JSON.parse(raw)):DEFAULT_DB(); } catch { return DEFAULT_DB(); }
}
export function validate(value){
 if(!value || typeof value!=='object' || value.version!==1) throw new Error('To nie jest zgodny plik postępów StudyLab v1.');
 const d=DEFAULT_DB();
 const trim=(x,max)=>Array.isArray(x)?x.filter(v=>v&&typeof v==='object').slice(-max):[];
 d.attempts=trim(value.attempts,5000).map(x=>({
  id:String(x.id||'').slice(0,130),subject:String(x.subject||'').slice(0,40),topic:String(x.topic||'').slice(0,40),
  question:String(x.question||'').slice(0,700),given:String(x.given||'').slice(0,500),
  answer:String(x.answer||'').slice(0,500),why:String(x.why||'').slice(0,1600),
  lesson:String(x.lesson||'').slice(0,160),ok:!!x.ok,mode:String(x.mode||'quiz').slice(0,25),
  date:validTime(x.date),hints:Math.min(3,Math.max(0,Number(x.hints)||0))
 }));
 d.reviews=trim(value.reviews,5000).map(x=>({cardId:String(x.cardId||'').slice(0,80),rating:String(x.rating||'').slice(0,20),date:validTime(x.date)}));
 d.sessions=trim(value.sessions,600).map(x=>({mode:String(x.mode||'quiz').slice(0,30),score:Math.max(0,Number(x.score)||0),total:Math.max(0,Number(x.total)||0),date:validTime(x.date)}));
 const cards=value.cards&&typeof value.cards==='object'&&!Array.isArray(value.cards)?value.cards:{};
 d.cards=Object.fromEntries(Object.entries(cards).slice(0,3000).map(([key,x])=>[String(key).slice(0,100),{fsrs:validateFSRS(x?.fsrs),repetitions:Math.min(1000,Math.max(0,Number(x?.repetitions)||0)),interval:Math.min(3650,Math.max(0,Number(x?.interval)||0)),ease:Math.min(3.5,Math.max(1.3,Number(x?.ease)||2.5)),due:validTime(x?.due),last:validTime(x?.last)}]));
 d.customCards=trim(value.customCards,600).map(x=>({id:String(x.id||'').slice(0,90),subject:String(x.subject||'cpp').slice(0,40),topic:String(x.topic||'').slice(0,50),front:String(x.front||'').slice(0,300),back:String(x.back||'').slice(0,800),lesson:String(x.lesson||'').slice(0,160)})).filter(x=>x.front&&x.back);
 d.notes=trim(value.notes,500).map(x=>({id:String(x.id||'').slice(0,90),subject:String(x.subject||'cpp').slice(0,40),text:String(x.text||'').slice(0,1800),date:validTime(x.date)})).filter(x=>x.text);
 d.bookmarks=Array.isArray(value.bookmarks)?value.bookmarks.filter(x=>typeof x==='string'&&x.length<200).slice(0,500):[];
 d.planner={examDate:/^\d{4}-\d\d-\d\d$/.test(value.planner?.examDate||'')?value.planner.examDate:'',subject:SUBJECTS.some(s=>s.id===value.planner?.subject)?value.planner.subject:'all',minutes:Math.min(240,Math.max(5,Number(value.planner?.minutes)||25))};
 d.exams=trim(value.exams,150).map(x=>({
  id:String(x.id||'').slice(0,90),title:String(x.title||'').slice(0,100),
  subject:SUBJECTS.some(s=>s.id===x.subject)?x.subject:'all',
  date:/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')?x.date:'',
  minutes:Math.min(300,Math.max(5,Number(x.minutes)||25)),
  topics:Array.isArray(x.topics)?x.topics.filter(t=>typeof t==='string').slice(0,25):[]
 })).filter(x=>x.id&&x.title&&x.date);
 d.settings={goal:Math.min(100,Math.max(1,Number(value.settings?.goal)||15)),retention:Math.min(0.97,Math.max(0.7,Number(value.settings?.retention)||0.9))};
 // Synchronizacja v4: nie przywracaj skasowanych danych z urzadzen offline.
 const stamps=x=>Object.fromEntries(Object.entries(x&&typeof x==='object'&&!Array.isArray(x)?x:{}).filter(([k])=>typeof k==='string'&&k.length<=200).slice(-1000).map(([k,v])=>[k,Number.isFinite(Number(v))?Math.max(0,Number(v)):0]));
 for(const name of ['customCards','notes','exams','bookmarks'])d.syncDeleted[name]=stamps(value.syncDeleted?.[name]);
 for(const name of ['bookmarks','customCards','notes','exams'])d.syncAdded[name]=stamps(value.syncAdded?.[name]);
 for(const name of ['planner','settings','customCards','notes','exams'])d.syncModified[name]=Number.isFinite(Number(value.syncModified?.[name]))?Math.max(0,Number(value.syncModified[name])):0;
 return d;
}
function validateFSRS(x){
 if(!x || x.algorithm!=='FSRS-5')return null;
 const n=(v,low,high)=>{const a=Number(v);return Number.isFinite(a)?Math.max(low,Math.min(high,a)):low;};
 return {algorithm:'FSRS-5',stability:n(x.stability,0.1,36500),difficulty:n(x.difficulty,1,10),
  repetitions:n(x.repetitions,0,100000),lapses:n(x.lapses,0,100000),
  elapsedDays:n(x.elapsedDays,0,36500),scheduledDays:n(x.scheduledDays,0,36500),
  lastReview:validTime(x.lastReview),due:validTime(x.due),targetRetention:n(x.targetRetention,0.7,0.97)};
}
function validTime(t){const n=Number(t);return Number.isFinite(n)&&n>0&&n<4102444800000?n:Date.now();}
export function save(db){
 if(typeof window==='undefined') return false;
 try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(db));return true;}catch(e){console.warn('StudyLab: nie udalo sie zapisac postepow',e);return false;}
}
export function shuffled(xs){const arr=[...xs];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
export function pickQuestions(subject,topic,count,avoidIds=[]){
 let source=QUESTIONS.filter(q=>(subject==='all'||q.subject===subject)&&(topic==='all'||q.topic===topic));
 // Nigdy nie powtarzamy pytania w ramach jednego quizu; w małych tematach wyświetlamy mniejszy test.
 const fresh=shuffled(source.filter(x=>!avoidIds.includes(x.id)));
 const older=shuffled(source.filter(x=>avoidIds.includes(x.id)));
 return [...fresh,...older].slice(0,count).map(q=>({...q,shuffledOptions:shuffled(q.options.map((value,index)=>({value,index})))}));
}
export function scheduleCard(prev, rating, now=Date.now()){
 const state=prev||{repetitions:0,interval:0,ease:2.5};
 let repetitions=state.repetitions||0, interval=state.interval||0, ease=state.ease||2.5;
 // Lekki scheduler na wzor SM-2. To nie jest FSRS (nie wymaga uczenia modelu).
 if(rating==='again'){repetitions=0;interval=0;ease=Math.max(1.3,ease-0.20);}
 else if(rating==='hard'){repetitions+=1;interval=Math.max(1,Math.round((interval||1)*1.2));ease=Math.max(1.3,ease-0.15);}
 else if(rating==='good'){repetitions+=1;interval=repetitions===1?1:repetitions===2?3:Math.max(1,Math.round(interval*ease));}
 else if(rating==='easy'){repetitions+=1;ease=Math.min(3.5,ease+0.15);interval=repetitions===1?4:Math.max(4,Math.round((interval||1)*ease*1.3));}
 else return state;
 const due=now+(rating==='again'?60_000:interval*86400000);
 return {repetitions,interval,ease,due,last:now};
}
export function cardsFor(db,subject='all',topic='all',onlyDue=false){
 const cards=[...FLASHCARDS,...db.customCards];
 const now=Date.now();
 return cards.filter(c=>(subject==='all'||c.subject===subject)&&(topic==='all'||c.topic===topic))
 .filter(c=>!onlyDue||!db.cards[c.id]||db.cards[c.id].due<=now)
 .sort((a,b)=>{
  const aDue=db.cards[a.id]?.due||0,bDue=db.cards[b.id]?.due||0;
  return aDue-bDue;
 });
}
export function getStats(db){
 const attempts=db.attempts;
 const reviewed=attempts.length;
 const correct=attempts.filter(a=>a.ok).length;
 const due=cardsFor(db).filter(c=>!db.cards[c.id]||db.cards[c.id].due<=Date.now()).length;
 const bySubject=SUBJECTS.map(s=>{
  const xs=attempts.filter(a=>a.subject===s.id);const yes=xs.filter(a=>a.ok).length;
  const topics=TOPICS_OF_SUBJECT(s.id).map(t=>{
   const ys=xs.filter(a=>a.topic===t);
   return {id:t,title:topicLabel(s.id,t),count:ys.length,correct:ys.filter(a=>a.ok).length,rate:ys.length?Math.round(100*ys.filter(a=>a.ok).length/ys.length):null};
  });
  return {...s,attempts:xs.length,correct:yes,percent:xs.length?Math.round(100*yes/xs.length):null,topics};
 });
 const today=new Date().toLocaleDateString('sv-SE');
 const todayDone=attempts.filter(a=>new Date(a.date).toLocaleDateString('sv-SE')===today).length+db.reviews.filter(r=>new Date(r.date).toLocaleDateString('sv-SE')===today).length;
 const recordedDates=new Set([...attempts,...db.reviews].map(a=>new Date(a.date).toLocaleDateString('sv-SE')));
 let streak=0;
 const cursor=new Date();if(!recordedDates.has(cursor.toLocaleDateString('sv-SE')))cursor.setDate(cursor.getDate()-1);
 while(streak<3650&&recordedDates.has(cursor.toLocaleDateString('sv-SE'))){streak++;cursor.setDate(cursor.getDate()-1);}
 const weak=bySubject.flatMap(s=>s.topics.filter(t=>t.count>=2&&t.rate<70).map(t=>({subject:s.id,subjectName:s.name,...t}))).sort((a,b)=>a.rate-b.rate);
 return {reviewed,correct,accuracy:reviewed?Math.round(100*correct/reviewed):null,due,todayDone,streak,bySubject,weak};
}
function TOPICS_OF_SUBJECT(id){return [...new Set(QUESTIONS.filter(x=>x.subject===id).map(x=>x.topic))];}
export function recentMistakes(db){
 const map=new Map();
 for(let i=db.attempts.length-1;i>=0;i--){const a=db.attempts[i];if(!map.has(a.id))map.set(a.id,a);}
 return [...map.values()].filter(a=>!a.ok);
}
export function bookmarkedHref(subject,slug){
 const s=SUBJECTS.find(x=>x.id===subject);
 return s&&slug?`${s.root}/${slug}/`:null;
}
