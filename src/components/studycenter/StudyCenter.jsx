import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SUBJECTS, TOPICS, QUESTIONS, FLASHCARDS, topicLabel, subjectById, lessonHref } from './bank.js';
import { TOTAL_GENERATORS, generateTask, checkTaskAnswer } from './generators-v4.js';
import { easierTask } from './easy-tasks-73.mjs';
import { pickAdaptiveQuestions, availableLessonItems, filterLessonItems, explainFocus } from './learning-v2.js';
import { DEFAULT_DB, safeRead, save, validate, shuffled, pickQuestions, scheduleCard, cardsFor, getStats, recentMistakes, bookmarkedHref } from './engine.js';
import { reviewFSRS, FSRS_VERSION, retentionAt } from './fsrs.js';

import CloudAccount from './CloudAccount.jsx';
import { useCloudSync } from './useCloudSync.jsx';
import { markDeleted, toggleCloudBookmark, bumpModified, addCloudItem } from './cloud-merge.js';
import './cloud-styles.css';
import '../../styles/study-center.css';
import StudyCenterPlus from './StudyCenterPlus.jsx';
import StudyCenterWorkshop from './StudyCenterWorkshop.jsx';
import StudyCenterNext from './StudyCenterNext.jsx';
import './study-center-73.css';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const localHref = route => `${BASE}${String(route||'').replace(/^\/+/, '')}`;
const TODAY = () => new Date().toLocaleDateString('sv-SE');
const prettyDate = stamp => new Date(stamp).toLocaleDateString('pl-PL', { day:'2-digit', month:'short', year:'numeric' });
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
const SHORT = {overview:'Pulpit',quiz:'Quizy',cards:'Fiszki',tasks:'Zadania',adaptive:'Trening',exam:'Kolokwium',errors:'Błędy',stats:'Statystyki',calendar:'Kalendarz',planner:'Plan nauki',library:'Moje materiały',sync:'Synchronizacja',plus:'Laboratorium nauki',workshop:'Warsztat 7.0',next:'StudyLab 7.2'};
const ICONS = {overview:'◫',quiz:'◇',cards:'▤',tasks:'∑',adaptive:'◎',exam:'◷',errors:'↺',stats:'▥',planner:'▦',calendar:'◷',library:'☆',sync:'☁',plus:'✦',workshop:'◈',next:'✧'};
const BookmarkContext = React.createContext({bookmarks:[],toggle:()=>{}});

function SectionTitle({eyebrow,title,children}){return <div className="sc-section-title"><div><span className="sc-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{children&&<div>{children}</div>}</div>;}
function SubjectSelect({value,onChange,all=true,id='subject'}){
 return <label className="sc-field" htmlFor={id}><span>Przedmiot</span><select id={id} value={value} onChange={e=>onChange(e.target.value)}>{all&&<option value="all">Wszystkie przedmioty</option>}{SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>;
}
function TopicSelect({subject,value,onChange,id='topic'}){
 const opts=subject==='all'?[]:(TOPICS[subject]||[]);
 return <label className="sc-field" htmlFor={id}><span>Zagadnienie</span><select id={id} value={value} onChange={e=>onChange(e.target.value)}><option value="all">Cały zakres</option>{opts.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>;
}
function LinkLesson({subject,slug,label='Wróć do lekcji'}){
 const href=lessonHref(subject,slug);
 const {bookmarks,toggle}=React.useContext(BookmarkContext);
 return href?<span className="sc-lesson-actions"><a className="sc-lesson-link" href={localHref(href)}>{label}<span aria-hidden="true"> ↗</span></a><button className="sc-bookmark" aria-pressed={bookmarks.includes(href)} aria-label={bookmarks.includes(href)?'Usuń zakładkę do lekcji':'Zapisz lekcję w zakładkach'} title={bookmarks.includes(href)?'Usuń z zapisanych':'Zapisz lekcję'} onClick={()=>toggle(href)}>{bookmarks.includes(href)?'★':'☆'}</button></span>:null;
}
function Meter({value,max=100}){return <div className="sc-meter" role="progressbar" aria-valuenow={value||0} aria-valuemin="0" aria-valuemax={max}><span style={{width:`${Math.max(0,Math.min(100,100*(value||0)/max))}%`}}/></div>;}
function Empty({title,children}){return <div className="sc-empty"><span className="sc-empty-mark" aria-hidden="true">◇</span><h3>{title}</h3><p>{children}</p></div>;}
function SmallTag({children}){return <span className="sc-tag">{children}</span>;}
function Stat({value,label,sub}){return <div className="sc-stat"><strong>{value}</strong><span>{label}</span>{sub&&<small>{sub}</small>}</div>;}

function Overview({db,stats,setTab}){
 const last=recentMistakes(db).slice(0,3);
 const todayGoal=db.settings.goal||15;
 return <>
  <SectionTitle eyebrow="PRZEGLĄD" title="Twoja nauka"><SmallTag>{stats.streak>0?`${stats.streak} dni aktywności`:'Pierwsza sesja czeka'}</SmallTag></SectionTitle>
  <div className="sc-stats-grid">
   <Stat value={stats.reviewed} label="Rozwiązane pytania" sub="quizy, zadania i testy"/>
   <Stat value={stats.accuracy===null?'—':`${stats.accuracy}%`} label="Skuteczność" sub="poprawne odpowiedzi"/>
   <Stat value={stats.due} label="Fiszki do nauki" sub="nowe i do powtórki"/>
   <Stat value={`${stats.todayDone}/${todayGoal}`} label="Dzisiejsza aktywność" sub="odpowiedzi i fiszki"/>
  </div>
  <section className="sc-panel"><div className="sc-between"><div><h3>Cel na dziś</h3><p>Krótka sesja jest lepsza niż nauka bez przerw.</p></div><strong>{Math.min(100,Math.round(100*stats.todayDone/todayGoal))}%</strong></div><Meter value={Math.min(todayGoal,stats.todayDone)} max={todayGoal}/><div className="sc-actions"><button className="sc-primary" onClick={()=>setTab('cards')}>Powtórz fiszki <span aria-hidden="true">↗</span></button><button className="sc-secondary" onClick={()=>setTab('quiz')}>Rozpocznij quiz</button><button className="sc-secondary" onClick={()=>setTab('tasks')}>Losuj zadanie</button></div></section>
  <div className="sc-two-col"><section className="sc-panel"><h3>Przedmioty</h3><p className="sc-muted">Skuteczność oznacza odsetek poprawnych odpowiedzi, a nie zaliczenie całego kursu.</p><div className="sc-progress-list">{stats.bySubject.map(s=><div key={s.id} className="sc-subject-progress"><div className="sc-between"><span><i style={{background:s.color}}/>{s.short}</span><strong>{s.percent===null?'Jeszcze bez danych':`${s.percent}%`}</strong></div><Meter value={s.percent??0}/></div>)}</div></section>
   <section className="sc-panel"><h3>Co teraz ćwiczyć?</h3>{stats.weak.length?<><p className="sc-muted">Zagadnienia z co najmniej dwoma odpowiedziami i skutecznością poniżej 70%.</p>{stats.weak.slice(0,4).map(w=><div className="sc-weak" key={`${w.subject}-${w.id}`}><span>{w.subjectName}<b>{w.title}</b></span><strong>{w.rate}%</strong></div>)}</>:<Empty title="Jeszcze nie ma słabszych tematów">Rozwiąż kilka quizów. Gdy pojawią się błędy, system wskaże zagadnienia do powtórki.</Empty>}
    {last.length>0&&<button className="sc-inline-action" onClick={()=>setTab('errors')}>Otwórz zeszyt błędów →</button>}</section></div>
  <section className="sc-panel"><div className="sc-between"><div><h3>Szybki wybór</h3><p>Ucz się na różne sposoby, nie tylko czytając notatki.</p></div></div><div className="sc-tile-grid">{[['quiz','Quizy','Pytania z wyjaśnieniami'],['cards','Fiszki','Powtórki w odpowiednich odstępach'],['tasks','Zadania','Nowe liczby i automatyczne sprawdzanie'],['adaptive','Trening adaptacyjny','Słabsze i nieprzećwiczone tematy'],['exam','Kolokwium','Test na czas bez podpowiedzi'],['calendar','Kalendarz','Terminy i sesje przed zaliczeniami'],['sync','Chmura','Postępy na telefonie i komputerze'],['workshop','Warsztat 7.0','Ścieżki, wzory, laboratoria i notatki'],['next','StudyLab 7.2','Mapa wiedzy, powtórki, edytor i statystyki']].map(([key,title,desc])=><button key={key} className="sc-tile" onClick={()=>setTab(key)}><span aria-hidden="true">{ICONS[key]}</span><strong>{title}</strong><small>{desc}</small><i aria-hidden="true">↗</i></button>)}</div></section>
 </>;
}

function QuizPanel({db,onAttempt,onSession,examMode=false,adaptiveMode=false,focus=null}){
 const [subject,setSubject]=useState(focus?.subject||'all'); const [topic,setTopic]=useState(focus?.topic||'all'); const [count,setCount]=useState(10);
 const [onlyLesson,setOnlyLesson]=useState(!!focus?.lesson && availableLessonItems(QUESTIONS, focus).length>0);
 const focused=focus&&focus.subject===subject&&focus.lesson?focus:null;
 const exactCount=focused?availableLessonItems(QUESTIONS,focused).length:0;
 const [active,setActive]=useState(null); const [phase,setPhase]=useState('setup');const [idx,setIdx]=useState(0);
 const [selected,setSelected]=useState({});const [checked,setChecked]=useState({});const [revealed,setRevealed]=useState(false);
 const [finished,setFinished]=useState([]);const [clock,setClock]=useState(Date.now());const [deadline,setDeadline]=useState(0);
 const [minutes,setMinutes]=useState(15);const [easyOpen,setEasyOpen]=useState(false);const finishing=useRef(false);
 const durationSecs=deadline?Math.max(0,Math.ceil((deadline-clock)/1000)):0;
 const errors=new Set(db.attempts.filter(a=>!a.ok).slice(-160).map(x=>x.id));
 function start(){
  const generated=adaptiveMode?pickAdaptiveQuestions(db,subject,topic,count):onlyLesson&&focused&&exactCount?filterLessonItems(pickQuestions(subject,topic,QUESTIONS.length,[]),focused).slice(0,count):pickQuestions(subject,topic,count,[...db.attempts.slice(-20).map(a=>a.id)]);
  if(!generated.length)return;
  setActive(generated);setPhase('running');setEasyOpen(false);setIdx(0);setSelected({});setChecked({});setRevealed(false);setFinished([]);finishing.current=false;
  const end=Date.now()+minutes*60*1000;setDeadline(end);setClock(Date.now());
 }
 useEffect(()=>{
  if(!(examMode&&phase==='running'))return;
  const timer=window.setInterval(()=>setClock(Date.now()),1000);return ()=>window.clearInterval(timer);
 },[examMode,phase]);
 const question=active?.[idx]; const selectedOriginal=selected[idx];
 const isChecked=!!checked[idx]; const isCorrect=selectedOriginal===question?.correct;
 const completed=Object.keys(checked).length;
 function commitQuestion(){
  if(!question || selectedOriginal===undefined || isChecked)return;
  const ok=selectedOriginal===question.correct;
  onAttempt({id:question.id,subject:question.subject,topic:question.topic,question:question.stem,given:question.options[selectedOriginal],answer:question.options[question.correct],why:question.why,lesson:question.lesson,ok,mode:adaptiveMode?'adaptive':'quiz',hints:revealed?1:0,date:Date.now()});
  setChecked(p=>({...p,[idx]:true}));
 }
 function nextQuestion(){if(idx===(active?.length||1)-1){completeQuiz();}else{setIdx(i=>i+1);setRevealed(false);setEasyOpen(false);}}
 function completeQuiz(){
  const arr=active||[];const tally=arr.reduce((sum,q,i)=>sum+(checked[i]&&selected[i]===q.correct?1:0),0);
  setFinished(arr.map((q,i)=>({...q,selected:selected[i],wasChecked:!!checked[i]})));
  onSession({mode:adaptiveMode?'adaptive':'quiz',score:tally,total:arr.length,date:Date.now()});setPhase('done');
 }
 function completeExam(){
  if(finishing.current||!active)return;finishing.current=true;
  const results=active.map((q,i)=>({...q,selected:selected[i]}));
  const n=results.filter(x=>x.selected===x.correct).length;
  for(const q of results){onAttempt({id:q.id,subject:q.subject,topic:q.topic,question:q.stem,given:q.selected===undefined?'Brak odpowiedzi':q.options[q.selected],answer:q.options[q.correct],why:q.why,lesson:q.lesson,ok:q.selected===q.correct,mode:'exam',hints:0,date:Date.now()});}
  onSession({mode:'exam',score:n,total:results.length,date:Date.now()});
  setFinished(results);setPhase('done');
 }
 useEffect(()=>{if(examMode&&phase==='running'&&deadline&&durationSecs===0){completeExam();}},[examMode,phase,deadline,durationSecs]);
 const score=finished.filter(q=>q.selected===q.correct&&(!(!examMode&&!q.wasChecked))).length;
 return <>
 <SectionTitle eyebrow={examMode?'TRYB EGZAMINACYJNY':adaptiveMode?'PRIORYTET TRUDNYCH TEMATÓW':'AKTYWNE PRZYPOMINANIE'} title={examMode?'Próbne kolokwium':adaptiveMode?'Trening adaptacyjny':'Quizy wiedzy'}><SmallTag>{examMode?'Bez podpowiedzi':adaptiveMode?'Na podstawie Twoich prób':'Z wyjaśnieniami odpowiedzi'}</SmallTag></SectionTitle>
 {phase==='setup'&&<section className="sc-panel"><h3>Ustawienia {examMode?'kolokwium':'quizu'}</h3><p>{adaptiveMode?'Pytania dobierane są na podstawie Twoich błędów i dotychczas nieprzećwiczonych tematów. To przejrzysty algorytm, bez AI.':'Wybierz materiał. Pytania pochodzą z przygotowanej bazy StudyLab; odpowiedzi są automatycznie tasowane.'}</p>{focused&&<div className="sc-focus-note">{explainFocus(QUESTIONS,focused)} <a href={localHref(lessonHref(focused.subject,focused.lesson))}>Wróć do lekcji ↗</a></div>}<div className="sc-form-grid"><SubjectSelect value={subject} onChange={v=>{setSubject(v);setTopic('all')}} id={examMode?'exam-subject':'quiz-subject'}/><TopicSelect subject={subject} value={topic} onChange={setTopic} id={examMode?'exam-topic':'quiz-topic'}/><label className="sc-field"><span>Liczba pytań (maksimum dostępnych)</span><select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label>{examMode&&<label className="sc-field"><span>Limit czasu</span><select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}><option value={5}>5 minut</option><option value={10}>10 minut</option><option value={15}>15 minut</option><option value={30}>30 minut</option></select></label>}</div>{focused&&exactCount>0&&!adaptiveMode&&<label className="sc-toggle"><input type="checkbox" checked={onlyLesson} onChange={e=>setOnlyLesson(e.target.checked)}/>Tylko pytania dokładnie do tej lekcji ({exactCount})</label>}<div className="sc-info-line"><span>W bazie: <strong>{QUESTIONS.filter(q=>(subject==='all'||q.subject===subject)&&(topic==='all'||q.topic===topic)).length}</strong> różnych pytań</span>{errors.size>0&&<span>{errors.size} pytań wystąpiło w poprzednich błędach</span>}</div><button className="sc-primary" onClick={start}>Rozpocznij {examMode?'kolokwium':'quiz'} <span aria-hidden="true">→</span></button></section>}
 {phase==='running'&&question&&<section className="sc-panel sc-test-panel"><div className="sc-between sc-question-meta"><span>Pytanie <strong>{idx+1}</strong> z {active.length}</span><div className="sc-meta-right">{examMode&&<span className={durationSecs<60?'sc-time-alert':'sc-timer'} aria-live="off">{String(Math.floor(durationSecs/60)).padStart(2,'0')}:{String(durationSecs%60).padStart(2,'0')}</span>}<SmallTag>{subjectById(question.subject)?.short} / {topicLabel(question.subject,question.topic)}</SmallTag></div></div><Meter value={idx+1} max={active.length}/><h3 className="sc-question">{question.stem}</h3>{question.easy&&<div className="sc-simplify"><button type="button" className="sc-simplify-button" aria-expanded={easyOpen} aria-controls="sc-simple-question" onClick={()=>setEasyOpen(v=>!v)}>{easyOpen?'Ukryj prostsze wyjaśnienie':'Nie rozumiem pytania — pokaż prostszą wersję'} <span aria-hidden="true">{easyOpen?'−':'+'}</span></button>{easyOpen&&<div className="sc-simplify-content" id="sc-simple-question"><strong>To samo pytanie, prostszymi słowami:</strong><p>{question.easy}</p></div>}</div>}<div className="sc-option-list">{question.shuffledOptions.map(({value,index})=>{
  const chosen=selectedOriginal===index; const correct=index===question.correct;
  const className=`sc-option ${chosen?'sc-option--selected':''} ${!examMode&&isChecked&&correct?'sc-option--correct':''} ${!examMode&&isChecked&&chosen&&!correct?'sc-option--wrong':''}`;
  return <button key={index} disabled={!examMode&&isChecked} className={className} onClick={()=>setSelected(p=>({...p,[idx]:index}))}><span className="sc-option-mark">{String.fromCharCode(65+question.shuffledOptions.findIndex(opt=>opt.index===index))}</span><span>{value}</span>{!examMode&&isChecked&&correct&&<span aria-hidden="true">✓</span>}</button>;
 })}</div>{!examMode&&<>{!isChecked&&<button className="sc-hint" onClick={()=>setRevealed(v=>!v)}>{revealed?'Ukryj podpowiedź':'Pokaż podpowiedź'} {revealed?'−':'+'}</button>}{revealed&&!isChecked&&<p className="sc-hint-body">{question.hint}</p>}{isChecked&&<div className={`sc-feedback ${isCorrect?'sc-feedback--good':'sc-feedback--bad'}`} aria-live="polite"><strong>{isCorrect?'Dobrze!':'Jeszcze nie tym razem'}</strong><p>{question.why}</p><LinkLesson subject={question.subject} slug={question.lesson}/></div>}</>}
 <div className="sc-actions sc-actions--end">{examMode?<><button className="sc-secondary" disabled={idx===0} onClick={()=>{setIdx(i=>i-1);setEasyOpen(false);}}>← Poprzednie</button>{idx<active.length-1?<button className="sc-primary" onClick={()=>{setIdx(i=>i+1);setEasyOpen(false);}}>Następne →</button>:<button className="sc-primary" onClick={completeExam}>Zakończ kolokwium</button>}</>:!isChecked?<button className="sc-primary" disabled={selectedOriginal===undefined} onClick={commitQuestion}>Sprawdź odpowiedź</button>:<button className="sc-primary" onClick={nextQuestion}>{idx===active.length-1?'Pokaż wynik':'Następne pytanie →'}</button>}</div>
 {examMode&&<div className="sc-exam-nav" aria-label="Nawigacja między pytaniami">{active.map((q,i)=><button key={q.id} aria-label={`Pytanie ${i+1}`} className={`${i===idx?'is-active':''} ${selected[i]!==undefined?'is-done':''}`} onClick={()=>{setIdx(i);setEasyOpen(false);}}>{i+1}</button>)}</div>}</section>}
 {phase==='done'&&<><section className="sc-panel sc-result"><div className="sc-result-ring">{Math.round(100*score/(finished.length||1))}%</div><h3>{examMode?'Kolokwium zakończone':'Quiz ukończony'}</h3><p>{score} / {finished.length} poprawnych odpowiedzi. {score===finished.length?'Świetna praca!':'Warto przejrzeć wyjaśnienia i wrócić do trudniejszych pytań.'}</p><div className="sc-actions"><button className="sc-primary" onClick={start}>Nowy zestaw</button><button className="sc-secondary" onClick={()=>setPhase('setup')}>Zmień zakres</button></div></section><section className="sc-panel"><h3>Omówienie pytań</h3><div className="sc-review-list">{finished.map((q,i)=><div key={`${q.id}-${i}`} className="sc-review-item"><span className={q.selected===q.correct?'sc-ok':'sc-no'}>{q.selected===q.correct?'✓':'×'}</span><div><strong>{q.stem}</strong><small>Twoja odpowiedź: {q.selected===undefined?'Brak':q.options[q.selected]}</small><small>Poprawna: {q.options[q.correct]}</small><p>{q.why}</p><LinkLesson subject={q.subject} slug={q.lesson}/></div></div>)}</div></section></>}
 </>;
}

function FlashcardPanel({db,onReview,onRetention,focus=null}){
 const [subject,setSubject]=useState(focus?.subject||'all'),[topic,setTopic]=useState(focus?.topic||'all'),[onlyDue,setOnlyDue]=useState(true);
 const [onlyLesson,setOnlyLesson]=useState(!!focus?.lesson&&availableLessonItems(FLASHCARDS,focus).length>0);
 const focused=focus&&focus.subject===subject&&focus.lesson?focus:null;const exactCount=focused?availableLessonItems(FLASHCARDS,focused).length:0;
 const [seen,setSeen]=useState([]),[flipped,setFlipped]=useState(false),[lastInfo,setLastInfo]=useState('');
 const cards=useMemo(()=>cardsFor(db,subject,topic,onlyDue).filter(c=>(!onlyLesson||!focused||!exactCount||c.lesson===focused.lesson)&&!seen.includes(c.id)),[db,subject,topic,onlyDue,seen,onlyLesson,focused?.lesson,exactCount]);
 const card=cards[0];const total=cardsFor(db,subject,topic,onlyDue).length;const learned=card?db.cards[card.id]?.fsrs:null;const recall=learned?.lastReview?Math.round(100*retentionAt(learned.stability,Math.max(0,(Date.now()-learned.lastReview)/86400000))):null;
 function changeSubject(v){setSubject(v);setTopic('all');setSeen([]);setFlipped(false);setLastInfo('');}
 function changeTopic(v){setTopic(v);setSeen([]);setFlipped(false);setLastInfo('');}
 function rate(rating){if(!card)return;const state=reviewFSRS(db.cards[card.id],db.reviews,card.id,rating,Date.now(),db.settings.retention||0.9);onReview(card.id,rating,state);setSeen(p=>[...p,card.id]);setFlipped(false);setLastInfo(rating==='again'?'Powtórka za 1 minutę':rating==='hard'&&!db.cards[card.id]?.fsrs?'Powtórka za 10 minut':`Następna powtórka: ${prettyDate(state.due)}`);}
 return <><SectionTitle eyebrow="POWTÓRKI INTERWAŁOWE" title="Fiszki"><SmallTag>{FLASHCARDS.length+db.customCards.length} fiszek w bibliotece</SmallTag></SectionTitle>
  <section className="sc-panel"><div className="sc-form-grid"><SubjectSelect value={subject} onChange={changeSubject} id="card-subject"/><TopicSelect subject={subject} value={topic} onChange={changeTopic} id="card-topic"/></div>{focused&&<div className="sc-focus-note">{explainFocus(FLASHCARDS,focused)} <a href={localHref(lessonHref(focused.subject,focused.lesson))}>Wróć do lekcji ↗</a></div>}{focused&&exactCount>0&&<label className="sc-toggle"><input type="checkbox" checked={onlyLesson} onChange={e=>{setOnlyLesson(e.target.checked);setSeen([]);}}/>Tylko fiszki dokładnie do tej lekcji ({exactCount})</label>}<label className="sc-toggle"><input type="checkbox" checked={onlyDue} onChange={e=>{setOnlyDue(e.target.checked);setSeen([]);setFlipped(false);}}/>Tylko nowe i zaplanowane na teraz</label><label className="sc-field sc-retention-setting"><span>Docelowe zapamiętywanie (FSRS-5)</span><select value={db.settings.retention||0.9} onChange={e=>onRetention(Number(e.target.value))}><option value={0.85}>85% — mniej powtórek</option><option value={0.9}>90% — zalecane</option><option value={0.95}>95% — więcej powtórek</option></select></label><p className="sc-muted">Oceń, czy potrafiłeś odtworzyć odpowiedź <strong>przed</strong> odwróceniem karty. Nowe oceny planuje model FSRS-5. Starsze terminy z SM-2 pozostają ważne, dopóki nie ocenisz ponownie danej fiszki.</p></section>
  {card?<section className="sc-card-session"><div className="sc-between"><span className="sc-eyebrow">{subjectById(card.subject)?.short} / {topicLabel(card.subject,card.topic)}</span><span className="sc-tag">{cards.length} w tej sesji{recall!==null?` · FSRS: ${recall}%`:''}</span></div><button className={`sc-flashcard ${flipped?'is-flipped':''}`} onClick={()=>setFlipped(f=>!f)} aria-label={flipped?'Pokaż pytanie':'Pokaż odpowiedź'}><span>{flipped?'ODPOWIEDŹ':'PYTANIE'}</span><strong>{flipped?card.back:card.front}</strong><small>Kliknij, aby {flipped?'wrócić do pytania':'odwrócić fiszkę'}</small></button>{flipped&&<div className="sc-card-explanation" aria-label="Wyjaśnienie odpowiedzi"><h3>Dlaczego tak jest?</h3><p>{card.why||'Ta fiszka została dodana przez użytkownika. Jeżeli sama odpowiedź nie wystarcza, dopisz uzasadnienie we własnym materiale.'}</p>{card.symbols&&<div className="sc-card-explanation-part"><strong>Co oznaczają symbole?</strong><p>{card.symbols}</p></div>}{card.example&&<div className="sc-card-explanation-part"><strong>Przykład krok po kroku</strong><p>{card.example}</p></div>}</div>}{flipped?<><LinkLesson subject={card.subject} slug={card.lesson}/><div className="sc-card-ratings">{[['again','Nie pamiętam'],['hard','Trudne'],['good','Umiem'],['easy','Bardzo łatwe']].map(([val,label])=><button key={val} className={`sc-rate sc-rate--${val}`} onClick={()=>rate(val)}>{label}</button>)}</div></>:<p className="sc-flash-info">Spróbuj odpowiedzieć z pamięci, zanim odwrócisz kartę.</p>}</section>:<section className="sc-panel"><Empty title="Sesja fiszek zakończona">{onlyDue?'Na razie nie ma więcej kart do przejrzenia w wybranym zakresie.':'Przejrzałeś wszystkie fiszki z tego zestawu.'}</Empty>{lastInfo&&<p className="sc-muted">{lastInfo}</p>}<button className="sc-secondary" onClick={()=>{setSeen([]);setFlipped(false);}}>Rozpocznij ponownie</button></section>}
 </>;
}

function TasksPanel({onAttempt,initialSubject='all',initialTopic='all',focus=null}){
 const [subject,setSubject]=useState(initialSubject),[topic,setTopic]=useState(initialTopic),[t,setT]=useState(()=>generateTask(initialSubject,initialTopic));
 const [input,setInput]=useState(''),[checked,setChecked]=useState(false),[correct,setCorrect]=useState(false),[hints,setHints]=useState(0);
 const [stepInputs,setStepInputs]=useState({}),[stepChecked,setStepChecked]=useState({});
 const [easyTaskOpen,setEasyTaskOpen]=useState(false);
 function newTask(s=subject,top=topic){setT(prev=>generateTask(s,top,prev?.key));setInput('');setChecked(false);setCorrect(false);setHints(0);setStepInputs({});setStepChecked({});setEasyTaskOpen(false);}
 function checkStep(i){const step=t.steps?.[i];const val=stepInputs[i];if(!step||stepChecked[i]||!String(val||'').trim())return;
   const numeric=Number(String(val).replace(',','.'));const ok=Number.isFinite(numeric)&&Math.abs(numeric-step.expected)<=Math.max(0.0001,Math.abs(step.expected)*0.000001);
   setStepChecked(prev=>({...prev,[i]:{ok,given:val}}));
   onAttempt({id:`${t.key}:step${i+1}`,subject:t.subject,topic:t.topic,question:step.label,given:String(val),answer:`${step.expected} ${step.unit||''}`,why:step.explanation,lesson:t.lesson,ok,mode:'task-step',hints:0,date:Date.now()});
 }
 function check(){if(checked||!input.trim())return;const ok=checkTaskAnswer(input,t);setChecked(true);setCorrect(ok);
  onAttempt({id:t.key,subject:t.subject,topic:t.topic,question:t.prompt,given:input.trim(),answer:t.displayAnswer,why:t.solution,lesson:t.lesson,ok,mode:'task',hints,date:Date.now()});
 }
 return <><SectionTitle eyebrow="GENERATOR OFFLINE" title="Zadania praktyczne"><SmallTag>{TOTAL_GENERATORS} typów zadań</SmallTag></SectionTitle>
 <section className="sc-panel"><div className="sc-form-grid"><SubjectSelect id="task-subject" value={subject} onChange={v=>{setSubject(v);setTopic('all');newTask(v,'all')}}/><TopicSelect id="task-topic" subject={subject} value={topic} onChange={v=>{setTopic(v);newTask(subject,v)}}/></div>{focus?.lesson&&<div className="sc-focus-note">Zadania losowane z rozdziału dotyczącego tej lekcji, niekoniecznie z identycznego przykładu. <a href={localHref(lessonHref(focus.subject,focus.lesson))}>Wróć do lekcji ↗</a></div>}<p className="sc-muted">JavaScript losuje nowe dane i oblicza odpowiedź. To nie są losowe teksty ani odpowiedzi generowane przez AI.</p></section>
 <section className="sc-panel sc-task-panel"><div className="sc-between"><SmallTag>{subjectById(t.subject)?.short} / {topicLabel(t.subject,t.topic)}</SmallTag><button className="sc-inline-action" onClick={()=>newTask()}>Inny przykład ↻</button></div><h3>{t.title}</h3><p className="sc-task-prompt">{t.prompt}</p><div className="sc-simplify"><button type="button" className="sc-simplify-button" aria-expanded={easyTaskOpen} aria-controls="sc-simple-task" onClick={()=>setEasyTaskOpen(v=>!v)}>{easyTaskOpen?'Ukryj prostszą wersję':'Nie rozumiem zadania — wyjaśnij prościej'} <span aria-hidden="true">{easyTaskOpen?'−':'+'}</span></button>{easyTaskOpen&&<div className="sc-simplify-content" id="sc-simple-task"><strong>Co właściwie trzeba obliczyć?</strong><p>{easierTask(t)}</p></div>}</div>{t.steps?.length>0&&<div className="sc-task-steps"><h4>Kroki pośrednie (opcjonalnie)</h4><p className="sc-muted">Sprawdź obliczenia częściowe przed podaniem wyniku końcowego.</p>{t.steps.map((step,i)=><div key={`${t.id}-step${i}`} className="sc-task-step"><label className="sc-field"><span>{i+1}. {step.label}</span><input type="text" inputMode="decimal" autoComplete="off" value={stepInputs[i]||''} disabled={!!stepChecked[i]} onChange={e=>setStepInputs(p=>({...p,[i]:e.target.value}))}/></label>{!stepChecked[i]?<button className="sc-secondary" disabled={!String(stepInputs[i]||'').trim()} onClick={()=>checkStep(i)}>Sprawdź krok</button>:<p role="status" className={stepChecked[i].ok?'sc-step-correct':'sc-step-wrong'}>{stepChecked[i].ok?'✓ Poprawnie':'× Sprawdź ten krok'} — {step.explanation}</p>}</div>)}</div>}<label className="sc-field"><span>Twoja odpowiedź{t.unit?` (${t.unit})`:''}</span><input type="text" inputMode={t.kind==='number'?'decimal':'text'} autoComplete="off" placeholder={t.kind==='binary'?'Np. 10101010':'Wpisz wynik'} value={input} disabled={checked} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!checked)check();}}/></label>{!checked&&<><button className="sc-hint" onClick={()=>setHints(n=>Math.min(n+1,t.hints.length))} disabled={hints>=t.hints.length}>Podpowiedź {hints}/{t.hints.length} +</button>{hints>0&&<div className="sc-hints">{t.hints.slice(0,hints).map((x,i)=><p key={i}><b>{i+1}.</b> {x}</p>)}</div>}</>}
 {checked&&<div className={`sc-feedback ${correct?'sc-feedback--good':'sc-feedback--bad'}`} role="status"><strong>{correct?'Poprawny wynik':'Warto spróbować jeszcze raz w następnym przykładzie'}</strong><p>Odpowiedź: <b>{t.displayAnswer}</b></p><p>{t.solution}</p><LinkLesson subject={t.subject} slug={t.lesson}/></div>}
 <div className="sc-actions sc-actions--end">{!checked?<button className="sc-primary" disabled={!input.trim()} onClick={check}>Sprawdź wynik</button>:<button className="sc-primary" onClick={()=>newTask()}>Kolejne zadanie →</button>}</div></section>
 </>;
}

function Mistakes({db,setTab}){
 const [subject,setSubject]=useState('all'); const mistakes=recentMistakes(db).filter(x=>subject==='all'||x.subject===subject);
 return <><SectionTitle eyebrow="UCZ SIĘ NA BŁĘDACH" title="Zeszyt błędów"><SmallTag>{mistakes.length} różnych problemów</SmallTag></SectionTitle>
 <section className="sc-panel"><SubjectSelect value={subject} onChange={setSubject} id="mistake-subject"/><p className="sc-muted">Lista zawiera pytania, dla których ostatnia próba była błędna. Poprawna próba usuwa pytanie z listy, ale historia pozostaje w statystykach.</p></section>
 {mistakes.length? <div className="sc-review-list sc-panel">{mistakes.map((x,i)=><div key={`${x.id}-${i}`} className="sc-review-item"><span className="sc-no">×</span><div><div className="sc-between"><SmallTag>{subjectById(x.subject)?.short} / {topicLabel(x.subject,x.topic)}</SmallTag><small>{prettyDate(x.date)}</small></div><strong>{x.question}</strong><small>Twoja odpowiedź: {x.given}</small><small>Poprawnie: {x.answer}</small><p>{x.why}</p><div className="sc-actions"><LinkLesson subject={x.subject} slug={x.lesson}/><button className="sc-inline-action" onClick={()=>setTab(x.mode==='task'?'tasks':'quiz')}>Powtórz w ćwiczeniach →</button></div></div></div>)}</div>:<Empty title="Na razie bez błędów">Rozwiąż quiz lub zadanie. Jeśli się pomylisz, wrócisz tutaj do wyjaśnienia i właściwej lekcji.</Empty>}
 </>;
}

function StatsPanel({db,stats,onGoal}){
 const last=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const date=d.toLocaleDateString('sv-SE');return {date,label:d.toLocaleDateString('pl-PL',{weekday:'short'}),count:db.attempts.filter(a=>new Date(a.date).toLocaleDateString('sv-SE')===date).length+db.reviews.filter(r=>new Date(r.date).toLocaleDateString('sv-SE')===date).length};});
 const max=Math.max(1,...last.map(d=>d.count));
 return <><SectionTitle eyebrow="TYLKO PRAWDZIWE WYNIKI" title="Statystyki nauki"/><div className="sc-stats-grid"><Stat value={stats.reviewed} label="Sprawdzone odpowiedzi"/><Stat value={stats.accuracy===null?'—':`${stats.accuracy}%`} label="Skuteczność"/><Stat value={db.reviews.length} label="Powtórzone fiszki"/><Stat value={stats.streak} label="Dni z rzędu"/></div>
 <div className="sc-two-col"><section className="sc-panel"><h3>Aktywność przez 7 dni</h3><p className="sc-muted">Liczba sprawdzonych odpowiedzi i ocenionych fiszek.</p><div className="sc-bar-chart" role="img" aria-label={`Aktywność: ${last.map(x=>x.label+' '+x.count).join(', ')}`}>{last.map(item=><div key={item.date} className="sc-bar-item"><span>{item.count}</span><div><i style={{height:`${Math.max(4,100*item.count/max)}%`}}/></div><small>{item.label}</small></div>)}</div></section>
 <section className="sc-panel"><h3>Ustawienia celu</h3><label className="sc-field"><span>Dzienny cel aktywności</span><select value={db.settings.goal} onChange={e=>onGoal(Number(e.target.value))}><option value={5}>5 odpowiedzi lub fiszek</option><option value={10}>10 odpowiedzi lub fiszek</option><option value={15}>15 odpowiedzi lub fiszek</option><option value={20}>20 odpowiedzi lub fiszek</option><option value={30}>30 odpowiedzi lub fiszek</option><option value={50}>50 odpowiedzi lub fiszek</option></select></label><p className="sc-muted">Cel opiera się na rzeczywiście sprawdzonych odpowiedziach i ocenionych kartach, a nie na odwiedzeniu strony.</p><h3 className="sc-spaced">Ostatnie sesje</h3>{db.sessions.length?<div className="sc-session-list">{[...db.sessions].reverse().slice(0,6).map((s,i)=><div className="sc-between" key={i}><span>{s.mode==='exam'?'Kolokwium':'Quiz'}</span><strong>{s.score}/{s.total} · {prettyDate(s.date)}</strong></div>)}</div>:<p className="sc-muted">Brak zakończonych sesji.</p>}</section></div>
 <section className="sc-panel"><h3>Wyniki według przedmiotów</h3><div className="sc-progress-list">{stats.bySubject.map(s=><div className="sc-subject-progress" key={s.id}><div className="sc-between"><span><i style={{background:s.color}}/>{s.name}</span><span>{s.percent===null?'Bez prób':`${s.percent}% · ${s.attempts} prób`}</span></div><Meter value={s.percent??0}/>{s.topics.some(x=>x.count>0)&&<div className="sc-topic-stats">{s.topics.filter(x=>x.count>0).map(t=><span key={t.id}>{t.title}: <b>{t.rate}%</b> ({t.count})</span>)}</div>}</div>)}</div><p className="sc-muted">Wyniki liczone są z historii prób, łącznie z wcześniejszymi błędami. Nie są oceną Twojej rzeczywistej znajomości całego przedmiotu.</p></section></>;
}

function CalendarPanel({db,onAdd,onRemove,setTab,stats}){
 const [view,setView]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
 const [title,setTitle]=useState(''),[subject,setSubject]=useState('cpp'),[date,setDate]=useState(''),[minutes,setMinutes]=useState(25);
 const y=view.getFullYear(),m=view.getMonth();
 const offset=(new Date(y,m,1).getDay()+6)%7;
 const length=new Date(y,m+1,0).getDate();
 const cells=Array.from({length:Math.ceil((offset+length)/7)*7},(_,i)=>i-offset+1);
 const exams=[...(db.exams||[])].sort((a,b)=>a.date.localeCompare(b.date));
 const today=TODAY();
 function add(e){e.preventDefault();if(!title.trim()||!date)return;
  onAdd({id:`exam:${uid()}`,title:title.trim().slice(0,100),subject,date,minutes,topics:[]});setTitle('');setDate('');
 }
 function dailyPlan(event){
  const topicStats=stats.bySubject.filter(s=>event.subject==='all'||s.id===event.subject).flatMap(s=>s.topics.map(t=>({...t,subject:s.id,short:s.short})))
    .sort((a,b)=>(a.rate??-1)-(b.rate??-1));
  return topicStats.slice(0,3);
 }
 return <><SectionTitle eyebrow="TERMINY I PRZYGOTOWANIE" title="Kalendarz kolokwiów"><SmallTag>{exams.length} zapisanych terminów</SmallTag></SectionTitle>
  <div className="sc-two-col"><section className="sc-panel"><h3>Dodaj termin</h3><form className="sc-form" onSubmit={add}>
   <label className="sc-field"><span>Nazwa wydarzenia</span><input required maxLength={100} placeholder="Np. Kolokwium: kod U2" value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <SubjectSelect all={false} id="exam-subject" value={subject} onChange={setSubject}/>
   <label className="sc-field"><span>Data</span><input type="date" required value={date} min={TODAY()} onChange={e=>setDate(e.target.value)}/></label>
   <label className="sc-field"><span>Planowana długość dziennej sesji</span><select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[15,25,40,60,90].map(v=><option key={v} value={v}>{v} min</option>)}</select></label>
   <button className="sc-primary" type="submit">Dodaj do kalendarza</button>
  </form><p className="sc-muted">Wszystkie daty są zapisywane tylko w tej przeglądarce i w eksporcie JSON. Nie ma automatycznych powiadomień.</p></section>
  <section className="sc-panel sc-calendar"><div className="sc-between"><h3>{view.toLocaleDateString('pl-PL',{month:'long',year:'numeric'})}</h3><div className="sc-actions"><button className="sc-secondary" onClick={()=>setView(new Date(y,m-1,1))} aria-label="Poprzedni miesiąc">←</button><button className="sc-secondary" onClick={()=>setView(new Date(y,m+1,1))} aria-label="Następny miesiąc">→</button></div></div>
   <div className="sc-calendar-grid" role="grid" aria-label="Kalendarz terminów">
    {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d=><span className="sc-calendar-weekday" key={d}>{d}</span>)}
    {cells.map((day,i)=>{const actual=day>=1&&day<=length;const iso=actual?`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`:'';const events=exams.filter(e=>e.date===iso);return <div key={i} className={`sc-calendar-day ${!actual?'sc-calendar-blank':''} ${iso===today?'sc-calendar-today':''} ${events.length?'sc-calendar-event':''}`} title={events.map(e=>e.title).join(' • ')}><span>{actual?day:''}</span>{events.length>0&&<i aria-label={`${events.length} wydarzeń`}/>}</div>})}
   </div><p className="sc-muted">Kropka pod datą oznacza zapisane kolokwium lub egzamin.</p></section></div>
  <section className="sc-panel"><h3>Najbliższe terminy</h3>{exams.length===0?<Empty title="Brak terminów">Dodaj pierwszy termin kolokwium. StudyLab zaproponuje zakres na podstawie Twoich wyników.</Empty>:<div className="sc-exam-list">{exams.map(event=>{
   const days=Math.ceil((new Date(event.date+'T23:59:59').getTime()-Date.now())/86400000),plan=dailyPlan(event);
   return <article key={event.id} className="sc-exam-item"><div className="sc-between"><div><SmallTag>{subjectById(event.subject)?.short||'Przedmioty'}</SmallTag><h4>{event.title}</h4><small>{event.date} · {days>0?`około ${days} dni`:days===0?'dzisiaj':'termin minął'}</small></div><button className="sc-danger-minor" onClick={()=>onRemove(event.id)} aria-label={`Usuń termin ${event.title}`}>Usuń</button></div>
    <p>Proponowana sesja {event.minutes} min: 5 min fiszek, potem ćwiczenie {plan.length?plan.map(t=>t.title).join(' / '):'materiału z wybranego przedmiotu'}.</p><div className="sc-actions"><button className="sc-secondary" onClick={()=>setTab('cards')}>Powtórki</button><button className="sc-secondary" onClick={()=>setTab('adaptive')}>Trening</button></div></article>;
  })}</div>}</section></>;
}

function PlannerPanel({db,stats,onPlanner,setTab}){
 const p=db.planner;
 const today=new Date();const exam=p.examDate?new Date(p.examDate+'T23:59:59'):null;
 const days=exam?Math.max(0,Math.ceil((exam.getTime()-today.getTime())/86400000)):null;
 const topics=stats.bySubject.filter(x=>p.subject==='all'||p.subject===x.id).flatMap(x=>x.topics.map(t=>({subject:x.id,subjectName:x.short,name:t.title,rate:t.rate,attempts:t.count})))
 .sort((a,b)=>(a.rate??-1)-(b.rate??-1));
 const slots=Math.max(1,Math.floor(p.minutes/5));
 const suggestions=topics.slice(0,Math.min(5,slots));
 return <><SectionTitle eyebrow="PLANOWANIE NAUKI" title="Plan przed kolokwium"/><section className="sc-panel"><p>Ustaw termin i dzienny czas. Plan korzysta z Twoich wyników i proponuje krótkie sesje. Nie wysyła powiadomień ani nie synchronizuje kalendarza.</p><div className="sc-form-grid"><SubjectSelect value={p.subject} onChange={v=>onPlanner({...p,subject:v})} id="planner-subject"/><label className="sc-field"><span>Data kolokwium</span><input type="date" value={p.examDate} onChange={e=>onPlanner({...p,examDate:e.target.value})}/></label><label className="sc-field"><span>Czas na naukę dziennie</span><select value={p.minutes} onChange={e=>onPlanner({...p,minutes:Number(e.target.value)})}><option value={10}>10 min</option><option value={15}>15 min</option><option value={25}>25 min</option><option value={40}>40 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select></label></div>{days!==null&&<div className="sc-info-line">{days>0?`Do wybranego terminu pozostało około ${days} dni.`:'Wybrany termin jest dziś lub minął.'}</div>}</section>
 <section className="sc-panel"><h3>Propozycja na dziś — {p.minutes} minut</h3><div className="sc-timeline"><div><span>5 min</span><strong>Fiszki na dziś</strong><small>{stats.due} kart oczekuje na naukę lub powtórkę</small></div>{suggestions.slice(0,3).map((t,i)=><div key={`${t.subject}-${t.name}`}><span>{Math.max(5,Math.floor((p.minutes-5)/Math.min(3,suggestions.length)))} min</span><strong>{t.subjectName}: {t.name}</strong><small>{t.rate===null?'Temat jeszcze nieprzećwiczony':`Dotychczasowa skuteczność ${t.rate}%`}</small></div>)}<div><span>5 min</span><strong>Sprawdzenie błędów</strong><small>Krótko przejrzyj wyjaśnienia i popraw swoje rozumowanie</small></div></div><div className="sc-actions"><button className="sc-primary" onClick={()=>setTab('cards')}>Zacznij od fiszek</button><button className="sc-secondary" onClick={()=>setTab('tasks')}>Generuj zadania</button></div></section>
 <section className="sc-panel"><h3>Mapa zależności — od czego zacząć?</h3><p className="sc-muted">Przykładowa kolejność nauki na podstawie zagadnień w StudyLab. Nie oznacza oficjalnych wymagań prowadzącego.</p><div className="sc-path-list">{[
  {id:'cpp',steps:[['Zmienne','zmienne'],['Instrukcje warunkowe','operatory-warunki'],['Pętle','petla-for']]},
  {id:'math1',steps:[['Spójniki logiczne','zdania-i-spojniki'],['Tabele prawdy','tabele-prawdy'],['Dowody','dowody-zbiorowe']]},
  {id:'math2',steps:[['Silnia','silnia'],['Symbol Newtona','symbol-newtona'],['Dwumian Newtona','dwumian-newtona']]},
  {id:'ask',steps:[['Zapis dwójkowy','dwojkowy-dziesietny'],['Kod U2','u2'],['Asembler','asm-zmienne']]},
  {id:'physics',steps:[['Prędkość','predkosc'],['Przyspieszenie','przyspieszenie'],['Zasady Newtona','druga-zasada']]},
  {id:'electronics',steps:[['Ładunek','ladunek'],['Pole elektryczne','pole-elektryczne'],['Prawo Gaussa','prawo-gaussa']]}
 ].filter(x=>p.subject==='all'||p.subject===x.id).map(x=><div key={x.id}><strong>{subjectById(x.id)?.short}</strong><div>{x.steps.map(([name,slug],i)=><React.Fragment key={slug}>{i>0&&<span aria-hidden="true">→</span>}<a href={localHref(lessonHref(x.id,slug))}>{name}</a></React.Fragment>)}</div></div>)}</div></section>
 <section className="sc-panel"><h3>Jak działa plan?</h3><p>Nie tworzymy sztywnego harmonogramu z wymyślonymi ocenami. StudyLab proponuje najpierw nieprzećwiczone i słabsze tematy, a następnie powtórki. Po każdej sesji lista aktualizuje się z nowych wyników.</p><p className="sc-muted">Ten planer działa lokalnie. Szczegółowy kalendarz, powiadomienia i synchronizacja urządzeń mogą zostać dodane w kolejnej wersji.</p></section>
 </>;
}

function LibraryPanel({db,onAddCard,onRemoveCard,onAddNote,onRemoveNote,onImport,onClear,cloudActive}){
 const [subject,setSubject]=useState('cpp'),[topic,setTopic]=useState('basic'),[front,setFront]=useState(''),[back,setBack]=useState(''),[cardWhy,setCardWhy]=useState(''),[cardSymbols,setCardSymbols]=useState(''),[cardExample,setCardExample]=useState(''),[note,setNote]=useState('');
 const [status,setStatus]=useState('');const fileInput=useRef(null);
 const [showDelete,setShowDelete]=useState(false);
 const opts=TOPICS[subject]||[];
 function exportData(){const content=JSON.stringify(db,null,2);const blob=new Blob([content],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`studylab-postepy-${TODAY()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Pobrano kopię danych w formacie JSON.');}
 async function importData(e){const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>4*1024*1024)throw new Error('Plik jest za duży (maks. 4 MB).');const data=validate(JSON.parse(await file.text()));
   const accepted=window.confirm(cloudActive?'Wczytanie zastąpi dane lokalne, a podczas synchronizacji historia zostanie połączona z danymi chmury. Kontynuować?':'Wczytanie zastąpi bieżące postępy w tej przeglądarce. Czy kontynuować?');if(!accepted){setStatus('Anulowano import.');return;}onImport(data);setStatus('Dane zostały zaimportowane.');
  }catch(err){setStatus(`Nie udało się wczytać pliku: ${err.message}`);}finally{if(fileInput.current)fileInput.current.value='';}
 }
 function createCard(e){e.preventDefault();if(!front.trim()||!back.trim()||!cardWhy.trim())return;onAddCard({id:`custom:${uid()}`,subject,topic,front:front.trim().slice(0,300),back:back.trim().slice(0,800),why:cardWhy.trim().slice(0,1200),symbols:cardSymbols.trim().slice(0,700),example:cardExample.trim().slice(0,900),lesson:''});setFront('');setBack('');setCardWhy('');setCardSymbols('');setCardExample('');setStatus('Dodano fiszkę z wyjaśnieniem do Twojej talii.');}
 function createNote(e){e.preventDefault();if(!note.trim())return;onAddNote({id:`note:${uid()}`,subject,text:note.trim().slice(0,1800),date:Date.now()});setNote('');setStatus('Zapisano notatkę.');}
 return <><SectionTitle eyebrow="TWOJA BIBLIOTEKA" title="Własne materiały i dane"/><div className="sc-two-col"><section className="sc-panel"><h3>Nowa fiszka</h3><form onSubmit={createCard} className="sc-form"><SubjectSelect value={subject} onChange={v=>{setSubject(v);setTopic(TOPICS[v]?.[0]?.[0]||'basic')}} id="custom-card-subject" all={false}/><TopicSelect subject={subject} value={topic} onChange={setTopic} id="custom-card-topic"/><label className="sc-field"><span>Pytanie</span><textarea maxLength={300} rows={3} value={front} onChange={e=>setFront(e.target.value)} placeholder="Np. Kiedy implikacja jest fałszywa?" required/></label><label className="sc-field"><span>Odpowiedź</span><textarea maxLength={800} rows={3} value={back} onChange={e=>setBack(e.target.value)} placeholder="Krótka, jednoznaczna odpowiedź" required/></label><label className="sc-field"><span>Dlaczego to jest poprawne? (wymagane)</span><textarea maxLength={1200} rows={4} value={cardWhy} onChange={e=>setCardWhy(e.target.value)} placeholder="Wyjaśnij przyczynę własnymi słowami; nie powtarzaj tylko odpowiedzi." required/></label><label className="sc-field"><span>Znaczenie symboli (opcjonalne)</span><textarea maxLength={700} rows={3} value={cardSymbols} onChange={e=>setCardSymbols(e.target.value)} placeholder="Np. U — napięcie (V); I — prąd (A)."/></label><label className="sc-field"><span>Krótki przykład (opcjonalny)</span><textarea maxLength={900} rows={3} value={cardExample} onChange={e=>setCardExample(e.target.value)} placeholder="Np. U=I·R=2 A·3 Ω=6 V."/></label><button className="sc-primary" type="submit">Dodaj fiszkę z wyjaśnieniem</button></form></section>
 <section className="sc-panel"><h3>Własna notatka</h3><form onSubmit={createNote} className="sc-form"><p className="sc-muted">Zapisz trudny wzór, komentarz do wykładu albo krótkie podsumowanie.</p><label className="sc-field"><span>Treść notatki</span><textarea rows={7} maxLength={1800} value={note} onChange={e=>setNote(e.target.value)} placeholder="Co chcesz zapamiętać?" required/></label><button className="sc-secondary" type="submit">Zapisz notatkę</button></form></section></div>
 {db.bookmarks.length>0&&<section className="sc-panel"><h3>Zapisane lekcje ({db.bookmarks.length})</h3><div className="sc-saved-links">{db.bookmarks.map(href=><a href={localHref(href)} key={href}>{href.split('/').filter(Boolean).slice(-2).join(' / ')} ↗</a>)}</div></section>}
 {db.customCards.length>0&&<section className="sc-panel"><h3>Moje fiszki ({db.customCards.length})</h3><div className="sc-own-list">{[...db.customCards].reverse().map(c=><div key={c.id}><div><SmallTag>{subjectById(c.subject)?.short}</SmallTag><strong>{c.front}</strong><p>{c.back}</p>{c.why&&<small>Dlaczego: {c.why}</small>}</div><button className="sc-danger-minor" onClick={()=>onRemoveCard(c.id)} aria-label={`Usuń fiszkę ${c.front}`}>Usuń</button></div>)}</div></section>}
 {db.notes.length>0&&<section className="sc-panel"><h3>Moje notatki ({db.notes.length})</h3><div className="sc-own-list">{[...db.notes].reverse().map(n=><div key={n.id}><div><SmallTag>{subjectById(n.subject)?.short}</SmallTag><p className="sc-preserve">{n.text}</p><small>{prettyDate(n.date)}</small></div><button className="sc-danger-minor" onClick={()=>onRemoveNote(n.id)} aria-label="Usuń notatkę">Usuń</button></div>)}</div></section>}
 <section className="sc-panel"><h3>Kopia i przenoszenie postępów</h3><p>StudyLab zawsze zapisuje wyniki lokalnie. Po zalogowaniu w zakładce „Synchronizacja” wysyła je też do prywatnej chmury. Kopia JSON jest dodatkowym zabezpieczeniem.</p><div className="sc-actions"><button className="sc-primary" onClick={exportData}>Pobierz dane JSON ↓</button><button className="sc-secondary" onClick={()=>fileInput.current?.click()}>Wczytaj dane JSON ↑</button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importData}/></div><p className="sc-muted">Import zastępuje lokalny zapis, ale po synchronizacji historia może zostać scalona z chmurą. Eksport JSON nie zawiera tokenu logowania Supabase.</p><button className="sc-danger-minor" disabled={cloudActive} title={cloudActive?"Wyloguj się, aby usunąć tylko dane lokalne":""} onClick={()=>setShowDelete(v=>!v)}>Reset lokalnych postępów</button>{cloudActive&&<p className="sc-muted">Gdy konto jest zalogowane, reset lokalny jest wyłączony: chmura i tak przywróciłaby dane. Wyloguj się przed resetem. Nie usuwa to danych chmury.</p>}{showDelete&&<div className="sc-confirm"><strong>To usunie lokalne postępy i własne fiszki.</strong><p>Najpierw pobierz kopię danych. Operacja jest nieodwracalna bez pliku JSON.</p><button onClick={()=>{if(window.confirm('Na pewno trwale wyczyścić wszystkie dane StudyLab z tej przeglądarki?')){onClear();setStatus('Wyczyszczono postępy w tej przeglądarce.');setShowDelete(false);}}}>Potwierdź usunięcie</button><button onClick={()=>setShowDelete(false)}>Anuluj</button></div>}</section>
 {status&&<p className="sc-status-message" role="status">{status}</p>}</>;
}

export default function StudyCenter(){
 const [db,setDb]=useState(()=>DEFAULT_DB());const [ready,setReady]=useState(false);
 const cloud=useCloudSync(db,setDb,ready);
 const [focus]=useState(()=>{if(typeof window==='undefined')return null;const params=new URLSearchParams(window.location.search);const subj=params.get('subject'),top=params.get('topic'),lesson=params.get('lesson');if(!SUBJECTS.some(s=>s.id===subj))return null;return {subject:subj,topic:TOPICS[subj]?.some(([t])=>t===top)?top:'all',lesson:/^[a-z0-9-]{1,100}$/i.test(lesson||'')?lesson:null};});
 const [tab,setTab]=useState('overview');const [saveError,setSaveError]=useState(false);
 useEffect(()=>{setDb(safeRead());setReady(true);},[]);
 useEffect(()=>{if(ready)setSaveError(!save(db));},[db,ready]);
 const update=fn=>setDb(prev=>fn(prev));
 function addAttempt(a){update(db=>({...db,attempts:[...db.attempts,a].slice(-5000)}));}
 function addSession(s){update(db=>({...db,sessions:[...db.sessions,s].slice(-600)}));}
 function rateCard(id,rating,state){update(db=>({...db,cards:{...db.cards,[id]:state},reviews:[...db.reviews,{cardId:id,rating,date:Date.now()}].slice(-5000)}));}
 function toggleBookmark(href){update(d=>toggleCloudBookmark(d,href));}
 const stats=useMemo(()=>getStats(db),[db]);
 useEffect(()=>{if(typeof window==='undefined')return;const hash=window.location.hash.slice(1);if(SHORT[hash])setTab(hash);else {const mode=new URLSearchParams(window.location.search).get('mode');if(SHORT[mode]&&mode!=='overview')setTab(mode);}},[]);
 function changeTab(next){setTab(next);if(typeof history!=='undefined')history.replaceState(null,'',`${location.pathname}${location.search}#${next}`);}
 if(!ready)return <div className="sc-root sc-loading" aria-busy="true">Ładowanie Centrum nauki…</div>;
 return <BookmarkContext.Provider value={{bookmarks:db.bookmarks,toggle:toggleBookmark}}><div className="sc-root"><header className="sc-header"><div><p className="sc-eyebrow"><span className="sc-dot"/> STUDYLAB / CENTRUM NAUKI</p><h1>Ćwicz. Sprawdzaj. <em>Zapamiętuj.</em></h1><p className="sc-lead">Quizy, fiszki, zadania i powtórki połączone z Twoimi lekcjami. Bez abonamentu. Konto opcjonalne do synchronizacji.</p></div><div className="sc-header-meta"><span><b>{QUESTIONS.length}</b> pytań</span><span><b>{FLASHCARDS.length+db.customCards.length}</b> fiszek</span><span><b>{TOTAL_GENERATORS}</b> generatorów</span></div></header>
 {saveError&&<div className="sc-warning" role="alert">Nie udało się zapisać postępów w przeglądarce. Sprawdź wolne miejsce i ustawienia prywatności. Możesz spróbować wyeksportować dane.</div>}
 <div className="sc-layout"><nav className="sc-navigation" aria-label="Centrum nauki">{Object.entries(SHORT).map(([key,title])=><button key={key} className={tab===key?'sc-nav-active':''} aria-current={tab===key?'page':undefined} onClick={()=>changeTab(key)}><span aria-hidden="true">{ICONS[key]}</span>{title}{key==='cards'&&stats.due>0&&<small>{stats.due}</small>}{key==='errors'&&recentMistakes(db).length>0&&<small>{recentMistakes(db).length}</small>}</button>)}<div className="sc-side-note"><strong>Offline i chmura</strong><p>Możesz ćwiczyć bez internetu. Po zalogowaniu postępy zsynchronizują się po odzyskaniu połączenia.</p></div></nav>
 <div className="sc-main" id="study-center-content">
 {tab==='overview'&&<Overview db={db} stats={stats} setTab={changeTab}/>}
 {tab==='sync'&&<CloudAccount cloud={cloud}/>}
 {tab==='quiz'&&<QuizPanel key="quiz-panel" db={db} onAttempt={addAttempt} onSession={addSession} focus={focus}/>}
 {tab==='cards'&&<FlashcardPanel db={db} onReview={rateCard} onRetention={retention=>update(d=>bumpModified({...d,settings:{...d.settings,retention}},'settings'))} focus={focus}/>}
 {tab==='tasks'&&<TasksPanel onAttempt={addAttempt} initialSubject={focus?.subject||'all'} initialTopic={focus?.topic||'all'} focus={focus}/>}
 {tab==='adaptive'&&<QuizPanel key="adaptive-panel" db={db} onAttempt={addAttempt} onSession={addSession} adaptiveMode focus={focus}/>}
 {tab==='exam'&&<QuizPanel key="exam-panel" db={db} onAttempt={addAttempt} onSession={addSession} examMode/>}
 {tab==='errors'&&<Mistakes db={db} setTab={changeTab}/>}
 {tab==='calendar'&&<CalendarPanel db={db} onAdd={exam=>update(d=>addCloudItem(d,'exams',exam))} onRemove={id=>update(d=>markDeleted(d,'exams',id))} setTab={changeTab} stats={stats}/>}
 {tab==='stats'&&<StatsPanel db={db} stats={stats} onGoal={goal=>update(d=>bumpModified({...d,settings:{...d.settings,goal}},'settings'))}/>}
 {tab==='planner'&&<PlannerPanel db={db} stats={stats} onPlanner={planner=>update(d=>bumpModified({...d,planner},'planner'))} setTab={changeTab}/>}
 {tab==='plus'&&<StudyCenterPlus db={db} onAttempt={addAttempt} onSession={addSession}/>}
 {tab==='next'&&<StudyCenterNext db={db} onGo={changeTab}/>}
 {tab==='workshop'&&<StudyCenterWorkshop db={db} onAttempt={addAttempt} onAddCard={c=>update(d=>addCloudItem(d,'customCards',c))}/>}
 {tab==='library'&&<LibraryPanel db={db} onAddCard={c=>update(d=>addCloudItem(d,'customCards',c))} onRemoveCard={id=>update(d=>markDeleted(d,'customCards',id))} onAddNote={n=>update(d=>addCloudItem(d,'notes',n))} onRemoveNote={id=>update(d=>markDeleted(d,'notes',id))} onImport={setDb} onClear={()=>{if(!cloud.userId){setDb(DEFAULT_DB());cloud.clearAccountBindingIfSignedOut();}}} cloudActive={!!cloud.userId}/>}
 </div></div><footer className="sc-footer">StudyLab · Wersja 7.3 · Pytania i fiszki z zatwierdzonej bazy · FSRS-5 (parametry standardowe, bez indywidualnego trenowania) · PWA: odwiedzone strony dostępne offline · Synchronizacja opcjonalna przez Supabase</footer></div></BookmarkContext.Provider>;
}
