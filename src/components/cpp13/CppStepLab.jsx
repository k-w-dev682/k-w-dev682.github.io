import React, {useState} from 'react';
import {SCENARIOS} from './steps.js';
import './cpp13.css';
export default function CppStepLab({mode='loop'}) {
 const scene=SCENARIOS[mode] || SCENARIOS.loop;
 const [step,setStep]=useState(0);
 const [instruction,memory,why]=scene.steps[step];
 return <section className="cpp13-lab" aria-label={scene.title}>
  <header><span>STUDYLAB BLACK / KROK PO KROKU</span><h3>{scene.title}</h3><p>Przewidź zmianę, potem wybierz następny krok. To model konkretnego przykładu, nie kompilator C++.</p></header>
  <div className="cpp13-live" aria-live="polite" aria-atomic="true"><p>Krok {step+1} z {scene.steps.length}</p><pre><code>{instruction}</code></pre>
  <dl className="cpp13-memory">{Object.entries(memory).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
  <p>{why}</p></div>
  <div className="cpp13-controls"><button type="button" disabled={step===0} onClick={()=>setStep(s=>s-1)}>← Poprzedni</button><button type="button" disabled={step===scene.steps.length-1} onClick={()=>setStep(s=>s+1)}>Następny krok →</button><button type="button" onClick={()=>setStep(0)}>Od początku</button></div>
 </section>;
}
