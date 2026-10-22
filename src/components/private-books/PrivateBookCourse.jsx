import React,{useMemo,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {buildLessonFromPageText,safeFormulaLatex} from '../../lib/pdf-lesson-layout.mjs';
import {lessonPages} from '../../lib/pdf-book-course.mjs';
import './private-book-course.css';

function PdfBlock({block}){
 if(block.type==='heading')return <h4>{block.text}</h4>;
 if(block.type==='list')return <p className="sl-pbookcourse-list">{block.text}</p>;
 if(block.type==='formula'){
   const tex=safeFormulaLatex(block.text);let html='';
   if(tex){try{html=katex.renderToString(tex,{displayMode:true,throwOnError:true,trust:false,strict:'ignore',maxExpand:200,maxSize:20});}catch{/* render original */}}
   return <div className="sl-pbookcourse-formula">{html?<div className="sl-pbookcourse-katex" dangerouslySetInnerHTML={{__html:html}}/>:block.text}</div>;
 }
 return <p>{block.text}</p>;
}

export default function PrivateBookCourse({course,onOpenOriginal,onRename}){
 const lessons=useMemo(()=>course.chapters.flatMap(c=>c.lessons.map(l=>({...l,chapterId:c.id,chapterTitle:c.title}))),[course]);
 const [selectedId,setSelectedId]=useState(lessons[0]?.id||'');
 const [zoom,setZoom]=useState(1);
 const [search,setSearch]=useState('');
 const selected=lessons.find(l=>l.id===selectedId)||lessons[0];
 const pageData=useMemo(()=>lessonPages(course,selected),[course,selected?.id]);
 const blocksByPage=useMemo(()=>pageData.map(p=>({page:p.page,blocks:buildLessonFromPageText(p.text)})),[pageData]);
 const q=search.trim().toLocaleLowerCase('pl');
 const currentIdx=selected?lessons.findIndex(l=>l.id===selected.id):-1;
 const choose=id=>{setSelectedId(id);setSearch('');};
 return <section className="sl-pbookcourse" aria-label={`Lekcje książki: ${course.title}`}>
   <header className="sl-pbookcourse-cover">
     <span className="sl-pbookcourse-kicker">STUDYLAB / TWOJA PRYWATNA KSIĄŻKA</span>
     <h2>📗 {course.title}</h2>
     <p>{course.chapters.length} rozdziałów · {lessons.length} lekcji · {course.extractedPageCount} stron z tekstem</p>
   </header>
   <p role="note" className="sl-pbookcourse-warning">Automatycznie wydzielone lekcje z warstwy tekstowej PDF. Podział, wzory i diagramy mogą być niepełne; sprawdzaj je w oryginalnym PDF. Nie dodano żadnej treści AI ani nie zmieniono Twoich notatek.</p>
   <div className="sl-pbookcourse-grid">
     <nav className="sl-pbookcourse-toc" aria-label={`Spis treści: ${course.title}`}>
       <h3>Rozdziały książki</h3>
       {course.chapters.map((chapter,i)=><details key={chapter.id} open={chapter.lessons.some(l=>l.id===selected?.id)}>
         <summary><span>{i+1}. {chapter.title}</span></summary>
         <div className="sl-pbookcourse-chapter-tools"><button type="button" onClick={()=>onRename?.(chapter.id,null,chapter.title)} aria-label={`Zmień tytuł rozdziału ${chapter.title}`}>Zmień tytuł rozdziału</button></div>
         <ul>{chapter.lessons.map(lesson=><li key={lesson.id}>
           <div className="sl-pbookcourse-lessonrow">
             <button type="button" className={selected?.id===lesson.id?'sl-pbookcourse-active':''} onClick={()=>choose(lesson.id)} aria-current={selected?.id===lesson.id?'page':undefined}>
               {lesson.title}<small>str. {lesson.startPage}{lesson.endPage!==lesson.startPage?`–${lesson.endPage}`:''}</small>
             </button>
             <button type="button" className="sl-pbookcourse-rename" title="Zmień tytuł lekcji" onClick={()=>onRename?.(chapter.id,lesson.id,lesson.title)}>✎</button>
           </div>
         </li>)}</ul>
       </details>)}
     </nav>
     <div className="sl-pbookcourse-reading" style={{'--book-zoom':zoom}}>
       {selected?<>
         <div className="sl-pbookcourse-crumb">{course.title} / {selected.chapterTitle}</div>
         <h3>{selected.title}</h3>
         <div className="sl-pbookcourse-toolbar">
           <span>Strony źródłowe: {selected.startPage}–{selected.endPage}</span>
           <div className="sl-pbookcourse-scale">
             <button onClick={()=>setZoom(v=>Math.max(.85,Math.round((v-.1)*10)/10))} disabled={zoom<=.85} aria-label="Zmniejsz tekst">A−</button>
             <span>{Math.round(zoom*100)}%</span>
             <button onClick={()=>setZoom(v=>Math.min(1.5,Math.round((v+.1)*10)/10))} disabled={zoom>=1.5} aria-label="Powiększ tekst">A+</button>
           </div>
         </div>
         <label className="sl-pbookcourse-filter">Szukaj w tej lekcji
           <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Słowo lub fragment…"/>
         </label>
         <article className="sl-pbookcourse-article">
           {blocksByPage.map(({page,blocks})=>{
             const visible=q?blocks.filter(b=>b.text.toLocaleLowerCase('pl').includes(q)):blocks;
             if(q&&!visible.length)return null;
             return <section key={page} className="sl-pbookcourse-page">
               <div className="sl-pbookcourse-source"><span>Oryginał · strona {page}</span>
                 <button type="button" onClick={()=>onOpenOriginal?.(page)}>Zobacz stronę PDF ↗</button>
               </div>
               {visible.length?visible.map((b,i)=><PdfBlock block={b} key={i}/>):<p className="sl-pbookcourse-missing">Brak rozpoznanego tekstu na tej stronie. Otwórz oryginał.</p>}
             </section>;
           })}
           {q&&!blocksByPage.some(p=>p.blocks.some(b=>b.text.toLocaleLowerCase('pl').includes(q)))&&<p>Nie znaleziono fragmentu w tej lekcji.</p>}
         </article>
         <div className="sl-pbookcourse-bottom">
           <button type="button" disabled={currentIdx<=0} onClick={()=>choose(lessons[currentIdx-1]?.id)}>← Poprzednia lekcja</button>
           <button type="button" disabled={currentIdx===lessons.length-1} onClick={()=>choose(lessons[currentIdx+1]?.id)}>Następna lekcja →</button>
         </div>
       </>:<p>Nie znaleziono lekcji. Sprawdź tekst dokumentu lub wykonaj konwersję ponownie.</p>}
     </div>
   </div>
 </section>;
}
