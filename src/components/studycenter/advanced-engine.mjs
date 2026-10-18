// StudyLab 5.2. All calculations run locally; no evaluator/network endpoint.
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const nonzero = (min, max) => { let n=0; while (!n) n=rand(min,max); return n; };
export const topics = [
 {id:'linear',title:'Równania liniowe',subject:'math1',prereq:[]},
 {id:'quadratic',title:'Równania kwadratowe',subject:'math1',prereq:['linear']},
 {id:'absolute',title:'Wartość bezwzględna',subject:'math2',prereq:['linear']},
 {id:'combinations',title:'Kombinatoryka',subject:'math2',prereq:[]},
 {id:'fractions',title:'Działania na ułamkach',subject:'math1',prereq:[]},
 {id:'circuits',title:'Obwody i prawo Ohma',subject:'electronics',prereq:[]},
 {id:'motion',title:'Ruch jednostajnie przyspieszony',subject:'physics',prereq:[]},
 {id:'binary',title:'Liczby binarne',subject:'ask',prereq:[]},
];
const step=(label,answer,formula,tip='')=>({label,answer,formula,tip});
export function createProblem(id){
 switch(id){
  case 'linear':{
   const a=nonzero(-6,6), x=rand(-9,9), b=rand(-12,12), c=a*x+b;
   return {id,question:`Rozwiąż równanie ${a}x ${b<0?'-':'+'} ${Math.abs(b)} = ${c}.`,steps:[
    step('Po przeniesieniu wyrazu wolnego: ile wynosi a·x?',c-b,`${a}x = ${c} - (${b})`,'Odejmij wyraz wolny od obu stron.'),
    step('Jaka jest wartość x?',x,`x = (${c-b}) / (${a})`,'Podziel obie strony przez współczynnik przy x.')],summary:`x = ${x}`};}
  case 'quadratic':{
   const a=rand(1,3), r1=rand(-5,0), r2=rand(1,6),b=-a*(r1+r2),c=a*r1*r2,delta=b*b-4*a*c;
   return {id,question:`Dla ${a}x² ${b<0?'-':'+'} ${Math.abs(b)}x ${c<0?'-':'+'} ${Math.abs(c)} = 0 oblicz wyróżnik i oba pierwiastki.`,steps:[
    step('Δ (delta)',delta,`Δ = b² − 4ac = (${b})² − 4·${a}·(${c})`,'Najpierw podnieś b do kwadratu, potem odejmij 4ac.'),
    step('Mniejszy pierwiastek x₁',r1,`x₁ = (−(${b}) − √${delta}) / (2·${a})`,'W pierwszym wzorze użyj znaku minus przed pierwiastkiem z delty.'),
    step('Większy pierwiastek x₂',r2,`x₂ = (−(${b}) + √${delta}) / (2·${a})`,'W drugim wzorze użyj znaku plus przed pierwiastkiem z delty.')],summary:`x₁=${r1}, x₂=${r2}`};}
  case 'absolute':{
   const a=rand(-6,6), r=rand(1,10);
   return {id,question:`Rozwiąż |x − (${a})| ≤ ${r}. Podaj oba końce przedziału.`,steps:[
    step('Lewy koniec przedziału',a-r,`x ≥ ${a} − ${r}`,'Lewy koniec to środek minus promień.'),
    step('Prawy koniec przedziału',a+r,`x ≤ ${a} + ${r}`,'Prawy koniec to środek plus promień.')],summary:`x ∈ [${a-r}, ${a+r}]`};}
  case 'combinations':{
   const n=rand(5,9),k=rand(2,Math.min(n-2,4));
   let combination=1;for(let i=1;i<=k;i++)combination=combination*(n-k+i)/i;
   const factorial=n=>Array.from({length:n},(_,i)=>i+1).reduce((a,b)=>a*b,1);
   return {id,question:`Ile jest sposobów wybrania ${k} elementów z ${n} bez uwzględniania kolejności?`,steps:[
    step(`Wartość ${k}!`,factorial(k),`${k}! = 1·2·…·${k}`,'Silnia oznacza iloczyn kolejnych liczb od 1.'),
    step(`Wartość (${n}−${k})!`,factorial(n-k),`${n-k}!`,'Oblicz silnię n−k.'),
    step('Liczba kombinacji',Math.round(combination),`C(${n},${k}) = ${n}! / (${k}!·${n-k}!)`,'Kolejność wybranych elementów nie ma znaczenia.')],summary:`C(${n},${k}) = ${Math.round(combination)}`};}
  case 'fractions':{
   const p=rand(1,7),q=rand(2,8),r=rand(1,7),s=rand(2,8),num=p*s+r*q,den=q*s;
   const gcd=(a,b)=>b?gcd(b,a%b):a;const g=gcd(num,den);
   return {id,question:`Dodaj ułamki ${p}/${q} + ${r}/${s}. Użyj wspólnego mianownika q·s.`,steps:[
    step('Wspólny mianownik',den,`${q}·${s}`,'Pomnóż oba mianowniki.'),
    step('Nowy licznik',num,`${p}·${s} + ${r}·${q}`,'Każdy licznik pomnóż przez drugi mianownik.'),
    step('Licznik po skróceniu',num/g,`NWD(${num},${den}) = ${g}`,`Skróć licznik i mianownik przez ${g}.`),
    step('Mianownik po skróceniu',den/g,`${den} / ${g}`,'Skróć mianownik przez ten sam dzielnik.')],summary:`${p}/${q} + ${r}/${s} = ${num/g}/${den/g}`};}
  case 'circuits':{
   const r1=rand(2,10),r2=rand(2,10),u=rand(2,8)*(r1+r2),rt=r1+r2,i=u/rt;
   return {id,question:`Rezystory ${r1} Ω i ${r2} Ω połączono szeregowo; napięcie U=${u} V.`,steps:[
    step('Opór zastępczy R [Ω]',rt,`R = ${r1} + ${r2}`,'Przy połączeniu szeregowym opory się sumują.'),
    step('Natężenie prądu I [A]',i,`I = U/R = ${u}/${rt}`,'Użyj prawa Ohma.'),
    step('Moc całkowita P [W]',u*i,`P = U·I = ${u}·${i}`,'Moc to iloczyn napięcia i natężenia.')],summary:`R=${rt} Ω, I=${i} A, P=${u*i} W`};}
  case 'motion':{
   const v0=rand(0,8), a=rand(1,5), t=rand(2,8);
   return {id,question:`Ciało: v₀=${v0} m/s, a=${a} m/s², t=${t} s. Wyznacz prędkość końcową i drogę.`,steps:[
    step('Przyrost prędkości Δv [m/s]',a*t,`Δv = a·t = ${a}·${t}`,'Pomnóż przyspieszenie przez czas.'),
    step('Prędkość końcowa v [m/s]',v0+a*t,`v = v₀ + a·t = ${v0} + ${a*t}`,'Dodaj prędkość początkową.'),
    step('Droga s [m]',v0*t+a*t*t/2,`s = v₀·t + a·t²/2 = ${v0}·${t} + ${a}·${t}²/2`,'Pierwszy składnik: v₀t. Drugi: at²/2.')],summary:`v=${v0+a*t} m/s, s=${v0*t+a*t*t/2} m`};}
  case 'binary':{
   const n=rand(5,255),bits=n.toString(2), ones=bits.split('1').length-1;
   return {id,question:`Liczba ${bits}₂: zamień na system dziesiętny i podaj liczbę jedynek.`,steps:[
    step('Wartość dziesiętna',n,`Wagi kolejnych bitów od prawej to 1, 2, 4, 8…`,'Dodaj wagi miejsc, na których znajduje się 1.'),
    step('Liczba jedynek w zapisie binarnym',ones,`${bits}`,'Policz cyfry 1.')],summary:`${bits}₂ = ${n}₁₀, liczba jedynek: ${ones}`};}
  default:throw new Error(`Unknown exercise type: ${id}`);
 }
}
export function parseNumeric(input){
 if(typeof input!=='string') return null;
 const value=input.trim().replace(',', '.').replace(/\s/g,'');
 // Accept decimal numbers and basic division, without eval.
 const match=value.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\/([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?$/);
 if(!match)return null;
 const a=Number(match[1]);const b=match[2]===undefined?1:Number(match[2]);
 return Number.isFinite(a)&&Number.isFinite(b)&&b!==0?a/b:null;
}
export function checkNumeric(input,expected){
 const actual=parseNumeric(input);if(actual===null)return {valid:false,ok:false,message:'Wpisz liczbę, np. 4, -2,5 lub 3/4.'};
 const ok=Math.abs(actual-expected)<=1e-7*Math.max(1,Math.abs(expected));
 return {valid:true,ok,actual,message:ok?'Poprawnie!':'To nie jest poprawna wartość. Sprawdź wzór i obliczenia.'};
}
export function analyzeCpp(src,taskName){
 const lines=src.split(/\r?\n/),issues=[];
 if(!src.trim())return [{severity:'info',line:0,message:'Wpisz kod funkcji, aby uruchomić analizę.'}];
 // Strip comments and string literals while preserving line breaks.
 const clean=src.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).replace(/\/\/[^\n]*/g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'""');
 const stack=[],open={'(':')','[':']','{':'}'},close={')':'(',']':'[','}':'{'};
 for(let i=0,line=1;i<clean.length;i++){
  const ch=clean[i];if(ch==='\n'){line++;continue;}
  if(open[ch])stack.push({ch,line});
  if(close[ch]){const top=stack.pop();if(!top||top.ch!==close[ch]){issues.push({severity:'error',line,message:`Niedopasowany nawias ${ch}.`});break}}
 }
 for(const it of stack)issues.push({severity:'error',line:it.line,message:`Brak zamykającego nawiasu dla ${it.ch}.`});
 if(/\bif\s*\([^\n]*[^=!<>]=[^=][^\n]*\)/.test(clean))issues.push({severity:'warn',line:0,message:'Sprawdź, czy wewnątrz if nie użyłeś = zamiast ==.'});
 const taskNames={sum:'suma',even:'czyParzysta',max:'maksimum',factorial:'silnia'};
 if(taskNames[taskName]&&!new RegExp(`\\b${taskNames[taskName]}\\s*\\(`).test(clean))issues.push({severity:'warn',line:0,message:`Nie znaleziono funkcji ${taskNames[taskName]}(...).`});
 if(!/\breturn\b/.test(clean))issues.push({severity:'warn',line:0,message:'Nie znaleziono instrukcji return; funkcja z typem int lub bool musi zwrócić wartość.'});
 const body=clean.split('\n');
 body.forEach((l,index)=>{
  const x=l.trim();
  if(!x||x.startsWith('#')||x.startsWith('//')||/[;{}:]\s*$/.test(x)||/^(if|for|while|else|switch)\b/.test(x))return;
  if(/\b(return|int|bool|long|auto)\b/.test(x)&&!/[{;}]/.test(x))issues.push({severity:'warn',line:index+1,message:'Możliwy brak średnika na końcu instrukcji.'});
 });
 if(/\bfor\s*\(/.test(clean)&&!/(\+\+|--|\+=|-=)/.test(clean))issues.push({severity:'info',line:0,message:'Sprawdź, czy zmienna sterująca pętlą jest aktualizowana.'});
 if(issues.length===0)issues.push({severity:'info',line:0,message:'Nie wykryto typowych błędów składniowych. To NIE oznacza, że program się kompiluje ani poprawnie działa.'});
 return issues;
}
export function logicOutput(gate,p,q){
 switch(gate){case 'AND':return Number(p&&q);case 'OR':return Number(p||q);case 'XOR':return Number(!!p!==!!q);case 'NAND':return Number(!(p&&q));case 'NOR':return Number(!(p||q));case 'IMPL':return Number(!p||q);default:throw new Error('Unknown gate');}
}
export function rcVoltage(u,t,r,cMicro){
 if(r<=0||cMicro<=0||t<0) return null;
 return u*(1-Math.exp(-t/(r*cMicro*1e-6)));
}
export function parallelResistance(r1,r2){if(r1<=0||r2<=0)return null;return (r1*r2)/(r1+r2)}
