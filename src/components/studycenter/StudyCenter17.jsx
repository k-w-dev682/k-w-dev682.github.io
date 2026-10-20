import React, {useMemo,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {SUBJECTS,TOPICS,lessonHref} from './bank.js';
import {CHALLENGES_17,LEVEL_NAMES_17,filterChallenges17} from './challenges17.mjs';
import './studycenter17.css';

const ROOT = (import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
function MathLine({tex}){
 const html=useMemo(()=>{if(!tex)return '';try{return katex.renderToString(tex,{throwOnError:true,strict:'ignore',trust:false,displayMode:true})}catch{return ''}},[tex]);
 return html?<div className="s17-formula" role="math" aria-label={tex} dangerouslySetInnerHTML={{__html:html}}/>:null;
}
function Select({label,value,onChange,values}){
 return <label className="s17-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{values.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>;
}
export default function StudyCenter17({onAttempt,onSession}){
 const [subject,setSubject]=useState('all'),[topic,setTopic]=useState('all'),[level,setLevel]=useState('all');
 const [kind,setKind]=useState('practice'),[count,setCount]=useState('10');
 const [phase,setPhase]=useState('setup'),[session,setSession]=useState([]),[index,setIndex]=useState(0);
 const [answers,setAnswers]=useState({}),[checked,setChecked]=useState({}),[hintCounts,setHintCounts]=useState({});
 const [summary,setSummary]=useState(null);
 const available=useMemo(()=>filterChallenges17({subject,topic,level}),[subject,topic,level]);
 const optionsTopics=subject==='all'?[]:TOPICS[subject]||[];
 const current=session[index],answer=answers[index],isChecked=!!checked[index],hintCount=hintCounts[index]||0;
 function begin(){
  const ordered=shuffle(available).sort((a,b)=>a.level-b.level).slice(0,Number(count));
  if(!ordered.length)return;
  setSession(ordered);setIndex(0);setAnswers({});setChecked({});setHintCounts({});setSummary(null);setPhase('running');
 }
 function attempt(q,selected,usedHints,mode){
  onAttempt?.({id:q.id,subject:q.subject,topic:q.topic,lesson:q.lesson,question:q.question,given:selected===undefined?'Brak odpowiedzi':q.options[selected],answer:q.options[q.correct],why:q.steps.join(' '),ok:selected===q.correct,hints:usedHints,date:Date.now(),mode});
 }
 function check(){
  if(!current||isChecked||answer===undefined||kind==='exam')return;
  setChecked(s=>({...s,[index]:true}));
  attempt(current,answer,hintCount,'challenge17');
 }
 function finish(){
  const points=session.reduce((sum,q,i)=>sum+(answers[i]===q.correct&& (kind==='exam'||checked[i])?1:0),0);
  if(kind==='exam')session.forEach((q,i)=>attempt(q,answers[i],0,'challenge17-exam'));
  onSession?.({mode:kind==='exam'?'challenge17-exam':'challenge17',score:points,total:session.length,date:Date.now()});
  setSummary({score:points,total:session.length,results:session.map((q,i)=>({q,selected:answers[i],correct:kind==='exam'||!!checked[i]}))});
  setPhase('done');
 }
 function next(){if(index+1>=session.length)finish();else setIndex(i=>i+1)}
 function reset(){setPhase('setup');setSummary(null)}
 return <div className="s17-root">
  <header className="s17-heading"><span>BLACK EDITION · MODUŁ 17.0</span><h2>Zadania z pięcioma poziomami trudności</h2><p>Samodzielna próba, trzy stopniowe podpowiedzi i rozwiązanie z uzasadnieniem. Najtrudniejsze zadania wymagają wyboru metody, a nie tylko większych liczb. Wyniki zapisują się w istniejącym Centrum nauki.</p></header>
  {phase==='setup'&&<section className="s17-panel"><h3>Wybierz zakres treningu</h3>
   <div className="s17-filters">
    <Select label="Przedmiot" value={subject} onChange={s=>{setSubject(s);setTopic('all')}} values={ [['all','Wszystkie przedmioty'],...SUBJECTS.map(s=>[s.id,s.name])]}/>
    <Select label="Dział" value={topic} onChange={setTopic} values={[['all','Wszystkie działy'],...optionsTopics]}/>
    <Select label="Trudność" value={level} onChange={setLevel} values={[['all','Od podstaw do wyzwań'],...LEVEL_NAMES_17.map((l,i)=>[String(i+1),`${i+1}. ${l}`])]}/>
    <Select label="Liczba pytań" value={count} onChange={setCount} values={['5','10','20','40'].map(x=>[x,x])}/>
   </div>
   <fieldset className="s17-modes"><legend>Tryb rozwiązywania</legend><label><input type="radio" name="s17-mode" value="practice" checked={kind==='practice'} onChange={()=>setKind('practice')}/> Nauka — podpowiedzi i szczegółowe rozwiązania po sprawdzeniu</label><label><input type="radio" name="s17-mode" value="exam" checked={kind==='exam'} onChange={()=>setKind('exam')}/> Próbne kolokwium — bez podpowiedzi i oceniania przed końcem</label></fieldset>
   <p className="s17-availability">W wybranym zakresie: <strong>{available.length}</strong> zadań (cały nowy bank: {CHALLENGES_17.length}). {available.length<Number(count)?'Sesja obejmie wszystkie dostępne pytania.':''}</p>
   <button className="s17-primary" disabled={!available.length} type="button" onClick={begin}>Rozpocznij sesję →</button>
   <p className="s17-note">Ten zestaw jest nowym, ręcznie opracowanym bankiem. Nie zastępuje wcześniejszych quizów i generatorów. Nie uruchamia kodu C++.</p>
  </section>}
  {phase==='running'&&current&&<section className="s17-panel">
   <div className="s17-meta"><span>Pytanie {index+1} z {session.length}</span><span>Poziom {current.level} — {LEVEL_NAMES_17[current.level-1]}</span></div><progress value={index+1} max={session.length} aria-label="Postęp sesji"/>
   <p className="s17-topic">{SUBJECTS.find(s=>s.id===current.subject)?.name} / {TOPICS[current.subject]?.find(t=>t[0]===current.topic)?.[1]}</p>
   <h3 className="s17-question">{current.question}</h3><MathLine tex={current.formula}/>
   <div className="s17-options" role="group" aria-label="Wybierz jedną odpowiedź">{current.options.map((o,i)=>{
    const reveal=(kind==='practice'&&isChecked);const chosen=answer===i;
    return <button type="button" key={i} aria-pressed={chosen} disabled={reveal} onClick={()=>setAnswers(a=>({...a,[index]:i}))} className={'s17-option '+(chosen?'s17-chosen ':'')+(reveal&&i===current.correct?'s17-correct ':'')+(reveal&&chosen&&i!==current.correct?'s17-wrong':'')}><strong>{String.fromCharCode(65+i)}</strong> {o}</button>;
   })}</div>
   {kind==='practice'&&!isChecked&&<div className="s17-hints"><h4>Podpowiedzi krok po kroku</h4><p>Otwieraj je dopiero wtedy, gdy samodzielna próba sprawia trudność.</p>{current.hints.slice(0,hintCount).map((h,i)=><p key={i}><strong>{i+1}.</strong> {h}</p>)}<button type="button" disabled={hintCount>=3} className="s17-secondary" onClick={()=>setHintCounts(h=>({...h,[index]:Math.min(3,hintCount+1)}))}>Odkryj podpowiedź {Math.min(3,hintCount+1)} z 3</button></div>}
   {kind==='practice'&&isChecked&&<div className="s17-solution" role="status"><h4>{answer===current.correct?'Dobrze! Dlaczego?':'Zobacz, gdzie był błąd'}</h4><p><strong>Poprawna odpowiedź:</strong> {current.options[current.correct]}</p><ol>{current.steps.map((s,i)=><li key={i}>{s}</li>)}</ol><p><strong>Typowa pułapka:</strong> {current.trap}</p><a href={ROOT+lessonHref(current.subject,current.lesson)}>Powiązana lekcja ↗</a></div>}
   <div className="s17-actions">{kind==='practice'&&!isChecked?<button type="button" className="s17-primary" disabled={answer===undefined} onClick={check}>Sprawdź moją odpowiedź</button>:<button type="button" className="s17-primary" onClick={next} disabled={kind==='exam'&&answer===undefined}>{index===session.length-1?'Zakończ i oceń':'Następne pytanie →'}</button>}
   <button type="button" className="s17-secondary" onClick={reset}>Wróć do wyboru zadań</button></div>
   {kind==='exam'&&<p className="s17-note">Ocena i rozwiązania pojawią się po ostatnim pytaniu. W tym trybie nie są udostępniane podpowiedzi.</p>}
  </section>}
  {phase==='done'&&summary&&<section className="s17-panel"><h3>Podsumowanie sesji</h3><p className="s17-score">{summary.score} / {summary.total} poprawnych ({Math.round(100*summary.score/summary.total)}%)</p><p>Wynik trafił do wspólnej historii StudyLab. Poniżej znajdziesz rozwiązania wszystkich pytań.</p>
   <div className="s17-review">{summary.results.map(({q,selected},i)=><details key={q.id} open={selected!==q.correct}><summary>{selected===q.correct?'✓':'✕'} {i+1}. {q.question}</summary><p><b>Twoja odpowiedź:</b> {selected===undefined?'Brak odpowiedzi':q.options[selected]}</p><p><b>Poprawnie:</b> {q.options[q.correct]}</p><MathLine tex={q.formula}/><ol>{q.steps.map((s,j)=><li key={j}>{s}</li>)}</ol><p><b>Pułapka:</b> {q.trap}</p><a href={ROOT+lessonHref(q.subject,q.lesson)}>Zobacz lekcję ↗</a></details>)}</div>
   <button type="button" className="s17-primary" onClick={reset}>Nowa sesja</button>
  </section>}
 </div>;
}
