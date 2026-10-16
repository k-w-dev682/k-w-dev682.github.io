import React, {useMemo,useState} from 'react';
import {MATH_LESSONS} from '../data/mathLessons.js';
import 'katex/dist/katex.min.css';
import '../styles/math.css';

const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const lessonUrl = slug => base+'matematyka/'+slug+'/';
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function makeMathPdf(list,theme,setStatus) {
  if(!list.length)throw Error('Wybierz co najmniej jeden temat.');
  document.querySelector('#study-print-root')?.remove();
  const snippets=[];
  for (let i=0;i<list.length;i++){
    const lesson=list[i];
    setStatus(`Przygotowanie ${i+1}/${list.length}: ${lesson.title}`);
    const response=await fetch(lessonUrl(lesson.slug));
    if(!response.ok)throw Error(`Brak tematu „${lesson.title}” (${response.status}).`);
    const doc=new DOMParser().parseFromString(await response.text(),'text/html');
    const article=doc.querySelector('.sl-markdown-content');
    if(!article)throw Error(`Nie znalazłem zawartości lekcji „${lesson.title}”.`);
    const clone=article.cloneNode(true);
    clone.querySelectorAll('script, iframe, button, input, select, textarea, .study-print-toolbar, .math-export-toolbar, .math-lab__controls, .math-lab__inputs, .math-lab__switch').forEach(el=>el.remove());
    snippets.push(`<article class="study-print-article"><div class="study-print-lesson-number">${esc(lesson.section)} · ${i+1}/${list.length}</div><h1>${esc(lesson.title)}</h1><div class="study-print-prose sl-markdown-content">${clone.innerHTML}</div></article>`);
  }
  const el=document.createElement('div');
  el.id='study-print-root';
  el.className=theme==='light'?'study-print-light':'study-print-dark';
  const toc=list.map((lesson,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(lesson.title)}</li>`).join('');
  el.innerHTML=`<div class="study-print-cover"><div class="study-print-kicker">STUDYLAB / MATEMATYKA</div><h1>Matematyka<br/><em>BLACK Edition</em></h1><p>Wykłady i ćwiczenia · rozwiązania od podstaw<br/>${list.length} ${list.length===1?'temat':'tematów'} w wybranym zestawie</p><div class="study-print-toc"><h2>Spis treści</h2><ol>${toc}</ol></div><div class="study-print-cover-foot">DOKUMENT WYGENEROWANY LOKALNIE · STUDYLAB</div></div>${snippets.join('')}`;
  document.body.appendChild(el);
  document.body.classList.add('study-pdf-print');
  const cleanup=()=>{el.remove();document.body.classList.remove('study-pdf-print');window.removeEventListener('afterprint',cleanup);};
  window.addEventListener('afterprint',cleanup,{once:true});
  setStatus('Gotowe! W oknie drukowania wybierz „Zapisz jako PDF”.');
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{window.print();}catch(error){cleanup();throw error;}
}

export default function MathPdfButton({slug,title,section='Matematyka'}) {
 const [theme,setTheme]=useState('dark');const [working,setWorking]=useState(false);const [status,setStatus]=useState('');
 const run=async()=>{setWorking(true);try{await makeMathPdf([{slug,title,section}],theme,setStatus);}catch(e){setStatus('Błąd: '+e.message);}finally{setWorking(false)}};
 return <div className="not-content study-print-toolbar math-export-toolbar" aria-label="Zapisz temat jako PDF"><div className="study-export-mini"><div><strong>↓ Zapisz ten temat jako PDF</strong><span>Wykład lub ćwiczenie · tekst i wzory w jednym pliku</span></div><div className="study-export-mini-actions"><label className="study-export-theme">Motyw<select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label><button type="button" disabled={working} onClick={run}>{working?'Przygotowuję…':'Eksportuj temat'}</button><a href={lessonUrl('eksport')}>Wybierz kilka →</a></div></div>{status?<p role="status" className="study-export-status">{status}</p>:null}</div>
}

export function MathPdfCollection(){
 const all=MATH_LESSONS;
 const groups=useMemo(()=>[...new Set(all.map(l=>l.section))],[]);
 const [selected,setSelected]=useState(()=>all.filter(l=>l.slug!=='wstep').map(l=>l.slug));
 const [theme,setTheme]=useState('dark'),[working,setWorking]=useState(false),[status,setStatus]=useState('');
 const toggle=slug=>setSelected(s=>s.includes(slug)?s.filter(x=>x!==slug):[...s,slug]);
 const run=async()=>{setWorking(true);try{await makeMathPdf(all.filter(l=>selected.includes(l.slug)),theme,setStatus);}catch(e){setStatus('Błąd: '+e.message);}finally{setWorking(false);}};
 return <div className="not-content study-export-app" aria-label="Eksport matematyki do PDF"><div className="study-export-head"><div><span>BLACK EDITION / MATHEMATICS</span><h2>Stwórz własny PDF</h2><p>Wybierz wykłady, podpunkty ćwiczeń lub pojedyncze lekcje. Powstanie jedna całość z okładką, spisem treści oraz czytelnymi wzorami. Bez wysyłania materiałów na serwer.</p></div><div className="study-export-meter"><strong>{selected.length}</strong><span>wybranych<br/>tematów</span></div></div>
 <div className="study-export-controls"><button type="button" onClick={()=>setSelected(all.map(l=>l.slug))}>Zaznacz wszystkie</button><button type="button" onClick={()=>setSelected([])}>Wyczyść wybór</button><label>Motyw PDF <select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label></div>
 {groups.map(section=>{const lessons=all.filter(l=>l.section===section),complete=lessons.every(l=>selected.includes(l.slug));return <div className="study-export-group" key={section}><div className="study-export-group-head"><h3>{section}</h3><button type="button" onClick={()=>setSelected(old=>complete?old.filter(x=>!lessons.some(y=>y.slug===x)):Array.from(new Set([...old,...lessons.map(x=>x.slug)])))}>{complete?'Odznacz dział':'Zaznacz dział'}</button></div><div className="study-export-checkboxes">{lessons.map(l=><label key={l.slug}><input type="checkbox" checked={selected.includes(l.slug)} onChange={()=>toggle(l.slug)}/><span>{l.title}</span></label>)}</div></div>})}
 <div className="study-export-bottom"><button type="button" disabled={working||!selected.length} onClick={run}>{working?'Składam dokument…':`↓ Zapisz ${selected.length} ${selected.length===1?'temat':'tematów'} w jednym PDF`}</button><p>W oknie drukowania wybierz <strong>„Zapisz jako PDF”</strong>. Aby zachować czarne tło, zaznacz drukowanie kolorów i grafiki tła. Symulatory są aktywne tylko na stronie — w PDF-ie zostają jako statyczne ilustracje.</p></div><p className="study-export-status" aria-live="polite">{status}</p></div>;
}
