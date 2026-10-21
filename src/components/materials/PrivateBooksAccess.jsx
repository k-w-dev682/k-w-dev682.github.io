import React,{useCallback,useEffect,useRef,useState} from 'react';
import BooksPrivateContent from './BooksLibraryPrivateInner.jsx';
import {privateBooksAccess,privateBooksAuthClient,putPrivateDocument,listPrivateDocuments} from '../../lib/studylab-private-books.mjs';
import {listLegacyDocuments} from '../../lib/materials-store.mjs';
import './materials.css';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const CHECK_TIMEOUT=12000;

function boundedAuthCheck(){
 let timer;
 return Promise.race([
  privateBooksAccess(),
  new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(new Error('Supabase nie odpowiedziało w ciągu 12 sekund. Sprawdź połączenie, a następnie spróbuj ponownie.')),CHECK_TIMEOUT);
  })
 ]).finally(()=>clearTimeout(timer));
}

export default function PrivateBooksAccess({initialSubject='all'}){
 const [access,setAccess]=useState({loading:true,allowed:false,uid:null,error:''});
 const [checking,setChecking]=useState(false);
 const [legacy,setLegacy]=useState([]),[moving,setMoving]=useState(false),[status,setStatus]=useState('');
 const live=useRef(false),sequence=useRef(0),lastFocusCheck=useRef(0),authId=useRef(undefined);

 const refresh=useCallback(async ({initial=false}={})=>{
  const ticket=++sequence.current;
  if(initial){setAccess({loading:true,allowed:false,uid:null,error:''});setLegacy([]);}
  else setChecking(true);
  let a;
  try{a=await boundedAuthCheck();}
  catch(e){a={allowed:false,uid:null,error:e?.message||'Nie udało się sprawdzić konta.'};}
  if(!live.current||ticket!==sequence.current)return;
  setAccess({...a,loading:false});setChecking(false);
  if(!a.allowed){setLegacy([]);return;}
  try{
   const docs=await listLegacyDocuments();
   if(live.current&&ticket===sequence.current)setLegacy(docs.filter(d=>['book','lecture'].includes(d.kind)));
  }catch{if(live.current&&ticket===sequence.current)setLegacy([]);}
 },[]);

 useEffect(()=>{
  live.current=true;
  void refresh({initial:true});
  let subscription;
  try{
   const client=privateBooksAuthClient();
   const result=client.auth.onAuthStateChange((event,session)=>{
    // A renewed token is not a new login. Never unmount the library on TOKEN_REFRESHED.
    if(event==='TOKEN_REFRESHED')return;
    const uid=session?.user?.id||null;
    if(event==='INITIAL_SESSION'){authId.current=uid;return;}
    if(uid===authId.current)return;
    authId.current=uid;
    // An actual switch of account must hide the previous owner's documents immediately.
    queueMicrotask(()=>{if(live.current)void refresh({initial:true});});
   });
   subscription=result.data.subscription;
  }catch(e){
   // The initial check displays missing Supabase configuration or login errors.
  }
  const focus=()=>{
   // On returning from the login screen, revalidate silently. Do not blink or unmount.
   const now=Date.now();
   if(now-lastFocusCheck.current<15000||document.hidden)return;
   lastFocusCheck.current=now;
   void refresh();
  };
  const accountChanged=e=>{
   const uid=e.detail?.uid;
   if(uid!==undefined&&uid===authId.current)return;
   if(uid!==undefined)authId.current=uid;
   void refresh({initial:uid!==undefined});
  };
  window.addEventListener('focus',focus);
  window.addEventListener('studylab:account-changed',accountChanged);
  return()=>{
   live.current=false;sequence.current++;
   subscription?.unsubscribe();
   window.removeEventListener('focus',focus);
   window.removeEventListener('studylab:account-changed',accountChanged);
  };
 },[refresh]);

 async function migrate(){
  if(!window.confirm('Skopiować starsze lokalne PDF na bieżące konto Supabase? Niczego nie usuwamy z tego urządzenia. Sprawdź, czy jesteś zalogowany na właściwe konto.'))return;
  setMoving(true);setStatus('Przenoszenie prywatnych PDF…');let added=0,skipped=0;const errors=[];
  try{
   const current=await listPrivateDocuments();const known=new Set(current.map(x=>x.legacyId||x.id.slice(8)));
   for(const item of legacy){
    if(known.has(item.id)){skipped++;continue;}
    try{await putPrivateDocument({...item,legacyId:item.id});added++;}catch(e){errors.push(`${item.title}: ${e.message}`);}
   }
   setStatus(`Skopiowano ${added}, pominięto ${skipped}.${errors.length?' Błędy: '+errors.join(' | '):''} Odśwież stronę, aby zobaczyć dokumenty.`);
  }catch(e){setStatus(e.message);}finally{setMoving(false);}
 }
 if(access.loading)return <section className="sl-mat-root"><p role="status">Sprawdzam logowanie…</p></section>;
 if(!access.allowed)return <section className="sl-mat-root"><div className="sl-mat-hero"><span className="sl-mat-eyebrow">STUDYLAB / BIBLIOTEKA KONTA</span><h2>Moja prywatna biblioteka</h2><p>Każdy zalogowany użytkownik ma własne książki, wykłady, ćwiczenia i szkice kursów. Żaden plik nie trafia do publicznych lekcji.</p><p role="alert">{access.error||'Nie udało się potwierdzić sesji. Spróbuj ponownie.'}</p><a className="sl-mat-link" href={`${BASE}centrum-nauki/#sync`}>Sprawdź konto w Centrum nauki → Synchronizacja ↗</a><div><button type="button" disabled={checking} onClick={()=>void refresh()}>{checking?'Sprawdzanie…':'Sprawdź ponownie'}</button></div></div></section>;
 return <>
  {checking&&<section className="sl-mat-root"><p role="status" style={{opacity:0.75}}>Sprawdzanie połączenia z kontem w tle…</p></section>}
  {legacy.length>0&&<section className="sl-mat-root"><div className="sl-mat-panel"><h3>Pliki z poprzedniej wersji</h3><p>Wykryto {legacy.length} lokalnych PDF (książki i wykłady). Przeniesienie jest dobrowolne i niczego nie usuwa z urządzenia.</p><button className="sl-mat-primary" disabled={moving} onClick={migrate}>{moving?'Przenoszenie…':'Skopiuj lokalne PDF na moje konto'}</button>{status&&<p role="status">{status}</p>}</div></section>}
  <BooksPrivateContent key={access.uid} initialSubject={initialSubject}/>
 </>;
}
