// Generowane przy instalacji z REALNYCH plików użytkownika i banku StudioLab.
import fs from 'node:fs';
import path from 'node:path';
import { QUESTIONS, FLASHCARDS, SUBJECTS } from '../src/components/studycenter/bank.js';
const root = path.resolve(process.argv[2] || '.');
const docs=path.join(root,'src','content','docs');
const output=path.join(root,'public','study-center-lesson-index.json');
const roots=[...SUBJECTS].sort((a,b)=>b.root.length-a.root.length);
const ignore = new Set(['index','spis-tresci','wstep','wyklady','cwiczenia','eksport','karta-wzorow','symbole','niejasnosci','przedmioty','zrodla']);
function list(dir){
 if (!fs.existsSync(dir)) return [];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?list(path.join(dir,d.name)):/\.mdx?$/.test(d.name)?[path.join(dir,d.name)]:[]);
}
const topicIndex=new Map();
for(const x of [...QUESTIONS,...FLASHCARDS]){
 const key=x.subject+'|'+x.lesson;
 if(!topicIndex.has(key)) topicIndex.set(key,new Map());
 topicIndex.get(key).set(x.topic, (topicIndex.get(key).get(x.topic)||0)+1);
}
const patterns={
 cpp:{basic:/zmienne|wejscie|kompilacja|codeblocks|operatory|pseudokod/,flow:/petl|losowanie|poteg|mnozenie|stoper|debugger|testowanie|zadania-algorytmy/,data:/float|double|zapis-pozycyjny|ieee|ulamki|overflow|obliczen|rzutowanie|formatowanie|cmath/,strings:/char|ascii|string|getline|indeksy|napis|tekst|palindrom|szyfr/},
 math1:{logic:/logika|zdania|spojniki|implikacja|prawa-logiczne|tabele-prawdy|kwantyfikatory/,sets:/zbior|przedzial|bezwzgled|relacje|dowody/,functions:/funkcj|dziedzina|odwrotne|praca-domowa/},
 math2:{sequences:/aksjomaty|peana|ciagi|sigma|silnia|indukcja|suma|geometrycz|naprzemienne|sinusy/,combinatorics:/regula|newtona|pascal|dwumian|kombinatory/,sets:/zbiory|zbior|kartezjanski|funkcje/},
 ask:{bases:/bit|bajt|dwojk|dziesiet|hex|szesnast|jednostki|pozycyjny|cw10|cw2-|cw16/,signed:/liczby-ze-znakiem|u1|u2|zm|porownanie/,cpu:/cpu|cykl|rejestry|magistrala|cache|asm/},
 physics:{motion:/jednostki|wektory|polozenie|droga|predkosc|przyspieszenie|ruch|wykres|rzut|okrag|dosrodkowe|cw-kinematyka/,forces:/sila|zasada|newton|grawitacja|napiecie|tarcie|dynamika|metoda-sil|uklad-mas/,momentum:/ped|moment|bezwladnosc/},
 electronics:{charge:/symbole|ladunek|coulomba|superpozycja|pole|gaussa|strumien/,potential:/potencjal|napiecie|gradient/,cap:/kondensator|pojemnosc|dielektryki|lacznie|prad-kondensatora|energia-kondensatora/}
};
const lessons={};
for(const file of list(docs)){
 const rel=path.relative(docs,file).replace(/\\/g,'/').replace(/\.mdx?$/,'');
 const rootS=roots.find(s=>rel.startsWith(s.root+'/'));
 if(!rootS)continue;
 const leaf=rel.slice(rootS.root.length+1).replace(/\/index$/,'');
 if(leaf.includes('/') || ignore.has(leaf))continue;
 const exactTopic=topicIndex.get(rootS.id+'|'+leaf);
 let topic=exactTopic?[...exactTopic].sort((a,b)=>b[1]-a[1])[0][0]:null;
 if(!topic){
  for(const [key,re] of Object.entries(patterns[rootS.id]||{})) {if(re.test(leaf)){topic=key;break;}}
 }
 // Nie przypisujemy arbitralnie lekcji do przypadkowego tematu, jeżeli temat nie jest oczywisty.
 const exactQuestions=QUESTIONS.filter(x=>x.subject===rootS.id&&x.lesson===leaf).length;
 const exactCards=FLASHCARDS.filter(x=>x.subject===rootS.id&&x.lesson===leaf).length;
 lessons[rel]={subject:rootS.id,lesson:leaf,topic:topic||'all',exactQuestions,exactCards,
  topicQuestions:QUESTIONS.filter(x=>x.subject===rootS.id&&(topic?x.topic===topic:true)).length,
  topicCards:FLASHCARDS.filter(x=>x.subject===rootS.id&&(topic?x.topic===topic:true)).length};
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output, JSON.stringify({version:2,lessons},null,2)+'\n');
console.log('StudyLab: indeks lekcji przygotowany:',Object.keys(lessons).length,'stron.');
