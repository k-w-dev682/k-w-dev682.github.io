import React,{useEffect,useMemo,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {AI_BRIDGE_URL,callAI,tutorPayload} from '../../lib/studylab-ai-coach.mjs';
import {checkLineSequence} from '../../lib/step-check.mjs';
import './studycoach-ai.css';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const TOPICS=[['hint','Wyjaśnij wskazówką'],['full','Wyjaśnij od podstaw']];
function MathAnswer({value}){
 const chunks=useMemo(()=>String(value||'').split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g),[value]);
 return <div className="studycoach-answer">{chunks.map((p,i)=>{
  const display=p.startsWith('$$')&&p.endsWith('$$');
  const inline=!display&&p.startsWith('$')&&p.endsWith('$');
  if(!display&&!inline)return <React.Fragment key={i}>{p}</React.Fragment>;
  const tex=p.slice(display?2:1,-(display?2:1));
  try{return <span key={i} className={display?'studycoach-formula-block':'studycoach-formula-inline'} role="math" aria-label={tex} dangerouslySetInnerHTML={{__html:katex.renderToString(tex,{throwOnError:true,trust:false,strict:'ignore',displayMode:display})}}/>;}
  catch{return <React.Fragment key={i}>{p}</React.Fragment>}
 })}</div>;
}
const starterTask='Znajdź funkcję odwrotną do f(x)=x²−4x dla x≤2.';
const starterSteps='x² - 4*x\n(x - 2)^2 - 4';
export default function StudyCoachAI({mode='tutor'}){
 const [lessons,setLessons]=useState([]),[lesson,setLesson]=useState(''),[question,setQuestion]=useState(''),[answer,setAnswer]=useState(''),[task,setTask]=useState(starterTask),[steps,setSteps]=useState(starterSteps);
 const [kind,setKind]=useState('hint'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[history,setHistory]=useState([]),[subject,setSubject]=useState('all');
 useEffect(()=>{let done=false;fetch(`${BASE}studylab-lecture-index.json`).then(r=>r.ok?r.json():Promise.reject(Error('Nie znaleziono indeksu lekcji.'))).then(data=>{if(!done)setLessons(data.lessons||[]);}).catch(()=>{if(!done)setMessage('Nie udało się wczytać indeksu lekcji. Uruchom npm run build lub generator indeksu.');});return ()=>{done=true;};},[]);
 const visible=useMemo(()=>lessons.filter(l=>subject==='all'||l.subject===subject),[lessons,subject]);
 const current=lessons.find(l=>l.slug===lesson);
 const stepResults=useMemo(()=>checkLineSequence(steps),[steps]);
 async function askTutor(){if(question.trim().length<3){setMessage('Zadaj pytanie w polu poniżej.');return;}setBusy(true);setMessage('Analizuję wybraną lekcję…');setAnswer('');
  try{const context=(current?.pages||[]).map(p=>p.text).join('\n').slice(0,12000);const data=await callAI('/tutor',tutorPayload({title:current?.title||'Pytanie ogólne',context,question,history,guided:kind==='hint'}));setAnswer(data.answer||'Brak odpowiedzi.');setHistory(h=>[...h,{question,answer:data.answer||''}].slice(-6));setMessage('Odpowiedź gotowa. Możesz doprecyzować pytanie.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 async function checkSteps(){if(task.trim().length<5||steps.trim().length<5){setMessage('Wpisz zadanie i co najmniej jeden krok.');return;}setBusy(true);setAnswer('');setMessage('Gemini sprawdza rozwiązanie…');
  try{const data=await callAI('/steps',{task,steps});setAnswer(data.answer||'Brak odpowiedzi.');setMessage('Zweryfikuj wynik z rozwiązaniem podręcznikowym. AI może popełnić błąd.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <div className="studycoach-root">
  <header className="studycoach-hero"><span>BLACK EDITION · STUDYLAB 17.3–17.4</span><h2>{mode==='tutor'?'Korepetytor AI':'Sprawdzanie krok po kroku'}</h2><p>{mode==='tutor'?'Zapytaj o dowolną istniejącą lekcję. Tryb wskazówek pomaga samodzielnie dojść do rozwiązania.':'Wpisz kolejno własne przekształcenia. Możesz użyć szybkiego sprawdzenia prostych wyrażeń, a następnie poprosić Gemini o dokładną analizę.'}</p></header>
  {mode==='tutor'?<section className="studycoach-panel">
   <div className="studycoach-grid"><label>Przedmiot<select value={subject} onChange={e=>{setSubject(e.target.value);setLesson('');setAnswer('');}}><option value="all">Wszystkie</option>{[...new Set(lessons.map(l=>l.subject))].sort().map(s=><option value={s} key={s}>{({math1:'Matematyka I',math2:'Matematyka II',cpp:'Programowanie C++',physics:'Fizyka',electronics:'Elektronika',ask:'Architektura komputerów'})[s]||s}</option>)}</select></label><label>Materiał z StudyLab<select value={lesson} onChange={e=>{setLesson(e.target.value);setHistory([]);setAnswer('');}}><option value="">Ogólne pytanie (bez lekcji)</option>{visible.map(l=><option key={l.slug} value={l.slug}>{l.title}</option>)}</select></label></div>
   <label>O co chcesz zapytać?<textarea rows="4" value={question} maxLength={1200} onChange={e=>setQuestion(e.target.value)} placeholder="Dlaczego |x−2| dla x≤2 jest równe 2−x?"/></label>
   <div className="studycoach-grid"><label>Styl pomocy<select value={kind} onChange={e=>setKind(e.target.value)}>{TOPICS.map(([id,t])=><option value={id} key={id}>{t}</option>)}</select></label><div className="studycoach-actions"><button type="button" onClick={askTutor} disabled={busy}>{busy?'Myślę…':'Zapytaj Gemini'}</button><button className="secondary" type="button" onClick={()=>{setHistory([]);setAnswer('');setMessage('Rozpoczęto nową rozmowę.');}}>Nowa rozmowa</button></div></div>
   {current&&<p className="studycoach-note">Kontekst: {current.title}. Zostanie wysłany fragment tej lekcji, maksymalnie 12 000 znaków.</p>}
  </section>:<section className="studycoach-panel">
   <label>Treść zadania<textarea rows="3" maxLength={2000} value={task} onChange={e=>setTask(e.target.value)}/></label>
   <label>Twoje kolejne kroki — jeden w każdej linijce<textarea className="mono" rows="8" maxLength={9000} value={steps} onChange={e=>setSteps(e.target.value)}/></label>
   <p className="studycoach-note">Automatyczne sprawdzanie porównuje wyrażenia, np. <code>x^2 - 4*x</code> i <code>(x-2)^2 - 4</code>. Obsługuje x, y, nawiasy, +, −, *, /, ^, sqrt() i abs(). Nie sprawdza równoważności równań ani dowodów.</p>
   <div className="studycoach-results"><h3>Wstępny test przekształceń</h3>{!stepResults.length?<p>Dodaj przynajmniej dwie linie, aby porównać kolejne wyrażenia.</p>:stepResults.map(r=><p key={r.to} className={'studycoach-result '+r.status}><b>{r.from} → {r.to}.</b> {r.label}</p>)}</div>
   <div className="studycoach-actions"><button disabled={busy} onClick={checkSteps}>{busy?'Sprawdzam…':'Oceń dokładniej z Gemini'}</button><button type="button" className="secondary" onClick={()=>{setSteps('');setAnswer('');setMessage('');}}>Wyczyść kroki</button></div>
  </section>}
  {message&&<p role="status" className="studycoach-status">{message}</p>}
  {answer&&<section className="studycoach-panel"><h3>Odpowiedź Gemini</h3><MathAnswer value={answer}/><div className="studycoach-actions"><button type="button" className="secondary" onClick={()=>navigator.clipboard?.writeText(answer)}>Kopiuj odpowiedź</button></div></section>}
  <p className="studycoach-privacy">Gemini jest opcjonalne. Dane są przesyłane do Google dopiero po kliknięciu „Zapytaj” lub „Oceń”. Klucz z <code>.env</code> pozostaje na lokalnym serwerze <code>{AI_BRIDGE_URL}</code>. Wynik AI nie zastępuje samodzielnej weryfikacji.</p>
 </div>;
}
