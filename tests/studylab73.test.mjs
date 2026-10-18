import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTIONS,FLASHCARDS,SUBJECTS} from '../src/components/studycenter/bank.js';
import {NEW_GENERATORS_73,EXTRA_GENERATORS,TOTAL_GENERATORS,generateTask,checkTaskAnswer} from '../src/components/studycenter/generators-v4.js';
import {easierTask} from '../src/components/studycenter/easy-tasks-73.mjs';
import {validate,DEFAULT_DB,pickQuestions,cardsFor} from '../src/components/studycenter/engine.js';

const noDuplicates=list=>new Set(list.map(x=>x.id)).size===list.length;
test('każda wbudowana fiszka ma przyczynę, symbole i przykład',()=>{
 assert.equal(FLASHCARDS.length,120);
 assert.ok(noDuplicates(FLASHCARDS));
 for(const c of FLASHCARDS){
  for(const prop of ['front','back','why','symbols','example']){
   assert.ok(typeof c[prop]==='string'&&c[prop].trim().length>=(prop==='back'?1:5),`${c.id}: brak ${prop}`);
  }
  assert.ok(SUBJECTS.some(x=>x.id===c.subject),c.id);
 }
});
test('pytania mają jasną alternatywną wersję, poprawną odpowiedź, uzasadnienie i temat',()=>{
 assert.equal(QUESTIONS.length,144);
 assert.ok(noDuplicates(QUESTIONS));
 for(const q of QUESTIONS){
  assert.ok(q.stem?.trim(),q.id);
  assert.ok(q.easy?.trim().length>=10,`${q.id}: brak wersji prostej`);
  assert.ok(q.why?.trim().length>=10,`${q.id}: brak uzasadnienia`);
  assert.ok(q.hint?.trim().length>=5,`${q.id}: brak wskazówki`);
  assert.ok(Array.isArray(q.options)&&q.options.length===4,q.id);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,q.id);
  assert.equal(new Set(q.options).size,q.options.length,`${q.id}: zduplikowane odpowiedzi`);
 }
});
test('quiz losuje bez powtórzeń, zachowuje odpowiedzi',()=>{
 const quiz=pickQuestions('all','all',40,[]);
 assert.equal(quiz.length,40);
 assert.ok(noDuplicates(quiz));
 for(const q of quiz){
  assert.equal(q.shuffledOptions.length,4);
  assert.ok(q.shuffledOptions.some(x=>x.index===q.correct && x.value===q.options[q.correct]));
 }
});
test('nowe 12 generatorów ma czytelne treści i obliczane odpowiedzi',()=>{
 assert.equal(NEW_GENERATORS_73.length,12);
 assert.equal(TOTAL_GENERATORS,48);
 const keys=new Set();
 for(const g of NEW_GENERATORS_73){
  assert.ok(!keys.has(g.key),g.key);keys.add(g.key);
  for(let i=0;i<160;i++){
   const t=g.create();
   assert.ok(t.prompt?.length>10,t.key);
   assert.ok(t.easy?.length>35,`${t.key}: brak uproszczenia`);
   assert.ok(t.solution?.length>15,t.key);
   assert.ok(easierTask(t)?.length>20,t.key);
   assert.ok(Number.isFinite(t.expected)||['binary','hex'].includes(t.kind),t.key);
   assert.equal(checkTaskAnswer(String(t.expected),t),true,`${t.key}: zła weryfikacja`);
   assert.ok(t.hints?.length>=2,t.key);
   assert.ok(SUBJECTS.some(x=>x.id===t.subject),t.key);
  }
 }
});
test('stare generatory otrzymują objaśnienia i nadal można losować zadania',()=>{
 for(const g of EXTRA_GENERATORS){
  const t=g.create();assert.ok(easierTask(t).length>35,g.key);
  assert.equal(checkTaskAnswer(String(t.expected),t),true,g.key);
 }
 for(const s of SUBJECTS){
  for(let i=0;i<80;i++){
   const t=generateTask(s.id,'all');
   assert.equal(t.subject,s.id);
   assert.ok(easierTask(t).length>20,t.key);
   assert.equal(checkTaskAnswer(String(t.expected),t),true,t.key);
  }
 }
});
test('własne fiszki zachowują wyjaśnienia i postępy po imporcie',()=>{
 const db=DEFAULT_DB();
 db.customCards.push({id:'custom:test',subject:'physics',topic:'motion',front:'Co to jest v?',back:'Prędkość',why:'Opisuje zmianę położenia w czasie.',symbols:'v — prędkość (m/s).',example:'v=10 m / 2 s = 5 m/s',lesson:''});
 db.cards['cf01']={due:Date.now()+5000,repetitions:2,interval:1,ease:2.5,last:Date.now()};
 const loaded=validate(JSON.parse(JSON.stringify(db)));
 assert.equal(loaded.customCards[0].why,db.customCards[0].why);
 assert.equal(loaded.customCards[0].symbols,db.customCards[0].symbols);
 assert.equal(loaded.customCards[0].example,db.customCards[0].example);
 assert.equal(loaded.cards.cf01.repetitions,2);
 assert.ok(cardsFor(loaded).find(c=>c.id==='custom:test'));
});
