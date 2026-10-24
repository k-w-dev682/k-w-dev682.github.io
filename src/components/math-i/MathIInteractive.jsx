import React, { useMemo, useState } from 'react';
import './math-i-interactive.css';

const fmt = (n) => Number.isFinite(n) ? Number(n.toFixed(4)).toLocaleString('pl-PL') : '—';
const PLOT = { left: 42, right: 12, top: 16, bottom: 30, width: 640, height: 250 };
function Plot({ points, horiz = [], xLabel = 'n', yLabel = 'aₙ', labels = true }) {
  const { left, right, top, bottom, width, height } = PLOT;
  const allY = [...points.map(p => p.y), ...horiz.map(h => h.y)].filter(Number.isFinite);
  const ymin = Math.min(0, ...allY), ymax = Math.max(1, ...allY);
  const span = (ymax - ymin) || 1, Xmin = points[0]?.x ?? 0, Xmax = points.at(-1)?.x ?? 1;
  const xp = x => left + (x - Xmin) / Math.max(1e-9, Xmax - Xmin) * (width - left - right);
  const yp = y => height - bottom - (y - ymin) / span * (height - top - bottom);
  const zeroY = Math.max(top, Math.min(height - bottom, yp(0)));
  return <svg className="m17-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Wykres: ${yLabel} w funkcji ${xLabel}`}>
    {[0, .25, .5, .75, 1].map((t,i) => <line key={'grid'+i} x1={left} x2={width-right} y1={top+t*(height-top-bottom)} y2={top+t*(height-top-bottom)} stroke="currentColor" strokeOpacity=".12" />)}
    <line x1={left} x2={width-right} y1={zeroY} y2={zeroY} stroke="currentColor" strokeOpacity=".6" />
    <line x1={left} x2={left} y1={top} y2={height-bottom} stroke="currentColor" strokeOpacity=".5" />
    {horiz.map((h,i)=><g key={'line'+i}><line x1={left} x2={width-right} y1={yp(h.y)} y2={yp(h.y)} stroke={h.color || '#f4b970'} strokeDasharray="8 6" strokeWidth="1.6" />{h.label && <text x={width-right-6} y={yp(h.y)-5} textAnchor="end" fill={h.color||'#f4b970'} fontSize="12">{h.label}</text>}</g>)}
    <polyline points={points.map(p=>`${xp(p.x)},${yp(p.y)}`).join(' ')} fill="none" stroke="#65dbc1" strokeWidth="2.3" strokeLinejoin="round" />
    {points.map((p,i)=><circle key={i} cx={xp(p.x)} cy={yp(p.y)} r={p.highlight ? 3.8 : 2.6} fill={p.highlight ? '#ffa967':'#65dbc1'}><title>{`${xLabel}=${fmt(p.x)}, ${yLabel}=${fmt(p.y)}`}</title></circle>)}
    {labels && <><text x={width-right} y={height-6} textAnchor="end" fill="currentColor" fontSize="12">{xLabel}</text><text x="10" y="16" fill="currentColor" fontSize="12">{yLabel}</text><text x={left+2} y={height-8} fill="currentColor" fontSize="11">{fmt(Xmin)}</text><text x={width-right-16} y={height-8} fill="currentColor" fontSize="11">{fmt(Xmax)}</text></>}
  </svg>;
}
function EpsilonLab() {
  const [eps, setEps] = useState(.1);
  const [show, setShow] = useState(false);
  const bound = Math.floor(1 / eps + 1e-9), first = bound + 1;
  const points = useMemo(()=>Array.from({length:60},(_,i)=>({x:i+1,y:1/(i+1),highlight:i+1<first})),[first]);
  return <section className="m17-lab" aria-label="Wizualizacja epsilon i granica ciągu">
    <h3>Na żywo: ε dla ciągu 1/n</h3>
    <label htmlFor="m17-eps">Wybierz dokładność ε: <strong>{fmt(eps)}</strong></label>
    <input id="m17-eps" type="range" min="0.05" max="0.5" step="0.05" value={eps} onChange={e=>{setEps(Number(e.target.value));setShow(false);}} />
    <Plot points={points} horiz={[{y:eps,label:'ε'}, {y:0,label:'granica = 0',color:'#7b9cff'}]} />
    <p>Warunek <strong>1/n &lt; ε</strong> oznacza <strong>n &gt; {fmt(1/eps)}</strong>. Pierwszy numer spełniający warunek: <strong>n = {first}</strong>. Pomarańczowe punkty są jeszcze poza żądaną dokładnością.</p>
    <button className="m17-action" type="button" onClick={()=>setShow(v=>!v)} aria-expanded={show}>{show?'Ukryj':'Pokaż'} wyjaśnienie progu N</button>
    {show && <p className="m17-result">Możesz wybrać N = {bound}. W definicji badamy wszystkie <strong>n &gt; N</strong>, więc od numeru {first} jesteśmy już bliżej zera niż ε. Nie trzeba, żeby pierwszy wyraz ciągu był blisko zera.</p>}
  </section>;
}
const seqs = [
  {id:'inc',name:'aₙ = n',fn:n=>n,ex:'Rosnący: aₙ₊₁ − aₙ = 1 > 0.'},
  {id:'dec',name:'aₙ = 1/n',fn:n=>1/n,ex:'Malejący: gdy n rośnie, dodatni ułamek 1/n maleje.'},
  {id:'alt',name:'aₙ = (−1)ⁿ',fn:n=>n%2===0?1:-1,ex:'Niemonotoniczny: wartości skaczą między −1 a 1.'},
  {id:'const',name:'aₙ = 5',fn:()=>5,ex:'Stały: jest jednocześnie niemalejący i nierosnący, ale nie jest ściśle rosnący ani ściśle malejący.'},
];
function MonotonicityLab() {
  const [choice,setChoice]=useState('inc'); const [count,setCount]=useState(12); const [reveal,setReveal]=useState(false);
  const seq=seqs.find(v=>v.id===choice);
  const points=Array.from({length:count},(_,i)=>({x:i+1,y:seq.fn(i+1)}));
  return <section className="m17-lab"><h3>Przesuń liczbę wyrazów i sprawdź monotoniczność</h3>
    <label htmlFor="m17-series">Wybierz ciąg</label>
    <select id="m17-series" value={choice} onChange={e=>{setChoice(e.target.value);setReveal(false);}}>{seqs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
    <label htmlFor="m17-count">Pokaż pierwsze {count} wyrazów</label>
    <input id="m17-count" type="range" min="6" max="30" value={count} onChange={e=>setCount(Number(e.target.value))} />
    <Plot points={points} />
    <button className="m17-action" type="button" aria-expanded={reveal} onClick={()=>setReveal(x=>!x)}>{reveal?'Ukryj':'Sprawdź, czy ciąg jest rosnący lub malejący'}</button>
    {reveal && <p className="m17-result">{seq.ex}</p>}
  </section>;
}
function FunctionLab(){
 const [x,setX]=useState(1); const [tab,setTab]=useState('composition'); const f=v=>2*v+3, g=v=>v*v;
 const pts=Array.from({length:49},(_,i)=>{const xv=(i-24)/8;return {x:xv,y:tab==='composition'?f(g(xv)):f(xv)};});
 return <section className="m17-lab"><h3>Złożenie i odwrotność na konkretnych liczbach</h3>
  <div className="m17-tabs"><button type="button" className={tab==='composition'?'current':''} aria-pressed={tab==='composition'} onClick={()=>setTab('composition')}>Złożenie f(g(x))</button><button type="button" className={tab==='inverse'?'current':''} aria-pressed={tab==='inverse'} onClick={()=>setTab('inverse')}>Odwrotność f⁻¹</button></div>
  <label htmlFor="m17-x">Argument x = <strong>{fmt(x)}</strong></label><input id="m17-x" type="range" min="-3" max="3" step="0.25" value={x} onChange={e=>setX(Number(e.target.value))} />
  <Plot points={pts} horiz={[]} xLabel="x" yLabel={tab==='composition'?'f(g(x))':'f(x)'} />
  {tab==='composition'?<div className="m17-result"><strong>f(x)=2x+3, g(x)=x².</strong><p>Najpierw g({fmt(x)})={fmt(g(x))}; następnie f({fmt(g(x))})=2·{fmt(g(x))}+3={fmt(f(g(x)))}.</p><p>Uwaga: g(f({fmt(x)}))={fmt(g(f(x)))} — zwykle to inny wynik!</p></div>:<div className="m17-result"><strong>f(x)=2x+3, f⁻¹(y)=(y−3)/2.</strong><p>Najpierw f({fmt(x)})={fmt(f(x))}; potem f⁻¹({fmt(f(x))})=({fmt(f(x))}−3)/2={fmt((f(x)-3)/2)}.</p><p>Wykres pokazuje f(x). Dla odwrotności zamieniamy rolę osi x i y.</p></div>}
 </section>;
}
export default function MathIInteractive({mode='epsilon'}){if(mode==='epsilon')return <EpsilonLab/>;if(mode==='monotonic')return <MonotonicityLab/>;if(mode==='functions')return <FunctionLab/>;return null;}
