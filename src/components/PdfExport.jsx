import React, { useMemo, useState } from 'react';
import { CPP_LESSONS } from '../data/cppLessons.js';

const BASE = import.meta.env.BASE_URL || '/';
const lessonUrl = (slug) => BASE.replace(/\/?$/, '/') + 'programowanie/' + slug + '/';
const safeText = (s) => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function preparePrint(lessons, palette, setStatus) {
  if (!lessons.length) throw new Error('Wybierz przynajmniej jeden temat.');
  const previous = document.getElementById('study-print-root');
  if (previous) previous.remove();
  const result = [];
  for (let i=0; i<lessons.length; i++) {
    const lesson = lessons[i];
    setStatus(`Pobieranie ${i+1}/${lessons.length}: ${lesson.title}`);
    const response = await fetch(lessonUrl(lesson.slug));
    if (!response.ok) throw new Error(`Nie można pobrać lekcji „${lesson.title}” (HTTP ${response.status}).`);
    const documentCopy = new DOMParser().parseFromString(await response.text(), 'text/html');
    const content = documentCopy.querySelector('.sl-markdown-content');
    if (!content) throw new Error(`Brakuje treści lekcji „${lesson.title}”.`);
    const clean = content.cloneNode(true);
    clean.querySelectorAll('script,iframe,.study-print-toolbar,button,input,select,textarea,.lab__controls,.lab__range,.lab__chip').forEach(node => node.remove());
    // Same-origin documentation authored in StudyLab. We display a print-only snapshot, not an active program.
    result.push(`<article class="study-print-article"><div class="study-print-lesson-number">${safeText(lesson.section)} · LEKCJA ${i+1}/${lessons.length}</div><h1>${safeText(lesson.title)}</h1><div class="study-print-prose sl-markdown-content">${clean.innerHTML}</div></article>`);
  }
  const root = document.createElement('div');
  root.id='study-print-root';
  root.className='study-print-' + (palette==='dark'?'dark':'light');
  const toc = lessons.map((l,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${safeText(l.title)}</li>`).join('');
  root.innerHTML = `<div class="study-print-cover"><div class="study-print-kicker">STUDYLAB / C++</div><h1>Programowanie <em>C++</em></h1><p>${lessons.length===1?'Jeden wybrany temat':'Zbiór wybranych tematów'} · Opracowanie do samodzielnej nauki</p><div class="study-print-toc"><h2>Spis treści</h2><ol>${toc}</ol></div><div class="study-print-cover-foot">BLACK EDITION · WYGENEROWANO Z TWOJEGO STUDYLAB</div></div>${result.join('')}`;
  document.body.appendChild(root);
  document.body.classList.add('study-pdf-print');
  const cleanup=()=>{root.remove();document.body.classList.remove('study-pdf-print');window.removeEventListener('afterprint',cleanup);};
  window.addEventListener('afterprint',cleanup,{once:true});
  setStatus('Otwieram okno drukowania — wybierz „Zapisz jako PDF”.');
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try { window.print(); } catch(error) { cleanup(); throw error; }
  // Some browser print engines do not dispatch afterprint consistently; manual repeated exports clear old snapshots.
}

export default function PdfTopicButton({slug,title,section='C++'}) {
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [palette,setPalette]=useState('dark');
  const onSave=async()=>{setBusy(true);try{await preparePrint([{slug,title,section}],palette,setStatus);}catch(e){setStatus(`Błąd: ${e.message}`);}finally{setBusy(false);}};
  return <div className="not-content study-print-toolbar" aria-label="Eksport PDF tego tematu"><div className="study-export-mini"><div><strong>Eksport notatki</strong><span>Ten temat lub cały dział · przez drukowanie do PDF</span></div><div className="study-export-mini-actions"><label className="study-export-theme">Motyw PDF <select value={palette} onChange={e=>setPalette(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label><button type="button" disabled={busy} onClick={onSave}>{busy?'Przygotowuję…':'↓ Zapisz temat jako PDF'}</button><a href={lessonUrl('eksport')}>Wybierz kilka →</a></div></div>{status?<p className="study-export-status" role="status">{status}</p>:null}</div>;
}

export function PdfCollection() {
  const all = CPP_LESSONS.filter(l => !['eksport','laboratorium'].includes(l.slug));
  const [selected,setSelected]=useState(()=>all.map(l=>l.slug));
  const [palette,setPalette]=useState('dark');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  const groups=useMemo(()=>[...new Set(all.map(x=>x.section))],[]);
  const toggle=slug=>setSelected(old=>old.includes(slug)?old.filter(x=>x!==slug):[...old,slug]);
  const print=async()=>{setBusy(true);try{await preparePrint(all.filter(l=>selected.includes(l.slug)),palette,setStatus);}catch(e){setStatus(`Błąd: ${e.message}`);}finally{setBusy(false);}};
  return <section className="not-content study-export-app" aria-label="Eksport wybranych tematów C++"><div className="study-export-head"><div><span>BLACK EDITION / PDF STUDIO</span><h2>Eksportuj swoje notatki</h2><p>Wybierz tematy. StudyLab złoży je w jeden dokument z okładką, spisem treści i kodem. PDF zapiszesz w oknie drukowania przeglądarki.</p></div><div className="study-export-meter"><strong>{selected.length}</strong><span>wybranych<br/>lekcji</span></div></div>
    <div className="study-export-controls"><button type="button" onClick={()=>setSelected(all.map(l=>l.slug))}>Zaznacz wszystkie</button><button type="button" onClick={()=>setSelected([])}>Wyczyść wybór</button><label>Motyw PDF <select value={palette} onChange={e=>setPalette(e.target.value)}><option value="dark">Czarny</option><option value="light">Jasny</option></select></label></div>
    {groups.map(section=>{const lessons=all.filter(l=>l.section===section);const complete=lessons.every(l=>selected.includes(l.slug));return <div className="study-export-group" key={section}><div className="study-export-group-head"><h3>{section}</h3><button type="button" onClick={()=>setSelected(old=>complete?old.filter(x=>!lessons.some(l=>l.slug===x)):Array.from(new Set([...old,...lessons.map(l=>l.slug)])))}>{complete?'Odznacz dział':'Zaznacz dział'}</button></div><div className="study-export-checkboxes">{lessons.map(l=><label key={l.slug}><input type="checkbox" checked={selected.includes(l.slug)} onChange={()=>toggle(l.slug)}/><span>{l.title}</span></label>)}</div></div>;})}
    <div className="study-export-bottom"><button type="button" disabled={busy||!selected.length} onClick={print}>{busy?'Przygotowuję dokument…':`↓ Zapisz ${selected.length} ${selected.length===1?'temat':'tematów'} w jednym PDF`}</button><p>W oknie drukowania wybierz <strong>„Zapisz jako PDF”</strong>. Dla czarnego tła włącz <strong>drukowanie tła/grafiki tła</strong> w ustawieniach wydruku.</p></div>
    <p className="study-export-status" role="status" aria-live="polite">{status}</p>
  </section>;
}
