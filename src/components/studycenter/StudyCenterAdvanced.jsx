import React, {useState} from 'react';
import {topics,createProblem,checkNumeric,logicOutput,rcVoltage,parallelResistance} from './advanced-engine.mjs';
import './studycenter-advanced.css';

function Panel({title,sub,children}){return <section className="sca-panel"><h3>{title}</h3>{sub&&<p className="sca-muted">{sub}</p>}{children}</section>}
function Button({children,onClick,kind='main',disabled=false}){return <button type="button" className={`sca-button ${kind==='alt'?'sca-alt':''}`} disabled={disabled} onClick={onClick}>{children}</button>}
function MathSteps({onAttempt}){
 const [topic,setTopic]=useState('linear');
 const [problem,setProblem]=useState(null);
 const [stage,setStage]=useState(0);
 const [input,setInput]=useState('');
 const [response,setResponse]=useState(null);
 const [hint,setHint]=useState(false);
 const [wrongCount,setWrongCount]=useState(0);
 const [completed,setCompleted]=useState(false);
 const [history,setHistory]=useState([]);
 const currentTopic=topics.find(t=>t.id===topic)||topics[0];
 const [stats,setStats]=useState({solved:0,errors:0});
 function nextTask(selected=topic){
  setTopic(selected);setProblem(createProblem(selected));setStage(0);setInput('');setResponse(null);setHint(false);setWrongCount(0);setCompleted(false);setHistory([]);
 }
 function check(){
  if(!problem||completed)return;
  const now=problem.steps[stage], result=checkNumeric(input,now.answer);
  setResponse(result);if(!result.valid)return;
  const log={id:`adv-${problem.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,subject:currentTopic.subject,topic:`plus-${problem.id}`,question:`${problem.question} | Etap: ${now.label}`,given:input,answer:String(now.answer),why:now.formula,ok:result.ok,mode:'plus-step-trainer',hints:hint?1:0,date:Date.now()};
  if(typeof onAttempt==='function')onAttempt(log);
  if(!result.ok){setWrongCount(n=>n+1);setStats(s=>({...s,errors:s.errors+1}));return}
  setHistory(h=>[...h,{label:now.label,value:input,formula:now.formula}]);
  if(stage===problem.steps.length-1){setCompleted(true);setStats(s=>({...s,solved:s.solved+1}));}
  else{setStage(n=>n+1);setInput('');setHint(false);setResponse(null)}
 }
 return <Panel title="Trener matematyczny 2.0" sub="Każde rozwiązanie składa się z kilku obliczeń. StudyLab sprawdza każde z nich, zanim przejdziesz dalej. Ocena obejmuje wartości liczbowe, nie dowolne przekształcenia algebraiczne.">
  <div className="sca-stats"><span>Ukończone w tej sesji <b>{stats.solved}</b></span><span>Błędne próby <b>{stats.errors}</b></span></div>
  <div className="sca-row"><label>Temat<select value={topic} onChange={e=>{setTopic(e.target.value);setProblem(null);setResponse(null)}}>{topics.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></label><Button onClick={()=>nextTask()}>Wylosuj nowe zadanie</Button></div>
  {problem?<div className="sca-task">
   <div className="sca-question"><span>Zadanie</span><strong>{problem.question}</strong></div>
   <div className="sca-progress" aria-label={`Etap ${Math.min(stage+1,problem.steps.length)} z ${problem.steps.length}`}>
    {problem.steps.map((s,i)=><span key={i} className={i<stage||completed?'sca-done':i===stage?'sca-active':''} title={s.label}/>)}</div>
   {history.map((h,i)=><div key={i} className="sca-history"><span>✓ {h.label}:</span> <b>{h.value}</b><small>{h.formula}</small></div>)}
   {!completed?<>
    <div className="sca-current"><span>Krok {stage+1}/{problem.steps.length}</span><h4>{problem.steps[stage].label}</h4></div>
    <label>Twoje obliczenie<input type="text" inputMode="decimal" value={input} placeholder="np. -4, 2.5 lub 3/4" onChange={e=>{setInput(e.target.value);setResponse(null)}} onKeyDown={e=>{if(e.key==='Enter')check()}}/></label>
    <div className="sca-row"><Button onClick={check}>Sprawdź ten krok</Button><Button kind="alt" onClick={()=>setHint(true)}>Pokaż podpowiedź</Button></div>
    {hint&&<p className="sca-hint"><b>Wskazówka:</b> {problem.steps[stage].formula}. {problem.steps[stage].tip}</p>}
    {response&&<p className={response.ok?'sca-message sca-ok':'sca-message sca-error'} role="status">{response.message}</p>}
   </>:<div className="sca-finished" role="status"><h4>Ukończono zadanie!</h4><p>{problem.summary}</p><p>Niepoprawne próby: {wrongCount}. Wyniki etapów dodano do historii StudyLab.</p><Button onClick={()=>nextTask()}>Kolejne zadanie</Button></div>}
  </div>:<p className="sca-hint">Wybierz temat i kliknij „Wylosuj nowe zadanie”. Zadania mają zmienne dane, więc możesz ćwiczyć ten sam temat wielokrotnie.</p>}
 </Panel>
}
function Simulator(){
 const [type,setType]=useState('gates');
 const [gate,setGate]=useState('XOR');const [p,setP]=useState(false);const [q,setQ]=useState(true);
 const [r1,setR1]=useState(100),[r2,setR2]=useState(200),[u,setU]=useState(12),[connection,setConnection]=useState('parallel');
 const [rcU,setRcU]=useState(5),[rcR,setRcR]=useState(1000),[rcC,setRcC]=useState(1000),[rcT,setRcT]=useState(1);
 const [bits,setBits]=useState(42);
 const req=connection==='parallel'?parallelResistance(r1,r2):r1+r2;
 const current=u/req;const voltage=rcVoltage(rcU,rcT,rcR,rcC);
 return <Panel title="Symulatory 2.0" sub="Przesuwaj suwaki i obserwuj zależności. Obliczenia są wykonywane lokalnie w przeglądarce.">
  <div className="sca-row"><label>Symulacja<select value={type} onChange={e=>setType(e.target.value)}><option value="gates">Bramki logiczne + tablica prawdy</option><option value="resistors">Rezystory szeregowo i równolegle</option><option value="rc">Ładowanie kondensatora RC</option><option value="bits">Osiem bitów / systemy liczbowe</option></select></label></div>
  {type==='gates'&&<div className="sca-task"><div className="sca-row"><label>Bramka<select value={gate} onChange={e=>setGate(e.target.value)}>{['AND','OR','XOR','NAND','NOR','IMPL'].map(g=><option key={g}>{g}</option>)}</select></label><label><input type="checkbox" checked={p} onChange={e=>setP(e.target.checked)}/> p = {+p}</label><label><input type="checkbox" checked={q} onChange={e=>setQ(e.target.checked)}/> q = {+q}</label></div><div className="sca-value">Wynik: {logicOutput(gate,p,q)}</div><div className="sca-table"><table><thead><tr><th>p</th><th>q</th><th>{gate}</th></tr></thead><tbody>{[[0,0],[0,1],[1,0],[1,1]].map(([x,y])=><tr key={`${x}${y}`} className={Number(p)===x&&Number(q)===y?'sca-highlight':''}><td>{x}</td><td>{y}</td><td>{logicOutput(gate,!!x,!!y)}</td></tr>)}</tbody></table></div></div>}
  {type==='resistors'&&<div className="sca-task"><div className="sca-row"><label>Połączenie<select value={connection} onChange={e=>setConnection(e.target.value)}><option value="series">Szeregowe</option><option value="parallel">Równoległe</option></select></label></div><label>R₁ = {r1} Ω<input type="range" min="10" max="1000" step="10" value={r1} onChange={e=>setR1(+e.target.value)}/></label><label>R₂ = {r2} Ω<input type="range" min="10" max="1000" step="10" value={r2} onChange={e=>setR2(+e.target.value)}/></label><label>U = {u} V<input type="range" min="1" max="48" value={u} onChange={e=>setU(+e.target.value)}/></label><div className="sca-value">Rz = {req.toFixed(2)} Ω | I = {current.toFixed(3)} A | P = {(u*current).toFixed(2)} W</div><p className="sca-muted">{connection==='series'?'W połączeniu szeregowym Rz = R₁ + R₂.':'W połączeniu równoległym Rz = (R₁ · R₂)/(R₁ + R₂).'}</p></div>}
  {type==='rc'&&<div className="sca-task"><label>U źródła = {rcU} V<input type="range" min="1" max="24" value={rcU} onChange={e=>setRcU(+e.target.value)}/></label><label>Rezystancja = {rcR} Ω<input type="range" min="100" max="10000" step="100" value={rcR} onChange={e=>setRcR(+e.target.value)}/></label><label>Pojemność = {rcC} µF<input type="range" min="100" max="4700" step="100" value={rcC} onChange={e=>setRcC(+e.target.value)}/></label><label>Czas = {rcT.toFixed(1)} s<input type="range" min="0" max="20" step="0.1" value={rcT} onChange={e=>setRcT(+e.target.value)}/></label><div className="sca-value">U₍C₎ = {voltage.toFixed(3)} V | τ = {(rcR*rcC/1e6).toFixed(3)} s</div><div className="sca-meter"><div style={{width:`${Math.max(0,Math.min(100,voltage/rcU*100))}%`}}/></div><p className="sca-muted">Idealny obwód RC: U₍C₎(t) = U · (1 − e^(−t/RC)). Nie uwzględnia rezystancji wewnętrznej i tolerancji elementów.</p></div>}
  {type==='bits'&&<div className="sca-task"><p>Przełącz bity, aby zobaczyć ich wagę i wpływ na zapis liczby.</p><div className="sca-bits">{Array.from({length:8},(_,index)=>{const shift=7-index;const active=Boolean(bits&(1<<shift));return <button type="button" key={shift} className={active?'sca-bit sca-bit-on':'sca-bit'} aria-pressed={active} aria-label={`Bit ${shift}, waga ${2**shift}`} onClick={()=>setBits(n=>n^(1<<shift))}><small>{2**shift}</small><b>{Number(active)}</b></button>})}</div><div className="sca-value">{bits.toString(2).padStart(8,'0')}₂ = {bits}₁₀ = {bits.toString(16).toUpperCase().padStart(2,'0')}₁₆</div></div>}
 </Panel>
}
export default function StudyCenterAdvanced({kind='steps',onAttempt}){
 return <div className="sca-root">{kind==='steps'?<MathSteps onAttempt={onAttempt}/>:<Simulator/>}</div>;
}
