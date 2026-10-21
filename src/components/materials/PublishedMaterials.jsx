import React,{useEffect,useState} from 'react';
import {SUBJECTS_MATERIALS} from '../../lib/materials-store.mjs';
import './authoring.css';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
export default function PublishedMaterials({kind='course'}){
  const [entries,setEntries]=useState([]),[error,setError]=useState('');
  useEffect(()=>{let ok=true;fetch(`${BASE}studylab-published-materials.json`,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('Nie można odczytać katalogu.');return r.json();})
    .then(d=>{if(ok)setEntries(Array.isArray(d.items)?d.items:[]);})
    .catch(e=>{if(ok)setError(e.message);});return ()=>{ok=false};},[]);
  const filtered=entries.filter(x=>kind==='course'?x.kind==='course':x.kind==='lecture'||x.kind==='exercise');
  return <section className="sl-auth-index">
    {error&&<p role="alert">{error}</p>}
    {!filtered.length&&!error&&<p>Nie ma jeszcze opublikowanych materiałów w tej kategorii.</p>}
    {filtered.map(x=><article className="sl-auth-index-item" key={x.id}>
      <div><small>{SUBJECTS_MATERIALS.find(s=>s.id===x.subject)?.label||x.subject} · {x.kind==='course'?'Kurs':x.kind==='exercise'?'Ćwiczenia':'Wykład'}</small><h3>{x.title}</h3>{x.kind==='course'&&<small>{x.chapters||0} rozdziałów</small>}</div>
      <a href={`${BASE}${String(x.route).replace(/^\/+/, '')}`}>Otwórz materiał ↗</a>
    </article>)}
  </section>;
}
