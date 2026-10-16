import React,{useMemo,useState} from 'react';
import {ELECTRONICS_LESSONS} from '../data/electronicsLessons.js';
import 'katex/dist/katex.min.css';
import '../styles/electronics.css';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=()=>{
 const prefix=(import.meta.env.BASE_URL || '/').replace(/\/?$/,'/');
 return new URL(prefix+'elektronika/',window.location.origin).toString();
};
const urlFor=slug=>new URL(encodeURIComponent(slug)+'/',root()).toString();
let printStyle=null;
function cleanup(){document.getElementById('elec-print-root')?.remove();printStyle?.remove();printStyle=null;}
async function runExport(selected,theme,setStatus){
 if(!selected.length)throw new Error('Wybierz co najmniej jeden temat.');
 cleanup();
 const articles=[];
 for(let i=0;i<selected.length;i++){
  const lesson=selected[i],url=urlFor(lesson.slug);
  setStatus(`Pobieranie ${i+1}/${selected.length}: ${lesson.title}`);
  const response=await fetch(url,{credentials:'same-origin'});
  if(!response.ok)throw new Error(`Brak tematu „${lesson.title}” (${response.status}). Adres: ${url}`);
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  const section=doc.querySelector('.sl-markdown-content');
  if(!section)throw new Error(`Nie odnaleziono treści na ${url}`);
  const node=section.cloneNode(true);
  node.querySelectorAll('script,style,iframe,button,input,select,textarea,.el-lab,.el-export-app,.el-export-button,.el-extras,.sl-anchor-link').forEach(el=>el.remove());
  articles.push(`<section class="el-pdf-chapter"><div class="el-pdf-eyebrow">${esc(lesson.chapter)} · Zdjęcia ${esc(lesson.photos)}</div><h1>${esc(lesson.title)}</h1><div class="sl-markdown-content">${node.innerHTML}</div></section>`);
 }
 const dark=theme==='dark',stamp=new Date().toLocaleDateString('pl-PL');
 let html=`<section class="el-pdf-cover"><div class="el-pdf-kicker">STUDYLAB / BLACK EDITION</div><div class="el-pdf-title">Podstawy<br/><em>elektroniki.</em></div><p>Interaktywny podręcznik — eksport do PDF</p><div>${selected.length} tematów · ${stamp}</div><small>Opracowanie dydaktyczne na podstawie 8 zdjęć notatek; uzupełnienia oznaczone w tekście.</small></section>`;
 html+=`<section class="el-pdf-toc"><h1>Spis treści</h1><ol>${selected.map((a,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(a.title)}</li>`).join('')}</ol></section>`;
 html+=articles.join('');
 const wrap=document.createElement('div');wrap.id='elec-print-root';wrap.className='el-pdf '+(dark?'el-pdf-dark':'el-pdf-light');wrap.innerHTML=html;document.body.appendChild(wrap);
 printStyle=document.createElement('style');printStyle.id='elec-print-style';printStyle.textContent=`
 #elec-print-root{display:none}
 @media print{
 @page{size:A4;margin:16mm 15mm}
 html,body{background:${dark?'#000':'#fff'}!important}
 body > :not(#elec-print-root){display:none!important}
 #elec-print-root{display:block!important;position:static!important;}
 #elec-print-root *{animation:none!important;transition:none!important}
 #elec-print-root .el-pdf-cover{break-after:page}
 #elec-print-root .el-pdf-toc{break-after:page}
 #elec-print-root .el-pdf-chapter{break-before:page}
 #elec-print-root h2,#elec-print-root h3{break-after:avoid}
 #elec-print-root table,#elec-print-root pre,#elec-print-root .elec-eq-block{break-inside:avoid}
 }
 `;document.head.appendChild(printStyle);
 setStatus('Otwieram wydruk — wybierz „Zapisz jako PDF”.');
 window.addEventListener('afterprint',()=>{cleanup();setStatus('Eksport zakończony lub anulowany.');},{once:true});
 setTimeout(()=>window.print(),350);
}
function useExport(){const[status,setStatus]=useState('');const[busy,setBusy]=useState(false);
 async function go(selected,theme){if(busy)return;setBusy(true);setStatus('Przygotowywanie dokumentu…');try{await runExport(selected,theme,setStatus)}catch(e){setStatus('Błąd: '+e.message)}finally{setBusy(false)}}return{go,busy,status}}
export function ElectronicsPdfButton({slug}){const ex=useExport();const item=ELECTRONICS_LESSONS.find(x=>x.slug===slug);
 if(!item)return null;
 return <div className="el-export-button not-content"><button type="button" disabled={ex.busy} onClick={()=>ex.go([item],'dark')}>↓ Zapisz tę lekcję jako PDF</button>{ex.status&&<small aria-live="polite">{ex.status}</small>}</div>}
export function ElectronicsPdfCollection(){const [ids,setIds]=useState(ELECTRONICS_LESSONS.filter(x=>!['09 · Dodatki'].includes(x.chapter)).map(x=>x.slug)),[theme,setTheme]=useState('dark');const ex=useExport();const selected=useMemo(()=>ELECTRONICS_LESSONS.filter(x=>ids.includes(x.slug)),[ids]);
 const groups=[...new Set(ELECTRONICS_LESSONS.map(x=>x.chapter))];const choose=(key,checked)=>{let vals=ELECTRONICS_LESSONS.filter(x=>x.chapter===key).map(x=>x.slug);setIds(current=>checked?[...new Set([...current,...vals])]:current.filter(x=>!vals.includes(x)))};
 return <div className="el-export-app not-content"><div className="el-toolbar"><button type="button" onClick={()=>setIds(ELECTRONICS_LESSONS.map(x=>x.slug))}>Wszystkie</button><button type="button" onClick={()=>setIds([])}>Wyczyść wybór</button><span>Wybrano <b>{selected.length}</b> z {ELECTRONICS_LESSONS.length}</span></div><div className="el-export-groups">{groups.map(g=>{let group=ELECTRONICS_LESSONS.filter(x=>x.chapter===g),all=group.every(x=>ids.includes(x.slug));return <fieldset key={g}><legend><label><input type="checkbox" checked={all} onChange={e=>choose(g,e.target.checked)}/>{g}</label></legend>{group.map(x=><label key={x.slug} className="el-export-option"><input type="checkbox" checked={ids.includes(x.slug)} onChange={e=>setIds(current=>e.target.checked?[...current,x.slug]:current.filter(y=>y!==x.slug))}/><span>{x.title}</span><small>zdj. {x.photos}</small></label>)}</fieldset>})}</div><div className="el-toolbar"><span>Motyw PDF:</span><label><input type="radio" name="el-theme" checked={theme==='dark'} onChange={()=>setTheme('dark')}/> Czarny</label><label><input type="radio" name="el-theme" checked={theme==='light'} onChange={()=>setTheme('light')}/> Jasny</label></div><button className="el-export-primary" type="button" disabled={ex.busy||selected.length===0} onClick={()=>ex.go(selected,theme)}>↓ Przygotuj {selected.length} tematów do jednego PDF</button>{ex.status&&<p role="status" className="el-export-status">{ex.status}</p>}<p className="el-note">Eksport działa lokalnie w przeglądarce. W oknie drukowania wybierz „Zapisz jako PDF”. Przy czarnym motywie zaznacz „Drukuj tła”. Interaktywne symulacje są dostępne na stronie WWW, ale nie w statycznym PDF.</p></div>}
