import React,{useCallback,useEffect,useRef,useState} from 'react';
import {privateBooksAuthClient} from '../../lib/studylab-private-books.mjs';
import {listAuthorDrafts,saveAuthorDraft,deleteAuthorDraft} from '../../lib/studylab-author-store.mjs';
import {SUBJECTS_MATERIALS} from '../../lib/materials-store.mjs';
import {allowedSubjectNote} from '../../lib/studylab-notes-markdown.mjs';
import PrivateMarkdown from './PrivateMarkdown.jsx';
import './private-notes.css';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const labelFor=id=>SUBJECTS_MATERIALS.find(x=>x.id===id)?.label||'';
const empty={title:'',kind:'lecture',markdown:''};
export default function PrivateSubjectNotes({subjectId}){
 const valid=SUBJECTS_MATERIALS.some(s=>s.id===subjectId);
 const [uid,setUid]=useState(null),[checking,setChecking]=useState(true),[loading,setLoading]=useState(false);
 const [notes,setNotes]=useState([]),[selectedId,setSelectedId]=useState(null);
 const [editing,setEditing]=useState(false),[form,setForm]=useState(empty);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const uidRef=useRef(null),requestRef=useRef(0);
 const load=useCallback(async(expected)=>{
  if(!expected)return;
  const request=++requestRef.current;
  setLoading(true);setError('');
  try{
   const all=await listAuthorDrafts();
   if(request!==requestRef.current||uidRef.current!==expected)return;
   const filtered=all.filter(d=>d.subject===subjectId&&allowedSubjectNote(d));
   setNotes(filtered);
   setSelectedId(previous=>previous&&filtered.some(d=>d.id===previous)?previous:(filtered[0]?.id||null));
  }catch(e){if(request===requestRef.current&&uidRef.current===expected)setError('Nie udało się odczytać prywatnych notatek: '+(e.message||String(e)));}
  finally{if(request===requestRef.current&&uidRef.current===expected)setLoading(false);}
 },[subjectId]);
 useEffect(()=>{
  let live=true,unsubscribe=()=>{};
  setChecking(true);uidRef.current=null;
  const apply=session=>{
   if(!live)return;
   const next=session?.user?.id||null;
   setChecking(false);
   if(next===uidRef.current)return; // TOKEN_REFRESHED must not erase the reader or editor.
   uidRef.current=next;requestRef.current++;
   setUid(next);setNotes([]);setSelectedId(null);setEditing(false);setForm(empty);setError('');setMessage('');
   if(next)void load(next);
  };
  try{
   const sb=privateBooksAuthClient();
   const {data:{subscription}}=sb.auth.onAuthStateChange((_,s)=>apply(s));
   unsubscribe=()=>subscription.unsubscribe();
   sb.auth.getSession().then(({data,error})=>{if(!live)return;if(error)throw error;apply(data.session);}).catch(e=>{if(live){setChecking(false);setError('Problem z sesją Supabase: '+(e.message||String(e)));}});
  }catch(e){setChecking(false);setError(e.message||String(e));}
  return()=>{live=false;requestRef.current++;unsubscribe();};
 },[subjectId,load]);
 const note=notes.find(d=>d.id===selectedId);
 const startNew=()=>{setForm({...empty});setSelectedId(null);setEditing(true);setError('');setMessage('');};
 const startEdit=d=>{setForm({title:d.title,kind:d.kind,markdown:d.markdown});setSelectedId(d.id);setEditing(true);setError('');setMessage('');};
 const openNote=d=>{setSelectedId(d.id);setEditing(false);setError('');setMessage('');};
 async function save(){
  if(!uidRef.current)return setError('Zaloguj się, aby zapisać notatkę.');
  if(!form.title.trim()||form.markdown.trim().length<15)return setError('Wpisz tytuł i co najmniej 15 znaków treści.');
  setBusy(true);setError('');setMessage('');
  const existing=notes.find(d=>d.id===selectedId);
  const draft={...(existing||{}),id:existing?.id||(crypto.randomUUID?.()||undefined),title:form.title.trim().slice(0,160),kind:form.kind,markdown:form.markdown,subject:subjectId,createdAt:existing?.createdAt||Date.now()};
  try{
   const updated=await saveAuthorDraft(draft);
   if(uidRef.current){await load(uidRef.current);setSelectedId(updated.id);setEditing(false);setMessage('Notatka została zapisana prywatnie na Twoim koncie.');}
  }catch(e){setError('Nie udało się zapisać: '+(e.message||String(e))+'; treść pozostała w edytorze.');}
  finally{setBusy(false);}
 }
 async function remove(d){
  if(!window.confirm(`Usunąć prywatną notatkę „${d.title}” z konta na wszystkich urządzeniach?`))return;
  setBusy(true);setError('');
  try{await deleteAuthorDraft(d.id);setEditing(false);await load(uidRef.current);setMessage('Notatka usunięta z prywatnego konta.');}
  catch(e){setError('Nie udało się usunąć: '+(e.message||String(e)));}
  finally{setBusy(false);}
 }
 if(!valid)return <p>Nieznany przedmiot.</p>;
 return <section className="sl-pnotes" aria-label={`Moje prywatne notatki — ${labelFor(subjectId)}`}>
  <header className="sl-pnotes-heading"><div><span className="sl-pnotes-eyebrow">STUDYLAB / PRYWATNE MATERIAŁY</span><h2>Moje notatki — {labelFor(subjectId)}</h2><p>Notatki są przypisane tylko do tego przedmiotu, nie do podtematów. Widzi je wyłącznie właściciel zalogowanego konta.</p></div><span className="sl-pnotes-lock">🔒 Prywatne</span></header>
  {checking?<p role="status">Sprawdzam konto…</p>:!uid?<div className="sl-pnotes-empty"><p>Zaloguj się na konto StudyLab w <a href={`${BASE}centrum-nauki/`}>Centrum nauki → Synchronizacja</a>, aby otworzyć własne notatki.</p><p>Publiczni użytkownicy nie mają dostępu do Twoich szkiców.</p></div>:
  <div className="sl-pnotes-layout">
   <aside className="sl-pnotes-sidebar" aria-label="Lista własnych notatek"><div className="sl-pnotes-side-title"><h3>Moje materiały <span>({notes.length})</span></h3><button type="button" onClick={startNew}>+ Nowa</button></div>
    <button type="button" className="sl-pnotes-refresh" disabled={loading||busy} onClick={()=>load(uidRef.current)}>{loading?'Wczytywanie…':'↻ Odśwież z konta'}</button>
    {notes.length===0?<p className="sl-pnotes-muted">Nie masz jeszcze notatek z tego przedmiotu.</p>:<div className="sl-pnotes-list">{notes.map(d=><button type="button" key={d.id} aria-current={selectedId===d.id?'page':undefined} className={selectedId===d.id?'sl-pnotes-active':''} onClick={()=>openNote(d)}><strong>{d.title}</strong><small>{d.kind==='exercise'?'Ćwiczenia':'Wykład / notatka'} · {new Date(d.updatedAt||d.createdAt||Date.now()).toLocaleDateString('pl-PL')}</small></button>)}</div>}
   </aside>
   <div className="sl-pnotes-reader">
    {editing?<div className="sl-pnotes-editor"><h3>{selectedId?'Edytuj prywatną notatkę':'Nowa prywatna notatka'}</h3><p>Przedmiot: <strong>{labelFor(subjectId)}</strong></p><label>Tytuł<input maxLength={160} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></label><label>Rodzaj<select value={form.kind} onChange={e=>setForm(f=>({...f,kind:e.target.value}))}><option value="lecture">Wykład / notatka</option><option value="exercise">Ćwiczenia / zadania</option></select></label><label>Treść Markdown / LaTeX<textarea rows={15} spellCheck={false} value={form.markdown} onChange={e=>setForm(f=>({...f,markdown:e.target.value}))} placeholder={'# Indukcja matematyczna\n\nWzór: $\\frac{n(n+1)}{2}$'}/></label><details><summary>Podgląd formatowania</summary><PrivateMarkdown value={form.markdown}/></details><div className="sl-pnotes-actions"><button className="sl-pnotes-primary" disabled={busy} onClick={save}>{busy?'Zapisuję…':'Zapisz na moim koncie'}</button><button disabled={busy} onClick={()=>{setEditing(false);setError('');}}>Anuluj</button></div></div>:
     note?<article><div className="sl-pnotes-docbar"><span>{note.kind==='exercise'?'Ćwiczenia':'Wykład / notatka'}</span><div className="sl-pnotes-actions"><button disabled={busy} onClick={()=>startEdit(note)}>Edytuj</button><button disabled={busy} className="sl-pnotes-danger" onClick={()=>remove(note)}>Usuń</button></div></div><h2 className="sl-pnotes-doctitle">{note.title}</h2><PrivateMarkdown value={note.markdown}/></article>:
     <div className="sl-pnotes-empty"><h3>Twoje miejsce na notatki</h3><p>Wybierz istniejącą notatkę z listy albo utwórz nową. Stare szkice zapisane przez „Dodaj do StudyLab” pojawią się tutaj automatycznie, jeśli są przypisane do tego przedmiotu.</p><button className="sl-pnotes-primary" onClick={startNew}>Dodaj pierwszą notatkę</button></div>}
   </div>
  </div>}
  {message&&<p role="status" className="sl-pnotes-success">{message}</p>}
  {error&&<p role="alert" className="sl-pnotes-error">{error}</p>}
 </section>;
}
