import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {SUBJECTS_MATERIALS,listDocuments,getDocument} from '../../lib/materials-store.mjs';
import {compareDocuments,selectPages} from '../../lib/materials-compare.mjs';
import './materials.css';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
function openPdf(blob,page){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url+(page?`#page=${page}`:'');a.target='_blank';a.rel='noopener noreferrer';a.click();setTimeout(()=>URL.revokeObjectURL(url),180000);}
function CompareEntries({title,rows,source,openAt}) {return <section className="sl-mat-differences"><h3>{title} <span>{rows.length}</span></h3>{rows.length===0?<p>Nie znaleziono wyraźnych różnic tego rodzaju według zastosowanej metody.</p>:<ol>{rows.map((item,i)=><li key={i}><div className="sl-mat-diffmeta"><span>Podobieństwo: {Math.round(item.score*100)}%</span>{item.page!=null&&<button onClick={()=>openAt(source,item.page)}>Strona {item.page} ↗</button>}</div><p>{item.text}</p>{item.matched?.text&&<details><summary>Najbliższy znaleziony odpowiednik</summary><p>{item.matched.text}</p></details>}</li>)}</ol>}</section>}
export default function MaterialsCompare({notes=[]}){
 const [docs,setDocs]=useState([]),[course,setCourse]=useState([]),[subject,setSubject]=useState('math1');
 const [lecture,setLecture]=useState(''),[book,setBook]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const reload=useCallback(async()=>{
   try{setDocs((await listDocuments()).sort((a,b)=>b.createdAt-a.createdAt));}catch(e){setError('Nie można odczytać biblioteki PDF: '+e.message);}
   try{const response=await fetch(`${BASE}studylab-lecture-index.json`,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const body=await response.json();setCourse(body.lessons||[]);}catch(e){setError(s=>s||'Nie można wczytać wykładów StudyLab. Uruchom npm run build lub generator indeksu. '+e.message);}
 },[]);
 useEffect(()=>{reload();},[reload]);
 const lectureChoices=useMemo(()=>[
   ...course.filter(c=>c.subject===subject).map(c=>({id:'course:'+c.slug,label:`StudyLab: ${c.title}`,record:c})),
   ...docs.filter(d=>d.kind==='lecture'&&d.subject===subject).map(d=>({id:'pdf:'+d.id,label:`PDF: ${d.title}`,record:d})),
   ...notes.filter(n=>n.subject===subject&&n.text).map((n,i)=>({id:'note:'+n.id,label:`Własna notatka ${i+1}: ${String(n.text).slice(0,55)}…`,record:n}))
 ],[course,docs,subject]);
 const bookChoices=useMemo(()=>docs.filter(d=>d.kind==='book'&&d.subject===subject),[docs,subject]);
 async function doCompare(e){e.preventDefault();setError('');setResult(null);setBusy(true);
   try{
     if(!lecture||!book)throw new Error('Wybierz konkretny wykład i książkę.');
     if(start&&end&&Number(start)>Number(end))throw new Error('Początek zakresu stron nie może być większy od końca.');
     const source=lecture.startsWith('course:')?course.find(c=>c.slug===lecture.slice(7)):lecture.startsWith('note:')?notes.find(n=>n.id===lecture.slice(5)):await getDocument(lecture.slice(4));
     const textbook=await getDocument(book);
     if(!source||!textbook)throw new Error('Nie znaleziono wybranego materiału.');
     const sourcePages=source.pages||[{page:null,text:source.text||''}];
     const range=selectPages(textbook.pages,start,end);
     const analysis=compareDocuments(sourcePages,range,20);
     if(analysis.error)throw new Error(analysis.error);
     setResult({...analysis,source,book:textbook,rangeLabel:start||end?`strony ${start||1}–${end||'koniec'}`:'cała książka'});
   }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function openAt(which,page){
   const id=which==='book'?result?.book?.id:result?.source?.id;
   if(!id)return;
   const doc=await getDocument(id);if(doc?.blob)openPdf(doc.blob,page);
 }
 return <div className="sl-mat-root sl-mat-compare">
 <header className="sl-mat-hero"><span className="sl-mat-eyebrow">CENTRUM NAUKI / ANALIZA MATERIAŁÓW</span><h2>Porównaj <em>wykład i książkę</em></h2><p>Wskaż lekcję z StudyLab albo własny PDF z wykładem oraz podręcznik z tego samego przedmiotu. Zobaczysz odpowiadające sobie fragmenty i treści, dla których nie udało się znaleźć zbliżonego wyjaśnienia.</p></header>
 <section className="sl-mat-panel"><form onSubmit={doCompare} className="sl-mat-form"><div className="sl-mat-two"><label>1. Przedmiot<select value={subject} onChange={e=>{setSubject(e.target.value);setLecture('');setBook('');setResult(null);}}>{SUBJECTS_MATERIALS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>2. Notatka / wykład<select value={lecture} onChange={e=>setLecture(e.target.value)} required><option value="">Wybierz wykład…</option>{lectureChoices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>
 <label>3. Podręcznik PDF<select value={book} onChange={e=>setBook(e.target.value)} required><option value="">Wybierz książkę…</option>{bookChoices.map(d=><option key={d.id} value={d.id}>{d.title}{d.extractedCharacters<60?' (bez tekstu)':''}</option>)}</select></label>
 <div className="sl-mat-two"><label>Od strony książki (opcjonalnie)<input value={start} type="number" min="1" placeholder="np. 25" onChange={e=>setStart(e.target.value)}/></label><label>Do strony książki (opcjonalnie)<input value={end} type="number" min="1" placeholder="np. 40" onChange={e=>setEnd(e.target.value)}/></label></div>
 <p className="sl-mat-hint">Najlepsze rezultaty uzyskasz, porównując jeden wykład z odpowiednim rozdziałem książki, zamiast z całym podręcznikiem. Numery stron odpowiadają kolejności stron PDF, nie drukowanej paginacji.</p>
 <div className="sl-mat-actions"><button className="sl-mat-primary" disabled={busy||!book||!lecture} type="submit">{busy?'Analizuję materiały…':'Porównaj materiały'}</button><button type="button" onClick={reload}>Odśwież bibliotekę</button><a className="sl-mat-link" href={`${BASE}ksiazki/`}>Dodaj PDF ↗</a></div></form>{error&&<p className="sl-mat-error" role="alert">{error}</p>}</section>
 {result&&<div className="sl-mat-results" aria-live="polite"><div className="sl-mat-stats"><span><strong>{result.lectureSegments}</strong> fragmentów wykładu</span><span><strong>{result.bookSegments}</strong> fragmentów książki</span><span><strong>{result.shared.length}</strong> przykładów podobieństw</span></div><p className="sl-mat-hint">Zakres analizy: {result.rangeLabel}. Wyniki są wskazówką do lektury, nie oceną prawdziwości. Inne sformułowanie tej samej zasady może zostać uznane za brak odpowiednika.</p>
 <CompareEntries title="W książce, bez wyraźnego odpowiednika w wykładzie" rows={result.bookOnly} source="book" openAt={openAt}/>
 <CompareEntries title="W wykładzie, bez wyraźnego odpowiednika w książce" rows={result.lectureOnly} source="lecture" openAt={openAt}/>
 <CompareEntries title="Podobne treści w obu źródłach" rows={result.shared} source="book" openAt={openAt}/>
 <p className="sl-mat-footnote">{result.method} Puste lub skanowane strony bez OCR nie są porównywane. Sam brak fragmentu nie jest sprzecznością; przed uznaniem różnicy za merytoryczną sprawdź kontekst w oryginalnym PDF.</p></div>}
 {(!bookChoices.length||!lectureChoices.length)&&<p className="sl-mat-empty">{!bookChoices.length?'Brakuje podręcznika PDF w tym przedmiocie. Dodaj go w zakładce Książki.':'Brakuje dostępnego wykładu w tym przedmiocie.'}</p>}
 </div>;
}
