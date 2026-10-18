import React, {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {describeAlgorithm} from './studylab-flow-engine.mjs';
import './studylab-flowchart.css';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=(text,limit=34)=>{
  const s=String(text||'').replace(/\s+/g,' ').trim();
  if(!s)return [''];
  const chunks=s.match(/.{1,24}(?:\s|$)|\S{25,}/g)||[s];
  const words=chunks.flatMap(c=>c.trim().split(/\s+/));
  const lines=[];let line='';
  for(const w of words){if(line && (line.length+w.length+1)>limit){lines.push(line);line=w;}else line+=(line?' ':'')+w;}
  if(line)lines.push(line);
  return lines.slice(0,5);
};
function ExpandIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" className="slflow-expand-icon"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function Diagram({flow,svgRef,onSelect,selectedAstId,activeAstId}) {
  const stableId=useId().replace(/:/g,'');const marker=`slflow-arrow-${stableId}`;
  return <svg ref={svgRef} viewBox={`0 0 ${flow.width} ${flow.height}`} className="slflow-svg" role="img" aria-label="Schemat blokowy programu C++">
    <defs><marker id={marker} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#97adc6"/></marker></defs>
    <rect className="slflow-bg" width={flow.width} height={flow.height}/>
    {flow.edges.map((e,i)=><g key={`${e.from}-${e.to}-${i}`}><path d={e.d} fill="none" stroke="#95acc6" strokeWidth="2.1" markerEnd={`url(#${marker})`} strokeLinejoin="round" strokeLinecap="round"/>{e.label?<text className="slflow-edge-label" x={e.tagX} y={e.tagY}>{e.label}</text>:null}</g>)}
    {flow.nodes.map(n=>{
      const active=n.astId&&n.astId===activeAstId;
      const selected=n.astId&&n.astId===selectedAstId;
      const lines=wrap(n.text,n.kind==='decision'?21:30);
      const textStart=n.y-((lines.length-1)*9);
      const klass=`slflow-node slflow-node-${n.kind}${active?' slflow-node-active':''}${selected?' slflow-node-selected':''}`;
      const h=n.h,w=n.w;
      return <g key={n.id} className={klass} onClick={()=>onSelect?.(n)} role={n.astId?'button':undefined} aria-label={n.astId?`Pokaż instrukcję: ${n.text}`:undefined} tabIndex={n.astId?0:undefined} onKeyDown={e=>{if(n.astId&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect?.(n);}}}>
        {n.kind==='decision'? <polygon points={`${n.x},${n.y-h/2} ${n.x+w/2},${n.y} ${n.x},${n.y+h/2} ${n.x-w/2},${n.y}`} />:
         n.kind==='input'||n.kind==='output'?<polygon points={`${n.x-w/2+18},${n.y-h/2} ${n.x+w/2},${n.y-h/2} ${n.x+w/2-18},${n.y+h/2} ${n.x-w/2},${n.y+h/2}`}/>:
         <rect x={n.x-w/2} y={n.y-h/2} width={w} height={h} rx={n.kind==='start'||n.kind==='end'?28:12}/>}
        <text className="slflow-node-label" textAnchor="middle" x={n.x} y={textStart}>{lines.map((line,j)=><tspan key={j} x={n.x} dy={j===0?0:18}>{line}</tspan>)}</text>
      </g>;
    })}
  </svg>;
}
function blobSave(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function svgStandalone(element,flow){
  if(!element)return null;
  const copy=element.cloneNode(true);
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',String(flow.width));copy.setAttribute('height',String(flow.height));
  const style=document.createElementNS('http://www.w3.org/2000/svg','style');
  style.textContent=`
.slflow-bg{fill:#07111a}.slflow-node rect,.slflow-node polygon{stroke:#507096;stroke-width:2;fill:#142436}.slflow-node-start rect,.slflow-node-end rect{fill:#12412c}.slflow-node-decision polygon{fill:#38244d;stroke:#8f70af}.slflow-node-input polygon,.slflow-node-output polygon{fill:#123b50}.slflow-node-case rect{fill:#3a2c42}.slflow-node-label{fill:#edf7ff;font:700 14px Arial,sans-serif;dominant-baseline:middle}.slflow-edge-label{fill:#91f6bd;font:700 13px Arial,sans-serif}.slflow-node-active rect,.slflow-node-active polygon{stroke:#69f5a0;stroke-width:4}.slflow-node-selected rect,.slflow-node-selected polygon{stroke:#facc6c;stroke-width:3}`;
  copy.insertBefore(style,copy.firstChild);
  return new XMLSerializer().serializeToString(copy);
}
function Scroller({flow,svgRef,selectedAstId,activeAstId,onSelect,zoom,onSetZoom,viewportRef}){
  const drag=useRef(null);
  return <div className="slflow-scroller" ref={viewportRef}
    onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop,moved:false};}}
    onPointerMove={e=>{if(!drag.current)return;const d=drag.current;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>5){d.moved=true;e.currentTarget.scrollLeft=d.left-dx;e.currentTarget.scrollTop=d.top-dy;}}}
    onPointerUp={e=>{const d=drag.current;drag.current=null;if(d?.moved){e.preventDefault();e.stopPropagation();}}}
    onPointerLeave={()=>{drag.current=null;}}
  ><div className="slflow-zoom-stage" style={{width:flow.width*zoom,height:flow.height*zoom}}><Diagram flow={flow} svgRef={svgRef} selectedAstId={selectedAstId} activeAstId={activeAstId} onSelect={n=>{if(!drag.current?.moved)onSelect?.(n);}}/></div></div>;
}
function Controls({zoom,onZoom,fit,reset,full,onFull,close=false}){
  return <div className="slflow-toolbar">
    <button type="button" onClick={()=>onZoom(zoom/1.25)} title="Pomniejsz" aria-label="Pomniejsz">−</button>
    <span className="slflow-zoom-label">{Math.round(zoom*100)}%</span>
    <button type="button" onClick={()=>onZoom(zoom*1.25)} title="Powiększ" aria-label="Powiększ">+</button>
    <button type="button" onClick={fit} title="Dopasuj cały schemat" aria-label="Dopasuj do okna">Dopasuj</button>
    <button type="button" onClick={reset} title="Skala 100%" aria-label="Skala 100%">1:1</button>
    <button type="button" onClick={onFull} className="slflow-expand-button" title={close?'Zamknij pełny ekran':'Otwórz pełny ekran'} aria-label={close?'Zamknij pełny ekran':'Otwórz pełny ekran'}>{close?'✕':<ExpandIcon/>}</button>
  </div>;
}
function Player({trace,step,playing,onPlay,onPause,onNext,onPrevious,onReset}){
  return <div className="slflow-player">
    <div className="slflow-player-buttons">
      <button type="button" onClick={playing?onPause:onPlay} disabled={!trace.length}>{playing?'⏸ Pauza':'▶ Odtwórz'}</button>
      <button type="button" onClick={onPrevious} disabled={!trace.length||step<=0}>← Wstecz</button>
      <button type="button" onClick={onNext} disabled={!trace.length||step>=trace.length-1}>Krok →</button>
      <button type="button" onClick={onReset} disabled={!trace.length}>↺ Reset</button>
    </div>
    <span className="slflow-player-position">{trace.length?`${Math.max(0,step+1)} / ${trace.length} kroków`:'Użyj „Uruchom z animacją”, aby śledzić rzeczywisty przebieg programu'}</span>
    {trace[step] ? <span className="slflow-player-line">{trace[step].text}{trace[step].branch===null?'':` — ${trace[step].branch?'TAK':'NIE'}`}</span>:null}
  </div>;
}
export default function StudyLabFlowchart({flow,sourceName,source,onSelect,selectedAstId,trace,traceStep,tracePlaying,onPlay,onPause,onNext,onPrevious,onReset}) {
  const [full,setFull]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [modalZoom,setModalZoom]=useState(1);
  const innerRef=useRef(null),modalRef=useRef(null),svgRef=useRef(null);
  const activeAstId=trace[traceStep]?.astId||null;
  useEffect(()=>{
    if(!full)return undefined;
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const esc=e=>{if(e.key==='Escape')setFull(false);};
    document.addEventListener('keydown',esc);
    return ()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=prev;};
  },[full]);
  // Default fit should show the entire graph (including both branch columns) on open.
  const fit=(modal)=>{
    if(!flow?.width)return;
    const el=modal?modalRef.current:innerRef.current;
    if(!el)return;
    const availableW=Math.max(100,el.clientWidth-34),availableH=Math.max(100,el.clientHeight-34);
    const factor=clamp(Math.min(availableW/flow.width,availableH/flow.height),.05,2);
    if(modal)setModalZoom(factor);else setZoom(factor);
    el.scrollLeft=0;el.scrollTop=0;
  };
  useEffect(()=>{if(full)requestAnimationFrame(()=>fit(true));},[full,flow?.width,flow?.height]);
  useEffect(()=>{if(!full)requestAnimationFrame(()=>fit(false));},[flow?.width,flow?.height]);
  const download=(kind)=>{
    if(!flow?.width || !svgRef.current)return;
    const serialized=svgStandalone(svgRef.current,flow);
    if(!serialized)return;
    const name=(sourceName||'main.cpp').replace(/\.cpp$/,'');
    if(kind==='svg')blobSave(new Blob([serialized],{type:'image/svg+xml;charset=utf-8'}),name+'-schemat.svg');
    if(kind==='txt')blobSave(new Blob([describeAlgorithm(flow.parsed)],{type:'text/plain;charset=utf-8'}),name+'-algorytm.txt');
    if(kind==='png'){
      const url=URL.createObjectURL(new Blob([serialized],{type:'image/svg+xml;charset=utf-8'}));
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas'),scale=2;
        canvas.width=flow.width*scale;canvas.height=flow.height*scale;
        const ctx=canvas.getContext('2d');
        if(ctx){ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(b=>{if(b)blobSave(b,name+'-schemat.png');},'image/png');}
        URL.revokeObjectURL(url);
      };
      img.onerror=()=>URL.revokeObjectURL(url);
      img.src=url;
    }
  };
  const player=<Player trace={trace} step={traceStep} playing={tracePlaying} onPlay={onPlay} onPause={onPause} onNext={onNext} onPrevious={onPrevious} onReset={onReset}/>;
  if(flow?.error)return <section className="slflow-panel"><h4>Schemat blokowy</h4><p className="slflow-error">{flow.error}</p></section>;
  return <>
    <section className="slflow-panel">
      <header className="slflow-header"><div><h4>Schemat blokowy</h4><p>Pod konsolą · kliknij blok, aby przejść do odpowiedniego fragmentu kodu.</p></div><Controls zoom={zoom} onZoom={v=>setZoom(clamp(v,.05,4))} fit={()=>fit(false)} reset={()=>setZoom(1)} onFull={()=>setFull(true)}/></header>
      {flow?.warnings?.length?<p className="slflow-warning">{flow.warnings.join(' ')}</p>:null}
      <Scroller flow={flow} zoom={zoom} viewportRef={innerRef} svgRef={svgRef} selectedAstId={selectedAstId} activeAstId={activeAstId} onSelect={onSelect}/>
      {player}
      <footer className="slflow-downloads"><button type="button" onClick={()=>download('svg')}>↓ SVG</button><button type="button" onClick={()=>download('png')}>↓ PNG</button><button type="button" onClick={()=>download('txt')}>↓ Opis algorytmu</button></footer>
    </section>
    {full && createPortal(<div className="slflow-fullscreen" role="dialog" aria-modal="true" aria-label="Schemat blokowy — pełny ekran">
      <div className="slflow-full-header"><h4>Schemat blokowy <small>{sourceName}</small></h4><Controls zoom={modalZoom} onZoom={v=>setModalZoom(clamp(v,.05,4))} fit={()=>fit(true)} reset={()=>setModalZoom(1)} onFull={()=>setFull(false)} close/></div>
      <Scroller flow={flow} zoom={modalZoom} viewportRef={modalRef} selectedAstId={selectedAstId} activeAstId={activeAstId} onSelect={onSelect}/>
      {player}
      <footer className="slflow-downloads"><button type="button" onClick={()=>download('svg')}>↓ SVG</button><button type="button" onClick={()=>download('png')}>↓ PNG</button><button type="button" onClick={()=>download('txt')}>↓ Opis algorytmu</button></footer>
    </div>,document.body)}
  </>;
}
