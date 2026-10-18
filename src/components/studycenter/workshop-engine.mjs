// StudyLab Warsztat 7.0 — czyste funkcje (testowalne w Node, bez usług płatnych).
export const WORKSHOP_KEY = 'studylab.workshop.v1';
export const emptyWorkshop = () => ({version:1,annotations:[],drafts:[],diagnoses:{},stepSessions:[],settings:{focus:false}});
const str=(v,n=2000)=>String(v??'').slice(0,n);
const iso=t=>Number.isFinite(Number(t))&&Number(t)>0?Number(t):Date.now();
export function validateWorkshop(v){
 const d=emptyWorkshop();if(!v||typeof v!=='object'||v.version!==1)return d;
 const arr=(x,n)=>Array.isArray(x)?x.filter(y=>y&&typeof y==='object').slice(-n):[];
 d.annotations=arr(v.annotations,1000).map(a=>({id:str(a.id,90),lesson:str(a.lesson,180),quote:str(a.quote,750),note:str(a.note,1500),color:['mint','gold','violet'].includes(a.color)?a.color:'mint',date:iso(a.date)})).filter(x=>x.id&&x.lesson&&(x.quote||x.note));
 d.drafts=arr(v.drafts,250).map(a=>({id:str(a.id,90),subject:str(a.subject,30),title:str(a.title,120),source:str(a.source,180),body:str(a.body,12000),status:a.status==='approved'?'approved':'draft',date:iso(a.date)})).filter(x=>x.id&&x.body);
 d.diagnoses=Object.fromEntries(Object.entries(v.diagnoses&&typeof v.diagnoses==='object'&&!Array.isArray(v.diagnoses)?v.diagnoses:{}).slice(-1000).map(([k,x])=>[str(k,150),{reason:str(x?.reason,80),comment:str(x?.comment,350)}]));
 d.stepSessions=arr(v.stepSessions,1000).map(x=>({id:str(x.id,100),subject:str(x.subject,40),topic:str(x.topic,70),ok:!!x.ok,date:iso(x.date),hints:Math.max(0,Math.min(5,Number(x.hints)||0))}));
 d.settings={focus:!!v.settings?.focus};return d;
}
export function readWorkshop(){if(typeof window==='undefined')return emptyWorkshop();try{return validateWorkshop(JSON.parse(localStorage.getItem(WORKSHOP_KEY)))}catch{return emptyWorkshop()}}
export function writeWorkshop(data){if(typeof window==='undefined')return false;try{localStorage.setItem(WORKSHOP_KEY,JSON.stringify(validateWorkshop(data)));window.dispatchEvent(new CustomEvent('studylab:workshop-update'));return true}catch{return false}}
export function topicProgress(attempts,subject,topic){const a=attempts.filter(x=>x.subject===subject&&x.topic===topic);const recent=a.slice(-12),good=recent.filter(x=>x.ok).length;
 return {count:a.length,accuracy:recent.length?Math.round(100*good/recent.length):null,confidence:Math.min(1,a.length/8),score:recent.length?Math.round((good/recent.length)*Math.min(1,recent.length/8)*100):0};
}
export function numericAnswer(input,wanted){const cleaned=String(input??'').trim().replace(',','.');if(!/^[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?$/i.test(cleaned))return {valid:false,ok:false};const value=Number(cleaned);return {valid:Number.isFinite(value),ok:Number.isFinite(value)&&Math.abs(value-wanted)<=1e-4*Math.max(1,Math.abs(wanted))};}
export function createGuidedProblem(kind,random=Math.random,difficulty='standard'){const pick=(a,b)=>a+Math.floor(random()*(b-a+1));const easy=difficulty==='easy',hard=difficulty==='hard';const id=`guided-${Date.now()}-${Math.floor(random()*100000)}`;
 if(kind==='linear'){const x=pick(easy?0:hard?-20:-7,easy?9:hard?20:9),a=pick(easy?1:hard?7:2,easy?5:hard?18:8),b=pick(easy?0:hard?-40:-10,easy?8:hard?50:12),c=a*x+b;return {id,subject:'math1',topic:'functions',title:'Równanie liniowe',question:`Rozwiąż równanie ${a}x ${b<0?'−':'+'} ${Math.abs(b)} = ${c}`,steps:[{label:'Odejmij wyraz wolny',question:`Ile wynosi ${c} − (${b})?`,formula:`${a}x = ${c} − (${b})`,meaning:'Przenosimy wyraz wolny na prawą stronę.',answer:c-b},{label:'Podziel przez współczynnik',question:`Ile wynosi (${c-b}) / ${a}?`,formula:`x = (${c-b}) / ${a}`,meaning:'Dzielimy obie strony przez liczbę stojącą przy x.',answer:x}]};}
 if(kind==='motion'){const v=pick(easy?2:hard?14:2,easy?9:hard?36:18),t=pick(easy?2:hard?12:3,easy?8:hard?65:15);return {id,subject:'physics',topic:'motion',title:'Droga w ruchu jednostajnym',question:`Prędkość v = ${v} m/s, czas t = ${t} s. Oblicz drogę.`,steps:[{label:'Wybór wzoru',question:`Podaj wynik mnożenia ${v} · ${t}`,formula:'s = v · t',meaning:'s — droga [m], v — prędkość [m/s], t — czas [s]. Podstawiamy dane: s = '+v+' · '+t+'.',answer:v*t}]};}
 if(kind==='ohm'){const i=pick(easy?1:hard?11:2,easy?8:hard?35:12)/10,r=pick(easy?2:hard?10:2,easy?8:hard?35:16)*10;return {id,subject:'electronics',topic:'potential',title:'Prawo Ohma',question:`Przez opornik R = ${r} Ω płynie prąd I = ${i.toFixed(1)} A. Oblicz napięcie.`,steps:[{label:'Podstaw dane',question:`Oblicz ${r} · ${i.toFixed(1)}`,formula:'U = R · I',meaning:`U — napięcie [V], R — opór [Ω], I — prąd [A]. U = ${r} Ω · ${i.toFixed(1)} A.`,answer:r*i}]};}
 if(kind==='binary'){const n=pick(easy?2:hard?128:4,easy?7:hard?255:15);return {id,subject:'ask',topic:'bases',title:'Liczby dwójkowe',question:`Zamień liczbę dziesiętną ${n} na binarną.`,steps:[{label:'Rozkład wag',question:`Wpisz wartość dziesiętną największej potęgi dwójki nieprzekraczającej ${n} (1,2,4,8).`,formula:'8, 4, 2, 1 — wagi bitów',meaning:'Najpierw znajdujemy największą wagę równą lub mniejszą od liczby.',answer:Math.pow(2,Math.floor(Math.log2(n)))},{label:'Zapis binarny',question:`Wpisz zapis ${n} w systemie binarnym jako liczbę cyfr (np. 1010).`,formula:`${n}₁₀ = ${n.toString(2)}₂`,meaning:'Każda cyfra jest bitem 0 albo 1; suma wag bitów równych 1 daje liczbę.',answer:Number(n.toString(2))}]};}
 const n=pick(easy?2:hard?13:3,easy?7:hard?29:12),k=pick(easy?2:hard?12:2,easy?5:hard?25:8);return {id,subject:'math2',topic:'combinatorics',title:'Reguła mnożenia',question:`Masz ${n} koszulek i ${k} par spodni. Ile różnych zestawów możesz stworzyć?`,steps:[{label:'Zastosuj regułę mnożenia',question:`Ile wynosi ${n} · ${k}?`,formula:'Liczba zestawów = liczba możliwości A · liczba możliwości B',meaning:`Każdą z ${n} koszulek można zestawić z ${k} parami spodni.`,answer:n*k}]};
}
export const GUIDED_KINDS=[['linear','Matematyka I · równania'],['combinatorics','Matematyka II · kombinatoryka'],['motion','Fizyka · kinematyka'],['ohm','Elektronika · prawo Ohma'],['binary','ASK · zapis dwójkowy']];
export const FORMULAS=[
 {id:'memory',subject:'cpp',name:'Pamięć tablicy',expression:'M = n · b',symbols:'M — łączna liczba bajtów, n — liczba elementów, b — liczba bajtów jednego elementu (np. sizeof(T))',vars:[['n','',20],['b','B',4]],calc:([n,b])=>Number.isInteger(n)&&Number.isInteger(b)&&n>=0&&b>=0?n*b:NaN,unit:'B',explain:'Wzór dla ciągłej tablicy elementów jednakowego typu, bez narzutu alokatora.'},
 {id:'u2',subject:'ask',name:'Maksimum n-bitowego U2',expression:'max = 2⁽ⁿ⁻¹⁾ − 1',symbols:'n — liczba bitów kodu U2; dodatnia wartość maksymalna wynosi 2^(n-1)-1',vars:[['n','bitów',8]],calc:([n])=>Number.isInteger(n)&&n>=2&&n<=32?2**(n-1)-1:NaN,unit:'',explain:'Minimum n-bitowego U2 wynosi -2^(n−1).'},
 {id:'ohm',subject:'electronics',name:'Prawo Ohma',expression:'U = R · I',symbols:'U — napięcie [V], R — opór [Ω], I — natężenie [A]',vars:[['R','Ω',100],['I','A',0.2]],calc:([r,i])=>r*i,unit:'V',explain:'Napięcie rośnie proporcjonalnie do oporu i prądu.'},
 {id:'density',subject:'physics',name:'Gęstość',expression:'ρ = m / V',symbols:'ρ — gęstość [kg/m³], m — masa [kg], V — objętość [m³]',vars:[['m','kg',2],['V','m³',0.001]],calc:([m,v])=>v>0?m/v:NaN,unit:'kg/m³',explain:'Objętość musi być większa od zera.'},
 {id:'speed',subject:'physics',name:'Droga',expression:'s = v · t',symbols:'s — droga [m], v — prędkość [m/s], t — czas [s]',vars:[['v','m/s',5],['t','s',12]],calc:([v,t])=>v*t,unit:'m',explain:'Dla ruchu jednostajnego droga to prędkość razy czas.'},
 {id:'force',subject:'physics',name:'II zasada Newtona',expression:'F = m · a',symbols:'F — siła [N], m — masa [kg], a — przyspieszenie [m/s²]',vars:[['m','kg',3],['a','m/s²',2]],calc:([m,a])=>m*a,unit:'N',explain:'Siła wypadkowa zależy od masy i przyspieszenia.'},
 {id:'power',subject:'electronics',name:'Moc elektryczna',expression:'P = U · I',symbols:'P — moc [W], U — napięcie [V], I — prąd [A]',vars:[['U','V',12],['I','A',0.5]],calc:([u,i])=>u*i,unit:'W',explain:'Dla przyjętego kierunku mocy odbieranej przez element.'},
 {id:'cap',subject:'electronics',name:'Ładunek kondensatora',expression:'Q = C · U',symbols:'Q — ładunek [C], C — pojemność [F], U — napięcie [V]',vars:[['C','F',0.000001],['U','V',12]],calc:([c,u])=>c*u,unit:'C',explain:'Pojemność w faradach, wynik w kulombach.'},
 {id:'combinations',subject:'math2',name:'Kombinacje bez powtórzeń',expression:'C(n,k) = n! / (k! (n−k)!)',symbols:'n — liczba elementów, k — wybierana liczba; 0 ≤ k ≤ n',vars:[['n','',5],['k','',2]],calc:([n,k])=>{if(!Number.isInteger(n)||!Number.isInteger(k)||n<0||k<0||k>n||n>50)return NaN;let out=1;for(let i=1;i<=k;i++)out=out*(n-i+1)/i;return Math.round(out)},unit:'',explain:'Kolejność wybieranych elementów nie ma znaczenia.'},
 {id:'average',subject:'math1',name:'Średnia arytmetyczna dwóch liczb',expression:'x̄ = (a + b) / 2',symbols:'a, b — dwie liczby; x̄ — ich średnia',vars:[['a','',4],['b','',10]],calc:([a,b])=>(a+b)/2,unit:'',explain:'Sumę dwóch liczb dzielimy przez ich liczbę.'}
];
export function formatNumber(x){return Number.isFinite(x)?Number(x.toPrecision(8)).toLocaleString('pl-PL',{maximumFractionDigits:8}):'Nieprawidłowe dane';}

export function formulaSubstitution(f,values){
 const n=values.map(x=>String(x).replace(',','.'));
 switch(f.id){
  case 'ohm':return `U = ${n[0]} Ω · ${n[1]} A`;
  case 'density':return `ρ = ${n[0]} kg / ${n[1]} m³`;
  case 'speed':return `s = ${n[0]} m/s · ${n[1]} s`;
  case 'force':return `F = ${n[0]} kg · ${n[1]} m/s²`;
  case 'power':return `P = ${n[0]} V · ${n[1]} A`;
  case 'cap':return `Q = ${n[0]} F · ${n[1]} V`;
  case 'combinations':return `C(${n[0]}, ${n[1]}) = ${n[0]}! / (${n[1]}! · (${n[0]} − ${n[1]})!)`;
  case 'average':return `x̄ = (${n[0]} + ${n[1]}) / 2`;
  case 'memory':return `M = ${n[0]} · ${n[1]} B`;
  case 'u2':return `max = 2^(${n[0]} − 1) − 1`;
  default:return n.join(' · ');
 }
}
