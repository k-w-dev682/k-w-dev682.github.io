import React,{useMemo,useState} from 'react';
import {MATH_I_LESSONS} from '../data/mathILessons.js';
import '../styles/mathI.css';
const base=(import.meta.env.BASE_URL||'/').replace(/\/?$/,'/');
const courseRoot=()=>{
 if(typeof window!=='undefined'){
  const m=window.location.pathname.match(/^(.*?)(\/matematyka\/matematyka-i\/)/);
  if(m)return m[1]+m[2];
 }
 return base+'matematyka/matematyka-i/';
};
const urlFor=slug=>courseRoot()+encodeURIComponent(slug)+'/';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function exportMathI(lessons,theme,setStatus){
 if(!lessons.length)throw Error('Nie wybrano żadnej lekcji.');
 document.getElementById('mathi-print-root')?.remove();
 const articles=[];
 for(let i=0;i<lessons.length;i++){
  const l=lessons[i],url=l.sourceUrl||urlFor(l.slug);
  setStatus(`Pobieranie ${i+1}/${lessons.length}: ${l.title}`);
  const response=await fetch(url,{credentials:'same-origin'});
  if(!response.ok)throw Error(`Brak tematu „${l.title}” (${response.status}). Adres: ${url}`);
  const html=await response.text();
  const parsed=new DOMParser().parseFromString(html,'text/html');
  const content=parsed.querySelector('.sl-markdown-content');
  if(!content)throw Error(`Nie udało się odczytać treści „${l.title}” z ${url}`);
  const clone=content.cloneNode(true);
  clone.querySelectorAll('script,iframe,button,input,textarea,select,.mi-export-toolbar,.mi-export-app,.mi-lab,.mathi-navlinks').forEach(n=>n.remove());
  articles.push(`<section class="mi-print-chapter"><p style="color:#b09ec9;font-size:.8em">${escapeHtml(l.section)} · ZDJĘCIA ${escapeHtml(l.photos)}</p><h1>${escapeHtml(l.title)}</h1><div class="sl-markdown-content">${clone.innerHTML}</div></section>`);
 }
 const el=document.createElement('div');el.id='mathi-print-root';el.className='mi-print-root mi-print-root-active'+(theme==='light'?' mi-print-light':'');
 const toc=lessons.map((l,i)=>`<li>${String(i+1).padStart(2,'0')} — ${escapeHtml(l.title)}</li>`).join('');
 el.innerHTML=`<div class="mi-print-cover"><p>STUDYLAB / MATEMATYKA I</p><h1>Matematyka I<br/>BLACK Edition</h1><p>Wykłady · ćwiczenia · uzupełnione wyjaśnienia · ${lessons.length} tematów</p><div class="mi-print-toc"><h2>Spis treści</h2><ol>${toc}</ol></div></div>${articles.join('')}`;
 document.body.appendChild(el);document.body.classList.add('mi-printing');
 const cleanup=()=>{document.body.classList.remove('mi-printing');el.remove();window.removeEventListener('afterprint',cleanup)};
 window.addEventListener('afterprint',cleanup,{once:true});
 setStatus('Gotowe — w oknie drukowania wybierz „Zapisz jako PDF”.');
 await document.fonts.ready;
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 try{window.print();}catch(e){cleanup();throw e;}
}
export default function MathIPdfButton({slug,title,section='Matematyka I'}){
 const[theme,setTheme]=useState('dark'),[working,setWorking]=useState(false),[status,setStatus]=useState('');
 const run=async()=>{setWorking(true);try{await exportMathI([{slug,title,section,photos:'—',sourceUrl:window.location.pathname}],theme,setStatus);}catch(e){setStatus('Błąd: '+e.message)}finally{setWorking(false)}};
 return <div className="mi-export-toolbar not-content"><strong>↓ Eksportuj tę lekcję do PDF</strong><label>Motyw <select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label><button type="button" onClick={run} disabled={working}>{working?'Przygotowuję…':'Zapisz jako PDF'}</button><a href={urlFor('eksport')}>Kilka tematów →</a>{status&&<p className="mi-export-status" role="status">{status}</p>}</div>;
}
export function MathIPdfCollection(){
 const[theme,setTheme]=useState('dark'),[selected,setSelected]=useState(()=>MATH_I_LESSONS.filter(l=>l.slug!=='wstep').map(l=>l.slug));
 const[working,setWorking]=useState(false),[status,setStatus]=useState('');
 const groups=useMemo(()=>[...new Set(MATH_I_LESSONS.map(l=>l.section))],[]);
 const toggle=slug=>setSelected(arr=>arr.includes(slug)?arr.filter(x=>x!==slug):[...arr,slug]);
 const run=async()=>{setWorking(true);try{await exportMathI(MATH_I_LESSONS.filter(l=>selected.includes(l.slug)),theme,setStatus)}catch(e){setStatus('Błąd: '+e.message)}finally{setWorking(false)}};
 return <div className="mi-export-app not-content"><div className="mi-export-top"><div><h2>Twój podręcznik PDF</h2><p>Możesz wybrać pojedyncze rozdziały albo całość.</p></div><strong>{selected.length} tematów</strong></div><div className="mi-controls"><button onClick={()=>setSelected(MATH_I_LESSONS.map(l=>l.slug))}>Zaznacz wszystko</button><button onClick={()=>setSelected([])}>Odznacz wszystko</button><label>Motyw<select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label></div>{groups.map(section=>{const items=MATH_I_LESSONS.filter(l=>l.section===section);return <section className="mi-export-group" key={section}><h3>{section}</h3>{items.map(l=><label className="mi-export-row" key={l.slug}><input type="checkbox" checked={selected.includes(l.slug)} onChange={()=>toggle(l.slug)}/><span>{l.title}</span></label>)}</section>})}<button className="mi-export-primary" onClick={run} disabled={working||!selected.length}>{working?'Przygotowuję…':`↓ Eksportuj ${selected.length} tematów do PDF`}</button><p className="mi-print-help">W oknie drukowania wybierz „Zapisz jako PDF” i włącz grafikę tła, jeśli chcesz zachować czerń. Animacje React zostają interaktywne na stronie, a w wydruku są pomijane.</p><p className="mi-export-status" role="status">{status}</p></div>;
}
