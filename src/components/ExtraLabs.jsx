import React, { useMemo, useState } from 'react';

function Panel({title,desc,children,tag}) { return <section className="not-content lab newlab" aria-label={title}><header className="lab__head"><span className="lab__eyebrow"><span className="lab__live"/> {tag || 'LABORATORIUM / LIVE'}</span><h3>{title}</h3><p>{desc}</p></header><div className="lab__body">{children}</div></section>; }
function Stat({name,value}) { return <div className="lab__stat"><span>{name}</span><strong>{value}</strong></div>; }
export function BinaryLab() {
 const [value,setValue]=useState(13); const bits=Array.from({length:8},(_,i)=>(value >>> (7-i))&1);
 return <Panel title="Laboratorium systemu binarnego" desc="Przełącz poszczególne bity liczby od 0 do 255." tag="SIM / 08 · BITY">
  <div className="lab__stats"><Stat name="Wartość dziesiętna" value={value}/><Stat name="Zapis dwójkowy" value={value.toString(2).padStart(8,'0')}/><Stat name="Zapis szesnastkowy" value={'0x'+value.toString(16).toUpperCase().padStart(2,'0')}/></div>
  <div className="binary-grid">{bits.map((bit,i)=><button type="button" key={i} aria-label={`Bit o wadze ${2**(7-i)}: ${bit}; kliknij aby przełączyć`} aria-pressed={!!bit} onClick={()=>setValue(v=>v^(1<<(7-i)))} className={'binary-bit'+(bit?' active':'')}><small>2^{7-i}</small><strong>{bit}</strong><span>{2**(7-i)}</span></button>)}</div>
  <p className="lab__notice" aria-live="polite">Suma wag włączonych bitów: {bits.map((b,i)=>b?2**(7-i):0).filter(Boolean).join(' + ') || '0'} = <strong>{value}</strong>.</p>
  <div className="lab__controls"><button type="button" className="lab__button" onClick={()=>setValue(0)}>Wyzeruj</button><button type="button" className="lab__button lab__button--primary" onClick={()=>setValue(255)}>Włącz wszystkie</button></div>
 </Panel>;
}
export function PowerLab() {
 const [base,setBase]=useState(2),[exp,setExp]=useState(4),[step,setStep]=useState(0);
 const n=Math.abs(exp), factor=exp<0? 1/base:base; const invalid=base===0&&exp<=0;const current=invalid?'—':Math.pow(factor,step);
 return <Panel title="Potęga xⁿ bez std::pow" desc="Wybierz podstawę i wykładnik, następnie wykonuj pojedyncze mnożenia." tag="SIM / 09 · POTĘGOWANIE">
  <div className="lab__fields"><label>Podstawa x<select className="lab__input" value={base} onChange={e=>{setBase(Number(e.target.value));setStep(0);}}>{[-3,-2,-1,0,1,2,3,4].map(v=><option key={v}>{v}</option>)}</select></label><label>Wykładnik n<select className="lab__input" value={exp} onChange={e=>{setExp(Number(e.target.value));setStep(0);}}>{[-4,-3,-2,-1,0,1,2,3,4,5].map(v=><option key={v}>{v}</option>)}</select></label></div>
  {invalid?<div className="lab__notice lab__notice--error">Nie można w tym modelu obliczać 0 do potęgi zerowej lub ujemnej.</div>:<><div className="lab__stats"><Stat name="Iteracja" value={`${step} / ${n}`}/><Stat name="Aktualny iloczyn" value={current}/><Stat name="Oczekiwany wynik" value={Math.pow(base,exp)}/></div><p className="lab__notice" aria-live="polite">{step===0?'Na początku wynik = 1.':`Po ${step} mnożeniach przez ${exp<0?'1/'+base:base} wynik wynosi ${current}.`}{step===n?' Koniec algorytmu.':''}</p><div className="lab__controls"><button type="button" className="lab__button" onClick={()=>setStep(0)}>Reset</button><button type="button" className="lab__button" disabled={!step} onClick={()=>setStep(s=>s-1)}>Wstecz</button><button type="button" className="lab__button lab__button--primary" disabled={step>=n} onClick={()=>setStep(s=>s+1)}>Następny krok →</button></div></>}
 </Panel>;
}
export function CaesarLab() {
 const [word,setWord]=useState('kotek'),[shift,setShift]=useState(3); const okay=/^[a-z ]{0,25}$/.test(word);
 const encoded=useMemo(()=>[...word].map(ch=>ch===' '?ch:String.fromCharCode(97+((ch.charCodeAt(0)-97+shift%26+26)%26))).join(''),[word,shift]);
 return <Panel title="Szyfr Cezara w akcji" desc="Przesuwaj alfabet i porównuj literę oryginalną z nową." tag="SIM / 10 · TEKST">
  <label className="lab__label">Tekst (małe litery a–z i spacje)<input className="lab__input" value={word} onChange={e=>setWord(e.target.value)}/></label>
  <label className="lab__label">Przesunięcie: {shift}<input className="lab__range" type="range" min="-13" max="13" value={shift} onChange={e=>setShift(Number(e.target.value))}/></label>
  {!okay?<div className="lab__notice lab__notice--error">W demonstracji używamy tylko ASCII: a–z, spacja, maksymalnie 25 znaków.</div>:<><div className="lab__stats"><Stat name="Tekst oryginalny" value={word||'—'}/><Stat name="Po zaszyfrowaniu" value={encoded||'—'}/></div><div className="cipher-rows">{[...word].map((ch,i)=><div key={i}><span>{ch===' '?'␣':ch}</span><small>↓</small><strong>{encoded[i]===' '?'␣':encoded[i]}</strong></div>)}</div></>}
 </Panel>;
}
export function SearchLab() {
 const [text,setText]=useState('Ala ma kota'),[query,setQuery]=useState('kot');
 const index=query?text.indexOf(query):-1;
 return <Panel title="std::string::find — znajdź fragment" desc="Zobacz indeks pierwszego znalezionego fragmentu i wartość npos." tag="SIM / 11 · WYSZUKIWANIE">
  <div className="lab__fields"><label>Tekst<input className="lab__input" maxLength={80} value={text} onChange={e=>setText(e.target.value)}/></label><label>Fragment<input className="lab__input" maxLength={30} value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  <div className="lab__stats"><Stat name="Zwrócona pozycja" value={index>=0?index:'npos'}/><Stat name="Długość napisu" value={text.length}/></div><div className="search-display">{index>=0?<><span>{text.slice(0,index)}</span><mark>{text.slice(index,index+query.length)}</mark><span>{text.slice(index+query.length)}</span></>:<span>{text||'Pusty tekst'}</span>}</div>
  <div className="lab__notice">{index>=0?`Znaleziono pierwszy raz od indeksu ${index}. Indeksowanie zaczyna się od 0.`:'Brak dopasowania (lub pusty szukany fragment). W kodzie porównaj wynik z std::string::npos.'}</div>
  <p className="lab__hint">Symulator pracuje na znakach JS i najlepiej ilustruje proste ASCII. W C++ std::string::find zwraca pozycję bajtową w kodowaniu UTF-8.</p>
 </Panel>;
}
