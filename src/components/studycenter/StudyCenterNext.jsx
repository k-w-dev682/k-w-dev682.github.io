import React,{useEffect,useMemo,useRef,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {SUBJECTS,TOPICS,QUESTIONS,FLASHCARDS,lessonHref} from './bank.js';
import {buildMap,reviewQueue,summarizeProgress,NOTE_KEY,validateNotesFile,serializeNotes,quickQuestions} from './next-engine.mjs';
import './studycenter-next.css';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const url=path=>BASE+String(path||'').replace(/^\/+/, '');
const subjectLabel=id=>SUBJECTS.find(s=>s.id===id)?.name||id;
function exportFile(filename,content,type='text/plain;charset=utf-8'){
 const blob=new Blob([content],{type}),link=document.createElement('a'),object=URL.createObjectURL(blob);
 link.href=object;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(object),2000);
}
const newNote=()=>({id:globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random()),title:'Nowa notatka',subject:'math2',body:'# Nowa notatka\n\nWpisz tutaj materiał, a następnie zapisz.',updated:Date.now()});
function readNotes(){try{return validateNotesFile(JSON.parse(localStorage.getItem(NOTE_KEY)||'{"version":1,"notes":[]}')).notes}catch{return []}}
function Head({tag,title,children}){return <header className="scn-section-header"><div><span className="sc-eyebrow">{tag}</span><h2>{title}</h2></div>{children}</header>}
function StateTag({score}){return <span className={'scn-level '+(score>=80?'good':score>=50?'mid':'low')}>{score===null?'Bez danych':`${score}/100`}</span>}
function Guide({text}){return <p className="scn-guide">{text}</p>}
function Picker({subject,onChange}){return <label className="sc-field"><span>Przedmiot</span><select value={subject} onChange={e=>onChange(e.target.value)}>{SUBJECTS.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>}
function KnowledgeMap({db,onGo}){
 const [subject,setSubject]=useState('math2');
 const nodes=useMemo(()=>buildMap(db.attempts,subject,TOPICS[subject]||[]),[db.attempts,subject]);
 const [current,setCurrent]=useState('');
 const chosen=nodes.find(x=>x.id===current)||nodes[0];
 const related=QUESTIONS.filter(q=>q.subject===subject&&q.topic===chosen?.id);
 const lesson=related.find(q=>q.lesson)?.lesson||FLASHCARDS.find(c=>c.subject===subject&&c.topic===chosen?.id&&c.lesson)?.lesson;
 return <><Head tag="MAPA WIEDZY" title="Zobacz, co z czym się łączy"/><Guide text="Tematy przedstawiono w sugerowanej kolejności od podstaw. Połączenia są wskazówką dydaktyczną, a nie formalnymi warunkami dostępu. Opanowanie to szacunek na podstawie odpowiedzi."/>
 <section className="sc-panel"><Picker subject={subject} onChange={v=>{setSubject(v);setCurrent('')}}/>
 <div className="scn-map" aria-label="Mapa kolejnych zagadnień">
 {nodes.map((n,i)=><React.Fragment key={n.id}>{i>0&&<div className="scn-edge" aria-hidden="true"><span>↓</span><small>kolejny temat</small></div>}
 <button type="button" aria-pressed={chosen?.id===n.id} onClick={()=>setCurrent(n.id)} className={'scn-node '+(chosen?.id===n.id?'selected':'')}>
 <span className="scn-node-index">{String(i+1).padStart(2,'0')}</span><span><strong>{n.name}</strong><small>{n.count?`${n.count} ostatnich prób · ${n.accuracy}% poprawnych`:'Temat jeszcze niećwiczony'}</small></span><StateTag score={n.mastery}/>
 </button></React.Fragment>)}
 </div></section>
 {chosen&&<section className="sc-panel"><h3>{chosen.name}</h3><p>{chosen.count?`Szacunkowy poziom: ${chosen.mastery}/100 (${chosen.status}).`:'Brak ocenionych odpowiedzi z tego tematu.'}</p>{chosen.requires.length>0&&<p className="sc-muted">Wcześniej warto poznać: {nodes.filter(n=>chosen.requires.includes(n.id)).map(x=>x.name).join(', ')}.</p>}
 <div className="sc-actions">{lesson&&<a className="scn-action-link" href={url(lessonHref(subject,lesson))}>Przejdź do lekcji ↗</a>}
 <a className="scn-action-link" href={url(`centrum-nauki/?subject=${subject}&topic=${chosen.id}&mode=adaptive#adaptive`)}>Trenuj ten temat ↗</a><button className="sc-secondary" onClick={()=>onGo('cards')}>Powtarzaj fiszki</button></div>
 <small className="sc-muted">Po otwarciu treningu wybierz ten sam przedmiot i temat. Dostępnych pytań z zakresu: {related.length}.</small></section>}
 </>;
}
function SmartReviews({db,onGo}){
 const queue=useMemo(()=>reviewQueue(db,SUBJECTS,TOPICS,Date.now(),FLASHCARDS),[db]);
 const [subject,setSubject]=useState('all');const visible=queue.items.filter(x=>subject==='all'||x.subject===subject);
 return <><Head tag="INTELIGENTNE POWTÓRKI" title="Co warto powtórzyć dzisiaj?"/><Guide text="Lista bazuje na błędach z ostatnich 14 dni, liczbie prób i ostrożnej ocenie opanowania. Terminy fiszek wyznacza istniejący algorytm FSRS. To nie jest diagnoza AI."/>
 <section className="sc-panel"><div className="scn-metrics"><div><strong>{queue.dueCardCount}</strong><span>zaplanowanych fiszek z historią</span></div><div><strong>{visible.length}</strong><span>tematów z wynikami</span></div><div><strong>{visible.filter(x=>x.incorrect>0).length}</strong><span>tematów z błędami</span></div></div>
 <div className="sc-actions"><button className="sc-primary" onClick={()=>onGo('cards')}>Uruchom fiszki</button><button className="sc-secondary" onClick={()=>onGo('errors')}>Zeszyt błędów</button></div></section>
 <section className="sc-panel"><label className="sc-field"><span>Filtr</span><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">Wszystkie przedmioty</option>{SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 {visible.length===0?<p>Brak zebranych wyników. Zacznij od krótkiego quizu albo fiszek.</p>:<div className="scn-review-list">{visible.slice(0,16).map(item=><article key={`${item.subject}:${item.topic}`}><div><small>{item.subjectLabel}</small><h3>{item.label}</h3><p>{item.incorrect?`${item.incorrect} błędnych odpowiedzi w ostatnich 14 dniach.`:'Powtórka utrwalająca na podstawie dotychczasowych prób.'}</p></div><div className="scn-review-side"><StateTag score={item.mastery}/><a className="scn-action-link" href={url(`centrum-nauki/?subject=${item.subject}&topic=${item.topic}&mode=adaptive#adaptive`)}>Ćwicz ↗</a></div></article>)}</div>}
 </section></>;
}
function Inline({text}){
 return String(text).split(/(\$[^$\n]+\$|\*\*[^*\n]+\*\*|`[^`\n]+`|!\[[^\]]*\]\(data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+\))/g).filter(Boolean).map((part,i)=>{
  if(part.startsWith('$')&&part.endsWith('$')){let html;try{html=katex.renderToString(part.slice(1,-1),{throwOnError:false,trust:false,output:'html'})}catch{return <code key={i}>{part}</code>}return <span key={i} className="scn-math" dangerouslySetInnerHTML={{__html:html}}/>}
  if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
  if(part.startsWith('`')&&part.endsWith('`'))return <code key={i}>{part.slice(1,-1)}</code>;
  if(part.startsWith('![')){const match=/^!\[([^\]]*)\]\((data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+)\)$/.exec(part);return match?<img key={i} className="scn-img" alt={match[1]} src={match[2]}/>:part}
  return <React.Fragment key={i}>{part}</React.Fragment>;
 });
}
function MarkdownView({body}){
 const lines=String(body||'').split('\n');let code=false;const codeLines=[];const rendered=[];
 lines.forEach((raw,i)=>{
  const l=raw.trim();if(l.startsWith('```')){if(code){rendered.push(<pre key={'code-'+i}><code>{codeLines.join('\n')}</code></pre>);codeLines.length=0;}code=!code;return}
  if(code){codeLines.push(raw);return}
  if(!l){rendered.push(<div className="scn-emptyline" key={i}/>);return}
  const heading=/^(#{1,4})\s+(.+)$/.exec(l);if(heading){const Tag=`h${heading[1].length+1}`;rendered.push(<Tag key={i}><Inline text={heading[2]}/></Tag>);return}
  if(/^(- |\* )/.test(l)){rendered.push(<div key={i} className="scn-listline">• <Inline text={l.slice(2)}/></div>);return}
  if(/^\d+\.\s/.test(l)){rendered.push(<div key={i} className="scn-listline"><Inline text={l}/></div>);return}
  if(l.startsWith('> ')){rendered.push(<blockquote key={i}><Inline text={l.slice(2)}/></blockquote>);return}
  if(l.includes('|')&&l.startsWith('|')&&!/^\|[\s:\-|]+\|$/.test(l)){rendered.push(<div className="scn-tableline" key={i}>{l.slice(1,-1).split('|').map((part,j)=><span key={j}><Inline text={part.trim()}/></span>)}</div>);return}
  rendered.push(<p key={i}><Inline text={raw}/></p>);
 });
 if(code)rendered.push(<pre key="code-end"><code>{codeLines.join('\n')}</code></pre>);
 return <div className="scn-preview-content">{rendered}</div>;
}
function imageFromFile(file){return new Promise((resolve,reject)=>{
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>8*1024*1024){reject(Error('Wybierz PNG, JPG lub WEBP do 8 MB.'));return}
 const img=new Image(),reader=new FileReader();reader.onerror=()=>reject(Error('Nie można odczytać zdjęcia.'));reader.onload=()=>{img.onload=()=>{const scale=Math.min(1,1000/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.67);if(data.length>420000)reject(Error('Obraz jest zbyt duży do zapisu lokalnego.'));else resolve(data)};img.onerror=()=>reject(Error('Nieprawidłowy obraz.'));img.src=reader.result};reader.readAsDataURL(file);
 });}
function NoteEditor(){
 const [notes,setNotes]=useState(()=>typeof window==='undefined'?[]:readNotes());
 const [active,setActive]=useState('');const [status,setStatus]=useState('');const [preview,setPreview]=useState(true);const textArea=useRef(null),fileRef=useRef(null);
 const current=notes.find(n=>n.id===active)||notes[0];
 function persist(next){setNotes(next);try{localStorage.setItem(NOTE_KEY,JSON.stringify(serializeNotes(next)));setStatus('Zapisano lokalnie.')}catch{setStatus('BŁĄD zapisu — pamięć przeglądarki może być pełna. Pobierz kopię JSON, aby zachować bieżące zmiany.')}}
 function make(){const n=newNote();persist([n,...notes]);setActive(n.id)}
 function edit(key,value){if(!current)return;persist(notes.map(n=>n.id===current.id?{...n,[key]:value,updated:Date.now()}:n))}
 function insert(content){if(!current)return;const el=textArea.current;const start=el?.selectionStart??current.body.length,end=el?.selectionEnd??start;edit('body',current.body.slice(0,start)+content+current.body.slice(end));requestAnimationFrame(()=>{el?.focus();el?.setSelectionRange(start+content.length,start+content.length)})}
 async function imageAdd(e){const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const data=await imageFromFile(f);insert(`\n![${f.name.replaceAll(']','')}](${data})\n`)}catch(e){setStatus(e.message)}}
 function importJson(e){const f=e.target.files?.[0];e.target.value='';if(!f)return;f.text().then(s=>{const data=validateNotesFile(JSON.parse(s));if(!window.confirm(`Dodać ${data.notes.length} notatek z pliku do obecnych?`))return;const existing=new Set(notes.map(n=>n.id));const merged=[...notes,...data.notes.map(n=>existing.has(n.id)?{...n,id:globalThis.crypto?.randomUUID?.()||String(Math.random())}:n)].slice(0,150);persist(merged);setStatus(`Zaimportowano ${data.notes.length} notatek.`)}).catch(e=>setStatus('Błąd importu: '+e.message))}
 function printNote(){if(!current)return;document.body.classList.add('scn-print-note');window.addEventListener('afterprint',()=>document.body.classList.remove('scn-print-note'),{once:true});window.print()}
 return <><Head tag="EDYTOR NOTATEK" title="Twój własny zeszyt cyfrowy"/><Guide text="Tekst, wzory w $...$, podstawowe nagłówki, listy, tabele i zdjęcia. Zapis automatyczny tylko w tej przeglądarce. Eksportuj JSON, aby zabezpieczyć notatki i przenieść je na inne urządzenie."/>
 <section className="sc-panel"><div className="sc-actions"><button className="sc-primary" onClick={make}>+ Nowa notatka</button><button className="sc-secondary" onClick={()=>exportFile('studylab-notatki-72.json',JSON.stringify(serializeNotes(notes),null,2),'application/json')}>Kopia wszystkich JSON ↓</button><label className="scn-file">Import JSON<input type="file" accept=".json,application/json" onChange={importJson}/></label></div>
 {notes.length>0&&<div className="scn-editor-grid"><div className="scn-notes-list" aria-label="Zapisane notatki">{notes.map(n=><button key={n.id} className={current?.id===n.id?'selected':''} onClick={()=>setActive(n.id)}><strong>{n.title}</strong><small>{subjectLabel(n.subject)} · {new Date(n.updated).toLocaleDateString('pl-PL')}</small></button>)}</div>
 <div className="scn-note-main">{current&&<><div className="scn-fields"><label className="sc-field"><span>Tytuł</span><input maxLength={130} value={current.title} onChange={e=>edit('title',e.target.value)}/></label><Picker subject={current.subject} onChange={v=>edit('subject',v)}/></div>
 <div className="scn-editor-tools" aria-label="Narzędzia edytora"><button onClick={()=>insert('**wyróżniony tekst**')}>Pogrub</button><button onClick={()=>insert('\n## Nagłówek\n')}>Nagłówek</button><button onClick={()=>insert('\n- element listy\n')}>Lista</button><button onClick={()=>insert(' $s = v \\cdot t$ ')}>Wzór</button><button onClick={()=>insert('\n| Nazwa | Wartość |\n|---|---|\n| Przykład | 12 |\n')}>Tabela</button><button onClick={()=>fileRef.current?.click()}>Zdjęcie</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden ref={fileRef} onChange={imageAdd}/></div>
 <label className="sc-field"><span>Treść (Markdown, matematyka LaTeX)</span><textarea ref={textArea} rows={14} spellCheck="true" value={current.body} onChange={e=>edit('body',e.target.value)} maxLength={60000}/></label>
 <div className="sc-actions"><button className="sc-secondary" onClick={()=>setPreview(v=>!v)}>{preview?'Ukryj':'Pokaż'} podgląd</button><button className="sc-secondary" onClick={()=>exportFile((current.title||'notatka').replace(/[^a-zA-Z0-9ąćęłńóśźż_-]+/gi,'-')+'.md',current.body)}>Pobierz .md</button><button className="sc-secondary" onClick={printNote}>Drukuj / PDF</button><button className="scn-delete" onClick={()=>{if(!window.confirm('Usunąć tę notatkę?'))return;persist(notes.filter(n=>n.id!==current.id));setActive('')}}>Usuń</button></div>
 {preview&&<section className="scn-preview" aria-label="Podgląd notatki"><h2 className="scn-print-title">{current.title}</h2><MarkdownView body={current.body}/></section>}
 </>}</div></div>}
 {!notes.length&&<div className="scn-empty-state">Nie masz jeszcze notatek. Utwórz pierwszą, aby rozpocząć.</div>}
 {status&&<p className="sc-muted" role="status">{status}</p>}
 </section></>;
}
function StudyStats({db,onGo}){
 const [subject,setSubject]=useState('all');const stats=useMemo(()=>summarizeProgress(db,subject,TOPICS),[db,subject]);
 const [seconds,setSeconds]=useState(0);
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem('studylab.studytime72.v1')||'{}');const now=Date.now();setSeconds(Object.entries(data).filter(([k])=>{const [day,s]=k.split('|');return (subject==='all'||s===subject)&&now-Date.parse(day)<28*86400000}).reduce((sum,[,v])=>sum+Number(v||0),0))}catch{setSeconds(0)}},[subject]);
 const max=Math.max(1,...stats.days.map(x=>x.attempts+x.reviews));
 const exams=(db.exams||[]).filter(x=>subject==='all'||x.subject===subject).filter(x=>x.date>=new Date().toLocaleDateString('sv-SE'));
 const overall=stats.topics.filter(x=>x.count>0);
 return <><Head tag="STATYSTYKI 2.0" title="Ile naprawdę umiesz?"/><Guide text="Wyniki pokazują liczbę prób i ich poprawność, nie automatyczną ocenę zdania egzaminu. Czas to oszacowanie aktywności w otwartych lekcjach, a nie pomiar rzeczywistej koncentracji."/>
 <section className="sc-panel"><label className="sc-field"><span>Zakres statystyk</span><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">Wszystkie przedmioty</option>{SUBJECTS.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
 <div className="scn-metrics"><div><strong>{stats.attempts}</strong><span>odpowiedzi</span></div><div><strong>{stats.accuracy===null?'—':stats.accuracy+'%'}</strong><span>poprawnych odpowiedzi</span></div><div><strong>{Math.round(seconds/60)} min</strong><span>szac. aktywności w 28 dniach</span></div><div><strong>{overall.length?Math.round(overall.reduce((s,x)=>s+x.mastery,0)/overall.length)+'%':'—'}</strong><span>szac. opanowania ćwiczonych tematów</span></div></div>
 <h3>Aktywność – ostatnie 28 dni</h3><div className="scn-bars" role="img" aria-label="Słupki liczby odpowiedzi i powtórek w ostatnich 28 dniach">{stats.days.map(d=><div key={d.day} title={`${d.day}: ${d.attempts} odpowiedzi, ${d.reviews} fiszek`} className="scn-bar-slot"><span style={{height:`${Math.max(4,(d.attempts+d.reviews)/max*100)}%`}}/></div>)}</div><p className="sc-muted">Łącznie ocenionych fiszek: {stats.reviewedCards}. {exams.length?`Najbliższe zaplanowane kolokwium: ${exams[0].title} (${exams[0].date}).`:'Brak nadchodzącego terminu kolokwium w kalendarzu.'}</p></section>
 <section className="sc-panel"><h3>Postępy według tematów</h3><div className="scn-topic-stats">{stats.topics.map(t=><div key={t.subject+':'+t.topic}><span>{subjectLabel(t.subject)} · {t.name}</span><StateTag score={t.mastery}/><div className="scn-track"><i style={{width:t.mastery+'%'}}/></div><small>{t.count} prób · {t.accuracy===null?'brak wyniku':t.accuracy+'% trafień'}</small></div>)}</div><div className="sc-actions"><button className="sc-primary" onClick={()=>onGo('exam')}>Próbne kolokwium</button><button className="sc-secondary" onClick={()=>onGo('planner')}>Plan powtórek</button></div></section></>;
}
export default function StudyCenterNext({db,onGo}){
 const [view,setView]=useState('map');
 const tabs=[['map','Mapa wiedzy'],['review','Powtórki'],['notes','Edytor notatek'],['stats','Statystyki 2.0']];
 return <div className="scn-root"><div className="scn-hero"><span className="sc-eyebrow">STUDYLAB / BLACK EDITION / 7.2</span><h2>Nauka, która łączy tematy</h2><p>Jedna przestrzeń dla mapy wiedzy, systematycznych powtórek, własnych notatek i statystyk.</p></div>
 <nav className="scn-tabs" aria-label="Narzędzia StudyLab 7.2">{tabs.map(([key,title])=><button type="button" className={view===key?'active':''} aria-pressed={view===key} key={key} onClick={()=>setView(key)}>{title}</button>)}</nav>
 {view==='map'&&<KnowledgeMap db={db} onGo={onGo}/>}
 {view==='review'&&<SmartReviews db={db} onGo={onGo}/>}
 {view==='notes'&&<NoteEditor/>}
 {view==='stats'&&<StudyStats db={db} onGo={onGo}/>}
 <p className="scn-footer">Notatki i pomiar czasu zapisują się lokalnie. Quizy i fiszki korzystają z dotychczasowego Centrum nauki. Nowe notatki nie są automatycznie synchronizowane przez Supabase — używaj eksportu JSON.</p></div>;
}
