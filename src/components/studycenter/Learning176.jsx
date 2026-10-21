import React,{useMemo,useState} from 'react';
import { SUBJECTS } from './bank.js';
import {mistakesForReview,topicSignals,makeLearningPlan,isoDate} from './learning176.mjs';
import './learning176.css';
const SUBJECT_OPTIONS=[{id:'all',name:'Wszystkie przedmioty'},...SUBJECTS];
function SubjectPicker({value,onChange}){return <label className="sc176-field">Przedmiot<select value={value} onChange={e=>onChange(e.target.value)}>{SUBJECT_OPTIONS.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>}
function Topic({t}){return <span className="sc176-topic"><strong>{t.title}</strong><small>{t.subjectName||SUBJECTS.find(s=>s.id===t.subject)?.short}</small></span>}
function NiceDate({value}){return <time dateTime={value}>{value}</time>}
export function SmartMistakes176({db,onPractice,onCard}){
 const [subject,setSubject]=useState('all');
 const [showSolved,setShowSolved]=useState(false),[expand,setExpand]=useState({}),[info,setInfo]=useState('');
 const all=useMemo(()=>mistakesForReview(db,Date.now(),subject),[db,subject]);
 const shown=all.filter(m=>showSolved||!m.recovered);
 const due=all.filter(m=>m.due).length;
 function addCard(m){
  if(!m.question||!m.answer){setInfo('Brak pełnej treści — nie można utworzyć fiszki.');return;}
  onCard({id:`mistake176-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
   subject:m.subject,topic:m.topic,front:`${m.question}`.slice(0,300),back:`${m.answer}`.slice(0,800),
   why:(m.why||`Sprawdź, dlaczego właściwa jest odpowiedź: ${m.answer}`).slice(0,1200),
   symbols:'',example:'',lesson:m.lesson});
  setInfo('Fiszka zapisana w dotychczasowym systemie powtórek.');
 }
 return <div className="sc176-root"><header className="sc176-hero"><p className="sc176-kicker">BLACK EDITION · 17.6</p><h2>Inteligentny zeszyt błędów</h2><p>Oparty na rzeczywistych odpowiedziach. Błędy nie znikają po poprawnym kliknięciu — wracają do powtórki.</p></header>
 <div className="sc176-stats"><div><b>{all.length}</b><span>tematów z błędami</span></div><div><b>{due}</b><span>do przejrzenia teraz</span></div><div><b>{all.filter(m=>m.recovered).length}</b><span>z dwiema poprawnymi próbami z rzędu</span></div></div>
 <section className="sc176-panel"><div className="sc176-controls"><SubjectPicker value={subject} onChange={setSubject}/><label className="sc176-check"><input type="checkbox" checked={showSolved} onChange={e=>setShowSolved(e.target.checked)}/> Pokaż również utrwalone</label></div>
 <p className="sc176-muted">Powtórki błędów to heurystyka: nierozwiązane można ćwiczyć od razu, po jednej poprawnej próbie wracają po 3 dniach, a po dwóch po 7 dniach. Fiszki nadal używają istniejącego FSRS-5. System nie ocenia automatycznie przyczyny pomyłki.</p>
 {info&&<p className="sc176-status" role="status">{info}</p>}
 {!shown.length?<div className="sc176-empty"><strong>Brak zapisanych błędów w tym zakresie.</strong><p>Wykonaj quiz lub zadanie, aby zobaczyć indywidualne powtórki.</p></div>:<div className="sc176-list">{shown.map(m=><article className="sc176-mistake" key={m.key}>
  <div className="sc176-between"><Topic t={m}/><span className={`sc176-state ${m.due?'is-due':''}`}>{m.due?'Do powtórki':m.recovered?'Utrwalane':'Późniejsza powtórka'}</span></div>
  <h3>{m.question}</h3><div className="sc176-detail"><div><small>Twoja wcześniejsza błędna odpowiedź</small><p>{m.given}</p></div><div><small>Oczekiwana odpowiedź</small><p>{m.answer||'Brak danych'}</p></div></div>
  {expand[m.key]&&<div className="sc176-explain"><strong>Dlaczego?</strong><p>{m.why||'W bazie nie ma jeszcze wyjaśnienia do tego pytania.'}</p><p className="sc176-muted">Błędów: {m.failures} · Prób: {m.attempts} · Poprawnych kolejno: {m.correctStreak}</p></div>}
  <div className="sc176-actions"><button type="button" className="sc176-primary" onClick={()=>onPractice(m.subject,m.topic)}>Ćwicz ten temat</button><button type="button" onClick={()=>setExpand(x=>({...x,[m.key]:!x[m.key]}))}>{expand[m.key]?'Ukryj':'Pokaż'} wyjaśnienie</button><button type="button" onClick={()=>addCard(m)}>Utwórz fiszkę</button></div>
 </article>)}</div>}
 </section></div>;
}
export function ExamPlanner177({db,onPractice,onGoCalendar,onSave}){
 const p=db.planner||{subject:'all',examDate:'',minutes:25};
 const exams=(db.exams||[]).filter(e=>e.date>=isoDate()).sort((a,b)=>a.date.localeCompare(b.date));
 const [target,setTarget]=useState('saved');
 const [subject,setSubject]=useState(p.subject||'all'),[date,setDate]=useState(p.examDate||''),[minutes,setMinutes]=useState(p.minutes||25),[days,setDays]=useState(14),[showAll,setShowAll]=useState(false);
 const selected=exams.find(e=>e.id===target);
 const options=selected?{subject:selected.subject,examDate:selected.date,minutes:selected.minutes||minutes}:
   {subject,examDate:date,minutes};
 const {plan,until,topicsCount}=useMemo(()=>makeLearningPlan(db,{...options,horizon:days}),[db,options.subject,options.examDate,options.minutes,days]);
 const signals=useMemo(()=>topicSignals(db,options.subject),[db,options.subject]);
 const visible=showAll?plan:plan.slice(0,7);
 return <div className="sc176-root"><header className="sc176-hero"><p className="sc176-kicker">BLACK EDITION · 17.7</p><h2>Plan przygotowania do kolokwium</h2><p>Codzienna rozpiska na podstawie terminów, czasu i wyników. Bez losowych ocen ani presji na nieprzerwane serie.</p></header>
 <section className="sc176-panel"><div className="sc176-controls"><label className="sc176-field">Źródło planu<select value={target} onChange={e=>setTarget(e.target.value)}><option value="saved">Ustawienia własne</option>{exams.map(e=><option key={e.id} value={e.id}>{e.title} · {e.date}</option>)}</select></label>
 {!selected&&<><SubjectPicker value={subject} onChange={setSubject}/><label className="sc176-field">Data kolokwium (opcjonalnie)<input type="date" min={isoDate()} value={date} onChange={e=>setDate(e.target.value)}/></label><label className="sc176-field">Minut dziennie<select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[10,15,20,25,30,45,60,90].map(x=><option value={x} key={x}>{x} min</option>)}</select></label><label className="sc176-field">Plan bez terminu<select value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,14,21,30].map(x=><option key={x} value={x}>{x} dni</option>)}</select></label></>}
 </div><p className="sc176-muted">{selected?'Plan opiera się na terminie z istniejącego kalendarza.':'Te ustawienia służą do podglądu, nie zmieniają zapisanego planera.'} {until===null?'Nie podano przyszłego terminu; wyświetlam plan cykliczny.':`Do kolokwium: ${until} dni.`} Tematów dostępnych w banku: {topicsCount}.</p>
 {!selected&&<button type="button" className="sc176-link" onClick={()=>onSave({subject,examDate:date,minutes})}>Zapisz ustawienia w StudyLab</button>} {exams.length===0&&<button type="button" className="sc176-link" onClick={onGoCalendar}>Dodaj termin do kalendarza →</button>}
 </section>
 <section className="sc176-panel"><div className="sc176-between"><h3>Tematy wymagające uwagi</h3><span className="sc176-count">Ostatnie 8 prób na temat</span></div><div className="sc176-topic-list">{signals.slice(0,6).map(t=><button type="button" key={t.key} className="sc176-topic-button" onClick={()=>onPractice(t.subject,t.topic)}><Topic t={t}/><span>{t.accuracy===null?'Bez prób':`${t.accuracy}% w próbach`}</span><small>{t.reason}</small></button>)}</div></section>
 <section className="sc176-panel"><div className="sc176-between"><h3>Harmonogram</h3><span className="sc176-count">{plan.length} dni</span></div><p className="sc176-muted">Oznaczenie „zarejestrowana aktywność” informuje o próbie lub powtórce z danego dnia — nie oznacza ukończenia całej sesji.</p>
 <div className="sc176-days">{visible.map((day,i)=><article key={day.date} className="sc176-day"><div className="sc176-day-head"><span className="sc176-day-index">{String(day.day).padStart(2,'0')}</span><div><h4><NiceDate value={day.date}/> · {day.intensity}</h4><small>{day.totalMinutes} min · {day.activityRecorded?'Zarejestrowana aktywność':'Brak zapisanej aktywności'}</small></div></div><div className="sc176-timeline"><span>Fiszki {day.reviewMinutes} min</span><span>Zadania {day.practiceMinutes} min</span><span>Wnioski {day.reflectMinutes} min</span></div><div className="sc176-day-subjects">{day.topics.map(t=><button type="button" key={t.key} onClick={()=>onPractice(t.subject,t.topic)}>{t.title} ↗</button>)}</div></article>)}</div>
 {plan.length>7&&<button className="sc176-more" type="button" onClick={()=>setShowAll(x=>!x)}>{showAll?'Pokaż tylko pierwszy tydzień':'Pokaż cały harmonogram'}</button>}</section>
 <p className="sc176-muted">Plan to propozycja, nie automatyczny harmonogram powiadomień. Żaden wynik nie jest wpisywany do postępów bez faktycznego ćwiczenia. Harmonogram aktualizuje się wraz z próbami i powtórkami.</p></div>;
}
