import React,{useEffect,useMemo,useRef,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {getPdfEngine} from '../../lib/pdf-text.mjs';
import {buildLessonFromPageText,cleanPdfPageNumber,createPdfLessonBlocks,isPotentialMathFormattingLoss,linesFromPdfItems,safeFormulaLatex} from '../../lib/pdf-lesson-layout.mjs';

/** PDF bytes stay in the browser: this component never transmits text or PDF to any AI. */
export default function PrivatePdfReader({book,url,ownerId}){
  const [mode,setMode]=useState('lesson');
  const [page,setPage]=useState(1);
  const [requestedPage,setRequestedPage]=useState('1');
  const [count,setCount]=useState(Number(book?.pageCount)||0);
  const [zoom,setZoom]=useState(1);
  const [readyVersion,setReadyVersion]=useState(0);
  const [blocks,setBlocks]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const documentRef=useRef(null);
  const serial=useRef(0);
  const savedKey=`studylab-pdf-place:${ownerId||'local'}:${book?.id||'unknown'}`;
  const knownPages=Array.isArray(book?.pages)?book.pages:[];
  const currentNumber=count||Number(book?.pageCount)||1;

  useEffect(()=>{
    let saved=1;
    try{saved=Number(localStorage.getItem(savedKey))||1;}catch{/* storage can be blocked */}
    const first=cleanPdfPageNumber(saved,currentNumber);
    setPage(first);setRequestedPage(String(first));setSearch('');setBlocks([]);setError('');setCount(Number(book?.pageCount)||0);
  },[savedKey,book?.id]);
  useEffect(()=>{
    try{localStorage.setItem(savedKey,String(page));}catch{/* optional local bookmark */}
    setRequestedPage(String(page));
  },[savedKey,page]);

  useEffect(()=>{
    if(mode!=='lesson'||!book?.blob)return;
    let cancelled=false;let task=null;let doc=null;
    setBusy(true);setError('');setBlocks([]);
    (async()=>{
      try{
        const pdfjs=await getPdfEngine();
        if(cancelled)return;
        const bytes=new Uint8Array(await book.blob.arrayBuffer());
        if(cancelled)return;
        task=pdfjs.getDocument({data:bytes,useSystemFonts:true});
        doc=await task.promise;
        if(cancelled){await doc.destroy();return;}
        documentRef.current=doc;setCount(doc.numPages);setReadyVersion(v=>v+1);setBusy(false);
      }catch(e){
        if(cancelled)return;
        const fallback=knownPages.some(p=>Number(p.page)===page&&String(p.text||'').trim());
        setError(fallback?'PDF.js jest niedostępny; używam wcześniej zapisanego tekstu.':'Nie udało się odczytać PDF. Możesz czytać oryginał: '+(e.message||String(e)));
        setBusy(false);
      }
    })();
    return()=>{cancelled=true;serial.current++;
      if(documentRef.current===doc)documentRef.current=null;
      if(doc)void doc.destroy().catch(()=>{});
      else if(task)void task.destroy().catch(()=>{});
    };
  },[book?.blob,mode]);

  useEffect(()=>{
    if(mode!=='lesson')return;
    let stopped=false;const seq=++serial.current;
    const saved=knownPages.find(p=>Number(p.page)===page);
    if(!documentRef.current){
      setBlocks(saved?.text?buildLessonFromPageText(saved.text):[]);
      return;
    }
    (async()=>{
      setBusy(true);setError('');
      try{
        const pdfPage=await documentRef.current.getPage(page);
        const content=await pdfPage.getTextContent();
        const rows=linesFromPdfItems(content.items);
        pdfPage.cleanup();
        if(stopped||seq!==serial.current)return;
        const parsed=createPdfLessonBlocks(rows);
        setBlocks(parsed.length?parsed:saved?.text?buildLessonFromPageText(saved.text):[]);
      }catch(e){
        if(stopped||seq!==serial.current)return;
        setBlocks(saved?.text?buildLessonFromPageText(saved.text):[]);
        setError('Nie udało się odczytać strony: '+(e.message||String(e)));
      }finally{if(!stopped&&seq===serial.current)setBusy(false);}
    })();
    return()=>{stopped=true;serial.current++;};
  },[mode,page,count,book?.id,readyVersion]);

  const matches=useMemo(()=>{
    const q=search.trim().toLocaleLowerCase('pl');return q?blocks.filter(x=>x.text.toLocaleLowerCase('pl').includes(q)):[];
  },[search,blocks]);
  const canShowOriginal=Boolean(url);
  function navigate(p){setPage(cleanPdfPageNumber(p,currentNumber));setSearch('');}
  function changePage(e){e.preventDefault();navigate(requestedPage);}
  const formulaWarning=isPotentialMathFormattingLoss(blocks);
  return <div className="sl-pdfreader" aria-label={`Czytnik: ${book.title}`}>
    <div className="sl-pdfreader-topbar">
      <div className="sl-pdfreader-modes" role="group" aria-label="Tryb czytania PDF">
        <button className={mode==='original'?'active':''} aria-pressed={mode==='original'} onClick={()=>setMode('original')}>Oryginalny PDF</button>
        <button className={mode==='dark'?'active':''} aria-pressed={mode==='dark'} onClick={()=>setMode('dark')}>Ciemny PDF</button>
        <button className={mode==='lesson'?'active':''} aria-pressed={mode==='lesson'} onClick={()=>setMode('lesson')}>Czytaj jak lekcję</button>
      </div>
      <span className="sl-pdfreader-privacy">🔒 Tylko Twoje konto · Bez AI</span>
    </div>
    <div className="sl-pdfreader-controls">
      <div className="sl-pdfreader-turn">
        <button disabled={page<=1} onClick={()=>navigate(page-1)} aria-label="Poprzednia strona">←</button>
        <form onSubmit={changePage}>
          <label htmlFor={`pdf-page-${book.id}`}>Strona</label>
          <input id={`pdf-page-${book.id}`} type="number" min="1" max={currentNumber} value={requestedPage} onChange={e=>setRequestedPage(e.target.value)} />
          <span> / {count||book.pageCount||'?'}</span>
          <button type="submit" aria-label="Przejdź do strony">Idź</button>
        </form>
        <button disabled={count>0&&page>=count} onClick={()=>navigate(page+1)} aria-label="Następna strona">→</button>
      </div>
      {mode==='lesson'&&<div className="sl-pdfreader-scale">
        <button onClick={()=>setZoom(z=>Math.max(.85,Math.round((z-.1)*10)/10))} disabled={zoom<=.85} aria-label="Zmniejsz tekst">A−</button>
        <span>{Math.round(zoom*100)}%</span>
        <button onClick={()=>setZoom(z=>Math.min(1.5,Math.round((z+.1)*10)/10))} disabled={zoom>=1.5} aria-label="Powiększ tekst">A+</button>
      </div>}
    </div>
    {mode==='original'||mode==='dark'?<>
      {canShowOriginal?<iframe className={`sl-pdfreader-pdf ${mode==='dark'?'sl-pdfreader-inverted':''}`}
        title={`${mode==='dark'?'Ciemny podgląd':'Oryginalny PDF'}: ${book.title}`} src={`${url}#page=${page}`}/>:<p>Oryginalny plik jest niedostępny.</p>}
      {mode==='dark'&&<p className="sl-pdfreader-disclaimer">Ciemny PDF to filtr wizualny. Może odwracać również kolory ilustracji i schematów. Nie zmienia zapisanych stron.</p>}
    </>:<div className="sl-pdfreader-reading" style={{'--reader-zoom':zoom}}>
      <div className="sl-pdfreader-reading-header">
        <div><small>STUDYLAB / BLACK READER</small><h3>{book.title}</h3><p>Strona {page} {count?`z ${count}`:''}</p></div>
        <span>Widok automatyczny</span>
      </div>
      <div className="sl-pdfreader-disclaimer" role="note">
        Tekst i nagłówki są rekonstruowane lokalnie z PDF, bez Gemini API. To nie jest poprawiona ani zweryfikowana lekcja: wzory, tabele, kolumny i diagramy sprawdzaj w oryginale. Skany bez tekstu wymagają OCR.
      </div>
      {busy&&<p role="status">Odczytuję stronę {page}…</p>}
      {error&&<p role="status" className="sl-pdfreader-error">{error}</p>}
      {!busy&&blocks.length>0&&<>
        <label className="sl-pdfreader-search">Szukaj na bieżącej stronie
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Fragment tekstu…"/>
        </label>
        {search.trim()&&<p className="sl-pdfreader-results" role="status">Dopasowania: {matches.length}. Wyszukiwanie dotyczy tylko bieżącej strony.</p>}
        {formulaWarning&&<p className="sl-pdfreader-mathwarn">Na tej stronie mogą być wzory, których struktura nie została odtworzona. Zobacz oryginalny PDF przed nauką z tych obliczeń.</p>}
        <article className="sl-pdfreader-content">
          {(search.trim()?matches:blocks).map((b,i)=>{
            if(b.type==='heading')return <h4 key={i}>{b.text}</h4>;
            if(b.type==='formula'){
              const tex=safeFormulaLatex(b.text);
              let html='';
              if(tex){try{html=katex.renderToString(tex,{displayMode:true,throwOnError:true,trust:false,strict:'ignore',maxExpand:200,maxSize:20});}catch{/* retain original */}}
              return <div className="sl-pdfreader-formula" key={i} aria-label="Wzór odczytany z PDF bez weryfikacji">
                {html?<div className="sl-pdfreader-katex" dangerouslySetInnerHTML={{__html:html}}/>:b.text}
              </div>;
            }
            if(b.type==='list')return <p className="sl-pdfreader-list" key={i}>{b.text}</p>;
            return <p key={i}>{b.text}</p>;
          })}
        </article>
      </>}
      {!busy&&!blocks.length&&<div className="sl-pdfreader-empty">
        <h4>Na tej stronie nie odnaleziono tekstu</h4>
        <p>To może być skan, ilustracja lub PDF z nietypowym kodowaniem. Możesz nadal czytać oryginał.</p>
        <button onClick={()=>setMode('original')}>Pokaż oryginalny PDF</button>
      </div>}
    </div>}
    <div className="sl-pdfreader-footer"><button disabled={page<=1} onClick={()=>navigate(page-1)}>← Poprzednia</button><button disabled={count>0&&page>=count} onClick={()=>navigate(page+1)}>Następna →</button></div>
  </div>;
}
