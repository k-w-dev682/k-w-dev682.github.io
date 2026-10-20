import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {SUBJECTS_MATERIALS,listDocuments,putDocument,deleteDocument,getDocument,makeDocumentId} from '../../lib/materials-store.mjs';
import {extractPdfPages} from '../../lib/pdf-text.mjs';
import {STUDYLAB_AI_ENDPOINT,STUDYLAB_AI_PAGE_LIMIT,STUDYLAB_AI_PDF_LIMIT,extractPagesForGemini,formatStudyLabMdx,filenameFromTitle} from '../../lib/gemini-format.mjs';
import './materials.css';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const fmt=n=>n<1048576?`${Math.round(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
const cleanFile=filename=>String(filename).replace(/\.pdf$/i,'').replace(/[_-]/g,' ').trim();
function downloadFile(doc){const url=URL.createObjectURL(doc.blob);const a=document.createElement('a');a.href=url;a.download=doc.filename||`${doc.title}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function pdfOpen(doc,page=1){const url=URL.createObjectURL(doc.blob);const opened=window.open(`${url}#page=${page}`,'_blank','noopener,noreferrer');if(!opened) {const a=document.createElement('a');a.href=`${url}#page=${page}`;a.target='_blank';a.rel='noopener noreferrer';a.click();}setTimeout(()=>URL.revokeObjectURL(url),180000);}
function exportMdx(doc){
  const quoted=s=>JSON.stringify(String(s));
  const intro=`---\ntitle: ${quoted(doc.title)}\ndescription: ${quoted('Notatka wyeksportowana z biblioteki PDF StudyLab')}\n---\n\n> Źródło: ${doc.filename}; materiał wyeksportowany automatycznie. Sprawdź wzory i układ przed publikacją.\n\n`;
  const body=(doc.pages||[]).map(p=>`## Strona ${p.page}\n\n${(p.text||'').replace(/</g,'&lt;').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;').replace(/(^|\n)(---|\+\+\+|:::)/g,'$1\\$2')}\n`).join('\n');
  const data=new Blob([intro+body],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(data),a=document.createElement('a');
  a.href=url;a.download=`${doc.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'notatka'}.mdx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export default function BooksLibrary({initialSubject='all'}){
  const [subject,setSubject]=useState(initialSubject);
  const [kind,setKind]=useState('book');
  const [title,setTitle]=useState('');
  const [file,setFile]=useState(null);
  const [query,setQuery]=useState('');
  const [items,setItems]=useState([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [progress,setProgress]=useState(null);
  const [error,setError]=useState('');
  const [isDragging,setDragging]=useState(false);
  const [aiDoc,setAiDoc]=useState(null);
  const [aiFrom,setAiFrom]=useState(1);
  const [aiTo,setAiTo]=useState(10);
  const [aiMarkdown,setAiMarkdown]=useState('');
  const [aiBusy,setAiBusy]=useState(false);
  const [aiError,setAiError]=useState('');
  const [aiStatus,setAiStatus]=useState('');
  const reload=useCallback(()=>listDocuments().then(d=>setItems(d.sort((a,b)=>b.createdAt-a.createdAt))).catch(e=>setError(e.message)),[]);
  useEffect(()=>{reload();},[reload]);
  const visible=useMemo(()=>items.filter(doc=>(subject==='all'||doc.subject===subject)&&doc.title.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl'))),[items,subject,query]);
  const counts=useMemo(()=>Object.fromEntries(SUBJECTS_MATERIALS.map(s=>[s.id,items.filter(d=>d.subject===s.id).length])),[items]);
  async function handleAdd(e){
    e.preventDefault();setError('');setMessage('');
    if(!file){setError('Wybierz plik PDF.');return;}
    if(file.type && file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){setError('Wybierz plik PDF.');return;}
    if(file.size>250*1024*1024){setError('Limit pojedynczego pliku to 250 MB.');return;}
    if(subject==='all'){setError('Wybierz przedmiot, do którego przypisać materiał.');return;}
    setBusy(true);setProgress(null);
    try{
      let extracted={pages:[],pageCount:0,extractedCharacters:0};let extractionError='';
      try{extracted=await extractPdfPages(file,(page,total)=>setProgress({page,total}));}
      catch(ex){extractionError=ex.message||String(ex);}
      const doc={id:makeDocumentId(),title:(title||cleanFile(file.name)).trim().slice(0,160),subject,kind,filename:file.name,blob:file,createdAt:Date.now(),size:file.size,...extracted,extractionError};
      await putDocument(doc);
      await reload();setFile(null);setTitle('');const inp=document.getElementById('sl-pdf-file');if(inp)inp.value='';
      setMessage(extractionError?`Zapisano PDF. Nie udało się odczytać tekstu: ${extractionError}. Plik można otwierać i pobierać, ale do porównania potrzebny jest tekst.`:extracted.extractedCharacters<60?'Zapisano PDF, ale nie znaleziono warstwy tekstowej. Skan wymaga OCR przed porównaniem.':`Dodano PDF i odczytano ${extracted.pageCount} stron. Możesz porównywać go z wykładami.`);
    }catch(ex){setError(`Nie udało się zapisać PDF: ${ex.message}. Być może zabrakło miejsca w pamięci przeglądarki.`);}finally{setBusy(false);setProgress(null);}
  }
  async function remove(id){if(!window.confirm('Usunąć ten dokument z lokalnej biblioteki? To nie usuwa oryginału z dysku.'))return;try{await deleteDocument(id);await reload();setMessage('Usunięto dokument z tej przeglądarki.');}catch(ex){setError(ex.message);}}
  async function openAction(id,action){try{const doc=await getDocument(id);if(!doc)throw new Error('Nie znaleziono pliku.');if(action==='download')downloadFile(doc);else if(action==='mdx')exportMdx(doc);else pdfOpen(doc);}catch(ex){setError(ex.message);}}
  function chooseAi(doc){
    setAiDoc({id:doc.id,title:doc.title,subject:doc.subject,filename:doc.filename,pageCount:doc.pageCount||0,size:doc.size||0});
    setAiFrom(1);setAiTo(Math.min(doc.pageCount||1,10));setAiMarkdown('');setAiError('');setAiStatus('');
  }
  async function formatWithGemini(){
    if(!aiDoc||aiBusy)return;
    setAiBusy(true);setAiError('');setAiStatus('');
    try{
      const doc=await getDocument(aiDoc.id);
      if(!doc)throw new Error('Nie znaleziono dokumentu w bibliotece.');
      const from=Number(aiFrom),to=Number(aiTo);
      const extracted=extractPagesForGemini(doc,from,to);
      const canUploadWholePdf=doc.size<=STUDYLAB_AI_PDF_LIMIT && from===1 && (!doc.pageCount||to===doc.pageCount);
      let payload;
      if(canUploadWholePdf){
        const bytes=await doc.blob.arrayBuffer();
        const byteArray=new Uint8Array(bytes);
        const chunk=32768;let binary='';
        for(let i=0;i<byteArray.length;i+=chunk)binary+=String.fromCharCode(...byteArray.subarray(i,i+chunk));
        payload={mode:'pdf',pdfBase64:btoa(binary),title:doc.title,subject:doc.subject};
      }else{
        if(extracted.length<20)throw new Error('Brak możliwego do odczytania tekstu na tych stronach. Dla skanu użyj OCR lub wybierz mały, kompletny PDF (maksymalnie 11 MB i 15 stron).');
        if(extracted.length>100000)throw new Error('Wybrano zbyt dużo tekstu. Zmniejsz zakres stron.');
        payload={mode:'text',content:extracted,title:doc.title,subject:doc.subject};
      }
      setAiStatus('Wysyłanie wybranego materiału do Gemini. Sprawdzanie i formatowanie może potrwać.');
      const response=await fetch(`${STUDYLAB_AI_ENDPOINT}/format`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||`Serwer Gemini zwrócił HTTP ${response.status}.`);
      setAiMarkdown(formatStudyLabMdx({...doc,from,to,markdown:data.markdown}));
      setAiStatus('Gotowe! Sprawdź i popraw treść przed zapisaniem pliku MDX. Oryginalny PDF pozostał bez zmian.');
    }catch(ex){
      if(ex instanceof TypeError){setAiError('Lokalny serwer AI nie odpowiada. Uruchom C:\\studylab\\tools\\Start-StudyLab-AI.bat oraz lokalną stronę npm run dev. Funkcja nie działa samodzielnie na GitHub Pages.');}
      else setAiError(ex.message||String(ex));
      setAiStatus('');
    }finally{setAiBusy(false);}
  }
  function downloadAiMdx(){
    if(!aiDoc||!aiMarkdown)return;
    const url=URL.createObjectURL(new Blob([aiMarkdown],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=filenameFromTitle(aiDoc.title);a.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function onPick(f){if(!f)return;setError('');if(!/\.pdf$/i.test(f.name)&&f.type!=='application/pdf'){setError('Obsługiwane są pliki PDF.');return;}setFile(f);setTitle(cleanFile(f.name));}
  return <div className="sl-mat-root">
    <header className="sl-mat-hero"><span className="sl-mat-eyebrow">STUDYLAB / PRYWATNA BIBLIOTEKA</span><h2>Książki <em>i materiały</em></h2><p>Dodawaj podręczniki PDF i wykłady, przypisuj je do przedmiotów i zestawiaj z notatkami StudyLab. Wszystkie pliki pozostają w pamięci tej przeglądarki.</p><a className="sl-mat-link" href={`${BASE}centrum-nauki/#compare`}>Porównaj wykład z książką ↗</a></header>
    <div className="sl-mat-stats"><span><strong>{items.filter(d=>d.kind==='book').length}</strong> podręczników</span><span><strong>{items.filter(d=>d.kind==='lecture').length}</strong> wykładów PDF</span><span><strong>{items.length}</strong> materiałów razem</span></div>
    <div className="sl-mat-layout"><nav aria-label="Przedmioty w bibliotece" className="sl-mat-subjects"><strong>PRZEDMIOTY</strong><button className={subject==='all'?'active':''} onClick={()=>setSubject('all')}>Wszystkie <span>{items.length}</span></button>{SUBJECTS_MATERIALS.map(s=><button key={s.id} className={subject===s.id?'active':''} onClick={()=>setSubject(s.id)}>{s.label}<span>{counts[s.id]}</span></button>)}</nav>
      <main className="sl-mat-main"><section className="sl-mat-panel"><div className="sl-mat-heading"><div><span className="sl-mat-eyebrow">DODAJ MATERIAŁ</span><h3>Nowy dokument PDF</h3></div></div>
        <form onSubmit={handleAdd} className="sl-mat-form"><div className="sl-mat-two"><label>Rodzaj dokumentu<select value={kind} disabled={busy} onChange={e=>setKind(e.target.value)}><option value="book">Podręcznik / książka</option><option value="lecture">Wykład / notatki PDF</option></select></label><label>Przedmiot<select value={subject} disabled={busy} onChange={e=>setSubject(e.target.value)}><option value="all" disabled>Wybierz przedmiot</option>{SUBJECTS_MATERIALS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
          <label className={'sl-mat-drop '+(isDragging?'sl-mat-drag':'')} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);onPick(e.dataTransfer?.files?.[0]);}}><span className="sl-mat-file-icon">PDF</span><strong>{file?file.name:'Upuść plik PDF lub kliknij, aby go wybrać'}</strong><small>{file?fmt(file.size):'Plik zostanie zapisany wyłącznie w Twojej przeglądarce (maks. 250 MB).'}</small><input id="sl-pdf-file" accept=".pdf,application/pdf" type="file" disabled={busy} onChange={e=>onPick(e.target.files?.[0])}/></label>
          <label>Tytuł<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={160} placeholder="Np. Analiza matematyczna — tom 1" disabled={busy}/></label>
          <button className="sl-mat-primary" type="submit" disabled={busy||!file||!title.trim()||subject==='all'}>{busy?`Przetwarzanie PDF${progress?` — strona ${progress.page}/${progress.total}`:'…'}`:'Dodaj do biblioteki'}</button></form>
          {message&&<p className="sl-mat-status" role="status">{message}</p>}{error&&<p className="sl-mat-error" role="alert">{error}</p>}
        </section>
        <section className="sl-mat-panel"><div className="sl-mat-heading"><div><span className="sl-mat-eyebrow">TWOJE MATERIAŁY</span><h3>Biblioteka PDF</h3></div><input aria-label="Szukaj po tytule" placeholder="Szukaj książki…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
          {!visible.length?<p className="sl-mat-empty">Brak materiałów dla wybranego przedmiotu. Dodaj pierwszy PDF powyżej.</p>:<div className="sl-mat-books">{visible.map(doc=><article className="sl-mat-book" key={doc.id}><div className="sl-mat-cover"><span>PDF</span><small>{doc.kind==='book'?'KSIĄŻKA':'WYKŁAD'}</small></div><div className="sl-mat-book-info"><strong>{doc.title}</strong><small>{SUBJECTS_MATERIALS.find(s=>s.id===doc.subject)?.label} · {fmt(doc.size)}{doc.pageCount?` · ${doc.pageCount} str.`:''}</small><span className={doc.extractedCharacters>=60?'sl-mat-available':'sl-mat-unavailable'}>{doc.extractedCharacters>=60?'Tekst do porównania gotowy':'Brak tekstu do analizy — możliwe, że skan PDF'}</span><div className="sl-mat-actions"><button onClick={()=>openAction(doc.id,'open')}>Otwórz ↗</button><button onClick={()=>openAction(doc.id,'download')}>Pobierz</button><button onClick={()=>chooseAi(doc)} title="Opcjonalnie formatuj przez Gemini z kluczem po stronie lokalnego serwera">Formatuj z Gemini</button>{doc.extractedCharacters>=60&&<button onClick={()=>openAction(doc.id,'mdx')} title="Eksportuje surowy tekst, nie zamienia automatycznie podręcznika w lekcję">Eksport MDX</button>}<button className="danger" onClick={()=>remove(doc.id)}>Usuń</button></div></div></article>)}</div>}
        </section>
        {aiDoc&&<section className="sl-mat-panel sl-mat-ai-panel" aria-label="Formatowanie dokumentu przez Gemini">
          <div className="sl-mat-heading"><div><span className="sl-mat-eyebrow">OPCJONALNE NARZĘDZIE AI</span><h3>Formatuj z Gemini</h3></div><button type="button" className="sl-mat-ai-close" onClick={()=>setAiDoc(null)} aria-label="Zamknij formatowanie AI">Zamknij</button></div>
          <p className="sl-mat-hint"><strong>{aiDoc.title}</strong> — wybrany PDF pozostaje w lokalnej bibliotece. Dopiero naciśnięcie „Wyślij do Gemini” prześle wybrane strony w formie tekstowej; dla małego dokumentu (do 11 MB, maksymalnie 15 stron) może zostać przesłany cały PDF, aby lepiej odtworzyć wzory. Klucz API z .env zostaje w lokalnym serwerze Node.</p>
          <div className="sl-mat-two sl-mat-ai-range"><label>Strona od<input type="number" min="1" max={aiDoc.pageCount||undefined} value={aiFrom} disabled={aiBusy} onChange={e=>setAiFrom(e.target.value)}/></label><label>Strona do (maks. {STUDYLAB_AI_PAGE_LIMIT} na raz)<input type="number" min="1" max={aiDoc.pageCount||undefined} value={aiTo} disabled={aiBusy} onChange={e=>setAiTo(e.target.value)}/></label></div>
          <button type="button" className="sl-mat-primary" disabled={aiBusy} onClick={formatWithGemini}>{aiBusy?'Gemini opracowuje materiał…':'Wyślij wybrane strony do Gemini i sformatuj'}</button>
          {aiStatus&&<p role="status" className="sl-mat-status">{aiStatus}</p>}{aiError&&<p role="alert" className="sl-mat-error">{aiError}</p>}
          {aiMarkdown&&<div className="sl-mat-ai-preview"><label htmlFor="sl-mat-ai-output">Wynik — możesz go poprawić przed pobraniem</label><textarea id="sl-mat-ai-output" spellCheck={false} rows="16" value={aiMarkdown} onChange={e=>setAiMarkdown(e.target.value)}/><button type="button" className="sl-mat-primary" onClick={downloadAiMdx}>Pobierz opracowaną notatkę MDX</button><p className="sl-mat-hint">Eksport nie publikuje treści automatycznie: sprawdź wynik, a dopiero potem dodaj plik do wybranego rozdziału StudyLab. Wersja oryginalna PDF pozostaje dostępna.</p></div>}
        </section>}
        <p className="sl-mat-footnote">Prywatność: dodane PDF są lokalne. Analiza przez Gemini następuje <strong>wyłącznie po świadomym kliknięciu</strong> przycisku i przesyła wybrane dane do Google. Pozostałe dokumenty nie są przesyłane. Gemini wymaga lokalnego serwera Node i klucza w .env; na statycznym GitHub Pages sama ta funkcja nie zadziała. Biblioteka nie synchronizuje się między urządzeniami; czyszczenie danych witryny może ją usunąć. PDF.js jest pobierany z CDN podczas analizy.</p>
      </main></div></div>;
}
