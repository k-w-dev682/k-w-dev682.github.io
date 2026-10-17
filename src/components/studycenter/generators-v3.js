// Nowe proceduralne warianty v3. Wynik jest obliczany deterministycznie.
// Nie są to odpowiedzi ani zadania tworzone przez AI podczas korzystania ze strony.
import {GENERATOR_COUNT, generateTask as generateV2,checkTaskAnswer,parseAnswer,taskTopicsFor} from './generators.js';
export {GENERATOR_COUNT,checkTaskAnswer,parseAnswer,taskTopicsFor};
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const choice=a=>a[rnd(0,a.length-1)];
const create=(key,subject,topic,title,prompt,expected,unit,solution,hints,lesson,kind='number',tolerance=1e-4)=>({
 id:`task:${key}:${Math.random().toString(36).slice(2,10)}`,key,subject,topic,title,prompt,expected,unit,solution,hints,lesson,kind,tolerance,
 displayAnswer:`${kind==='number'?String(Number(Number(expected).toFixed(6))).replace('.',','):expected}${unit?' '+unit:''}`
});
export const EXTRA_GENERATORS=[
 {key:'v3-cpp-array',subject:'cpp',topic:'flow',create:()=>{
  const n=rnd(3,14),start=rnd(0,5),step=rnd(1,4);const answer=n*start+step*n*(n-1)/2;
  return create('v3-cpp-array','cpp','flow','Suma z pętli',`int s=0; for(int i=0;i<${n};i++) s+=${start}+i*${step}; Jaka będzie wartość s?`,answer,'',`Suma ${n} składników ciągu arytmetycznego: ${n}·${start} + ${step}·${n}·(${n}-1)/2 = ${answer}.`,['Zapisz kolejne wartości dodawane do s.','To ciąg arytmetyczny o stałym przyroście.','Zsumuj n wyrazów przez wzór na ciąg arytmetyczny.'],'petla-for');
 }},
 {key:'v3-cpp-mod',subject:'cpp',topic:'data',create:()=>{
  const a=rnd(18,140),b=rnd(3,12),ans=a%b;
  return create('v3-cpp-mod','cpp','data','Reszta z dzielenia',`Co wypisze std::cout << ${a} % ${b}; ?`,ans,'',`${a}=${Math.floor(a/b)}·${b}+${ans}, więc reszta z dzielenia to ${ans}.`,['Operator % daje resztę dla operandów całkowitych.','Podziel pierwszą liczbę całkowicie przez drugą.','Odejmij największą nieprzekraczającą wielokrotność dzielnika.'],'operatory-warunki');
 }},
 {key:'v3-m1-logic',subject:'math1',topic:'logic',create:()=>{
  const p=rnd(0,1),q=rnd(0,1),r=rnd(0,1),ans=Number(Boolean((p&&q)||!r));
  return create('v3-m1-logic','math1','logic','Spójniki — trzy zmienne',`Wyznacz wartość (p ∧ q) ∨ ¬r dla p=${p}, q=${q}, r=${r}.`,ans,'',`p ∧ q=${p&&q?1:0}, ¬r=${r?0:1}; alternatywa ma wartość ${ans}.`,['Najpierw oblicz negację r.','Oblicz część w nawiasie.','Połącz oba wyniki alternatywą.'],'tabele-prawdy');
 }},
 {key:'v3-m1-domain',subject:'math1',topic:'functions',create:()=>{
  const a=rnd(-8,8),b=rnd(1,9);const ans=a+b;
  return create('v3-m1-domain','math1','functions','Pierwiastek i przesunięcie',`Dla f(x)=√(x−(${a+b})) wyznacz najmniejszy dopuszczalny x.`,ans,'',`Warunek x−(${ans})≥0 oznacza x≥${ans}.`,['Radikand pierwiastka kwadratowego musi być nieujemny.','Zapisz nierówność.','Wyizoluj x.'],'dziedzina-zasady');
 }},
 {key:'v3-m2-variation',subject:'math2',topic:'combinatorics',create:()=>{
  const n=rnd(4,9),k=choice([2,3]);let ans=1;for(let j=0;j<k;j++)ans*=n-j;
  return create('v3-m2-variation','math2','combinatorics','Wariacje bez powtórzeń',`Na ile sposobów można wybrać i ustawić w kolejności ${k} różne elementy spośród ${n}?`,ans,'',`V(${n},${k})=${Array.from({length:k},(_,i)=>n-i).join('·')}=${ans}. Kolejność jest ważna.`,['Wybór kolejności ma znaczenie.','Na pierwsze miejsce masz n możliwości.','Na następnych miejscach liczba opcji maleje o jeden.'],'regula-mnozenia');
 }},
 {key:'v3-ask-hex',subject:'ask',topic:'bases',create:()=>{
  const n=rnd(32,255),hex=n.toString(16).toUpperCase();
  return create('v3-ask-hex','ask','bases','Zapis szesnastkowy',`Zamień ${n}₁₀ na zapis szesnastkowy. Podaj cyfry bez 0x.`,hex,'',`${n}₁₀ = ${hex}₁₆; dziel przez 16, a reszty czytaj od końca.`,['Zastosuj dzielenie przez 16.','Cyfry 10–15 zapisuje się A–F.','Zapisz reszty od końca.'],'szesnastkowy','hex');
 }},
 {key:'v3-ask-u2-read',subject:'ask',topic:'signed',create:()=>{
  const n=rnd(-125,-1),bin=(256+n).toString(2).padStart(8,'0');
  return create('v3-ask-u2-read','ask','signed','Odczyt U2',`Zapis 8-bitowy U2: ${bin}. Jaka to liczba dziesiętna?`,n,'',`Najstarszy bit jest 1, więc liczba jest ujemna: ${parseInt(bin,2)}−256=${n}.`,['To liczba ze znakiem na 8 bitach.','Najstarszy bit ma wagę −128.','Zsumuj pozostałe wagi dodatnie.'],'u2');
 }},
 {key:'v3-phy-force',subject:'physics',topic:'forces',create:()=>{
  const f1=rnd(15,90),f2=rnd(5,14),m=rnd(2,10),ans=(f1-f2)/m;
  return Object.assign(create('v3-phy-force','physics','forces','Wypadkowa siła i tarcie',`Na ciało ${m} kg działa siła ${f1} N w prawo i tarcie ${f2} N w lewo. Oblicz przyspieszenie w m/s² (kierunek w prawo).`,ans,'m/s²',`F_wyp=${f1}−${f2}=${f1-f2} N, więc a=F_wyp/m=(${f1-f2})/${m}=${Number(ans.toFixed(6))} m/s².`,['Narysuj obie siły z kierunkami.','Siły przeciwne odejmujemy.','Drugą zasadę Newtona przekształć do a=F/m.'],'druga-zasada'),{steps:[{label:'Oblicz siłę wypadkową (N)',expected:f1-f2,explanation:`F_wyp=${f1}−${f2}=${f1-f2} N`,unit:'N'}]});
 }},
 {key:'v3-phy-kinetic',subject:'physics',topic:'motion',create:()=>{
  const v0=rnd(1,12),t=rnd(2,14),a=rnd(1,6),ans=v0*t+a*t*t/2;
  return Object.assign(create('v3-phy-kinetic','physics','motion','Droga w ruchu przyspieszonym',`Prędkość początkowa ${v0} m/s, stałe przyspieszenie ${a} m/s², czas ${t} s. Jaka droga od startu?`,ans,'m',`s=v₀t+(at²)/2=${v0}·${t}+${a}·${t}²/2=${ans} m.`,['Potrzebujesz prędkości początkowej i przyspieszenia.','Przyspieszenie jest stałe.','Suma dwóch członów: liniowego i kwadratowego w czasie.'],'ruch-przyspieszony'),{steps:[{label:'Oblicz część v₀·t (m)',expected:v0*t,explanation:`v₀·t=${v0}·${t}=${v0*t} m`,unit:'m'},{label:'Oblicz część a·t²/2 (m)',expected:a*t*t/2,explanation:`a·t²/2=${a}·${t}²/2=${a*t*t/2} m`,unit:'m'}]});
 }},
 {key:'v3-ele-energy',subject:'electronics',topic:'cap',create:()=>{
  const c=rnd(1,30),u=rnd(2,25),ans=c*u*u/2;
  return Object.assign(create('v3-ele-energy','electronics','cap','Energia kondensatora',`Kondensator ${c} µF pod napięciem ${u} V. Oblicz energię w µJ.`,ans,'µJ',`E=CU²/2=${c}·${u}²/2=${ans} µJ (bo µF·V²=µJ).`,['Wzór energii zawiera kwadrat napięcia.','Użyj E=CU²/2.','µF·V² to µJ.'],'energia-kondensatora'),{steps:[{label:'Oblicz U² (V²)',expected:u*u,explanation:`U²=${u}²=${u*u} V²`,unit:'V²'}]});
 }},
];
export function generateTask(subject='all',topic='all',previousKey=null){
 const possible=EXTRA_GENERATORS.filter(e=>(subject==='all'||e.subject===subject)&&(topic==='all'||e.topic===topic));
 const alternate=possible.filter(e=>e.key!==previousKey);
 if(possible.length && Math.random()<0.45 && alternate.length)return choice(alternate).create();
 return generateV2(subject,topic,previousKey);
}
