/* StudyLab 7.2 — interactive lesson helpers; uses validated, existing question bank. */
(()=>{
 'use strict';
 const current=document.currentScript;
 const base=new URL('.',new URL(current?.src||location.href,location.href)).pathname;
 const normalize=p=>decodeURI(p).replace(base,'').replace(/^\/+|\/+$/g,'');
 const glossary={
 math1:[['∈','należy do zbioru'],['∀','dla każdego'],['∃','istnieje'],['⇒','wynika z'],['ℝ','liczby rzeczywiste']],
 math2:[['∑','suma kolejnych składników'],['n!','silnia, iloczyn 1 · 2 · … · n'],['∩','część wspólna zbiorów'],['∪','suma zbiorów'],['C(n,k)','wybór k elementów z n bez kolejności']],
 physics:[['s','droga [m]'],['v','prędkość [m/s]'],['t','czas [s]'],['F','siła [N]'],['m','masa [kg]']],
 electronics:[['U','napięcie [V]'],['I','natężenie prądu [A]'],['R','rezystancja [Ω]'],['C','pojemność [F]'],['Q','ładunek [C]']],
 cpp:[['=','przypisanie wartości'],['==','porównanie równości'],['&&','logiczne I'],['||','logiczne LUB'],['++','zwiększ wartość o 1']],
 ask:[['bit','cyfra binarna 0 lub 1'],['KiB','1024 bajty'],['U2','kod uzupełnień do dwóch'],['ALU','jednostka arytmetyczno-logiczna']]
 };
 const examples={
 motion:['Droga w ruchu jednostajnym','s = v · t','s – droga [m], v – prędkość [m/s], t – czas [s]','Jeżeli v = 4 m/s i t = 5 s, to s = 4 · 5 = 20 m.'],
 forces:['Druga zasada Newtona','F = m · a','F – siła [N], m – masa [kg], a – przyspieszenie [m/s²]','Dla m = 3 kg i a = 2 m/s²: F = 3 · 2 = 6 N.'],
 potential:['Prawo Ohma','U = R · I','U – napięcie [V], R – opór [Ω], I – prąd [A]','Dla R = 10 Ω i I = 0,2 A: U = 10 · 0,2 = 2 V.'],
 combinatorics:['Reguła mnożenia','liczba wyborów = a · b','a i b – liczby możliwości niezależnych kolejnych wyborów','Dla 3 bluz i 4 par spodni: 3 · 4 = 12 zestawów.'],
 bases:['Zapis dwójkowy','1010₂ = 1·8 + 0·4 + 1·2 + 0·1','kolejne pozycje oznaczają potęgi 2','1010₂ = 8 + 2 = 10₁₀.']
 };
 function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
 const path=()=>normalize(location.pathname);
 async function init(){
  const main=document.querySelector('main .sl-markdown-content');const slug=path();
  if(!main||slug==='centrum-nauki'||main.querySelector('.scl72'))return;
  let info,questionData;
  try{const results=await Promise.all([fetch(base+'study-center-lesson-index.json'),fetch(base+'studylab-microchecks-72.json')]);if(results.some(x=>!x.ok))return;[info,questionData]=await Promise.all(results.map(x=>x.json()))}catch{return}
  const item=info?.lessons?.[slug];if(!item)return;
  const module=el('section','scl72');module.setAttribute('aria-label','Interaktywna powtórka lekcji');
  const top=el('div','scl72-heading');top.append(el('strong','', 'Sprawdź, czy rozumiesz ten temat'),el('small','', 'Krótki test po lekcji · wyjaśnienia po odpowiedzi'));
  module.append(top);
  const words=glossary[item.subject]||[];
  if(words.length){const details=el('details','scl72-glossary');const summary=el('summary','','Słowniczek symboli — rozwiń');details.append(summary);
   const dl=el('dl','');words.forEach(([symbol,meaning])=>{dl.append(el('dt','',symbol),el('dd','',meaning))});details.append(dl);module.append(details)}
  const ex=examples[item.topic];if(ex){const details=el('details','scl72-example');details.append(el('summary','','Wzór i podstawianie — przykład krok po kroku'));
   for(const [kind,s] of [['h4',ex[0]],['code',ex[1]],['p',ex[2]],['p',ex[3]]])details.append(el(kind,'',s));module.append(details)}
  const available=(questionData.questions||[]).filter(q=>q.subject===item.subject&&q.topic===item.topic);
  const exact=available.filter(q=>q.lesson===item.lesson),others=available.filter(q=>q.lesson!==item.lesson);
  const selected=[...exact,...others].slice(0,3);
  if(!selected.length){module.append(el('p','', 'Brak pytań z tego zakresu; wróć do Centrum nauki, aby wybrać inny temat.'));main.append(module);return}
  let pos=0,answered=0;
  const state=el('div','scl72-quiz');module.append(state);main.append(module);
  function show(){state.replaceChildren();const q=selected[pos];if(!q){state.append(el('strong','',`Koniec: ${answered}/${selected.length} poprawnych odpowiedzi.`));
   const link=el('a','scl72-button','Więcej ćwiczeń ↗');link.href=base+'centrum-nauki/?subject='+encodeURIComponent(item.subject)+'&topic='+encodeURIComponent(item.topic)+'&mode=adaptive#adaptive';state.append(link);return}
   state.append(el('small','',`Pytanie ${pos+1} z ${selected.length}`),el('h4','',q.stem));const area=el('div','scl72-options');state.append(area);
   const feedback=el('p','scl72-feedback');let locked=false;
   q.options.forEach((label,n)=>{const b=el('button','scl72-option',label);b.type='button';b.onclick=()=>{
      if(locked)return;locked=true;const ok=n===q.correct;answered+=Number(ok);feedback.textContent=(ok?'Poprawnie. ':'Poprawna odpowiedź: '+q.options[q.correct]+'. ')+q.why;feedback.classList.toggle('bad',!ok);
      Array.from(area.children).forEach((button,i)=>{button.disabled=true;if(i===q.correct)button.classList.add('correct');else if(i===n&&!ok)button.classList.add('incorrect')});
      try{const key='studylab.learning-center.v1',db=JSON.parse(localStorage.getItem(key)||'{"version":1,"attempts":[]}');if(db&&db.version===1&&Array.isArray(db.attempts)){
       db.attempts.push({id:q.id,subject:q.subject,topic:q.topic,question:q.stem,given:label,answer:q.options[q.correct],why:q.why,lesson:q.lesson||'',ok,mode:'microcheck',hints:0,date:Date.now()});db.attempts=db.attempts.slice(-5000);localStorage.setItem(key,JSON.stringify(db));
      }}catch{};
      next.hidden=false;
   };area.append(b)});
   const next=el('button','scl72-next','Dalej →');next.hidden=true;next.onclick=()=>{pos++;show()};state.append(feedback,next);
  }
  show();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 document.addEventListener('astro:page-load',init);
})();
