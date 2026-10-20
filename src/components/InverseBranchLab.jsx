import React,{useMemo,useState} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {parabola,inverseBranch,domainForBranch,parabolaPoints} from './inverse-branch-model.mjs';
import './inverse-branch-lab.css';
const PX=v=>50+(v+5)*20;
const PY=v=>375-(v+5)*20;
const fmt=n=>Number((Math.abs(n)<1e-10?0:n).toFixed(2)).toLocaleString('pl-PL',{maximumFractionDigits:2});
function Latex({tex}){const html=useMemo(()=>katex.renderToString(tex,{throwOnError:false,strict:'ignore',trust:false}),[tex]);return <span role="math" aria-label={tex} dangerouslySetInnerHTML={{__html:html}}/>}
export default function InverseBranchLab(){
 const [branch,setBranch]=useState('left');const [x,setX]=useState(0);
 const y=parabola(x),back=inverseBranch(y,branch);
 const points=useMemo(()=>parabolaPoints(branch),[branch]);
 const p1=points.map(([a,b],i)=>(i?'L':'M')+PX(a).toFixed(2)+' '+PY(b).toFixed(2)).join(' ');
 const p2=points.map(([a,b],i)=>(i?'L':'M')+PX(b).toFixed(2)+' '+PY(a).toFixed(2)).join(' ');
 const [min,max]=domainForBranch(branch);
 function choose(next){setBranch(next);setX(next==='left'?0:4)}
 return <section className="m17-inverse" aria-label="Interaktywny symulator funkcji odwrotnej">
  <h3>Laboratorium: skąd bierze się znak przed pierwiastkiem?</h3>
  <p>Najpierw wybierz gałąź paraboli, potem zmień x. Turkusowy punkt to <strong>(x, f(x))</strong>, a fioletowy to <strong>(f(x), x)</strong> na wykresie odwrotności. Oba są odbiciem względem przerywanej prostej y=x.</p>
  <fieldset className="m17-branches"><legend>Ograniczenie dziedziny funkcji wyjściowej</legend><label><input type="radio" name="m17-branch" checked={branch==='left'} onChange={()=>choose('left')}/> x ≤ 2 (gałąź lewa)</label><label><input type="radio" name="m17-branch" checked={branch==='right'} onChange={()=>choose('right')}/> x ≥ 2 (gałąź prawa)</label></fieldset>
  <label className="m17-slider"><span>Argument pierwotnej funkcji: <strong>x = {fmt(x)}</strong></span><input aria-label="Argument x na wybranej gałęzi" type="range" min={min} max={max} step="0.25" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
  <svg viewBox="0 0 460 405" role="img" aria-label={`Wykres funkcji i jej odwrotności dla gałęzi ${branch==='left'?'x mniejsze lub równe 2':'x większe lub równe 2'}. f(${fmt(x)})=${fmt(y)}, odwrotna od ${fmt(y)} wynosi ${fmt(back)}.`}>
   <rect x="0" y="0" width="460" height="405" rx="12" fill="#061418"/>
   {[-4,0,4,8,12].map(v=><React.Fragment key={v}><line x1={PX(v)} y1="10" x2={PX(v)} y2="375" className="m17-grid"/><line x1="50" y1={PY(v)} x2="415" y2={PY(v)} className="m17-grid"/><text x={PX(v)} y="390" textAnchor="middle" className="m17-tick">{v}</text><text x="41" y={PY(v)+3} textAnchor="end" className="m17-tick">{v}</text></React.Fragment>)}
   <line x1="50" y1={PY(0)} x2="415" y2={PY(0)} className="m17-axis"/><line x1={PX(0)} y1="10" x2={PX(0)} y2="375" className="m17-axis"/>
   <line x1={PX(-5)} y1={PY(-5)} x2={PX(13)} y2={PY(13)} className="m17-diagonal"/>
   <path d={p1} className="m17-original"/><path d={p2} className="m17-curve-inverse"/>
   <line x1={PX(x)} y1={PY(y)} x2={PX(y)} y2={PY(x)} className="m17-connection"/>
   <circle cx={PX(x)} cy={PY(y)} r="6" className="m17-dot-original"/><circle cx={PX(y)} cy={PY(x)} r="6" className="m17-dot-inverse"/>
   <text x="420" y={PY(0)-8} className="m17-tick">x</text><text x={PX(0)+7} y="15" className="m17-tick">y</text>
  </svg>
  <div className="m17-legend"><span><i className="m17-color-original"/> f(x) = x² − 4x</span><span><i className="m17-color-inverse"/> f⁻¹(x)</span><span>┄ y = x (oś odbicia)</span></div>
  <div className="m17-values"><p>Funkcja wyjściowa: <Latex tex={String.raw`f(x)=x^2-4x=(x-2)^2-4`}/></p><p>Podstawienie: <strong>f({fmt(x)}) = {fmt(y)}</strong></p><p>Odwrócenie: <Latex tex={branch==='left'?String.raw`f^{-1}(y)=2-\sqrt{y+4}`:String.raw`f^{-1}(y)=2+\sqrt{y+4}`}/> = <strong>{fmt(back)}</strong></p><p>Sprawdzenie: <strong>f⁻¹(f({fmt(x)})) = {fmt(back)} = {fmt(x)}</strong></p></div>
  <p className="m17-caption"><strong>Dlaczego?</strong> {branch==='left'?'Ponieważ x ≤ 2, wyrażenie x − 2 jest nieujemne po zmianie znaku. Zatem |x − 2| = 2 − x, więc przed pierwiastkiem musi być minus.':'Ponieważ x ≥ 2, mamy |x − 2| = x − 2 i wybieramy gałąź z plusem.'} W obu przypadkach dziedziną funkcji odwrotnej jest y ≥ −4.</p>
 </section>;
}
