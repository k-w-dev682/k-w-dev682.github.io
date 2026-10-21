// STUDYLAB-18-4-NO-COURSE-PUBLISH
import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {privateBooksAuthClient} from '../../lib/studylab-private-books.mjs';
import {SUBJECTS_MATERIALS,listDocuments} from '../../lib/materials-store.mjs';
import {listAuthorDrafts,saveAuthorDraft,deleteAuthorDraft,listLegacyAuthorDrafts,saveEmergencyAuthorDraft} from '../../lib/studylab-author-store.mjs';
import {makeCourse,appendCourseChapter,PUBLISH_ENDPOINT} from '../../lib/studylab-publish-client.mjs';
import './authoring.css';
const SB_URL=(import.meta.env.PUBLIC_SUPABASE_URL||'').trim();
const SB_KEY=(import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY||'').trim();
const hasAuth=/^https:\/\/[\w-]+\.supabase\.co\/?$/.test(SB_URL)&&SB_KEY.length>15;
const client=hasAuth?privateBooksAuthClient():null;
const newid=()=>crypto?.randomUUID?.()||`draft-${Date.now()}`;
const SUBJECT=(id)=>SUBJECTS_MATERIALS.find(s=>s.id===id)?.label||id;
function explainCloudError(error){
 const message=String(error?.message||error||'Nieznany błąd');
 if(/NetworkError|Failed to fetch|fetch resource|Load failed|network request failed/i.test(message))
  return 'Nie udało się połączyć z Supabase Storage. Sprawdź sieć, adres PUBLIC_SUPABASE_URL, blokowanie żądań w przeglądarce oraz dostępność projektu Supabase. Oryginalny tekst pozostał w edytorze.';
 if(/policy|row.level|permission|unauthoriz|403|bucket not found/i.test(message))
  return 'Supabase odrzucił zapis. Sprawdź, czy uruchomiono SQL z wersji 18.5 oraz czy prywatny magazyn Storage i jego reguły RLS istnieją. Szczegóły: '+message;
 return 'Nie udało się zsynchronizować szkicu z kontem Supabase: '+message;
}
function fromBookPages(doc,from,to){
  const a=Number(from),b=Number(to);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b-a>14||(doc.pageCount&&b>doc.pageCount))throw new Error('Wybierz maksymalnie 15 kolejnych stron mieszczących się w PDF.');
  const result=(doc.pages||[]).filter(p=>p.page>=a&&p.page<=b).map(p=>`[Strona ${p.page}]\n${p.text||''}`).join('\n\n');
  if(result.length<30)throw new Error('Nie znaleziono tekstu na wskazanych stronach. Skan wymaga OCR.');
  if(result.length>85000)throw new Error('Wybrany fragment jest za duży. Zmniejsz zakres stron.');
  return result;
}
export default function AuthoringStudio(){
  const [drafts,setDrafts]=useState([]),[books,setBooks]=useState([]),[selected,setSelected]=useState('');
  const [mode,setMode]=useState('notes'),[status,setStatus]=useState(''),[error,setError]=useState('');
  const [subject,setSubject]=useState('math1'),[title,setTitle]=useState(''),[kind,setKind]=useState('lecture'),[markdown,setMarkdown]=useState('');
  const [bookId,setBookId]=useState(''),[courseId,setCourseId]=useState(''),[chapterTitle,setChapterTitle]=useState(''),[start,setStart]=useState(1),[end,setEnd]=useState(10);
  const [manualChapter,setManualChapter]=useState('');
  const [busy,setBusy]=useState(false),[session,setSession]=useState(null),[admin,setAdmin]=useState(false),[server,setServer]=useState(false);
  const [legacyDrafts,setLegacyDrafts]=useState([]),[migrating,setMigrating]=useState(false);
  const [failedDraft,setFailedDraft]=useState(null),[publishIssue,setPublishIssue]=useState('');
  const reload=useCallback(async()=>{
    // STUDYLAB-18-5-2: failure of one remote service must not erase cached or local drafts.
    const [draftsResult,booksResult,legacyResult]=await Promise.allSettled([listAuthorDrafts(),listDocuments(),listLegacyAuthorDrafts()]);
    if(draftsResult.status==='fulfilled')setDrafts(draftsResult.value);
    if(booksResult.status==='fulfilled')setBooks(booksResult.value.filter(x=>x.kind==='book').sort((a,b)=>b.createdAt-a.createdAt));
    if(legacyResult.status==='fulfilled')setLegacyDrafts(legacyResult.value);
    if(draftsResult.status==='rejected')setError(explainCloudError(draftsResult.reason));
    else if(booksResult.status==='rejected')setError(explainCloudError(booksResult.reason));
  },[]);
  useEffect(()=>{void reload();const receive=e=>{
    if(!e.detail?.markdown)return;
    setMode('notes');setTitle(e.detail.title||'Nowa notatka');setSubject(e.detail.subject||'math1');
    setKind('lecture');setMarkdown(e.detail.markdown);setSelected('');setStatus('Zaimportowano wynik Gemini do edytora. Zapisz szkic albo zatwierdź publikację.');
    requestAnimationFrame(()=>document.getElementById('studylab-publish-workbench')?.scrollIntoView({behavior:'smooth'}));
  };
  const startCourse=e=>{
    const d=e.detail||{};if(!d.id)return;
    setMode('course');setBookId(d.id);setTitle(`Kurs: ${d.title||'Podręcznik'}`);setSubject(d.subject||'math1');setStatus('Wybierz nazwę kursu i kliknij „Utwórz prywatny kurs”.');
    requestAnimationFrame(()=>document.getElementById('studylab-publish-workbench')?.scrollIntoView({behavior:'smooth'}));
  };
  window.addEventListener('studylab:add-material',receive);
  window.addEventListener('studylab:start-course',startCourse);
  return()=>{window.removeEventListener('studylab:add-material',receive);window.removeEventListener('studylab:start-course',startCourse);};
  },[reload]);
  useEffect(()=>{
    if(!client)return;
    let mounted=true;
    // STUDYLAB-18-5-1-AUTH-STABILIZATION: token refresh must not clear drafts or dispatch login changes.
    let lastUserId=undefined;
    const applySession=s=>{
      if(!mounted)return;
      setSession(previous=>previous?.access_token===s?.access_token?previous:s);
      const uid=s?.user?.id||null;
      if(uid===lastUserId)return;
      lastUserId=uid;
      setAdmin(false);setDrafts([]);setBooks([]);setCourseId('');setSelected('');
      window.dispatchEvent(new CustomEvent('studylab:account-changed',{detail:{uid}}));
      queueMicrotask(()=>{if(mounted)void reload();});
    };
    client.auth.getSession().then(x=>applySession(x.data.session||null)).catch(e=>{if(mounted)setError('Nie udało się odczytać sesji: '+e.message);});
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,s)=>{applySession(s);});
    return()=>{mounted=false;subscription.unsubscribe();};
  },[reload]);
  useEffect(()=>{
    let cancelled=false;
    const check=async()=>{
      setPublishIssue('');
      if(!session?.access_token){setAdmin(false);}
      try{
        const r=await fetch(`${PUBLISH_ENDPOINT}/health`,{signal:AbortSignal.timeout(8000)});
        if(!r.ok)throw new Error('Serwer nie odpowiada.');
        const h=await r.json();if(cancelled)return;setServer(Boolean(h.ok));
        if(!session?.access_token)return;
        if(!h.configured){setAdmin(false);setPublishIssue('Serwer działa, lecz brakuje konfiguracji publikowania w C:\\studylab\\.env: sprawdź STUDYLAB_ADMIN_USER_ID, STUDYLAB_GITHUB_REPO i STUDYLAB_GITHUB_TOKEN. Po zmianie uruchom ponownie Start-Publisher.bat.');return;}
        const verify=await fetch(`${PUBLISH_ENDPOINT}/verify`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:'{}',signal:AbortSignal.timeout(12000)});
        if(cancelled)return;
        const verified=verify.ok&&Boolean((await verify.json()).admin);
        setAdmin(verified);
        if(!verified)setPublishIssue('Konto jest zalogowane, ale serwer nie potwierdził administratora. Porównaj UID konta z STUDYLAB_ADMIN_USER_ID w .env i ponownie uruchom Start-Publisher.bat.');
      }catch(e){if(!cancelled){setServer(false);setAdmin(false);setPublishIssue('Brak połączenia z lokalnym serwerem publikowania: '+(e?.message||'nieznany błąd'));}}
    };
    void check();return()=>{cancelled=true;};
  },[session]);
  const course=drafts.find(x=>x.id===courseId&&x.kind==='course');
  const selectedBook=books.find(x=>x.id===bookId);
  const courseChoices=drafts.filter(x=>x.kind==='course');
  const ownDrafts=useMemo(()=>drafts.filter(d=>d.kind!=='course'),[drafts]);
  function reset(){setError('');setStatus('');}
  async function saveNote(){
    reset();setFailedDraft(null);
    if(!title.trim()||markdown.trim().length<15){setError('Podaj tytuł i treść notatki.');return;}
    const draft={id:selected||newid(),title:title.trim(),subject,kind,markdown,createdAt:Date.now()};
    try{const saved=await saveAuthorDraft(draft);setSelected(saved.id);await reload();setStatus('Notatka zapisana prywatnie na koncie Supabase. Nie jest publiczna.');}
    catch(e){setFailedDraft(draft);setError(explainCloudError(e));}
  }
  async function saveEmergencyNote(){
    if(!failedDraft)return;
    try{
      const saved=await saveEmergencyAuthorDraft(failedDraft);
      setLegacyDrafts(await listLegacyAuthorDrafts());setSelected(saved.id);setFailedDraft(null);setError('');
      setStatus('Kopia awaryjna zapisana WYŁĄCZNIE w tej przeglądarce. NIE została zsynchronizowana z kontem. Później wybierz „Skopiuj lokalne szkice na moje konto”.');
    }catch(e){setError('Awaryjny zapis lokalny nie powiódł się: '+(e?.message||e)+'. Użyj przycisku „Pobierz kopię JSON”.');}
  }
  async function createCourse(){
    reset();const b=selectedBook;
    if(!b||!title.trim()){setError('Wybierz podręcznik oraz wpisz nazwę kursu.');return;}
    const draft=makeCourse({title,subject:b.subject,sourceTitle:b.title});
    draft.bookId=b.id;
    await saveAuthorDraft(draft);await reload();setCourseId(draft.id);setStatus('Utworzono prywatny kurs. Teraz dodawaj rozdziały z kolejnych fragmentów książki.');
  }
  async function generate(){
    reset();if(!course||!chapterTitle.trim())return setError('Wybierz kurs i podaj tytuł rozdziału.');
    const b=books.find(x=>x.id===course.bookId);if(!b)return setError('Nie znaleziono źródłowego PDF na tym koncie.');
    setBusy(true);
    try{
      const content=fromBookPages(b,start,end);
      const res=await fetch(`${PUBLISH_ENDPOINT}/generate-chapter`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:course.title,subject:course.subject,chapterTitle,content})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Błąd Gemini.');
      const changed=appendCourseChapter(course,{title:chapterTitle,markdown:data.markdown,from:start,to:end});
      await saveAuthorDraft(changed);await reload();setChapterTitle('');setStatus('Dodano rozdział do prywatnego kursu na Twoim koncie.');
    }catch(e){setError(e instanceof TypeError?'Uruchom lokalny serwer publikacji Start-StudyLab-Publisher.bat oraz npm run dev.':e.message);}
    finally{setBusy(false);}
  }
  // STUDYLAB-18-3-MANUAL-CHAPTER: does not call Gemini or publish anything.
  async function addManualChapter(){
    reset();
    if(!course)return setError('Wybierz kurs.');
    if(!chapterTitle.trim()||manualChapter.trim().length<40)return setError('Wpisz tytuł oraz treść rozdziału (minimum 40 znaków).');
    try{
      const edited=appendCourseChapter(course,{title:chapterTitle.trim(),markdown:manualChapter.trim(),from:start,to:end});
      await saveAuthorDraft(edited);
      await reload();setChapterTitle('');setManualChapter('');
      setStatus('Dodano ręczny rozdział do prywatnego kursu. Nie użyto Gemini API i niczego nie opublikowano.');
    }catch(e){setError(e.message);}
  }
  function editChapter(i,value){setDrafts(prev=>prev.map(d=>d.id!==course.id?d:{...d,chapters:d.chapters.map((x,j)=>j===i?{...x,markdown:value}:x)}));}
  async function saveChapter(){const current=drafts.find(d=>d.id===courseId);if(current)await saveAuthorDraft(current);}
  async function removeChapter(i){if(!window.confirm('Usunąć rozdział z prywatnego szkicu kursu?'))return;const c={...course,chapters:course.chapters.filter((_,j)=>j!==i)};await saveAuthorDraft(c);await reload();}
  async function publishDraft(data){
    reset();if(!admin||!session?.access_token){setError('Publikowanie wymaga zalogowania jako administrator i działającego lokalnego serwera.');return;}
    if(!window.confirm(`Opublikować „${data.title}” publicznie w StudyLab przez GitHub? Ta operacja uruchomi nowy build strony.`))return;
    setBusy(true);
    try{
      const res=await fetch(`${PUBLISH_ENDPOINT}/publish`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(data)});
      const out=await res.json();if(!res.ok)throw new Error(out.error||'Publikacja nie powiodła się.');
      setStatus(`Wysłano zmiany do GitHuba (commit ${out.commit?.slice(0,8)}). Materiał pojawi się publicznie po udanym GitHub Actions build. Ścieżka: ${out.route}`);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function dropDraft(id){if(!window.confirm('Usunąć prywatny szkic z konta na wszystkich urządzeniach?'))return;await deleteAuthorDraft(id);await reload();if(selected===id)setSelected('');}
  // STUDYLAB-18-5-PRIVATE-DRAFT-MIGRATION
  async function migrateLegacyDrafts(){
    if(!window.confirm('Skopiować stare lokalne szkice na obecne konto? Lokalne oryginały pozostaną na tym urządzeniu.'))return;
    setMigrating(true);reset();let added=0,skipped=0;
    try{
      const present=new Set((await listAuthorDrafts()).map(d=>d.legacyId||d.id));
      for(const old of legacyDrafts){if(present.has(old.id)){skipped++;continue;}await saveAuthorDraft(old);added++;}
      await reload();setStatus(`Skopiowano szkice: ${added}. Już obecnych: ${skipped}.`);
    }catch(e){setError(e.message);}finally{setMigrating(false);}
  }
  function chooseDraft(d){setMode('notes');setSelected(d.id);setTitle(d.title);setSubject(d.subject);setKind(d.kind);setMarkdown(d.markdown);reset();}
  function downloadDraft(d){const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`studylab-szkic-${d.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section id="studylab-publish-workbench" className="sl-auth-root" aria-labelledby="sl-auth-header">
    <div className="sl-auth-head"><span className="sl-mat-eyebrow">STUDYLAB / AUTORSTWO 18.2</span><h2 id="sl-auth-header">Dodaj do StudyLab</h2><p>Zachowaj prywatny szkic, opracuj kurs z książki a publikuj wyłącznie własne notatki z wykładów lub ćwiczeń. Kursy z podręczników zawsze pozostają prywatne.</p></div>
    {legacyDrafts.length>0&&<div className="sl-auth-panel"><p>W tej przeglądarce znaleziono {legacyDrafts.length} starych szkiców. Możesz skopiować je na swoje konto bez usuwania oryginałów.</p><button disabled={migrating} onClick={migrateLegacyDrafts}>{migrating?'Przenoszenie…':'Skopiuj lokalne szkice na moje konto'}</button></div>}
    <div className="sl-auth-switch"><button className={mode==='notes'?'active':''} onClick={()=>setMode('notes')}>Notatki i ćwiczenia</button><button className={mode==='course'?'active':''} onClick={()=>setMode('course')}>Kurs z podręcznika</button></div>
    <p className="sl-auth-state">{session?.user?.id&&<span>Supabase UID aktualnego konta: <code>{session.user.id}</code>. </span>}{!server?'Serwer publikowania jest wyłączony lub niedostępny.':admin?'Zalogowano jako administrator — publikowanie dostępne.':session?'Konto zalogowane — uprawnienia do publikowania nie zostały potwierdzone.':'Brak logowania administratora. Logowanie znajduje się w Centrum nauki → Synchronizacja.'}</p>
    {publishIssue&&<p className="sl-mat-error" role="status">{publishIssue}</p>}
    {mode==='notes'?<div className="sl-auth-columns"><div className="sl-auth-panel"><h3>Edytor notatki</h3><label>Tytuł<input value={title} onChange={e=>setTitle(e.target.value)} maxLength="160"/></label><label>Przedmiot<select value={subject} onChange={e=>setSubject(e.target.value)}>{SUBJECTS_MATERIALS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Rodzaj<select value={kind} onChange={e=>setKind(e.target.value)}><option value="lecture">Wykład / notatka</option><option value="exercise">Ćwiczenia / zadania</option></select></label><label>Treść Markdown / LaTeX<textarea rows="13" spellCheck="false" value={markdown} onChange={e=>setMarkdown(e.target.value)} placeholder="Tu pojawi się materiał przesłany z opcji Formatuj z Gemini. Możesz też napisać własny."/></label><div className="sl-auth-buttons"><button className="sl-mat-primary" onClick={saveNote}>Zapisz prywatnie</button><button disabled={!admin||busy} title={admin?'Publikuj na GitHub Pages':'Tylko zweryfikowany administrator'} onClick={()=>publishDraft({id:selected||newid(),kind,subject,title,markdown})}>Opublikuj na stronie</button></div>{failedDraft&&<div className="sl-auth-panel" role="group" aria-label="Kopia awaryjna"><p>Chmura nie zapisała notatki. Możesz zrobić kopię lokalną lub pobrać plik bez publikowania.</p><div className="sl-auth-buttons"><button type="button" onClick={saveEmergencyNote}>Zapisz awaryjnie na tym urządzeniu</button><button type="button" onClick={()=>downloadDraft(failedDraft)}>Pobierz kopię JSON</button></div></div>}</div><div className="sl-auth-panel"><h3>Moje prywatne szkice</h3>{ownDrafts.length===0?<p>Brak zapisanych notatek.</p>:ownDrafts.map(d=><article className="sl-auth-draft" key={d.id}><b>{d.title}</b><small>{SUBJECT(d.subject)} · {d.kind==='exercise'?'Ćwiczenia':'Wykład'}</small><div className="sl-auth-buttons"><button onClick={()=>chooseDraft(d)}>Edytuj</button><button onClick={()=>downloadDraft(d)}>Kopia JSON</button><button onClick={()=>dropDraft(d.id)}>Usuń</button></div></article>)}</div></div>
    :<div className="sl-auth-panel"><h3>Nowy kurs z podręcznika</h3><p>Kurs składa się z osobnych rozdziałów. Gemini opracowuje maksymalnie 15 stron na raz, z zachowaniem oryginalnego PDF. Po każdej części możesz poprawić tekst.</p><label>Podręcznik PDF<select value={bookId} onChange={e=>{setBookId(e.target.value);const b=books.find(x=>x.id===e.target.value);if(b){setSubject(b.subject);setTitle(`Kurs: ${b.title}`);}}}><option value="">Wybierz książkę</option>{books.map(b=><option value={b.id} key={b.id}>{b.title} — {SUBJECT(b.subject)}</option>)}</select></label><label>Nazwa kursu<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}/></label><button className="sl-mat-primary" disabled={!bookId} onClick={createCourse}>Utwórz prywatny kurs</button><hr/><h3>Rozdziały kursu</h3><label>Wybierz kurs<select value={courseId} onChange={e=>setCourseId(e.target.value)}><option value="">Wybierz szkic kursu</option>{courseChoices.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>{course&&<><p><b>Źródło:</b> {course.sourceTitle} · <b>Przedmiot:</b> {SUBJECT(course.subject)} · <b>{course.chapters?.length||0}</b> rozdziałów</p><label>Tytuł kolejnego rozdziału<input value={chapterTitle} maxLength={160} onChange={e=>setChapterTitle(e.target.value)} placeholder="Np. Zbiory i działania na zbiorach"/></label><div className="sl-auth-range"><label>Od strony<input type="number" min="1" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Do strony<input type="number" min="1" value={end} onChange={e=>setEnd(e.target.value)}/></label></div><button className="sl-mat-primary" disabled={busy||!chapterTitle} onClick={generate}>{busy?'Generuję rozdział…':'Generuj rozdział z Gemini'}</button>
    <div className="sl-auth-manual-chapter"><h3>Lub dodaj rozdział ręcznie — bez API</h3><p>Wygeneruj treść w Gemini/ChatGPT na zwykłej stronie i wklej tutaj Markdown. Wybierz zakres stron i tytuł powyżej. Rozdział pozostanie prywatny do Twojej decyzji o publikacji.</p><label>Treść rozdziału (Markdown / LaTeX)<textarea rows="10" spellCheck="false" value={manualChapter} onChange={e=>setManualChapter(e.target.value)} placeholder="## O co chodzi?&#10;&#10;Wyjaśnienie od podstaw..."/></label><button type="button" disabled={busy||!chapterTitle.trim()||manualChapter.trim().length<40} onClick={addManualChapter}>Dodaj ręcznie do kursu</button></div>
    {course.chapters.map((c,i)=><details key={c.id} className="sl-auth-chapter"><summary>{i+1}. {c.title} · strony {c.sourcePages}</summary><label>Edytuj wygenerowany rozdział<textarea rows="12" spellCheck="false" value={c.markdown} onChange={e=>editChapter(i,e.target.value)} onBlur={saveChapter}/></label><button onClick={()=>removeChapter(i)}>Usuń rozdział</button></details>)}<div className="sl-auth-buttons"><button onClick={()=>downloadDraft(course)}>Pobierz kopię kursu JSON</button><span title="Podręczniki i kursy z nich pozostają prywatne">Kurs prywatny — bez publikacji</span><button onClick={()=>dropDraft(course.id)}>Usuń szkic kursu</button></div></>}</div>}
    {status&&<p className="sl-mat-status" role="status">{status}</p>}{error&&<p className="sl-mat-error" role="alert">{error}</p>}
    <p className="sl-auth-note">Szkice i PDF-y są prywatnie synchronizowane z bieżącym kontem przez Supabase. Każde konto ma osobne dane. Nie publikuj cudzych podręczników w całości bez uprawnień. Opublikowanie wymaga lokalnego serwera, zalogowania jako administrator i konfiguracji GitHub w .env. Publiczna strona aktualizuje się po udanym buildzie GitHub Actions.</p>
  </section>;
}
