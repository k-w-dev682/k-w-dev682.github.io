import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  privateBooksAuthClient,
  listPrivateBooks, putPrivateBook, getPrivateBook, deletePrivateBook,
  MAX_PRIVATE_PDF_BYTES,
} from '../../lib/studylab-private-books.mjs';
import {SUBJECTS_MATERIALS} from '../../lib/materials-store.mjs';
import {extractPdfPages} from '../../lib/pdf-text.mjs';
import './private-subject-books.css';
import PrivatePdfReader from './PrivatePdfReader.jsx';
import './private-pdf-reader.css';
import PrivateBookCourse from './PrivateBookCourse.jsx';
import {buildPrivateBookCourse,renameCoursePart} from '../../lib/pdf-book-course.mjs';
import {listPrivateBookCourses,savePrivateBookCourse,deletePrivateBookCourse} from '../../lib/studylab-private-book-courses.mjs';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/, '/');
const prettySize=n=>`${(Number(n||0)/1048576).toFixed(1)} MB`;
const titleOf=f=>f.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').trim().slice(0,160);
const normalized=s=>String(s||'').toLocaleLowerCase('pl');

export default function PrivateSubjectBooks({subjectId}) {
  const subject=SUBJECTS_MATERIALS.find(s=>s.id===subjectId);
  const [uid,setUid]=useState(null);
  const [checking,setChecking]=useState(true);
  const [books,setBooks]=useState([]);
  const [courses,setCourses]=useState([]);
  const [viewMode,setViewMode]=useState('pdf');
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [query,setQuery]=useState('');
  const [file,setFile]=useState(null);
  const [title,setTitle]=useState('');
  const [extract,setExtract]=useState(true);
  const [autoCourse,setAutoCourse]=useState(true);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [selected,setSelected]=useState(null);
  const [viewerUrl,setViewerUrl]=useState('');
  const fileInput=useRef(null);
  const userRef=useRef(null);
  const seqRef=useRef(0);
  const urlRef=useRef('');
  const mounted=useRef(true);

  const clearViewer=useCallback(()=>{
    if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current='';}
    setViewerUrl('');setSelected(null);setViewMode('pdf');
  },[]);

  const refresh=useCallback(async expected=>{
    if(!expected)return;
    const seq=++seqRef.current;
    setLoading(true);setError('');
    try {
      const all=await listPrivateBooks();
      if(!mounted.current||seq!==seqRef.current||userRef.current!==expected)return;
      setBooks(all.filter(x=>x.subject===subjectId));
      try {
        const saved=await listPrivateBookCourses();
        if(mounted.current&&seq===seqRef.current&&userRef.current===expected)setCourses(saved.filter(c=>c.subject===subjectId));
      }catch(e){
        if(mounted.current&&seq===seqRef.current&&userRef.current===expected)
          setError('PDF-y są dostępne, ale nie udało się odczytać ich lekcji: '+(e.message||String(e)));
      }
    } catch(e) {
      if(mounted.current&&seq===seqRef.current&&userRef.current===expected)
        setError('Nie udało się pobrać książek: '+(e.message||String(e)));
    } finally {
      if(mounted.current&&seq===seqRef.current&&userRef.current===expected)setLoading(false);
    }
  },[subjectId]);

  useEffect(()=>{
    mounted.current=true;
    let live=true;
    let unsubscribe=()=>{};
    const apply=s=>{
      if(!live)return;
      const next=s?.user?.id||null;
      setChecking(false);
      if(next===userRef.current)return; // Ignore token refresh; keep selection and form.
      userRef.current=next;seqRef.current++;
      clearViewer();setBooks([]);setCourses([]);setUid(next);setError('');setSuccess('');
      if(next)void refresh(next);
    };
    try {
      const sb=privateBooksAuthClient();
      const {data:{subscription}}=sb.auth.onAuthStateChange((_,s)=>apply(s));
      unsubscribe=()=>subscription.unsubscribe();
      sb.auth.getSession().then(({data,error})=>{
        if(!live)return;
        if(error)throw error;
        apply(data.session);
      }).catch(e=>{if(live){setChecking(false);setError('Problem z sesją: '+(e.message||String(e)));}});
    } catch(e){setChecking(false);setError(e.message||String(e));}
    return()=>{live=false;mounted.current=false;seqRef.current++;unsubscribe();
      if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current='';}
    };
  },[subjectId,refresh,clearViewer]);

  const visible=useMemo(()=>books.filter(b=>normalized(b.title).includes(normalized(query))),[books,query]);

  async function upload(e){
    e.preventDefault();if(busy)return;
    setError('');setSuccess('');setProgress('');
    if(!userRef.current){setError('Zaloguj się przed wysłaniem PDF.');return;}
    if(!file){setError('Najpierw wybierz PDF.');return;}
    if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'){
      setError('Do biblioteki można dodać wyłącznie PDF.');return;
    }
    if(file.size===0||file.size>MAX_PRIVATE_PDF_BYTES){
      setError('Pojedynczy PDF musi mieć od 1 bajtu do 50 MB.');return;
    }
    const owner=userRef.current;
    setBusy(true);
    try {
      let data={pages:[],pageCount:0,extractedCharacters:0};
      let extractionError='';
      if(extract){
        setProgress('Odczytuję tekst PDF…');
        try {
          data=await extractPdfPages(file,(n,total)=>{
            if(mounted.current&&userRef.current===owner)setProgress(`Odczytuję strony: ${n}/${total}`);
          });
        }catch(e){extractionError=String(e.message||e).slice(0,400);}
      }
      if(userRef.current!==owner)throw Error('Konto zmieniło się podczas przesyłania. Spróbuj ponownie.');
      setProgress('Przesyłam książkę do prywatnego Supabase Storage…');
      const bookTitle=(title.trim()||titleOf(file));
      const createdAt=Date.now();
      const bookId=await putPrivateBook({
        kind:'book',subject:subjectId,blob:file,
        title:bookTitle,filename:file.name,
        createdAt,...data,extractionError,
      });
      let courseMessage='';
      if(autoCourse){
        try{
          setProgress('Tworzę rozdziały i lekcje tej książki…');
          const built=buildPrivateBookCourse({bookId,title:bookTitle,subject:subjectId,pages:data.pages,createdAt});
          if(owner!==userRef.current)throw Error('Konto zmieniło się podczas konwersji.');
          await savePrivateBookCourse(built);
          courseMessage=` Przygotowano ${built.lessonCount} lekcji w ${built.chapters.length} rozdziałach.`;
        }catch(e){courseMessage=' PDF zapisany, ale automatyczne lekcje nie powstały: '+(e.message||String(e));}
      }
      if(mounted.current&&userRef.current===owner){
        setFile(null);setTitle('');if(fileInput.current)fileInput.current.value='';
        setSuccess((extractionError
          ?'PDF zapisany prywatnie. Odczyt tekstu nie powiódł się.'
          :'PDF zapisany prywatnie na koncie Supabase.')+courseMessage);
        await refresh(owner);
      }
    }catch(e){if(mounted.current)setError('Nie udało się dodać PDF: '+(e.message||String(e)));}
    finally{if(mounted.current){setBusy(false);setProgress('');}}
  }

  async function openBook(book,asCourse=false){
    setBusy(true);setError('');setSuccess('');clearViewer();
    const owner=userRef.current;
    try {
      const result=await getPrivateBook(book.id);
      if(owner!==userRef.current)return;
      const url=URL.createObjectURL(result.blob);
      urlRef.current=url;
      setSelected(result);
      setViewerUrl(url);
      setViewMode(asCourse?'course':'pdf');
    }catch(e){setError('Nie udało się otworzyć PDF: '+(e.message||String(e)));}
    finally{setBusy(false);}
  }

  async function convertBook(book){
    if(busy)return;
    const owner=userRef.current;
    setBusy(true);setError('');setSuccess('');setProgress('Odczytuję treść książki…');
    try{
      const full=await getPrivateBook(book.id);
      if(owner!==userRef.current)return;
      let pages=full.pages;
      if(!Array.isArray(pages)||!pages.some(p=>String(p.text||'').trim())){
        const parsed=await extractPdfPages(full.blob,(n,total)=>{
          if(mounted.current&&userRef.current===owner)setProgress(`Przygotowuję lekcje: strona ${n}/${total}`);
        });
        pages=parsed.pages;
      }
      setProgress('Zapisuję prywatny spis treści i lekcje w Supabase…');
      const converted=buildPrivateBookCourse({bookId:full.id,subject:subjectId,title:full.title,pages,createdAt:full.createdAt});
      if(owner!==userRef.current)return;
      await savePrivateBookCourse(converted);
      if(owner!==userRef.current)return;
      setCourses(current=>[...current.filter(c=>c.bookId!==book.id),converted]);
      setSuccess(`Utworzono ${converted.lessonCount} lekcji w ${converted.chapters.length} rozdziałach „${converted.title}”.`);
      // Reuse the PDF already fetched rather than download it again.
      clearViewer();const url=URL.createObjectURL(full.blob);urlRef.current=url;
      setSelected(full);setViewerUrl(url);setViewMode('course');
    }catch(e){if(owner===userRef.current)setError('Konwersja nie powiodła się: '+(e.message||String(e)));}
    finally{if(mounted.current){setBusy(false);setProgress('');}}
  }

  async function renameCourse(chapterId,lessonId,currentTitle){
    const existing=courses.find(c=>c.bookId===selected?.id);
    if(!existing)return;
    const proposed=window.prompt('Nowy tytuł (oryginalny tekst PDF pozostanie bez zmian):',currentTitle);
    if(proposed===null||proposed.trim()===currentTitle)return;
    const owner=userRef.current;
    setBusy(true);setError('');
    try{
      const changed=renameCoursePart(existing,{chapterId,lessonId,title:proposed});
      await savePrivateBookCourse(changed);
      if(owner===userRef.current){setCourses(current=>current.map(c=>c.bookId===changed.bookId?changed:c));setSuccess('Zapisano nowy tytuł na koncie Supabase.');}
    }catch(e){setError('Nie zapisano nazwy lekcji: '+(e.message||String(e)));}
    finally{if(mounted.current)setBusy(false);}
  }

  async function download(book){
    setBusy(true);setError('');
    try {
      const result=await getPrivateBook(book.id);
      const url=URL.createObjectURL(result.blob);
      const a=document.createElement('a');a.href=url;a.download=book.filename||`${book.title}.pdf`;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setError('Pobieranie nie powiodło się: '+(e.message||String(e)));}
    finally{setBusy(false);}
  }

  async function remove(book){
    if(!window.confirm(`Usunąć „${book.title}” ze swojego konta na wszystkich urządzeniach? Oryginalny plik na dysku pozostanie.`))return;
    const owner=userRef.current;
    setBusy(true);setError('');setSuccess('');
    try{
      await deletePrivateBook(book.id);
      // A course is always subordinate to its PDF. Clean up its own private JSON.
      let warning='';
      if(courses.some(c=>c.bookId===book.id)){
        try{await deletePrivateBookCourse(book.id);}catch(e){warning=' Spis lekcji nie został usunięty z Supabase: '+(e.message||String(e));}
      }
      if(userRef.current!==owner)return;
      setCourses(current=>current.filter(c=>c.bookId!==book.id));
      if(selected?.id===book.id)clearViewer();
      setSuccess('Książka została usunięta z Twojego konta.'+warning);
      await refresh(owner);
    }catch(e){setError('Nie udało się usunąć książki: '+(e.message||String(e)));}
    finally{setBusy(false);}
  }

  if(!subject)return <p>Nieznany przedmiot.</p>;
  return <section className="sl-pbooks" aria-label={`Moje prywatne książki — ${subject.label}`}>
    <header className="sl-pbooks-hero">
      <div><small>STUDYLAB / PRYWATNA BIBLIOTEKA</small><h2>Moje książki — {subject.label}</h2>
        <p>Każda książka ma własny spis rozdziałów i lekcji. Materiały nie mieszają się z „Moimi notatkami”. Dostęp prywatny na Twoim koncie.</p></div>
      <span className="sl-pbooks-private">🔒 Prywatne</span>
    </header>
    {checking?<p role="status">Sprawdzam konto…</p>:!uid?
      <div className="sl-pbooks-panel"><p>Zaloguj się, aby zarządzać książkami przypisanymi do Twojego konta.</p>
        <a href={`${BASE}centrum-nauki/`}>Przejdź do Centrum nauki → Synchronizacja ↗</a>
      </div>:
      <div className="sl-pbooks-layout">
        <aside className="sl-pbooks-panel sl-pbooks-list">
          <div className="sl-pbooks-sidehead"><h3>Moje książki ({books.length})</h3><button disabled={loading||busy} onClick={()=>refresh(userRef.current)}>↻</button></div>
          <label className="sl-pbooks-label">Szukaj książki
            <input type="search" placeholder="Tytuł podręcznika…" value={query} onChange={e=>setQuery(e.target.value)}/>
          </label>
          {loading?<p role="status">Pobieram listę książek…</p>:visible.length===0?<p className="sl-pbooks-muted">{query?'Brak wyników.':'Nie masz jeszcze książek z tego przedmiotu.'}</p>:
            <ul>{visible.map(b=><li key={b.id}>
              <strong>{b.title}</strong>
              <small>{prettySize(b.size)}{b.pageCount?` · ${b.pageCount} stron`:''}</small>
              <div className="sl-pbooks-actions">
                {courses.some(c=>c.bookId===b.id)?
                  <button disabled={busy} className="sl-pbooks-primary" onClick={()=>openBook(b,true)}>📖 Lekcje ({courses.find(c=>c.bookId===b.id)?.lessonCount||0})</button>:
                  <button disabled={busy} className="sl-pbooks-primary" onClick={()=>convertBook(b)}>Utwórz lekcje</button>}
                <button disabled={busy} onClick={()=>openBook(b,false)}>PDF</button>
                <button disabled={busy} onClick={()=>download(b)}>Pobierz</button>
                <button disabled={busy} className="sl-pbooks-danger" onClick={()=>remove(b)}>Usuń</button>
              </div>
            </li>)}</ul>}
        </aside>
        <div className="sl-pbooks-main">
          <form className="sl-pbooks-panel sl-pbooks-form" onSubmit={upload}>
            <h3>Dodaj książkę PDF</h3><p className="sl-pbooks-muted">Zapis na koncie Supabase · maks. 50 MB na plik · bez publikacji na GitHubie</p>
            <label className="sl-pbooks-label">Plik PDF
              <input ref={fileInput} type="file" accept=".pdf,application/pdf" disabled={busy}
                onChange={e=>{const f=e.target.files?.[0]||null;setFile(f);setTitle(f?titleOf(f):'');}}/>
            </label>
            <label className="sl-pbooks-label">Tytuł książki
              <input value={title} maxLength={160} disabled={busy} onChange={e=>setTitle(e.target.value)} placeholder="Np. Matematyka dyskretna"/>
            </label>
            <label className="sl-pbooks-checkbox"><input type="checkbox" checked={extract} disabled={busy} onChange={e=>{setExtract(e.target.checked);if(!e.target.checked)setAutoCourse(false);}}/>
              Odczytaj tekst dokumentu (potrzebny do utworzenia lekcji)
            </label>
            <label className="sl-pbooks-checkbox"><input type="checkbox" checked={autoCourse} disabled={busy} onChange={e=>{setAutoCourse(e.target.checked);if(e.target.checked)setExtract(true);}}/>
              Automatycznie utwórz rozdziały i lekcje w sekcji zatytułowanej nazwą książki. Bez AI, prywatnie.
            </label>
            <button type="submit" className="sl-pbooks-primary" disabled={busy||!file}>{busy?'Dodaję…':'Dodaj do moich książek'}</button>
            {progress&&<p role="status">{progress}</p>}
          </form>
          {viewerUrl&&selected&&<div className="sl-pbooks-panel sl-pbooks-viewer">
            <div className="sl-pbooks-viewerhead"><h3>{selected.title}</h3><div className="sl-pbooks-actions">
              {courses.some(c=>c.bookId===selected.id)&&<button className={viewMode==='course'?'sl-pbooks-primary':''} onClick={()=>setViewMode('course')}>Lekcje książki</button>}
              <button className={viewMode==='pdf'?'sl-pbooks-primary':''} onClick={()=>setViewMode('pdf')}>Czytnik PDF</button>
              <a href={viewerUrl} target="_blank" rel="noopener noreferrer">Otwórz w nowej karcie ↗</a>
              <button onClick={clearViewer}>Zamknij</button>
            </div></div>
            {viewMode==='course'&&courses.some(c=>c.bookId===selected.id)?
              <PrivateBookCourse key={selected.id} course={courses.find(c=>c.bookId===selected.id)}
                onOpenOriginal={page=>window.open(`${viewerUrl}#page=${page}`,'_blank','noopener,noreferrer')}
                onRename={renameCourse}/>:
              <PrivatePdfReader key={selected.id} book={selected} url={viewerUrl} ownerId={uid}/>}
            <p className="sl-pbooks-muted">Oryginalny plik nie jest zmieniany. Do otwierania PDF możesz też użyć nowej karty.</p>
          </div>}
          {!viewerUrl&&<div className="sl-pbooks-panel sl-pbooks-hint"><h3>Czytaj bezpośrednio na stronie</h3>
            <p>Przy każdej książce znajdziesz osobny przycisk „Lekcje” lub „Utwórz lekcje”. Rozdziały i lekcje będą uporządkowane pod tytułem wybranego podręcznika, bez mieszania z notatkami.</p></div>}
        </div>
      </div>}
    {progress&&<p role="status" className="sl-pbooks-success">{progress}</p>}
    {success&&<p role="status" className="sl-pbooks-success">{success}</p>}
    {error&&<p role="alert" className="sl-pbooks-error">{error}</p>}
  </section>;
}
