// Proceduralne zadania rachunkowe: nowe dane przy każdym losowaniu, deterministyczne odpowiedzi.
const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const take = arr => arr[ri(0,arr.length-1)];
const fmt = (n,d=3) => String(Number(Number(n).toFixed(d))).replace('.',',');
const task = (key, subject, topic, title, prompt, expected, unit, solution, hints, lesson, kind='number', tolerance=0.0001) => ({
 id: `task:${key}:${Math.random().toString(36).slice(2,10)}`,
 key,subject,topic,title,prompt,expected,unit,solution,hints,lesson,kind,tolerance,
 displayAnswer: `${kind==='number'?fmt(expected,6):expected}${unit?' '+unit:''}`,
});
const TEMPLATES = [
 { key:'cpp-sum',subject:'cpp',topic:'basic',create:()=>{
   const a=ri(2,24),b=ri(3,24);return task('cpp-sum','cpp','basic','Przypisanie i dodawanie',`Jaki wynik wypisze ten kod?  int a=${a}; int b=${b}; std::cout << a+b;`,a+b,'',`a+b=${a}+${b}=${a+b}. Operator << wypisze tę wartość.`,['Ustal wartości obu zmiennych.','Wykonaj działanie po prawej stronie <<.','Dodaj obie liczby.'],'wejscie-wyjscie');}},
 { key:'cpp-for',subject:'cpp',topic:'flow',create:()=>{
   const start=ri(0,3),end=ri(6,15),step=take([1,2,3]);const n=Math.ceil((end-start)/step);return task('cpp-for','cpp','flow','Ile iteracji?',`Ile razy wykona się ciało pętli?  for (int i=${start}; i<${end}; i+=${step}) { /* ... */ }`,n,'',`Wartości i: ${Array.from({length:n},(_,j)=>start+j*step).join(', ')}. W sumie ${n} iteracji.`,['Zacznij od wartości początkowej i.','Każdy obieg zwiększa i o krok.','Kończysz, gdy warunek i < granica jest fałszywy.'],'petla-for');}},
 { key:'cpp-div',subject:'cpp',topic:'data',create:()=>{
   const a=ri(9,35),b=ri(2,8);return task('cpp-div','cpp','data','Dzielenie całkowite',`Ile wypisze: int a=${a}; int b=${b}; std::cout << a/b; ?`,Math.trunc(a/b),'',`Oba operandy są typu int, zatem wynikiem jest część całkowita z ${a}/${b} = ${Math.trunc(a/b)} (dla dodatnich wartości).`,['Sprawdź typy zmiennych.','C++ wykonuje tutaj dzielenie całkowite.','Pomijamy część ułamkową.'],'rzutowanie');}},
 { key:'cpp-string',subject:'cpp',topic:'strings',create:()=>{
   const words=['komputer','algorytm','nauka','procesor','kodowanie','studylab'];const w=take(words);return task('cpp-string','cpp','strings','Długość napisu',`Ile wynosi wynik std::string("${w}").size()?`,w.length,'',`Napis „${w}” składa się z ${w.length} znaków ASCII. Metoda size() zwraca ${w.length}.`,['Policz wszystkie litery.','Indeks ostatniej litery jest mniejszy od długości o 1.','size() nie liczy końcowego bajtu terminatora C.'],'metody-string');}},
 { key:'m1-imp',subject:'math1',topic:'logic',create:()=>{
   const p=ri(0,1),q=ri(0,1),ans=(p===1&&q===0)?0:1;return task('m1-imp','math1','logic','Implikacja',`Oblicz wartość logiczną p ⇒ q, jeśli p=${p}, q=${q}. Wpisz 0 lub 1.`,ans,'',`Implikacja jest fałszywa tylko gdy p=1 i q=0; dla p=${p}, q=${q} otrzymujemy ${ans}.`,['Przypomnij sobie jeden przypadek, w którym implikacja jest fałszywa.','Sprawdź wartość poprzednika p.','Jeżeli poprzednik jest 0, cała implikacja ma wartość 1.'],'implikacja');}},
 { key:'m1-logic',subject:'math1',topic:'logic',create:()=>{
   const p=ri(0,1),q=ri(0,1),ans=(p||q)?1:0;return task('m1-logic','math1','logic','Alternatywa logiczna',`Podaj wartość p ∨ q, gdy p=${p} i q=${q}. Wpisz 0 lub 1.`,ans,'',`Alternatywa ∨ jest prawdziwa, jeśli co najmniej jedno zdanie jest prawdziwe. Wynik: ${ans}.`,['To alternatywa nierozłączna.','Wystarczy co najmniej jedna jedynka.','Tylko dwa zera dają zero.'],'zdania-i-spojniki');}},
 { key:'m1-union',subject:'math1',topic:'sets',create:()=>{
   const a=ri(3,8),b=ri(2,6); const overlap=ri(0,Math.min(a,b));return task('m1-union','math1','sets','Liczność sumy',`Zbiory A i B mają odpowiednio ${a} i ${b} elementów. Ich część wspólna ma ${overlap} elementów. Ile elementów ma A ∪ B?`,a+b-overlap,'',`|A ∪ B|=|A|+|B|−|A ∩ B|=${a}+${b}−${overlap}=${a+b-overlap}.`,['Najpierw zsumuj liczności A oraz B.','Elementy wspólne zostały wtedy policzone podwójnie.','Odejmij liczbę elementów wspólnych.'],'dzialania-na-zbiorach');}},
 { key:'m1-domain',subject:'math1',topic:'functions',create:()=>{
   const a=ri(-6,7);return task('m1-domain','math1','functions','Dziedzina pierwiastka',`Funkcja f(x)=√(x−(${a})). Od jakiej najmniejszej wartości x jest określona w ℝ?`,a,'',`Warunek: x−(${a})≥0, czyli x≥${a}. Najmniejszy dopuszczalny argument to ${a}.`,['Pod pierwiastkiem kwadratowym wyrażenie musi być nieujemne.','Zapisz nierówność dotyczącą x.','Przenieś stałą na drugą stronę.'],'dziedzina-zasady');}},
 { key:'m2-factorial',subject:'math2',topic:'sequences',create:()=>{
   const n=ri(3,7),prod=Array.from({length:n},(_,i)=>i+1).reduce((a,b)=>a*b,1);return task('m2-factorial','math2','sequences','Silnia',`Oblicz ${n}!.`,prod,'',`${n}!=${Array.from({length:n},(_,i)=>n-i).join('·')}=${prod}.`,['Przypomnij definicję silni.','Pomnóż wszystkie liczby całkowite dodatnie od 1 do n.','Pamiętaj: 0! = 1, ale tutaj n > 0.'],'silnia');}},
 { key:'m2-sum',subject:'math2',topic:'sequences',create:()=>{
   const n=ri(8,36);return task('m2-sum','math2','sequences','Suma liczb naturalnych',`Oblicz 1+2+…+${n}.`,n*(n+1)/2,'',`S=n(n+1)/2=${n}·${n+1}/2=${n*(n+1)/2}.`,['To suma kolejnych liczb naturalnych.','Można połączyć pierwszy i ostatni składnik w parę.','Użyj wzoru n(n+1)/2.'],'suma-naturalnych');}},
 { key:'m2-comb',subject:'math2',topic:'combinatorics',create:()=>{
   const n=ri(5,13),k=take([2,3]);let val=1;for(let i=1;i<=k;i++)val=val*(n-i+1)/i;val=Math.round(val);return task('m2-comb','math2','combinatorics','Symbol Newtona',`Ile wynosi C(${n},${k}), czyli liczba sposobów wyboru ${k} elementów spośród ${n} bez kolejności?`,val,'',`C(${n},${k})=${n}!/(${k}!·(${n}-${k})!)=${val}.`,['Kolejność wyboru nie ma znaczenia.','Chodzi o kombinacje bez powtórzeń.','Skorzystaj z n!/[k!(n−k)!].'],'symbol-newtona');}},
 { key:'m2-cartesian',subject:'math2',topic:'sets',create:()=>{
   const a=ri(2,10),b=ri(2,10);return task('m2-cartesian','math2','sets','Iloczyn kartezjański',`Jeśli |A|=${a} i |B|=${b}, ile elementów ma A×B?`,a*b,'',`Liczba par uporządkowanych wynosi |A|·|B|=${a}·${b}=${a*b}.`,['Pierwszą współrzędną wybieramy ze zbioru A.','Drugą współrzędną wybieramy ze zbioru B.','Użyj reguły mnożenia.'],'iloczyn-kartezjanski');}},
 { key:'ask-to-bin',subject:'ask',topic:'bases',create:()=>{
   const n=ri(7,255);return task('ask-to-bin','ask','bases','System dwójkowy',`Zapisz liczbę ${n}₁₀ w systemie dwójkowym. Wpisz same cyfry, bez indeksu.`,n.toString(2),'',`${n}₁₀ = ${n.toString(2)}₂. Możesz dzielić liczbę przez 2 i odczytać reszty od końca.` ,['Podziel liczbę przez 2.','Zapisuj reszty z kolejnych dzieleń.','Odczytaj reszty od ostatniej do pierwszej.'],'dziesietny-dwojkowy','binary');}},
 { key:'ask-from-bin',subject:'ask',topic:'bases',create:()=>{
   const n=ri(10,254);return task('ask-from-bin','ask','bases','Na dziesiętny',`Zamień ${n.toString(2)}₂ na system dziesiętny.`,n,'',`${n.toString(2)}₂ = ${n.toString(2).split('').reverse().map((c,i)=>Number(c)?`2^${i}`:null).filter(Boolean).reverse().join(' + ')} = ${n}.`,['Wypisz wagi pozycji kolejnych bitów.','Wagi rosną jak 1, 2, 4, 8, … od prawej.','Zsumuj wagi, których bit jest równy 1.'],'dwojkowy-dziesietny');}},
 { key:'ask-u2',subject:'ask',topic:'signed',create:()=>{
   const n=ri(-90,-1);const s=(256+n).toString(2).padStart(8,'0');return task('ask-u2','ask','signed','U2 — liczba ujemna',`Podaj 8-bitowy kod U2 liczby ${n}. Wpisz dokładnie 8 bitów.`,s,'',`Kod liczby ${n} to ${s} (8 bitów). Można zapisać |${n}| binarnie, odwrócić bity i dodać 1.`,['Zachowaj dokładnie 8 bitów.','Zapisz wartość bezwzględną w 8 bitach.','Odwróć wszystkie bity i dodaj 1.'],'u2','binary');}},
 { key:'ask-cpu',subject:'ask',topic:'cpu',create:()=>{
   const a=ri(1,40),b=ri(1,30);return task('ask-cpu','ask','cpu','Symulacja rejestru',`Uproszczony asembler: MOV AX, ${a}; ADD AX, ${b}. Jaką wartość ma AX po obu instrukcjach?`,a+b,'',`MOV ustawia AX=${a}. ADD dodaje ${b}, więc AX=${a}+${b}=${a+b}.`,['Pierwsza instrukcja nadaje wartość AX.','Druga instrukcja zwiększa AX o operand.','Nie ma potrzeby znać innych rejestrów.'],'asm-zmienne');}},
 { key:'phy-distance',subject:'physics',topic:'motion',create:()=>{
   const v=ri(2,22),time=ri(2,15);return task('phy-distance','physics','motion','Ruch jednostajny',`Ciało porusza się ruchem jednostajnym z szybkością ${v} m/s przez ${time} s. Jaką drogę pokona?`,v*time,'m',`s=vt=${v} m/s·${time} s=${v*time} m.`,['Droga jest iloczynem szybkości i czasu.','Prędkość nie zmienia się.','Pomnóż ${v} przez ${time}.'],'ruch-jednostajny');}},
 { key:'phy-acc',subject:'physics',topic:'motion',create:()=>{
   const v0=ri(0,12),a=ri(1,8),time=ri(2,12);return task('phy-acc','physics','motion','Prędkość przy przyspieszeniu',`Początkowa prędkość wynosi ${v0} m/s, przyspieszenie ${a} m/s², czas ${time} s. Oblicz prędkość końcową.`,v0+a*time,'m/s',`v=v₀+at=${v0}+${a}·${time}=${v0+a*time} m/s.`,['Dane: v₀, a oraz t.','Dla stałego przyspieszenia v=v₀+at.','Dodaj początkową prędkość i zmianę a·t.'],'ruch-przyspieszony');}},
 { key:'phy-force',subject:'physics',topic:'forces',create:()=>{
   const m=ri(2,35),a=ri(1,12);return task('phy-force','physics','forces','II zasada Newtona',`Masa ciała wynosi ${m} kg, a przyspieszenie ${a} m/s². Oblicz wypadkową siłę.`,m*a,'N',`F=ma=${m}·${a}=${m*a} N.`,['Użyj II zasady Newtona dla stałej masy.','Siła to masa razy przyspieszenie.','Jednostką jest niuton.'],'druga-zasada');}},
 { key:'phy-momentum',subject:'physics',topic:'momentum',create:()=>{
   const m=ri(2,25),v=ri(1,18);return task('phy-momentum','physics','momentum','Pęd ciała',`Oblicz wartość pędu ciała o masie ${m} kg i szybkości ${v} m/s.`,m*v,'kg·m/s',`p=mv=${m}·${v}=${m*v} kg·m/s.`,['Pęd ma związek z masą i prędkością.','To wielkość wektorowa, ale pytamy o wartość.','Pomnóż masę przez szybkość.'],'ped');}},
 { key:'phy-circle',subject:'physics',topic:'momentum',create:()=>{
   const r=take([2,4,5,8,10]),v=ri(2,12);return task('phy-circle','physics','momentum','Przyspieszenie dośrodkowe',`Ciało porusza się po okręgu o promieniu ${r} m z szybkością ${v} m/s. Oblicz wartość przyspieszenia dośrodkowego.`,v*v/r,'m/s²',`a=v²/r=${v}²/${r}=${fmt(v*v/r,6)} m/s².`,['Promień i szybkość są podane.','W ruchu po okręgu a=v²/r.','Najpierw podnieś szybkość do kwadratu.'],'dosrodkowe');}},
 { key:'ele-charge',subject:'electronics',topic:'potential',create:()=>{
   const I=ri(1,14),time=ri(2,15);return task('ele-charge','electronics','potential','Ładunek i natężenie',`Prąd o natężeniu ${I} A płynie przez ${time} s. Ile kulombów ładunku przepłynęło?`,I*time,'C',`Q=I·t=${I}·${time}=${I*time} C. 1 C=1 A·s.`,['Skorzystaj z definicji natężenia prądu.','I=Q/t, więc Q=I·t.','Pomnóż ampery przez sekundy.'],'symbole-i-jednostki');}},
 { key:'ele-field',subject:'electronics',topic:'charge',create:()=>{
   const q=ri(2,9),F=ri(2,20)*q;return task('ele-field','electronics','charge','Natężenie pola',`Na ładunek próbny ${q} C działa siła ${F} N. Jaka jest wartość natężenia pola E?`,F/q,'N/C',`E=F/q=${F}/${q}=${F/q} N/C.`,['Siła przypada na dany ładunek.','Z definicji E=F/q.','Podziel siłę przez wartość ładunku.'],'pole-elektryczne');}},
 { key:'ele-cap',subject:'electronics',topic:'cap',create:()=>{
   const C=ri(2,20),U=ri(2,18);return task('ele-cap','electronics','cap','Ładunek kondensatora',`Kondensator o pojemności ${C} µF jest pod napięciem ${U} V. Jak duży ładunek Q gromadzi? Odpowiedz w µC.`,C*U,'µC',`Q=CU=${C} µF·${U} V=${C*U} µC.`,['Pojemność wyrażono w mikrofaradach.','Wzór: Q=CU.','µF·V daje µC.'],'kondensator');}},
 { key:'ele-parallel',subject:'electronics',topic:'cap',create:()=>{
   const c1=ri(2,18),c2=ri(2,18);return task('ele-parallel','electronics','cap','Połączenie równoległe',`Połączono równolegle kondensatory ${c1} µF i ${c2} µF. Oblicz pojemność zastępczą.`,c1+c2,'µF',`C=C₁+C₂=${c1}+${c2}=${c1+c2} µF.`,['Równoległe łączenie zwiększa pojemność.','Pojemności dodają się.','Zsumuj obie wartości.'],'lacznie-rownolegle');}},
 { key:'ele-series',subject:'electronics',topic:'cap',create:()=>{
   const c1=take([4,6,8,10,12,16,18,20]),c2=c1;return task('ele-series','electronics','cap','Połączenie szeregowe',`Dwa jednakowe kondensatory o pojemności ${c1} µF każdy połączono szeregowo. Jaka jest pojemność zastępcza?`,c1/2,'µF',`1/C=1/${c1}+1/${c2}=2/${c1}; C=${c1}/2=${c1/2} µF.`,['W szeregu pojemność maleje.','Dodaj odwrotności pojemności.','Dwa jednakowe kondensatory mają pojemność równą połowie jednego.'],'lacznie-szeregowe');}},
];
export const GENERATOR_COUNT = TEMPLATES.length;
export const taskTopicsFor = subject => [...new Set(TEMPLATES.filter(x=>x.subject===subject).map(x=>x.topic))];
export function generateTask(subject='all',topic='all', previousKey=null){
 let entries=TEMPLATES.filter(x=>(subject==='all'||x.subject===subject)&&(topic==='all'||x.topic===topic));
 if(!entries.length) entries=TEMPLATES;
 const alternates=entries.filter(x=>x.key!==previousKey);
 return take(alternates.length?alternates:entries).create();
}
export function parseAnswer(input,kind){
 const value=String(input).trim().replace(/\s/g,'');
 if(kind==='binary') return value.replace(/^0b/i,'').replace(/^0+(?=\d)/,'') || '0';
 if(kind==='hex') return value.replace(/^0x/i,'').toUpperCase();
 const normalized=value.replace(',','.');
 return normalized&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)?Number(normalized):NaN;
}
export function checkTaskAnswer(input,t){
 if(t.kind==='number'){
  const parsed=parseAnswer(input,'number');
  return Number.isFinite(parsed) && Math.abs(parsed-t.expected) <= Math.max(t.tolerance,Math.abs(t.expected)*0.000001);
 }
 return String(parseAnswer(input,t.kind)).toUpperCase()===String(parseAnswer(t.expected,t.kind)).toUpperCase();
}
